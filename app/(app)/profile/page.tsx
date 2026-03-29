"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  Loader2, CheckCircle, Upload, Sparkles, Link2, Plus,
  Briefcase, GraduationCap, MapPin, X, AlertCircle, Star, Trash2, Crown,
} from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  profile_name: string;
  is_default: boolean;
  title: string | null;
  bio: string | null;
  skills: { name: string }[] | null;
  work_experience: unknown;
  education: unknown;
  certificates: unknown;
  resume_url: string | null;
  resume_text: string | null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [form, setForm] = useState({ profile_name: "", title: "", bio: "", skills: [] as string[] });
  const [newSkill, setNewSkill] = useState("");
  const [cvParsing, setCvParsing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch all profiles
  const { data: profilesData, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => fetch("/api/profiles").then((r) => r.json()),
  });

  const profiles: Profile[] = profilesData?.profiles || [];
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

  // Set initial active profile
  useEffect(() => {
    if (profiles.length > 0 && !activeProfileId) {
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId]);

  // Sync form when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setForm({
        profile_name: activeProfile.profile_name || "",
        title: activeProfile.title || "",
        bio: activeProfile.bio || "",
        skills: activeProfile.skills?.map((s) => (typeof s === "string" ? s : s.name)) || [],
      });
    }
  }, [activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save profile mutation
  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch(`/api/profiles/${activeProfile!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, skills: data.skills.map((s) => ({ name: s })) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setMessage({ type: "success", text: "Profile saved!" });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Create profile mutation
  const createMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_name: name }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setActiveProfileId(data.profile.id);
      setMessage({ type: "success", text: "New profile created!" });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: Error) => {
      setMessage({ type: "error", text: err.message });
    },
  });

  // Delete profile mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/profiles/${id}`, { method: "DELETE" }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setActiveProfileId(null);
      setMessage({ type: "success", text: "Profile deleted." });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: Error) => {
      setMessage({ type: "error", text: err.message });
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setMessage({ type: "success", text: "Default profile updated." });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // CV Upload handler
  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;

    setCvParsing(true);
    setMessage(null);

    try {
      let cvText = "";
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        cvText = await file.text();
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        const rawText = textDecoder.decode(new Uint8Array(arrayBuffer));
        const textMatches = rawText.match(/\(([^)]+)\)/g);
        if (textMatches) {
          cvText = textMatches.map((m) => m.slice(1, -1)).filter((t) => t.length > 2 && /[a-zA-Z]/.test(t)).join(" ");
        }
        if (cvText.length < 50) {
          cvText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        }
      }

      if (cvText.length < 20) {
        setMessage({ type: "error", text: "Could not extract text. Try .txt or .pdf." });
        setCvParsing(false);
        return;
      }

      const res = await fetch("/api/ai/profile-autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cvText.slice(0, 8000) }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to parse CV");
      const { profile } = await res.json();

      setForm((prev) => ({
        profile_name: prev.profile_name,
        title: profile.position || prev.title,
        bio: profile.bio || prev.bio,
        skills: profile.skills?.length
          ? [...new Set([...prev.skills, ...profile.skills.map((s: { name?: string } | string) => typeof s === "string" ? s : s.name || "")])]
          : prev.skills,
      }));

      setMessage({ type: "success", text: `CV parsed from "${file.name}". Review and save.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "CV parse failed" });
    } finally {
      setCvParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addSkill() {
    const skill = newSkill.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm({ ...form, skills: [...form.skills, skill] });
      setNewSkill("");
    }
  }

  function handleCreateProfile() {
    const name = prompt("Enter profile name (e.g., 'Frontend Developer', 'Product Manager'):");
    if (name?.trim()) createMutation.mutate(name.trim());
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  // If no profiles exist, create one automatically
  if (profiles.length === 0 && !createMutation.isPending) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader title="Profile" description="Set up your professional profile" />
        <div className="glass-card p-8 text-center">
          <Sparkles className="size-10 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Create Your First Profile</h2>
          <p className="text-muted-foreground mb-6">
            Start by creating a profile for your target role. You can add more profiles for different positions later.
          </p>
          <Button onClick={handleCreateProfile} className="gradient-primary text-stone-900 font-bold border-0 shadow-lg">
            <Plus className="size-4 mr-2" /> Create Profile
          </Button>
        </div>
      </div>
    );
  }

  const userPlan = (session?.user as Record<string, unknown>)?.subscriptionPlan as string || "free";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader title="Profiles" description="Manage your professional profiles for different roles" />

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveProfileId(p.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
              p.id === activeProfile?.id
                ? "border-primary/30 bg-primary/5 text-primary shadow-sm"
                : "border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            {p.is_default && <Star className="size-3 fill-current" />}
            {p.profile_name}
          </button>
        ))}
        <button
          onClick={handleCreateProfile}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-dashed border-border transition-colors whitespace-nowrap"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm mb-4 ${
          message.type === "success" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
        }`}>
          {message.type === "success" ? <CheckCircle className="size-4 shrink-0 mt-0.5" /> : <AlertCircle className="size-4 shrink-0 mt-0.5" />}
          {message.text}
        </div>
      )}

      {activeProfile && (
        <>
          {/* Quick Import */}
          <div className="glass-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> Quick Import
              </h3>
              <div className="flex items-center gap-2">
                {!activeProfile.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(activeProfile.id)}>
                    <Star className="size-3.5 mr-1" /> Set Default
                  </Button>
                )}
                {!activeProfile.is_default && profiles.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Delete this profile?")) deleteMutation.mutate(activeProfile.id); }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleCvUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={cvParsing} className="flex-1">
                {cvParsing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Upload className="size-3.5 mr-1.5" />}
                {cvParsing ? "Parsing..." : "Upload CV"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Link2 className="size-3.5 mr-1.5 text-[#0077B5]" /> LinkedIn Import
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="glass-card p-6">
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile_name">Profile Name</Label>
                <Input id="profile_name" value={form.profile_name} onChange={(e) => setForm({ ...form, profile_name: e.target.value })} placeholder="e.g. Frontend Developer" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1"><Briefcase className="size-3" /> Target Position</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Software Engineer" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Summary</Label>
                <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Brief summary tailored to this role..." />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                      {skill}
                      <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((s) => s !== skill) })} className="hover:text-destructive"><X className="size-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Add a skill..." className="flex-1" />
                  <Button type="button" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>Add</Button>
                </div>
              </div>

              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-stone-900 font-bold border-0 shadow-lg hover:shadow-xl transition-all">
                {saveMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {saveMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </div>
        </>
      )}

      {/* Upgrade CTA */}
      {profiles.length >= (userPlan === "pro" ? 3 : userPlan === "premium" ? 999 : 1) && userPlan !== "premium" && (
        <div className="glass-card p-5 mt-4 flex items-center gap-4">
          <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg shrink-0">
            <Crown className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Need more profiles?</p>
            <p className="text-xs text-muted-foreground">Upgrade to {userPlan === "free" ? "Pro" : "Premium"} for {userPlan === "free" ? "up to 3" : "unlimited"} profiles.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
