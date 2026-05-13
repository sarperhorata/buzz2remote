/**
 * Server-side CV text extraction.
 *
 * Replaces the inline regex-on-raw-bytes "parser" that used to live in
 * /profile (which only worked for the simplest PDFs and silently produced
 * garbage on real-world CVs). We extract real text from:
 *   - PDF via `unpdf` — Mozilla pdfjs ported for serverless, no native deps
 *   - DOCX via `mammoth` — strips formatting, returns plain text
 *   - TXT — just decoded as UTF-8
 *
 * Returned text is normalized (CRLFs → LF, collapse runs of whitespace,
 * trim) so downstream LLM prompts see consistent input regardless of
 * source format.
 *
 * 8 MB hard limit on input — anything larger is almost certainly not a CV
 * (scanned PDFs are typically <2 MB; design portfolios in PDF can be 5-10 MB
 * but those have no useful text anyway).
 */

export const MAX_CV_BYTES = 8 * 1024 * 1024;
// Cap LLM input at 16k chars (~4k tokens) — Groq's instruction-following
// degrades sharply past this and the LLM doesn't benefit from seeing extra
// formatting noise. Most CVs fit comfortably under this.
export const MAX_LLM_CHARS = 16_000;

export type CVFormat = "pdf" | "docx" | "txt";

export class CVExtractError extends Error {
  constructor(message: string, public code: "too_large" | "unsupported" | "empty" | "parse_failed") {
    super(message);
    this.name = "CVExtractError";
  }
}

/**
 * Detect the CV format from the filename and MIME type. We trust filename
 * extension over MIME because browsers sometimes report octet-stream for
 * .docx and pdf MIME for non-pdf attachments.
 */
export function detectFormat(filename: string, mimeType: string): CVFormat | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }
  if (ext === "txt" || mimeType === "text/plain") return "txt";
  // .doc (old Word format) — we don't support it; mammoth can't read it.
  return null;
}

/**
 * Normalize extracted CV text:
 *   - Newlines: CRLF/CR → LF
 *   - Replace non-breaking spaces with regular spaces
 *   - Trim trailing whitespace on each line
 *   - Collapse 3+ blank lines to 2 (preserves paragraph breaks)
 *   - Drop leading/trailing whitespace overall
 *
 * We DO keep single newlines because section breaks are real information
 * for the LLM — collapsing to single-line ruins section detection.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/ /g, " ") // nbsp
    .replace(/​/g, "") // zero-width space (common in copy-pasted CVs)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  // unpdf is ESM-only; dynamic import avoids any Turbopack edge bundling
  // issues and keeps the cv-extract module itself lazy-loaded for routes
  // that don't need it.
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value ?? "";
}

function extractTxt(buffer: ArrayBuffer): string {
  // fatal: false → don't throw on invalid sequences, replace with U+FFFD.
  // Works for UTF-8, Windows-1252, Latin-1, etc. (browsers re-encode on
  // upload but desktop apps sometimes save plain ASCII or 1252.)
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

/**
 * Main entry point. Given a File-like (with size, name, type, arrayBuffer()),
 * return the normalized text content. Throws `CVExtractError` on any failure
 * so callers can surface a useful message — never returns garbage silently.
 */
export async function extractCvText(file: {
  size: number;
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}): Promise<{ text: string; format: CVFormat }> {
  if (file.size > MAX_CV_BYTES) {
    throw new CVExtractError(
      `File too large (${Math.round(file.size / 1024 / 1024)} MB). Max 8 MB.`,
      "too_large"
    );
  }

  const format = detectFormat(file.name, file.type);
  if (!format) {
    throw new CVExtractError(
      "Unsupported file type. Upload a PDF, DOCX, or TXT file.",
      "unsupported"
    );
  }

  const buffer = await file.arrayBuffer();

  let raw: string;
  try {
    if (format === "pdf") raw = await extractPdf(buffer);
    else if (format === "docx") raw = await extractDocx(buffer);
    else raw = extractTxt(buffer);
  } catch (err) {
    throw new CVExtractError(
      `Couldn't read ${format.toUpperCase()}: ${err instanceof Error ? err.message : "parse error"}`,
      "parse_failed"
    );
  }

  const text = normalizeText(raw);
  if (text.length < 50) {
    // CVs with <50 chars of text are almost always scanned images (no OCR
    // layer) — we can't do anything useful with these.
    throw new CVExtractError(
      "Couldn't extract text. Is this a scanned image? Try a text-based PDF.",
      "empty"
    );
  }

  return { text, format };
}
