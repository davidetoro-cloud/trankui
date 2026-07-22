alter table public.profiles
  add column if not exists can_work_as_member boolean not null default true,
  add column if not exists can_work_as_builder boolean not null default true;

update public.profiles
set
  can_work_as_member = coalesce(can_work_as_member, true),
  can_work_as_builder = coalesce(can_work_as_builder, true);

comment on column public.profiles.can_work_as_member is
  'Indica se il profilo puo essere trovato, contattato o candidarsi come Crew Member.';

comment on column public.profiles.can_work_as_builder is
  'Indica se il profilo puo cercare collaboratori, pubblicare richieste e costruire crew come Crew Builder.';
