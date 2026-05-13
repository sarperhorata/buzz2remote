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
    <html lang="en" className={cn(inter.variable, "antialiased")} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        {/* AnimatedBackground sits BEFORE Providers so it can render even
            during the initial paint (the orbs are server-rendered, no
            client JS, no hydration cost). z-index: -1 in CSS keeps it
            behind everything. */}
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
