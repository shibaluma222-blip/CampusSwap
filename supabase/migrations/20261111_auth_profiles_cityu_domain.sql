-- Applied to Supabase project pfpkklpjdpbayiqcqqvl via MCP on 2026-11-11.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  hall text,
  rating_avg numeric(2,1) not null default 0,
  trades_count integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles readable by signed-in users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (display_name, hall) on public.profiles to authenticated;

create function public.enforce_cityu_email() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or lower(new.email) !~ '^[^@\s]+@(my\.)?cityu\.edu\.hk$' then
    raise exception 'Only CityU email addresses are allowed';
  end if;
  return new;
end; $$;
create trigger enforce_cityu_email before insert or update of email on auth.users
  for each row execute function public.enforce_cityu_email();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name) values (new.id, lower(new.email), split_part(new.email, '@', 1));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.enforce_cityu_email() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
