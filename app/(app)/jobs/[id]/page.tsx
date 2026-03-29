import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Briefcase, Globe, Award, DollarSign, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.jobs.findUnique({
    where: { id },
    select: { title: true, company: true, location: true },
  });

  if (!job) return { title: "Job Not Found" };

  return {
    title: `${job.title} at ${job.company}`,
    description: `Remote ${job.title} position at ${job.company}. ${job.location || "Worldwide"}.`,
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await prisma.jobs.findUnique({ where: { id } });

  if (!job) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/jobs">
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Jobs
        </Link>
      </Button>

      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {job.title}
            </h1>
            <p className="text-lg text-muted-foreground">{job.company}</p>
          </div>
          {job.apply_url && (
            <Button asChild className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all shrink-0">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                Apply Now
                <ExternalLink className="size-4 ml-1.5" />
              </a>
            </Button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {job.location && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" />{job.location}
            </Badge>
          )}
          {job.job_type && (
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="size-3" />{job.job_type}
            </Badge>
          )}
          {job.remote_type && (
            <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Globe className="size-3" />{job.remote_type}
            </Badge>
          )}
          {job.experience_level && (
            <Badge variant="outline" className="gap-1">
              <Award className="size-3" />{job.experience_level}
            </Badge>
          )}
          {(job.salary_min || job.salary_max) && (
            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
              <DollarSign className="size-3" />
              {job.salary_min && job.salary_max
                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()} ${job.salary_currency || "USD"}`
                : job.salary}
            </Badge>
          )}
        </div>

        {/* Skills */}
        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(job.skills as string[]).map((skill) => (
                <Badge key={skill} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Requirements</h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: job.requirements }}
            />
          </div>
        )}

        {/* Benefits */}
        {job.benefits && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Benefits</h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: job.benefits }}
            />
          </div>
        )}

        {/* Apply Button */}
        {job.apply_url && (
          <div className="mt-8 pt-6 border-t">
            <Button size="lg" asChild className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                Apply for this Position
                <ExternalLink className="size-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
