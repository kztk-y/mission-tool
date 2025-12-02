# Implementation Examples - Mission Management Tool

このドキュメントでは、Supabaseスキーマを活用した実装例を紹介します。

---

## セットアップ

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

### 2. プロジェクトの初期化

```bash
# Supabaseプロジェクトとリンク
supabase login
supabase link --project-ref your-project-ref

# スキーマの適用
supabase db push < database-schema.sql
```

### 3. Supabase JavaScriptクライアントのセットアップ

```bash
npm install @supabase/supabase-js
```

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

## 基本的なCRUD操作

### ユーザーの取得

```typescript
// lib/queries/users.ts
import { supabase } from '@/lib/supabase';

/**
 * 現在ログイン中のユーザー情報を取得
 */
export async function getCurrentUser() {
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('auth_id', authUser.id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * 組織内の全ユーザーを取得
 */
export async function getOrganizationUsers(organizationId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  return { data, error };
}
```

---

### ミッションの作成

```typescript
// lib/mutations/missions.ts
import { supabase } from '@/lib/supabase';
import type { MissionInsert } from '@/lib/database-types';

/**
 * 新しいミッションを作成
 */
export async function createMission(mission: MissionInsert) {
  const { data, error } = await supabase
    .from('missions')
    .insert(mission)
    .select()
    .single();

  if (error) {
    console.error('Error creating mission:', error);
    throw new Error('Failed to create mission');
  }

  return data;
}

/**
 * 会社レベルミッションの作成（経営者のみ）
 */
export async function createCompanyMission(
  organizationId: string,
  ownerId: string,
  title: string,
  description: string,
  startDate: string,
  endDate: string
) {
  return createMission({
    organization_id: organizationId,
    owner_id: ownerId,
    title,
    description,
    level: 'company',
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    parent_id: null, // 会社レベルは親なし
  });
}

/**
 * 管理者ミッションの作成
 */
export async function createManagerMission(
  organizationId: string,
  managerId: string,
  parentMissionId: string,
  title: string,
  description: string,
  startDate: string,
  endDate: string
) {
  return createMission({
    organization_id: organizationId,
    owner_id: managerId,
    parent_id: parentMissionId,
    title,
    description,
    level: 'manager',
    status: 'active',
    start_date: startDate,
    end_date: endDate,
  });
}
```

---

### ミッションの階層構造取得

```typescript
// lib/queries/missions.ts
import { supabase } from '@/lib/supabase';

/**
 * 会社レベルのミッションを全て取得（子ミッション含む）
 */
export async function getCompanyMissionsWithHierarchy(organizationId: string) {
  // 会社レベルのミッション
  const { data: companyMissions, error: companyError } = await supabase
    .from('missions')
    .select(`
      *,
      owner:users(*),
      key_results(*)
    `)
    .eq('organization_id', organizationId)
    .eq('level', 'company')
    .order('start_date', { ascending: false });

  if (companyError) {
    throw new Error('Failed to fetch company missions');
  }

  // 各会社ミッションの子ミッションを取得
  const missionsWithChildren = await Promise.all(
    companyMissions.map(async (mission) => {
      const { data: managerMissions } = await supabase
        .from('missions')
        .select(`
          *,
          owner:users(*),
          key_results(*)
        `)
        .eq('parent_id', mission.id)
        .order('start_date', { ascending: false });

      // さらに各管理者ミッションの子ミッション（メンバーミッション）を取得
      const managerMissionsWithChildren = await Promise.all(
        (managerMissions || []).map(async (managerMission) => {
          const { data: memberMissions } = await supabase
            .from('missions')
            .select(`
              *,
              owner:users(*),
              key_results(*)
            `)
            .eq('parent_id', managerMission.id)
            .order('start_date', { ascending: false });

          return {
            ...managerMission,
            children: memberMissions || [],
          };
        })
      );

      return {
        ...mission,
        children: managerMissionsWithChildren,
      };
    })
  );

  return missionsWithChildren;
}

/**
 * ユーザーのミッション一覧を取得
 */
export async function getUserMissions(userId: string) {
  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      parent:missions(*),
      key_results(*)
    `)
    .eq('owner_id', userId)
    .order('start_date', { ascending: false });

  return { data, error };
}
```

---

### KR（成果指標）の管理

```typescript
// lib/mutations/key-results.ts
import { supabase } from '@/lib/supabase';
import type { KeyResultInsert, KeyResultUpdate } from '@/lib/database-types';

/**
 * 定量KRの作成
 */
export async function createQuantitativeKR(
  missionId: string,
  title: string,
  targetValue: number,
  unit: string,
  weight: number = 1
) {
  const kr: KeyResultInsert = {
    mission_id: missionId,
    title,
    type: 'quantitative',
    target_value: targetValue,
    current_value: 0,
    unit,
    weight,
    status: 'not_started',
  };

  const { data, error } = await supabase
    .from('key_results')
    .insert(kr)
    .select()
    .single();

  return { data, error };
}

/**
 * 定性KRの作成
 */
export async function createQualitativeKR(
  missionId: string,
  title: string,
  weight: number = 1
) {
  const kr: KeyResultInsert = {
    mission_id: missionId,
    title,
    type: 'qualitative',
    is_completed: false,
    weight,
    status: 'not_started',
  };

  const { data, error } = await supabase
    .from('key_results')
    .insert(kr)
    .select()
    .single();

  return { data, error };
}

/**
 * KRの進捗更新
 */
export async function updateKRProgress(
  krId: string,
  currentValue?: number,
  isCompleted?: boolean
) {
  const update: KeyResultUpdate = {};

  if (currentValue !== undefined) {
    update.current_value = currentValue;
    update.status = 'in_progress';
  }

  if (isCompleted !== undefined) {
    update.is_completed = isCompleted;
    update.status = isCompleted ? 'completed' : 'in_progress';
  }

  const { data, error } = await supabase
    .from('key_results')
    .update(update)
    .eq('id', krId)
    .select()
    .single();

  return { data, error };
}

/**
 * ミッションの進捗率を取得
 */
export async function getMissionProgress(missionId: string) {
  const { data, error } = await supabase.rpc('calculate_mission_progress', {
    mission_uuid: missionId,
  });

  return { progress: data, error };
}
```

---

### 時間記録の管理

```typescript
// lib/queries/time-entries.ts
import { supabase } from '@/lib/supabase';
import type { TimeEntryInsert } from '@/lib/database-types';

/**
 * 時間記録を作成（手動）
 */
export async function createTimeEntry(
  userId: string,
  missionId: string | null,
  startTime: string,
  endTime: string,
  category?: string,
  note?: string
) {
  const entry: TimeEntryInsert = {
    user_id: userId,
    mission_id: missionId,
    start_time: startTime,
    end_time: endTime,
    category,
    note,
    is_auto_classified: false,
  };

  const { data, error } = await supabase
    .from('time_entries')
    .insert(entry)
    .select()
    .single();

  return { data, error };
}

/**
 * カレンダーイベントから時間記録を自動作成
 */
export async function createTimeEntryFromCalendar(
  calendarEventId: string,
  missionId: string | null,
  classificationConfidence?: number
) {
  // カレンダーイベントを取得
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', calendarEventId)
    .single();

  if (eventError || !event) {
    return { data: null, error: eventError };
  }

  // 時間記録を作成
  const entry: TimeEntryInsert = {
    user_id: event.user_id,
    mission_id: missionId,
    calendar_event_id: calendarEventId,
    start_time: event.start_time,
    end_time: event.end_time,
    is_auto_classified: true,
    classification_confidence: classificationConfidence,
  };

  const { data, error } = await supabase
    .from('time_entries')
    .insert(entry)
    .select()
    .single();

  return { data, error };
}

/**
 * ユーザーの時間配分サマリーを取得
 */
export async function getUserTimeSummary(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase.rpc('get_user_time_summary', {
    target_user_id: userId,
    start_date: startDate,
    end_date: endDate,
  });

  return { data, error };
}

/**
 * 期間内の時間記録を取得
 */
export async function getTimeEntries(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      mission:missions(id, title),
      calendar_event:calendar_events(title)
    `)
    .eq('user_id', userId)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .order('start_time', { ascending: false });

  return { data, error };
}
```

---

### グループ管理

```typescript
// lib/mutations/groups.ts
import { supabase } from '@/lib/supabase';

/**
 * グループを作成
 */
export async function createGroup(
  organizationId: string,
  managerId: string,
  name: string,
  description?: string
) {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      organization_id: organizationId,
      manager_id: managerId,
      name,
      description,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * グループにメンバーを追加
 */
export async function addGroupMember(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * グループのメンバー一覧を取得
 */
export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('group_id', groupId);

  return { data, error };
}

/**
 * マネージャーのグループ一覧を取得
 */
export async function getManagerGroups(managerId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      members:group_members(
        user:users(*)
      )
    `)
    .eq('manager_id', managerId);

  return { data, error };
}
```

---

## React Hooks の実装例

### useCurrentUser

```typescript
// hooks/useCurrentUser.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/database-types';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      setUser(data);
      setLoading(false);
    }

    fetchUser();

    // リアルタイム更新のリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
```

---

### useMissions

```typescript
// hooks/useMissions.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/database-types';

export function useMissions(userId: string) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMissions() {
      const { data } = await supabase
        .from('missions')
        .select('*')
        .eq('owner_id', userId)
        .order('start_date', { ascending: false });

      if (data) {
        setMissions(data);
      }
      setLoading(false);
    }

    fetchMissions();

    // リアルタイム更新
    const channel = supabase
      .channel('missions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          fetchMissions();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { missions, loading };
}
```

---

### useTimeSummary

```typescript
// hooks/useTimeSummary.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserTimeSummary } from '@/lib/database-types';

export function useTimeSummary(
  userId: string,
  startDate: string,
  endDate: string
) {
  const [summary, setSummary] = useState<UserTimeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      const { data } = await supabase.rpc('get_user_time_summary', {
        target_user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });

      if (data) {
        setSummary(data);
      }
      setLoading(false);
    }

    fetchSummary();
  }, [userId, startDate, endDate]);

  return { summary, loading };
}
```

---

## ダッシュボードの実装例

### 時間配分ダッシュボード

```typescript
// components/TimeAllocationDashboard.tsx
import { useTimeSummary } from '@/hooks/useTimeSummary';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function TimeAllocationDashboard() {
  const { user } = useCurrentUser();
  const { summary, loading } = useTimeSummary(
    user?.id || '',
    '2024-01-01',
    '2024-12-31'
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalMinutes = summary.reduce((sum, item) => sum + item.total_minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">時間配分</h2>
      <p className="text-gray-600 mb-6">総計: {totalHours}時間</p>

      <div className="space-y-4">
        {summary.map((item) => (
          <div key={item.mission_id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{item.mission_title}</h3>
              <span className="text-gray-600">
                {(item.total_minutes / 60).toFixed(1)}h ({item.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### ミッション進捗表示

```typescript
// components/MissionProgress.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  missionId: string;
  missionTitle: string;
}

export function MissionProgress({ missionId, missionTitle }: Props) {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    async function fetchProgress() {
      const { data } = await supabase.rpc('calculate_mission_progress', {
        mission_uuid: missionId,
      });

      if (data !== null) {
        setProgress(data);
      }
    }

    fetchProgress();
  }, [missionId]);

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{missionTitle}</h3>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
```

---

## Google Calendar 連携の実装例

### カレンダー同期

```typescript
// lib/google-calendar.ts
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';

/**
 * Google Calendarのイベントを同期
 */
export async function syncGoogleCalendar(
  userId: string,
  accessToken: string
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // 過去30日〜未来30日のイベントを取得
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  // Supabaseに保存
  for (const event of events) {
    if (!event.id || !event.summary) continue;

    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;

    if (!startTime || !endTime) continue;

    await supabase
      .from('calendar_events')
      .upsert({
        user_id: userId,
        google_event_id: event.id,
        calendar_id: 'primary',
        title: event.summary,
        description: event.description || null,
        start_time: startTime,
        end_time: endTime,
        is_all_day: !event.start?.dateTime,
        location: event.location || null,
        attendees: event.attendees?.map(a => ({
          email: a.email || '',
          name: a.displayName,
          response_status: a.responseStatus,
        })) || [],
      });
  }

  return events.length;
}
```

---

## セキュリティベストプラクティス

### 環境変数の設定

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### RLSポリシーのテスト

```sql
-- RLSポリシーをテスト（SQL Editorで実行）

-- ユーザーAとしてログイン
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-a-auth-id"}';

-- ユーザーAのミッションのみ取得できることを確認
SELECT * FROM missions;

-- 他のユーザーのミッションは取得できないことを確認
SELECT * FROM missions WHERE owner_id = 'user-b-id'; -- 空の結果
```

---

## トラブルシューティング

### よくあるエラー

#### 1. RLSポリシーで403エラー

```typescript
// 原因: ユーザーが認証されていない
// 解決: ログイン状態を確認

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // ログインページにリダイレクト
}
```

#### 2. 外部キー制約エラー

```typescript
// 原因: 存在しないIDを参照
// 解決: IDの存在確認

const { data: mission } = await supabase
  .from('missions')
  .select('id')
  .eq('id', missionId)
  .single();

if (!mission) {
  throw new Error('Mission not found');
}
```

#### 3. 型エラー

```typescript
// 原因: 型定義とDBスキーマの不一致
// 解決: Supabase CLIで型を再生成

// npx supabase gen types typescript --project-id your-project-id > database-types.ts
```

---

## まとめ

このドキュメントでは、以下の実装例を紹介しました:

1. ✅ 基本的なCRUD操作
2. ✅ 階層構造のミッション取得
3. ✅ KRの管理と進捗計算
4. ✅ 時間記録の管理
5. ✅ グループ管理
6. ✅ React Hooks
7. ✅ ダッシュボードUI
8. ✅ Google Calendar連携
9. ✅ セキュリティ対策

これらの例を参考に、プロジェクトの実装を進めてください。
