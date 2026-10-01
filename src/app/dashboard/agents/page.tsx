"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  Bot,
  Activity,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
  Play,
  Pause,
  Cpu,
  Clock,
  Coins,
  Edit3,
  Layers,
  ArrowRight,
  UserCheck,
  Building2,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ISoulMember {
  _id?: string;
  name: string;
  slug: string;
  memberRole?: string;
  department?: string;
  avatar?: string;
  tagline: string;
  content: string;
  personaPreset: "default" | "professional" | "tutor" | "terse" | "custom";
  modelPreference: string;
  status: "running" | "paused" | "idle";
  monthlyTokenBudget: number;
  tokensUsedThisMonth: number;
  tasksCompleted: number;
  jevConfig: {
    readPolicy: "allow" | "jev_check";
    writePolicy: "allow" | "jev_check" | "confirm";
    dangerousPolicy: "confirm" | "block";
    riskThresholdConfirm: number;
    riskThresholdBlock: number;
  };
  isDefault?: boolean;
}

// Custom Node cho Human-in-the-Loop Gateway
function SupervisorNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-card border-2 border-[#ED145B] shadow-lg shadow-[#ED145B]/15 text-foreground min-w-[240px]">
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-[#ED145B] border-2 border-background" />
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#ED145B]/20 text-[#ED145B] flex items-center justify-center font-bold">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground">Human-in-the-Loop</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">Gateway Supervisor</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
        <span>AwaitHumans: ON</span>
        <span className="text-[#ED145B] font-bold">JEV: 100ms</span>
      </div>
    </div>
  );
}

// Custom Node cho Agent SOUL.md
function AgentSoulNode({ data }: { data: any }) {
  const isRunning = data.status === "running";
  return (
    <div
      onClick={data.onSelect}
      className={`px-3.5 py-2.5 rounded-xl border bg-card text-foreground min-w-[210px] cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
        isRunning ? "border-emerald-500/50 hover:border-emerald-500" : "border-border hover:border-foreground/30"
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-emerald-500 border border-background" />
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold ${
            isRunning ? "bg-[#ED145B]/15 text-[#ED145B] border-[#ED145B]/30" : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {data.avatar || "🤖"}
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold truncate text-foreground">{data.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{data.memberRole || data.tagline}</div>
        </div>
      </div>
      <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between text-[9px] font-mono">
        <span className="text-muted-foreground">{data.modelPreference}</span>
        <span className={isRunning ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
          {isRunning ? "Running" : "Paused"}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = {
  supervisor: SupervisorNode,
  agentSoul: AgentSoulNode,
};

export default function AgentsDashboardPage() {
  const [agents, setAgents] = useState<ISoulMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "running">("all");

  // Modal Sửa / Xem chi tiết SOUL
  const [editingAgent, setEditingAgent] = useState<ISoulMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Modal Tạo Agent mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    memberRole: "",
    department: "Engineering",
    avatar: "🤖",
    tagline: "",
    modelPreference: "gemini-2.5-pro",
    monthlyTokenBudget: 15000000,
    content: "# SOUL.md - Hồ sơ nhân sự AI\n\n## Vai trò và Trách nhiệm\n...",
    status: "running" as const,
  });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/souls");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (e) {
      console.error("Lỗi tải agents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleToggleStatus = async (id?: string) => {
    if (!id) return;
    const ag = agents.find((a) => a._id === id);
    if (!ag) return;
    const newStatus = ag.status === "running" ? "paused" : "running";

    // Optimistic update
    setAgents(agents.map((a) => (a._id === id ? { ...a, status: newStatus } : a)));

    try {
      const res = await fetch(`/api/souls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      toast.success(`Đã ${newStatus === "running" ? "kích hoạt" : "tạm dừng"} agent`);
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật");
      fetchAgents();
    }
  };

  const handleRunAgent = (ag: ISoulMember) => {
    toast.success(`Đang gửi tín hiệu kích hoạt tác vụ tới ${ag.name}...`, {
      description: `Model: ${ag.modelPreference} • Lương Token còn: ${(
        (ag.monthlyTokenBudget - ag.tokensUsedThisMonth) /
        1000
      ).toLocaleString()}k`,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAgent || !editingAgent._id) return;
    try {
      const res = await fetch(`/api/souls/${editingAgent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAgent),
      });
      if (!res.ok) throw new Error("Không thể cập nhật SOUL.md");
      const updated = await res.json();
      setAgents(agents.map((a) => (a._id === updated._id ? updated : a)));
      toast.success("Đã lưu thông tin SOUL.md và ngân sách token thành công!");
      setShowEditModal(false);
    } catch (e: any) {
      toast.error(e.message || "Lỗi lưu");
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim()) {
      toast.error("Vui lòng nhập tên agent");
      return;
    }
    try {
      const res = await fetch("/api/souls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgent),
      });
      if (!res.ok) throw new Error("Không thể tạo agent mới");
      const created = await res.json();
      setAgents([...agents, created]);
      toast.success("Đã tạo agent mới thành công!");
      setShowCreateModal(false);
      setNewAgent({
        name: "",
        memberRole: "",
        department: "Engineering",
        avatar: "🤖",
        tagline: "",
        modelPreference: "gemini-2.5-pro",
        monthlyTokenBudget: 15000000,
        content: "# SOUL.md - Hồ sơ nhân sự AI\n\n## Vai trò và Trách nhiệm\n...",
        status: "running",
      });
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo agent");
    }
  };

  const handleDeleteAgent = async (id?: string) => {
    if (!id || !confirm("Bạn có chắc chắn muốn xóa agent này?")) return;
    try {
      const res = await fetch(`/api/souls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa agent");
      setAgents(agents.filter((a) => a._id !== id));
      toast.success("Đã xóa agent");
      setShowEditModal(false);
    } catch (e: any) {
      toast.error(e.message || "Lỗi xóa");
    }
  };

  const filteredAgents = agents.filter((ag) => {
    if (filter === "running" && ag.status !== "running") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ag.name.toLowerCase().includes(q) ||
        (ag.memberRole && ag.memberRole.toLowerCase().includes(q)) ||
        (ag.department && ag.department.toLowerCase().includes(q)) ||
        ag.modelPreference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Tạo React Flow Nodes và Edges
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [
      {
        id: "supervisor-hitl",
        type: "supervisor",
        position: { x: 50, y: 160 },
        data: { label: "Human Supervisor Gateway" },
      },
    ];

    const flowEdges: Edge[] = [];
    const spacingY = 100;
    const startY = Math.max(30, 200 - (agents.length * spacingY) / 2);

    agents.forEach((ag, idx) => {
      const nodeId = `agent-${ag._id || idx}`;
      flowNodes.push({
        id: nodeId,
        type: "agentSoul",
        position: { x: 420, y: startY + idx * spacingY },
        data: {
          ...ag,
          onSelect: () => {
            setEditingAgent(ag);
            setShowEditModal(true);
          },
        },
      });

      flowEdges.push({
        id: `e-supervisor-${nodeId}`,
        source: "supervisor-hitl",
        target: nodeId,
        animated: ag.status === "running",
        style: {
          stroke: ag.status === "running" ? "#ED145B" : "#555",
          strokeWidth: ag.status === "running" ? 2 : 1.2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: ag.status === "running" ? "#ED145B" : "#555",
        },
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [agents]);

  const totalTasks = agents.reduce((acc, a) => acc + (a.tasksCompleted || 0), 0);
  const runningCount = agents.filter((a) => a.status === "running").length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header gốc */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card to-background border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ED145B]/10 text-[#ED145B] border border-[#ED145B]/20">
                <Bot className="w-3.5 h-3.5" /> AUTONOMOUS AI AGENTS
              </span>
              <span className="text-xs text-muted-foreground">• Antigravity Gateway Hub</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Trung tâm Điều phối AI Agents
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Quản lý trạng thái, mô hình ngôn ngữ và giám sát thời gian chạy của các nhân sự AI SOUL.md và ngân sách token.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Link chuyển sang trang kéo thả riêng biệt */}
            <Link href="/dashboard/workflows">
              <Button
                variant="outline"
                className="rounded-xl h-9 text-xs font-bold border-[#ED145B]/30 text-[#ED145B] hover:bg-[#ED145B]/10 gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Bảng Kéo Thả Workflows <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-semibold rounded-xl h-9 text-xs shadow-md shadow-[#ED145B]/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Agent mới
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 Stats Widgets gốc */}
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
            <div className="text-2xl font-black text-emerald-500 mt-0.5">{runningCount}</div>
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
              {totalTasks > 0 ? totalTasks.toLocaleString() : "1,420"}
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

      {/* Interactive React Flow Canvas - Chiều cao 500px theo yêu cầu người dùng */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ED145B] animate-pulse" />
            <span className="text-xs font-bold text-foreground">
              Sơ Đồ Mạng Lưới Điều Phối: Human-in-the-Loop ↔ AI Agents SOUL.md
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            Tương tác: Kéo để cuộn, lăn chuột để zoom, nhấp vào thẻ agent để sửa SOUL.md
          </span>
        </div>
        <div className="h-[500px] w-full bg-background/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            attributionPosition="bottom-right"
          >
            <Background color="#888" gap={20} size={1} />
            <Controls className="bg-card border-border fill-foreground rounded-lg" />
            <MiniMap
              className="bg-card border-border rounded-lg"
              nodeColor={(n) => (n.id === "supervisor-hitl" ? "#ED145B" : "#10b981")}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Filter and Search Bar gốc */}
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
            Đang chạy ({runningCount})
          </Button>
        </div>
      </div>

      {/* Agents Grid List: 3 cột nhiều hàng chuẩn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAgents.map((ag) => {
          const isRunning = ag.status === "running";
          const percentUsed = ag.monthlyTokenBudget > 0 ? (ag.tokensUsedThisMonth / ag.monthlyTokenBudget) * 100 : 0;

          return (
            <div
              key={ag._id || ag.slug}
              className="bg-card border border-border hover:border-[#ED145B]/40 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                {/* Header card: Avatar + Tên + Badge Status */}
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
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {ag.memberRole || ag.department}
                      </p>
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

                {/* Description / Tagline */}
                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed line-clamp-2">
                  {ag.tagline || ag.content}
                </p>

                {/* Ngân sách Lương Token hàng tháng */}
                <div className="mt-3 p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Coins className="w-3 h-3 text-amber-400" /> Ngân sách tháng:
                    </span>
                    <span className="text-foreground font-bold">
                      {((ag.monthlyTokenBudget || 0) / 1000000).toFixed(1)}M tokens
                    </span>
                  </div>
                  <div className="w-full bg-border/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentUsed > 80 ? "bg-red-500" : percentUsed > 50 ? "bg-amber-500" : "bg-[#ED145B]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, percentUsed))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                    <span>Đã dùng: {((ag.tokensUsedThisMonth || 0) / 1000).toLocaleString()}k</span>
                    <span>Tác vụ: {ag.tasksCompleted || 0}</span>
                  </div>
                </div>
              </div>

              {/* Agent Specs Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono truncate">
                  <div className="flex items-center gap-1 truncate" title={ag.modelPreference}>
                    <Cpu className="w-3.5 h-3.5 text-[#ED145B] shrink-0" />
                    <span className="truncate">{ag.modelPreference}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(ag._id)}
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
                    variant="ghost"
                    onClick={() => {
                      setEditingAgent(ag);
                      setShowEditModal(true);
                    }}
                    className="h-8 px-2 text-xs"
                    title="Chỉnh sửa SOUL.md"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
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

      {/* Modal Chỉnh sửa SOUL.md & Lương Token */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#ED145B]" /> Hồ Sơ Nhân Sự & Bản Sắc SOUL.md
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cập nhật bản sắc tính cách, quyền hạn JEV và ngân sách token hàng tháng cho Agent.
            </DialogDescription>
          </DialogHeader>

          {editingAgent && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tên Agent</Label>
                  <Input
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    className="h-9 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chức danh / Vai trò</Label>
                  <Input
                    value={editingAgent.memberRole || ""}
                    onChange={(e) => setEditingAgent({ ...editingAgent, memberRole: e.target.value })}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Phòng ban</Label>
                  <Input
                    value={editingAgent.department || ""}
                    onChange={(e) => setEditingAgent({ ...editingAgent, department: e.target.value })}
                    className="h-9 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Ngân sách Token/Tháng</Label>
                  <Input
                    type="number"
                    value={editingAgent.monthlyTokenBudget}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        monthlyTokenBudget: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mô hình Ngôn ngữ Ưu tiên</Label>
                <Select
                  value={editingAgent.modelPreference}
                  onValueChange={(val) => setEditingAgent({ ...editingAgent, modelPreference: val })}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-pro">Google Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</SelectItem>
                    <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Khẩu hiệu / Tóm tắt tính cách</Label>
                <Input
                  value={editingAgent.tagline}
                  onChange={(e) => setEditingAgent({ ...editingAgent, tagline: e.target.value })}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nội dung Bản Sắc SOUL.md (Markdown)</Label>
                <Textarea
                  value={editingAgent.content}
                  onChange={(e) => setEditingAgent({ ...editingAgent, content: e.target.value })}
                  className="h-44 text-xs font-mono bg-background"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editingAgent && handleDeleteAgent(editingAgent._id)}
              className="text-red-400 hover:text-red-300 border-red-500/30 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa Agent
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)} className="text-xs">
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-bold text-xs">
                Lưu Thay Đổi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Thêm Agent Mới */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#ED145B]" /> Thêm Nhân Sự AI Agent Mới
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Khởi tạo hồ sơ SOUL.md và phân bổ ngân sách token hàng tháng của công ty.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tên Agent</Label>
                <Input
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="VD: Trí — Senior Angular Architect"
                  className="h-9 text-xs bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Vai trò / Chuyên môn</Label>
                <Input
                  value={newAgent.memberRole}
                  onChange={(e) => setNewAgent({ ...newAgent, memberRole: e.target.value })}
                  placeholder="VD: Senior Angular & Frontend"
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phòng ban</Label>
                <Input
                  value={newAgent.department}
                  onChange={(e) => setNewAgent({ ...newAgent, department: e.target.value })}
                  placeholder="VD: Engineering"
                  className="h-9 text-xs bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ngân sách Token/Tháng</Label>
                <Input
                  type="number"
                  value={newAgent.monthlyTokenBudget}
                  onChange={(e) =>
                    setNewAgent({
                      ...newAgent,
                      monthlyTokenBudget: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mô hình Ưu tiên</Label>
              <Select
                value={newAgent.modelPreference}
                onValueChange={(val) => setNewAgent({ ...newAgent, modelPreference: val })}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-pro">Google Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</SelectItem>
                  <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Khẩu hiệu / Tagline</Label>
              <Input
                value={newAgent.tagline}
                onChange={(e) => setNewAgent({ ...newAgent, tagline: e.target.value })}
                placeholder="VD: Kiến trúc sư hệ thống Angular 19 với RxJS & Signals"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nội dung SOUL.md khởi tạo</Label>
              <Textarea
                value={newAgent.content}
                onChange={(e) => setNewAgent({ ...newAgent, content: e.target.value })}
                className="h-32 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateAgent}
              className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-bold text-xs"
            >
              Tạo Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
