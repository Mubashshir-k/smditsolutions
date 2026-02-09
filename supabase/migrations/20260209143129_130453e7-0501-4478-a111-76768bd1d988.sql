
ALTER TABLE public.restaurant_settings
  ADD COLUMN phone TEXT,
  ADD COLUMN address TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN currency_symbol TEXT NOT NULL DEFAULT '₹',
  ADD COLUMN opening_hours TEXT,
  ADD COLUMN logo_url TEXT,
  ADD COLUMN wifi_password TEXT,
  ADD COLUMN tax_percent NUMERIC NOT NULL DEFAULT 0;
