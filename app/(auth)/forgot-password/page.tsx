"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <BeeIcon size={36} className="group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold">
              <span className="text-amber-500">Buzz</span>
              <span className="text-foreground">2Remote</span>
            </span>
          </Link>
        </div>

        {done ? (
          <div className="text-center">
            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="size-6 text-emerald-700" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link.
              The link expires in 1 hour.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Didn&apos;t get the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => { setDone(false); setError(null); }}
                className="text-amber-700 underline hover:text-amber-800"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Forgot your password?</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
