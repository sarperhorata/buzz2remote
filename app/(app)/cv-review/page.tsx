"use client";

import { useState } from "react";

interface CvAnalysis {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords_missing: string[];
  ats_compatibility: number;
  job_match_score?: number;
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

function ScoreCircle({ label, score }: { label: string; score: number }) {
  return (
    <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${scoreBg(score)}`}>
      <div className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</div>
      <div className="text-xs text-gray-500 mt-1">/100</div>
      <div className="text-sm font-medium text-gray-700 mt-2 text-center">{label}</div>
    </div>
  );
}

export default function CvReviewPage() {
  const [cvText, setCvText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!cvText.trim()) {
      setError("Please paste your CV text.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/cv-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jobTitle: jobTitle.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze CV");
      }
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setAnalysis(null);
    setCvText("");
    setJobTitle("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📄 CV Review</h1>
          <p className="text-gray-500 mt-1">Paste your CV for instant AI feedback</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 — Input */}
        {!analysis && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
            {/* Job title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Job Title <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            {/* CV textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your CV</label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV text here..."
                rows={20}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-y"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze CV"
              )}
            </button>
          </div>
        )}

        {/* Step 2 — Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Job match badge */}
            {analysis.job_match_score !== undefined && jobTitle && (
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">
                <span>🎯</span>
                <span>
                  Job Match for <strong>{jobTitle}</strong>: {analysis.job_match_score}%
                </span>
              </div>
            )}

            {/* Score row */}
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <ScoreCircle label="Overall Score" score={analysis.overall_score} />
              <ScoreCircle label="ATS Compatibility" score={analysis.ats_compatibility} />
            </div>

            {/* 4-card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-green-500 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">✅ Strengths</h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to improve */}
              <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-red-400 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">❌ Areas to Improve</h3>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-red-400 shrink-0 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Specific Suggestions</h3>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing keywords */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">🔑 Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords_missing.map((kw, i) => (
                    <span
                      key={i}
                      className="bg-white text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyze again */}
            <button
              onClick={handleReset}
              className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Analyze Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
