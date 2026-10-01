"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  Users,
  Network,
  Shield,
  Settings,
  LogOut,
  Zap,
  Moon,
  Sun,
  Globe,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useI18n, type Locale } from "@/lib/i18n";

const LOCALES: { value: Locale; flag: string }[] = [
  { value: "en", flag: "🇺🇸" },
  { value: "vi", flag: "🇻🇳" },
  { value: "zh", flag: "🇨🇳" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    toast.success(t.auth.loggedOut);
    router.push("/login");
  }

  const navItems = [
    { key: "dashboard", label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { key: "agents", label: t.nav.agents, href: "/dashboard/agents", icon: Bot },
    { key: "workflows", label: t.nav.workflows, href: "/dashboard/workflows", icon: Workflow },
    { key: "accounts", label: t.nav.accounts, href: "/dashboard/accounts", icon: Users },
    { key: "tunnels", label: t.nav.tunnels, href: "/dashboard/tunnel", icon: Shield },
    { key: "proxies", label: t.nav.proxies, href: "/dashboard/proxies", icon: Network },
    { key: "users", label: t.nav.users, href: "/dashboard/users", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Official shadcn/ui Sidebar */}
      <aside className="w-18 sm:w-20 shrink-0 bg-card border-r border-border flex flex-col items-center py-4 justify-between shadow-xs z-30 transition-all select-none">
        {/* Top App Logo */}
        <div className="flex flex-col items-center gap-4 w-full">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-xl bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/40 flex items-center justify-center transition-all shadow-xs hover:bg-[#7B61FF]/30 group"
            title="AG Proxy"
          >
            <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-1.5 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    isActive
                      ? "bg-[#7B61FF]/20 text-[#9B87FF] font-bold shadow-xs border border-[#7B61FF]/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span className="text-[9px] tracking-tight uppercase font-medium text-center leading-none">
                    {item.key}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Dropdown */}
        <div className="flex flex-col items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex flex-col items-center gap-1 group focus:outline-none cursor-pointer"
                title={user?.username || "Admin"}
              >
                <Avatar className="h-8 w-8 ring-1 ring-border group-hover:ring-ring transition-all">
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                    {user?.username?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  {user?.username || "PROFILE"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-48 p-1 shadow-lg bg-popover border-border"
            >
              <div className="px-3 py-2 text-xs border-b border-border">
                <p className="font-semibold text-foreground">{user?.username || "Admin"}</p>
                <p className="text-muted-foreground capitalize text-[10px]">
                  {user?.role || "Administrator"}
                </p>
              </div>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.auth.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-12 shrink-0 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span className="font-bold">AG Proxy</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono">
                Hub v2.4
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 rounded-lg border-border gap-1.5 text-xs"
                >
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs">
                    {LOCALES.find((l) => l.value === locale)?.flag}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                {LOCALES.map((l) => (
                  <DropdownMenuItem
                    key={l.value}
                    onClick={() => setLocale(l.value)}
                    className="cursor-pointer text-xs focus:bg-accent"
                  >
                    <span className="mr-2">{l.flag}</span>
                    {t.language[l.value]}
                    {locale === l.value && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dark/Light Mode */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Body: Cho phép cuộn dọc mượt mà trên mọi màn hình */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 w-full">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
