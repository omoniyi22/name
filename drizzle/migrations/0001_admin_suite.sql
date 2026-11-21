-- ============================================================================
-- De-Yula admin suite
-- Replaces the old Express + Prisma backend with Supabase (Postgres + RLS).
-- Safe to run more than once.
--
-- Adds: admin accounts, contacts (subscribers), tags, inquiries/appointments,
--       newsletter history, admin settings, public RPCs for the website forms,
--       and a storage bucket for newsletter images.
-- ============================================================================

-- 0. contact_details: make sure the second email column exists ---------------
alter table public.contact_details
  add column if not exists email_secondary text not null default '';

-- 1. Admin accounts ----------------------------------------------------------
-- One row per person allowed into /admin. Super admins can manage other admins.
create table if not exists public.admin_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  is_active      boolean not null default true,
  is_super_admin boolean not null default false,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create unique index if not exists admin_profiles_email_key on public.admin_profiles (lower(email));
alter table public.admin_profiles enable row level security;

create or replace function public.is_admin(_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_profiles p where p.user_id = _uid and p.is_active) $$;

create or replace function public.is_super_admin(_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_profiles p where p.user_id = _uid and p.is_active and p.is_super_admin) $$;

revoke execute on function public.is_admin(uuid), public.is_super_admin(uuid) from public, anon;
grant  execute on function public.is_admin(uuid), public.is_super_admin(uuid) to authenticated, service_role;

grant select on public.admin_profiles to authenticated;
grant all    on public.admin_profiles to service_role;

drop policy if exists "Admins read own profile, super admins read all" on public.admin_profiles;
create policy "Admins read own profile, super admins read all" on public.admin_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
-- No insert/update/delete policies on purpose: admin accounts are created and
-- changed only by the server functions (service role) after a super-admin check.

-- Keep the older user_roles table in step (the original contact-details policies used it).
create or replace function public.sync_admin_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.user_roles (user_id, role) values (new.user_id, 'admin') on conflict do nothing;
    return new;
  elsif tg_op = 'DELETE' then
    delete from public.user_roles where user_id = old.user_id and role = 'admin';
    return old;
  end if;
  return null;
end $$;

drop trigger if exists admin_profiles_sync_role on public.admin_profiles;
create trigger admin_profiles_sync_role after insert or delete on public.admin_profiles
  for each row execute function public.sync_admin_role();

-- The owner email becomes the first super admin automatically when the account is created.
create or replace function public.grant_owner_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if lower(new.email) = 'omoniyioluwaseun22@gmail.com' then
    insert into public.admin_profiles (user_id, email, is_active, is_super_admin)
    values (new.id, lower(new.email), true, true)
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

-- Back-fill: anyone who was already an admin (and the owner, if they exist) gets a profile.
insert into public.admin_profiles (user_id, email, is_active, is_super_admin)
select u.id, lower(u.email), true, lower(u.email) = 'omoniyioluwaseun22@gmail.com'
from auth.users u
where u.email is not null
  and ( lower(u.email) = 'omoniyioluwaseun22@gmail.com'
        or exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin') )
on conflict (user_id) do nothing;

-- Existing contact-details policies now respect deactivated admins too.
drop policy if exists "Admins update contact details" on public.contact_details;
drop policy if exists "Admins insert contact details" on public.contact_details;
create policy "Admins update contact details" on public.contact_details
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins insert contact details" on public.contact_details
  for insert to authenticated with check (public.is_admin());

-- 2. Contacts, tags ----------------------------------------------------------
create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text,
  phone         text,
  subscribed    boolean not null default true,
  source        text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);
create unique index if not exists contacts_email_key on public.contacts (lower(email));
create index if not exists contacts_last_seen_idx on public.contacts (last_seen_at desc);
alter table public.contacts enable row level security;

create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 50),
  created_at timestamptz not null default now()
);
create unique index if not exists tags_name_key on public.tags (lower(name));
alter table public.tags enable row level security;

create table if not exists public.contact_tags (
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);
create index if not exists contact_tags_tag_idx on public.contact_tags (tag_id);
alter table public.contact_tags enable row level security;

-- 3. Inquiries (contact messages + appointment requests) ---------------------
create table if not exists public.inquiries (
  id             uuid primary key default gen_random_uuid(),
  type           text not null default 'contact' check (type in ('contact', 'appointment')),
  name           text not null,
  email          text,
  phone          text,
  subject        text,
  message        text not null default '',
  service        text,
  preferred_date date,
  handled        boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
alter table public.inquiries enable row level security;

-- 4. Newsletter history + admin settings ------------------------------------
create table if not exists public.newsletter_history (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid references auth.users(id) on delete set null,
  sent_by_email   text,
  subject         text not null,
  html            text not null,
  recipient_count int not null default 0,
  sent_count      int not null default 0,
  failed_count    int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists newsletter_history_created_idx on public.newsletter_history (created_at desc);
alter table public.newsletter_history enable row level security;

-- Kept apart from contact_details because that table is public-readable.
create table if not exists public.admin_settings (
  id           int primary key default 1 check (id = 1),
  notify_email text,
  updated_at   timestamptz not null default now()
);
insert into public.admin_settings (id) values (1) on conflict (id) do nothing;
alter table public.admin_settings enable row level security;

-- 5. Grants + policies (admins only; the public goes through the RPCs below) -
grant select, insert, update, delete on public.contacts, public.tags, public.contact_tags to authenticated;
grant select, update, delete         on public.inquiries to authenticated;
grant select                         on public.newsletter_history to authenticated;
grant select, insert, update         on public.admin_settings to authenticated;
grant all on public.contacts, public.tags, public.contact_tags, public.inquiries,
             public.newsletter_history, public.admin_settings to service_role;

drop policy if exists "Admins manage contacts" on public.contacts;
create policy "Admins manage contacts" on public.contacts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage tags" on public.tags;
create policy "Admins manage tags" on public.tags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage contact tags" on public.contact_tags;
create policy "Admins manage contact tags" on public.contact_tags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read inquiries" on public.inquiries;
drop policy if exists "Admins update inquiries" on public.inquiries;
drop policy if exists "Admins delete inquiries" on public.inquiries;
create policy "Admins read inquiries"   on public.inquiries for select to authenticated using (public.is_admin());
create policy "Admins update inquiries" on public.inquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete inquiries" on public.inquiries for delete to authenticated using (public.is_admin());

drop policy if exists "Admins read newsletter history" on public.newsletter_history;
create policy "Admins read newsletter history" on public.newsletter_history
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins read settings"   on public.admin_settings;
drop policy if exists "Admins insert settings" on public.admin_settings;
drop policy if exists "Admins update settings" on public.admin_settings;
create policy "Admins read settings"   on public.admin_settings for select to authenticated using (public.is_admin());
create policy "Admins insert settings" on public.admin_settings for insert to authenticated with check (public.is_admin());
create policy "Admins update settings" on public.admin_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. Admin-only helpers ------------------------------------------------------
-- Paged, searchable, tag-filterable contact list (one round trip, tags included).
create or replace function public.list_contacts(
  p_search     text    default null,
  p_tag_ids    uuid[]  default null,
  p_subscribed boolean default null,
  p_limit      int     default 20,
  p_offset     int     default 0
) returns jsonb
language plpgsql stable security invoker set search_path = public
as $$
declare
  v_like   text := null;
  v_result jsonb;
begin
  if nullif(btrim(coalesce(p_search, '')), '') is not null then
    v_like := '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  with f as (
    select c.*
    from public.contacts c
    where (p_subscribed is null or c.subscribed = p_subscribed)
      and (v_like is null or c.email ilike v_like or c.name ilike v_like or c.phone ilike v_like)
      and (p_tag_ids is null or cardinality(p_tag_ids) = 0 or exists (
            select 1 from public.contact_tags ct
            where ct.contact_id = c.id and ct.tag_id = any (p_tag_ids)))
  ),
  page as (
    select * from f order by last_seen_at desc, id
    limit greatest(least(coalesce(p_limit, 20), 200), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'email', p.email, 'name', p.name, 'phone', p.phone,
        'subscribed', p.subscribed, 'source', p.source,
        'first_seen_at', p.first_seen_at, 'last_seen_at', p.last_seen_at,
        'tags', coalesce((
          select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name) order by t.name)
          from public.contact_tags ct join public.tags t on t.id = ct.tag_id
          where ct.contact_id = p.id), '[]'::jsonb)
      ) order by p.last_seen_at desc, p.id) from page p), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

-- Replace a contact's tags in one go.
create or replace function public.set_contact_tags(p_contact_id uuid, p_tag_ids uuid[])
returns void language plpgsql security invoker set search_path = public
as $$
begin
  delete from public.contact_tags where contact_id = p_contact_id;
  if p_tag_ids is not null and cardinality(p_tag_ids) > 0 then
    insert into public.contact_tags (contact_id, tag_id)
    select p_contact_id, t from unnest(p_tag_ids) as t
    on conflict do nothing;
  end if;
end $$;

-- Who a newsletter would reach: subscribed contacts, optionally narrowed to any of the tags.
create or replace function public.newsletter_recipients(p_tag_ids uuid[] default null)
returns table (id uuid, email text, name text)
language sql stable security invoker set search_path = public
as $$
  select c.id, c.email, c.name
  from public.contacts c
  where c.subscribed
    and (p_tag_ids is null or cardinality(p_tag_ids) = 0 or exists (
          select 1 from public.contact_tags ct
          where ct.contact_id = c.id and ct.tag_id = any (p_tag_ids)))
  order by c.email
$$;

create or replace function public.newsletter_recipient_count(p_tag_ids uuid[] default null)
returns bigint
language sql stable security invoker set search_path = public
as $$ select count(*) from public.newsletter_recipients(p_tag_ids) $$;

revoke execute on function public.list_contacts(text, uuid[], boolean, int, int),
                           public.set_contact_tags(uuid, uuid[]),
                           public.newsletter_recipients(uuid[]),
                           public.newsletter_recipient_count(uuid[]) from public, anon;
grant  execute on function public.list_contacts(text, uuid[], boolean, int, int),
                           public.set_contact_tags(uuid, uuid[]),
                           public.newsletter_recipients(uuid[]),
                           public.newsletter_recipient_count(uuid[]) to authenticated, service_role;

-- 7. Public RPCs used by the website (the only way anonymous visitors write) -
create or replace function public.submit_inquiry(
  p_type           text,
  p_name           text,
  p_email          text    default null,
  p_phone          text    default null,
  p_subject        text    default null,
  p_message        text    default '',
  p_service        text    default null,
  p_preferred_date date    default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_phone   text := btrim(coalesce(p_phone, ''));
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_service text := btrim(coalesce(p_service, ''));
  v_id      uuid;
begin
  if p_type is null or p_type not in ('contact', 'appointment') then
    raise exception 'invalid_type' using errcode = '22023';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 200 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_email <> '' and (char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(v_phone) > 50 or char_length(v_subject) > 200 or char_length(v_service) > 200 or char_length(v_message) > 5000 then
    raise exception 'too_long' using errcode = '22023';
  end if;
  if v_email = '' and v_phone = '' then
    raise exception 'contact_required' using errcode = '22023';
  end if;
  if p_type = 'contact' and v_message = '' then
    raise exception 'message_required' using errcode = '22023';
  end if;

  -- Simple flood guard: at most 5 submissions per email/phone per hour.
  if (select count(*) from public.inquiries i
      where i.created_at > now() - interval '1 hour'
        and ((v_email <> '' and lower(i.email) = v_email) or (v_phone <> '' and i.phone = v_phone))) >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  insert into public.inquiries (type, name, email, phone, subject, message, service, preferred_date)
  values (p_type, v_name, nullif(v_email, ''), nullif(v_phone, ''), nullif(v_subject, ''),
          v_message, nullif(v_service, ''), p_preferred_date)
  returning id into v_id;

  -- Remember the person as a contact, but never subscribe them just for sending a message.
  if v_email <> '' then
    insert into public.contacts (email, name, phone, subscribed, source)
    values (v_email, nullif(v_name, ''), nullif(v_phone, ''), false, p_type)
    on conflict ((lower(email))) do update
      set name         = coalesce(public.contacts.name, excluded.name),
          phone        = coalesce(public.contacts.phone, excluded.phone),
          last_seen_at = now();
  end if;

  return v_id;
end $$;

create or replace function public.subscribe_newsletter(
  p_email text,
  p_name  text default null,
  p_phone text default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(coalesce(p_name, '')) > 200 or char_length(coalesce(p_phone, '')) > 50 then
    raise exception 'too_long' using errcode = '22023';
  end if;

  insert into public.contacts (email, name, phone, subscribed, source)
  values (v_email, nullif(btrim(coalesce(p_name, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''), true, 'newsletter_subscription')
  on conflict ((lower(email))) do update
    set subscribed   = true,
        name         = coalesce(public.contacts.name, excluded.name),
        phone        = coalesce(public.contacts.phone, excluded.phone),
        source       = coalesce(public.contacts.source, excluded.source),
        last_seen_at = now();
end $$;

create or replace function public.unsubscribe_contact(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  update public.contacts set subscribed = false, last_seen_at = now() where id = p_id;
  return found;
end $$;

revoke execute on function public.submit_inquiry(text, text, text, text, text, text, text, date),
                           public.subscribe_newsletter(text, text, text),
                           public.unsubscribe_contact(uuid) from public;
grant  execute on function public.submit_inquiry(text, text, text, text, text, text, text, date),
                           public.subscribe_newsletter(text, text, text),
                           public.unsubscribe_contact(uuid) to anon, authenticated, service_role;

-- 8. Storage: public bucket for newsletter images, admins only can upload ----
insert into storage.buckets (id, name, public)
values ('newsletter-images', 'newsletter-images', true)
on conflict (id) do nothing;

drop policy if exists "Admins upload newsletter images" on storage.objects;
drop policy if exists "Admins update newsletter images" on storage.objects;
drop policy if exists "Admins delete newsletter images" on storage.objects;
create policy "Admins upload newsletter images" on storage.objects
  for insert to authenticated with check (bucket_id = 'newsletter-images' and public.is_admin());
create policy "Admins update newsletter images" on storage.objects
  for update to authenticated using (bucket_id = 'newsletter-images' and public.is_admin());
create policy "Admins delete newsletter images" on storage.objects
  for delete to authenticated using (bucket_id = 'newsletter-images' and public.is_admin());
