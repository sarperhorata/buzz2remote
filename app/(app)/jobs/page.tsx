"use client";

// Force-dynamic AND a Suspense boundary around the useSearchParams-consuming
// inner component. Both are needed: force-dynamic stops Next.js 16 from trying
// to prerender at build time, and Suspense satisfies its runtime invariant
// that any client component using useSearchParams sits inside a boundary
// (otherwise the build still errors at "Generating static pages" with
// "useSearchParams() should be wrapped in a suspense boundary").
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ThumbsUp, X } from "lucide-react";
import { classifyJobTitle } from "@/lib/job-categories";

// ─── MatchScoreBadge ───────────────────────────────────────────────────────

function MatchScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <div
        title="Complete your profile to see your match"
        className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-lg font-medium shrink-0"
      >
        ?
      </div>
    );
  }

  let ring = "#22c55e";
  let text = "text-emerald-600";
  if (score <= 40) {
    ring = "#ef4444";
    text = "text-red-500";
  } else if (score <= 70) {
    ring = "#f59e0b";
    text = "text-amber-600";
  }

  const pct = Math.max(0, Math.min(100, score));
  const bg = `conic-gradient(${ring} ${pct * 3.6}deg, #e5e7eb 0deg)`;

  return (
    <div
      title={`${score}% match`}
      className="relative w-[52px] h-[52px] rounded-full shrink-0 flex items-center justify-center"
      style={{ background: bg }}
    >
      <div className="absolute inset-[3px] rounded-full bg-card flex items-center justify-center">
        <span className={`text-sm font-semibold ${text}`}>{score}</span>
      </div>
    </div>
  );
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  job_type: string | null;
  remote_type: string | null;
  experience_level: string | null;
  skills: string[] | null;
  apply_url: string | null;
  posted_date: string | null;
}

interface CategoryItem {
  category: string;
  count: number;
}

interface JobStats {
  total: number;
  today: number;
  last48h: number;
  embargoCutoff: string; // ISO timestamp — jobs posted after this are Pro-only for first 48h
}

async function fetchJobs(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/jobs?${query}`);
  return res.json();
}

async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch("/api/jobs/categories");
  return res.json();
}

async function fetchStats(): Promise<JobStats> {
  const res = await fetch("/api/jobs/stats");
  return res.json();
}

// ─── MultiSelectDropdown ───────────────────────────────────────────────────

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  };

  const displayLabel =
    selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-muted transition ${
          selected.length > 0
            ? "border-amber-400 text-amber-600 bg-amber-50"
            : "border-border text-muted-foreground"
        }`}
      >
        {displayLabel}
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-52 bg-card border border-border rounded-xl shadow-lg py-1">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer text-sm text-foreground"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-border accent-amber-500"
              />
              {opt}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted border-t mt-1"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SalaryRangeSlider ────────────────────────────────────────────────────

const SALARY_MIN = 0;
const SALARY_MAX = 300000;
const SALARY_STEP = 10000;

function formatSalaryLabel(min: number, max: number): string {
  if (min === 0 && max === 0) return "Salary";
  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;
  if (min === 0) return `Up to ${fmt(max)}`;
  if (max === 0 || max === SALARY_MAX) return `${fmt(min)}+`;
  return `${fmt(min)} — ${fmt(max)}`;
}

function SalaryRangeSlider({
  value,
  onChange,
  includeSalaryless,
  onIncludeSalarylessChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  includeSalaryless: boolean;
  onIncludeSalarylessChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const [minVal, maxVal] = value;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const posFromVal = (v: number) => ((v - SALARY_MIN) / (SALARY_MAX - SALARY_MIN)) * 100;

  const valFromPos = useCallback((clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = pct * (SALARY_MAX - SALARY_MIN) + SALARY_MIN;
    return Math.round(raw / SALARY_STEP) * SALARY_STEP;
  }, []);

  const handleMouseDown = (handle: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(handle);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const v = valFromPos(e.clientX);
      if (dragging === "min") {
        onChange([Math.min(v, maxVal === 0 ? SALARY_MAX : maxVal - SALARY_STEP), maxVal]);
      } else {
        onChange([minVal, Math.max(v, minVal + SALARY_STEP)]);
      }
    };
    const handleMouseUp = () => setDragging(null);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, minVal, maxVal, valFromPos, onChange]);

  const isActive = minVal !== 0 || maxVal !== 0;
  const label = formatSalaryLabel(minVal, maxVal);
  const minPct = posFromVal(minVal);
  const maxPct = posFromVal(maxVal === 0 ? SALARY_MAX : maxVal);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-muted transition ${
          isActive
            ? "border-amber-400 text-amber-600 bg-amber-50"
            : "border-border text-muted-foreground"
        }`}
      >
        {label}
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-card border border-border rounded-xl shadow-lg p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{formatSalaryLabel(minVal, maxVal)}</span>
            {isActive && (
              <button type="button" onClick={() => onChange([0, 0])} className="text-destructive text-xs">Reset</button>
            )}
          </div>
          <div
            ref={trackRef}
            className="relative h-2 rounded-full bg-muted my-4 mx-2 select-none"
          >
            <div
              className="absolute h-2 rounded-full bg-amber-500"
              style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-card border-2 border-amber-500 shadow cursor-pointer hover:scale-110 transition-transform"
              style={{ left: `${minPct}%` }}
              onMouseDown={handleMouseDown("min")}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-card border-2 border-amber-500 shadow cursor-pointer hover:scale-110 transition-transform"
              style={{ left: `${maxPct}%` }}
              onMouseDown={handleMouseDown("max")}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 mb-3">
            <span>$0</span><span>$300k</span>
          </div>
          <div className="flex gap-2 mt-1">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Min ($)</label>
              <input
                type="number" min={0} max={SALARY_MAX} step={SALARY_STEP} value={minVal}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(Number(e.target.value), maxVal === 0 ? SALARY_MAX : maxVal - SALARY_STEP));
                  onChange([v, maxVal]);
                }}
                className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Max ($)</label>
              <input
                type="number" min={0} max={SALARY_MAX} step={SALARY_STEP}
                value={maxVal === 0 ? SALARY_MAX : maxVal}
                onChange={(e) => {
                  const v = Math.min(SALARY_MAX, Math.max(Number(e.target.value), minVal + SALARY_STEP));
                  onChange([minVal, v === SALARY_MAX ? 0 : v]);
                }}
                className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm text-muted-foreground">
            <input
              type="checkbox" checked={includeSalaryless}
              onChange={(e) => onIncludeSalarylessChange(e.target.checked)}
              className="rounded border-border accent-amber-500"
            />
            Show jobs without salary info
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const REMOTE_TYPES = ["Remote", "Hybrid", "On-site"];
const EXPERIENCE_LEVELS = ["Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Executive"];

// ─── JobsPage ──────────────────────────────────────────────────────────────

interface InteractionsData {
  likes: string[];
  dismisses: string[];
}

interface MatchScoresData {
  scores: Record<string, number>;
}

// Suspense fallback — match the page chrome (max-w-7xl, padding) so the layout
// doesn't shift when filters hydrate. Just a skeleton list; the real header /
// filter bar mounts almost immediately.
function JobsPageFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
      <div className="h-4 w-72 bg-muted rounded animate-pulse mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageFallback />}>
      <JobsPageInner />
    </Suspense>
  );
}

function JobsPageInner() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  // Initial filter state hydrates from URL query params so deep links from job
  // detail tags ("/jobs?location=Berlin&job_type=Full-time") work as expected.
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialLocation = searchParams.get("location") ?? "";
  const initialJobType = searchParams.get("job_type");
  const initialRemoteType = searchParams.get("remote_type");
  const initialExperience = searchParams.get("experience_level");

  const [search, setSearch] = useState(initialQ);
  const [location, setLocation] = useState(initialLocation);
  const [page, setPage] = useState(1);
  const [jobTypes, setJobTypes] = useState<string[]>(initialJobType ? [initialJobType] : []);
  const [remoteTypes, setRemoteTypes] = useState<string[]>(initialRemoteType ? [initialRemoteType] : []);
  const [experienceLevels, setExperienceLevels] = useState<string[]>(initialExperience ? [initialExperience] : []);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 0]);
  const [includeSalaryless, setIncludeSalaryless] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const apiExperienceLevel = experienceLevels.length === 1 ? experienceLevels[0] : undefined;
  const [salaryMin, salaryMax] = salaryRange;

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", search, location, page, jobTypes, remoteTypes, apiExperienceLevel, salaryMin, salaryMax],
    queryFn: () =>
      fetchJobs({
        ...(search && { q: search }),
        ...(location && { location }),
        page: page.toString(),
        limit: "50",
        ...(salaryMin > 0 && { salary_min: salaryMin.toString() }),
        ...(salaryMax > 0 && { salary_max: salaryMax.toString() }),
        ...(apiExperienceLevel && { experience_level: apiExperienceLevel }),
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ["job-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ["job-stats"],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: interactions } = useQuery<InteractionsData>({
    queryKey: ["job-interactions"],
    queryFn: () => fetch("/api/jobs/interactions").then((r) => r.json()),
    enabled: !!session,
  });

  // Optimistic overlay so UI feels instant before invalidation roundtrip
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, boolean>>({});
  const [optimisticDismisses, setOptimisticDismisses] = useState<Record<string, boolean>>({});

  const likeSet = useMemo(() => {
    const s = new Set(interactions?.likes ?? []);
    for (const [id, on] of Object.entries(optimisticLikes)) {
      if (on) s.add(id);
      else s.delete(id);
    }
    return s;
  }, [interactions?.likes, optimisticLikes]);

  const dismissSet = useMemo(() => {
    const s = new Set(interactions?.dismisses ?? []);
    for (const [id, on] of Object.entries(optimisticDismisses)) {
      if (on) s.add(id);
      else s.delete(id);
    }
    return s;
  }, [interactions?.dismisses, optimisticDismisses]);

  // Pro-tier detection: used only to choose whether to show the "Be first in
  // line" upsell banner. The actual embargo filter runs SERVER-SIDE in
  // /api/jobs so pagination stays consistent — applying it on the client
  // dropped entire pages of recent jobs and showed "No jobs found" while
  // the header said "3,584 total".
  const subscriptionPlan = (session?.user as { subscriptionPlan?: string | null } | undefined)?.subscriptionPlan;
  const isPro = subscriptionPlan === "pro" || subscriptionPlan === "premium";

  // Client-side post-filters (type + remote + experience + salary + category + dismissed)
  const filteredJobs = useMemo(() => {
    return (data?.jobs ?? []).filter((job: Job) => {
      if (jobTypes.length > 0 && !jobTypes.some((t) => job.job_type === t)) return false;
      if (remoteTypes.length > 0 && !remoteTypes.some((t) => job.remote_type === t)) return false;
      if (experienceLevels.length > 1 && !experienceLevels.some((l) => job.experience_level === l)) return false;
      if (!includeSalaryless && job.salary_min === null && job.salary_max === null) return false;
      if (activeCategory !== "All" && classifyJobTitle(job.title) !== activeCategory) return false;
      if (dismissSet.has(job.id)) return false;
      return true;
    });
  }, [data?.jobs, jobTypes, remoteTypes, experienceLevels, includeSalaryless, activeCategory, dismissSet]);

  const visibleJobIds = useMemo(
    () => filteredJobs.map((j: Job) => j.id).slice(0, 50),
    [filteredJobs]
  );

  const { data: matchScoresData } = useQuery<MatchScoresData>({
    queryKey: ["match-scores", visibleJobIds.join(",")],
    queryFn: () =>
      fetch("/api/jobs/match-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: visibleJobIds }),
      }).then((r) => r.json()),
    enabled: !!session && visibleJobIds.length > 0,
  });
  const scores = matchScoresData?.scores ?? {};

  const interactionMutation = useMutation({
    mutationFn: async ({
      jobId,
      type,
      remove,
    }: {
      jobId: string;
      type: "like" | "dismiss";
      remove?: boolean;
    }) => {
      const res = await fetch(`/api/jobs/${jobId}/interactions`, {
        method: remove ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: remove ? undefined : JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Interaction failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-interactions"] });
    },
  });

  const handleLike = (jobId: string, currentlyLiked: boolean) => {
    if (!session) return;
    setOptimisticLikes((m) => ({ ...m, [jobId]: !currentlyLiked }));
    interactionMutation.mutate(
      { jobId, type: "like", remove: currentlyLiked },
      {
        onError: () => {
          setOptimisticLikes((m) => {
            const next = { ...m };
            delete next[jobId];
            return next;
          });
        },
        onSettled: () => {
          // Clear overlay once server state is reconciled
          setOptimisticLikes((m) => {
            const next = { ...m };
            delete next[jobId];
            return next;
          });
        },
      }
    );
  };

  const handleDismiss = (jobId: string) => {
    if (!session) return;
    setOptimisticDismisses((m) => ({ ...m, [jobId]: true }));
    interactionMutation.mutate(
      { jobId, type: "dismiss" },
      {
        onError: () => {
          setOptimisticDismisses((m) => {
            const next = { ...m };
            delete next[jobId];
            return next;
          });
        },
        onSettled: () => {
          setOptimisticDismisses((m) => {
            const next = { ...m };
            delete next[jobId];
            return next;
          });
        },
      }
    );
  };

  const resetAll = () => {
    setSearch(""); setLocation(""); setJobTypes([]); setRemoteTypes([]);
    setExperienceLevels([]); setSalaryRange([0, 0]); setIncludeSalaryless(true);
    setActiveCategory("All"); setPage(1);
  };

  const hasFilters = search || location || jobTypes.length > 0 || remoteTypes.length > 0 ||
    experienceLevels.length > 0 || salaryMin > 0 || salaryMax > 0 || activeCategory !== "All";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Remote Jobs</h1>
        {stats && (
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total.toLocaleString()} total
            {stats.today > 0 && (
              <> · <span className="text-amber-600 font-medium">{stats.today.toLocaleString()} new today</span></>
            )}
          </p>
        )}
      </div>

      {/* Category Tabs */}
      {categories && categories.length > 0 && (
        <div className="mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-0 overflow-x-auto border-b border-border" style={{ scrollbarWidth: "none" }}>
            {categories.map((item) => (
              <button
                key={item.category}
                onClick={() => { setActiveCategory(item.category); setPage(1); }}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                  activeCategory === item.category
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {item.category}
                <span className={`ml-1 text-xs ${activeCategory === item.category ? "text-amber-500" : "text-muted-foreground/60"}`}>
                  ({item.count.toLocaleString()})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Job title, company, or keyword..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Location..."
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          className="sm:w-44 px-4 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <MultiSelectDropdown label="Job Type" options={JOB_TYPES} selected={jobTypes}
          onChange={(v) => { setJobTypes(v); setPage(1); }} />
        <MultiSelectDropdown label="Remote Type" options={REMOTE_TYPES} selected={remoteTypes}
          onChange={(v) => { setRemoteTypes(v); setPage(1); }} />
        <MultiSelectDropdown label="Experience" options={EXPERIENCE_LEVELS} selected={experienceLevels}
          onChange={(v) => { setExperienceLevels(v); setPage(1); }} />
        <SalaryRangeSlider
          value={salaryRange}
          onChange={(v) => { setSalaryRange(v); setPage(1); }}
          includeSalaryless={includeSalaryless}
          onIncludeSalarylessChange={setIncludeSalaryless}
        />
        {hasFilters && (
          <button type="button" onClick={resetAll}
            className="text-xs text-muted-foreground hover:text-destructive underline ml-1">
            Clear all
          </button>
        )}
      </div>

      {/* "Be first in line" — 48h embargo banner for free users */}
      {!isPro && stats && stats.last48h > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3zm-7 9a7 7 0 0114 0H5z" />
              </svg>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Be first in line.</p>
              <p className="text-blue-700">
                <span className="font-medium">{stats.last48h} new job{stats.last48h === 1 ? "" : "s"}</span> posted in the last 48 hours.
                Pro members see them first — free users get access once the embargo expires.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap shrink-0"
          >
            Get Early Access
          </Link>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/4 mb-3" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No jobs found</p>
          <p className="text-sm">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredJobs.length.toLocaleString()} job{filteredJobs.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {filteredJobs.map((job: Job) => {
              const isLiked = likeSet.has(job.id);
              const score = session
                ? (Object.prototype.hasOwnProperty.call(scores, job.id) ? scores[job.id] : null)
                : null;
              return (
                <div
                  key={job.id}
                  className="relative bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-amber-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Match score (left) */}
                    <MatchScoreBadge score={score} />

                    {/* Job info (middle) — clickable to detail */}
                    <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0 block">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h2 className="text-base font-semibold text-foreground truncate">{job.title}</h2>
                          <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.location && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.location}</span>
                            )}
                            {job.remote_type && (
                              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{job.remote_type}</span>
                            )}
                            {job.job_type && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.job_type}</span>
                            )}
                            {job.experience_level && (
                              <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">{job.experience_level}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {(job.salary_min || job.salary_max) && (
                            <p className="text-sm font-semibold text-emerald-600">
                              {job.salary_min && job.salary_max
                                ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`
                                : job.salary}
                            </p>
                          )}
                          {job.posted_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(() => {
                                const diff = Date.now() - new Date(job.posted_date).getTime();
                                const days = Math.floor(diff / 86400000);
                                if (days === 0) return "Today";
                                if (days === 1) return "Yesterday";
                                if (days < 7) return `${days}d ago`;
                                return `${Math.floor(days / 7)}w ago`;
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Like + Dismiss (right) */}
                    {session && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLike(job.id, isLiked);
                          }}
                          aria-label={isLiked ? "Unlike job" : "Like job"}
                          title={isLiked ? "Unlike" : "Like"}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
                            isLiked
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "border-border text-muted-foreground hover:text-amber-600 hover:border-amber-300 bg-card"
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDismiss(job.id);
                          }}
                          aria-label="Dismiss job"
                          title="Not interested"
                          className="w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-red-300 bg-card flex items-center justify-center transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination — hidden when category filter is active (already seeing full filtered set) */}
          {data?.totalPages > 1 && activeCategory === "All" && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
