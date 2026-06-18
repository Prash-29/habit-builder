import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";

// POST /api/admin/login  { email }
// Validates the email against ADMIN_EMAILS. No DB write — just a gate.
export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ success: false, error: "Not an authorized admin" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
