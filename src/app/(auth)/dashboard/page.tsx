import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // ミッション一覧を取得
  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("status", "active");

  // ユーザー一覧を取得
  const { data: users } = await supabase
    .from("users")
    .select("*");

  // デモデータ（実際の集計ロジックは後で実装）
  const demoData = {
    totalHours: 160,
    trackedHours: 128,
    missionStats: [
      { name: "営業活動", hours: 48, color: "bg-[hsl(205,90%,50%)]", percentage: 38 },
      { name: "プロダクト開発", hours: 40, color: "bg-[hsl(160,84%,45%)]", percentage: 31 },
      { name: "ミーティング", hours: 24, color: "bg-[hsl(45,100%,60%)]", percentage: 19 },
      { name: "管理業務", hours: 16, color: "bg-[hsl(280,65%,60%)]", percentage: 13 },
    ],
    teamMembers: [
      { name: "田中", hours: 40, missions: ["営業活動", "ミーティング"], avatar: "🧑‍💼" },
      { name: "佐藤", hours: 38, missions: ["プロダクト開発"], avatar: "👨‍💻" },
      { name: "鈴木", hours: 36, missions: ["営業活動", "管理業務"], avatar: "👩‍💼" },
    ],
  };

  const trackingRate = Math.round(
    (demoData.trackedHours / demoData.totalHours) * 100
  );

  // 現在のユーザー（開発用）
  const currentUser = users?.[0];

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(205,90%,60%)] bg-clip-text text-transparent">
            ダッシュボード
          </h1>
          <p className="text-muted-foreground mt-1">
            おかえりなさい、<span className="font-semibold text-foreground">{currentUser?.name ?? "ゲスト"}</span>さん 👋
          </p>
        </div>
        <Button asChild className="rounded-xl shadow-pop hover-lift">
          <Link href="/missions/new">
            ✨ 新しいミッションを作成
          </Link>
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl shadow-pop border-0 bg-gradient-to-br from-white to-secondary/30 hover-lift transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">今月の稼働時間</CardDescription>
              <span className="text-2xl">⏱️</span>
            </div>
            <CardTitle className="text-4xl font-bold text-primary">{demoData.trackedHours}<span className="text-lg font-normal text-muted-foreground">h</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              目標 <span className="font-semibold text-foreground">{demoData.totalHours}h</span> 中
            </p>
            <Progress value={trackingRate} className="h-2 rounded-full" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-pop border-0 bg-gradient-to-br from-white to-[hsl(160,84%,95%)] hover-lift transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">トラッキング率</CardDescription>
              <span className="text-2xl">📈</span>
            </div>
            <CardTitle className="text-4xl font-bold text-[hsl(160,84%,35%)]">{trackingRate}<span className="text-lg font-normal text-muted-foreground">%</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              カレンダー予定のミッション紐づけ率
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[hsl(160,84%,90%)] px-2.5 py-1 text-xs font-medium text-[hsl(160,84%,30%)]">
              ✓ 順調です！
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-pop border-0 bg-gradient-to-br from-white to-[hsl(45,100%,92%)] hover-lift transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">アクティブミッション</CardDescription>
              <span className="text-2xl">🎯</span>
            </div>
            <CardTitle className="text-4xl font-bold text-[hsl(30,80%,45%)]">
              {missions?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              進行中のミッション数
            </p>
            <Link href="/missions" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              詳細を見る →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* DBから取得したミッション一覧 */}
      {missions && missions.length > 0 && (
        <Card className="rounded-2xl shadow-pop border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">🚀</span>
                  進行中のミッション
                </CardTitle>
                <CardDescription>あなたが取り組んでいるミッションです</CardDescription>
              </div>
              <Button variant="outline" asChild className="rounded-xl">
                <Link href="/missions">すべて見る</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {missions.slice(0, 4).map((mission) => (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="group flex items-center justify-between rounded-xl border-2 border-transparent bg-secondary/50 p-4 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                      {mission.level === "company" ? "🏢" : mission.level === "manager" ? "👔" : "👤"}
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">{mission.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {mission.description?.slice(0, 30)}{mission.description && mission.description.length > 30 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-[hsl(160,84%,90%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(160,84%,30%)]">
                      進行中
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 時間配分 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-pop border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              ミッション別時間配分
            </CardTitle>
            <CardDescription>今月の時間配分の内訳</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoData.missionStats.map((mission) => (
                <div key={mission.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mission.name}</span>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{mission.hours}h</span> ({mission.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${mission.color} transition-all duration-500`}
                      style={{ width: `${mission.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-pop border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              チームメンバー稼働状況
            </CardTitle>
            <CardDescription>メンバー別の時間サマリー</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoData.teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-xl bg-secondary/50 p-4 transition-all hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.missions.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{member.hours}<span className="text-sm font-normal text-muted-foreground">h</span></p>
                    <p className="text-xs text-muted-foreground">今月</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
