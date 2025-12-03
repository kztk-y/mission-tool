# Mission Tool

IPO準備中のスタートアップ向けミッション管理ツール。「誰が何にどれだけ時間を使っているか」を可視化し、OKR/ミッションの進捗管理を支援します。

## 本番URL

https://mission-tool.vercel.app

## 機能一覧

### 実装済み

| 機能 | ページ | 説明 |
|-----|------|------|
| ダッシュボード | `/dashboard` | 統計情報・概要表示 |
| ミッション一覧 | `/missions` | OKR/ミッションの一覧・進捗表示 |
| ミッション作成 | `/missions/new` | 新規ミッション作成 |
| ミッション詳細 | `/missions/[id]` | 詳細表示・Key Results管理 |
| ミッション編集 | `/missions/[id]/edit` | ミッション情報の編集 |
| ユーザー管理 | `/users` | ユーザー一覧・役割変更・削除 |
| ユーザー招待 | `/users/new` | 新規ユーザー追加 |
| レポート | `/reports` | 時間集計・ミッション別・ユーザー別分析 |
| Excelインポート | `/import` | KPI実績データのインポート（スキャフォールド） |

### 未完了（次回対応）

- [ ] **Google Calendar連携** - OAuth認証設定、カレンダーイベント取得
- [ ] **本番認証の有効化** - 現在は開発用ダミーユーザーで動作中
- [ ] **イベント→ミッション紐付け** - カレンダーイベントをミッションに分類する機能

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **UI**: TailwindCSS + shadcn/ui
- **デプロイ**: Vercel
- **カレンダー連携**: Google Calendar API（設定待ち）

## 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス

## 環境変数

`.env.local` に以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Calendar連携用（未設定）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=https://mission-tool.vercel.app
NEXTAUTH_SECRET=
```

## データベーススキーマ

Supabaseに以下のテーブルが必要：

- `organizations` - 組織
- `users` - ユーザー
- `missions` - ミッション/OKR
- `key_results` - 成果指標
- `calendar_events` - カレンダーイベント
- `google_tokens` - Google認証トークン（未作成）

## デプロイ

GitHubにプッシュすると、Vercelが自動でデプロイします。

```bash
git add -A
git commit -m "変更内容"
git push origin main
```

## 次回やることリスト

1. **Google Calendar連携の完成**
   - Google Cloud Consoleでプロジェクト設定
   - OAuth 2.0認証情報の作成
   - Vercel環境変数の設定
   - Supabaseに`google_tokens`テーブル作成

2. **本番認証の有効化**
   - `src/app/(auth)/layout.tsx` の認証チェックを有効化
   - ログインページの動作確認
   - ユーザー登録フローの実装

3. **イベント→ミッション紐付け機能**
   - カレンダーイベント一覧表示
   - ドラッグ&ドロップまたはセレクトでミッション割り当て
   - 自動分類ルール設定

## ライセンス

Private
