import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Building2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company?: string;
    location?: string;
    jobType?: string;
    remoteType?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string;
    createdAt?: string | Date;
    source?: string;
  };
  showFavoriteButton?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (jobId: string) => void;
  className?: string;
}

function formatSalary(min?: number | null, max?: number | null, currency?: string) {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return n.toString();
  };
  const cur = currency || "USD";
  if (min && max) return `$${fmt(min)} - $${fmt(max)} ${cur}`;
  if (min) return `From $${fmt(min)} ${cur}`;
  if (max) return `Up to $${fmt(max)} ${cur}`;
  return null;
}

function timeAgo(date?: string | Date) {
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

export function JobCard({ job, showFavoriteButton, isFavorited, onToggleFavorite, className }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const posted = timeAgo(job.createdAt);

  return (
    <div className={cn("glass-card p-5 hover-lift group relative", className)}>
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
              {job.title}
            </h3>
            {job.company && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <Building2 className="size-4 shrink-0" />
                <span className="text-sm truncate">{job.company}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {job.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span>{job.location}</span>
                </div>
              )}
              {posted && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>{posted}</span>
                </div>
              )}
              {salary && (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="size-3.5" />
                  <span>{salary}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.jobType && (
                <Badge variant="secondary" className="text-xs">{job.jobType}</Badge>
              )}
              {job.remoteType && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {job.remoteType}
                </Badge>
              )}
              {job.source && (
                <Badge variant="outline" className="text-xs">{job.source}</Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
      {showFavoriteButton && onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(job.id); }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Heart className={cn("size-5", isFavorited ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
        </button>
      )}
    </div>
  );
}
