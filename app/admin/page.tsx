"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function AdminPage() {
  const { data: session } = useSession();

  if (session && !session.user?.isAdmin) {
    redirect("/");
  }

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/jobs/statistics").then((r) => r.json()),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Jobs", value: stats?.totalJobs || 0, color: "blue" },
          { label: "Active Jobs", value: stats?.activeJobs || 0, color: "green" },
          { label: "Companies", value: stats?.totalCompanies || 0, color: "purple" },
          { label: "Applications", value: stats?.totalApplications || 0, color: "orange" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Job Type Distribution */}
      {stats?.jobTypeDistribution && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Job Type Distribution</h2>
          <div className="space-y-2">
            {stats.jobTypeDistribution.map((jt: { type: string; count: number }) => (
              <div key={jt.type} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-32">{jt.type}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: `${Math.min(100, (jt.count / (stats.activeJobs || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">{jt.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <a href="/api/health" target="_blank" rel="noreferrer" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center hover:shadow-md transition">
          <p className="font-medium text-green-700 dark:text-green-300">Health Check</p>
        </a>
        <a href="/jobs" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center hover:shadow-md transition">
          <p className="font-medium text-blue-700 dark:text-blue-300">Manage Jobs</p>
        </a>
        <a href="/companies" className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center hover:shadow-md transition">
          <p className="font-medium text-purple-700 dark:text-purple-300">Manage Companies</p>
        </a>
      </div>
    </div>
  );
}
