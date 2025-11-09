import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

/**
 * Labs Parameters API Route
 * 
 * Lists all unique parameter names found in a user's lab reports.
 * Aggregates metadata from Pinecone queries.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user";

    // Query all lab reports for this user and extract parameter names
    const scriptPath = join(process.cwd(), "backend", "scripts", "list_lab_parameters.py");
    
    const result = await executePython(scriptPath, {
      userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to list parameters" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      parameters: result.data?.parameters || [],
      userId,
    });
  } catch (error) {
    console.error("Labs parameters error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list parameters" },
      { status: 500 }
    );
  }
}

