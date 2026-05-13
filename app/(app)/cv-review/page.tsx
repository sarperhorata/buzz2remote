"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

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
      <div className="text-xs text-muted-foreground mt-1">/100</div>
      <div className="text-sm font-medium text-foreground mt-2 text-center">{label}</div>
    </div>
  );
}

export default function CvReviewPage() {
  // Two input modes: file upload (preferred) or paste-as-text (fallback for
  // users who don't want to upload). Both end up calling /api/cv/upload, but
  // the paste flow constructs a fake text/plain File and uploads that — saves
  // having a second code path in the API.
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [cvText, setCvText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [autofillPreview, setAutofillPreview] = useState<{ position?: string | null; full_name?: string | null; skillCount?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setIsLoading(true);
    setError(null);
    setFilename(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // We don't save back to a profile from /cv-review — this is a review
      // tool, not an importer. /profile owns that flow.
      fd.append("analyze", "1");
      // Run autofill too so we can show "We read: <name>, <position>, <N>
      // skills" as confirmation that parsing actually worked end-to-end.
      fd.append("autofill", "1");
      if (jobTitle.trim()) fd.append("jobTitle", jobTitle.trim());

      const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to analyze CV");
      }
      const data = await res.json();
      if (data.analysis?.__error) throw new Error(data.analysis.__error);
      setAnalysis(data.analysis);
      if (data.profile && !data.profile.__error) {
        setAutofillPreview({
          full_name: data.profile.full_name,
          position: data.profile.position,
          skillCount: Array.isArray(data.profile.skills) ? data.profile.skills.length : 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    void uploadFile(file);
  }

  async function handlePasteAnalyze() {
    if (!cvText.trim()) {
      setError("Please paste your CV text.");
      return;
    }
    // Build a text/plain File so the same /api/cv/upload endpoint handles
    // both flows. Saves us from having a separate "analyze text" code path.
    const blob = new Blob([cvText], { type: "text/plain" });
    const file = new File([blob], "pasted-cv.txt", { type: "text/plain" });
    await uploadFile(file);
  }

  function handleReset() {
    setAnalysis(null);
    setCvText("");
    setJobTitle("");
    setFilename(null);
    setAutofillPreview(null);
    setError(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">📄 CV Review</h1>
          <p className="text-muted-foreground mt-1">Upload your CV (PDF, DOCX, or TXT) for instant AI feedback</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {!analysis && isLoading && (
          <div className="bg-card rounded-xl border border-border p-10 text-center">
            <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="size-7 text-amber-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Analyzing your CV…</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {filename
                ? <>Reading <strong className="text-foreground">{filename}</strong> and generating feedback. Usually 10–20 seconds.</>
                : "Generating feedback. Usually 10–20 seconds."}
            </p>
            <div className="max-w-sm mx-auto space-y-2 text-left">
              <Step done label="Extracting text" />
              <Step active label="Parsing experience & skills" />
              <Step active label="Generating feedback & scores" />
            </div>
          </div>
        )}

        {/* Input form */}
        {!analysis && !isLoading && (
          <div className="bg-card rounded-xl border border-border p-8 space-y-5">
            {/* Mode toggle */}
            <div className="inline-flex bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => setMode("upload")}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors font-medium ${
                  mode === "upload" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload file
              </button>
              <button
                onClick={() => setMode("paste")}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors font-medium ${
                  mode === "paste" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paste text
              </button>
            </div>

            {/* Optional job title — shared between modes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target Job Title <span className="text-muted-foreground/70 font-normal">(optional, improves match score)</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            {/* Mode body */}
            {mode === "upload" ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Your CV</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-400 hover:bg-muted/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  <Upload className="size-10 text-muted-foreground/70 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Drop your CV here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT. Max 8 MB.</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Your CV</label>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV text here..."
                  rows={18}
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-y"
                />
                <button
                  onClick={handlePasteAnalyze}
                  disabled={isLoading || !cvText.trim()}
                  className="mt-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Analyze CV
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Filename / extraction confirmation */}
            {(filename || autofillPreview) && (
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-sm">
                <FileText className="size-5 text-muted-foreground/70 shrink-0" />
                <div className="min-w-0">
                  {filename && <div className="font-medium text-foreground truncate">{filename}</div>}
                  {autofillPreview && (
                    <div className="text-muted-foreground truncate">
                      Read: {autofillPreview.full_name ? `${autofillPreview.full_name}, ` : ""}
                      {autofillPreview.position || "no title detected"} — {autofillPreview.skillCount ?? 0} skills extracted
                    </div>
                  )}
                </div>
              </div>
            )}

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
              <div className="bg-card rounded-xl border border-border border-l-4 border-l-green-500 p-5">
                <h3 className="font-semibold text-foreground mb-3">✅ Strengths</h3>
                <ul className="space-y-2">
                  {analysis.strengths?.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-xl border border-border border-l-4 border-l-red-400 p-5">
                <h3 className="font-semibold text-foreground mb-3">❌ Areas to Improve</h3>
                <ul className="space-y-2">
                  {analysis.weaknesses?.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-red-400 shrink-0 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <h3 className="font-semibold text-foreground mb-3">💡 Specific Suggestions</h3>
                <ul className="space-y-2">
                  {analysis.suggestions?.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <h3 className="font-semibold text-foreground mb-3">🔑 Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords_missing?.map((kw, i) => (
                    <span
                      key={i}
                      className="bg-card text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="bg-card border border-border text-foreground font-medium px-5 py-2.5 rounded-lg hover:bg-muted/30 transition-colors text-sm"
              >
                Analyze Another
              </button>
              <a
                href="/profile"
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                Import to Profile →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <svg className="size-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : active ? (
        <Loader2 className="size-4 animate-spin text-amber-500 shrink-0" />
      ) : (
        <div className="size-4 rounded-full border-2 border-border shrink-0" />
      )}
      <span className={done ? "text-muted-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground/70"}>
        {label}
      </span>
    </div>
  );
}
