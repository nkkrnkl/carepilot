import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { executePython } from "@/lib/python-bridge";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || searchParams.get("user_id") || "user-123";

    const scriptPath = path.join(process.cwd(), "backend", "dashboard_builder.py");
    const result = await executePython(scriptPath, { user_id: userId });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate dashboard data",
          details: result.data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error generating dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unexpected error generating dashboard data",
      },
      { status: 500 }
    );
  }
}
