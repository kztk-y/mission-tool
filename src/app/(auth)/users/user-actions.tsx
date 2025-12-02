"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { deleteUser, updateUserRole, toggleUserActive } from "./actions";
import { MoreHorizontal } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: "executive" | "manager" | "member";
  is_active: boolean;
};

type UserActionsProps = {
  user: User;
};

export function UserActions({ user }: UserActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(user.role);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteUser = async () => {
    setIsLoading(true);
    const result = await deleteUser(user.id);
    setIsLoading(false);

    if (result.success) {
      setShowDeleteDialog(false);
    } else {
      alert(`削除に失敗しました: ${result.error}`);
    }
  };

  const handleUpdateRole = async () => {
    setIsLoading(true);
    const result = await updateUserRole({
      userId: user.id,
      role: selectedRole as "executive" | "manager" | "member",
    });
    setIsLoading(false);

    if (result.success) {
      setShowRoleDialog(false);
    } else {
      alert(`役割変更に失敗しました: ${result.error}`);
    }
  };

  const handleToggleActive = async () => {
    setIsLoading(true);
    const result = await toggleUserActive(user.id, !user.is_active);
    setIsLoading(false);

    if (!result.success) {
      alert(`ステータス変更に失敗しました: ${result.error}`);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowRoleDialog(true)}
            className="rounded-lg cursor-pointer"
          >
            🔄 役割を変更
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleActive}
            disabled={isLoading}
            className="rounded-lg cursor-pointer"
          >
            {user.is_active ? "⊘ 非アクティブにする" : "✓ アクティブにする"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 rounded-lg cursor-pointer focus:text-red-600"
          >
            🗑️ 削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 役割変更ダイアログ */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>役割を変更</DialogTitle>
            <DialogDescription>
              {user.name} さんの役割を変更します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">新しい役割</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="executive" className="rounded-lg">
                    👑 経営者
                  </SelectItem>
                  <SelectItem value="manager" className="rounded-lg">
                    ⭐ 管理者
                  </SelectItem>
                  <SelectItem value="member" className="rounded-lg">
                    👤 メンバー
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              disabled={isLoading}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={isLoading || selectedRole === user.role}
              className="rounded-xl"
            >
              {isLoading ? "変更中..." : "変更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>ユーザーを削除</DialogTitle>
            <DialogDescription>
              本当に {user.name} さんを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            ⚠️ 削除すると、このユーザーに関連するすべてのデータが削除されます。
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="rounded-xl"
            >
              {isLoading ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
