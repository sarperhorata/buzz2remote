"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Briefcase, Globe, Award, DollarSign, ExternalLink, Building2, Clock, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

interface JobDetailModalProps {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
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

export function JobDetailModal({ jobId, open, onClose }: JobDetailModalProps) {
  const { data: job, isLoading } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then((r) => r.json()),
    enabled: !!jobId && open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !job || job.error ? (
          <div className="p-6 text-center text-muted-foreground">Job not found.</div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 glass border-b p-5">
              <div className="flex items-start gap-4">
                <div className="gradient-primary rounded-xl size-12 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                  <Image
                    src={getCompanyLogoUrl(job.company)}
                    alt={job.company}
                    width={48}
                    height={48}
                    className="rounded-xl object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      target.parentElement!.textContent = job.company?.[0] || "?";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl font-bold tracking-tight">{job.title}</DialogTitle>
                  <p className="text-muted-foreground mt-0.5">{job.company}</p>
                </div>
                {job.apply_url && (
                  <Button asChild className="gradient-primary text-stone-900 font-bold border-0 shadow-lg shrink-0">
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                      Apply
                      <ExternalLink className="size-4 ml-1.5" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {job.location && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <MapPin className="size-3" />{job.location}
                  </Badge>
                )}
                {job.job_type && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Briefcase className="size-3" />{job.job_type}
                  </Badge>
                )}
                {job.remote_type && (
                  <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                    <Globe className="size-3" />{job.remote_type}
                  </Badge>
                )}
                {job.experience_level && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Award className="size-3" />{job.experience_level}
                  </Badge>
                )}
                {(job.salary_min || job.salary_max) && (
                  <Badge className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    <DollarSign className="size-3" />
                    {job.salary_min && job.salary_max
                      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                      : job.salary}
                  </Badge>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(job.skills as string[]).map((skill: string) => (
                      <Badge key={skill} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Description</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: job.description }} />
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Requirements</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: job.requirements }} />
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Benefits</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: job.benefits }} />
                </div>
              )}

              {/* Bottom CTA */}
              {job.apply_url && (
                <div className="pt-4 border-t">
                  <Button size="lg" asChild className="w-full gradient-primary text-stone-900 font-bold border-0 shadow-lg">
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                      Apply for this Position
                      <ExternalLink className="size-4 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
