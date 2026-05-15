"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

/**
 * Reads URL params set by OAuth callbackUrl to fire a "Login successful"
 * toast after Google / LinkedIn sign-in lands the user on /dashboard (or any
 * onboarding-aware route). Strips the query param via history.replaceState so
 * a hard reload doesn't re-fire the toast.
 *
 * Mounted once at the Providers level — works regardless of where the OAuth
 * redirect lands (dashboard, onboarding, etc.).
 */
export function LoginToastWatcher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const welcome = searchParams.get("welcome");
    const authError = searchParams.get("error");

    if (welcome === "1") {
      toast.success("Login successful", {
        description: "Welcome back to Buzz2Remote.",
      });
      // Strip the query param so refresh doesn't re-trigger.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("welcome");
      const next = params.toString();
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    }

    if (authError) {
      // NextAuth lands us on /login?error=... on OAuth failure. Surface the
      // error code so users (and we) see what went wrong instead of a silent
      // bounce.
      const messages: Record<string, string> = {
        OAuthSignin: "Couldn't start the sign-in flow. Please try again.",
        OAuthCallback: "The sign-in provider returned an error.",
        OAuthCreateAccount: "We couldn't create your account. Try a different method.",
        EmailCreateAccount: "We couldn't create your account.",
        Callback: "Sign-in callback failed.",
        OAuthAccountNotLinked:
          "This email is already linked to a different sign-in method.",
        EmailSignin: "We couldn't send the sign-in email.",
        CredentialsSignin: "Invalid email or password.",
        SessionRequired: "Please sign in to continue.",
        Configuration: "Auth configuration error — please contact support.",
        AccessDenied: "Sign-in denied.",
        Default: "Something went wrong during sign-in.",
      };
      toast.error("Sign-in failed", {
        description: messages[authError] ?? messages.Default,
      });
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const next = params.toString();
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}
