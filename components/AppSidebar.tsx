"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";

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
      { href: "/favorites", label: "Saved Jobs", icon: Heart },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "IMPROVE YOUR PROFILE",
    items: [
      { href: "/profile", label: "Profile", icon: User },
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

  const isActive = (href: string) => {
    // Exact match for dashboard to avoid matching everything
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <BeeIcon size={30} className="group-hover:scale-110 transition-transform duration-200" />
          <span className="text-lg font-bold">
            <span className="text-amber-500">Buzz</span>
            <span className="text-foreground">2Remote</span>
          </span>
        </Link>
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
                          : "text-muted-foreground hover:bg-gray-50 hover:text-foreground border-l-2 border-transparent"
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
    </aside>
  );
}
