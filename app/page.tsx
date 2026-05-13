"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, FileText, Search, ArrowRight, Briefcase, Building2, Zap, MapPin, Clock } from "lucide-react";

// Types for data fetched on the server side via API
interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  remote_type: string | null;
  job_type: string | null;
  posted_date: Date | null;
}

interface HomeData {
  activeJobs: number;
  totalCompanies: number;
  recentJobs: Job[];
}

function timeAgo(date: Date | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const cur = currency || "USD";
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : n.toString();
  if (min && max) return `$${fmt(min)} - $${fmt(max)} ${cur}`;
  if (min) return `From $${fmt(min)} ${cur}`;
  return `Up to $${fmt(max!)} ${cur}`;
}

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  // Start with `null` so the stat row shows skeletons until the API responds.
  // Hard-coding defaults (2609 / 237) misled users when /api/home-data was
  // unreachable — the page would render stale stats forever.
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    fetch("/api/home-data")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: HomeData) => setData(d))
      .catch(() => {
        // Fallback only if the API truly fails — surface the latest known
        // counts via /api/jobs/stats so we never show zeros.
        fetch("/api/jobs/stats")
          .then((r) => r.json())
          .then((s: { total?: number }) => {
            setData({
              activeJobs: s.total ?? 0,
              totalCompanies: 0,
              recentJobs: [],
            });
          })
          .catch(() => setData({ activeJobs: 0, totalCompanies: 0, recentJobs: [] }));
      });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/jobs");
    }
  }

  const activeJobs = data?.activeJobs;
  const totalCompanies = data?.totalCompanies;
  const recentJobs = data?.recentJobs ?? [];
  const statsLoading = data === null;

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-white pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span>🐝</span>
            <span>
              {statsLoading
                ? "Loading…"
                : `${(activeJobs ?? 0).toLocaleString()} remote jobs available`}
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            The smarter way to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
              find remote work
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse curated remote jobs from top companies. AI-powered matching, one-click apply.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="flex items-center bg-white border border-border rounded-xl shadow-sm p-1.5 gap-2">
              <div className="flex items-center flex-1 px-3 gap-2">
                <Search className="size-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, companies, skills..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg px-5 h-9 border-0 transition-colors"
              >
                Browse Jobs
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base h-12 px-8 border-0 transition-colors">
              <Link href="/jobs">
                <Briefcase className="size-5 mr-2" />
                Browse All Jobs
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-semibold text-base h-12 px-8">
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-b border-border py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              {
                icon: Briefcase,
                label: "Remote Jobs",
                value: statsLoading ? null : (activeJobs ?? 0).toLocaleString(),
              },
              {
                icon: Building2,
                label: "Companies",
                value: statsLoading ? null : `${totalCompanies ?? 0}+`,
              },
              { icon: Sparkles, label: "AI-Powered Matching", value: "Smart" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 py-2 px-4">
                <stat.icon className="size-5 text-amber-500 mb-1" />
                {stat.value === null ? (
                  <span className="h-7 w-20 bg-muted/60 rounded animate-pulse" aria-label="Loading" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground font-medium text-center">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 animate-slide-up">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Latest{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                  Remote Jobs
                </span>
              </h2>
              <p className="text-muted-foreground mt-1">Fresh opportunities added today</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                View All
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-border rounded-xl shadow-sm p-5 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map((job) => {
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
                const posted = timeAgo(job.posted_date);
                const initials = (job.company ?? "?").charAt(0).toUpperCase();
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow-md hover:border-amber-200 transition-all group block"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-amber-600 transition-colors truncate">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {job.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {job.location}
                        </span>
                      )}
                      {posted && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {posted}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {job.remote_type && (
                        <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                          {job.remote_type}
                        </Badge>
                      )}
                      {job.job_type && (
                        <Badge variant="secondary" className="text-xs">
                          {job.job_type}
                        </Badge>
                      )}
                    </div>

                    {salary && (
                      <p className="text-xs font-semibold text-emerald-600 mt-3 flex items-center gap-1">
                        <DollarSign className="size-3" />
                        {salary}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Why{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                Buzz2Remote
              </span>
              ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to land your dream remote job, powered by AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "AI-Powered Matching",
                desc: "Our AI analyzes your skills and experience to find the best matching remote jobs for you.",
                icon: Sparkles,
              },
              {
                title: "Salary Estimation",
                desc: "Get accurate salary ranges for any remote position based on market data and your experience.",
                icon: DollarSign,
              },
              {
                title: "Smart CV Analysis",
                desc: "Upload your CV and get instant AI-powered feedback to improve your chances of landing a job.",
                icon: FileText,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-amber-50 rounded-lg p-2.5 w-10 h-10 flex items-center justify-center mb-4">
                  <feature.icon className="size-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              How It{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                Works
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps to your next remote career.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Profile",
                desc: "Sign up and tell us about your skills, experience, and what you're looking for.",
                icon: Building2,
              },
              {
                step: "02",
                title: "Get Matched",
                desc: "Our AI scans thousands of jobs to find the ones that fit you perfectly.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Apply & Land",
                desc: "Apply with one click and track your applications all in one place.",
                icon: Briefcase,
              },
            ].map((item, idx) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <item.icon className="size-7 text-amber-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 rounded-2xl p-12 text-center border border-amber-100">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Start finding your remote job today
            </h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-xl mx-auto">
              Join thousands of professionals who found their perfect remote position through Buzz2Remote.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base h-12 px-8 border-0 transition-colors"
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
