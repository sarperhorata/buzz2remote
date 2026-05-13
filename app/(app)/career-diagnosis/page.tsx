"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

interface DiagnosisResult {
  overall_score: number;
  profile_strength: number;
  readiness_level: "beginner" | "developing" | "competitive" | "strong" | "exceptional";
  strengths: string[];
  gaps: string[];
  quick_wins: string[];
  long_term_actions: string[];
  remote_readiness: number;
  top_job_categories: string[];
  salary_range: SalaryRange;
}

function scoreColor(score: number): string {
  if (score >= 71) return "text-green-600";
  if (score >= 41) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 71) return "border-green-500 bg-green-50";
  if (score >= 41) return "border-amber-400 bg-amber-50";
  return "border-red-400 bg-red-50";
}

function readinessBadgeClass(level: DiagnosisResult["readiness_level"]): string {
  if (level === "strong" || level === "exceptional") {
    return "bg-green-100 text-green-800 border border-green-200";
  }
  if (level === "competitive") {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  }
  return "bg-blue-100 text-blue-800 border border-blue-200";
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${scoreBg(score)}`}>
      <div className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</div>
      <div className="text-xs text-muted-foreground mt-1">/100</div>
      <div className="text-sm font-medium text-foreground mt-2 text-center">{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-6">
      <div className="text-center">
        <div className="text-lg font-semibold text-foreground animate-pulse">Analyzing your profile...</div>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        {[
          { label: "Reading your profile", done: true },
          { label: "Analyzing your skills", done: true },
          { label: "Generating insights...", done: false },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            {step.done ? (
              <span className="text-green-500 text-lg">✅</span>
            ) : (
              <span className="text-amber-500 text-lg animate-pulse">⏳</span>
            )}
            <span className={`text-sm ${step.done ? "text-muted-foreground" : "text-foreground font-medium animate-pulse"}`}>
              {step.label}
            </span>
          </div>
        ))}
        <div className="mt-4 h-2 rounded-full bg-muted/50 overflow-hidden">
          <div className="h-full bg-amber-400 animate-pulse w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function CareerDiagnosisPage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchDiagnosis() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/career-diagnosis");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch diagnosis");
      }
      const data = await res.json();
      setDiagnosis(data.diagnosis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-fetch if they already triggered it before (optional: remove if you want manual only)
  useEffect(() => {
    // intentionally manual — user clicks button
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Career Diagnosis</h1>
          <p className="text-muted-foreground mt-1">AI-powered analysis of your career readiness</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && <LoadingState />}

        {/* Initial state */}
        {!isLoading && !diagnosis && (
          <div className="bg-card rounded-xl border border-border p-10 text-center max-w-lg mx-auto">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-foreground mb-2">Get Your Career Diagnosis</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Our AI analyzes your profile, experience, and skills to give you a personalized roadmap.
            </p>
            <button
              onClick={fetchDiagnosis}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Analyze My Profile
            </button>
            <p className="text-xs text-muted-foreground/70 mt-4">Takes ~10 seconds</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && diagnosis && (
          <div className="space-y-6">
            {/* Readiness level badge */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${readinessBadgeClass(
                  diagnosis.readiness_level
                )}`}
              >
                {diagnosis.readiness_level}
              </span>
              <span className="text-sm text-muted-foreground">Readiness Level</span>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-3 gap-4">
              <ScoreCard label="Overall Score" score={diagnosis.overall_score} />
              <ScoreCard label="Profile Strength" score={diagnosis.profile_strength} />
              <ScoreCard label="Remote Readiness" score={diagnosis.remote_readiness} />
            </div>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {/* Strengths */}
                <div className="bg-card rounded-xl border border-border border-l-4 border-l-green-500 p-5">
                  <h3 className="font-semibold text-foreground mb-3">💪 Strengths</h3>
                  <ul className="space-y-2">
                    {diagnosis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-green-500 mt-0.5 shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick wins */}
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                  <h3 className="font-semibold text-foreground mb-3">⚡ Quick Wins This Week</h3>
                  <ul className="space-y-2">
                    {diagnosis.quick_wins.map((w, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Gaps */}
                <div className="bg-card rounded-xl border border-border border-l-4 border-l-red-400 p-5">
                  <h3 className="font-semibold text-foreground mb-3">🎯 Gaps to Address</h3>
                  <ul className="space-y-2">
                    {diagnosis.gaps.map((g, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-red-400 mt-0.5 shrink-0">•</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Long-term actions */}
                <div className="bg-card rounded-xl border border-border border-l-4 border-l-blue-400 p-5">
                  <h3 className="font-semibold text-foreground mb-3">🗺️ Long-term Strategy</h3>
                  <ul className="space-y-2">
                    {diagnosis.long_term_actions.map((a, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top job categories */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3">Top Job Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {diagnosis.top_job_categories.map((cat, i) => (
                    <span
                      key={i}
                      className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Salary range */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3">Estimated Salary Range</h3>
                <div className="text-2xl font-bold text-foreground">
                  ${diagnosis.salary_range.min.toLocaleString()} – ${diagnosis.salary_range.max.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-2">{diagnosis.salary_range.currency}</span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1">Based on your skills and experience</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/profile"
                className="bg-card border border-border text-foreground font-medium px-5 py-2.5 rounded-lg hover:bg-muted/30 transition-colors text-sm"
              >
                Update Your Profile
              </Link>
              <button
                onClick={fetchDiagnosis}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                Refresh Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
