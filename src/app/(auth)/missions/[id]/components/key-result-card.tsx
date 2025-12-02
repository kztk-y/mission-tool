"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateKeyResultProgress, deleteKeyResult } from "../actions";
import { Trash2, Edit2 } from "lucide-react";

interface KeyResult {
  id: string;
  title: string;
  description?: string;
  type: "quantitative" | "qualitative";
  target_value?: number;
  current_value: number;
  unit?: string;
  weight: number;
  is_completed: boolean;
}

interface KeyResultCardProps {
  keyResult: KeyResult;
}

export function KeyResultCard({ keyResult }: KeyResultCardProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 進捗率を計算
  let progress = 0;
  if (keyResult.type === "qualitative") {
    progress = keyResult.is_completed ? 100 : 0;
  } else if (keyResult.type === "quantitative" && keyResult.target_value) {
    progress = Math.min(100, Math.round((keyResult.current_value / keyResult.target_value) * 100));
  }

  // 進捗更新
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("id", keyResult.id);

    startTransition(async () => {
      const result = await updateKeyResultProgress(formData);

      if (result.success) {
        setUpdateOpen(false);
      } else {
        setError(result.error || "更新に失敗しました");
      }
    });
  };

  // 削除処理
  const handleDelete = async () => {
    setError(null);

    startTransition(async () => {
      const result = await deleteKeyResult(keyResult.id);

      if (result.success) {
        setDeleteOpen(false);
      } else {
        setError(result.error || "削除に失敗しました");
      }
    });
  };

  return (
    <Card className="rounded-2xl shadow-pop border-0 hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-base">{keyResult.title}</CardTitle>
              <Badge variant="outline" className="rounded-full text-xs">
                {keyResult.type === "quantitative" ? "📊 定量" : "✅ 定性"}
              </Badge>
              {keyResult.weight > 1 && (
                <Badge className="bg-[hsl(45,100%,50%)] text-white rounded-full text-xs">
                  重要度 {keyResult.weight}
                </Badge>
              )}
            </div>
            {keyResult.description && (
              <p className="text-sm text-muted-foreground">
                {keyResult.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* 更新ボタン */}
            <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-2xl">
                <form onSubmit={handleUpdate}>
                  <DialogHeader>
                    <DialogTitle>進捗を更新</DialogTitle>
                    <DialogDescription>
                      {keyResult.title}の進捗を更新します
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    {keyResult.type === "quantitative" ? (
                      <div className="space-y-2">
                        <Label htmlFor="current_value">
                          現在値 {keyResult.unit && `(${keyResult.unit})`}
                        </Label>
                        <Input
                          id="current_value"
                          name="current_value"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={keyResult.current_value}
                          required
                          className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">
                          目標: {keyResult.target_value} {keyResult.unit}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="is_completed">ステータス</Label>
                        <select
                          id="is_completed"
                          name="is_completed"
                          defaultValue={keyResult.is_completed ? "true" : "false"}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2"
                        >
                          <option value="false">未達成</option>
                          <option value="true">達成</option>
                        </select>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUpdateOpen(false)}
                      className="rounded-xl"
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl shadow-pop"
                    >
                      {isPending ? "更新中..." : "更新"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* 削除ボタン */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Key Resultを削除</DialogTitle>
                  <DialogDescription>
                    本当に「{keyResult.title}」を削除しますか？この操作は取り消せません。
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    className="rounded-xl"
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="rounded-xl"
                  >
                    {isPending ? "削除中..." : "削除"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 進捗バー */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2 rounded-full" />
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-primary">
              {progress}<span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            {keyResult.type === "quantitative" && (
              <p className="text-sm text-muted-foreground">
                {keyResult.current_value} / {keyResult.target_value} {keyResult.unit}
              </p>
            )}
            {keyResult.type === "qualitative" && (
              <Badge className={keyResult.is_completed ? "bg-[hsl(160,84%,45%)] text-white" : "bg-muted"}>
                {keyResult.is_completed ? "達成済み" : "未達成"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
