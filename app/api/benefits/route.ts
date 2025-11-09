import { NextRequest, NextResponse } from "next/server";
import { getInsuranceBenefitsByUserId } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const benefits = await getInsuranceBenefitsByUserId(userId);

    return NextResponse.json({
      success: true,
      benefits,
      count: benefits.length,
    });
  } catch (error: any) {
    console.error("Error fetching benefits:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch benefits" },
      { status: 500 }
    );
  }
}
