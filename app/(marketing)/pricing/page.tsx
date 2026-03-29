import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

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

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, <span className="gradient-text">Transparent</span> Pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Choose the plan that fits your job search needs.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 hover-lift transition-all ${
              plan.highlighted
                ? "gradient-hero text-white shadow-2xl scale-[1.02] border-0"
                : "glass-card"
            }`}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary font-semibold shadow-lg border-0 px-3">
                Most Popular
              </Badge>
            )}
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className={plan.highlighted ? "text-white/70" : "text-muted-foreground"}>
                {plan.period}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <Check className={`size-4 shrink-0 ${plan.highlighted ? "text-white" : "text-primary"}`} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className={`w-full h-11 font-semibold ${
                plan.highlighted
                  ? "bg-white text-foreground hover:bg-white/90 shadow-lg"
                  : "gradient-primary text-white border-0 shadow-lg hover:shadow-xl"
              }`}
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
