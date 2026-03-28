"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function ApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetch("/api/applications").then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Applications</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data?.applications?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No applications yet.</p>
          <Link href="/jobs" className="text-blue-600 hover:underline">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.applications?.map((app: { id: string; status: string; applied_at: string; jobs: { id: string; title: string; company: string; location: string | null } }) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/jobs/${app.jobs.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600">
                    {app.jobs.title}
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400">{app.jobs.company}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  app.status === "accepted" ? "bg-green-100 text-green-700" :
                  app.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {app.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
