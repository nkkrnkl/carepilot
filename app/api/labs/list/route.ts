import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user";

    const reports = await prisma.labReport.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        date: true,
        hospital: true,
        doctor: true,
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list reports" },
      { status: 500 }
    );
  }
}

