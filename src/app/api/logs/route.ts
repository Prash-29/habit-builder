import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import HabitLog from "@/models/HabitLog";
import { GYM_HABIT_ID } from "@/lib/constants";

// Normalize a date to midnight UTC for consistent daily grouping
function toMidnightUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

// GET /api/logs?userId=...&habitId=...&date=YYYY-MM-DD  (date/habitId optional)
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const habitId = searchParams.get("habitId") || GYM_HABIT_ID;
  const dateParam = searchParams.get("date");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const date = toMidnightUTC(dateParam ? new Date(dateParam) : new Date());

  const log = await HabitLog.findOne({ userId, habitId, date }).lean();

  return NextResponse.json(
    log ?? { userId, habitId, date, completed: false, durationMin: 0, description: "", note: "", data: {} }
  );
}

// PATCH /api/logs — upsert today's log for a habit
// Body: { userId, habitId?, completed, durationMin?, description?, note?, data? }
export async function PATCH(req: NextRequest) {
  await connectDB();

  const body = await req.json();
  const {
    userId,
    habitId = GYM_HABIT_ID,
    completed,
    durationMin,
    description,
    note,
    data,
  } = body;

  if (!userId || completed === undefined) {
    return NextResponse.json(
      { error: "userId and completed are required" },
      { status: 400 }
    );
  }

  const today = toMidnightUTC(new Date());
  const safeDuration = Number.isFinite(Number(durationMin))
    ? Math.max(0, Number(durationMin))
    : 0;

  const log = await HabitLog.findOneAndUpdate(
    { userId, habitId, date: today },
    {
      $set: {
        completed,
        durationMin: safeDuration,
        description: description ?? "",
        note: note ?? "",
        // Replace whole `data` object — Mixed isn't change-tracked per key.
        data: data && typeof data === "object" ? data : {},
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json(log);
}
