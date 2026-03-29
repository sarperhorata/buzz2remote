"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogOut, User, Settings, LayoutDashboard, FileText, Briefcase, Building2, CreditCard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeeIcon } from "@/components/BeeIcon";

const navLinks = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <BeeIcon size={36} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xl font-bold gradient-text">Buzz2Remote</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="gradient-primary rounded-full size-9 flex items-center justify-center text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-popover text-popover-foreground shadow-xl animate-slide-down z-50">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                          <User className="size-4" />Profile
                        </Link>
                        <Link href="/applications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                          <FileText className="size-4" />Applications
                        </Link>
                        <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                          <Settings className="size-4" />Settings
                        </Link>
                      </div>
                      <div className="border-t p-1">
                        <button
                          onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                          className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full"
                        >
                          <LogOut className="size-4" />Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
                  Sign In
                </Link>
                <Button asChild className="gradient-primary text-white border-0 shadow-md hover:shadow-lg transition-all">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  <link.icon className="size-4 text-muted-foreground" />
                  {link.label}
                </Link>
              ))}

              <div className="my-2 border-t" />

              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <LayoutDashboard className="size-4 text-muted-foreground" />Dashboard
                  </Link>
                  <Link href="/applications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <FileText className="size-4 text-muted-foreground" />Applications
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <User className="size-4 text-muted-foreground" />Profile
                  </Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <Settings className="size-4 text-muted-foreground" />Settings
                  </Link>
                  <div className="my-2 border-t" />
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="size-4" />Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="mt-1 block">
                    <Button className="w-full gradient-primary text-white border-0">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
