"use server";

import { createClient } from "@/lib/supabase/server";
import { getCalendarEvents, refreshAccessToken } from "@/lib/google/calendar";
import { revalidatePath } from "next/cache";

/**
 * Google Calendarイベントを取得するServer Action
 */
export async function fetchGoogleCalendarEvents() {
  const supabase = await createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証が必要です" };
  }

  // Supabaseからトークン情報を取得
  const { data: tokenData, error: tokenError } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (tokenError || !tokenData) {
    return { error: "Google Calendar連携が必要です" };
  }

  try {
    // トークンの有効期限をチェック
    const now = Date.now();
    const isExpired = tokenData.expiry_date && tokenData.expiry_date < now;

    let accessToken = tokenData.access_token;

    // トークンが期限切れの場合はリフレッシュ
    if (isExpired && tokenData.refresh_token) {
      const newTokens = await refreshAccessToken(tokenData.refresh_token);
      accessToken = newTokens.access_token || tokenData.access_token;

      // 新しいトークンをDBに保存
      await supabase
        .from("google_tokens")
        .update({
          access_token: newTokens.access_token,
          expiry_date: newTokens.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // カレンダーイベントを取得
    const events = await getCalendarEvents(
      accessToken,
      tokenData.refresh_token
    );

    revalidatePath("/calendar");

    return { events };
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return { error: error.message || "イベントの取得に失敗しました" };
  }
}

/**
 * Google Calendar連携を解除するServer Action
 */
export async function disconnectGoogleCalendar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証が必要です" };
  }

  try {
    const { error } = await supabase
      .from("google_tokens")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/calendar");

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return { error: "連携解除に失敗しました" };
  }
}

/**
 * Google Calendar連携状態を確認するServer Action
 */
export async function checkGoogleCalendarConnection() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { connected: false };
  }

  const { data, error } = await supabase
    .from("google_tokens")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  return { connected: !!data && !error };
}
