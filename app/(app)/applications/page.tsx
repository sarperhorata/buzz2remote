"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { FileText, Building2, CheckCircle, XCircle, Clock } from "lucide-react";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle; label: string }> = {
  accepted: { variant: "default", icon: CheckCircle, label: "Accepted" },
  rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
  applied: { variant: "secondary", icon: Clock, label: "Applied" },
  pending: { variant: "secondary", icon: Clock, label: "Pending" },
};

export default function ApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetch("/api/applications").then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader title="My Applications" description="Track your job application status" />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data?.applications?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Start applying to remote jobs and track your progress here."
          actionLabel="Browse Jobs"
          actionHref="/jobs"
        />
      ) : (
        <div className="space-y-3">
          {data?.applications?.map((app: { id: string; status: string; applied_at: string; jobs: { id: string; title: string; company: string; location: string | null } }) => {
            const status = statusConfig[app.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div key={app.id} className="glass-card p-5 hover-lift">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${app.jobs.id}`} className="text-lg font-semibold hover:text-primary transition-colors truncate block">
                      {app.jobs.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                      <Building2 className="size-4 shrink-0" />
                      <span className="text-sm">{app.jobs.company}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={status.variant} className="gap-1 shrink-0">
                    <StatusIcon className="size-3" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
