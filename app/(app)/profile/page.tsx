"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, CheckCircle, Upload, FileText, Sparkles, Link2,
  Briefcase, GraduationCap, MapPin, X, AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetch("/api/users/me").then((r) => r.json()),
  });

  const [form, setForm] = useState({
    full_name: "", bio: "", location: "", company: "", position: "",
    skills: [] as string[],
  });
  const [cvParsing, setCvParsing] = useState(false);
  const [cvResult, setCvResult] = useState<string | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        company: user.company || "",
        position: user.position || "",
        skills: Array.isArray(user.skills) ? user.skills.map((s: { name?: string } | string) => typeof s === "string" ? s : s.name || "") : [],
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills: data.skills.map((s) => ({ name: s })),
        }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
  });

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvParsing(true);
    setCvError(null);
    setCvResult(null);

    try {
      let cvText = "";

      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        cvText = await file.text();
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        // For PDF, we use a simple text extraction approach
        // Read as ArrayBuffer and extract text (basic approach)
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        // Try to extract readable text from PDF binary
        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        const rawText = textDecoder.decode(uint8Array);
        // Extract text between BT and ET markers (PDF text objects)
        const textMatches = rawText.match(/\(([^)]+)\)/g);
        if (textMatches) {
          cvText = textMatches
            .map((m) => m.slice(1, -1))
            .filter((t) => t.length > 2 && /[a-zA-Z]/.test(t))
            .join(" ");
        }
        // If extraction fails, try raw text approach
        if (cvText.length < 50) {
          cvText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        }
      } else {
        // DOCX or other - read as text
        cvText = await file.text();
      }

      if (cvText.length < 20) {
        setCvError("Could not extract text from file. Please try a .txt or .pdf file, or paste your CV text manually.");
        setCvParsing(false);
        return;
      }

      // Send to AI for parsing
      const res = await fetch("/api/ai/profile-autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cvText.slice(0, 8000) }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse CV");
      }

      const { profile } = await res.json();

      // Auto-fill form with parsed data
      setForm((prev) => ({
        full_name: profile.full_name || prev.full_name,
        bio: profile.bio || prev.bio,
        location: profile.location || prev.location,
        company: profile.company || prev.company,
        position: profile.position || prev.position,
        skills: profile.skills?.length
          ? [...new Set([...prev.skills, ...profile.skills.map((s: { name?: string } | string) => typeof s === "string" ? s : s.name || "")])]
          : prev.skills,
      }));

      setCvResult(`Profile auto-filled from "${file.name}". Review the fields and save.`);
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Failed to parse CV");
    } finally {
      setCvParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLinkedinImport() {
    setLinkedinImporting(true);
    setCvError(null);

    try {
      // Check if user has LinkedIn access token
      const res = await fetch("/api/users/me");
      const userData = await res.json();

      if (!userData.linkedin_access_token) {
        setCvError("Please sign in with LinkedIn first to import your profile. Use the LinkedIn button on the login page.");
        setLinkedinImporting(false);
        return;
      }

      // Fetch LinkedIn profile using access token
      const profileRes = await fetch("/api/users/linkedin-import", {
        method: "POST",
      });

      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.error || "Failed to import LinkedIn profile");
      }

      const { profile } = await profileRes.json();

      setForm((prev) => ({
        full_name: profile.full_name || prev.full_name,
        bio: profile.bio || prev.bio,
        location: profile.location || prev.location,
        company: profile.company || prev.company,
        position: profile.position || prev.position,
        skills: profile.skills?.length
          ? [...new Set([...prev.skills, ...profile.skills])]
          : prev.skills,
      }));

      setCvResult("Profile imported from LinkedIn. Review the fields and save.");
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Failed to import from LinkedIn");
    } finally {
      setLinkedinImporting(false);
    }
  }

  function addSkill() {
    const skill = newSkill.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm({ ...form, skills: [...form.skills, skill] });
      setNewSkill("");
    }
  }

  function removeSkill(skill: string) {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader title="Profile" description="Manage your personal information" />

      {/* Import Section */}
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Quick Import
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-fill your profile by uploading a CV or importing from LinkedIn.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* CV Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleCvUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={cvParsing}
            className="flex-1 h-11"
          >
            {cvParsing ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Upload className="size-4 mr-2" />
            )}
            {cvParsing ? "Parsing CV..." : "Upload CV"}
            <span className="text-xs text-muted-foreground ml-1">(PDF, TXT)</span>
          </Button>

          {/* LinkedIn Import */}
          <Button
            variant="outline"
            onClick={handleLinkedinImport}
            disabled={linkedinImporting}
            className="flex-1 h-11"
          >
            {linkedinImporting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Link2 className="size-4 mr-2 text-[#0077B5]" />
            )}
            {linkedinImporting ? "Importing..." : "Import from LinkedIn"}
          </Button>
        </div>

        {/* Status messages */}
        {cvResult && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-emerald-500/10 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="size-4 shrink-0 mt-0.5" />
            {cvResult}
          </div>
        )}
        {cvError && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {cvError}
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="glass-card p-6 md:p-8">
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="A brief professional summary..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-1">
                <Briefcase className="size-3" /> Position
              </Label>
              <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-1">
                <GraduationCap className="size-3" /> Company
              </Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="size-3" /> Location
            </Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Berlin, Germany" />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {form.skills.length === 0 && (
                <span className="text-xs text-muted-foreground">No skills added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill (e.g., React, Python)"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gradient-primary text-stone-900 font-bold border-0 shadow-lg hover:shadow-xl transition-all"
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>

            {mutation.isSuccess && (
              <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="size-4" />
                Profile updated!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
