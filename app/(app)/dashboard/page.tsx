"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Stethoscope,
  Search,
  Eye,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type DemandLevel = "low" | "moderate" | "high" | "very high";
type VisibilityLevel = "very low" | "low" | "moderate" | "high";

interface MarketPositionResponse {
  targetRole: string;
  demand: { level: DemandLevel; label: string; count: number };
  visibility: { score: number; level: VisibilityLevel; label: string; hint: string };
  headline: string;
}

interface PriorityTask {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: string;
  completed: boolean;
}

interface PrioritiesResponse {
  priorities: PriorityTask[];
  completedCount: number;
  totalCount: number;
}

interface StatsResponse {
  newThisWeek: number;
  activeMatches: number;
  jobsApplied: number;
  likedCount: number;
  topIndustries: string[];
  companiesHiring: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  FileText,
  Stethoscope,
  Search,
  Eye,
};

const DEMAND_PILL: Record<DemandLevel, string> = {
  low: "bg-red-100 text-red-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-green-100 text-green-700",
  "very high": "bg-emerald-100 text-emerald-700",
};

const VIS_PILL: Record<VisibilityLevel, string> = {
  "very low": "bg-red-100 text-red-700",
  low: "bg-orange-100 text-orange-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-green-100 text-green-700",
};

const DEMAND_BAR: Record<DemandLevel, string> = {
  low: "bg-red-500",
  moderate: "bg-amber-500",
  high: "bg-green-500",
  "very high": "bg-emerald-500",
};

const VIS_BAR: Record<VisibilityLevel, string> = {
  "very low": "bg-red-500",
  low: "bg-orange-500",
  moderate: "bg-amber-500",
  high: "bg-green-500",
};

function demandPercent(level: DemandLevel): number {
  return level === "low" ? 20 : level === "moderate" ? 50 : level === "high" ? 80 : 100;
}

const COMPANY_COLORS = [
  "bg-amber-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function companyInitial(name: string, idx: number): { initial: string; color: string } {
  return {
    initial: name.trim().charAt(0).toUpperCase() || "?",
    color: COMPANY_COLORS[idx % COMPANY_COLORS.length],
  };
}

// ─── Sub-sections ────────────────────────────────────────────────────────────

function MarketPositionCard({ data }: { data: MarketPositionResponse }) {
  const demandPct = demandPercent(data.demand.level);
  const visPct = data.visibility.score;

  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
        Market Position Diagnostic
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT */}
        <div>
          <h2 className="text-2xl font-bold leading-tight">{data.headline}</h2>
          <p className="text-sm text-muted-foreground mt-3">
            There {data.demand.count === 1 ? "is" : "are"}{" "}
            <span className="font-semibold text-foreground">{data.demand.count.toLocaleString()}</span>{" "}
            active roles matching your{" "}
            <span className="font-semibold text-foreground">{data.targetRole}</span> background right
            now. Complete the actions below to boost your visibility.
          </p>
        </div>

        {/* RIGHT */}
        <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Market Demand
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DEMAND_PILL[data.demand.level]}`}
              >
                {data.demand.label}
              </span>
            </div>
            <div className="w-full bg-card rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${DEMAND_BAR[data.demand.level]}`}
                style={{ width: `${demandPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.demand.count.toLocaleString()} active remote roles in {data.targetRole} this month
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Visibility
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VIS_PILL[data.visibility.level]}`}
              >
                {data.visibility.label}
              </span>
            </div>
            <div className="w-full bg-card rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${VIS_BAR[data.visibility.level]}`}
                style={{ width: `${visPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{data.visibility.hint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrioritiesCard({ data }: { data: PrioritiesResponse }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Today&apos;s priorities</h2>
        </div>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {data.completedCount}/{data.totalCount} completed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.priorities.map((p) => {
          const Icon = ICONS[p.icon] ?? FileText;
          return (
            <div
              key={p.id}
              className={`flex flex-col rounded-xl border p-4 ${
                p.completed ? "bg-green-50 border-green-200" : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center ${
                    p.completed ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {p.completed ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">
                {p.description}
              </p>
              {p.completed ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full text-green-700 border-green-300 hover:bg-green-100 hover:text-green-800"
                >
                  <Link href={p.actionHref}>
                    <CheckCircle2 className="size-4 mr-1" /> Completed
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                >
                  <Link href={p.actionHref}>
                    {p.actionLabel} <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MatchesCard({
  stats,
  visibilityScore,
}: {
  stats: StatsResponse;
  visibilityScore: number | undefined;
}) {
  const showCvAlert = (visibilityScore ?? 100) < 60;

  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-lg font-semibold">Job Matches</h2>
        <Link
          href="/jobs"
          className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
        >
          View all matches <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        New roles scored and ranked against your profile every week. Explore what&apos;s open and track
        your progress.
      </p>

      {showCvAlert && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Strengthen your CV first</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Your visibility score is below 60. Fixing your CV is the fastest way to climb match
              rankings.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white border-0 flex-shrink-0"
          >
            <Link href="/cv-review">Fix My CV</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-border bg-green-50/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            New This Week
          </p>
          <p className="text-2xl font-bold mt-1 text-green-700">{stats.newThisWeek}</p>
          <p className="text-xs text-muted-foreground mt-1">Updated weekly</p>
        </div>
        <div className="rounded-xl border border-border bg-amber-50/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Active Matches
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-700">{stats.activeMatches}+</p>
          <p className="text-xs text-muted-foreground mt-1">Across all roles</p>
        </div>
        <div className="rounded-xl border border-border bg-purple-50/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Jobs Applied
          </p>
          <p className="text-2xl font-bold mt-1 text-purple-700">{stats.jobsApplied}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.likedCount} liked</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Deep Match
          </p>
          <p className="text-2xl font-bold mt-1 text-muted-foreground/70 flex items-center gap-1">
            <Lock className="size-5" />
          </p>
          <Link href="/pricing" className="text-xs text-amber-600 hover:text-amber-700 mt-1 block">
            Learn more
          </Link>
        </div>
      </div>

      {stats.topIndustries.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Top Industries
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.topIndustries.map((ind) => (
              <Badge
                key={ind}
                className="bg-green-100 text-green-700 hover:bg-green-100 border-0"
              >
                {ind}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {stats.companiesHiring.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Companies Hiring
          </p>
          <div className="flex items-center gap-2">
            {stats.companiesHiring.slice(0, 5).map((c, idx) => {
              const { initial, color } = companyInitial(c, idx);
              return (
                <div
                  key={c}
                  title={c}
                  className={`size-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm`}
                >
                  {initial}
                </div>
              );
            })}
            {stats.companiesHiring.length > 5 && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full font-medium">
                +{stats.companiesHiring.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white border-0">
          <Link href="/jobs">
            Explore your matches <ArrowRight className="size-4 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function EarlyAccessBanner({ newThisWeek }: { newThisWeek: number }) {
  return (
    <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
      <div className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
        <Lock className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-900">Be first in line.</p>
        <p className="text-xs text-blue-800 mt-0.5">
          {newThisWeek} new jobs were posted in the last 48 hours. Premium members see them first for
          48 hours to apply ahead of the queue.
        </p>
      </div>
      <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white border-0 flex-shrink-0">
        <Link href="/pricing">Get Early Access</Link>
      </Button>
    </section>
  );
}

const RESOURCES: Array<{ title: string; description: string; gradient: string; href: string }> = [
  {
    title: "2026 Job Search Strategy for Senior Professionals",
    description:
      "Why the playbook that worked at mid-career stops scaling — and the new signals senior hiring managers respond to.",
    gradient: "from-amber-400 to-orange-500",
    href: "/blog",
  },
  {
    title: "When Experience Stops Being Enough",
    description:
      "The hidden ceiling senior candidates hit, and three reframes that turn a long résumé into a competitive advantage.",
    gradient: "from-blue-400 to-indigo-500",
    href: "/blog",
  },
  {
    title: "Senior Job Search Strategy: Fix the Signal Problem",
    description:
      "Most senior searches fail at the signaling layer — not the substance. Here's how to be findable and convincing.",
    gradient: "from-green-400 to-emerald-500",
    href: "/blog",
  },
];

function ResourcesSection() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-amber-500" />
        <h2 className="text-lg font-semibold">Strategic Resources</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RESOURCES.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
          >
            <div className={`h-32 bg-gradient-to-br ${r.gradient}`} />
            <div className="p-5">
              <h3 className="font-bold text-base leading-tight mb-2 line-clamp-2">{r.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
              <span className="text-sm text-amber-600 font-medium inline-flex items-center gap-1 group-hover:text-amber-700">
                Read more <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const marketQuery = useQuery<MarketPositionResponse>({
    queryKey: ["dashboard", "market-position"],
    queryFn: () => fetch("/api/dashboard/market-position").then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  const prioritiesQuery = useQuery<PrioritiesResponse>({
    queryKey: ["dashboard", "priorities"],
    queryFn: () => fetch("/api/dashboard/priorities").then((r) => r.json()),
    staleTime: 1000 * 60 * 2,
  });

  const statsQuery = useQuery<StatsResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Section 1: Welcome ── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s a snapshot of your job search progress and next steps.
          </p>
        </div>
        <Link
          href="/how-it-works"
          className="text-sm text-amber-600 hover:text-amber-700 font-medium hidden sm:inline-flex items-center gap-1 mt-2"
        >
          How Buzz2Remote works <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {/* ── Section 2: Market Position ── */}
      {marketQuery.isLoading || !marketQuery.data ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <MarketPositionCard data={marketQuery.data} />
      )}

      {/* ── Section 3: Priorities ── */}
      {prioritiesQuery.isLoading || !prioritiesQuery.data ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <PrioritiesCard data={prioritiesQuery.data} />
      )}

      {/* ── Section 4: Matches ── */}
      {statsQuery.isLoading || !statsQuery.data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <MatchesCard stats={statsQuery.data} visibilityScore={marketQuery.data?.visibility.score} />
      )}

      {/* ── Section 5: Premium banner ── */}
      {statsQuery.data && <EarlyAccessBanner newThisWeek={statsQuery.data.newThisWeek} />}

      {/* ── Section 6: Resources ── */}
      <ResourcesSection />
    </div>
  );
}
