import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions that govern your use of Buzz2Remote — our remote-jobs marketplace, AI career tools, and Pro features.",
};

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "eligibility", label: "2. Eligibility & accounts" },
  { id: "service", label: "3. The service" },
  { id: "conduct", label: "4. User conduct" },
  { id: "content", label: "5. Your content" },
  { id: "jobs", label: "6. Job listings" },
  { id: "ai", label: "7. AI features" },
  { id: "subscriptions", label: "8. Subscriptions & billing" },
  { id: "cancellation", label: "9. Cancellation & refunds" },
  { id: "ip", label: "10. Intellectual property" },
  { id: "termination", label: "11. Termination" },
  { id: "disclaimers", label: "12. Disclaimers" },
  { id: "liability", label: "13. Limitation of liability" },
  { id: "indemnity", label: "14. Indemnification" },
  { id: "changes", label: "15. Changes to these terms" },
  { id: "law", label: "16. Governing law" },
  { id: "contact", label: "17. Contact" },
];

export default function TermsPage() {
  return (
    <div className="bg-card">
      {/* Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="text-foreground">Terms of Service</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Scale className="size-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Terms of Service
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Last updated: <time dateTime="2026-05-01">May 1, 2026</time> · Effective immediately
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body: TOC + content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                On this page
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-3xl">
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-8">
              <p className="text-sm text-amber-900">
                <BeeIcon size={16} className="inline mr-1 align-text-bottom" />
                <strong>Plain-language summary:</strong> Buzz2Remote helps you find remote jobs.
                Be honest with your profile, don&apos;t spam, don&apos;t scrape, and respect
                everyone&apos;s data. Pro plans bill monthly with a 14-day trial — cancel anytime.
                Full legal language follows below.
              </p>
            </div>

            <Section id="introduction" title="1. Introduction">
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of
                Buzz2Remote (the &quot;Service&quot;), operated by Buzz2Remote (&quot;we&quot;,
                &quot;us&quot;, or &quot;our&quot;). By creating an account or otherwise using
                the Service, you agree to be bound by these Terms and our{" "}
                <Link href="/privacy" className="text-amber-700 underline hover:text-amber-800">Privacy Policy</Link>.
                If you do not agree, do not use the Service.
              </p>
            </Section>

            <Section id="eligibility" title="2. Eligibility & accounts">
              <p>
                You must be at least 16 years old to use Buzz2Remote. By registering you confirm
                that the information you provide is accurate and that you are legally permitted
                to enter into binding agreements in your jurisdiction.
              </p>
              <p>
                You are responsible for safeguarding your password and any activities that occur
                under your account. Notify us immediately at{" "}
                <a href="mailto:security@buzz2remote.com" className="text-amber-700 underline hover:text-amber-800">security@buzz2remote.com</a>{" "}
                if you suspect unauthorized use.
              </p>
            </Section>

            <Section id="service" title="3. The service">
              <p>
                Buzz2Remote provides a curated remote-jobs marketplace, AI-powered career tools
                (CV review, career diagnosis, LinkedIn optimization, AI coaching), employer
                matching, and application tracking. Specific features may vary by subscription
                tier and are subject to change.
              </p>
            </Section>

            <Section id="conduct" title="4. User conduct">
              <p>You agree not to:</p>
              <ul>
                <li>Submit false, misleading, or fraudulent information in your profile or applications.</li>
                <li>Scrape, crawl, or otherwise extract data from the Service without our written consent.</li>
                <li>Use the Service to send spam, unsolicited messages, or harass any user or employer.</li>
                <li>Attempt to gain unauthorized access to other accounts, systems, or data.</li>
                <li>Reverse-engineer, decompile, or interfere with the Service&apos;s underlying infrastructure.</li>
                <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
              </ul>
            </Section>

            <Section id="content" title="5. Your content">
              <p>
                You retain ownership of the content you submit (CVs, profile info, messages).
                By submitting content, you grant us a worldwide, royalty-free license to use,
                store, reproduce, and display that content solely to operate and improve the
                Service — including processing it through AI models for features you request.
              </p>
              <p>
                You represent that you have all necessary rights to submit the content and
                that it does not violate any third party&apos;s rights.
              </p>
            </Section>

            <Section id="jobs" title="6. Job listings">
              <p>
                Job listings are aggregated from third-party ATS platforms (Greenhouse, Lever,
                Ashby, Workable, etc.) and direct employer submissions. We do not employ or
                sponsor candidates, do not guarantee the accuracy, availability, or legitimacy
                of any listing, and are not a party to any employment relationship that may
                arise from your use of the Service.
              </p>
              <p>
                Apply at your own discretion. We strongly recommend verifying employer details
                independently before sharing sensitive information.
              </p>
            </Section>

            <Section id="ai" title="7. AI features">
              <p>
                The Service uses third-party AI models (currently Groq running open-weight
                Llama models) to power features such as CV review, career diagnosis, match
                scoring, and chat coaching. AI output is generated probabilistically and may
                contain inaccuracies, biases, or fabrications.
              </p>
              <p>
                <strong>AI output is informational only.</strong> It is not professional,
                career, legal, financial, or medical advice. Verify important decisions with
                qualified human advisors. We are not liable for actions you take based on AI
                output.
              </p>
            </Section>

            <Section id="subscriptions" title="8. Subscriptions & billing">
              <p>
                Pro subscriptions are billed through Stripe on a recurring monthly or annual
                basis. The plan tier, price, and renewal cadence are displayed at checkout and
                in your account settings. All amounts are in the currency shown at checkout and
                exclude applicable taxes.
              </p>
              <p>
                New Pro subscriptions include a 14-day free trial. You will not be charged
                until the trial ends. By starting a trial, you authorize us to charge your
                payment method at the end of the trial unless you cancel beforehand.
              </p>
            </Section>

            <Section id="cancellation" title="9. Cancellation & refunds">
              <p>
                You may cancel your subscription at any time from your account settings.
                Cancellations take effect at the end of the current billing period — you
                retain Pro access until then. We do not issue prorated refunds for partial
                periods except where required by applicable consumer-protection law.
              </p>
              <p>
                If you believe you were charged in error, contact{" "}
                <a href="mailto:billing@buzz2remote.com" className="text-amber-700 underline hover:text-amber-800">billing@buzz2remote.com</a>{" "}
                within 30 days of the charge.
              </p>
            </Section>

            <Section id="ip" title="10. Intellectual property">
              <p>
                The Service, including its design, code, branding, content (excluding user
                content), and underlying technology, is owned by Buzz2Remote and protected by
                copyright, trademark, and other intellectual-property laws. You receive a
                limited, non-exclusive, non-transferable license to use the Service for its
                intended purpose.
              </p>
            </Section>

            <Section id="termination" title="11. Termination">
              <p>
                We may suspend or terminate your account, with or without notice, if you
                violate these Terms, abuse the Service, or for any other reason at our
                reasonable discretion. Upon termination, your right to use the Service ceases,
                though certain provisions (intellectual property, disclaimers, liability
                limits) survive.
              </p>
            </Section>

            <Section id="disclaimers" title="12. Disclaimers">
              <p>
                The Service is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong>{" "}
                without warranties of any kind, express or implied, including but not limited
                to merchantability, fitness for a particular purpose, and non-infringement.
                We do not warrant that the Service will be uninterrupted, error-free, secure,
                or that AI output will be accurate.
              </p>
            </Section>

            <Section id="liability" title="13. Limitation of liability">
              <p>
                To the maximum extent permitted by law, Buzz2Remote and its affiliates,
                officers, employees, and agents will not be liable for any indirect,
                incidental, special, consequential, or punitive damages, including loss of
                profits, data, or goodwill, arising from your use of the Service. Our total
                cumulative liability for any claim arising under these Terms is limited to
                the amount you paid us in the 12 months preceding the claim, or USD 50,
                whichever is greater.
              </p>
            </Section>

            <Section id="indemnity" title="14. Indemnification">
              <p>
                You agree to indemnify and hold harmless Buzz2Remote from any claims, damages,
                or expenses (including reasonable legal fees) arising from your use of the
                Service, your content, or your violation of these Terms or any applicable law.
              </p>
            </Section>

            <Section id="changes" title="15. Changes to these terms">
              <p>
                We may update these Terms from time to time. Material changes will be
                announced via email or in-app notification at least 14 days before they take
                effect. Continued use of the Service after the effective date constitutes
                acceptance of the revised Terms.
              </p>
            </Section>

            <Section id="law" title="16. Governing law">
              <p>
                These Terms are governed by the laws of the Republic of Turkey, without regard
                to conflict-of-law principles. Disputes will be resolved exclusively in the
                courts of Istanbul, Turkey, except where mandatory consumer-protection law of
                your jurisdiction provides otherwise.
              </p>
            </Section>

            <Section id="contact" title="17. Contact">
              <p>
                Questions about these Terms? Reach us at{" "}
                <a href="mailto:legal@buzz2remote.com" className="text-amber-700 underline hover:text-amber-800">legal@buzz2remote.com</a>{" "}
                or visit our{" "}
                <Link href="/contact" className="text-amber-700 underline hover:text-amber-800">contact page</Link>.
                For privacy-specific questions see our{" "}
                <Link href="/privacy" className="text-amber-700 underline hover:text-amber-800">Privacy Policy</Link>.
              </p>
            </Section>

            {/* Footer note */}
            <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
              <p>
                These Terms are written in English. Translations are provided for convenience;
                in case of conflict, the English version controls.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group">
        <a
          href={`#${id}`}
          className="hover:text-amber-700 transition-colors"
          aria-label={`Link to ${title}`}
        >
          {title}
        </a>
      </h2>
      <div className="text-foreground/80 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:text-foreground/80">
        {children}
      </div>
    </section>
  );
}
