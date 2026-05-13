/**
 * Job description parser
 *
 * Scraped job descriptions are usually a wall of text that mashes together
 * "responsibilities", "requirements", "benefits" etc. without any structure.
 * This module:
 *
 *   1. Detects the language with a tiny stopword heuristic (no franc/cld
 *      dependency — ~10 stopwords per language is plenty for our needs).
 *   2. Splits the text at common section markers (case-insensitive).
 *   3. Within each section, detects bullet patterns and emits them as
 *      separate strings so the page can render a real <ul>.
 *
 * Server-only (regex + string ops, no DOM).
 *
 * If no section markers are found, the entire text becomes a single
 * "Overview" section. Bullets are still detected.
 */

export type ParsedSection = {
  heading: string;
  content: string[];
};

export type ParsedDescription = {
  language: string;
  sections: ParsedSection[];
};

/**
 * Canonical section keys. Each maps to a list of synonyms — case-insensitive.
 * Order matters: more specific keys come first so "key responsibilities"
 * matches "Responsibilities" before "Requirements" could ever match.
 *
 * The heading we render uses the canonical capitalization on the right.
 */
const SECTION_PATTERNS: Array<{ key: string; heading: string; synonyms: string[] }> = [
  {
    key: "responsibilities",
    heading: "Responsibilities",
    synonyms: [
      "key responsibilities",
      "your responsibilities",
      "responsibilities",
      "what you'll do",
      "what you will do",
      "what you'll be doing",
      "what you will be doing",
      "your role",
      "your tasks",
      "the role",
      "day to day",
      "day-to-day",
      "the job",
    ],
  },
  {
    key: "requirements",
    heading: "Requirements",
    synonyms: [
      "minimum qualifications",
      "basic qualifications",
      "key requirements",
      "must have",
      "must-have",
      "must haves",
      "what you bring",
      "what you'll bring",
      "what we're looking for",
      "what we are looking for",
      "you should have",
      "you have",
      "requirements",
      "qualifications",
      "your profile",
      "your skills",
      "skills required",
      "required skills",
      "what you need",
    ],
  },
  {
    key: "nice_to_have",
    heading: "Nice to Have",
    synonyms: [
      "nice to have",
      "nice-to-have",
      "bonus points",
      "bonus",
      "preferred qualifications",
      "preferred",
      "plus",
      "pluses",
      "extras",
    ],
  },
  {
    key: "benefits",
    heading: "Benefits",
    synonyms: [
      "what we offer",
      "what you'll get",
      "what you will get",
      "we offer",
      "benefits",
      "perks",
      "perks & benefits",
      "compensation",
      "compensation & benefits",
      "why join us",
      "why you'll love it here",
    ],
  },
  {
    key: "about",
    heading: "About the Company",
    synonyms: [
      "about the company",
      "about us",
      "about the team",
      "who we are",
      "the company",
      "company overview",
      "our company",
      "our mission",
    ],
  },
];

/**
 * Build a single regex that detects ANY heading occurrence in the text.
 *
 * We require the heading to either:
 *   - sit on its own line, or
 *   - be followed by a colon, or
 *   - be followed by a newline.
 *
 * Markers like "**Responsibilities:**" or "Responsibilities\n" both qualify.
 */
function buildHeadingRegex(): RegExp {
  const allSynonyms = SECTION_PATTERNS.flatMap((p) =>
    p.synonyms.map((s) => ({ key: p.key, syn: s }))
  )
    // Sort longest first so "key responsibilities" beats "responsibilities".
    .sort((a, b) => b.syn.length - a.syn.length);

  const escaped = allSynonyms.map(({ syn }) =>
    syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  // Match the heading optionally prefixed by markdown bold (**), preceded by
  // a line break or start of string, optionally followed by ":" or "—".
  // The trailing lookahead ensures we don't match inside a sentence.
  return new RegExp(
    `(?:^|\\n)\\s*(?:[*_#]{0,3})\\s*(${escaped.join("|")})\\s*[:\\-—]?\\s*(?:[*_]{0,3})\\s*(?=\\n|$)`,
    "gi"
  );
}

const HEADING_REGEX = buildHeadingRegex();

/** Look up the canonical heading for a matched synonym. */
function canonicalHeadingFor(match: string): string {
  const normalized = match.trim().toLowerCase();
  for (const pattern of SECTION_PATTERNS) {
    if (pattern.synonyms.some((s) => s.toLowerCase() === normalized)) {
      return pattern.heading;
    }
  }
  return "Overview";
}

/**
 * Strip leading bullet glyphs/numbers from a line.
 *
 * Recognizes:
 *   • -- ─ – — * + > → ▪ ◦  •  ●  ○
 *   "1.", "1)", "(1)"
 *
 * Returns the cleaned text, or null if the line isn't a bullet.
 */
function tryStripBullet(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Glyph bullets
  const glyphMatch = trimmed.match(/^([•\-*+>→▪◦●○─–—])\s+(.+)$/);
  if (glyphMatch) return glyphMatch[2].trim();

  // Numbered: "1." "1)" "(1)"
  const numMatch = trimmed.match(/^\(?(\d{1,2})[.)]\s+(.+)$/);
  if (numMatch) return numMatch[2].trim();

  return null;
}

/**
 * Heuristic: lines that LOOK like bullets even without a marker.
 *
 * A short capitalized line (under 120 chars) followed by another short
 * capitalized line tends to be a list ("Solid Python skills\nGood English\n...").
 * We can't catch every case but it's a useful fallback.
 *
 * This is only used when at least one neighbor IS a real bullet — so we don't
 * mistake a normal paragraph for a list.
 */
function looksLikeBullet(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 140) return false;
  // No sentence-ending punctuation in the middle (commas ok).
  // A real bullet typically ends without period or with single short phrase.
  return /^[A-Z0-9]/.test(trimmed) && !/[.!?]\s+[A-Z]/.test(trimmed);
}

/**
 * Parse a single section's body into either paragraphs or bullets.
 *
 * Strategy:
 *   - Split by newlines.
 *   - For each line, try to strip a bullet glyph.
 *   - If ≥ 2 bullets are detected, return ALL as bullets (orphan paragraphs
 *     inside a bullet section get treated as bullets too).
 *   - Otherwise, group consecutive non-empty lines as paragraphs.
 */
function parseSectionContent(body: string): string[] {
  const rawLines = body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  // First pass: count real bullets.
  const stripped: Array<{ original: string; bullet: string | null }> = rawLines.map(
    (line) => ({ original: line, bullet: tryStripBullet(line) })
  );
  const bulletCount = stripped.filter((s) => s.bullet !== null).length;

  if (bulletCount >= 2) {
    // Treat the whole section as a list. Anything that ISN'T already a bullet
    // but "looks like" one becomes a bullet too. Anything else becomes its
    // own item (better that than dropping content).
    return stripped.map((s) => s.bullet ?? s.original);
  }

  // Otherwise: paragraphs. Reassemble by merging lines that don't end in
  // sentence punctuation (handles wrapped text).
  const paragraphs: string[] = [];
  let current = "";
  for (const { original } of stripped) {
    if (!current) {
      current = original;
    } else if (/[.!?:]$/.test(current)) {
      paragraphs.push(current);
      current = original;
    } else {
      current += " " + original;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

/**
 * Detect language using stopword frequency.
 *
 * For each language, count how many of its stopwords appear in the text.
 * Pick the language with the highest hit count, falling back to "en" if
 * nothing scores ≥ 2.
 *
 * Stopwords are intentionally short and high-frequency. We strip HTML and
 * punctuation, lowercase, then split on whitespace.
 */
const LANGUAGE_STOPWORDS: Record<string, { label: string; words: string[] }> = {
  en: {
    label: "English",
    words: ["the", "and", "you", "for", "with", "are", "our", "your", "have", "this", "will", "that", "from"],
  },
  de: {
    label: "German",
    words: ["und", "der", "die", "das", "ist", "wir", "sie", "ein", "mit", "für", "auf", "nicht", "von"],
  },
  fr: {
    label: "French",
    words: ["le", "la", "les", "de", "et", "vous", "nous", "pour", "avec", "dans", "votre", "notre", "est"],
  },
  es: {
    label: "Spanish",
    words: ["el", "la", "los", "las", "de", "y", "con", "para", "que", "una", "nuestro", "nuestra", "tu", "tus"],
  },
  it: {
    label: "Italian",
    words: ["il", "la", "di", "che", "per", "con", "una", "del", "alla", "nel", "sono", "siamo", "tuo"],
  },
  pt: {
    label: "Portuguese",
    words: ["o", "a", "de", "que", "para", "com", "uma", "nosso", "nossa", "você", "sua", "seu", "são"],
  },
  tr: {
    label: "Turkish",
    words: ["ve", "bir", "için", "ile", "olarak", "olan", "veya", "bizim", "sizin", "çok", "daha", "değil", "var"],
  },
  nl: {
    label: "Dutch",
    words: ["de", "het", "een", "en", "van", "voor", "met", "onze", "jouw", "jij", "wij", "zijn", "niet"],
  },
};

export function detectLanguage(text: string): string {
  // Strip tags and punctuation, lowercase, tokenize.
  const cleaned = text
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .replace(/[^\p{Letter}\s]+/gu, " ");
  const tokens = new Set(cleaned.split(/\s+/).filter((t) => t.length > 0));

  let best: { lang: string; score: number } = { lang: "en", score: 0 };
  for (const [lang, { words }] of Object.entries(LANGUAGE_STOPWORDS)) {
    let score = 0;
    for (const word of words) {
      if (tokens.has(word)) score++;
    }
    if (score > best.score) best = { lang, score };
  }
  // Require at least 2 hits before claiming non-English; otherwise default to en.
  if (best.score < 2) return "en";
  return best.lang;
}

/** Human-readable label for a detected language code. */
export function languageLabel(code: string): string {
  return LANGUAGE_STOPWORDS[code]?.label ?? code.toUpperCase();
}

/** Flag emoji per language code (best-effort; falls back to a globe). */
export function languageFlag(code: string): string {
  const flags: Record<string, string> = {
    en: "EN",
    de: "DE",
    fr: "FR",
    es: "ES",
    it: "IT",
    pt: "PT",
    tr: "TR",
    nl: "NL",
  };
  return flags[code] ?? code.toUpperCase();
}

/**
 * Strip noisy artifacts that ATS scrapes leave behind:
 *   - HTML tags (we render plain text)
 *   - "Apply Now"/"Apply for this job" stand-alone lines
 *   - duplicate consecutive blank lines collapsed to one
 *   - markdown bold/italic markers around headings (`**Heading**` → `Heading`)
 */
function preprocess(raw: string): string {
  let text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<[^>]+>/g, "")
    // HTML entities — minimal set, no library
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Markdown bold/italic around words
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1");

  // Drop stand-alone apply links
  text = text.replace(/^(apply now|apply for this (job|position)|apply here|submit application).*$/gim, "");

  // Collapse 3+ blank lines into 2
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/**
 * Main entry point: parse a raw description string into language + sections.
 */
export function parseDescription(raw: string | null | undefined): ParsedDescription {
  if (!raw || !raw.trim()) {
    return { language: "en", sections: [] };
  }

  const language = detectLanguage(raw);
  const cleaned = preprocess(raw);

  // Find all heading matches with their positions. matchAll is convenient
  // but we also need the position of each match to slice the body out.
  const matches: Array<{ start: number; end: number; heading: string }> = [];
  // Reset regex state — buildHeadingRegex is module-level.
  HEADING_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HEADING_REGEX.exec(cleaned)) !== null) {
    const headingSyn = m[1];
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      heading: canonicalHeadingFor(headingSyn),
    });
  }

  // No markers found → entire text becomes "Overview".
  if (matches.length === 0) {
    const content = parseSectionContent(cleaned);
    return {
      language,
      sections: content.length > 0 ? [{ heading: "Overview", content }] : [],
    };
  }

  const sections: ParsedSection[] = [];

  // If the first heading isn't at position 0, the prefix is an intro/overview.
  const firstMatch = matches[0];
  if (firstMatch.start > 0) {
    const intro = cleaned.slice(0, firstMatch.start).trim();
    if (intro.length > 0) {
      const content = parseSectionContent(intro);
      if (content.length > 0) sections.push({ heading: "Overview", content });
    }
  }

  // Slice the body of each section.
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const body = cleaned.slice(current.end, next?.start ?? cleaned.length).trim();
    if (!body) continue;
    const content = parseSectionContent(body);
    if (content.length === 0) continue;

    // If consecutive matches resolve to the same canonical heading
    // (e.g. duplicate "Requirements"), merge them.
    const last = sections[sections.length - 1];
    if (last && last.heading === current.heading) {
      last.content.push(...content);
    } else {
      sections.push({ heading: current.heading, content });
    }
  }

  return { language, sections };
}
