import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user";

    // Delete all lab reports for the user
    const result = await prisma.labReport.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} lab report(s) for user ${userId}`,
    });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear reports" },
      { status: 500 }
    );
  }
}

// Also support POST for convenience
export async function POST(request: NextRequest) {
  return DELETE(request);
}

