import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertCategorySchema, subscribers, banners, userSubscriptions, orders, supportTickets, supportMessages, users, problemReports, tvChannels, insertTvChannelSchema, products, sellerTransactions, sellerWithdrawals, rechargePaymentMethods, rechargeRequests, userTransactions, renewalRequests, sellerMessages, discountCodes, bannedEmails, clientMessages, supportAgents, referralProgram, referralTransactions, multimedia, games, news, productCredentials, featuredSections, settings, categories, productReviews, fortniteItems } from "@shared/schema";
import { db } from "../db/index";
import { eq, desc, sql, ne, ilike, and, inArray, or, isNull, asc } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import { isAuthenticated } from "./replit_integrations/auth";
import { sendAdminNewTicketEmail, sendAdminNewOrderEmail, sendAdminScreenshotOrderEmail, sendAdminNewChatMessageEmail, sendUserNewAdminMessageEmail, sendUserTicketResolvedEmail, sendUserSubscriptionUpdatedEmail, sendSuspensionEmail, sendReactivationEmail, sendAdminNotificationEmail, sendCredentialsEmail, resendCredentialsEmail, sendSellerProductPublishedEmail, sendSellerProductSoldEmail, sendAdminSellerSaleEmail, sendUserPurchaseConfirmationEmail, sendWelcomeEmail, sendAdminNewUserEmail, sendUserTicketOpenedEmail, sendUserReportReceivedEmail, sendAdminNewRechargeEmail, sendRechargeSubmittedEmail, sendRechargeApprovedEmail, sendRechargeRejectedEmail, sendAdminProblemReportEmail, sendAdminSellerProductSubmittedEmail, sendAdminWithdrawalRequestEmail, sendExpirationReminderEmail, sendRenewalApprovedEmail, sendRenewalRejectedEmail, sendWithdrawalPaidEmail, sendGamePurchaseUserEmail, sendGameCodeDeliveryEmail, sendGameCredentialsDeliveryEmail, sendAdminGamePurchaseEmail, sendReferralRegisterNotificationEmail, sendAdminReferralNotificationEmail, sendReferralProgramActivatedEmail, sendReferralProgramDeactivatedEmail, sendAdminReferralProgramStatusEmail, sendGiftEmail, sendGiftRecipientEmail, sendGiftSenderConfirmationEmail, sendSubscriptionRefundEmail, sendAdminRefundProcessedEmail, sendAdminFortniteOrderEmail, sendUserFortniteOrderEmail } from "./emailService";

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// In-memory typing status: key → { time, agentImage, agentName }
const typingMap = new Map<string, { time: number; agentImage: string; agentName: string }>();
const TYPING_EXPIRE_MS = 4000;

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      const blocked = /\.(php|php3|php4|phtml|asp|aspx|jsp|cgi|exe|sh|bat|cmd|py|rb|pl|htaccess|env)$/i;
      if (blocked.test(file.originalname)) {
        return cb(new Error("Tipo de archivo no permitido"));
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB limit for large videos
  });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Proxy para el stream HLS para evitar problemas de CORS
  app.get("/api/stream-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send("URL is required");

    const isM3u8 = targetUrl.endsWith('.m3u8') || targetUrl.includes('.m3u8');
    const isSegment = targetUrl.endsWith('.ts') || targetUrl.endsWith('.aac') || targetUrl.endsWith('.mp4') || targetUrl.includes('.ts?');

    try {
      const parsedTarget = new URL(targetUrl);
      const origin = parsedTarget.origin;
      const commonHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive'
      };

      if (isSegment) {
        const segResponse = await axios({
          method: 'get',
          url: targetUrl,
          responseType: 'stream',
          headers: commonHeaders,
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
        const ct = segResponse.headers['content-type'] || 'video/mp2t';
        res.setHeader('Content-Type', ct);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=5');
        if (segResponse.headers['content-length']) {
          res.setHeader('Content-Length', segResponse.headers['content-length']);
        }
        segResponse.data.pipe(res);
        return;
      }

      const response = await axios({
        method: 'get',
        url: targetUrl,
        responseType: 'arraybuffer',
        headers: commonHeaders,
        timeout: 8000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      });
      
      const contentType = response.headers['content-type'] || '';
      
      if (contentType.includes('mpegurl') || isM3u8) {
        let content = response.data.toString();
        const lines = content.split('\n');
        const modifiedLines = lines.map((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            try {
              let absoluteUrl;
              if (trimmedLine.startsWith('http')) {
                absoluteUrl = trimmedLine;
              } else if (trimmedLine.startsWith('/')) {
                const origin = new URL(targetUrl).origin;
                absoluteUrl = origin + trimmedLine;
              } else {
                absoluteUrl = new URL(trimmedLine, targetUrl).href;
              }
              if (absoluteUrl.includes('/api/stream-proxy')) return line;
              return `/api/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
            } catch (e) {
              return line;
            }
          }
          return line;
        });
        
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store');
        return res.send(modifiedLines.join('\n'));
      }

      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=5');
      res.send(response.data);
    } catch (error: any) {
      const status = error?.response?.status || 500;
      if (status === 403 || status === 451) {
        try {
          const retryResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: isSegment ? 'stream' : 'arraybuffer',
            headers: {
              'User-Agent': 'IPTV Smarters/1.0',
              'Accept': '*/*'
            },
            timeout: 6000,
            maxRedirects: 5
          });
          const ct2 = retryResponse.headers['content-type'] || 'application/octet-stream';
          res.setHeader('Content-Type', ct2);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache');
          if (isSegment) {
            retryResponse.data.pipe(res);
          } else {
            res.send(retryResponse.data);
          }
          return;
        } catch {
          // retry also failed
        }
      }
      if (status !== 403 && status !== 404) {
        console.error(`Stream Proxy Error [${status}]:`, error.message?.substring(0, 100));
      }
      res.status(status).send("Stream unavailable");
    }
  });
  // Products Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.json(product);
    } catch (error: any) {
      console.error("[Products] Create error:", error?.errors || error?.message || error);
      res.status(400).json({ error: "Invalid product data", details: error?.errors || error?.message });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Orders Routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);

      if (validatedData.productId) {
        const product = await storage.getProduct(validatedData.productId);
        if (product && product.stockQuantity !== null && product.stockQuantity !== -1 && product.stockQuantity <= 0) {
          return res.status(400).json({ error: "Producto sin stock disponible" });
        }
        if (product && product.sellerId) {
          (validatedData as any).sellerId = product.sellerId;
        }
      }

      const order = await storage.createOrder(validatedData);

      if (validatedData.productId) {
        const product = await storage.getProduct(validatedData.productId);
        if (product && product.stockQuantity !== null && product.stockQuantity !== -1) {
          const newQty = Math.max(0, product.stockQuantity - 1);
          await storage.updateProduct(product.id, { 
            stockQuantity: newQty,
            inStock: newQty > 0
          });
        }
      }

      // Resolve buyer email
      let userEmail = "";
      if ((req as any).user?.id) {
        const userObj = await db.select().from(users).where(eq(users.id, (req as any).user.id)).then(r => r[0]);
        if (userObj?.email) userEmail = userObj.email;
      }
      if (!userEmail && (validatedData as any).customerEmail && (validatedData as any).customerEmail.includes("@")) {
        userEmail = (validatedData as any).customerEmail;
      }
      if (!userEmail && validatedData.deliveryContact && validatedData.deliveryContact.includes("@")) {
        userEmail = validatedData.deliveryContact;
      }

      // Screenshot/manual orders: NO auto-delivery. Admin reviews and clicks "Enviar" to deliver from stock.
      // Admin gets full order details email with screenshot link.
      sendAdminScreenshotOrderEmail(
        validatedData.customerName,
        userEmail || validatedData.deliveryContact || validatedData.customerPhone,
        validatedData.productName,
        validatedData.price,
        validatedData.paymentMethod || "No especificado",
        (validatedData as any).paymentScreenshot || "",
        (validatedData as any).orderRef || "",
        order.id
      ).catch(() => {});

      // Buyer confirmation email
      sendUserPurchaseConfirmationEmail(
        userEmail || "",
        validatedData.customerName,
        validatedData.productName,
        validatedData.price,
        validatedData.paymentMethod || "No especificado",
        (validatedData as any).orderRef || ""
      ).catch(() => {});

      // Create pending subscription server-side for authenticated users (all products: subscriptions and games)
      if ((req as any).user?.id) {
        const product = await storage.getProduct(validatedData.productId as string).catch(() => null);
        if (product) {
          const existingSub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, order.id)).then(r => r[0]);
          if (!existingSub) {
            await db.insert(userSubscriptions).values({
              userId: (req as any).user.id,
              productId: validatedData.productId as string,
              productName: validatedData.productName,
              productImage: product?.image || "",
              price: validatedData.price,
              status: "pending",
              orderId: order.id,
              credentialEmail: "",
              credentialPassword: "",
              credentialInstructions: "",
              credentialName: validatedData.productName,
            }).catch(() => {});
          }
        }
      }

      res.json({ ...order, credDelivered: false });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.post("/api/orders/wallet", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const { customerName, customerPhone, productId, deliveryMethod, deliveryContact, customerEmail, customerPassword, orderRef, balanceType } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "Producto requerido" });
      }

      const product = await storage.getProduct(productId);
      // If not found in products table, check games table
      const gameRecord = !product ? await db.select().from(games).where(eq(games.id, productId)).then(r => r[0]) : null;
      // If not found in games table, check fortniteItems table
      const fortniteRecord = (!product && !gameRecord)
        ? await db.select().from(fortniteItems).where(eq(fortniteItems.id, productId)).then(r => r[0])
        : null;
      if (!product && !gameRecord && !fortniteRecord) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const serverPrice = product ? product.price : (gameRecord ? (gameRecord.price || 0) : Number(fortniteRecord!.price));
      const productName = product ? product.name : (gameRecord ? gameRecord.title : fortniteRecord!.title);
      const productImage = product ? (product.image || "") : (gameRecord ? (gameRecord.image || "") : (fortniteRecord!.image || ""));

      if (product && product.stockQuantity !== null && product.stockQuantity !== -1 && product.stockQuantity <= 0) {
        return res.status(400).json({ error: "Producto sin stock disponible" });
      }

      const result = await db.transaction(async (tx) => {
        const txns = await tx.select().from(userTransactions).where(eq(userTransactions.userId, user.id));
        const isReferralTx = (t: any) => t.type === "credit" && (t.description || "").startsWith("Bono de");
        const referralCredits = txns.filter(isReferralTx).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const regularCredits = txns.filter((t: any) => t.type === "credit" && !isReferralTx(t)).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const debits = txns.filter((t: any) => t.type === "debit").reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const totalBalance = regularCredits + referralCredits - debits;

        // Si el usuario eligió saldo de referidos, validar solo ese saldo
        let availableBalance = totalBalance;
        if (balanceType === "referral") {
          const remainingAfterRegular = regularCredits - debits;
          availableBalance = remainingAfterRegular >= 0 ? referralCredits : Math.max(0, referralCredits + remainingAfterRegular);
        }

        if (availableBalance < serverPrice) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        const [order] = await tx.insert(orders).values({
          customerName,
          customerPhone,
          productId,
          productName,
          price: serverPrice,
          paymentMethod: "saldo",
          deliveryMethod: deliveryMethod || "whatsapp",
          deliveryContact,
          paymentScreenshot: "",
          customerEmail: customerEmail || "",
          customerPassword: customerPassword || "",
          orderRef,
          sellerId: product?.sellerId || null,
          status: "pending",
        }).returning();

        await tx.insert(userTransactions).values({
          userId: user.id,
          amount: serverPrice,
          type: "debit",
          description: `Compra: ${productName} - Ref: ${orderRef}`,
          referenceId: order.id,
        });

        if (product && product.stockQuantity !== null && product.stockQuantity !== -1) {
          const newQty = Math.max(0, product.stockQuantity - 1);
          await tx.update(products).set({
            stockQuantity: newQty,
            inStock: newQty > 0
          }).where(eq(products.id, product.id));
        }

        return order;
      });

      const userObj = await db.select().from(users).where(eq(users.id, user.id)).then(r => r[0]);
      const walletUserEmail = userObj?.email || "";

      // Auto-deliver credentials: pool first, then fallback to single cred
      let walletCredDelivered = false;
      let walletDeliveredCred: { credEmail: string; credPassword: string; credInstructions?: string | null } | null = null;
      const claimed = await storage.claimProductCredential(product?.id || productId, result.id).catch(() => null);
      if (claimed) {
        if (walletUserEmail) sendCredentialsEmail(walletUserEmail, customerName, productName, claimed.credEmail, claimed.credPassword, claimed.credInstructions || undefined).catch(() => {});
        await storage.updateOrderStatus(result.id, "completed").catch(() => {});
        walletCredDelivered = true;
        walletDeliveredCred = { credEmail: claimed.credEmail, credPassword: claimed.credPassword, credInstructions: claimed.credInstructions };
      } else if (product?.productEmail && product?.productPassword) {
        if (walletUserEmail) sendCredentialsEmail(walletUserEmail, customerName, productName, product.productEmail, product.productPassword, (product as any).productInstructions || undefined).catch(() => {});
        await storage.updateOrderStatus(result.id, "completed").catch(() => {});
        walletCredDelivered = true;
        walletDeliveredCred = { credEmail: product.productEmail, credPassword: product.productPassword, credInstructions: (product as any).productInstructions || null };
      } else {
        // No credentials in pool or product — mark as approved (payment received, pending credential assignment)
        await storage.updateOrderStatus(result.id, "approved").catch(() => {});
      }

      if (fortniteRecord) {
        // Fortnite-specific emails: admin + user
        sendAdminFortniteOrderEmail(customerName, deliveryContact || "", productName, serverPrice, orderRef || "", walletUserEmail).catch(() => {});
        if (walletUserEmail) sendUserFortniteOrderEmail(walletUserEmail, customerName, productName, serverPrice, orderRef || "", deliveryContact || "").catch(() => {});
      } else {
        sendAdminNewOrderEmail(customerName, deliveryContact || customerPhone, productName, serverPrice, "Saldo de cuenta").catch(() => {});
        if (walletUserEmail && !walletCredDelivered) {
          sendUserPurchaseConfirmationEmail(walletUserEmail, customerName, productName, serverPrice, "Saldo de cuenta", orderRef || "").catch(() => {});
        }
      }
      // When credentials auto-delivered, buyer already received credentials email — no extra confirmation needed

      // Create userSubscription server-side for all products (subscriptions and games)
      {
        const existingSub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, result.id)).then(r => r[0]);
        if (!existingSub) {
          const walletEndDate = new Date();
          walletEndDate.setDate(walletEndDate.getDate() + 30);
          await db.insert(userSubscriptions).values({
            userId: user.id,
            productId,
            productName,
            productImage,
            price: serverPrice,
            status: "active",
            orderId: result.id,
            credentialEmail: walletDeliveredCred?.credEmail || "",
            credentialPassword: walletDeliveredCred?.credPassword || "",
            credentialInstructions: walletDeliveredCred?.credInstructions || "",
            credentialName: productName,
            endDate: walletEndDate,
          }).catch(() => {});
        }
      }

      // Credit referrer for purchase if applicable
      if (userObj?.referredBy) {
        const [referrer] = await db.select().from(users).where(eq(users.referralCode, userObj.referredBy));
        if (referrer) {
          creditReferrer(referrer.id, user.id, "purchase", result.id).catch(() => {});
        }
      }

      res.json({ ...result, credDelivered: walletCredDelivered, credentialEmail: walletDeliveredCred?.credEmail || null, credentialPassword: walletDeliveredCred?.credPassword || null, credentialInstructions: walletDeliveredCred?.credInstructions || null });
    } catch (error: any) {
      if (error?.message === "INSUFFICIENT_BALANCE") {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }
      console.error("Wallet order error:", error);
      res.status(500).json({ error: "Error al procesar compra con saldo" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const orderId = req.params.id;
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // When admin approves a non-wallet order, auto-deliver credentials from pool or product
      if (status === "approved" && order.paymentMethod !== "saldo") {
        // Resolve buyer email
        let buyerEmail = "";
        const orderSubs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
        if (orderSubs.length > 0) {
          const subUser = await db.select().from(users).where(eq(users.id, orderSubs[0].userId)).then(r => r[0]);
          if (subUser?.email) buyerEmail = subUser.email;
        }
        if (!buyerEmail && order.customerEmail && (order.customerEmail as string).includes("@")) buyerEmail = order.customerEmail as string;
        if (!buyerEmail && order.deliveryContact && (order.deliveryContact as string).includes("@")) buyerEmail = order.deliveryContact as string;

        if (buyerEmail && order.productId) {
          const claimed = await storage.claimProductCredential(order.productId as string, orderId).catch(() => null);
          if (claimed) {
            sendCredentialsEmail(buyerEmail, order.customerName, order.productName, claimed.credEmail, claimed.credPassword, claimed.credInstructions || undefined).catch(() => {});
            await storage.updateOrderStatus(orderId, "completed").catch(() => {});
            if (orderSubs.length > 0) {
              await db.update(userSubscriptions).set({ status: "active", credentialEmail: claimed.credEmail, credentialPassword: claimed.credPassword, credentialInstructions: claimed.credInstructions || "" }).where(eq(userSubscriptions.orderId, orderId)).catch(() => {});
            }
          } else {
            const prod = await storage.getProduct(order.productId as string);
            if (prod?.productEmail && prod?.productPassword) {
              sendCredentialsEmail(buyerEmail, order.customerName, order.productName, prod.productEmail, prod.productPassword, (prod as any).productInstructions || undefined).catch(() => {});
              await storage.updateOrderStatus(orderId, "completed").catch(() => {});
              if (orderSubs.length > 0) {
                await db.update(userSubscriptions).set({ status: "active", credentialEmail: prod.productEmail, credentialPassword: prod.productPassword, credentialInstructions: (prod as any).productInstructions || "" }).where(eq(userSubscriptions.orderId, orderId)).catch(() => {});
              }
            }
          }
        }
      }

      if ((status === "completed" || status === "approved") && order.sellerId) {
        const existing = await db.select().from(sellerTransactions).where(eq(sellerTransactions.orderId, order.id));
        if (existing.length === 0) {
          await db.insert(sellerTransactions).values({
            sellerId: order.sellerId,
            orderId: order.id,
            amount: order.price,
            type: "credit",
            description: `Venta de ${order.productName}`,
          });
          const [seller] = await db.select().from(users).where(eq(users.id, order.sellerId));
          const sellerDisplayName = seller?.firstName || seller?.email?.split("@")[0] || "Vendedor";
          if (seller?.email) {
            sendSellerProductSoldEmail(seller.email, sellerDisplayName, order.productName, order.price, order.customerName).catch(() => {});
          }
          sendAdminSellerSaleEmail(sellerDisplayName, seller?.email || order.sellerId, order.productName, order.price, order.customerName).catch(() => {});
        }
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Failed to update order status" });
    }
  });

  // PayPal Routes
  const getPayPalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await axios.post(
      "https://api-m.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data.access_token;
  };

  app.get("/api/paypal/config", (req, res) => {
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID || "" });
  });

  app.post("/api/paypal/create-order", async (req, res) => {
    try {
      const { amount, productName } = req.body;
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: "Monto inválido" });
      }
      const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
      const accessToken = await getPayPalAccessToken();
      const response = await axios.post(
        "https://api-m.paypal.com/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: "USD", value: Number(amount).toFixed(2) },
            description: productName || "Producto PAUDRONIX GT",
          }],
          application_context: {
            brand_name: "PAUDRONIX GT",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            locale: "es-GT",
            return_url: `${appUrl}/paypal-return`,
            cancel_url: `${appUrl}/paypal-cancel`,
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      const approvalLink = response.data.links?.find((l: any) => l.rel === "approve");
      res.json({ id: response.data.id, approvalUrl: approvalLink?.href });
    } catch (error: any) {
      const detail = error?.response?.data || error.message;
      console.error("[PAYPAL] create-order error:", JSON.stringify(detail));
      res.status(500).json({ error: "Error al crear orden PayPal", detail });
    }
  });

  app.post("/api/paypal/capture-order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const accessToken = await getPayPalAccessToken();
      const response = await axios.post(
        `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      res.json(response.data);
    } catch (error: any) {
      const detail = error?.response?.data || error.message;
      console.error("[PAYPAL] capture-order error:", JSON.stringify(detail));
      res.status(500).json({ error: "Error al capturar pago PayPal", detail });
    }
  });

  // Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const allSettings = await storage.getSettings();
      const settingsObj: Record<string, string> = {};
      allSettings.forEach(s => { settingsObj[s.key] = s.value; });
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Key is required" });
      }
      console.log(`Saving setting: ${key} = ${value}`);
      const setting = await storage.upsertSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error saving setting:", error);
      res.status(400).json({ error: "Failed to save setting" });
    }
  });

  // Categories Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      console.log("Category creation request body:", req.body);
      const data = {
        name: req.body.name,
        label: req.body.label || req.body.name || "",
        image: req.body.image || null,
        streamUrl: req.body.streamUrl || null
      };
      console.log("Normalized category data:", data);
      const validatedData = insertCategorySchema.parse(data);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ error: "Invalid category data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Upload Route
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Multimedia Routes
  app.get("/api/multimedia", async (req, res) => {
    try {
      const items = await storage.getMultimedia();
      res.json(items || []);
    } catch (error) {
      console.error("Multimedia fetch error:", error);
      res.status(500).json({ error: "Failed to fetch multimedia" });
    }
  });

  // News Routes
  // Featured Sections Routes
  app.get("/api/featured-sections", async (req, res) => {
    try {
      const items = await storage.getFeaturedSections();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured sections" });
    }
  });

  app.post("/api/featured-sections", async (req, res) => {
    try {
      const item = await storage.createFeaturedSection(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create featured section" });
    }
  });

  app.patch("/api/featured-sections/:id", async (req, res) => {
    try {
      const item = await storage.updateFeaturedSection(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update featured section" });
    }
  });

  app.delete("/api/featured-sections/:id", async (req, res) => {
    try {
      await storage.deleteFeaturedSection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete featured section" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const items = await storage.getGames();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const item = await storage.createGame(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", async (req, res) => {
    try {
      const item = await storage.updateGame(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      await storage.deleteGame(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // ── FORTNITE PAVOS ─────────────────────────────────────────────────────────
  app.get("/api/fortnite-items", async (_req, res) => {
    try {
      const items = await db.select().from(fortniteItems).orderBy(fortniteItems.order, fortniteItems.createdAt);
      res.json(items);
    } catch { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/fortnite-items", async (req, res) => {
    try {
      const [item] = await db.insert(fortniteItems).values(req.body).returning();
      res.json(item);
    } catch { res.status(500).json({ error: "Error al crear" }); }
  });

  app.patch("/api/fortnite-items/:id", async (req, res) => {
    try {
      const [item] = await db.update(fortniteItems).set(req.body).where(eq(fortniteItems.id, req.params.id)).returning();
      res.json(item);
    } catch { res.status(500).json({ error: "Error al actualizar" }); }
  });

  app.delete("/api/fortnite-items/:id", async (req, res) => {
    try {
      await db.delete(fortniteItems).where(eq(fortniteItems.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Error al eliminar" }); }
  });

  // ── FORTNITE ORDERS para el usuario autenticado ──────────────────────────
  app.get("/api/user/fortnite-orders", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      // Get all fortnite item IDs
      const allFortniteItems = await db.select({ id: fortniteItems.id, image: fortniteItems.image, imagesJson: fortniteItems.imagesJson }).from(fortniteItems);
      const fortniteIds = new Set(allFortniteItems.map(f => f.id));
      const imageMap = new Map(allFortniteItems.map(f => [f.id, f.image]));
      const imagesJsonMap = new Map(allFortniteItems.map(f => [f.id, f.imagesJson]));

      // Get user's orders that match fortnite items (by userId via transactions)
      const userTxns = await db.select().from(userTransactions).where(eq(userTransactions.userId, user.id));
      const orderIds = userTxns.map(t => t.referenceId).filter(Boolean);

      if (orderIds.length === 0) return res.json([]);

      const userOrders = await db.select().from(orders).where(inArray(orders.id, orderIds));
      const fortniteOrders = userOrders
        .filter(o => o.productId && fortniteIds.has(o.productId))
        .map(o => ({
          ...o,
          productImage: imageMap.get(o.productId!) || "",
          productImagesJson: imagesJsonMap.get(o.productId!) || "",
        }))
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      res.json(fortniteOrders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener pedidos Fortnite" });
    }
  });

  // Get all game orders (orders where productId matches a game)
  app.get("/api/game-orders", async (req, res) => {
    try {
      const allOrders = await storage.getOrders();
      const allGames = await storage.getGames();
      const gameMap = new Map(allGames.map((g: any) => [g.id, g]));
      const gameOrderList = allOrders.filter((o: any) => gameMap.has(o.productId) && o.status !== "cancelled");
      // Attach subscription instructions so admin can see/edit them
      const allSubs = await db.select({
        orderId: userSubscriptions.orderId,
        credentialInstructions: userSubscriptions.credentialInstructions,
      }).from(userSubscriptions);
      const subMap = new Map(allSubs.map(s => [s.orderId, s.credentialInstructions]));
      const gameOrders = gameOrderList.map((o: any) => ({
        ...o,
        deliveryType: gameMap.get(o.productId)?.deliveryType || "code",
        deliveredInstructions: subMap.get(o.id) || "",
      }));
      res.json(gameOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game orders" });
    }
  });

  // Deliver game code — sends email to customer with the code
  app.post("/api/game-orders/:orderId/deliver-code", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { code, instructions } = req.body;
      if (!code) return res.status(400).json({ error: "El código es requerido" });

      const allOrders = await storage.getOrders();
      const order = allOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

      // Save the code to the order
      await storage.updateOrderGameCode(orderId, code);
      await storage.updateOrderStatus(orderId, "completed");

      // Update user subscription with the game code so it shows in profile
      const sub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId)).then(r => r[0]);
      if (sub) {
        await db.update(userSubscriptions).set({
          credentialEmail: code,
          credentialPassword: "",
          credentialInstructions: instructions || "",
        }).where(eq(userSubscriptions.orderId, orderId));
      }

      // Resolve user email: from order fields first, then via subscription → users table
      let customerEmail = order.deliveryContact || order.customerEmail || "";
      if ((!customerEmail || !customerEmail.includes("@")) && sub?.userId) {
        const userRow = await db.select().from(users).where(eq(users.id, sub.userId)).then(r => r[0]);
        if (userRow?.email) customerEmail = userRow.email;
      }

      if (customerEmail && customerEmail.includes("@")) {
        await sendGameCodeDeliveryEmail(
          customerEmail,
          order.customerName,
          order.productName,
          code,
          instructions || undefined
        );
      }

      res.json({ success: true, emailSent: !!(customerEmail && customerEmail.includes("@")) });
    } catch (error) {
      console.error("[GAME-CODE]", error);
      res.status(500).json({ error: "Error al entregar código" });
    }
  });

  // Deliver game credentials (email + password) — sends email to customer
  app.post("/api/game-orders/:orderId/deliver-credentials", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { email: credEmail, password: credPassword, instructions } = req.body;
      if (!credEmail || !credPassword) return res.status(400).json({ error: "El correo y contraseña son requeridos" });

      const allOrders = await storage.getOrders();
      const order = allOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

      // Save credentials as gameCode field (formatted)
      const credsSummary = `${credEmail} / ${credPassword}`;
      await storage.updateOrderGameCode(orderId, credsSummary);
      await storage.updateOrderStatus(orderId, "completed");

      // Update user subscription so credentials show in profile
      const sub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId)).then(r => r[0]);
      if (sub) {
        await db.update(userSubscriptions).set({
          credentialEmail: credEmail,
          credentialPassword: credPassword,
          credentialInstructions: instructions || "",
        }).where(eq(userSubscriptions.orderId, orderId));
      }

      // Resolve user email: from order fields first, then via subscription → users table
      let customerEmail = order.deliveryContact || order.customerEmail || "";
      if ((!customerEmail || !customerEmail.includes("@")) && sub?.userId) {
        const userRow = await db.select().from(users).where(eq(users.id, sub.userId)).then(r => r[0]);
        if (userRow?.email) customerEmail = userRow.email;
      }

      if (customerEmail && customerEmail.includes("@")) {
        await sendGameCredentialsDeliveryEmail(
          customerEmail,
          order.customerName,
          order.productName,
          credEmail,
          credPassword,
          instructions || undefined
        );
      }

      res.json({ success: true, emailSent: !!(customerEmail && customerEmail.includes("@")) });
    } catch (error) {
      console.error("[GAME-CREDS]", error);
      res.status(500).json({ error: "Error al entregar credenciales" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const items = await storage.getNews();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const item = await storage.createNews(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create news" });
    }
  });

  app.patch("/api/news/:id", async (req, res) => {
    try {
      const item = await storage.updateNews(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "News not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update news" });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      await storage.deleteNews(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete news" });
    }
  });

  app.post("/api/multimedia/toggle-hero/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const items = await storage.getMultimedia();
      const multimedia = items.find(m => m.id === id);
      
      if (!multimedia) {
        return res.status(404).json({ error: "Multimedia not found" });
      }

      const newHeroState = !multimedia.isHero;
      await storage.updateMultimedia(id, { isHero: newHeroState });
      
      // Si se activa como Hero, reiniciamos el tiempo de sincronización automáticamente
      if (newHeroState) {
        const now = Date.now().toString();
        await storage.upsertSetting("videoSyncTime", now);
        console.log(`Auto-sync triggered for Hero video. Start time: ${now}`);
      }
      
      res.json({ success: true, isHero: newHeroState });
    } catch (error) {
      console.error("Error toggling hero:", error);
      res.status(500).json({ error: "Failed to toggle hero status" });
    }
  });

  app.post("/api/multimedia/upload", upload.single("file"), async (req, res) => {
    console.log("Upload request received:", req.file);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      const isVideo = req.file.mimetype.startsWith('video');
      const isImage = req.file.mimetype.startsWith('image');
      const isAudio = req.file.mimetype.startsWith('audio');
      const type = isVideo ? 'video' : (isImage ? 'image' : (isAudio ? 'audio' : 'other'));
      
      const isHero = req.body.isHero === "true";
      const customName = req.body.customName?.trim() || req.file.originalname;
      
      console.log("Saving multimedia to storage:", { name: customName, type, isHero });
      const item = await storage.createMultimedia({
        name: customName,
        url: `/uploads/${req.file.filename}`,
        type,
        isHero
      });
      res.json(item);
    } catch (error) {
      console.error("Upload storage error:", error);
      res.status(500).json({ error: "Failed to save multimedia info", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/multimedia/:id", async (req, res) => {
    try {
      const item = await storage.updateMultimedia(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Multimedia not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update multimedia" });
    }
  });

  app.delete("/api/multimedia/:id", async (req, res) => {
    try {
      await storage.deleteMultimedia(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete multimedia" });
    }
  });

  app.get("/api/multimedia/active/:type", async (req, res) => {
    try {
      const item = await storage.getActiveMultimedia(req.params.type);
      res.json(item || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active multimedia" });
    }
  });

  // Serve uploads
  app.use("/uploads", (await import("express")).static(uploadDir));

  // Admin Auth Routes (hardcoded admin credentials)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const adminUsername = "paudronixGt123@";
      const adminPassword = "paudronix123GT%";

      const cleanUsername = username?.trim();
      const cleanPassword = password?.trim();

      if (cleanUsername === adminUsername && cleanPassword === adminPassword) {
        const adminUser = { id: "admin-fixed-id", username: adminUsername, role: "admin" } as any;
        await new Promise<void>((resolve, reject) => {
          req.login(adminUser, (err) => (err ? reject(err) : resolve()));
        });
        await new Promise<void>((resolve) => req.session.save(() => resolve()));
        return res.json({ success: true, user: adminUser });
      } else {
        // Allow login by username OR email (case-insensitive email)
        const [userByUsername] = await db.select().from(users).where(eq(users.username, cleanUsername));
        const [userByEmail] = !userByUsername
          ? await db.select().from(users).where(ilike(users.email, cleanUsername))
          : [undefined];
        const user = userByUsername || userByEmail;

        if (user && user.password && user.password === cleanPassword) {
          // Establish Passport session so req.isAuthenticated() works on subsequent requests
          await new Promise<void>((resolve, reject) => {
            req.login(user, (err) => (err ? reject(err) : resolve()));
          });
          await new Promise<void>((resolve) => req.session.save(() => resolve()));
          return res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, email: user.email, profileImage: user.profileImage } });
        }
        return res.status(401).json({ success: false, error: "Credenciales incorrectas" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Error de autenticación" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, firstName, lastName, referralCode: refCode } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña requeridos" });
      }
      const [existingByUsername] = await db.select().from(users).where(eq(users.username, username));
      if (existingByUsername) {
        return res.status(400).json({ error: "El usuario ya existe" });
      }
      if (email) {
        const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
        if (existingByEmail) {
          return res.status(400).json({ error: "El correo ya está registrado" });
        }
      }
      let referrerId: string | null = null;
      if (refCode) {
        const [referrer] = await db.select().from(users).where(eq(users.referralCode, refCode.toUpperCase()));
        if (referrer) referrerId = referrer.id;
      }
      const [user] = await db.insert(users).values({
        username,
        password,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "user",
        referredBy: refCode?.toUpperCase() || null,
      }).returning();
      if (email) {
        sendWelcomeEmail(email, username).catch(() => {});
      }
      sendAdminNewUserEmail(`${firstName || ""} ${lastName || ""}`.trim() || username, email || "", username).catch(() => {});
      if (referrerId) {
        creditReferrer(referrerId, user.id, "register").catch(() => {});
        creditNewUser(user.id, "register").catch(() => {});
      }
      await new Promise<void>((resolve, reject) => {
        req.login(user, (err) => err ? reject(err) : resolve());
      });
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, email: user.email } });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Sesión cerrada" });
  });

  app.post("/api/auth/update", async (req, res) => {
    try {
      res.json({ success: true, message: "Credenciales actualizadas" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar credenciales" });
    }
  });

  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Email invalido" });
      }
      const [existing] = await db.select().from(subscribers).where(eq(subscribers.email, email));
      if (existing) {
        return res.json({ success: true, message: "Ya estas suscrito" });
      }
      await db.insert(subscribers).values({ email });
      res.json({ success: true, message: "Suscripcion exitosa" });
    } catch (error) {
      res.status(500).json({ error: "Error al suscribirse" });
    }
  });

  app.get("/api/subscribers", async (req, res) => {
    try {
      const allSubscribers = await db.select().from(subscribers);
      res.json(allSubscribers);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener suscriptores" });
    }
  });

  app.get("/api/user/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const subs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, user.id));
      const allProducts = await db.select({ id: products.id, category: products.category, isMonthly: products.isMonthly, description: products.description, requiresCustomerEmail: products.requiresCustomerEmail, customerEmailLabel: products.customerEmailLabel, price: products.price, name: products.name }).from(products);
      const allGames = await db.select({ id: games.id, description: games.description }).from(games);
      const productCategoryMap = new Map(allProducts.map(p => [p.id, p.category]));
      const productMonthlyMap = new Map(allProducts.map(p => [p.id, p.isMonthly]));
      const productDescMap = new Map(allProducts.map(p => [p.id, p.description]));
      const requiresEmailMap = new Map(allProducts.map(p => [p.id, p.requiresCustomerEmail]));
      const customerEmailLabelMap = new Map(allProducts.map(p => [p.id, p.customerEmailLabel]));
      const productPriceMap = new Map(allProducts.map(p => [p.id, p.price]));
      const productNameMap = new Map(allProducts.map(p => [p.name.trim().toLowerCase(), p.price]));
      const gameIdSet = new Set(allGames.map(g => g.id));
      const gameDescMap = new Map(allGames.map(g => [g.id, g.description]));
      const GAME_CATEGORIES = ["game", "games", "juego", "juegos", "videojuego", "videojuegos"];

      // Fetch order info for subs that have an orderId to get customerEmail/Password
      const orderIds = subs.map(s => s.orderId).filter(Boolean) as string[];
      const orderMap = new Map<string, { customerEmail: string; customerPassword: string }>();
      if (orderIds.length > 0) {
        const orderRows = await db.select({ id: orders.id, customerEmail: orders.customerEmail, customerPassword: orders.customerPassword }).from(orders).where(inArray(orders.id, orderIds)).catch(() => []);
        for (const o of orderRows) orderMap.set(o.id, { customerEmail: o.customerEmail || "", customerPassword: o.customerPassword || "" });
      }

      const subsWithType = subs.map(sub => {
        const cat = (productCategoryMap.get(sub.productId) || "").toLowerCase();
        const isMonthly = productMonthlyMap.get(sub.productId);
        // Solo es juego si está en la tabla games o si su categoría es de juegos.
        // NO usamos isMonthly === false porque eso escondía suscripciones reales del cliente.
        const isGame = gameIdSet.has(sub.productId) || GAME_CATEGORIES.some(g => cat.includes(g));
        const productDescription = gameDescMap.get(sub.productId) || productDescMap.get(sub.productId) || "";
        const orderInfo = sub.orderId ? orderMap.get(sub.orderId) : undefined;
        // For gift subs (price=0), find the real product price by ID or name
        const productPrice = productPriceMap.get(sub.productId);
        const renewPrice = Number(sub.price) > 0
          ? Number(sub.price)
          : productPrice != null
            ? Number(productPrice)
            : productNameMap.get(sub.productName?.trim().toLowerCase() || "") != null
              ? Number(productNameMap.get(sub.productName?.trim().toLowerCase() || ""))
              : 0;
        return {
          ...sub,
          productCategory: productCategoryMap.get(sub.productId) || "",
          isGame,
          productDescription,
          requiresCustomerEmail: requiresEmailMap.get(sub.productId) ?? false,
          customerEmailLabel: customerEmailLabelMap.get(sub.productId) || "",
          submittedEmail: orderInfo?.customerEmail || "",
          submittedPassword: orderInfo?.customerPassword || "",
          renewPrice,
        };
      });
      res.json(subsWithType);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener suscripciones" });
    }
  });

  app.delete("/api/user/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id));
      if (!sub) return res.status(404).json({ error: "Suscripción no encontrada" });
      if (sub.userId !== user.id && user.role !== "admin") return res.status(403).json({ error: "No autorizado" });
      await db.delete(userSubscriptions).where(eq(userSubscriptions.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar suscripción" });
    }
  });

  app.post("/api/user/subscriptions/:id/start-timer", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const subId = req.params.id;
      const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, subId));
      if (!sub) return res.status(404).json({ error: "Suscripcion no encontrada" });
      if (sub.userId !== user.id) return res.status(403).json({ error: "No autorizado" });
      if (sub.status !== "active") return res.status(400).json({ error: "La suscripcion no esta activa" });
      if (sub.endDate) return res.status(400).json({ error: "El contador ya esta activo" });
      const days = Math.max(1, Math.min(365, Number((req.body || {}).days) || 30));
      const newEnd = new Date();
      newEnd.setDate(newEnd.getDate() + days);
      const [updated] = await db.update(userSubscriptions)
        .set({ endDate: newEnd, expirationNotified: false })
        .where(eq(userSubscriptions.id, subId))
        .returning();
      res.json({ success: true, endDate: updated.endDate, days });
    } catch (error) {
      console.error("[START-TIMER] Error:", error);
      res.status(500).json({ error: "Error al iniciar contador" });
    }
  });

  app.post("/api/user/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { productId, productName, productImage, price, orderId, status, credentialEmail, credentialPassword, credentialInstructions } = req.body;
      if (!productId || !productName || price === undefined) {
        return res.status(400).json({ error: "Datos incompletos" });
      }
      // If a subscription for this order already exists (created server-side), return it to avoid duplicates
      if (orderId) {
        const existing = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId)).then(r => r[0]);
        if (existing) return res.json(existing);
      }
      const [sub] = await db.insert(userSubscriptions).values({
        userId: user.id,
        productId,
        productName,
        productImage: productImage || "",
        price: parseInt(price) || 0,
        status: status || "pending",
        orderId: orderId || "",
        credentialEmail: credentialEmail || "",
        credentialPassword: credentialPassword || "",
        credentialInstructions: credentialInstructions || "",
        credentialName: productName,
      }).returning();
      res.json(sub);
    } catch (error) {
      res.status(500).json({ error: "Error al crear suscripcion" });
    }
  });

  app.post("/api/admin/fulfill-order", async (req, res) => {
    try {
      const { orderId, credentialEmail, credentialPassword, credentialName, credentialInstructions, endDate } = req.body;
      if (!orderId || !credentialEmail || !credentialPassword || !credentialName) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

      await storage.updateOrderStatus(orderId, "completed");

      if (order.sellerId) {
        const existing = await db.select().from(sellerTransactions).where(eq(sellerTransactions.orderId, orderId));
        if (existing.length === 0) {
          await db.insert(sellerTransactions).values({
            sellerId: order.sellerId,
            orderId: order.id,
            amount: order.price,
            type: "credit",
            description: `Venta de ${order.productName}`,
          });
          const [seller] = await db.select().from(users).where(eq(users.id, order.sellerId));
          const sellerDisplayName = seller?.firstName || seller?.email?.split("@")[0] || "Vendedor";
          if (seller?.email) {
            sendSellerProductSoldEmail(
              seller.email,
              sellerDisplayName,
              order.productName,
              order.price,
              order.customerName
            ).catch(() => {});
          }
          sendAdminSellerSaleEmail(
            sellerDisplayName,
            seller?.email || order.sellerId,
            order.productName,
            order.price,
            order.customerName
          ).catch(() => {});
        }
      }

      const renewalCode = `REN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const defaultEnd = new Date();
      defaultEnd.setDate(defaultEnd.getDate() + 30);
      const finalEndDate = endDate ? new Date(endDate) : defaultEnd;

      const matchingSubs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
      if (matchingSubs.length > 0) {
        await db.update(userSubscriptions)
          .set({
            status: "active",
            credentialEmail,
            credentialPassword,
            credentialName,
            credentialInstructions: credentialInstructions || "",
            endDate: finalEndDate,
            renewalCode,
            expirationNotified: false,
          })
          .where(eq(userSubscriptions.orderId, orderId));
      }

      if (matchingSubs.length > 0) {
        const [subUser] = await db.select().from(users).where(eq(users.id, matchingSubs[0].userId));
        if (subUser?.email) {
          await sendCredentialsEmail(
            subUser.email,
            subUser.firstName || "Usuario",
            credentialName,
            credentialEmail,
            credentialPassword,
            credentialInstructions,
            endDate ? new Date(endDate).toLocaleDateString("es-GT") : undefined
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Fulfill order error:", error);
      res.status(500).json({ error: "Error al atender pedido" });
    }
  });

  // Quick deliver: admin clicks "Enviar" — system auto-claims credential from stock and delivers to buyer
  app.post("/api/admin/orders/:id/quick-deliver", async (req, res) => {
    try {
      const orderId = req.params.id;
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
      if (order.status === "completed") return res.status(400).json({ error: "Este pedido ya fue completado" });

      // Resolve buyer email: subscription userId → customerEmail → deliveryContact
      let buyerEmail = "";
      let buyerName = order.customerName;
      const orderSubs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
      if (orderSubs.length > 0) {
        const subUser = await db.select().from(users).where(eq(users.id, orderSubs[0].userId)).then(r => r[0]);
        if (subUser?.email) buyerEmail = subUser.email;
        if (subUser?.firstName) buyerName = subUser.firstName;
      }
      if (!buyerEmail && order.customerEmail && (order.customerEmail as string).includes("@")) {
        buyerEmail = order.customerEmail as string;
      }
      if (!buyerEmail && order.deliveryContact && (order.deliveryContact as string).includes("@")) {
        buyerEmail = order.deliveryContact as string;
      }
      if (!buyerEmail) return res.status(400).json({ error: "No se encontro correo del comprador para entregar credenciales" });

      // Claim credential from stock pool
      const claimed = await storage.claimProductCredential(order.productId as string, orderId).catch(() => null);
      if (!claimed) {
        // Fallback: check legacy single cred on product
        const prod = await storage.getProduct(order.productId as string);
        if (prod && prod.productEmail && prod.productPassword) {
          await sendCredentialsEmail(buyerEmail, buyerName, order.productName, prod.productEmail, prod.productPassword, (prod as any).productInstructions || undefined);
          await storage.updateOrderStatus(orderId, "completed");
          // Update subscription if exists
          const matchingSubs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
          if (matchingSubs.length > 0) {
            await db.update(userSubscriptions).set({
              status: "active",
              credentialEmail: prod.productEmail,
              credentialPassword: prod.productPassword,
              credentialInstructions: (prod as any).productInstructions || "",
            }).where(eq(userSubscriptions.orderId, orderId));
          }
          return res.json({ success: true, source: "legacy" });
        }
        return res.status(400).json({ error: "Sin stock disponible para este producto. Agrega credenciales en el panel del producto." });
      }

      // Send credentials to buyer
      await sendCredentialsEmail(buyerEmail, buyerName, order.productName, claimed.credEmail, claimed.credPassword, claimed.credInstructions || undefined);
      await storage.updateOrderStatus(orderId, "completed");

      // Update subscription if exists
      const matchingSubs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
      if (matchingSubs.length > 0) {
        await db.update(userSubscriptions).set({
          status: "active",
          credentialEmail: claimed.credEmail,
          credentialPassword: claimed.credPassword,
          credentialInstructions: claimed.credInstructions || "",
          credentialName: order.productName,
        }).where(eq(userSubscriptions.orderId, orderId));
      }

      // Seller commission
      if (order.sellerId) {
        const existing = await db.select().from(sellerTransactions).where(eq(sellerTransactions.orderId, orderId));
        if (existing.length === 0) {
          await db.insert(sellerTransactions).values({
            sellerId: order.sellerId,
            orderId: order.id,
            amount: order.price,
            type: "credit",
            description: `Venta de ${order.productName}`,
          });
        }
      }

      res.json({ success: true, source: "stock" });
    } catch (error) {
      console.error("Quick deliver error:", error);
      res.status(500).json({ error: "Error al entregar pedido" });
    }
  });

  app.post("/api/user/resend-credentials", async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const { subscriptionId, userId: bodyUserId } = req.body;
      const userId = sessionUser?.id || bodyUserId;
      if (!subscriptionId) return res.status(400).json({ error: "ID de suscripcion requerido" });
      if (!userId) return res.status(401).json({ error: "Debes iniciar sesion para realizar esta accion" });

      const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, subscriptionId));
      if (!sub || sub.userId !== userId) return res.status(404).json({ error: "Suscripcion no encontrada" });
      if (sub.status !== "active" || !sub.credentialEmail) return res.status(400).json({ error: "Esta suscripcion no tiene credenciales disponibles" });

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user?.email) return res.status(400).json({ error: "No tienes correo registrado" });

      const sent = await resendCredentialsEmail(
        user.email,
        user.firstName || "Usuario",
        sub.credentialName || sub.productName,
        sub.credentialEmail,
        sub.credentialPassword || "",
        sub.credentialInstructions || undefined
      );

      if (sent) {
        res.json({ success: true, message: "Credenciales enviadas a tu correo" });
      } else {
        res.status(500).json({ error: "No se pudo enviar el correo. El servicio de correo no esta configurado." });
      }
    } catch (error) {
      console.error("Resend credentials error:", error);
      res.status(500).json({ error: "Error al reenviar credenciales" });
    }
  });

  app.post("/api/user/renewal-request", isAuthenticated, upload.single("paymentScreenshot"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { subscriptionId, renewalCode, paymentMethod, paypalOrderId, months, totalAmount } = req.body;
      if (!subscriptionId || !renewalCode) return res.status(400).json({ error: "Datos incompletos" });

      const isPaypal = paymentMethod === "paypal";
      if (!isPaypal && !req.file) return res.status(400).json({ error: "Comprobante de pago requerido" });
      if (isPaypal && !paypalOrderId) return res.status(400).json({ error: "ID de orden PayPal requerido" });

      const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, subscriptionId));
      if (!sub || sub.userId !== userId) return res.status(404).json({ error: "Suscripcion no encontrada" });
      if (sub.renewalCode !== renewalCode) return res.status(400).json({ error: "Codigo de renovacion invalido" });

      // Bloquear renovación si ya expiró
      if (sub.status === "expired") {
        return res.status(400).json({ error: "Esta suscripción ya expiró y no puede renovarse. Contacta al soporte para reactivarla." });
      }

      // Solo permitir renovar si faltan 2 días o menos
      if (sub.endDate) {
        const now = new Date();
        const end = new Date(sub.endDate);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 2) {
          return res.status(400).json({ error: `Aún no puedes renovar. Podrás hacerlo cuando falten 2 días o menos (faltan ${daysLeft} días).` });
        }
      }

      const screenshotPath = req.file ? `/uploads/${req.file.filename}` : "";
      const renewMonths = parseInt(months) || 1;
      const amount = parseInt(totalAmount) || sub.price * renewMonths;

      await db.insert(renewalRequests).values({
        userId,
        subscriptionId,
        renewalCode,
        paymentScreenshot: screenshotPath,
        paymentMethod: isPaypal ? "paypal" : "screenshot",
        paypalOrderId: paypalOrderId || "",
        months: renewMonths,
        totalAmount: amount,
        status: "pending",
      });

      await sendAdminNotificationEmail(
        "Nueva Solicitud de Renovacion",
        `El usuario ha solicitado renovar su suscripcion "${sub.credentialName || sub.productName}" por ${renewMonths} mes(es) via ${isPaypal ? "PayPal" : "comprobante"}. Total: Q${amount}. Revisa la seccion de Renovaciones en el panel de admin.`
      );

      res.json({ success: true, message: "Solicitud de renovacion enviada" });
    } catch (error) {
      console.error("Renewal request error:", error);
      res.status(500).json({ error: "Error al enviar solicitud de renovacion" });
    }
  });

  app.post("/api/user/bulk-renew", isAuthenticated, upload.single("paymentScreenshot"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const rawIds = req.body.subscriptionIds;
      const subscriptionIds: string[] = typeof rawIds === "string" ? JSON.parse(rawIds) : rawIds;
      if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
        return res.status(400).json({ error: "Selecciona al menos una suscripcion" });
      }
      const months = Math.max(1, Math.min(24, parseInt(req.body.months || "1") || 1));

      const subs = await db.select().from(userSubscriptions).where(
        and(eq(userSubscriptions.userId, userId), inArray(userSubscriptions.id, subscriptionIds))
      );
      if (subs.length === 0) return res.status(404).json({ error: "Suscripciones no encontradas" });

      // For gift subscriptions (price=0), fetch the real product price
      const subsWithPrice = await Promise.all(subs.map(async (sub) => {
        if (Number(sub.price) > 0) return { ...sub, renewPrice: Number(sub.price) };
        // Look up real product price by productId or by name
        let prod = sub.productId && sub.productId !== "regalo"
          ? (await db.select().from(products).where(eq(products.id, sub.productId)).limit(1))[0]
          : null;
        if (!prod && sub.productName) {
          prod = (await db.select().from(products).where(ilike(products.name, `%${sub.productName.trim()}%`)).limit(1))[0];
        }
        return { ...sub, renewPrice: prod ? Number(prod.price) : 0 };
      }));

      const total = subsWithPrice.reduce((sum, s) => sum + s.renewPrice * months, 0);

      const txns = await db.select().from(userTransactions).where(eq(userTransactions.userId, userId));
      const credits = txns.filter(t => t.type === "credit").reduce((sum, t) => sum + Number(t.amount), 0);
      const debits = txns.filter(t => t.type === "debit").reduce((sum, t) => sum + Number(t.amount), 0);
      const balance = credits - debits;

      if (balance >= total && total > 0) {
        await db.insert(userTransactions).values({
          userId,
          amount: total,
          type: "debit",
          description: `Renovacion ${months} ${months === 1 ? "mes" : "meses"}: ${subsWithPrice.map(s => s.credentialName || s.productName).join(", ")}`,
        });

        for (const sub of subsWithPrice) {
          const base = sub.endDate && new Date(sub.endDate) > new Date() ? new Date(sub.endDate) : new Date();
          const newEnd = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000);
          const newCode = `REN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await db.update(userSubscriptions).set({
            endDate: newEnd,
            status: "active",
            renewalCode: newCode,
            expirationNotified: false,
          }).where(eq(userSubscriptions.id, sub.id));
          // Registrar renovación con saldo para que aparezca en el panel admin
          await db.insert(renewalRequests).values({
            userId,
            subscriptionId: sub.id,
            renewalCode: sub.renewalCode || newCode,
            paymentScreenshot: "",
            paymentMethod: "wallet",
            months,
            totalAmount: sub.renewPrice * months,
            status: "approved",
          });
        }

        return res.json({ success: true, method: "wallet", renewed: subsWithPrice.length, total, months });
      } else {
        const screenshotPath = req.file ? `/uploads/${req.file.filename}` : "";
        const paymentMethodName = req.body.paymentMethodName || "screenshot";

        for (const sub of subsWithPrice) {
          await db.insert(renewalRequests).values({
            userId,
            subscriptionId: sub.id,
            renewalCode: sub.renewalCode || "",
            paymentScreenshot: screenshotPath,
            paymentMethod: paymentMethodName,
            paypalOrderId: "",
            months: 1,
            totalAmount: sub.renewPrice,
            status: "pending",
          });
        }

        await sendAdminNotificationEmail(
          "Renovacion Masiva — Comprobante",
          `El usuario solicitó renovar ${subs.length} suscripcion(es) por Q${total} via ${paymentMethodName}. Revisar comprobante en la seccion de Renovaciones.`
        );

        return res.json({ success: true, method: "admin", pending: subs.length, total });
      }
    } catch (error) {
      console.error("Bulk renew error:", error);
      res.status(500).json({ error: "Error al procesar renovacion masiva" });
    }
  });

  app.get("/api/admin/renewal-requests", async (req, res) => {
    try {
      const requests = await db.select().from(renewalRequests).orderBy(desc(renewalRequests.createdAt));
      const enriched = await Promise.all(requests.map(async (r) => {
        const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, r.subscriptionId));
        const { users } = await import("@shared/models/auth");
        const [user] = await db.select().from(users).where(eq(users.id, r.userId));
        return { ...r, subscription: sub || null, userName: user?.firstName || "Unknown", userEmail: user?.email || "" };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener solicitudes de renovacion" });
    }
  });

  app.put("/api/admin/renewal-requests/:id", async (req, res) => {
    try {
      const { status, newEndDate } = req.body;
      const [request] = await db.select().from(renewalRequests).where(eq(renewalRequests.id, req.params.id));
      if (!request) return res.status(404).json({ error: "Solicitud no encontrada" });

      await db.update(renewalRequests).set({ status, adminNotes: req.body.adminNotes || "" }).where(eq(renewalRequests.id, req.params.id));

      if (status === "approved") {
        const isAutoReview = request.paymentMethod === "admin_review";
        let resolvedEndDate: Date;

        // Siempre obtener la suscripción actual para calcular días restantes
        const [currentSub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, request.subscriptionId));
        const now = new Date();
        const subEndDate = currentSub?.endDate ? new Date(currentSub.endDate) : null;
        // Días restantes de la suscripción actual (si no venció)
        const remainingMs = subEndDate && subEndDate > now ? subEndDate.getTime() - now.getTime() : 0;
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        if (isAutoReview) {
          // Base: desde la fecha de vencimiento actual si no venció, si no desde hoy
          const base = subEndDate && subEndDate > now ? subEndDate : now;
          resolvedEndDate = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (newEndDate) {
          const adminDate = new Date(newEndDate);
          // Si la suscripción aún tiene días, sumárselos a la fecha que entró el admin
          // Esto evita que el usuario pierda días si renovó antes del vencimiento
          if (remainingDays > 0) {
            resolvedEndDate = new Date(adminDate.getTime() + remainingDays * 24 * 60 * 60 * 1000);
          } else {
            resolvedEndDate = adminDate;
          }
        } else {
          return res.status(400).json({ error: "Se requiere nueva fecha de vencimiento" });
        }

        const newRenewalCode = `REN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await db.update(userSubscriptions).set({
          endDate: resolvedEndDate,
          status: "active",
          renewalCode: newRenewalCode,
          expirationNotified: false,
        }).where(eq(userSubscriptions.id, request.subscriptionId));

        const { users } = await import("@shared/models/auth");
        const [user] = await db.select().from(users).where(eq(users.id, request.userId));
        const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, request.subscriptionId));
        if (user?.email && sub) {
          const { sendRenewalApprovedEmail } = await import("./emailService");
          await sendRenewalApprovedEmail(
            user.email,
            user.firstName || "Usuario",
            sub.credentialName || sub.productName,
            resolvedEndDate.toLocaleDateString("es-GT")
          );
        }
      }

      if (status === "rejected") {
        const { users } = await import("@shared/models/auth");
        const [user] = await db.select().from(users).where(eq(users.id, request.userId));
        const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, request.subscriptionId));
        if (user?.email && sub) {
          const { sendRenewalRejectedEmail } = await import("./emailService");
          await sendRenewalRejectedEmail(
            user.email,
            user.firstName || "Usuario",
            sub.credentialName || sub.productName,
            req.body.adminNotes || ""
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Update renewal request error:", error);
      res.status(500).json({ error: "Error al actualizar solicitud" });
    }
  });

  app.get("/api/admin/subscriptions", async (req, res) => {
    try {
      const now = new Date();
      // Auto-expirar suscripciones vencidas inmediatamente al cargar el panel
      await db.update(userSubscriptions)
        .set({ status: "expired" })
        .where(
          and(
            eq(userSubscriptions.status, "active"),
            sql`${userSubscriptions.endDate} IS NOT NULL AND ${userSubscriptions.endDate} < ${now}`
          )
        );

      const allSubs = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          productId: userSubscriptions.productId,
          productName: userSubscriptions.productName,
          productImage: userSubscriptions.productImage,
          price: userSubscriptions.price,
          status: userSubscriptions.status,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          credentialEmail: userSubscriptions.credentialEmail,
          credentialPassword: userSubscriptions.credentialPassword,
          credentialName: userSubscriptions.credentialName,
          credentialInstructions: userSubscriptions.credentialInstructions,
          orderId: userSubscriptions.orderId,
          renewalCode: userSubscriptions.renewalCode,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userProfileImage: users.profileImageUrl,
        })
        .from(userSubscriptions)
        .leftJoin(users, eq(userSubscriptions.userId, users.id))
        .orderBy(userSubscriptions.startDate);
      res.json(allSubs);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener suscripciones" });
    }
  });

  app.post("/api/admin/subscriptions", async (req, res) => {
    try {
      const { userId, productId, productName, productImage, price, status, credentialEmail, credentialPassword, credentialName, credentialInstructions, endDate } = req.body;
      if (!userId || !productId || !productName || price === undefined) {
        return res.status(400).json({ error: "Datos incompletos" });
      }
      const [sub] = await db.insert(userSubscriptions).values({
        userId,
        productId,
        productName,
        productImage: productImage || "",
        price: parseInt(price) || 0,
        status: status || "active",
        credentialEmail: credentialEmail || "",
        credentialPassword: credentialPassword || "",
        credentialName: credentialName || "",
        credentialInstructions: credentialInstructions || "",
        endDate: endDate ? new Date(endDate) : undefined,
      }).returning();
      res.json(sub);
    } catch (error) {
      res.status(500).json({ error: "Error al crear suscripcion" });
    }
  });

  app.delete("/api/admin/subscriptions/:id", async (req, res) => {
    try {
      await db.delete(userSubscriptions).where(eq(userSubscriptions.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar suscripcion" });
    }
  });

  app.get("/api/banners", async (req, res) => {
    try {
      const allBanners = await db.select().from(banners).orderBy(banners.order);
      res.json(allBanners);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener banners" });
    }
  });

  const bannerUpload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imagenes'));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
  });

  app.post("/api/banners", bannerUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Se requiere una imagen" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      const { title, link, order } = req.body;
      const [banner] = await db.insert(banners).values({
        image: imageUrl,
        title: title || "",
        link: link || "",
        order: parseInt(order) || 0,
        isActive: true,
      }).returning();
      res.json(banner);
    } catch (error) {
      res.status(500).json({ error: "Error al crear banner" });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const banner = await db.select().from(banners).where(eq(banners.id, req.params.id));
      if (banner.length > 0 && banner[0].image) {
        const filePath = path.join(".", banner[0].image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await db.delete(banners).where(eq(banners.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar banner" });
    }
  });

  app.patch("/api/banners/:id", async (req, res) => {
    try {
      const { isActive, order, title, link } = req.body;
      const updates: any = {};
      if (isActive !== undefined) updates.isActive = isActive;
      if (order !== undefined) updates.order = parseInt(order);
      if (title !== undefined) updates.title = title;
      if (link !== undefined) updates.link = link;
      const [updated] = await db.update(banners).set(updates).where(eq(banners.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar banner" });
    }
  });

  // ── Typing indicators ────────────────────────────────────────────────
  // Admin sets typing for a support ticket
  app.post("/api/typing/support/:ticketId", (req, res) => {
    const { agentImage = "", agentName = "" } = req.body || {};
    typingMap.set(`sup:${req.params.ticketId}`, { time: Date.now(), agentImage, agentName });
    res.json({ ok: true });
  });
  // User polls if admin is typing in their ticket
  app.get("/api/typing/support/:ticketId", (req, res) => {
    const entry = typingMap.get(`sup:${req.params.ticketId}`);
    const typing = !!entry && Date.now() - entry.time < TYPING_EXPIRE_MS;
    res.json({ typing, agentImage: entry?.agentImage || "", agentName: entry?.agentName || "" });
  });
  // Admin sets typing for a client (mis clientes)
  app.post("/api/typing/client/:userId", (req, res) => {
    const { agentImage = "", agentName = "" } = req.body || {};
    typingMap.set(`cli:${req.params.userId}`, { time: Date.now(), agentImage, agentName });
    res.json({ ok: true });
  });
  // User polls if admin is typing to them
  app.get("/api/typing/client/:userId", isAuthenticated, async (req: any, res) => {
    const entry = typingMap.get(`cli:${req.user.id}`);
    const typing = !!entry && Date.now() - entry.time < TYPING_EXPIRE_MS;
    res.json({ typing, agentImage: entry?.agentImage || "", agentName: entry?.agentName || "" });
  });

  app.get("/api/support/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.updatedAt));
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener tickets" });
    }
  });

  app.post("/api/support/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userId = user.id;
      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email || "Usuario";
      const userEmail = user.email || "";
      const { subject, message } = req.body;
      if (!subject || !message) return res.status(400).json({ error: "Asunto y mensaje son requeridos" });

      const [ticket] = await db.insert(supportTickets).values({
        userId,
        userName,
        userEmail,
        subject,
        status: "open",
      }).returning();

      await db.insert(supportMessages).values({
        ticketId: ticket.id,
        senderId: userId,
        senderName: userName,
        isAdmin: user.role === "admin",
        isSeller: user.role === "seller",
        message,
      });

      sendAdminNewTicketEmail(userName, userEmail, subject, message).catch(() => {});
      if (userEmail) {
        sendUserTicketOpenedEmail(userEmail, user.firstName || userName.split(" ")[0] || "Usuario", subject, message).catch(() => {});
      }

      res.json(ticket);
    } catch (error) {
      console.error("Create ticket error:", error);
      res.status(500).json({ error: "Error al crear ticket" });
    }
  });

  app.get("/api/support/tickets/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const messages = await db.select().from(supportMessages).where(eq(supportMessages.ticketId, req.params.id)).orderBy(supportMessages.createdAt);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener mensajes" });
    }
  });

  app.post("/api/support/tickets/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userId = user.id;
      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email || "Usuario";
      const { message, imageUrl } = req.body;
      if (!message && !imageUrl) return res.status(400).json({ error: "Mensaje requerido" });

      const [msg] = await db.insert(supportMessages).values({
        ticketId: req.params.id,
        senderId: userId,
        senderName: userName,
        isAdmin: user.role === "admin",
        isSeller: user.role === "seller",
        message: message || "",
        imageUrl: imageUrl || "",
      }).returning();

      await db.update(supportTickets).set({ updatedAt: new Date() }).where(eq(supportTickets.id, req.params.id));

      const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id));
      if (ticket) {
        const notifMsg = imageUrl ? `[Imagen adjunta] ${message || ""}`.trim() : message;
        sendAdminNewChatMessageEmail(userName, user.email || "", ticket.subject, notifMsg).catch(() => {});
      }

      res.json(msg);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Error al enviar mensaje" });
    }
  });

  app.get("/api/admin/support/tickets", async (req, res) => {
    try {
      const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt));
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener tickets" });
    }
  });

  app.get("/api/admin/support/tickets/:id/messages", async (req, res) => {
    try {
      const messages = await db.select().from(supportMessages).where(eq(supportMessages.ticketId, req.params.id)).orderBy(supportMessages.createdAt);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener mensajes" });
    }
  });

  app.post("/api/admin/support/tickets/:id/reply", async (req: any, res) => {
    try {
      const { message, agentIndex, agentName, agentImage } = req.body;
      if (!message) return res.status(400).json({ error: "Mensaje requerido" });

      const [msg] = await db.insert(supportMessages).values({
        ticketId: req.params.id,
        senderId: "admin",
        senderName: agentName || "PAUDRONIX GT",
        isAdmin: true,
        isSeller: false,
        message,
        agentIndex: agentIndex ?? 0,
        agentImage: agentImage || "",
      }).returning();

      await db.update(supportTickets).set({ updatedAt: new Date() }).where(eq(supportTickets.id, req.params.id));

      const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id));
      if (ticket && ticket.userEmail) {
        sendUserNewAdminMessageEmail(ticket.userEmail, ticket.userName || "Usuario", ticket.subject, message).catch(() => {});
      }

      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: "Error al responder" });
    }
  });

  app.get("/api/seller/products/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const msgs = await db.select().from(sellerMessages)
        .where(eq(sellerMessages.productId, req.params.id))
        .orderBy(sellerMessages.createdAt);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener mensajes" });
    }
  });

  app.post("/api/seller/products/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const { message, imageUrl } = req.body;
      if (!message && !imageUrl) return res.status(400).json({ error: "Mensaje o imagen requerido" });

      const [product] = await db.select().from(products).where(eq(products.id, req.params.id));
      if (!product) return res.status(404).json({ error: "Producto no encontrado" });

      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Vendedor";
      const [msg] = await db.insert(sellerMessages).values({
        productId: req.params.id,
        productName: product.name,
        sellerId: user.id,
        sellerEmail: user.email || "",
        senderId: user.id,
        senderName: userName,
        isAdmin: false,
        message: message || "",
        imageUrl: imageUrl || "",
      }).returning();

      if (message) {
        sendAdminNotificationEmail(
          `Mensaje de vendedor: ${product.name}`,
          `👤 Vendedor: ${userName} (${user.email || ""})\n🛍️ Producto: ${product.name}\n💬 Mensaje: ${message}`
        ).catch(() => {});
      }

      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: "Error al enviar mensaje" });
    }
  });

  app.get("/api/admin/seller-products/:id/messages", async (req: any, res) => {
    try {
      const msgs = await db.select().from(sellerMessages)
        .where(eq(sellerMessages.productId, req.params.id))
        .orderBy(sellerMessages.createdAt);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener mensajes" });
    }
  });

  app.post("/api/admin/seller-products/:id/messages", async (req: any, res) => {
    try {
      const { message, imageUrl, agentIndex, agentName } = req.body;
      if (!message && !imageUrl) return res.status(400).json({ error: "Mensaje o imagen requerido" });

      const [product] = await db.select().from(products).where(eq(products.id, req.params.id));
      if (!product) return res.status(404).json({ error: "Producto no encontrado" });

      const [msg] = await db.insert(sellerMessages).values({
        productId: req.params.id,
        productName: product.name,
        sellerId: product.sellerId || "unknown",
        sellerEmail: product.sellerEmail || "",
        senderId: "admin",
        senderName: agentName || "PAUDRONIX GT",
        isAdmin: true,
        message: message || "",
        imageUrl: imageUrl || "",
        agentIndex: agentIndex ?? 0,
      }).returning();

      if (product.sellerEmail && message) {
        sendUserNewAdminMessageEmail(
          product.sellerEmail,
          "Vendedor",
          `Producto: ${product.name}`,
          message
        ).catch(() => {});
      }

      res.json(msg);
    } catch (error) {
      console.error("Admin message seller error:", error);
      res.status(500).json({ error: "Error al enviar mensaje" });
    }
  });

  app.patch("/api/admin/support/tickets/:id/close", async (req, res) => {
    try {
      const [updated] = await db.update(supportTickets).set({ status: "closed", updatedAt: new Date() }).where(eq(supportTickets.id, req.params.id)).returning();
      if (updated && updated.userEmail && updated.userName) {
        sendUserTicketResolvedEmail(updated.userEmail, updated.userName.split(" ")[0], updated.subject, undefined);
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al cerrar ticket" });
    }
  });

  app.patch("/api/admin/support/tickets/:id/reopen", async (req, res) => {
    try {
      const [updated] = await db.update(supportTickets).set({ status: "open", updatedAt: new Date() }).where(eq(supportTickets.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al reabrir ticket" });
    }
  });

  app.put("/api/user/profile", isAuthenticated, upload.single("profileImage"), async (req, res) => {
    try {
      const user = req.user as any;
      const updates: any = { updatedAt: new Date() };
      if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
      if (req.file) {
        updates.customProfileImage = `/uploads/${req.file.filename}`;
      }
      if (req.body.removePhoto === "true") {
        updates.customProfileImage = null;
      }
      const [updated] = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar perfil" });
    }
  });

  app.post("/api/user/report-problem", upload.single("reportImage"), async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const { subscriptionId, subscriptionName, description, userId, userName: bodyUserName, userEmail: bodyUserEmail } = req.body;
      if (!description) return res.status(400).json({ error: "Debes describir el problema" });

      let userName = "Usuario";
      let userEmail = "";
      let uid = "";

      if (sessionUser) {
        userName = `${sessionUser.firstName || ""} ${sessionUser.lastName || ""}`.trim() || bodyUserName || "Usuario";
        userEmail = sessionUser.email || bodyUserEmail || "";
        uid = sessionUser.id;
      } else if (userId) {
        uid = userId;
        userName = bodyUserName || "Usuario";
        userEmail = bodyUserEmail || "";
      } else {
        return res.status(401).json({ error: "Debes iniciar sesión para enviar un reporte" });
      }
      const imagePath = req.file ? `/uploads/${req.file.filename}` : "";
      await db.insert(problemReports).values({
        userId: uid,
        userName,
        userEmail,
        subscriptionId: subscriptionId || "",
        subscriptionName: subscriptionName || "General",
        description,
        image: imagePath,
        status: "open",
      });
      sendAdminProblemReportEmail(userName, userEmail, subscriptionName || "General", description).catch(() => {});
      if (userEmail) {
        sendUserReportReceivedEmail(userEmail, userName.split(" ")[0] || "Usuario", subscriptionName || "General", description).catch(() => {});
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Report problem error:", error);
      res.status(500).json({ error: "Error al enviar reporte" });
    }
  });

  app.get("/api/admin/reports", async (req, res) => {
    try {
      const reports = await db.select().from(problemReports).orderBy(desc(problemReports.createdAt));
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener reportes" });
    }
  });

  app.put("/api/admin/reports/:id", async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      const [updated] = await db.update(problemReports).set(updates).where(eq(problemReports.id, req.params.id)).returning();
      if (updated && status === "resolved" && updated.userEmail) {
        sendUserTicketResolvedEmail(updated.userEmail, updated.userName.split(" ")[0], updated.subscriptionName || "Reporte de problema", updated.adminNotes || undefined);
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar reporte" });
    }
  });

  app.post("/api/admin/reports/:id/refund", async (req, res) => {
    try {
      const { adminNotes } = req.body;
      const [report] = await db.select().from(problemReports).where(eq(problemReports.id, req.params.id));
      if (!report) return res.status(404).json({ error: "Reporte no encontrado" });
      if (report.refunded) return res.status(400).json({ error: "Este reporte ya fue reembolsado" });

      let refundAmount = 0;
      if (report.subscriptionId) {
        const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, report.subscriptionId));
        if (sub) refundAmount = sub.price;
      }
      if (!refundAmount || refundAmount <= 0) {
        return res.status(400).json({ error: "No se pudo determinar el monto a reembolsar. Verifica la suscripción del reporte." });
      }

      await db.insert(userTransactions).values({
        userId: report.userId,
        amount: refundAmount,
        type: "credit",
        description: `Reembolso por reporte: ${report.subscriptionName}`,
        referenceId: report.id,
      });

      await db.update(problemReports).set({
        refunded: true,
        status: "resolved",
        adminNotes: adminNotes || report.adminNotes || "Reembolso procesado",
        updatedAt: new Date(),
      }).where(eq(problemReports.id, req.params.id));

      if (report.subscriptionId) {
        const [subToDelete] = await db.select({ orderId: userSubscriptions.orderId }).from(userSubscriptions).where(eq(userSubscriptions.id, report.subscriptionId)).catch(() => []);
        await db.delete(userSubscriptions).where(eq(userSubscriptions.id, report.subscriptionId)).catch(() => {});
        if (subToDelete?.orderId) {
          await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, subToDelete.orderId)).catch(() => {});
        }
      }

      const [user] = await db.select().from(users).where(eq(users.id, report.userId));
      const userFirstName = user?.firstName || report.userName.split(" ")[0] || "Usuario";
      const userEmail = user?.email || report.userEmail || "";

      if (userEmail) {
        sendSubscriptionRefundEmail(userEmail, userFirstName, report.subscriptionName, refundAmount, adminNotes || undefined).catch(() => {});
      }
      sendAdminRefundProcessedEmail(report.userName, userEmail, report.subscriptionName, refundAmount).catch(() => {});

      res.json({ success: true, refundAmount });
    } catch (error) {
      console.error("Refund error:", error);
      res.status(500).json({ error: "Error al procesar reembolso" });
    }
  });

  app.delete("/api/admin/reports/:id", async (req, res) => {
    try {
      await db.delete(problemReports).where(eq(problemReports.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar reporte" });
    }
  });

  app.put("/api/admin/subscriptions/:id", async (req, res) => {
    try {
      const { credentialEmail, credentialPassword, credentialName, credentialInstructions, endDate, status } = req.body;
      const updates: any = {};
      if (credentialEmail !== undefined) updates.credentialEmail = credentialEmail;
      if (credentialPassword !== undefined) updates.credentialPassword = credentialPassword;
      if (credentialName !== undefined) updates.credentialName = credentialName;
      if (credentialInstructions !== undefined) updates.credentialInstructions = credentialInstructions;
      if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
      if (status !== undefined) updates.status = status;
      const [updated] = await db.update(userSubscriptions).set(updates).where(eq(userSubscriptions.id, req.params.id)).returning();
      if (updated && updated.userId) {
        const [owner] = await db.select().from(users).where(eq(users.id, updated.userId));
        if (owner && owner.email && updated.status !== "expired" && updated.status !== "cancelled") {
          sendUserSubscriptionUpdatedEmail(
            owner.email,
            owner.firstName || "Usuario",
            updated.credentialName || updated.productName,
            updated.credentialEmail || "",
            updated.credentialPassword || "",
            updated.endDate ? updated.endDate.toISOString() : undefined
          );
        }
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar suscripcion" });
    }
  });

  // Diagnóstico: lista suscripciones potencialmente "perdidas" o problemáticas
  app.get("/api/admin/diagnostico/subscriptions", async (_req, res) => {
    try {
      const allSubs = await db.select().from(userSubscriptions);
      const allUsers = await db.select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName }).from(users);
      const userMap = new Map(allUsers.map(u => [u.id, u]));
      const now = Date.now();
      const problems: any[] = [];
      for (const s of allSubs) {
        const reasons: string[] = [];
        if (s.status === "active" && !s.endDate) reasons.push("ACTIVA SIN FECHA");
        if (s.status === "active" && s.endDate && new Date(s.endDate).getTime() < now) reasons.push("VENCIDA PERO ACTIVA");
        if (!["active", "expired", "cancelled"].includes(s.status as any)) reasons.push(`ESTADO RARO: ${s.status}`);
        if (!s.credentialEmail && !s.credentialName) reasons.push("SIN CREDENCIAL");
        if (reasons.length > 0) {
          const u = userMap.get(s.userId);
          problems.push({
            id: s.id, userId: s.userId,
            userEmail: u?.email || null,
            userName: u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : null,
            productName: s.productName,
            status: s.status,
            startDate: s.startDate, endDate: s.endDate,
            credentialEmail: s.credentialEmail, credentialName: s.credentialName,
            reasons,
          });
        }
      }
      problems.sort((a, b) => b.reasons.length - a.reasons.length);
      res.json({ total: allSubs.length, problemCount: problems.length, problems, generatedAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error" });
    }
  });

  // Diagnóstico por correo: encuentra TODO lo asociado a un email (cuentas duplicadas, subs, orders)
  app.get("/api/admin/diagnostico/by-email", async (req, res) => {
    try {
      const email = String(req.query.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Falta email" });
      const allUsers = await db.select().from(users);
      const matchedUsers = allUsers.filter(u => (u.email || "").toLowerCase() === email);
      const userIds = matchedUsers.map(u => u.id);
      const allSubs = await db.select().from(userSubscriptions);
      const userSubs = allSubs.filter(s => userIds.includes(s.userId));
      const orphanSubs = allSubs.filter(s => !allUsers.find(u => u.id === s.userId));
      const allOrdersForEmail = await db.select().from(orders).where(eq(orders.customerEmail as any, email)).catch(() => []);
      // subs de las orders cuyo customerEmail = email pero quizá asignadas a otro user
      const orderIds = allOrdersForEmail.map(o => o.id);
      const subsFromOrders = allSubs.filter(s => s.orderId && orderIds.includes(s.orderId));
      res.json({
        email,
        accounts: matchedUsers.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, createdAt: u.createdAt })),
        subscriptionsOfThoseAccounts: userSubs,
        ordersWithThisEmail: allOrdersForEmail.map(o => ({ id: o.id, total: o.total, status: o.status, createdAt: o.createdAt, customerEmail: o.customerEmail })),
        subscriptionsCreatedFromThoseOrders: subsFromOrders,
        orphanSubscriptionsTotal: orphanSubs.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error" });
    }
  });

  // Reasignar una suscripción a otro userId (cuando hay cuentas duplicadas)
  app.post("/api/admin/subscriptions/:id/reassign", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json({ error: "Falta userId destino" });
      const [target] = await db.select().from(users).where(eq(users.id, userId));
      if (!target) return res.status(404).json({ error: "Usuario destino no encontrado" });
      const [updated] = await db.update(userSubscriptions).set({ userId }).where(eq(userSubscriptions.id, id)).returning();
      if (!updated) return res.status(404).json({ error: "Suscripción no encontrada" });
      res.json({ success: true, subscription: updated, newOwner: target.email });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error" });
    }
  });

  // Resync subscriptions of a specific user: re-activate them, set endDate if missing, and email summary
  app.post("/api/admin/users/:userId/resync-subscriptions", async (req, res) => {
    try {
      const { userId } = req.params;
      const days = Number(req.body?.days) || 30;
      const [owner] = await db.select().from(users).where(eq(users.id, userId));
      if (!owner) return res.status(404).json({ error: "Usuario no encontrado" });
      const subs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
      let updated = 0;
      const refreshed: any[] = [];
      for (const sub of subs) {
        const updates: any = {};
        if (sub.status !== "active" && sub.status !== "expired") updates.status = "active";
        if (!sub.endDate) {
          const start = sub.startDate ? new Date(sub.startDate) : new Date();
          updates.endDate = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
        }
        if (Object.keys(updates).length > 0) {
          const [u] = await db.update(userSubscriptions).set(updates).where(eq(userSubscriptions.id, sub.id)).returning();
          if (u) refreshed.push(u);
          updated++;
        } else {
          refreshed.push(sub);
        }
      }
      // Send a summary email of all subscriptions
      if (owner.email && refreshed.length > 0) {
        for (const sub of refreshed) {
          if (sub.credentialEmail) {
            sendUserSubscriptionUpdatedEmail(
              owner.email,
              owner.firstName || "Usuario",
              sub.credentialName || sub.productName,
              sub.credentialEmail || "",
              sub.credentialPassword || "",
              sub.endDate ? new Date(sub.endDate).toISOString() : undefined
            );
          }
        }
      }
      res.json({ total: subs.length, updated, refreshed: refreshed.length, email: owner.email });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error" });
    }
  });

  // Bulk-fix: assign endDate (startDate + 30 days) to all active subscriptions missing one
  app.post("/api/admin/subscriptions/fix-missing-dates", async (req, res) => {
    try {
      const days = Number(req.body?.days) || 30;
      const allSubs = await db.select().from(userSubscriptions);
      const toFix = allSubs.filter((s: any) => s.status === "active" && !s.endDate);
      let fixed = 0;
      for (const sub of toFix) {
        const start = sub.startDate ? new Date(sub.startDate) : new Date();
        const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
        await db.update(userSubscriptions).set({ endDate: end }).where(eq(userSubscriptions.id, sub.id));
        fixed++;
      }
      res.json({ fixed, total: toFix.length, days });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error" });
    }
  });

  // Enviar recordatorio masivo a suscripciones que vencen en 1-3 días
  app.post("/api/admin/subscriptions/send-reminders", async (req, res) => {
    try {
      const { days = 3 } = req.body;
      const now = new Date();
      const limitDate = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
      const allSubs = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          productName: userSubscriptions.productName,
          credentialName: userSubscriptions.credentialName,
          endDate: userSubscriptions.endDate,
          status: userSubscriptions.status,
          userEmail: users.email,
          userFirstName: users.firstName,
        })
        .from(userSubscriptions)
        .leftJoin(users, eq(userSubscriptions.userId, users.id));

      const toRemind = allSubs.filter((s) => {
        if (s.status !== "active" || !s.endDate || !s.userEmail) return false;
        const end = new Date(s.endDate);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft >= 1 && daysLeft <= Number(days);
      });

      const { sendExpirationReminderEmail } = await import("./emailService");
      let sent = 0;
      let errors = 0;
      for (const sub of toRemind) {
        if (!sub.userEmail) continue;
        const daysLeft = Math.ceil((new Date(sub.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        try {
          await sendExpirationReminderEmail(
            sub.userEmail,
            sub.userFirstName || "Usuario",
            sub.credentialName || sub.productName,
            daysLeft
          );
          sent++;
        } catch { errors++; }
      }

      res.json({ sent, errors, total: toRemind.length });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error al enviar recordatorios" });
    }
  });

  // Enviar newsletter/novedades a todos los usuarios registrados
  app.post("/api/admin/send-newsletter", async (req, res) => {
    if (!req.isAuthenticated() || ((req.user as any)?.role !== "admin" && !(req.user as any)?.isAdmin)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const { subject, body } = req.body;
      if (!subject?.trim() || !body?.trim()) return res.status(400).json({ error: "Asunto y contenido son requeridos" });

      const allUsers = await db.select().from(users);
      const withEmail = allUsers.filter((u: any) => u.email && u.email.trim());

      // Responder inmediatamente para no hacer timeout
      res.json({ success: true, total: withEmail.length, message: `Enviando a ${withEmail.length} usuarios en segundo plano...` });

      // Usar API batch de Resend: 50 correos por llamada, con reintentos automáticos
      const { sendNewsletterBatch } = await import("./emailService");
      const recipients = withEmail.map(u => ({ email: u.email!, firstName: u.firstName || "Usuario" }));
      const { sent, failed } = await sendNewsletterBatch(recipients, subject.trim(), body.trim());
      console.log(`[NEWSLETTER] Completado: ${sent} enviados, ${failed} fallidos de ${withEmail.length} usuarios`);
    } catch (error: any) {
      console.error("[NEWSLETTER] Error:", error?.message);
    }
  });

  // Enviar recordatorio individual a un usuario específico
  app.post("/api/admin/subscriptions/send-reminder-single", async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      if (!subscriptionId) return res.status(400).json({ error: "Falta subscriptionId" });

      const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, subscriptionId));
      if (!sub) return res.status(404).json({ error: "Suscripción no encontrada" });

      const { users } = await import("@shared/models/auth");
      const [user] = await db.select().from(users).where(eq(users.id, sub.userId));
      if (!user?.email) return res.status(400).json({ error: "El usuario no tiene correo" });

      const now = new Date();
      const daysLeft = sub.endDate
        ? Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const { sendExpirationReminderEmail } = await import("./emailService");
      await sendExpirationReminderEmail(
        user.email,
        user.firstName || "Usuario",
        sub.credentialName || sub.productName,
        daysLeft
      );

      res.json({ success: true, email: user.email });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Error al enviar recordatorio" });
    }
  });

  // Deliver pending credentials to all subscriptions missing them
  app.post("/api/admin/deliver-pending-credentials", async (req, res) => {
    if (!req.isAuthenticated() || ((req.user as any)?.role !== "admin" && !(req.user as any)?.isAdmin)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const pending = await db.select().from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, "active"),
          or(eq(userSubscriptions.credentialEmail, ""), isNull(userSubscriptions.credentialEmail as any))
        ));

      let delivered = 0;
      let skipped = 0;

      for (const sub of pending) {
        if (!sub.productId) { skipped++; continue; }
        // Try by ID first; fall back to name if productId is a placeholder like "regalo"
        let [product] = await db.select().from(products).where(eq(products.id, sub.productId));
        if (!product && sub.productName) {
          const byName = await db.select().from(products)
            .where(ilike(products.name, `%${(sub as any).productName.trim()}%`))
            .limit(1);
          product = byName[0];
        }
        if (!product) { skipped++; continue; }

        let credEmail = "";
        let credPassword = "";
        let credInstructions = sub.credentialInstructions || "";

        // Try pool first
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
          skipped++;
          continue;
        }

        await db.update(userSubscriptions)
          .set({ credentialEmail: credEmail, credentialPassword: credPassword, credentialInstructions: credInstructions })
          .where(eq(userSubscriptions.id, sub.id));

        // Send email to user
        const [owner] = await db.select().from(users).where(eq(users.id, sub.userId));
        if (owner?.email) {
          sendCredentialsEmail(owner.email, owner.firstName || "Usuario", sub.productName, credEmail, credPassword, credInstructions || undefined).catch(() => {});
        }

        delivered++;
      }

      res.json({ delivered, skipped, total: pending.length });
    } catch (error) {
      console.error("[DELIVER-PENDING]", error);
      res.status(500).json({ error: "Error al entregar credenciales pendientes" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  });

  app.put("/api/admin/users/:id", upload.single("profileImage"), async (req, res) => {
    try {
      const updates: any = { updatedAt: new Date() };
      if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
      if (req.body.email !== undefined) updates.email = req.body.email;
      if (req.file) {
        updates.customProfileImage = `/uploads/${req.file.filename}`;
      }
      if (req.body.removePhoto === "true") {
        updates.customProfileImage = null;
      }
      const [updated] = await db.update(users).set(updates).where(eq(users.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  });

  app.post("/api/admin/users/:id/suspend", async (req, res) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

      await db.update(users).set({
        suspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason || "Comprobante de pago fraudulento o duplicado",
        updatedAt: new Date()
      }).where(eq(users.id, userId));

      await db.update(userSubscriptions).set({ status: "cancelled" }).where(eq(userSubscriptions.userId, userId));

      await db.execute(sql`DELETE FROM sessions WHERE sess->'passport'->>'user' = ${userId}`);

      if (user.email) {
        sendSuspensionEmail(
          user.email,
          user.firstName || "Usuario",
          reason || "Se detecto un comprobante de pago fraudulento o duplicado en tu cuenta. Esta accion viola nuestros terminos de servicio."
        ).catch(() => {});
      }

      res.json({ success: true, message: "Usuario suspendido" });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ error: "Error al suspender usuario" });
    }
  });

  app.post("/api/admin/users/:id/unsuspend", async (req, res) => {
    try {
      const userId = req.params.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      await db.update(users).set({
        suspended: false,
        suspendedAt: null,
        suspendedReason: null,
        updatedAt: new Date()
      }).where(eq(users.id, userId));
      if (user.email) {
        sendReactivationEmail(user.email, user.firstName || "Usuario").catch(() => {});
      }
      res.json({ success: true, message: "Cuenta reactivada" });
    } catch (error) {
      res.status(500).json({ error: "Error al reactivar cuenta" });
    }
  });

  app.get("/api/admin/banned-emails", async (req, res) => {
    try {
      const list = await db.select().from(bannedEmails).orderBy(desc(bannedEmails.bannedAt));
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener correos baneados" });
    }
  });

  app.post("/api/admin/banned-emails", async (req, res) => {
    try {
      const { email, reason } = req.body;
      if (!email) return res.status(400).json({ error: "Correo requerido" });
      const [existing] = await db.select().from(bannedEmails).where(eq(bannedEmails.email, email.toLowerCase()));
      if (existing) return res.status(400).json({ error: "Este correo ya está baneado" });
      const [banned] = await db.insert(bannedEmails).values({ email: email.toLowerCase(), reason: reason || "" }).returning();
      await db.execute(sql`DELETE FROM sessions WHERE sess::text ILIKE ${'%' + email.toLowerCase() + '%'}`);
      res.json(banned);
    } catch (error) {
      res.status(500).json({ error: "Error al banear correo" });
    }
  });

  app.delete("/api/admin/banned-emails/:id", async (req, res) => {
    try {
      await db.delete(bannedEmails).where(eq(bannedEmails.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al desbanear correo" });
    }
  });

  // ── Product credential stock management ──────────────────────────────────
  app.get("/api/admin/products/:id/credentials", async (req, res) => {
    try {
      const creds = await storage.getProductCredentials(req.params.id);
      res.json(creds);
    } catch (e) {
      res.status(500).json({ error: "Error al obtener credenciales" });
    }
  });

  app.post("/api/admin/products/:id/credentials", async (req, res) => {
    try {
      const { credEmail, credPassword, credInstructions } = req.body;
      if (!credEmail || !credPassword) return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
      const cred = await storage.addProductCredential(req.params.id, credEmail, credPassword, credInstructions || "");

      // Auto-assign to pending subscriptions (no credentials yet) for this product
      const pendingSubs = await db.select().from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.productId, req.params.id),
          eq(userSubscriptions.status, "active")
        ));
      const needsCred = pendingSubs.filter(s => !s.credentialEmail || s.credentialEmail === "");
      for (const sub of needsCred) {
        const claimed = await storage.claimProductCredential(req.params.id, sub.orderId || sub.id).catch(() => null);
        if (!claimed) break; // No more credentials in pool
        await db.update(userSubscriptions).set({
          credentialEmail: claimed.credEmail,
          credentialPassword: claimed.credPassword,
          credentialInstructions: claimed.credInstructions || "",
        }).where(eq(userSubscriptions.id, sub.id)).catch(() => {});
        // Send email to user
        const subUser = await db.select().from(users).where(eq(users.id, sub.userId)).then(r => r[0]);
        if (subUser?.email) {
          sendCredentialsEmail(subUser.email, subUser.firstName || subUser.email, sub.productName, claimed.credEmail, claimed.credPassword, claimed.credInstructions || undefined).catch(() => {});
        }
      }

      res.json(cred);
    } catch (e) {
      res.status(500).json({ error: "Error al agregar credencial" });
    }
  });

  app.delete("/api/admin/products/credentials/:credId", async (req, res) => {
    try {
      await storage.deleteProductCredential(req.params.credId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Error al eliminar credencial" });
    }
  });

  app.post("/api/admin/orders/:id/delete-subscriptions", async (req, res) => {
    try {
      const orderId = req.params.id;
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
      const deleted = await db.delete(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
      res.json({ success: true, message: "Suscripciones eliminadas del pedido" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar suscripciones" });
    }
  });

  app.post("/api/admin/orders/:id/refund", async (req, res) => {
    try {
      const orderId = req.params.id;
      const { reason } = req.body;
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

      const refundAmount = order.price;
      if (!refundAmount || refundAmount <= 0) {
        return res.status(400).json({ error: "No se puede reembolsar un pedido sin precio" });
      }

      // Get userId from linked subscription (orders table has no userId column)
      const [linkedSub] = await db.select({ userId: userSubscriptions.userId }).from(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));
      let userId = linkedSub?.userId;

      // If no subscription (e.g. game orders), find user by customerEmail
      if (!userId && order.customerEmail) {
        const [matchedUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, order.customerEmail));
        userId = matchedUser?.id;
      }

      if (!userId) {
        return res.status(400).json({ error: "No se encontró una cuenta de usuario vinculada a este pedido para reembolsar." });
      }

      await db.insert(userTransactions).values({
        userId,
        amount: refundAmount,
        type: "credit",
        description: `Reembolso de pedido: ${order.productName}`,
        referenceId: order.id,
      });

      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
      await db.delete(userSubscriptions).where(eq(userSubscriptions.orderId, orderId));

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const userEmail = user?.email || order.customerEmail || "";
      const userFirstName = user?.firstName || order.customerName?.split(" ")[0] || "Usuario";
      const userName = order.customerName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";
      if (userEmail) {
        sendSubscriptionRefundEmail(userEmail, userFirstName, order.productName, refundAmount, reason || undefined).catch(() => {});
      }
      sendAdminRefundProcessedEmail(userName, userEmail, order.productName, refundAmount).catch(() => {});

      res.json({ success: true, refundAmount });
    } catch (error) {
      console.error("Order refund error:", error);
      res.status(500).json({ error: "Error al procesar el reembolso" });
    }
  });

  app.post("/api/admin/orders/:id/fraud", async (req, res) => {
    try {
      const orderId = req.params.id;
      const { reason } = req.body;

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));

      const allUsers = await db.select().from(users);
      const matchUser = allUsers.find((u) => {
        if (order.customerEmail && u.email && u.email.toLowerCase() === order.customerEmail.toLowerCase()) return true;
        if (order.customerPhone && u.email) {
          const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
          if (fullName && order.customerName && order.customerName.toLowerCase() === fullName) return true;
        }
        return false;
      });

      let userSuspended = false;
      if (matchUser) {
        const suspendReason = reason || `Se detecto un comprobante de pago fraudulento o duplicado. Pago en el pedido de ${order.productName}`;
        
        await db.update(users).set({
          suspended: true,
          suspendedAt: new Date(),
          suspendedReason: suspendReason,
          updatedAt: new Date()
        }).where(eq(users.id, matchUser.id));

        await db.update(userSubscriptions).set({ status: "cancelled" }).where(eq(userSubscriptions.userId, matchUser.id));

        await db.execute(sql`DELETE FROM sessions WHERE sess->'passport'->>'user' = ${matchUser.id}`);

        if (matchUser.email) {
          sendSuspensionEmail(matchUser.email, matchUser.firstName || "Usuario", suspendReason).catch(() => {});
        }
        userSuspended = true;
      }

      res.json({ 
        success: true, 
        orderCancelled: true, 
        userSuspended,
        message: userSuspended 
          ? "Pedido cancelado y usuario suspendido permanentemente" 
          : "Pedido cancelado. No se encontro cuenta de usuario vinculada."
      });
    } catch (error) {
      console.error("Error processing fraud:", error);
      res.status(500).json({ error: "Error al procesar fraude" });
    }
  });

  app.get("/api/admin/users/:id/subscriptions", async (req, res) => {
    try {
      const subs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, req.params.id));
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener suscripciones del usuario" });
    }
  });

  app.get("/api/tv-channels", async (_req, res) => {
    try {
      const channels = await db.select().from(tvChannels).where(eq(tvChannels.isActive, true)).orderBy(tvChannels.order);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener canales" });
    }
  });

  app.get("/api/admin/tv-channels", async (_req, res) => {
    try {
      const channels = await db.select().from(tvChannels).orderBy(tvChannels.order);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener canales" });
    }
  });

  app.post("/api/admin/tv-channels", async (req, res) => {
    try {
      if (req.body.streamUrl) req.body.streamUrl = req.body.streamUrl.replace(/\s+/g, "").trim();
      const data = insertTvChannelSchema.parse(req.body);
      const [channel] = await db.insert(tvChannels).values(data).returning();
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al crear canal" });
    }
  });

  app.delete("/api/admin/tv-channels/:id", async (req, res) => {
    try {
      await db.delete(tvChannels).where(eq(tvChannels.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar canal" });
    }
  });

  app.patch("/api/admin/tv-channels/:id", async (req, res) => {
    try {
      if (req.body.streamUrl) req.body.streamUrl = req.body.streamUrl.replace(/\s+/g, "").trim();
      const [channel] = await db.update(tvChannels).set(req.body).where(eq(tvChannels.id, req.params.id)).returning();
      res.json(channel);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar canal" });
    }
  });

  app.post("/api/admin/tv-channels/import-m3u", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL requerida" });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!response.ok) throw new Error(`Error al descargar lista: ${response.status}`);
      const m3uContent = await response.text();

      const lines = m3uContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const channels: { name: string; group: string; logo: string; streamUrl: string }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF:')) {
          const infoLine = lines[i];
          let streamLine = '';
          for (let j = i + 1; j < lines.length; j++) {
            if (!lines[j].startsWith('#')) {
              streamLine = lines[j];
              break;
            }
          }
          if (!streamLine) continue;

          const nameMatch = infoLine.match(/,(.+)$/);
          const groupMatch = infoLine.match(/group-title="([^"]*)"/);
          const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);

          channels.push({
            name: nameMatch ? nameMatch[1].trim() : `Canal ${channels.length + 1}`,
            group: groupMatch ? groupMatch[1] : 'General',
            logo: logoMatch ? logoMatch[1] : '',
            streamUrl: streamLine.replace(/\s+/g, "").trim(),
          });
        }
      }

      if (channels.length === 0) {
        return res.status(400).json({ error: "No se encontraron canales en la lista M3U" });
      }

      const inserted = [];
      for (const ch of channels) {
        const [channel] = await db.insert(tvChannels).values({
          name: ch.name,
          group: ch.group,
          logo: ch.logo,
          streamUrl: ch.streamUrl,
          isActive: true,
          order: inserted.length,
        }).returning();
        inserted.push(channel);
      }

      res.json({ imported: inserted.length, channels: inserted });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al importar lista M3U" });
    }
  });

  app.delete("/api/admin/tv-channels/bulk-delete", async (req, res) => {
    try {
      const { group } = req.body;
      if (group) {
        await db.delete(tvChannels).where(eq(tvChannels.group, group));
      } else {
        await db.delete(tvChannels);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar canales" });
    }
  });

  // Seller Marketplace Routes
  app.post("/api/seller/products", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, price, category, description } = req.body;
      if (!name || !price || !category) {
        return res.status(400).json({ error: "Nombre, precio y categoria son requeridos" });
      }
      let image = req.body.image || "";
      if (req.file) {
        image = `/uploads/${req.file.filename}`;
      }
      if (!image) {
        return res.status(400).json({ error: "Se requiere una imagen del producto" });
      }
      const [product] = await db.insert(products).values({
        name,
        price: parseInt(price),
        image,
        category,
        description: description || "",
        sellerId: user.id,
        sellerStatus: "pending",
        sellerEmail: user.email || "",
        submittedAt: new Date(),
        isActive: false,
      }).returning();
      const { sendAdminSellerProductSubmittedEmail } = await import("./emailService");
      sendAdminSellerProductSubmittedEmail(
        user.firstName || user.email?.split("@")[0] || "Vendedor",
        user.email || "",
        name
      ).catch(() => {});
      res.json(product);
    } catch (error) {
      console.error("Seller product submission error:", error);
      res.status(500).json({ error: "Error al enviar producto" });
    }
  });

  app.get("/api/seller/products", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const sellerProducts = await db.select().from(products).where(eq(products.sellerId, user.id));
      res.json(sellerProducts);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener productos" });
    }
  });

  app.get("/api/seller/dashboard", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const sellerProducts = await db.select().from(products).where(eq(products.sellerId, user.id));
      const transactions = await db.select().from(sellerTransactions).where(eq(sellerTransactions.sellerId, user.id));
      const credits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
      const debits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
      const balance = credits - debits;
      const totalSales = transactions.filter(t => t.type === "credit").length;
      res.json({ balance, totalSales, products: sellerProducts });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener dashboard" });
    }
  });

  app.get("/api/seller/transactions", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const transactions = await db.select().from(sellerTransactions).where(eq(sellerTransactions.sellerId, user.id)).orderBy(desc(sellerTransactions.createdAt));
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener transacciones" });
    }
  });

  app.get("/api/seller/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const withdrawals = await db.select().from(sellerWithdrawals).where(eq(sellerWithdrawals.sellerId, user.id)).orderBy(desc(sellerWithdrawals.createdAt));
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener retiros" });
    }
  });

  app.post("/api/seller/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const { amount, paymentMethod, accountNumber, accountName, accountType } = req.body;
      if (!amount || !paymentMethod || !accountNumber || !accountName || !accountType) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }
      const transactions = await db.select().from(sellerTransactions).where(eq(sellerTransactions.sellerId, user.id));
      const credits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
      const debits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
      const balance = credits - debits;
      if (parseInt(amount) > balance) {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }
      const [withdrawal] = await db.insert(sellerWithdrawals).values({
        sellerId: user.id,
        amount: parseInt(amount),
        paymentMethod,
        accountNumber,
        accountName,
        accountType,
      }).returning();
      const { sendAdminWithdrawalRequestEmail } = await import("./emailService");
      sendAdminWithdrawalRequestEmail(
        user.firstName || user.email?.split("@")[0] || "Vendedor",
        user.email || "",
        parseInt(amount),
        paymentMethod
      ).catch(() => {});
      res.json(withdrawal);
    } catch (error) {
      res.status(500).json({ error: "Error al solicitar retiro" });
    }
  });

  // Admin Seller Marketplace Routes
  app.get("/api/admin/seller-products", async (req, res) => {
    try {
      const sellerProducts = await db.select().from(products).where(ne(products.sellerStatus, "none"));
      res.json(sellerProducts);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener productos de vendedores" });
    }
  });

  app.put("/api/admin/seller-products/:id", async (req, res) => {
    try {
      const [updated] = await db.update(products).set(req.body).where(eq(products.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar producto" });
    }
  });

  app.post("/api/admin/seller-products/:id/publish", async (req, res) => {
    try {
      const [updated] = await db.update(products).set({
        sellerStatus: "approved",
        isActive: true,
      }).where(eq(products.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
      if (updated.sellerEmail) {
        const sellerName = updated.sellerEmail.split("@")[0];
        if (updated.sellerId) {
          const [seller] = await db.select().from(users).where(eq(users.id, updated.sellerId));
          sendSellerProductPublishedEmail(
            updated.sellerEmail,
            seller?.firstName || sellerName,
            updated.name
          ).catch(() => {});
        } else {
          sendSellerProductPublishedEmail(updated.sellerEmail, sellerName, updated.name).catch(() => {});
        }
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al publicar producto" });
    }
  });

  app.post("/api/admin/seller-products/:id/reject", async (req, res) => {
    try {
      const [updated] = await db.update(products).set({
        sellerStatus: "rejected",
      }).where(eq(products.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al rechazar producto" });
    }
  });

  app.delete("/api/admin/seller-products/:id", async (req, res) => {
    try {
      const [deleted] = await db.delete(products).where(eq(products.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "Producto no encontrado" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar producto" });
    }
  });

  // Admin Withdrawal Management
  app.get("/api/admin/withdrawals", async (req, res) => {
    try {
      const { users } = await import("@shared/models/auth");
      const withdrawals = await db.select().from(sellerWithdrawals).orderBy(desc(sellerWithdrawals.createdAt));
      const enriched = await Promise.all(withdrawals.map(async (wd) => {
        const [seller] = await db.select().from(users).where(eq(users.id, wd.sellerId));
        return {
          ...wd,
          sellerName: seller ? `${seller.firstName || ""} ${seller.lastName || ""}`.trim() : null,
          sellerEmail: seller?.email || null,
          sellerPhoto: (seller as any)?.customProfileImage || seller?.profileImageUrl || null,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener retiros" });
    }
  });

  app.patch("/api/admin/withdrawals/:id", upload.single("receiptImage"), async (req, res) => {
    try {
      const { status } = req.body;
      const updates: any = { status };
      if (status === "paid") {
        updates.processedAt = new Date();
      }
      const [updated] = await db.update(sellerWithdrawals).set(updates).where(eq(sellerWithdrawals.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Retiro no encontrado" });
      let receiptUrl: string | undefined;
      if (req.file) {
        receiptUrl = `/uploads/${req.file.filename}`;
      }
      if (status === "paid") {
        const existingDebit = await db.select().from(sellerTransactions).where(eq(sellerTransactions.orderId, updated.id));
        if (existingDebit.length === 0) {
          await db.insert(sellerTransactions).values({
            sellerId: updated.sellerId,
            orderId: updated.id,
            amount: updated.amount,
            type: "debit",
            description: `Retiro via ${updated.paymentMethod}`,
          });
        }
        const { users } = await import("@shared/models/auth");
        const [seller] = await db.select().from(users).where(eq(users.id, updated.sellerId));
        if (seller?.email) {
          const { sendWithdrawalPaidEmail } = await import("./emailService");
          sendWithdrawalPaidEmail(
            seller.email,
            seller.firstName || seller.email.split("@")[0],
            updated.amount,
            updated.paymentMethod,
            receiptUrl
          ).catch(() => {});
        }
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar retiro" });
    }
  });

  // ========== WALLET / RECHARGE SYSTEM ==========

  function generateRechargeCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "REC-";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  app.get("/api/recharge-payment-methods", async (req, res) => {
    try {
      const methods = await db.select().from(rechargePaymentMethods).orderBy(rechargePaymentMethods.order);
      res.json(methods);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener métodos de pago" });
    }
  });

  app.get("/api/recharge-payment-methods/active", async (req, res) => {
    try {
      const methods = await db.select().from(rechargePaymentMethods).where(eq(rechargePaymentMethods.isActive, true)).orderBy(rechargePaymentMethods.order);
      res.json(methods);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener métodos de pago" });
    }
  });

  app.post("/api/admin/recharge-payment-methods", upload.single("logo"), async (req, res) => {
    try {
      const { name, type, accountNumber, accountName, instructions, order } = req.body;
      const logo = req.file ? `/uploads/${req.file.filename}` : "";
      const [method] = await db.insert(rechargePaymentMethods).values({
        name, type, accountNumber: accountNumber || "", accountName: accountName || "", instructions: instructions || "", logo, order: parseInt(order) || 0, isActive: true,
      }).returning();
      res.json(method);
    } catch (error) {
      res.status(500).json({ error: "Error al crear método de pago" });
    }
  });

  app.put("/api/admin/recharge-payment-methods/:id", upload.single("logo"), async (req, res) => {
    try {
      const { name, type, accountNumber, accountName, instructions, order, isActive } = req.body;
      const updates: any = { name, type, accountNumber, accountName, instructions, order: parseInt(order) || 0 };
      if (isActive !== undefined) updates.isActive = isActive === "true" || isActive === true;
      if (req.file) updates.logo = `/uploads/${req.file.filename}`;
      const [updated] = await db.update(rechargePaymentMethods).set(updates).where(eq(rechargePaymentMethods.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Método no encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar método" });
    }
  });

  app.delete("/api/admin/recharge-payment-methods/:id", async (req, res) => {
    try {
      await db.delete(rechargePaymentMethods).where(eq(rechargePaymentMethods.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar método" });
    }
  });

  app.get("/api/user/balance", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const txns = await db.select().from(userTransactions).where(eq(userTransactions.userId, user.id));
      const isReferralCredit = (t: any) => t.type === "credit" && (t.description || "").startsWith("Bono de");
      const referralCredits = txns.filter(isReferralCredit).reduce((sum, t) => sum + Number(t.amount), 0);
      const regularCredits = txns.filter(t => t.type === "credit" && !isReferralCredit(t)).reduce((sum, t) => sum + Number(t.amount), 0);
      const debits = txns.filter(t => t.type === "debit").reduce((sum, t) => sum + Number(t.amount), 0);
      const totalBalance = regularCredits + referralCredits - debits;
      const remainingAfterRegular = regularCredits - debits;
      const regularBalance = Math.max(0, remainingAfterRegular);
      const referralBalance = remainingAfterRegular >= 0 ? referralCredits : Math.max(0, referralCredits + remainingAfterRegular);
      res.json({ balance: totalBalance, regularBalance, referralBalance, transactions: txns });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener saldo" });
    }
  });

  app.post("/api/user/recharge", isAuthenticated, upload.single("screenshot"), async (req, res) => {
    try {
      const user = (req as any).user;
      console.log("[RECHARGE] POST recibido de usuario:", user?.id, "body:", { amount: req.body?.amount, paymentMethodId: req.body?.paymentMethodId, paymentMethodName: req.body?.paymentMethodName }, "file:", req.file?.originalname);
      const { amount, paymentMethodId, paymentMethodName } = req.body;
      if (!amount || !paymentMethodId || !paymentMethodName) {
        console.log("[RECHARGE] Campos faltantes:", { amount, paymentMethodId, paymentMethodName });
        return res.status(400).json({ error: "Campos requeridos faltantes" });
      }
      const screenshot = req.file ? `/uploads/${req.file.filename}` : "";
      const code = req.body.code || generateRechargeCode();
      const [request] = await db.insert(rechargeRequests).values({
        userId: user.id,
        userName: user.firstName || user.email?.split("@")[0] || "Usuario",
        userEmail: user.email || "",
        amount: parseInt(amount),
        paymentMethodId,
        paymentMethodName,
        screenshot,
        code,
        status: "pending",
      }).returning();

      res.json(request);

      if (request.userEmail) {
        console.log(`[RECHARGE-EMAIL] Enviando confirmacion de solicitud a: ${request.userEmail} | Monto: Q${request.amount} | Codigo: ${code}`);
        sendRechargeSubmittedEmail(
          request.userEmail,
          request.userName,
          request.amount,
          code,
          paymentMethodName
        ).catch((err) => { console.error("[RECHARGE-EMAIL] Error confirmacion solicitud:", err); });
      }

      sendAdminNewRechargeEmail(
        request.userName,
        request.userEmail || "",
        request.amount,
        paymentMethodName,
        code
      ).catch(() => {});
    } catch (error) {
      console.error("[RECHARGE] ERROR al insertar en DB:", error);
      res.status(500).json({ error: "Error al crear solicitud de recarga" });
    }
  });

  app.get("/api/user/recharge-requests", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const requests = await db.select().from(rechargeRequests).where(eq(rechargeRequests.userId, user.id)).orderBy(desc(rechargeRequests.createdAt));
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener solicitudes" });
    }
  });

  app.get("/api/admin/recharge-requests", async (req, res) => {
    try {
      const requests = await db.select().from(rechargeRequests).orderBy(desc(rechargeRequests.createdAt));
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener solicitudes de recarga" });
    }
  });

  app.patch("/api/admin/recharge-requests/:id", async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const updates: any = { status };
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (status === "approved") updates.processedAt = new Date();
      const [updated] = await db.update(rechargeRequests).set(updates).where(eq(rechargeRequests.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Solicitud no encontrada" });
      if (status === "approved") {
        const existing = await db.select().from(userTransactions).where(eq(userTransactions.referenceId, updated.id));
        if (existing.length === 0) {
          await db.insert(userTransactions).values({
            userId: updated.userId,
            amount: updated.amount,
            type: "credit",
            description: `Recarga aprobada - ${updated.paymentMethodName} - Código: ${updated.code}`,
            referenceId: updated.id,
          });
        }

        if (updated.userEmail) {
          console.log(`[RECHARGE-EMAIL] Enviando aprobacion a: ${updated.userEmail} | Monto: Q${updated.amount} | Codigo: ${updated.code}`);
          sendRechargeApprovedEmail(
            updated.userEmail,
            updated.userName,
            updated.amount,
            updated.code,
            updated.paymentMethodName
          ).catch((err) => { console.error("[RECHARGE-EMAIL] Error aprobacion:", err); });
        } else {
          console.log(`[RECHARGE-EMAIL] SKIP - userEmail vacio para recarga ${updated.id}`);
        }
      }

      res.json(updated);

      if (status === "rejected" && updated.userEmail) {
        console.log(`[RECHARGE-EMAIL] Enviando rechazo a: ${updated.userEmail} | Monto: Q${updated.amount}`);
        sendRechargeRejectedEmail(
          updated.userEmail,
          updated.userName,
          updated.amount,
          updated.code,
          adminNotes
        ).catch(() => {});
      }
    } catch (error) {
      console.error("[RECHARGE PATCH] ERROR:", error);
      res.status(500).json({ error: "Error al actualizar solicitud" });
    }
  });

  app.get("/api/admin/users-with-balance", async (_req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const allTxns = await db.select().from(userTransactions);
      const byUser = new Map<string, { credits: number; debits: number; lastTxnAt: Date | null }>();
      for (const t of allTxns) {
        const cur = byUser.get(t.userId) || { credits: 0, debits: 0, lastTxnAt: null };
        const amt = Number(t.amount) || 0;
        if (t.type === "credit") cur.credits += amt;
        else if (t.type === "debit") cur.debits += amt;
        const ts = (t as any).createdAt ? new Date((t as any).createdAt) : null;
        if (ts && (!cur.lastTxnAt || ts > cur.lastTxnAt)) cur.lastTxnAt = ts;
        byUser.set(t.userId, cur);
      }
      const result = allUsers
        .map((u: any) => {
          const b = byUser.get(u.id) || { credits: 0, debits: 0, lastTxnAt: null };
          return {
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            customProfileImage: u.customProfileImage,
            profileImageUrl: u.profileImageUrl,
            suspended: !!u.suspended,
            balance: b.credits - b.debits,
            totalCredits: b.credits,
            totalDebits: b.debits,
            lastTxnAt: b.lastTxnAt,
          };
        })
        .filter((u) => u.balance > 0)
        .sort((a, b) => b.balance - a.balance);
      res.json(result);
    } catch (error) {
      console.error("[ADMIN] Error users-with-balance:", error);
      res.status(500).json({ error: "Error al obtener saldos activos" });
    }
  });

  app.get("/api/admin/user-balance/:userId", async (req, res) => {
    try {
      const txns = await db.select().from(userTransactions).where(eq(userTransactions.userId, req.params.userId));
      const credits = txns.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
      const debits = txns.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
      res.json({ balance: credits - debits, transactions: txns });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener saldo del usuario" });
    }
  });

  app.post("/api/admin/user-balance/:userId/adjust", async (req, res) => {
    try {
      const { amount, type, description } = req.body;
      const [txn] = await db.insert(userTransactions).values({
        userId: req.params.userId,
        amount: parseInt(amount),
        type,
        description: description || (type === "credit" ? "Ajuste de saldo (admin)" : "Débito manual (admin)"),
        referenceId: "admin-adjustment",
      }).returning();
      res.json(txn);
    } catch (error) {
      res.status(500).json({ error: "Error al ajustar saldo" });
    }
  });

  // ==================== REFERRAL SYSTEM ====================

  function generateReferralCode(userId: string): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  async function ensureReferralCode(userId: string): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user?.referralCode) return user.referralCode;
    let code = generateReferralCode(userId);
    let tries = 0;
    while (tries < 5) {
      const [existing] = await db.select().from(users).where(eq(users.referralCode, code));
      if (!existing) break;
      code = generateReferralCode(userId);
      tries++;
    }
    await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    return code;
  }

  async function creditReferrer(referrerId: string, referredUserId: string, type: "register" | "purchase", orderId?: string) {
    try {
      const [program] = await db.select().from(referralProgram);
      if (!program || !program.isActive) return;
      const amount = Math.round(type === "register" ? (Number(program.registerBonus) || 1) : (Number(program.purchaseBonus) || 4));
      await db.insert(userTransactions).values({
        userId: referrerId,
        amount,
        type: "credit",
        description: type === "register" ? "Bono de referido — registro" : "Bono de referido — compra",
        referenceId: orderId || referredUserId,
      });
      await db.insert(referralTransactions).values({
        referrerId,
        referredUserId,
        orderId: orderId || "",
        type,
        amount,
      });
      if (type === "register") {
        const [referrer] = await db.select().from(users).where(eq(users.id, referrerId));
        const [newUser] = await db.select().from(users).where(eq(users.id, referredUserId));
        console.log(`[REFERRAL] Enviando correos — referidor: ${referrer?.email || "sin email"}, nuevo: ${newUser?.email || "sin email"}`);
        if (referrer?.email) {
          sendReferralRegisterNotificationEmail(
            referrer.email,
            referrer.firstName || referrer.email.split("@")[0],
            newUser ? (newUser.firstName || newUser.email?.split("@")[0] || "Un nuevo usuario") : "Un nuevo usuario",
            amount
          ).catch((e) => console.error("[REFERRAL] Error correo referidor:", e));
        } else {
          console.log("[REFERRAL] Referidor sin email registrado — no se envía correo al referidor");
        }
        sendAdminReferralNotificationEmail(
          referrer ? (referrer.firstName || referrer.email?.split("@")[0] || "Usuario") : "Usuario",
          referrer?.email || "Sin correo",
          newUser ? (newUser.firstName || newUser.email?.split("@")[0] || "Nuevo usuario") : "Nuevo usuario",
          newUser?.email || "Sin correo",
          amount
        ).catch((e) => console.error("[REFERRAL] Error correo admin:", e));
      }
    } catch (err) {
      console.error("Error acreditando referido:", err);
    }
  }

  async function creditNewUser(newUserId: string, type: "register") {
    try {
      const [program] = await db.select().from(referralProgram);
      if (!program || !program.isActive) return;
      const amount = Math.round(Number(program.registerBonus) || 1);
      if (amount <= 0) return;
      await db.insert(userTransactions).values({
        userId: newUserId,
        amount,
        type: "credit",
        description: "Bono de bienvenida — registrado con link de referido",
        referenceId: newUserId,
      });
    } catch (err) {
      console.error("Error acreditando nuevo usuario referido:", err);
    }
  }

  // GET /api/referral/program — public
  app.get("/api/referral/program", async (req, res) => {
    try {
      const [program] = await db.select().from(referralProgram);
      res.json(program || null);
    } catch {
      res.status(500).json({ error: "Error al obtener programa" });
    }
  });

  // GET /api/referral/my-stats — authenticated
  app.get("/api/referral/my-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const code = await ensureReferralCode(userId);
      const txns = await db.select().from(referralTransactions).where(eq(referralTransactions.referrerId, userId));
      const totalEarned = txns.reduce((sum, t) => sum + t.amount, 0);
      const registrations = txns.filter(t => t.type === "register").length;
      const purchases = txns.filter(t => t.type === "purchase").length;
      const [program] = await db.select().from(referralProgram);
      res.json({ code, totalEarned, registrations, purchases, program: program || null });
    } catch {
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });

  // POST /api/admin/referral/program — admin upsert
  app.post("/api/admin/referral/program", async (req, res) => {
    try {
      const { isActive, title, description, registerBonus, purchaseBonus } = req.body;
      const [existing] = await db.select().from(referralProgram);
      const statusChanged = existing && existing.isActive !== isActive;
      let result: any;
      if (existing) {
        const [updated] = await db.update(referralProgram)
          .set({ isActive, title, description, registerBonus: parseFloat(registerBonus), purchaseBonus: parseFloat(purchaseBonus), updatedAt: new Date() })
          .where(eq(referralProgram.id, existing.id))
          .returning();
        result = updated;
      } else {
        const [created] = await db.insert(referralProgram)
          .values({ isActive, title, description, registerBonus: parseFloat(registerBonus), purchaseBonus: parseFloat(purchaseBonus) })
          .returning();
        result = created;
      }
      // Send emails if status changed
      if (statusChanged) {
        const estadoStr = isActive ? "ACTIVADO" : "DESACTIVADO";
        console.log(`[REFERRAL] Estado cambió a ${estadoStr} — buscando usuarios a notificar`);
        // Notify admin
        sendAdminReferralProgramStatusEmail(isActive).catch((e) => console.error("[REFERRAL] Error correo admin:", e));
        // Notify all users who have a referral code and have email
        const usersWithCode = await db.select().from(users).where(eq(users.role, "user"));
        const eligible = usersWithCode.filter(u => u.email && u.referralCode);
        console.log(`[REFERRAL] Usuarios elegibles para notificar: ${eligible.length}`);
        for (const u of eligible) {
          if (isActive) {
            sendReferralProgramActivatedEmail(u.email!, u.firstName || u.email!.split("@")[0], parseFloat(registerBonus) || 1, parseFloat(purchaseBonus) || 4).catch((e) => console.error(`[REFERRAL] Error correo activación ${u.email}:`, e));
          } else {
            sendReferralProgramDeactivatedEmail(u.email!, u.firstName || u.email!.split("@")[0]).catch((e) => console.error(`[REFERRAL] Error correo desactivación ${u.email}:`, e));
          }
        }
        console.log(`[REFERRAL] Notificaciones enviadas a ${eligible.length} usuarios`);
      } else {
        console.log(`[REFERRAL] Sin cambio de estado (isActive=${isActive}) — no se envían correos`);
      }
      return res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al guardar programa" });
    }
  });

  // GET /api/admin/referral/stats — admin overview
  app.get("/api/admin/referral/stats", async (req, res) => {
    try {
      const [program] = await db.select().from(referralProgram);
      const txns = await db.select().from(referralTransactions);
      const totalPaid = txns.reduce((sum, t) => sum + t.amount, 0);
      const totalReferrals = new Set(txns.map(t => t.referredUserId)).size;
      res.json({ program: program || null, totalPaid, totalReferrals, transactions: txns });
    } catch {
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });

  // GET /api/admin/referral/user-balances — saldos de referidos por usuario
  app.get("/api/admin/referral/user-balances", async (_req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      }).from(users).orderBy(users.createdAt);

      const allTxns = await db.select().from(userTransactions);

      const result = allUsers.map(u => {
        const txns = allTxns.filter(t => t.userId === u.id);
        const isReferralCredit = (t: any) => t.type === "credit" && (t.description || "").startsWith("Bono de");
        const referralCredits = txns.filter(isReferralCredit).reduce((sum, t) => sum + Number(t.amount), 0);
        const regularCredits = txns.filter(t => t.type === "credit" && !isReferralCredit(t)).reduce((sum, t) => sum + Number(t.amount), 0);
        const debits = txns.filter(t => t.type === "debit").reduce((sum, t) => sum + Number(t.amount), 0);
        const remainingAfterRegular = regularCredits - debits;
        const referralBalance = remainingAfterRegular >= 0 ? referralCredits : Math.max(0, referralCredits + remainingAfterRegular);
        const totalAdded = txns.filter(isReferralCredit).reduce((sum, t) => sum + Number(t.amount), 0);
        const lastTxn = txns.filter(isReferralCredit).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return {
          ...u,
          referralBalance,
          totalAdded,
          lastMovement: lastTxn?.createdAt || null,
        };
      }).filter(u => u.totalAdded > 0 || u.referralBalance > 0).sort((a, b) => b.referralBalance - a.referralBalance);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener saldos" });
    }
  });

  // POST /api/admin/referral/adjust-user-balance — agregar o descontar saldo referido
  app.post("/api/admin/referral/adjust-user-balance", async (req, res) => {
    try {
      const { userId, amount, action, reason } = req.body;
      if (!userId || !amount || !action) return res.status(400).json({ error: "Datos incompletos" });
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: "Monto inválido" });

      if (action === "add") {
        await db.insert(userTransactions).values({
          userId,
          amount: parsedAmount,
          type: "credit",
          description: reason ? `Bono de referido — ${reason}` : "Bono de referido — ajuste admin",
        });
      } else if (action === "deduct") {
        await db.insert(userTransactions).values({
          userId,
          amount: parsedAmount,
          type: "debit",
          description: reason ? `Descuento referido — ${reason}` : "Descuento referido — ajuste admin",
        });
      } else {
        return res.status(400).json({ error: "Acción inválida" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al ajustar saldo" });
    }
  });

  // ==================== END REFERRAL SYSTEM ====================

  async function checkExpiringSubscriptions() {
    try {
      const allSubs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.status, "active"));
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      for (const sub of allSubs) {
        if (!sub.endDate || sub.expirationNotified) continue;
        const endDate = new Date(sub.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3 && daysLeft > 0) {
          const { users } = await import("@shared/models/auth");
          const [user] = await db.select().from(users).where(eq(users.id, sub.userId));
          if (user?.email) {
            const { sendExpirationReminderEmail } = await import("./emailService");
            await sendExpirationReminderEmail(
              user.email,
              user.firstName || "Usuario",
              sub.credentialName || sub.productName,
              endDate.toLocaleDateString("es-GT"),
              daysLeft
            );
            await db.update(userSubscriptions).set({ expirationNotified: true }).where(eq(userSubscriptions.id, sub.id));
            console.log(`Expiration reminder sent for subscription ${sub.id} (${daysLeft} days left)`);
          }
        }

        if (daysLeft <= 0) {
          await db.update(userSubscriptions).set({ status: "expired" }).where(eq(userSubscriptions.id, sub.id));
          console.log(`Subscription ${sub.id} marked as expired`);
        }
      }
    } catch (error) {
      console.error("Expiration check error:", error);
    }
  }

  setInterval(checkExpiringSubscriptions, 60 * 60 * 1000);
  setTimeout(checkExpiringSubscriptions, 10000);

  app.get("/api/admin/discount-codes", async (_req, res) => {
    try {
      const codes = await db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
      res.json(codes);
    } catch { res.status(500).json({ error: "Error al obtener códigos" }); }
  });

  app.post("/api/admin/discount-codes", async (req, res) => {
    try {
      const { code, discountType, discountValue, description, maxUses, isActive } = req.body;
      if (!code || !discountValue) return res.status(400).json({ error: "Código y valor requeridos" });
      const [created] = await db.insert(discountCodes).values({
        code: code.toUpperCase().trim(),
        discountType: discountType || "percentage",
        discountValue: parseInt(discountValue),
        description: description || "",
        maxUses: maxUses ? parseInt(maxUses) : null,
        isActive: isActive !== false,
      }).returning();
      res.json(created);
    } catch (e: any) {
      if (e.code === "23505") return res.status(400).json({ error: "Este código ya existe" });
      res.status(500).json({ error: "Error al crear código" });
    }
  });

  app.patch("/api/admin/discount-codes/:id/toggle", async (req, res) => {
    try {
      const [code] = await db.select().from(discountCodes).where(eq(discountCodes.id, req.params.id));
      if (!code) return res.status(404).json({ error: "No encontrado" });
      const [updated] = await db.update(discountCodes).set({ isActive: !code.isActive }).where(eq(discountCodes.id, req.params.id)).returning();
      res.json(updated);
    } catch { res.status(500).json({ error: "Error al actualizar" }); }
  });

  app.delete("/api/admin/discount-codes/:id", async (req, res) => {
    try {
      await db.delete(discountCodes).where(eq(discountCodes.id, req.params.id));
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "Error al eliminar" }); }
  });

  // ── Product Reviews ──────────────────────────────────────
  function generateBotReviews(productId: string) {
    let h = 0;
    for (let i = 0; i < productId.length; i++) { h = ((h << 5) - h) + productId.charCodeAt(i); h |= 0; }
    let state = Math.abs(h) || 1;
    const rand = (max: number) => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };

    const names = [
      "Kevin M.", "Andrea S.", "Luis G.", "María J.", "Carlos R.",
      "Sofía P.", "Diego H.", "Fernanda L.", "Roberto C.", "Valeria T.",
      "Alejandro B.", "Camila V.", "Jorge F.", "Daniela E.", "Miguel A.",
      "Gabriela N.", "Pablo O.", "Isabella R.", "Andrés K.", "Luciana W.",
      "Fernando Z.", "Natalia Q.", "Sebastián Y.", "Paola X.", "Ricardo U.",
      "Karla M.", "Brandon S.", "Jessica L.", "Emilio R.", "Claudia V.",
      "Marco A.", "Diana R.", "Samuel T.", "Verónica M.", "Óscar F.",
      "Patricia E.", "Gerardo L.", "Rocío S.", "Mauricio B.", "Estefanía C.",
    ];
    const emails = [
      "k***@gmail.com", "and***@hotmail.com", "lu***@gmail.com", "mar***@outlook.com",
      "car***@gmail.com", "sof***@gmail.com", "die***@hotmail.com", "fer***@gmail.com",
      "rob***@yahoo.com", "val***@gmail.com", "ale***@gmail.com", "cam***@hotmail.com",
      "jor***@gmail.com", "dan***@outlook.com", "mig***@gmail.com", "gab***@gmail.com",
      "pab***@hotmail.com", "isa***@gmail.com", "and2***@gmail.com", "luc***@outlook.com",
      "kar***@gmail.com", "bra***@gmail.com", "jes***@hotmail.com", "emi***@gmail.com",
      "cla***@yahoo.com", "mar2***@gmail.com", "dia***@hotmail.com", "sam***@outlook.com",
      "ver***@gmail.com", "osc***@gmail.com", "pat***@hotmail.com", "ger***@gmail.com",
    ];
    const titles = [
      "Muy bueno", "Excelente", "Recomendado", "Muy satisfecho", "Funciona perfecto",
      "Vale la pena", "Lo recomiendo", "Genial", "Muy buena compra", "Sin fallas",
      "Rápido y seguro", "Cumple lo prometido", "Muy contento", "Totalmente recomendado", "Increíble",
      "Buena atención", "Activación inmediata", "Precio justo", "Sin problemas", "Confiable",
    ];
    const comments = [
      "Excelente servicio, llegó al momento y todo funcionó perfecto. Lo recomiendo sin duda.",
      "Muy buena compra, el producto es exactamente lo que necesitaba. Definitivamente volvería a comprar.",
      "Funciona de maravilla, la entrega fue inmediata y el soporte es muy amable cuando lo necesité.",
      "Todo perfecto desde el primer momento. Muy buena plataforma, ya llevo tiempo usando.",
      "Rápido y confiable. Ya llevo varios meses usando el servicio sin haber tenido ningún problema.",
      "Increíble, nunca pensé que fuera tan fácil de activar. El proceso fue rapidísimo y sin complicaciones.",
      "Buena calidad, precio justo y entrega inmediata. Recomendado al 100%, no duden en comprar.",
      "Muy satisfecha con la compra. El servicio funciona sin fallas desde el primer día que lo activé.",
      "Lo compré y en menos de 5 minutos ya lo tenía activo. Excelente atención del equipo de soporte.",
      "Totalmente recomendado. Ya es la tercera vez que compro aquí y siempre llega rápido y bien.",
      "Perfecto, funciona sin problemas. El soporte responde muy rápido cuando les escribes al WhatsApp.",
      "Muy buen producto, la calidad es exactamente la que prometen y la entrega fue prácticamente instantánea.",
      "Me gustó mucho, fácil de activar y el soporte siempre está disponible para cualquier duda que tengas.",
      "Gran experiencia de compra. Todo llegó inmediatamente y sin ningún tipo de complicación.",
      "Excelente plataforma, confiable y rápida. Sin duda volvería a comprar, lo recomiendo a todos.",
      "Todo bien, el producto llegó rápido y funciona perfecto desde el primer día de uso.",
      "Muy buena atención y entrega inmediata. Ya lo recomendé a varios amigos y también les fue bien.",
      "Compré hace unas semanas y sigo usando sin ningún problema. Muy satisfecho con la compra.",
      "Servicio de primera calidad, entrega súper rápida y todo funcionó a la perfección desde el inicio.",
      "Lo recomiendo, es serio y confiable. La activación fue muy sencilla, nada complicado en el proceso.",
      "Muy buena compra, llegó rápido y sin complicaciones. Todo en orden como lo describen.",
      "Ya llevo más de 3 meses usando y nunca he tenido ninguna falla. Muy satisfecho con todo.",
      "La entrega fue prácticamente instantánea. Muy buena plataforma, seguiré comprando aquí.",
      "Todo perfecto, el producto cumple exactamente con lo que se describe. Muy recomendado para todos.",
      "Compré con un poco de duda pero quedé muy sorprendido con la rapidez y la calidad del servicio.",
      "Muy fácil el proceso de compra, y el producto funciona justo como lo describen en la página.",
      "Nunca había comprado aquí antes, pero definitivamente repetiré. Quedé muy satisfecho con todo.",
      "El soporte me respondió en minutos cuando tuve una pregunta. Muy buen servicio al cliente.",
      "Activación inmediata, precio muy justo y todo funcionó a la primera. Lo recomiendo sin duda.",
      "Llevo ya varias compras aquí y siempre ha sido una experiencia excelente, sin ningún problema.",
      "Genial el servicio, llegó antes de lo que esperaba y funciona sin ningún inconveniente hasta ahora.",
      "El precio es muy accesible comparado con otras opciones y la calidad es igual o mejor. Excelente.",
      "Primera vez comprando y la experiencia fue súper buena. El proceso es muy fácil y rápido.",
      "Muy recomendable, el producto llegó de inmediato y el equipo de soporte es muy atento y amable.",
      "Llevo semanas usando el servicio y no ha fallado ni una sola vez. Vale completamente la pena.",
      "Todo transparente y como se describe, sin sorpresas. Muy buena experiencia de principio a fin.",
      "Me lo recomendó un amigo y acertó. Excelente producto, entrega rápida y soporte muy bueno.",
      "Muy buena relación calidad-precio. El producto cumple perfectamente y la activación fue inmediata.",
      "Sin duda uno de los mejores servicios que he encontrado. Rápido, confiable y muy bien atendido.",
      "Ya lo recomendé a mi familia y todos quedamos muy contentos con el servicio y la atención.",
    ];

    const count = 20;
    const now = Date.now();
    const usedNames = new Set<number>();
    const usedComments = new Set<number>();
    const result: any[] = [];

    for (let i = 0; i < count; i++) {
      let ni = rand(names.length);
      let tries = 0;
      while (usedNames.has(ni) && tries++ < 50) ni = rand(names.length);
      usedNames.add(ni);

      let ci = rand(comments.length);
      tries = 0;
      while (usedComments.has(ci) && tries++ < 50) ci = rand(comments.length);
      usedComments.add(ci);

      const ti = rand(titles.length);
      const daysAgo = 2 + rand(300);
      const ratingRoll = rand(20);
      const rating = ratingRoll < 13 ? 5 : ratingRoll < 19 ? 4 : 3;

      result.push({
        id: `bot-${productId}-${i}`,
        productId,
        userId: `bot-${i}`,
        userName: names[ni],
        email: emails[(ni + i) % emails.length],
        rating,
        title: titles[ti],
        comment: comments[ci],
        createdAt: new Date(now - daysAgo * 86400000).toISOString(),
        isBot: true,
      });
    }
    return result;
  }

  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const { productId } = req.params;
      const realReviews = await db.select().from(productReviews).where(eq(productReviews.productId, productId)).orderBy(desc(productReviews.createdAt));

      const [product] = await db.select({ enableBotReviews: products.enableBotReviews }).from(products).where(eq(products.id, productId));
      const botEnabled = !product || product.enableBotReviews !== false;
      const botReviews = botEnabled ? generateBotReviews(productId) : [];

      const allReviews = [...realReviews, ...botReviews];
      const avg = allReviews.length > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;

      // Deterministic sales count per product (always 60+)
      let h = 0;
      for (let i = 0; i < productId.length; i++) { h = ((h << 5) - h) + productId.charCodeAt(i); h |= 0; }
      const salesCount = 60 + (Math.abs(h) % 180);

      return res.json({ reviews: allReviews, avg: Math.round(avg * 10) / 10, total: allReviews.length, salesCount });
    } catch { return res.status(500).json({ error: "Error al obtener reseñas" }); }
  });

  app.post("/api/products/:productId/reviews", isAuthenticated, async (req, res) => {
    try {
      const { productId } = req.params;
      const user = req.user as any;
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Calificación inválida (1-5)" });
      if (!comment || String(comment).trim().length < 5) return res.status(400).json({ error: "El comentario debe tener al menos 5 caracteres" });
      const existing = await db.select().from(productReviews).where(and(eq(productReviews.productId, productId), eq(productReviews.userId, user.id)));
      if (existing.length > 0) return res.status(400).json({ error: "Ya dejaste una reseña para este producto" });
      const owned = await db.select().from(userSubscriptions).where(and(eq(userSubscriptions.userId, user.id), eq(userSubscriptions.productId, productId)));
      if (owned.length === 0) return res.status(403).json({ error: "Solo puedes reseñar productos que hayas comprado" });
      const [review] = await db.insert(productReviews).values({
        productId,
        userId: user.id,
        userName: user.firstName ? `${user.firstName} ${(user.lastName || "").charAt(0)}.`.trim() : user.username || "Usuario",
        rating: Number(rating),
        comment: String(comment).trim(),
      }).returning();
      return res.json(review);
    } catch { return res.status(500).json({ error: "Error al guardar reseña" }); }
  });

  app.post("/api/discount-codes/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Código requerido" });
      const [dc] = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase().trim()));
      if (!dc) return res.status(404).json({ error: "Código no válido" });
      if (!dc.isActive) return res.status(400).json({ error: "Este código está desactivado" });
      if (dc.maxUses !== null && dc.usedCount >= dc.maxUses) return res.status(400).json({ error: "Este código ya alcanzó su límite de usos" });
      res.json({ valid: true, discountType: dc.discountType, discountValue: dc.discountValue, description: dc.description });
    } catch { res.status(500).json({ error: "Error al validar" }); }
  });

  app.post("/api/discount-codes/use", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ ok: true });
      const [dc] = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase().trim()));
      if (dc) {
        await db.update(discountCodes).set({ usedCount: dc.usedCount + 1 }).where(eq(discountCodes.id, dc.id));
      }
      res.json({ ok: true });
    } catch { res.status(500).json({ ok: true }); }
  });

  // ── Mis Clientes (client-to-admin messages) ──────────────────────────

  app.get("/api/client/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const msgs = await db.select().from(clientMessages).where(eq(clientMessages.userId, userId)).orderBy(clientMessages.createdAt);
      res.json(msgs);
    } catch { res.status(500).json({ error: "Error al obtener mensajes" }); }
  });

  app.post("/api/client/messages", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const { message } = req.body;
      if (!message?.trim()) return res.status(400).json({ error: "Mensaje requerido" });
      const userName = user.firstName || user.email?.split("@")[0] || "Usuario";
      const [msg] = await db.insert(clientMessages).values({
        userId: user.id,
        userName,
        userEmail: user.email || "",
        message: message.trim(),
        isAdmin: false,
        readByAdmin: false,
      }).returning();
      res.json(msg);
      sendAdminNotificationEmail(
        "💬 Nuevo mensaje — Mis Clientes",
        `👤 Cliente: ${userName}\n📧 Correo: ${user.email || "(sin correo)"}\n💬 Mensaje: ${message.trim()}\n\n📍 Sección: MIS CLIENTES (no es soporte)`
      ).catch(() => {});
    } catch { res.status(500).json({ error: "Error al enviar mensaje" }); }
  });

  app.get("/api/admin/client-messages", async (_req, res) => {
    try {
      const msgs = await db.select().from(clientMessages).orderBy(desc(clientMessages.createdAt));
      const byUser: Record<string, any> = {};
      for (const m of msgs) {
        if (!byUser[m.userId]) {
          byUser[m.userId] = { userId: m.userId, userName: m.userName, userEmail: m.userEmail, messages: [], unread: 0 };
        }
        byUser[m.userId].messages.unshift(m);
        if (!m.isAdmin && !m.readByAdmin) byUser[m.userId].unread++;
      }
      res.json(Object.values(byUser));
    } catch { res.status(500).json({ error: "Error al obtener mensajes" }); }
  });

  app.post("/api/admin/client-messages/reply", async (req, res) => {
    try {
      const { userId, userName, userEmail, message, agentName, agentImage, imageUrl } = req.body;
      if (!userId || (!message?.trim() && !imageUrl)) return res.status(400).json({ error: "Faltan datos" });
      await db.update(clientMessages).set({ readByAdmin: true }).where(eq(clientMessages.userId, userId));
      const [msg] = await db.insert(clientMessages).values({
        userId,
        userName: userName || "Usuario",
        userEmail: userEmail || "",
        message: message?.trim() || "",
        imageUrl: imageUrl || "",
        isAdmin: true,
        agentName: agentName || "",
        agentImage: agentImage || "",
        readByAdmin: true,
      }).returning();
      res.json(msg);
      if (userEmail && message?.trim()) {
        const firstName = (userName || "Usuario").split(" ")[0];
        sendUserNewAdminMessageEmail(userEmail, firstName, "Soporte PAUDRONIX GT", message.trim()).catch(() => {});
      }
    } catch { res.status(500).json({ error: "Error al responder" }); }
  });

  // ── Support Agents ──────────────────────────────────────────────────

  app.get("/api/support-agents", async (_req, res) => {
    try {
      const agents = await db.select().from(supportAgents).where(eq(supportAgents.isActive, true)).orderBy(supportAgents.createdAt);
      res.json(agents);
    } catch { res.status(500).json({ error: "Error al obtener agentes" }); }
  });

  app.get("/api/admin/support-agents", async (_req, res) => {
    try {
      const agents = await db.select().from(supportAgents).orderBy(supportAgents.createdAt);
      res.json(agents);
    } catch { res.status(500).json({ error: "Error al obtener agentes" }); }
  });

  app.post("/api/admin/support-agents", upload.single("image"), async (req, res) => {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Nombre requerido" });
      const image = req.file ? `/uploads/${req.file.filename}` : "";
      const [agent] = await db.insert(supportAgents).values({ name: name.trim(), image, isActive: true }).returning();
      res.json(agent);
    } catch { res.status(500).json({ error: "Error al crear agente" }); }
  });

  app.put("/api/admin/support-agents/:id", upload.single("image"), async (req, res) => {
    try {
      const { name, isActive } = req.body;
      const updates: any = {};
      if (name) updates.name = name.trim();
      if (isActive !== undefined) updates.isActive = isActive === "true" || isActive === true;
      if (req.file) updates.image = `/uploads/${req.file.filename}`;
      const [agent] = await db.update(supportAgents).set(updates).where(eq(supportAgents.id, req.params.id)).returning();
      res.json(agent);
    } catch { res.status(500).json({ error: "Error al actualizar agente" }); }
  });

  app.delete("/api/admin/support-agents/:id", async (req, res) => {
    try {
      await db.delete(supportAgents).where(eq(supportAgents.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Error al eliminar agente" }); }
  });

  app.post("/api/admin/client-messages/mark-read", async (req, res) => {
    try {
      const { userId } = req.body;
      await db.update(clientMessages).set({ readByAdmin: true }).where(eq(clientMessages.userId, userId));
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "Error" }); }
  });

  // Send backup by email right now (manual trigger)
  app.post("/api/admin/send-backup-email", async (req, res) => {
    try {
      const { runBackupNow } = await import("./backupService");
      await runBackupNow();
      res.json({ success: true });
    } catch (error) {
      console.error("[BACKUP-EMAIL]", error);
      res.status(500).json({ error: "Error al enviar respaldo por correo" });
    }
  });

  // Check if a recipient email exists (for gift page)
  app.get("/api/user/check-recipient", isAuthenticated, async (req, res) => {
    try {
      const email = String(req.query.email || "");
      if (!email) return res.json({ found: false });
      const [recipient] = await db.select({ id: users.id, firstName: users.firstName, username: users.username }).from(users).where(eq(users.email, email));
      if (!recipient) return res.json({ found: false });
      return res.json({ found: true, name: recipient.firstName || recipient.username || "Usuario" });
    } catch {
      return res.json({ found: false });
    }
  });

  // User sends a gift (product subscription) to another user using their saldo
  app.post("/api/user/send-gift", isAuthenticated, async (req, res) => {
    try {
      const sender = req.user as any;
      const { recipientEmail, productId, message, isGift } = req.body;
      if (!recipientEmail || !productId) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      const [product] = await db.select().from(products).where(eq(products.id, productId));
      if (!product) return res.status(404).json({ error: "Producto no encontrado" });

      const [recipient] = await db.select().from(users).where(eq(users.email, recipientEmail));
      if (!recipient) return res.status(404).json({ error: "No existe ningún usuario registrado con ese correo" });
      if (recipient.id === sender.id) return res.status(400).json({ error: "No puedes regalarte a ti mismo" });

      // Check credentials availability BEFORE charging balance
      const availableCredCount = await storage.countAvailableCredentials(product.id);
      const hasPoolCreds = availableCredCount > 0;
      const hasDirectCreds = !!(product.productEmail && product.productPassword);
      if (!hasPoolCreds && !hasDirectCreds) {
        return res.status(400).json({ error: "Este producto no tiene credenciales disponibles en este momento. Contacta al equipo para más información." });
      }

      const txns = await db.select().from(userTransactions).where(eq(userTransactions.userId, sender.id));
      const credits = txns.filter((t: any) => t.type === "credit").reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const debits = txns.filter((t: any) => t.type === "debit").reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const balance = credits - debits;
      const price = Number(product.price);

      if (balance < price) {
        return res.status(400).json({ error: `Saldo insuficiente. Tienes Q${balance.toFixed(2)} y el regalo cuesta Q${price.toFixed(2)}` });
      }

      await db.insert(userTransactions).values({
        userId: sender.id,
        amount: String(price.toFixed(2)),
        type: "debit",
        description: `Regalo enviado: ${product.name} a ${recipientEmail}`,
      });

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Generate unique orderId for this gift so credentials can be claimed properly
      const giftOrderId = `regalo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Claim credentials BEFORE creating subscription (same pattern as wallet purchase)
      let credDelivered = false;
      let deliveredCredEmail = "";
      let deliveredCredPassword = "";
      let deliveredCredInstructions = message || "";

      const claimed = await storage.claimProductCredential(product.id, giftOrderId).catch(() => null);
      if (claimed) {
        deliveredCredEmail = claimed.credEmail;
        deliveredCredPassword = claimed.credPassword;
        deliveredCredInstructions = claimed.credInstructions || message || "";
        credDelivered = true;
      } else if (product.productEmail && product.productPassword) {
        deliveredCredEmail = product.productEmail;
        deliveredCredPassword = product.productPassword;
        deliveredCredInstructions = product.productInstructions || message || "";
        credDelivered = true;
      }

      await db.insert(userSubscriptions).values({
        userId: recipient.id,
        productId: product.id,
        productName: product.name,
        productImage: product.image || "",
        price: price,
        status: "active",
        endDate: endDate,
        credentialEmail: deliveredCredEmail,
        credentialPassword: deliveredCredPassword,
        credentialName: product.name,
        credentialInstructions: deliveredCredInstructions,
        orderId: giftOrderId,
      });

      // Send credentials email if delivered
      if (credDelivered) {
        sendCredentialsEmail(recipient.email, recipient.firstName || recipient.username || "Usuario", product.name, deliveredCredEmail, deliveredCredPassword, deliveredCredInstructions || undefined).catch(() => {});
      }

      const senderName = sender.firstName || sender.username || "Un usuario";
      const recipientName = recipient.firstName || recipient.username || "Usuario";

      await sendGiftRecipientEmail(
        recipient.email,
        recipientName,
        senderName,
        product.name,
        !!isGift,
        message || undefined
      ).catch(() => {});

      await sendGiftSenderConfirmationEmail(
        sender.email,
        senderName,
        recipientName,
        recipient.email,
        product.name,
        !!isGift
      ).catch(() => {});

      return res.json({ success: true, productName: product.name, recipientName, credDelivered });
    } catch (error) {
      console.error("[USER-GIFT]", error);
      return res.status(500).json({ error: "Error al enviar el regalo" });
    }
  });

  // Send gift (saldo or subscription) to a user by email
  app.post("/api/admin/send-gift", async (req, res) => {
    if (!req.isAuthenticated() || ((req.user as any)?.role !== "admin" && !(req.user as any)?.isAdmin)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const { email, giftType, amount, productName, durationDays, message } = req.body;
      if (!email || !giftType) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      const [recipient] = await db.select().from(users).where(eq(users.email, email));
      if (!recipient) {
        return res.status(404).json({ error: "No existe ningún usuario registrado con ese correo" });
      }

      if (giftType === "saldo") {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          return res.status(400).json({ error: "El monto debe ser mayor a 0" });
        }
        await db.insert(userTransactions).values({
          userId: recipient.id,
          amount: String(Number(amount).toFixed(2)),
          type: "credit",
          description: `Regalo de saldo${message ? `: ${message}` : ""}`,
        });
      } else if (giftType === "subscription") {
        if (!productName || !durationDays || Number(durationDays) <= 0) {
          return res.status(400).json({ error: "Faltan datos de la suscripción" });
        }
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + Number(durationDays));

        // Look up the real product by name to get its credentials
        const matchingProducts = await db.select().from(products)
          .where(ilike(products.name, `%${String(productName).trim()}%`))
          .limit(1);
        const realProduct = matchingProducts[0] || null;

        const giftAdminOrderId = `regalo-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Claim credentials from pool or use product direct credentials
        let adminCredEmail = "";
        let adminCredPassword = "";
        let adminCredInstructions = message || "";

        if (realProduct) {
          const poolCred = await storage.claimProductCredential(realProduct.id, giftAdminOrderId).catch(() => null);
          if (poolCred) {
            adminCredEmail = poolCred.credEmail;
            adminCredPassword = poolCred.credPassword;
            adminCredInstructions = poolCred.credInstructions || message || "";
          } else if (realProduct.productEmail && realProduct.productPassword) {
            adminCredEmail = realProduct.productEmail;
            adminCredPassword = realProduct.productPassword;
            adminCredInstructions = realProduct.productInstructions || message || "";
          }
        }

        await db.insert(userSubscriptions).values({
          userId: recipient.id,
          productId: realProduct?.id || "regalo",
          productName: String(productName),
          price: 0,
          status: "active",
          endDate: endDate,
          credentialEmail: adminCredEmail,
          credentialPassword: adminCredPassword,
          credentialName: String(productName),
          credentialInstructions: adminCredInstructions,
          orderId: giftAdminOrderId,
        });

        // Send credentials email immediately if we have them
        if (adminCredEmail && adminCredPassword) {
          sendCredentialsEmail(recipient.email, recipient.firstName || recipient.username || "Usuario", String(productName), adminCredEmail, adminCredPassword, adminCredInstructions || undefined).catch(() => {});
        }
      } else {
        return res.status(400).json({ error: "Tipo de regalo inválido" });
      }

      await sendGiftEmail(
        recipient.email,
        recipient.firstName || recipient.username || "Usuario",
        giftType,
        giftType === "saldo" ? Number(amount) : undefined,
        giftType === "subscription" ? productName : undefined,
        giftType === "subscription" ? Number(durationDays) : undefined,
        message || undefined
      ).catch(() => {});

      return res.json({ success: true, recipientName: recipient.firstName || recipient.username });
    } catch (error) {
      console.error("[GIFT]", error);
      return res.status(500).json({ error: "Error al enviar el regalo" });
    }
  });

  // Full data backup export — streaming, no memory limit, no timeout
  app.get("/api/admin/export-backup", async (req, res) => {
    const filename = `paudronix-backup-completo-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering on VPS
    // Remove timeout so large exports never get cut
    (req.socket as any).setTimeout(0);
    (res as any).setTimeout?.(0);

    // Tables queried ONE BY ONE — only one table in memory at a time
    const TABLES: Array<{ key: string; query: () => Promise<any[]> }> = [
      { key: "users", query: () => db.select({ id: users.id, username: users.username, email: users.email, firstName: users.firstName, lastName: users.lastName, role: users.role, createdAt: users.createdAt, referralCode: users.referralCode, referredBy: users.referredBy, profileImageUrl: users.profileImageUrl, suspended: users.suspended }).from(users) },
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
    ];

    try {
      // Write JSON header
      res.write(`{\n  "exportedAt": "${new Date().toISOString()}",\n  "version": "2.0",\n  "platform": "PAUDRONIX GT",\n  "note": "Incluye todo excepto peliculas (multimedia)",\n  "data": {\n`);

      const counts: Record<string, number> = {};

      for (let i = 0; i < TABLES.length; i++) {
        const { key, query } = TABLES[i];
        const rows = await query();             // one table at a time
        counts[key] = rows.length;
        const isLast = i === TABLES.length - 1;
        res.write(`    "${key}": ${JSON.stringify(rows)}${isLast ? "\n" : ",\n"}`);
      }

      // Write summary at the end and close
      res.write(`  },\n  "summary": ${JSON.stringify(counts)}\n}`);
      res.end();
      console.log(`[BACKUP] Exportación completada. Tablas: ${TABLES.length}, registros totales: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
    } catch (error) {
      console.error("[BACKUP]", error);
      // If headers already sent, just end the connection
      if (!res.headersSent) {
        res.status(500).json({ error: "Error al generar respaldo" });
      } else {
        res.end();
      }
    }
  });

  // Full ZIP backup — database JSON + uploads folder (images/videos)
  // Streams the ZIP directly to the client while building it — avoids nginx timeout
  app.get("/api/admin/export-full-zip", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }
    const os = await import("os");
    const pathMod = await import("path");
    const fs = await import("fs");
    const archiver = (await import("archiver")).default;

    const tmpDir = os.tmpdir();
    const date = new Date().toISOString().slice(0, 10);
    const jsonFile = pathMod.join(tmpDir, `paudronix-db-${date}.json`);

    try {
      (req.socket as any).setTimeout(0);

      // 1. Generate DB JSON and write to temp file
      const { generateBackupData } = await import("./backupService");
      const json = await generateBackupData();
      fs.writeFileSync(jsonFile, json, "utf8");

      // 2. Send headers immediately so nginx sees data flowing right away
      res.setHeader("Content-Disposition", `attachment; filename="paudronix-backup-completo-${date}.zip"`);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no");

      // 3. Pipe archive directly to response — no temp zip file needed
      const archive = archiver("zip", { zlib: { level: 1 } }); // nivel 1 = rápido
      archive.on("error", (err: any) => {
        console.error("[BACKUP-ZIP] Archiver error:", err);
        if (!res.writableEnded) res.end();
      });
      archive.on("finish", () => {
        console.log(`[BACKUP-ZIP] Descarga completada: ${archive.pointer()} bytes`);
        try { fs.unlinkSync(jsonFile); } catch {}
      });

      archive.pipe(res);

      // 4. Add DB JSON
      archive.file(jsonFile, { name: `paudronix-db-${date}.json` });

      // 5. Add uploads folder (all images and videos)
      const uploadsPath = pathMod.resolve("uploads");
      if (fs.existsSync(uploadsPath)) {
        archive.directory(uploadsPath, "uploads");
      }

      archive.finalize();
      console.log(`[BACKUP-ZIP] Generando respaldo completo (BD + imágenes)...`);
    } catch (err: any) {
      console.error("[BACKUP-ZIP] Error:", err);
      try { fs.unlinkSync(jsonFile); } catch {}
      if (!res.headersSent) {
        res.status(500).json({ error: "Error al generar el ZIP." });
      } else {
        res.end();
      }
    }
  });

  // Restore backup — ALL platform data except movies
  app.post("/api/admin/restore-backup", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const backup = req.body;
      if (!backup?.data) {
        return res.status(400).json({ error: "Archivo de respaldo inválido o incompatible" });
      }
      const data = backup.data;

      // Safe date parser — never crashes, returns fallback if invalid
      const safeDate = (val: any, fallback: Date | null = new Date()): Date | null => {
        if (!val) return fallback;
        const d = new Date(val);
        return isNaN(d.getTime()) ? fallback : d;
      };

      const restored: Record<string, number> = {};
      const tableErrors: Record<string, string> = {};

      // ── 1. USERS ──────────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.users) && data.users.length > 0) {
          const rows = data.users.map((u: any) => ({
            id: u.id,
            username: u.username ?? null,
            email: u.email ?? null,
            firstName: u.firstName ?? null,
            lastName: u.lastName ?? null,
            role: u.role ?? "user",
            profileImageUrl: u.profileImageUrl ?? null,
            suspended: u.suspended ?? false,
            referralCode: u.referralCode ?? null,
            referredBy: u.referredBy ?? null,
            createdAt: safeDate(u.createdAt) ?? new Date(),
          }));
          const r = await db.insert(users).values(rows).onConflictDoNothing().returning({ id: users.id });
          restored.users = r.length;
        } else { restored.users = 0; }
      } catch (e: any) { restored.users = 0; tableErrors.users = e?.message; }

      // ── 2. SUSCRIPCIONES ──────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
          const rows = data.subscriptions.map((s: any) => ({
            id: s.id,
            userId: s.userId,
            productId: s.productId,
            productName: s.productName,
            productImage: s.productImage ?? "",
            price: s.price,
            status: s.status ?? "pending",
            startDate: safeDate(s.startDate) ?? new Date(),   // NOT NULL — never null
            endDate: safeDate(s.endDate, null),               // nullable
            credentialEmail: s.credentialEmail ?? "",
            credentialPassword: s.credentialPassword ?? "",
            credentialName: s.credentialName ?? "",
            credentialInstructions: s.credentialInstructions ?? "",
            orderId: s.orderId ?? "",
            renewalCode: s.renewalCode ?? "",
            expirationNotified: s.expirationNotified ?? false,
          }));
          const r = await db.insert(userSubscriptions).values(rows).onConflictDoNothing().returning({ id: userSubscriptions.id });
          restored.subscriptions = r.length;
        } else { restored.subscriptions = 0; }
      } catch (e: any) { restored.subscriptions = 0; tableErrors.subscriptions = e?.message; }

      // ── 3. PEDIDOS ────────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.orders) && data.orders.length > 0) {
          const rows = data.orders.map((o: any) => ({
            id: o.id,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            productId: o.productId,
            productName: o.productName,
            price: o.price,
            date: safeDate(o.date) ?? new Date(),
            status: o.status ?? "pending",
            paymentMethod: o.paymentMethod ?? null,
            deliveryMethod: o.deliveryMethod ?? null,
            deliveryContact: o.deliveryContact ?? null,
            paymentScreenshot: o.paymentScreenshot ?? null,
            customerEmail: o.customerEmail ?? "",
            customerPassword: o.customerPassword ?? "",
            orderRef: o.orderRef ?? null,
            sellerId: o.sellerId ?? null,
            gameCode: o.gameCode ?? "",
          }));
          const r = await db.insert(orders).values(rows).onConflictDoNothing().returning({ id: orders.id });
          restored.orders = r.length;
        } else { restored.orders = 0; }
      } catch (e: any) { restored.orders = 0; tableErrors.orders = e?.message; }

      // ── 4. TRANSACCIONES DE CARTERA ───────────────────────────────────────────
      try {
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          const rows = data.transactions.map((t: any) => ({
            id: t.id,
            userId: t.userId,
            amount: t.amount,
            type: t.type,
            description: t.description ?? "",
            referenceId: t.referenceId ?? "",
            createdAt: safeDate(t.createdAt) ?? new Date(),
          }));
          const r = await db.insert(userTransactions).values(rows).onConflictDoNothing().returning({ id: userTransactions.id });
          restored.transactions = r.length;
        } else { restored.transactions = 0; }
      } catch (e: any) { restored.transactions = 0; tableErrors.transactions = e?.message; }

      // ── 5. PRODUCTOS ──────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.products) && data.products.length > 0) {
          const rows = data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            priceUsd: p.priceUsd ?? null,
            image: p.image,
            description: p.description ?? "",
            whatsappNumber: p.whatsappNumber ?? null,
            isMonthly: p.isMonthly ?? true,
            inStock: p.inStock ?? true,
            showCheckmarks: p.showCheckmarks ?? true,
            showWhatsapp: p.showWhatsapp ?? true,
            showBinance: p.showBinance ?? false,
            showBanrural: p.showBanrural ?? false,
            showBac: p.showBac ?? false,
            showBi: p.showBi ?? false,
            isActive: p.isActive ?? true,
            isPopular: p.isPopular ?? false,
            verifiedSeller: p.verifiedSeller ?? false,
            stockQuantity: p.stockQuantity ?? -1,
            streamUrl: p.streamUrl ?? null,
            binanceData: p.binanceData ?? "",
            binanceName: p.binanceName ?? "",
            binanceInstructions: p.binanceInstructions ?? "",
            banruralData: p.banruralData ?? "",
            banruralName: p.banruralName ?? "",
            banruralInstructions: p.banruralInstructions ?? "",
            bacData: p.bacData ?? "",
            bacName: p.bacName ?? "",
            bacInstructions: p.bacInstructions ?? "",
            biData: p.biData ?? "",
            biName: p.biName ?? "",
            biInstructions: p.biInstructions ?? "",
            paymentMethodIds: p.paymentMethodIds ?? "[]",
            sellerId: p.sellerId ?? null,
            sellerStatus: p.sellerStatus ?? "none",
            sellerEmail: p.sellerEmail ?? null,
            submittedAt: safeDate(p.submittedAt, null),
            productEmail: p.productEmail ?? "",
            productPassword: p.productPassword ?? "",
            productInstructions: p.productInstructions ?? "",
          }));
          const r = await db.insert(products).values(rows).onConflictDoNothing().returning({ id: products.id });
          restored.products = r.length;
        } else { restored.products = 0; }
      } catch (e: any) { restored.products = 0; tableErrors.products = e?.message; }

      // ── 6. JUEGOS ─────────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.games) && data.games.length > 0) {
          const rows = data.games.map((g: any) => ({
            id: g.id,
            title: g.title,
            description: g.description ?? "",
            image: g.image,
            logoImage: g.logoImage ?? "",
            countryImage: g.countryImage ?? "",
            platformName: g.platformName ?? "",
            countryText: g.countryText ?? "",
            platform: g.platform ?? "",
            price: g.price ?? 0,
            link: g.link ?? "",
            isActive: g.isActive ?? true,
            order: g.order ?? 0,
            deliveryType: g.deliveryType ?? "code",
            createdAt: safeDate(g.createdAt) ?? new Date(),
          }));
          const r = await db.insert(games).values(rows).onConflictDoNothing().returning({ id: games.id });
          restored.games = r.length;
        } else { restored.games = 0; }
      } catch (e: any) { restored.games = 0; tableErrors.games = e?.message; }

      // ── 7. RENOVACIONES ───────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.renewals) && data.renewals.length > 0) {
          const rows = data.renewals.map((r: any) => ({
            id: r.id,
            userId: r.userId,
            subscriptionId: r.subscriptionId,
            renewalCode: r.renewalCode,
            paymentScreenshot: r.paymentScreenshot ?? "",
            paymentMethod: r.paymentMethod ?? "screenshot",
            paypalOrderId: r.paypalOrderId ?? "",
            months: r.months ?? 1,
            totalAmount: r.totalAmount ?? 0,
            status: r.status ?? "pending",
            createdAt: safeDate(r.createdAt) ?? new Date(),
            adminNotes: r.adminNotes ?? "",
          }));
          const r2 = await db.insert(renewalRequests).values(rows).onConflictDoNothing().returning({ id: renewalRequests.id });
          restored.renewals = r2.length;
        } else { restored.renewals = 0; }
      } catch (e: any) { restored.renewals = 0; tableErrors.renewals = e?.message; }

      // ── 8. RECARGAS ───────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.recharges) && data.recharges.length > 0) {
          const rows = data.recharges.map((r: any) => ({
            id: r.id,
            userId: r.userId,
            userName: r.userName,
            userEmail: r.userEmail ?? "",
            amount: r.amount,
            paymentMethodId: r.paymentMethodId,
            paymentMethodName: r.paymentMethodName,
            screenshot: r.screenshot ?? "",
            code: r.code,
            status: r.status ?? "pending",
            adminNotes: r.adminNotes ?? "",
            createdAt: safeDate(r.createdAt) ?? new Date(),
            processedAt: safeDate(r.processedAt, null),
          }));
          const r2 = await db.insert(rechargeRequests).values(rows).onConflictDoNothing().returning({ id: rechargeRequests.id });
          restored.recharges = r2.length;
        } else { restored.recharges = 0; }
      } catch (e: any) { restored.recharges = 0; tableErrors.recharges = e?.message; }

      // ── 9. TRANSACCIONES DE REFERIDOS ────────────────────────────────────────
      try {
        if (Array.isArray(data.referralTransactions) && data.referralTransactions.length > 0) {
          const rows = data.referralTransactions.map((t: any) => ({
            id: t.id,
            referrerId: t.referrerId,
            referredUserId: t.referredUserId,
            orderId: t.orderId ?? "",
            type: t.type,
            amount: t.amount,
            createdAt: safeDate(t.createdAt) ?? new Date(),
          }));
          const r = await db.insert(referralTransactions).values(rows).onConflictDoNothing().returning({ id: referralTransactions.id });
          restored.referralTransactions = r.length;
        } else { restored.referralTransactions = 0; }
      } catch (e: any) { restored.referralTransactions = 0; tableErrors.referralTransactions = e?.message; }

      // ── 10. CATEGORÍAS ────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const rows = data.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            label: c.label ?? null,
            image: c.image ?? null,
            streamUrl: c.streamUrl ?? null,
          }));
          const r = await db.insert(categories).values(rows).onConflictDoNothing().returning({ id: categories.id });
          restored.categories = r.length;
        } else { restored.categories = 0; }
      } catch (e: any) { restored.categories = 0; tableErrors.categories = e?.message; }

      // ── 11. NOTICIAS ──────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.news) && data.news.length > 0) {
          const rows = data.news.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            image: n.image ?? null,
            video: n.video ?? null,
            date: safeDate(n.date) ?? new Date(),
          }));
          const r = await db.insert(news).values(rows).onConflictDoNothing().returning({ id: news.id });
          restored.news = r.length;
        } else { restored.news = 0; }
      } catch (e: any) { restored.news = 0; tableErrors.news = e?.message; }

      // ── 12. SECCIONES DESTACADAS ──────────────────────────────────────────────
      try {
        if (Array.isArray(data.featuredSections) && data.featuredSections.length > 0) {
          const rows = data.featuredSections.map((f: any) => ({
            id: f.id,
            title: f.title,
            description: f.description ?? "",
            image: f.image,
            link: f.link ?? "",
            order: f.order ?? 0,
            isActive: f.isActive ?? true,
          }));
          const r = await db.insert(featuredSections).values(rows).onConflictDoNothing().returning({ id: featuredSections.id });
          restored.featuredSections = r.length;
        } else { restored.featuredSections = 0; }
      } catch (e: any) { restored.featuredSections = 0; tableErrors.featuredSections = e?.message; }

      // ── 13. BANNERS ───────────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.banners) && data.banners.length > 0) {
          const rows = data.banners.map((b: any) => ({
            id: b.id,
            image: b.image,
            title: b.title ?? "",
            link: b.link ?? "",
            order: b.order ?? 0,
            isActive: b.isActive ?? true,
            createdAt: safeDate(b.createdAt) ?? new Date(),
          }));
          const r = await db.insert(banners).values(rows).onConflictDoNothing().returning({ id: banners.id });
          restored.banners = r.length;
        } else { restored.banners = 0; }
      } catch (e: any) { restored.banners = 0; tableErrors.banners = e?.message; }

      // ── 14. SUSCRIPTORES ──────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.subscribers) && data.subscribers.length > 0) {
          const rows = data.subscribers.map((s: any) => ({
            id: s.id,
            email: s.email,
            createdAt: safeDate(s.createdAt) ?? new Date(),
          }));
          const r = await db.insert(subscribers).values(rows).onConflictDoNothing().returning({ id: subscribers.id });
          restored.subscribers = r.length;
        } else { restored.subscribers = 0; }
      } catch (e: any) { restored.subscribers = 0; tableErrors.subscribers = e?.message; }

      // ── 15. CANALES DE TV ─────────────────────────────────────────────────────
      try {
        if (Array.isArray(data.tvChannels) && data.tvChannels.length > 0) {
          const rows = data.tvChannels.map((c: any) => ({
            id: c.id,
            name: c.name,
            group: c.group ?? "General",
            logo: c.logo ?? "",
            streamUrl: c.streamUrl,
            isActive: c.isActive ?? true,
            order: c.order ?? 0,
            createdAt: safeDate(c.createdAt) ?? new Date(),
          }));
          const r = await db.insert(tvChannels).values(rows).onConflictDoNothing().returning({ id: tvChannels.id });
          restored.tvChannels = r.length;
        } else { restored.tvChannels = 0; }
      } catch (e: any) { restored.tvChannels = 0; tableErrors.tvChannels = e?.message; }

      // ── 16. TICKETS DE SOPORTE ────────────────────────────────────────────────
      try {
        if (Array.isArray(data.supportTickets) && data.supportTickets.length > 0) {
          const rows = data.supportTickets.map((t: any) => ({
            id: t.id,
            userId: t.userId,
            userName: t.userName,
            userEmail: t.userEmail ?? "",
            subject: t.subject,
            status: t.status ?? "open",
            createdAt: safeDate(t.createdAt) ?? new Date(),
            updatedAt: safeDate(t.updatedAt) ?? new Date(),
          }));
          const r = await db.insert(supportTickets).values(rows).onConflictDoNothing().returning({ id: supportTickets.id });
          restored.supportTickets = r.length;
        } else { restored.supportTickets = 0; }
      } catch (e: any) { restored.supportTickets = 0; tableErrors.supportTickets = e?.message; }

      // ── 17. MENSAJES DE SOPORTE ───────────────────────────────────────────────
      try {
        if (Array.isArray(data.supportMessages) && data.supportMessages.length > 0) {
          const rows = data.supportMessages.map((m: any) => ({
            id: m.id,
            ticketId: m.ticketId,
            senderId: m.senderId,
            senderName: m.senderName,
            isAdmin: m.isAdmin ?? false,
            isSeller: m.isSeller ?? false,
            message: m.message ?? "",
            imageUrl: m.imageUrl ?? "",
            agentIndex: m.agentIndex ?? 0,
            agentImage: m.agentImage ?? "",
            createdAt: safeDate(m.createdAt) ?? new Date(),
          }));
          const r = await db.insert(supportMessages).values(rows).onConflictDoNothing().returning({ id: supportMessages.id });
          restored.supportMessages = r.length;
        } else { restored.supportMessages = 0; }
      } catch (e: any) { restored.supportMessages = 0; tableErrors.supportMessages = e?.message; }

      // ── 18. REPORTES DE PROBLEMAS ─────────────────────────────────────────────
      try {
        if (Array.isArray(data.problemReports) && data.problemReports.length > 0) {
          const rows = data.problemReports.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            userName: p.userName,
            userEmail: p.userEmail ?? "",
            subscriptionId: p.subscriptionId ?? "",
            subscriptionName: p.subscriptionName ?? "",
            description: p.description,
            image: p.image ?? "",
            status: p.status ?? "open",
            adminNotes: p.adminNotes ?? "",
            createdAt: safeDate(p.createdAt) ?? new Date(),
            updatedAt: safeDate(p.updatedAt) ?? new Date(),
          }));
          const r = await db.insert(problemReports).values(rows).onConflictDoNothing().returning({ id: problemReports.id });
          restored.problemReports = r.length;
        } else { restored.problemReports = 0; }
      } catch (e: any) { restored.problemReports = 0; tableErrors.problemReports = e?.message; }

      // ── 19. MENSAJES DE CLIENTES ──────────────────────────────────────────────
      try {
        if (Array.isArray(data.clientMessages) && data.clientMessages.length > 0) {
          const rows = data.clientMessages.map((m: any) => ({
            id: m.id,
            userId: m.userId,
            userName: m.userName,
            userEmail: m.userEmail ?? "",
            message: m.message,
            isAdmin: m.isAdmin ?? false,
            agentName: m.agentName ?? "",
            agentImage: m.agentImage ?? "",
            readByAdmin: m.readByAdmin ?? false,
            createdAt: safeDate(m.createdAt) ?? new Date(),
          }));
          const r = await db.insert(clientMessages).values(rows).onConflictDoNothing().returning({ id: clientMessages.id });
          restored.clientMessages = r.length;
        } else { restored.clientMessages = 0; }
      } catch (e: any) { restored.clientMessages = 0; tableErrors.clientMessages = e?.message; }

      // ── 20. AGENTES DE SOPORTE ────────────────────────────────────────────────
      try {
        if (Array.isArray(data.supportAgents) && data.supportAgents.length > 0) {
          const rows = data.supportAgents.map((a: any) => ({
            id: a.id,
            name: a.name,
            image: a.image ?? "",
            isActive: a.isActive ?? true,
            createdAt: safeDate(a.createdAt) ?? new Date(),
          }));
          const r = await db.insert(supportAgents).values(rows).onConflictDoNothing().returning({ id: supportAgents.id });
          restored.supportAgents = r.length;
        } else { restored.supportAgents = 0; }
      } catch (e: any) { restored.supportAgents = 0; tableErrors.supportAgents = e?.message; }

      // ── 21. TRANSACCIONES DE VENDEDORES ──────────────────────────────────────
      try {
        if (Array.isArray(data.sellerTransactions) && data.sellerTransactions.length > 0) {
          const rows = data.sellerTransactions.map((t: any) => ({
            id: t.id,
            sellerId: t.sellerId,
            orderId: t.orderId,
            amount: t.amount,
            type: t.type,
            description: t.description ?? "",
            createdAt: safeDate(t.createdAt) ?? new Date(),
          }));
          const r = await db.insert(sellerTransactions).values(rows).onConflictDoNothing().returning({ id: sellerTransactions.id });
          restored.sellerTransactions = r.length;
        } else { restored.sellerTransactions = 0; }
      } catch (e: any) { restored.sellerTransactions = 0; tableErrors.sellerTransactions = e?.message; }

      // ── 22. RETIROS DE VENDEDORES ─────────────────────────────────────────────
      try {
        if (Array.isArray(data.sellerWithdrawals) && data.sellerWithdrawals.length > 0) {
          const rows = data.sellerWithdrawals.map((w: any) => ({
            id: w.id,
            sellerId: w.sellerId,
            amount: w.amount,
            paymentMethod: w.paymentMethod,
            accountNumber: w.accountNumber,
            accountName: w.accountName,
            accountType: w.accountType,
            status: w.status ?? "pending",
            createdAt: safeDate(w.createdAt) ?? new Date(),
            processedAt: safeDate(w.processedAt, null),
          }));
          const r = await db.insert(sellerWithdrawals).values(rows).onConflictDoNothing().returning({ id: sellerWithdrawals.id });
          restored.sellerWithdrawals = r.length;
        } else { restored.sellerWithdrawals = 0; }
      } catch (e: any) { restored.sellerWithdrawals = 0; tableErrors.sellerWithdrawals = e?.message; }

      // ── 23. MENSAJES DE VENDEDORES ────────────────────────────────────────────
      try {
        if (Array.isArray(data.sellerMessages) && data.sellerMessages.length > 0) {
          const rows = data.sellerMessages.map((m: any) => ({
            id: m.id,
            productId: m.productId,
            productName: m.productName ?? "",
            sellerId: m.sellerId,
            sellerEmail: m.sellerEmail ?? "",
            senderId: m.senderId,
            senderName: m.senderName,
            isAdmin: m.isAdmin ?? false,
            message: m.message ?? "",
            imageUrl: m.imageUrl ?? "",
            agentIndex: m.agentIndex ?? 0,
            createdAt: safeDate(m.createdAt) ?? new Date(),
          }));
          const r = await db.insert(sellerMessages).values(rows).onConflictDoNothing().returning({ id: sellerMessages.id });
          restored.sellerMessages = r.length;
        } else { restored.sellerMessages = 0; }
      } catch (e: any) { restored.sellerMessages = 0; tableErrors.sellerMessages = e?.message; }

      // ── 24. MÉTODOS DE PAGO PARA RECARGAS ────────────────────────────────────
      try {
        if (Array.isArray(data.rechargePaymentMethods) && data.rechargePaymentMethods.length > 0) {
          const rows = data.rechargePaymentMethods.map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            accountNumber: m.accountNumber ?? "",
            accountName: m.accountName ?? "",
            instructions: m.instructions ?? "",
            logo: m.logo ?? "",
            isActive: m.isActive ?? true,
            order: m.order ?? 0,
            createdAt: safeDate(m.createdAt) ?? new Date(),
          }));
          const r = await db.insert(rechargePaymentMethods).values(rows).onConflictDoNothing().returning({ id: rechargePaymentMethods.id });
          restored.rechargePaymentMethods = r.length;
        } else { restored.rechargePaymentMethods = 0; }
      } catch (e: any) { restored.rechargePaymentMethods = 0; tableErrors.rechargePaymentMethods = e?.message; }

      // ── 25. CÓDIGOS DE DESCUENTO ──────────────────────────────────────────────
      try {
        if (Array.isArray(data.discountCodes) && data.discountCodes.length > 0) {
          const rows = data.discountCodes.map((c: any) => ({
            id: c.id,
            code: c.code,
            discountType: c.discountType ?? "percentage",
            discountValue: c.discountValue,
            description: c.description ?? "",
            maxUses: c.maxUses ?? null,
            usedCount: c.usedCount ?? 0,
            isActive: c.isActive ?? true,
            createdAt: safeDate(c.createdAt) ?? new Date(),
          }));
          const r = await db.insert(discountCodes).values(rows).onConflictDoNothing().returning({ id: discountCodes.id });
          restored.discountCodes = r.length;
        } else { restored.discountCodes = 0; }
      } catch (e: any) { restored.discountCodes = 0; tableErrors.discountCodes = e?.message; }

      // ── 26. CREDENCIALES DE PRODUCTOS ─────────────────────────────────────────
      try {
        if (Array.isArray(data.productCredentials) && data.productCredentials.length > 0) {
          const rows = data.productCredentials.map((c: any) => ({
            id: c.id,
            productId: c.productId,
            credEmail: c.credEmail,
            credPassword: c.credPassword,
            credInstructions: c.credInstructions ?? "",
            isUsed: c.isUsed ?? false,
            usedByOrderId: c.usedByOrderId ?? "",
            assignedAt: safeDate(c.assignedAt, null),
            createdAt: safeDate(c.createdAt) ?? new Date(),
          }));
          const r = await db.insert(productCredentials).values(rows).onConflictDoNothing().returning({ id: productCredentials.id });
          restored.productCredentials = r.length;
        } else { restored.productCredentials = 0; }
      } catch (e: any) { restored.productCredentials = 0; tableErrors.productCredentials = e?.message; }

      // ── 27. CORREOS BLOQUEADOS ────────────────────────────────────────────────
      try {
        if (Array.isArray(data.bannedEmails) && data.bannedEmails.length > 0) {
          const rows = data.bannedEmails.map((b: any) => ({
            id: b.id,
            email: b.email,
            reason: b.reason ?? "",
            bannedAt: safeDate(b.bannedAt) ?? new Date(),
          }));
          const r = await db.insert(bannedEmails).values(rows).onConflictDoNothing().returning({ id: bannedEmails.id });
          restored.bannedEmails = r.length;
        } else { restored.bannedEmails = 0; }
      } catch (e: any) { restored.bannedEmails = 0; tableErrors.bannedEmails = e?.message; }

      // ── 28. PROGRAMA DE REFERIDOS (config) ────────────────────────────────────
      try {
        if (Array.isArray(data.referralProgram) && data.referralProgram.length > 0) {
          const rows = data.referralProgram.map((p: any) => ({
            id: p.id,
            isActive: p.isActive ?? false,
            title: p.title ?? "Programa de Referidos",
            description: p.description ?? "",
            registerBonus: p.registerBonus ?? 1,
            purchaseBonus: p.purchaseBonus ?? 4,
            updatedAt: safeDate(p.updatedAt) ?? new Date(),
          }));
          const r = await db.insert(referralProgram).values(rows).onConflictDoNothing().returning({ id: referralProgram.id });
          restored.referralProgram = r.length;
        } else { restored.referralProgram = 0; }
      } catch (e: any) { restored.referralProgram = 0; tableErrors.referralProgram = e?.message; }

      // ── 29. CONFIGURACIÓN (settings) ──────────────────────────────────────────
      try {
        if (Array.isArray(data.settings) && data.settings.length > 0) {
          const rows = data.settings.map((s: any) => ({
            id: s.id,
            key: s.key,
            value: s.value,
          }));
          const r = await db.insert(settings).values(rows).onConflictDoNothing().returning({ id: settings.id });
          restored.settings = r.length;
        } else { restored.settings = 0; }
      } catch (e: any) { restored.settings = 0; tableErrors.settings = e?.message; }

      if (Object.keys(tableErrors).length > 0) {
        console.warn("[RESTORE] Errores en tablas:", tableErrors);
      }
      console.log("[RESTORE] Restauración completada:", restored);
      res.json({ success: true, restored, tableErrors });
    } catch (error) {
      console.error("[RESTORE]", error);
      res.status(500).json({ error: "Error al restaurar datos. Verifica que el archivo sea un respaldo válido de PAUDRONIX GT." });
    }
  });

  // ── Movies-only backup ──────────────────────────────────────────────────────
  app.get("/api/admin/export-movies-backup", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const movies = await db.select().from(multimedia);
      const backup = {
        exportedAt: new Date().toISOString(),
        type: "movies",
        version: "1.0",
        summary: { total: movies.length, videos: movies.filter(m => m.type === "video").length },
        data: movies,
      };
      const filename = `paudronix-peliculas-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/json");
      res.json(backup);
    } catch (error) {
      console.error("[MOVIES-BACKUP]", error);
      res.status(500).json({ error: "Error al generar respaldo de películas" });
    }
  });

  app.post("/api/admin/send-movies-backup-email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const movies = await db.select().from(multimedia);
      const backup = {
        exportedAt: new Date().toISOString(),
        type: "movies",
        version: "1.0",
        summary: { total: movies.length, videos: movies.filter(m => m.type === "video").length },
        data: movies,
      };
      const { sendBackupEmail } = await import("./backupService");
      const json = JSON.stringify(backup, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      await sendBackupEmail(json, `peliculas-${date}`);
      res.json({ success: true });
    } catch (error) {
      console.error("[MOVIES-BACKUP-EMAIL]", error);
      res.status(500).json({ error: "Error al enviar respaldo por correo" });
    }
  });

  app.post("/api/admin/restore-movies-backup", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const backup = req.body;
      if (!backup?.data || backup?.type !== "movies") {
        return res.status(400).json({ error: "Archivo inválido — debe ser un respaldo de películas de PAUDRONIX GT" });
      }
      const rows: any[] = backup.data;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.json({ restored: 0, skipped: 0 });
      }
      const existing = await db.select({ id: multimedia.id }).from(multimedia);
      const existingIds = new Set(existing.map(m => m.id));
      const toInsert = rows.filter(r => !existingIds.has(r.id));
      if (toInsert.length === 0) {
        return res.json({ restored: 0, skipped: rows.length });
      }
      await db.insert(multimedia).values(toInsert).onConflictDoNothing();
      res.json({ restored: toInsert.length, skipped: rows.length - toInsert.length });
    } catch (error) {
      console.error("[MOVIES-RESTORE]", error);
      res.status(500).json({ error: "Error al restaurar películas" });
    }
  });

  return httpServer;
}
