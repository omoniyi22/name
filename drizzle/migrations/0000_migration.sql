create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.contact_details (
  id int primary key default 1 check (id = 1),
  email text not null default '',
  phone text not null default '',
  emergency_phone text not null default '',
  whatsapp text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  address text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.contact_details to anon, authenticated;
grant insert, update on public.contact_details to authenticated;
grant all on public.contact_details to service_role;
alter table public.contact_details enable row level security;
create policy "Anyone can read contact details" on public.contact_details for select to anon, authenticated using (true);
create policy "Admins update contact details" on public.contact_details for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert contact details" on public.contact_details for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

insert into public.contact_details (id, email, phone, emergency_phone, whatsapp, instagram, facebook, address)
values (1, 'care@meridianhospital.com', '+234 800 000 0000', '+234 800 911 0000', '+234 800 000 0000', 'https://instagram.com/meridianhospital', 'https://facebook.com/meridianhospital', '12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria');

create or replace function public.grant_owner_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if lower(new.email) = 'omoniyioluwaseun22@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.grant_owner_admin();