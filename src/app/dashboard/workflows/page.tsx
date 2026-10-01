"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Play,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Ban,
  GripVertical,
  AlertTriangle,
  RefreshCw,
  Workflow,
  Check,
  Filter,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

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
    required: boolean;
    reviewedBy?: string;
    decision?: "approved" | "rejected";
    comment?: string;
    reviewedAt?: string;
  };
}

export default function WorkflowsKanbanPage() {
  const [tasks, setTasks] = useState<IAgentTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<IAgentTaskItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    type: "Task" as const,
    actionType: "WRITE" as const,
    priority: "P1" as const,
    agentName: "Trí — Senior Angular Architect",
    assignedTo: "Bảo (DevOps Lead)",
  });

  const MOCKUP_TASKS: IAgentTaskItem[] = [
    {
      _id: "task-mock-1",
      title: "[Payment]: Phê duyệt hoàn tiền 180$ đơn hàng A-4721",
      description: "Khách hàng yêu cầu hoàn tiền do thanh toán trùng lặp. Đã kiểm tra đối soát cổng thanh toán VNPay.",
      type: "Task",
      actionType: "WRITE",
      priority: "P1",
      state: "Awaiting Human",
      agentName: "Trí — Senior Angular Architect",
      assignedTo: "human_operator",
      riskScore: 0.55,
      jevEvaluation: {
        type: "score",
        result: "confirm",
        reason: "JEV Score 0.55 (Moderate-High): Hành động hoàn tiền ghi nợ tài khoản cần người thật bấm xác nhận.",
      },
    },
    {
      _id: "task-mock-2",
      title: "[Angular 19]: Refactor UserProfileComponent sang Signals & OnPush",
      description: "Chuyển đổi toàn bộ change detection default sang Signals để loại bỏ memory leaks và tăng tốc độ render 300%.",
      type: "User Story",
      actionType: "WRITE",
      priority: "P2",
      state: "Active",
      agentName: "Trí — Senior Angular Architect",
      assignedTo: "tri-senior-angular",
      riskScore: 0.2,
      jevEvaluation: {
        type: "boolean",
        result: "allow",
        reason: "JEV Fast-Path: Hành vi viết code FE thông thường được thông qua trực tiếp.",
      },
    },
    {
      _id: "task-mock-3",
      title: "[DevOps]: Triển khai Docker multi-stage build và cấu hình Nginx proxy",
      description: "Xây dựng image Docker tối ưu dung lượng dưới 150MB và đẩy lên GitHub Container Registry (GHCR).",
      type: "Technical Story",
      actionType: "WRITE",
      priority: "P1",
      state: "Resolved",
      agentName: "Bảo — Lead DevOps & SRE",
      assignedTo: "bao-lead-devops",
      riskScore: 0.25,
      jevEvaluation: {
        type: "boolean",
        result: "allow",
        reason: "Quy trình CI/CD chuẩn đã qua kiểm tra cú pháp.",
      },
    },
    {
      _id: "task-mock-4",
      title: "[Dangerous Action]: DROP TABLE accounts_staging",
      description: "Agent tự động đề xuất xoá bảng tạm staging sau khi migration cơ sở dữ liệu hoàn tất.",
      type: "Bug",
      actionType: "DANGEROUS",
      priority: "P0",
      state: "Blocked",
      agentName: "Linh — Security & Compliance Auditor",
      assignedTo: "security_lead",
      riskScore: 0.98,
      jevEvaluation: {
        type: "boolean",
        result: "block",
        reason: "JEV Boolean Rule: Phát hiện lệnh DROP TABLE! Tự động chặn trong 100ms bảo vệ toàn vẹn dữ liệu.",
      },
    },
    {
      _id: "task-mock-5",
      title: "[Backlog]: Đánh giá Benchmark Gemini 2.5 Flash vs Claude 3.7",
      description: "Đo lường độ trễ TTFT (Time to First Token) và chi phí sinh mã TypeScript giữa 2 mô hình hàng đầu.",
      type: "Task",
      actionType: "READ",
      priority: "P3",
      state: "New",
      agentName: "Hải — Cloud Cost & FinOps Specialist",
      assignedTo: "hai-cost-optimizer",
      riskScore: 0.05,
      jevEvaluation: {
        type: "boolean",
        result: "allow",
        reason: "Quyền READ: Cho phép chạy tự động 100ms.",
      },
    },
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agent-tasks");
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : json?.data && Array.isArray(json.data)
          ? json.data
          : [];
        if (list.length > 0) {
          setTasks(list);
          return;
        }
      }
      setTasks(MOCKUP_TASKS);
    } catch (e) {
      console.warn("Lỗi lấy danh sách task, sử dụng mock tasks:", e);
      setTasks(MOCKUP_TASKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLoadMockTasks = () => {
    setTasks(MOCKUP_TASKS);
    toast.success("Đã mở dữ liệu mẫu (Mockup Tasks) cho bảng kéo thả!");
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetState: IAgentTaskItem["state"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!id) return;

    const task = tasks.find((t) => t._id === id);
    if (!task) return;

    if (task.state === targetState) return;

    // Cập nhật optimistic
    const updated = tasks.map((t) => (t._id === id ? { ...t, state: targetState } : t));
    setTasks(updated);

    try {
      const res = await fetch(`/api/agent-tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });
      if (!res.ok) {
        throw new Error("Lỗi khi lưu trạng thái task");
      }
      toast.success(`Đã chuyển task sang "${targetState}"`);
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật trạng thái");
      fetchTasks();
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleHumanReview = async (taskId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/agent-tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          reviewer: "Human Supervisor",
          comment: reviewComment || (decision === "approved" ? "Phê duyệt bởi người quản trị" : "Từ chối do rủi ro"),
        }),
      });

      if (!res.ok) throw new Error("Thao tác duyệt thất bại");
      const updated = await res.json();
      setTasks(tasks.map((t) => (t._id === taskId ? updated : t)));
      toast.success(decision === "approved" ? "Đã phê duyệt task sang Active!" : "Đã từ chối task!");
      setShowReviewModal(false);
      setSelectedTask(null);
      setReviewComment("");
    } catch (e: any) {
      toast.error(e.message || "Lỗi xử lý duyệt");
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề task");
      return;
    }

    try {
      const res = await fetch("/api/agent-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) throw new Error("Không thể tạo task");
      const created = await res.json();
      setTasks([created, ...tasks]);
      toast.success(`Đã tạo task mới! JEV đánh giá: ${created.jevEvaluation?.result || "OK"}`);
      setShowCreateModal(false);
      setNewTask({
        title: "",
        description: "",
        type: "Task",
        actionType: "WRITE",
        priority: "P1",
        agentName: "Trí — Senior Angular Architect",
        assignedTo: "Bảo (DevOps Lead)",
      });
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo task");
    }
  };

  const columns: {
    state: IAgentTaskItem["state"];
    title: string;
    badgeColor: string;
    borderAccent: string;
    bgAccent: string;
    icon: any;
    desc: string;
  }[] = [
    {
      state: "New",
      title: "Chờ Tiếp Nhận (Intake)",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      borderAccent: "border-blue-500/30 hover:border-blue-500/60",
      bgAccent: "bg-blue-950/10",
      icon: Clock,
      desc: "Task mới được tạo hoặc phân bổ từ Backlog",
    },
    {
      state: "Awaiting Human",
      title: "Chờ Duyệt (Await Humans)",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      borderAccent: "border-amber-500/30 hover:border-amber-500/60",
      bgAccent: "bg-amber-950/10",
      icon: UserCheck,
      desc: "JEV phát hiện rủi ro cao, chờ người thật phê duyệt",
    },
    {
      state: "Active",
      title: "Đang Thực Thi (Active)",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      borderAccent: "border-emerald-500/30 hover:border-emerald-500/60",
      bgAccent: "bg-emerald-950/10",
      icon: Play,
      desc: "Agent đang chạy code, test hoặc gọi công cụ MCP",
    },
    {
      state: "Resolved",
      title: "Hoàn Thành (Resolved)",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      borderAccent: "border-purple-500/30 hover:border-purple-500/60",
      bgAccent: "bg-purple-950/10",
      icon: CheckCircle2,
      desc: "Tác vụ đã thực thi thành công và ghi log",
    },
    {
      state: "Blocked",
      title: "Bị Chặn (Blocked by JEV)",
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
      borderAccent: "border-red-500/30 hover:border-red-500/60",
      bgAccent: "bg-red-950/10",
      icon: Ban,
      desc: "Vi phạm an toàn hệ thống, bị từ chối tự động trong 100ms",
    },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.agentName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card to-background border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ED145B]/10 text-[#ED145B] border border-[#ED145B]/20">
                <Workflow className="w-3 h-3" /> HARNESS & AWAIT-HUMANS
              </span>
              <span className="text-xs text-muted-foreground">• JEV Reflex Reflexive Middleware</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bảng Kéo Thả Tác Vụ Human-in-the-Loop
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Không gian quản lý luồng công việc kéo thả theo chuẩn Harness Work-Items. Mọi tác vụ trước khi thực thi
              đều qua JEV đánh chặn 100ms và cơ chế AwaitHumans cho phép con người can thiệp phê duyệt.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={handleLoadMockTasks}
              className="rounded-xl h-9 text-xs font-semibold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mở Mockup Data
            </Button>
            <Link href="/dashboard/agents">
              <Button variant="outline" className="rounded-xl h-9 text-xs gap-1.5">
                ← Về Trung tâm Agents
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={fetchTasks}
              disabled={loading}
              className="rounded-xl h-9 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-semibold rounded-xl h-9 text-xs shadow-md shadow-[#ED145B]/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Task Mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {columns.map((col) => {
          const count = tasks.filter((t) => t.state === col.state).length;
          const Icon = col.icon;
          return (
            <div
              key={col.state}
              className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{col.title.split(" ")[0]} {col.title.split(" ")[1]}</div>
                <div className="text-xl font-black text-foreground mt-0.5">{count}</div>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${col.badgeColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar: Filter bên trái, Search bên phải */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 order-2 sm:order-1">
          <Button
            size="sm"
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8 text-xs font-semibold" : "h-8 text-xs"}
          >
            Tất cả ({tasks.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === "Task" ? "default" : "outline"}
            onClick={() => setFilterType("Task")}
            className={filterType === "Task" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8 text-xs font-semibold" : "h-8 text-xs"}
          >
            Task ({tasks.filter((t) => t.type === "Task").length})
          </Button>
          <Button
            size="sm"
            variant={filterType === "User Story" ? "default" : "outline"}
            onClick={() => setFilterType("User Story")}
            className={filterType === "User Story" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8 text-xs font-semibold" : "h-8 text-xs"}
          >
            User Story ({tasks.filter((t) => t.type === "User Story").length})
          </Button>
          <Button
            size="sm"
            variant={filterType === "Bug" ? "default" : "outline"}
            onClick={() => setFilterType("Bug")}
            className={filterType === "Bug" ? "bg-[#ED145B] text-white hover:bg-[#ED145B]/90 h-8 text-xs font-semibold" : "h-8 text-xs"}
          >
            Bug ({tasks.filter((t) => t.type === "Bug").length})
          </Button>
        </div>

        <div className="relative w-full sm:w-80 order-1 sm:order-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tác vụ, agent hoặc nội dung..."
            className="pl-9 h-9 rounded-xl border-border bg-background text-xs"
          />
        </div>
      </div>

      {/* 5-Column Drag and Drop Kanban Board */}
      <div className="overflow-x-auto pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start min-w-[1200px]">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.state === col.state);
            const ColIcon = col.icon;

            return (
              <div
                key={col.state}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.state)}
                className={`flex flex-col rounded-2xl border ${col.borderAccent} bg-card/60 p-3 min-h-[560px] transition-all duration-200 shadow-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-4 h-4 text-foreground/80" />
                    <span className="font-bold text-xs text-foreground tracking-tight">{col.title}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-mono font-bold ${col.badgeColor}`}>
                    {colTasks.length}
                  </Badge>
                </div>

                {/* Task Cards List - Cho phép cuộn mượt mà độc lập trong từng cột */}
                <div className="space-y-2.5 flex-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-44 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-[11px] text-muted-foreground/70">Kéo thả task vào đây</p>
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const isDangerous = t.actionType === "DANGEROUS";
                    const isReviewNeeded = t.state === "Awaiting Human";

                    return (
                      <div
                        key={t._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t._id!)}
                        className={`group relative rounded-xl border bg-card p-3 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                          isDangerous
                            ? "border-red-500/40 hover:border-red-500"
                            : isReviewNeeded
                            ? "border-amber-500/50 hover:border-amber-500 bg-amber-500/[0.02]"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        {/* Drag Handle & Type */}
                        <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground font-mono mb-1.5">
                          <span className="flex items-center gap-1 font-bold text-foreground">
                            <GripVertical className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                            {t.type}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              t.priority === "P0"
                                ? "bg-red-500/20 text-red-400"
                                : t.priority === "P1"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-foreground group-hover:text-[#ED145B] transition-colors leading-snug">
                          {t.title}
                        </h4>

                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>

                        {/* Metadata badges */}
                        <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-[10px] text-muted-foreground truncate max-w-[130px]" title={t.agentName}>
                            🤖 {t.agentName.split("—")[0]}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              t.actionType === "DANGEROUS"
                                ? "bg-red-500/15 text-red-400"
                                : t.actionType === "WRITE"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-emerald-500/15 text-emerald-400"
                            }`}
                          >
                            {t.actionType} ({Math.round(t.riskScore * 100)}%)
                          </span>
                        </div>

                        {/* JEV Evaluation mini reason */}
                        {t.jevEvaluation?.reason && (
                          <div className="mt-1.5 text-[9px] text-muted-foreground bg-muted/40 p-1 rounded font-mono truncate">
                            ⚡ JEV: {t.jevEvaluation.reason}
                          </div>
                        )}

                        {/* HITL Action buttons if awaiting human */}
                        {isReviewNeeded && (
                          <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTask(t);
                                setShowReviewModal(true);
                              }}
                              className="h-6 px-2 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 w-full"
                            >
                              <UserCheck className="w-3 h-3 mr-1" /> Duyệt HITL
                            </Button>
                          </div>
                        )}
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

      {/* Modal Duyệt Human-in-the-Loop */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <UserCheck className="w-5 h-5 text-amber-400" /> Phê Duyệt Tác Vụ (AwaitHumans)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tác vụ này vượt ngưỡng rủi ro của JEV Middleware. Vui lòng kiểm tra và ra quyết định.
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <div className="font-bold text-foreground">{selectedTask.title}</div>
                <div className="text-muted-foreground text-[11px]">{selectedTask.description}</div>
                <div className="text-[10px] font-mono text-muted-foreground pt-1">
                  Agent: <span className="text-foreground">{selectedTask.agentName}</span> | Hành động:{" "}
                  <span className="text-red-400 font-bold">{selectedTask.actionType}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ý kiến hoặc ghi chú phê duyệt:</Label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Nhập lý do phê duyệt hoặc chỉ thị bổ sung cho Agent..."
                  className="h-20 text-xs bg-background"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTask && handleHumanReview(selectedTask._id!, "rejected")}
              className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10 text-xs"
            >
              Từ chối (Reject)
            </Button>
            <Button
              size="sm"
              onClick={() => selectedTask && handleHumanReview(selectedTask._id!, "approved")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Phê duyệt (Approve → Active)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tạo Task Mới Chuẩn Harness */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#ED145B]" /> Tạo Tác Vụ Mới (Harness Work-Item)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tạo tác vụ mới để phân công cho nhân sự AI SOUL.md. JEV sẽ đánh giá mức độ rủi ro ngay lập tức.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tiêu đề tác vụ</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="VD: Refactor component Angular sang Signals, kiểm tra rò rỉ bộ nhớ..."
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Loại Work-Item</Label>
                <Select
                  value={newTask.type}
                  onValueChange={(val: any) => setNewTask({ ...newTask, type: val })}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Task">Task (Công việc thông thường)</SelectItem>
                    <SelectItem value="User Story">User Story (Tính năng nghiệp vụ)</SelectItem>
                    <SelectItem value="Bug">Bug (Sửa lỗi khẩn cấp)</SelectItem>
                    <SelectItem value="Technical Story">Technical Story (Kiến trúc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mức độ hành vi (Action Type)</Label>
                <Select
                  value={newTask.actionType}
                  onValueChange={(val: any) => setNewTask({ ...newTask, actionType: val })}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READ">READ (Chỉ đọc, an toàn)</SelectItem>
                    <SelectItem value="WRITE">WRITE (Ghi code, cập nhật repo)</SelectItem>
                    <SelectItem value="DANGEROUS">DANGEROUS (Deploy, drop DB, sửa config prod)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mức độ ưu tiên</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(val: any) => setNewTask({ ...newTask, priority: val })}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">P0 (Khẩn cấp cao nhất)</SelectItem>
                    <SelectItem value="P1">P1 (Ưu tiên cao)</SelectItem>
                    <SelectItem value="P2">P2 (Trung bình)</SelectItem>
                    <SelectItem value="P3">P3 (Thấp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giao cho Nhân sự AI</Label>
                <Select
                  value={newTask.agentName}
                  onValueChange={(val) => setNewTask({ ...newTask, agentName: val })}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trí — Senior Angular Architect">Trí — Senior Angular</SelectItem>
                    <SelectItem value="Bảo — Lead DevOps & SRE">Bảo — Lead DevOps</SelectItem>
                    <SelectItem value="Linh — Security & Compliance Auditor">Linh — Security Lead</SelectItem>
                    <SelectItem value="Hải — Cloud Cost & FinOps Specialist">Hải — Cost Optimizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mô tả chi tiết tác vụ & Chỉ thị thực thi</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Mô tả cụ thể file, đường dẫn, yêu cầu nghiệp vụ để Agent xử lý..."
                className="h-24 text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTask}
              className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-bold text-xs"
            >
              Tạo và Kích hoạt JEV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
