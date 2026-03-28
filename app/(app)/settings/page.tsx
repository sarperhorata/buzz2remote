"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

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
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>

      {/* Account Info */}
      <section className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Email:</span> {session?.user?.email}</p>
          <p><span className="text-gray-500">Name:</span> {session?.user?.name}</p>
          <p><span className="text-gray-500">Role:</span> {session?.user?.isAdmin ? "Admin" : "User"}</p>
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Subscription</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Current plan: <span className="font-medium capitalize">
            {String((session?.user as Record<string, unknown>)?.subscriptionPlan || "Free")}
          </span>
        </p>
        <button
          onClick={handleManageBilling}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Manage Billing
        </button>
        {message && <p className="text-sm text-amber-600 mt-2">{message}</p>}
      </section>
    </div>
  );
}
