/**
 * PAUDRONIX GT — Script de Restauración VPS
 * ==========================================
 * Uso: npx tsx script/restore-backup.ts /ruta/del/backup.json
 *
 * Restaura las 29 tablas directamente a la base de datos.
 * No requiere autenticación HTTP. Sin límite de tamaño de archivo.
 */

import { readFileSync } from "fs";
import { db } from "../db/index";
import {
  users, userSubscriptions, orders, userTransactions, products, games,
  renewalRequests, rechargeRequests, referralTransactions, categories,
  news, featuredSections, banners, subscribers, tvChannels, supportTickets,
  supportMessages, problemReports, clientMessages, supportAgents,
  sellerTransactions, sellerWithdrawals, sellerMessages, rechargePaymentMethods,
  discountCodes, productCredentials, bannedEmails, referralProgram, settings,
} from "../shared/schema";

const filePath = process.argv[2];
if (!filePath) {
  console.error("❌ Uso: npx tsx script/restore-backup.ts /ruta/del/backup.json");
  process.exit(1);
}

const safeDate = (val: any, fallback: Date | null = new Date()): Date | null => {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
};

async function main() {
  console.log(`\n📂 Leyendo archivo: ${filePath}`);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    console.error("❌ No se pudo leer el archivo. Verifica la ruta.");
    process.exit(1);
  }

  let backup: any;
  try {
    backup = JSON.parse(raw);
  } catch {
    console.error("❌ El archivo no es un JSON válido.");
    process.exit(1);
  }

  if (!backup?.data) {
    console.error("❌ El archivo no es un respaldo válido de PAUDRONIX GT.");
    process.exit(1);
  }

  const data = backup.data;
  const restored: Record<string, number> = {};
  const tableErrors: Record<string, string> = {};

  console.log(`📅 Respaldo generado: ${backup.generatedAt ?? "desconocido"}`);
  console.log("🔄 Iniciando restauración...\n");

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.users) && data.users.length > 0) {
      const rows = data.users.map((u: any) => ({
        id: u.id, username: u.username ?? null, email: u.email ?? null,
        firstName: u.firstName ?? null, lastName: u.lastName ?? null,
        role: u.role ?? "user", profileImageUrl: u.profileImageUrl ?? null,
        suspended: u.suspended ?? false, referralCode: u.referralCode ?? null,
        referredBy: u.referredBy ?? null, createdAt: safeDate(u.createdAt) ?? new Date(),
      }));
      const r = await db.insert(users).values(rows).onConflictDoNothing().returning({ id: users.id });
      restored.users = r.length;
    } else { restored.users = 0; }
  } catch (e: any) { restored.users = 0; tableErrors.users = e?.message; }
  console.log(`  ✔ usuarios:               ${restored.users}`);

  // ── 2. SUSCRIPCIONES ──────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
      const rows = data.subscriptions.map((s: any) => ({
        id: s.id, userId: s.userId, productId: s.productId, productName: s.productName,
        productImage: s.productImage ?? "", price: s.price, status: s.status ?? "pending",
        startDate: safeDate(s.startDate) ?? new Date(), endDate: safeDate(s.endDate, null),
        credentialEmail: s.credentialEmail ?? "", credentialPassword: s.credentialPassword ?? "",
        credentialName: s.credentialName ?? "", credentialInstructions: s.credentialInstructions ?? "",
        orderId: s.orderId ?? "", renewalCode: s.renewalCode ?? "", expirationNotified: s.expirationNotified ?? false,
      }));
      const r = await db.insert(userSubscriptions).values(rows).onConflictDoNothing().returning({ id: userSubscriptions.id });
      restored.subscriptions = r.length;
    } else { restored.subscriptions = 0; }
  } catch (e: any) { restored.subscriptions = 0; tableErrors.subscriptions = e?.message; }
  console.log(`  ✔ suscripciones:          ${restored.subscriptions}`);

  // ── 3. PEDIDOS ────────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.orders) && data.orders.length > 0) {
      const rows = data.orders.map((o: any) => ({
        id: o.id, customerName: o.customerName, customerPhone: o.customerPhone,
        productId: o.productId, productName: o.productName, price: o.price,
        date: safeDate(o.date) ?? new Date(), status: o.status ?? "pending",
        paymentMethod: o.paymentMethod ?? null, deliveryMethod: o.deliveryMethod ?? null,
        deliveryContact: o.deliveryContact ?? null, paymentScreenshot: o.paymentScreenshot ?? null,
        customerEmail: o.customerEmail ?? "", customerPassword: o.customerPassword ?? "",
        orderRef: o.orderRef ?? null, sellerId: o.sellerId ?? null, gameCode: o.gameCode ?? "",
      }));
      const r = await db.insert(orders).values(rows).onConflictDoNothing().returning({ id: orders.id });
      restored.orders = r.length;
    } else { restored.orders = 0; }
  } catch (e: any) { restored.orders = 0; tableErrors.orders = e?.message; }
  console.log(`  ✔ pedidos:                ${restored.orders}`);

  // ── 4. TRANSACCIONES ──────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.transactions) && data.transactions.length > 0) {
      const rows = data.transactions.map((t: any) => ({
        id: t.id, userId: t.userId, amount: t.amount, type: t.type,
        description: t.description ?? "", referenceId: t.referenceId ?? "",
        createdAt: safeDate(t.createdAt) ?? new Date(),
      }));
      const r = await db.insert(userTransactions).values(rows).onConflictDoNothing().returning({ id: userTransactions.id });
      restored.transactions = r.length;
    } else { restored.transactions = 0; }
  } catch (e: any) { restored.transactions = 0; tableErrors.transactions = e?.message; }
  console.log(`  ✔ transacciones:          ${restored.transactions}`);

  // ── 5. PRODUCTOS ──────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.products) && data.products.length > 0) {
      const rows = data.products.map((p: any) => ({
        id: p.id, name: p.name, category: p.category, price: p.price, priceUsd: p.priceUsd ?? null,
        image: p.image, description: p.description ?? "", whatsappNumber: p.whatsappNumber ?? null,
        isMonthly: p.isMonthly ?? true, inStock: p.inStock ?? true, showCheckmarks: p.showCheckmarks ?? true,
        showWhatsapp: p.showWhatsapp ?? true, showBinance: p.showBinance ?? false,
        showBanrural: p.showBanrural ?? false, showBac: p.showBac ?? false, showBi: p.showBi ?? false,
        isActive: p.isActive ?? true, isPopular: p.isPopular ?? false, verifiedSeller: p.verifiedSeller ?? false,
        stockQuantity: p.stockQuantity ?? -1, streamUrl: p.streamUrl ?? null,
        binanceData: p.binanceData ?? "", binanceName: p.binanceName ?? "", binanceInstructions: p.binanceInstructions ?? "",
        banruralData: p.banruralData ?? "", banruralName: p.banruralName ?? "", banruralInstructions: p.banruralInstructions ?? "",
        bacData: p.bacData ?? "", bacName: p.bacName ?? "", bacInstructions: p.bacInstructions ?? "",
        biData: p.biData ?? "", biName: p.biName ?? "", biInstructions: p.biInstructions ?? "",
        paymentMethodIds: p.paymentMethodIds ?? "[]", sellerId: p.sellerId ?? null,
        sellerStatus: p.sellerStatus ?? "none", sellerEmail: p.sellerEmail ?? null,
        submittedAt: safeDate(p.submittedAt, null),
        productEmail: p.productEmail ?? "", productPassword: p.productPassword ?? "", productInstructions: p.productInstructions ?? "",
      }));
      const r = await db.insert(products).values(rows).onConflictDoNothing().returning({ id: products.id });
      restored.products = r.length;
    } else { restored.products = 0; }
  } catch (e: any) { restored.products = 0; tableErrors.products = e?.message; }
  console.log(`  ✔ productos:              ${restored.products}`);

  // ── 6. JUEGOS ─────────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.games) && data.games.length > 0) {
      const rows = data.games.map((g: any) => ({
        id: g.id, title: g.title, description: g.description ?? "", image: g.image,
        logoImage: g.logoImage ?? "", countryImage: g.countryImage ?? "", platformName: g.platformName ?? "",
        countryText: g.countryText ?? "", platform: g.platform ?? "", price: g.price ?? 0,
        link: g.link ?? "", isActive: g.isActive ?? true, order: g.order ?? 0,
        deliveryType: g.deliveryType ?? "code", createdAt: safeDate(g.createdAt) ?? new Date(),
      }));
      const r = await db.insert(games).values(rows).onConflictDoNothing().returning({ id: games.id });
      restored.games = r.length;
    } else { restored.games = 0; }
  } catch (e: any) { restored.games = 0; tableErrors.games = e?.message; }
  console.log(`  ✔ juegos:                 ${restored.games}`);

  // ── 7. RENOVACIONES ───────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.renewals) && data.renewals.length > 0) {
      const rows = data.renewals.map((r: any) => ({
        id: r.id, userId: r.userId, subscriptionId: r.subscriptionId, renewalCode: r.renewalCode,
        paymentScreenshot: r.paymentScreenshot ?? "", paymentMethod: r.paymentMethod ?? "screenshot",
        paypalOrderId: r.paypalOrderId ?? "", months: r.months ?? 1, totalAmount: r.totalAmount ?? 0,
        status: r.status ?? "pending", createdAt: safeDate(r.createdAt) ?? new Date(), adminNotes: r.adminNotes ?? "",
      }));
      const r2 = await db.insert(renewalRequests).values(rows).onConflictDoNothing().returning({ id: renewalRequests.id });
      restored.renewals = r2.length;
    } else { restored.renewals = 0; }
  } catch (e: any) { restored.renewals = 0; tableErrors.renewals = e?.message; }
  console.log(`  ✔ renovaciones:           ${restored.renewals}`);

  // ── 8. RECARGAS ───────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.recharges) && data.recharges.length > 0) {
      const rows = data.recharges.map((r: any) => ({
        id: r.id, userId: r.userId, userName: r.userName, userEmail: r.userEmail ?? "",
        amount: r.amount, paymentMethodId: r.paymentMethodId, paymentMethodName: r.paymentMethodName,
        screenshot: r.screenshot ?? "", code: r.code, status: r.status ?? "pending",
        adminNotes: r.adminNotes ?? "", createdAt: safeDate(r.createdAt) ?? new Date(),
        processedAt: safeDate(r.processedAt, null),
      }));
      const r2 = await db.insert(rechargeRequests).values(rows).onConflictDoNothing().returning({ id: rechargeRequests.id });
      restored.recharges = r2.length;
    } else { restored.recharges = 0; }
  } catch (e: any) { restored.recharges = 0; tableErrors.recharges = e?.message; }
  console.log(`  ✔ recargas:               ${restored.recharges}`);

  // ── 9. TRANSACCIONES DE REFERIDOS ─────────────────────────────────────────
  try {
    if (Array.isArray(data.referralTransactions) && data.referralTransactions.length > 0) {
      const rows = data.referralTransactions.map((t: any) => ({
        id: t.id, referrerId: t.referrerId, referredUserId: t.referredUserId,
        orderId: t.orderId ?? "", type: t.type, amount: t.amount, createdAt: safeDate(t.createdAt) ?? new Date(),
      }));
      const r = await db.insert(referralTransactions).values(rows).onConflictDoNothing().returning({ id: referralTransactions.id });
      restored.referralTransactions = r.length;
    } else { restored.referralTransactions = 0; }
  } catch (e: any) { restored.referralTransactions = 0; tableErrors.referralTransactions = e?.message; }
  console.log(`  ✔ transacciones referidos: ${restored.referralTransactions}`);

  // ── 10. CATEGORÍAS ────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      const rows = data.categories.map((c: any) => ({
        id: c.id, name: c.name, label: c.label ?? null, image: c.image ?? null, streamUrl: c.streamUrl ?? null,
      }));
      const r = await db.insert(categories).values(rows).onConflictDoNothing().returning({ id: categories.id });
      restored.categories = r.length;
    } else { restored.categories = 0; }
  } catch (e: any) { restored.categories = 0; tableErrors.categories = e?.message; }
  console.log(`  ✔ categorías:             ${restored.categories}`);

  // ── 11. NOTICIAS ──────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.news) && data.news.length > 0) {
      const rows = data.news.map((n: any) => ({
        id: n.id, title: n.title, content: n.content, image: n.image ?? null,
        video: n.video ?? null, date: safeDate(n.date) ?? new Date(),
      }));
      const r = await db.insert(news).values(rows).onConflictDoNothing().returning({ id: news.id });
      restored.news = r.length;
    } else { restored.news = 0; }
  } catch (e: any) { restored.news = 0; tableErrors.news = e?.message; }
  console.log(`  ✔ noticias:               ${restored.news}`);

  // ── 12. SECCIONES DESTACADAS ──────────────────────────────────────────────
  try {
    if (Array.isArray(data.featuredSections) && data.featuredSections.length > 0) {
      const rows = data.featuredSections.map((f: any) => ({
        id: f.id, title: f.title, description: f.description ?? "", image: f.image,
        link: f.link ?? "", order: f.order ?? 0, isActive: f.isActive ?? true,
      }));
      const r = await db.insert(featuredSections).values(rows).onConflictDoNothing().returning({ id: featuredSections.id });
      restored.featuredSections = r.length;
    } else { restored.featuredSections = 0; }
  } catch (e: any) { restored.featuredSections = 0; tableErrors.featuredSections = e?.message; }
  console.log(`  ✔ secciones destacadas:   ${restored.featuredSections}`);

  // ── 13. BANNERS ───────────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.banners) && data.banners.length > 0) {
      const rows = data.banners.map((b: any) => ({
        id: b.id, image: b.image, title: b.title ?? "", link: b.link ?? "",
        order: b.order ?? 0, isActive: b.isActive ?? true, createdAt: safeDate(b.createdAt) ?? new Date(),
      }));
      const r = await db.insert(banners).values(rows).onConflictDoNothing().returning({ id: banners.id });
      restored.banners = r.length;
    } else { restored.banners = 0; }
  } catch (e: any) { restored.banners = 0; tableErrors.banners = e?.message; }
  console.log(`  ✔ banners:                ${restored.banners}`);

  // ── 14. SUSCRIPTORES ──────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.subscribers) && data.subscribers.length > 0) {
      const rows = data.subscribers.map((s: any) => ({
        id: s.id, email: s.email, createdAt: safeDate(s.createdAt) ?? new Date(),
      }));
      const r = await db.insert(subscribers).values(rows).onConflictDoNothing().returning({ id: subscribers.id });
      restored.subscribers = r.length;
    } else { restored.subscribers = 0; }
  } catch (e: any) { restored.subscribers = 0; tableErrors.subscribers = e?.message; }
  console.log(`  ✔ suscriptores:           ${restored.subscribers}`);

  // ── 15. CANALES DE TV ─────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.tvChannels) && data.tvChannels.length > 0) {
      const rows = data.tvChannels.map((c: any) => ({
        id: c.id, name: c.name, group: c.group ?? "General", logo: c.logo ?? "",
        streamUrl: c.streamUrl, isActive: c.isActive ?? true, order: c.order ?? 0,
        createdAt: safeDate(c.createdAt) ?? new Date(),
      }));
      const r = await db.insert(tvChannels).values(rows).onConflictDoNothing().returning({ id: tvChannels.id });
      restored.tvChannels = r.length;
    } else { restored.tvChannels = 0; }
  } catch (e: any) { restored.tvChannels = 0; tableErrors.tvChannels = e?.message; }
  console.log(`  ✔ canales TV:             ${restored.tvChannels}`);

  // ── 16. TICKETS DE SOPORTE ────────────────────────────────────────────────
  try {
    if (Array.isArray(data.supportTickets) && data.supportTickets.length > 0) {
      const rows = data.supportTickets.map((t: any) => ({
        id: t.id, userId: t.userId, userName: t.userName, userEmail: t.userEmail ?? "",
        subject: t.subject, status: t.status ?? "open",
        createdAt: safeDate(t.createdAt) ?? new Date(), updatedAt: safeDate(t.updatedAt) ?? new Date(),
      }));
      const r = await db.insert(supportTickets).values(rows).onConflictDoNothing().returning({ id: supportTickets.id });
      restored.supportTickets = r.length;
    } else { restored.supportTickets = 0; }
  } catch (e: any) { restored.supportTickets = 0; tableErrors.supportTickets = e?.message; }
  console.log(`  ✔ tickets soporte:        ${restored.supportTickets}`);

  // ── 17. MENSAJES DE SOPORTE ───────────────────────────────────────────────
  try {
    if (Array.isArray(data.supportMessages) && data.supportMessages.length > 0) {
      const rows = data.supportMessages.map((m: any) => ({
        id: m.id, ticketId: m.ticketId, senderId: m.senderId, senderName: m.senderName,
        isAdmin: m.isAdmin ?? false, isSeller: m.isSeller ?? false, message: m.message ?? "",
        imageUrl: m.imageUrl ?? "", agentIndex: m.agentIndex ?? 0, agentImage: m.agentImage ?? "",
        createdAt: safeDate(m.createdAt) ?? new Date(),
      }));
      const r = await db.insert(supportMessages).values(rows).onConflictDoNothing().returning({ id: supportMessages.id });
      restored.supportMessages = r.length;
    } else { restored.supportMessages = 0; }
  } catch (e: any) { restored.supportMessages = 0; tableErrors.supportMessages = e?.message; }
  console.log(`  ✔ mensajes soporte:       ${restored.supportMessages}`);

  // ── 18. REPORTES DE PROBLEMAS ─────────────────────────────────────────────
  try {
    if (Array.isArray(data.problemReports) && data.problemReports.length > 0) {
      const rows = data.problemReports.map((p: any) => ({
        id: p.id, userId: p.userId, userName: p.userName, userEmail: p.userEmail ?? "",
        subscriptionId: p.subscriptionId ?? "", subscriptionName: p.subscriptionName ?? "",
        description: p.description, image: p.image ?? "", status: p.status ?? "open",
        adminNotes: p.adminNotes ?? "", createdAt: safeDate(p.createdAt) ?? new Date(),
        updatedAt: safeDate(p.updatedAt) ?? new Date(),
      }));
      const r = await db.insert(problemReports).values(rows).onConflictDoNothing().returning({ id: problemReports.id });
      restored.problemReports = r.length;
    } else { restored.problemReports = 0; }
  } catch (e: any) { restored.problemReports = 0; tableErrors.problemReports = e?.message; }
  console.log(`  ✔ reportes problemas:     ${restored.problemReports}`);

  // ── 19. MENSAJES DE CLIENTES ──────────────────────────────────────────────
  try {
    if (Array.isArray(data.clientMessages) && data.clientMessages.length > 0) {
      const rows = data.clientMessages.map((m: any) => ({
        id: m.id, userId: m.userId, userName: m.userName, userEmail: m.userEmail ?? "",
        message: m.message, isAdmin: m.isAdmin ?? false, agentName: m.agentName ?? "",
        agentImage: m.agentImage ?? "", readByAdmin: m.readByAdmin ?? false,
        createdAt: safeDate(m.createdAt) ?? new Date(),
      }));
      const r = await db.insert(clientMessages).values(rows).onConflictDoNothing().returning({ id: clientMessages.id });
      restored.clientMessages = r.length;
    } else { restored.clientMessages = 0; }
  } catch (e: any) { restored.clientMessages = 0; tableErrors.clientMessages = e?.message; }
  console.log(`  ✔ mensajes clientes:      ${restored.clientMessages}`);

  // ── 20. AGENTES DE SOPORTE ────────────────────────────────────────────────
  try {
    if (Array.isArray(data.supportAgents) && data.supportAgents.length > 0) {
      const rows = data.supportAgents.map((a: any) => ({
        id: a.id, name: a.name, image: a.image ?? "", isActive: a.isActive ?? true,
        createdAt: safeDate(a.createdAt) ?? new Date(),
      }));
      const r = await db.insert(supportAgents).values(rows).onConflictDoNothing().returning({ id: supportAgents.id });
      restored.supportAgents = r.length;
    } else { restored.supportAgents = 0; }
  } catch (e: any) { restored.supportAgents = 0; tableErrors.supportAgents = e?.message; }
  console.log(`  ✔ agentes soporte:        ${restored.supportAgents}`);

  // ── 21. TRANSACCIONES VENDEDORES ──────────────────────────────────────────
  try {
    if (Array.isArray(data.sellerTransactions) && data.sellerTransactions.length > 0) {
      const rows = data.sellerTransactions.map((t: any) => ({
        id: t.id, sellerId: t.sellerId, orderId: t.orderId, amount: t.amount, type: t.type,
        description: t.description ?? "", createdAt: safeDate(t.createdAt) ?? new Date(),
      }));
      const r = await db.insert(sellerTransactions).values(rows).onConflictDoNothing().returning({ id: sellerTransactions.id });
      restored.sellerTransactions = r.length;
    } else { restored.sellerTransactions = 0; }
  } catch (e: any) { restored.sellerTransactions = 0; tableErrors.sellerTransactions = e?.message; }
  console.log(`  ✔ transacciones vendedor: ${restored.sellerTransactions}`);

  // ── 22. RETIROS VENDEDORES ────────────────────────────────────────────────
  try {
    if (Array.isArray(data.sellerWithdrawals) && data.sellerWithdrawals.length > 0) {
      const rows = data.sellerWithdrawals.map((w: any) => ({
        id: w.id, sellerId: w.sellerId, amount: w.amount, paymentMethod: w.paymentMethod,
        accountNumber: w.accountNumber, accountName: w.accountName, accountType: w.accountType,
        status: w.status ?? "pending", createdAt: safeDate(w.createdAt) ?? new Date(),
        processedAt: safeDate(w.processedAt, null),
      }));
      const r = await db.insert(sellerWithdrawals).values(rows).onConflictDoNothing().returning({ id: sellerWithdrawals.id });
      restored.sellerWithdrawals = r.length;
    } else { restored.sellerWithdrawals = 0; }
  } catch (e: any) { restored.sellerWithdrawals = 0; tableErrors.sellerWithdrawals = e?.message; }
  console.log(`  ✔ retiros vendedor:       ${restored.sellerWithdrawals}`);

  // ── 23. MENSAJES VENDEDORES ───────────────────────────────────────────────
  try {
    if (Array.isArray(data.sellerMessages) && data.sellerMessages.length > 0) {
      const rows = data.sellerMessages.map((m: any) => ({
        id: m.id, productId: m.productId, productName: m.productName ?? "",
        sellerId: m.sellerId, sellerEmail: m.sellerEmail ?? "", senderId: m.senderId,
        senderName: m.senderName, isAdmin: m.isAdmin ?? false, message: m.message ?? "",
        imageUrl: m.imageUrl ?? "", agentIndex: m.agentIndex ?? 0,
        createdAt: safeDate(m.createdAt) ?? new Date(),
      }));
      const r = await db.insert(sellerMessages).values(rows).onConflictDoNothing().returning({ id: sellerMessages.id });
      restored.sellerMessages = r.length;
    } else { restored.sellerMessages = 0; }
  } catch (e: any) { restored.sellerMessages = 0; tableErrors.sellerMessages = e?.message; }
  console.log(`  ✔ mensajes vendedor:      ${restored.sellerMessages}`);

  // ── 24. MÉTODOS DE PAGO RECARGAS ──────────────────────────────────────────
  try {
    if (Array.isArray(data.rechargePaymentMethods) && data.rechargePaymentMethods.length > 0) {
      const rows = data.rechargePaymentMethods.map((m: any) => ({
        id: m.id, name: m.name, type: m.type, accountNumber: m.accountNumber ?? "",
        accountName: m.accountName ?? "", instructions: m.instructions ?? "", logo: m.logo ?? "",
        isActive: m.isActive ?? true, order: m.order ?? 0, createdAt: safeDate(m.createdAt) ?? new Date(),
      }));
      const r = await db.insert(rechargePaymentMethods).values(rows).onConflictDoNothing().returning({ id: rechargePaymentMethods.id });
      restored.rechargePaymentMethods = r.length;
    } else { restored.rechargePaymentMethods = 0; }
  } catch (e: any) { restored.rechargePaymentMethods = 0; tableErrors.rechargePaymentMethods = e?.message; }
  console.log(`  ✔ métodos pago recargas:  ${restored.rechargePaymentMethods}`);

  // ── 25. CÓDIGOS DE DESCUENTO ──────────────────────────────────────────────
  try {
    if (Array.isArray(data.discountCodes) && data.discountCodes.length > 0) {
      const rows = data.discountCodes.map((c: any) => ({
        id: c.id, code: c.code, discountType: c.discountType ?? "percentage",
        discountValue: c.discountValue, description: c.description ?? "",
        maxUses: c.maxUses ?? null, usedCount: c.usedCount ?? 0,
        isActive: c.isActive ?? true, createdAt: safeDate(c.createdAt) ?? new Date(),
      }));
      const r = await db.insert(discountCodes).values(rows).onConflictDoNothing().returning({ id: discountCodes.id });
      restored.discountCodes = r.length;
    } else { restored.discountCodes = 0; }
  } catch (e: any) { restored.discountCodes = 0; tableErrors.discountCodes = e?.message; }
  console.log(`  ✔ códigos descuento:      ${restored.discountCodes}`);

  // ── 26. CREDENCIALES DE PRODUCTOS ─────────────────────────────────────────
  try {
    if (Array.isArray(data.productCredentials) && data.productCredentials.length > 0) {
      const rows = data.productCredentials.map((c: any) => ({
        id: c.id, productId: c.productId, credEmail: c.credEmail, credPassword: c.credPassword,
        credInstructions: c.credInstructions ?? "", isUsed: c.isUsed ?? false,
        usedByOrderId: c.usedByOrderId ?? "", assignedAt: safeDate(c.assignedAt, null),
        createdAt: safeDate(c.createdAt) ?? new Date(),
      }));
      const r = await db.insert(productCredentials).values(rows).onConflictDoNothing().returning({ id: productCredentials.id });
      restored.productCredentials = r.length;
    } else { restored.productCredentials = 0; }
  } catch (e: any) { restored.productCredentials = 0; tableErrors.productCredentials = e?.message; }
  console.log(`  ✔ credenciales producto:  ${restored.productCredentials}`);

  // ── 27. CORREOS BLOQUEADOS ────────────────────────────────────────────────
  try {
    if (Array.isArray(data.bannedEmails) && data.bannedEmails.length > 0) {
      const rows = data.bannedEmails.map((b: any) => ({
        id: b.id, email: b.email, reason: b.reason ?? "", bannedAt: safeDate(b.bannedAt) ?? new Date(),
      }));
      const r = await db.insert(bannedEmails).values(rows).onConflictDoNothing().returning({ id: bannedEmails.id });
      restored.bannedEmails = r.length;
    } else { restored.bannedEmails = 0; }
  } catch (e: any) { restored.bannedEmails = 0; tableErrors.bannedEmails = e?.message; }
  console.log(`  ✔ correos bloqueados:     ${restored.bannedEmails}`);

  // ── 28. PROGRAMA DE REFERIDOS ─────────────────────────────────────────────
  try {
    if (Array.isArray(data.referralProgram) && data.referralProgram.length > 0) {
      const rows = data.referralProgram.map((p: any) => ({
        id: p.id, isActive: p.isActive ?? false, title: p.title ?? "Programa de Referidos",
        description: p.description ?? "", registerBonus: p.registerBonus ?? 1,
        purchaseBonus: p.purchaseBonus ?? 4, updatedAt: safeDate(p.updatedAt) ?? new Date(),
      }));
      const r = await db.insert(referralProgram).values(rows).onConflictDoNothing().returning({ id: referralProgram.id });
      restored.referralProgram = r.length;
    } else { restored.referralProgram = 0; }
  } catch (e: any) { restored.referralProgram = 0; tableErrors.referralProgram = e?.message; }
  console.log(`  ✔ programa referidos:     ${restored.referralProgram}`);

  // ── 29. CONFIGURACIÓN ─────────────────────────────────────────────────────
  try {
    if (Array.isArray(data.settings) && data.settings.length > 0) {
      const rows = data.settings.map((s: any) => ({
        id: s.id, key: s.key, value: s.value,
      }));
      const r = await db.insert(settings).values(rows).onConflictDoNothing().returning({ id: settings.id });
      restored.settings = r.length;
    } else { restored.settings = 0; }
  } catch (e: any) { restored.settings = 0; tableErrors.settings = e?.message; }
  console.log(`  ✔ configuración:          ${restored.settings}`);

  console.log("\n" + "─".repeat(50));

  const errCount = Object.keys(tableErrors).length;
  if (errCount > 0) {
    console.log(`\n⚠️  Advertencias en ${errCount} tabla(s):`);
    for (const [table, msg] of Object.entries(tableErrors)) {
      console.log(`   ❌ ${table}: ${msg}`);
    }
  }

  const totalRestored = Object.values(restored).reduce((a, b) => a + b, 0);
  console.log(`\n✅ Restauración completada. ${totalRestored} registros nuevos añadidos.`);
  if (errCount === 0) {
    console.log("   Sin errores.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Error inesperado:", err);
  process.exit(1);
});
