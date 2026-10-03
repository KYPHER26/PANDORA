-- Push notifications: device subscriptions + a trigger that calls the
-- send-push Edge Function whenever a notification row is created.
-- Before running: create the shared secret once (use the same value you set as
-- PUSH_WEBHOOK_SECRET on the Edge Function):
--   select vault.create_secret('YOUR_RANDOM_SECRET', 'push_webhook_secret');

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push: own select" on public.push_subscriptions;
create policy "push: own select" on public.push_subscriptions for select using (user_id = auth.uid());
drop policy if exists "push: own insert" on public.push_subscriptions;
create policy "push: own insert" on public.push_subscriptions for insert with check (user_id = auth.uid());
drop policy if exists "push: own update" on public.push_subscriptions;
create policy "push: own update" on public.push_subscriptions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "push: own delete" on public.push_subscriptions;
create policy "push: own delete" on public.push_subscriptions for delete using (user_id = auth.uid());

create or replace function public.notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets where name = 'push_webhook_secret' limit 1;

  if webhook_secret is not null then
    perform net.http_post(
      url := 'https://phiavbueiktceqwwgboj.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', webhook_secret),
      body := jsonb_build_object('record', to_jsonb(new))
    );
  end if;
  return new;
exception when others then
  -- A push failure must never block the notification itself.
  return new;
end;
$$;

drop trigger if exists notifications_send_push on public.notifications;
create trigger notifications_send_push
  after insert on public.notifications
  for each row execute function public.notify_push();
