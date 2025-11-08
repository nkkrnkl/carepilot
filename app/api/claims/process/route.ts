import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, docId, docType, taskDescription } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Call Python function directly
    const scriptPath = join(process.cwd(), "backend", "scripts", "process_claim.py");
    const result = await executePython(scriptPath, {
      userId,
      docId,
      docType,
      taskDescription: taskDescription || "Process the claim",
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || "Failed to process claim",
          workflow_completed: false 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Process claim error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process claim",
        workflow_completed: false 
      },
      { status: 500 }
    );
  }
}

