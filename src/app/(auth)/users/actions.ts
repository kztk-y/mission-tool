"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 開発環境用の固定organization_id
const DEV_ORG_ID = "11111111-1111-1111-1111-111111111111";

type CreateUserInput = {
  email: string;
  name: string;
  role: "executive" | "manager" | "member";
};

type UpdateUserRoleInput = {
  userId: string;
  role: "executive" | "manager" | "member";
};

/**
 * 新規ユーザーを作成（招待）
 */
export async function createUser(input: CreateUserInput) {
  try {
    const supabase = await createClient();

    // ユーザーを作成
    const { data, error } = await supabase
      .from("users")
      .insert({
        organization_id: DEV_ORG_ID,
        email: input.email,
        name: input.name,
        role: input.role,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/users");
    return { success: true, data };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message || "予期しないエラーが発生しました" };
  }
}

/**
 * ユーザーの役割を変更
 */
export async function updateUserRole(input: UpdateUserRoleInput) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ role: input.role })
      .eq("id", input.userId)
      .eq("organization_id", DEV_ORG_ID);

    if (error) {
      console.error("Error updating user role:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message || "予期しないエラーが発生しました" };
  }
}

/**
 * ユーザーを削除
 */
export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)
      .eq("organization_id", DEV_ORG_ID);

    if (error) {
      console.error("Error deleting user:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message || "予期しないエラーが発生しました" };
  }
}

/**
 * ユーザーのアクティブ状態を切り替え
 */
export async function toggleUserActive(userId: string, isActive: boolean) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ is_active: isActive })
      .eq("id", userId)
      .eq("organization_id", DEV_ORG_ID);

    if (error) {
      console.error("Error toggling user active state:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message || "予期しないエラーが発生しました" };
  }
}
