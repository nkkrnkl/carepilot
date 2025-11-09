import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, documentId, docType } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Call Python function to extract EOB
    const scriptPath = join(process.cwd(), "backend", "scripts", "extract_eob.py");
    const result = await executePython(scriptPath, {
      userId,
      documentId: documentId,
      docType: docType || "eob",
      method: "cot",  // Always use CoT for EOB
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "EOB extraction failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eobData: result.data.eob_data,
      caseData: result.data.case_data,
      sqlReady: result.data.sql_ready,
    });
  } catch (error) {
    console.error("Error extracting EOB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
