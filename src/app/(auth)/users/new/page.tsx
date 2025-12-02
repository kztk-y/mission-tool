"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createUser } from "../actions";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "member" as "executive" | "manager" | "member",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createUser(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/users");
      router.refresh();
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "ユーザーの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          ✉️ ユーザー招待
        </h1>
        <p className="text-muted-foreground mt-1">
          新しいユーザーを組織に招待します
        </p>
      </div>

      <Card className="rounded-2xl shadow-pop border-2">
        <CardHeader>
          <CardTitle>ユーザー情報</CardTitle>
          <CardDescription>
            招待するユーザーの基本情報を入力してください
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
              <Label htmlFor="name">名前 *</Label>
              <Input
                id="name"
                placeholder="例: 山田 太郎"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                ユーザーの表示名を入力してください
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                placeholder="例: yamada@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                招待メールが送信されます（現在は開発環境のため送信されません）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">役割 *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "executive" | "manager" | "member") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="executive" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>👑</span>
                      <div>
                        <p className="font-medium">経営者</p>
                        <p className="text-xs text-muted-foreground">
                          全ての権限を持ちます
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>⭐</span>
                      <div>
                        <p className="font-medium">管理者</p>
                        <p className="text-xs text-muted-foreground">
                          グループとメンバーを管理できます
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="member" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <div>
                        <p className="font-medium">メンバー</p>
                        <p className="text-xs text-muted-foreground">
                          自分のミッションを管理できます
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200">
              💡 <strong>ヒント:</strong> ユーザーを招待すると、指定したメールアドレスに招待メールが送信されます。
              ユーザーは招待リンクからアカウントを作成できます。
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl shadow-md"
              >
                {loading ? "招待中..." : "ユーザーを招待"}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="rounded-xl"
              >
                <Link href="/users">キャンセル</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
