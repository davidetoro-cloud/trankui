create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('Bug', 'Suggerimento', 'UX', 'Funzionalita', 'Altro')),
  title text not null check (length(title) between 3 and 140),
  description text not null check (length(description) between 10 and 3000),
  perceived_priority text not null default 'Media' check (perceived_priority in ('Bassa', 'Media', 'Alta', 'Bloccante')),
  screenshot_path text,
  screenshot_file_name text,
  screenshot_mime_type text,
  screenshot_size integer check (screenshot_size is null or screenshot_size between 0 and 5242880),
  status text not null default 'new' check (status in ('new', 'triaged', 'planned', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_feedback_user_idx on public.beta_feedback(user_id, created_at desc);
create index if not exists beta_feedback_status_idx on public.beta_feedback(status, created_at desc);
create index if not exists beta_feedback_category_idx on public.beta_feedback(category, created_at desc);

drop trigger if exists beta_feedback_updated_at on public.beta_feedback;
create trigger beta_feedback_updated_at before update on public.beta_feedback
for each row execute function public.set_updated_at();

alter table public.beta_feedback enable row level security;

drop policy if exists "Users can create own beta feedback" on public.beta_feedback;
create policy "Users can create own beta feedback" on public.beta_feedback
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own beta feedback" on public.beta_feedback;
create policy "Users can read own beta feedback" on public.beta_feedback
for select to authenticated
using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('beta-feedback-screenshots', 'beta-feedback-screenshots', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "beta feedback screenshots own insert" on storage.objects;
create policy "beta feedback screenshots own insert" on storage.objects for insert to authenticated
with check (bucket_id = 'beta-feedback-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "beta feedback screenshots own read" on storage.objects;
create policy "beta feedback screenshots own read" on storage.objects for select to authenticated
using (bucket_id = 'beta-feedback-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "beta feedback screenshots own delete" on storage.objects;
create policy "beta feedback screenshots own delete" on storage.objects for delete to authenticated
using (bucket_id = 'beta-feedback-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);
