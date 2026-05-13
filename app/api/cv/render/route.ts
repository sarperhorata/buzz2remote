/**
 * POST /api/cv/render
 *
 * Render a CVData payload into a PDF blob using one of the bundled
 * @react-pdf templates (modern / classic / minimal). Used by /cv-builder
 * when the user clicks "Download PDF".
 *
 * Request: JSON { data: CVData, template: "modern"|"classic"|"minimal" }
 * Response: application/pdf with a Content-Disposition: attachment header so
 *           the browser kicks off a download. The filename uses the user's
 *           name + template, falls back to "cv-modern.pdf".
 *
 * Auth: required. We don't currently rate-limit (cheap, runs in <500ms) but
 *       could add a per-user lockout if we see abuse — the @react-pdf
 *       renderer is CPU-bound and not free.
 *
 * Runtime: nodejs (NOT edge) — @react-pdf has ~3 MB of dependencies and
 * needs Node Buffer/streams APIs.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, errorResponse } from "@/lib/api-utils";
import { renderCVToPdfBuffer } from "@/lib/cv-render/render";
import { TEMPLATE_IDS, type TemplateId, type CVData } from "@/lib/cv-render/types";

export const runtime = "nodejs";
// Empirically the renderer takes 200-800ms for a typical one-page CV.
// 30s is plenty even with cold-start; bumped to 60s for safety margin on
// multi-page docs.
export const maxDuration = 60;

function isValidTemplate(t: unknown): t is TemplateId {
  return typeof t === "string" && (TEMPLATE_IDS as readonly string[]).includes(t);
}

// Strip characters that PDFs / browsers / OSes don't tolerate in a
// suggested filename. Allow letters/numbers/space/dash/underscore only,
// collapse whitespace, trim length to 60 chars.
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 _\-À-ſ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "cv";
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => null) as { data?: CVData; template?: unknown } | null;
    if (!body || typeof body !== "object") {
      return errorResponse("Invalid JSON body. Send { data, template }.", 400);
    }
    if (!isValidTemplate(body.template)) {
      return errorResponse(`Invalid template. Use one of: ${TEMPLATE_IDS.join(", ")}`, 400);
    }
    if (!body.data || typeof body.data !== "object") {
      return errorResponse("Missing 'data' field.", 400);
    }

    const pdf = await renderCVToPdfBuffer(body.data, body.template);

    const fnamePrefix = body.data.full_name ? sanitizeFilename(body.data.full_name) : "cv";
    const filename = `${fnamePrefix}_${body.template}.pdf`;

    // Send the raw bytes back. Using NextResponse so we can set the
    // Content-Disposition header — the client side fetches as blob, then
    // anchors it to a temporary <a download> to trigger the browser save.
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Disable caching — different requests with same template can have
        // different data, and we never want intermediaries to serve a stale
        // CV PDF to the wrong user.
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
