import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 開発環境では認証チェックをスキップ
  // 本番では updateSession を使用
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
