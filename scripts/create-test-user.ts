/**
 * Create a test user for browser-based UI testing.
 * Run: npx tsx scripts/create-test-user.ts
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "demo+test@buzz2remote.local";
const PASSWORD = "DemoTest2026!";
const NAME = "Demo Tester";

async function main() {
  const existing = await prisma.users.findUnique({ where: { email: EMAIL } });
  if (existing) {
    // Re-hash password in case it changed
    const hashed_password = await hash(PASSWORD, 12);
    await prisma.users.update({
      where: { id: existing.id },
      data: {
        hashed_password,
        is_active: true,
        email_verified: true,
        onboarding_completed: true,
        position: "Product Manager",
        bio: "Senior PM with 5+ years building remote-first SaaS products. Background in fintech and edtech.",
        skills: ["Product Strategy", "Roadmap Planning", "User Research", "A/B Testing", "SQL", "Figma", "Notion", "Jira", "Analytics"] as never,
      },
    });
    console.log("✓ Reset existing user:", EMAIL);
  } else {
    const hashed_password = await hash(PASSWORD, 12);
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: EMAIL,
        full_name: NAME,
        hashed_password,
        is_active: true,
        is_superuser: false,
        email_verified: true,
        auth_provider: "local",
        onboarding_completed: true,
        onboarding_step: 3,
        position: "Product Manager",
        bio: "Senior PM with 5+ years building remote-first SaaS products. Background in fintech and edtech.",
        skills: ["Product Strategy", "Roadmap Planning", "User Research", "A/B Testing", "SQL", "Figma", "Notion", "Jira", "Analytics"] as never,
      },
    });
    console.log("✓ Created user:", user.email, "id:", user.id);

    // Create a default profile too so AI features have data
    await prisma.user_profiles.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        profile_name: "Default",
        is_default: true,
        title: "Senior Product Manager",
        bio: "Senior PM with 5+ years building remote-first SaaS products. Background in fintech and edtech.",
        skills: [
          { name: "Product Strategy" },
          { name: "Roadmap Planning" },
          { name: "User Research" },
          { name: "A/B Testing" },
          { name: "SQL" },
          { name: "Figma" },
          { name: "Notion" },
          { name: "Jira" },
          { name: "Analytics" },
        ] as never,
      },
    });
    console.log("✓ Created default profile");
  }

  console.log("\n📋 Test credentials:");
  console.log("   Email:    ", EMAIL);
  console.log("   Password: ", PASSWORD);
}

main()
  .catch((e) => {
    console.error("✗ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
