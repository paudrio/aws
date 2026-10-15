import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../../db/index";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail, sendAdminNotificationEmail } from "../../emailService";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<{ user: User; isNew: boolean }>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<{ user: User; isNew: boolean }> {
    if (userData.googleId) {
      // 1. Try to find existing user by googleId
      const [existingByGoogle] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, userData.googleId));

      if (existingByGoogle) {
        const [updated] = await db
          .update(users)
          .set({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByGoogle.id))
          .returning();
        return { user: updated, isNew: false };
      }

      // 2. If not found by googleId, check if a user with same email exists (registered via form)
      if (userData.email) {
        const [existingByEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email));

        if (existingByEmail) {
          // Link Google account to existing user registered via form
          const [updated] = await db
            .update(users)
            .set({
              googleId: userData.googleId,
              firstName: userData.firstName || existingByEmail.firstName,
              lastName: userData.lastName || existingByEmail.lastName,
              profileImageUrl: userData.profileImageUrl || existingByEmail.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingByEmail.id))
            .returning();
          return { user: updated, isNew: false };
        }
      }
    }

    // 3. Insert brand new user
    const [user] = await db.insert(users).values(userData).returning();

    if (user.email) {
      const displayName = user.firstName || user.email.split("@")[0];
      sendWelcomeEmail(user.email, displayName).catch(() => {});
      sendAdminNotificationEmail(
        "Nuevo Usuario Registrado (Google)",
        `Nombre: ${user.firstName || "(sin nombre)"} ${user.lastName || ""}\nCorreo: ${user.email}\nMétodo: Google OAuth\nFecha: ${new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' })}`
      ).catch(() => {});
    }

    return { user, isNew: true };
  }
}

export const authStorage = new AuthStorage();
