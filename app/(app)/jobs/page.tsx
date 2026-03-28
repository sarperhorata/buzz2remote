"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Remote Jobs</h1>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Job title, company, or keyword..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <input
          type="text"
          placeholder="Location..."
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          className="sm:w-48 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading jobs...</div>
      ) : data?.jobs?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs found. Try different search terms.</div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{data?.total || 0} jobs found</p>
          <div className="space-y-4">
            {data?.jobs?.map((job: Job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.location && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{job.location}</span>
                      )}
                      {job.job_type && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{job.job_type}</span>
                      )}
                      {job.remote_type && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">{job.remote_type}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {(job.salary_min || job.salary_max) && (
                      <p className="text-sm font-medium text-green-600">
                        {job.salary_min && job.salary_max
                          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                          : job.salary}
                      </p>
                    )}
                    {job.posted_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(job.posted_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
