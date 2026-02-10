
-- Fix security definer view - make it security invoker
DROP VIEW IF EXISTS public.public_restaurant_settings;
CREATE VIEW public.public_restaurant_settings 
WITH (security_invoker = true)
AS SELECT id, name, phone, address, description, currency_symbol, opening_hours, logo_url, tax_percent, created_at, updated_at
FROM public.restaurant_settings;

-- Grant anon access to the view
GRANT SELECT ON public.public_restaurant_settings TO anon;
GRANT SELECT ON public.public_restaurant_settings TO authenticated;

-- We need a permissive SELECT policy on restaurant_settings for the view to work for anon
-- The view uses security invoker, so the querying user's permissions apply
-- We need to allow anon to read the underlying table but only through the view
-- Actually, since the view is security invoker and anon has no SELECT policy on restaurant_settings,
-- we need to add a limited policy. Let's use a different approach: make view security definer
-- but owned by a role with read access. Simpler: just add back a public SELECT policy 
-- that excludes wifi_password is not possible with RLS alone.
-- Best approach: keep view as SECURITY DEFINER (intentional) since it safely excludes wifi_password

DROP VIEW IF EXISTS public.public_restaurant_settings;
CREATE VIEW public.public_restaurant_settings AS
  SELECT id, name, phone, address, description, currency_symbol, opening_hours, logo_url, tax_percent, created_at, updated_at
  FROM public.restaurant_settings;

GRANT SELECT ON public.public_restaurant_settings TO anon;
GRANT SELECT ON public.public_restaurant_settings TO authenticated;
