import { db } from "../db/index";
import {
  users, userSubscriptions, orders, userTransactions, products, games,
  renewalRequests, rechargeRequests, referralTransactions, categories,
  news, featuredSections, banners, subscribers, tvChannels, supportTickets,
  supportMessages, problemReports, clientMessages, supportAgents,
  sellerTransactions, sellerWithdrawals, sellerMessages, rechargePaymentMethods,
  discountCodes, productCredentials, bannedEmails, referralProgram, settings,
  productReviews,
} from "@shared/schema";
import { sendBackupEmail } from "./emailService";

export async function generateBackupData(): Promise<string> {
  // Query tables ONE BY ONE to keep peak memory usage low
  const TABLES: Array<{ key: string; query: () => Promise<any[]> }> = [
    { key: "users",                  query: () => db.select({ id: users.id, username: users.username, email: users.email, firstName: users.firstName, lastName: users.lastName, role: users.role, createdAt: users.createdAt, referralCode: users.referralCode, referredBy: users.referredBy, profileImageUrl: users.profileImageUrl, suspended: users.suspended }).from(users) },
    { key: "subscriptions",          query: () => db.select().from(userSubscriptions) },
    { key: "orders",                 query: () => db.select().from(orders) },
    { key: "transactions",           query: () => db.select().from(userTransactions) },
    { key: "products",               query: () => db.select().from(products) },
    { key: "games",                  query: () => db.select().from(games) },
    { key: "renewals",               query: () => db.select().from(renewalRequests) },
    { key: "recharges",              query: () => db.select().from(rechargeRequests) },
    { key: "referralTransactions",   query: () => db.select().from(referralTransactions) },
    { key: "categories",             query: () => db.select().from(categories) },
    { key: "news",                   query: () => db.select().from(news) },
    { key: "featuredSections",       query: () => db.select().from(featuredSections) },
    { key: "banners",                query: () => db.select().from(banners) },
    { key: "subscribers",            query: () => db.select().from(subscribers) },
    { key: "tvChannels",             query: () => db.select().from(tvChannels) },
    { key: "supportTickets",         query: () => db.select().from(supportTickets) },
    { key: "supportMessages",        query: () => db.select().from(supportMessages) },
    { key: "problemReports",         query: () => db.select().from(problemReports) },
    { key: "clientMessages",         query: () => db.select().from(clientMessages) },
    { key: "supportAgents",          query: () => db.select().from(supportAgents) },
    { key: "sellerTransactions",     query: () => db.select().from(sellerTransactions) },
    { key: "sellerWithdrawals",      query: () => db.select().from(sellerWithdrawals) },
    { key: "sellerMessages",         query: () => db.select().from(sellerMessages) },
    { key: "rechargePaymentMethods", query: () => db.select().from(rechargePaymentMethods) },
    { key: "discountCodes",          query: () => db.select().from(discountCodes) },
    { key: "productCredentials",     query: () => db.select().from(productCredentials) },
    { key: "bannedEmails",           query: () => db.select().from(bannedEmails) },
    { key: "referralProgram",        query: () => db.select().from(referralProgram) },
    { key: "settings",               query: () => db.select().from(settings) },
    { key: "productReviews",         query: () => db.select().from(productReviews) },
  ];

  const dataObj: Record<string, any[]> = {};
  const summary: Record<string, number> = {};

  for (const { key, query } of TABLES) {
    const rows = await query();
    dataObj[key] = rows;
    summary[key] = rows.length;
  }

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: "2.0",
    platform: "PAUDRONIX GT",
    note: "Incluye todo excepto películas/multimedia (archivos de video grandes)",
    summary,
    data: dataObj,
  }, null, 2);
}

export async function runBackupNow(): Promise<void> {
  try {
    console.log("[BACKUP] Generando respaldo...");
    const json = await generateBackupData();
    const date = new Date().toISOString().slice(0, 10);
    await sendBackupEmail(json, date);
    console.log(`[BACKUP] Respaldo enviado por correo — ${date}`);
  } catch (err) {
    console.error("[BACKUP] Error al generar/enviar respaldo:", err);
  }
}

// Schedules a daily backup. Runs at 3:00 AM every day.
// On VPS (server running 24/7) this is fully reliable.
export function scheduleDailyBackup(): void {
  const scheduleNext = () => {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(3, 0, 0, 0); // 3:00 AM
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1); // next day
    }
    const msUntilNext = nextRun.getTime() - now.getTime();
    const hoursUntil = Math.round(msUntilNext / 1000 / 60 / 60);
    console.log(`[BACKUP] Próximo respaldo automático programado en ${hoursUntil}h (${nextRun.toLocaleString()})`);
    setTimeout(async () => {
      await runBackupNow();
      scheduleNext(); // schedule next day
    }, msUntilNext);
  };

  scheduleNext();
}
