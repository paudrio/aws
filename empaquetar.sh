#!/bin/bash
# ── PAUDRONIX GT — Empaquetar para VPS ──
set -e

echo "🔨 Compilando la app..."
npm run build

echo "📦 Creando codigo.tar.gz..."
tar czf codigo.tar.gz \
  dist/ \
  package.json \
  package-lock.json

echo ""
echo "✅ Listo! Sube 'codigo.tar.gz' al VPS y ejecuta:"
echo ""
echo "   bash actualizar-vps.sh"
echo ""
ls -lh codigo.tar.gz
