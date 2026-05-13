"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Invalid reset link</h1>
        <p className="text-muted-foreground mb-6">
          The reset link is missing a token. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-6 text-emerald-700" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Password updated</h1>
        <p className="text-muted-foreground mb-6">
          Your password has been reset. Redirecting to sign in…
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2">Set a new password</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Pick a strong password — at least 8 characters.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password" className="mb-1.5 block">New password</Label>
          <PasswordInput
            id="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="confirm" className="mb-1.5 block">Confirm password</Label>
          <PasswordInput
            id="confirm"
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Updating…
            </>
          ) : (
            "Update password"
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
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<Loader2 className="size-6 animate-spin mx-auto text-amber-500" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
