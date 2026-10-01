import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbService.connect();
    const { id } = await params;
    const soul = await dbService.soul.findById(id);
    if (!soul) {
      return NextResponse.json({ success: false, error: "Soul not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: soul });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbService.connect();
    const { id } = await params;
    const body = await req.json();

    const updated = await dbService.soul.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Soul not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbService.connect();
    const { id } = await params;
    const deleted = await dbService.soul.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Soul not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Soul deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
