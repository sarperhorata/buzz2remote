/**
 * Why does our DB have ZERO active Jobicy/Freshteam jobs even though we
 * fixed both fetchers and the upstream API is alive? Check whether the
 * importer is even reaching those sources by looking at the FULL count
 * (active + inactive + archived) plus the latest fetch timestamps.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { prisma } from "../lib/db";

async function main() {
  // Total by source — regardless of active/archived state
  const all: Array<{ source: string | null; _count: { _all: number } }> = await prisma.jobs.groupBy({
    by: ["source"],
    _count: { _all: true },
    orderBy: { _count: { source: "desc" } },
  }) as Array<{ source: string | null; _count: { _all: number } }>;
  console.log(`All-time count by source:`);
  for (const r of all) {
    console.log(`  ${(r.source ?? "(null)").padEnd(20)} : ${r._count._all}`);
  }

  // Latest Jobicy + Freshteam rows — when were they last seen?
  for (const src of ["Jobicy", "Freshteam"]) {
    const latest = await prisma.jobs.findFirst({
      where: { source: src },
      orderBy: { created_at: "desc" },
      select: { title: true, created_at: true, posted_date: true, is_active: true, archived: true },
    });
    console.log(`\nLatest "${src}" row in DB:`);
    if (!latest) {
      console.log(`  (none — source has NEVER successfully imported)`);
    } else {
      console.log(`  title:       ${latest.title?.slice(0, 50)}`);
      console.log(`  created_at:  ${latest.created_at?.toISOString()}`);
      console.log(`  posted_date: ${latest.posted_date?.toISOString()}`);
      console.log(`  is_active:   ${latest.is_active} (archived=${latest.archived})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
