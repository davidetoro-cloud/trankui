grant usage on schema public to service_role;

do $$
declare
  target_table text;
  target_tables text[] := array[
    'availability',
    'calendar_connections',
    'collaborations',
    'consents',
    'messages',
    'notification_preferences',
    'post_applications',
    'posts',
    'private_contacts',
    'profiles',
    'push_subscriptions',
    'reviews',
    'secondary_roles',
    'support_tickets',
    'user_specializations'
  ];
begin
  foreach target_table in array target_tables loop
    if to_regclass('public.' || target_table) is not null then
      execute format('grant select, delete on table public.%I to service_role', target_table);
    end if;
  end loop;
end $$;
