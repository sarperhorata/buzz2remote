/**
 * Shared CV data shape used by every template and by the renderer API.
 *
 * Designed to mirror what `/api/cv/upload` extracts from a real CV (so we
 * can flow uploaded-CV → parsed-fields → builder seamlessly) AND what
 * user_profiles stores (so we can prefill from the active profile without
 * a translation layer).
 *
 * Every field is optional because the user may build a CV from scratch
 * (empty form) or start with a partial profile. Templates render gracefully
 * when fields are missing — they hide sections rather than show empty
 * headings.
 *
 * Date format convention: free-form strings like "2024-03", "March 2024",
 * "2020", or "Present". We do NOT parse / normalize dates server-side —
 * the template just prints what the user typed. This keeps multi-locale
 * CVs (e.g. "Şub 2024", "März 2024") from getting mangled.
 */

export interface CVWorkExperience {
  title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface CVEducation {
  school?: string;
  degree?: string;
  field?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface CVLanguage {
  name: string;
  proficiency?: string;
}

export interface CVLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  website?: string;
}

export interface CVData {
  // Header
  full_name?: string;
  position?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: CVLinks;

  // Body
  bio?: string;
  work_experience?: CVWorkExperience[];
  education?: CVEducation[];
  skills?: string[];
  languages?: CVLanguage[];
  certificates?: string[];
}

export const TEMPLATE_IDS = ["modern", "classic", "minimal"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATE_METADATA: Record<TemplateId, { name: string; description: string; accent: string }> = {
  modern: {
    name: "Modern",
    description: "Clean two-column with an amber accent. Best for tech & design roles.",
    accent: "#f59e0b",
  },
  classic: {
    name: "Classic",
    description: "Serif, single-column, ATS-friendly. Best for finance, law, consulting.",
    accent: "#111827",
  },
  minimal: {
    name: "Minimal",
    description: "Lots of whitespace, no colored chrome. Best for senior / executive roles.",
    accent: "#374151",
  },
};

/**
 * Map a `user_profiles` row (skills as JSON, work_experience as JSON, etc.)
 * to a `CVData` instance the renderer understands. Stays defensive — never
 * throws on malformed inputs, just elides the bad field.
 */
export function profileToCV(profile: {
  title?: string | null;
  bio?: string | null;
  skills?: unknown;
  work_experience?: unknown;
  education?: unknown;
  certificates?: unknown;
}, userBase: { full_name?: string | null; email?: string | null; location?: string | null; phone?: string | null } = {}): CVData {
  const skills = Array.isArray(profile.skills)
    ? profile.skills
        .map((s) => (typeof s === "string" ? s : (s as { name?: string })?.name ?? ""))
        .filter((s): s is string => Boolean(s))
    : [];

  const work_experience = Array.isArray(profile.work_experience)
    ? (profile.work_experience as CVWorkExperience[])
    : [];

  const education = Array.isArray(profile.education)
    ? (profile.education as CVEducation[])
    : [];

  const certificates = Array.isArray(profile.certificates)
    ? profile.certificates
        .map((c) => (typeof c === "string" ? c : (c as { name?: string })?.name ?? ""))
        .filter((s): s is string => Boolean(s))
    : [];

  return {
    full_name: userBase.full_name ?? undefined,
    email: userBase.email ?? undefined,
    location: userBase.location ?? undefined,
    phone: userBase.phone ?? undefined,
    position: profile.title ?? undefined,
    bio: profile.bio ?? undefined,
    skills,
    work_experience,
    education,
    certificates,
  };
}
