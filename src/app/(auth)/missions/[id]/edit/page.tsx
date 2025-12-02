import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditMissionForm } from "./_components/edit-mission-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditMissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // ミッション詳細を取得
  const { data: mission, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !mission) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-xl">
          <Link href={`/missions/${id}`}>
            ←
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(205,90%,60%)] bg-clip-text text-transparent">
            ミッション編集
          </h1>
          <p className="text-muted-foreground mt-1">
            ミッション情報を更新 ✏️
          </p>
        </div>
      </div>

      {/* 編集フォーム */}
      <EditMissionForm mission={mission} />
    </div>
  );
}
