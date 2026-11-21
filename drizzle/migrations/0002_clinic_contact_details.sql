-- Clinic contact details (replaces the template placeholders).
-- Phone / WhatsApp number 1 = phone, number 2 = whatsapp.
insert into public.contact_details (id, email, phone, whatsapp, address)
values (1, 'deyulaspecialisthospital@gmail.com', '08160274768', '08084391239', '1 Akinlade Avenue, off Alaja Road, Ayobo, Lagos')
on conflict (id) do update set
  email = excluded.email,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  address = excluded.address,
  updated_at = now();

-- Clear the old template social links and emergency number, only if they were never changed.
update public.contact_details set instagram = '' where id = 1 and instagram like '%meridianhospital%';
update public.contact_details set facebook = '' where id = 1 and facebook like '%meridianhospital%';
update public.contact_details set emergency_phone = '' where id = 1;
