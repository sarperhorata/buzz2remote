"use client";

/**
 * Light/dark theme toggle.
 *
 * Cycles light → dark → system on click (3 states). We show the icon for
 * the CURRENT resolved theme so the user can see at a glance what mode
 * they're in:
 *   - System mode    → laptop icon (means "follow OS")
 *   - Light mode     → sun
 *   - Dark mode      → moon
 *
 * Hydration: next-themes can't know the user's theme during SSR because
 * it lives in localStorage / matchMedia, so the first client render must
 * NOT depend on `theme`. We render a stable placeholder (the sun) until
 * mounted, then swap to the correct icon. Without this, hydration warns
 * and the icon flickers.
 */

import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Server / pre-mount: render a placeholder with the same dimensions so
  // header layout is stable. aria-hidden + an a11y-only label so screen
  // readers don't shout "Sun" before they know the state.
  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-lg ${className}`}
        aria-label="Toggle theme"
        suppressHydrationWarning
      >
        <Sun className="size-4 opacity-50" />
      </button>
    );
  }

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;
  const label =
    theme === "dark"
      ? "Switch to system theme"
      : theme === "light"
        ? "Switch to dark mode"
        : "Switch to light mode";

  return (
    <button
      onClick={cycle}
      className={`p-2 rounded-lg hover:bg-muted transition-colors ${className}`}
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" />
    </button>
  );
}
