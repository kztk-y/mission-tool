import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google/calendar";

/**
 * Google OAuth 2.0 認証フローを開始
 * GET /api/auth/google
 */
export async function GET(request: NextRequest) {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication URL" },
      { status: 500 }
    );
  }
}
