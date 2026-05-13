"use client";

// useSearchParams is currently unused but keeping force-dynamic here
// anyway — this page is auth-gated and personalises every field, so
// prerendering would be wrong.
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2, Download, Plus, Trash2, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TEMPLATE_IDS,
  TEMPLATE_METADATA,
  profileToCV,
  type CVData,
  type CVWorkExperience,
  type CVEducation,
  type TemplateId,
} from "@/lib/cv-render/types";

// ──────────────────────────────────────────────────────────────────────────
// Form ↔ CVData helpers
// ──────────────────────────────────────────────────────────────────────────

// Empty templates used when the user clicks "+ Add" — easier than passing
// undefined and dealing with controlled-input warnings.
const blankExperience: CVWorkExperience = {
  title: "",
  company: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};
const blankEducation: CVEducation = {
  school: "",
  degree: "",
  field: "",
  start_date: "",
  end_date: "",
};

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

interface ProfileApiShape {
  profiles?: Array<{
    id: string;
    profile_name: string;
    is_default: boolean;
    title: string | null;
    bio: string | null;
    skills: unknown;
    work_experience: unknown;
    education: unknown;
    certificates: unknown;
  }>;
}

// /api/users/me returns the user record directly (not nested under `user`),
// so this type mirrors the schema fields we actually need for the CV header.
interface UserMeShape {
  full_name?: string | null;
  email?: string | null;
  location?: string | null;
  // phone isn't in users table — we keep it optional so the field can be
  // populated from /profile autofill if we add it there later.
  phone?: string | null;
}

export default function CVBuilderPage() {
  const { data: session } = useSession();

  // Fetch the active (default) profile so we can pre-populate the form.
  // /profile and /cv-review both write to this — so the builder picks up
  // the latest CV import automatically.
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => fetch("/api/profiles").then((r) => r.json() as Promise<ProfileApiShape>),
  });

  const { data: userMe } = useQuery({
    queryKey: ["users-me"],
    queryFn: () => fetch("/api/users/me").then((r) => r.json() as Promise<UserMeShape>),
  });

  const defaultProfile = profilesData?.profiles?.find((p) => p.is_default) ?? profilesData?.profiles?.[0];

  // CVData state. We seed once when the profile loads, then never overwrite
  // again — the form is the source of truth from that point on. This lets
  // the user freely edit without React Query re-renders clobbering their
  // input.
  const [form, setForm] = useState<CVData | null>(null);
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!form && defaultProfile) {
      const seeded = profileToCV(defaultProfile, {
        full_name: userMe?.full_name ?? session?.user?.name ?? undefined,
        email: userMe?.email ?? session?.user?.email ?? undefined,
        location: userMe?.location ?? undefined,
        phone: userMe?.phone ?? undefined,
      });
      // Pre-fill with at least one empty entry per array section so the user
      // sees the form structure even on a brand-new account.
      setForm({
        ...seeded,
        work_experience: seeded.work_experience?.length ? seeded.work_experience : [{ ...blankExperience }],
        education: seeded.education?.length ? seeded.education : [{ ...blankEducation }],
        skills: seeded.skills ?? [],
        languages: seeded.languages ?? [],
        certificates: seeded.certificates ?? [],
        links: seeded.links ?? {},
      });
    }
  }, [defaultProfile, userMe, session, form]);

  async function handleDownload() {
    if (!form) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/cv/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form, template }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to render PDF");
      }
      const blob = await res.blob();
      // Trigger browser download via temp <a> — same pattern as profile pic
      // download links. URL.createObjectURL avoids us having to base64-encode.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(form.full_name || "cv").replace(/\s+/g, "_")}_${template}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a tick so Chrome has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (profilesLoading || !form) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="CV Builder" description="Loading your profile…" />
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <PageHeader
          title="CV Builder"
          description="Edit your CV and download a polished PDF. Three templates, one click."
        />
        <Button onClick={handleDownload} disabled={downloading} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
          {downloading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
          {downloading ? "Generating…" : "Download PDF"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Template picker */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TEMPLATE_IDS.map((id) => {
          const meta = TEMPLATE_METADATA[id];
          const active = template === id;
          return (
            <button
              key={id}
              onClick={() => setTemplate(id)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                active ? "border-amber-500 bg-amber-50" : "border-border bg-card hover:border-amber-300 hover:bg-amber-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm">{meta.name}</span>
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: meta.accent }}
                  aria-hidden
                />
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{meta.description}</p>
            </button>
          );
        })}
      </div>

      {/* Two-pane: form left, preview right (stacks on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6">
        <div className="space-y-6">
          <CVBuilderForm form={form} setForm={setForm} />
        </div>
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <PreviewPanel form={form} template={template} />
        </aside>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Form sections
// ──────────────────────────────────────────────────────────────────────────

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CVBuilderForm({ form, setForm }: { form: CVData; setForm: (v: CVData) => void }) {
  const update = (patch: Partial<CVData>) => setForm({ ...form, ...patch });

  // Skills are stored as string[] in CVData but the easiest UX is a chip
  // input — type, press Enter, chip appears. Backspace on empty input
  // removes the last chip.
  const [skillDraft, setSkillDraft] = useState("");
  const skills = form.skills ?? [];

  return (
    <>
      <Section title="Header" hint="Name, role, contact, and links shown at the top of the CV.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldLabel label="Full name">
            <Input value={form.full_name ?? ""} onChange={(e) => update({ full_name: e.target.value })} placeholder="Sarper Horata" />
          </FieldLabel>
          <FieldLabel label="Job title">
            <Input value={form.position ?? ""} onChange={(e) => update({ position: e.target.value })} placeholder="Senior Product Manager" />
          </FieldLabel>
          <FieldLabel label="Email">
            <Input type="email" value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} placeholder="you@example.com" />
          </FieldLabel>
          <FieldLabel label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} placeholder="+90 555 ..." />
          </FieldLabel>
          <FieldLabel label="Location" className="sm:col-span-2">
            <Input value={form.location ?? ""} onChange={(e) => update({ location: e.target.value })} placeholder="Istanbul, Turkey" />
          </FieldLabel>
          <FieldLabel label="LinkedIn URL">
            <Input value={form.links?.linkedin ?? ""} onChange={(e) => update({ links: { ...form.links, linkedin: e.target.value } })} placeholder="https://linkedin.com/in/..." />
          </FieldLabel>
          <FieldLabel label="GitHub URL">
            <Input value={form.links?.github ?? ""} onChange={(e) => update({ links: { ...form.links, github: e.target.value } })} placeholder="https://github.com/..." />
          </FieldLabel>
          <FieldLabel label="Portfolio URL" className="sm:col-span-2">
            <Input value={form.links?.portfolio ?? ""} onChange={(e) => update({ links: { ...form.links, portfolio: e.target.value } })} placeholder="https://..." />
          </FieldLabel>
        </div>
      </Section>

      <Section title="Summary" hint="Short 2-3 sentence professional pitch. Goes right under your name.">
        <Textarea
          rows={4}
          value={form.bio ?? ""}
          onChange={(e) => update({ bio: e.target.value })}
          placeholder="Senior Product Manager with 10+ years..."
        />
      </Section>

      <Section title="Experience" hint="Most recent first. Hit 'Add' for older roles.">
        {(form.work_experience ?? []).map((w, i) => (
          <ExperienceCard
            key={i}
            value={w}
            onChange={(next) => {
              const list = [...(form.work_experience ?? [])];
              list[i] = next;
              update({ work_experience: list });
            }}
            onRemove={() => {
              const list = [...(form.work_experience ?? [])];
              list.splice(i, 1);
              update({ work_experience: list });
            }}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ work_experience: [...(form.work_experience ?? []), { ...blankExperience }] })}
        >
          <Plus className="size-3.5 mr-1.5" /> Add experience
        </Button>
      </Section>

      <Section title="Education" hint="Schools and degrees. Most recent first.">
        {(form.education ?? []).map((e, i) => (
          <EducationCard
            key={i}
            value={e}
            onChange={(next) => {
              const list = [...(form.education ?? [])];
              list[i] = next;
              update({ education: list });
            }}
            onRemove={() => {
              const list = [...(form.education ?? [])];
              list.splice(i, 1);
              update({ education: list });
            }}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ education: [...(form.education ?? []), { ...blankEducation }] })}
        >
          <Plus className="size-3.5 mr-1.5" /> Add education
        </Button>
      </Section>

      <Section title="Skills" hint="Press Enter to add. Backspace to remove the last one.">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {skills.map((s, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {s}
              <button
                type="button"
                onClick={() => update({ skills: skills.filter((_, idx) => idx !== i) })}
                className="hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={skillDraft}
          onChange={(e) => setSkillDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = skillDraft.trim();
              if (v && !skills.includes(v)) update({ skills: [...skills, v] });
              setSkillDraft("");
            } else if (e.key === "Backspace" && !skillDraft && skills.length) {
              update({ skills: skills.slice(0, -1) });
            }
          }}
          placeholder="Add a skill and press Enter"
        />
      </Section>

      <Section title="Languages" hint="Optional. e.g. Turkish (Native), English (Fluent), German (B2).">
        {(form.languages ?? []).map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={l.name}
              onChange={(e) => {
                const list = [...(form.languages ?? [])];
                list[i] = { ...l, name: e.target.value };
                update({ languages: list });
              }}
              placeholder="English"
              className="flex-1"
            />
            <Input
              value={l.proficiency ?? ""}
              onChange={(e) => {
                const list = [...(form.languages ?? [])];
                list[i] = { ...l, proficiency: e.target.value };
                update({ languages: list });
              }}
              placeholder="Fluent / B2 / Native"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const list = [...(form.languages ?? [])];
                list.splice(i, 1);
                update({ languages: list });
              }}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ languages: [...(form.languages ?? []), { name: "", proficiency: "" }] })}
        >
          <Plus className="size-3.5 mr-1.5" /> Add language
        </Button>
      </Section>

      <Section title="Certificates" hint="Optional. e.g. AWS Certified, PMP, Reforge.">
        {(form.certificates ?? []).map((c, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={c}
              onChange={(e) => {
                const list = [...(form.certificates ?? [])];
                list[i] = e.target.value;
                update({ certificates: list });
              }}
              placeholder="Certification name (year)"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const list = [...(form.certificates ?? [])];
                list.splice(i, 1);
                update({ certificates: list });
              }}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ certificates: [...(form.certificates ?? []), ""] })}
        >
          <Plus className="size-3.5 mr-1.5" /> Add certificate
        </Button>
      </Section>

      <Section title="Import from CV" hint="Drop a PDF/DOCX of your existing CV to autofill all the fields above.">
        <CvImportButton onImported={(parsed) => {
          // Merge into the form: only overwrite fields where the import
          // produced a value, so users don't lose manual edits.
          setForm({
            ...form,
            full_name: parsed.full_name ?? form.full_name,
            position: parsed.position ?? form.position,
            email: parsed.email ?? form.email,
            phone: parsed.phone ?? form.phone,
            location: parsed.location ?? form.location,
            bio: parsed.bio ?? form.bio,
            skills: parsed.skills?.length ? parsed.skills : form.skills,
            work_experience: parsed.work_experience?.length ? parsed.work_experience : form.work_experience,
            education: parsed.education?.length ? parsed.education : form.education,
            certificates: parsed.certificates?.length ? parsed.certificates : form.certificates,
            languages: parsed.languages?.length ? parsed.languages : form.languages,
            links: { ...form.links, ...(parsed.links ?? {}) },
          });
        }} />
      </Section>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function FieldLabel({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ExperienceCard({ value, onChange, onRemove }: {
  value: CVWorkExperience;
  onChange: (v: CVWorkExperience) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-muted/30/50 space-y-2.5 relative">
      <button onClick={onRemove} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-6">
        <FieldLabel label="Job title">
          <Input value={value.title ?? ""} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Product Manager" />
        </FieldLabel>
        <FieldLabel label="Company">
          <Input value={value.company ?? ""} onChange={(e) => onChange({ ...value, company: e.target.value })} placeholder="Acme Inc." />
        </FieldLabel>
        <FieldLabel label="Location">
          <Input value={value.location ?? ""} onChange={(e) => onChange({ ...value, location: e.target.value })} placeholder="Remote / London" />
        </FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <FieldLabel label="Start">
            <Input value={value.start_date ?? ""} onChange={(e) => onChange({ ...value, start_date: e.target.value })} placeholder="2022-03" />
          </FieldLabel>
          <FieldLabel label="End">
            <Input
              value={value.is_current ? "Present" : (value.end_date ?? "")}
              onChange={(e) => onChange({ ...value, end_date: e.target.value, is_current: false })}
              placeholder="2024-12"
              disabled={value.is_current}
            />
          </FieldLabel>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={value.is_current ?? false}
          onChange={(e) => onChange({ ...value, is_current: e.target.checked, end_date: e.target.checked ? "" : value.end_date })}
        />
        I currently work here
      </label>
      <FieldLabel label="What you did">
        <Textarea
          rows={3}
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Owned the consumer flights product. Grew ARR 22% to $300M..."
        />
      </FieldLabel>
    </div>
  );
}

function EducationCard({ value, onChange, onRemove }: {
  value: CVEducation;
  onChange: (v: CVEducation) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-muted/30/50 space-y-2.5 relative">
      <button onClick={onRemove} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-6">
        <FieldLabel label="School">
          <Input value={value.school ?? ""} onChange={(e) => onChange({ ...value, school: e.target.value })} placeholder="MIT" />
        </FieldLabel>
        <FieldLabel label="Degree">
          <Input value={value.degree ?? ""} onChange={(e) => onChange({ ...value, degree: e.target.value })} placeholder="BSc" />
        </FieldLabel>
        <FieldLabel label="Field of study">
          <Input value={value.field ?? ""} onChange={(e) => onChange({ ...value, field: e.target.value })} placeholder="Computer Science" />
        </FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <FieldLabel label="Start year">
            <Input value={value.start_date ?? ""} onChange={(e) => onChange({ ...value, start_date: e.target.value })} placeholder="2008" />
          </FieldLabel>
          <FieldLabel label="End year">
            <Input value={value.end_date ?? ""} onChange={(e) => onChange({ ...value, end_date: e.target.value })} placeholder="2012" />
          </FieldLabel>
        </div>
      </div>
    </div>
  );
}

function CvImportButton({ onImported }: { onImported: (cv: CVData) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        id="cv-import"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr(null);
          try {
            const fd = new FormData();
            fd.append("file", f);
            fd.append("autofill", "1");
            const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
            if (!res.ok) throw new Error((await res.json()).error || "Failed to parse CV");
            const { profile } = await res.json();
            if (profile?.__error) throw new Error(profile.__error);
            onImported(profile as CVData);
          } catch (er) {
            setErr(er instanceof Error ? er.message : "Import failed");
          } finally {
            setBusy(false);
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
      <label htmlFor="cv-import">
        <Button variant="outline" size="sm" disabled={busy} asChild>
          <span className="cursor-pointer">
            {busy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Upload className="size-3.5 mr-1.5" />}
            {busy ? "Parsing…" : "Import existing CV"}
          </span>
        </Button>
      </label>
      {err && <p className="text-xs text-destructive mt-2">{err}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Preview pane
// ──────────────────────────────────────────────────────────────────────────

function PreviewPanel({ form, template }: { form: CVData; template: TemplateId }) {
  const meta = TEMPLATE_METADATA[template];

  // Memoize so re-renders on unrelated state (e.g. download button)
  // don't reflow the preview content unnecessarily.
  const preview = useMemo(() => <PreviewBody form={form} template={template} />, [form, template]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: meta.accent }} />
          <span className="text-xs font-medium">{meta.name} preview</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">A4</span>
      </div>
      {/* Aspect ratio 1:1.414 = A4 portrait. Constrained width, content scrolls if too tall. */}
      <div className="relative bg-muted/50 p-4">
        <div className="bg-card border border-border shadow-sm mx-auto" style={{ width: "100%", aspectRatio: "1 / 1.414" }}>
          <div className="size-full overflow-y-auto">
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}

// Approximate HTML mirror of each template — not pixel-perfect (impossible
// without re-rendering through @react-pdf in the browser, which would
// double the bundle size) but visually close enough to give the user
// confidence about the layout before downloading. The PDF download is the
// canonical output.
function PreviewBody({ form, template }: { form: CVData; template: TemplateId }) {
  if (template === "modern") return <PreviewModern form={form} />;
  if (template === "classic") return <PreviewClassic form={form} />;
  return <PreviewMinimal form={form} />;
}

function formatRange(s?: string, e?: string, cur?: boolean) {
  if (!s && !e && !cur) return "";
  const ee = cur ? "Present" : (e ?? "");
  if (!s) return ee;
  if (!ee) return s;
  return `${s} – ${ee}`;
}

function PreviewModern({ form }: { form: CVData }) {
  return (
    <div className="flex h-full text-[10px] leading-snug font-sans">
      <div className="w-1/3 bg-slate-50 p-4 space-y-3">
        <div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-slate-900 mb-1">Contact</div>
          {form.email && <div className="text-[9px] text-slate-600">{form.email}</div>}
          {form.phone && <div className="text-[9px] text-slate-600">{form.phone}</div>}
          {form.location && <div className="text-[9px] text-slate-600">{form.location}</div>}
          {form.links?.linkedin && <div className="text-[9px] text-amber-700">linkedin</div>}
          {form.links?.github && <div className="text-[9px] text-amber-700">github</div>}
          {form.links?.portfolio && <div className="text-[9px] text-amber-700">portfolio</div>}
        </div>
        {form.skills && form.skills.length > 0 && (
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-900 mb-1">Skills</div>
            {form.skills.map((s, i) => (
              <div key={i} className="text-[9px] text-slate-900 flex items-start gap-1.5">
                <span className="size-1 bg-amber-500 rounded-full mt-1.5" />
                {s}
              </div>
            ))}
          </div>
        )}
        {form.languages && form.languages.length > 0 && (
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-900 mb-1">Languages</div>
            {form.languages.map((l, i) => (
              <div key={i} className="text-[9px] text-slate-600">{l.name}{l.proficiency ? ` — ${l.proficiency}` : ""}</div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 p-4 space-y-2">
        {form.full_name && <div className="text-lg font-bold leading-tight">{form.full_name}</div>}
        {form.position && <div className="text-[10px] text-amber-700 mb-2">{form.position}</div>}
        {form.bio && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest border-b border-amber-500 pb-0.5 mb-1.5">Profile</div>
            <div className="text-[9px] text-slate-900">{form.bio}</div>
          </div>
        )}
        {form.work_experience && form.work_experience.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest border-b border-amber-500 pb-0.5 mb-1.5">Experience</div>
            {form.work_experience.map((w, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold">{w.title || "—"}</span>
                  <span className="text-[8px] text-slate-500">{formatRange(w.start_date, w.end_date, w.is_current)}</span>
                </div>
                {(w.company || w.location) && <div className="text-[9px] text-amber-700">{w.company}{w.company && w.location ? " · " : ""}{w.location}</div>}
                {w.description && <div className="text-[9px] text-slate-900">{w.description}</div>}
              </div>
            ))}
          </div>
        )}
        {form.education && form.education.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest border-b border-amber-500 pb-0.5 mb-1.5">Education</div>
            {form.education.map((e, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold">{e.degree}{e.field ? `, ${e.field}` : ""}</span>
                  <span className="text-[8px] text-slate-500">{formatRange(e.start_date, e.end_date)}</span>
                </div>
                {e.school && <div className="text-[9px] text-amber-700">{e.school}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewClassic({ form }: { form: CVData }) {
  return (
    <div className="h-full p-6 text-[10px] leading-snug" style={{ fontFamily: "Times, 'Times New Roman', serif" }}>
      {form.full_name && <div className="text-center text-xl font-bold tracking-wide">{form.full_name}</div>}
      {form.position && <div className="text-center text-[10px] text-muted-foreground mb-1">{form.position}</div>}
      <div className="text-center text-[9px] text-muted-foreground mb-3">
        {[form.email, form.phone, form.location].filter(Boolean).join(" · ")}
      </div>
      {form.bio && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-widest border-b border-black mb-1 pb-0.5">Summary</div>
          <div className="text-[10px] mb-2">{form.bio}</div>
        </>
      )}
      {form.work_experience && form.work_experience.length > 0 && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-widest border-b border-black mb-1 pb-0.5">Professional Experience</div>
          {form.work_experience.map((w, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold">{w.title}{w.company ? `, ${w.company}` : ""}</span>
                <span className="text-[9px] italic text-muted-foreground">{formatRange(w.start_date, w.end_date, w.is_current)}</span>
              </div>
              {w.location && <div className="text-[10px] italic">{w.location}</div>}
              {w.description && <div className="text-[10px]">{w.description}</div>}
            </div>
          ))}
        </>
      )}
      {form.education && form.education.length > 0 && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-widest border-b border-black mb-1 pb-0.5">Education</div>
          {form.education.map((e, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold">{e.degree}{e.field ? `, ${e.field}` : ""}{e.school ? `, ${e.school}` : ""}</span>
                <span className="text-[9px] italic text-muted-foreground">{formatRange(e.start_date, e.end_date)}</span>
              </div>
            </div>
          ))}
        </>
      )}
      {form.skills && form.skills.length > 0 && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-widest border-b border-black mb-1 pb-0.5">Skills</div>
          <div className="text-[10px] mb-2">{form.skills.join(" · ")}</div>
        </>
      )}
    </div>
  );
}

function PreviewMinimal({ form }: { form: CVData }) {
  return (
    <div className="h-full p-6 text-[10px] leading-relaxed">
      {form.full_name && <div className="text-2xl font-bold tracking-tight leading-tight">{form.full_name}</div>}
      {form.position && <div className="text-[11px] text-muted-foreground mb-3">{form.position}</div>}
      <div className="text-[9px] text-muted-foreground mb-5">
        {[form.email, form.phone, form.location].filter(Boolean).join("  ·  ")}
      </div>
      {form.bio && <div className="text-[10px] mb-5 leading-relaxed">{form.bio}</div>}
      {form.work_experience && form.work_experience.length > 0 && (
        <>
          <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Experience</div>
          {form.work_experience.map((w, i) => (
            <div key={i} className="flex mb-3">
              <div className="w-16 text-[8px] text-muted-foreground">{formatRange(w.start_date, w.end_date, w.is_current)}</div>
              <div className="flex-1">
                <div className="text-[10px] font-bold">{w.title}</div>
                {(w.company || w.location) && <div className="text-[9px] text-muted-foreground">{w.company}{w.company && w.location ? " · " : ""}{w.location}</div>}
                {w.description && <div className="text-[9px]">{w.description}</div>}
              </div>
            </div>
          ))}
        </>
      )}
      {form.education && form.education.length > 0 && (
        <>
          <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 mt-3">Education</div>
          {form.education.map((e, i) => (
            <div key={i} className="flex mb-2">
              <div className="w-16 text-[8px] text-muted-foreground">{formatRange(e.start_date, e.end_date)}</div>
              <div className="flex-1">
                <div className="text-[10px] font-bold">{e.degree}{e.field ? `, ${e.field}` : ""}</div>
                {e.school && <div className="text-[9px] text-muted-foreground">{e.school}</div>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
