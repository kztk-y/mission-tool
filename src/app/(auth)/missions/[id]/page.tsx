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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMissionButton } from "./_components/delete-mission-button";
import { AddKeyResultDialog } from "./components/add-key-result-dialog";
import { KeyResultCard } from "./components/key-result-card";

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

const krStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  not_started: { label: "未着手", color: "text-muted-foreground", bgColor: "bg-muted" },
  in_progress: { label: "進行中", color: "text-[hsl(205,90%,35%)]", bgColor: "bg-[hsl(205,90%,90%)]" },
  completed: { label: "完了", color: "text-[hsl(160,84%,30%)]", bgColor: "bg-[hsl(160,84%,90%)]" },
  at_risk: { label: "リスク", color: "text-[hsl(0,84%,35%)]", bgColor: "bg-[hsl(0,84%,90%)]" },
};

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // ミッション詳細を取得（Key Results, Owner含む）
  const { data: mission, error } = await supabase
    .from("missions")
    .select(`
      *,
      key_results (*),
      owner:owner_id (
        id,
        name,
        email,
        avatar_url
      ),
      parent:parent_id (
        id,
        title
      )
    `)
    .eq("id", id)
    .single();

  if (error || !mission) {
    notFound();
  }

  // 進捗率を計算
  const keyResults = mission.key_results || [];
  let progress = 0;

  if (keyResults.length > 0) {
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
    progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  const level = levelConfig[mission.level] || levelConfig.member;
  const status = statusConfig[mission.status] || statusConfig.active;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="rounded-xl">
            <Link href="/missions">
              ←
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(205,90%,60%)] bg-clip-text text-transparent">
              ミッション詳細
            </h1>
            <p className="text-muted-foreground mt-1">
              目標と成果指標の進捗状況 🎯
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="rounded-xl shadow-pop hover-lift">
            <Link href={`/missions/${mission.id}/edit`}>
              ✏️ 編集
            </Link>
          </Button>
          <DeleteMissionButton missionId={mission.id} />
        </div>
      </div>

      {/* ミッション基本情報 */}
      <Card className="rounded-2xl shadow-pop border-0">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${level.color} text-3xl shadow-md flex-shrink-0`}>
              {level.icon}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-2xl">{mission.title}</CardTitle>
                <Badge className={`${level.color} rounded-full`}>
                  {level.label}
                </Badge>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${status.bgColor} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              {mission.description && (
                <CardDescription className="text-base">
                  {mission.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 進捗バー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">全体進捗</span>
              <span className="text-2xl font-bold text-primary">{progress}<span className="text-base font-normal text-muted-foreground">%</span></span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </div>

          <Separator />

          {/* メタ情報 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">期間</p>
              <p className="font-medium">
                {mission.start_date} ~ {mission.end_date}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">オーナー</p>
              <p className="font-medium flex items-center gap-2">
                <span className="text-lg">👤</span>
                {mission.owner?.name || "不明"}
              </p>
            </div>
            {mission.parent && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">親ミッション</p>
                <Link
                  href={`/missions/${mission.parent.id}`}
                  className="font-medium text-primary hover:underline flex items-center gap-2"
                >
                  <span className="text-lg">🔗</span>
                  {mission.parent.title}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Results一覧 */}
      <Card className="rounded-2xl shadow-pop border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                成果指標（Key Results）
              </CardTitle>
              <CardDescription>
                このミッションの目標達成に必要な成果指標
              </CardDescription>
            </div>
            <AddKeyResultDialog missionId={mission.id} />
          </div>
        </CardHeader>
        <CardContent>
          {keyResults.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="text-lg font-semibold mb-2">Key Resultsがまだありません</h3>
              <p className="text-muted-foreground mb-4">
                成果指標を追加して、ミッションの進捗を測定しましょう
              </p>
              <AddKeyResultDialog missionId={mission.id} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {keyResults.map((kr: any) => (
                <KeyResultCard key={kr.id} keyResult={kr} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
