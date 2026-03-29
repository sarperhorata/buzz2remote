import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function POST() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    // Get the user's LinkedIn access token
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        linkedin_access_token: true,
        linkedin_id: true,
      },
    });

    if (!dbUser?.linkedin_access_token) {
      return NextResponse.json(
        { error: "No LinkedIn account linked. Please sign in with LinkedIn first." },
        { status: 400 }
      );
    }

    // Fetch basic profile from LinkedIn API
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${dbUser.linkedin_access_token}`,
      },
    });

    if (!profileRes.ok) {
      // Token might be expired
      if (profileRes.status === 401) {
        return NextResponse.json(
          { error: "LinkedIn access token expired. Please sign in with LinkedIn again to refresh it." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch LinkedIn profile" },
        { status: 500 }
      );
    }

    const linkedinProfile = await profileRes.json();

    // Map LinkedIn profile to our format
    const profile = {
      full_name: linkedinProfile.name || `${linkedinProfile.given_name || ""} ${linkedinProfile.family_name || ""}`.trim(),
      bio: linkedinProfile.headline || null,
      location: linkedinProfile.locale?.country || null,
      company: null, // Not available in basic profile
      position: linkedinProfile.headline || null,
      skills: [] as string[],
    };

    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}
