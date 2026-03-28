"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [apps, notifications] = await Promise.all([
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/notifications").then((r) => r.json()),
      ]);
      return { applications: apps.applications?.length || 0, unreadNotifications: notifications.unreadCount || 0 };
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Welcome back, {session?.user?.name || "User"}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Here&apos;s an overview of your activity.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats?.applications || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unread Notifications</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats?.unreadNotifications || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Subscription</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 capitalize">
            {String((session?.user as Record<string, unknown>)?.subscriptionPlan || "Free")}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/jobs", label: "Browse Jobs", color: "bg-blue-600" },
          { href: "/applications", label: "My Applications", color: "bg-green-600" },
          { href: "/favorites", label: "Saved Jobs", color: "bg-purple-600" },
          { href: "/profile", label: "Edit Profile", color: "bg-orange-600" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} text-white rounded-xl p-4 text-center font-medium hover:opacity-90 transition`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
