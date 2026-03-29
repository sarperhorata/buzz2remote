"use client";

import { HelpCircle, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const faqs = [
  { q: "How do I search for remote jobs?", a: "Use the search bar on the Jobs page to filter by title, location, skills, and more. You can also use advanced filters to narrow down results." },
  { q: "Is Buzz2Remote free to use?", a: "Yes! Basic features are free. Premium plans offer AI-powered tools and unlimited applications." },
  { q: "How does AI CV analysis work?", a: "Upload your CV and our AI (powered by Groq) analyzes it for strengths, weaknesses, and ATS compatibility." },
  { q: "Can I save jobs for later?", a: "Yes, click the save/bookmark button on any job listing to add it to your favorites." },
  { q: "How do I cancel my subscription?", a: "Go to Settings > Manage Billing to cancel or change your subscription through Stripe." },
  { q: "How do job recommendations work?", a: "Our AI matches your skills and experience with available positions to suggest the best fits." },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const filtered = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 animate-float" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Help Center</h1>
          <p className="text-lg text-white/80">Find answers to common questions about Buzz2Remote.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* FAQ Accordion */}
        <Accordion className="space-y-3">
          {filtered.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="glass-card px-6 border-0">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                <div className="flex items-center gap-3">
                  <HelpCircle className="size-4 text-primary shrink-0" />
                  {faq.q}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 pl-7">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No matching questions found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}
