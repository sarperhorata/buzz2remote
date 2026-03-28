import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help Center" };

const faqs = [
  { q: "How do I search for remote jobs?", a: "Use the search bar on the Jobs page to filter by title, location, skills, and more." },
  { q: "Is Buzz2Remote free to use?", a: "Yes! Basic features are free. Premium plans offer AI-powered tools and unlimited applications." },
  { q: "How does AI CV analysis work?", a: "Upload your CV and our AI (powered by Groq) analyzes it for strengths, weaknesses, and ATS compatibility." },
  { q: "Can I save jobs for later?", a: "Yes, click the save/bookmark button on any job listing to add it to your favorites." },
  { q: "How do I cancel my subscription?", a: "Go to Settings > Manage Billing to cancel or change your subscription through Stripe." },
  { q: "How do job recommendations work?", a: "Our AI matches your skills and experience with available positions to suggest the best fits." },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Help Center</h1>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.q} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h2>
            <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
