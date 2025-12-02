-- ============================================================
-- Mission Management Tool - Supabase Database Schema
-- ============================================================
-- Requirements:
--   - Users: Executive, Managers (6+), Members (24+)
--   - OKR Hierarchy: Company → Manager Mission → Member Mission
--   - KPIs: Quantitative (numeric) + Qualitative (done/not done)
--   - Time Tracking: Google Calendar sync, linked to missions
--   - Groups: Managers have groups, members belong to groups
-- ============================================================

-- ============================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================
-- 組織（会社）の基本情報を管理
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL用のスラッグ（例: "my-company"）
  settings JSONB DEFAULT '{}', -- 組織レベルの設定（タイムゾーン、営業日など）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは所属組織を閲覧可能
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- 経営者のみ組織情報を更新可能
CREATE POLICY "Executives can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid() AND role = 'executive'
    )
  );


-- ============================================================
-- 2. USERS TABLE
-- ============================================================
-- ユーザー情報（Supabase Authと連携）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('executive', 'manager', 'member')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 同じ組織のユーザーは閲覧可能
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ユーザーは自分の情報を更新可能
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid());


-- ============================================================
-- 3. GROUPS TABLE
-- ============================================================
-- 管理者が持つグループ（チーム、部門など）
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約: マネージャーは同じ組織に所属していること
  CONSTRAINT fk_manager_organization CHECK (
    manager_id IN (
      SELECT id FROM users WHERE organization_id = groups.organization_id
    )
  )
);

-- Indexes
CREATE INDEX idx_groups_organization_id ON groups(organization_id);
CREATE INDEX idx_groups_manager_id ON groups(manager_id);

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 同じ組織のユーザーはグループを閲覧可能
CREATE POLICY "Users can view groups in their organization"
  ON groups FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- マネージャーは自分のグループを作成・更新可能
CREATE POLICY "Managers can manage their groups"
  ON groups FOR ALL
  TO authenticated
  USING (
    manager_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid() AND role IN ('manager', 'executive')
    )
  );


-- ============================================================
-- 4. GROUP_MEMBERS TABLE
-- ============================================================
-- グループとメンバーの多対多関係
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約: 同じグループに同じユーザーは1回だけ
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- RLS Policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 同じ組織のユーザーはグループメンバーを閲覧可能
CREATE POLICY "Users can view group members in their organization"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN users u ON u.organization_id = g.organization_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- マネージャーは自分のグループのメンバーを管理可能
CREATE POLICY "Managers can manage their group members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN users u ON u.id = g.manager_id
      WHERE u.auth_id = auth.uid()
    )
  );


-- ============================================================
-- 5. MISSIONS TABLE
-- ============================================================
-- ミッション（OKRの目標）- 階層構造
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES missions(id) ON DELETE CASCADE, -- NULL = 会社レベルミッション
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- ミッションのオーナー
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('company', 'manager', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約: 終了日は開始日より後
  CONSTRAINT check_dates CHECK (end_date >= start_date),

  -- 制約: レベルと親の整合性
  CONSTRAINT check_hierarchy CHECK (
    (level = 'company' AND parent_id IS NULL) OR
    (level = 'manager' AND parent_id IS NOT NULL) OR
    (level = 'member' AND parent_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_missions_organization_id ON missions(organization_id);
CREATE INDEX idx_missions_parent_id ON missions(parent_id);
CREATE INDEX idx_missions_owner_id ON missions(owner_id);
CREATE INDEX idx_missions_level ON missions(level);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_dates ON missions(start_date, end_date);

-- RLS Policies
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- 同じ組織のユーザーはミッションを閲覧可能
CREATE POLICY "Users can view missions in their organization"
  ON missions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ユーザーは自分のミッションを作成・更新可能
CREATE POLICY "Users can manage their own missions"
  ON missions FOR ALL
  TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- マネージャーは部下のミッションを管理可能
CREATE POLICY "Managers can manage their team's missions"
  ON missions FOR ALL
  TO authenticated
  USING (
    owner_id IN (
      SELECT gm.user_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN users u ON u.id = g.manager_id
      WHERE u.auth_id = auth.uid()
    )
  );


-- ============================================================
-- 6. KEY_RESULTS TABLE
-- ============================================================
-- KR（成果指標）- 定量・定性の両方に対応
CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('quantitative', 'qualitative')),

  -- 定量指標用フィールド
  target_value DECIMAL(15, 2), -- 目標値
  current_value DECIMAL(15, 2) DEFAULT 0, -- 現在値
  unit TEXT, -- 単位（例: "件", "円", "%"）

  -- 定性指標用フィールド
  is_completed BOOLEAN DEFAULT false, -- 完了フラグ

  -- 共通フィールド
  weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10), -- 重み付け
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'at_risk')
  ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約: 定量指標は目標値と単位が必須
  CONSTRAINT check_quantitative_fields CHECK (
    (type = 'quantitative' AND target_value IS NOT NULL AND unit IS NOT NULL) OR
    (type = 'qualitative')
  )
);

-- Indexes
CREATE INDEX idx_key_results_mission_id ON key_results(mission_id);
CREATE INDEX idx_key_results_type ON key_results(type);
CREATE INDEX idx_key_results_status ON key_results(status);

-- RLS Policies
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

-- ミッションを閲覧できるユーザーはKRも閲覧可能
CREATE POLICY "Users can view key results of accessible missions"
  ON key_results FOR SELECT
  TO authenticated
  USING (
    mission_id IN (
      SELECT m.id FROM missions m
      JOIN users u ON u.organization_id = m.organization_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ミッションのオーナーはKRを管理可能
CREATE POLICY "Mission owners can manage their key results"
  ON key_results FOR ALL
  TO authenticated
  USING (
    mission_id IN (
      SELECT m.id FROM missions m
      JOIN users u ON u.id = m.owner_id
      WHERE u.auth_id = auth.uid()
    )
  );


-- ============================================================
-- 7. CALENDAR_EVENTS TABLE
-- ============================================================
-- Googleカレンダーから同期したイベント
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL, -- GoogleカレンダーのイベントID
  calendar_id TEXT NOT NULL, -- Googleカレンダーの識別子

  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB DEFAULT '[]', -- 参加者リスト

  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約: 終了時刻は開始時刻より後
  CONSTRAINT check_event_times CHECK (end_time > start_time),

  -- 制約: 同じユーザーで同じGoogleイベントIDは1つだけ
  UNIQUE(user_id, google_event_id)
);

-- Indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_google_event_id ON calendar_events(google_event_id);
CREATE INDEX idx_calendar_events_times ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_synced_at ON calendar_events(synced_at);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のカレンダーイベントを閲覧可能
CREATE POLICY "Users can view their own calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- マネージャーは部下のカレンダーイベントを閲覧可能
CREATE POLICY "Managers can view their team's calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT gm.user_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN users u ON u.id = g.manager_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- カレンダーイベントはシステムのみが作成・更新
-- （ユーザーは直接編集不可、Google Calendar同期経由のみ）


-- ============================================================
-- 8. TIME_ENTRIES TABLE
-- ============================================================
-- 時間記録（カレンダーイベントとミッションの紐づけ）
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL, -- NULLの場合は未分類
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  -- 時間情報
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED, -- 自動計算される時間（分）

  -- 分類情報
  category TEXT, -- カテゴリ（例: "会議", "開発", "営業"）
  note TEXT, -- メモ

  -- 自動分類
  is_auto_classified BOOLEAN DEFAULT false, -- AIによる自動分類フラグ
  classification_confidence DECIMAL(3, 2), -- 分類の信頼度（0.00〜1.00）

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約: 終了時刻は開始時刻より後
  CONSTRAINT check_time_entry_times CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_mission_id ON time_entries(mission_id);
CREATE INDEX idx_time_entries_calendar_event_id ON time_entries(calendar_event_id);
CREATE INDEX idx_time_entries_times ON time_entries(start_time, end_time);
CREATE INDEX idx_time_entries_category ON time_entries(category);
CREATE INDEX idx_time_entries_is_auto_classified ON time_entries(is_auto_classified);

-- RLS Policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の時間記録を閲覧・管理可能
CREATE POLICY "Users can manage their own time entries"
  ON time_entries FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- マネージャーは部下の時間記録を閲覧可能
CREATE POLICY "Managers can view their team's time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT gm.user_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN users u ON u.id = g.manager_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 経営者は全員の時間記録を閲覧可能
CREATE POLICY "Executives can view all time entries in their organization"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT u1.id FROM users u1
      WHERE u1.organization_id IN (
        SELECT u2.organization_id FROM users u2
        WHERE u2.auth_id = auth.uid() AND u2.role = 'executive'
      )
    )
  );


-- ============================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================

-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON key_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ミッションの進捗率を計算する関数
CREATE OR REPLACE FUNCTION calculate_mission_progress(mission_uuid UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  total_weight INTEGER;
  completed_weight INTEGER;
BEGIN
  -- 全KRの重み付け合計
  SELECT COALESCE(SUM(weight), 0) INTO total_weight
  FROM key_results
  WHERE mission_id = mission_uuid;

  -- 完了したKRの重み付け合計
  SELECT COALESCE(SUM(weight), 0) INTO completed_weight
  FROM key_results
  WHERE mission_id = mission_uuid
    AND (
      (type = 'qualitative' AND is_completed = true) OR
      (type = 'quantitative' AND current_value >= target_value)
    );

  -- 進捗率を計算（0〜100%）
  IF total_weight = 0 THEN
    RETURN 0;
  ELSE
    RETURN ROUND((completed_weight::DECIMAL / total_weight::DECIMAL) * 100, 2);
  END IF;
END;
$$ LANGUAGE plpgsql;


-- ユーザーの時間配分サマリーを取得する関数
CREATE OR REPLACE FUNCTION get_user_time_summary(
  target_user_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  mission_id UUID,
  mission_title TEXT,
  total_minutes INTEGER,
  percentage DECIMAL(5, 2)
) AS $$
DECLARE
  total_time INTEGER;
BEGIN
  -- 期間内の総時間を計算
  SELECT COALESCE(SUM(duration_minutes), 0) INTO total_time
  FROM time_entries
  WHERE user_id = target_user_id
    AND start_time >= start_date
    AND end_time <= end_date;

  -- ミッションごとの時間配分を返す
  RETURN QUERY
  SELECT
    te.mission_id,
    COALESCE(m.title, '未分類') AS mission_title,
    SUM(te.duration_minutes)::INTEGER AS total_minutes,
    CASE
      WHEN total_time = 0 THEN 0
      ELSE ROUND((SUM(te.duration_minutes)::DECIMAL / total_time::DECIMAL) * 100, 2)
    END AS percentage
  FROM time_entries te
  LEFT JOIN missions m ON m.id = te.mission_id
  WHERE te.user_id = target_user_id
    AND te.start_time >= start_date
    AND te.end_time <= end_date
  GROUP BY te.mission_id, m.title
  ORDER BY total_minutes DESC;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 10. INITIAL DATA (Optional)
-- ============================================================

-- サンプル組織の作成（開発環境用）
-- INSERT INTO organizations (name, slug) VALUES
-- ('サンプル株式会社', 'sample-company');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
