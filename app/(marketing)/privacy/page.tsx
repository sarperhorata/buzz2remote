import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Buzz2Remote collects, uses, stores, and protects your data — including profile info, CVs, application history, and AI-processed content.",
};

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "data-we-collect", label: "2. Data we collect" },
  { id: "how-we-use", label: "3. How we use data" },
  { id: "legal-basis", label: "4. Legal basis (GDPR)" },
  { id: "ai-processing", label: "5. AI processing" },
  { id: "sharing", label: "6. Sharing & subprocessors" },
  { id: "retention", label: "7. Data retention" },
  { id: "security", label: "8. Security" },
  { id: "your-rights", label: "9. Your rights" },
  { id: "cookies", label: "10. Cookies & tracking" },
  { id: "transfers", label: "11. International transfers" },
  { id: "children", label: "12. Children" },
  { id: "changes", label: "13. Changes to this policy" },
  { id: "contact", label: "14. Contact & DPO" },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="border-b border-border bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="text-foreground">Privacy Policy</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Shield className="size-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Last updated: <time dateTime="2026-05-01">May 1, 2026</time> · GDPR & CCPA compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
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
                  className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-3xl">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4 mb-8">
              <p className="text-sm text-emerald-900">
                <BeeIcon size={16} className="inline mr-1 align-text-bottom" />
                <strong>Plain-language summary:</strong> We collect your profile data and CV
                to match you with jobs. We never sell your data. AI features run on Groq
                (open-weight Llama). You can export or delete your data anytime from your
                settings. Full legal detail below.
              </p>
            </div>

            <Section id="introduction" title="1. Introduction">
              <p>
                This Privacy Policy describes how Buzz2Remote (&quot;we&quot;, &quot;us&quot;)
                collects, uses, shares, and protects information about you when you use the
                Service. We act as the data controller for personal data we collect about you
                directly. By using the Service, you consent to the practices described here.
              </p>
            </Section>

            <Section id="data-we-collect" title="2. Data we collect">
              <h3>Account &amp; profile data</h3>
              <ul>
                <li><strong>Identity:</strong> name, email address, password hash, profile photo.</li>
                <li><strong>Profile:</strong> job title, bio, skills, work experience, education, location, languages.</li>
                <li><strong>CV / resume:</strong> uploaded files and extracted text content.</li>
                <li><strong>Preferences:</strong> target roles, salary expectations, remote/location filters.</li>
              </ul>
              <h3>Activity data</h3>
              <ul>
                <li><strong>Application history:</strong> jobs viewed, liked, dismissed, applied to, click timestamps.</li>
                <li><strong>AI-tool usage:</strong> when you run CV review, career diagnosis, coaching chats, top-matches generation.</li>
                <li><strong>Interaction logs:</strong> page views, feature usage, search queries (de-identified after 90 days).</li>
              </ul>
              <h3>Technical data</h3>
              <ul>
                <li>IP address, browser type, device type, operating system, approximate location (derived from IP).</li>
                <li>Session cookies for authentication; preference cookies; no third-party advertising cookies.</li>
              </ul>
              <h3>Third-party sign-in data</h3>
              <ul>
                <li>
                  If you sign in with Google or LinkedIn, we receive your name, email, profile
                  photo, and (for LinkedIn imports) work-experience data you explicitly
                  authorize. We do not receive your password.
                </li>
              </ul>
            </Section>

            <Section id="how-we-use" title="3. How we use your data">
              <ul>
                <li><strong>Service delivery:</strong> matching you with jobs, generating AI insights, tracking applications.</li>
                <li><strong>Personalization:</strong> ranking matches against your profile, surfacing relevant employers.</li>
                <li><strong>Communications:</strong> account notifications, job alerts (opt-in), product updates.</li>
                <li><strong>Service improvement:</strong> aggregated analytics, fraud prevention, debugging.</li>
                <li><strong>Legal compliance:</strong> tax records, responding to lawful requests.</li>
              </ul>
              <p>
                We do <strong>not</strong> sell your personal data. We do not use your data for
                third-party advertising or behavioral targeting.
              </p>
            </Section>

            <Section id="legal-basis" title="4. Legal basis (GDPR)">
              <p>For users in the EEA, UK, and Switzerland, our legal bases for processing are:</p>
              <ul>
                <li><strong>Contract:</strong> to provide the Service you signed up for (account, matching, applications).</li>
                <li><strong>Consent:</strong> for marketing emails, optional features (e.g., LinkedIn import). You may withdraw consent anytime.</li>
                <li><strong>Legitimate interest:</strong> to operate, secure, and improve the Service.</li>
                <li><strong>Legal obligation:</strong> tax, accounting, and lawful-request compliance.</li>
              </ul>
            </Section>

            <Section id="ai-processing" title="5. AI processing">
              <p>
                AI features (CV review, career diagnosis, LinkedIn optimizer, AI coaching, top
                matches, match scoring) are powered by{" "}
                <a
                  href="https://groq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline hover:text-emerald-800"
                >
                  Groq Inc.
                </a>{" "}
                running open-weight Llama models. When you use these features:
              </p>
              <ul>
                <li>The relevant portion of your profile (e.g., CV text, job description, chat message) is sent to Groq for inference.</li>
                <li>Groq processes the request and returns a response. Per Groq&apos;s policy, prompts and outputs are not used to train models.</li>
                <li>We store the AI output linked to your account so you can review it later (e.g., diagnosis results, chat history).</li>
                <li>You can delete AI-generated content at any time from your settings.</li>
              </ul>
              <p>
                AI output is generated probabilistically and may contain inaccuracies. Treat it
                as informational only — see the{" "}
                <Link href="/terms#ai" className="text-emerald-700 underline hover:text-emerald-800">
                  Terms of Service
                </Link>{" "}
                for full AI disclaimers.
              </p>
            </Section>

            <Section id="sharing" title="6. Sharing & subprocessors">
              <p>
                We share your data only with essential service providers under contractual data-protection obligations:
              </p>
              <ul>
                <li><strong>Neon</strong> — PostgreSQL database hosting (your profile, applications, AI history).</li>
                <li><strong>Vercel</strong> — application hosting and edge delivery.</li>
                <li><strong>Groq</strong> — AI inference (see Section 5).</li>
                <li><strong>Stripe</strong> — payment processing for Pro subscriptions (we never see your card details).</li>
                <li><strong>Mailgun</strong> — transactional email delivery (welcome, password reset, alerts).</li>
                <li><strong>Google &amp; LinkedIn</strong> — OAuth sign-in (if you choose to use them).</li>
              </ul>
              <p>
                Additionally, when you click <em>Apply</em> on a job, you are redirected to the
                employer&apos;s applicant-tracking system (Greenhouse, Lever, Ashby, etc.). Data you
                submit on those sites is governed by their privacy policies — we are not involved.
              </p>
            </Section>

            <Section id="retention" title="7. Data retention">
              <ul>
                <li><strong>Active accounts:</strong> we retain your data while your account is active.</li>
                <li><strong>Deleted accounts:</strong> we delete your profile, CV, and AI history within 30 days, except where retention is required by law (e.g., tax records for 5–10 years).</li>
                <li><strong>Inactive accounts:</strong> if you don&apos;t sign in for 24 months, we send a reactivation email; if there&apos;s no response within 30 days, the account is deleted.</li>
                <li><strong>Application logs:</strong> de-identified after 90 days; aggregated analytics kept indefinitely.</li>
                <li><strong>Email logs:</strong> kept for 1 year for deliverability debugging.</li>
              </ul>
            </Section>

            <Section id="security" title="8. Security">
              <p>We protect your data with:</p>
              <ul>
                <li><strong>Encryption in transit:</strong> all traffic over HTTPS/TLS 1.3.</li>
                <li><strong>Encryption at rest:</strong> database and file storage are encrypted.</li>
                <li><strong>Password hashing:</strong> bcrypt with strong salting (we never store plaintext passwords).</li>
                <li><strong>Access controls:</strong> least-privilege internal access, audit logs, MFA for staff.</li>
                <li><strong>Apply-URL hardening:</strong> destination ATS URLs are accessed only via a server-side auth-gated redirect — they never reach client-side JavaScript or analytics.</li>
              </ul>
              <p>
                No system is perfectly secure. Report suspected vulnerabilities to{" "}
                <a href="mailto:security@buzz2remote.com" className="text-emerald-700 underline hover:text-emerald-800">security@buzz2remote.com</a>.
              </p>
            </Section>

            <Section id="your-rights" title="9. Your rights">
              <p>
                Depending on your jurisdiction (GDPR, CCPA, etc.), you may have the following rights:
              </p>
              <ul>
                <li><strong>Access:</strong> request a copy of your data.</li>
                <li><strong>Rectification:</strong> correct inaccurate data (or do it yourself in profile settings).</li>
                <li><strong>Erasure:</strong> delete your account and associated data.</li>
                <li><strong>Restriction:</strong> limit how we process your data.</li>
                <li><strong>Portability:</strong> export your profile and CV in a machine-readable format.</li>
                <li><strong>Objection:</strong> opt out of marketing emails, legitimate-interest processing.</li>
                <li><strong>Withdraw consent:</strong> revoke consent for optional features at any time.</li>
                <li><strong>Lodge a complaint:</strong> contact your local data-protection authority.</li>
              </ul>
              <p>
                Exercise these rights from your{" "}
                <Link href="/settings" className="text-emerald-700 underline hover:text-emerald-800">account settings</Link>{" "}
                or email{" "}
                <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 underline hover:text-emerald-800">privacy@buzz2remote.com</a>.
                We respond within 30 days.
              </p>
            </Section>

            <Section id="cookies" title="10. Cookies & tracking">
              <p>We use a minimal cookie set:</p>
              <ul>
                <li><strong>Strictly necessary:</strong> session cookies (authentication), CSRF protection.</li>
                <li><strong>Preferences:</strong> remembering your filter settings, theme.</li>
                <li><strong>No third-party advertising or behavioral-tracking cookies.</strong></li>
              </ul>
              <p>
                You can clear cookies through your browser, but doing so will sign you out.
              </p>
            </Section>

            <Section id="transfers" title="11. International transfers">
              <p>
                Our infrastructure spans multiple regions. Your data may be processed in the
                United States (Vercel, Neon, Groq) and the European Union. Transfers from the
                EEA, UK, or Switzerland rely on Standard Contractual Clauses approved by the
                European Commission.
              </p>
            </Section>

            <Section id="children" title="12. Children">
              <p>
                Buzz2Remote is not directed at children under 16. We do not knowingly collect
                personal data from anyone under 16. If you believe a child has provided us
                with data, contact us at{" "}
                <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 underline hover:text-emerald-800">privacy@buzz2remote.com</a>{" "}
                and we will delete it.
              </p>
            </Section>

            <Section id="changes" title="13. Changes to this policy">
              <p>
                We may update this Privacy Policy from time to time. Material changes will be
                announced via email or in-app notification at least 14 days before they take
                effect. The &quot;Last updated&quot; date at the top reflects the current
                version. Continued use of the Service after the effective date constitutes
                acceptance of the revised policy.
              </p>
            </Section>

            <Section id="contact" title="14. Contact & DPO">
              <p>
                For privacy questions, data-rights requests, or to reach our Data Protection
                Officer:
              </p>
              <ul>
                <li><strong>Email:</strong> <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 underline hover:text-emerald-800">privacy@buzz2remote.com</a></li>
                <li><strong>General contact:</strong> <a href="mailto:hello@buzz2remote.com" className="text-emerald-700 underline hover:text-emerald-800">hello@buzz2remote.com</a></li>
                <li><strong>Security:</strong> <a href="mailto:security@buzz2remote.com" className="text-emerald-700 underline hover:text-emerald-800">security@buzz2remote.com</a></li>
              </ul>
              <p>
                See also our{" "}
                <Link href="/terms" className="text-emerald-700 underline hover:text-emerald-800">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/contact" className="text-emerald-700 underline hover:text-emerald-800">contact page</Link>.
              </p>
            </Section>

            <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
              <p>
                This Privacy Policy is written in English. Translations are provided for
                convenience; in case of conflict, the English version controls.
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
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
        <a
          href={`#${id}`}
          className="hover:text-emerald-700 transition-colors"
          aria-label={`Link to ${title}`}
        >
          {title}
        </a>
      </h2>
      <div className="text-foreground/80 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:text-foreground/80 [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2">
        {children}
      </div>
    </section>
  );
}
