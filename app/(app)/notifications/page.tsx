"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => fetch("/api/notifications/read-all", { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        {data?.unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data?.notifications?.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {data?.notifications?.map((n: Notification) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                n.is_read
                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">{n.title}</h3>
                <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              {n.message && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
