"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
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
  FileText, ExternalLink,
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
  // LinkedIn import is two-flow: quick OAuth (basic fields) or full PDF
  // upload (work history etc.). The modal exposes both paths because
  // LinkedIn's API doesn't surface work history to third-party apps, and
  // hiding that fact frustrates users who expect "Import from LinkedIn" to
  // pull their whole profile.
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInBusy, setLinkedInBusy] = useState(false);

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

  // CV Upload handler — server-side extraction via /api/cv/upload. The old
  // implementation tried to extract PDF text from raw bytes with a regex
  // (`\(([^)]+)\)` matching parenthesized strings), which only worked for
  // the simplest text-based PDFs and silently produced garbage on anything
  // exported by Word, Pages, Canva, etc. The new endpoint runs unpdf /
  // mammoth on the server and also kicks off profile-autofill in the same
  // call, so the round-trip count drops from 2 → 1.
  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;

    setCvParsing(true);
    setMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("profileId", activeProfile.id);
      // save=1 → persist the parsed fields to user_profiles. Keeping the
      // optimistic local form update too so the user can review & edit
      // before the next save (parsing isn't perfect on niche layouts).
      fd.append("save", "1");
      fd.append("autofill", "1");

      const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to parse CV");
      }
      const { profile } = await res.json();

      if (!profile || profile.__error) {
        throw new Error(profile?.__error || "CV parsed but no profile data extracted.");
      }

      // Merge with current form — keep the user's profile_name (it's their
      // role tab name, not auto-generated), and only overwrite fields where
      // we actually got a value back.
      setForm((prev) => ({
        profile_name: prev.profile_name,
        title: profile.position || prev.title,
        bio: profile.bio || prev.bio,
        skills: profile.skills?.length
          ? Array.from(
              new Set([
                ...prev.skills,
                ...profile.skills.map((s: { name?: string } | string) =>
                  typeof s === "string" ? s : s.name || ""
                ).filter(Boolean),
              ])
            )
          : prev.skills,
      }));

      // Re-fetch from server so the canonical work_experience / education we
      // just persisted shows up on the next render.
      queryClient.invalidateQueries({ queryKey: ["profiles"] });

      setMessage({ type: "success", text: `CV imported from "${file.name}". Review and save any final tweaks.` });
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
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setLinkedInModalOpen(true)}
              >
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

      {linkedInModalOpen && (
        <LinkedInImportModal
          onClose={() => setLinkedInModalOpen(false)}
          activeProfileId={activeProfile?.id ?? null}
          busy={linkedInBusy}
          onBusyChange={setLinkedInBusy}
          onComplete={(msg) => {
            setMessage(msg);
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            setLinkedInModalOpen(false);
          }}
          fileInputRef={fileInputRef}
          onLinkedInPdfImport={async (file) => {
            // Reuses the same CV upload pipeline (server-side unpdf parse +
            // profile-autofill). LinkedIn-exported PDFs are well-formed and
            // parse cleanly — work history, education, skills, all of it.
            if (!activeProfile) return;
            setLinkedInBusy(true);
            try {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("profileId", activeProfile.id);
              fd.append("save", "1");
              fd.append("autofill", "1");
              const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
              if (!res.ok) throw new Error((await res.json()).error || "Failed to parse LinkedIn PDF");
              const { profile } = await res.json();
              if (!profile || profile.__error) throw new Error(profile?.__error || "No data extracted");
              setForm((prev) => ({
                profile_name: prev.profile_name,
                title: profile.position || prev.title,
                bio: profile.bio || prev.bio,
                skills: profile.skills?.length
                  ? Array.from(
                      new Set([
                        ...prev.skills,
                        ...profile.skills.map((s: { name?: string } | string) =>
                          typeof s === "string" ? s : s.name || ""
                        ).filter(Boolean),
                      ])
                    )
                  : prev.skills,
              }));
              queryClient.invalidateQueries({ queryKey: ["profiles"] });
              setMessage({ type: "success", text: `LinkedIn PDF imported. Review your profile and save.` });
              setLinkedInModalOpen(false);
            } catch (err) {
              setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "LinkedIn PDF import failed",
              });
            } finally {
              setLinkedInBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// LinkedIn import modal
// ──────────────────────────────────────────────────────────────────────────
//
// Two paths because LinkedIn's API doesn't expose work history to anyone
// outside the Marketing Partner Program (we aren't):
//   1. Quick OAuth: name/email/picture/location only. One click if you're
//      already signed in with LinkedIn, otherwise a redirect to the
//      LinkedIn OAuth dance. The /api/users/linkedin-import route handles
//      both cases and persists what it finds.
//   2. Full PDF: user exports their profile from LinkedIn ("More" → "Save
//      to PDF"), uploads here, and our existing /api/cv/upload pipeline
//      parses the whole thing. This is the only realistic way to get
//      complete work history into the platform.
//
// We surface the PDF flow visually first because it's the more useful
// option — Quick OAuth gives you ~3 fields, PDF gives you everything.

function LinkedInImportModal({
  onClose,
  activeProfileId,
  busy,
  onBusyChange,
  onComplete,
  onLinkedInPdfImport,
}: {
  onClose: () => void;
  activeProfileId: string | null;
  busy: boolean;
  onBusyChange: (b: boolean) => void;
  onComplete: (msg: { type: "success" | "error"; text: string }) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onLinkedInPdfImport: (file: File) => Promise<void>;
}) {
  const localFileRef = useRef<HTMLInputElement>(null);
  // Defer enabling the "click backdrop to close" handler by one event-loop
  // tick. This fixes the "first click does nothing, second click opens"
  // QA report (Bug #8): in some browser/test-runner combos the same
  // click that flips the modal-open state propagates up to the freshly
  // mounted backdrop and immediately closes it. With this gate, the
  // close handler is a no-op for the first ~16 ms after mount.
  const [canCloseOnBackdrop, setCanCloseOnBackdrop] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanCloseOnBackdrop(true), 0);
    return () => clearTimeout(t);
  }, []);
  // Allow ESC to close the modal even while the backdrop-click is gated.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleQuickImport() {
    if (!activeProfileId) {
      onComplete({ type: "error", text: "Create a profile first." });
      return;
    }
    onBusyChange(true);
    try {
      const res = await fetch("/api/users/linkedin-import", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        // Not-linked case: kick off the LinkedIn OAuth flow. After the
        // round trip the user lands back on /profile and can click
        // "Quick Import" again.
        if (data.code === "not_linked") {
          await signIn("linkedin", { callbackUrl: "/profile" });
          return;
        }
        if (data.code === "token_expired") {
          await signIn("linkedin", { callbackUrl: "/profile" });
          return;
        }
        throw new Error(data.error || "LinkedIn import failed");
      }
      const fieldsLabel = (data.imported as string[] | undefined)?.length
        ? data.imported.join(", ")
        : "no new fields (already imported)";
      onComplete({
        type: "success",
        text: `LinkedIn quick import done. Updated: ${fieldsLabel}.`,
      });
    } catch (err) {
      onComplete({
        type: "error",
        text: err instanceof Error ? err.message : "LinkedIn import failed",
      });
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={canCloseOnBackdrop ? onClose : undefined}
    >
      <div
        className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-[#0077B5]" />
            <h2 className="text-lg font-semibold">Import from LinkedIn</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted/50 rounded">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Full PDF flow — primary action */}
          <div className="border-2 border-amber-400 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-sm text-foreground">Full profile from LinkedIn PDF</h3>
              </div>
              <span className="text-[10px] font-medium bg-amber-500 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
            </div>
            {/* Bumped from text-muted-foreground (low contrast on amber bg) to
                foreground/80 so the body text stays readable inside the
                amber-tinted card in both themes. */}
            <p className="text-xs text-foreground/80 mb-3 leading-relaxed">
              Export your LinkedIn profile as PDF and upload it here. This is the only way to import your full work
              experience, education, and skills — LinkedIn&apos;s API doesn&apos;t expose those fields to third-party apps.
            </p>

            <ol className="text-xs text-foreground/80 space-y-1 mb-3 list-decimal list-inside">
              <li>
                Open <a href="https://www.linkedin.com/in/me/" target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-300 underline inline-flex items-center gap-0.5">
                  your LinkedIn profile <ExternalLink className="size-3" />
                </a>
              </li>
              <li>Click <strong>Resources</strong> → <strong>Save to PDF</strong></li>
              <li>Upload the downloaded PDF below</li>
            </ol>

            <input
              ref={localFileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await onLinkedInPdfImport(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="default"
              size="sm"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              disabled={busy}
              onClick={() => localFileRef.current?.click()}
            >
              {busy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Upload className="size-3.5 mr-1.5" />}
              {busy ? "Parsing…" : "Upload LinkedIn PDF"}
            </Button>
          </div>

          {/* Quick OAuth flow — secondary */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="size-4 text-[#0077B5]" />
              <h3 className="font-semibold text-sm">Quick: name & basics only</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              One-click import via LinkedIn OAuth. Brings over your name, profile photo, and headline. Doesn&apos;t
              include work history.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={handleQuickImport}
            >
              {busy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Link2 className="size-3.5 mr-1.5 text-[#0077B5]" />}
              {busy ? "Connecting…" : "Quick Import (OAuth)"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
