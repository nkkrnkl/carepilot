import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, documentId, docType, text, method } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!documentId && !text) {
      return NextResponse.json(
        { error: "Either documentId or text is required" },
        { status: 400 }
      );
    }

    // Call Python function to extract benefits
    const scriptPath = join(process.cwd(), "backend", "scripts", "extract_benefits.py");
    const result = await executePython(scriptPath, {
      userId,
      documentId: documentId || null,
      docType: docType || "plan_document",
      text: text || null,
      method: method || "cot",  // Default to CoT method
      useCot: method !== "iterative",  // Use CoT unless explicitly iterative
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Benefits extraction failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      benefits: result.data?.benefits,
      sql: result.data?.sql,
      sqlValues: result.data?.sql_values,
      message: result.data?.message || "Benefits extracted successfully",
    });
  } catch (error) {
    console.error("Benefits extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Benefits extraction failed" },
      { status: 500 }
    );
  }
}

