import { NextResponse } from "next/server";

export async function GET() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
  if (!googleClientId) {
    return NextResponse.json(
      { error: { code: "CONFIG", message: "GOOGLE_CLIENT_ID is not configured" } },
      { status: 503 }
    );
  }
  return NextResponse.json({ googleClientId });
}
