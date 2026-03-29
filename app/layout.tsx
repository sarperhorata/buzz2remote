import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className={cn("h-full", "antialiased", inter.className, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
