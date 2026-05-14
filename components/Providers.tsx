"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/*
          next-themes:
          - attribute="class"   → toggles the .dark class on <html>, which our
                                  globals.css already styles (light tokens on
                                  :root, dark tokens on .dark)
          - defaultTheme="system" + enableSystem=true → respects the browser's
                                  prefers-color-scheme automatically on first
                                  visit; user can still override via the
                                  toggle in Header
          - disableTransitionOnChange → avoids the "everything fades together"
                                        flash when the user clicks the toggle
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
