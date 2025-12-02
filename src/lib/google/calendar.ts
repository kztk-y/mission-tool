import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Google OAuth 2.0 クライアントの設定
 */
export function getOAuth2Client(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  );

  return oauth2Client;
}

/**
 * Google Calendar API認証用のURLを生成
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  return url;
}

/**
 * 認証コードからアクセストークンを取得
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Error getting tokens from code:", error);
    throw new Error("Failed to exchange authorization code for tokens");
  }
}

/**
 * カレンダーイベント一覧を取得
 */
export async function getCalendarEvents(
  accessToken: string,
  refreshToken?: string
) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    // 今日の開始時刻と終了時刻を取得
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    return events.map((event) => ({
      id: event.id || "",
      title: event.summary || "無題",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      description: event.description || "",
    }));
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);

    // トークンの期限切れの場合
    if (error.code === 401) {
      throw new Error("Access token expired. Please re-authenticate.");
    }

    throw new Error("Failed to fetch calendar events");
  }
}

/**
 * アクセストークンをリフレッシュ
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

/**
 * Google Calendar連携の型定義
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  id_token?: string;
  scope?: string;
}
