"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Profile</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="space-y-4"
      >
        {["full_name", "bio", "location", "company", "position"].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
              {field.replace("_", " ")}
            </label>
            {field === "bio" ? (
              <textarea
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Profile"}
        </button>

        {mutation.isSuccess && (
          <p className="text-green-600 text-sm">Profile updated successfully!</p>
        )}
      </form>
    </div>
  );
}
