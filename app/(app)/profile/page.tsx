"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetch("/api/users/me").then((r) => r.json()),
  });

  const [form, setForm] = useState({ full_name: "", bio: "", location: "", company: "", position: "" });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        company: user.company || "",
        position: user.position || "",
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  const fields = [
    { key: "full_name", label: "Full Name", type: "text" },
    { key: "bio", label: "Bio", type: "textarea" },
    { key: "location", label: "Location", type: "text" },
    { key: "company", label: "Company", type: "text" },
    { key: "position", label: "Position", type: "text" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader title="Profile" description="Manage your personal information" />

      <div className="glass-card p-6 md:p-8">
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
          className="space-y-5"
        >
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  rows={3}
                />
              ) : (
                <Input
                  id={field.key}
                  type="text"
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all"
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>

            {mutation.isSuccess && (
              <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="size-4" />
                Profile updated!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
