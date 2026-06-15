import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/mailer";

// GET /api/users              — fetch all users
// GET /api/users?email=xxx   — find one user by email
// GET /api/users?phone=xxx   — find one user by phone
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const email = request.nextUrl.searchParams.get("email");
    const phone = request.nextUrl.searchParams.get("phone");

    if (email || phone) {
      let user = null;
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() }).select("_id");
      }
      if (!user && phone) {
        const digits = phone.replace(/\D/g, "");
        user = await User.findOne({ contact: { $regex: digits } }).select("_id");
      }
      if (!user) {
        return NextResponse.json(
          { success: false, error: "No account found with that email or phone" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, userId: user._id });
    }

    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/users — create a new user (email or phone required)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, contact } = body;

    if (!email && !contact) {
      return NextResponse.json(
        { success: false, error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    const resolvedEmail = email || `${(contact as string).replace(/\D/g, "")}@sms.local`;
    const resolvedName = name || (email ? email.split("@")[0] : contact);
    const resolvedContact = contact || "";

    const user = await User.create({
      name: resolvedName,
      email: resolvedEmail,
      contact: resolvedContact,
    });

    // Send welcome email only if a real email was provided.
    // Non-blocking: a mail failure (bad creds, SMTP down) must NOT fail
    // registration — the user is already created.
    if (email) {
      try {
        await sendWelcomeEmail(email, resolvedName);
      } catch (mailErr) {
        console.error("Welcome email failed (registration still succeeded):", mailErr);
      }
    }

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: "Account already exists with this email or phone" },
        { status: 409 }
      );
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
