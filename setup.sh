#!/bin/bash

# ============================================================
#  PAUDRONIX GT — Script de instalación automática
#  Corre este script UNA VEZ después de clonar el proyecto
#  Uso: bash setup.sh
# ============================================================

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()  { echo -e "${GREEN}✔ $1${NC}"; }
info(){ echo -e "${YELLOW}➜ $1${NC}"; }
err() { echo -e "${RED}✖ $1${NC}"; exit 1; }

echo ""
echo -e "${BOLD}============================================${NC}"
echo -e "${BOLD}   PAUDRONIX GT — Instalación automática   ${NC}"
echo -e "${BOLD}============================================${NC}"
echo ""

# ── 1. Verificar que somos root ─────────────────────────────
if [ "$EUID" -ne 0 ]; then
  err "Debes correr este script como root: sudo bash setup.sh"
fi

# ── 2. Actualizar sistema ───────────────────────────────────
info "Actualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq
ok "Sistema actualizado"

# ── 3. Instalar Node.js 20 ──────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node.js $(node -v) instalado"
else
  ok "Node.js $(node -v) ya está instalado"
fi

# ── 4. Instalar PostgreSQL ──────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Instalando PostgreSQL..."
  apt-get install -y postgresql postgresql-contrib -qq
  systemctl enable postgresql
  systemctl start postgresql
  ok "PostgreSQL instalado"
else
  ok "PostgreSQL ya está instalado"
fi

# ── 5. Instalar nginx ───────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  info "Instalando nginx..."
  apt-get install -y nginx -qq
  ok "nginx instalado"
else
  ok "nginx ya está instalado"
fi

# ── 6. Instalar PM2 ────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2..."
  npm install -g pm2 -q
  ok "PM2 instalado"
else
  ok "PM2 ya está instalado"
fi

# ── 7. Instalar sshpass y utilidades ───────────────────────
apt-get install -y sshpass curl unzip -qq 2>/dev/null || true

# ── 8. Recopilar datos de configuración ────────────────────
echo ""
echo -e "${BOLD}--- Configuración de la plataforma ---${NC}"
echo "Completa los datos. Presiona Enter para continuar."
echo ""

read -p "  Dominio o IP pública del servidor (ej: 138.197.98.83 o midominio.com): " DOMINIO
read -p "  Nombre de la base de datos (ej: paudronix): " DB_NAME
read -p "  Usuario de la base de datos (ej: paudronix): " DB_USER
read -s -p "  Contraseña de la base de datos: " DB_PASS
echo ""
read -p "  Puerto en que correrá el app (default: 5000): " APP_PORT
APP_PORT=${APP_PORT:-5000}
echo "  (Las claves de Resend, Google y PayPal ya están en el código — se usan automáticamente)"
RESEND_KEY=""
GOOGLE_ID=""
GOOGLE_SECRET=""
PAYPAL_ID=""
PAYPAL_SECRET=""

SESSION_SECRET=$(openssl rand -hex 32)

echo ""
info "Creando base de datos..."

# ── 9. Crear usuario y base de datos PostgreSQL ─────────────
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
ok "Base de datos '$DB_NAME' lista"

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# ── 10. Crear archivo .env ──────────────────────────────────
info "Creando archivo .env..."
cat > .env << EOF
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
PORT=$APP_PORT
NODE_ENV=production
RESEND_API_KEY=$RESEND_KEY
GOOGLE_CLIENT_ID=$GOOGLE_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_SECRET
PAYPAL_CLIENT_ID=$PAYPAL_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_SECRET
EOF
ok "Archivo .env creado"

# ── 11. Instalar dependencias npm ───────────────────────────
info "Instalando dependencias (puede tardar unos minutos)..."
npm install --production=false -q
ok "Dependencias instaladas"

# ── 12. Construir el proyecto ───────────────────────────────
info "Construyendo el proyecto..."
npm run build
ok "Proyecto construido"

# ── 13. Correr migraciones de base de datos ─────────────────
info "Aplicando migraciones a la base de datos..."
cat > /tmp/migrate.sql << 'SQLEOF'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS game_code TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id VARCHAR;
ALTER TABLE games ADD COLUMN IF NOT EXISTS logo_image TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS country_image TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS country_text TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'code';
ALTER TABLE games ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS requires_customer_email BOOLEAN DEFAULT false;
ALTER TABLE games ADD COLUMN IF NOT EXISTS customer_email_label TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS stream_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_customer_email BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customer_email_label TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_method_ids TEXT DEFAULT '[]';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS renewal_code TEXT DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS expiration_notified BOOLEAN DEFAULT false;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS credential_name TEXT DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS credential_instructions TEXT DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS order_id VARCHAR DEFAULT '';
ALTER TABLE renewal_requests ADD COLUMN IF NOT EXISTS paypal_order_id TEXT DEFAULT '';
ALTER TABLE renewal_requests ADD COLUMN IF NOT EXISTS months INTEGER DEFAULT 1;
ALTER TABLE renewal_requests ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0;
ALTER TABLE renewal_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
ALTER TABLE renewal_requests ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'screenshot';
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS agent_index INTEGER DEFAULT 0;
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS agent_image TEXT DEFAULT '';
CREATE TABLE IF NOT EXISTS fortnite_items (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', image2 TEXT DEFAULT '', image3 TEXT DEFAULT '', section TEXT DEFAULT '', images_json TEXT DEFAULT '[]', pavos INTEGER DEFAULT 0, price REAL DEFAULT 0, original_price REAL DEFAULT 0, is_active BOOLEAN DEFAULT true, "order" INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS multimedia (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, url TEXT NOT NULL, type TEXT NOT NULL, is_active BOOLEAN DEFAULT true, is_hero BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS featured_sections (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT DEFAULT '', image TEXT NOT NULL, link TEXT DEFAULT '', "order" INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS banners (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), image TEXT NOT NULL, title TEXT DEFAULT '', link TEXT DEFAULT '', "order" INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS tv_channels (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, "group" TEXT DEFAULT 'General', logo TEXT DEFAULT '', stream_url TEXT NOT NULL, is_active BOOLEAN DEFAULT true, "order" INTEGER DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS seller_transactions (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), seller_id VARCHAR NOT NULL, order_id VARCHAR NOT NULL, amount INTEGER NOT NULL, type TEXT NOT NULL, description TEXT DEFAULT '', created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS seller_withdrawals (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), seller_id VARCHAR NOT NULL, amount INTEGER NOT NULL, payment_method TEXT NOT NULL, account_number TEXT NOT NULL, account_name TEXT NOT NULL, account_type TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT NOW(), processed_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS recharge_payment_methods (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, type TEXT NOT NULL, account_number TEXT DEFAULT '', account_name TEXT DEFAULT '', instructions TEXT DEFAULT '', logo TEXT DEFAULT '', is_active BOOLEAN DEFAULT true, "order" INTEGER DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS recharge_requests (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR NOT NULL, user_name TEXT NOT NULL, user_email TEXT DEFAULT '', amount INTEGER NOT NULL, payment_method_id VARCHAR NOT NULL, payment_method_name TEXT NOT NULL, screenshot TEXT DEFAULT '', code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', admin_notes TEXT DEFAULT '', created_at TIMESTAMP NOT NULL DEFAULT NOW(), processed_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS user_transactions (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, description TEXT DEFAULT '', reference_id VARCHAR DEFAULT '', created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS discount_codes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, discount_type TEXT NOT NULL DEFAULT 'percentage', discount_value INTEGER NOT NULL, description TEXT DEFAULT '', max_uses INTEGER, used_count INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS product_credentials (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), product_id VARCHAR NOT NULL, cred_email TEXT NOT NULL, cred_password TEXT NOT NULL, cred_instructions TEXT DEFAULT '', is_used BOOLEAN DEFAULT false, used_by_order_id VARCHAR DEFAULT '', assigned_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS banned_emails (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR NOT NULL UNIQUE, reason TEXT DEFAULT '', banned_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS support_agents (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, image TEXT DEFAULT '', is_active BOOLEAN DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS referral_program (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT false, title TEXT DEFAULT 'Programa de Referidos', description TEXT DEFAULT 'Comparte tu link y gana saldo', register_bonus REAL DEFAULT 1, purchase_bonus REAL DEFAULT 4, updated_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS referral_transactions (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), referrer_id VARCHAR NOT NULL, referred_user_id VARCHAR NOT NULL, order_id VARCHAR DEFAULT '', type TEXT NOT NULL, amount REAL NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS problem_reports (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR NOT NULL, user_name TEXT NOT NULL, user_email TEXT DEFAULT '', subscription_id VARCHAR DEFAULT '', subscription_name TEXT DEFAULT '', description TEXT NOT NULL, image TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open', admin_notes TEXT DEFAULT '', refunded BOOLEAN DEFAULT false, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS client_messages (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR NOT NULL, message TEXT DEFAULT '', is_read BOOLEAN DEFAULT false, created_at TIMESTAMP NOT NULL DEFAULT NOW());
SELECT 'MIGRACION COMPLETA OK' AS resultado;
SQLEOF

psql "$DATABASE_URL" -f /tmp/migrate.sql
ok "Migraciones aplicadas"

# ── 14. Crear carpeta de uploads ────────────────────────────
mkdir -p uploads
chmod 755 uploads
ok "Carpeta uploads lista"

# ── 15. Configurar PM2 ──────────────────────────────────────
info "Configurando PM2..."
APP_DIR=$(pwd)
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'paudronix',
    script: '$APP_DIR/dist/index.cjs',
    env_file: '$APP_DIR/.env',
    restart_delay: 3000,
    max_restarts: 10
  }]
};
EOF

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true
ok "PM2 configurado y app corriendo"

# ── 16. Configurar nginx ────────────────────────────────────
info "Configurando nginx..."
cat > /etc/nginx/sites-available/paudronix << EOF
server {
    listen 80;
    server_name $DOMINIO;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/paudronix /etc/nginx/sites-enabled/paudronix
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "nginx configurado"

# ── 17. Resumen final ───────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}============================================${NC}"
echo -e "${BOLD}${GREEN}   ✅ Instalación completada exitosamente   ${NC}"
echo -e "${BOLD}${GREEN}============================================${NC}"
echo ""
echo -e "  🌐 Tu app está corriendo en: ${BOLD}http://$DOMINIO${NC}"
echo -e "  🔑 Usuario admin:   ${BOLD}paudronixGt123@${NC}"
echo -e "  🔑 Contraseña admin: ${BOLD}paudronix123GT%${NC}"
echo -e "  📁 Carpeta del proyecto: ${BOLD}$(pwd)${NC}"
echo ""
echo -e "  Comandos útiles:"
echo -e "    Ver logs:      ${BOLD}pm2 logs paudronix${NC}"
echo -e "    Reiniciar:     ${BOLD}pm2 restart paudronix${NC}"
echo -e "    Ver estado:    ${BOLD}pm2 status${NC}"
echo ""
