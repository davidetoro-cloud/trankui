alter table public.profiles
  add column if not exists account_type text not null default 'freelance',
  add column if not exists company_name text,
  add column if not exists company_type text,
  add column if not exists vat_number text,
  add column if not exists contact_name text,
  add column if not exists company_website text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type in ('freelance', 'company'));
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    account_type,
    company_name,
    company_type,
    contact_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'account_type', ''), 'freelance'),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_type', ''),
    nullif(new.raw_user_meta_data ->> 'contact_name', '')
  );
  return new;
end;
$$;
