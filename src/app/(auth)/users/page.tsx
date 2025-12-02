import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { UserActions } from "./user-actions";

// 開発環境用の固定organization_id
const DEV_ORG_ID = "11111111-1111-1111-1111-111111111111";

type User = {
  id: string;
  email: string;
  name: string;
  role: "executive" | "manager" | "member";
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
};

// 役割ラベルとカラー設定
const roleConfig = {
  executive: { label: "経営者", emoji: "👑", color: "bg-purple-100 text-purple-700 border-purple-200" },
  manager: { label: "管理者", emoji: "⭐", color: "bg-blue-100 text-blue-700 border-blue-200" },
  member: { label: "メンバー", emoji: "👤", color: "bg-green-100 text-green-700 border-green-200" },
};

async function getUsers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", DEV_ORG_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data as User[];
}

export default async function UsersPage() {
  const users = await getUsers();

  const stats = {
    total: users.length,
    executive: users.filter(u => u.role === "executive").length,
    manager: users.filter(u => u.role === "manager").length,
    member: users.filter(u => u.role === "member").length,
    active: users.filter(u => u.is_active).length,
  };

  const renderUserTable = (filteredUsers: User[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ユーザー</TableHead>
          <TableHead>メールアドレス</TableHead>
          <TableHead>役割</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>登録日</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              ユーザーが見つかりませんでした
            </TableCell>
          </TableRow>
        ) : (
          filteredUsers.map((user) => {
            const config = roleConfig[user.role];
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-border shadow-sm">
                      <AvatarFallback className="font-semibold">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${config.color} border rounded-full px-3 py-1 font-medium`}
                  >
                    <span className="mr-1">{config.emoji}</span>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 rounded-full">
                      ✓ アクティブ
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 rounded-full">
                      ⊘ 非アクティブ
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            👥 ユーザー管理
          </h1>
          <p className="text-muted-foreground mt-1">
            組織のユーザーを管理します
          </p>
        </div>
        <Button asChild className="rounded-2xl shadow-md">
          <Link href="/users/new">
            ✉️ ユーザーを招待
          </Link>
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="rounded-2xl shadow-pop border-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">総ユーザー数</CardDescription>
            <CardTitle className="text-4xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl shadow-pop border-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              👑 経営者
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-purple-600">
              {stats.executive}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl shadow-pop border-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              ⭐ 管理者
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-600">
              {stats.manager}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl shadow-pop border-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              👤 メンバー
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600">
              {stats.member}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl shadow-pop border-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">アクティブ</CardDescription>
            <CardTitle className="text-4xl font-bold text-emerald-600">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ユーザー一覧テーブル */}
      <Card className="rounded-2xl shadow-pop border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 ユーザー一覧
          </CardTitle>
          <CardDescription>役割別にフィルタリングできます</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="rounded-xl mb-4">
              <TabsTrigger value="all" className="rounded-lg">
                全員 ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="executive" className="rounded-lg">
                👑 経営者 ({stats.executive})
              </TabsTrigger>
              <TabsTrigger value="manager" className="rounded-lg">
                ⭐ 管理者 ({stats.manager})
              </TabsTrigger>
              <TabsTrigger value="member" className="rounded-lg">
                👤 メンバー ({stats.member})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderUserTable(users)}
            </TabsContent>
            <TabsContent value="executive">
              {renderUserTable(users.filter(u => u.role === "executive"))}
            </TabsContent>
            <TabsContent value="manager">
              {renderUserTable(users.filter(u => u.role === "manager"))}
            </TabsContent>
            <TabsContent value="member">
              {renderUserTable(users.filter(u => u.role === "member"))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
