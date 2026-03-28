import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">About Buzz2Remote</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Buzz2Remote is a platform dedicated to connecting talented professionals with remote job opportunities
          from top companies worldwide. Our AI-powered tools help you find the perfect match for your skills
          and career goals.
        </p>
        <h2>Our Mission</h2>
        <p>
          We believe that great talent exists everywhere, and geography should never be a barrier to finding
          meaningful work. Our mission is to make remote work accessible to everyone by providing the best
          tools for job discovery, application, and career development.
        </p>
        <h2>What We Offer</h2>
        <ul>
          <li>Thousands of curated remote job listings from verified companies</li>
          <li>AI-powered job matching based on your skills and preferences</li>
          <li>Smart CV analysis and improvement suggestions</li>
          <li>Salary estimation tools for informed negotiations</li>
          <li>Career resources and remote work guides</li>
        </ul>
      </div>
    </div>
  );
}
