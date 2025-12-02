"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function deleteMission(missionId: string) {
  try {
    const supabase = await createClient();

    // ミッションを削除（Key Resultsも CASCADE で削除される）
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", missionId);

    if (error) {
      console.error("Delete mission error:", error);
      return { error: error.message };
    }

    // キャッシュを無効化
    revalidatePath("/missions");
    return { success: true };
  } catch (error) {
    console.error("Delete mission exception:", error);
    return { error: "削除中にエラーが発生しました" };
  }
}

export async function updateMission(
  missionId: string,
  data: {
    title: string;
    description?: string;
    level: string;
    status: string;
    start_date: string;
    end_date: string;
  }
) {
  try {
    const supabase = await createClient();

    // ミッション情報を更新
    const { error } = await supabase
      .from("missions")
      .update({
        title: data.title,
        description: data.description || null,
        level: data.level,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
      })
      .eq("id", missionId);

    if (error) {
      console.error("Update mission error:", error);
      return { error: error.message };
    }

    // キャッシュを無効化
    revalidatePath("/missions");
    revalidatePath(`/missions/${missionId}`);
    revalidatePath(`/missions/${missionId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Update mission exception:", error);
    return { error: "更新中にエラーが発生しました" };
  }
}

// ==================== Key Result関連のアクション ====================

// Key Result作成のバリデーションスキーマ
const createKeyResultSchema = z.object({
  mission_id: z.string().uuid(),
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  type: z.enum(["quantitative", "qualitative"]),
  target_value: z.number().min(0).optional(),
  current_value: z.number().min(0).default(0),
  unit: z.string().optional(),
  weight: z.number().min(1).default(1),
});

// Key Result更新のバリデーションスキーマ
const updateKeyResultSchema = z.object({
  id: z.string().uuid(),
  current_value: z.number().min(0).optional(),
  is_completed: z.boolean().optional(),
});

// Key Result作成アクション
export async function createKeyResult(formData: FormData) {
  const supabase = await createClient();

  // FormDataをオブジェクトに変換
  const data = {
    mission_id: formData.get("mission_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    type: formData.get("type") as "quantitative" | "qualitative",
    target_value: formData.get("target_value")
      ? Number(formData.get("target_value"))
      : undefined,
    current_value: formData.get("current_value")
      ? Number(formData.get("current_value"))
      : 0,
    unit: formData.get("unit") as string || undefined,
    weight: formData.get("weight")
      ? Number(formData.get("weight"))
      : 1,
  };

  // バリデーション
  const validated = createKeyResultSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0].message,
    };
  }

  // Supabaseに挿入
  const { data: newKeyResult, error } = await supabase
    .from("key_results")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating key result:", error);
    return {
      success: false,
      error: "Key Resultの作成に失敗しました",
    };
  }

  // キャッシュを再検証
  revalidatePath(`/missions/${validated.data.mission_id}`);
  revalidatePath("/missions");

  return {
    success: true,
    data: newKeyResult,
  };
}

// Key Result進捗更新アクション
export async function updateKeyResultProgress(formData: FormData) {
  const supabase = await createClient();

  const data = {
    id: formData.get("id") as string,
    current_value: formData.get("current_value")
      ? Number(formData.get("current_value"))
      : undefined,
    is_completed: formData.get("is_completed") === "true" || undefined,
  };

  // バリデーション
  const validated = updateKeyResultSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0].message,
    };
  }

  // 更新データを準備（undefinedを除外）
  const updateData: Record<string, any> = {};
  if (validated.data.current_value !== undefined) {
    updateData.current_value = validated.data.current_value;
  }
  if (validated.data.is_completed !== undefined) {
    updateData.is_completed = validated.data.is_completed;
  }

  // Supabaseを更新
  const { data: updatedKeyResult, error } = await supabase
    .from("key_results")
    .update(updateData)
    .eq("id", validated.data.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating key result:", error);
    return {
      success: false,
      error: "進捗の更新に失敗しました",
    };
  }

  // mission_idを取得してキャッシュを再検証
  const missionId = updatedKeyResult.mission_id;
  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/missions");

  return {
    success: true,
    data: updatedKeyResult,
  };
}

// Key Result削除アクション
export async function deleteKeyResult(id: string) {
  const supabase = await createClient();

  // 削除前にmission_idを取得
  const { data: keyResult } = await supabase
    .from("key_results")
    .select("mission_id")
    .eq("id", id)
    .single();

  if (!keyResult) {
    return {
      success: false,
      error: "Key Resultが見つかりません",
    };
  }

  // 削除実行
  const { error } = await supabase
    .from("key_results")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting key result:", error);
    return {
      success: false,
      error: "削除に失敗しました",
    };
  }

  // キャッシュを再検証
  revalidatePath(`/missions/${keyResult.mission_id}`);
  revalidatePath("/missions");

  return {
    success: true,
  };
}
