
-- Remove wifi_password column from restaurant_settings
ALTER TABLE public.restaurant_settings DROP COLUMN IF EXISTS wifi_password;

-- Recreate the public view without wifi_password
DROP VIEW IF EXISTS public.public_restaurant_settings;
CREATE VIEW public.public_restaurant_settings
WITH (security_invoker = true)
AS SELECT id, name, phone, address, description, currency_symbol, opening_hours, logo_url, tax_percent, created_at, updated_at
FROM public.restaurant_settings;

GRANT SELECT ON public.public_restaurant_settings TO anon;
GRANT SELECT ON public.public_restaurant_settings TO authenticated;
