import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

/**
 * API Route for updating case status
 * 
 * Currently updates JSON file, but can be easily updated to update SQL Server
 * 
 * TODO: Replace with SQL Server update
 * Example:
 * import sql from 'mssql';
 * 
 * export async function POST(request: NextRequest) {
 *   const { caseId, userId, status } = await request.json();
 *   
 *   // Update SQL Server
 *   await sql.connect(config);
 *   await sql.query`
 *     UPDATE cases 
 *     SET status = ${status}, updated_at = CURRENT_TIMESTAMP
 *     WHERE id = ${caseId} AND user_id = ${userId}
 *   `;
 *   
 *   return NextResponse.json({ success: true });
 * }
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, userId, status } = body;

    if (!caseId || !userId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, userId, status" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["Needs Review", "In Progress", "Resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // For now, update JSON file
    // TODO: Replace with SQL Server update
    const jsonPath = join(process.cwd(), `eob_output_all_${userId}.json`);
    
    try {
      const fileContent = await readFile(jsonPath, "utf-8");
      const data = JSON.parse(fileContent);

      // Find and update the case
      const caseIndex = data.results.findIndex(
        (result: any) => result.case_data.id === caseId
      );

      if (caseIndex === -1) {
        return NextResponse.json(
          { error: "Case not found" },
          { status: 404 }
        );
      }

      // Update status
      data.results[caseIndex].case_data.status = status;
      data.results[caseIndex].case_data.updated_at = new Date().toISOString();
      data.results[caseIndex].case_data.updated_by = "user"; // TODO: Get from auth

      // Write back to file
      await writeFile(jsonPath, JSON.stringify(data, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        caseId,
        status,
        message: "Status updated successfully",
      });
    } catch (fileError) {
      console.error("Error updating case status:", fileError);
      return NextResponse.json(
        {
          error: "Failed to update case status",
          message: fileError instanceof Error ? fileError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Case status update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update case status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
