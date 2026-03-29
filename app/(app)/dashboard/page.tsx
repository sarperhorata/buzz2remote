"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Bell, Crown, Search, Heart, User, Briefcase, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [apps, notifications] = await Promise.all([
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/notifications").then((r) => r.json()),
      ]);
      return { applications: apps.applications?.length || 0, unreadNotifications: notifications.unreadCount || 0 };
    },
  });

  const quickActions = [
    { href: "/jobs", label: "Browse Jobs", icon: Search, gradient: "from-amber-500 to-yellow-400" },
    { href: "/applications", label: "My Applications", icon: FileText, gradient: "from-amber-600 to-orange-500" },
    { href: "/favorites", label: "Saved Jobs", icon: Heart, gradient: "from-yellow-500 to-amber-400" },
    { href: "/profile", label: "Edit Profile", icon: User, gradient: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{session?.user?.name || "User"}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your activity.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard label="Applications" value={stats?.applications || 0} icon={FileText} />
            <StatCard label="Unread Notifications" value={stats?.unreadNotifications || 0} icon={Bell} />
            <StatCard
              label="Subscription"
              value={String((session?.user as Record<string, unknown>)?.subscriptionPlan || "Free")}
              icon={Crown}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="group">
            <div className="glass-card p-5 hover-lift text-center">
              <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="size-5 text-white" />
              </div>
              <p className="font-medium text-sm">{action.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 glass-card p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Discover new opportunities</h3>
          <p className="text-sm text-muted-foreground">Browse thousands of remote jobs from top companies.</p>
        </div>
        <Button asChild className="gradient-primary text-white border-0 shadow-lg">
          <Link href="/jobs">
            Browse Jobs
            <ArrowRight className="size-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
