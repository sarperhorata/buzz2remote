"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Sparkles, AlertTriangle, Lock, Check, X, Briefcase, MapPin, Home, DollarSign } from "lucide-react";

interface TopMatch {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  remote_type: string | null;
  job_type: string | null;
  experience_level: string | null;
  skills: string[];
  score: number;
  strong_match_reason: string;
  concerns: string[];
}

interface TopMatchesResponse {
  matches: TopMatch[];
  isPro: boolean;
  generatedAt?: string;
  needsProfile?: boolean;
  cached?: boolean;
}

function scoreRing(score: number): string {
  if (score >= 80) return "ring-emerald-500 text-emerald-600";
  if (score >= 60) return "ring-amber-500 text-amber-600";
  if (score >= 40) return "ring-orange-500 text-orange-600";
  return "ring-gray-400 text-gray-600";
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className={`shrink-0 w-16 h-16 rounded-full bg-white ring-4 ${scoreRing(
        score
      )} flex items-center justify-center font-bold text-lg shadow-sm`}
    >
      {score}
    </div>
  );
}

function MatchCard({ match, blurred = false }: { match: TopMatch; blurred?: boolean }) {
  return (
    <div
      className={`bg-white border border-blue-100 rounded-2xl p-6 shadow-sm ${
        blurred ? "filter blur-sm pointer-events-none select-none" : ""
      }`}
      aria-hidden={blurred}
    >
      <div className="flex items-start gap-4">
        <ScoreBadge score={match.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{match.title}</h3>
              <div className="text-sm text-gray-600 mt-0.5">{match.company}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            {match.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {match.location}
              </span>
            )}
            {match.remote_type && (
              <span className="inline-flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                {match.remote_type}
              </span>
            )}
            {match.job_type && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {match.job_type}
              </span>
            )}
            {match.salary && (
              <span className="inline-flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {match.salary}
              </span>
            )}
          </div>

          {match.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {match.skills.slice(0, 8).map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {match.strong_match_reason && (
        <div className="mt-5 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wide mb-1">
            <Sparkles className="w-4 h-4" />
            Why you&apos;re a strong match
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{match.strong_match_reason}</p>
        </div>
      )}

      {match.concerns.length > 0 && (
        <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wide mb-1">
            <AlertTriangle className="w-4 h-4" />
            Concerns
          </div>
          <ul className="text-sm text-gray-700 leading-relaxed space-y-1">
            {match.concerns.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end mt-5">
        <a
          href={`/api/jobs/${match.id}/apply`}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
        >
          Apply
        </a>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const rows: Array<{ label: string; free: boolean | string; pro: boolean | string }> = [
    { label: "Standard job matches", free: true, pro: true },
    { label: "Basic filters", free: true, pro: true },
    { label: "AI-powered fit analysis", free: false, pro: true },
    { label: "Concern flagging per role", free: false, pro: true },
    { label: "Higher quality, more accurate matches", free: "—", pro: true },
  ];

  const renderCell = (v: boolean | string) => {
    if (v === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
    if (v === false) return <X className="w-5 h-5 text-gray-300 mx-auto" />;
    return <span className="text-gray-400">{v}</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Free</div>
        <div className="text-xl font-bold text-gray-900 mb-4">Standard</div>
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{r.label}</span>
              <span>{renderCell(r.free)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative bg-emerald-50/30 border-2 border-emerald-500 rounded-2xl p-6">
        <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          RECOMMENDED
        </div>
        <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-1">Top Match</div>
        <div className="text-xl font-bold text-gray-900 mb-4">Pro</div>
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-800">{r.label}</span>
              <span>{renderCell(r.pro)}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/pricing"
          className="block w-full text-center mt-6 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Unlock top matches
        </Link>
      </div>
    </div>
  );
}

function UnlockOverlay() {
  return (
    <div className="absolute inset-x-0 top-8 flex justify-center px-4 pointer-events-none z-10">
      <div className="bg-white shadow-xl border border-gray-200 rounded-2xl p-8 max-w-lg w-full pointer-events-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Your personalized matches are ready</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Unlock to see AI-powered insights tailored to your profile — including why each role fits and where the gaps are.
        </p>
        <ul className="space-y-2 mb-5">
          {[
            "See exactly why you're a strong fit for each role",
            "Get flagged concerns before you apply",
            "Ranked by how competitive you are",
          ].map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mb-5">
          <span className="font-semibold">How Top Match works:</span> our AI compares your profile, skills, and experience against each role to score competitiveness and surface real concerns before you apply.
        </div>
        <Link
          href="/pricing"
          className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Unlock top matches
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-100 rounded w-16" />
            <div className="h-5 bg-gray-100 rounded w-20" />
            <div className="h-5 bg-gray-100 rounded w-14" />
          </div>
        </div>
      </div>
      <div className="mt-5 h-20 bg-emerald-50 rounded" />
    </div>
  );
}

export default function TopMatchesPage() {
  const { data, isLoading, error } = useQuery<TopMatchesResponse>({
    queryKey: ["top-matches"],
    queryFn: async () => {
      const res = await fetch("/api/top-matches");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load top matches");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Your Top Match Results</h1>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
              BETA
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Unlock your personalized matches — ranked by how competitive you are for each role.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error instanceof Error ? error.message : "Something went wrong"}
          </div>
        )}

        {/* Needs profile */}
        {!isLoading && data?.needsProfile && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Complete your profile to see your top matches</h2>
            <p className="text-gray-500 text-sm mb-6">
              Add your title and skills so we can rank jobs against your background.
            </p>
            <Link
              href="/profile"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Go to profile
            </Link>
          </div>
        )}

        {/* Empty matches */}
        {!isLoading && data && !data.needsProfile && data.matches.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">No matches yet</h2>
            <p className="text-gray-500 text-sm">
              We couldn&apos;t find strong matches right now. Try refining your profile or check back later.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && data && !data.needsProfile && data.matches.length > 0 && (
          <>
            {/* Sample preview banner for free users */}
            {!data.isPro && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-yellow-800">
                  <span className="font-semibold">This is a sample preview.</span> Your actual matches will reflect your background and preferences.
                </div>
                <span className="text-xs font-bold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded-full shrink-0">
                  SAMPLE PREVIEW
                </span>
              </div>
            )}

            {data.isPro ? (
              <div className="space-y-4">
                {data.matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <>
                {/* First match — fully visible */}
                <MatchCard match={data.matches[0]} />

                {data.matches.length > 1 && (
                  <>
                    <div className="my-8 flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
                        <span>💡</span>
                        <span>
                          {data.matches.length - 1} personalized matches waiting — tailored to your profile, goals, and preferences
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Blurred cards with overlay */}
                    <div className="relative">
                      <div className="space-y-4">
                        {data.matches.slice(1, 4).map((m) => (
                          <MatchCard
                            key={m.id}
                            match={{
                              ...m,
                              strong_match_reason:
                                "Based on your background, this role aligns strongly with your experience. The hiring team is looking for candidates with your specific skill set, and your past work demonstrates the kind of impact they're hoping to see.",
                              concerns: ["Consider clarifying your remote work experience", "Salary expectations may need alignment"],
                            }}
                            blurred
                          />
                        ))}
                      </div>
                      <UnlockOverlay />
                    </div>

                    <ComparisonTable />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
