import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const levelConfig: Record<string, { label: string; icon: string; color: string }> = {
  company: { label: "会社", icon: "🏢", color: "bg-primary text-white" },
  manager: { label: "管理者", icon: "👔", color: "bg-[hsl(280,65%,60%)] text-white" },
  member: { label: "メンバー", icon: "👤", color: "bg-[hsl(160,84%,45%)] text-white" },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "進行中", color: "text-[hsl(160,84%,30%)]", bgColor: "bg-[hsl(160,84%,90%)]" },
  completed: { label: "完了", color: "text-primary", bgColor: "bg-secondary" },
  on_hold: { label: "保留中", color: "text-[hsl(30,80%,35%)]", bgColor: "bg-[hsl(45,100%,85%)]" },
  archived: { label: "アーカイブ", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export default async function MissionsPage() {
  const supabase = await createClient();

  // ミッション一覧を取得（Key Results含む）
  const { data: missions, error } = await supabase
    .from("missions")
    .select(`
      *,
      key_results (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching missions:", error);
  }

  // 各ミッションの進捗率を計算
  const missionsWithProgress = missions?.map((mission) => {
    const keyResults = mission.key_results || [];
    if (keyResults.length === 0) return { ...mission, progress: 0 };

    const totalWeight = keyResults.reduce((sum: number, kr: any) => sum + (kr.weight || 1), 0);
    const completedWeight = keyResults.reduce((sum: number, kr: any) => {
      if (kr.type === "qualitative" && kr.is_completed) {
        return sum + (kr.weight || 1);
      }
      if (kr.type === "quantitative" && kr.current_value >= kr.target_value) {
        return sum + (kr.weight || 1);
      }
      if (kr.type === "quantitative" && kr.target_value > 0) {
        return sum + ((kr.current_value / kr.target_value) * (kr.weight || 1));
      }
      return sum;
    }, 0);

    const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    return { ...mission, progress };
  }) || [];

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(205,90%,60%)] bg-clip-text text-transparent">
            ミッション
          </h1>
          <p className="text-muted-foreground mt-1">
            OKR/ミッションの進捗管理 🎯
          </p>
        </div>
        <Button asChild className="rounded-xl shadow-pop hover-lift">
          <Link href="/missions/new">
            ✨ 新規ミッション作成
          </Link>
        </Button>
      </div>

      {/* ミッション統計 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
          <p className="text-sm text-muted-foreground">進行中</p>
          <p className="text-2xl font-bold text-primary">
            {missionsWithProgress.filter(m => m.status === "active").length}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[hsl(160,84%,45%)]/10 to-[hsl(160,84%,45%)]/5 p-4 border border-[hsl(160,84%,45%)]/20">
          <p className="text-sm text-muted-foreground">完了</p>
          <p className="text-2xl font-bold text-[hsl(160,84%,35%)]">
            {missionsWithProgress.filter(m => m.status === "completed").length}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[hsl(45,100%,60%)]/10 to-[hsl(45,100%,60%)]/5 p-4 border border-[hsl(45,100%,60%)]/20">
          <p className="text-sm text-muted-foreground">保留中</p>
          <p className="text-2xl font-bold text-[hsl(30,80%,45%)]">
            {missionsWithProgress.filter(m => m.status === "on_hold").length}
          </p>
        </div>
      </div>

      {missionsWithProgress.length === 0 ? (
        <Card className="rounded-2xl shadow-pop border-0">
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">ミッションがまだありません</h3>
            <p className="text-muted-foreground mb-6">
              最初のミッションを作成して、目標管理を始めましょう！
            </p>
            <Button asChild className="rounded-xl shadow-pop">
              <Link href="/missions/new">✨ 最初のミッションを作成</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {missionsWithProgress.map((mission) => {
            const level = levelConfig[mission.level] || levelConfig.member;
            const status = statusConfig[mission.status] || statusConfig.active;

            return (
              <Card key={mission.id} className="rounded-2xl shadow-pop border-0 hover:shadow-lg transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${level.color} text-2xl shadow-md`}>
                        {level.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {mission.title}
                          </CardTitle>
                          <Badge className={`${level.color} rounded-full`}>
                            {level.label}
                          </Badge>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        {mission.description && (
                          <CardDescription className="text-sm">
                            {mission.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-3xl font-bold text-primary">{mission.progress}<span className="text-lg font-normal text-muted-foreground">%</span></p>
                      <p className="text-xs text-muted-foreground">進捗率</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 進捗バー */}
                    <div className="space-y-1">
                      <Progress value={mission.progress} className="h-2 rounded-full" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>期間: {mission.start_date} ~ {mission.end_date}</span>
                        <Link href={`/missions/${mission.id}`} className="font-medium text-primary hover:underline">
                          詳細を見る →
                        </Link>
                      </div>
                    </div>

                    {/* Key Results */}
                    {mission.key_results && mission.key_results.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <span>📋</span>
                          成果指標（Key Results）
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {mission.key_results.map((kr: any) => {
                            const krProgress = kr.type === "quantitative" && kr.target_value > 0
                              ? Math.min(100, Math.round((kr.current_value / kr.target_value) * 100))
                              : kr.is_completed ? 100 : 0;

                            return (
                              <div
                                key={kr.id}
                                className="flex items-center justify-between rounded-xl bg-secondary/50 p-3"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-sm truncate">{kr.title}</span>
                                  <Badge variant="outline" className="text-[10px] rounded-full flex-shrink-0">
                                    {kr.type === "quantitative" ? "定量" : "定性"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${krProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-primary w-10 text-right">
                                    {krProgress}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
