import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// デモデータ
const members = [
  {
    id: "1",
    name: "田中 太郎",
    email: "tanaka@example.com",
    role: "manager",
    group: "営業部",
    totalHours: 160,
    trackedHours: 148,
    topMissions: ["営業活動", "ミーティング"],
  },
  {
    id: "2",
    name: "佐藤 花子",
    email: "sato@example.com",
    role: "member",
    group: "営業部",
    totalHours: 160,
    trackedHours: 155,
    topMissions: ["営業活動"],
  },
  {
    id: "3",
    name: "鈴木 一郎",
    email: "suzuki@example.com",
    role: "manager",
    group: "開発部",
    totalHours: 160,
    trackedHours: 142,
    topMissions: ["プロダクト開発", "コードレビュー"],
  },
  {
    id: "4",
    name: "高橋 美咲",
    email: "takahashi@example.com",
    role: "member",
    group: "開発部",
    totalHours: 160,
    trackedHours: 158,
    topMissions: ["プロダクト開発"],
  },
];

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
  manager: { label: "管理者", variant: "default" },
  member: { label: "メンバー", variant: "secondary" },
};

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">メンバー</h1>
          <p className="text-muted-foreground">
            チームメンバーの稼働状況を確認
          </p>
        </div>
        <Button>メンバー招待</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総メンバー数</CardDescription>
            <CardTitle className="text-4xl">{members.length}名</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>管理者</CardDescription>
            <CardTitle className="text-4xl">
              {members.filter((m) => m.role === "manager").length}名
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均トラッキング率</CardDescription>
            <CardTitle className="text-4xl">
              {Math.round(
                members.reduce(
                  (acc, m) => acc + (m.trackedHours / m.totalHours) * 100,
                  0
                ) / members.length
              )}
              %
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>グループ数</CardDescription>
            <CardTitle className="text-4xl">
              {new Set(members.map((m) => m.group)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>メンバー一覧</CardTitle>
          <CardDescription>メンバーの稼働状況とミッション</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メンバー</TableHead>
                <TableHead>グループ</TableHead>
                <TableHead>役割</TableHead>
                <TableHead>トラッキング率</TableHead>
                <TableHead>主なミッション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const trackingRate = Math.round(
                  (member.trackedHours / member.totalHours) * 100
                );
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.group}</TableCell>
                    <TableCell>
                      <Badge variant={roleLabels[member.role].variant}>
                        {roleLabels[member.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={trackingRate} className="w-20" />
                        <span className="text-sm">{trackingRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {member.topMissions.map((mission) => (
                          <Badge key={mission} variant="outline">
                            {mission}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
