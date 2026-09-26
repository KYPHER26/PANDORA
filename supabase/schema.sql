-- ============================================================================
-- ESTER AND KYPHER — Database schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- COUPLES
-- ----------------------------------------------------------------------------
create table if not exists public.couples (
  id uuid primary key default uuid_generate_v4(),
  partner_one_id uuid,
  partner_two_id uuid,
  relationship_start_date date,
  anniversary_date date,
  quote text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PROFILES  (one row per auth user, 1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'New Partner',
  email text not null,
  avatar_url text,
  couple_id uuid references public.couples (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couples
  add constraint couples_partner_one_fk foreign key (partner_one_id) references public.profiles (id) on delete set null,
  add constraint couples_partner_two_fk foreign key (partner_two_id) references public.profiles (id) on delete set null;

-- ----------------------------------------------------------------------------
-- MEMORIES
-- ----------------------------------------------------------------------------
create table if not exists public.memories (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content text,
  day_summary text,       -- "How my day went"
  note_to_partner text,    -- "Something I want my partner to know"
  date date not null default current_date,
  mood text,
  location text,
  tags text[] default '{}',
  is_special boolean not null default false,
  special_label text,      -- e.g. "First date", "Anniversary"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_couple_date_idx on public.memories (couple_id, date desc);
create index if not exists memories_couple_special_idx on public.memories (couple_id, is_special);
create index if not exists memories_tags_idx on public.memories using gin (tags);

-- ----------------------------------------------------------------------------
-- PHOTOS  (metadata; binary lives in Supabase Storage)
-- ----------------------------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  memory_id uuid references public.memories (id) on delete cascade,
  storage_path text not null,
  caption text,
  taken_on date default current_date,
  created_at timestamptz not null default now()
);

create index if not exists photos_couple_taken_idx on public.photos (couple_id, taken_on desc);
create index if not exists photos_memory_idx on public.photos (memory_id);

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists comments_memory_idx on public.comments (memory_id, created_at);

-- ----------------------------------------------------------------------------
-- REACTIONS
-- ----------------------------------------------------------------------------
create table if not exists public.reactions (
  id uuid primary key default uuid_generate_v4(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'emotional', 'funny')),
  created_at timestamptz not null default now(),
  unique (memory_id, user_id, reaction_type)
);

create index if not exists reactions_memory_idx on public.reactions (memory_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  couple_id uuid not null references public.couples (id) on delete cascade,
  type text not null check (
    type in ('new_memory', 'new_photo', 'reaction', 'comment', 'reply', 'anniversary')
  ),
  reference_id uuid,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, is_read, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at before update on public.memories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- The whole app hinges on this: a user may only ever read/write rows that
-- belong to their own couple_id. Nobody outside the couple can see anything.
-- ============================================================================

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.memories enable row level security;
alter table public.photos enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;

-- Helper: the couple_id of the currently authenticated user.
-- SECURITY DEFINER + stable so it can be reused cheaply inside policies
-- without recursive RLS evaluation on profiles.
create or replace function public.my_couple_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

-- ---- profiles ----------------------------------------------------------
drop policy if exists "profiles: read own couple" on public.profiles;
create policy "profiles: read own couple"
  on public.profiles for select
  using (
    id = auth.uid()
    or couple_id = public.my_couple_id()
  );

drop policy if exists "profiles: update own row" on public.profiles;
create policy "profiles: update own row"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: insert own row" on public.profiles;
create policy "profiles: insert own row"
  on public.profiles for insert
  with check (id = auth.uid());

-- ---- couples -------------------------------------------------------------
drop policy if exists "couples: members only" on public.couples;
create policy "couples: members only"
  on public.couples for select
  using (id = public.my_couple_id());

drop policy if exists "couples: members can update" on public.couples;
create policy "couples: members can update"
  on public.couples for update
  using (id = public.my_couple_id())
  with check (id = public.my_couple_id());

-- ---- memories --------------------------------------------------------
drop policy if exists "memories: members only select" on public.memories;
create policy "memories: members only select"
  on public.memories for select
  using (couple_id = public.my_couple_id());

drop policy if exists "memories: members insert own" on public.memories;
create policy "memories: members insert own"
  on public.memories for insert
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());

drop policy if exists "memories: author updates own" on public.memories;
create policy "memories: author updates own"
  on public.memories for update
  using (couple_id = public.my_couple_id() and author_id = auth.uid())
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());

drop policy if exists "memories: author deletes own" on public.memories;
create policy "memories: author deletes own"
  on public.memories for delete
  using (couple_id = public.my_couple_id() and author_id = auth.uid());

-- ---- photos ------------------------------------------------------------
drop policy if exists "photos: members only select" on public.photos;
create policy "photos: members only select"
  on public.photos for select
  using (couple_id = public.my_couple_id());

drop policy if exists "photos: members insert own" on public.photos;
create policy "photos: members insert own"
  on public.photos for insert
  with check (couple_id = public.my_couple_id() and uploader_id = auth.uid());

drop policy if exists "photos: uploader deletes own" on public.photos;
create policy "photos: uploader deletes own"
  on public.photos for delete
  using (couple_id = public.my_couple_id() and uploader_id = auth.uid());

-- ---- comments ----------------------------------------------------------
drop policy if exists "comments: members only select" on public.comments;
create policy "comments: members only select"
  on public.comments for select
  using (couple_id = public.my_couple_id());

drop policy if exists "comments: members insert own" on public.comments;
create policy "comments: members insert own"
  on public.comments for insert
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());

drop policy if exists "comments: author deletes own" on public.comments;
create policy "comments: author deletes own"
  on public.comments for delete
  using (couple_id = public.my_couple_id() and author_id = auth.uid());

-- ---- reactions ----------------------------------------------------------
drop policy if exists "reactions: members only select" on public.reactions;
create policy "reactions: members only select"
  on public.reactions for select
  using (couple_id = public.my_couple_id());

drop policy if exists "reactions: members insert own" on public.reactions;
create policy "reactions: members insert own"
  on public.reactions for insert
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

drop policy if exists "reactions: user deletes own" on public.reactions;
create policy "reactions: user deletes own"
  on public.reactions for delete
  using (couple_id = public.my_couple_id() and user_id = auth.uid());

-- ---- notifications -------------------------------------------------------
drop policy if exists "notifications: recipient only select" on public.notifications;
create policy "notifications: recipient only select"
  on public.notifications for select
  using (recipient_id = auth.uid());

drop policy if exists "notifications: members insert for couple" on public.notifications;
create policy "notifications: members insert for couple"
  on public.notifications for insert
  with check (couple_id = public.my_couple_id());

drop policy if exists "notifications: recipient updates own" on public.notifications;
create policy "notifications: recipient updates own"
  on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ============================================================================
-- STORAGE
-- Create a private bucket and lock it to couple members only, keyed by
-- folder path convention: <couple_id>/<filename>
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do nothing;

drop policy if exists "couple-media: members read" on storage.objects;
create policy "couple-media: members read"
  on storage.objects for select
  using (
    bucket_id = 'couple-media'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
  );

drop policy if exists "couple-media: members upload" on storage.objects;
create policy "couple-media: members upload"
  on storage.objects for insert
  with check (
    bucket_id = 'couple-media'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
  );

drop policy if exists "couple-media: uploader deletes own" on storage.objects;
create policy "couple-media: uploader deletes own"
  on storage.objects for delete
  using (
    bucket_id = 'couple-media'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
    and owner = auth.uid()
  );

-- ============================================================================
-- REALTIME
-- ============================================================================
alter publication supabase_realtime add table public.memories;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.photos;
