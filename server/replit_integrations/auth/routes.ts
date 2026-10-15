import type { Express } from "express";
import { authStorage } from "./storage";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", async (req, res) => {
    // 1. Try Passport session first
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      if (user.suspended) {
        req.logout(() => {
          req.session.destroy(() => {
            res.status(403).json({ message: "suspended", suspended: true });
          });
        });
        return;
      }
      return res.json(req.user);
    }

    // 2. VPS fallback: check x-user-id header (sent by client on every request)
    const headerUserId = req.headers["x-user-id"] as string | undefined;
    if (headerUserId) {
      try {
        const user = await authStorage.getUser(headerUserId);
        if (user) {
          if (user.suspended) {
            return res.status(403).json({ message: "suspended", suspended: true });
          }
          return res.json(user);
        }
      } catch (e) {
        // ignore — fall through to 401
      }
    }

    return res.status(401).json({ message: "Unauthorized" });
  });
}
