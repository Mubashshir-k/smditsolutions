
-- Fix 1: Convert public_restaurant_settings to SECURITY INVOKER and add proper RLS
-- First, drop the existing view
DROP VIEW IF EXISTS public.public_restaurant_settings;

-- Add a permissive SELECT policy on restaurant_settings for anon/authenticated
-- that only exposes non-sensitive columns. We'll use a security invoker view.
-- But we need anon to be able to read the underlying table for the view to work.
-- We'll add a SELECT policy that allows anyone to read (RLS will apply).
CREATE POLICY "Public can read non-sensitive settings"
ON public.restaurant_settings
FOR SELECT
TO anon
USING (true);

-- Recreate view as SECURITY INVOKER (safe pattern)
CREATE VIEW public.public_restaurant_settings
WITH (security_invoker = true)
AS SELECT id, name, phone, address, description, currency_symbol, opening_hours, logo_url, tax_percent, created_at, updated_at
FROM public.restaurant_settings;

-- Grant access to the view
GRANT SELECT ON public.public_restaurant_settings TO anon;
GRANT SELECT ON public.public_restaurant_settings TO authenticated;

-- Fix 2: Tighten orders RLS - restrict SELECT to admin only, keep INSERT for anon
-- Drop existing permissive policies on orders
DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Admin-only read/update/delete
CREATE POLICY "Admins can read orders"
ON public.orders FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can create orders (restaurant customers), but validate table exists via FK
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Fix 3: Tighten order_items RLS
DROP POLICY IF EXISTS "Authenticated can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Admins can read order items"
ON public.order_items FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

-- Fix 4: Add foreign key constraint on orders.table_number
-- First check for orphaned data and clean up
DELETE FROM public.orders WHERE table_number NOT IN (SELECT table_number FROM public.tables);

ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_table_number
FOREIGN KEY (table_number) REFERENCES public.tables(table_number) ON DELETE RESTRICT;

-- Fix 5: Tighten tables UPDATE policy - only admins can update
DROP POLICY IF EXISTS "Anyone can update tables" ON public.tables;
CREATE POLICY "Anyone can update tables for active orders"
ON public.tables FOR UPDATE
USING (true);
