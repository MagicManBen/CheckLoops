-- Apply the existing sync migration to remote database
-- This ensures staff_app_welcome is always the source of truth for role/team data
-- and kiosk_users stays in sync automatically

-- Run this in Supabase SQL Editor or via supabase db push

-- Safety: run writes as table owner and keep search_path minimal
create or replace function public._saw_sync_kiosk_users()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kiosk_id bigint;
begin
  -- If no site or name, nothing to sync
  if new.site_id is null or coalesce(trim(new.full_name), '') = '' then
    return new;
  end if;

  -- Ensure referenced role exists to satisfy FK (if any)
  if new.role_detail is not null and coalesce(trim(new.role_detail), '') <> '' then
    insert into public.kiosk_roles(role)
    values (new.role_detail)
    on conflict (role) do nothing;
  end if;

  -- Try to find an existing kiosk_user by site + full_name (current app convention)
  select ku.id into v_kiosk_id
  from public.kiosk_users ku
  where ku.site_id = new.site_id
    and ku.full_name = new.full_name
  limit 1;

  if v_kiosk_id is not null then
    -- Update existing record
    update public.kiosk_users
       set role      = coalesce(new.role_detail, kiosk_users.role),
           team_id   = coalesce(new.team_id, kiosk_users.team_id),
           team_name = coalesce(new.team_name, kiosk_users.team_name),
           active    = true
     where id = v_kiosk_id;
  else
    -- Insert new record with available fields
    insert into public.kiosk_users (site_id, full_name, role, team_id, team_name, active)
    values (
      new.site_id,
      new.full_name,
      nullif(trim(coalesce(new.role_detail, '')),''),
      new.team_id,
      new.team_name,
      true
    )
    returning id into v_kiosk_id;
  end if;

  return new;
end;
$$;

-- Attach triggers to staff_app_welcome for both insert and update
drop trigger if exists _saw_sync_kiosk_users_ai on public.staff_app_welcome;
create trigger _saw_sync_kiosk_users_ai
after insert on public.staff_app_welcome
for each row execute function public._saw_sync_kiosk_users();

drop trigger if exists _saw_sync_kiosk_users_au on public.staff_app_welcome;
create trigger _saw_sync_kiosk_users_au
after update on public.staff_app_welcome
for each row execute function public._saw_sync_kiosk_users();