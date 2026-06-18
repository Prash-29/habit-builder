import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/admin";
import User from "@/models/User";
import HabitLog from "@/models/HabitLog";

function todayMidnightUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// GET /api/admin/users?adminEmail=&page=1&limit=10
// Re-validates adminEmail on every call (the gate is stateless).
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const adminEmail = searchParams.get("adminEmail");

  if (!isAdminEmail(adminEmail)) {
    return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  await connectDB();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));
  const skip = (page - 1) * limit;

  const [totalUsers, todayActiveIds, users] = await Promise.all([
    User.countDocuments(),
    HabitLog.distinct("userId", { date: todayMidnightUTC() }),
    User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // Distinct gym-log days per user, for just this page of users.
  const ids = users.map((u) => u._id);
  const dayCounts = await HabitLog.aggregate<{ _id: unknown; daysActive: number }>([
    { $match: { userId: { $in: ids } } },
    { $group: { _id: { userId: "$userId", date: "$date" } } },
    { $group: { _id: "$_id.userId", daysActive: { $sum: 1 } } },
  ]);
  const daysMap = new Map(dayCounts.map((d) => [String(d._id), d.daysActive]));

  const rows = users.map((u) => ({
    id: String(u._id),
    email: u.email,
    contact: u.contact || "",
    daysActive: daysMap.get(String(u._id)) ?? 0,
  }));

  return NextResponse.json({
    success: true,
    totalUsers,
    todayActive: todayActiveIds.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    users: rows,
  });
}
