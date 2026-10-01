import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbService.connect();
    const { id } = await params;
    const body = await req.json();

    const { decision, notes, reviewer = "Admin Operator" } = body;

    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { success: false, error: "Decision must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const newState = decision === "approved" ? "Active" : "Blocked";

    const updated = await dbService.agentTask.findByIdAndUpdate(
      id,
      {
        state: newState,
        humanReview: {
          reviewedBy: reviewer,
          reviewedAt: new Date(),
          decision,
          notes: notes || "",
        },
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("soulId");

    if (!updated) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
