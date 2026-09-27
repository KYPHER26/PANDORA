import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { NotificationRow } from "../types/database";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications(data ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
  if (!profile) return;
  const channelName = `notifications-${profile.id}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    if (!profile) return;
    await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", profile.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return { notifications, loading, unreadCount, markAllRead, refresh: fetchNotifications };
}

/** Fire-and-forget helper to notify the partner about something. */
export async function notifyPartner(params: {
  recipientId: string;
  senderId: string;
  coupleId: string;
  type: NotificationRow["type"];
  message: string;
  referenceId?: string;
}) {
  await supabase.from("notifications").insert({
    recipient_id: params.recipientId,
    sender_id: params.senderId,
    couple_id: params.coupleId,
    type: params.type,
    message: params.message,
    reference_id: params.referenceId ?? null,
  });
}
