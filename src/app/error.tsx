"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">エラーが発生しました</h1>
      <p className="text-muted-foreground">申し訳ございません。問題が発生しました。</p>
      <Button onClick={reset}>もう一度試す</Button>
    </div>
  );
}
