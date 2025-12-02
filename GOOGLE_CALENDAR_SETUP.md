# Google Calendar API 連携セットアップガイド

## 実装完了内容

### 1. インストール済みライブラリ
- `googleapis` - Google Calendar API クライアント

### 2. 作成されたファイル
- `/src/lib/google/calendar.ts` - Google Calendar API連携関数
- `/src/app/api/auth/google/route.ts` - OAuth認証開始エンドポイント
- `/src/app/api/auth/google/callback/route.ts` - OAuth認証コールバック処理
- `/src/app/(auth)/calendar/actions.ts` - Server Actions（イベント取得・連携解除）
- `/src/app/(auth)/calendar/calendar-client.tsx` - カレンダーUI（Client Component）
- `/src/app/(auth)/calendar/page.tsx` - カレンダーページ（Server Component）
- `/database-google-tokens.sql` - google_tokensテーブル作成SQL

### 3. 型定義追加
- `database-types.ts` に `GoogleToken` インターフェース追加

### 4. 環境変数設定
`.env.local` に以下の環境変数を追加済み（値は要設定）:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-generate-with-openssl-rand-base64-32
```

## Google Cloud Console セットアップ手順

### ステップ1: Google Cloud プロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存プロジェクトを選択）

### ステップ2: Google Calendar API を有効化
1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Google Calendar API」を検索
3. 「有効にする」をクリック

### ステップ3: OAuth 2.0 認証情報を作成
1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuth クライアント ID」をクリック
3. アプリケーションの種類: 「ウェブアプリケーション」を選択
4. 名前: 任意（例: Mission Tool Calendar Integration）
5. 承認済みのリダイレクト URI:
   - 開発環境: `http://localhost:3000/api/auth/google/callback`
   - 本番環境: `https://yourdomain.com/api/auth/google/callback`
6. 「作成」をクリック
7. **クライアントIDとクライアントシークレットをコピー**

### ステップ4: OAuth同意画面を設定
1. 「APIとサービス」→「OAuth同意画面」を選択
2. User Type: 「外部」を選択（組織内のみの場合は「内部」）
3. アプリ情報を入力:
   - アプリ名: Mission Tool
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
4. スコープの設定:
   - 「スコープを追加または削除」をクリック
   - 以下のスコープを追加:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
5. テストユーザーを追加（外部の場合）
6. 「保存して次へ」で完了

### ステップ5: .env.local に認証情報を設定
```bash
# Google Cloud Consoleからコピーした値を設定
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET を生成（以下のコマンドを実行）
# openssl rand -base64 32
NEXTAUTH_SECRET=生成されたランダム文字列
```

### ステップ6: Supabase にテーブルを作成
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. `database-google-tokens.sql` の内容をコピーして実行
5. 「Run」をクリックしてテーブル作成

## 動作確認手順

### 1. 開発サーバーを起動
```bash
npm run dev
```

### 2. ログイン
1. http://localhost:3000/login にアクセス
2. Supabase認証でログイン

### 3. カレンダー連携
1. http://localhost:3000/calendar にアクセス
2. 「Googleカレンダー連携」ボタンをクリック
3. Google認証画面でアカウントを選択し、アクセスを許可
4. 連携成功後、本日の予定が自動的に表示される

### 4. イベント更新
1. 「イベント更新」ボタンで最新のカレンダーイベントを取得

### 5. 連携解除
1. 「連携解除」ボタンでGoogle Calendar連携を解除

## 実装された機能

### OAuth 2.0 認証フロー
- ユーザーがGoogleアカウントでログイン
- Calendar API へのアクセス許可を取得
- アクセストークンとリフレッシュトークンをSupabaseに保存

### イベント取得
- 本日のカレンダーイベントを取得
- 開始時刻・終了時刻・タイトル・説明を表示
- トークン自動更新（有効期限切れ時）

### UI機能
- 連携状態の表示
- 本日の予定件数・分類済み・未分類の統計
- イベント一覧表示
- ローディング状態・エラーハンドリング

## エラーハンドリング

実装済みのエラー処理:
- 認証失敗
- トークン取得失敗
- アクセストークン期限切れ（自動リフレッシュ）
- イベント取得失敗
- データベースエラー

## セキュリティ対策

実装済みのセキュリティ機能:
- Row Level Security（RLS）でユーザーごとのトークン分離
- トークンはサーバーサイドのみで処理
- アクセストークンの暗号化（Supabaseデフォルト）
- HTTPS必須（本番環境）

## 今後の実装予定

- [ ] イベントのミッション自動分類（タイトルベース）
- [ ] イベントの手動分類機能
- [ ] 過去のイベント取得（日付範囲指定）
- [ ] 複数カレンダー対応
- [ ] イベント作成・編集機能

## トラブルシューティング

### Q: 「Google Calendar連携が必要です」と表示される
A: Google Cloud Consoleで認証情報が正しく設定されているか確認してください。

### Q: リダイレクトURIエラーが出る
A: Google Cloud Consoleの「承認済みのリダイレクトURI」に正確なURLが登録されているか確認してください。

### Q: トークンが期限切れになる
A: リフレッシュトークンで自動更新されます。再度連携が必要な場合は、一度連携解除してから再連携してください。

### Q: イベントが取得できない
A: Calendar APIが有効化されているか、スコープが正しく設定されているか確認してください。

## 参考リンク

- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [googleapis Node.js クライアント](https://github.com/googleapis/google-api-nodejs-client)
- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
