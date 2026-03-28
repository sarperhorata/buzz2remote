"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => fetch("/api/jobs/saved").then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Saved Jobs</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data?.jobs?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No saved jobs yet.</p>
          <Link href="/jobs" className="text-blue-600 hover:underline">Browse jobs to save some</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.jobs?.map((job: { id: string; title: string; company: string; location: string | null; salary: string | null; posted_date: string | null }) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{job.company} {job.location && `- ${job.location}`}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
