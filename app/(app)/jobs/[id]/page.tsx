import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Briefcase,
  CheckCircle,
  Gift,
  Building2,
  Sparkles,
  Info,
  MapPin,
  Globe,
  GraduationCap,
  Clock,
  Eye,
  Send,
  Wrench,
} from "lucide-react";
import {
  parseDescription,
  languageLabel,
  languageFlag,
  type ParsedSection,
} from "@/lib/parse-job-description";
import { estimateSalary, formatSalaryShort } from "@/lib/salary-estimate";
import { classifyJobTitle } from "@/lib/job-categories";
import { SkillsTagList } from "./SkillsTagList";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.jobs.findUnique({
    where: { id },
    select: { title: true, company: true, location: true },
  });

  if (!job) return { title: "Job Not Found" };

  return {
    title: `${job.title} at ${job.company}`,
    description: `Remote ${job.title} position at ${job.company}. ${job.location || "Worldwide"}.`,
  };
}

/**
 * Human-readable relative time. No date-fns: a 10-line helper.
 */
function timeAgo(date: Date | null): string | null {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 0) return "Just now";
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "Just now";
  if (m < 60) return `Posted ${m} minute${m === 1 ? "" : "s"} ago`;
  if (h < 24) return `Posted ${h} hour${h === 1 ? "" : "s"} ago`;
  if (d < 7) return `Posted ${d} day${d === 1 ? "" : "s"} ago`;
  if (d < 30) return `Posted ${Math.floor(d / 7)} week${Math.floor(d / 7) === 1 ? "" : "s"} ago`;
  if (d < 365) return `Posted ${Math.floor(d / 30)} month${Math.floor(d / 30) === 1 ? "" : "s"} ago`;
  return `Posted ${Math.floor(d / 365)} year${Math.floor(d / 365) === 1 ? "" : "s"} ago`;
}

/**
 * Map a parsed section heading to the right icon + accent color.
 * Falls back to a Sparkles icon for "Overview" / unknowns.
 */
function sectionDecor(heading: string): { Icon: typeof Briefcase; accent: string } {
  switch (heading) {
    case "Responsibilities":
      return { Icon: Briefcase, accent: "text-amber-600" };
    case "Requirements":
      return { Icon: CheckCircle, accent: "text-emerald-600" };
    case "Nice to Have":
      return { Icon: Sparkles, accent: "text-violet-600" };
    case "Benefits":
      return { Icon: Gift, accent: "text-pink-600" };
    case "About the Company":
      return { Icon: Building2, accent: "text-blue-600" };
    default:
      return { Icon: Sparkles, accent: "text-gray-500" };
  }
}

/**
 * Decide whether a section should render as a bullet list or paragraphs.
 *
 * Heuristic: if more than half the items are short (< 200 chars), render as
 * a list. Long-form prose sections (typically "Overview" / "About") become
 * paragraphs.
 */
function shouldRenderAsList(content: string[]): boolean {
  if (content.length < 2) return false;
  const shortCount = content.filter((c) => c.length < 200).length;
  return shortCount > content.length / 2;
}

function SectionBlock({ section }: { section: ParsedSection }) {
  const { Icon, accent } = sectionDecor(section.heading);
  const asList = shouldRenderAsList(section.content);
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-3">
        <Icon className={`size-5 ${accent}`} aria-hidden />
        {section.heading}
      </h2>
      {asList ? (
        <ul className="space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed list-disc list-outside ml-5">
          {section.content.map((item, i) => (
            <li key={i} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          {section.content.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Reusable filter-tag link. Each non-skill tag on the job page becomes a
 * Link to `/jobs?<param>=<value>`, letting users pivot into a filtered
 * search with one click.
 */
function FilterTag({
  href,
  label,
  tone,
  tooltip,
  icon: Icon,
}: {
  href: string;
  label: string;
  tone: "neutral" | "blue" | "green" | "purple";
  tooltip: string;
  icon?: typeof MapPin;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  };
  return (
    <Link
      href={href}
      title={tooltip}
      className={`inline-flex items-center gap-1.5 ${tones[tone]} hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-900/40 dark:hover:text-amber-200 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer`}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {label}
    </Link>
  );
}

/**
 * Coerce job.skills (Prisma `Json?`) into a clean string[].
 * Filters out non-strings and empty entries.
 */
function normalizeSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (typeof s === "string") return s.trim();
      if (s && typeof s === "object" && "name" in s) {
        const name = (s as { name: unknown }).name;
        return typeof name === "string" ? name.trim() : "";
      }
      return "";
    })
    .filter((s) => s.length > 0);
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const [job, session] = await Promise.all([
    prisma.jobs.findUnique({ where: { id } }),
    auth(),
  ]);

  if (!job) notFound();

  const isLoggedIn = !!session?.user;
  const applyHref = isLoggedIn
    ? `/api/jobs/${id}/apply`
    : `/login?callbackUrl=/jobs/${id}`;
  const applyText = isLoggedIn ? "Apply Now" : "Sign in to Apply";
  const hasApplyUrl = !!(job.apply_url || job.source_url);

  const category = classifyJobTitle(job.title);
  const skills = normalizeSkills(job.skills);
  const hasRealSalary = job.salary_min != null || job.salary_max != null || !!job.salary;

  // Parallel: parse the description (CPU work, in-process) + fetch a salary
  // estimate (DB) + fetch similar jobs (DB). Awaiting them concurrently keeps
  // server render time bounded by the slowest task.
  const parsedPromise = Promise.resolve(parseDescription(job.description));
  const salaryEstimatePromise = hasRealSalary
    ? Promise.resolve(null)
    : estimateSalary(job.title, category);
  const similarJobsPromise = prisma.jobs.findMany({
    where: {
      is_active: true,
      archived: false,
      id: { not: job.id },
      // Reuse the category's keyword OR clause to match siblings.
      OR: [{ title: { contains: job.title.split(/\s+/)[0] ?? "", mode: "insensitive" } }],
    },
    take: 5,
    orderBy: { posted_date: "desc" },
    select: { id: true, title: true, company: true, location: true },
  });

  const [parsed, salaryEstimate, similarJobs] = await Promise.all([
    parsedPromise,
    salaryEstimatePromise,
    similarJobsPromise,
  ]);

  const posted = timeAgo(job.posted_date ?? job.created_at ?? null);
  const showLangBadge = parsed.language !== "en";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/jobs" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Jobs
      </Link>

      <article className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {job.title}
              </h1>
              {showLangBadge && (
                <span
                  className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md text-xs font-medium"
                  title={`This job is posted in ${languageLabel(parsed.language)}`}
                >
                  <Globe className="size-3" aria-hidden />
                  {languageFlag(parsed.language)} {languageLabel(parsed.language)}
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">{job.company}</p>
            {/* Posted date · views · applied */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {posted && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  {posted}
                </span>
              )}
              {typeof job.views_count === "number" && job.views_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5" aria-hidden />
                  {job.views_count.toLocaleString()} views
                </span>
              )}
              {typeof job.applications_count === "number" && job.applications_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Send className="size-3.5" aria-hidden />
                  {job.applications_count.toLocaleString()} applied
                </span>
              )}
            </div>
          </div>
          {hasApplyUrl && (
            <a
              href={applyHref}
              target={isLoggedIn ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition whitespace-nowrap shadow-sm"
            >
              {applyText}
            </a>
          )}
        </header>

        {/* Filter tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {job.location && (
            <FilterTag
              href={`/jobs?location=${encodeURIComponent(job.location)}`}
              label={job.location}
              tone="neutral"
              tooltip={`Search remote jobs in ${job.location}`}
              icon={MapPin}
            />
          )}
          {job.job_type && (
            <FilterTag
              href={`/jobs?job_type=${encodeURIComponent(job.job_type)}`}
              label={job.job_type}
              tone="blue"
              tooltip={`Search remote ${job.job_type} jobs`}
              icon={Briefcase}
            />
          )}
          {job.remote_type && (
            <FilterTag
              href={`/jobs?remote_type=${encodeURIComponent(job.remote_type)}`}
              label={job.remote_type}
              tone="green"
              tooltip={`Search ${job.remote_type} jobs`}
              icon={Globe}
            />
          )}
          {job.experience_level && (
            <FilterTag
              href={`/jobs?experience_level=${encodeURIComponent(job.experience_level)}`}
              label={job.experience_level}
              tone="purple"
              tooltip={`Search ${job.experience_level} jobs`}
              icon={GraduationCap}
            />
          )}
          {hasRealSalary && (
            <span className="inline-flex items-center bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
              {job.salary_min && job.salary_max
                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()} ${job.salary_currency || "USD"}`
                : job.salary}
            </span>
          )}
        </div>

        {/* Salary estimate card (only when no real salary AND we have data) */}
        {!hasRealSalary && salaryEstimate && (
          <div className="mb-6 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">💡</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Estimated salary:{" "}
                    <span className="text-amber-700 dark:text-amber-300">
                      {formatSalaryShort(salaryEstimate.min, salaryEstimate.currency)}
                      {" – "}
                      {formatSalaryShort(salaryEstimate.max, salaryEstimate.currency)}
                    </span>{" "}
                    <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">
                      {salaryEstimate.currency}/yr
                    </span>
                  </p>
                  <span
                    title="This is an estimate computed from similar jobs in our database, not from the employer."
                    className="inline-flex items-center text-gray-400 dark:text-gray-500 cursor-help"
                  >
                    <Info className="size-4" aria-hidden />
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Based on {salaryEstimate.sampleSize} similar{" "}
                  <span className="font-medium">{category}</span> jobs · median{" "}
                  {formatSalaryShort(salaryEstimate.median, salaryEstimate.currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Wrench className="size-5 text-amber-600" aria-hidden />
              Skills
            </h2>
            <SkillsTagList skills={skills} />
          </section>
        )}

        {/* Parsed description sections */}
        {parsed.sections.length > 0 ? (
          <>
            {parsed.sections.map((section, i) => (
              <SectionBlock key={`${section.heading}-${i}`} section={section} />
            ))}
          </>
        ) : (
          // Fallback: if there's no description at all, show nothing.
          // (parseDescription handles the "no markers" case by returning a
          // single Overview section, so an empty array here means truly empty.)
          job.description && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-3">
                <Sparkles className="size-5 text-gray-500" aria-hidden />
                Overview
              </h2>
              <div
                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </section>
          )
        )}

        {/* Legacy fields — render only if the parsed description didn't
            already capture an equivalent section. These come from the older
            three-column schema (description / requirements / benefits). */}
        {job.requirements &&
          !parsed.sections.some((s) => s.heading === "Requirements") && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-3">
                <CheckCircle className="size-5 text-emerald-600" aria-hidden />
                Requirements
              </h2>
              <div
                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: job.requirements }}
              />
            </section>
          )}
        {job.benefits && !parsed.sections.some((s) => s.heading === "Benefits") && (
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Gift className="size-5 text-pink-600" aria-hidden />
              Benefits
            </h2>
            <div
              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: job.benefits }}
            />
          </section>
        )}

        {/* Apply Button */}
        {hasApplyUrl && (
          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <a
              href={applyHref}
              target={isLoggedIn ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-medium transition inline-block shadow-sm"
            >
              {isLoggedIn ? "Apply for this Position" : "Sign in to Apply"}
            </a>
          </div>
        )}
      </article>

      {/* Similar jobs */}
      {similarJobs.length > 0 && (
        <aside className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <Sparkles className="size-5 text-amber-600" aria-hidden />
            Similar jobs
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {similarJobs.map((sj) => (
              <li key={sj.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/jobs/${sj.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {sj.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {sj.company}
                    {sj.location ? ` · ${sj.location}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
