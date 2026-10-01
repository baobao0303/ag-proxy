import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export function evaluateJev(actionType: string, title: string, description: string = ""): {
  riskScore: number;
  result: "allow" | "confirm" | "block";
  reason: string;
} {
  const combined = `${title} ${description}`.toLowerCase();

  // Boolean rule: detect lethal operations
  if (
    combined.includes("drop database") ||
    combined.includes("drop table") ||
    combined.includes("rm -rf") ||
    combined.includes("format disk") ||
    combined.includes("delete all")
  ) {
    return {
      riskScore: 0.95,
      result: "block",
      reason: "JEV Boolean Rule triggered: Destructive system/database command detected. Automatic block in 100ms.",
    };
  }

  if (actionType === "DANGEROUS" || combined.includes("delete") || combined.includes("xoá") || combined.includes("reset")) {
    return {
      riskScore: 0.65,
      result: "confirm",
      reason: "JEV Score 0.65 (Medium-High): Dangerous data deletion requires Human-in-the-Loop review before execution.",
    };
  }

  if (actionType === "WRITE" || combined.includes("update") || combined.includes("cập nhật") || combined.includes("create")) {
    const isSensitive = combined.includes("auth") || combined.includes("token") || combined.includes("key") || combined.includes("quota");
    if (isSensitive) {
      return {
        riskScore: 0.45,
        result: "confirm",
        reason: "JEV Score 0.45 (Moderate): Mutation touches security/token parameters. Escalated to Operator review.",
      };
    }
    return {
      riskScore: 0.20,
      result: "allow",
      reason: "JEV Score 0.20 (Low): Routine write operation approved under autonomous policy.",
    };
  }

  // READ actions
  return {
    riskScore: 0.05,
    result: "allow",
    reason: "JEV Fast-Path: Read-only query permitted directly to backend.",
  };
}

const SEED_TASKS = [
  {
    title: "[Payment]: Phê duyệt hoàn tiền 180$ đơn hàng A-4721",
    description: "Khách hàng yêu cầu hoàn tiền do thanh toán trùng lặp. Đã kiểm tra đối soát cổng thanh toán VNPay.",
    type: "Task",
    actionType: "WRITE",
    priority: "P1",
    state: "Awaiting Human",
    agentName: "Refund & Billing Sentinel",
    assignedTo: "human_operator",
    riskScore: 0.55,
    jevEvaluation: {
      type: "score",
      result: "confirm",
      reason: "JEV Score 0.55 (0.3 - 0.7): Giao dịch tài chính vượt ngưỡng 100$ yêu cầu người vận hành xác nhận.",
      evaluatedAt: new Date(),
    },
  },
  {
    title: "[Database]: Dọn dẹp bảng phiên đăng nhập hết hạn > 30 ngày",
    description: "Xoá các bản ghi expired session tokens trong collection sessions để giảm tải dung lượng MongoDB.",
    type: "Technical Story",
    actionType: "DANGEROUS",
    priority: "P2",
    state: "Awaiting Human",
    agentName: "Hermes Senior Architect",
    assignedTo: "human_operator",
    riskScore: 0.68,
    jevEvaluation: {
      type: "score",
      result: "confirm",
      reason: "JEV Score 0.68: Thao tác DELETE hàng loạt trên database, chặn lại yêu cầu xác nhận.",
      evaluatedAt: new Date(),
    },
  },
  {
    title: "[Quota]: Tự động luân chuyển tài khoản khi tài khoản chính chạm 92%",
    description: "Phát hiện tài khoản chính đạt 92% quota Gemini 3 Flash, luân chuyển traffic sang tài khoản dự phòng #2.",
    type: "Task",
    actionType: "WRITE",
    priority: "P0",
    state: "Active",
    agentName: "Quota Auto-Balancer Agent",
    assignedTo: "agent_runner",
    riskScore: 0.18,
    jevEvaluation: {
      type: "score",
      result: "allow",
      reason: "JEV Score 0.18 (< 0.3): Thao tác chuyển tiếp an toàn, cho phép thực thi tự động.",
      evaluatedAt: new Date(),
    },
  },
  {
    title: "[Analytics]: Thu thập thống kê độ trễ proxy theo từng quốc gia",
    description: "Quét 15 node proxy, đo ping round-trip và ghi log hiệu năng trung bình 60s/lần.",
    type: "Task",
    actionType: "READ",
    priority: "P3",
    state: "Resolved",
    agentName: "Proxy Latency Sentinel",
    assignedTo: "agent_runner",
    riskScore: 0.04,
    jevEvaluation: {
      type: "boolean",
      result: "allow",
      reason: "Quyền READ: Cho phép đi thẳng mà không cần middleware.",
      evaluatedAt: new Date(),
    },
  },
  {
    title: "[Dangerous Action]: DROP TABLE accounts_staging",
    description: "Agent tự động đề xuất xoá bảng tạm staging sau khi migration hoàn tất.",
    type: "Bug",
    actionType: "DANGEROUS",
    priority: "P0",
    state: "Blocked",
    agentName: "Security Auditor & Gatekeeper",
    assignedTo: "security_lead",
    riskScore: 0.98,
    jevEvaluation: {
      type: "boolean",
      result: "block",
      reason: "JEV Boolean Rule: Phát hiện lệnh DROP TABLE! Tự động chặn trong 100ms không cần hỏi lại user.",
      evaluatedAt: new Date(),
    },
  },
];

export async function GET() {
  try {
    await dbService.connect();
    let tasks = await dbService.agentTask.find().populate("soulId").sort({ createdAt: -1 });

    if (tasks.length === 0) {
      await dbService.agentTask.insertMany(SEED_TASKS);
      tasks = await dbService.agentTask.find().populate("soulId").sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbService.connect();
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const actionType = body.actionType || "WRITE";
    const jev = evaluateJev(actionType, body.title, body.description);

    // Initial state determined by JEV reflex if not explicitly set
    let state = body.state;
    if (!state) {
      if (jev.result === "block") state = "Blocked";
      else if (jev.result === "confirm") state = "Awaiting Human";
      else state = "Active";
    }

    const newTask = await dbService.agentTask.create({
      title: body.title,
      description: body.description || "",
      type: body.type || "Task",
      actionType,
      priority: body.priority || "P2",
      state,
      soulId: body.soulId || null,
      agentName: body.agentName || "Autonomous Agent",
      assignedTo: state === "Awaiting Human" ? "human_operator" : "agent_runner",
      riskScore: jev.riskScore,
      jevEvaluation: {
        type: "score",
        result: jev.result,
        reason: jev.reason,
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
