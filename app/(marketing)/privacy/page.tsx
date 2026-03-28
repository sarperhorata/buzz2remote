import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: March 2026</p>
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide (name, email, CV data) and usage data (page views, job interactions).</p>
      <h2>2. How We Use Your Information</h2>
      <p>Your information is used to provide job matching, personalized recommendations, and improve our services.</p>
      <h2>3. AI Processing</h2>
      <p>CV data submitted for AI analysis is processed by Groq&apos;s language models. We do not store AI processing results beyond your session unless you choose to save them.</p>
      <h2>4. Data Sharing</h2>
      <p>We do not sell your personal data. We share data only with essential service providers (Stripe for payments, Mailgun for emails).</p>
      <h2>5. Data Security</h2>
      <p>We use encryption, secure connections, and follow industry best practices to protect your data.</p>
      <h2>6. Your Rights</h2>
      <p>You can access, update, or delete your data at any time through your profile settings.</p>
      <h2>7. Contact</h2>
      <p>For privacy concerns, contact us at privacy@buzz2remote.com.</p>
    </div>
  );
}
