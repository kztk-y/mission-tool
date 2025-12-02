"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchGoogleCalendarEvents,
  disconnectGoogleCalendar,
  checkGoogleCalendarConnection,
} from "./actions";
import { CalendarEvent } from "@/lib/google/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";

export default function CalendarClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 初回ロード時に連携状態を確認
  useEffect(() => {
    checkConnection();

    // URLパラメータから成功/エラーメッセージを取得
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("success");
    const errorParam = params.get("error");

    if (successParam) {
      setSuccess(true);
      setIsConnected(true);
      // URLパラメータをクリーンアップ
      window.history.replaceState({}, "", "/calendar");
      // 連携成功後にイベントを取得
      handleFetchEvents();
    }

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        auth_failed: "認証に失敗しました",
        no_code: "認証コードが取得できませんでした",
        not_authenticated: "ログインが必要です",
        db_error: "データベースエラーが発生しました",
        token_exchange_failed: "トークンの取得に失敗しました",
      };
      setError(errorMessages[errorParam] || "エラーが発生しました");
      window.history.replaceState({}, "", "/calendar");
    }
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const result = await checkGoogleCalendarConnection();
      setIsConnected(result.connected);

      // 連携済みの場合は自動的にイベントを取得
      if (result.connected) {
        await handleFetchEvents();
      }
    } catch (err) {
      console.error("Connection check failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/auth/google";
  };

  const handleDisconnect = async () => {
    if (!confirm("Google Calendar連携を解除しますか?")) return;

    setIsLoading(true);
    try {
      const result = await disconnectGoogleCalendar();
      if (result.error) {
        setError(result.error);
      } else {
        setIsConnected(false);
        setEvents([]);
        setSuccess(false);
      }
    } catch (err) {
      setError("連携解除に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchEvents = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const result = await fetchGoogleCalendarEvents();
      if (result.error) {
        setError(result.error);
        if (result.error === "Google Calendar連携が必要です") {
          setIsConnected(false);
        }
      } else if (result.events) {
        setEvents(result.events);
      }
    } catch (err) {
      setError("イベントの取得に失敗しました");
    } finally {
      setIsFetching(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">カレンダー</h1>
          <p className="text-muted-foreground">
            Googleカレンダー連携・ミッション自動分類
          </p>
        </div>
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button
                onClick={handleFetchEvents}
                disabled={isFetching}
                variant="outline"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    取得中...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    イベント更新
                  </>
                )}
              </Button>
              <Button onClick={handleDisconnect} variant="destructive">
                連携解除
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Googleカレンダー連携
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !error && (
        <Alert>
          <CalendarIcon className="h-4 w-4" />
          <AlertDescription>Google Calendarと連携しました!</AlertDescription>
        </Alert>
      )}

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar連携</CardTitle>
            <CardDescription>
              Googleカレンダーと連携して、予定を自動的にミッションに分類します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                まだGoogle Calendarと連携していません
              </p>
              <Button onClick={handleConnect}>連携を開始</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>本日の予定</CardDescription>
                <CardTitle className="text-4xl">{events.length}件</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>分類済み</CardDescription>
                <CardTitle className="text-4xl">0件</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>未分類</CardDescription>
                <CardTitle className="text-4xl text-orange-500">
                  {events.length}件
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>本日の予定</CardTitle>
              <CardDescription>
                予定をクリックしてミッションに紐づけ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>本日の予定はありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-sm font-medium">
                            {formatTime(event.start)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(event.end)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <Badge
                            variant="outline"
                            className="mt-1 text-orange-500 border-orange-500"
                          >
                            未分類
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        編集
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
