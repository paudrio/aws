#!/bin/bash
# ============================================================
# PAUDRONIX GT - Configuracion automatica de Nginx + SSL
# Solo ejecuta: bash setup-nginx.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/4] Instalando Nginx y Certbot...${NC}"
apt-get install -y -q nginx certbot python3-certbot-nginx

echo ""
read -p "Escribe tu dominio (ej: paudronix.com, SIN https://): " DOMAIN
read -p "Tu email para el certificado SSL: " EMAIL

echo -e "${YELLOW}[2/4] Configurando Nginx...${NC}"

cat > /etc/nginx/sites-available/paudronix << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 5G;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /ws {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }

    location /uploads {
        alias /var/www/paudronix/uploads;
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF

ln -sf /etc/nginx/sites-available/paudronix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${YELLOW}[3/4] Instalando certificado SSL gratuito (Let's Encrypt)...${NC}"
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

echo -e "${YELLOW}[4/4] Activando renovacion automatica del SSL...${NC}"
systemctl enable certbot.timer 2>/dev/null || true

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║        NGINX + SSL CONFIGURADOS                      ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  Tu app esta disponible en:                          ║"
echo "║  https://${DOMAIN}"
echo "║                                                      ║"
echo "║  Tambien actualiza APP_URL en el .env:               ║"
echo "║  APP_URL=https://${DOMAIN}"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Actualizar APP_URL en el .env automaticamente
sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" /var/www/paudronix/.env
pm2 restart paudronix

echo -e "${GREEN}APP_URL actualizado y app reiniciada.${NC}"
