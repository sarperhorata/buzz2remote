"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Bell, CheckCheck } from "lucide-react";

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
      <PageHeader title="Notifications" description="Stay updated on your applications">
        {data?.unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="size-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : data?.notifications?.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! We'll notify you about important updates."
        />
      ) : (
        <div className="space-y-3">
          {data?.notifications?.map((n: Notification) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`glass-card p-4 cursor-pointer transition-all hover-lift ${
                !n.is_read ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{n.title}</h3>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              {n.message && <p className="text-sm text-muted-foreground mt-1">{n.message}</p>}
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary absolute top-4 right-4" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
