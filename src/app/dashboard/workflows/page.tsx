"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  Workflow,
  Play,
  Pause,
  Plus,
  ArrowRight,
  ArrowLeft,
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
  Search,
  Sliders,
  FileCode,
  BookOpen,
  Code2,
  Terminal,
  FileText,
  HelpCircle,
  Eye,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
  MoreVertical,
  ExternalLink,
  Minimize2,
  Maximize2,
  FolderGit2,
  CheckSquare,
  Square,
  Network,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ============================================================================
// 1. DATA MODELS & TYPES
// ============================================================================

export type ExecutionState = "idle" | "running" | "success" | "waiting_human" | "failed" | "skipped";

export interface WorkflowNodeData {
  title: string;
  category: "prompt" | "agent" | "proxy" | "human" | "control";
  subType: string;
  subtitle?: string;
  description?: string;
  model?: string;
  tools?: string[];
  systemPrompt?: string;
  timeout?: string;
  retryCount?: number;
  executionState: ExecutionState;
  stateMessage?: string;
  contextSources?: string[];
  proxyProvider?: string;
  permissions?: string;
  humanAssignee?: string;
  conditionExpression?: string;
  onApprove?: () => void;
  onReject?: () => void;
  [key: string]: unknown;
}

// ============================================================================
// 2. CUSTOM REACT FLOW NODE COMPONENTS
// ============================================================================

// Component chung hiển thị thanh trạng thái thực thi
function StatusIndicator({ state, message }: { state: ExecutionState; message?: string }) {
  if (state === "idle") return null;

  if (state === "running") {
    return (
      <div className="mt-2.5 pt-2 border-t border-border/80 flex items-center justify-between text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-lg">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          ● Running...
        </span>
        <span className="text-[9px] opacity-80">{message || "Processing"}</span>
      </div>
    );
  }

  if (state === "waiting_human") {
    return (
      <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center justify-between text-[10px] text-amber-300 font-mono bg-amber-500/20 px-2 py-1 rounded-lg">
        <span className="flex items-center gap-1 font-bold">
          <UserCheck className="w-3.5 h-3.5 animate-pulse" />
          ⏳ Waiting for approval
        </span>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="mt-2.5 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-lg">
        <span className="flex items-center gap-1 font-bold">
          <CheckCircle2 className="w-3 h-3" />
          ✓ Completed
        </span>
        <span className="text-[9px] opacity-75">{message || "Done"}</span>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="mt-2.5 pt-2 border-t border-red-500/30 flex items-center justify-between text-[10px] text-red-400 font-mono bg-red-500/10 px-2 py-1 rounded-lg">
        <span className="flex items-center gap-1 font-bold">
          ✕ Failed
        </span>
        <span className="text-[9px] truncate max-w-[120px]">{message || "Review failed"}</span>
      </div>
    );
  }

  return null;
}

// 1. Prompt Node
function PromptNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return (
    <div
      className={`bg-[#12131a] text-foreground rounded-2xl p-3.5 shadow-xl border w-[260px] transition-all ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/10"
          : "border-border/80 hover:border-indigo-500/50"
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-xs font-bold">
            📝
          </div>
          <span className="text-xs font-bold text-foreground">Prompt</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
          {data.subType || "User Request"}
        </Badge>
      </div>

      <div className="mt-2.5 space-y-1">
        <p className="text-xs font-medium text-foreground line-clamp-2">
          "{data.title || "Implement login feature"}"
        </p>
        <p className="text-[10px] text-muted-foreground font-mono">
          Input: <span className="text-indigo-300 font-semibold">{data.subtitle || "User Request"}</span>
        </p>
      </div>

      <StatusIndicator state={data.executionState} message={data.stateMessage} />

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
}

// 2. Agent Node
function AgentNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return (
    <div
      className={`bg-[#12131a] text-foreground rounded-2xl p-3.5 shadow-xl border w-[270px] transition-all ${
        selected
          ? "border-[#ED145B] ring-2 ring-[#ED145B]/30 shadow-[#ED145B]/15"
          : "border-border/80 hover:border-[#ED145B]/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#ED145B] !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#ED145B]/15 text-[#ED145B] flex items-center justify-center text-xs font-bold">
            🤖
          </div>
          <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{data.title}</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#ED145B]/30 text-[#ED145B] bg-[#ED145B]/5">
          Agent
        </Badge>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <div className="text-[11px] font-medium text-foreground truncate">
          {data.subtitle || "AI Agent Specialist"}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Cpu className="w-3 h-3 text-[#ED145B]" />
          <span>Model: <strong className="text-foreground">{data.model || "Claude 3.7 Sonnet"}</strong></span>
        </div>
        {data.tools && data.tools.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
            <span className="opacity-75">Tools:</span>
            {data.tools.map((t, idx) => (
              <span key={idx} className="px-1 py-0.2 rounded bg-muted/60 text-[9px] font-mono text-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <StatusIndicator state={data.executionState} message={data.stateMessage} />

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#ED145B] !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
}

// 3. Proxy Node
function ProxyNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return (
    <div
      className={`bg-[#12131a] text-foreground rounded-2xl p-3.5 shadow-xl border w-[265px] transition-all ${
        selected
          ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-cyan-500/10"
          : "border-border/80 hover:border-cyan-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyan-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xs font-bold">
            🔌
          </div>
          <span className="text-xs font-bold text-foreground">{data.title}</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
          Proxy
        </Badge>
      </div>

      <div className="mt-2.5 space-y-1 text-xs">
        <p className="text-[11px] font-medium text-foreground line-clamp-1">
          {data.subtitle || "Repository Tools"}
        </p>
        <p className="text-[10px] text-cyan-400/90 font-mono">
          {data.description || "Git · Files · Terminal"}
        </p>
      </div>

      <StatusIndicator state={data.executionState} message={data.stateMessage} />

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyan-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
}

// 4. Human Approval Node
function HumanNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return (
    <div
      className={`bg-[#12131a] text-foreground rounded-2xl p-3.5 shadow-xl border w-[280px] transition-all ${
        selected
          ? "border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/15"
          : "border-border/80 hover:border-amber-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs font-bold">
            👤
          </div>
          <span className="text-xs font-bold text-foreground">{data.title}</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-400 bg-amber-500/5">
          Human-in-the-Loop
        </Badge>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <p className="text-[11px] font-medium text-foreground line-clamp-1">
          {data.subtitle || "Approve implementation plan"}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Timeout: <strong className="text-foreground">{data.timeout || "30 min"}</strong></span>
          <span className="text-amber-400 font-semibold">{data.humanAssignee || "Supervisor"}</span>
        </div>
      </div>

      {/* Nút hành động nhanh khi đang chờ duyệt */}
      {data.executionState === "waiting_human" && (
        <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              data.onApprove?.();
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-[10px] font-bold rounded-lg"
          >
            ✓ Duyệt (Approve)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              data.onReject?.();
            }}
            className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10 h-7 text-[10px] font-bold rounded-lg"
          >
            ✕ Từ chối
          </Button>
        </div>
      )}

      <StatusIndicator state={data.executionState} message={data.stateMessage} />

      {/* 2 Handles đầu ra: Approve & Reject */}
      <div className="mt-2 pt-1 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400">✓ Approve</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-400">✕ Reject</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="approve"
        style={{ left: "30%" }}
        className="!bg-emerald-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="reject"
        style={{ left: "70%" }}
        className="!bg-red-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
}

// 5. Condition Node
function ConditionNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return (
    <div
      className={`bg-[#12131a] text-foreground rounded-2xl p-3.5 shadow-xl border w-[260px] transition-all ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500/30 shadow-violet-500/10"
          : "border-border/80 hover:border-violet-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-violet-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center text-xs font-bold">
            🔀
          </div>
          <span className="text-xs font-bold text-foreground">{data.title || "Condition"}</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-violet-500/30 text-violet-400 bg-violet-500/5">
          Control
        </Badge>
      </div>

      <div className="mt-2.5 space-y-1 text-xs">
        <p className="text-[11px] font-medium text-foreground">
          {data.subtitle || "QC Result"}
        </p>
        <p className="text-[10px] text-muted-foreground font-mono truncate">
          Expr: {data.conditionExpression || "qc_result.pass === true"}
        </p>
      </div>

      <StatusIndicator state={data.executionState} message={data.stateMessage} />

      {/* 2 Handles đầu ra: PASS & FAIL */}
      <div className="mt-3 pt-1 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 font-bold">✓ PASS</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-400 font-bold">✕ FAIL</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="pass"
        style={{ left: "25%" }}
        className="!bg-emerald-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="fail"
        style={{ left: "75%" }}
        className="!bg-red-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
}

// 6. Done / End Node
function DoneNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return (
    <div
      className={`bg-[#12131a] text-foreground rounded-2xl p-3 shadow-xl border w-[220px] transition-all ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-emerald-500/50 hover:border-emerald-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-emerald-500 !w-2.5 !h-2.5 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          🏁
        </div>
        <div>
          <div className="text-xs font-bold text-foreground">{data.title || "Done"}</div>
          <div className="text-[10px] text-emerald-400 font-mono">Workflow Completed</div>
        </div>
      </div>
      <StatusIndicator state={data.executionState} message={data.stateMessage} />
    </div>
  );
}

const nodeTypes = {
  promptNode: PromptNode,
  agentNode: AgentNode,
  proxyNode: ProxyNode,
  humanNode: HumanNode,
  conditionNode: ConditionNode,
  doneNode: DoneNode,
};

// ============================================================================
// 3. INITIAL WORKFLOW GRAPH (CHUẨN THEO YÊU CẦU ĐỀ BÀI)
// ============================================================================

const INITIAL_NODES: Node<WorkflowNodeData>[] = [
  {
    id: "node-prompt",
    type: "promptNode",
    position: { x: 280, y: 30 },
    data: {
      title: "Implement login feature",
      category: "prompt",
      subType: "Prompt",
      subtitle: "User Request",
      description: "Yêu cầu phát triển tính năng đăng nhập bảo mật SSO & OAuth2",
      executionState: "idle",
    },
  },
  {
    id: "node-ba",
    type: "agentNode",
    position: { x: 275, y: 190 },
    data: {
      title: "BA Agent",
      category: "agent",
      subType: "BA Agent",
      subtitle: "Analyze requirement",
      model: "Claude 3.7 Sonnet",
      tools: ["MCP", "Files"],
      systemPrompt: "You are a Senior Business Analyst. Break down login requirements into technical user stories with acceptance criteria.",
      contextSources: ["User Request", "Repository Context"],
      executionState: "idle",
    },
  },
  {
    id: "node-mcp-1",
    type: "proxyNode",
    position: { x: 277, y: 370 },
    data: {
      title: "MCP Proxy",
      category: "proxy",
      subType: "MCP Proxy",
      subtitle: "Read repository and existing code",
      description: "Git · Files · Terminal",
      proxyProvider: "Antigravity Sidecar",
      permissions: "Read Only",
      executionState: "idle",
    },
  },
  {
    id: "node-human-approval",
    type: "humanNode",
    position: { x: 270, y: 530 },
    data: {
      title: "Human Approval",
      category: "human",
      subType: "Human Approval",
      subtitle: "Approve implementation plan",
      timeout: "30 min",
      humanAssignee: "Tech Lead / Architect",
      description: "Kiểm duyệt kế hoạch kiến trúc Angular và scope trước khi sinh mã nguồn",
      executionState: "idle",
    },
  },
  {
    id: "node-fe",
    type: "agentNode",
    position: { x: 275, y: 720 },
    data: {
      title: "FE Agent",
      category: "agent",
      subType: "FE Agent",
      subtitle: "Implement Angular feature",
      model: "Claude 3.7 Sonnet",
      tools: ["MCP", "Git", "Files", "Terminal"],
      systemPrompt: "You are an Angular FE Architect. Implement signals-based authentication flow with reactive forms and error handling.",
      contextSources: ["User Request", "Previous Agent Output", "Repository Context"],
      executionState: "idle",
    },
  },
  {
    id: "node-mcp-2",
    type: "proxyNode",
    position: { x: 277, y: 910 },
    data: {
      title: "MCP Proxy",
      category: "proxy",
      subType: "MCP Proxy",
      subtitle: "Run tests and inspect git diff",
      description: "Git · Files · Terminal",
      proxyProvider: "Antigravity Sidecar",
      permissions: "Read & Write",
      executionState: "idle",
    },
  },
  {
    id: "node-qc",
    type: "agentNode",
    position: { x: 275, y: 1070 },
    data: {
      title: "QC Agent",
      category: "agent",
      subType: "QC Agent",
      subtitle: "Review implementation",
      model: "Gemini 2.5 Pro",
      tools: ["MCP", "Git"],
      systemPrompt: "You are a Lead Quality Control Engineer. Verify unit tests pass and code matches all acceptance criteria.",
      contextSources: ["Previous Agent Output", "Repository Context"],
      executionState: "idle",
    },
  },
  {
    id: "node-condition",
    type: "conditionNode",
    position: { x: 280, y: 1250 },
    data: {
      title: "Condition",
      category: "control",
      subType: "Condition",
      subtitle: "QC Result",
      conditionExpression: "qc_result.passed === true",
      executionState: "idle",
    },
  },
  {
    id: "node-done",
    type: "doneNode",
    position: { x: 120, y: 1430 },
    data: {
      title: "Done",
      category: "control",
      subType: "Done",
      subtitle: "Feature Ready for PR",
      executionState: "idle",
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: "e-prompt-ba",
    source: "node-prompt",
    target: "node-ba",
    animated: true,
    style: { stroke: "#818cf8", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#818cf8" },
  },
  {
    id: "e-ba-mcp1",
    source: "node-ba",
    target: "node-mcp-1",
    animated: true,
    style: { stroke: "#ED145B", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ED145B" },
  },
  {
    id: "e-mcp1-human",
    source: "node-mcp-1",
    target: "node-human-approval",
    animated: true,
    style: { stroke: "#06b6d4", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
  },
  {
    id: "e-human-fe",
    source: "node-human-approval",
    sourceHandle: "approve",
    target: "node-fe",
    label: "✓ Approved",
    labelStyle: { fill: "#10b981", fontSize: 10, fontWeight: 700 },
    style: { stroke: "#10b981", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  },
  {
    id: "e-fe-mcp2",
    source: "node-fe",
    target: "node-mcp-2",
    animated: true,
    style: { stroke: "#ED145B", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ED145B" },
  },
  {
    id: "e-mcp2-qc",
    source: "node-mcp-2",
    target: "node-qc",
    animated: true,
    style: { stroke: "#06b6d4", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
  },
  {
    id: "e-qc-cond",
    source: "node-qc",
    target: "node-condition",
    animated: true,
    style: { stroke: "#ED145B", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ED145B" },
  },
  {
    id: "e-cond-pass",
    source: "node-condition",
    sourceHandle: "pass",
    target: "node-done",
    label: "PASS",
    labelStyle: { fill: "#10b981", fontSize: 10, fontWeight: 700 },
    style: { stroke: "#10b981", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  },
  {
    id: "e-cond-fail",
    source: "node-condition",
    sourceHandle: "fail",
    target: "node-fe",
    label: "FAIL (Retry)",
    labelStyle: { fill: "#ef4444", fontSize: 10, fontWeight: 700 },
    style: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "4,4" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" },
  },
];

// ============================================================================
// 4. NODE LIBRARY DEFINITION
// ============================================================================

interface LibraryItem {
  id: string;
  category: "prompt" | "agent" | "proxy" | "human" | "control";
  nodeType: string;
  subType: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const NODE_LIBRARY: { category: string; icon: string; items: LibraryItem[] }[] = [
  {
    category: "Prompt",
    icon: "📝",
    items: [
      { id: "lib-prompt", category: "prompt", nodeType: "promptNode", subType: "Prompt", title: "Prompt", subtitle: "User Request or Instruction", icon: "📝", color: "#818cf8" },
      { id: "lib-sys-prompt", category: "prompt", nodeType: "promptNode", subType: "System Prompt", title: "System Prompt", subtitle: "Base persona instructions", icon: "⚙️", color: "#818cf8" },
      { id: "lib-user-input", category: "prompt", nodeType: "promptNode", subType: "User Input", title: "User Input", subtitle: "Interactive runtime input", icon: "💬", color: "#818cf8" },
    ],
  },
  {
    category: "Agents",
    icon: "🤖",
    items: [
      { id: "lib-ba", category: "agent", nodeType: "agentNode", subType: "BA Agent", title: "BA Agent", subtitle: "Analyze requirements & specs", icon: "📊", color: "#ED145B" },
      { id: "lib-fe", category: "agent", nodeType: "agentNode", subType: "FE Agent", title: "FE Agent", subtitle: "Angular/React Frontend Architect", icon: "🅰️", color: "#ED145B" },
      { id: "lib-backend", category: "agent", nodeType: "agentNode", subType: "Backend Agent", title: "Backend Agent", subtitle: "API & Database Engineer", icon: "💻", color: "#ED145B" },
      { id: "lib-qc", category: "agent", nodeType: "agentNode", subType: "QC Agent", title: "QC Agent", subtitle: "Review tests & code quality", icon: "🔬", color: "#ED145B" },
      { id: "lib-review", category: "agent", nodeType: "agentNode", subType: "Code Review Agent", title: "Code Review Agent", subtitle: "Security & clean code auditor", icon: "🛡️", color: "#ED145B" },
      { id: "lib-docs", category: "agent", nodeType: "agentNode", subType: "Documentation Agent", title: "Documentation Agent", subtitle: "Generate README & OpenAPI docs", icon: "📄", color: "#ED145B" },
      { id: "lib-custom", category: "agent", nodeType: "agentNode", subType: "Custom Agent", title: "Custom Agent", subtitle: "Configurable SOUL agent", icon: "⚡", color: "#ED145B" },
    ],
  },
  {
    category: "Proxy",
    icon: "🔌",
    items: [
      { id: "lib-mcp", category: "proxy", nodeType: "proxyNode", subType: "MCP Proxy", title: "MCP Proxy", subtitle: "Repository & Sidecar Tools", icon: "🔌", color: "#06b6d4" },
      { id: "lib-api", category: "proxy", nodeType: "proxyNode", subType: "API Proxy", title: "API Proxy", subtitle: "HTTP REST & GraphQL endpoint", icon: "🌐", color: "#06b6d4" },
      { id: "lib-tool", category: "proxy", nodeType: "proxyNode", subType: "Tool Proxy", title: "Tool Proxy", subtitle: "Command line & execution sandbox", icon: "🛠️", color: "#06b6d4" },
      { id: "lib-git", category: "proxy", nodeType: "proxyNode", subType: "Git Proxy", title: "Git Proxy", subtitle: "Branch, commit & diff inspection", icon: "🔀", color: "#06b6d4" },
      { id: "lib-fs", category: "proxy", nodeType: "proxyNode", subType: "File System Proxy", title: "File System Proxy", subtitle: "Read/Write files with sandbox", icon: "📁", color: "#06b6d4" },
    ],
  },
  {
    category: "Human",
    icon: "👤",
    items: [
      { id: "lib-human-appr", category: "human", nodeType: "humanNode", subType: "Human Approval", title: "Human Approval", subtitle: "Approve or reject step (HITL)", icon: "👤", color: "#f59e0b" },
      { id: "lib-human-rev", category: "human", nodeType: "humanNode", subType: "Human Review", title: "Human Review", subtitle: "Review changes & leave feedback", icon: "👁️", color: "#f59e0b" },
      { id: "lib-human-inp", category: "human", nodeType: "humanNode", subType: "Human Input", title: "Human Input", subtitle: "Interactive manual parameter entry", icon: "✍️", color: "#f59e0b" },
    ],
  },
  {
    category: "Control",
    icon: "🔀",
    items: [
      { id: "lib-cond", category: "control", nodeType: "conditionNode", subType: "Condition", title: "Condition", subtitle: "Branch workflow based on logic", icon: "🔀", color: "#8b5cf6" },
      { id: "lib-switch", category: "control", nodeType: "conditionNode", subType: "Switch", title: "Switch", subtitle: "Multi-branch decision route", icon: "🔄", color: "#8b5cf6" },
      { id: "lib-loop", category: "control", nodeType: "conditionNode", subType: "Loop", title: "Loop", subtitle: "Iterate until condition met", icon: "🔁", color: "#8b5cf6" },
      { id: "lib-parallel", category: "control", nodeType: "conditionNode", subType: "Parallel", title: "Parallel", subtitle: "Run multiple agents concurrently", icon: "⚡", color: "#8b5cf6" },
      { id: "lib-merge", category: "control", nodeType: "conditionNode", subType: "Merge", title: "Merge", subtitle: "Wait and merge parallel branches", icon: "🔗", color: "#8b5cf6" },
    ],
  },
];

// ============================================================================
// 5. MAIN WORKFLOW BUILDER IDE COMPONENT
// ============================================================================

function AgentWorkflowBuilderInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(INITIAL_NODES[4]); // default select FE Agent
  const [searchLibrary, setSearchLibrary] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState<"Draft" | "Saved">("Draft");
  const [workflowName, setWorkflowName] = useState("FE Development Workflow");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<number>(-1);

  const { fitView, zoomIn, zoomOut, getZoom, screenToFlowPosition } = useReactFlow();

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#ED145B", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#ED145B" },
          },
          eds
        )
      );
      setWorkflowStatus("Draft");
    },
    [setEdges]
  );

  // Click on a node to configure it
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<WorkflowNodeData>);
  }, []);

  // Click on canvas background to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update selected node data
  const updateSelectedNodeData = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedNode.id) {
            const updated = {
              ...n,
              data: {
                ...n.data,
                ...patch,
              },
            };
            setSelectedNode(updated);
            return updated;
          }
          return n;
        })
      );
      setWorkflowStatus("Draft");
    },
    [selectedNode, setNodes]
  );

  // Drag and Drop from Node Library into Canvas
  const onDragStart = (event: React.DragEvent, item: LibraryItem) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;

      const item: LibraryItem = JSON.parse(raw);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<WorkflowNodeData> = {
        id: `node-${Date.now()}`,
        type: item.nodeType,
        position,
        data: {
          title: item.title,
          category: item.category,
          subType: item.subType,
          subtitle: item.subtitle,
          model: item.category === "agent" ? "Claude 3.7 Sonnet" : undefined,
          tools: item.category === "agent" ? ["MCP", "Files"] : undefined,
          executionState: "idle",
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode);
      setWorkflowStatus("Draft");
      toast.success(`Đã thêm "${item.title}" vào Canvas`);
    },
    [screenToFlowPosition, setNodes]
  );

  // Add node via click in library
  const handleAddNodeFromLib = (item: LibraryItem) => {
    const newNode: Node<WorkflowNodeData> = {
      id: `node-${Date.now()}`,
      type: item.nodeType,
      position: { x: 300 + Math.random() * 80, y: 300 + Math.random() * 80 },
      data: {
        title: item.title,
        category: item.category,
        subType: item.subType,
        subtitle: item.subtitle,
        model: item.category === "agent" ? "Claude 3.7 Sonnet" : undefined,
        tools: item.category === "agent" ? ["MCP", "Files"] : undefined,
        executionState: "idle",
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode);
    setWorkflowStatus("Draft");
    toast.success(`Đã thêm "${item.title}" vào Canvas`);
  };

  // Validate workflow
  const handleValidate = () => {
    const hasPrompt = nodes.some((n) => n.data.category === "prompt");
    const hasAgent = nodes.some((n) => n.data.category === "agent");

    if (!hasPrompt) {
      toast.error("Quy trình chưa có node Prompt khởi đầu!");
      return;
    }
    if (!hasAgent) {
      toast.error("Quy trình chưa có bất kỳ AI Agent nào để thực thi!");
      return;
    }

    toast.success("✓ Xác thực thành công: Quy trình hợp lệ và sẵn sàng thực thi!", {
      description: `Đã kiểm tra ${nodes.length} Nodes và ${edges.length} Connections.`,
    });
  };

  // Save workflow
  const handleSave = () => {
    setWorkflowStatus("Saved");
    toast.success("Đã lưu quy trình thành công!", {
      description: `Bản ghi "${workflowName}" đã được đồng bộ với hệ thống.`,
    });
  };

  // Live Workflow Runner Simulation
  const handleRunWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionStep(0);

    toast.info("▶ Bắt đầu khởi chạy chuỗi Workflow...", {
      description: "Hệ thống đang điều phối prompt và các agents theo sơ đồ.",
    });

    const executionSequence = [
      { id: "node-prompt", time: 700, msg: "Đã nạp prompt và context" },
      { id: "node-ba", time: 1000, msg: "BA Agent đã phân tích xong spec" },
      { id: "node-mcp-1", time: 800, msg: "MCP Proxy đã quét repo code" },
      { id: "node-human-approval", time: 0, isHuman: true },
    ];

    // Reset all nodes to idle
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, executionState: "idle", stateMessage: undefined },
      }))
    );

    // Step 1: Prompt
    await new Promise((r) => setTimeout(r, 400));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-prompt"
          ? { ...n, data: { ...n.data, executionState: "running" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 700));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-prompt"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Prompt loaded" } }
          : n
      )
    );

    // Step 2: BA Agent
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-ba"
          ? { ...n, data: { ...n.data, executionState: "running" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 1000));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-ba"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Spec defined" } }
          : n
      )
    );

    // Step 3: MCP Proxy 1
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-mcp-1"
          ? { ...n, data: { ...n.data, executionState: "running" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 800));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-mcp-1"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Scanned 14 files" } }
          : n
      )
    );

    // Step 4: Human Approval (Chờ người duyệt)
    toast.warning("⏳ Cần phê duyệt: Human-in-the-Loop Gateway", {
      description: "Vui lòng bấm 'Duyệt (Approve)' trên thẻ Human Approval để tiếp tục.",
      duration: 10000,
    });

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === "node-human-approval") {
          return {
            ...n,
            data: {
              ...n.data,
              executionState: "waiting_human",
              onApprove: () => handleResumeAfterApproval(),
              onReject: () => handleRejectApproval(),
            },
          };
        }
        return n;
      })
    );
  };

  const handleResumeAfterApproval = async () => {
    toast.success("✓ Đã phê duyệt kế hoạch kiến trúc! Tiếp tục thực thi FE Agent...");

    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-human-approval"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Approved by Lead" } }
          : n
      )
    );

    // Step 5: FE Agent
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-fe"
          ? { ...n, data: { ...n.data, executionState: "running" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 1200));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-fe"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Generated Angular code" } }
          : n
      )
    );

    // Step 6: MCP Proxy 2
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-mcp-2"
          ? { ...n, data: { ...n.data, executionState: "running" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 800));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-mcp-2"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Tests: 12/12 PASS" } }
          : n
      )
    );

    // Step 7: QC Agent
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-qc"
          ? { ...n, data: { ...n.data, executionState: "running" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 900));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-qc"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "Score: 100/100" } }
          : n
      )
    );

    // Step 8: Condition
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-condition"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "PASS -> Done" } }
          : n
      )
    );
    await new Promise((r) => setTimeout(r, 400));

    // Step 9: Done
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-done"
          ? { ...n, data: { ...n.data, executionState: "success", stateMessage: "PR created #42" } }
          : n
      )
    );

    setIsExecuting(false);
    toast.success("🎉 Quy trình FE Development đã hoàn thành xuất sắc mọi bước!", {
      duration: 6000,
    });
  };

  const handleRejectApproval = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "node-human-approval"
          ? { ...n, data: { ...n.data, executionState: "failed", stateMessage: "Rejected by Lead" } }
          : n
      )
    );
    setIsExecuting(false);
    toast.error("Quy trình đã bị dừng do con người từ chối phê duyệt.");
  };

  // Filter Node Library
  const filteredLibrary = useMemo(() => {
    if (!searchLibrary.trim()) return NODE_LIBRARY;
    const q = searchLibrary.toLowerCase();
    return NODE_LIBRARY.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.subtitle.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [searchLibrary]);

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full overflow-hidden bg-background text-foreground rounded-2xl border border-border shadow-2xl select-none">
      {/* ===================================================================== */}
      {/* 1. TOP TOOLBAR                                                        */}
      {/* ===================================================================== */}
      <header className="h-13 shrink-0 border-b border-border/80 bg-card/90 backdrop-blur-md px-4 flex items-center justify-between z-30">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/agents">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Workflows
            </Button>
          </Link>
          <span className="text-muted-foreground/40">/</span>

          {/* Workflow Name (editable) */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                autoFocus
                className="h-7 text-xs font-bold w-60 bg-background"
              />
            ) : (
              <span
                onClick={() => setIsEditingName(true)}
                className="text-xs font-bold text-foreground cursor-pointer hover:underline flex items-center gap-1.5"
                title="Bấm để đổi tên quy trình"
              >
                {workflowName}
              </span>
            )}

            <Badge
              variant="outline"
              className={`text-[10px] h-5 ${
                workflowStatus === "Saved"
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-400 bg-amber-500/10"
              }`}
            >
              {workflowStatus}
            </Badge>
          </div>
        </div>

        {/* Center: Quick Undo / Redo */}
        <div className="hidden md:flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Right Actions: Validate, Save, Run Workflow */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            className="h-8 text-xs font-medium border-border gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Validate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="h-8 text-xs font-medium border-border gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Save
          </Button>

          <Button
            size="sm"
            onClick={handleRunWorkflow}
            disabled={isExecuting}
            className="bg-[#ED145B] hover:bg-[#ED145B]/90 text-white font-bold h-8 px-3 text-xs shadow-md shadow-[#ED145B]/20 gap-1.5"
          >
            <Play className={`w-3 h-3 fill-current ${isExecuting ? "animate-spin" : ""}`} />
            {isExecuting ? "Running..." : "▶ Run Workflow"}
          </Button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. THREE-PANEL DESKTOP IDE LAYOUT                                     */}
      {/* ===================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* =================================================================== */}
        {/* PANEL 1: LEFT SIDEBAR — NODE LIBRARY                                */}
        {/* =================================================================== */}
        <aside className="w-64 sm:w-72 shrink-0 bg-card border-r border-border flex flex-col z-20 shadow-sm">
          {/* Header & Search */}
          <div className="p-3 border-b border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#ED145B]" /> Node Library
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {NODE_LIBRARY.reduce((acc, c) => acc + c.items.length, 0)} Nodes
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchLibrary}
                onChange={(e) => setSearchLibrary(e.target.value)}
                placeholder="🔍 Search nodes..."
                className="h-8 pl-8 text-xs bg-background border-border/80 rounded-xl"
              />
            </div>
          </div>

          {/* Draggable Category Groups */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {filteredLibrary.map((catGroup) => (
              <div key={catGroup.category} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                  <span>{catGroup.icon}</span>
                  <span>{catGroup.category}</span>
                </div>

                <div className="grid gap-1.5">
                  {catGroup.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      onClick={() => handleAddNodeFromLib(item)}
                      className="group flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/60 hover:border-foreground/20 cursor-grab active:cursor-grabbing transition-all text-left"
                      title="Kéo thả vào Canvas hoặc bấm để thêm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border"
                          style={{
                            backgroundColor: `${item.color}15`,
                            color: item.color,
                            borderColor: `${item.color}30`,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate group-hover:text-[#ED145B] transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Help Footer */}
          <div className="p-2.5 border-t border-border/80 bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>💡 Kéo thẻ hoặc bấm (+) để nạp vào Canvas</span>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* PANEL 2: CENTER — WORKFLOW CANVAS                                   */}
        {/* =================================================================== */}
        <main
          className="flex-1 h-full relative overflow-hidden bg-[#0c0d12]"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2}
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background color="#232430" gap={20} size={1} />

            {showMinimap && (
              <MiniMap
                className="!bg-[#12131a] !border !border-border/80 !rounded-xl overflow-hidden shadow-2xl"
                nodeColor={(node) => {
                  if (node.type === "agentNode") return "#ED145B";
                  if (node.type === "proxyNode") return "#06b6d4";
                  if (node.type === "humanNode") return "#f59e0b";
                  if (node.type === "promptNode") return "#818cf8";
                  return "#8b5cf6";
                }}
              />
            )}
          </ReactFlow>

          {/* Canvas Bottom-Right Controls Floating Bar */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border p-1.5 rounded-2xl shadow-2xl">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => zoomOut()}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Zoom Out"
            >
              −
            </Button>
            <span className="text-[11px] font-mono text-muted-foreground px-1.5">
              Canvas
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => zoomIn()}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Zoom In"
            >
              +
            </Button>

            <div className="w-[1px] h-4 bg-border/80 mx-1" />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => fitView({ padding: 0.25, duration: 400 })}
              className="h-7 px-2 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground"
              title="Fit to Screen"
            >
              ⛶ Fit
            </Button>

            <Button
              size="sm"
              variant={showMinimap ? "default" : "ghost"}
              onClick={() => setShowMinimap(!showMinimap)}
              className={`h-7 px-2 text-[11px] font-semibold gap-1 ${
                showMinimap ? "bg-[#ED145B] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Toggle Minimap"
            >
              🗺️ Minimap
            </Button>
          </div>

          {/* Live Runner Status Overlay Badge */}
          {isExecuting && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#ED145B]/15 border border-[#ED145B]/40 text-[#ED145B] backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#ED145B] animate-ping" />
              LIVE EXECUTION IN PROGRESS • JEV Reflex 100ms
            </div>
          )}
        </main>

        {/* =================================================================== */}
        {/* PANEL 3: RIGHT SIDEBAR — NODE CONFIGURATION PANEL                   */}
        {/* =================================================================== */}
        <aside className="w-72 sm:w-80 shrink-0 bg-card border-l border-border flex flex-col z-20 shadow-sm">
          {selectedNode ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Panel */}
              <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#ED145B]" />
                  <span className="text-xs font-bold text-foreground">
                    {selectedNode.data.category.toUpperCase()} Configuration
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedNode(null)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Body Configuration Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* 1. Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tên Node (Name)</Label>
                  <Input
                    value={selectedNode.data.title}
                    onChange={(e) => updateSelectedNodeData({ title: e.target.value })}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                {/* === CẤU HÌNH DÀNH CHO AGENT === */}
                {selectedNode.data.category === "agent" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Vai trò Nhân sự (Agent Role)</Label>
                      <Select
                        value={selectedNode.data.subtitle || "Angular FE Developer"}
                        onValueChange={(val) => updateSelectedNodeData({ subtitle: val })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Analyze requirement">Business Analyst (BA)</SelectItem>
                          <SelectItem value="Implement Angular feature">Angular FE Developer</SelectItem>
                          <SelectItem value="Review implementation">QC & Testing Engineer</SelectItem>
                          <SelectItem value="Backend Architecture">Senior Backend Engineer</SelectItem>
                          <SelectItem value="DevOps & Deploy">Lead DevOps & SRE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Mô hình AI (Model)</Label>
                      <Select
                        value={selectedNode.data.model || "Claude 3.7 Sonnet"}
                        onValueChange={(val) => updateSelectedNodeData({ model: val })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Claude 3.7 Sonnet">Claude 3.7 Sonnet</SelectItem>
                          <SelectItem value="Claude 3.5 Haiku">Claude 3.5 Haiku</SelectItem>
                          <SelectItem value="Gemini 2.5 Pro">Gemini 2.5 Pro</SelectItem>
                          <SelectItem value="Gemini 2.5 Flash">Gemini 2.5 Flash</SelectItem>
                          <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">System Prompt (Chỉ thị cốt lõi)</Label>
                      <Textarea
                        value={selectedNode.data.systemPrompt || ""}
                        onChange={(e) => updateSelectedNodeData({ systemPrompt: e.target.value })}
                        placeholder="Chỉ dẫn hệ thống chi tiết cho Agent..."
                        className="h-24 text-[11px] bg-background font-mono"
                      />
                    </div>

                    {/* Context Checkboxes */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      <Label className="text-xs font-semibold">Context (Ngữ cảnh truyền vào)</Label>
                      <div className="space-y-1.5">
                        {["User Request", "Previous Agent Output", "Repository Context", "Full Workflow Context"].map(
                          (ctx) => {
                            const isChecked = selectedNode.data.contextSources?.includes(ctx) ?? (ctx !== "Full Workflow Context");
                            return (
                              <label key={ctx} className="flex items-center gap-2 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const current = selectedNode.data.contextSources || ["User Request", "Previous Agent Output", "Repository Context"];
                                    const next = e.target.checked
                                      ? [...current, ctx]
                                      : current.filter((c) => c !== ctx);
                                    updateSelectedNodeData({ contextSources: next });
                                  }}
                                  className="rounded border-border text-[#ED145B] focus:ring-[#ED145B]"
                                />
                                <span>{ctx}</span>
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Tools Checkboxes */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      <Label className="text-xs font-semibold">Tools (Công cụ được cấp phép)</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {["MCP", "Git", "Files", "Terminal"].map((tool) => {
                          const isChecked = selectedNode.data.tools?.includes(tool) ?? true;
                          return (
                            <label key={tool} className="flex items-center gap-2 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = selectedNode.data.tools || ["MCP", "Git", "Files"];
                                  const next = e.target.checked
                                    ? [...current, tool]
                                    : current.filter((t) => t !== tool);
                                  updateSelectedNodeData({ tools: next });
                                }}
                                className="rounded border-border text-[#ED145B] focus:ring-[#ED145B]"
                              />
                              <span>{tool}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Execution, Timeout, Retry */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Timeout</Label>
                        <Input
                          value={selectedNode.data.timeout || "30 min"}
                          onChange={(e) => updateSelectedNodeData({ timeout: e.target.value })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Retry Count</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.retryCount || 2}
                          onChange={(e) => updateSelectedNodeData({ retryCount: parseInt(e.target.value) || 0 })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* === CẤU HÌNH DÀNH CHO PROXY === */}
                {selectedNode.data.category === "proxy" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Loại Proxy (Proxy Type)</Label>
                      <Select
                        value={selectedNode.data.subType || "MCP Proxy"}
                        onValueChange={(val) => updateSelectedNodeData({ subType: val })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCP Proxy">MCP Proxy (Model Context Protocol)</SelectItem>
                          <SelectItem value="API Proxy">API Proxy</SelectItem>
                          <SelectItem value="Git Proxy">Git Proxy</SelectItem>
                          <SelectItem value="Tool Proxy">Tool Sandbox Proxy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Provider / Endpoint</Label>
                      <Input
                        value={selectedNode.data.proxyProvider || "Antigravity Sidecar Hub"}
                        onChange={(e) => updateSelectedNodeData({ proxyProvider: e.target.value })}
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Công cụ khả dụng (Available Tools)</Label>
                      <Input
                        value={selectedNode.data.description || "Git · Files · Terminal"}
                        onChange={(e) => updateSelectedNodeData({ description: e.target.value })}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Quyền hạn (Permissions)</Label>
                      <Select
                        value={selectedNode.data.permissions || "Read & Write"}
                        onValueChange={(val) => updateSelectedNodeData({ permissions: val })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Read Only">Chỉ đọc (Read Only - An toàn)</SelectItem>
                          <SelectItem value="Read & Write">Đọc & Ghi (Read & Write)</SelectItem>
                          <SelectItem value="Full Sandbox">Full Sandbox Execution</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* === CẤU HÌNH DÀNH CHO HUMAN APPROVAL === */}
                {selectedNode.data.category === "human" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Loại can thiệp (Action Type)</Label>
                      <Select
                        value={selectedNode.data.subType || "Human Approval"}
                        onValueChange={(val) => updateSelectedNodeData({ subType: val })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Human Approval">Phê duyệt (Approval)</SelectItem>
                          <SelectItem value="Human Review">Đánh giá & Góp ý (Review)</SelectItem>
                          <SelectItem value="Human Input">Nhập liệu thủ công (Input)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Người chịu trách nhiệm (Assignee)</Label>
                      <Input
                        value={selectedNode.data.humanAssignee || "Tech Lead / Architect"}
                        onChange={(e) => updateSelectedNodeData({ humanAssignee: e.target.value })}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Thời gian chờ (Timeout)</Label>
                      <Input
                        value={selectedNode.data.timeout || "30 min"}
                        onChange={(e) => updateSelectedNodeData({ timeout: e.target.value })}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Mô tả hành động yêu cầu con người</Label>
                      <Textarea
                        value={selectedNode.data.description || ""}
                        onChange={(e) => updateSelectedNodeData({ description: e.target.value })}
                        placeholder="Mô tả cụ thể điều gì cần duyệt..."
                        className="h-20 text-[11px] bg-background"
                      />
                    </div>
                  </>
                )}

                {/* === CẤU HÌNH DÀNH CHO CONDITION === */}
                {selectedNode.data.category === "control" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Biểu thức điều kiện (Expression)</Label>
                      <Input
                        value={selectedNode.data.conditionExpression || "qc_result.passed === true"}
                        onChange={(e) => updateSelectedNodeData({ conditionExpression: e.target.value })}
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                      <div><strong className="text-emerald-400">✓ Cổng PASS:</strong> Tiếp tục bước Done</div>
                      <div><strong className="text-red-400">✕ Cổng FAIL:</strong> Quay lại vòng lặp FE Agent</div>
                    </div>
                  </>
                )}

                {/* === CẤU HÌNH DÀNH CHO PROMPT === */}
                {selectedNode.data.category === "prompt" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Prompt Content</Label>
                      <Textarea
                        value={selectedNode.data.description || "Implement login feature with secure token storage"}
                        onChange={(e) => updateSelectedNodeData({ description: e.target.value })}
                        className="h-24 text-[11px] bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Input Source</Label>
                      <Input
                        value={selectedNode.data.subtitle || "User Request"}
                        onChange={(e) => updateSelectedNodeData({ subtitle: e.target.value })}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer Xóa Node */}
              <div className="p-3 border-t border-border/80 bg-muted/20 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                    setSelectedNode(null);
                    setWorkflowStatus("Draft");
                    toast.success("Đã xóa node khỏi canvas");
                  }}
                  className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10 h-7 text-xs gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Xóa Node
                </Button>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ID: {selectedNode.id}
                </span>
              </div>
            </div>
          ) : (
            /* Khi chưa chọn node nào: Hiển thị Tổng Quan Quy Trình */
            <div className="flex-1 flex flex-col p-4 space-y-4 text-xs">
              <div className="pb-3 border-b border-border/80">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-[#ED145B]" /> Tổng Quan Workflow
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Nhấp vào bất kỳ Node nào trên Canvas để chỉnh sửa thông số.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-muted/30 border border-border/60 rounded-xl p-3 space-y-1.5">
                  <div className="text-[11px] font-semibold text-foreground">Thống Kê Kiến Trúc:</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground">
                    <div>Tổng Nodes: <strong className="text-foreground">{nodes.length}</strong></div>
                    <div>Liên kết: <strong className="text-foreground">{edges.length}</strong></div>
                    <div>Agents: <strong className="text-[#ED145B]">{nodes.filter((n) => n.data.category === "agent").length}</strong></div>
                    <div>Proxies: <strong className="text-cyan-400">{nodes.filter((n) => n.data.category === "proxy").length}</strong></div>
                    <div>HITL: <strong className="text-amber-400">{nodes.filter((n) => n.data.category === "human").length}</strong></div>
                    <div>Controls: <strong className="text-violet-400">{nodes.filter((n) => n.data.category === "control").length}</strong></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chiến lược Thực thi (Strategy)</Label>
                  <Select defaultValue="directed_graph">
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directed_graph">Directed Graph (Tuần tự & Nhánh)</SelectItem>
                      <SelectItem value="swarm">Agent Swarm (Đồng thuận bầy đàn)</SelectItem>
                      <SelectItem value="supervisor">Supervisor Control (HITL 100ms)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Môi trường Chạy (Environment)</Label>
                  <Input defaultValue="Local Sidecar (Floci + AWS + Docker)" className="h-8 text-xs bg-background" readOnly />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <ReactFlowProvider>
      <AgentWorkflowBuilderInner />
    </ReactFlowProvider>
  );
}
