import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", database: "disconnected", detail: String(error), hasDbUrl: !!process.env.DATABASE_URL, dbUrlPrefix: process.env.DATABASE_URL?.slice(0, 15) },
      { status: 503 }
    );
  }
}
