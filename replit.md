# PAUDRONIX GT — Guía completa del proyecto

Plataforma e-commerce guatemalteca de productos digitales: suscripciones de streaming, códigos de videojuegos y tarjetas de regalo. Incluye TV en vivo, películas, panel de administración, carrito de compras, pagos con wallet, Google OAuth y PayPal.

**Guía de respaldo y despliegue en VPS:** `RESPALDO-COMANDOS.md`

---

## Preferencias del usuario
- Idioma: Español / mezcla de español informal
- Comunicación simple y directa

---

## Credenciales admin
- **Usuario:** `paudronixGt123@`
- **Contraseña:** `paudronix123GT%`
- **Sesión TTL:** 7 días

---

## Rutas de la aplicación

| Ruta | Página | Descripción |
|---|---|---|
| `/` | Home.tsx | Página principal con catálogo de productos |
| `/tv` | TV.tsx | Canales de TV en vivo (IPTV) |
| `/peliculas` | Peliculas.tsx | Películas y series |
| `/juegos` | Juegos.tsx | Tienda de videojuegos |
| `/juego/:id` | JuegoPage.tsx | Detalle completo de un juego |
| `/producto/:id` | ProductPage.tsx | Detalle completo de un producto/suscripción |
| `/noticias` | Noticias.tsx | Blog de noticias |
| `/perfil` | Profile.tsx | Perfil y suscripciones del usuario |
| `/regalos` | Regalos.tsx | Sistema de regalos |
| `/admin` | Admin.tsx | Panel de administración |
| `/auth` | Auth.tsx | Login y registro |
| `/politicas-y-terminos` | PrivacyPolicy.tsx | Políticas y privacidad |
| `/panel-opt` | PanelOpt.tsx | Panel de optimización |

---

## Funcionalidades principales

### Tienda
- Catálogo de **suscripciones** (Netflix, Spotify, etc.) con precios, descuentos y stock
- Tienda de **videojuegos** con página de detalle por juego (`/juego/:id`)
- **Carrito de compras** persistente con múltiples métodos de pago
- **Página de detalle de producto** (`/producto/:id`) con reseñas, calificaciones y productos relacionados
- **Códigos de descuento** aplicables al checkout
- **Sistema de regalos** — regalar suscripciones a otros usuarios
- `originalPrice` en productos para mostrar precio tachado (simulado)
- Badge de descuento en overlay sobre imagen de producto

### Pagos
- Transferencia bancaria: Banrural, BAC, BI
- Binance (USDT)
- **PayPal** integrado
- **Wallet interno** — saldo recargable del usuario
- Comprobante de pago por WhatsApp

### Streaming
- **TV en vivo** — canales IPTV con reproductor HLS
- **Películas** — multimedia subida al servidor
- Hero con stream de TV en vivo configurable desde admin

### Usuarios
- Registro y login con email/contraseña
- **Google OAuth** (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Login con Replit (integración instalada)
- Perfil con historial de suscripciones, renovaciones y transacciones
- Programa de **referidos** con código único y comisiones
- Suspensión de cuentas desde admin

### Admin (`/admin`)
- Gestión de productos, juegos, categorías
- Gestión de pedidos con entrega de credenciales
- Gestión de suscripciones de usuarios
- Solicitudes de renovación y recarga de saldo
- Canales de TV, películas, noticias, banners
- Métodos de pago de recarga
- Códigos de descuento
- Tickets de soporte y mensajes
- Agentes de soporte
- Sección de respaldo de datos
- Configuración general (WhatsApp, redes sociales, streams)
- **Respaldo automático diario a las 3 AM** por correo

### Comunicación
- **Emails** vía Resend API (`re_9PwTH1C4_...`) desde `noreply@paudronixgt.foo`
- Email de bienvenida, confirmación de pedido, entrega de credenciales
- Email de código de juego, recordatorio de renovación
- Respaldo automático diario por correo
- **WhatsApp** integrado en checkout y soporte

### Buscador global
- Busca productos Y juegos simultáneamente
- Productos → van a `/producto/:id`
- Juegos → van a `/juego/:id`
- Badges de tipo (📦 Producto / 🎮 Juego)

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `server/routes.ts` | Todas las rutas API (~4000 líneas) |
| `server/emailService.ts` | Todos los emails con Resend |
| `server/backupService.ts` | Generación y envío de respaldos |
| `shared/schema.ts` | Tablas de la BD (Drizzle ORM) |
| `client/src/pages/Home.tsx` | Página principal + lógica de productos |
| `client/src/pages/Admin.tsx` | Panel admin completo |
| `client/src/pages/Profile.tsx` | Perfil del usuario |
| `client/src/pages/JuegoPage.tsx` | Página de detalle de juego |
| `client/src/pages/ProductPage.tsx` | Página de detalle de producto |
| `client/src/components/layout.tsx` | Navbar + buscador global + footer wrapper |
| `client/src/components/Footer.tsx` | Footer con modales de info |
| `client/src/lib/context.tsx` | Estado global (auth admin, settings) |
| `client/src/lib/cartContext.tsx` | Carrito de compras |

---

<<<<<<< HEAD
## Base de datos (31 tablas)
=======
## Base de datos (30 tablas)
>>>>>>> 485035fed5596d75132cfddc87aeb9eb45128477

| Tabla | Descripción |
|---|---|
| `users` | Usuarios registrados |
| `user_subscriptions` | Suscripciones activas de usuarios |
<<<<<<< HEAD
| `orders` | Pedidos realizados (incluye `game_code`) |
| `user_transactions` | Transacciones de wallet |
| `products` | Productos del catálogo (incluye `originalPrice`, `discountPercent`, `requiresCustomerEmail`, `customerEmailLabel`, `paymentMethodIds`) |
| `games` | Videojuegos (incluye `discountPercent`, `requiresCustomerEmail`, `customerEmailLabel`, `logoImage`, `countryImage`, `platformName`, `countryText`, `deliveryType`) |
| `fortnite_items` | Items de Fortnite — pavos, skins, etc. (tabla nueva) |
=======
| `orders` | Pedidos realizados |
| `user_transactions` | Transacciones de wallet |
| `products` | Productos del catálogo (incluye `originalPrice`, `discountPercent`) |
| `games` | Videojuegos (incluye `discountPercent`) |
>>>>>>> 485035fed5596d75132cfddc87aeb9eb45128477
| `renewal_requests` | Solicitudes de renovación |
| `recharge_requests` | Solicitudes de recarga de saldo |
| `referral_transactions` | Transacciones del programa de referidos |
| `referral_program` | Config del programa de referidos |
<<<<<<< HEAD
| `categories` | Categorías de productos (incluye `image`, `stream_url`) |
=======
| `categories` | Categorías de productos |
>>>>>>> 485035fed5596d75132cfddc87aeb9eb45128477
| `news` | Noticias/blog |
| `featured_sections` | Secciones destacadas de la home |
| `banners` | Banners del carrusel |
| `subscribers` | Suscriptores de newsletter |
| `tv_channels` | Canales de TV (IPTV) |
| `multimedia` | Películas/series (archivos de video) |
| `support_tickets` | Tickets de soporte |
| `support_messages` | Mensajes dentro de tickets |
| `problem_reports` | Reportes de problemas |
| `client_messages` | Mensajes de clientes |
| `support_agents` | Agentes de soporte |
| `seller_transactions` | Transacciones de vendedores |
| `seller_withdrawals` | Retiros de vendedores |
<<<<<<< HEAD
=======
| `seller_messages` | Mensajes de vendedores |
>>>>>>> 485035fed5596d75132cfddc87aeb9eb45128477
| `recharge_payment_methods` | Métodos de pago para recargas |
| `discount_codes` | Códigos de descuento |
| `product_credentials` | Credenciales de productos |
| `banned_emails` | Emails bloqueados |
| `settings` | Configuración general |
| `product_reviews` | Reseñas de productos |

---

## Variables de entorno / Secrets

| Variable | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL (Replit DB) |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `SESSION_SECRET` | Sesiones de usuario |
| `RESEND_API_KEY` | Envío de emails |
| `PAYPAL_CLIENT_ID` | PayPal |
| `PAYPAL_CLIENT_SECRET` | PayPal |

---

## Datos de configuración importantes
- **WhatsApp soporte:** `+502 3787 1216`
- **Email contacto:** `paudronixgt@gmail.com`
- **Dev domain:** `a97ce54b-4f46-42e4-97f9-280f0f7c428d-00-3kky9sqviiwko.riker.replit.dev`
- **Respaldo automático:** 3:00 AM todos los días por correo
- **Respaldo manual:** Admin → pestaña "Respaldo" → descargar JSON

---

## Notas técnicas importantes
- **No hay redirect automático a `/admin` después del login** (removido intencionalmente)
- El campo `originalPrice` en productos es para precio tachado visual (no afecta precio real de compra)
- `user_subscriptions.credentialEmail` guarda el código (juegos) o email (streaming)
- Las películas/multimedia NO se incluyen en el respaldo JSON (son archivos pesados)
- El respaldo incluye **30 tablas** — todo excepto multimedia
<<<<<<< HEAD

---

## Configuración nginx requerida para VPS (CRÍTICO para sesiones)

Sin estos headers las cookies de sesión no funcionan. El archivo es `/etc/nginx/sites-enabled/paudronix`:

```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_cache_bypass $http_upgrade;
}
```

Después de cambiar nginx: `nginx -t && systemctl reload nginx`

## Despliegue en VPS — Proceso completo

**Ubicación del app en el VPS:** `/var/www/paudronix/pabloemma/nweb/`
**PM2 proceso:** `paudronix` (script: `dist/index.cjs`)
**Dominio:** `paudronix.foo` (SIEMPRE este, nunca paudronixgt.com)

### Pasos para subir nueva versión:

1. En Replit: `npm run build` — genera la carpeta `dist/`
2. Subir toda la carpeta `dist/` al VPS en `/var/www/paudronix/pabloemma/nweb/`
3. En el VPS correr el script de migración (SIEMPRE antes de reiniciar):
   ```bash
   source /var/www/paudronix/pabloemma/nweb/.env && psql "$DATABASE_URL" -f /tmp/migrate.sql
   ```
4. Reiniciar el app:
   ```bash
   pm2 restart paudronix --update-env
   ```
5. Si da 502, limpiar logs y reiniciar:
   ```bash
   pm2 flush paudronix && pm2 restart paudronix --update-env
   ```

### Diagnóstico de errores en VPS:
```bash
pm2 logs paudronix --err --lines 50 --nostream | tail -60
```

### Script de migración guardado en VPS:
El archivo `/tmp/migrate.sql` contiene todos los ALTER TABLE y CREATE TABLE IF NOT EXISTS para todas las tablas. **Se borra si el VPS se reinicia** — volver a crearlo si desaparece. Ver `RESPALDO-COMANDOS.md` para el contenido completo.

---

## Funcionalidades Fortnite (nuevas)

- **Página Pavos** (`/pavos`): compra de V-Bucks con carrusel de imágenes
- **Página de ítems** (`/fortnite/:id`): detalle de skin/ítem con galería
- `CardSlideshow` en Pavos.tsx acepta prop `contain` para `object-contain`
- Tabla `fortnite_items` con campos: `id, title, description, image, image2, image3, section, imagesJson, pavos, price, originalPrice, isActive, order, createdAt`

---

## Splash Screen (diseño actual)

- Fondo negro puro, temática espacial
- 4 nebulas animadas (púrpura, rosa, azul, teal)
- 33 estrellas titilantes con halos glow en distintos colores y tamaños
- Meteoros en patrón X cruzado
- Botón con efecto glassmorphism y shimmer
- Logo "GT": texto sólido `color: #f97316` (NO gradiente clippeado para evitar que se corte la T itálica)

---

## Credenciales Google OAuth (producción)
- **Client ID:** `206942593575-58cavsk5ign2ie4um5g6gdjevuk1cdds.apps.googleusercontent.com`
- **Authorized origins:** `https://paudronix.foo`
- **Callback URL:** `https://paudronix.foo/api/auth/google/callback`
- **OAuth consent screen:** debe estar en "En producción" (no Testing)
=======
- La `sessionTTL` del admin es 7 días
>>>>>>> 485035fed5596d75132cfddc87aeb9eb45128477
