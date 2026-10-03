// Sends a Web Push to every device the recipient has enabled.
// Deploy with: supabase functions deploy send-push --no-verify-jwt
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_WEBHOOK_SECRET
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const TITLES: Record<string, string> = {
  new_memory: "New memory ❤️",
  new_photo: "New photo 📸",
  reaction: "New reaction",
  comment: "New comment 💬",
  reply: "New reply 💬",
  anniversary: "Anniversary 💌",
};

function targetUrl(type: string, referenceId: string | null): string {
  if (type === "new_photo") return "/gallery";
  if (type === "anniversary") return "/story";
  return referenceId ? `/memory/${referenceId}` : "/";
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("PUSH_WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { record } = await req.json();
  if (!record?.recipient_id) return new Response("Missing record", { status: 400 });

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT")!,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!
  );

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", record.recipient_id);

  const payload = JSON.stringify({
    title: TITLES[record.type] ?? "Ester ❤️ Kypher",
    body: record.message ?? "",
    url: targetUrl(record.type, record.reference_id),
    tag: `${record.type}-${record.reference_id ?? record.id}`,
  });

  const expired: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(s.id);
      }
    })
  );

  if (expired.length) await admin.from("push_subscriptions").delete().in("id", expired);
  return new Response(JSON.stringify({ sent: (subs?.length ?? 0) - expired.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
