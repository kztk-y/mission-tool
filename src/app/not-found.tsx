import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-500">ページが見つかりません</p>
      <Link href="/" className="text-blue-600 hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
