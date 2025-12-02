/**
 * Mission Management Tool - Database TypeScript Types
 * Generated from Supabase schema
 */

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'executive' | 'manager' | 'member';

export type MissionLevel = 'company' | 'manager' | 'member';

export type MissionStatus = 'active' | 'completed' | 'archived' | 'on_hold';

export type KeyResultType = 'quantitative' | 'qualitative';

export type KeyResultStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk';

// ============================================================
// TABLE TYPES
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string;
  organization_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
  token_type: string | null;
  scope: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  organization_id: string;
  manager_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Mission {
  id: string;
  organization_id: string;
  parent_id: string | null;
  owner_id: string;
  title: string;
  description: string | null;
  level: MissionLevel;
  status: MissionStatus;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  mission_id: string;
  title: string;
  description: string | null;
  type: KeyResultType;
  // Quantitative fields
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  // Qualitative fields
  is_completed: boolean | null;
  // Common fields
  weight: number;
  status: KeyResultStatus;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  google_event_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  attendees: Array<{
    email: string;
    name?: string;
    response_status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  mission_id: string | null;
  calendar_event_id: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number; // Auto-calculated
  category: string | null;
  note: string | null;
  is_auto_classified: boolean;
  classification_confidence: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// INSERT TYPES (for creating new records)
// ============================================================

export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type GroupInsert = Omit<Group, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type GroupMemberInsert = Omit<GroupMember, 'id' | 'joined_at'> & {
  id?: string;
};

export type MissionInsert = Omit<Mission, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  status?: MissionStatus; // Optional with default
};

export type KeyResultInsert = Omit<KeyResult, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  current_value?: number; // Optional with default
  is_completed?: boolean; // Optional with default
  weight?: number; // Optional with default
  status?: KeyResultStatus; // Optional with default
};

export type CalendarEventInsert = Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'synced_at'> & {
  id?: string;
};

export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'duration_minutes'> & {
  id?: string;
  is_auto_classified?: boolean; // Optional with default
};

// ============================================================
// UPDATE TYPES (for updating existing records)
// ============================================================

export type OrganizationUpdate = Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;

export type UserUpdate = Partial<Omit<User, 'id' | 'auth_id' | 'created_at' | 'updated_at'>>;

export type GroupUpdate = Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>;

export type MissionUpdate = Partial<Omit<Mission, 'id' | 'created_at' | 'updated_at'>>;

export type KeyResultUpdate = Partial<Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>>;

export type CalendarEventUpdate = Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'synced_at'>>;

export type TimeEntryUpdate = Partial<Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'duration_minutes'>>;

// ============================================================
// RELATION TYPES (with joined data)
// ============================================================

export interface UserWithOrganization extends User {
  organization: Organization;
}

export interface GroupWithManager extends Group {
  manager: User;
}

export interface GroupWithMembers extends Group {
  members: Array<User>;
}

export interface MissionWithOwner extends Mission {
  owner: User;
}

export interface MissionWithKeyResults extends Mission {
  key_results: Array<KeyResult>;
}

export interface MissionWithChildren extends Mission {
  children: Array<Mission>;
}

export interface MissionComplete extends Mission {
  owner: User;
  key_results: Array<KeyResult>;
  children: Array<Mission>;
  parent: Mission | null;
}

export interface TimeEntryWithRelations extends TimeEntry {
  user: User;
  mission: Mission | null;
  calendar_event: CalendarEvent | null;
}

// ============================================================
// FUNCTION RETURN TYPES
// ============================================================

export interface UserTimeSummary {
  mission_id: string | null;
  mission_title: string;
  total_minutes: number;
  percentage: number; // 0.00 - 100.00
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Supabase query result type
 */
export type SupabaseResult<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Supabase array query result type
 */
export type SupabaseArrayResult<T> = {
  data: T[] | null;
  error: Error | null;
};

/**
 * Progress calculation result
 */
export interface MissionProgress {
  mission_id: string;
  progress_percentage: number; // 0.00 - 100.00
  completed_kr_count: number;
  total_kr_count: number;
}

/**
 * Dashboard summary
 */
export interface DashboardSummary {
  total_missions: number;
  active_missions: number;
  completed_missions: number;
  total_time_this_week: number; // minutes
  time_by_mission: UserTimeSummary[];
}

/**
 * Team member summary
 */
export interface TeamMemberSummary {
  user: User;
  total_time_this_week: number; // minutes
  active_missions: number;
  mission_distribution: UserTimeSummary[];
}

// ============================================================
// VALIDATION SCHEMAS (with Zod - recommended)
// ============================================================

/**
 * Example Zod schemas for runtime validation
 * Install: npm install zod
 */

/*
import { z } from 'zod';

export const UserRoleSchema = z.enum(['executive', 'manager', 'member']);

export const MissionSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  owner_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  level: z.enum(['company', 'manager', 'member']),
  status: z.enum(['active', 'completed', 'archived', 'on_hold']),
  start_date: z.string().date(),
  end_date: z.string().date(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).refine(data => new Date(data.end_date) >= new Date(data.start_date), {
  message: "End date must be after start date"
});

export const KeyResultSchema = z.object({
  id: z.string().uuid(),
  mission_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  type: z.enum(['quantitative', 'qualitative']),
  target_value: z.number().nullable(),
  current_value: z.number().nullable(),
  unit: z.string().nullable(),
  is_completed: z.boolean().nullable(),
  weight: z.number().int().min(1).max(10),
  status: z.enum(['not_started', 'in_progress', 'completed', 'at_risk']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).refine(data => {
  if (data.type === 'quantitative') {
    return data.target_value !== null && data.unit !== null;
  }
  return true;
}, {
  message: "Quantitative KR must have target_value and unit"
});
*/

// ============================================================
// DATABASE HELPER TYPES
// ============================================================

/**
 * Database tables type map
 */
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      groups: {
        Row: Group;
        Insert: GroupInsert;
        Update: GroupUpdate;
      };
      group_members: {
        Row: GroupMember;
        Insert: GroupMemberInsert;
        Update: Partial<GroupMember>;
      };
      missions: {
        Row: Mission;
        Insert: MissionInsert;
        Update: MissionUpdate;
      };
      key_results: {
        Row: KeyResult;
        Insert: KeyResultInsert;
        Update: KeyResultUpdate;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: CalendarEventInsert;
        Update: CalendarEventUpdate;
      };
      time_entries: {
        Row: TimeEntry;
        Insert: TimeEntryInsert;
        Update: TimeEntryUpdate;
      };
    };
    Functions: {
      calculate_mission_progress: {
        Args: { mission_uuid: string };
        Returns: number;
      };
      get_user_time_summary: {
        Args: {
          target_user_id: string;
          start_date: string;
          end_date: string;
        };
        Returns: UserTimeSummary[];
      };
    };
  };
}

// Types are exported inline above
