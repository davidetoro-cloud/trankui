create policy posts_delete_self on public.posts for delete to authenticated
using (owner_id = (select auth.uid()));

grant delete on public.posts to authenticated;
