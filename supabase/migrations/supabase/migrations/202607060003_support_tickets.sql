create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  priority text not null default 'Normale',
  subject text not null check (length(subject) between 3 and 120),
  description text not null check (length(description) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_reporter_idx on public.support_tickets(reporter_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets(status, created_at desc);

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

create policy "Users can create support tickets" on public.support_tickets
for insert to authenticated
with check (reporter_id = (select auth.uid()));

create policy "Users can read own support tickets" on public.support_tickets
for select to authenticated
using (reporter_id = (select auth.uid()));
