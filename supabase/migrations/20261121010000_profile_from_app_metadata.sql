-- Invitations set the role AFTER the auth user exists: `inviteUserByEmail` creates the
-- user (no app_metadata yet), then the invite-user Edge Function calls
-- `updateUserById(..., { app_metadata: { role } })`. The insert trigger from the init
-- migration never sees that role, so also react to app_metadata changes:
--   * role set and no profile yet  -> create the profile
--   * role changed on an existing profile -> keep profiles.role in sync
-- Only the service role can change app_metadata, so this cannot be used to self-promote.
create function public.handle_user_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := new.raw_app_meta_data ->> 'role';
begin
  if r is null or r not in ('parent', 'teacher', 'admin') then
    return new;
  end if;
  insert into public.profiles (id, role, full_name, email, lang)
  values (new.id, r,
          coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
          new.email,
          coalesce(nullif(new.raw_user_meta_data ->> 'lang', ''), 'en'))
  on conflict (id) do update set role = excluded.role
    where public.profiles.role is distinct from excluded.role;
  return new;
end $$;

create trigger on_auth_user_role_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.handle_user_role_change();
