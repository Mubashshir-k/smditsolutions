
-- Remove permissive public INSERT/UPDATE policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can update tables for active orders" ON public.tables;

-- Orders: admin-only (edge function uses service role for customer orders)
CREATE POLICY "Admins can insert orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Order items: admin-only
CREATE POLICY "Admins can insert order items"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
