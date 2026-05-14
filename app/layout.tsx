import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Buzz2Remote - Find Remote Jobs Worldwide",
    template: "%s | Buzz2Remote",
  },
  description:
    "Discover thousands of remote jobs from top companies. AI-powered job matching, salary estimation, and career tools.",
  keywords: ["remote jobs", "work from home", "remote work", "job search", "careers"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, "antialiased", "bg-background")} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col text-foreground">
        {/* AnimatedBackground sits BEFORE Providers so it can render even
            during the initial paint (the orbs are server-rendered, no
            client JS, no hydration cost). z-index: -1 in CSS keeps it
            behind page content.

            IMPORTANT: bg-background MUST live on <html>, NOT on <body>.
            When body has a bg-color AND we have z-index: -1 children of
            body, real-world browsers paint body's bg-color OVER the
            negative-z-index child — the spec says canvas-bg-propagation
            should put the bg below everything, but Chrome/Safari treat
            body as a stacking context once it has a bg-color in practice
            and the orbs disappear behind it. User reported "ben FE arka
            planında bir efekt görmüyorum" even in incognito — that's
            this exact bug. Moving the bg up to <html> sidesteps it. */}
        <AnimatedBackground />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
