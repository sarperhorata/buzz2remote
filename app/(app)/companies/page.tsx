"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Search, MapPin, Users, Globe } from "lucide-react";

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
      <PageHeader title="Companies" description="Explore companies hiring remotely" />

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.companies?.map((company: { id: string; name: string; industry: string | null; location: string | null; size: string | null; remote_policy: string | null }) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="glass-card p-6 hover-lift group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="gradient-primary rounded-xl size-10 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {company.name[0]}
                </div>
                <div>
                  <h2 className="font-semibold group-hover:text-primary transition-colors">{company.name}</h2>
                  {company.industry && <p className="text-xs text-muted-foreground">{company.industry}</p>}
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {company.location && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <MapPin className="size-3" />{company.location}
                  </Badge>
                )}
                {company.size && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Users className="size-3" />{company.size}
                  </Badge>
                )}
                {company.remote_policy && (
                  <Badge className="text-xs gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                    <Globe className="size-3" />{company.remote_policy}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
