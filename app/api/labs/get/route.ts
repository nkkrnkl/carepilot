import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const report = await prisma.labReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: report.id,
      userId: report.userId,
      title: report.title,
      date: report.date.toISOString(),
      hospital: report.hospital,
      doctor: report.doctor,
      fileUrl: report.fileUrl,
      rawExtract: JSON.parse(report.rawExtract),
      parameters: JSON.parse(report.parameters),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Get error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get report" },
      { status: 500 }
    );
  }
}

