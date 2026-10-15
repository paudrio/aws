import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  priceUsd: real("price_usd"),
  image: text("image").notNull(),
  description: text("description").default(""),
  whatsappNumber: text("whatsapp_number"),
  isMonthly: boolean("is_monthly").default(true),
  inStock: boolean("in_stock").default(true),
  showCheckmarks: boolean("show_checkmarks").default(true),
  showWhatsapp: boolean("show_whatsapp").default(true),
  showBinance: boolean("show_binance").default(false),
  showBanrural: boolean("show_banrural").default(false),
  showBac: boolean("show_bac").default(false),
  showBi: boolean("show_bi").default(false),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  verifiedSeller: boolean("verified_seller").default(false),
  stockQuantity: integer("stock_quantity").default(-1),
  streamUrl: text("stream_url"),
  binanceData: text("binance_data").default(""),
  binanceName: text("binance_name").default(""),
  binanceInstructions: text("binance_instructions").default(""),
  banruralData: text("banrural_data").default(""),
  banruralName: text("banrural_name").default(""),
  banruralInstructions: text("banrural_instructions").default(""),
  bacData: text("bac_data").default(""),
  bacName: text("bac_name").default(""),
  bacInstructions: text("bac_instructions").default(""),
  biData: text("bi_data").default(""),
  biName: text("bi_name").default(""),
  biInstructions: text("bi_instructions").default(""),
  paymentMethodIds: text("payment_method_ids").default("[]"),
  sellerId: varchar("seller_id"),
  sellerStatus: text("seller_status").default("none"),
  sellerEmail: text("seller_email"),
  submittedAt: timestamp("submitted_at"),
  productEmail: text("product_email").default(""),
  productPassword: text("product_password").default(""),
  productInstructions: text("product_instructions").default(""),
  discountPercent: integer("discount_percent").default(0),
  originalPrice: real("original_price"),
  requiresCustomerEmail: boolean("requires_customer_email").default(false),
  customerEmailLabel: text("customer_email_label").default(""),
  enableBotReviews: boolean("enable_bot_reviews").default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true }).extend({
  priceUsd: z.number().optional().nullable(),
  verifiedSeller: z.boolean().optional(),
  stockQuantity: z.number().optional(),
  binanceData: z.string().optional(),
  binanceName: z.string().optional(),
  binanceInstructions: z.string().optional(),
  banruralData: z.string().optional(),
  banruralName: z.string().optional(),
  banruralInstructions: z.string().optional(),
  bacData: z.string().optional(),
  bacName: z.string().optional(),
  bacInstructions: z.string().optional(),
  biData: z.string().optional(),
  biName: z.string().optional(),
  biInstructions: z.string().optional(),
  streamUrl: z.string().optional(),
  paymentMethodIds: z.string().optional(),
  sellerId: z.string().optional(),
  sellerStatus: z.string().optional(),
  sellerEmail: z.string().optional(),
  submittedAt: z.date().optional(),
  productEmail: z.string().optional(),
  productPassword: z.string().optional(),
  productInstructions: z.string().optional(),
  originalPrice: z.number().optional().nullable(),
  requiresCustomerEmail: z.boolean().optional(),
  customerEmailLabel: z.string().optional(),
  enableBotReviews: z.boolean().optional(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  deliveryMethod: text("delivery_method"),
  deliveryContact: text("delivery_contact"),
  paymentScreenshot: text("payment_screenshot"),
  customerEmail: text("customer_email").default(""),
  customerPassword: text("customer_password").default(""),
  orderRef: text("order_ref"),
  sellerId: varchar("seller_id"),
  gameCode: text("game_code").default(""),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  label: text("label"),
  image: text("image"), // Nueva columna para subir imagen
  streamUrl: text("stream_url"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, label: true }).extend({
  name: z.string().min(1, "El nombre es obligatorio"),
  image: z.string().nullable().optional(),
  streamUrl: z.string().nullable().optional()
});

export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  video: text("video"),
  date: timestamp("date").notNull().defaultNow(),
});

export const multimedia = pgTable("multimedia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // 'video' or 'image'
  isActive: boolean("is_active").default(true),
  isHero: boolean("is_hero").default(false),
});

export const featuredSections = pgTable("featured_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  image: text("image").notNull(),
  link: text("link").default(""),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertFeaturedSectionSchema = createInsertSchema(featuredSections).omit({ id: true });
export type FeaturedSection = typeof featuredSections.$inferSelect;
export type InsertFeaturedSection = z.infer<typeof insertFeaturedSectionSchema>;

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  image: text("image").notNull(),
  logoImage: text("logo_image").default(""),
  countryImage: text("country_image").default(""),
  platformName: text("platform_name").default(""),
  countryText: text("country_text").default(""),
  platform: text("platform").default(""),
  price: real("price").default(0),
  link: text("link").default(""),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  deliveryType: text("delivery_type").default("code"),
  createdAt: timestamp("created_at").defaultNow(),
  discountPercent: integer("discount_percent").default(0),
  requiresCustomerEmail: boolean("requires_customer_email").default(false),
  customerEmailLabel: text("customer_email_label").default(""),
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true });
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export const fortniteItems = pgTable("fortnite_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  image: text("image").default(""),
  image2: text("image2").default(""),
  image3: text("image3").default(""),
  section: text("section").default(""),
  imagesJson: text("images_json").default("[]"),
  pavos: integer("pavos").default(0),
  price: real("price").default(0),
  originalPrice: real("original_price").default(0),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertFortniteItemSchema = createInsertSchema(fortniteItems).omit({ id: true, createdAt: true });
export type FortniteItem = typeof fortniteItems.$inferSelect;
export type InsertFortniteItem = z.infer<typeof insertFortniteItemSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, date: true }).extend({
  sellerId: z.string().optional(),
});
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertNewsSchema = createInsertSchema(news).omit({ id: true, date: true });
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, createdAt: true });
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image").default(""),
  price: real("price").notNull(),
  status: text("status").notNull().default("pending"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  credentialEmail: text("credential_email").default(""),
  credentialPassword: text("credential_password").default(""),
  credentialName: text("credential_name").default(""),
  credentialInstructions: text("credential_instructions").default(""),
  orderId: varchar("order_id").default(""),
  renewalCode: text("renewal_code").default(""),
  expirationNotified: boolean("expiration_notified").default(false),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, startDate: true });
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export const renewalRequests = pgTable("renewal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subscriptionId: varchar("subscription_id").notNull(),
  renewalCode: text("renewal_code").notNull(),
  paymentScreenshot: text("payment_screenshot").default(""),
  paymentMethod: text("payment_method").default("screenshot"),
  paypalOrderId: text("paypal_order_id").default(""),
  months: integer("months").default(1),
  totalAmount: integer("total_amount").default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  adminNotes: text("admin_notes").default(""),
});

export const insertRenewalRequestSchema = createInsertSchema(renewalRequests).omit({ id: true, createdAt: true });
export type RenewalRequest = typeof renewalRequests.$inferSelect;
export type InsertRenewalRequest = z.infer<typeof insertRenewalRequestSchema>;

export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  image: text("image").notNull(),
  title: text("title").default(""),
  link: text("link").default(""),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").default(""),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  isAdmin: boolean("is_admin").default(false),
  isSeller: boolean("is_seller").default(false),
  message: text("message").default(""),
  imageUrl: text("image_url").default(""),
  agentIndex: integer("agent_index").default(0),
  agentImage: text("agent_image").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const problemReports = pgTable("problem_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").default(""),
  subscriptionId: varchar("subscription_id").default(""),
  subscriptionName: text("subscription_name").default(""),
  description: text("description").notNull(),
  image: text("image").default(""),
  status: text("status").notNull().default("open"),
  adminNotes: text("admin_notes").default(""),
  refunded: boolean("refunded").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProblemReportSchema = createInsertSchema(problemReports).omit({ id: true, createdAt: true, updatedAt: true });
export type ProblemReport = typeof problemReports.$inferSelect;
export type InsertProblemReport = z.infer<typeof insertProblemReportSchema>;

export const tvChannels = pgTable("tv_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  group: text("group").default("General"),
  logo: text("logo").default(""),
  streamUrl: text("stream_url").notNull(),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTvChannelSchema = createInsertSchema(tvChannels).omit({ id: true, createdAt: true });
export type TvChannel = typeof tvChannels.$inferSelect;
export type InsertTvChannel = z.infer<typeof insertTvChannelSchema>;

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ id: true, createdAt: true });
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export const sellerTransactions = pgTable("seller_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull(),
  orderId: varchar("order_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSellerTransactionSchema = createInsertSchema(sellerTransactions).omit({ id: true, createdAt: true });
export type SellerTransaction = typeof sellerTransactions.$inferSelect;
export type InsertSellerTransaction = z.infer<typeof insertSellerTransactionSchema>;

export const sellerWithdrawals = pgTable("seller_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertSellerWithdrawalSchema = createInsertSchema(sellerWithdrawals).omit({ id: true, createdAt: true });
export type SellerWithdrawal = typeof sellerWithdrawals.$inferSelect;
export type InsertSellerWithdrawal = z.infer<typeof insertSellerWithdrawalSchema>;

export const rechargePaymentMethods = pgTable("recharge_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  accountNumber: text("account_number").default(""),
  accountName: text("account_name").default(""),
  instructions: text("instructions").default(""),
  logo: text("logo").default(""),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRechargePaymentMethodSchema = createInsertSchema(rechargePaymentMethods).omit({ id: true, createdAt: true });
export type RechargePaymentMethod = typeof rechargePaymentMethods.$inferSelect;
export type InsertRechargePaymentMethod = z.infer<typeof insertRechargePaymentMethodSchema>;

export const rechargeRequests = pgTable("recharge_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").default(""),
  amount: integer("amount").notNull(),
  paymentMethodId: varchar("payment_method_id").notNull(),
  paymentMethodName: text("payment_method_name").notNull(),
  screenshot: text("screenshot").default(""),
  code: text("code").notNull(),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertRechargeRequestSchema = createInsertSchema(rechargeRequests).omit({ id: true, createdAt: true });
export type RechargeRequest = typeof rechargeRequests.$inferSelect;
export type InsertRechargeRequest = z.infer<typeof insertRechargeRequestSchema>;

export const userTransactions = pgTable("user_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").default(""),
  referenceId: varchar("reference_id").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserTransactionSchema = createInsertSchema(userTransactions).omit({ id: true, createdAt: true });
export type UserTransaction = typeof userTransactions.$inferSelect;
export type InsertUserTransaction = z.infer<typeof insertUserTransactionSchema>;

export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: integer("discount_value").notNull(),
  description: text("description").default(""),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({ id: true, createdAt: true, usedCount: true });
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;

export const productCredentials = pgTable("product_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  credEmail: text("cred_email").notNull(),
  credPassword: text("cred_password").notNull(),
  credInstructions: text("cred_instructions").default(""),
  isUsed: boolean("is_used").default(false),
  usedByOrderId: varchar("used_by_order_id").default(""),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductCredentialSchema = createInsertSchema(productCredentials).omit({ id: true, createdAt: true, isUsed: true, usedByOrderId: true, assignedAt: true });
export type ProductCredential = typeof productCredentials.$inferSelect;
export type InsertProductCredential = z.infer<typeof insertProductCredentialSchema>;

export const bannedEmails = pgTable("banned_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  reason: text("reason").default(""),
  bannedAt: timestamp("banned_at").notNull().defaultNow(),
});

export const supportAgents = pgTable("support_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  image: text("image").default(""),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupportAgentSchema = createInsertSchema(supportAgents).omit({ id: true, createdAt: true });
export type SupportAgent = typeof supportAgents.$inferSelect;
export type InsertSupportAgent = z.infer<typeof insertSupportAgentSchema>;

export const referralProgram = pgTable("referral_program", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").default(false),
  title: text("title").default("Programa de Referidos"),
  description: text("description").default("Comparte tu link y gana saldo"),
  registerBonus: real("register_bonus").default(1),
  purchaseBonus: real("purchase_bonus").default(4),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ReferralProgram = typeof referralProgram.$inferSelect;

export const referralTransactions = pgTable("referral_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(),
  referredUserId: varchar("referred_user_id").notNull(),
  orderId: varchar("order_id").default(""),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReferralTransaction = typeof referralTransactions.$inferSelect;

export const clientMessages = pgTable("client_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").default(""),
  message: text("message").notNull(),
  isAdmin: boolean("is_admin").default(false),
  agentName: text("agent_name").default(""),
  agentImage: text("agent_image").default(""),
  readByAdmin: boolean("read_by_admin").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientMessageSchema = createInsertSchema(clientMessages).omit({ id: true, createdAt: true });
export type ClientMessage = typeof clientMessages.$inferSelect;
export type InsertClientMessage = z.infer<typeof insertClientMessageSchema>;

export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull().default(""),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({ id: true, createdAt: true });
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;

export const sellerMessages = pgTable("seller_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull().default(""),
  sellerId: varchar("seller_id").notNull(),
  sellerEmail: text("seller_email").default(""),
  senderId: varchar("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  isAdmin: boolean("is_admin").default(false),
  message: text("message").notNull().default(""),
  imageUrl: text("image_url").default(""),
  agentIndex: integer("agent_index").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
