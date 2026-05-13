/**
 * POST /api/users/linkedin-import
 *
 * "Quick" LinkedIn import. Fetches the OpenID `/v2/userinfo` endpoint with
 * the user's stored access token and writes basic profile fields back to
 * our DB. **Does NOT** include work experience, education, or skills —
 * LinkedIn restricts the `r_fullprofile` scope to enterprise Marketing
 * Partner Program members, which we aren't. Users wanting their full work
 * history should use the LinkedIn PDF resume flow (export their profile
 * as PDF from LinkedIn and upload it via /api/cv/upload).
 *
 * What we get from userinfo:
 *   - sub (LinkedIn ID)
 *   - email + email_verified
 *   - name / given_name / family_name
 *   - picture (profile image URL)
 *   - locale (e.g. "en_US")
 *
 * Persisted fields:
 *   users.full_name        ← name
 *   users.profile_picture_url ← picture (only if not already set)
 *   users.location         ← locale country code (very coarse, only if blank)
 *
 * Body params:
 *   profileId (optional) — when set, also writes name as profile_name's
 *     fallback; we don't touch the user's existing skills / work_experience
 *     because we have no LinkedIn data for those.
 *
 * The response is intentionally rich so the caller can show the user what
 * they imported and prompt them about the PDF flow for the rest.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

// Map LinkedIn's locale country code → free-text we can put in users.location.
// LinkedIn doesn't give us city, just locale (e.g. "en_US", "tr_TR"), so this
// is a coarse fallback at best.
function localeToLocation(locale: unknown): string | null {
  if (typeof locale === "string") {
    const cc = locale.split("_")[1];
    return cc ? cc.toUpperCase() : null;
  }
  if (locale && typeof locale === "object" && "country" in locale) {
    const cc = (locale as { country?: unknown }).country;
    return typeof cc === "string" ? cc.toUpperCase() : null;
  }
  return null;
}

export async function POST() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        linkedin_access_token: true,
        linkedin_id: true,
        full_name: true,
        profile_picture_url: true,
        location: true,
        position: true,
      },
    });

    if (!dbUser?.linkedin_access_token) {
      return NextResponse.json(
        {
          error: "No LinkedIn account linked. Sign in with LinkedIn first, then come back.",
          code: "not_linked",
          // Caller can use this to surface the alternative path immediately.
          alt: "linkedin_pdf_upload",
        },
        { status: 400 }
      );
    }

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${dbUser.linkedin_access_token}` },
    });

    if (!profileRes.ok) {
      if (profileRes.status === 401) {
        return NextResponse.json(
          {
            error: "LinkedIn access token expired. Sign in with LinkedIn again to refresh it.",
            code: "token_expired",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "LinkedIn rejected the request. Try again later." },
        { status: 502 }
      );
    }

    const li = await profileRes.json() as {
      sub?: string;
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
      locale?: string | { country?: string };
      // Note: `headline` is NOT a standard OIDC field; LinkedIn occasionally
      // includes it but most accounts won't return it via /userinfo.
      headline?: string;
    };

    const fullName = li.name?.trim()
      || `${li.given_name ?? ""} ${li.family_name ?? ""}`.trim()
      || null;
    const headline = li.headline?.trim() || null;
    const locationFromLocale = localeToLocation(li.locale);

    // Persist to users table — but be defensive: never clobber a non-empty
    // value the user (or a previous import) already set. LinkedIn's OIDC
    // userinfo is the LEAST-detailed source we have for profile data; if
    // /profile already has a richer value from a CV import, keep that.
    const updates: Record<string, string | null> = {};
    if (fullName && !dbUser.full_name) updates.full_name = fullName;
    if (li.picture && !dbUser.profile_picture_url) updates.profile_picture_url = li.picture;
    if (locationFromLocale && !dbUser.location) updates.location = locationFromLocale;
    if (headline && !dbUser.position) updates.position = headline;

    if (Object.keys(updates).length > 0) {
      await prisma.users.update({
        where: { id: user.id },
        data: updates,
      });
    }

    // Build the response payload. `imported` lists the fields we actually
    // wrote (so the UI can say "Imported: full_name, profile_picture_url"
    // instead of "Imported: 4 fields"); `available` is everything we got
    // from LinkedIn even if we didn't persist it.
    const available = {
      full_name: fullName,
      email: li.email ?? null,
      picture: li.picture ?? null,
      headline,
      locale: typeof li.locale === "string" ? li.locale : (li.locale?.country ?? null),
      linkedin_id: li.sub ?? null,
    };

    return NextResponse.json({
      ok: true,
      imported: Object.keys(updates),
      available,
      // Tell the caller LOUDLY that work history isn't here. This is the
      // single most-confusing thing about LinkedIn integration — users
      // expect their work history to come over and it can't.
      note: "LinkedIn's API doesn't expose work experience, education, or skills to third-party apps. To import those, export your LinkedIn profile as PDF (Profile → More → Save to PDF) and upload it via 'Upload CV'.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
