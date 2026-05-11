"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Bell,
  Search,
  Heart,
  User,
  ArrowRight,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Application {
  id: string;
  status: "applied" | "interviewing" | "offered" | "rejected" | "closed";
  applied_at: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    salary: string | null;
    job_type: string | null;
    remote_type: string | null;
    apply_url: string | null;
  } | null;
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
  skills: unknown;
  apply_url: string | null;
  posted_date: string | null;
}

interface UserProfile {
  full_name: string | null;
  bio: string | null;
  position: string | null;
  location: string | null;
  skills: unknown;
  work_experience: unknown;
  resume_url: string | null;
  profile_picture_url: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Application["status"],
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  applied: { label: "Applied", bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  interviewing: { label: "Interviewing", bg: "bg-amber-100", text: "text-amber-700", icon: TrendingUp },
  offered: { label: "Offered", bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  closed: { label: "Closed", bg: "bg-gray-100", text: "text-gray-600", icon: XCircle },
};

function StatusBadge({ status }: { status: Application["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.closed;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function calcProfileCompletion(user: UserProfile | undefined): {
  score: number;
  missing: string[];
} {
  if (!user) return { score: 0, missing: [] };
  const checks: Array<{ field: string; label: string; points: number; ok: boolean }> = [
    { field: "full_name", label: "Full Name", points: 10, ok: !!user.full_name },
    { field: "bio", label: "Bio", points: 15, ok: !!user.bio },
    { field: "position", label: "Position / Title", points: 15, ok: !!user.position },
    { field: "location", label: "Location", points: 10, ok: !!user.location },
    {
      field: "skills",
      label: "Skills",
      points: 20,
      ok: Array.isArray(user.skills) && (user.skills as unknown[]).length > 0,
    },
    {
      field: "work_experience",
      label: "Work Experience",
      points: 20,
      ok: Array.isArray(user.work_experience) && (user.work_experience as unknown[]).length > 0,
    },
    { field: "resume_url", label: "Resume / CV", points: 10, ok: !!user.resume_url },
  ];
  const score = checks.filter((c) => c.ok).reduce((s, c) => s + c.points, 0);
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return { score, missing };
}

function formatSalary(job: Job): string | null {
  if (job.salary) return job.salary;
  if (job.salary_min && job.salary_max) {
    const cur = job.salary_currency ?? "USD";
    return `${cur} ${(job.salary_min / 1000).toFixed(0)}k – ${(job.salary_max / 1000).toFixed(0)}k`;
  }
  return null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CompanyAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="size-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PipelineColumn({
  title,
  status,
  applications,
  colorClass,
}: {
  title: string;
  status: Application["status"];
  applications: Application[];
  colorClass: string;
}) {
  const items = applications.filter((a) => a.status === status);
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${colorClass}`}>
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Empty</p>
        ) : (
          items.slice(0, 5).map((app) => (
            <div key={app.id} className="glass-card p-3 rounded-lg">
              <p className="text-xs font-medium line-clamp-1">{app.jobs?.title ?? "—"}</p>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{app.jobs?.company ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(app.applied_at)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfileCompletion({ user }: { user: UserProfile | undefined }) {
  const { score, missing } = calcProfileCompletion(user);
  return (
    <div className="glass-card p-5 h-full">
      <h3 className="font-semibold mb-4">Profile Completion</h3>
      {/* Circular-style display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative size-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${score} ${100 - score}`}
              strokeLinecap="round"
              className={score >= 80 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500"}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{score}%</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {score === 100
              ? "Complete!"
              : score >= 70
              ? "Almost there"
              : "Needs attention"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {missing.length === 0 ? "Your profile is fully complete." : `${missing.length} field${missing.length > 1 ? "s" : ""} missing`}
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {missing.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {missing.map((field) => (
            <li key={field} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
              {field}
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="sm" className="w-full gradient-primary text-white border-0 shadow-sm">
        <Link href="/profile">Complete Profile</Link>
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetch("/api/applications").then((r) => r.json()),
    staleTime: 1000 * 60 * 2,
  });

  const { data: notificationsData, isLoading: notifLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
    staleTime: 1000 * 60 * 2,
  });

  const { data: savedJobsData, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => fetch("/api/jobs/saved").then((r) => r.json()),
    staleTime: 1000 * 60 * 2,
  });

  const { data: recentJobsData, isLoading: recentLoading } = useQuery({
    queryKey: ["recent-jobs"],
    queryFn: () => fetch("/api/jobs/recent").then((r) => r.json()),
    staleTime: 1000 * 60 * 2,
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["user-me"],
    queryFn: () => fetch("/api/users/me").then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  const applications: Application[] = applicationsData?.applications ?? [];
  const savedJobs: Job[] = savedJobsData?.jobs ?? [];
  const recentJobs: Job[] = (recentJobsData?.jobs ?? []).slice(0, 3);
  const unreadCount: number = notificationsData?.unreadCount ?? 0;
  const activeCount = applications.filter((a) => a.status === "applied" || a.status === "interviewing").length;

  const statsLoading = appsLoading || notifLoading || savedLoading;

  const quickActions = [
    { href: "/jobs", label: "Browse Jobs", icon: Search, gradient: "from-amber-500 to-yellow-400" },
    { href: "/applications", label: "My Applications", icon: FileText, gradient: "from-amber-600 to-orange-500" },
    { href: "/favorites", label: "Saved Jobs", icon: Heart, gradient: "from-yellow-500 to-amber-400" },
    { href: "/profile", label: "Edit Profile", icon: User, gradient: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* ── Section 1: Welcome + Stats ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Welcome back,{" "}
          <span className="gradient-text">{session?.user?.name?.split(" ")[0] || "there"}</span>
        </h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your job search activity.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard label="Total Applications" value={applications.length} icon={FileText} />
              <StatCard label="Active Applications" value={activeCount} icon={TrendingUp} />
              <StatCard label="Saved Jobs" value={savedJobs.length} icon={Heart} />
              <StatCard label="Unread Notifications" value={unreadCount} icon={Bell} />
            </>
          )}
        </div>
      </div>

      {/* ── Section 2: Application Pipeline ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Application Pipeline</h2>
          <Link href="/applications" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {appsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <Briefcase className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No applications yet.</p>
            <p className="text-sm mt-1">Start browsing jobs and apply to track them here.</p>
            <Button asChild size="sm" className="mt-4 gradient-primary text-white border-0">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="glass-card p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PipelineColumn title="Applied" status="applied" applications={applications} colorClass="border-blue-400" />
              <PipelineColumn title="Interviewing" status="interviewing" applications={applications} colorClass="border-amber-400" />
              <PipelineColumn title="Offered" status="offered" applications={applications} colorClass="border-green-400" />
              <PipelineColumn title="Closed / Rejected" status="rejected" applications={applications} colorClass="border-gray-300" />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Recent Applications + Profile Completion ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2/3) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Applications</h2>
            <Link href="/applications" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="glass-card divide-y divide-border/50 overflow-hidden">
            {appsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No applications yet. Start browsing jobs!</p>
              </div>
            ) : (
              applications.slice(0, 5).map((app) => (
                <div key={app.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <CompanyAvatar name={app.jobs?.company ?? "?"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.jobs?.title ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.jobs?.company ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(app.applied_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profile Completion (1/3) */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          {profileLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : (
            <ProfileCompletion user={userProfile} />
          )}
        </div>
      </div>

      {/* ── Section 4: Recommended Jobs ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recommended Jobs</h2>
          <Link href="/jobs" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
            Browse All <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {recentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground text-sm">No jobs available right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentJobs.map((job) => {
              const salary = formatSalary(job);
              return (
                <div key={job.id} className="glass-card p-5 flex flex-col gap-3 hover-lift">
                  <div className="flex items-start gap-3">
                    <CompanyAvatar name={job.company} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {job.location}
                      </span>
                    )}
                    {job.job_type && (
                      <span className="capitalize bg-muted px-2 py-0.5 rounded-full">{job.job_type.replace("_", " ")}</span>
                    )}
                    {job.remote_type && (
                      <span className="capitalize bg-muted px-2 py-0.5 rounded-full">{job.remote_type.replace("_", " ")}</span>
                    )}
                  </div>
                  {salary && (
                    <p className="text-xs font-medium text-green-600">{salary}</p>
                  )}
                  <Button asChild size="sm" className="mt-auto w-full gradient-primary text-white border-0">
                    <Link href={job.apply_url ?? `/jobs/${job.id}`} target={job.apply_url ? "_blank" : undefined} rel={job.apply_url ? "noopener noreferrer" : undefined}>
                      Apply Now
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 5: Quick Actions ── */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <div className="glass-card p-5 hover-lift text-center">
                <div
                  className={`w-12 h-12 mx-auto bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon className="size-5 text-white" />
                </div>
                <p className="font-medium text-sm">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
