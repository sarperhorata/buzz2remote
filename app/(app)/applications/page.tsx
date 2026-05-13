"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  DollarSign,
  MoreHorizontal,
  Inbox,
  Info,
  Heart,
  MousePointerClick,
  CheckCircle2,
  Archive,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  salary_range: { min: number | null; max: number | null; currency: string | null };
  remote_type: string | null;
  clickedAt: string | null;
  appliedAt: string | null;
  isActive: boolean;
  source: string | null;
}

interface KanbanResponse {
  likes: KanbanItem[];
  applyClicks: KanbanItem[];
  applied: KanbanItem[];
  expired: KanbanItem[];
  counts: { likes: number; applyClicks: number; applied: number; expired: number };
}

function getCompanyLogoUrl(company: string): string {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `https://logo.clearbit.com/${domain}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatSalary(item: KanbanItem): string | null {
  if (item.salary) return item.salary;
  const { min, max, currency } = item.salary_range;
  if (!min && !max) return null;
  const cur = currency || "USD";
  if (min && max) return `${cur} ${min.toLocaleString()}–${max.toLocaleString()}`;
  if (min) return `${cur} ${min.toLocaleString()}+`;
  if (max) return `Up to ${cur} ${max.toLocaleString()}`;
  return null;
}

function CompanyAvatar({ company }: { company: string }) {
  const [errored, setErrored] = useState(false);
  const letter = (company?.[0] ?? "?").toUpperCase();

  if (errored || !company) {
    return (
      <div className="size-9 shrink-0 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 flex items-center justify-center text-sm font-semibold">
        {letter}
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={getCompanyLogoUrl(company)}
      alt={company}
      className="size-9 shrink-0 rounded-md object-contain bg-card border"
      onError={() => setErrored(true)}
    />
  );
}

function JobCard({ item, dateLabel }: { item: KanbanItem; dateLabel: "Clicked" | "Applied" | "Liked" | "Expired" }) {
  const salary = formatSalary(item);
  const dateIso = dateLabel === "Applied" ? item.appliedAt : item.clickedAt ?? item.appliedAt;

  return (
    <div className="group relative rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/jobs/${item.id}`} className="block">
        <div className="flex items-start gap-3">
          <CompanyAvatar company={item.company} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug pr-6">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.company}</p>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {item.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
          {salary && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="size-3 shrink-0" />
              <span className="truncate">{salary}</span>
            </div>
          )}
        </div>

        {dateIso && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {dateLabel}: {formatDate(dateIso)}
          </p>
        )}
      </Link>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded p-1 hover:bg-muted/50 text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { window.location.href = `/jobs/${item.id}`; }}>
              View job
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Remove from list</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ColumnHeader({
  title,
  count,
  tooltip,
  headerClass,
}: {
  title: string;
  count: number;
  tooltip: string;
  headerClass: string;
}) {
  return (
    <div className={`flex items-center justify-between px-3 h-12 rounded-t-xl ${headerClass}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold">{title}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span aria-label="info" className="inline-flex opacity-80 hover:opacity-100">
                <Info className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[220px] text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-card text-foreground text-xs font-semibold">
        {count}
      </span>
    </div>
  );
}

function EmptyColumn({ icon: Icon, label }: { icon: typeof Inbox; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
      <Icon className="size-8 mb-2 opacity-50" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
  );
}

interface ColumnConfig {
  key: keyof Omit<KanbanResponse, "counts">;
  title: string;
  tooltip: string;
  headerClass: string;
  dateLabel: "Clicked" | "Applied" | "Liked" | "Expired";
  emptyIcon: typeof Inbox;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: "likes",
    title: "Likes",
    tooltip: "Jobs you liked but haven't applied to yet.",
    headerClass: "bg-slate-800 text-white",
    dateLabel: "Liked",
    emptyIcon: Heart,
  },
  {
    key: "applyClicks",
    title: "Apply Clicks",
    tooltip: "Jobs where you clicked 'Apply'. Mark them as applied once submitted.",
    headerClass: "bg-slate-700 text-white",
    dateLabel: "Clicked",
    emptyIcon: MousePointerClick,
  },
  {
    key: "applied",
    title: "Applied",
    tooltip: "Applications you've confirmed as submitted, or that have a response.",
    headerClass: "bg-slate-500 text-white",
    dateLabel: "Applied",
    emptyIcon: CheckCircle2,
  },
  {
    key: "expired",
    title: "Expired",
    tooltip: "Jobs that are no longer active.",
    headerClass: "bg-slate-400 text-white",
    dateLabel: "Expired",
    emptyIcon: Archive,
  },
];

export default function ApplicationsPage() {
  const { data, isLoading } = useQuery<KanbanResponse>({
    queryKey: ["applications-kanban"],
    queryFn: () => fetch("/api/applications/kanban").then((r) => r.json()),
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track everything from your job search in one Kanban.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = data?.[col.key] ?? [];
          const count = data?.counts?.[col.key] ?? 0;
          return (
            <div key={col.key} className="flex flex-col min-h-[400px]">
              <ColumnHeader
                title={col.title}
                count={count}
                tooltip={col.tooltip}
                headerClass={col.headerClass}
              />
              <div className="flex-1 bg-muted/40 rounded-b-xl p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
                {isLoading ? (
                  <ColumnSkeleton />
                ) : items.length === 0 ? (
                  <EmptyColumn icon={col.emptyIcon} label="No items here yet" />
                ) : (
                  items.map((item) => (
                    <JobCard key={item.id} item={item} dateLabel={col.dateLabel} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
