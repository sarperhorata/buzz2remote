"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { User, CreditCard, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");

  async function handleManageBilling() {
    const res = await fetch("/api/payment/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setMessage("No billing account found. Subscribe to a plan first.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      {/* Account Info */}
      <section className="glass-card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg">
            <User className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Email:</span> {session?.user?.email}</p>
          <p><span className="text-muted-foreground">Name:</span> {session?.user?.name}</p>
          <p><span className="text-muted-foreground">Role:</span> {session?.user?.isAdmin ? "Admin" : "User"}</p>
        </div>
      </section>

      {/* Subscription */}
      <section className="glass-card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg">
            <CreditCard className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">Subscription</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Current plan: <span className="font-semibold text-foreground capitalize">
            {String((session?.user as Record<string, unknown>)?.subscriptionPlan || "Free")}
          </span>
        </p>
        <Button
          onClick={handleManageBilling}
          className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all"
        >
          Manage Billing
        </Button>
        {message && (
          <p className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 mt-3">
            <AlertTriangle className="size-4" /> {message}
          </p>
        )}
      </section>
    </div>
  );
}
