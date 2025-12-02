"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateMission } from "../../actions";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  status: string;
  start_date: string;
  end_date: string;
};

type EditMissionFormProps = {
  mission: Mission;
};

export function EditMissionForm({ mission }: EditMissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: mission.title,
    description: mission.description || "",
    level: mission.level,
    status: mission.status,
    start_date: mission.start_date,
    end_date: mission.end_date,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await updateMission(mission.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/missions/${mission.id}`);
      }
    } catch (err: any) {
      console.error("Error updating mission:", err);
      setError(err.message || "ミッションの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-pop border-2">
      <CardHeader>
        <CardTitle>ミッション情報</CardTitle>
        <CardDescription>
          ミッションの基本情報を編集してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              placeholder="例: Q4 売上目標達成"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              placeholder="ミッションの詳細を記載してください"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">レベル *</Label>
            <Select
              value={formData.level}
              onValueChange={(value) =>
                setFormData({ ...formData, level: value })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="レベルを選択" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="company" className="rounded-lg">会社レベル</SelectItem>
                <SelectItem value="manager" className="rounded-lg">管理者レベル</SelectItem>
                <SelectItem value="member" className="rounded-lg">メンバーレベル</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">ステータス *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="active" className="rounded-lg">進行中</SelectItem>
                <SelectItem value="completed" className="rounded-lg">完了</SelectItem>
                <SelectItem value="on_hold" className="rounded-lg">保留</SelectItem>
                <SelectItem value="archived" className="rounded-lg">アーカイブ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">開始日 *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">終了日 *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "更新中..." : "ミッションを更新"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
