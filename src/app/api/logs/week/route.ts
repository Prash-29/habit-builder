import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DailyLog from "@/models/DailyLog";

// GET /api/logs/week?userId=xxx — fetch logs for the past 7 days
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    const logs = await DailyLog.find({
      userId,
      date: { $gte: sevenDaysAgo, $lte: today },
    }).lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
