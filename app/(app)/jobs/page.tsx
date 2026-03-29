"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { JobDetailModal } from "@/components/ui/job-detail-modal";
import {
  Search, MapPin, Building2, Clock, DollarSign,
  ChevronLeft, ChevronRight, Briefcase, LayoutGrid, LayoutList, X, Filter,
} from "lucide-react";

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

const JOB_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-Time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Freelance", label: "Freelance" },
];

const REMOTE_TYPE_OPTIONS = [
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "On-site", label: "On-site" },
];

async function fetchJobs(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/jobs?${query}`);
  return res.json();
}

function formatSalary(min: number | null, max: number | null, salary: string | null) {
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return salary;
}

function timeAgo(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getCompanyLogoUrl(company: string) {
  const domain = company
    .toLowerCase()
    .replace(/\s+(gmbh|inc|ltd|llc|ag|co|corp|se|group|&|co\.|kg)\.?/gi, "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
  return `https://logo.clearbit.com/${domain}.com`;
}

function CompanyLogo({ company, size = 40 }: { company: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="gradient-primary rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {company[0]?.toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={getCompanyLogoUrl(company)}
      alt={company}
      width={size}
      height={size}
      className="rounded-xl object-cover shrink-0 bg-muted"
      onError={() => setFailed(true)}
    />
  );
}

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const activeFilters = [jobType, remoteType].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", search, location, jobType, remoteType, page],
    queryFn: () =>
      fetchJobs({
        ...(search && { q: search }),
        ...(location && { location }),
        ...(jobType && { job_type: jobType }),
        ...(remoteType && { remote_type: remoteType }),
        page: page.toString(),
        limit: "20",
      }),
  });

  function clearFilters() {
    setJobType("");
    setRemoteType("");
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Remote Jobs" description={data?.total ? `${data.total} jobs found` : "Find your next remote opportunity"}>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </PageHeader>

      {/* Search Bar */}
      <div className="glass-card p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Job title, company, or keyword..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-11 border-0 bg-transparent"
            />
          </div>
          <div className="relative sm:w-52">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Location..."
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1); }}
              className="pl-10 h-11 border-0 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-1">
          <Filter className="size-3.5" />
          <span>Filters:</span>
        </div>

        {/* Job Type Pills */}
        {JOB_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setJobType(jobType === opt.value ? "" : opt.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              jobType === opt.value
                ? "gradient-primary text-stone-900 shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Remote Type Pills */}
        {REMOTE_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setRemoteType(remoteType === opt.value ? "" : opt.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              remoteType === opt.value
                ? "gradient-primary text-stone-900 shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {activeFilters > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-48 rounded-xl" : "h-28 rounded-xl"} />
          ))}
        </div>
      ) : data?.jobs?.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try different search terms or broaden your filters."
        />
      ) : (
        <>
          {/* LIST VIEW */}
          {viewMode === "list" ? (
            <div className="space-y-3">
              {data?.jobs?.map((job: Job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className="w-full text-left glass-card p-5 hover-lift group block"
                >
                  <div className="flex gap-4">
                    <CompanyLogo company={job.company} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                            {job.title}
                          </h2>
                          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                            <span className="text-sm">{job.company}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {job.location && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3.5" />{job.location}
                              </span>
                            )}
                            {job.posted_date && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3.5" />{timeAgo(job.posted_date)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.job_type && <Badge variant="secondary" className="text-xs">{job.job_type}</Badge>}
                            {job.remote_type && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{job.remote_type}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {(job.salary_min || job.salary_max) && (
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <DollarSign className="size-3.5" />
                              {formatSalary(job.salary_min, job.salary_max, job.salary)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.jobs?.map((job: Job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className="text-left glass-card p-5 hover-lift group flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CompanyLogo company={job.company} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                      {job.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          <MapPin className="size-3 shrink-0" />{job.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-auto">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.remote_type && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0">{job.remote_type}</Badge>
                    )}
                    {job.job_type && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{job.job_type}</Badge>}
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-0.5">
                      <DollarSign className="size-3" />
                      {formatSalary(job.salary_min, job.salary_max, job.salary)}
                    </p>
                  )}
                  {job.posted_date && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-0.5">
                      <Clock className="size-3" />{timeAgo(job.posted_date)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        jobId={selectedJobId}
        open={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />
    </div>
  );
}
