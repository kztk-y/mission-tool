# Mission Management Tool - Database Design Document

## 概要

このドキュメントは、ミッション管理ツールのSupabaseデータベース設計を説明します。

### 主要要件

- **ユーザー構成**: 経営者 + 管理者（6名〜）+ メンバー（24名〜）
- **OKR階層**: 会社全体 → 管理者ミッション → メンバーミッション
- **成果指標**: 定量（数値目標）+ 定性（完了/未完了）
- **時間記録**: Googleカレンダー連携、ミッションへの自動分類
- **グループ管理**: 管理者がグループを持ち、メンバーが所属

---

## テーブル構成

### 1. organizations（組織）

会社・組織の基本情報を管理します。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| name | TEXT | 組織名 |
| slug | TEXT | URL用識別子（一意） |
| settings | JSONB | 組織設定（タイムゾーン、営業日など） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**RLSポリシー:**
- ✅ 認証済みユーザーは所属組織を閲覧可能
- ✅ 経営者のみ組織情報を更新可能

---

### 2. users（ユーザー）

Supabase Authと連携したユーザー情報。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| auth_id | UUID | Supabase Auth連携ID（一意） |
| organization_id | UUID | 所属組織ID |
| email | TEXT | メールアドレス |
| name | TEXT | ユーザー名 |
| avatar_url | TEXT | アバター画像URL |
| role | TEXT | 役割（executive/manager/member） |
| is_active | BOOLEAN | アクティブ状態 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**役割（role）:**
- `executive`: 経営者（全体閲覧・管理権限）
- `manager`: 管理者（グループ管理、部下の閲覧権限）
- `member`: メンバー（自分のデータのみ管理）

**RLSポリシー:**
- ✅ 同じ組織のユーザーは閲覧可能
- ✅ ユーザーは自分の情報を更新可能

---

### 3. groups（グループ）

管理者が管理するチーム・部門。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| organization_id | UUID | 所属組織ID |
| manager_id | UUID | 管理者ID |
| name | TEXT | グループ名 |
| description | TEXT | グループ説明 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**制約:**
- マネージャーは同じ組織に所属していること

**RLSポリシー:**
- ✅ 同じ組織のユーザーはグループを閲覧可能
- ✅ マネージャーは自分のグループを作成・更新可能

---

### 4. group_members（グループメンバー）

グループとメンバーの多対多関係。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| group_id | UUID | グループID |
| user_id | UUID | ユーザーID |
| joined_at | TIMESTAMPTZ | 参加日時 |

**制約:**
- 同じグループに同じユーザーは1回だけ（UNIQUE制約）

**RLSポリシー:**
- ✅ 同じ組織のユーザーはグループメンバーを閲覧可能
- ✅ マネージャーは自分のグループのメンバーを管理可能

---

### 5. missions（ミッション）

OKRの目標を階層構造で管理。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| organization_id | UUID | 所属組織ID |
| parent_id | UUID | 親ミッションID（NULL=会社レベル） |
| owner_id | UUID | オーナーユーザーID |
| title | TEXT | ミッションタイトル |
| description | TEXT | ミッション説明 |
| level | TEXT | レベル（company/manager/member） |
| status | TEXT | ステータス（active/completed/archived/on_hold） |
| start_date | DATE | 開始日 |
| end_date | DATE | 終了日 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**階層構造:**
```
会社ミッション（level=company, parent_id=NULL）
└── 管理者ミッション（level=manager, parent_id=会社ミッションID）
    └── メンバーミッション（level=member, parent_id=管理者ミッションID）
```

**制約:**
- 終了日は開始日以降
- レベルと親の整合性チェック

**RLSポリシー:**
- ✅ 同じ組織のユーザーはミッションを閲覧可能
- ✅ ユーザーは自分のミッションを作成・更新可能
- ✅ マネージャーは部下のミッションを管理可能

---

### 6. key_results（成果指標）

ミッションに紐づくKR（Key Results）。定量・定性の両方に対応。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| mission_id | UUID | ミッションID |
| title | TEXT | KRタイトル |
| description | TEXT | KR説明 |
| type | TEXT | タイプ（quantitative/qualitative） |
| target_value | DECIMAL | 目標値（定量のみ） |
| current_value | DECIMAL | 現在値（定量のみ） |
| unit | TEXT | 単位（定量のみ、例: "件", "円", "%"） |
| is_completed | BOOLEAN | 完了フラグ（定性のみ） |
| weight | INTEGER | 重み付け（1〜10） |
| status | TEXT | ステータス（not_started/in_progress/completed/at_risk） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**タイプ別の使い方:**

**定量指標（quantitative）:**
```sql
-- 例: 売上1000万円達成
type = 'quantitative'
target_value = 10000000
current_value = 7500000
unit = '円'
```

**定性指標（qualitative）:**
```sql
-- 例: 新システムのリリース
type = 'qualitative'
is_completed = false
```

**制約:**
- 定量指標は`target_value`と`unit`が必須

**RLSポリシー:**
- ✅ ミッションを閲覧できるユーザーはKRも閲覧可能
- ✅ ミッションのオーナーはKRを管理可能

---

### 7. calendar_events（カレンダーイベント）

Googleカレンダーから同期したイベント。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| google_event_id | TEXT | GoogleカレンダーのイベントID |
| calendar_id | TEXT | Googleカレンダー識別子 |
| title | TEXT | イベントタイトル |
| description | TEXT | イベント説明 |
| start_time | TIMESTAMPTZ | 開始時刻 |
| end_time | TIMESTAMPTZ | 終了時刻 |
| is_all_day | BOOLEAN | 終日フラグ |
| location | TEXT | 場所 |
| attendees | JSONB | 参加者リスト |
| synced_at | TIMESTAMPTZ | 同期日時 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**制約:**
- 終了時刻は開始時刻より後
- 同じユーザーで同じ`google_event_id`は1つだけ

**RLSポリシー:**
- ✅ ユーザーは自分のカレンダーイベントを閲覧可能
- ✅ マネージャーは部下のカレンダーイベントを閲覧可能
- ⚠️ 作成・更新はシステム（Google Calendar同期）のみ

---

### 8. time_entries（時間記録）

カレンダーイベントとミッションを紐づけた時間記録。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| mission_id | UUID | ミッションID（NULL=未分類） |
| calendar_event_id | UUID | カレンダーイベントID |
| start_time | TIMESTAMPTZ | 開始時刻 |
| end_time | TIMESTAMPTZ | 終了時刻 |
| duration_minutes | INTEGER | 時間（分）- 自動計算 |
| category | TEXT | カテゴリ（例: "会議", "開発"） |
| note | TEXT | メモ |
| is_auto_classified | BOOLEAN | 自動分類フラグ |
| classification_confidence | DECIMAL | 分類の信頼度（0.00〜1.00） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**duration_minutesの自動計算:**
```sql
duration_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
```

**自動分類の流れ:**
1. Googleカレンダーからイベントを同期 → `calendar_events`に保存
2. イベントタイトル・説明をAIで分析 → ミッションを推定
3. `time_entries`に時間記録を作成（`is_auto_classified=true`）
4. ユーザーが手動で修正可能

**RLSポリシー:**
- ✅ ユーザーは自分の時間記録を管理可能
- ✅ マネージャーは部下の時間記録を閲覧可能
- ✅ 経営者は全員の時間記録を閲覧可能

---

## データベース関数

### 1. calculate_mission_progress(mission_uuid)

ミッションの進捗率を計算する関数。

**使い方:**
```sql
SELECT calculate_mission_progress('ミッションのUUID');
-- 返り値: 0.00〜100.00 (DECIMAL)
```

**計算ロジック:**
```
進捗率 = (完了したKRの重み合計 / 全KRの重み合計) × 100

完了条件:
- 定性指標: is_completed = true
- 定量指標: current_value >= target_value
```

---

### 2. get_user_time_summary(user_id, start_date, end_date)

指定期間のユーザーの時間配分サマリーを取得する関数。

**使い方:**
```sql
SELECT * FROM get_user_time_summary(
  'ユーザーのUUID',
  '2024-01-01 00:00:00+09',
  '2024-01-31 23:59:59+09'
);
```

**返り値:**
| カラム | 型 | 説明 |
|--------|-----|------|
| mission_id | UUID | ミッションID |
| mission_title | TEXT | ミッションタイトル |
| total_minutes | INTEGER | 総時間（分） |
| percentage | DECIMAL | 割合（%） |

**活用例:**
```sql
-- 2024年1月の時間配分を取得
SELECT
  mission_title,
  total_minutes,
  ROUND(total_minutes / 60.0, 1) AS total_hours,
  percentage
FROM get_user_time_summary(
  'abc123...',
  '2024-01-01',
  '2024-01-31'
)
ORDER BY percentage DESC;
```

---

## ER図（テキスト表現）

```
organizations
    ├─→ users (organization_id)
    ├─→ groups (organization_id)
    └─→ missions (organization_id)

users
    ├─→ groups (manager_id)
    ├─→ group_members (user_id)
    ├─→ missions (owner_id)
    ├─→ calendar_events (user_id)
    └─→ time_entries (user_id)

groups
    └─→ group_members (group_id)

missions
    ├─→ missions (parent_id) - 自己参照（階層構造）
    ├─→ key_results (mission_id)
    └─→ time_entries (mission_id)

calendar_events
    └─→ time_entries (calendar_event_id)
```

---

## RLS（Row Level Security）ポリシー概要

### 権限マトリクス

| テーブル | 経営者 | 管理者 | メンバー |
|---------|--------|--------|---------|
| organizations | 閲覧・更新 | 閲覧 | 閲覧 |
| users | 組織全体を閲覧 | 組織全体を閲覧 | 組織全体を閲覧 |
| groups | 全グループを管理 | 自分のグループを管理 | 閲覧のみ |
| group_members | 全員を管理 | 自分のグループのみ管理 | 閲覧のみ |
| missions | 全ミッションを管理 | 自分+部下のミッション管理 | 自分のミッションのみ |
| key_results | 全KRを管理 | 自分+部下のKR管理 | 自分のKRのみ |
| calendar_events | 全員を閲覧 | 部下を閲覧 | 自分のみ閲覧 |
| time_entries | 全員を閲覧 | 部下を閲覧 | 自分のみ管理 |

### セキュリティ設計のポイント

1. **Supabase Auth連携**: `auth.uid()`を使用してログインユーザーを識別
2. **組織分離**: 必ず`organization_id`でフィルタリング（マルチテナント）
3. **階層的権限**: 経営者 > 管理者 > メンバーの順に権限を制限
4. **データ保護**: カレンダーイベントはシステムのみが更新可能

---

## セットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクトのダッシュボードを開く

### 2. スキーマの適用

```bash
# SQL Editorでdatabase-schema.sqlを実行
supabase db push
```

または、Supabase DashboardのSQL Editorで`database-schema.sql`の内容を実行。

### 3. 認証設定

1. **Authentication** → **Providers**で Google OAuth を有効化
2. Google Calendar API のスコープを追加:
   - `https://www.googleapis.com/auth/calendar.readonly`

### 4. 初期データ投入（任意）

```sql
-- 組織の作成
INSERT INTO organizations (name, slug)
VALUES ('サンプル株式会社', 'sample-company')
RETURNING id;

-- 経営者ユーザーの作成
INSERT INTO users (auth_id, organization_id, email, name, role)
VALUES (
  auth.uid(),
  'organization_id',
  'ceo@example.com',
  '山田太郎',
  'executive'
);
```

---

## データベース運用のベストプラクティス

### 1. インデックス活用

スキーマには以下のインデックスが設定済み:
- 外部キー（FK）すべて
- 検索頻度の高いカラム（`status`, `role`, `type`など）
- 日時範囲検索用の複合インデックス

### 2. パフォーマンス最適化

```sql
-- 時間配分クエリの最適化例
EXPLAIN ANALYZE
SELECT * FROM get_user_time_summary(
  'user_id',
  '2024-01-01',
  '2024-12-31'
);
```

### 3. データバックアップ

Supabaseの自動バックアップを有効化:
- Point-in-Time Recovery（PITR）を推奨
- 手動バックアップは週次で実施

### 4. マイグレーション管理

```bash
# Supabase CLIでマイグレーション生成
supabase migration new add_new_feature

# マイグレーション適用
supabase db push
```

---

## 今後の拡張ポイント

### 1. 通知機能

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'mission_deadline', 'kr_update', etc.
  content JSONB NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. コメント・フィードバック

```sql
CREATE TABLE mission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. ファイル添付

```sql
CREATE TABLE mission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storageのパス
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 監査ログ

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB, -- 変更内容
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## トラブルシューティング

### RLSポリシーが効かない

```sql
-- ポリシーが有効か確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- ポリシー一覧を確認
SELECT * FROM pg_policies
WHERE schemaname = 'public';
```

### パフォーマンス問題

```sql
-- スロークエリを特定
SELECT *
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### インデックスの効果確認

```sql
-- クエリプランの確認
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM missions
WHERE organization_id = 'xxx'
  AND status = 'active';
```

---

## 参考資料

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**作成日**: 2025-12-02
**バージョン**: 1.0.0
