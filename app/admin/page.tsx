"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Briefcase, Activity, Building2, FileText, Heart, Shield, BarChart3 } from "lucide-react";

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
      <PageHeader title="Admin Dashboard" description="System overview and analytics" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Jobs" value={stats?.totalJobs?.toLocaleString() || "0"} icon={Briefcase} />
        <StatCard label="Active Jobs" value={stats?.activeJobs?.toLocaleString() || "0"} icon={Activity} />
        <StatCard label="Companies" value={stats?.totalCompanies?.toLocaleString() || "0"} icon={Building2} />
        <StatCard label="Applications" value={stats?.totalApplications?.toLocaleString() || "0"} icon={FileText} />
      </div>

      {/* Job Type Distribution */}
      {stats?.jobTypeDistribution && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg">
              <BarChart3 className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">Job Type Distribution</h2>
          </div>
          <div className="space-y-3">
            {stats.jobTypeDistribution.map((jt: { type: string; count: number }) => (
              <div key={jt.type} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32 shrink-0">{jt.type}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="gradient-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (jt.count / (stats.activeJobs || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{jt.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: "/api/health", label: "Health Check", icon: Heart, gradient: "from-emerald-500 to-teal-500", external: true },
          { href: "/jobs", label: "Manage Jobs", icon: Briefcase, gradient: "from-violet-500 to-indigo-500", external: false },
          { href: "/companies", label: "Manage Companies", icon: Building2, gradient: "from-rose-500 to-pink-500", external: false },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            className="glass-card p-5 hover-lift group text-center"
          >
            <div className={`w-10 h-10 mx-auto bg-gradient-to-br ${link.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <link.icon className="size-5 text-white" />
            </div>
            <p className="font-medium text-sm">{link.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
