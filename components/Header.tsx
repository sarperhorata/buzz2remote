"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">Buzz2Remote</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              Jobs
            </Link>
            <Link href="/companies" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              Companies
            </Link>
            <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              Pricing
            </Link>

            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
                  Dashboard
                </Link>
                <Link href="/applications" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
                  Applications
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-500 hover:text-red-500 transition"
                >
                  Sign Out
                </button>
                <Link
                  href="/profile"
                  className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium"
                >
                  {session.user?.name?.[0]?.toUpperCase() || "U"}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/jobs" className="block py-2 text-gray-700 dark:text-gray-300">Jobs</Link>
            <Link href="/companies" className="block py-2 text-gray-700 dark:text-gray-300">Companies</Link>
            <Link href="/pricing" className="block py-2 text-gray-700 dark:text-gray-300">Pricing</Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block py-2 text-gray-700 dark:text-gray-300">Dashboard</Link>
                <Link href="/profile" className="block py-2 text-gray-700 dark:text-gray-300">Profile</Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="block py-2 text-red-500">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-gray-700 dark:text-gray-300">Sign In</Link>
                <Link href="/register" className="block py-2 text-blue-600 font-medium">Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
