/**
 * Smoke test for lib/cv-extract.ts against a real CV. Run with:
 *   npx tsx scripts/test-cv-extract.ts "/Users/sarperhorata/Desktop/Sarper PM.pdf"
 *
 * Prints the format, byte size, extracted-text length, and a preview so we
 * can verify the parser produces meaningful output before wiring it to a
 * route. If the preview is gibberish, the upstream parser silently failed
 * and we know to fall back to a different library.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { extractCvText } from "../lib/cv-extract";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: tsx scripts/test-cv-extract.ts <path-to-cv>");
    process.exit(1);
  }

  const buf = readFileSync(path);
  const name = basename(path);
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const type =
    ext === "pdf" ? "application/pdf" :
    ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
    ext === "txt" ? "text/plain" : "";

  const file = {
    size: buf.byteLength,
    name,
    type,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  };

  console.log(`Input: ${name} (${(buf.byteLength / 1024).toFixed(1)} KB, ${type})`);

  const start = Date.now();
  try {
    const { text, format } = await extractCvText(file);
    const elapsed = Date.now() - start;
    console.log(`Format detected: ${format}`);
    console.log(`Extraction took: ${elapsed}ms`);
    console.log(`Text length: ${text.length} chars`);
    console.log(`Preview (first 600 chars):\n---\n${text.slice(0, 600)}\n---`);
    console.log(`Preview (last 300 chars):\n---\n${text.slice(-300)}\n---`);
  } catch (err) {
    console.error("FAILED:", err);
    process.exit(1);
  }
}

main();
