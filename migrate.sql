-- =====================================================
-- PAUDRONIX GT — Script de migración completo
-- Ejecutar en el VPS antes de reiniciar el servidor
-- =====================================================

-- TABLA: products (columnas nuevas)
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_method_ids TEXT DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_customer_email BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customer_email_label TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS enable_bot_reviews BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'none';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_email TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_email TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_password TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_instructions TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS binance_data TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS binance_name TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS binance_instructions TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS banrural_data TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS banrural_name TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS banrural_instructions TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bac_data TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bac_name TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bac_instructions TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bi_data TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bi_name TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bi_instructions TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_binance BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_banrural BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_bac BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_bi BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT -1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stream_url TEXT;

-- TABLA: orders (columnas nuevas)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS game_code TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id VARCHAR;

-- TABLA: games (columnas nuevas)
ALTER TABLE games ADD COLUMN IF NOT EXISTS logo_image TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS country_image TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS country_text TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'code';
ALTER TABLE games ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS requires_customer_email BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS customer_email_label TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- TABLA: categories (columnas nuevas)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS stream_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS label TEXT;

-- TABLA: fortnite_items (tabla nueva completa)
CREATE TABLE IF NOT EXISTS fortnite_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  image2 TEXT DEFAULT '',
  image3 TEXT DEFAULT '',
  section TEXT DEFAULT '',
  images_json TEXT DEFAULT '[]',
  pavos INTEGER DEFAULT 0,
  price REAL DEFAULT 0,
  original_price REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: product_reviews (tabla nueva si no existe)
CREATE TABLE IF NOT EXISTS product_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR NOT NULL,
  user_id VARCHAR,
  author_name TEXT DEFAULT '',
  rating INTEGER DEFAULT 5,
  comment TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: user_subscriptions (columnas nuevas)
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS credential_name TEXT DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS credential_instructions TEXT DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS order_id VARCHAR DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS renewal_code TEXT DEFAULT '';

-- TABLA: discount_codes (tabla nueva si no existe)
CREATE TABLE IF NOT EXISTS discount_codes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT DEFAULT 'percent',
  discount_value REAL DEFAULT 0,
  max_uses INTEGER DEFAULT -1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: recharge_payment_methods (tabla nueva si no existe)
CREATE TABLE IF NOT EXISTS recharge_payment_methods (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'bank',
  account_number TEXT DEFAULT '',
  account_name TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  image TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0
);

-- TABLA: support_agents (columnas nuevas)
ALTER TABLE support_agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- TABLA: banned_emails (tabla nueva si no existe)
CREATE TABLE IF NOT EXISTS banned_emails (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

SELECT 'Migración completada exitosamente' AS resultado;
