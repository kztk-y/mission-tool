import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/features/dashboard/app-sidebar";

export const dynamic = "force-dynamic";

// 開発用ダミーユーザー
const devUser = {
  id: "dev-user-id",
  email: "kazu@example.com",
  user_metadata: {
    avatar_url: null,
    name: "kazu",
  },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 開発環境では認証をスキップ
  // 本番では以下のコードを有効化:
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect("/login");

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={devUser as any} />
        <main className="flex-1 bg-background">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
            <SidebarTrigger className="rounded-xl hover:bg-secondary" />
            <div className="flex-1" />
            {/* 将来的に検索バーや通知を追加 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                今日も頑張りましょう！ 💪
              </span>
            </div>
          </header>
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
