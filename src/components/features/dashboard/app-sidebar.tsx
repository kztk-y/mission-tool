"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/dashboard",
    icon: "📊",
    description: "全体の状況を確認",
  },
  {
    title: "ミッション",
    url: "/missions",
    icon: "🎯",
    description: "OKR・目標管理",
  },
  {
    title: "カレンダー",
    url: "/calendar",
    icon: "📅",
    description: "予定を確認",
  },
  {
    title: "レポート",
    url: "/reports",
    icon: "📈",
    description: "時間集計・分析",
  },
  {
    title: "メンバー",
    url: "/members",
    icon: "👥",
    description: "チーム管理",
  },
  {
    title: "インポート",
    url: "/import",
    icon: "📥",
    description: "データ取込",
  },
];

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const userInitial = user.email?.charAt(0).toUpperCase() || "U";
  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b-0 p-5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-lg shadow-pop">
            M
          </div>
          <div>
            <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              Mission Tool
            </span>
            <p className="text-xs text-muted-foreground">時間を可視化する</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            メニュー
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        rounded-xl h-12 px-3 transition-all duration-200
                        ${isActive
                          ? "bg-primary text-white shadow-pop hover:bg-primary/90"
                          : "hover:bg-secondary hover:translate-x-1"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          {!isActive && (
                            <span className="text-[10px] text-muted-foreground leading-tight">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* クイックアクション */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            クイックアクション
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <Link href="/missions/new">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <span className="text-lg">✨</span>
                <span>新しいミッションを作成</span>
              </Button>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t-0 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-14 rounded-xl hover:bg-secondary transition-all"
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-white font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{userName}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl">
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              ⚙️ 設定
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
            >
              🚪 ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
