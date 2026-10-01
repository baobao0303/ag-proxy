"use client";

import { useState } from "react";
import {
  Workflow,
  Play,
  Pause,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Repeat,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkflowStep {
  label: string;
  type: "trigger" | "condition" | "action";
  color?: string;
}

interface WorkflowItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  steps: WorkflowStep[];
  executionCount: number;
  lastExecuted: string;
}

const INITIAL_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf-1",
    title: "Quota Overflow Failover Pipeline",
    description: "Khi tài khoản chính đạt 90% giới hạn token, tự động chuyển tiếp yêu cầu sang tài khoản phụ hoặc Claude 3.7 Sonnet.",
    enabled: true,
    steps: [
      { label: "Quota < 10%", type: "trigger" },
      { label: "Kiểm tra Claude Pool", type: "condition" },
      { label: "Switch sang Claude Sonnet", type: "action" },
    ],
    executionCount: 420,
    lastExecuted: "5 phút trước",
  },
  {
    id: "wf-2",
    title: "High-Speed Flash Turbo Routing",
    description: "Tự động nhận diện prompt ngắn (<500 tokens) và điều phối về Gemini 3 Flash để tăng tốc độ phản hồi 3x.",
    enabled: true,
    steps: [
      { label: "Prompt < 500 tokens", type: "trigger" },
      { label: "Model: Flash Pool", type: "action" },
    ],
    executionCount: 1850,
    lastExecuted: "Vừa xong",
  },
  {
    id: "wf-3",
    title: "Proxy Latency Health Sentinel",
    description: "Nếu proxy hiện tại có thời gian phản hồi > 250ms, tự động đổi sang Proxy node dự phòng trong danh sách.",
    enabled: true,
    steps: [
      { label: "Ping > 250ms", type: "trigger" },
      { label: "Chọn Node ping < 50ms", type: "condition" },
      { label: "Hot-swap Proxy IP", type: "action" },
    ],
    executionCount: 68,
    lastExecuted: "20 phút trước",
  },
  {
    id: "wf-4",
    title: "VS Code Antigravity Realtime Sync",
    description: "Đồng bộ tức thời token xác thực mới nhất sang IDE VS Code Extension khi tài khoản luân phiên chuyển đổi.",
    enabled: false,
    steps: [
      { label: "Account Switched", type: "trigger" },
      { label: "Broadcast Event", type: "action" },
    ],
    executionCount: 94,
    lastExecuted: "1 ngày trước",
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrigger, setNewTrigger] = useState("Quota < 15%");
  const [newAction, setNewAction] = useState("Switch Account");

  function handleToggle(id: string) {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id !== id) return wf;
        const next = !wf.enabled;
        toast.success(next ? `Đã kích hoạt "${wf.title}"` : `Đã tạm dừng "${wf.title}"`);
        return { ...wf, enabled: next };
      })
    );
  }

  function handleExecute(wf: WorkflowItem) {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: `Đang thực thi quy trình: ${wf.title}...`,
        success: `Quy trình "${wf.title}" thực thi thành công mọi bước!`,
        error: "Lỗi thực thi quy trình",
      }
    );
    setWorkflows((prev) =>
      prev.map((item) =>
        item.id === wf.id
          ? { ...item, executionCount: item.executionCount + 1, lastExecuted: "Vừa xong" }
          : item
      )
    );
  }

  function handleCreate() {
    if (!newTitle) {
      toast.error("Vui lòng nhập tên quy trình");
      return;
    }
    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      title: newTitle,
      description: "Quy trình tự động hóa tùy chỉnh cho người dùng.",
      enabled: true,
      steps: [
        { label: newTrigger, type: "trigger" },
        { label: newAction, type: "action" },
      ],
      executionCount: 0,
      lastExecuted: "Vừa tạo",
    };
    setWorkflows([newWf, ...workflows]);
    toast.success(`Đã thêm quy trình "${newTitle}" thành công!`);
    setNewTitle("");
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner in Dark Charcoal Theme */}
      <div className="bg-gradient-to-br from-[#1C1626] via-[#14131E] to-[#0D0E14] border border-white/[0.08] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              SMART AUTOMATION
            </span>
            <span className="text-xs text-slate-400 font-mono">Antigravity Pipeline Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Quản trị Workflows & Pipelines
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
            Thiết lập chuỗi hành động kích hoạt tự động theo quota, độ trễ và luồng sinh mã của AI.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md border-0 gap-1.5 cursor-pointer">
                <Plus className="w-4 h-4" /> Tạo Workflow mới
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle>Tạo Quy trình Workflow mới</DialogTitle>
                <DialogDescription>
                  Cấu hình các bước kích hoạt và xử lý luồng AI tự động.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Tên Workflow</Label>
                  <Input
                    placeholder="VD: Auto Refill Quota Pipeline"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Điều kiện kích hoạt (Trigger)</Label>
                  <Select value={newTrigger} onValueChange={setNewTrigger}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quota < 15%">Khi Quota tài khoản &lt; 15%</SelectItem>
                      <SelectItem value="Ping > 200ms">Khi độ trễ proxy &gt; 200ms</SelectItem>
                      <SelectItem value="Prompt > 100k tokens">Khi Prompt siêu dài (&gt; 100k tokens)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Hành động thực thi (Action)</Label>
                  <Select value={newAction} onValueChange={setNewAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Switch sang Claude Sonnet">Chuyển tiếp sang Claude Sonnet</SelectItem>
                      <SelectItem value="Hot-swap Proxy">Tự động đổi Proxy IP</SelectItem>
                      <SelectItem value="Nén Context Prompt">Nén Context lịch sử</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreate} className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white">
                  Tạo Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Workflows Pipeline List */}
      <div className="space-y-3.5">
        {workflows.map((wf) => {
          return (
            <div
              key={wf.id}
              className="bg-card border border-border hover:border-[#ED145B]/40 rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      wf.enabled
                        ? "bg-[#ED145B]/15 text-[#ED145B] border-[#ED145B]/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <Workflow className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#ED145B] transition-colors">
                      {wf.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                      {wf.description}
                    </p>
                  </div>
                </div>

                {/* Visual Pipeline Nodes */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-11">
                  {wf.steps.map((st, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                          st.type === "trigger"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : st.type === "condition"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                            : "bg-[#ED145B]/15 text-[#ED145B] border-[#ED145B]/30"
                        }`}
                      >
                        {st.label}
                      </div>
                      {i < wf.steps.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Controls */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                <div className="text-right text-[11px] font-mono text-muted-foreground">
                  <div>Đã chạy: <strong className="text-foreground">{wf.executionCount}</strong> lần</div>
                  <div className="text-[10px]">{wf.lastExecuted}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(wf.id)}
                    className="h-8 px-2 text-xs"
                    title={wf.enabled ? "Tạm dừng" : "Kích hoạt"}
                  >
                    {wf.enabled ? (
                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleExecute(wf)}
                    className="bg-[#ED145B]/15 hover:bg-[#ED145B]/25 text-[#ED145B] border border-[#ED145B]/30 h-8 px-3 text-xs font-bold rounded-xl gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Chạy ngay
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
