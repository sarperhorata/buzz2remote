import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Buzz2Remote collects, uses, stores, and protects your data — including profile info, CVs, application history, and AI-processed content. GDPR & CCPA compliant.",
};

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "controller", label: "2. Who we are (Controller)" },
  { id: "data-we-collect", label: "3. Data we collect" },
  { id: "how-we-use", label: "4. How we use data" },
  { id: "legal-basis", label: "5. Legal basis (GDPR)" },
  { id: "ai-processing", label: "6. AI processing" },
  { id: "automated-decisions", label: "7. Automated decisions" },
  { id: "sharing", label: "8. Subprocessors & sharing" },
  { id: "linkedin", label: "9. LinkedIn integration" },
  { id: "retention", label: "10. Data retention" },
  { id: "security", label: "11. Security" },
  { id: "breach", label: "12. Breach notification" },
  { id: "your-rights", label: "13. Your rights" },
  { id: "cookies", label: "14. Cookies & tracking" },
  { id: "transfers", label: "15. International transfers" },
  { id: "children", label: "16. Children" },
  { id: "ccpa", label: "17. CCPA notice (California)" },
  { id: "changes", label: "18. Changes to this policy" },
  { id: "contact", label: "19. Contact & DPO" },
];

export default function PrivacyPage() {
  return (
    <div className="bg-card">
      {/* Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="text-foreground">Privacy Policy</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Shield className="size-6 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Last updated: <time dateTime="2026-05-14">May 14, 2026</time> · Effective: May 14, 2026 · GDPR, UK GDPR &amp; CCPA compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
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
                  className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-3xl">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 rounded-r-lg p-4 mb-8">
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                <BeeIcon size={16} className="inline mr-1 align-text-bottom" />
                <strong>Plain-language summary:</strong> We collect your profile data and CV
                so we can match you with remote jobs. We never sell your data. AI features
                run on Groq (open-weight Llama, no model training on your prompts). You can
                export or delete your data anytime from your settings. We&apos;ll respond to
                any data-rights request within 30 days. Full legal detail below.
              </p>
            </div>

            <Section id="introduction" title="1. Introduction">
              <p>
                This Privacy Policy explains how <strong>Buzz2Remote</strong> (&quot;Buzz2Remote&quot;,
                &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, shares, and
                protects personal data about you (&quot;you&quot;, &quot;the user&quot;,
                &quot;data subject&quot;) when you use our website at{" "}
                <a href="https://buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">buzz2remote.com</a>,
                its subdomains, and the related applications and APIs (collectively, the
                &quot;Service&quot;).
              </p>
              <p>
                It applies to all personal data we process about you in our capacity as a
                <strong> data controller</strong> within the meaning of the EU General Data
                Protection Regulation 2016/679 (&quot;<strong>GDPR</strong>&quot;), the UK
                GDPR, and equivalent laws including the California Consumer Privacy Act
                (&quot;<strong>CCPA</strong>&quot;) and California Privacy Rights Act
                (&quot;<strong>CPRA</strong>&quot;).
              </p>
              <p>
                If you do not agree with this Policy, please do not use the Service.
              </p>
            </Section>

            <Section id="controller" title="2. Who we are (Data Controller)">
              <p>
                The controller of your personal data is Buzz2Remote. Until our entity is
                publicly registered, contact us at the addresses in Section 19 below.
              </p>
              <ul>
                <li><strong>Trading name:</strong> Buzz2Remote</li>
                <li><strong>Website:</strong> <a href="https://buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">buzz2remote.com</a></li>
                <li><strong>Privacy contact:</strong> <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a></li>
                <li><strong>Data Protection Officer (DPO):</strong> Not appointed (Buzz2Remote does not currently meet the GDPR Art. 37 mandatory-appointment threshold). Privacy requests are handled directly by the founder team at the address above.</li>
                <li><strong>EU representative (Art. 27 GDPR):</strong> Where required, we will appoint an EU representative once cross-border processing volumes warrant. Until then, contact us directly at the address above.</li>
              </ul>
            </Section>

            <Section id="data-we-collect" title="3. Data we collect">
              <h3>3.1 Account &amp; profile data (provided by you)</h3>
              <ul>
                <li><strong>Identity:</strong> name, email address, password hash (bcrypt), profile photo URL.</li>
                <li><strong>Profile:</strong> job title, professional bio, skills, work experience, education, location, languages, certifications.</li>
                <li><strong>CV / resume:</strong> uploaded files (PDF, DOCX, TXT) and extracted text content.</li>
                <li><strong>Job-search preferences:</strong> target roles, salary expectations, remote/location filters, employment-type filters.</li>
                <li><strong>Communication:</strong> messages you send via support, contact forms, AI coach conversations.</li>
              </ul>

              <h3>3.2 Activity data (generated by your use of the Service)</h3>
              <ul>
                <li><strong>Application activity:</strong> jobs viewed, liked, dismissed, applied to, click timestamps, application-status changes.</li>
                <li><strong>AI-tool usage:</strong> CV review runs, career-diagnosis runs, coaching chats, top-matches generations, LinkedIn-optimizer runs.</li>
                <li><strong>Interaction logs:</strong> page views, feature usage, search queries, filter selections.</li>
                <li><strong>Match scores:</strong> AI-generated scores indicating how well a job matches your profile.</li>
              </ul>

              <h3>3.3 Technical data (collected automatically)</h3>
              <ul>
                <li>IP address, browser type/version, device type, operating system, referrer URL.</li>
                <li>Approximate location derived from IP (city/country level — we do not collect GPS).</li>
                <li>Session and authentication cookies, CSRF tokens, preference cookies (theme, filters).</li>
                <li>Request logs and error traces for the past 30 days (debugging only).</li>
              </ul>

              <h3>3.4 Third-party sign-in data</h3>
              <ul>
                <li><strong>Google OAuth:</strong> name, email, profile photo, locale.</li>
                <li><strong>LinkedIn OpenID Connect:</strong> name, email, profile photo, locale. See Section 9 for full detail.</li>
                <li>We <strong>never</strong> receive your Google or LinkedIn password.</li>
              </ul>

              <h3>3.5 Payment data (when you subscribe to Pro)</h3>
              <ul>
                <li>We do <strong>not</strong> see or store your card number — payment is handled entirely by Stripe.</li>
                <li>We retain: Stripe customer ID, subscription tier, last 4 digits of card (for billing display), invoice history.</li>
              </ul>

              <h3>3.6 Data we do NOT collect</h3>
              <ul>
                <li>We do not collect special-category data (Art. 9 GDPR) — religion, sexual orientation, biometric/genetic data, etc. — beyond what you may voluntarily put in a CV. We treat any such data with elevated care.</li>
                <li>We do not collect data from third-party advertising networks.</li>
                <li>We do not use canvas/font/audio fingerprinting or any form of stealth tracking.</li>
              </ul>
            </Section>

            <Section id="how-we-use" title="4. How we use your data">
              <ul>
                <li><strong>Service delivery:</strong> creating your account, matching you with jobs, generating AI insights, tracking your applications, providing customer support.</li>
                <li><strong>Personalization:</strong> ranking matches against your profile, surfacing relevant employers, ordering search results.</li>
                <li><strong>Communications:</strong> account/security notifications (mandatory), job alerts (opt-in), product updates (opt-in), AI coaching responses (when initiated by you).</li>
                <li><strong>Service operation &amp; improvement:</strong> aggregated analytics, fraud and abuse prevention, debugging, capacity planning.</li>
                <li><strong>Compliance:</strong> meeting tax, accounting, and lawful-request obligations; responding to court orders.</li>
              </ul>
              <p>
                We do <strong>not</strong> sell your personal data, and we do not use your data
                for third-party advertising or behavioural targeting.
              </p>
            </Section>

            <Section id="legal-basis" title="5. Legal basis for processing (GDPR Art. 6)">
              <p>For users in the EEA, UK, and Switzerland, our legal bases are:</p>
              <ul>
                <li>
                  <strong>Performance of a contract</strong> (Art. 6(1)(b)) — to provide the
                  Service you signed up for: account, matching, applications tracking, payment
                  processing.
                </li>
                <li>
                  <strong>Consent</strong> (Art. 6(1)(a)) — for optional features that go
                  beyond the core Service: marketing emails, AI coaching, LinkedIn import,
                  saving cookies for non-essential preferences. You may withdraw consent at
                  any time from your settings — withdrawal does not affect prior processing.
                </li>
                <li>
                  <strong>Legitimate interest</strong> (Art. 6(1)(f)) — to operate, secure,
                  and improve the Service: aggregated analytics, fraud detection, debugging,
                  abuse prevention. We have conducted a Legitimate Interests Assessment
                  balancing our needs against your rights; you may object at any time
                  (Section 13).
                </li>
                <li>
                  <strong>Legal obligation</strong> (Art. 6(1)(c)) — tax records, accounting
                  laws, court orders.
                </li>
              </ul>
            </Section>

            <Section id="ai-processing" title="6. AI processing">
              <p>
                AI features (CV review, career diagnosis, AI coach, top-matches, LinkedIn
                optimizer, match scoring) are powered by{" "}
                <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline">Groq Inc.</a>{" "}
                running open-weight Llama 3.1 / 3.3 models.
              </p>
              <ul>
                <li>
                  <strong>What is sent:</strong> only the data needed to answer your specific
                  request — e.g. CV text + your target job title for CV review; a single chat
                  message + prior conversation for AI coach.
                </li>
                <li>
                  <strong>What Groq does:</strong> inference only. Per Groq&apos;s policy,
                  prompts and outputs are <strong>not used to train models</strong>.
                </li>
                <li>
                  <strong>What we store:</strong> the AI output linked to your account so you
                  can review it later (e.g. scores, suggestions, chat history).
                </li>
                <li>
                  <strong>How long:</strong> until you delete it or delete your account
                  (Section 10).
                </li>
                <li>
                  <strong>Where Groq processes:</strong> Groq operates data centers in the
                  United States. See Section 15 for transfer safeguards.
                </li>
              </ul>
              <p>
                AI output is generated probabilistically and may contain inaccuracies, gaps,
                or biases. Treat it as informational only and do not rely on it for
                consequential decisions — see the{" "}
                <Link href="/terms#ai" className="text-emerald-700 dark:text-emerald-300 underline">Terms of Service</Link>{" "}
                for full AI disclaimers.
              </p>
            </Section>

            <Section id="automated-decisions" title="7. Automated decisions &amp; profiling (GDPR Art. 22)">
              <p>
                We use automated processing in two ways that, taken together, constitute
                &quot;profiling&quot; under GDPR Art. 4(4):
              </p>
              <ul>
                <li>
                  <strong>Match scoring</strong> — we compute a 0-100 score for each job
                  based on overlap between your profile (title, skills, experience, location)
                  and the job&apos;s posted criteria. Used for ranking; never decisive on its
                  own.
                </li>
                <li>
                  <strong>Top-matches selection</strong> — we surface a personalised set of
                  jobs each day based on your match scores and recent activity.
                </li>
              </ul>
              <p>
                <strong>These produce no legal or similarly significant effects on you</strong>
                (Art. 22(1)). They are recommendations, not decisions; you remain free to
                view and apply to every job regardless of score.
              </p>
              <p>
                You can:
              </p>
              <ul>
                <li>See your match score on any job card.</li>
                <li>Disable personalised match scoring in <Link href="/settings" className="text-emerald-700 dark:text-emerald-300 underline">Settings &rarr; Privacy</Link> (in development).</li>
                <li>Request human review of any automated suggestion at <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a>.</li>
              </ul>
            </Section>

            <Section id="sharing" title="8. Sub-processors &amp; sharing">
              <p>
                We share your data only with essential service providers under written
                data-protection agreements (Art. 28 GDPR / equivalents). Current
                sub-processors:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse mt-2 mb-4">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-semibold">Sub-processor</th>
                      <th className="text-left py-2 pr-3 font-semibold">Purpose</th>
                      <th className="text-left py-2 pr-3 font-semibold">Location</th>
                      <th className="text-left py-2 font-semibold">Transfer mechanism</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-border/50">
                    <tr><td>Neon, Inc.</td><td>PostgreSQL database hosting</td><td>EU (eu-central-1) / US</td><td>SCCs + EU-region pinning where available</td></tr>
                    <tr><td>Vercel, Inc.</td><td>Application hosting, edge delivery</td><td>US (with global PoPs)</td><td>SCCs, DPA in place</td></tr>
                    <tr><td>Groq, Inc.</td><td>AI inference</td><td>US</td><td>SCCs, no-training contractual term</td></tr>
                    <tr><td>Stripe, Inc.</td><td>Payment processing</td><td>US (with EU sub-entity)</td><td>SCCs, PCI-DSS certified</td></tr>
                    <tr><td>Mailgun (Sinch)</td><td>Transactional email delivery</td><td>US / EU</td><td>SCCs, EU-region routing where possible</td></tr>
                    <tr><td>Google LLC</td><td>OAuth sign-in (optional)</td><td>Global</td><td>EU-US DPF / SCCs</td></tr>
                    <tr><td>LinkedIn (Microsoft)</td><td>OAuth sign-in (optional)</td><td>Global</td><td>EU-US DPF / SCCs</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                Beyond this list, when you click <em>Apply</em> on a job, you are redirected
                to the employer&apos;s applicant-tracking system (Greenhouse, Lever, Ashby,
                Workable, etc.). Data you submit on those sites is governed by their own
                privacy policies — Buzz2Remote is not involved in that transaction and not
                a controller or processor of that data.
              </p>
              <p>
                We disclose data to law-enforcement only with a valid legal order (subpoena,
                court order, or equivalent) and challenge overbroad requests.
              </p>
              <p>
                We will notify you (via email and/or in-app) at least 14 days before adding
                a new sub-processor that materially changes processing, except where required
                to start immediately for security reasons.
              </p>
            </Section>

            <Section id="linkedin" title="9. LinkedIn integration (detailed)">
              <p>
                If you choose to sign in with LinkedIn or import data from LinkedIn:
              </p>
              <ul>
                <li>
                  <strong>What we request:</strong> the standard OpenID Connect scopes —
                  <code> openid</code>, <code>profile</code>, <code>email</code>. This returns
                  your name, email, profile picture URL, and locale.
                </li>
                <li>
                  <strong>What we store:</strong> the LinkedIn user ID (to remember your
                  account linkage), your access token (encrypted, used only when you ask us
                  to refresh data), and the basic profile fields listed above.
                </li>
                <li>
                  <strong>What we do NOT receive from LinkedIn&apos;s API:</strong> work
                  history, education, skills, connections, posts, messages. LinkedIn does
                  not expose these to third-party apps without a special enterprise scope we
                  have not been granted.
                </li>
                <li>
                  <strong>LinkedIn PDF upload (optional):</strong> if you export your
                  LinkedIn profile as PDF and upload it to us, the file is parsed locally on
                  our server and discarded after extraction; the resulting structured fields
                  (work history, education, skills) are stored on your profile.
                </li>
                <li>
                  <strong>Revoking access:</strong> you can revoke our app at any time from{" "}
                  <a href="https://www.linkedin.com/mypreferences/d/data-sharing-for-permitted-services" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline">LinkedIn &rarr; Data sharing for permitted services</a>.
                  Doing so does not delete data we already received; use{" "}
                  <Link href="/settings" className="text-emerald-700 dark:text-emerald-300 underline">Settings &rarr; Account</Link>{" "}
                  to remove that too.
                </li>
              </ul>
            </Section>

            <Section id="retention" title="10. Data retention">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse mt-2 mb-4">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-semibold">Data category</th>
                      <th className="text-left py-2 pr-3 font-semibold">Retention period</th>
                      <th className="text-left py-2 font-semibold">Trigger to delete</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-border/50">
                    <tr><td>Profile, CV, skills, work experience, education</td><td>While account active</td><td>Account deletion or your direct erasure request — within 30 days</td></tr>
                    <tr><td>AI-generated content (analyses, chats, suggestions)</td><td>While account active</td><td>Same as above; you can delete individual items from settings</td></tr>
                    <tr><td>Application tracking data (clicks, applied jobs)</td><td>While account active + 12 months after</td><td>Auto-deleted 12 months after last login</td></tr>
                    <tr><td>Interaction logs (page views, queries)</td><td>De-identified after 90 days; raw deleted</td><td>Automated cron</td></tr>
                    <tr><td>Email delivery logs (Mailgun)</td><td>1 year</td><td>Mailgun&apos;s retention policy</td></tr>
                    <tr><td>Error / request logs</td><td>30 days</td><td>Automated rotation</td></tr>
                    <tr><td>Payment records (Stripe invoices)</td><td>7 years</td><td>Tax-law retention</td></tr>
                    <tr><td>Account credentials (password hash)</td><td>While account active</td><td>Account deletion within 30 days</td></tr>
                    <tr><td>Backup snapshots</td><td>35 days rolling</td><td>Automated rotation; deleted records purge from backups within 35 days</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Inactive accounts:</strong> if you don&apos;t sign in for 24 months,
                we send a reactivation email; with no response within 30 days, the account is
                automatically deleted.
              </p>
              <p>
                <strong>Backups:</strong> deleted records are purged from active databases
                immediately, but persist in encrypted rolling backups for up to 35 days
                before being permanently overwritten.
              </p>
            </Section>

            <Section id="security" title="11. Security">
              <p>Technical and organisational measures (Art. 32 GDPR):</p>
              <ul>
                <li><strong>Encryption in transit:</strong> all traffic over HTTPS / TLS 1.3.</li>
                <li><strong>Encryption at rest:</strong> database and file storage encrypted with AES-256.</li>
                <li><strong>Password hashing:</strong> bcrypt with 12 rounds; no plaintext storage; no recoverable passwords.</li>
                <li><strong>Access controls:</strong> least-privilege internal access, mandatory MFA for staff, audit logs of admin actions.</li>
                <li><strong>Apply-URL hardening:</strong> destination ATS URLs are accessed only via a server-side auth-gated redirect — they never reach client-side JavaScript or analytics.</li>
                <li><strong>Dependency hygiene:</strong> automated vulnerability scanning, weekly upgrades, no known critical CVEs in production.</li>
                <li><strong>Isolation:</strong> AI-inference, email, and database sub-processors are isolated from each other; no single processor sees the full picture.</li>
              </ul>
              <p>
                Report suspected vulnerabilities to{" "}
                <a href="mailto:security@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">security@buzz2remote.com</a>.
                We respond within 48 hours and aim to fix critical issues within 7 days.
              </p>
            </Section>

            <Section id="breach" title="12. Data breach notification">
              <p>
                In the event of a personal-data breach likely to result in a risk to your
                rights and freedoms, we will:
              </p>
              <ul>
                <li>Notify the relevant supervisory authority within <strong>72 hours</strong> of becoming aware (Art. 33 GDPR).</li>
                <li>Notify affected users without undue delay (Art. 34 GDPR) where the risk is high, via the email address on file and an in-app notice.</li>
                <li>Include in the notice: nature of the breach, categories and approximate number of data subjects/records affected, likely consequences, measures taken / proposed.</li>
              </ul>
              <p>
                We maintain an internal breach register documenting every personal-data
                breach regardless of notification thresholds.
              </p>
            </Section>

            <Section id="your-rights" title="13. Your rights">
              <p>
                Under GDPR (and equivalent rights under UK GDPR, CCPA, CPRA, LGPD, PIPEDA),
                you have the right to:
              </p>
              <ul>
                <li><strong>Access</strong> (Art. 15) — request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification</strong> (Art. 16) — correct inaccurate or incomplete data; most fields are editable directly in <Link href="/settings" className="text-emerald-700 dark:text-emerald-300 underline">your settings</Link>.</li>
                <li><strong>Erasure / &quot;Right to be forgotten&quot;</strong> (Art. 17) — delete your account and associated data subject to legal retention obligations.</li>
                <li><strong>Restriction</strong> (Art. 18) — limit how we process your data in specific cases (e.g. while accuracy is contested).</li>
                <li><strong>Portability</strong> (Art. 20) — receive your data in a structured, machine-readable JSON export.</li>
                <li><strong>Objection</strong> (Art. 21) — object to legitimate-interest processing or to direct marketing (immediate opt-out for marketing).</li>
                <li><strong>Withdraw consent</strong> (Art. 7(3)) — revoke consent for optional features at any time; does not affect lawfulness of prior processing.</li>
                <li><strong>Not be subject to automated decisions</strong> (Art. 22) — see Section 7. Match scoring does not produce legal/significant effects, but you can disable it.</li>
                <li><strong>Lodge a complaint</strong> with your local data-protection authority — e.g. CNIL (France), ICO (UK), Datatilsynet (Norway), Garante (Italy), Hamburg DSB (Germany), Türkiye KVKK, etc.</li>
              </ul>
              <p>
                <strong>How to exercise these rights:</strong> the fastest path is via your{" "}
                <Link href="/settings" className="text-emerald-700 dark:text-emerald-300 underline">account settings</Link>{" "}
                where you can export, edit, or delete in real time. For everything else,
                email{" "}
                <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a>{" "}
                from the address on file. We respond within <strong>30 days</strong> (extendable by
                up to 60 additional days for complex requests, with notice). Exercising
                these rights is <strong>free of charge</strong> unless the request is
                manifestly unfounded or excessive.
              </p>
              <p>
                <strong>Identity verification:</strong> for sensitive requests (full export,
                deletion), we may ask you to confirm a code sent to your account email or
                sign in. This is the only identity check we perform — we will never ask for
                a government ID copy.
              </p>
            </Section>

            <Section id="cookies" title="14. Cookies &amp; tracking">
              <p>We use a minimal cookie set, no third-party advertising:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse mt-2 mb-4">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-semibold">Cookie</th>
                      <th className="text-left py-2 pr-3 font-semibold">Purpose</th>
                      <th className="text-left py-2 pr-3 font-semibold">Category</th>
                      <th className="text-left py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-border/50">
                    <tr><td>__Secure-authjs.session-token</td><td>Authentication session</td><td>Strictly necessary</td><td>30 days, rolling</td></tr>
                    <tr><td>__Host-authjs.csrf-token</td><td>CSRF protection</td><td>Strictly necessary</td><td>Session</td></tr>
                    <tr><td>theme</td><td>Light/dark mode preference</td><td>Preference</td><td>1 year</td></tr>
                    <tr><td>filters (localStorage)</td><td>Remember last job filters</td><td>Preference</td><td>Until you clear it</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                We do <strong>not</strong> use third-party advertising cookies, behavioural
                tracking pixels, or cross-site tracking. We do not load Google Analytics,
                Meta Pixel, or similar.
              </p>
              <p>
                You can clear cookies through your browser at any time — doing so will sign
                you out.
              </p>
            </Section>

            <Section id="transfers" title="15. International data transfers">
              <p>
                Our sub-processors operate across multiple regions. Where personal data of
                EEA/UK/Swiss users is transferred outside the European Economic Area, we rely
                on:
              </p>
              <ul>
                <li>
                  <strong>EU-US Data Privacy Framework (DPF)</strong> certification (where the
                  receiving party is certified, e.g. Google, Microsoft/LinkedIn).
                </li>
                <li>
                  <strong>Standard Contractual Clauses (SCCs)</strong> (Decision 2021/914 of
                  the European Commission) with all other sub-processors.
                </li>
                <li>
                  <strong>Supplementary measures</strong> per EDPB Recommendations 01/2020 —
                  encryption in transit and at rest, pseudonymisation where feasible,
                  contractual prohibitions on government-access disclosure.
                </li>
              </ul>
              <p>
                For UK users, transfers rely on the <strong>UK International Data Transfer
                Agreement</strong> or the UK Addendum to SCCs.
              </p>
              <p>
                You may request a copy of the relevant transfer mechanism by emailing
                {" "}<a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a>.
              </p>
            </Section>

            <Section id="children" title="16. Children">
              <p>
                Buzz2Remote is intended for users aged <strong>16 or older</strong>. We do
                not knowingly collect personal data from anyone under 16. If you are a parent
                or guardian and believe your child has provided us with personal data,
                contact us at{" "}
                <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a>{" "}
                and we will delete it without undue delay.
              </p>
              <p>
                In jurisdictions with a higher digital-consent age (e.g. Germany&apos;s
                16-year threshold), the local age applies.
              </p>
            </Section>

            <Section id="ccpa" title="17. CCPA / CPRA notice (California residents)">
              <p>
                If you are a California resident, you have additional rights under the
                California Consumer Privacy Act (as amended by CPRA):
              </p>
              <ul>
                <li><strong>Right to know</strong> what personal information we collect, use, share, and the categories of sources and third parties involved.</li>
                <li><strong>Right to delete</strong> personal information we collected from you.</li>
                <li><strong>Right to correct</strong> inaccurate personal information.</li>
                <li><strong>Right to opt-out of &quot;sale&quot; or &quot;sharing&quot;</strong> — <strong>we do not sell or share your personal information</strong> within the meaning of the CCPA. We have no &quot;Do Not Sell&quot; link because there is nothing to opt out of.</li>
                <li><strong>Right to limit use of sensitive personal information</strong> — we do not use sensitive personal information for purposes beyond providing the Service.</li>
                <li><strong>Right to non-discrimination</strong> for exercising any of these rights.</li>
              </ul>
              <p>
                Exercise these rights the same way as Section 13 — via your settings or
                {" "}<a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a>.
              </p>
              <p>
                <strong>Shine the Light (Cal. Civ. Code § 1798.83):</strong> we do not
                disclose personal information to third parties for their direct marketing
                purposes.
              </p>
            </Section>

            <Section id="changes" title="18. Changes to this policy">
              <p>
                We may update this Privacy Policy from time to time. Material changes will
                be announced via email <strong>and</strong> in-app notification at least 14
                days before they take effect, with a summary of what changed. The
                &quot;Last updated&quot; date at the top reflects the current version.
                Continued use of the Service after the effective date constitutes acceptance.
                Older versions are archived; you can request a previous version at
                {" "}<a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a>.
              </p>
            </Section>

            <Section id="contact" title="19. Contact &amp; complaints">
              <p>For privacy questions, data-rights requests, or any other concern:</p>
              <ul>
                <li><strong>Privacy:</strong> <a href="mailto:privacy@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">privacy@buzz2remote.com</a></li>
                <li><strong>General:</strong> <a href="mailto:hello@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">hello@buzz2remote.com</a></li>
                <li><strong>Security:</strong> <a href="mailto:security@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">security@buzz2remote.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@buzz2remote.com" className="text-emerald-700 dark:text-emerald-300 underline">support@buzz2remote.com</a></li>
              </ul>
              <p>
                If you are unsatisfied with our response, you have the right to lodge a
                complaint with your local data-protection authority. Find yours at{" "}
                <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline">edpb.europa.eu/about-edpb/about-edpb/members_en</a>{" "}
                (EEA) or via your national regulator (e.g.{" "}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline">ICO</a>{" "}
                in the UK,{" "}
                <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline">KVKK</a>{" "}
                in Türkiye,{" "}
                <a href="https://oag.ca.gov/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline">California AG</a>{" "}
                for CCPA).
              </p>
              <p>
                See also our{" "}
                <Link href="/terms" className="text-emerald-700 dark:text-emerald-300 underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/contact" className="text-emerald-700 dark:text-emerald-300 underline">contact page</Link>.
              </p>
            </Section>

            <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
              <p>
                This Privacy Policy is written in English. Translations may be provided for
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
          className="hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          aria-label={`Link to ${title}`}
        >
          {title}
        </a>
      </h2>
      <div className="text-foreground/80 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:text-foreground/80 [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2 [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
        {children}
      </div>
    </section>
  );
}
