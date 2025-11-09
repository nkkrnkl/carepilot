import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eob_data, discrepancy_types, additional_context, case_id } = body;

    if (!eob_data) {
      return NextResponse.json(
        { error: "eob_data is required" },
        { status: 400 }
      );
    }

    // Generate appeal email using Python script
    const scriptPath = join(process.cwd(), "backend", "scripts", "generate_appeal.py");
    const result = await executePython(scriptPath, {
      eob_data,
      discrepancy_types: discrepancy_types || null,
      additional_context: additional_context || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate appeal email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appeal_email: result.data?.appeal_email,
      case_id: case_id,
    });
  } catch (error) {
    console.error("Appeal generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate appeal" },
      { status: 500 }
    );
  }
}
