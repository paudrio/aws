#!/bin/bash
# ============================================================
# PAUDRONIX GT - Script de instalacion automatica para VPS
# Solo ejecuta: bash setup-vps.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║        PAUDRONIX GT - Instalador         ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

APP_DIR="/var/www/paudronix"

# ── PASO 1: Actualizar sistema ────────────────────────────────
echo -e "${YELLOW}[1/8] Actualizando sistema...${NC}"
apt-get update -y -q
apt-get install -y -q curl wget git ufw build-essential

# ── PASO 2: Instalar Node.js 20 ──────────────────────────────
echo -e "${YELLOW}[2/8] Instalando Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -q
  apt-get install -y -q nodejs
fi
echo -e "${GREEN}Node: $(node --version) | NPM: $(npm --version)${NC}"

# ── PASO 3: Instalar PM2 ─────────────────────────────────────
echo -e "${YELLOW}[3/8] Instalando PM2...${NC}"
npm install -g pm2 --quiet

# ── PASO 4: Configurar firewall (abre todos los puertos necesarios) ──
echo -e "${YELLOW}[4/8] Configurando firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw allow 5000/tcp   # App (acceso directo por si acaso)
ufw allow 3000/tcp   # Alternativa
ufw --force enable
echo -e "${GREEN}Firewall configurado. Puertos 22, 80, 443, 5000 abiertos.${NC}"

# ── PASO 5: Crear directorio de la app ───────────────────────
echo -e "${YELLOW}[5/8] Preparando directorio...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/data

# ── PASO 6: Instalar dependencias ────────────────────────────
echo -e "${YELLOW}[6/8] Instalando dependencias de la app...${NC}"
cd $APP_DIR
if [ -f "package.json" ]; then
  npm install --quiet
else
  echo -e "${RED}ERROR: No se encontro package.json en $APP_DIR${NC}"
  echo "Asegurate de subir el codigo primero."
  exit 1
fi

# ── PASO 7: Crear .env si no existe ──────────────────────────
echo -e "${YELLOW}[7/8] Configurando variables de entorno...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  Solo necesito 3 datos — el resto ya esta en el codigo:    ║${NC}"
  echo -e "${YELLOW}║  (Google, Gmail, PayPal ya estan incluidos automaticamente)║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  read -p "  Base de datos PostgreSQL (DATABASE_URL): " DB_URL
  read -p "  Frase secreta de sesion (cualquier texto largo): " SESSION_SECRET
  read -p "  URL de tu dominio (ej: https://paudronix.com): " APP_URL

  cat > $APP_DIR/.env << EOF
DATABASE_URL=${DB_URL}
SESSION_SECRET=${SESSION_SECRET}
APP_URL=${APP_URL}
NODE_ENV=production
PORT=5000
EOF

  echo -e "${GREEN}.env creado correctamente. Google OAuth, Gmail y PayPal ya funcionan sin configuracion adicional.${NC}"
else
  echo -e "${GREEN}.env ya existe, no se modifica.${NC}"
  # Asegurarse que NODE_ENV y PORT estan presentes
  grep -q "NODE_ENV" $APP_DIR/.env || echo "NODE_ENV=production" >> $APP_DIR/.env
  grep -q "^PORT=" $APP_DIR/.env || echo "PORT=5000" >> $APP_DIR/.env
fi

# ── PASO 8: Compilar y arrancar la app ───────────────────────
echo -e "${YELLOW}[8/8] Compilando y arrancando la app...${NC}"
cd $APP_DIR

# Matar proceso viejo si existe en el puerto 5000
fuser -k 5000/tcp 2>/dev/null || true

# Compilar el frontend
npm run build

# Crear base de datos
npm run db:push 2>/dev/null || echo "Base de datos ya existe, continuando..."

# Detener instancia anterior de PM2 si existe
pm2 delete paudronix 2>/dev/null || true

# Iniciar con PM2
pm2 start "node dist/index.js" \
  --name "paudronix" \
  --max-memory-restart 500M \
  --restart-delay 3000 \
  --time

# Guardar configuracion de PM2 para que inicie solo al reiniciar el VPS
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║           INSTALACION COMPLETADA                     ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  La app esta corriendo en: puerto 5000               ║"
echo "║                                                      ║"
echo "║  Para ver el estado:   pm2 status                    ║"
echo "║  Para ver los logs:    pm2 logs paudronix            ║"
echo "║  Para reiniciar:       pm2 restart paudronix         ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${YELLOW}Para acceder sin SSL (temporal):${NC}"
echo -e "  http://TU-IP-DEL-VPS:5000"
echo ""
echo -e "${YELLOW}Para configurar Nginx y SSL (recomendado):${NC}"
echo -e "  bash setup-nginx.sh"
echo ""
