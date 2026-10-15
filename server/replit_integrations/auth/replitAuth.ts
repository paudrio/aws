import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { db } from "../../../db/index";
import { bannedEmails, users, referralProgram, referralTransactions, userTransactions } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { sendReferralRegisterNotificationEmail, sendAdminReferralNotificationEmail } from "../../emailService";

export function getSession() {
  const sessionTtl = 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  const isHttps = process.env.APP_URL?.startsWith("https") || isReplit;

  return session({
    secret: process.env.SESSION_SECRET || "toticas-session-secret-2024-xK9mP3qR7vN2wL5jT8uY1aS6dF4hG0cE",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const callbackBase = process.env.APP_URL
    ? process.env.APP_URL
    : (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `http://localhost:${process.env.PORT || 5000}`);

  const callbackURL = `${callbackBase}/api/auth/google/callback`;
  console.log("[Auth] Google OAuth callback URL:", callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        callbackURL,
        proxy: true,
        passReqToCallback: true,
      } as any,
      async (req: any, accessToken: any, refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          if (email) {
            const banned = await db.select().from(bannedEmails).where(eq(bannedEmails.email, email.toLowerCase()));
            if (banned.length > 0) {
              return done(null, false, { message: "Correo baneado" });
            }
          }

          const pendingRef: string | undefined = req.session?.pendingRef;
          let referredBy: string | undefined;
          if (pendingRef) {
            const [referrer] = await db.select().from(users).where(eq(users.referralCode, pendingRef.toUpperCase()));
            if (referrer) referredBy = pendingRef.toUpperCase();
          }

          const { user, isNew } = await authStorage.upsertUser({
            googleId: profile.id,
            email,
            firstName: profile.displayName?.split(" ")[0] || profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
            referredBy: referredBy || null,
          });

          if (user.suspended) {
            return done(null, false, { message: "Cuenta suspendida permanentemente" });
          }

          if (isNew && referredBy) {
            try {
              const [referrer] = await db.select().from(users).where(eq(users.referralCode, referredBy));
              if (referrer) {
                const [program] = await db.select().from(referralProgram);
                if (program?.isActive) {
                  const bonus = Math.round(Number(program.registerBonus) || 1);
                  if (bonus > 0) {
                    await db.insert(userTransactions).values({
                      userId: referrer.id,
                      amount: bonus,
                      type: "credit",
                      description: "Bono de referido — registro",
                      referenceId: user.id,
                    });
                    await db.insert(referralTransactions).values({
                      referrerId: referrer.id,
                      referredUserId: user.id,
                      orderId: "",
                      type: "register",
                      amount: bonus,
                    });
                    await db.insert(userTransactions).values({
                      userId: user.id,
                      amount: bonus,
                      type: "credit",
                      description: "Bono de bienvenida — registrado con link de referido",
                      referenceId: user.id,
                    });
                    // Correos de notificación de referido
                    console.log(`[REFERRAL-GOOGLE] Enviando correos — referidor: ${referrer.email || "sin email"}, nuevo: ${user.email || "sin email"}`);
                    if (referrer.email) {
                      sendReferralRegisterNotificationEmail(
                        referrer.email,
                        referrer.firstName || referrer.email.split("@")[0],
                        user.firstName || user.email?.split("@")[0] || "Un nuevo usuario",
                        bonus
                      ).catch((e) => console.error("[REFERRAL-GOOGLE] Error correo referidor:", e));
                    }
                    sendAdminReferralNotificationEmail(
                      referrer.firstName || referrer.email?.split("@")[0] || "Usuario",
                      referrer.email || "Sin correo",
                      user.firstName || user.email?.split("@")[0] || "Nuevo usuario",
                      user.email || "Sin correo",
                      bonus
                    ).catch((e) => console.error("[REFERRAL-GOOGLE] Error correo admin:", e));
                  }
                }
              }
            } catch (e) {
              console.error("[Referral] Error crediting referrer on Google signup:", e);
            }
            delete req.session.pendingRef;
          }

          done(null, user);
        } catch (error) {
          console.error("[Auth] upsertUser error:", error);
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    if (id === "admin-fixed-id") {
      return done(null, { id: "admin-fixed-id", username: "paudronixGt123@", role: "admin" } as any);
    }
    try {
      const user = await authStorage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/google");
  });

  // Start OAuth flow — save referral code in session before redirecting to Google
  app.get("/api/auth/google", (req: any, res: any, next: any) => {
    const ref = req.query.ref as string | undefined;
    if (ref) {
      req.session.pendingRef = ref;
      req.session.save(() => {
        passport.authenticate("google", {
          scope: ["profile", "email"],
          prompt: "select_account",
          state: false,
        } as any)(req, res, next);
      });
    } else {
      passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        state: false,
      } as any)(req, res, next);
    }
  });

  // OAuth callback — also with state: false to skip CSRF state check
  app.get(
    "/api/auth/google/callback",
    (req: any, res: any, next: any) => {
      passport.authenticate("google", { session: true, failureRedirect: "/?loginError=true" } as any, (err: any, user: any, info: any) => {
        if (err) {
          console.error("[Auth] Google OAuth error:", err?.message || err, err);
          return res.redirect("/?loginError=true");
        }
        if (!user) {
          const msg = info?.message || "sin usuario";
          console.warn("[Auth] Google OAuth: sin usuario.", msg);
          if (msg.includes("suspend") || msg.includes("Suspendida")) {
            return res.redirect("/?suspended=true");
          }
          return res.redirect("/?loginError=true");
        }
        if (user.suspended) {
          return res.redirect("/?suspended=true");
        }
        req.logIn(user, (loginErr: any) => {
          if (loginErr) {
            console.error("[Auth] Error en logIn:", loginErr?.message || loginErr);
            return res.redirect("/?loginError=true");
          }
          req.session.save((saveErr: any) => {
            if (saveErr) {
              console.error("[Auth] Error guardando sesión:", saveErr?.message || saveErr);
            }
            res.redirect("/");
          });
        });
      })(req, res, next);
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // Fallback: accept x-user-id header sent by client when Passport session is unavailable (VPS proxy)
  const headerUserId = req.headers["x-user-id"] as string | undefined;
  if (headerUserId) {
    try {
      const { authStorage } = await import("./storage");
      const user = await authStorage.getUser(headerUserId);
      if (user && !user.suspended) {
        (req as any).user = user;
        return next();
      }
    } catch (e) {
      // ignore — fall through to 401
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
};
