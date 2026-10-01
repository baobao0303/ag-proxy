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
  Zap,
  Code2,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  BookOpen,
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

// Danh sách các Persona Template mẫu
const PERSONA_TEMPLATES = [
  {
    id: "angular",
    label: "🅰️ Senior Angular",
    name: "Trí — Senior Angular Architect",
    role: "Senior Angular Architect & Frontend Lead",
    dept: "Frontend Core Engineering",
    avatar: "🅰️",
    model: "claude-3-7-sonnet",
    budget: 15000000,
    tagline: "Chuyên gia Angular 19, kiến trúc Signals, RxJS và tối ưu hiệu năng web.",
    content: `# SOUL.md - Trí (Senior Angular Architect)

## 1. Định Danh & Tính Cách (Persona)
- **Vai trò:** Trưởng nhóm kiến trúc Angular cao cấp tại công ty.
- **Phong cách làm việc:** Cẩn trọng, tỉ mỉ, tuân thủ nghiêm ngặt chuẩn Angular 19 (Signals, Standalone components, OnPush change detection).
- **Nguyên tắc cốt lõi:** Không bao giờ chấp nhận memory leak, không lạm dụng any, code sạch sẽ và có kiểm thử đầy đủ.

## 2. Hạn Mức Token & Quy Tắc An Toàn (JEV Reflex)
- **Lương Token:** Được cấp ngân sách 15,000,000 tokens/tháng cho hoạt động review code, refactor và benchmark.
- **Hành vi READ:** Cho phép tự động đọc code, AST parsing và tra cứu tài liệu.
- **Hành vi WRITE:** Cần tạo Pull Request và kiểm tra lint trước khi apply.
- **Hành vi DANGEROUS:** Bắt buộc kích hoạt cổng kiểm duyệt Human-in-the-Loop (AwaitHumans).`,
  },
  {
    id: "devops",
    label: "⚙️ Lead DevOps",
    name: "Bảo — Lead DevOps & SRE",
    role: "Lead DevOps Engineer & Cloud SRE",
    dept: "Cloud Infrastructure",
    avatar: "⚙️",
    model: "gemini-2.5-pro",
    budget: 20000000,
    tagline: "Chỉ huy hạ tầng Docker, Kubernetes, CI/CD Jenkins và hệ thống Cloud.",
    content: `# SOUL.md - Bảo (Lead DevOps & SRE)

## 1. Định Danh & Tính Cách (Persona)
- **Vai trò:** Kiến trúc sư trưởng hạ tầng đám mây và hệ thống triển khai CI/CD.
- **Phong cách:** Thực dụng, an toàn tuyệt đối, ưu tiên tính sẵn sàng (High Availability) và zero-downtime.

## 2. Kiểm Soát JEV Reflex & HITL
- **Ngân sách:** 20M tokens/tháng phục vụ monitoring và build pipelines.
- **Quy tắc an toàn:** Mọi thao tác deploy lên Production hoặc thay đổi mạng Docker bắt buộc phải qua cổng Human-in-the-Loop.`,
  },
  {
    id: "security",
    label: "🛡️ Security Lead",
    name: "Linh — Security & Compliance Auditor",
    role: "Chief Information Security Auditor",
    dept: "Cyber Security & Compliance",
    avatar: "🛡️",
    model: "claude-3-7-sonnet",
    budget: 12000000,
    tagline: "Giám sát an ninh mạng, rà soát lỗ hổng CVE và thực thi chuẩn HITL.",
    content: `# SOUL.md - Linh (Security & Compliance Auditor)

## 1. Định Danh & Tính Cách (Persona)
- **Vai trò:** Kiểm toán viên an toàn thông tin độc lập.
- **Tôn chỉ:** Zero-Trust. Mọi đoạn code và request đều tiềm ẩn nguy cơ cho đến khi được chứng minh an toàn.
- **Nhiệm vụ:** Đánh giá điểm rủi ro JEV, chặn các hành vi injection và rò rỉ secret key.`,
  },
  {
    id: "finops",
    label: "💰 Cost FinOps",
    name: "Hải — Cloud Cost & FinOps Specialist",
    role: "FinOps Specialist & Token Optimizer",
    dept: "Finance & Resource Optimization",
    avatar: "💰",
    model: "gemini-2.5-flash",
    budget: 8000000,
    tagline: "Tối ưu hóa ngân sách LLM, giám sát chi phí token và quota dự án.",
    content: `# SOUL.md - Hải (Cloud Cost & FinOps Specialist)

## 1. Định Danh & Tính Cách (Persona)
- **Vai trò:** Chuyên gia quản trị chi phí AI và tài nguyên đám mây.
- **Mục tiêu:** Giảm thiểu chi phí token không cần thiết, tự động đề xuất chuyển đổi model nhẹ hơn cho các tác vụ lặp lại.`,
  },
];

const AVATAR_OPTIONS = ["🤖", "🅰️", "⚙️", "🛡️", "💰", "🧠", "🚀", "💻", "⚡", "🔬", "📊", "🎯"];

// Custom Node cho Human-in-the-Loop Gateway
function SupervisorNode() {
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");

  // Form State
  const [formAgent, setFormAgent] = useState<Partial<ISoulMember>>({
    name: "",
    memberRole: "",
    department: "Engineering",
    avatar: "🤖",
    tagline: "",
    modelPreference: "claude-3-7-sonnet",
    monthlyTokenBudget: 15000000,
    tokensUsedThisMonth: 0,
    status: "running",
    content: PERSONA_TEMPLATES[0].content,
    jevConfig: {
      readPolicy: "allow",
      writePolicy: "confirm",
      dangerousPolicy: "confirm",
      riskThresholdConfirm: 0.35,
      riskThresholdBlock: 0.75,
    },
  });

  const MOCKUP_COMPANY_AGENTS: ISoulMember[] = useMemo(
    () => [
      {
        _id: "mock-1",
        name: "Trí — Senior Angular & Frontend Architect",
        slug: "tri-senior-angular",
        memberRole: "Senior Frontend & Architecture Specialist",
        department: "Frontend Core (Angular / Micro-FE)",
        avatar: "🅰️",
        tagline: "Kiến trúc sư trưởng Angular 19, Signals, RxJS và Module Federation",
        personaPreset: "professional",
        modelPreference: "claude-3-7-sonnet",
        status: "running",
        monthlyTokenBudget: 15000000,
        tokensUsedThisMonth: 3420000,
        tasksCompleted: 428,
        isDefault: true,
        jevConfig: {
          readPolicy: "allow",
          writePolicy: "confirm",
          dangerousPolicy: "confirm",
          riskThresholdConfirm: 0.35,
          riskThresholdBlock: 0.75,
        },
        content: PERSONA_TEMPLATES[0].content,
      },
      {
        _id: "mock-2",
        name: "Bảo — Lead DevOps & Cloud Gateway Director",
        slug: "bao-lead-devops",
        memberRole: "DevOps & Proxy Quota Director",
        department: "Infrastructure & Gateway",
        avatar: "⚙️",
        tagline: "Chỉ huy trưởng hạ tầng Docker, CI/CD, tự động điều phối Quota và Proxy",
        personaPreset: "default",
        modelPreference: "gemini-2.5-pro",
        status: "running",
        monthlyTokenBudget: 20000000,
        tokensUsedThisMonth: 7850000,
        tasksCompleted: 1250,
        isDefault: false,
        jevConfig: {
          readPolicy: "allow",
          writePolicy: "confirm",
          dangerousPolicy: "confirm",
          riskThresholdConfirm: 0.30,
          riskThresholdBlock: 0.70,
        },
        content: PERSONA_TEMPLATES[1].content,
      },
      {
        _id: "mock-3",
        name: "Linh — Senior Backend & Security Gatekeeper",
        slug: "linh-security-gatekeeper",
        memberRole: "Security & Zero-Trust Auditor",
        department: "Backend Security & Compliance",
        avatar: "🛡️",
        tagline: "Vệ binh bảo mật dữ liệu, phụ trách middleware JEV chặn rủi ro 100ms",
        personaPreset: "terse",
        modelPreference: "claude-3-7-sonnet",
        status: "running",
        monthlyTokenBudget: 12000000,
        tokensUsedThisMonth: 1950000,
        tasksCompleted: 512,
        isDefault: false,
        jevConfig: {
          readPolicy: "allow",
          writePolicy: "confirm",
          dangerousPolicy: "block",
          riskThresholdConfirm: 0.25,
          riskThresholdBlock: 0.60,
        },
        content: PERSONA_TEMPLATES[2].content,
      },
      {
        _id: "mock-4",
        name: "Hải — Cost Optimizer & Prompt Compressor",
        slug: "hai-cost-optimizer",
        memberRole: "Token Cost & Context Optimizer",
        department: "AI Performance Lab",
        avatar: "💰",
        tagline: "Chuyên gia tối ưu hóa chi phí token và nén context thông minh",
        personaPreset: "tutor",
        modelPreference: "gemini-2.5-flash",
        status: "running",
        monthlyTokenBudget: 8000000,
        tokensUsedThisMonth: 4150000,
        tasksCompleted: 780,
        isDefault: false,
        jevConfig: {
          readPolicy: "allow",
          writePolicy: "allow",
          dangerousPolicy: "confirm",
          riskThresholdConfirm: 0.40,
          riskThresholdBlock: 0.80,
        },
        content: PERSONA_TEMPLATES[3].content,
      },
    ],
    []
  );

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/souls");
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : json?.data && Array.isArray(json.data)
          ? json.data
          : [];
        if (list.length > 0) {
          setAgents(list);
          return;
        }
      }
      // Luôn đảm bảo có dữ liệu mẫu nếu API trả về mảng rỗng
      setAgents(MOCKUP_COMPANY_AGENTS);
    } catch (e) {
      console.warn("Dùng mockup agents do lỗi kết nối:", e);
      setAgents(MOCKUP_COMPANY_AGENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleLoadMockup = () => {
    setAgents(MOCKUP_COMPANY_AGENTS);
    toast.success("Đã mở dữ liệu mẫu (Mockup Data) cho 4 nhân sự AI!", {
      description: "Trí (Angular), Bảo (DevOps), Linh (Security) và Hải (FinOps)",
    });
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditorTab("edit");
    setFormAgent({
      name: "",
      memberRole: "",
      department: "Engineering",
      avatar: "🤖",
      tagline: "",
      modelPreference: "claude-3-7-sonnet",
      monthlyTokenBudget: 15000000,
      tokensUsedThisMonth: 0,
      status: "running",
      content: PERSONA_TEMPLATES[0].content,
      jevConfig: {
        readPolicy: "allow",
        writePolicy: "confirm",
        dangerousPolicy: "confirm",
        riskThresholdConfirm: 0.35,
        riskThresholdBlock: 0.75,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ag: ISoulMember) => {
    setModalMode("edit");
    setEditorTab("edit");
    setFormAgent({
      ...ag,
      jevConfig: ag.jevConfig || {
        readPolicy: "allow",
        writePolicy: "confirm",
        dangerousPolicy: "confirm",
        riskThresholdConfirm: 0.35,
        riskThresholdBlock: 0.75,
      },
    });
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (tmpl: (typeof PERSONA_TEMPLATES)[0]) => {
    setFormAgent((prev) => ({
      ...prev,
      name: tmpl.name,
      memberRole: tmpl.role,
      department: tmpl.dept,
      avatar: tmpl.avatar,
      tagline: tmpl.tagline,
      modelPreference: tmpl.model,
      monthlyTokenBudget: tmpl.budget,
      content: tmpl.content,
    }));
    toast.success(`Đã áp dụng mẫu nhân sự: ${tmpl.label}`);
  };

  const handleSaveModal = async () => {
    if (!formAgent.name?.trim()) {
      toast.error("Vui lòng nhập tên nhân sự AI");
      return;
    }

    try {
      if (modalMode === "create") {
        const res = await fetch("/api/souls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formAgent),
        });
        if (!res.ok) throw new Error("Không thể tạo nhân sự mới");
        const created = await res.json();
        setAgents([created, ...agents]);
        toast.success(`Tuyển dụng thành công: ${created.name}!`);
      } else {
        const res = await fetch(`/api/souls/${formAgent._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formAgent),
        });
        if (!res.ok) throw new Error("Không thể cập nhật hồ sơ");
        const updated = await res.json();
        setAgents(agents.map((a) => (a._id === updated._id ? updated : a)));
        toast.success(`Đã lưu thay đổi cho: ${updated.name}`);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Lỗi lưu dữ liệu");
    }
  };

  const handleDeleteAgent = async (id?: string) => {
    if (!id || !confirm("Bạn có chắc chắn muốn xóa nhân sự AI này?")) return;
    try {
      const res = await fetch(`/api/souls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa agent");
      setAgents(agents.filter((a) => a._id !== id));
      toast.success("Đã xóa agent khỏi hệ thống");
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Lỗi xóa");
    }
  };

  const handleToggleStatus = async (id?: string) => {
    if (!id) return;
    const ag = agents.find((a) => a._id === id);
    if (!ag) return;
    const newStatus = ag.status === "running" ? "paused" : "running";

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
    toast.success(`Kích hoạt thành công: ${ag.name}`, {
      description: `Model: ${ag.modelPreference} • Ngân sách khả dụng: ${(
        (ag.monthlyTokenBudget - ag.tokensUsedThisMonth) /
        1000
      ).toLocaleString()}k tokens`,
    });
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
        position: { x: 40, y: 160 },
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
        position: { x: 400, y: startY + idx * spacingY },
        data: {
          ...ag,
          onSelect: () => handleOpenEditModal(ag),
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
            {/* Nút bật mockup data */}
            <Button
              variant="outline"
              onClick={handleLoadMockup}
              className="rounded-xl h-9 text-xs font-semibold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mở Mockup Data
            </Button>

            {/* Link sang trang kéo thả riêng biệt */}
            <Link href="/dashboard/workflows">
              <Button
                variant="outline"
                className="rounded-xl h-9 text-xs font-bold border-[#ED145B]/30 text-[#ED145B] hover:bg-[#ED145B]/10 gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Bảng Kéo Thả Workflows <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            <Button
              onClick={handleOpenCreateModal}
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
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ĐỘ CHÍNH XÁC
            </div>
            <div className="text-2xl font-black text-[#ED145B] mt-0.5">99.8%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ED145B]/10 text-[#ED145B] flex items-center justify-center border border-[#ED145B]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive React Flow Canvas - Chiều cao 500px */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ED145B] animate-pulse" />
            <span className="text-xs font-bold text-foreground">
              Sơ Đồ Mạng Lưới Điều Phối: Human-in-the-Loop ↔ AI Agents SOUL.md
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
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
            <Background color="#333" gap={20} size={1} />
            <Controls
              className="!bg-[#0d0d12] !border !border-border/80 !rounded-xl shadow-xl overflow-hidden"
              showInteractive={false}
            />
            <MiniMap
              bgColor="#0d0d12"
              maskColor="rgba(0, 0, 0, 0.75)"
              className="!bg-[#0d0d12] !border !border-border/80 !rounded-xl shadow-xl overflow-hidden"
              nodeColor={(n) => (n.id === "supervisor-hitl" ? "#ED145B" : "#10b981")}
              nodeStrokeColor="transparent"
              nodeBorderRadius={4}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>
      </div>

      {/* Filter and Search Bar: Filter bên trái, Search bên phải */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto order-2 sm:order-1">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8 font-semibold text-xs" : "h-8 text-xs"}
          >
            Tất cả ({agents.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "running" ? "default" : "outline"}
            onClick={() => setFilter("running")}
            className={filter === "running" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8 font-semibold text-xs" : "h-8 text-xs"}
          >
            Đang chạy ({runningCount})
          </Button>
        </div>

        <div className="relative w-full sm:w-72 order-1 sm:order-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm agent..."
            className="pl-9 h-9 rounded-xl border-border bg-background text-xs"
          />
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
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-base ${
                        isRunning
                          ? "bg-[#ED145B]/15 text-[#ED145B] border-[#ED145B]/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {ag.avatar || <Bot className="w-5 h-5" />}
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
                    onClick={() => handleOpenEditModal(ag)}
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

      {/* ========================================================================= */}
      {/* MODAL THIẾT KẾ MỚI SIÊU ĐẸP: 2 CỘT HIỆN ĐẠI (CHỈNH SỬA & TUYỂN DỤNG NHÂN SỰ) */}
      {/* ========================================================================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl bg-card border-border shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header Modal sang trọng */}
          <div className="px-6 py-4 border-b border-border/80 bg-gradient-to-r from-card via-card to-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ED145B]/15 border border-[#ED145B]/30 text-[#ED145B] flex items-center justify-center font-bold text-lg">
                {formAgent.avatar || <Bot className="w-5 h-5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  {modalMode === "create" ? "Tuyển Dụng Nhân Sự AI Mới Vào Công Ty" : "Hồ Sơ Nhân Sự & Bản Sắc SOUL.md"}
                  <Badge variant="outline" className="text-[10px] border-[#ED145B]/30 text-[#ED145B] font-mono">
                    Harness & JEV Reflex
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Định hình vai trò chuyên môn, cấp phát hạn mức ngân sách token và thiết lập phản xạ an toàn.
                </DialogDescription>
              </div>
            </div>

            {/* Quick Template Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
              <span className="text-[10px] font-semibold text-muted-foreground px-2">Mẫu nhanh:</span>
              {PERSONA_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg hover:bg-card hover:text-foreground text-muted-foreground transition-all flex items-center gap-1"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Body: Bố cục 2 Cột Cân Đối */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1">
            {/* CỘT TRÁI (5 Cols): Thông tin nhân sự, Ngân sách token & JEV */}
            <div className="lg:col-span-5 p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-border/80 bg-background/40">
              {/* Nhóm 1: Định Danh Nhân Sự */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#ED145B]" /> Thông Tin Cơ Bản
                </div>

                {/* Chọn Avatar Emoji nhanh */}
                <div>
                  <Label className="text-[11px] text-muted-foreground">Biểu tượng nhận diện</Label>
                  <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-1">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormAgent({ ...formAgent, avatar: emoji })}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                          formAgent.avatar === emoji
                            ? "bg-[#ED145B]/20 border-2 border-[#ED145B] scale-110 shadow-xs"
                            : "bg-muted/60 hover:bg-muted border border-border"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tên nhân sự AI</Label>
                  <Input
                    value={formAgent.name || ""}
                    onChange={(e) => setFormAgent({ ...formAgent, name: e.target.value })}
                    placeholder="VD: Trí — Senior Angular Architect"
                    className="h-9 text-xs bg-card border-border font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Chức danh (Role)</Label>
                    <Input
                      value={formAgent.memberRole || ""}
                      onChange={(e) => setFormAgent({ ...formAgent, memberRole: e.target.value })}
                      placeholder="VD: Senior Angular"
                      className="h-8 text-xs bg-card border-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Phòng ban</Label>
                    <Input
                      value={formAgent.department || ""}
                      onChange={(e) => setFormAgent({ ...formAgent, department: e.target.value })}
                      placeholder="VD: Frontend Core"
                      className="h-8 text-xs bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Model Ưu Tiên Xử Lý</Label>
                  <Select
                    value={formAgent.modelPreference || "claude-3-7-sonnet"}
                    onValueChange={(val) => setFormAgent({ ...formAgent, modelPreference: val })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-7-sonnet">⚡ Claude 3.7 Sonnet (Viết code & Kiến trúc)</SelectItem>
                      <SelectItem value="gemini-2.5-pro">🧠 Gemini 2.5 Pro (Suy luận sâu & Context lớn)</SelectItem>
                      <SelectItem value="gemini-2.5-flash">🚀 Gemini 2.5 Flash (Phản hồi siêu tốc 100ms)</SelectItem>
                      <SelectItem value="gpt-4o">🎯 OpenAI GPT-4o (Đa dụng & Logic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Nhóm 2: Thẻ Ngân Sách Lương Token Hàng Tháng (Thiết kế cao cấp) */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Coins className="w-4 h-4" /> Ngân Sách Lương Token Hàng Tháng
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Tự reset mỗi tháng</span>
                </div>

                {/* Quick Token Preset Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[5000000, 10000000, 15000000, 30000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormAgent({ ...formAgent, monthlyTokenBudget: amt })}
                      className={`py-1 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                        formAgent.monthlyTokenBudget === amt
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {amt / 1000000}M
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Hạn mức cấp (Tokens):</Label>
                    <Input
                      type="number"
                      step="1000000"
                      value={formAgent.monthlyTokenBudget || 0}
                      onChange={(e) =>
                        setFormAgent({
                          ...formAgent,
                          monthlyTokenBudget: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-xs font-mono font-bold bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-muted-foreground">Đã dùng tháng này:</Label>
                      <button
                        type="button"
                        onClick={() => setFormAgent({ ...formAgent, tokensUsedThisMonth: 0 })}
                        className="text-[9px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Reset
                      </button>
                    </div>
                    <Input
                      type="number"
                      value={formAgent.tokensUsedThisMonth || 0}
                      onChange={(e) =>
                        setFormAgent({
                          ...formAgent,
                          tokensUsedThisMonth: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-xs font-mono bg-background border-border"
                    />
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>Mức độ tiêu thụ</span>
                    <span className="font-bold text-foreground">
                      {formAgent.monthlyTokenBudget && formAgent.monthlyTokenBudget > 0
                        ? Math.round(((formAgent.tokensUsedThisMonth || 0) / formAgent.monthlyTokenBudget) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          formAgent.monthlyTokenBudget && formAgent.monthlyTokenBudget > 0
                            ? ((formAgent.tokensUsedThisMonth || 0) / formAgent.monthlyTokenBudget) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Cấu Hình Phản Xạ JEV Middleware */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ED145B]" /> Ngưỡng Phản Xạ JEV (100ms)
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Harness Engine</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Ngưỡng HITL Confirm (Cần người duyệt):</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formAgent.jevConfig?.riskThresholdConfirm || 0.35}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.6"
                      step="0.05"
                      value={formAgent.jevConfig?.riskThresholdConfirm || 0.35}
                      onChange={(e) =>
                        setFormAgent({
                          ...formAgent,
                          jevConfig: {
                            ...formAgent.jevConfig!,
                            riskThresholdConfirm: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-background rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Ngưỡng Block Tức Thì:</span>
                      <span className="font-mono font-bold text-[#ED145B]">
                        {formAgent.jevConfig?.riskThresholdBlock || 0.75}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.65"
                      max="0.95"
                      step="0.05"
                      value={formAgent.jevConfig?.riskThresholdBlock || 0.75}
                      onChange={(e) =>
                        setFormAgent({
                          ...formAgent,
                          jevConfig: {
                            ...formAgent.jevConfig!,
                            riskThresholdBlock: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-[#ED145B] h-1.5 bg-background rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (7 Cols): Trình Biên Tập SOUL.md Chuyên Nghiệp */}
            <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-3 bg-card/60">
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#ED145B]" />
                    <Label className="text-xs font-bold text-foreground">
                      Bản Sắc Cốt Lõi (SOUL.md Identity & System Prompt)
                    </Label>
                  </div>

                  {/* Tabs: Chỉnh sửa vs Xem trước */}
                  <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border">
                    <button
                      type="button"
                      onClick={() => setEditorTab("edit")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                        editorTab === "edit"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Code2 className="w-3 h-3" /> Soạn Thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                        editorTab === "preview"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Eye className="w-3 h-3" /> Xem Trước
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Khẩu hiệu / Tóm tắt tính cách</Label>
                  <Input
                    value={formAgent.tagline || ""}
                    onChange={(e) => setFormAgent({ ...formAgent, tagline: e.target.value })}
                    placeholder="VD: Kiến trúc sư Angular 19 với RxJS & Signals"
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 flex flex-col min-h-[300px]">
                  {editorTab === "edit" ? (
                    <Textarea
                      value={formAgent.content || ""}
                      onChange={(e) => setFormAgent({ ...formAgent, content: e.target.value })}
                      placeholder="# SOUL.md - Nhân cách, Tôn chỉ và Giới hạn hành vi..."
                      className="flex-1 w-full p-3 font-mono text-xs leading-relaxed bg-background/80 border-border rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-[#ED145B]"
                      rows={14}
                    />
                  ) : (
                    <div className="flex-1 p-3.5 bg-background/60 border border-border rounded-xl text-xs overflow-y-auto max-h-[340px] space-y-2 leading-relaxed">
                      <div className="text-[11px] font-mono text-[#ED145B] pb-1 border-b border-border/50">
                        📄 Preview SOUL.md rendered output
                      </div>
                      <pre className="font-mono text-xs whitespace-pre-wrap text-foreground/90 font-normal">
                        {formAgent.content}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Modal */}
          <div className="px-6 py-3.5 border-t border-border bg-card flex items-center justify-between">
            <div>
              {modalMode === "edit" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAgent(formAgent._id)}
                  className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Sa thải / Xóa Agent
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveModal}
                className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-bold text-xs rounded-xl shadow-md shadow-[#ED145B]/20 px-4"
              >
                {modalMode === "create" ? "Hoàn Tất Tuyển Dụng" : "Lưu Thay Đổi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
