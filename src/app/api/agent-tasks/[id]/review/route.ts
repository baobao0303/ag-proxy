import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";
import { isValidId } from "@/lib/dynamo-model";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { decision, notes, comment, reviewer = "Human Supervisor" } = body;

  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json(
      { success: false, error: "Decision must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  const newState = decision === "approved" ? "Active" : "Blocked";

  try {
    await dbService.connect();
    if (isValidId(id)) {
      const updated = await dbService.agentTask.findByIdAndUpdate(
        id,
        {
          state: newState,
          humanReview: {
            reviewedBy: reviewer,
            reviewedAt: new Date(),
            decision,
            notes: notes || comment || "",
          },
          updatedAt: new Date(),
        },
        { new: true }
      ).populate("soulId");

      if (updated) {
        return NextResponse.json({ success: true, data: updated });
      }
    }
  } catch (error) {
    console.warn("DB review update failed, falling back to virtual review:", error);
  }

  // Fallback virtual review cho mock task
  return NextResponse.json({
    success: true,
    data: {
      _id: id,
      state: newState,
      humanReview: {
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        decision,
        comment: comment || notes || "",
      },
      updatedAt: new Date(),
    },
  });
}
