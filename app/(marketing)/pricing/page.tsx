import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: ["Browse all jobs", "10 applications/month", "Basic job alerts", "CV upload"],
      cta: "Get Started",
      href: "/register",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/month",
      features: ["Unlimited applications", "AI CV analysis", "Salary estimation", "Priority support", "Advanced filters", "Job match notifications"],
      cta: "Start Free Trial",
      href: "/register",
      highlighted: true,
    },
    {
      name: "Premium",
      price: "$19",
      period: "/month",
      features: ["Everything in Pro", "Auto-apply", "Cover letter AI", "Dedicated account manager", "Early access to jobs", "Career coaching session"],
      cta: "Contact Us",
      href: "/contact",
      highlighted: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Choose the plan that fits your job search needs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-8 ${
              plan.highlighted
                ? "bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800 scale-105"
                : "bg-white dark:bg-gray-800 border dark:border-gray-700"
            }`}
          >
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className={plan.highlighted ? "text-blue-200" : "text-gray-500"}>{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`block text-center py-3 rounded-lg font-medium transition ${
                plan.highlighted
                  ? "bg-white text-blue-600 hover:bg-blue-50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
