
-- 1. Create app_role enum and admin_users table for RBAC
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Create public view for restaurant_settings (excludes wifi_password)
CREATE VIEW public.public_restaurant_settings AS
  SELECT id, name, phone, address, description, currency_symbol, opening_hours, logo_url, tax_percent, created_at, updated_at
  FROM public.restaurant_settings;

-- 4. Update restaurant_settings RLS: restrict full read to admins only
DROP POLICY "Anyone can read restaurant settings" ON public.restaurant_settings;
CREATE POLICY "Admins can read restaurant settings" ON public.restaurant_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update admin write policies on food_categories
DROP POLICY "Authenticated can manage food categories" ON public.food_categories;
CREATE POLICY "Admins can manage food categories" ON public.food_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Update admin write policies on menu_items
DROP POLICY "Authenticated can manage menu items" ON public.menu_items;
CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Update admin write policies on menu_item_pricing
DROP POLICY "Authenticated can manage menu item pricing" ON public.menu_item_pricing;
CREATE POLICY "Admins can manage menu item pricing" ON public.menu_item_pricing
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Update admin write policies on tables
DROP POLICY "Authenticated can manage tables" ON public.tables;
CREATE POLICY "Admins can manage tables" ON public.tables
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Update admin write policies on order_items
DROP POLICY "Authenticated can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. Restrict orders SELECT to authenticated only
DROP POLICY "Anyone can read orders" ON public.orders;
CREATE POLICY "Authenticated can read orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

-- 11. Restrict order_items SELECT to authenticated only
DROP POLICY "Anyone can read order items" ON public.order_items;
CREATE POLICY "Authenticated can read order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);

-- 12. Update restaurant_settings UPDATE policy to admin only
DROP POLICY "Authenticated users can update restaurant settings" ON public.restaurant_settings;
CREATE POLICY "Admins can update restaurant settings" ON public.restaurant_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
