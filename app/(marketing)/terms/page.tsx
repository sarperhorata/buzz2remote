import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: March 2026</p>
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
  );
}
