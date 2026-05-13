"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Stethoscope,
  Send,
  Briefcase,
  User,
  FileText,
  Link2,
  MessageCircle,
  Heart,
  Bell,
  Settings,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/career-diagnosis", label: "Career Diagnosis", icon: Stethoscope },
    ],
  },
  {
    label: "OPPORTUNITIES",
    items: [
      { href: "/jobs", label: "All Matches", icon: Briefcase },
      { href: "/applications", label: "Applications", icon: Send },
      { href: "/top-matches", label: "Top Matches", icon: Sparkles },
      { href: "/favorites", label: "Saved Jobs", icon: Heart },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "IMPROVE YOUR PROFILE",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/cv-builder", label: "CV Builder", icon: FileText },
      { href: "/cv-review", label: "CV Review", icon: FileText },
      { href: "/linkedin-optimizer", label: "LinkedIn Optimizer", icon: Link2 },
      { href: "/coaching", label: "Coaching", icon: MessageCircle },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer when navigating to a new route.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const isActive = (href: string) => {
    // Exact match for dashboard to avoid matching everything
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Top bar — mobile drawer shows logo + close button; desktop just has a
          divider since the global Header already shows the brand. */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0 md:hidden">
        <Link href="/" className="flex items-center gap-2 group">
          <BeeIcon size={30} className="group-hover:scale-110 transition-transform duration-200" />
          <span className="text-lg font-bold">
            <span className="text-amber-500">Buzz</span>
            <span className="text-foreground">2Remote</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-muted-foreground" />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-muted text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.label && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 mt-4">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-amber-50 text-amber-700 border-l-2 border-amber-500"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-amber-600" : "text-muted-foreground"
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile open button — sits in the global Header strip (z above the
          Header) so it doesn't overlap with page content. The global Header is
          hidden on app routes via app/(app)/layout.tsx, leaving this hamburger
          + the brand link as the mobile chrome. */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-3 left-3 z-[60] bg-card border border-border rounded-lg p-2 shadow-md text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      )}

      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex w-64 min-h-screen bg-card border-r border-border flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer — slides in from left */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="md:hidden fixed top-0 left-0 z-50 w-64 h-screen bg-card border-r border-border flex flex-col shadow-xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
