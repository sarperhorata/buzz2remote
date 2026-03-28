import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// WebSocket support for Node.js environments
if (typeof globalThis.WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
  } catch {
    // ws not available
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // In Prisma v7, PrismaNeon expects a Pool config object (not a Pool instance).
  // It internally creates the Pool via new neon.Pool(config).
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  // @ts-expect-error - adapter type in Prisma v7
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
