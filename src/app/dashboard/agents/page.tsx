"use client";

import { useState } from "react";
import {
  Bot,
  Sparkles,
  Zap,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Plus,
  ShieldCheck,
  Cpu,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgentItem {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  status: "running" | "idle" | "paused";
  tasksRun: number;
  successRate: string;
  lastRun: string;
}

const INITIAL_AGENTS: AgentItem[] = [
  {
    id: "agent-1",
    name: "Quota Auto-Balancer Agent",
    role: "Traffic & Quota Director",
    description: "Tự động phân tích quota của các tài khoản Google AI và luân chuyển tài khoản mượt mà khi chạm ngưỡng 90%.",
    model: "gemini-3-flash",
    status: "running",
    tasksRun: 842,
    successRate: "99.9%",
    lastRun: "Vừa xong",
  },
  {
    id: "agent-2",
    name: "Claude Fallback Sentinel",
    role: "Failover Healer",
    description: "Tự động chuyển tiếp luồng sinh mã sang Claude 3.7 Sonnet khi phát hiện Google Cloud Code bị nghẽn hoặc 429.",
    model: "claude-sonnet-4-6",
    status: "running",
    tasksRun: 312,
    successRate: "99.4%",
    lastRun: "2 phút trước",
  },
  {
    id: "agent-3",
    name: "Proxy Latency Sentinel",
    role: "Network Health Monitor",
    description: "Đo độ trễ proxy mạng liên tục 60s/lần, tự động loại bỏ proxy chập chờn và chọn node có ping thấp nhất.",
    model: "internal-pinger",
    status: "running",
    tasksRun: 1250,
    successRate: "100%",
    lastRun: "10 giây trước",
  },
  {
    id: "agent-4",
    name: "Token Cost & Prompt Compressor",
    role: "Cost Optimizer",
    description: "Nén context lịch sử chat dài và điều phối các lệnh nhẹ sang Gemini 2.5 Flash Lite để tiết kiệm quota Ultra.",
    model: "gemini-2.5-flash-lite",
    status: "idle",
    tasksRun: 95,
    successRate: "98.2%",
    lastRun: "15 phút trước",
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>(INITIAL_AGENTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "running">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("");
  const [newAgentModel, setNewAgentModel] = useState("gemini-3-flash");

  function handleToggleStatus(id: string) {
    setAgents((prev) =>
      prev.map((ag) => {
        if (ag.id !== id) return ag;
        const nextStatus = ag.status === "running" ? "paused" : "running";
        toast.success(
          nextStatus === "running"
            ? `Đã kích hoạt agent "${ag.name}"`
            : `Đã tạm dừng agent "${ag.name}"`
        );
        return { ...ag, status: nextStatus };
      })
    );
  }

  function handleRunAgent(ag: AgentItem) {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: `Đang khởi chạy Agent: ${ag.name}...`,
        success: `Agent ${ag.name} đã hoàn thành tác vụ với 100% độ tin cậy!`,
        error: "Lỗi chạy agent",
      }
    );
    setAgents((prev) =>
      prev.map((item) =>
        item.id === ag.id
          ? { ...item, tasksRun: item.tasksRun + 1, lastRun: "Vừa xong" }
          : item
      )
    );
  }

  function handleCreateAgent() {
    if (!newAgentName) {
      toast.error("Vui lòng nhập tên Agent");
      return;
    }
    const newAg: AgentItem = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      role: newAgentRole || "Custom AI Assistant",
      description: "Tác vụ tự động hóa được người quản trị cấu hình tùy chỉnh cho hệ thống proxy.",
      model: newAgentModel,
      status: "running",
      tasksRun: 0,
      successRate: "100%",
      lastRun: "Vừa tạo",
    };
    setAgents([newAg, ...agents]);
    toast.success(`Đã thêm Agent "${newAgentName}" thành công!`);
    setNewAgentName("");
    setNewAgentRole("");
    setDialogOpen(false);
  }

  const filteredAgents = agents.filter((ag) => {
    const matchesSearch =
      ag.name.toLowerCase().includes(search.toLowerCase()) ||
      ag.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || ag.status === "running";
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header Card in Dark Charcoal Theme */}
      <div className="bg-gradient-to-br from-[#1C1626] via-[#14131E] to-[#0D0E14] border border-white/[0.08] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Soft background glow circles */}
        <div className="absolute top-0 right-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              AUTONOMOUS AI AGENTS
            </span>
            <span className="text-xs text-slate-400 font-mono">Antigravity Gateway Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Trung tâm Điều phối AI Agents
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
            Các AI Agents hoạt động ngầm để tự động kiểm soát quota, chuyển tiếp model khi nghẽn tải, và giám sát sức khỏe proxy.
          </p>
        </div>

        {/* Action button */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md border-0 gap-1.5 cursor-pointer">
                <Plus className="w-4 h-4" /> Thêm Agent mới
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle>Tạo AI Agent mới</DialogTitle>
                <DialogDescription>
                  Thiết lập tác vụ tự động hóa mới để giám sát và xử lý proxy.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Tên Agent</Label>
                  <Input
                    placeholder="VD: Smart Cache Warm-up Agent"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Vai trò (Role)</Label>
                  <Input
                    placeholder="VD: Memory Pre-fetcher"
                    value={newAgentRole}
                    onChange={(e) => setNewAgentRole(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Model xử lý</Label>
                  <Select value={newAgentModel} onValueChange={setNewAgentModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-3-flash">Gemini 3 Flash (Siêu tốc)</SelectItem>
                      <SelectItem value="gemini-3.1-pro-high">Gemini 3.1 Pro (Suy luận cao)</SelectItem>
                      <SelectItem value="claude-sonnet-4-6">Claude 3.7 Sonnet</SelectItem>
                      <SelectItem value="internal-pinger">Hệ thống nội bộ (Heuristic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateAgent} className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white">
                  Tạo Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top 4 Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              TỔNG SỐ AGENTS
            </div>
            <div className="text-2xl font-black text-foreground mt-0.5">{agents.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ED145B]/10 text-[#ED145B] flex items-center justify-center border border-[#ED145B]/20">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              ĐANG HOẠT ĐỘNG
            </div>
            <div className="text-2xl font-black text-emerald-500 mt-0.5">
              {agents.filter((a) => a.status === "running").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              TÁC VỤ HOÀN THÀNH
            </div>
            <div className="text-2xl font-black text-foreground mt-0.5">
              {agents.reduce((acc, a) => acc + a.tasksRun, 0).toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              ĐỘ CHÍNH XÁC
            </div>
            <div className="text-2xl font-black text-[#ED145B] mt-0.5">99.8%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ED145B]/10 text-[#ED145B] flex items-center justify-center border border-[#ED145B]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-2.5 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm agent..."
            className="pl-9 h-9 rounded-xl border-border bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8" : "h-8"}
          >
            Tất cả ({agents.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "running" ? "default" : "outline"}
            onClick={() => setFilter("running")}
            className={filter === "running" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8" : "h-8"}
          >
            Đang chạy ({agents.filter((a) => a.status === "running").length})
          </Button>
        </div>
      </div>

      {/* Agents Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredAgents.map((ag) => {
          const isRunning = ag.status === "running";
          return (
            <div
              key={ag.id}
              className="bg-card border border-border hover:border-[#ED145B]/40 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isRunning
                          ? "bg-[#ED145B]/15 text-[#ED145B] border-[#ED145B]/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-[#ED145B] transition-colors">
                        {ag.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-medium">{ag.role}</p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      isRunning
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold"
                        : "bg-muted text-muted-foreground font-semibold"
                    }
                  >
                    {isRunning ? "Running" : "Paused"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed line-clamp-2">
                  {ag.description}
                </p>
              </div>

              {/* Agent Specs Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-[#ED145B]" />
                    <span>{ag.model}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{ag.lastRun}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(ag.id)}
                    className="h-8 px-2 text-xs"
                    title={isRunning ? "Tạm dừng" : "Kích hoạt"}
                  >
                    {isRunning ? (
                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleRunAgent(ag)}
                    className="bg-[#ED145B]/15 hover:bg-[#ED145B]/25 text-[#ED145B] border border-[#ED145B]/30 h-8 px-3 text-xs font-bold rounded-xl gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Chạy thử
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
