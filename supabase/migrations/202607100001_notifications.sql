create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  channels jsonb not null default '{"push": false, "sound": true, "email": false}'::jsonb,
  topics jsonb not null default '{"messages": true, "requests": true, "matches": true, "reviews": true, "availability": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(channels) = 'object'),
  check (jsonb_typeof(topics) = 'object')
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_profile_idx on public.push_subscriptions(profile_id, last_seen_at desc);

drop trigger if exists notification_preferences_updated_at on public.notification_preferences;
create trigger notification_preferences_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users can read own notification preferences" on public.notification_preferences
for select to authenticated
using (profile_id = (select auth.uid()));

create policy "Users can upsert own notification preferences" on public.notification_preferences
for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy "Users can update own notification preferences" on public.notification_preferences
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "Users can read own push subscriptions" on public.push_subscriptions
for select to authenticated
using (profile_id = (select auth.uid()));

create policy "Users can create own push subscriptions" on public.push_subscriptions
for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy "Users can update own push subscriptions" on public.push_subscriptions
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "Users can delete own push subscriptions" on public.push_subscriptions
for delete to authenticated
using (profile_id = (select auth.uid()));

grant select, insert, update on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
