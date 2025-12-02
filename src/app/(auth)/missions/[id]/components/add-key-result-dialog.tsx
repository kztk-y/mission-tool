"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createKeyResult } from "../actions";

interface AddKeyResultDialogProps {
  missionId: string;
}

export function AddKeyResultDialog({ missionId }: AddKeyResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"quantitative" | "qualitative">("quantitative");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("mission_id", missionId);
    formData.append("type", type);

    startTransition(async () => {
      const result = await createKeyResult(formData);

      if (result.success) {
        setOpen(false);
        // フォームをリセット
        (e.target as HTMLFormElement).reset();
        setType("quantitative");
      } else {
        setError(result.error || "エラーが発生しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-pop hover-lift">
          ✨ Key Result追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">新しいKey Resultを追加</DialogTitle>
            <DialogDescription>
              定量的または定性的な成果指標を設定しましょう
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                name="title"
                placeholder="例: 新規顧客獲得数"
                required
                className="rounded-xl"
              />
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="詳細な説明（任意）"
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            {/* タイプ選択 */}
            <div className="space-y-2">
              <Label>タイプ <span className="text-red-500">*</span></Label>
              <Select value={type} onValueChange={(v) => setType(v as "quantitative" | "qualitative")}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantitative">📊 定量（数値で測定）</SelectItem>
                  <SelectItem value="qualitative">✅ 定性（達成/未達成）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 定量の場合の入力フィールド */}
            {type === "quantitative" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_value">目標値 <span className="text-red-500">*</span></Label>
                    <Input
                      id="target_value"
                      name="target_value"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="100"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">単位</Label>
                    <Input
                      id="unit"
                      name="unit"
                      placeholder="例: 件, %"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_value">現在値</Label>
                  <Input
                    id="current_value"
                    name="current_value"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    className="rounded-xl"
                  />
                </div>
              </>
            )}

            {/* 重み */}
            <div className="space-y-2">
              <Label htmlFor="weight">重み（重要度）</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min="1"
                max="10"
                defaultValue="1"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                1-10の範囲で指定（数値が大きいほど重要）
              </p>
            </div>

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
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl shadow-pop"
            >
              {isPending ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
