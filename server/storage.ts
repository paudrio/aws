import { db } from "../db/index";
import { products, orders, settings, categories, multimedia, news, featuredSections, games, productCredentials, type Product, type InsertProduct, type Order, type InsertOrder, type Setting, type Category, type InsertCategory, type News, type InsertNews, type FeaturedSection, type InsertFeaturedSection, type Game, type InsertGame, type ProductCredential } from "@shared/schema";
import { eq, desc, asc, or, and } from "drizzle-orm";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(key: string, value: string): Promise<Setting>;
  
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  getMultimedia(): Promise<any[]>;
  createMultimedia(data: any): Promise<any>;
  deleteMultimedia(id: string): Promise<void>;
  getActiveMultimedia(type: string): Promise<any | undefined>;
  updateMultimedia(id: string, data: any): Promise<any | undefined>;

  getNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: string, news: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: string): Promise<void>;

  getFeaturedSections(): Promise<FeaturedSection[]>;
  createFeaturedSection(data: InsertFeaturedSection): Promise<FeaturedSection>;
  updateFeaturedSection(id: string, data: Partial<InsertFeaturedSection>): Promise<FeaturedSection | undefined>;
  deleteFeaturedSection(id: string): Promise<void>;

  getProductCredentials(productId: string): Promise<ProductCredential[]>;
  addProductCredential(productId: string, credEmail: string, credPassword: string, credInstructions?: string): Promise<ProductCredential>;
  deleteProductCredential(id: string): Promise<void>;
  claimProductCredential(productId: string, orderId: string): Promise<ProductCredential | null>;
  countAvailableCredentials(productId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(
      or(
        eq(products.sellerStatus, "none"),
        eq(products.sellerStatus, "approved")
      )
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products).set(productUpdate).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.date));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async updateOrderGameCode(id: string, gameCode: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ gameCode, status: "completed" } as any).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result[0];
  }

  async upsertSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({ key, value }).returning();
      return result[0];
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getMultimedia(): Promise<any[]> {
    return await db.select().from(multimedia);
  }

  async createMultimedia(data: any): Promise<any> {
    const result = await db.insert(multimedia).values(data).returning();
    return result[0];
  }

  async deleteMultimedia(id: string): Promise<void> {
    await db.delete(multimedia).where(eq(multimedia.id, id));
  }

  async getActiveMultimedia(type: string): Promise<any | undefined> {
    const result = await db.select().from(multimedia).where(eq(multimedia.type, type)).limit(1);
    return result[0];
  }

  async updateMultimedia(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(multimedia).set(data).where(eq(multimedia.id, id)).returning();
    return result[0];
  }

  async getNews(): Promise<News[]> {
    return await db.select().from(news).orderBy(desc(news.date));
  }

  async createNews(insertNews: InsertNews): Promise<News> {
    const result = await db.insert(news).values(insertNews).returning();
    return result[0];
  }

  async updateNews(id: string, newsUpdate: Partial<InsertNews>): Promise<News | undefined> {
    const result = await db.update(news).set(newsUpdate).where(eq(news.id, id)).returning();
    return result[0];
  }

  async deleteNews(id: string): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
  }

  async getFeaturedSections(): Promise<FeaturedSection[]> {
    return await db.select().from(featuredSections).orderBy(asc(featuredSections.order));
  }

  async createFeaturedSection(data: InsertFeaturedSection): Promise<FeaturedSection> {
    const result = await db.insert(featuredSections).values(data).returning();
    return result[0];
  }

  async updateFeaturedSection(id: string, data: Partial<InsertFeaturedSection>): Promise<FeaturedSection | undefined> {
    const result = await db.update(featuredSections).set(data).where(eq(featuredSections.id, id)).returning();
    return result[0];
  }

  async deleteFeaturedSection(id: string): Promise<void> {
    await db.delete(featuredSections).where(eq(featuredSections.id, id));
  }

  async getGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(asc(games.order));
  }

  async createGame(data: InsertGame): Promise<Game> {
    const result = await db.insert(games).values(data).returning();
    return result[0];
  }

  async updateGame(id: string, data: Partial<InsertGame>): Promise<Game | undefined> {
    const result = await db.update(games).set(data).where(eq(games.id, id)).returning();
    return result[0];
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  async getProductCredentials(productId: string): Promise<ProductCredential[]> {
    return await db.select().from(productCredentials)
      .where(eq(productCredentials.productId, productId))
      .orderBy(asc(productCredentials.createdAt));
  }

  async addProductCredential(productId: string, credEmail: string, credPassword: string, credInstructions?: string): Promise<ProductCredential> {
    const result = await db.insert(productCredentials).values({
      productId,
      credEmail,
      credPassword,
      credInstructions: credInstructions || "",
    }).returning();
    // Sync product stock with pool count
    const available = await this.countAvailableCredentials(productId);
    await db.update(products).set({ stockQuantity: available, inStock: available > 0 }).where(eq(products.id, productId));
    return result[0];
  }

  async deleteProductCredential(id: string): Promise<void> {
    const [cred] = await db.select().from(productCredentials).where(eq(productCredentials.id, id));
    await db.delete(productCredentials).where(eq(productCredentials.id, id));
    if (cred?.productId) {
      const available = await this.countAvailableCredentials(cred.productId);
      await db.update(products).set({ stockQuantity: available, inStock: available > 0 }).where(eq(products.id, cred.productId));
    }
  }

  async claimProductCredential(productId: string, orderId: string): Promise<ProductCredential | null> {
    const available = await db.select().from(productCredentials)
      .where(and(eq(productCredentials.productId, productId), eq(productCredentials.isUsed, false)))
      .orderBy(asc(productCredentials.createdAt))
      .limit(1);
    if (!available[0]) return null;
    const result = await db.update(productCredentials)
      .set({ isUsed: true, usedByOrderId: orderId, assignedAt: new Date() })
      .where(eq(productCredentials.id, available[0].id))
      .returning();
    // Sync product stock after claim
    const remaining = await this.countAvailableCredentials(productId);
    await db.update(products).set({ stockQuantity: remaining, inStock: remaining > 0 }).where(eq(products.id, productId));
    return result[0] || null;
  }

  async countAvailableCredentials(productId: string): Promise<number> {
    const rows = await db.select().from(productCredentials)
      .where(and(eq(productCredentials.productId, productId), eq(productCredentials.isUsed, false)));
    return rows.length;
  }
}

export const storage = new DatabaseStorage();
