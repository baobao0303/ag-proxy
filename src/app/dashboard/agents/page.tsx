"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Bot,
  Sparkles,
  Zap,
  Activity,
  Play,
  Pause,
  Plus,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  FileText,
  SlidersHorizontal,
  Download,
  Terminal,
  Layers,
  ArrowRight,
  UserCheck,
  Ban,
  Send,
  HelpCircle,
  GripVertical,
  ExternalLink,
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

export interface ISoulItem {
  _id?: string;
  name: string;
  slug: string;
  tagline: string;
  content: string;
  personaPreset: "default" | "professional" | "tutor" | "terse" | "custom";
  modelPreference: string;
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
  const [activeTab, setActiveTab] = useState<"kanban" | "souls" | "jev">("kanban");

  // Data states
  const [tasks, setTasks] = useState<IAgentTaskItem[]>([]);
  const [souls, setSouls] = useState<ISoulItem[]>([]);
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

  // Soul Dialog States
  const [soulDialogOpen, setSoulDialogOpen] = useState(false);
  const [editingSoul, setEditingSoul] = useState<ISoulItem | null>(null);
  const [soulName, setSoulName] = useState("");
  const [soulTagline, setSoulTagline] = useState("");
  const [soulPreset, setSoulPreset] = useState<"default" | "professional" | "tutor" | "terse" | "custom">("default");
  const [soulModel, setSoulModel] = useState("gemini-3-flash");
  const [soulContent, setSoulContent] = useState("");
  const [soulRiskConfirm, setSoulRiskConfirm] = useState(0.35);
  const [soulRiskBlock, setSoulRiskBlock] = useState(0.75);

  // Interactive JEV Sandbox State
  const [jevInput, setJevInput] = useState("DROP TABLE accounts_staging");
  const [jevMode, setJevMode] = useState<"score" | "boolean" | "choice">("score");
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
      const [tasksRes, soulsRes] = await Promise.all([
        fetch("/api/agent-tasks"),
        fetch("/api/souls"),
      ]);
      const tasksJson = await tasksRes.json();
      const soulsJson = await soulsRes.json();

      if (tasksJson.success) setTasks(tasksJson.data || []);
      if (soulsJson.success) setSouls(soulsJson.data || []);
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
  // TASK ACTIONS (CRUD + Drag & Drop)
  // -------------------------------------------------------------
  function handleOpenCreateTask() {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskType("Task");
    setTaskActionType("WRITE");
    setTaskPriority("P2");
    setTaskSoulId(souls[0]?._id || "");
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

    try {
      if (editingTask && editingTask._id) {
        // Update task
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
        // Create new task
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
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Đã thêm tác vụ mới (${json.data.state})`);
          setTasks((prev) => [json.data, ...prev]);
          setTaskDialogOpen(false);
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
        toast.error(json.error || "Lỗi xoá tác vụ");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  // Quick Human Review (Approve / Reject)
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
            ? "Đã DUYỆT tác vụ! Agent đang tiến hành thực thi..."
            : "Đã TỪ CHỐI tác vụ! Đã chuyển trạng thái Blocked."
        );
        setTasks((prev) => prev.map((t) => (t._id === taskId ? json.data : t)));
      } else {
        toast.error(json.error || "Lỗi duyệt tác vụ");
      }
    } catch {
      toast.error("Lỗi khi gửi phản hồi review");
    }
  }

  // Drag and Drop Handlers
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

    // Optimistic UI update
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
      toast.error("Lỗi cập nhật trạng thái tác vụ");
      loadData();
    } finally {
      setDraggingTaskId(null);
    }
  }

  // -------------------------------------------------------------
  // SOUL.md ACTIONS (CRUD)
  // -------------------------------------------------------------
  function handleOpenCreateSoul() {
    setEditingSoul(null);
    setSoulName("");
    setSoulTagline("");
    setSoulPreset("default");
    setSoulModel("gemini-3-flash");
    setSoulRiskConfirm(0.35);
    setSoulRiskBlock(0.75);
    setSoulContent(`# Identity: New Agent Persona

## Core Persona & Attitude
- Direct, pragmatic, and mission-driven autonomous problem solver.
- Never uses sycophantic corporate fluff. Jumps straight into problem-solving.

## Safety & JEV Directives
- Fast 100ms reflex pre-screening on all tool calls.
- High risk mutations require operator confirmation.`);
    setSoulDialogOpen(true);
  }

  function handleOpenEditSoul(soul: ISoulItem) {
    setEditingSoul(soul);
    setSoulName(soul.name);
    setSoulTagline(soul.tagline);
    setSoulPreset(soul.personaPreset || "default");
    setSoulModel(soul.modelPreference || "gemini-3-flash");
    setSoulRiskConfirm(soul.jevConfig?.riskThresholdConfirm ?? 0.35);
    setSoulRiskBlock(soul.jevConfig?.riskThresholdBlock ?? 0.75);
    setSoulContent(soul.content);
    setSoulDialogOpen(true);
  }

  async function handleSaveSoul() {
    if (!soulName.trim()) {
      toast.error("Vui lòng nhập tên SOUL");
      return;
    }

    const payload = {
      name: soulName,
      tagline: soulTagline,
      personaPreset: soulPreset,
      modelPreference: soulModel,
      content: soulContent,
      jevConfig: {
        readPolicy: "allow",
        writePolicy: "jev_check",
        dangerousPolicy: "confirm",
        riskThresholdConfirm: soulRiskConfirm,
        riskThresholdBlock: soulRiskBlock,
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
          toast.success("Đã cập nhật hồ sơ SOUL.md");
          setSouls((prev) => prev.map((s) => (s._id === editingSoul._id ? json.data : s)));
          setSoulDialogOpen(false);
        } else {
          toast.error(json.error || "Lỗi cập nhật SOUL");
        }
      } else {
        const res = await fetch("/api/souls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Đã tạo hồ sơ SOUL.md mới");
          setSouls((prev) => [json.data, ...prev]);
          setSoulDialogOpen(false);
        } else {
          toast.error(json.error || "Lỗi tạo SOUL");
        }
      }
    } catch {
      toast.error("Lỗi mạng khi lưu SOUL");
    }
  }

  async function handleDeleteSoul(soulId: string) {
    try {
      const res = await fetch(`/api/souls/${soulId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Đã xoá hồ sơ SOUL.md");
        setSouls((prev) => prev.filter((s) => s._id !== soulId));
      } else {
        toast.error(json.error || "Lỗi xoá SOUL");
      }
    } catch {
      toast.error("Lỗi khi xoá hồ sơ SOUL");
    }
  }

  function handleDownloadSoul(soul: ISoulItem) {
    const blob = new Blob([soul.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOUL-${soul.slug || "agent"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã tải xuống file SOUL.md cho ${soul.name}`);
  }

  // Interactive JEV Evaluation Tester
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
      reason = "Phát hiện lệnh nguy hiểm cực độ. JEV tự động BLOCK luôn trong 100ms, 0đ token.";
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
      reason = "Thao tác đột biến dữ liệu (WRITE/DELETE). Cờ vàng: Yêu cầu Human-in-the-Loop xác nhận.";
    } else {
      score = 0.05;
      decision = "allow";
      reason = "Truy vấn READ-ONLY thông thường. Phản xạ JEV cho qua 100ms thẳng vào hạ tầng.";
    }

    setJevResult({
      score,
      decision,
      reason,
      speedMs: Math.floor(Math.random() * 40 + 60), // 60ms - 100ms
    });
  }

  // Kanban Columns Definition
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
      icon: ShieldCheck,
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
      icon: CheckCircle2,
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

  // Stats
  const awaitingCount = tasks.filter((t) => t.state === "Awaiting Human").length;
  const activeCount = tasks.filter((t) => t.state === "Active").length;
  const resolvedCount = tasks.filter((t) => t.state === "Resolved").length;
  const blockedCount = tasks.filter((t) => t.state === "Blocked").length;

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1C1626] via-[#14131E] to-[#0D0E14] border border-white/[0.08] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              HUMAN-IN-THE-LOOP & SOUL.MD
            </span>
            <span className="text-xs text-slate-400 font-mono">Harness Engine • JEV Reflex</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            Trung Tâm Điều Phối Agent & Bản Sắc SOUL.md
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Quản trị trạng thái tác vụ phân cấp theo chuẩn Harness, tích hợp middleware phản xạ JEV đánh chặn 100ms
            và cổng phê duyệt người thật (Human-in-the-Loop) theo triết lý AwaitHumans.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={handleOpenCreateTask}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo Task Mới
          </Button>
          <Button
            onClick={handleOpenCreateSoul}
            variant="outline"
            className="border-white/20 hover:bg-white/10 text-white font-medium rounded-xl text-xs gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" /> Thêm SOUL.md
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Awaiting Human (HITL)
            </div>
            <div className="text-2xl font-black text-amber-500 mt-0.5 flex items-baseline gap-1.5">
              {awaitingCount}
              <span className="text-[10px] font-semibold text-muted-foreground">cần duyệt</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Đang Chạy (Active)
            </div>
            <div className="text-2xl font-black text-emerald-500 mt-0.5 flex items-baseline gap-1.5">
              {activeCount}
              <span className="text-[10px] font-semibold text-muted-foreground">tasks</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Bị JEV Chặn (Blocked)
            </div>
            <div className="text-2xl font-black text-rose-500 mt-0.5 flex items-baseline gap-1.5">
              {blockedCount}
              <span className="text-[10px] font-semibold text-muted-foreground">nguy hiểm</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <Ban className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Hồ Sơ SOUL.md
            </div>
            <div className="text-2xl font-black text-primary mt-0.5 flex items-baseline gap-1.5">
              {souls.length}
              <span className="text-[10px] font-semibold text-muted-foreground">personae</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <FileText className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/70 pb-2">
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
          onClick={() => setActiveTab("souls")}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "souls"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Quản Lý Bản Sắc SOUL.md ({souls.length})</span>
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
          <span>Giám Sát Phản Xạ JEV Middleware</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: KANBAN TASK BOARD (HARNESS + HITL AWAITHUMANS) */}
      {/* ============================================================= */}
      {activeTab === "kanban" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-primary" />
              <strong>Kéo và thả</strong> thẻ tác vụ giữa các cột để chuyển đổi trạng thái thực thi.
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
                        const isBlocked = t.state === "Blocked";

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
                              <span className="truncate max-w-[110px] font-medium text-foreground/80">
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
      {/* TAB 2: SOUL.MD PERSONAE & AGENT MANAGER (HERMES SPEC) */}
      {/* ============================================================= */}
      {activeTab === "souls" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Hồ Sơ Bản Sắc SOUL.md</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Định hình nhân cách cốt lõi (Slot #1 Context), thế giới quan và ngưỡng rủi ro JEV cho từng Agent theo chuẩn Hermes.
              </p>
            </div>
            <Button
              onClick={handleOpenCreateSoul}
              size="sm"
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm SOUL.md Mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {souls.map((soul) => (
              <Card
                key={soul._id || soul.slug}
                className="p-4 bg-card/70 border-border/80 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-all shadow-2xs space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{soul.name}</span>
                        {soul.isDefault && (
                          <Badge variant="outline" className="text-[9px] text-primary border-primary/30 font-bold">
                            DEFAULT
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        slug: {soul.slug} • preset: {soul.personaPreset}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadSoul(soul)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Tải về file SOUL.md"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditSoul(soul)}
                        className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                        title="Chỉnh sửa SOUL.md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      {!soul.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSoul(soul._id!)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                          title="Xoá SOUL.md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {soul.tagline || "Hồ sơ nhận dạng và định chế an toàn cho Autonomous Agent."}
                  </p>

                  {/* JEV Policy Bar */}
                  <div className="bg-muted/40 p-2.5 rounded-xl border border-border/50 text-[11px] space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngưỡng HITL Confirm:</span>
                      <strong className="text-amber-500">{soul.jevConfig?.riskThresholdConfirm ?? 0.3}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngưỡng Tự Động Block:</span>
                      <strong className="text-rose-500">{soul.jevConfig?.riskThresholdBlock ?? 0.7}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Ưu Tiên:</span>
                      <strong className="text-foreground">{soul.modelPreference || "gemini-3-flash"}</strong>
                    </div>
                  </div>

                  {/* Markdown Preview Box */}
                  <div className="bg-black/30 p-2.5 rounded-xl border border-border/40 text-[10px] font-mono text-muted-foreground max-h-24 overflow-y-auto leading-relaxed">
                    <pre className="whitespace-pre-wrap">{soul.content.slice(0, 240)}...</pre>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng kích hoạt
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditSoul(soul)}
                    className="h-6 text-[10px] px-2 text-foreground font-semibold cursor-pointer"
                  >
                    Xem Chi Tiết SOUL.md →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: JEV REFLEX MIDDLEWARE MONITOR & INTERACTIVE TESTER */}
      {/* ============================================================= */}
      {activeTab === "jev" && (
        <div className="space-y-5">
          {/* Conceptual Architecture Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 bg-card/70 border-border/80 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Kiến Trúc Phản Xạ: LLM (Bộ Não) vs JEV (Tiềm Thức)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nếu LLM là bộ não suy nghĩ sâu và tốn token (thời gian tính bằng giây), thì JEV chính là phản xạ không điều kiện.
                JEV đưa ra quyết định đánh chặn chỉ trong <strong>100ms với 0đ chi phí token</strong> trước khi lệnh đến hạ tầng Database.
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

              {/* 3 Scoring Mechanisms */}
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

            {/* Interactive JEV Reflex Sandbox */}
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

                {/* Quick Presets to test */}
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

                {/* Reflex Output Result Box */}
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
                        ⚡ Hành động này sẽ được đẩy tự động vào cột <strong>Awaiting Human</strong> trên Bảng Kanban để người vận hành bấm duyệt!
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
      {/* MODAL: TẠO / SỬA TASK (HARNESS WORK ITEM) */}
      {/* ============================================================= */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="bg-popover border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Chỉnh Sửa Tác Vụ Agent" : "Tạo Tác Vụ Mới (Harness Work-Item)"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập thuộc tính tác vụ. Hệ thống middleware JEV sẽ tự động đánh giá mức độ rủi ro trong 100ms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Tiêu đề tác vụ (theo chuẩn Company Harness)</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="VD: [Database] – Xoá bảng tạm sessions hết hạn"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Loại Work-Item</Label>
                <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Task">Task (Kỹ thuật)</SelectItem>
                    <SelectItem value="User Story">User Story (Nghiệp vụ)</SelectItem>
                    <SelectItem value="Technical Story">Technical Story (Hạ tầng)</SelectItem>
                    <SelectItem value="Bug">Bug (Lỗi)</SelectItem>
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
                <Label className="text-xs">Phân Loại Quyền JEV (Action Type)</Label>
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

              <div className="space-y-1">
                <Label className="text-xs">Gắn Hồ Sơ SOUL.md</Label>
                <Select value={taskSoulId} onValueChange={setTaskSoulId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Chọn bản sắc SOUL" />
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
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mô tả chi tiết tác vụ & Bối cảnh</Label>
              <Textarea
                rows={3}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Nhập thông tin lệnh cần thực thi, payload..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveTask} className="text-xs bg-primary text-primary-foreground font-semibold">
              {editingTask ? "Lưu Thay Đổi" : "Tạo Tác Vụ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* MODAL: TẠO / SỬA SOUL.MD PROFILE */}
      {/* ============================================================= */}
      <Dialog open={soulDialogOpen} onOpenChange={setSoulDialogOpen}>
        <DialogContent className="bg-popover border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSoul ? "Chỉnh Sửa Bản Sắc SOUL.md" : "Tạo Hồ Sơ Bản Sắc SOUL.md Mới"}
            </DialogTitle>
            <DialogDescription>
              Tệp SOUL.md định hình nhân sinh quan (Slot #1 Context), loại bỏ văn sáo rỗng và cài đặt ngưỡng đánh chặn JEV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tên Bản Sắc (Persona Name)</Label>
                <Input
                  value={soulName}
                  onChange={(e) => setSoulName(e.target.value)}
                  placeholder="VD: Hermes Senior Architect"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Preset Tính Cách (/personality)</Label>
                <Select value={soulPreset} onValueChange={(v: any) => setSoulPreset(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Nous Hermes Hacker)</SelectItem>
                    <SelectItem value="professional">Professional (Doanh nghiệp chuẩn mực)</SelectItem>
                    <SelectItem value="tutor">Tutor (Socratic Mentor gợi mở)</SelectItem>
                    <SelectItem value="terse">Terse (Cực ngắn gọn, chỉ code)</SelectItem>
                    <SelectItem value="custom">Custom (Tùy biến)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tagline Tóm Tắt</Label>
                <Input
                  value={soulTagline}
                  onChange={(e) => setSoulTagline(e.target.value)}
                  placeholder="VD: Pragmatic software architect"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Model Ưu Tiên Phục Vụ</Label>
                <Select value={soulModel} onValueChange={setSoulModel}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-3-flash">Gemini 3 Flash (Tối ưu tốc độ)</SelectItem>
                    <SelectItem value="gemini-3.1-pro-high">Gemini 3.1 Pro (Suy luận sâu)</SelectItem>
                    <SelectItem value="claude-sonnet-4-6">Claude 3.7 Sonnet</SelectItem>
                    <SelectItem value="claude-opus-4-6-thinking">Claude Opus 4.6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* JEV Threshold Sliders */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-3">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Cấu Hình Ngưỡng Phản Xạ JEV Reflex</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ngưỡng HITL Confirm:</span>
                    <strong className="text-amber-500">{soulRiskConfirm}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={soulRiskConfirm}
                    onChange={(e) => setSoulRiskConfirm(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Điểm &gt;= {soulRiskConfirm} sẽ chuyển sang chờ Human duyệt.
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ngưỡng Tự Động Block:</span>
                    <strong className="text-rose-500">{soulRiskBlock}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={soulRiskBlock}
                    onChange={(e) => setSoulRiskBlock(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Điểm &gt;= {soulRiskBlock} sẽ chặn thẳng không hỏi lại.
                  </div>
                </div>
              </div>
            </div>

            {/* Markdown Editor for SOUL.md */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Nội dung Tệp SOUL.md (Markdown)</Label>
                <span className="text-[10px] font-mono text-muted-foreground">Slot 1 Context Replacement</span>
              </div>
              <Textarea
                rows={10}
                value={soulContent}
                onChange={(e) => setSoulContent(e.target.value)}
                className="font-mono text-xs leading-relaxed"
                placeholder="# Identity: Hermes Senior Architect..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulDialogOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveSoul} className="text-xs bg-primary text-primary-foreground font-semibold">
              {editingSoul ? "Lưu Cập Nhật SOUL.md" : "Tạo Bản Sắc SOUL.md"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
