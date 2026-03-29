"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Search, MapPin, Building2, Clock, DollarSign, ChevronLeft, ChevronRight, Briefcase } from "lucide-react";

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
  skills: string[] | null;
  apply_url: string | null;
  posted_date: string | null;
}

async function fetchJobs(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/jobs?${query}`);
  return res.json();
}

function formatSalary(min: number | null, max: number | null, salary: string | null) {
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
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

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", search, location, page],
    queryFn: () =>
      fetchJobs({
        ...(search && { q: search }),
        ...(location && { location }),
        page: page.toString(),
        limit: "20",
      }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Remote Jobs" description={data?.total ? `${data.total} jobs found` : "Find your next remote opportunity"} />

      {/* Search Bar */}
      <div className="glass-card p-3 mb-8">
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

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
          <div className="space-y-3">
            {data?.jobs?.map((job: Job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block glass-card p-5 hover-lift group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                      <Building2 className="size-4 shrink-0" />
                      <span className="text-sm">{job.company}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
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
                    <div className="flex flex-wrap gap-1.5 mt-3">
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
              </Link>
            ))}
          </div>

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
    </div>
  );
}
