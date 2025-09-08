-- Create source-of-truth table for staff welcome onboarding
create table if not exists public.staff_app_welcome (
  user_id uuid primary key references auth.users(id) on delete cascade,
  site_id bigint not null references public.sites(id) on delete restrict,
  full_name text,
  nickname text,
  role_detail text,
  team_id bigint references public.teams(id),
  team_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at trigger
create or replace function public._saw_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

drop trigger if exists _saw_touch_updated_at on public.staff_app_welcome;
create trigger _saw_touch_updated_at
before update on public.staff_app_welcome
for each row execute function public._saw_touch_updated_at();

-- RLS: only owner can read/write their record; admins can be expanded later as needed
alter table public.staff_app_welcome enable row level security;

-- Allow a signed-in user to insert their own record
create policy "saw_insert_own" on public.staff_app_welcome
  for insert to authenticated
  with check (user_id = auth.uid());

-- Allow a signed-in user to select their own record
create policy "saw_select_own" on public.staff_app_welcome
  for select to authenticated
  using (user_id = auth.uid());

-- Allow a signed-in user to update their own record
create policy "saw_update_own" on public.staff_app_welcome
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

