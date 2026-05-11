"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

const featureComparison = [
  { label: "Browse all jobs", free: true, pro: true, premium: true },
  { label: "Applications/month", free: "10", pro: "Unlimited", premium: "Unlimited" },
  { label: "Profiles", free: "1", pro: "3", premium: "Unlimited" },
  { label: "CV upload & parse", free: true, pro: true, premium: true },
  { label: "AI CV analysis", free: false, pro: true, premium: true },
  { label: "Salary estimation", free: false, pro: true, premium: true },
  { label: "AI cover letter", free: false, pro: true, premium: true },
  { label: "Job match score", free: false, pro: true, premium: true },
  { label: "Advanced filters", free: false, pro: true, premium: true },
  { label: "Auto-apply", free: false, pro: false, premium: true },
  { label: "LinkedIn import", free: false, pro: false, premium: true },
  { label: "Early access to jobs", free: false, pro: false, premium: true },
  { label: "Priority support", free: false, pro: true, premium: true },
  { label: "Dedicated account manager", free: false, pro: false, premium: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>;
  }
  if (value) {
    return <Check className="size-4 text-green-600 mx-auto" />;
  }
  return <X className="size-4 text-muted-foreground/40 mx-auto" />;
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const isAnnual = billing === "annual";

  // Annual prices (20% off, rounded)
  const proMonthly = 9;
  const premiumMonthly = 19;
  const proAnnual = Math.round(proMonthly * 0.8);
  const premiumAnnual = Math.round(premiumMonthly * 0.8);

  async function handlePlanClick(planKey: string) {
    setLoadingPlan(planKey);

    if (status !== "authenticated" || !session) {
      router.push(`/register?plan=${planKey}`);
      return;
    }

    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        console.error("Checkout error:", data.error);
        setLoadingPlan(null);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout failed:", err);
      setLoadingPlan(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Simple Pricing
        </h1>
        <p className="text-lg text-muted-foreground">
          Start free, upgrade when you&apos;re ready.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-muted/30">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs font-semibold text-green-600">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Free */}
        <div className="border border-border rounded-2xl p-8 bg-white">
          <h2 className="text-xl font-bold mb-1">Free</h2>
          <p className="text-sm text-muted-foreground mb-6">For casual job seekers</p>
          <div className="mb-6">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-muted-foreground text-sm ml-1">forever</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              { text: "Browse all jobs", included: true },
              { text: "10 applications/month", included: true },
              { text: "1 profile", included: true },
              { text: "CV upload & parse", included: true },
              { text: "Basic job alerts", included: true },
              { text: "AI CV analysis", included: false },
              { text: "Salary estimation", included: false },
              { text: "AI cover letter", included: false },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                {f.included ? (
                  <Check className="size-4 shrink-0 text-green-600" />
                ) : (
                  <X className="size-4 shrink-0 text-muted-foreground/40" />
                )}
                <span className={f.included ? "text-foreground" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full h-11 font-semibold rounded-xl">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Pro — highlighted */}
        <div className="border-2 border-primary rounded-2xl p-8 bg-white relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            Most Popular
          </span>
          <h2 className="text-xl font-bold mb-1">Pro</h2>
          <p className="text-sm text-muted-foreground mb-6">For active job seekers</p>
          <div className="mb-6">
            <span className="text-4xl font-bold">${isAnnual ? proAnnual : proMonthly}</span>
            <span className="text-muted-foreground text-sm ml-1">/month</span>
            {isAnnual && (
              <p className="text-xs text-green-600 font-medium mt-1">
                Billed ${proAnnual * 12}/year
              </p>
            )}
          </div>
          <ul className="space-y-3 mb-8">
            {[
              { text: "Unlimited applications", included: true },
              { text: "3 profiles", included: true },
              { text: "AI CV analysis", included: true },
              { text: "Salary estimation", included: true },
              { text: "AI cover letter", included: true },
              { text: "Job match score", included: true },
              { text: "Advanced filters", included: true },
              { text: "Priority support", included: true },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                <Check className="size-4 shrink-0 text-green-600" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => handlePlanClick("pro")}
            disabled={loadingPlan === "pro"}
            className="w-full bg-primary text-primary-foreground h-11 font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loadingPlan === "pro" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Start Free Trial"
            )}
          </button>
        </div>

        {/* Premium */}
        <div className="border border-border rounded-2xl p-8 bg-white">
          <h2 className="text-xl font-bold mb-1">Premium</h2>
          <p className="text-sm text-muted-foreground mb-6">For power users</p>
          <div className="mb-6">
            <span className="text-4xl font-bold">${isAnnual ? premiumAnnual : premiumMonthly}</span>
            <span className="text-muted-foreground text-sm ml-1">/month</span>
            {isAnnual && (
              <p className="text-xs text-green-600 font-medium mt-1">
                Billed ${premiumAnnual * 12}/year
              </p>
            )}
          </div>
          <ul className="space-y-3 mb-8">
            {[
              { text: "Everything in Pro", included: true },
              { text: "Unlimited profiles", included: true },
              { text: "Auto-apply", included: true },
              { text: "LinkedIn import", included: true },
              { text: "Early access to jobs", included: true },
              { text: "Career coaching session", included: true },
              { text: "Dedicated account manager", included: true },
              { text: "Custom job alerts", included: true },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                <Check className="size-4 shrink-0 text-green-600" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full h-11 font-semibold rounded-xl">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 bg-muted/30 px-6 py-3 border-b border-border">
          <div className="text-sm font-semibold">Feature</div>
          <div className="text-sm font-semibold text-center">Free</div>
          <div className="text-sm font-semibold text-center text-primary">Pro</div>
          <div className="text-sm font-semibold text-center">Premium</div>
        </div>
        {featureComparison.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-4 px-6 py-3 ${
              i % 2 === 0 ? "bg-white" : "bg-muted/10"
            } ${i < featureComparison.length - 1 ? "border-b border-border/50" : ""}`}
          >
            <div className="text-sm text-muted-foreground">{row.label}</div>
            <div className="text-center">
              <CellValue value={row.free} />
            </div>
            <div className="text-center">
              <CellValue value={row.pro} />
            </div>
            <div className="text-center">
              <CellValue value={row.premium} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
