"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import Link from "next/link";

export default function NewMissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "company",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90日後
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 開発用: 固定のorganization_idとowner_idを使用
      const { data, error: insertError } = await supabase
        .from("missions")
        .insert({
          organization_id: "11111111-1111-1111-1111-111111111111",
          owner_id: "22222222-2222-2222-2222-222222222222",
          title: formData.title,
          description: formData.description || null,
          level: formData.level,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: "active",
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      router.push("/missions");
      router.refresh();
    } catch (err: any) {
      console.error("Error creating mission:", err);
      setError(err.message || "ミッションの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">新規ミッション作成</h1>
        <p className="text-muted-foreground">
          新しいミッション（OKR目標）を作成します
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ミッション情報</CardTitle>
          <CardDescription>
            ミッションの基本情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
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
                <SelectTrigger>
                  <SelectValue placeholder="レベルを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">会社レベル</SelectItem>
                  <SelectItem value="manager">管理者レベル</SelectItem>
                  <SelectItem value="member">メンバーレベル</SelectItem>
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
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "作成中..." : "ミッションを作成"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/missions">キャンセル</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
