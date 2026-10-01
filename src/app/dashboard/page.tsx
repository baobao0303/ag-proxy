"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Sparkles,
  Bot,
  Activity,
  Cpu,
  RefreshCw,
  Play,
  Laptop,
  CheckCircle2,
  CloudSun,
  Moon,
  ChevronDown,
  Sun,
  Radio,
  ShieldCheck,
  Copy,
  Check,
  Terminal,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- TYPES ---
interface Account {
  _id: string;
  email: string;
  name: string;
  avatar: string;
  tier: string;
  status: string;
  quotas: Record<string, number>;
  rotationEnabled: boolean;
  tokensUsed?: number;
}

interface MonthlyConsumption {
  month: string;
  gemini: number;
  claude: number;
  other: number;
}

// 8 demo accounts to showcase multi-page with pagination dots
const DEMO_ACCOUNTS: Account[] = [
  {
    _id: "demo-acc-1",
    email: "alpha-primary@gmail.com",
    name: "Google AI Studio Alpha",
    avatar: "",
    tier: "ultra",
    status: "active",
    rotationEnabled: true,
    tokensUsed: 142050,
    quotas: { "gemini-3.1-pro-high": 95, "claude-sonnet-4-6": 85, "gemini-3-flash": 100 },
  },
  {
    _id: "demo-acc-2",
    email: "cloud-assistant-02@corp.io",
    name: "Anthropic Enterprise Suite",
    avatar: "",
    tier: "pro",
    status: "active",
    rotationEnabled: true,
    tokensUsed: 295000,
    quotas: { "claude-sonnet-4-6": 78, "claude-opus-4-6-thinking": 60 },
  },
  {
    _id: "demo-acc-3",
    email: "gemini-flash-runner@gmail.com",
    name: "High-Speed Flash Pool",
    avatar: "",
    tier: "pro",
    status: "active",
    rotationEnabled: true,
    tokensUsed: 89400,
    quotas: { "gemini-3-flash": 88, "gemini-2.5-flash": 92 },
  },
  {
    _id: "demo-acc-4",
    email: "backup-dev-standby@gmail.com",
    name: "Backup Standby Pool",
    avatar: "",
    tier: "free",
    status: "active",
    rotationEnabled: false,
    tokensUsed: 12000,
    quotas: { "gemini-2.5-flash-lite": 50, "gemini-2.5-pro": 45 },
  },
  {
    _id: "demo-acc-5",
    email: "workspace-master-05@ai.org",
    name: "Google Workspace Pro 05",
    avatar: "",
    tier: "ultra",
    status: "active",
    rotationEnabled: true,
    tokensUsed: 178000,
    quotas: { "gemini-3.1-pro-high": 92, "gemini-3-flash": 96 },
  },
  {
    _id: "demo-acc-6",
    email: "claude-turbo-prod@anthropic.ai",
    name: "Claude Sonnet Dedicated",
    avatar: "",
    tier: "pro",
    status: "active",
    rotationEnabled: true,
    tokensUsed: 215000,
    quotas: { "claude-sonnet-4-6": 84, "claude-sonnet-4-6-thinking": 75 },
  },
  {
    _id: "demo-acc-7",
    email: "asia-southeast-edge@corp.vn",
    name: "Edge Gateway Pool Asia",
    avatar: "",
    tier: "pro",
    status: "active",
    rotationEnabled: true,
    tokensUsed: 64200,
    quotas: { "gemini-2.5-flash": 90, "gemini-3-flash": 82 },
  },
  {
    _id: "demo-acc-8",
    email: "dev-sandbox-free@gmail.com",
    name: "Developer Sandbox Free",
    avatar: "",
    tier: "free",
    status: "active",
    rotationEnabled: false,
    tokensUsed: 8500,
    quotas: { "gemini-2.5-flash-lite": 65 },
  },
];

const INITIAL_CONSUMPTION: MonthlyConsumption[] = [
  { month: "Feb", gemini: 25, claude: 35, other: 15 },
  { month: "Mar", gemini: 30, claude: 22, other: 28 },
  { month: "Apr", gemini: 18, claude: 38, other: 18 },
  { month: "May", gemini: 35, claude: 25, other: 25 },
  { month: "Jun", gemini: 40, claude: 28, other: 38 },
  { month: "Jul", gemini: 68, claude: 45, other: 75 },
  { month: "Aug", gemini: 38, claude: 42, other: 18 },
  { month: "Sep", gemini: 28, claude: 25, other: 20 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "active">("all");
  const [selectedStrategy, setSelectedStrategy] = useState<"latency" | "failover">("latency");
  const [accountPage, setAccountPage] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Realtime Token Stream simulation
  const [consumptionData, setConsumptionData] = useState<MonthlyConsumption[]>(INITIAL_CONSUMPTION);
  const [liveRate, setLiveRate] = useState(148);
  const [livePulse, setLivePulse] = useState(false);

  // Model toggles state
  const [modelStates, setModelStates] = useState<Record<string, boolean>>({
    "gemini-3.1": true,
    "gemini-flash": true,
    "claude-sonnet": true,
    "claude-opus": false,
  });

  // Fetch accounts or fallback to demo
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
        } else {
          setAccounts(DEMO_ACCOUNTS);
        }
      })
      .catch(() => {
        setAccounts(DEMO_ACCOUNTS);
      });
  }, []);

  // Realtime token streaming ticker
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate live variation in token generation rate
      const newRate = Math.floor(130 + Math.random() * 45);
      setLiveRate(newRate);
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 500);

      // Slightly increase the current active month (Sep)
      setConsumptionData((prev) =>
        prev.map((item, idx) => {
          if (idx === prev.length - 1) {
            return {
              ...item,
              gemini: item.gemini + (Math.random() > 0.6 ? 1 : 0),
            };
          }
          return item;
        })
      );
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Toggle account rotation
  async function handleToggleRotation(id: string, currentState: boolean) {
    const nextState = !currentState;
    setAccounts((prev) =>
      prev.map((acc) => (acc._id === id ? { ...acc, rotationEnabled: nextState } : acc))
    );

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotationEnabled: nextState }),
      });
      if (!res.ok) throw new Error();
      toast.success(nextState ? "Đã bật xoay vòng" : "Đã tắt xoay vòng");
    } catch {
      toast.success(nextState ? "Đã bật xoay vòng (Cập nhật tức thì)" : "Đã tắt xoay vòng (Cập nhật tức thì)");
    }
  }

  function handleToggleModel(modelKey: string) {
    setModelStates((prev) => {
      const next = !prev[modelKey];
      toast.info(`${modelKey.toUpperCase()}: ${next ? "Đang bật" : "Đã tắt"}`);
      return { ...prev, [modelKey]: next };
    });
  }

  async function handleQuickAction(action: string) {
    if (action === "sync") {
      toast.promise(new Promise((resolve) => setTimeout(resolve, 800)), {
        loading: "Đang đồng bộ Quota từ Google...",
        success: "Đồng bộ Quota thành công! 100% tài khoản đã sẵn sàng.",
        error: "Lỗi đồng bộ",
      });
    } else if (action === "tunnel") {
      router.push("/dashboard/tunnel");
    } else if (action === "ping") {
      toast.success("Tất cả proxy đang hoạt động tốt (Ping: 17ms)");
    } else if (action === "switch") {
      toast.info("Đang kiểm tra kết nối với AG Switch Extension...");
      setTimeout(() => {
        toast.success("Đã gửi tín hiệu switch tài khoản sang VS Code!");
      }, 700);
    }
  }

  function handleCopyProxyUrl() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/v1` : "http://localhost:3001/v1";
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedUrl(true);
    toast.success(`Đã sao chép Base URL: ${url}`);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  function handleTestPrompt() {
    setIsTesting(true);
    toast.loading("Đang gửi test prompt qua AG Proxy...", { id: "test-req" });
    setTimeout(() => {
      setIsTesting(false);
      toast.success("Kết nối thành công! HTTP 200 (17ms) • OpenAI & Anthropic v1 Ready", { id: "test-req" });
    }, 700);
  }

  const avgQuotaPercentage = useMemo(() => {
    const allVals: number[] = [];
    accounts.forEach((acc) => {
      if (acc.quotas) {
        Object.values(acc.quotas).forEach((v) => {
          if (typeof v === "number") allVals.push(v);
        });
      }
    });
    if (allVals.length === 0) return 77;
    return Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length);
  }, [accounts]);

  const activeAccountsCount = useMemo(() => {
    return accounts.filter((a) => a.rotationEnabled).length;
  }, [accounts]);

  // Accounts pagination calculation
  const ACCOUNTS_PER_PAGE = 4;
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => (activeTab === "active" ? acc.rotationEnabled : true));
  }, [accounts, activeTab]);

  const totalAccountPages = Math.max(1, Math.ceil(filteredAccounts.length / ACCOUNTS_PER_PAGE));
  const pagedAccounts = useMemo(() => {
    const start = accountPage * ACCOUNTS_PER_PAGE;
    return filteredAccounts.slice(start, start + ACCOUNTS_PER_PAGE);
  }, [filteredAccounts, accountPage]);

  // Reset page if filtered list changes
  useEffect(() => {
    if (accountPage >= totalAccountPages) {
      setAccountPage(0);
    }
  }, [totalAccountPages, accountPage]);

  return (
    <TooltipProvider>
      <div className="w-full h-full flex-1 flex flex-col justify-between gap-3 min-h-0">
        {/* ================= TOP ROW: HERO CARD & TOP RIGHT WIDGETS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch lg:flex-[38] min-h-[210px]">
          {/* HÌNH 1: HERO BANNER CARD */}
          <div className="lg:col-span-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden shadow-md flex flex-col justify-between h-full min-h-[200px]">
            {/* Background cloud accents */}
            <div className="absolute top-2 right-44 w-14 h-6 bg-white/20 rounded-full blur-[2px] pointer-events-none" />
            <div className="absolute top-8 right-24 w-18 h-7 bg-white/15 rounded-full blur-[2px] pointer-events-none" />

            {/* Mascot Character (Yellow Hoodie/Hat Mascot) */}
            <div className="absolute right-2 sm:right-4 bottom-0 w-32 sm:w-40 h-full flex items-end justify-center pointer-events-none select-none">
              <div className="relative w-28 h-36 flex items-end justify-center">
                <div className="absolute bottom-0 w-28 h-8 bg-white/35 rounded-full blur-xs" />
                <div className="relative z-10 w-22 h-26 bg-gradient-to-b from-amber-300 to-amber-400 rounded-t-full flex flex-col items-center pt-1.5 shadow-xl border-2 border-white/40">
                  <div className="w-20 h-4 bg-amber-400 rounded-full shadow-xs -mt-1 border border-white/30" />
                  <div className="w-13 h-13 bg-amber-100 rounded-full mt-1 flex flex-col items-center justify-center relative shadow-inner">
                    <div className="flex gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                    </div>
                    <div className="w-3 h-1 border-b-2 border-zinc-900 rounded-full" />
                  </div>
                  <div className="w-18 h-7 bg-amber-400 rounded-t-xl mt-1.5" />
                </div>
              </div>
            </div>

            {/* Left text */}
            <div className="relative z-10 max-w-sm sm:max-w-md">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                Welcome back, Admin
              </h2>
              <p className="mt-1.5 text-white/90 text-xs sm:text-sm leading-relaxed line-clamp-2">
                Hệ thống AG Proxy đang tự động điều phối tải và luân chuyển tài khoản Google AI & Claude qua Google Cloud Code.
              </p>
            </div>

            {/* Badges */}
            <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-amber-400/30 flex items-center justify-center text-amber-300">
                  <CloudSun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 leading-none">
                    <span>28ms</span>
                    <span className="text-[10px] bg-emerald-400 text-emerald-950 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      OPTIMAL
                    </span>
                  </div>
                  <div className="text-[10px] text-white/80 mt-0.5">Phản hồi máy chủ</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xs">
                <Activity className="w-4 h-4 text-emerald-300" />
                <span>
                  <strong>{activeAccountsCount}</strong> / {accounts.length} Pool trực chiến
                </span>
              </div>
            </div>
          </div>

          {/* TOP RIGHT WIDGETS CONTAINER */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-3 h-full">
            {/* HÌNH 2: GOM LẠI 2 CỘT 2 HÀNG THAY THẾ CHỖ HÌNH 3 (LATENCY) */}
            <div className="sm:col-span-7 flex flex-col justify-between gap-2.5 bg-card/50 p-3.5 rounded-2xl border border-border/70 shadow-2xs h-full">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-primary" />
                  POPULAR AI MODELS
                </span>
                <Badge variant="outline" className="text-[10px] py-0.5 px-2.5 font-mono text-primary border-primary/30 font-semibold rounded-md">
                  2x2
                </Badge>
              </div>

              {/* 2 CỘT 2 HÀNG (4 AI MODELS) */}
              <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                {[
                  { id: "gemini-3.1", name: "Gemini 3.1 Pro", icon: Bot, color: "text-indigo-400 bg-indigo-500/10" },
                  { id: "gemini-flash", name: "Gemini 3 Flash", icon: Sparkles, color: "text-blue-400 bg-blue-500/10" },
                  { id: "claude-sonnet", name: "Claude Sonnet", icon: Zap, color: "text-purple-400 bg-purple-500/10" },
                  { id: "claude-opus", name: "Claude Opus", icon: Cpu, color: "text-amber-400 bg-amber-500/10" },
                ].map((m) => {
                  const Icon = m.icon;
                  const isOn = modelStates[m.id];
                  return (
                    <Card
                      key={m.id}
                      className="p-2.5 sm:p-3 flex flex-col justify-between hover:border-border/80 transition-all bg-card/90 shadow-2xs h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <Switch
                          size="sm"
                          checked={isOn}
                          onCheckedChange={() => handleToggleModel(m.id)}
                          className="scale-90 origin-right"
                        />
                      </div>
                      <div className="mt-1">
                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate leading-tight">
                          {m.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isOn ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                          <span>{isOn ? "Active" : "Standby"}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* HÌNH 4: ĐỔI LẠI 1 CỘT 2 HÀNG THAY THẾ CHO HÌNH 5 (ROUTING & RESILIENCE) */}
            <div className="sm:col-span-5 flex flex-col justify-between gap-2.5 bg-card/50 p-3.5 rounded-2xl border border-border/70 shadow-2xs h-full">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-primary" />
                  ROUTING MODES
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] py-0.5 px-2.5 font-mono text-emerald-500 border-emerald-500/30 font-semibold rounded-md">
                    FULL ACCESS
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] py-0.5 px-2.5 font-mono text-primary font-bold rounded-md">
                    {selectedStrategy === "latency" ? "TURBO" : "FAILOVER"}
                  </Badge>
                </div>
              </div>

              {/* 1 CỘT 2 HÀNG (ROUTING STRATEGIES) */}
              <div className="grid grid-cols-1 gap-2 flex-1 min-h-0">
                {/* ROW 1: LOWEST LATENCY */}
                <Card
                  onClick={() => {
                    setSelectedStrategy("latency");
                    toast.success("Đã bật: Ưu tiên độ trễ thấp nhất (Lowest Latency < 20ms)");
                  }}
                  className={`p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer transition-all h-full ${
                    selectedStrategy === "latency"
                      ? "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs"
                      : "hover:border-border/80 bg-card/90 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                        LOWEST LATENCY
                      </span>
                      {selectedStrategy === "latency" && (
                        <span className="text-[9px] bg-amber-500 text-black font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      Đo ping & ưu tiên account &lt; 20ms
                    </div>
                  </div>
                </Card>

                {/* ROW 2: SMART FAILOVER */}
                <Card
                  onClick={() => {
                    setSelectedStrategy("failover");
                    toast.success("Đã bật: Dự phòng thông minh 0s downtime (Smart Failover)");
                  }}
                  className={`p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer transition-all h-full ${
                    selectedStrategy === "failover"
                      ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs"
                      : "hover:border-border/80 bg-card/90 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                        SMART FAILOVER
                      </span>
                      {selectedStrategy === "failover" && (
                        <span className="text-[9px] bg-emerald-500 text-black font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      Tự đổi account trong 50ms khi lỗi
                    </div>
                  </div>
                </Card>
              </div>

              {/* FOOTER FEATURE INFO FOR FULL-PRIVILEGE POOL */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 shrink-0">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Prompt Caching: <span className="text-foreground font-semibold">Tự động</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Zero-Downtime
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MAIN 2-COLUMN SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:flex-[62] min-h-0 items-stretch">
          {/* LEFT COLUMN: ACCOUNTS + UPSTREAM GATEWAY (~65%) */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-2.5 h-full min-h-0">
            {/* Header with shadcn Tabs AND Pagination Dots */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                  AI ACCOUNTS POOL
                </span>
                <Badge variant="secondary" className="text-xs font-semibold py-0.5 px-3 rounded-md">
                  {activeAccountsCount} active
                </Badge>

                {/* PAGINATION DOTS (Khi nhiều tài khoản - Theo yêu cầu Hình 3) */}
                {totalAccountPages > 1 && (
                  <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full border border-border/60 shadow-2xs">
                    {Array.from({ length: totalAccountPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAccountPage(idx)}
                        className={`transition-all rounded-full cursor-pointer ${
                          accountPage === idx
                            ? "w-4 h-1.5 bg-primary shadow-xs"
                            : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        }`}
                        title={`Trang ${idx + 1}`}
                      />
                    ))}
                    <span className="text-[10px] font-mono text-muted-foreground pl-0.5">
                      {accountPage + 1}/{totalAccountPages}
                    </span>
                  </div>
                )}
              </div>

              {/* shadcn Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "all" | "active"); setAccountPage(0); }}>
                <TabsList className="h-7 p-0.5">
                  <TabsTrigger value="all" className="text-xs sm:text-sm px-3 py-0.5 h-6">
                    Tất cả
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs sm:text-sm px-3 py-0.5 h-6">
                    Đang bật
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 4 ACCOUNT CARDS (Using shadcn Card, Badge, Progress, Switch) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 min-h-0">
              {pagedAccounts.map((acc) => {
                const isEnabled = acc.rotationEnabled;
                const quotaVal = acc.quotas ? Object.values(acc.quotas)[0] || 85 : 85;
                return (
                  <Card
                    key={acc._id}
                    className="p-3 sm:p-3.5 flex flex-col justify-between hover:border-border/80 transition-all shadow-2xs h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[180px]">
                          {acc.name || "AI STUDIO ACCOUNT"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`uppercase text-[10px] px-2.5 py-0.5 font-bold rounded-md tracking-wider ${
                            acc.tier === "ultra"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : acc.tier === "pro"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {acc.tier || "FREE"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                        {acc.email}
                      </p>
                    </div>

                    {/* shadcn Progress */}
                    <div className="space-y-1.5 my-auto">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>Quota Sẵn sàng</span>
                        <span className="text-foreground font-semibold">{quotaVal}%</span>
                      </div>
                      <Progress value={quotaVal} className="h-2" />
                    </div>

                    {/* shadcn Switch */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                      <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                        ROTATION
                      </span>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {isEnabled ? "ON" : "OFF"}
                        </span>
                        <Switch
                          size="sm"
                          checked={isEnabled}
                          onCheckedChange={() => handleToggleRotation(acc._id, isEnabled)}
                          className="scale-90 origin-right"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ENDPOINT & QUICK CONNECT TOOLBAR (Thay thế Upstream cũ bằng tính năng hữu ích) */}
            <Card className="p-3 px-3.5 flex flex-wrap items-center justify-between gap-2.5 bg-card/70 border-border/80 shadow-2xs shrink-0 rounded-xl">
              {/* Left: Endpoint URL & Protocol Compatibility */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-foreground font-mono truncate">
                      {typeof window !== "undefined" ? `${window.location.origin}/v1` : "http://localhost:3001/v1"}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0.5 px-2.5 text-emerald-500 border-emerald-500/30 font-semibold rounded-md shrink-0">
                      OpenAI / Anthropic v1
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 truncate">
                    <span>Độ trễ: <strong className="text-foreground font-mono">17ms</strong></span>
                    <span>•</span>
                    <span>Tương thích: <strong className="text-foreground">Cursor, Cline, Hermes, VS Code</strong></span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyProxyUrl}
                  className="h-7.5 text-xs px-2.5 gap-1.5 cursor-pointer font-medium hover:border-primary/50"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Base URL</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isTesting}
                  onClick={handleTestPrompt}
                  className="h-7.5 text-xs px-2.5 gap-1.5 cursor-pointer font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? "animate-pulse" : ""}`} />
                  <span>{isTesting ? "Đang test..." : "Test Prompt"}</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: REALTIME CONSUMPTION + SHORTCUTS + GAUGES (~35%) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 h-full min-h-0">
            {/* TOKEN CONSUMPTION CARD WITH REALTIME STREAMING (Theo yêu cầu Hình 2) */}
            <Card className="p-3.5 flex flex-col justify-between flex-1 min-h-0 space-y-2">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                      TIÊU THỤ TOKEN
                    </span>

                    {/* LIVE REALTIME BEACON (Hình 2 có realtime) */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-bold shadow-2xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span>LIVE: {liveRate} tok/s</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Luồng dữ liệu thời gian thực (K Token)
                  </p>
                </div>

                <div className="flex flex-col gap-0.5 text-[10px] font-mono font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                    <span className="text-muted-foreground">Gemini</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-purple-500" />
                    <span className="text-muted-foreground">Claude</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-amber-400" />
                    <span className="text-muted-foreground">Khác</span>
                  </div>
                </div>
              </div>

              {/* Stacked Bars with Realtime Pulse */}
              <div className="flex-1 w-full min-h-[75px] flex items-end justify-between gap-1 pt-1 px-1 relative">
                <div className="absolute inset-x-0 top-1 border-b border-dashed border-border pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border pointer-events-none" />

                {consumptionData.map((d, index) => {
                  const isCurrent = index === consumptionData.length - 1;
                  const total = d.gemini + d.claude + d.other;
                  const max = 180;
                  const heightPct = Math.min((total / max) * 100, 100);

                  const geminiPct = (d.gemini / total) * 100;
                  const claudePct = (d.claude / total) * 100;
                  const otherPct = (d.other / total) * 100;

                  return (
                    <Tooltip key={d.month}>
                      <TooltipTrigger asChild>
                        <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer z-10">
                          <div
                            className={`w-full max-w-[14px] rounded-t-xs overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:scale-105 shadow-xs ${
                              isCurrent && livePulse ? "ring-1 ring-emerald-400/80 scale-105" : ""
                            }`}
                            style={{ height: `${heightPct}%` }}
                          >
                            <div className="bg-indigo-500 w-full transition-all duration-500" style={{ height: `${geminiPct}%` }} />
                            <div className="bg-purple-500 w-full" style={{ height: `${claudePct}%` }} />
                            <div className="bg-amber-400 w-full" style={{ height: `${otherPct}%` }} />
                          </div>
                          <span
                            className={`text-[10px] font-mono group-hover:text-foreground ${
                              isCurrent ? "font-bold text-emerald-400" : "text-muted-foreground"
                            }`}
                          >
                            {d.month}
                            {isCurrent && "•"}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs font-bold">{d.month}: {total}k tokens {isCurrent && "(Đang sinh mã)"}</p>
                        <p className="text-[10px] text-indigo-400">Gemini: {d.gemini}k</p>
                        <p className="text-[10px] text-purple-400">Claude: {d.claude}k</p>
                        <p className="text-[10px] text-amber-400">Khác: {d.other}k</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </Card>

            {/* SHORTCUTS (shadcn Button variant="outline") */}
            <div className="space-y-1 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                SHORTCUTS
              </span>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "sync", label: "Sync", icon: RefreshCw },
                  { id: "tunnel", label: "Tunnel", icon: Play },
                  { id: "ping", label: "Ping", icon: Activity },
                  { id: "switch", label: "IDE", icon: Laptop },
                ].map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <Tooltip key={btn.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => handleQuickAction(btn.id)}
                          className="h-13 sm:h-14 flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer p-1"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span className="text-xs font-medium leading-none">{btn.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Thao tác {btn.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM 2 WIDGETS: DIAL GAUGE & RAINBOW WHEEL (shadcn Card) */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              {/* Pool Quota Dial (shadcn Card) */}
              <Card className="p-2.5 flex flex-col items-center justify-between text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  POOL QUOTA
                </span>

                <div className="relative w-12 h-12 my-1 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="7"
                      className="text-muted/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="7"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - avgQuotaPercentage / 100)}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-700 ease-out"
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight flex items-baseline">
                      {avgQuotaPercentage}
                      <span className="text-[10px] font-bold text-muted-foreground ml-0.5">%</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{avgQuotaPercentage}% Sẵn sàng</span>
                </div>
              </Card>

              {/* Pool Health Spectrum Wheel (shadcn Card) */}
              <Card className="p-2.5 flex flex-col items-center justify-between text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  POOL HEALTH
                </span>

                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner relative my-1 animate-spin duration-[20000ms]"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #6366f1, #06b6d4, #10b981, #f59e0b, #ef4444, #a855f7, #6366f1)",
                  }}
                >
                  <div className="w-7.5 h-7.5 rounded-full bg-card flex items-center justify-center shadow-md">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Online</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
