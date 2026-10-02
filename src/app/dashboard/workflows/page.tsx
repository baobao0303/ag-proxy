"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
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
  Cpu,
  Bot,
  Activity,
  UserCheck,
  Building2,
  RefreshCw,
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
import Link from "next/link";

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
  assignedAgent?: string;
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
    assignedAgent: "Bảo — Lead DevOps",
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
    assignedAgent: "Hải — Cost Optimizer",
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
    assignedAgent: "Linh — Security Lead",
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
    assignedAgent: "Trí — Senior Angular",
  },
];

// Node Supervisor Human-in-the-Loop
function SupervisorNode() {
  return (
    <div className="bg-card/95 backdrop-blur-md border-2 border-[#ED145B] rounded-2xl p-4 shadow-xl shadow-[#ED145B]/15 w-[260px] text-left transition-all hover:scale-[1.02]">
      <Handle type="source" position={Position.Right} className="!bg-[#ED145B] !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#ED145B]/15 border border-[#ED145B]/30 flex items-center justify-center text-[#ED145B] shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            Human-in-the-Loop
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[10px] text-muted-foreground">Gateway Supervisor & Safety Control</div>
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>AwaitHumans: ON</span>
        <span className="text-[#ED145B] font-bold">JEV: 100ms</span>
      </div>
    </div>
  );
}

// Node Workflow Pipeline trong sơ đồ kéo thả
function WorkflowPipelineNode({ data }: { data: any }) {
  return (
    <div
      onClick={data.onExecute}
      className={`bg-card/95 backdrop-blur-md border rounded-2xl p-3.5 shadow-lg w-[280px] text-left transition-all hover:scale-[1.02] cursor-pointer ${
        data.enabled ? "border-[#ED145B]/50 shadow-[#ED145B]/10" : "border-border/60 opacity-70"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-[#ED145B] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-[#ED145B] !w-2.5 !h-2.5" />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              data.enabled ? "bg-[#ED145B]/15 text-[#ED145B]" : "bg-muted text-muted-foreground"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
            {data.title}
          </span>
        </div>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
            data.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
          }`}
        >
          {data.enabled ? "Active" : "Paused"}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
        {data.description}
      </p>

      {/* Steps mini list */}
      <div className="flex flex-wrap items-center gap-1">
        {data.steps?.slice(0, 3).map((st: any, idx: number) => (
          <span
            key={idx}
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
              st.type === "trigger"
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : st.type === "condition"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {st.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Node Agent SOUL trong sơ đồ kéo thả
function AgentNode({ data }: { data: any }) {
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-3 shadow-md w-[240px] text-left transition-all hover:scale-[1.02]">
      <Handle type="target" position={Position.Left} className="!bg-[#ED145B] !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0 border border-border">
          {data.avatar || "🤖"}
        </div>
        <div className="truncate">
          <div className="text-xs font-bold text-foreground truncate">{data.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{data.role || data.department}</div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px]">
        <span className="font-mono text-muted-foreground">{data.model || "claude-3-7-sonnet"}</span>
        <span className="text-emerald-400 font-bold">Ready</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  supervisor: SupervisorNode,
  workflowNode: WorkflowPipelineNode,
  agentNode: AgentNode,
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrigger, setNewTrigger] = useState("Quota < 15%");
  const [newAction, setNewAction] = useState("Switch Account");
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/souls")
      .then((r) => r.json())
      .then((data) => {
        if (data.souls && data.souls.length > 0) {
          setAgents(data.souls);
        } else {
          setAgents([
            { id: "1", name: "Trí — Senior Angular Lead", avatar: "🅰️", role: "Frontend Lead", model: "claude-3-7-sonnet" },
            { id: "2", name: "Bảo — Lead DevOps & SRE", avatar: "🚀", role: "DevOps & Cloud", model: "gemini-2.5-flash" },
            { id: "3", name: "Linh — Security & HITL", avatar: "🛡️", role: "Security Auditor", model: "gemini-2.5-pro" },
            { id: "4", name: "Hải — FinOps Specialist", avatar: "⚡", role: "Cost Optimizer", model: "gemini-2.5-flash-lite" },
          ]);
        }
      })
      .catch(() => {});
  }, []);

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
      description: "Quy trình tự động hóa tùy chỉnh cho hệ thống.",
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

  // React Flow Nodes & Edges
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [
      {
        id: "supervisor-hitl",
        type: "supervisor",
        position: { x: 30, y: 150 },
        data: {},
      },
    ];

    const flowEdges: Edge[] = [];

    // Cột 2: Workflow Pipelines
    workflows.forEach((wf, idx) => {
      const wfNodeId = `wf-node-${wf.id}`;
      flowNodes.push({
        id: wfNodeId,
        type: "workflowNode",
        position: { x: 370, y: 20 + idx * 110 },
        data: {
          ...wf,
          onExecute: () => handleExecute(wf),
        },
      });

      flowEdges.push({
        id: `e-sup-${wfNodeId}`,
        source: "supervisor-hitl",
        target: wfNodeId,
        animated: wf.enabled,
        style: {
          stroke: wf.enabled ? "#ED145B" : "#555",
          strokeWidth: wf.enabled ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: wf.enabled ? "#ED145B" : "#555",
        },
      });

      // Cột 3: Nối từ Workflow sang Agent đích
      if (agents.length > 0) {
        const targetAgent = agents[idx % agents.length];
        const agentNodeId = `agent-node-${targetAgent.id || targetAgent._id || idx}`;

        if (!flowNodes.some((n) => n.id === agentNodeId)) {
          flowNodes.push({
            id: agentNodeId,
            type: "agentNode",
            position: { x: 740, y: 35 + (idx % agents.length) * 110 },
            data: targetAgent,
          });
        }

        flowEdges.push({
          id: `e-${wfNodeId}-${agentNodeId}`,
          source: wfNodeId,
          target: agentNodeId,
          animated: wf.enabled,
          style: {
            stroke: wf.enabled ? "#10b981" : "#444",
            strokeWidth: wf.enabled ? 1.8 : 1,
            strokeDasharray: wf.enabled ? "5,5" : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: wf.enabled ? "#10b981" : "#444",
          },
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [workflows, agents]);

  const activeCount = workflows.filter((w) => w.enabled).length;
  const totalExecutions = workflows.reduce((acc, w) => acc + w.executionCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card to-background border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ED145B]/10 text-[#ED145B] border border-[#ED145B]/20">
                <Workflow className="w-3 h-3" /> TỰ ĐỘNG HÓA WORKFLOWS & CANVASES
              </span>
              <span className="text-xs text-muted-foreground">• Mạng Lưới Sơ Đồ Điều Phối Kéo Thả</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quy trình Tự động hóa & Sơ đồ Kéo Thả
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Xây dựng các kịch bản tự động hóa luân chuyển tài khoản, xử lý rủi ro token và định tuyến các tác vụ giữa con người (Human-in-the-Loop) và các nhân sự AI.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/dashboard/agents">
              <Button variant="outline" className="rounded-xl h-9 text-xs gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Quản lý Agents (CRUD)
              </Button>
            </Link>
            <Link href="/dashboard/harness">
              <Button
                variant="outline"
                className="rounded-xl h-9 text-xs font-semibold border-[#ED145B]/30 text-[#ED145B] hover:bg-[#ED145B]/10 gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Bảng Kéo Thả Task HITL →
              </Button>
            </Link>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-semibold rounded-xl h-9 text-xs shadow-md shadow-[#ED145B]/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Quy trình mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              TỔNG QUY TRÌNH
            </div>
            <div className="text-2xl font-black text-foreground mt-0.5">{workflows.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ED145B]/10 text-[#ED145B] flex items-center justify-center border border-[#ED145B]/20">
            <Workflow className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ĐANG KÍCH HOẠT
            </div>
            <div className="text-2xl font-black text-emerald-500 mt-0.5">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              LƯỢT CHẠY TỰ ĐỘNG
            </div>
            <div className="text-2xl font-black text-purple-400 mt-0.5">
              {totalExecutions.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              TỶ LỆ THÀNH CÔNG
            </div>
            <div className="text-2xl font-black text-[#ED145B] mt-0.5">99.9%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ED145B]/10 text-[#ED145B] flex items-center justify-center border border-[#ED145B]/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ KÉO THẢ REACT FLOW (Human-in-the-Loop ↔ Workflows ↔ Agents) */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ED145B] animate-pulse" />
            <span className="text-xs font-bold text-foreground">
              Sơ Đồ Kéo Thả Điều Phối: Human-in-the-Loop ↔ Tự Động Hóa Pipelines ↔ Nhân Sự AI
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Tương tác: Kéo thả vị trí các node, lăn chuột để phóng to/thu nhỏ, nhấp vào thẻ để chạy thử
          </span>
        </div>
        <div className="h-[480px] w-full bg-background/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-right"
          >
            <Background color="#333" gap={20} size={1} />
            <Controls
              className="!bg-[#0d0d12] !border !border-border/80 !rounded-xl shadow-xl overflow-hidden"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Danh sách Chi tiết Quy trình Workflows (Cards List) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ED145B]" /> Danh Sách Pipelines Tự Động Hóa
          </h2>
          <span className="text-xs text-muted-foreground">
            Bấm "Chạy ngay" để kích hoạt kiểm thử hoặc dùng công tắc để tạm dừng/bật
          </span>
        </div>

        <div className="grid gap-3">
          {workflows.map((wf) => {
            return (
              <div
                key={wf.id}
                className={`bg-card border rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  wf.enabled
                    ? "border-border/80 hover:border-[#ED145B]/40 shadow-xs"
                    : "border-border/40 opacity-70 bg-card/50"
                }`}
              >
                {/* Info & Steps */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        wf.enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    <h3 className="font-bold text-sm text-foreground truncate">{wf.title}</h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 ${
                        wf.enabled
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {wf.enabled ? "Đang chạy" : "Tạm dừng"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{wf.description}</p>

                  {/* Flow Steps Pipeline Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {wf.steps.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg border font-mono ${
                            st.type === "trigger"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                              : st.type === "condition"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          }`}
                        >
                          <span className="opacity-60 text-[9px] uppercase mr-1">[{st.type}]</span>
                          {st.label}
                        </span>
                        {idx < wf.steps.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Controls */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                  <div className="text-right text-[11px] font-mono text-muted-foreground">
                    <div>
                      Đã chạy: <strong className="text-foreground">{wf.executionCount}</strong> lần
                    </div>
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

      {/* Modal Tạo Quy trình mới */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#ED145B]" /> Tạo Quy Trình Mới
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Định nghĩa Trigger và Action tự động điều phối tài khoản & agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên quy trình</Label>
              <Input
                placeholder="VD: Auto Failover khi Ping cao..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Điều kiện kích hoạt (Trigger)</Label>
              <Select value={newTrigger} onValueChange={setNewTrigger}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quota < 15%">Quota còn dưới 15%</SelectItem>
                  <SelectItem value="Quota < 5%">Quota còn dưới 5% (Khẩn cấp)</SelectItem>
                  <SelectItem value="Ping > 300ms">Ping Proxy vượt quá 300ms</SelectItem>
                  <SelectItem value="RateLimit 429">Gặp lỗi Rate Limit (429)</SelectItem>
                  <SelectItem value="Prompt < 500t">Prompt siêu ngắn &lt; 500 tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hành động tự động (Action)</Label>
              <Select value={newAction} onValueChange={setNewAction}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Switch Account">Chuyển tiếp tài khoản khác trong nhóm</SelectItem>
                  <SelectItem value="Fallback Claude">Fallback sang Claude 3.7 Sonnet</SelectItem>
                  <SelectItem value="Fast Gemini Flash">Định tuyến sang Gemini Flash 2.5</SelectItem>
                  <SelectItem value="Hot Swap Proxy">Thay đổi IP Proxy dự phòng</SelectItem>
                  <SelectItem value="Notify Discord">Gửi cảnh báo Webhook Discord/Slack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-bold text-xs"
            >
              Lưu và Kích hoạt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
