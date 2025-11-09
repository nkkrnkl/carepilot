import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { CasesResponse } from "@/lib/types/cases";

/**
 * API Route for fetching cases
 * 
 * Currently reads from JSON file, but can be easily updated to query SQL Server
 * 
 * TODO: Replace with SQL Server query
 * Example:
 * import sql from 'mssql';
 * 
 * export async function GET(request: NextRequest) {
 *   const { searchParams } = new URL(request.url);
 *   const userId = searchParams.get("userId") || "user-123";
 *   
 *   // Query SQL Server
 *   const config = { ... };
 *   await sql.connect(config);
 *   const result = await sql.query`SELECT * FROM eob_records WHERE user_id = ${userId}`;
 *   
 *   // Transform SQL rows to CasesResponse format
 *   const casesResponse: CasesResponse = {
 *     total_documents: result.recordset.length,
 *     results: result.recordset.map(row => ({
 *       document_id: row.source_document_id,
 *       eob_data: { ... },
 *       case_data: { ... },
 *     })),
 *   };
 *   
 *   return NextResponse.json(casesResponse);
 * }
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user-123";

    // For now, read from JSON file
    // TODO: Replace with SQL Server query
    const jsonPath = join(process.cwd(), `eob_output_all_${userId}.json`);
    
    try {
      const fileContent = await readFile(jsonPath, "utf-8");
      const data: CasesResponse = JSON.parse(fileContent);
      
      return NextResponse.json(data);
    } catch (fileError) {
      // If file doesn't exist, return empty response
      // In production, this would query SQL Server
      console.warn(`Cases file not found for user ${userId}, returning empty response`);
      
      return NextResponse.json({
        total_documents: 0,
        results: [],
      });
    }
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch cases",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
