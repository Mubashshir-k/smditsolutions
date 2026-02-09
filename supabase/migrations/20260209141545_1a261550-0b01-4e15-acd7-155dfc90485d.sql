
-- Restaurant settings
CREATE TABLE public.restaurant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Restaurant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read restaurant settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update restaurant settings" ON public.restaurant_settings FOR UPDATE TO authenticated USING (true);

-- Insert default settings
INSERT INTO public.restaurant_settings (name) VALUES ('My Restaurant');

-- Food categories
CREATE TABLE public.food_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food categories" ON public.food_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage food categories" ON public.food_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Menu items
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.food_categories(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage menu items" ON public.menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Menu item pricing
CREATE TABLE public.menu_item_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL UNIQUE,
  has_half_full BOOLEAN NOT NULL DEFAULT false,
  half_price NUMERIC,
  full_price NUMERIC,
  single_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_item_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read menu item pricing" ON public.menu_item_pricing FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage menu item pricing" ON public.menu_item_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tables
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  active_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage tables" ON public.tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- Order items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  portion TEXT NOT NULL DEFAULT 'single' CHECK (portion IN ('half', 'full', 'single')),
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can manage order items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
