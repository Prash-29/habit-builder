import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DailyLog from "@/models/DailyLog";

// Normalize a date to midnight UTC for consistent daily grouping
function toMidnightUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

// GET /api/logs?userId=...&date=YYYY-MM-DD  (or omit date for today)
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const dateParam = searchParams.get("date");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const date = toMidnightUTC(dateParam ? new Date(dateParam) : new Date());

  const log = await DailyLog.findOne({ userId, date }).lean();

  return NextResponse.json(log ?? { userId, date, entries: [] });
}

// PATCH /api/logs — upsert today's entry for a habit
// Body: { userId, habitId, completed, note? }
export async function PATCH(req: NextRequest) {
  await connectDB();

  const body = await req.json();
  const { userId, habitId, completed, note } = body;

  if (!userId || !habitId || completed === undefined) {
    return NextResponse.json(
      { error: "userId, habitId, and completed are required" },
      { status: 400 }
    );
  }

  const today = toMidnightUTC(new Date());

  const log = await DailyLog.findOneAndUpdate(
    { userId, date: today },
    {
      $set: {
        "entries.$[entry].completed": completed,
        "entries.$[entry].completedAt": completed ? new Date() : null,
        "entries.$[entry].note": note ?? "",
      },
    },
    {
      arrayFilters: [{ "entry.habitId": habitId }],
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  // If entry didn't exist yet, push it
  if (!log.entries.find((e) => e.habitId.toString() === habitId)) {
    log.entries.push({
      habitId,
      completed,
      completedAt: completed ? new Date() : undefined,
      note: note ?? "",
    });
    await log.save();
  }

  return NextResponse.json(log);
}
