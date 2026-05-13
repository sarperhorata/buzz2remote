"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Heart, Building2, MapPin } from "lucide-react";

export default function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => fetch("/api/jobs/saved").then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader title="Saved Jobs" description="Jobs you've bookmarked for later" />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data?.jobs?.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved jobs yet"
          description="Browse jobs and save the ones you're interested in."
          actionLabel="Browse Jobs"
          actionHref="/jobs"
        />
      ) : (
        <div className="space-y-3">
          {data?.jobs?.map((job: { id: string; title: string; company: string; location: string | null; salary: string | null; posted_date: string | null }) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block glass-card p-5 hover-lift group">
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{job.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="size-3.5" />{job.company}</span>
                {job.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{job.location}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
