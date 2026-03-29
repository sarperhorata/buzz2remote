import type { Metadata } from "next";
import { Scale } from "lucide-react";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div>
      <section className="relative overflow-hidden gradient-hero text-white py-16">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <Scale className="size-10 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-white/70 mt-2">Last updated: March 2026</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16 prose dark:prose-invert">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing Buzz2Remote, you agree to these terms of service. If you disagree, please do not use the platform.</p>
        <h2>2. Use of Service</h2>
        <p>Buzz2Remote provides a platform for finding and applying to remote jobs. Users must provide accurate information and use the service in good faith.</p>
        <h2>3. User Accounts</h2>
        <p>You are responsible for maintaining the security of your account. Do not share your login credentials with others.</p>
        <h2>4. Job Listings</h2>
        <p>We aggregate job listings from various sources. While we strive for accuracy, we do not guarantee the validity of any job posting.</p>
        <h2>5. AI Features</h2>
        <p>AI-powered features (CV analysis, recommendations, etc.) are provided as-is and should not be taken as professional career advice.</p>
        <h2>6. Payment and Subscriptions</h2>
        <p>Paid plans are billed through Stripe. You can cancel at any time through your account settings.</p>
        <h2>7. Contact</h2>
        <p>For questions about these terms, contact us at support@buzz2remote.com.</p>
      </div>
    </div>
  );
}
