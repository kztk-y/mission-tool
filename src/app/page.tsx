export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            ミッション管理ツール
          </h1>
          <p className="text-xl text-muted-foreground">
            時間×ミッションの可視化で意思決定を支援
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">時間配分の可視化</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                誰が何に時間を使っているかを
                <br />
                ダッシュボードで一目で把握
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Googleカレンダー連携</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                予定を自動取得し
                <br />
                ミッションに自動分類
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">OKR階層管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                会社→管理者→メンバーの
                <br />
                3階層でミッション管理
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">ログイン</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">ダッシュボード</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
