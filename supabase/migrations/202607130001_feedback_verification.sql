create or replace function public.refresh_profile_feedback_verification(target_profile uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_profile is null then
    return;
  end if;

  update public.profiles
  set verified = (
    select count(*) >= 3
    from public.reviews received
    where received.recipient_id = target_profile
      and exists (
        select 1
        from public.reviews reciprocal
        where reciprocal.collaboration_id = received.collaboration_id
          and reciprocal.author_id = received.recipient_id
          and reciprocal.recipient_id = received.author_id
      )
  )
  where id = target_profile;
end;
$$;

create or replace function public.refresh_profile_feedback_verification_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_profile_feedback_verification(new.recipient_id);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_profile_feedback_verification(old.recipient_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_refresh_profile_feedback_verification on public.reviews;
create trigger reviews_refresh_profile_feedback_verification
after insert or update or delete on public.reviews
for each row execute function public.refresh_profile_feedback_verification_trigger();

update public.profiles profile
set verified = (
  select count(*) >= 3
  from public.reviews received
  where received.recipient_id = profile.id
    and exists (
      select 1
      from public.reviews reciprocal
      where reciprocal.collaboration_id = received.collaboration_id
        and reciprocal.author_id = received.recipient_id
        and reciprocal.recipient_id = received.author_id
    )
);
