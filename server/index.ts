import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Carga absoluta del .env para VPS (PM2 compatibility)
const envPath = path.resolve(process.cwd(), ".env");
const absoluteEnvPath = "/var/www/paudronix/.env";

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(absoluteEnvPath)) {
  dotenv.config({ path: absoluteEnvPath });
}

// Fallback manual si DATABASE_URL no se cargó por alguna razón
if (!process.env.DATABASE_URL) {
  try {
    const targetFile = fs.existsSync(envPath) ? envPath : (fs.existsSync(absoluteEnvPath) ? absoluteEnvPath : null);
    if (targetFile) {
      const envContent = fs.readFileSync(targetFile, "utf-8");
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1].trim().replace(/['"]/g, '');
      }
    }
  } catch (e) {
    console.error("Error loading env fallback:", e);
  }
}

// ── CREDENCIALES EMBEBIDAS (funcionan sin .env en VPS) ────────────────────────
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "toticas-session-secret-2024-xK9mP3qR7vN2wL5jT8uY1aS6dF4hG0cE";
}
if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
  process.env.GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "206942593575-58cavsk5ign2ie4um5g6gdjevuk1cdds.apps.googleusercontent.com";
}
if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
}
if (!process.env.APP_URL && !process.env.REPLIT_DEV_DOMAIN) {
  process.env.APP_URL = "https://paudronix.foo";
}
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = "re_T9M2c193_6WoHxVfqswLgezfHte9wtVYt";
}
if (!process.env.RESEND_FROM_EMAIL) {
  process.env.RESEND_FROM_EMAIL = "noreply@paudronix.foo";
}
if (!process.env.ADMIN_EMAIL) {
  process.env.ADMIN_EMAIL = "paudronixpro@gmail.com";
}
if (!process.env.PAYPAL_CLIENT_ID) {
  process.env.PAYPAL_CLIENT_ID = "AUD9NUn44W6OqMwYGeaQ6LVAs49q6igB6xuI8g938BS37SCC_5_eq9LwqXbVWhaj7Uo2d85Uh7xejBQe";
}
if (!process.env.PAYPAL_CLIENT_SECRET) {
  process.env.PAYPAL_CLIENT_SECRET = "EDjwkSUTZY5k9f9bP-GtbMOxmi0uZsCIxEKlOGiyUPA__IcwBJJ09WnqSrBl0eiSyMEC7ld_4DWfzHRE";
}
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// ── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.disable("x-powered-by");

// Strict rate limiting only for auth routes (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera 15 minutos antes de intentar de nuevo." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/login", authLimiter);
// ────────────────────────────────────────────────────────────────────────────

// Optimización para subidas de archivos grandes (3-5GB)
httpServer.timeout = 0; // Sin timeout para subidas largas
httpServer.keepAliveTimeout = 120000; // 2 minutos keep-alive
httpServer.headersTimeout = 125000; // Headers timeout mayor que keepAlive

// Setup WebSockets for real-time video control
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const broadcastData = JSON.stringify(data);
      
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(broadcastData);
        }
      });
    } catch (e) {
      console.error('WS broadcast error:', e);
    }
  });
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '2gb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: true, limit: '2gb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// ── BLINDAJE GLOBAL — el servidor NUNCA cae por errores no capturados ─────────
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] uncaughtException — servidor sigue activo:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL] unhandledRejection — servidor sigue activo:', reason);
});
// ──────────────────────────────────────────────────────────────────────────────

(async () => {
  // Auto-migración al inicio: garantiza que las tablas existen
  try {
    const { execSync } = await import("child_process");
    execSync("npm run db:push", { stdio: "pipe", timeout: 30000 });
    console.log("[DB] Tablas verificadas/creadas correctamente.");
  } catch (dbErr: any) {
    console.error("[DB] Aviso migracion automatica:", dbErr?.message || dbErr);
  }

  try {
    await setupAuth(app);
  } catch (authErr) {
    console.error('[WARN] Google OAuth no se pudo inicializar — login con Google desactivado:', authErr);
  }

  try {
    registerAuthRoutes(app);
  } catch (e) {
    console.error('[WARN] Auth routes error:', e);
  }

  await registerRoutes(httpServer, app);

  // Background job: auto-deliver credentials to pending subscriptions every 60 seconds
  const { db } = await import("../db/index");
  const { eq, and, or, isNull, asc, ilike } = await import("drizzle-orm");
  const { userSubscriptions, products, productCredentials, users } = await import("@shared/schema");
  const { sendCredentialsEmail } = await import("./emailService");

  async function autoDeliverPendingCredentials() {
    try {
      const pending = await db.select().from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, "active"),
          or(eq(userSubscriptions.credentialEmail, ""), isNull(userSubscriptions.credentialEmail as any))
        ));
      for (const sub of pending) {
        if (!sub.productId) continue;
        // Try by ID first; if not found (e.g. productId = "regalo"), fall back to name
        let [product] = await db.select().from(products).where(eq(products.id, sub.productId));
        if (!product && sub.productName) {
          const byName = await db.select().from(products)
            .where(ilike(products.name, `%${sub.productName.trim()}%`))
            .limit(1);
          product = byName[0];
        }
        if (!product) continue;
        let credEmail = "";
        let credPassword = "";
        let credInstructions = sub.credentialInstructions || "";
        const available = await db.select().from(productCredentials)
          .where(and(eq(productCredentials.productId, product.id), eq(productCredentials.isUsed, false)))
          .orderBy(asc(productCredentials.createdAt))
          .limit(1);
        if (available[0]) {
          await db.update(productCredentials)
            .set({ isUsed: true, usedByOrderId: sub.orderId || sub.id, assignedAt: new Date() })
            .where(eq(productCredentials.id, available[0].id));
          credEmail = available[0].credEmail;
          credPassword = available[0].credPassword;
          credInstructions = available[0].credInstructions || sub.credentialInstructions || "";
        } else if (product.productEmail && product.productPassword) {
          credEmail = product.productEmail;
          credPassword = product.productPassword;
          credInstructions = product.productInstructions || sub.credentialInstructions || "";
        } else {
          continue;
        }
        await db.update(userSubscriptions)
          .set({ credentialEmail: credEmail, credentialPassword: credPassword, credentialInstructions: credInstructions })
          .where(eq(userSubscriptions.id, sub.id));
        const [owner] = await db.select().from(users).where(eq(users.id, sub.userId));
        if (owner?.email) {
          sendCredentialsEmail(owner.email, owner.firstName || "Usuario", sub.productName, credEmail, credPassword, credInstructions || undefined).catch(() => {});
        }
        console.log(`[AUTO-CRED] Entregadas credenciales a ${owner?.email || sub.userId} para ${sub.productName}`);
      }
    } catch (e) {
      // Silently continue — non-critical background job
    }
  }

  // Run immediately on startup, then every 60 seconds
  autoDeliverPendingCredentials();
  setInterval(autoDeliverPendingCredentials, 60 * 1000);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('[ERROR] Express error handler:', err?.message || err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
