#!/bin/bash

echo "🔨 Compilando el proyecto..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Error al compilar. No se generó el archivo."
  exit 1
fi

echo "📦 Empacando dist/ en codigo.tar.gz..."
tar -czf codigo.tar.gz dist/ uploads/ package.json package-lock.json

echo ""
echo "✅ ¡Listo! El archivo codigo.tar.gz está creado."
echo ""
echo "--- PASOS PARA SUBIR AL VPS ---"
echo "1. Descarga codigo.tar.gz desde el panel de Replit"
echo "2. Sube el archivo a tu VPS (con FileZilla, scp, etc.)"
echo "3. En el VPS corre estos comandos:"
echo ""
echo "   cd /var/www/paudronix/pabloemma/nweb"
echo "   tar -xzf ~/codigo.tar.gz --strip-components=0"
echo "   pm2 restart paudronix --update-env"
echo ""
echo "¡Y listo! Tu página quedará actualizada."
