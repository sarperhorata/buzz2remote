import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

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
      <Link href="/jobs" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Jobs
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {job.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{job.company}</p>
          </div>
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap"
            >
              Apply Now
            </a>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {job.location && (
            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">{job.location}</span>
          )}
          {job.job_type && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">{job.job_type}</span>
          )}
          {job.remote_type && (
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">{job.remote_type}</span>
          )}
          {job.experience_level && (
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm">{job.experience_level}</span>
          )}
          {(job.salary_min || job.salary_max) && (
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
              {job.salary_min && job.salary_max
                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()} ${job.salary_currency || "USD"}`
                : job.salary}
            </span>
          )}
        </div>

        {/* Skills */}
        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(job.skills as string[]).map((skill) => (
                <span key={skill} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Description</h2>
            <div
              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Requirements</h2>
            <div
              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: job.requirements }}
            />
          </div>
        )}

        {/* Benefits */}
        {job.benefits && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Benefits</h2>
            <div
              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: job.benefits }}
            />
          </div>
        )}

        {/* Apply Button */}
        {job.apply_url && (
          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition inline-block"
            >
              Apply for this Position
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
