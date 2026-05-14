/**
 * Diagnose the "3.5K → 948" job count regression.
 *
 * Prints: total active, total archived, age distribution of active jobs,
 * and the cron last-run signal (latest posted_date + latest created_at).
 *
 * Run: npx tsx scripts/diag-jobs.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { prisma } from "../lib/db";

async function main() {
  const [active, archived, latest, oldestActive, last48h] = await Promise.all([
    prisma.jobs.count({ where: { is_active: true, archived: false } }),
    prisma.jobs.count({ where: { OR: [{ is_active: false }, { archived: true }] } }),
    prisma.jobs.findFirst({
      where: { is_active: true, archived: false },
      orderBy: { posted_date: "desc" },
      select: { posted_date: true, created_at: true, source: true },
    }),
    prisma.jobs.findFirst({
      where: { is_active: true, archived: false },
      orderBy: { posted_date: "asc" },
      select: { posted_date: true },
    }),
    prisma.jobs.count({
      where: {
        is_active: true,
        archived: false,
        posted_date: { gte: new Date(Date.now() - 48 * 3600 * 1000) },
      },
    }),
  ]);

  console.log(`Active (is_active=true, archived=false): ${active}`);
  console.log(`Inactive or archived:                    ${archived}`);
  console.log(`Last 48h active:                         ${last48h}`);
  console.log(`Newest posted_date on active:            ${latest?.posted_date?.toISOString()} (created ${latest?.created_at?.toISOString()}, source=${latest?.source})`);
  console.log(`Oldest posted_date on active:            ${oldestActive?.posted_date?.toISOString()}`);

  // Group active by posted_date bucket
  const buckets = [
    { label: "≤ 24h",  from: 0, to: 1 },
    { label: "1-3d",   from: 1, to: 3 },
    { label: "3-7d",   from: 3, to: 7 },
    { label: "7-14d",  from: 7, to: 14 },
    { label: "14-30d", from: 14, to: 30 },
    { label: "> 30d",  from: 30, to: 365 },
  ];
  const now = Date.now();
  for (const b of buckets) {
    const count = await prisma.jobs.count({
      where: {
        is_active: true,
        archived: false,
        posted_date: {
          gte: new Date(now - b.to * 24 * 3600 * 1000),
          lt: b.from === 0 ? new Date(now + 24 * 3600 * 1000) : new Date(now - b.from * 24 * 3600 * 1000),
        },
      },
    });
    console.log(`  ${b.label.padEnd(8)} : ${count}`);
  }

  // What sources are still alive?
  const bySource: Array<{ source: string | null; _count: { _all: number } }> = await prisma.jobs.groupBy({
    by: ["source"],
    where: { is_active: true, archived: false },
    _count: { _all: true },
    orderBy: { _count: { source: "desc" } },
  }) as Array<{ source: string | null; _count: { _all: number } }>;
  console.log(`\nActive jobs by source (top 15):`);
  for (const row of bySource.slice(0, 15)) {
    console.log(`  ${(row.source ?? "(null)").padEnd(20)} : ${row._count._all}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
