
DROP VIEW IF EXISTS public.public_restaurant_settings;
DROP TRIGGER IF EXISTS update_restaurant_settings_updated_at ON public.restaurant_settings;
DROP POLICY IF EXISTS "Admins can read restaurant settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Admins can update restaurant settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON public.restaurant_settings;
DROP TABLE IF EXISTS public.restaurant_settings;
