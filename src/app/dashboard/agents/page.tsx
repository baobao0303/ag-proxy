"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Zap,
  Clock,
  Play,
  Trash2,
  Edit3,
  AlertTriangle,
  Check,
  FileText,
  Download,
  Terminal,
  Layers,
  UserCheck,
  Ban,
  GripVertical,
  Plus,
  Coins,
  Building2,
  RefreshCw,
  Power,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export interface IAgentTaskItem {
  _id?: string;
  title: string;
  description: string;
  type: "Task" | "User Story" | "Bug" | "Technical Story";
  actionType: "READ" | "WRITE" | "DANGEROUS";
  priority: "P0" | "P1" | "P2" | "P3";
  state: "New" | "Awaiting Human" | "Active" | "Resolved" | "Blocked";
  soulId?: any;
  agentName: string;
  assignedTo?: string;
  riskScore: number;
  jevEvaluation: {
    type: "boolean" | "choice" | "score";
    result: string;
    reason: string;
    evaluatedAt?: string;
  };
  humanReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    decision?: "approved" | "rejected";
    notes?: string;
  };
}

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<"personnel" | "kanban" | "jev">("personnel");

  // Data states
  const [souls, setSouls] = useState<ISoulMember[]>([]);
  const [tasks, setTasks] = useState<IAgentTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag & Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Task Dialog States
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<IAgentTaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState<"Task" | "User Story" | "Bug" | "Technical Story">("Task");
  const [taskActionType, setTaskActionType] = useState<"READ" | "WRITE" | "DANGEROUS">("WRITE");
  const [taskPriority, setTaskPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");
  const [taskSoulId, setTaskSoulId] = useState("");

  // Soul / Member Dialog States
  const [soulDialogOpen, setSoulDialogOpen] = useState(false);
  const [editingSoul, setEditingSoul] = useState<ISoulMember | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberDept, setMemberDept] = useState("");
  const [memberTagline, setMemberTagline] = useState("");
  const [memberModel, setMemberModel] = useState("gemini-3-flash");
  const [memberPreset, setMemberPreset] = useState<"default" | "professional" | "tutor" | "terse" | "custom">("professional");
  const [memberMonthlyBudget, setMemberMonthlyBudget] = useState(5000000);
  const [memberTokensUsed, setMemberTokensUsed] = useState(0);
  const [memberContent, setMemberContent] = useState("");
  const [memberRiskConfirm, setMemberRiskConfirm] = useState(0.35);
  const [memberRiskBlock, setMemberRiskBlock] = useState(0.75);

  // Interactive JEV Sandbox State
  const [jevInput, setJevInput] = useState("DROP TABLE accounts_staging");
  const [jevResult, setJevResult] = useState<{
    score: number;
    decision: "allow" | "confirm" | "block";
    reason: string;
    speedMs: number;
  } | null>(null);

  // Initial Data Fetching
  async function loadData() {
    setLoading(true);
    try {
      const [soulsRes, tasksRes] = await Promise.all([
        fetch("/api/souls"),
        fetch("/api/agent-tasks"),
      ]);
      const soulsJson = await soulsRes.json();
      const tasksJson = await tasksRes.json();

      if (soulsJson.success) setSouls(soulsJson.data || []);
      if (tasksJson.success) setTasks(tasksJson.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Không thể kết nối đến cơ sở dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // SOUL / AGENT MEMBER MANAGEMENT (CRUD + TOKEN BUDGET)
  // -------------------------------------------------------------
  function handleOpenCreateSoul() {
    setEditingSoul(null);
    setMemberName("");
    setMemberRole("");
    setMemberDept("Core Engineering");
    setMemberTagline("");
    setMemberPreset("professional");
    setMemberModel("claude-sonnet-4-6");
    setMemberMonthlyBudget(10000000);
    setMemberTokensUsed(0);
    setMemberRiskConfirm(0.35);
    setMemberRiskBlock(0.75);
    setMemberContent(`# Identity: Tên Nhân Sự — Chức Danh

## 1. Bản Sắc & Tính Cách (Persona)
- Vị trí: Chuyên viên kỹ thuật cao cấp trong công ty.
- Tôn chỉ làm việc: Trách nhiệm, sạch sẽ, không code ẩu, kiểm thử kỹ lưỡng trước khi hoàn tất.

## 2. Hạn Mức Token & Quy Tắc An Toàn
- Được cấp ngân sách token hàng tháng phục vụ công việc.
- Thao tác đột biến hoặc phá hủy dữ liệu bắt buộc phải qua phê duyệt Human-in-the-Loop.`);
    setSoulDialogOpen(true);
  }

  function handleOpenEditSoul(soul: ISoulMember) {
    setEditingSoul(soul);
    setMemberName(soul.name);
    setMemberRole(soul.memberRole || "");
    setMemberDept(soul.department || "Core Engineering");
    setMemberTagline(soul.tagline || "");
    setMemberPreset(soul.personaPreset || "professional");
    setMemberModel(soul.modelPreference || "gemini-3-flash");
    setMemberMonthlyBudget(soul.monthlyTokenBudget || 5000000);
    setMemberTokensUsed(soul.tokensUsedThisMonth || 0);
    setMemberRiskConfirm(soul.jevConfig?.riskThresholdConfirm ?? 0.35);
    setMemberRiskBlock(soul.jevConfig?.riskThresholdBlock ?? 0.75);
    setMemberContent(soul.content);
    setSoulDialogOpen(true);
  }

  async function handleSaveSoul() {
    if (!memberName.trim()) {
      toast.error("Vui lòng nhập tên nhân sự / Agent");
      return;
    }

    const payload = {
      name: memberName,
      memberRole,
      department: memberDept,
      tagline: memberTagline,
      personaPreset: memberPreset,
      modelPreference: memberModel,
      monthlyTokenBudget: Number(memberMonthlyBudget),
      tokensUsedThisMonth: Number(memberTokensUsed),
      content: memberContent,
      jevConfig: {
        readPolicy: "allow",
        writePolicy: "jev_check",
        dangerousPolicy: "confirm",
        riskThresholdConfirm: memberRiskConfirm,
        riskThresholdBlock: memberRiskBlock,
      },
    };

    try {
      if (editingSoul && editingSoul._id) {
        const res = await fetch(`/api/souls/${editingSoul._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Đã cập nhật hồ sơ & lương token cho "${memberName}"`);
          setSouls((prev) => prev.map((s) => (s._id === editingSoul._id ? json.data : s)));
          setSoulDialogOpen(false);
        } else {
          toast.error(json.error || "Lỗi cập nhật nhân sự");
        }
      } else {
        const res = await fetch("/api/souls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Đã tuyển dụng nhân sự AI "${memberName}" vào công ty!`);
          setSouls((prev) => [...prev, json.data]);
          setSoulDialogOpen(false);
        } else {
          toast.error(json.error || "Lỗi tạo nhân sự");
        }
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  async function handleToggleSoulStatus(soul: ISoulMember) {
    const nextStatus = soul.status === "running" ? "paused" : "running";
    try {
      const res = await fetch(`/api/souls/${soul._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setSouls((prev) => prev.map((s) => (s._id === soul._id ? { ...s, status: nextStatus } : s)));
        toast.success(
          nextStatus === "running"
            ? `Đã kích hoạt Agent "${soul.name}" làm việc!`
            : `Đã tạm dừng Agent "${soul.name}".`
        );
      }
    } catch {
      toast.error("Lỗi khi chuyển trạng thái nhân sự");
    }
  }

  async function handleRunTestAgent(soul: ISoulMember) {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: `Đang kết nối SOUL.md của ${soul.name}...`,
        success: `${soul.name} đã sẵn sàng nhận lệnh với chuẩn tác phong ${soul.personaPreset}!`,
        error: "Lỗi chạy agent",
      }
    );
  }

  async function handleDeleteSoul(soulId: string) {
    try {
      const res = await fetch(`/api/souls/${soulId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Đã xoá nhân sự & hồ sơ SOUL.md");
        setSouls((prev) => prev.filter((s) => s._id !== soulId));
      } else {
        toast.error(json.error || "Lỗi xoá");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  function handleDownloadSoul(soul: ISoulMember) {
    const blob = new Blob([soul.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOUL-${soul.slug || "member"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã tải file SOUL.md của ${soul.name}`);
  }

  // -------------------------------------------------------------
  // TASK ACTIONS (CRUD + DRAG & DROP)
  // -------------------------------------------------------------
  function handleOpenCreateTask(assignedSoul?: ISoulMember) {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskType("Task");
    setTaskActionType("WRITE");
    setTaskPriority("P2");
    setTaskSoulId(assignedSoul?._id || souls[0]?._id || "");
    setTaskDialogOpen(true);
  }

  function handleOpenEditTask(task: IAgentTaskItem) {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskType(task.type);
    setTaskActionType(task.actionType);
    setTaskPriority(task.priority);
    setTaskSoulId(task.soulId?._id || task.soulId || "");
    setTaskDialogOpen(true);
  }

  async function handleSaveTask() {
    if (!taskTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề tác vụ");
      return;
    }

    const assignedSoul = souls.find((s) => s._id === taskSoulId);

    try {
      if (editingTask && editingTask._id) {
        const res = await fetch(`/api/agent-tasks/${editingTask._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            type: taskType,
            actionType: taskActionType,
            priority: taskPriority,
            soulId: taskSoulId || null,
            agentName: assignedSoul?.name || "Autonomous Agent",
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Đã cập nhật tác vụ thành công");
          setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? json.data : t)));
          setTaskDialogOpen(false);
        } else {
          toast.error(json.error || "Lỗi cập nhật tác vụ");
        }
      } else {
        const res = await fetch("/api/agent-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            type: taskType,
            actionType: taskActionType,
            priority: taskPriority,
            soulId: taskSoulId || null,
            agentName: assignedSoul?.name || "Autonomous Agent",
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Đã giao việc thành công cho ${assignedSoul?.name || "Agent"}!`);
          setTasks((prev) => [json.data, ...prev]);
          setTaskDialogOpen(false);
          setActiveTab("kanban");
        } else {
          toast.error(json.error || "Lỗi tạo tác vụ");
        }
      }
    } catch {
      toast.error("Lỗi mạng khi lưu tác vụ");
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      const res = await fetch(`/api/agent-tasks/${taskId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Đã xoá tác vụ");
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      } else {
        toast.error(json.error || "Lỗi xoá");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function handleReviewTask(taskId: string, decision: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/agent-tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: decision === "approved" ? "Human operator approved execution." : "Blocked by operator review.",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          decision === "approved"
            ? "Đã DUYỆT tác vụ! Agent đang chạy..."
            : "Đã TỪ CHỐI tác vụ!"
        );
        setTasks((prev) => prev.map((t) => (t._id === taskId ? json.data : t)));
      }
    } catch {
      toast.error("Lỗi khi gửi phản hồi");
    }
  }

  // Drag and Drop
  function handleDragStart(taskId: string) {
    setDraggingTaskId(taskId);
  }

  function handleDragOver(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    setDragOverColumn(columnKey);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: React.DragEvent, targetState: IAgentTaskItem["state"]) {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingTaskId) return;

    const task = tasks.find((t) => t._id === draggingTaskId);
    if (!task || task.state === targetState) {
      setDraggingTaskId(null);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t._id === draggingTaskId ? { ...t, state: targetState } : t))
    );
    toast.info(`Chuyển tác vụ sang "${targetState}"`);

    try {
      await fetch(`/api/agent-tasks/${draggingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
      loadData();
    } finally {
      setDraggingTaskId(null);
    }
  }

  // JEV Reflex Simulation
  function runJevSimulation() {
    const text = jevInput.toLowerCase();
    let score = 0.1;
    let decision: "allow" | "confirm" | "block" = "allow";
    let reason = "An toàn, cho phép đi thẳng xuống Database.";

    if (
      text.includes("drop") ||
      text.includes("rm -rf") ||
      text.includes("delete all") ||
      text.includes("format")
    ) {
      score = 0.98;
      decision = "block";
      reason = "Phát hiện lệnh nguy hiểm cực độ. JEV tự động BLOCK trong 100ms, 0đ chi phí token.";
    } else if (
      text.includes("delete") ||
      text.includes("xoá") ||
      text.includes("refund") ||
      text.includes("hoàn tiền") ||
      text.includes("update") ||
      text.includes("sửa")
    ) {
      score = 0.58;
      decision = "confirm";
      reason = "Thao tác đột biến dữ liệu (WRITE/DELETE). Cờ vàng: Yêu cầu Human-in-the-Loop phê duyệt.";
    } else {
      score = 0.05;
      decision = "allow";
      reason = "Truy vấn READ-ONLY thông thường. Phản xạ JEV cho qua 100ms thẳng vào hạ tầng.";
    }

    setJevResult({
      score,
      decision,
      reason,
      speedMs: Math.floor(Math.random() * 40 + 60),
    });
  }

  // Kanban Columns
  const KANBAN_COLUMNS: {
    key: IAgentTaskItem["state"];
    title: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      key: "New",
      title: "Chờ Tiếp Nhận (Intake)",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/5",
      borderColor: "border-blue-500/20",
    },
    {
      key: "Awaiting Human",
      title: "Chờ Duyệt (Await Humans)",
      icon: UserCheck,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      key: "Active",
      title: "Đang Thực Thi (Active)",
      icon: Zap,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/5",
      borderColor: "border-emerald-500/20",
    },
    {
      key: "Resolved",
      title: "Hoàn Thành (Resolved)",
      icon: Check,
      color: "text-purple-400",
      bgColor: "bg-purple-500/5",
      borderColor: "border-purple-500/20",
    },
    {
      key: "Blocked",
      title: "Bị Chặn (Blocked by JEV)",
      icon: Ban,
      color: "text-rose-400",
      bgColor: "bg-rose-500/5",
      borderColor: "border-rose-500/20",
    },
  ];

  // Company Overview Metrics
  const totalBudget = souls.reduce((acc, s) => acc + (s.monthlyTokenBudget || 0), 0);
  const totalUsed = souls.reduce((acc, s) => acc + (s.tokensUsedThisMonth || 0), 0);
  const overallUsagePct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  const awaitingCount = tasks.filter((t) => t.state === "Awaiting Human").length;

  return (
    <div className="space-y-5 pb-10">
      {/* Company Header Banner */}
      <div className="bg-gradient-to-br from-[#1C1626] via-[#14131E] to-[#0D0E14] border border-white/[0.08] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              COMPANY AI WORKFORCE &amp; SOUL.MD
            </span>
            <span className="text-xs text-slate-400 font-mono">Monthly Token Quota • JEV Reflex</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            Đội Ngũ Nhân Sự AI &amp; Hạn Mức Token Hàng Tháng
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Mỗi Agent là một nhân sự AI chuyên môn hóa mang bản sắc <strong>SOUL.md</strong> riêng biệt (như Trí Senior Angular, Bảo Lead DevOps),
            được cấp hạn mức token hàng tháng và được bảo vệ bởi middleware phản xạ JEV đánh chặn 100ms.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => handleOpenCreateTask()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Giao Việc Mới (Task)
          </Button>
          <Button
            onClick={handleOpenCreateSoul}
            variant="outline"
            className="border-white/20 hover:bg-white/10 text-white font-medium rounded-xl text-xs gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-rose-400" /> Tuyển Agent Mới
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics: Company Token Budgeting */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Tổng Nhân Sự AI
            </div>
            <div className="text-2xl font-black text-foreground mt-0.5 flex items-baseline gap-1.5">
              {souls.length}
              <span className="text-[10px] font-semibold text-emerald-500">nhân sự</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Bot className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Quỹ Token Tháng Này
            </div>
            <div className="text-2xl font-black text-emerald-500 mt-0.5 flex items-baseline gap-1.5">
              {(totalBudget / 1_000_000).toFixed(1)}M
              <span className="text-[10px] font-semibold text-muted-foreground">Tokens</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Coins className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Token Đã Dùng Tháng
            </div>
            <div className="text-2xl font-black text-amber-500 mt-0.5 flex items-baseline gap-1.5">
              {(totalUsed / 1_000_000).toFixed(2)}M
              <span className="text-[10px] font-semibold text-muted-foreground">({overallUsagePct}%)</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Awaiting Human (HITL)
            </div>
            <div className="text-2xl font-black text-rose-500 mt-0.5 flex items-baseline gap-1.5">
              {awaitingCount}
              <span className="text-[10px] font-semibold text-muted-foreground">cần duyệt</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/70 pb-2">
        <button
          onClick={() => setActiveTab("personnel")}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "personnel"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Danh Sách Nhân Sự &amp; SOUL.md ({souls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "kanban"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bảng Kéo Thả Task HITL (Harness)</span>
          {awaitingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-extrabold rounded-full">
              {awaitingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("jev")}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "jev"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Giám Sát Phản Xạ JEV Middleware (100ms)</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: COMPANY AI PERSONNEL (SOUL.MD & MONTHLY TOKEN BUDGET) */}
      {/* ============================================================= */}
      {activeTab === "personnel" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mỗi Agent được định nghĩa danh tính, tác phong làm việc qua file <strong>SOUL.md</strong> và cấp hạn mức ngân sách token tiêu thụ theo tháng.
            </span>
            <Button
              onClick={handleOpenCreateSoul}
              size="sm"
              className="text-xs gap-1.5 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Nhân Sự AI
            </Button>
          </div>

          {/* Cards Grid: Styled after the original screenshot cards, upgraded with company roles & token budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {souls.map((soul) => {
              const budget = soul.monthlyTokenBudget || 5000000;
              const used = soul.tokensUsedThisMonth || 0;
              const usedPct = Math.min(100, Math.round((used / budget) * 100));
              const isOverLimit = usedPct >= 90;
              const isWarning = usedPct >= 75 && usedPct < 90;

              return (
                <Card
                  key={soul._id || soul.slug}
                  className="p-4 bg-card/75 border-border/80 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-all shadow-2xs space-y-3.5 group"
                >
                  {/* Top Bar: Icon, Name, Department & Status */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar / Icon */}
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shrink-0">
                          {soul.avatar || "🤖"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">
                              {soul.name}
                            </span>
                            {soul.isDefault && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/30 font-bold shrink-0">
                                CORE LEAD
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="text-foreground/90 font-semibold">{soul.memberRole || "AI Specialist"}</span>
                            <span>•</span>
                            <span className="text-muted-foreground">{soul.department || "Engineering"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          soul.status === "running"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {soul.status === "running" ? "Running" : "Paused"}
                      </Badge>
                    </div>

                    {/* Tagline / Mission */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {soul.tagline || "Nhân sự AI phụ trách xử lý tác vụ chuyên môn trong hạ tầng proxy."}
                    </p>

                    {/* Monthly Token Allowance / Salary Progress Bar */}
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          Hạn mức lương Token tháng:
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {used.toLocaleString()} / {budget.toLocaleString()} Tokens
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverLimit
                              ? "bg-rose-500"
                              : isWarning
                              ? "bg-amber-500"
                              : "bg-gradient-to-r from-primary to-emerald-400"
                          }`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Đã sử dụng: <strong className={isOverLimit ? "text-rose-500" : "text-foreground"}>{usedPct}%</strong></span>
                        <span>Hoàn thành: <strong className="text-foreground">{soul.tasksCompleted || 0} tasks</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Left: Model & Preset badges */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 font-normal">
                        ⚙️ {soul.modelPreference || "gemini-3-flash"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {soul.personaPreset || "default"}
                      </Badge>
                    </div>

                    {/* Right: Buttons */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleSoulStatus(soul)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={soul.status === "running" ? "Tạm dừng" : "Kích hoạt"}
                      >
                        <Power className={`w-3.5 h-3.5 ${soul.status === "running" ? "text-emerald-500" : "text-muted-foreground"}`} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadSoul(soul)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Tải file SOUL.md"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditSoul(soul)}
                        className="h-7 text-xs px-2.5 gap-1 font-medium cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                        <span>Sửa SOUL.md</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenCreateTask(soul)}
                        className="h-7 text-xs px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Giao Việc</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: KANBAN TASK BOARD (HARNESS + HITL AWAITHUMANS) */}
      {/* ============================================================= */}
      {activeTab === "kanban" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-primary" />
              <strong>Kéo và thả</strong> thẻ tác vụ giữa các cột để thay đổi trạng thái thực thi của Agent.
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Score &lt; 0.3: Allow
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                0.3 - 0.7: Confirm (HITL)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                &gt; 0.7: Block
              </span>
            </div>
          </div>

          {/* 5-Column Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.state === col.key);
              const isOver = dragOverColumn === col.key;
              const Icon = col.icon;

              return (
                <div
                  key={col.key}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`rounded-2xl border transition-all duration-200 min-h-[520px] flex flex-col ${
                    col.borderColor
                  } ${col.bgColor} ${
                    isOver ? "ring-2 ring-primary ring-offset-2 bg-primary/10 shadow-lg scale-[1.01]" : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${col.color}`} />
                      <span className="text-xs font-bold text-foreground">{col.title}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-extrabold px-1.5 py-0 rounded-full"
                    >
                      {colTasks.length}
                    </Badge>
                  </div>

                  {/* Tasks List */}
                  <div className="p-2.5 space-y-2.5 flex-1">
                    {colTasks.length === 0 ? (
                      <div className="h-32 border border-dashed border-border/40 rounded-xl flex items-center justify-center text-[11px] text-muted-foreground/60 italic">
                        Kéo thả task vào đây
                      </div>
                    ) : (
                      colTasks.map((t) => {
                        const isAwaiting = t.state === "Awaiting Human";

                        return (
                          <div
                            key={t._id}
                            draggable
                            onDragStart={() => handleDragStart(t._id!)}
                            className="bg-card hover:bg-card/90 border border-border/80 hover:border-primary/50 rounded-xl p-3 shadow-xs space-y-2 cursor-grab active:cursor-grabbing transition-all group"
                          >
                            {/* Card Top: Type & Priority */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-bold px-1.5 py-0 ${
                                    t.priority === "P0"
                                      ? "text-rose-500 border-rose-500/30 bg-rose-500/10"
                                      : t.priority === "P1"
                                      ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                                      : "text-muted-foreground border-border"
                                  }`}
                                >
                                  {t.priority}
                                </Badge>
                                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                                  {t.type}
                                </span>
                              </div>

                              {/* JEV Risk Score Badge */}
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-mono font-bold px-1.5 py-0 ${
                                  t.riskScore > 0.7
                                    ? "text-rose-500 border-rose-500/40 bg-rose-500/10"
                                    : t.riskScore >= 0.3
                                    ? "text-amber-500 border-amber-500/40 bg-amber-500/10"
                                    : "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
                                }`}
                              >
                                JEV {Math.round(t.riskScore * 100)}%
                              </Badge>
                            </div>

                            {/* Card Title */}
                            <div className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                              {t.title}
                            </div>

                            {/* Description snippet */}
                            {t.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {t.description}
                              </p>
                            )}

                            {/* JEV Evaluation Note */}
                            {t.jevEvaluation?.reason && (
                              <div className="text-[10px] text-muted-foreground bg-muted/40 p-1.5 rounded-md border border-border/40 font-mono">
                                <span className="text-foreground font-semibold">Reflex: </span>
                                {t.jevEvaluation.reason}
                              </div>
                            )}

                            {/* Human Review Banner if Awaiting */}
                            {isAwaiting && (
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1.5">
                                <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Cần Người Thao Tác Xác Nhận</span>
                                </div>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <Button
                                    size="sm"
                                    onClick={() => handleReviewTask(t._id!, "approved")}
                                    className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md flex-1 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 mr-0.5" /> Duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReviewTask(t._id!, "rejected")}
                                    className="h-6 text-[10px] px-2 font-bold rounded-md flex-1 cursor-pointer"
                                  >
                                    <Ban className="w-3 h-3 mr-0.5" /> Từ Chối
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Footer: Agent assigned & Actions */}
                            <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="truncate max-w-[120px] font-medium text-foreground/80">
                                🤖 {t.agentName || "Agent"}
                              </span>

                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEditTask(t)}
                                  className="p-1 hover:text-primary rounded cursor-pointer"
                                  title="Chỉnh sửa task"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(t._id!)}
                                  className="p-1 hover:text-rose-500 rounded cursor-pointer"
                                  title="Xoá task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: JEV REFLEX MIDDLEWARE MONITOR & INTERACTIVE TESTER */}
      {/* ============================================================= */}
      {activeTab === "jev" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 bg-card/70 border-border/80 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Kiến Trúc Phản Xạ: LLM (Bộ Não) vs JEV (Tiềm Thức)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nếu LLM là não để suy nghĩ chậm và tốn token (mỗi câu trả lời mất vài giây), thì JEV chính là phản xạ, là tiềm thức.
                JEV ra quyết định chỉ trong <strong>100ms với chi phí 0đ</strong>, bảo vệ database và hạ tầng an toàn tuyệt đối.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Quyền READ</div>
                  <div className="text-xs font-black text-foreground mt-0.5">Đi Thẳng</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Không qua middleware</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-amber-400 uppercase">Quyền WRITE</div>
                  <div className="text-xs font-black text-foreground mt-0.5">Qua JEV</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Đánh giá 100ms</div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-rose-400 uppercase">DANGEROUS</div>
                  <div className="text-xs font-black text-foreground mt-0.5">Human Confirm</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Chặn hoặc hỏi user</div>
                </div>
              </div>

              <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">3 Kiểu Chấm Điểm của JEV:</div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <strong className="text-primary shrink-0">1. Boolean:</strong>
                  <span>Đúng / Sai. Chặn tức thì các lệnh Drop Database, rm -rf trong 100ms.</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <strong className="text-primary shrink-0">2. Choice:</strong>
                  <span>Trắc nghiệm phân loại phòng ban hoặc phân loại Agent thụ lý.</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <strong className="text-primary shrink-0">3. Score (0 - 1.0):</strong>
                  <span>0 - 0.3 (An toàn, cho qua) • 0.3 - 0.7 (Hơi rủi ro, hỏi lại User) • &gt; 0.7 (Chặn luôn).</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/70 border-border/80 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span>Bộ Thử Nghiệm Phản Xạ JEV 100ms (Sandbox)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold text-emerald-400 border-emerald-500/30">
                    REALTIME REFLEX
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nhập lệnh hoặc hành động của AI Agent:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={jevInput}
                      onChange={(e) => setJevInput(e.target.value)}
                      placeholder="VD: DROP TABLE users hoặc hoàn tiền 200$..."
                      className="text-xs font-mono"
                    />
                    <Button
                      onClick={runJevSimulation}
                      className="text-xs font-bold shrink-0 gap-1.5 cursor-pointer bg-primary"
                    >
                      <Zap className="w-3.5 h-3.5" /> Bắn Reflex
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-muted-foreground self-center">Thử nhanh:</span>
                  <button
                    onClick={() => setJevInput("DROP DATABASE production_crm")}
                    className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md font-mono cursor-pointer"
                  >
                    DROP DATABASE
                  </button>
                  <button
                    onClick={() => setJevInput("Phê duyệt hoàn tiền 250$ qua cổng VNPay")}
                    className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md font-mono cursor-pointer"
                  >
                    Hoàn tiền $250
                  </button>
                  <button
                    onClick={() => setJevInput("get_student_schedule và đọc danh sách bài học")}
                    className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md font-mono cursor-pointer"
                  >
                    get_student_schedule
                  </button>
                </div>

                {jevResult && (
                  <div className="bg-black/40 border border-border/80 rounded-xl p-3.5 space-y-2 font-mono text-xs mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        Tốc độ phản xạ: <strong className="text-foreground">{jevResult.speedMs}ms</strong>
                      </span>
                      <Badge
                        className={`text-[10px] font-bold uppercase ${
                          jevResult.decision === "block"
                            ? "bg-rose-500 text-white"
                            : jevResult.decision === "confirm"
                            ? "bg-amber-500 text-black"
                            : "bg-emerald-500 text-white"
                        }`}
                      >
                        {jevResult.decision.toUpperCase()} (Score: {jevResult.score})
                      </Badge>
                    </div>

                    <p className="text-foreground leading-relaxed pt-1">
                      {jevResult.reason}
                    </p>

                    {jevResult.decision === "confirm" && (
                      <div className="text-[10px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        ⚡ Hành động này sẽ được đẩy tự động vào cột <strong>Awaiting Human</strong> trên Bảng Kanban để người vận hành duyệt!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: TẠO / SỬA NHÂN SỰ & HỒ SƠ SOUL.MD (FULL CRUD + TOKEN BUDGET) */}
      {/* ============================================================= */}
      <Dialog open={soulDialogOpen} onOpenChange={setSoulDialogOpen}>
        <DialogContent className="bg-popover border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSoul ? "Chỉnh Sửa Nhân Sự & Bản Sắc SOUL.md" : "Tuyển Dụng Nhân Sự AI Mới Vào Công Ty"}
            </DialogTitle>
            <DialogDescription>
              Cấu hình nhân cách cốt lõi SOUL.md, vai trò chuyên môn và cấp hạn mức ngân sách token hàng tháng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tên nhân sự AI</Label>
                <Input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="VD: Trí — Senior Angular"
                  className="text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Chức danh chuyên môn (Role)</Label>
                <Input
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="VD: Senior Frontend & Architecture Specialist"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Phòng ban (Department)</Label>
                <Input
                  value={memberDept}
                  onChange={(e) => setMemberDept(e.target.value)}
                  placeholder="VD: Frontend Core / DevOps"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Model ưu tiên xử lý</Label>
                <Select value={memberModel} onValueChange={setMemberModel}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-6">Claude 3.7 Sonnet (Viết code chuẩn nhất)</SelectItem>
                    <SelectItem value="gemini-3-flash">Gemini 3 Flash (Siêu tốc độ)</SelectItem>
                    <SelectItem value="gemini-3.1-pro-high">Gemini 3.1 Pro (Suy luận sâu)</SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Tiết kiệm token)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MONTHLY TOKEN ALLOWANCE */}
            <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" />
                  Ngân Sách Lương Token Hàng Tháng (Monthly Budget)
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">Reset vào ngày 1 hàng tháng</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Hạn mức cấp tháng (Tokens):</Label>
                  <Input
                    type="number"
                    step="1000000"
                    value={memberMonthlyBudget}
                    onChange={(e) => setMemberMonthlyBudget(parseInt(e.target.value) || 0)}
                    className="text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Ví dụ: 10,000,000 = 10 triệu tokens/tháng.
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] text-muted-foreground">Token đã dùng tháng này:</Label>
                    <button
                      type="button"
                      onClick={() => setMemberTokensUsed(0)}
                      className="text-[10px] text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Reset về 0
                    </button>
                  </div>
                  <Input
                    type="number"
                    value={memberTokensUsed}
                    onChange={(e) => setMemberTokensUsed(parseInt(e.target.value) || 0)}
                    className="text-xs font-mono"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Tỷ lệ đã dùng: {memberMonthlyBudget > 0 ? Math.round((memberTokensUsed / memberMonthlyBudget) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* SOUL.MD MARKDOWN EDITOR */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Nội Dung Tệp SOUL.md (Bản sắc nhân cách &amp; quy tắc)</Label>
                <span className="text-[10px] font-mono text-muted-foreground">Slot 1 Identity Replacement</span>
              </div>
              <Textarea
                rows={9}
                value={memberContent}
                onChange={(e) => setMemberContent(e.target.value)}
                className="font-mono text-xs leading-relaxed"
                placeholder="# Identity: Trí — Senior Angular Architect..."
              />
            </div>

            {/* JEV Threshold Sliders */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-2.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Cấu Hình Ngưỡng Phản Xạ JEV Cho Nhân Sự Này</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ngưỡng HITL Confirm:</span>
                    <strong className="text-amber-500">{memberRiskConfirm}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={memberRiskConfirm}
                    onChange={(e) => setMemberRiskConfirm(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ngưỡng Tự Động Block:</span>
                    <strong className="text-rose-500">{memberRiskBlock}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={memberRiskBlock}
                    onChange={(e) => setMemberRiskBlock(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulDialogOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveSoul} className="text-xs bg-primary text-primary-foreground font-semibold">
              {editingSoul ? "Lưu Cập Nhật Hồ Sơ & Lương" : "Tuyển Dụng Nhân Sự AI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* MODAL: TẠO / SỬA TASK (GIAO VIỆC CHO NHÂN SỰ AI) */}
      {/* ============================================================= */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="bg-popover border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Chỉnh Sửa Tác Vụ" : "Giao Việc Mới Cho Nhân Sự AI"}
            </DialogTitle>
            <DialogDescription>
              Tác vụ sẽ được đưa vào hàng đợi. Middleware JEV sẽ kiểm tra phản xạ trong 100ms trước khi cho phép chạy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Tiêu đề tác vụ (theo chuẩn Company Harness)</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="VD: [Angular Core] – Refactor Signals cho Module POS"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nhân sự AI phụ trách</Label>
                <Select value={taskSoulId} onValueChange={setTaskSoulId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Chọn nhân sự" />
                  </SelectTrigger>
                  <SelectContent>
                    {souls.map((s) => (
                      <SelectItem key={s._id || s.slug} value={s._id || s.slug}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Độ Ưu Tiên (Priority)</Label>
                <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">P0 (Khẩn cấp / Critical)</SelectItem>
                    <SelectItem value="P1">P1 (Cao / High)</SelectItem>
                    <SelectItem value="P2">P2 (Trung bình / Normal)</SelectItem>
                    <SelectItem value="P3">P3 (Thấp / Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Loại Work-Item (Harness)</Label>
                <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Task">Task (Kỹ thuật)</SelectItem>
                    <SelectItem value="User Story">User Story (Nghiệp vụ)</SelectItem>
                    <SelectItem value="Technical Story">Technical Story (Hạ tầng)</SelectItem>
                    <SelectItem value="Bug">Bug (Sửa lỗi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Phân Loại Quyền JEV</Label>
                <Select value={taskActionType} onValueChange={(v: any) => setTaskActionType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READ">READ (An toàn, cho đi thẳng)</SelectItem>
                    <SelectItem value="WRITE">WRITE (Đột biến dữ liệu, qua JEV)</SelectItem>
                    <SelectItem value="DANGEROUS">DANGEROUS (Cần duyệt / Block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mô tả chi tiết công việc</Label>
              <Textarea
                rows={3}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Nhập yêu cầu chi tiết cho agent..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveTask} className="text-xs bg-primary text-primary-foreground font-semibold">
              {editingTask ? "Lưu Thay Đổi" : "Giao Việc Vào Hàng Đợi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
