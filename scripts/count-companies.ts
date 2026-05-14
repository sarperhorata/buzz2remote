import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { prisma } from "../lib/db";

async function main() {
  const total = await prisma.companies.count();
  const active = await prisma.companies.count({ where: { is_active: true } });
  console.log({ total, active });
  // Sample top 5 by job count
  const top = await prisma.companies.findMany({
    take: 5,
    orderBy: { name: "asc" },
    select: { name: true, website: true, career_page: true, logo_url: true, is_active: true },
  });
  console.log("sample:");
  for (const c of top) console.log("  ", c);
  await prisma.$disconnect();
}
main();
