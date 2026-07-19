create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default 'badge',
  created_at timestamptz not null default now(),
  check (length(name) between 2 and 80),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete restrict,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists user_badges_user_idx on public.user_badges(user_id, awarded_at desc);
create index if not exists user_badges_badge_idx on public.user_badges(badge_id, awarded_at desc);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Badges are readable" on public.badges;
create policy "Badges are readable" on public.badges
for select
using (true);

drop policy if exists "User badges are readable" on public.user_badges;
create policy "User badges are readable" on public.user_badges
for select
using (true);

insert into public.badges (name, slug, description, icon)
values (
  'Crew Zero',
  'crew-zero',
  'Tra i primi professionisti ad aver contribuito alla nascita di Trankui durante la Beta privata.',
  'sparkles'
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    icon = excluded.icon;

create or replace function public.award_crew_zero_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  crew_zero_badge_id uuid;
begin
  select id into crew_zero_badge_id
  from public.badges
  where slug = 'crew-zero';

  if crew_zero_badge_id is null then
    return new;
  end if;

  insert into public.user_badges (user_id, badge_id)
  values (new.id, crew_zero_badge_id)
  on conflict (user_id, badge_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_award_crew_zero_badge on public.profiles;
create trigger profiles_award_crew_zero_badge
after insert on public.profiles
for each row execute function public.award_crew_zero_badge();

insert into public.user_badges (user_id, badge_id)
select profile.id, badge.id
from public.profiles profile
cross join public.badges badge
where badge.slug = 'crew-zero'
on conflict (user_id, badge_id) do nothing;

grant select on public.badges to anon, authenticated;
grant select on public.user_badges to anon, authenticated;
