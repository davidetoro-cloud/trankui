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

insert into public.user_badges (user_id, badge_id)
select profile.id, badge.id
from public.profiles profile
join public.badges badge on badge.slug = 'crew-zero'
on conflict (user_id, badge_id) do nothing;
