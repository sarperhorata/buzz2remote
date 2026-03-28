import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { applicationUpdateSchema } from "@/lib/validators/application";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const application = await prisma.user_applications.findFirst({
      where: { id, user_id: user.id },
      include: { jobs: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = applicationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const application = await prisma.user_applications.updateMany({
      where: { id, user_id: user.id },
      data: { ...parsed.data, updated_at: new Date() },
    });

    if (application.count === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Application updated" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const result = await prisma.user_applications.deleteMany({
      where: { id, user_id: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Application withdrawn" });
  } catch (error) {
    return handleApiError(error);
  }
}
