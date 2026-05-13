"use client";

import { useState, useEffect, useCallback } from "react";

interface LinkedInOptimization {
  headline_suggestions: string[];
  about_section_tips: string[];
  skills_to_add: string[];
  profile_completeness_tips: string[];
  content_strategy: string[];
  quick_fixes: string[];
}

function linkedInSkillSearchUrl(skill: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(skill)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs text-muted-foreground hover:text-amber-600 border border-border hover:border-amber-400 px-2.5 py-1 rounded transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function SkeletonBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export default function LinkedInOptimizerPage() {
  const [optimization, setOptimization] = useState<LinkedInOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptimization = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/linkedin-optimizer");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch LinkedIn optimization");
      }
      const data = await res.json();
      setOptimization(data.optimization);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptimization();
  }, [fetchOptimization]);

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">LinkedIn Optimizer</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered tips to make your LinkedIn profile stand out
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={fetchOptimization}
              className="shrink-0 bg-card border border-border text-foreground font-medium px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors text-sm"
            >
              Refresh
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
            <button
              onClick={fetchOptimization}
              className="ml-3 underline font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-card rounded-xl border border-border p-6">
                <div className="h-5 bg-muted rounded animate-pulse w-1/3 mb-4" />
                <SkeletonBlock rows={3} />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && optimization && (
          <div className="space-y-6">
            {/* 1. Headline suggestions */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-foreground text-lg mb-4">✍️ Headline Suggestions</h2>
              <div className="space-y-3">
                {optimization.headline_suggestions.map((headline, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-muted/30 rounded-lg border border-border px-4 py-3"
                  >
                    <span className="text-amber-500 font-bold text-sm shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-sm text-foreground flex-1">{headline}</span>
                    <CopyButton text={headline} />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Quick fixes */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <h2 className="font-bold text-foreground text-lg mb-4">⚡ Quick Fixes (under 5 min each)</h2>
              <ul className="space-y-3">
                {optimization.quick_fixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 text-lg shrink-0">☐</span>
                    <span className="text-sm text-foreground">{fix}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Skills to add */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-foreground text-lg mb-4">🛠️ Skills to Add on LinkedIn</h2>
              <div className="flex flex-wrap gap-2">
                {optimization.skills_to_add.map((skill, i) => (
                  <a
                    key={i}
                    href={linkedInSkillSearchUrl(skill)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-50 text-amber-800 border border-amber-200 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    + {skill}
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-3">Click to search on LinkedIn and add to your profile</p>
            </div>

            {/* 4. About section tips */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-foreground text-lg mb-4">📝 About Section Tips</h2>
              <ol className="space-y-3">
                {optimization.about_section_tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ol>
            </div>

            {/* 5. Content strategy */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h2 className="font-bold text-foreground text-lg mb-4">📣 Content Strategy Ideas</h2>
              <div className="space-y-3">
                {optimization.content_strategy.map((idea, i) => (
                  <div key={i} className="bg-card rounded-lg border border-blue-100 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold text-sm shrink-0">{i + 1}.</span>
                      <span className="text-sm text-foreground">{idea}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Profile completeness tips */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-foreground text-lg mb-4">✅ Profile Completeness Tips</h2>
              <ul className="space-y-2">
                {optimization.profile_completeness_tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="text-muted-foreground/70 shrink-0 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
