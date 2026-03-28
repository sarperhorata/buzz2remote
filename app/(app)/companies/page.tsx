"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

export default function CompaniesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["companies", search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      return fetch(`/api/companies?${params}`).then((r) => r.json());
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Companies</h1>

      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-3 border rounded-lg mb-8 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      />

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.companies?.map((company: { id: string; name: string; industry: string | null; location: string | null; size: string | null; remote_policy: string | null }) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{company.name}</h2>
              {company.industry && <p className="text-sm text-gray-600 dark:text-gray-400">{company.industry}</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                {company.location && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{company.location}</span>}
                {company.size && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{company.size}</span>}
                {company.remote_policy && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">{company.remote_policy}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
