import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google/calendar";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth 2.0 コールバック処理
 * GET /api/auth/google/callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // エラー処理
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?error=auth_failed`
    );
  }

  // codeがない場合
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?error=no_code`
    );
  }

  try {
    // 認証コードをトークンに交換
    const tokens = await getTokensFromCode(code);

    // Supabaseにトークンを保存（実装例）
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=not_authenticated`
      );
    }

    // google_tokens テーブルにトークンを保存
    // 注意: このテーブルは事前にSupabaseで作成しておく必要があります
    const { error: dbError } = await supabase.from("google_tokens").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (dbError) {
      console.error("Error saving tokens to database:", dbError);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=db_error`
      );
    }

    // 成功したらカレンダーページにリダイレクト
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?success=true`
    );
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?error=token_exchange_failed`
    );
  }
}
