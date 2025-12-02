import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

// 期間タイプ定義
type PeriodType = "this_week" | "this_month" | "last_month" | "custom";

// 期間計算ユーティリティ
function getPeriodDates(period: PeriodType = "this_month") {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case "this_week":
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜始まり
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "this_month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "last_month":
      startDate.setMonth(now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      // this_monthと同じ
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

// 時間計算ユーティリティ（分単位で返す）
function calculateDuration(start: string, end: string): number {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.max(0, (endTime - startTime) / (1000 * 60)); // 分単位
}

// 分を時間に変換
function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ダミーデータ生成
function generateDummyData() {
  return {
    totalMinutes: 9600, // 160h
    trackedMinutes: 7680, // 128h
    unclassifiedMinutes: 1920, // 32h
    missionStats: [
      {
        id: "dummy-1",
        name: "営業活動",
        minutes: 2880,
        color: "hsl(205,90%,50%)",
        percentage: 38,
        events: 24,
      },
      {
        id: "dummy-2",
        name: "プロダクト開発",
        minutes: 2400,
        color: "hsl(160,84%,45%)",
        percentage: 31,
        events: 18,
      },
      {
        id: "dummy-3",
        name: "ミーティング",
        minutes: 1440,
        color: "hsl(45,100%,60%)",
        percentage: 19,
        events: 32,
      },
      {
        id: "dummy-4",
        name: "管理業務",
        minutes: 960,
        color: "hsl(280,65%,60%)",
        percentage: 13,
        events: 15,
      },
    ],
    userStats: [
      {
        id: "dummy-user-1",
        name: "田中太郎",
        minutes: 2400,
        missions: ["営業活動", "ミーティング"],
        avatar: "🧑‍💼",
        topMission: "営業活動",
      },
      {
        id: "dummy-user-2",
        name: "佐藤花子",
        minutes: 2280,
        missions: ["プロダクト開発"],
        avatar: "👨‍💻",
        topMission: "プロダクト開発",
      },
      {
        id: "dummy-user-3",
        name: "鈴木一郎",
        minutes: 2160,
        missions: ["営業活動", "管理業務"],
        avatar: "👩‍💼",
        topMission: "営業活動",
      },
      {
        id: "dummy-user-4",
        name: "高橋美咲",
        minutes: 1920,
        missions: ["ミーティング", "管理業務"],
        avatar: "👨‍💼",
        topMission: "ミーティング",
      },
    ],
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { period?: PeriodType };
}) {
  const supabase = await createClient();
  const period = searchParams?.period || "this_month";
  const { startDate, endDate } = getPeriodDates(period);

  // カレンダーイベントを取得
  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select(
      `
      *,
      missions!calendar_events_mission_id_fkey (
        id,
        title
      ),
      users!calendar_events_user_id_fkey (
        id,
        name
      )
    `
    )
    .gte("start_time", startDate)
    .lte("end_time", endDate);

  // ミッション一覧を取得
  const { data: missions } = await supabase
    .from("missions")
    .select("id, title, level");

  // ユーザー一覧を取得
  const { data: users } = await supabase.from("users").select("id, name");

  const hasRealData = calendarEvents && calendarEvents.length > 0;

  // データが存在しない場合はダミーデータを使用
  let reportData;

  if (!hasRealData) {
    reportData = generateDummyData();
  } else {
    // 実データからの集計
    const missionMap = new Map<
      string,
      {
        id: string;
        name: string;
        minutes: number;
        color: string;
        events: number;
      }
    >();
    const userMap = new Map<
      string,
      {
        id: string;
        name: string;
        minutes: number;
        missions: Set<string>;
        topMission: string;
        topMissionMinutes: number;
      }
    >();
    let totalMinutes = 0;
    let trackedMinutes = 0;
    let unclassifiedMinutes = 0;

    const colorPalette = [
      "hsl(205,90%,50%)",
      "hsl(160,84%,45%)",
      "hsl(45,100%,60%)",
      "hsl(280,65%,60%)",
      "hsl(340,75%,55%)",
      "hsl(120,70%,50%)",
      "hsl(30,90%,55%)",
      "hsl(260,70%,60%)",
    ];

    calendarEvents.forEach((event) => {
      const duration = calculateDuration(event.start_time, event.end_time);
      totalMinutes += duration;

      if (event.mission_id && event.missions) {
        // ミッション紐付けあり
        trackedMinutes += duration;

        const missionId = event.mission_id;
        const missionName = event.missions.title || "不明なミッション";

        if (missionMap.has(missionId)) {
          const existing = missionMap.get(missionId)!;
          existing.minutes += duration;
          existing.events += 1;
        } else {
          const colorIndex = missionMap.size % colorPalette.length;
          missionMap.set(missionId, {
            id: missionId,
            name: missionName,
            minutes: duration,
            color: colorPalette[colorIndex],
            events: 1,
          });
        }

        // ユーザー別集計
        if (event.user_id && event.users) {
          const userId = event.user_id;
          const userName = event.users.name || "不明";

          if (userMap.has(userId)) {
            const existing = userMap.get(userId)!;
            existing.minutes += duration;
            existing.missions.add(missionName);

            // トップミッション更新
            const currentMissionMinutes =
              (missionMap.get(missionId)?.minutes || 0);
            if (currentMissionMinutes > existing.topMissionMinutes) {
              existing.topMission = missionName;
              existing.topMissionMinutes = currentMissionMinutes;
            }
          } else {
            userMap.set(userId, {
              id: userId,
              name: userName,
              minutes: duration,
              missions: new Set([missionName]),
              topMission: missionName,
              topMissionMinutes: duration,
            });
          }
        }
      } else {
        // 未分類
        unclassifiedMinutes += duration;
      }
    });

    // ミッション統計をソートして配列化
    const missionStats = Array.from(missionMap.values())
      .sort((a, b) => b.minutes - a.minutes)
      .map((mission) => ({
        ...mission,
        percentage: trackedMinutes > 0
          ? Math.round((mission.minutes / trackedMinutes) * 100)
          : 0,
      }));

    // ユーザー統計をソートして配列化
    const userStats = Array.from(userMap.values())
      .sort((a, b) => b.minutes - a.minutes)
      .map((user, index) => ({
        ...user,
        missions: Array.from(user.missions),
        avatar: ["🧑‍💼", "👨‍💻", "👩‍💼", "👨‍💼", "👩‍💻", "🧑‍💻"][
          index % 6
        ],
      }));

    reportData = {
      totalMinutes,
      trackedMinutes,
      unclassifiedMinutes,
      missionStats,
      userStats,
    };
  }

  const trackingRate =
    reportData.totalMinutes > 0
      ? Math.round((reportData.trackedMinutes / reportData.totalMinutes) * 100)
      : 0;

  // 期間ラベル
  const periodLabels = {
    this_week: "今週",
    this_month: "今月",
    last_month: "先月",
    custom: "カスタム",
  };

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(205,90%,60%)] bg-clip-text text-transparent">
            時間集計レポート
          </h1>
          <p className="text-muted-foreground mt-1">
            期間別のミッション時間配分を分析 📊
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/reports?period=this_week`}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              period === "this_week"
                ? "bg-primary text-white shadow-pop"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            今週
          </Link>
          <Link
            href={`/reports?period=this_month`}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              period === "this_month"
                ? "bg-primary text-white shadow-pop"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            今月
          </Link>
          <Link
            href={`/reports?period=last_month`}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              period === "last_month"
                ? "bg-primary text-white shadow-pop"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            先月
          </Link>
        </div>
      </div>

      {/* データソース表示 */}
      {!hasRealData && (
        <Card className="rounded-2xl shadow-pop border-2 border-[hsl(45,100%,60%)] bg-gradient-to-br from-[hsl(45,100%,95%)] to-white">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💡</span>
              <div className="flex-1">
                <p className="font-semibold text-[hsl(30,80%,35%)]">
                  プレビューモード
                </p>
                <p className="text-sm text-muted-foreground">
                  カレンダーイベントがまだ登録されていないため、ダミーデータを表示しています。
                  実際のデータは
                  <Link
                    href="/import"
                    className="font-medium text-primary hover:underline mx-1"
                  >
                    カレンダー連携
                  </Link>
                  から取り込んでください。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* サマリーカード */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl shadow-pop border-0 bg-gradient-to-br from-white to-secondary/30 hover-lift transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                総稼働時間
              </CardDescription>
              <span className="text-2xl">⏱️</span>
            </div>
            <CardTitle className="text-4xl font-bold text-primary">
              {formatHours(reportData.totalMinutes)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {periodLabels[period]}の全体稼働時間
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-pop border-0 bg-gradient-to-br from-white to-[hsl(160,84%,95%)] hover-lift transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                分類済み時間
              </CardDescription>
              <span className="text-2xl">📈</span>
            </div>
            <CardTitle className="text-4xl font-bold text-[hsl(160,84%,35%)]">
              {formatHours(reportData.trackedMinutes)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ミッション紐づけ済み（{trackingRate}%）
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[hsl(160,84%,45%)] transition-all"
                    style={{ width: `${trackingRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-pop border-0 bg-gradient-to-br from-white to-[hsl(45,100%,92%)] hover-lift transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                未分類時間
              </CardDescription>
              <span className="text-2xl">❓</span>
            </div>
            <CardTitle className="text-4xl font-bold text-[hsl(30,80%,45%)]">
              {formatHours(reportData.unclassifiedMinutes)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ミッション未割り当ての時間
            </p>
            {reportData.unclassifiedMinutes > 0 && (
              <Link
                href="/calendar"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                カレンダーで分類 →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ミッション別時間配分 */}
      <Card className="rounded-2xl shadow-pop border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            ミッション別時間配分
          </CardTitle>
          <CardDescription>
            {periodLabels[period]}の時間配分（{reportData.missionStats.length}
            ミッション）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.missionStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-muted-foreground">
                この期間のミッションデータがありません
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 円グラフ風の可視化 */}
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    {reportData.missionStats.reduce(
                      (acc, mission, index) => {
                        const startAngle = acc.currentAngle;
                        const angle = (mission.percentage / 100) * 360;
                        const endAngle = startAngle + angle;
                        const largeArcFlag = angle > 180 ? 1 : 0;

                        const startX =
                          100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                        const startY =
                          100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                        const endX =
                          100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                        const endY =
                          100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                        const pathData = `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

                        acc.paths.push(
                          <path
                            key={mission.id}
                            d={pathData}
                            fill={mission.color}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        );
                        acc.currentAngle = endAngle;
                        return acc;
                      },
                      { paths: [] as JSX.Element[], currentAngle: 0 }
                    ).paths}
                    <circle
                      cx="100"
                      cy="100"
                      r="45"
                      fill="white"
                      className="drop-shadow"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {reportData.missionStats.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ミッション
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ミッション詳細リスト */}
              <div className="space-y-3">
                {reportData.missionStats.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-center gap-4 rounded-xl bg-secondary/30 p-4 hover:bg-secondary/50 transition-all"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-md"
                      style={{ backgroundColor: mission.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{mission.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {mission.events}件のイベント
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary">
                        {formatHours(mission.minutes)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {mission.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ユーザー別時間配分 */}
      <Card className="rounded-2xl shadow-pop border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            ユーザー別時間配分
          </CardTitle>
          <CardDescription>
            {periodLabels[period]}のメンバー別稼働状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.userStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-muted-foreground">
                この期間のユーザーデータがありません
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.userStats.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 rounded-xl bg-secondary/30 p-4 hover:bg-secondary/50 transition-all"
                >
                  <div className="flex items-center gap-1 text-sm font-semibold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl flex-shrink-0">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{user.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        主要: {user.topMission}
                      </p>
                      {user.missions.length > 1 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] rounded-full"
                        >
                          +{user.missions.length - 1}件
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary">
                      {formatHours(user.minutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reportData.totalMinutes > 0
                        ? Math.round(
                            (user.minutes / reportData.totalMinutes) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" className="flex-1 rounded-xl">
          <Link href="/calendar">📅 カレンダーで確認</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 rounded-xl">
          <Link href="/import">📥 データをインポート</Link>
        </Button>
        <Button asChild className="flex-1 rounded-xl shadow-pop">
          <Link href="/missions">🎯 ミッション管理</Link>
        </Button>
      </div>
    </div>
  );
}
