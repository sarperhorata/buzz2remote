/**
 * Smoke test: render the three CV templates to PDF files on disk so we can
 * eyeball them in Preview.app before exposing the feature.
 *
 * Usage: npx tsx scripts/test-cv-render.ts
 *
 * Writes:
 *   /tmp/cv-modern.pdf
 *   /tmp/cv-classic.pdf
 *   /tmp/cv-minimal.pdf
 *
 * Uses a synthetic profile that exercises every section (multi-line bio,
 * 3 work entries with one current, 2 educations, skills, languages, certs,
 * all link types). If a template breaks on edge cases the diff will be
 * obvious between runs.
 */
import { writeFileSync } from "node:fs";
import { renderCVToPdfBuffer } from "../lib/cv-render/render";
import type { CVData, TemplateId } from "../lib/cv-render/types";

const data: CVData = {
  full_name: "Sarper Horata",
  position: "Senior Product Manager",
  email: "sarperhorata@gmail.com",
  phone: "+90 555 123 4567",
  location: "Istanbul, Turkey",
  links: {
    linkedin: "https://linkedin.com/in/sarperhorata",
    github: "https://github.com/sarperhorata",
    portfolio: "https://linktr.ee/horata",
  },
  bio: "Senior Product Manager with 12+ years of experience launching consumer and B2B products in fintech, travel, and i-gaming. Strong technical background (4 years as a software engineer), with a track record of growing revenue, leading cross-functional teams of 10-30, and shipping at scale. Author and consultant on product strategy and software development lifecycle.",
  work_experience: [
    {
      title: "Advisor Consultant",
      company: "Self-employed",
      location: "Remote",
      start_date: "2025-01",
      is_current: true,
      description:
        "Advise SaaS and AI startups on product strategy, software development lifecycle, and go-to-market. Currently engaged with ELD Bilisim / FORIPS to optimize academic video publication and trainings.",
    },
    {
      title: "Head of Product",
      company: "Travel.com",
      location: "Istanbul, Turkey",
      start_date: "2022-03",
      end_date: "2024-12",
      description:
        "Owned the consumer flights and hotels product. Grew ARR by 22% to $300M through new payment methods, dynamic packaging, and a redesigned post-booking experience. Led a 22-person product org across 3 squads.",
    },
    {
      title: "Senior Product Manager",
      company: "Slotegrator",
      location: "Limassol, Cyprus",
      start_date: "2019-08",
      end_date: "2022-02",
      description:
        "Launched the i-gaming aggregator's white-label sportsbook, scaling from 0 to 60 operator deployments in 18 months. Partnered closely with engineering on a complete UI rebuild that lifted bet conversion by 18%.",
    },
  ],
  education: [
    {
      school: "Middle East Technical University",
      degree: "BSc",
      field: "Computer Engineering",
      start_date: "2006",
      end_date: "2011",
    },
  ],
  skills: [
    "Product Strategy",
    "Roadmapping",
    "OKRs",
    "SQL",
    "A/B Testing",
    "Mixpanel",
    "Amplitude",
    "Figma",
    "Jira",
    "Stakeholder Management",
    "i-Gaming",
    "Fintech",
    "Travel",
    "Cross-functional Leadership",
  ],
  languages: [
    { name: "Turkish", proficiency: "Native" },
    { name: "English", proficiency: "Fluent" },
    { name: "Russian", proficiency: "B1" },
  ],
  certificates: [
    "Reforge — Product Management Certification (2023)",
    "AWS Certified Cloud Practitioner (2022)",
  ],
};

async function main() {
  const ids: TemplateId[] = ["modern", "classic", "minimal"];
  for (const id of ids) {
    const t = Date.now();
    const buf = await renderCVToPdfBuffer(data, id);
    const path = `/tmp/cv-${id}.pdf`;
    writeFileSync(path, buf);
    console.log(`${id}: ${buf.length.toLocaleString()} bytes in ${Date.now() - t}ms → ${path}`);
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
