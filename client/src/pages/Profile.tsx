import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { User as UserIcon, Mail, Calendar, LogOut, Package, Send, Camera, Edit3, AlertTriangle, AlertCircle, X, Check, CheckCircle, ImageIcon, Store, DollarSign, TrendingUp, CreditCard, Upload, ShoppingBag, Wallet, ArrowDownToLine, MessageCircle, RefreshCw, Gift, Loader2, ChevronLeft, Gamepad2, Copy, Shield, Key, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import GiftProductModal from "@/components/GiftProductModal";

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  renewPrice?: number;
  status: string;
  startDate: string;
  endDate: string | null;
  credentialEmail: string;
  credentialPassword: string;
  credentialName: string;
  credentialInstructions: string;
  renewalCode: string;
}

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  sellerStatus: string;
  submittedAt: string;
}

interface SellerTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface SellerWithdrawal {
  id: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

interface SellerDashboard {
  balance: number;
  totalSales: number;
  products: SellerProduct[];
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "subscriptions" | "games" | "fortnite" | "seller" | "sales" | "wallet" | "referidos" | "regalos">("profile");
  const [fortniteOrders, setFortniteOrders] = useState<any[]>([]);
  const [fortniteLoading, setFortniteLoading] = useState(false);
  const [referralProgram, setReferralProgram] = useState<any>(null);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/paypal/config").then(r => r.json()).then(d => { if (d.clientId) setPaypalClientId(d.clientId); }).catch(() => {});
  }, []);

  const [reportSub, setReportSub] = useState<Subscription | null>(null);
  const [reportDesc, setReportDesc] = useState("");
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [sendingReport, setSendingReport] = useState(false);

  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [renewScreenshot, setRenewScreenshot] = useState<File | null>(null);
  const [sendingRenewal, setSendingRenewal] = useState(false);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewPaypalProcessing, setRenewPaypalProcessing] = useState(false);

  const [giftProduct, setGiftProduct] = useState<{ id: string; name: string; image: string; price: number } | null>(null);

  // Regalos tab state
  const [rgiftProducts, setRgiftProducts] = useState<any[]>([]);
  const [rgiftLoadingProducts, setRgiftLoadingProducts] = useState(false);
  const [rgiftLoaded, setRgiftLoaded] = useState(false);
  const [rgiftRecipientEmail, setRgiftRecipientEmail] = useState("");
  const [rgiftRecipientInfo, setRgiftRecipientInfo] = useState<{ found: boolean; name?: string } | null>(null);
  const [rgiftCheckingEmail, setRgiftCheckingEmail] = useState(false);
  const [rgiftSelectedProduct, setRgiftSelectedProduct] = useState<any>(null);
  const [rgiftMessage, setRgiftMessage] = useState("");
  const [rgiftSending, setRgiftSending] = useState(false);
  const [rgiftSuccess, setRgiftSuccess] = useState<{ productName: string; recipientName: string } | null>(null);
  const [rgiftError, setRgiftError] = useState("");
  const [rgiftBuying, setRgiftBuying] = useState<string | null>(null);
  const [rgiftMode, setRgiftMode] = useState<"self" | "other" | null>(null);
  const [rgiftBuySuccess, setRgiftBuySuccess] = useState<string | null>(null);

  const [showBulkRenew, setShowBulkRenew] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkRenewing, setBulkRenewing] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<any>(null);
  const [bulkScreenshot, setBulkScreenshot] = useState<File | null>(null);
  const bulkScreenshotRef = useRef<HTMLInputElement>(null);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);

  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [sellerName, setSellerName] = useState("");
  const [sellerPrice, setSellerPrice] = useState("");
  const [sellerPriceUsd, setSellerPriceUsd] = useState("");
  const [sellerCategory, setSellerCategory] = useState("");
  const [sellerDescription, setSellerDescription] = useState("");
  const [sellerImageUrl, setSellerImageUrl] = useState("");
  const [sellerImageFile, setSellerImageFile] = useState<File | null>(null);
  const [submittingSeller, setSubmittingSeller] = useState(false);
  const sellerImageRef = useRef<HTMLInputElement>(null);

  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<SellerWithdrawal[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [wdAmount, setWdAmount] = useState("");
  const [wdMethod, setWdMethod] = useState("");
  const [wdAccountNumber, setWdAccountNumber] = useState("");
  const [wdAccountName, setWdAccountName] = useState("");
  const [wdAccountType, setWdAccountType] = useState("ahorro");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [rechargeMethods, setRechargeMethods] = useState<any[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<any[]>([]);
  const [selectedRechargeMethod, setSelectedRechargeMethod] = useState<any>(null);
  const walletPollRef = useRef<ReturnType<typeof setInterval>>();
  const prevRechargeStatusesRef = useRef<Record<string, string>>({});
  const [renewSelectedMethod, setRenewSelectedMethod] = useState<any>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeScreenshot, setRechargeScreenshot] = useState<File | null>(null);
  const [submittingRecharge, setSubmittingRecharge] = useState(false);
  const [showRechargeForm, setShowRechargeForm] = useState(false);
  const [lastRechargeCode, setLastRechargeCode] = useState("");
  const [rechargeCode, setRechargeCode] = useState("");

  const [clientMsgs, setClientMsgs] = useState<any[]>([]);
  const [clientMsgInput, setClientMsgInput] = useState("");
  const [sendingClientMsg, setSendingClientMsg] = useState(false);
  const [isAdminTypingClient, setIsAdminTypingClient] = useState(false);
  const [typingClientAgentImage, setTypingClientAgentImage] = useState("");
  const [typingClientAgentName, setTypingClientAgentName] = useState("");
  const [unreadClientMsgs, setUnreadClientMsgs] = useState(0);
  const [chatNewMsgBadge, setChatNewMsgBadge] = useState(0);
  const clientChatContainerRef = useRef<HTMLDivElement>(null);
  const clientMsgCountRef = useRef(0);
  const seenAdminMsgCountRef = useRef(0);
  const chatAdminMsgCountRef = useRef(0);
  const clientTypingRef = useRef<ReturnType<typeof setInterval>>();
  const bgMsgPollRef = useRef<ReturnType<typeof setInterval>>();

  const isChatNearBottom = () => {
    const el = clientChatContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollClientChatToBottom = (force = false) => {
    const el = clientChatContainerRef.current;
    if (!el) return;
    if (force || isChatNearBottom()) el.scrollTop = el.scrollHeight;
  };

  const fetchClientMessages = async (forceScroll = false) => {
    try {
      const res = await fetch("/api/client/messages", { credentials: "include" });
      if (res.ok) {
        const msgs = await res.json();
        clientMsgCountRef.current = msgs.length;
        setClientMsgs(msgs);
        const adminMsgs = msgs.filter((m: any) => m.isAdmin).length;
        const newUnread = Math.max(0, adminMsgs - seenAdminMsgCountRef.current);
        setUnreadClientMsgs(newUnread);
        const newInChat = Math.max(0, adminMsgs - chatAdminMsgCountRef.current);
        if (newInChat > 0 && !isChatNearBottom()) {
          setChatNewMsgBadge(prev => prev + newInChat);
        } else if (isChatNearBottom()) {
          setChatNewMsgBadge(0);
        }
        chatAdminMsgCountRef.current = adminMsgs;
        if (forceScroll) {
          setTimeout(() => scrollClientChatToBottom(true), 50);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      const saved = parseInt(localStorage.getItem("seenAdminMsgCount") || "0", 10);
      seenAdminMsgCountRef.current = saved;
      fetchClientMessages(false);
      bgMsgPollRef.current = setInterval(() => fetchClientMessages(false), 8000);
      return () => clearInterval(bgMsgPollRef.current);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "subscriptions") {
      const currentAdminCount = clientMsgs.filter((m: any) => m.isAdmin).length;
      seenAdminMsgCountRef.current = currentAdminCount;
      chatAdminMsgCountRef.current = currentAdminCount;
      localStorage.setItem("seenAdminMsgCount", String(currentAdminCount));
      setUnreadClientMsgs(0);
      setChatNewMsgBadge(0);
      fetchClientMessages(true);
      const iv = setInterval(() => fetchClientMessages(false), 5000);
      clientTypingRef.current = setInterval(async () => {
        try {
          const r = await fetch("/api/typing/client/me", { credentials: "include" });
          if (r.ok) {
            const d = await r.json();
            setIsAdminTypingClient(d.typing);
            if (d.typing) {
              if (d.agentImage) setTypingClientAgentImage(d.agentImage);
              if (d.agentName) setTypingClientAgentName(d.agentName);
            }
          }
        } catch {}
      }, 1500);
      return () => {
        clearInterval(iv);
        clearInterval(clientTypingRef.current);
      };
    }
  }, [isAuthenticated, activeTab]);

  const sendClientMessage = async () => {
    if (!clientMsgInput.trim()) return;
    const msgText = clientMsgInput.trim();
    setClientMsgInput("");
    const optimistic: any = {
      id: `opt-${Date.now()}`,
      isAdmin: false,
      message: msgText,
      imageUrl: "",
      createdAt: new Date().toISOString(),
    };
    setClientMsgs((prev: any[]) => [...prev, optimistic]);
    setTimeout(() => scrollClientChatToBottom(true), 30);
    setSendingClientMsg(true);
    try {
      const res = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msgText }),
      });
      if (res.ok) {
        await fetchClientMessages(true);
      }
    } catch {}
    setSendingClientMsg(false);
  };

  const generateCodeForMethod = (_methodName: string): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let rand = "";
    for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return rand;
  };
  const rechargeFileRef = useRef<HTMLInputElement>(null);
  const [activeChatProduct, setActiveChatProduct] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatImageUploading, setChatImageUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval>>();
  const chatImageRef = useRef<HTMLInputElement>(null);

  const scrollChatToBottom = (force = false) => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (force || isNearBottom) el.scrollTop = el.scrollHeight;
  };

  const AGENTS = [
    { name: "Sofía García", role: "Asesora de Cuentas", avatar: "https://i.pravatar.cc/80?img=5" },
    { name: "Valentina Reyes", role: "Coordinadora Comercial", avatar: "https://i.pravatar.cc/80?img=44" },
    { name: "Camila Ortiz", role: "Gestora de Vendedores", avatar: "https://i.pravatar.cc/80?img=49" },
    { name: "Sebastián López", role: "Asesor Senior", avatar: "https://i.pravatar.cc/80?img=33" },
    { name: "Mateo Hernández", role: "Ejecutivo de Cuenta", avatar: "https://i.pravatar.cc/80?img=15" },
    { name: "Andrés Morales", role: "Soporte Comercial", avatar: "https://i.pravatar.cc/80?img=57" },
  ];

  const fetchChatMessages = async (productId: string) => {
    try {
      const res = await fetch(`/api/seller/products/${productId}/messages`, { credentials: "include" });
      if (res.ok) {
        const msgs = await res.json();
        setChatMessages(msgs);
      }
    } catch {}
  };

  const openProductChat = async (product: any) => {
    setActiveChatProduct(product);
    setChatInput("");
    setChatMessages([]);
    await fetchChatMessages(product.id);
    setTimeout(() => scrollChatToBottom(true), 100);
  };

  useEffect(() => {
    if (activeChatProduct) {
      chatPollRef.current = setInterval(() => fetchChatMessages(activeChatProduct.id), 5000);
    } else {
      clearInterval(chatPollRef.current);
    }
    return () => clearInterval(chatPollRef.current);
  }, [activeChatProduct?.id]);

  const sendChatMessage = async (imageUrl?: string) => {
    if (!imageUrl && !chatInput.trim()) return;
    if (!activeChatProduct) return;
    const msgText = chatInput;
    if (!imageUrl) setChatInput("");
    const optimistic: any = {
      id: `opt-${Date.now()}`,
      isAdmin: false,
      message: imageUrl ? "" : msgText,
      imageUrl: imageUrl || "",
      createdAt: new Date().toISOString(),
      agentIndex: 0,
    };
    setChatMessages((prev: any[]) => [...prev, optimistic]);
    setTimeout(() => scrollChatToBottom(true), 30);
    setChatSending(true);
    try {
      const res = await fetch(`/api/seller/products/${activeChatProduct.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: imageUrl ? "" : msgText, imageUrl: imageUrl || "" }),
      });
      if (res.ok) {
        await fetchChatMessages(activeChatProduct.id);
        setTimeout(() => scrollChatToBottom(true), 100);
      }
    } catch {} finally { setChatSending(false); }
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatProduct) return;
    setChatImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        await sendChatMessage(data.url);
      }
    } catch {} finally {
      setChatImageUploading(false);
      if (chatImageRef.current) chatImageRef.current.value = "";
    }
  };

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || "");
      setEditLastName(user.lastName || "");
    }
  }, [user]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const loadSellerData = async () => {
    setLoadingDashboard(true);
    try {
      const [dashRes, txRes, wdRes] = await Promise.all([
        fetch("/api/seller/dashboard", { credentials: "include" }),
        fetch("/api/seller/transactions", { credentials: "include" }),
        fetch("/api/seller/withdrawals", { credentials: "include" }),
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (wdRes.ok) setWithdrawals(await wdRes.json());
    } catch {} finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (activeTab === "seller" || activeTab === "sales")) {
      loadSellerData();
    }
  }, [isAuthenticated, activeTab]);

  const loadWalletData = async (silent = false) => {
    try {
      const [balRes, reqRes, methodsRes] = await Promise.all([
        fetch("/api/user/balance", { credentials: "include" }),
        fetch("/api/user/recharge-requests", { credentials: "include" }),
        fetch("/api/recharge-payment-methods/active"),
      ]);
      if (balRes.ok) {
        const data = await balRes.json();
        setWalletBalance(data.regularBalance ?? data.balance);
        setReferralBalance(data.referralBalance ?? 0);
        setWalletTransactions(data.transactions || []);
      }
      if (reqRes.ok) {
        const newRequests: any[] = await reqRes.json();
        if (silent) {
          newRequests.forEach((req: any) => {
            const prev = prevRechargeStatusesRef.current[req.id];
            if (prev && prev !== req.status) {
              if (req.status === "approved") {
                sonnerToast.success(`✅ ¡Tu recarga de Q${req.amount} fue aprobada! El saldo ya está disponible.`, { duration: 8000 });
              } else if (req.status === "rejected") {
                sonnerToast.error(`❌ Tu recarga de Q${req.amount} fue rechazada.${req.adminNotes ? ` Motivo: ${req.adminNotes}` : ""}`, { duration: 8000 });
              }
            }
          });
        }
        const newStatuses: Record<string, string> = {};
        newRequests.forEach((r: any) => { newStatuses[r.id] = r.status; });
        prevRechargeStatusesRef.current = newStatuses;
        setRechargeRequests(newRequests);
      }
      if (methodsRes.ok) setRechargeMethods(await methodsRes.json());
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWalletData(false);
    }
    if (isAuthenticated && activeTab === "wallet") {
      walletPollRef.current = setInterval(() => loadWalletData(true), 5000);
      return () => clearInterval(walletPollRef.current);
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    fetch("/api/referral/program").then(r => r.json()).then(p => setReferralProgram(p)).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "referidos" || tab === "wallet" || tab === "subscriptions" || tab === "games" || tab === "fortnite" || tab === "seller" || tab === "sales" || tab === "regalos" || tab === "profile") {
      setActiveTab(tab as any);
      params.delete("tab");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? "?" + qs : ""));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === "referidos") {
      fetch("/api/referral/my-stats", { credentials: "include" }).then(r => r.json()).then(s => setReferralStats(s)).catch(() => {});
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "fortnite") {
      setFortniteLoading(true);
      fetch("/api/user/fortnite-orders", { credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then(data => setFortniteOrders(Array.isArray(data) ? data : []))
        .catch(() => setFortniteOrders([]))
        .finally(() => setFortniteLoading(false));
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (activeTab === "regalos" && !rgiftLoaded) {
      setRgiftLoadingProducts(true);
      fetch("/api/products")
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data) ? data.filter((p: any) => p.isActive !== false && p.inStock !== false) : [];
          setRgiftProducts(list);
          setRgiftLoaded(true);
        })
        .catch(() => {})
        .finally(() => setRgiftLoadingProducts(false));
    }
  }, [activeTab, rgiftLoaded]);

  useEffect(() => {
    if (renewSub && rechargeMethods.length === 0) {
      fetch("/api/recharge-payment-methods/active")
        .then(r => r.ok ? r.json() : [])
        .then(data => setRechargeMethods(data))
        .catch(() => {});
    }
    if (!renewSub) {
      setRenewSelectedMethod(null);
    }
  }, [renewSub]);

  useEffect(() => {
    if (showBulkRenew) {
      const allIds = subscriptions.filter((s: any) => !s.isGame && s.status === "active").map((s: any) => s.id);
      setBulkSelected(allIds);
    } else {
      setBulkSelected([]);
    }
  }, [showBulkRenew]);

  const handleSubmitRecharge = async () => {
    if (!selectedRechargeMethod) {
      sonnerToast.error("Selecciona un método de pago primero");
      return;
    }
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      sonnerToast.error("Ingresa el monto a recargar");
      return;
    }
    if (!rechargeScreenshot) {
      sonnerToast.error("Sube el comprobante de pago");
      return;
    }
    setSubmittingRecharge(true);
    try {
      const formData = new FormData();
      formData.append("amount", rechargeAmount);
      formData.append("paymentMethodId", selectedRechargeMethod.id);
      formData.append("paymentMethodName", selectedRechargeMethod.name);
      formData.append("screenshot", rechargeScreenshot);
      formData.append("code", rechargeCode);
      const res = await fetch("/api/user/recharge", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLastRechargeCode(data.code);
        setShowRechargeForm(false);
        setRechargeAmount("");
        setRechargeScreenshot(null);
        setSelectedRechargeMethod(null);
        setRechargeCode("");
        sonnerToast.success(`¡Solicitud enviada! Código: ${data.code}`, {
          description: "Tu solicitud fue recibida. El admin la revisará pronto.",
          duration: 8000,
        });
        loadWalletData();
      } else {
        let errMsg = "Error al enviar solicitud";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          errMsg = res.status === 401 ? "Sesión expirada, vuelve a iniciar sesión" : `Error ${res.status}`;
        }
        sonnerToast.error(errMsg);
      }
    } catch (e) {
      sonnerToast.error("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSubmittingRecharge(false);
    }
  };

  const handleResendCredentials = async (subId: string) => {
    setResendingId(subId);
    try {
      const res = await fetch("/api/user/resend-credentials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subId, userId: user?.id }),
      });
      if (res.ok) {
        toast({ title: "Credenciales enviadas a tu correo" });
      } else {
        const data = await res.json();
        toast({ title: data.error || "Error al enviar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al enviar credenciales", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const handleRenewalRequest = async () => {
    if (!renewSub || !renewScreenshot) return;
    setSendingRenewal(true);
    try {
      const total = (renewSub.renewPrice ?? renewSub.price) * renewMonths;
      const formData = new FormData();
      formData.append("subscriptionId", renewSub.id);
      formData.append("renewalCode", renewSub.renewalCode);
      formData.append("paymentScreenshot", renewScreenshot);
      formData.append("paymentMethod", renewSelectedMethod?.name || "comprobante");
      formData.append("paymentMethodId", renewSelectedMethod?.id || "");
      formData.append("months", String(renewMonths));
      formData.append("totalAmount", String(total));
      const res = await fetch("/api/user/renewal-request", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Solicitud de renovacion enviada. Te avisaremos cuando sea aprobada." });
        setRenewSub(null);
        setRenewScreenshot(null);
        setRenewMonths(1);
      } else {
        const data = await res.json();
        toast({ title: data.error || "Error al enviar solicitud", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al enviar solicitud de renovacion", variant: "destructive" });
    } finally {
      setSendingRenewal(false);
    }
  };

  const handleRenewWithWallet = async () => {
    if (!renewSub) return;
    setSendingRenewal(true);
    try {
      const fd = new FormData();
      fd.append("subscriptionIds", JSON.stringify([renewSub.id]));
      fd.append("months", String(renewMonths));
      const res = await fetch("/api/user/bulk-renew", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `✅ Suscripción renovada por ${renewMonths} ${renewMonths === 1 ? "mes" : "meses"} — Q${data.total} debitados de tu saldo` });
      setRenewSub(null);
      setRenewMonths(1);
      fetch("/api/user/subscriptions", { credentials: "include" }).then(r => r.json()).then(d => setSubscriptions(d)).catch(() => {});
      fetch("/api/user/balance", { credentials: "include" }).then(r => r.json()).then(d => { setWalletBalance(d.balance); setReferralBalance(d.referralBalance); }).catch(() => {});
    } catch (err: any) {
      toast({ title: "Error al renovar", description: err.message, variant: "destructive" });
    } finally {
      setSendingRenewal(false);
    }
  };

  const handleRenewAll = async (allIds: string[]) => {
    if (allIds.length === 0) return;
    setBulkRenewing(true);
    try {
      const fd = new FormData();
      fd.append("subscriptionIds", JSON.stringify(allIds));
      const res = await fetch("/api/user/bulk-renew", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `✅ ${data.renewed} suscripción(es) renovada(s) — Q${data.total} debitados de tu saldo` });
      fetch("/api/user/subscriptions", { credentials: "include" }).then(r => r.json()).then(d => setSubscriptions(d)).catch(() => {});
      fetch("/api/user/balance", { credentials: "include" }).then(r => r.json()).then(d => { setWalletBalance(d.balance); setReferralBalance(d.referralBalance); }).catch(() => {});
    } catch (err: any) {
      toast({ title: "Error al renovar todo", description: err.message, variant: "destructive" });
    } finally {
      setBulkRenewing(false);
    }
  };

  const handleRenewalPaypal = async (paypalOrderId: string) => {
    if (!renewSub) return;
    setRenewPaypalProcessing(true);
    try {
      const total = (renewSub.renewPrice ?? renewSub.price) * renewMonths;
      const formData = new FormData();
      formData.append("subscriptionId", renewSub.id);
      formData.append("renewalCode", renewSub.renewalCode);
      formData.append("paymentMethod", "paypal");
      formData.append("paypalOrderId", paypalOrderId);
      formData.append("months", String(renewMonths));
      formData.append("totalAmount", String(total));
      const res = await fetch("/api/user/renewal-request", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Pago con PayPal recibido. Tu renovacion sera procesada pronto." });
        setRenewSub(null);
        setRenewScreenshot(null);
        setRenewMonths(1);
      } else {
        const data = await res.json();
        toast({ title: data.error || "Error al procesar pago", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al enviar solicitud de renovacion", variant: "destructive" });
    } finally {
      setRenewPaypalProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("firstName", editFirstName);
      formData.append("lastName", editLastName);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setIsEditing(false);
        toast({ title: "Perfil actualizado" });
      } else {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);
      formData.append("firstName", user?.firstName || "");
      formData.append("lastName", user?.lastName || "");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Foto actualizada" });
      } else {
        toast({ title: "Error al subir foto", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al subir foto", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReportProblem = async () => {
    if (!reportDesc.trim()) {
      toast({ title: "Escribe una descripcion del problema", variant: "destructive" });
      return;
    }
    setSendingReport(true);
    try {
      const formData = new FormData();
      formData.append("subscriptionId", reportSub?.id || "");
      formData.append("subscriptionName", reportSub?.credentialName || reportSub?.productName || "");
      formData.append("description", reportDesc);
      if (reportImage) formData.append("reportImage", reportImage);
      if (user?.id) formData.append("userId", user.id);
      if (user?.firstName || user?.lastName) formData.append("userName", `${user.firstName || ""} ${user.lastName || ""}`.trim());
      if (user?.email) formData.append("userEmail", user.email);
      const res = await fetch("/api/user/report-problem", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Reporte enviado. Te contactaremos pronto." });
        setReportSub(null);
        setReportDesc("");
        setReportImage(null);
      } else {
        toast({ title: "Error al enviar reporte", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al enviar reporte", variant: "destructive" });
    } finally {
      setSendingReport(false);
    }
  };

  const handleSubmitProduct = async () => {
    if (!sellerName.trim() || !sellerCategory) {
      toast({ title: "Completa el nombre y categoria", variant: "destructive" });
      return;
    }
    setSubmittingSeller(true);
    try {
      let imageUrl = sellerImageUrl;
      if (sellerImageFile) {
        const formData = new FormData();
        formData.append("image", sellerImageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: sellerName,
          price: parseInt(sellerPrice) || 0,
          priceUsd: sellerPriceUsd ? parseInt(sellerPriceUsd) : null,
          image: imageUrl,
          category: sellerCategory,
          description: sellerDescription,
        }),
      });
      if (res.ok) {
        toast({ title: "Producto enviado para revision" });
        setSellerName("");
        setSellerPrice("");
        setSellerPriceUsd("");
        setSellerCategory("");
        setSellerDescription("");
        setSellerImageUrl("");
        setSellerImageFile(null);
        loadSellerData();
      } else {
        const data = await res.json();
        toast({ title: data.error || "Error al enviar producto", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al enviar producto", variant: "destructive" });
    } finally {
      setSubmittingSeller(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wdAmount || !wdMethod || !wdAccountNumber.trim() || !wdAccountName.trim()) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }
    const amount = parseInt(wdAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Monto invalido", variant: "destructive" });
      return;
    }
    if (dashboard && amount > dashboard.balance) {
      toast({ title: "No tienes suficiente saldo", variant: "destructive" });
      return;
    }
    setSubmittingWithdraw(true);
    try {
      const res = await fetch("/api/seller/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount,
          paymentMethod: wdMethod,
          accountNumber: wdAccountNumber,
          accountName: wdAccountName,
          accountType: wdAccountType,
        }),
      });
      if (res.ok) {
        toast({ title: "Solicitud de retiro enviada" });
        setShowWithdrawModal(false);
        setWdAmount("");
        setWdMethod("");
        setWdAccountNumber("");
        setWdAccountName("");
        setWdAccountType("ahorro");
        loadSellerData();
      } else {
        const data = await res.json();
        toast({ title: data.error || "Error al solicitar retiro", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al solicitar retiro", variant: "destructive" });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSubs = () =>
      fetch(`/api/user/subscriptions?_=${Date.now()}`, { credentials: "include", cache: "no-store" as RequestCache })
        .then(res => { if (!res.ok) return []; return res.json(); })
        .then(data => { setSubscriptions(Array.isArray(data) ? data : []); return Array.isArray(data) ? data : []; })
        .catch(() => { setSubscriptions([]); return []; });

    fetchSubs();

    // Refresca cada 3 segundos para detectar cambios del admin casi al instante
    const interval = setInterval(() => { fetchSubs(); }, 3000);

    // Refresca cuando el usuario regresa a la pestaña
    const onVisible = () => { if (document.visibilityState === "visible") fetchSubs(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fetchSubs);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fetchSubs);
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayImage = (user as any).customProfileImage || user.profileImageUrl;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-GT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCountdown = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const diff = end - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  };

  const paymentMethods = [
    { id: "binance", label: "Binance" },
    { id: "banrural", label: "Banrural" },
    { id: "bac", label: "BAC" },
    { id: "bi", label: "Banco Industrial" },
  ];

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        {/* decorative glow blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-indigo-800/20 blur-2xl pointer-events-none" />

        <div className="relative container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* avatar */}
            <div className="relative group shrink-0">
              <div className="p-1 rounded-3xl bg-gradient-to-br from-primary to-indigo-400 shadow-2xl shadow-primary/40">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt=""
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-primary/60" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-1 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"
              >
                <Camera className="w-7 h-7 text-white drop-shadow" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.webp,.avif,.svg,.ico,.bmp,.tiff,.heic,.heif"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* user info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Cuenta Activa
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-slate-400 text-sm flex items-center justify-center sm:justify-start gap-2 mt-2">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {user.email}
              </p>
              {user.createdAt && (
                <p className="text-slate-500 text-xs flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" /> Miembro desde {formatDate(user.createdAt as unknown as string)}
                </p>
              )}
            </div>

            {/* quick stats pill */}
            <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{subscriptions.filter((s: any) => !s.isGame && s.status === "active").length}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Activas</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{dashboard?.totalSales || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ventas</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-amber-400">Q{walletBalance.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Saldo</p>
              </div>
            </div>
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ── TABS ── */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "profile"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === "subscriptions"
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm"
              }`}
            >
              <Package className="w-4 h-4" />
              Suscripciones
              {unreadClientMsgs > 0 && activeTab !== "subscriptions" && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                  {unreadClientMsgs > 9 ? "9+" : unreadClientMsgs}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "games"
                  ? "text-white shadow-lg"
                  : "bg-white text-violet-600 hover:bg-violet-50 border border-violet-200 shadow-sm"
              }`}
              style={activeTab === "games" ? { background: "linear-gradient(135deg, #7c3aed, #4c1d95)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" } : {}}
            >
              <Gamepad2 className="w-4 h-4" />
              Mis Juegos
            </button>
            <button
              onClick={() => setActiveTab("seller")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "seller"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 shadow-sm"
              }`}
            >
              <Store className="w-4 h-4" />
              Vende con Nosotros
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "sales"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                  : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200 shadow-sm"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Mis Ventas
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "wallet"
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-primary hover:bg-indigo-50 border border-indigo-200 shadow-sm"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Recargar Saldo
            </button>
            {referralProgram !== null && (
              <button
                onClick={() => setActiveTab("referidos")}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                  activeTab === "referidos"
                    ? referralProgram?.isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-slate-300 text-slate-500 shadow-sm"
                    : referralProgram?.isActive
                      ? "bg-white text-primary hover:bg-indigo-50 border border-indigo-200 shadow-sm"
                      : "bg-white text-slate-400 border border-slate-200 shadow-sm opacity-60"
                }`}
              >
                🎁 Referidos
              </button>
            )}
            <button
              onClick={() => setActiveTab("regalos")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "regalos"
                  ? "text-white shadow-lg"
                  : "bg-white text-pink-600 hover:bg-pink-50 border border-pink-200 shadow-sm"
              }`}
              style={activeTab === "regalos" ? { background: "linear-gradient(135deg, #ec4899, #be185d)", boxShadow: "0 4px 16px rgba(236,72,153,0.35)" } : {}}
            >
              <Gift className="w-4 h-4" />
              Regalar
            </button>
            <button
              onClick={() => setActiveTab("fortnite")}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "fortnite"
                  ? "text-white shadow-lg"
                  : "bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-sm"
              }`}
              style={activeTab === "fortnite" ? { background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", boxShadow: "0 4px 16px rgba(29,78,216,0.35)" } : {}}
            >
              <span className="font-black text-base leading-none">V</span>
              Fortnite
            </button>
          </div>
        </div>

        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              {/* card header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Información de la Cuenta</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Gestiona tu información personal</p>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-xs font-bold uppercase rounded-xl border-slate-200 hover:border-slate-300">
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditFirstName(user.firstName || ""); setEditLastName(user.lastName || ""); }} className="text-xs font-bold uppercase rounded-xl">
                      <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="text-xs font-bold uppercase rounded-xl">
                      <Check className="w-3.5 h-3.5 mr-1" /> {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                )}
              </div>

              {/* fields */}
              <div className="divide-y divide-slate-50">
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre</span>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        value={editFirstName}
                        onChange={e => setEditFirstName(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        placeholder="Nombre"
                      />
                      <input
                        value={editLastName}
                        onChange={e => setEditLastName(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        placeholder="Apellido"
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-900">{user.firstName || "-"} {user.lastName || ""}</span>
                  )}
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                  <span className="text-sm font-bold text-slate-900">{user.email || "-"}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo de cuenta</span>
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full px-3 py-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Foto de perfil</span>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold rounded-xl border-slate-200">
                    <Camera className="w-3.5 h-3.5 mr-1" /> Cambiar foto
                  </Button>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Suscripciones activas</span>
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-3 bg-primary/10 text-primary text-sm font-black rounded-full">
                    {subscriptions.filter((s: any) => !s.isGame && s.status === "active").length}
                  </span>
                </div>
              </div>

              {/* footer */}
              <div className="px-6 py-5 bg-slate-50/80 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold uppercase text-xs tracking-wider rounded-xl"
                  onClick={() => { localStorage.removeItem("uid"); window.location.href = "/api/logout"; }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div>
            {subscriptions.filter((s: any) => !s.isGame).length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Package className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Sin suscripciones</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Aún no tienes suscripciones activas. Explora el catálogo para encontrar las mejores ofertas.
                </p>
                <Button onClick={() => setLocation("/")} className="mt-6 font-bold uppercase text-xs tracking-wider rounded-2xl px-8 shadow-lg shadow-primary/25">
                  Ver Catálogo
                </Button>
              </div>
            ) : (
              <>
              {subscriptions.filter((s: any) => !s.isGame).length > 0 && (
                <button
                  onClick={() => setShowBulkRenew(true)}
                  className="w-full mb-6 py-5 rounded-3xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl bg-gradient-to-r from-[#6366f1] to-indigo-500 hover:from-[#4f46e5] hover:to-indigo-600 text-white shadow-[#6366f1]/30"
                >
                  <RefreshCw className="w-5 h-5" />
                  Renovar Suscripciones Seleccionadas
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {subscriptions.filter((s: any) => !s.isGame).map((sub) => {
                  const isActive = sub.status === "active";
                  const isExpired = sub.status === "expired";
                  const isPending = sub.status === "pending";
                  return (
                    <div key={sub.id} className={`bg-white rounded-3xl border shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative ${isExpired ? "border-red-200 opacity-80" : "border-slate-100"}`}>

                      {/* SELLO EXPIRADA */}
                      {isExpired && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                          <div className="relative flex items-center justify-center" style={{ transform: "rotate(-15deg)" }}>
                            <div className="border-[3px] border-red-600 rounded-full w-44 h-44 absolute opacity-70" />
                            <div className="border-[3px] border-red-600 rounded-full w-36 h-36 absolute opacity-50" />
                            <div
                              className="px-5 py-2 border-[3px] border-red-600 rounded-lg text-red-600 font-black text-2xl tracking-[0.3em] uppercase select-none"
                              style={{ fontFamily: "serif", textShadow: "0 0 1px #dc2626", letterSpacing: "0.3em", boxShadow: "inset 0 0 8px rgba(220,38,38,0.15)" }}
                            >
                              EXPIRADA
                            </div>
                          </div>
                        </div>
                      )}

                      {/* image */}
                      {sub.productImage && (
                        <div className="relative aspect-[16/7] bg-slate-900 overflow-hidden">
                          <img src={sub.productImage} alt={sub.productName} className="w-full h-full object-cover opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                            <h3 className="font-black text-white text-lg uppercase tracking-tight drop-shadow leading-tight">{sub.credentialName || sub.productName}</h3>
                            <span className={`shrink-0 ml-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg ${
                              isActive ? "bg-emerald-500 text-white" :
                              isExpired ? "bg-red-500 text-white" :
                              "bg-amber-400 text-white"
                            }`}>
                              {isActive ? "✓ Activa" : isExpired ? "Expirada" : "⏳ Pendiente"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* no image header */}
                      {!sub.productImage && (
                        <div className={`px-5 pt-5 pb-3 flex items-start justify-between ${
                          isActive ? "bg-gradient-to-r from-emerald-50 to-white" :
                          isExpired ? "bg-gradient-to-r from-red-50 to-white" :
                          "bg-gradient-to-r from-amber-50 to-white"
                        }`}>
                          <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">{sub.credentialName || sub.productName}</h3>
                          <span className={`shrink-0 ml-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${
                            isActive ? "bg-emerald-500 text-white" :
                            isExpired ? "bg-red-500 text-white" :
                            "bg-amber-400 text-white"
                          }`}>
                            {isActive ? "✓ Activa" : isExpired ? "Expirada" : "⏳ Pendiente"}
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col gap-4">

                        {/* Datos que el usuario envió (para productos que requieren email del cliente) */}
                        {sub.requiresCustomerEmail && sub.submittedEmail && (
                          <div className="rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm">
                            <div className="bg-gradient-to-r from-primary to-indigo-500 px-4 py-2.5 flex items-center gap-2">
                              <UserIcon className="w-3.5 h-3.5 text-white shrink-0" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-white">
                                {sub.customerEmailLabel || "Datos enviados al activar"}
                              </p>
                            </div>
                            <div className="bg-white divide-y divide-slate-50">
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo</span>
                                <span className="font-black text-slate-900 text-sm font-mono">{sub.submittedEmail}</span>
                              </div>
                              {sub.submittedPassword && (
                                <div className="flex items-center justify-between px-4 py-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</span>
                                  <span className="font-black text-slate-900 text-sm font-mono">{sub.submittedPassword}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ACTIVE without credentials yet */}
                        {isActive && !sub.credentialEmail && (
                          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-base">⏳</span>
                            </div>
                            <div>
                              <p className="text-sm font-black text-amber-800">Credenciales en proceso</p>
                              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Tu pago fue recibido. El equipo asignará tus credenciales de acceso muy pronto. Recibirás un correo cuando estén listas.</p>
                            </div>
                          </div>
                        )}

                        {/* ACTIVE with credentials */}
                        {isActive && sub.credentialEmail && (
                          <>
                            {/* credentials */}
                            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                              <div className="bg-slate-800 px-4 py-2.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Credenciales de acceso</p>
                              </div>
                              <div className="divide-y divide-slate-50">
                                <div className="flex items-center justify-between px-4 py-3.5">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo</span>
                                  <span className="font-black text-slate-900 text-sm font-mono">{sub.credentialEmail}</span>
                                </div>
                                <div className="flex items-center justify-between px-4 py-3.5">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</span>
                                  <span className="font-black text-slate-900 text-sm font-mono">{sub.credentialPassword}</span>
                                </div>
                                {sub.endDate && (
                                  <div className="flex items-center justify-between px-4 py-3.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vence</span>
                                    <span className={`text-sm font-black ${new Date(sub.endDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? "text-red-600" : "text-slate-700"}`}>{formatDate(sub.endDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* info when no endDate yet (admin must set it) */}
                            {!sub.endDate && sub.status === "active" && (
                              <div className="w-full rounded-2xl p-4 bg-amber-50 border-2 border-amber-200 text-center space-y-2">
                                <p className="text-sm font-black text-amber-700 uppercase tracking-tight">⏳ Pendiente de programar fecha</p>
                                <p className="text-xs text-amber-600">El equipo de Paudronix configurará tu fecha de vencimiento pronto.</p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = await fetch(`/api/user/subscriptions?ts=${Date.now()}`, { credentials: "include", cache: "no-store" });
                                    const data = await res.json().catch(() => []);
                                    setSubscriptions(Array.isArray(data) ? data : []);
                                    toast({ title: "Datos actualizados" });
                                  }}
                                  className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-xs tracking-wider py-2.5 rounded-xl transition-colors"
                                >
                                  🔄 Actualizar AHORA
                                </button>
                              </div>
                            )}

                            {/* countdown */}
                            {sub.endDate && (() => {
                              const countdown = getCountdown(sub.endDate);
                              const isUrgent = new Date(sub.endDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                              if (!countdown) return null;
                              return (
                                <div className={`rounded-2xl p-4 ${isUrgent ? "bg-red-50 border border-red-200" : "bg-slate-900 border border-slate-700"}`}>
                                  <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${isUrgent ? "text-red-400" : "text-slate-400"}`}>Tiempo restante</p>
                                  <div className="flex gap-2 justify-center">
                                    {[{ val: countdown.days, label: "días" }, { val: countdown.hours, label: "hrs" }, { val: countdown.minutes, label: "min" }, { val: countdown.seconds, label: "seg" }].map((item, i, arr) => (
                                      <div key={item.label} className="flex items-center gap-2">
                                        <div className="text-center">
                                          <div className={`text-2xl font-black tabular-nums leading-none ${isUrgent ? "text-red-600" : "text-white"}`}>{String(item.val).padStart(2, "0")}</div>
                                          <div className={`text-[9px] font-bold uppercase mt-1 ${isUrgent ? "text-red-400" : "text-slate-400"}`}>{item.label}</div>
                                        </div>
                                        {i < arr.length - 1 && <div className={`text-xl font-black pb-4 ${isUrgent ? "text-red-300" : "text-slate-500"}`}>:</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* instructions */}
                            {sub.credentialInstructions && (
                              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Instrucciones</p>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{sub.credentialInstructions}</p>
                              </div>
                            )}

                            {/* renewal code */}
                            {sub.renewalCode && (
                              <div className="bg-gradient-to-r from-primary/10 to-indigo-50 border border-primary/20 rounded-2xl px-4 py-3">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Código de Renovación</p>
                                <p className="text-base font-mono font-black text-primary tracking-widest">{sub.renewalCode}</p>
                              </div>
                            )}

                            {/* action buttons */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full rounded-2xl text-xs font-bold border-slate-200 h-11"
                              onClick={() => handleResendCredentials(sub.id)}
                              disabled={resendingId === sub.id}
                            >
                              <Send className="w-3.5 h-3.5 mr-2" />
                              {resendingId === sub.id ? "Enviando..." : "Reenviar credenciales a mi correo"}
                            </Button>
                          </>
                        )}

                        {/* EXPIRED */}
                        {isExpired && (
                          <div className="space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">
                              <p className="text-sm font-black text-red-600">Tu suscripción ha expirado</p>
                            </div>
                          </div>
                        )}

                        {/* PENDING */}
                        {isPending && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                            <p className="text-sm font-bold text-amber-700 leading-relaxed">
                              ⏳ Tu pedido está siendo procesado. En unos minutos recibirás tus credenciales aquí.
                            </p>
                          </div>
                        )}

                        {/* price + actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-auto">
                          <div>
                            <span className="text-2xl font-black text-primary">Q{sub.price}</span>
                            <span className="text-xs text-slate-400 ml-2">{formatDate(sub.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const now = new Date();
                              const end = sub.endDate ? new Date(sub.endDate) : null;
                              const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                              const isExpiredSub = sub.status === "expired";
                              const canRenew = !isExpiredSub && daysLeft !== null && daysLeft <= 2;
                              const tooEarly = !isExpiredSub && daysLeft !== null && daysLeft > 2;
                              if (isExpiredSub) {
                                return (
                                  <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                    ❌ Expirada
                                  </span>
                                );
                              }
                              if (tooEarly) {
                                return (
                                  <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" title={`Podrás renovar cuando falten 2 días`}>
                                    🔒 {daysLeft}d restantes
                                  </span>
                                );
                              }
                              return (
                                <Button
                                  size="sm"
                                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white"
                                  onClick={() => { setRenewSub(sub); setRenewMonths(1); setRenewScreenshot(null); setRenewSelectedMethod(null); }}
                                >
                                  🔄 Renovar
                                </Button>
                              );
                            })()}
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              onClick={() => { setReportSub(sub); setReportDesc(""); setReportImage(null); }}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1.5" />
                              Reportar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}

            {/* Soporte directo */}
            <div className="mt-8 bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-purple-600 to-violet-600 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white">Soporte Directo</h3>
                  <p className="text-xs text-purple-100">Escríbenos y te respondemos a la brevedad</p>
                </div>
              </div>
              <div className="relative">
              {chatNewMsgBadge > 0 && (
                <button
                  onClick={() => { scrollClientChatToBottom(true); setChatNewMsgBadge(0); }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-black shadow-lg animate-bounce"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                >
                  <span>↓ {chatNewMsgBadge} mensaje{chatNewMsgBadge > 1 ? "s" : ""} nuevo{chatNewMsgBadge > 1 ? "s" : ""}</span>
                </button>
              )}
              <div
                ref={clientChatContainerRef}
                className="h-64 overflow-y-auto p-4 space-y-3 bg-purple-50/30"
                onScroll={() => { if (isChatNearBottom()) setChatNewMsgBadge(0); }}
              >
                {clientMsgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-purple-300 gap-2">
                    <MessageCircle className="w-8 h-8 opacity-40" />
                    <p className="text-xs font-bold uppercase">Aún no hay mensajes</p>
                  </div>
                )}
                {clientMsgs.map((m: any) => (
                  <div key={m.id} className={`flex items-end gap-2 ${m.isAdmin ? "justify-start" : "justify-end"}`}>
                    {m.isAdmin && (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 shrink-0 border-2 border-purple-200 shadow-sm">
                        {m.agentImage ? (
                          <img src={m.agentImage} alt={m.agentName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-purple-400" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[72%] rounded-2xl overflow-hidden shadow-sm ${
                      m.isAdmin
                        ? "bg-white border border-purple-100 text-slate-800 rounded-tl-sm"
                        : "bg-gradient-to-br from-purple-600 to-violet-600 text-white rounded-tr-sm"
                    }`}>
                      {m.imageUrl ? (
                        <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={m.imageUrl} alt="imagen" className="max-w-full max-h-40 object-cover" />
                        </a>
                      ) : (
                        <div className="px-4 py-2.5">
                          {m.isAdmin && <p className="text-[10px] font-black text-purple-500 uppercase mb-1">{m.agentName || "Soporte"}</p>}
                          <p className="leading-snug text-sm font-medium">{m.message}</p>
                        </div>
                      )}
                      <p className={`text-[9px] pb-2 px-3 ${m.isAdmin ? "text-slate-400" : "text-purple-200"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {isAdminTypingClient && (() => {
                  const lastAdminClient = [...clientMsgs].reverse().find((m: any) => m.isAdmin);
                  const resolvedClientAvatar = typingClientAgentImage || lastAdminClient?.agentImage || null;
                  return (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 shrink-0 border-2 border-purple-200 shadow-sm flex items-center justify-center">
                      {resolvedClientAvatar
                        ? <img src={resolvedClientAvatar} alt={typingClientAgentName || "Soporte"} className="w-full h-full object-cover" />
                        : <MessageCircle className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </div>
              </div>
              <div className="p-4 border-t border-purple-100 flex gap-2 bg-white">
                <input
                  type="text"
                  value={clientMsgInput}
                  onChange={e => setClientMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendClientMessage(); } }}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 border border-purple-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  disabled={sendingClientMsg}
                />
                <button
                  onClick={sendClientMessage}
                  disabled={sendingClientMsg || !clientMsgInput.trim()}
                  className="bg-gradient-to-br from-purple-600 to-violet-600 hover:opacity-90 disabled:opacity-40 text-white rounded-xl px-4 py-2 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "games" && (
          <div>
            {subscriptions.filter((s: any) => s.isGame).length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner" style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>
                  <Gamepad2 className="w-12 h-12 text-violet-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Sin juegos</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Aún no has adquirido ningún juego. Visita el catálogo para encontrar los mejores títulos.
                </p>
                <Button onClick={() => setLocation("/")} className="mt-6 font-bold uppercase text-xs tracking-wider rounded-2xl px-8" style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)" }}>
                  Ver Catálogo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {subscriptions.filter((s: any) => s.isGame).map((sub: any) => {
                  const isActive = sub.status === "active";
                  const isExpired = sub.status === "expired";
                  const isCode = sub.credentialEmail && !sub.credentialPassword;
                  const copyToClipboard = (text: string, label: string, key: string, inputRef?: HTMLInputElement | null) => {
                    const markCopied = () => {
                      setCopiedKey(key);
                      setTimeout(() => setCopiedKey(null), 2000);
                      toast.success(`${label} copiado ✓`);
                    };
                    const doFallback = () => {
                      if (inputRef) { inputRef.select(); inputRef.setSelectionRange(0, 99999); }
                      try { document.execCommand("copy"); markCopied(); } catch { toast.error("Selecciona el texto manualmente y presiona Ctrl+C"); }
                    };
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(text).then(markCopied).catch(doFallback);
                    } else { doFallback(); }
                  };
                  return (
                    <div key={sub.id} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col" style={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {/* IMAGEN / HEADER */}
                      {sub.productImage ? (
                        <div className="relative overflow-hidden" style={{ aspectRatio: "16/7" }}>
                          <img src={sub.productImage} alt={sub.productName} className="w-full h-full object-cover" style={{ filter: "brightness(0.75)" }} />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,15,26,1) 0%, rgba(15,15,26,0.4) 50%, transparent 100%)" }} />
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4c1d95)" }}>
                                <Gamepad2 className="w-3.5 h-3.5 text-white" />
                              </div>
                              <h3 className="font-black text-white text-xl uppercase tracking-tighter drop-shadow-lg">{sub.credentialName || sub.productName}</h3>
                            </div>
                            <span className={`shrink-0 text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg ${isActive ? "bg-emerald-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-amber-400 text-white"}`}>
                              {isActive ? "✓ Activo" : isExpired ? "Expirado" : "⏳ Pendiente"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#1a0a2e,#0f0f1a)" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#4c1d95)" }}>
                              <Gamepad2 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-black text-white text-xl uppercase tracking-tight">{sub.credentialName || sub.productName}</h3>
                          </div>
                          <span className={`shrink-0 text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${isActive ? "bg-emerald-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-amber-400 text-white"}`}>
                            {isActive ? "✓ Activo" : isExpired ? "Expirado" : "⏳ Pendiente"}
                          </span>
                        </div>
                      )}

                      {/* BODY */}
                      <div className="p-5 flex-1 flex flex-col gap-3" style={{ background: "#0f0f1a" }}>

                        {/* Descripción del juego */}
                        {sub.productDescription && (
                          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{sub.productDescription}</p>
                        )}

                        {/* Pendiente de credenciales */}
                        {isActive && !sub.credentialEmail && (
                          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                            <span className="text-xl mt-0.5">⏳</span>
                            <div>
                              <p className="text-sm font-black text-amber-400">En proceso</p>
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>Tu pago fue recibido. El equipo asignará tus datos muy pronto.</p>
                            </div>
                          </div>
                        )}

                        {/* Credenciales / Código */}
                        {isActive && sub.credentialEmail && (
                          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
                            {/* Header de la caja */}
                            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(76,29,149,0.25))" }}>
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(124,58,237,0.5)" }}>
                                {isCode ? <Key className="w-3 h-3 text-violet-300" /> : <Shield className="w-3 h-3 text-violet-300" />}
                              </div>
                              <p className="text-[11px] font-black text-violet-300 uppercase tracking-widest">
                                {isCode ? "Código de activación" : "Credenciales de acceso"}
                              </p>
                            </div>

                            {/* Filas de datos */}
                            <div className="divide-y" style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.15)" }}>
                              {/* Usuario / Código */}
                              <div className="px-4 py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{isCode ? "Código" : "Usuario"}</p>
                                  <input
                                    readOnly
                                    value={sub.credentialEmail}
                                    id={`cred-email-${sub.id}`}
                                    onClick={e => (e.target as HTMLInputElement).select()}
                                    className="w-full font-black font-mono text-sm text-white bg-transparent outline-none border-none cursor-pointer"
                                    style={{ caretColor: "transparent" }}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const inp = document.getElementById(`cred-email-${sub.id}`) as HTMLInputElement;
                                    copyToClipboard(sub.credentialEmail, isCode ? "Código" : "Usuario", `email-${sub.id}`, inp);
                                  }}
                                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                  style={{ background: copiedKey === `email-${sub.id}` ? "rgba(34,197,94,0.3)" : "rgba(124,58,237,0.3)", border: `1px solid ${copiedKey === `email-${sub.id}` ? "rgba(34,197,94,0.5)" : "rgba(124,58,237,0.4)"}` }}
                                  title="Copiar"
                                >
                                  {copiedKey === `email-${sub.id}`
                                    ? <Check className="w-3.5 h-3.5 text-green-400" />
                                    : <Copy className="w-3.5 h-3.5 text-violet-300" />}
                                </button>
                              </div>

                              {/* Contraseña */}
                              {sub.credentialPassword && (
                                <div className="px-4 py-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Contraseña</p>
                                    <input
                                      readOnly
                                      value={sub.credentialPassword}
                                      id={`cred-pass-${sub.id}`}
                                      onClick={e => (e.target as HTMLInputElement).select()}
                                      className="w-full font-black text-sm text-white bg-transparent outline-none border-none cursor-pointer"
                                      style={{ caretColor: "transparent" }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const inp = document.getElementById(`cred-pass-${sub.id}`) as HTMLInputElement;
                                      copyToClipboard(sub.credentialPassword, "Contraseña", `pass-${sub.id}`, inp);
                                    }}
                                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                    style={{ background: copiedKey === `pass-${sub.id}` ? "rgba(34,197,94,0.3)" : "rgba(124,58,237,0.3)", border: `1px solid ${copiedKey === `pass-${sub.id}` ? "rgba(34,197,94,0.5)" : "rgba(124,58,237,0.4)"}` }}
                                    title="Copiar"
                                  >
                                    {copiedKey === `pass-${sub.id}`
                                      ? <Check className="w-3.5 h-3.5 text-green-400" />
                                      : <Copy className="w-3.5 h-3.5 text-violet-300" />}
                                  </button>
                                </div>
                              )}

                              {/* Instrucciones */}
                              {sub.credentialInstructions && (
                                <div className="px-4 py-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Instrucciones</p>
                                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{sub.credentialInstructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs font-bold mt-auto pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}>
                          <span className="text-violet-400 font-black">Q{Number(sub.price).toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            {sub.endDate && <span>Vence: {new Date(sub.endDate).toLocaleDateString("es-GT")}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "seller" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Vende con Nosotros</h2>
                    <p className="text-sm text-slate-500">Sube tu producto y lo publicaremos en la tienda</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pt-5 pb-0">
                <div className="bg-slate-900 rounded-xl p-5 text-white">
                  <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-green-400" /> Como funciona
                  </h3>
                  <div className="space-y-4 text-[13px] leading-relaxed text-slate-300">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</div>
                      <p>Sube los datos de tu producto y nuestro equipo de soporte lo revisará antes de publicarlo.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</div>
                      <p>Una vez aprobado y publicado, cuando se venda recibirás el monto de tu venta en tu perfil, en la sección <span className="text-green-400 font-bold">"Mis Ventas"</span>.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</div>
                      <p>Desde ahí podrás solicitar el retiro a tu cuenta de banco (Binance, Banrural, BAC o Banco Industrial).</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">4</div>
                      <p>Al retirar todas tus ganancias se cobrará un pequeño porcentaje por los servicios prestados de la plataforma, garantizando seguridad y rapidez.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">5</div>
                      <p>Los retiros se pagan en <span className="text-green-400 font-bold underline">menos de 30 minutos</span> o incluso antes, según el volumen de pedidos que tengamos.</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic mt-4 pt-4 border-t border-slate-700">Al enviar tu producto, aceptas nuestras políticas y términos de privacidad de PAUDRONIX GT.</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Nombre del Producto</label>
                  <input
                    value={sellerName}
                    onChange={e => setSellerName(e.target.value)}
                    placeholder="Ej: Netflix Premium 1 Mes"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Precio (Quetzales)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Q</span>
                      <input
                        type="number"
                        value={sellerPrice}
                        onChange={e => setSellerPrice(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Precio (Dólares, opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                      <input
                        type="number"
                        value={sellerPriceUsd}
                        onChange={e => setSellerPriceUsd(e.target.value)}
                        placeholder="Opcional"
                        min="0"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Categoria</label>
                    <select
                      value={sellerCategory}
                      onChange={e => setSellerCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">Seleccionar</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Imagen (Link o Subir)</label>
                  <div className="flex gap-2">
                    <input
                      value={sellerImageUrl}
                      onChange={e => { setSellerImageUrl(e.target.value); setSellerImageFile(null); }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => sellerImageRef.current?.click()}
                      className="px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                    </button>
                    <input
                      ref={sellerImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSellerImageFile(f);
                          setSellerImageUrl(f.name);
                        }
                      }}
                    />
                  </div>
                  {sellerImageFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={URL.createObjectURL(sellerImageFile)} alt="" className="h-16 rounded-lg object-cover" />
                      <button onClick={() => { setSellerImageFile(null); setSellerImageUrl(""); }} className="text-red-500 text-xs font-bold">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Descripción del Producto y Contacto</label>
                  <textarea
                    value={sellerDescription}
                    onChange={e => setSellerDescription(e.target.value)}
                    placeholder="Describe tu producto y cómo quieres que aparezca con el nombre. Además, pon tu correo con el que te registraste y tu número de WhatsApp. Estos datos se usarán para contactarte tanto los clientes como nuestro soporte."
                    rows={5}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <Button
                  onClick={handleSubmitProduct}
                  disabled={submittingSeller}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-wider h-14 rounded-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingSeller ? "Enviando..." : "Enviar Producto para Revision"}
                </Button>
              </div>
            </div>

            {dashboard && dashboard.products.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Mis Productos Enviados</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {dashboard.products.map(p => (
                    <div key={p.id} className="p-4 flex items-start gap-4">
                      {p.image && (
                        <img src={p.image.startsWith("/") || p.image.startsWith("http") ? p.image : `/uploads/${p.image}`} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                        <p className="text-xs text-slate-500 mb-2">Q{p.price} - {p.category}</p>
                        <button
                          onClick={() => openProductChat(p)}
                          className="flex items-center gap-2 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" /> Hablar con admin
                        </button>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full shrink-0 ${
                        p.sellerStatus === "approved" ? "bg-green-100 text-green-700" :
                        p.sellerStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                        p.sellerStatus === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {p.sellerStatus === "approved" ? "Publicado" :
                         p.sellerStatus === "pending" ? "En Revision" :
                         p.sellerStatus === "rejected" ? "Rechazado" : p.sellerStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sales" && (
          <div className="max-w-3xl">
            {loadingDashboard ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* Saldo card */}
                  <div className="relative overflow-hidden rounded-3xl p-6 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute bottom-0 right-2 w-16 h-16 rounded-full bg-white/5" />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-inner">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">Saldo Disponible</p>
                      <p className="text-4xl font-black text-white">Q{dashboard?.balance || 0}</p>
                    </div>
                  </div>

                  {/* Ventas card */}
                  <div className="relative overflow-hidden rounded-3xl p-6 shadow-lg bg-gradient-to-br from-amber-500 to-indigo-500">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute bottom-0 right-2 w-16 h-16 rounded-full bg-white/5" />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-inner">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">Ventas Totales</p>
                      <p className="text-4xl font-black text-white">{dashboard?.totalSales || 0}</p>
                    </div>
                  </div>

                  {/* Productos card */}
                  <div className="relative overflow-hidden rounded-3xl p-6 shadow-lg bg-gradient-to-br from-slate-700 to-slate-900">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute bottom-0 right-2 w-16 h-16 rounded-full bg-white/5" />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-inner">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">Mis Productos</p>
                      <p className="text-4xl font-black text-white">{dashboard?.products?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mb-8">
                  <Button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!dashboard?.balance || dashboard.balance <= 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl px-6 shadow-lg shadow-emerald-600/25"
                  >
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Retirar Saldo
                  </Button>
                </div>

                {transactions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Ventas Realizadas</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {transactions.map(tx => (
                        <div key={tx.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{tx.description || (tx.type === "credit" ? "Venta" : "Retiro")}</p>
                            <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
                          </div>
                          <span className={`text-lg font-black ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                            {tx.type === "credit" ? "+" : "-"}Q{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {withdrawals.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Retiros Solicitados</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {withdrawals.map(wd => (
                        <div key={wd.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">Q{wd.amount} - {wd.paymentMethod.toUpperCase()}</p>
                            <p className="text-xs text-slate-500">{wd.accountName} - {wd.accountType} - {wd.accountNumber}</p>
                            <p className="text-xs text-slate-400">{formatDate(wd.createdAt)}</p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                            wd.status === "paid" ? "bg-green-100 text-green-700" :
                            wd.status === "approved" ? "bg-blue-100 text-blue-700" :
                            wd.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {wd.status === "paid" ? "Pagado" :
                             wd.status === "approved" ? "Aprobado" :
                             wd.status === "rejected" ? "Rechazado" : "Pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {transactions.length === 0 && withdrawals.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Sin ventas aun</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Cuando vendan tus productos, aqui veras tus ganancias y podras retirar tu saldo.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {activeTab === "regalos" && (
        <div className="max-w-3xl mx-auto">
          {rgiftSuccess ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                {rgiftMode === "other" ? "¡Regalo Enviado!" : "¡Suscripción Enviada!"}
              </h3>
              <p className="text-slate-600 font-medium mb-1">
                <strong>{rgiftSuccess.recipientName}</strong> ya tiene su suscripción de <strong>{rgiftSuccess.productName}</strong> activa.
              </p>
              <p className="text-slate-400 text-sm font-medium mb-8">
                {rgiftMode === "other" ? "Le enviamos un correo notificándole del regalo." : "Le enviamos sus credenciales por correo electrónico."}
              </p>
              <button
                onClick={() => { setRgiftSuccess(null); setRgiftMode(null); }}
                className="px-8 py-3 rounded-2xl font-black uppercase text-sm text-white"
                style={{ background: rgiftMode === "other" ? "linear-gradient(135deg, #ec4899, #be185d)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
              >
                {rgiftMode === "other" ? "Enviar Otro Regalo" : "Enviar Otra Suscripción"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance card */}
              <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${walletBalance > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tu saldo disponible</p>
                  <p className={`text-2xl font-black mt-0.5 ${walletBalance > 0 ? "text-green-700" : "text-red-600"}`}>Q{walletBalance.toFixed(2)}</p>
                  {walletBalance === 0 && (
                    <button
                      onClick={() => setActiveTab("wallet")}
                      className="mt-2 text-xs font-black uppercase tracking-wide text-white px-3 py-1.5 rounded-xl"
                      style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                    >
                      + Recargar Saldo
                    </button>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${walletBalance > 0 ? "bg-green-100" : "bg-red-100"}`}>
                  <Wallet className={`w-6 h-6 ${walletBalance > 0 ? "text-green-600" : "text-red-500"}`} />
                </div>
              </div>

              {/* Mode selector */}
              {!rgiftMode && (
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3 text-center">¿Qué quieres hacer?</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setRgiftMode("self")}
                      className="bg-white rounded-3xl border-2 border-slate-100 p-6 flex flex-col items-center gap-3 hover:border-blue-300 hover:shadow-lg transition-all group"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                        <Send className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Enviar suscripción</p>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Paga la suscripción de un amigo o familiar que no tiene cómo</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setRgiftMode("other")}
                      className="bg-white rounded-3xl border-2 border-slate-100 p-6 flex flex-col items-center gap-3 hover:border-pink-300 hover:shadow-lg transition-all group"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: "linear-gradient(135deg, #ec4899, #be185d)" }}>
                        <Gift className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Regalar</p>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Envía como regalo especial con mensaje (novia, cumpleaños…)</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Back button when mode is selected */}
              {rgiftMode && (
                <button
                  onClick={() => { setRgiftMode(null); setRgiftRecipientEmail(""); setRgiftRecipientInfo(null); setRgiftSelectedProduct(null); }}
                  className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-800 uppercase tracking-wide transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Cambiar opción
                </button>
              )}

              {/* Recipient email — shown for BOTH modes */}
              {rgiftMode && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-900 mb-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: rgiftMode === "other" ? "linear-gradient(135deg, #ec4899, #be185d)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    {rgiftMode === "other" ? "¿A quién le vas a regalar?" : "¿A quién le vas a enviar la suscripción?"}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium mb-4">La persona debe estar registrada en PAUDRONIX GT.</p>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={rgiftRecipientEmail}
                        onChange={e => { setRgiftRecipientEmail(e.target.value); setRgiftRecipientInfo(null); }}
                        onBlur={async () => {
                          const email = rgiftRecipientEmail;
                          if (!email || !email.includes("@")) { setRgiftRecipientInfo(null); return; }
                          if (email === user?.email) { setRgiftRecipientInfo({ found: false }); return; }
                          setRgiftCheckingEmail(true);
                          try {
                            const res = await fetch("/api/user/check-recipient?email=" + encodeURIComponent(email), { credentials: "include" });
                            setRgiftRecipientInfo(await res.json());
                          } catch { setRgiftRecipientInfo(null); }
                          setRgiftCheckingEmail(false);
                        }}
                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 font-medium text-sm focus:outline-none transition-colors ${rgiftMode === "other" ? "focus:border-pink-400" : "focus:border-blue-400"}`}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const email = rgiftRecipientEmail;
                        if (!email || !email.includes("@")) return;
                        if (email === user?.email) { setRgiftRecipientInfo({ found: false }); return; }
                        setRgiftCheckingEmail(true);
                        try {
                          const res = await fetch("/api/user/check-recipient?email=" + encodeURIComponent(email), { credentials: "include" });
                          setRgiftRecipientInfo(await res.json());
                        } catch { setRgiftRecipientInfo(null); }
                        setRgiftCheckingEmail(false);
                      }}
                      disabled={rgiftCheckingEmail}
                      className="px-5 py-3 rounded-2xl font-black uppercase text-sm text-white transition-all hover:opacity-90"
                      style={{ background: rgiftMode === "other" ? "linear-gradient(135deg, #ec4899, #be185d)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
                    >
                      {rgiftCheckingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                    </button>
                  </div>
                  {rgiftRecipientInfo !== null && (
                    <div className={`mt-3 flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl ${rgiftRecipientInfo.found ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                      {rgiftRecipientInfo.found
                        ? <><CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Usuario encontrado: <span className="font-black">{rgiftRecipientInfo.name}</span></>
                        : <><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> {rgiftRecipientEmail === user?.email ? "No puedes enviarte a ti mismo." : "No existe ningún usuario con ese correo."}</>
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Product list — shown once mode is selected */}
              {rgiftMode && (
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                    {rgiftMode === "self"
                      ? <><div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}><Send className="w-3.5 h-3.5 text-white" /></div> Elige la suscripción a enviar</>
                      : <><div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ec4899, #be185d)" }}><Gift className="w-3.5 h-3.5 text-white" /></div> Elige qué quieres regalar</>
                    }
                  </h2>
                  {rgiftLoadingProducts ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
                    </div>
                  ) : rgiftProducts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium bg-white rounded-3xl border border-slate-100 p-6">No hay productos disponibles.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {rgiftProducts.map((product: any) => {
                        const canSend = rgiftRecipientInfo?.found;
                        const accentGrad = rgiftMode === "other"
                          ? "linear-gradient(135deg, #ec4899, #be185d)"
                          : "linear-gradient(135deg, #3b82f6, #1d4ed8)";
                        return (
                          <div key={product.id} className="bg-white rounded-2xl overflow-hidden border-2 border-slate-100 transition-all hover:shadow-md hover:border-slate-200">
                            {product.image && (
                              <img
                                src={product.image.startsWith("/") || product.image.startsWith("http") ? product.image : `/uploads/${product.image}`}
                                alt={product.name}
                                className="w-full h-28 object-cover"
                              />
                            )}
                            <div className="p-3">
                              <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight mb-1 line-clamp-2">{product.name}</p>
                              <p className="font-black text-base mb-3 text-pink-600">Q{product.price}</p>
                              <button
                                onClick={() => {
                                  if (!canSend) return;
                                  setRgiftSelectedProduct(product);
                                  setRgiftError("");
                                }}
                                disabled={!canSend}
                                className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${canSend ? "text-white hover:opacity-90" : "text-slate-400 cursor-not-allowed"}`}
                                style={{ background: canSend ? accentGrad : "#f1f5f9", boxShadow: canSend ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                              >
                                {rgiftMode === "other" ? <Gift className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                                {canSend ? (rgiftMode === "other" ? "Regalar" : "Enviar suscripción") : "Verifica correo primero"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirmation modal */}
          {rgiftSelectedProduct && rgiftRecipientInfo?.found && (() => {
            const isGift = rgiftMode === "other";
            const grad = isGift ? "linear-gradient(135deg, #ec4899, #be185d)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)";
            const bgCard = isGift ? "bg-pink-50 border-pink-100" : "bg-blue-50 border-blue-100";
            const priceColor = isGift ? "text-pink-600" : "text-blue-600";
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: grad }}>
                        {isGift ? <Gift className="w-5 h-5 text-white" /> : <Send className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight">{isGift ? "Confirmar regalo" : "Confirmar envío"}</p>
                        <p className="text-xs text-slate-500 font-medium">Se descontará de tu saldo</p>
                      </div>
                    </div>
                    <button onClick={() => { setRgiftSelectedProduct(null); setRgiftError(""); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="px-6 pb-6">
                    <div className={`border rounded-2xl p-4 flex items-center gap-3 mb-4 ${bgCard}`}>
                      {rgiftSelectedProduct.image && (
                        <img
                          src={rgiftSelectedProduct.image.startsWith("/") || rgiftSelectedProduct.image.startsWith("http") ? rgiftSelectedProduct.image : `/uploads/${rgiftSelectedProduct.image}`}
                          alt={rgiftSelectedProduct.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{rgiftSelectedProduct.name}</p>
                        <p className={`font-black text-base ${priceColor}`}>Q{rgiftSelectedProduct.price}</p>
                        <p className="text-xs text-slate-500">Para: <strong>{rgiftRecipientInfo.name}</strong></p>
                      </div>
                    </div>
                    {isGift && (
                      <div className="mb-4">
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wide mb-1.5">Mensaje de regalo (opcional)</label>
                        <textarea
                          value={rgiftMessage}
                          onChange={e => setRgiftMessage(e.target.value)}
                          placeholder="¡Feliz cumpleaños! Te regalo esta suscripción..."
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-sm font-medium resize-none focus:outline-none focus:border-pink-400"
                          rows={2}
                        />
                      </div>
                    )}
                    {rgiftError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm font-bold px-4 py-3 rounded-2xl mb-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {rgiftError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => { setRgiftSelectedProduct(null); setRgiftError(""); }} className="flex-1 py-3 rounded-2xl font-black uppercase text-sm text-slate-600 border-2 border-slate-200 hover:bg-slate-50">
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          setRgiftSending(true);
                          setRgiftError("");
                          try {
                            const res = await fetch("/api/user/send-gift", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ recipientEmail: rgiftRecipientEmail, productId: rgiftSelectedProduct.id, message: isGift ? rgiftMessage : "", isGift }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              setRgiftSuccess({ productName: data.productName, recipientName: data.recipientName });
                              setRgiftSelectedProduct(null);
                              setRgiftRecipientEmail("");
                              setRgiftRecipientInfo(null);
                              setRgiftMessage("");
                            } else {
                              setRgiftError(data.error || "Error al enviar");
                            }
                          } catch { setRgiftError("Error de conexión. Intenta de nuevo."); }
                          setRgiftSending(false);
                        }}
                        disabled={rgiftSending}
                        className="flex-1 py-3 rounded-2xl font-black uppercase text-sm text-white flex items-center justify-center gap-2"
                        style={{ background: grad }}
                      >
                        {rgiftSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Confirmar</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {rgiftBuySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">¡Compra exitosa!</h3>
            <p className="text-slate-600 text-sm font-medium mb-1">Tu suscripción de <strong>{rgiftBuySuccess}</strong> fue procesada.</p>
            <p className="text-slate-400 text-xs mb-6">Recibirás tus credenciales por correo en breve.</p>
            <button
              onClick={() => { setRgiftBuySuccess(null); setActiveTab("subscriptions"); }}
              className="w-full py-3 rounded-2xl font-black uppercase text-sm text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              Ver mis suscripciones
            </button>
          </div>
        </div>
      )}

      {giftProduct && (
        <GiftProductModal
          product={giftProduct}
          onClose={() => setGiftProduct(null)}
        />
      )}

      {reportSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg uppercase tracking-tight text-slate-900">Reportar Problema</h3>
              <button onClick={() => setReportSub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-1">
              Suscripcion: <span className="font-bold text-slate-900">{reportSub.credentialName || reportSub.productName}</span>
            </p>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder="Describe el problema que tienes con esta suscripcion..."
              className="w-full border border-slate-300 rounded-xl p-3 text-sm mt-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-3">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-bold uppercase">
                  {reportImage ? reportImage.name : "Adjuntar imagen (opcional)"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setReportImage(f); }} />
              </label>
              {reportImage && (
                <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(reportImage)} alt="" className="h-20 rounded-lg object-cover" />
                  <button onClick={() => setReportImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 font-bold text-xs uppercase" onClick={() => setReportSub(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 font-bold text-xs uppercase bg-indigo-500 hover:bg-indigo-600" onClick={handleReportProblem} disabled={sendingReport}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {sendingReport ? "Enviando..." : "Enviar Reporte"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulkRenew && (() => {
        const allSubs = subscriptions.filter((s: any) => !s.isGame && s.status === "active");
        const selectedSubs = allSubs.filter((s: any) => bulkSelected.includes(s.id));
        const total = selectedSubs.reduce((sum: number, s: any) => sum + Number(s.price), 0);
        const saldoOk = walletBalance >= total && total > 0;
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl my-auto overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 relative">
                <button
                  onClick={() => setShowBulkRenew(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-[#6366f1]" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Renovación con Saldo</p>
                    <h3 className="font-black text-white text-base leading-tight">Renovar Suscripciones Seleccionadas</h3>
                    <p className="text-white/50 text-xs mt-0.5">Selecciona las que quieres renovar — pagas con tu saldo</p>
                  </div>
                </div>
              </div>

              {/* Selector todo / ninguno */}
              <div className="px-5 pt-4 flex gap-2">
                <button
                  onClick={() => setBulkSelected(allSubs.map((s: any) => s.id))}
                  className="text-[11px] font-black uppercase text-[#6366f1] hover:underline"
                >
                  Seleccionar todo
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setBulkSelected([])}
                  className="text-[11px] font-black uppercase text-slate-400 hover:underline"
                >
                  Quitar todo
                </button>
              </div>

              {/* Lista de suscripciones */}
              <div className="p-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
                {allSubs.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">No tienes suscripciones</p>
                )}
                {allSubs.map((sub: any) => {
                  const checked = bulkSelected.includes(sub.id);
                  const isExpired = sub.status === "expired";
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setBulkSelected((prev: string[]) => checked ? prev.filter((id: string) => id !== sub.id) : [...prev, sub.id])}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                        checked ? "border-[#6366f1] bg-[#6366f1]/5" : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "bg-[#6366f1]" : "bg-slate-200"
                      }`}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-900 truncate">{sub.credentialName || sub.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isExpired ? (
                            <span className="text-[10px] font-bold text-red-500 uppercase">Expirada</span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Activa</span>
                          )}
                          {sub.endDate && (
                            <span className="text-[10px] text-slate-400">· vence {new Date(sub.endDate).toLocaleDateString("es-GT")}</span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-sm text-[#6366f1] shrink-0">Q{sub.price}</span>
                    </button>
                  );
                })}
              </div>

              {/* Resumen y botón */}
              <div className="p-5 border-t border-slate-100 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-semibold">Tu saldo</span>
                    <span className={`font-black text-sm ${walletBalance >= total || total === 0 ? "text-emerald-600" : "text-red-500"}`}>Q{walletBalance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-semibold">Seleccionadas ({selectedSubs.length})</span>
                    <span className="font-black text-xl text-[#6366f1]">Q{total}</span>
                  </div>
                  {total > 0 && !saldoOk && (
                    <div className="mt-1 rounded-xl px-3 py-2 text-xs font-bold bg-red-50 text-red-600">
                      ❌ Saldo insuficiente — te faltan Q{(total - walletBalance).toFixed(2)}
                    </div>
                  )}
                  {total > 0 && saldoOk && (
                    <div className="mt-1 rounded-xl px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700">
                      ✅ Saldo suficiente — se renovará automáticamente
                    </div>
                  )}
                </div>

                <button
                  disabled={bulkRenewing || selectedSubs.length === 0 || !saldoOk}
                  onClick={async () => {
                    if (selectedSubs.length === 0) return;
                    setBulkRenewing(true);
                    try {
                      const fd = new FormData();
                      fd.append("subscriptionIds", JSON.stringify(bulkSelected));
                      const res = await fetch("/api/user/bulk-renew", { method: "POST", credentials: "include", body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setShowBulkRenew(false);
                      toast({ title: `✅ ${data.renewed} suscripción(es) renovada(s) — Q${data.total} debitados de tu saldo` });
                      fetch("/api/user/subscriptions", { credentials: "include" }).then(r => r.json()).then(d => setSubscriptions(d)).catch(() => {});
                      fetch("/api/user/balance", { credentials: "include" }).then(r => r.json()).then(d => { setWalletBalance(d.balance); setReferralBalance(d.referralBalance); }).catch(() => {});
                    } catch (err: any) {
                      toast({ title: "Error al renovar", description: err.message, variant: "destructive" });
                    } finally {
                      setBulkRenewing(false);
                    }
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    bulkRenewing || selectedSubs.length === 0 || !saldoOk
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  }`}
                >
                  {bulkRenewing ? "Renovando..." : selectedSubs.length === 0 ? "Selecciona al menos una" : `Renovar con Saldo — Q${total}`}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {renewSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl my-auto overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-[#6366f1] to-[#0051cc] p-5 relative">
              <button
                onClick={() => { setRenewSub(null); setRenewScreenshot(null); setRenewMonths(1); setRenewSelectedMethod(null); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Renovar Suscripcion</p>
                  <h3 className="font-black text-white text-base leading-tight">{renewSub.credentialName || renewSub.productName}</h3>
                  <p className="text-white/60 text-xs mt-0.5">Q{renewSub.renewPrice ?? renewSub.price}/mes</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* Month selector */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meses a renovar</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 6].map(m => (
                    <button
                      key={m}
                      onClick={() => setRenewMonths(m)}
                      className={`py-3 rounded-2xl font-black text-sm transition-all ${
                        renewMonths === m
                          ? "bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30 scale-105"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {m}<span className="text-[10px] font-bold block leading-none mt-0.5">{m === 1 ? "mes" : "meses"}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setRenewMonths(12)}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                      renewMonths === 12
                        ? "bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30 scale-105"
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    🌟 12 meses <span className="text-[10px] font-bold">(Anual)</span>
                  </button>
                </div>
                <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#6366f1]/10 to-[#6366f1]/5 border border-[#6366f1]/20 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Total a pagar</span>
                  <span className="text-2xl font-black text-[#6366f1]">Q{(renewSub.renewPrice ?? renewSub.price) * renewMonths}</span>
                </div>
              </div>

              {/* Renewal code */}
              <div className="rounded-2xl bg-slate-950 p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Codigo de Renovacion</p>
                <p className="text-base font-mono font-black text-white tracking-wider">{renewSub.renewalCode}</p>
                <p className="text-[10px] text-slate-500 mt-1.5">Usa este codigo como referencia en tu renovacion</p>
              </div>

              {/* Wallet balance */}
              <div className={`rounded-2xl px-4 py-4 flex items-center justify-between border ${walletBalance >= (renewSub.renewPrice ?? renewSub.price) * renewMonths ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2">
                  <Wallet className={`w-5 h-5 ${walletBalance >= (renewSub.renewPrice ?? renewSub.price) * renewMonths ? "text-green-600" : "text-red-500"}`} />
                  <span className="text-sm font-bold text-slate-600">Tu saldo disponible</span>
                </div>
                <span className={`text-2xl font-black ${walletBalance >= (renewSub.renewPrice ?? renewSub.price) * renewMonths ? "text-green-700" : "text-red-600"}`}>Q{walletBalance.toFixed(2)}</span>
              </div>

              {walletBalance < (renewSub.renewPrice ?? renewSub.price) * renewMonths && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                  <p className="text-sm font-bold text-amber-700">Saldo insuficiente — necesitas Q{(((renewSub.renewPrice ?? renewSub.price) * renewMonths) - walletBalance).toFixed(2)} más</p>
                  <button
                    onClick={() => { setRenewSub(null); setActiveTab("wallet"); }}
                    className="mt-1.5 text-xs font-black text-[#6366f1] underline"
                  >
                    Recargar saldo
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 font-bold text-xs uppercase rounded-2xl h-12 border-slate-200"
                  onClick={() => { setRenewSub(null); setRenewMonths(1); }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 font-bold text-xs uppercase rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                  onClick={handleRenewWithWallet}
                  disabled={sendingRenewal || walletBalance < (renewSub.renewPrice ?? renewSub.price) * renewMonths}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {sendingRenewal ? "Procesando..." : `Renovar con Saldo — Q${(renewSub.renewPrice ?? renewSub.price) * renewMonths}`}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

        {activeTab === "wallet" && (
          <div className="max-w-3xl space-y-6">

            {/* ── TOP STATS ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-primary to-indigo-400 text-white shadow-xl shadow-primary/30">
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10" />
                <Wallet className="w-6 h-6 opacity-80 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Saldo de cuenta</p>
                <p className="text-3xl font-black mt-0.5">Q{walletBalance}</p>
                <p className="text-[9px] opacity-60 mt-1">Lo que has cargado</p>
              </div>
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/30">
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10" />
                <span className="text-xl mb-2 block">🎁</span>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Saldo de referidos</p>
                <p className="text-3xl font-black mt-0.5">Q{referralBalance}</p>
                <p className="text-[9px] opacity-60 mt-1">Ganado por tus invitados</p>
              </div>
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30">
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10" />
                <Check className="w-6 h-6 opacity-80 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Recargas aprobadas</p>
                <p className="text-3xl font-black mt-0.5">{rechargeRequests.filter(r => r.status === "approved").length}</p>
              </div>
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-400/30">
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10" />
                <RefreshCw className="w-6 h-6 opacity-80 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Recargas pendientes</p>
                <p className="text-3xl font-black mt-0.5">{rechargeRequests.filter(r => r.status === "pending").length}</p>
              </div>
            </div>

            {lastRechargeCode && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="font-black text-green-800">¡Solicitud enviada exitosamente!</p>
                </div>
                <p className="text-xs text-green-600 mb-1">Tu código de referencia:</p>
                <p className="text-3xl font-black text-green-700 tracking-widest font-mono">{lastRechargeCode}</p>
                <p className="text-xs text-green-600 mt-2 opacity-80">El administrador revisará tu solicitud pronto.</p>
              </div>
            )}

            {!showRechargeForm ? (
              <div className="flex justify-center">
                <Button
                  className="bg-primary hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl px-8 h-13 shadow-lg shadow-primary/30 w-full sm:w-auto"
                  onClick={() => setShowRechargeForm(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" /> + Nueva Recarga
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-100 shadow-lg overflow-hidden bg-white">
                {/* form header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
                  <h3 className="font-black text-lg uppercase tracking-tight text-white">Nueva Recarga</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Elige tu método y sube el comprobante</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* payment methods */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1 · Selecciona tu método de pago</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rechargeMethods.map(method => {
                        const isSelected = selectedRechargeMethod?.id === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              setSelectedRechargeMethod(method);
                              setRechargeCode(generateCodeForMethod(method.name));
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                              isSelected
                                ? "border-primary bg-gradient-to-br from-primary to-indigo-400 shadow-lg shadow-primary/25"
                                : "border-slate-200 hover:border-primary/40 bg-slate-50 hover:bg-white hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {method.logo ? (
                                <img src={method.logo} alt={method.name} className={`w-12 h-12 rounded-2xl object-cover shadow-sm ${isSelected ? "ring-2 ring-white/50" : ""}`} />
                              ) : (
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isSelected ? "bg-white/20" : "bg-primary/10"}`}>
                                  <CreditCard className={`w-6 h-6 ${isSelected ? "text-white" : "text-primary"}`} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm ${isSelected ? "text-white" : "text-slate-900"}`}>{method.name}</p>
                                <p className={`text-xs font-semibold capitalize ${isSelected ? "text-white/70" : "text-slate-400"}`}>{method.type}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-white bg-white" : "border-slate-300"}`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {rechargeMethods.length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-6">No hay métodos de pago disponibles.</p>
                    )}
                  </div>

                  {selectedRechargeMethod && (
                    <>
                      {/* payment details */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">2 · Datos para tu pago</p>
                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{selectedRechargeMethod.name}</p>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {selectedRechargeMethod.accountNumber && (
                              <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Cuenta / ID</span>
                                <span className="font-black text-slate-900 text-base tracking-wide font-mono">{selectedRechargeMethod.accountNumber}</span>
                              </div>
                            )}
                            {selectedRechargeMethod.accountName && (
                              <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</span>
                                <span className="font-black text-slate-900 text-base">{selectedRechargeMethod.accountName}</span>
                              </div>
                            )}
                            {selectedRechargeMethod.instructions && (
                              <div className="px-5 py-4 bg-amber-50">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Instrucciones</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{selectedRechargeMethod.instructions}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* reference code */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">3 · Tu código de referencia</p>
                        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Escríbelo en la nota de tu pago</p>
                          <p className="text-4xl font-black tracking-widest text-white font-mono">{rechargeCode}</p>
                          <div className="mt-3 flex items-start gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300 font-bold leading-relaxed">Escribe este código en la descripción / nota / concepto de tu pago para que podamos identificarlo</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* amount */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">4 · Monto a recargar</p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">Q</span>
                      <input
                        type="number"
                        value={rechargeAmount}
                        onChange={e => setRechargeAmount(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        className="w-full border-2 border-slate-200 rounded-2xl pl-10 pr-4 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* screenshot */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">5 · Comprobante de pago</p>
                    <label className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${rechargeScreenshot ? "border-green-400 bg-green-50" : "border-slate-300 hover:border-primary hover:bg-indigo-50"}`}>
                      {rechargeScreenshot ? (
                        <Check className="w-6 h-6 text-green-600 shrink-0" />
                      ) : (
                        <Upload className="w-6 h-6 text-slate-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black ${rechargeScreenshot ? "text-green-700" : "text-slate-600"}`}>
                          {rechargeScreenshot ? rechargeScreenshot.name : "Sube la captura de tu pago"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{rechargeScreenshot ? "Listo para enviar" : "Cualquier imagen o PDF"}</p>
                      </div>
                      <input
                        ref={rechargeFileRef}
                        type="file"
                        accept="image/*,.pdf,.heic,.heif,.webp,.avif,.bmp,.tiff,.tif"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setRechargeScreenshot(f); }}
                      />
                    </label>
                  </div>

                  {/* actions */}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 font-bold text-xs uppercase rounded-2xl h-12 border-slate-200" onClick={() => { setShowRechargeForm(false); setSelectedRechargeMethod(null); setRechargeAmount(""); setRechargeScreenshot(null); }}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 font-bold text-xs uppercase bg-primary hover:bg-indigo-700 rounded-2xl h-12 shadow-lg shadow-primary/25"
                      onClick={handleSubmitRecharge}
                      disabled={submittingRecharge}
                    >
                      {submittingRecharge ? "Enviando..." : "Enviar Solicitud →"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {rechargeRequests.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Historial de Recargas</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {rechargeRequests.map(req => (
                    <div key={req.id} className="px-6 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${req.status === "approved" ? "bg-green-100" : req.status === "rejected" ? "bg-red-100" : "bg-amber-100"}`}>
                          <CreditCard className={`w-4 h-4 ${req.status === "approved" ? "text-green-600" : req.status === "rejected" ? "text-red-600" : "text-amber-600"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900">Q{req.amount} · {req.paymentMethodName}</p>
                          <p className="text-xs text-slate-400 font-mono">{req.code} · {new Date(req.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === "approved" ? "bg-green-100 text-green-700" :
                        req.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {req.status === "approved" ? "✓ Aprobada" : req.status === "rejected" ? "✕ Rechazada" : "⏳ Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {walletTransactions.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Movimientos de Saldo</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {walletTransactions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((tx: any) => (
                    <div key={tx.id} className="px-6 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                          <DollarSign className={`w-4 h-4 ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-base font-black ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "credit" ? "+" : "-"}Q{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "referidos" && referralProgram && (
          <div className={`max-w-2xl space-y-6 ${!referralProgram.isActive ? "opacity-50 pointer-events-none select-none" : ""}`}>

            {/* Inactive notice */}
            {!referralProgram.isActive && (
              <div className="pointer-events-auto select-auto opacity-100 bg-slate-100 border border-slate-300 rounded-2xl px-5 py-3 flex items-center gap-3">
                <span className="text-2xl">⏸️</span>
                <div>
                  <p className="font-black text-slate-600 text-sm">Programa pausado</p>
                  <p className="text-xs text-slate-500">El administrador ha desactivado temporalmente el programa de referidos. Tu saldo ganado sigue disponible para compras.</p>
                </div>
              </div>
            )}

            {/* Header card */}
            <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl ${
              referralProgram.isActive
                ? "bg-gradient-to-br from-[#6366f1] to-indigo-400 shadow-indigo-500/30"
                : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-400/20"
            }`}>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
              <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">
                {referralProgram.isActive ? "Programa Activo" : "Programa Pausado"}
              </p>
              <h2 className="text-2xl font-black">{referralProgram.title}</h2>
              <p className="text-sm mt-1 opacity-80">{referralProgram.description}</p>
              <div className="flex gap-3 mt-4 flex-wrap">
                <span className="bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold">🎉 Q{referralProgram.registerBonus} al registrarse</span>
                <span className="bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold">🛒 Q{referralProgram.purchaseBonus} al comprar</span>
              </div>
            </div>

            {/* Stats */}
            {referralStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                  <p className={`text-2xl font-black ${referralProgram.isActive ? "text-[#6366f1]" : "text-slate-400"}`}>{referralStats.registrations}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Registros</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                  <p className={`text-2xl font-black ${referralProgram.isActive ? "text-[#6366f1]" : "text-slate-400"}`}>{referralStats.purchases}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Compras</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-green-600">Q{(referralStats.totalEarned || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Ganado</p>
                </div>
              </div>
            )}

            {/* Link Card */}
            {referralStats?.code && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Tu Link de Referido</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 font-mono text-sm text-slate-500 border border-slate-200 truncate">
                      {`${window.location.origin}/?ref=${referralStats.code}`}
                    </div>
                    {referralProgram.isActive ? (
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/?ref=${referralStats.code}`;
                          const doCopy = () => {
                            const ta = document.createElement("textarea");
                            ta.value = link;
                            ta.style.position = "fixed";
                            ta.style.opacity = "0";
                            document.body.appendChild(ta);
                            ta.focus();
                            ta.select();
                            document.execCommand("copy");
                            document.body.removeChild(ta);
                            toast({ title: "¡Link copiado!", description: "Compártelo con tus amigos para ganar saldo." });
                          };
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(link).then(() => toast({ title: "¡Link copiado!", description: "Compártelo con tus amigos para ganar saldo." })).catch(doCopy);
                          } else { doCopy(); }
                        }}
                        className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm whitespace-nowrap"
                      >
                        Copiar
                      </button>
                    ) : (
                      <div className="bg-slate-200 text-slate-400 font-bold px-4 py-3 rounded-xl text-sm whitespace-nowrap cursor-not-allowed">
                        Pausado
                      </div>
                    )}
                  </div>
                </div>
                {/* Cómo funciona — pasos visuales */}
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-800 px-4 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">¿Cómo funciona?</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center gap-4 px-4 py-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 text-xl">🔗</div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">Paso 1 — Comparte tu link</p>
                        <p className="text-xs text-slate-500 mt-0.5">Copia tu link personal y mándalo a tus amigos por WhatsApp, redes sociales o donde quieras.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 text-xl">👤</div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">Paso 2 — Tu amigo se registra</p>
                        <p className="text-xs text-slate-500 mt-0.5">Cuando cree su cuenta con tu link, recibes automáticamente <span className="font-black text-[#6366f1]">Q{referralProgram.registerBonus}</span> en tu saldo.</p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-white bg-[#6366f1] px-2.5 py-1 rounded-xl">+Q{referralProgram.registerBonus}</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4">
                      <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center shrink-0 text-xl">🛒</div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">Paso 3 — Tu amigo compra</p>
                        <p className="text-xs text-slate-500 mt-0.5">Cuando haga su primera compra en la página, ganas <span className="font-black text-green-600">Q{referralProgram.purchaseBonus}</span> adicionales en tu saldo.</p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-white bg-green-500 px-2.5 py-1 rounded-xl">+Q{referralProgram.purchaseBonus}</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4 bg-amber-50">
                      <div className="w-10 h-10 rounded-2xl bg-amber-200 flex items-center justify-center shrink-0 text-xl">💰</div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">Resultado — Usas tu saldo</p>
                        <p className="text-xs text-slate-500 mt-0.5">El saldo ganado se acumula en tu cuenta y lo puedes usar para renovar suscripciones o hacer compras.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg uppercase tracking-tight text-slate-900">Retirar Saldo</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Saldo disponible: <span className="font-black text-green-600">Q{dashboard?.balance || 0}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Monto a Retirar (Q)</label>
                <input
                  type="number"
                  value={wdAmount}
                  onChange={e => setWdAmount(e.target.value)}
                  placeholder="0"
                  max={dashboard?.balance || 0}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Metodo de Pago</label>
                <select
                  value={wdMethod}
                  onChange={e => setWdMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">Seleccionar</option>
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Nombre Completo</label>
                <input
                  value={wdAccountName}
                  onChange={e => setWdAccountName(e.target.value)}
                  placeholder="Nombre como aparece en la cuenta"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Numero de Cuenta</label>
                <input
                  value={wdAccountNumber}
                  onChange={e => setWdAccountNumber(e.target.value)}
                  placeholder="Numero de cuenta o wallet"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Tipo de Cuenta</label>
                <select
                  value={wdAccountType}
                  onChange={e => setWdAccountType(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="ahorro">Ahorro</option>
                  <option value="monetario">Monetario</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1 font-bold text-xs uppercase" onClick={() => setShowWithdrawModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 font-bold text-xs uppercase bg-amber-600 hover:bg-amber-700"
                onClick={handleWithdraw}
                disabled={submittingWithdraw}
              >
                <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
                {submittingWithdraw ? "Enviando..." : "Solicitar Retiro"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeChatProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "85vh" }}>
            <input ref={chatImageRef} type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} />
            {(() => {
              const lastAdminMsg = [...chatMessages].reverse().find((m: any) => m.isAdmin);
              const headerAgentFallback = AGENTS[lastAdminMsg?.agentIndex ?? 0] || AGENTS[0];
              const headerAvatar = lastAdminMsg?.agentImage || headerAgentFallback.avatar;
              const headerName = lastAdminMsg?.senderName || headerAgentFallback.name;
              return (
              <div className="bg-blue-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <img src={headerAvatar} alt={headerName} className="w-12 h-12 rounded-full object-cover border-2 border-white/50 shadow-lg" />
                  <div>
                    <h3 className="font-black text-sm">{headerName}</h3>
                    <p className="text-[11px] text-blue-100">{headerAgentFallback.role} · PAUDRONIX GT</p>
                  </div>
                </div>
                <button onClick={() => { setActiveChatProduct(null); clearInterval(chatPollRef.current); }} className="hover:bg-white/20 p-1.5 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              );
            })()}

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ minHeight: "200px" }}>
              {chatMessages.length === 0 && (
                <div className="text-center py-10">
                  <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No hay mensajes aún</p>
                  <p className="text-xs text-slate-300">Escribe tu mensaje y te responderemos pronto</p>
                </div>
              )}
              {chatMessages.map((msg: any) => {
                const msgAgentFallback = AGENTS[msg.agentIndex ?? 0] || AGENTS[0];
                const msgAvatar = msg.agentImage || msgAgentFallback.avatar;
                const msgName = msg.senderName || msgAgentFallback.name;
                return (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                  {msg.isAdmin && (
                    <img src={msgAvatar} alt={msgName} className="w-10 h-10 rounded-full object-cover shrink-0 mb-1 border-2 border-white shadow-md" />
                  )}
                  <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                    msg.isAdmin
                      ? "bg-slate-100 text-slate-800 rounded-tl-sm"
                      : "bg-blue-600 text-white rounded-tr-sm"
                  }`}>
                    {msg.imageUrl ? (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.imageUrl} alt="imagen" className="max-w-full max-h-48 object-cover" />
                      </a>
                    ) : (
                      <div className="px-4 py-2.5">
                        {msg.isAdmin && <p className="text-[9px] font-black text-blue-600 mb-0.5">{msgName}</p>}
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    )}
                    <p className={`text-[9px] pb-2 px-4 ${msg.isAdmin ? "text-slate-400" : "text-blue-200"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 flex gap-2 shrink-0 items-center">
              <button
                onClick={() => chatImageRef.current?.click()}
                disabled={chatImageUploading}
                className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-blue-50 shrink-0"
                title="Enviar imagen"
              >
                {chatImageUploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                placeholder="Escribe tu mensaje..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => sendChatMessage()}
                disabled={chatSending || !chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "fortnite" && (
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}>
              <span className="font-black text-white text-xl leading-none">V</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mis compras de Fortnite</h2>
              <p className="text-sm text-slate-500">Historial de Pavos y artículos adquiridos</p>
            </div>
          </div>

          {fortniteLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : fortniteOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <span className="font-black text-blue-400 text-3xl leading-none">V</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Sin compras aún</h3>
              <p className="text-slate-500 text-sm">Cuando compres Pavos o artículos de Fortnite aparecerán aquí.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {fortniteOrders.map((order: any) => {
                const imgSrc = (() => {
                  try {
                    const arr = JSON.parse(order.productImagesJson || "[]");
                    if (Array.isArray(arr) && arr[0]) return arr[0];
                  } catch {}
                  return order.productImage || "";
                })();
                const statusColors: Record<string, string> = {
                  approved: "bg-green-100 text-green-700",
                  pending: "bg-yellow-100 text-yellow-700",
                  rejected: "bg-red-100 text-red-700",
                };
                const statusLabel: Record<string, string> = {
                  approved: "Entregado",
                  pending: "Pendiente",
                  rejected: "Rechazado",
                };
                const color = statusColors[order.status] || "bg-slate-100 text-slate-600";
                const label = statusLabel[order.status] || order.status;
                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-md flex items-center gap-4 p-4">
                    {imgSrc ? (
                      <img src={imgSrc} alt={order.productName} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="font-black text-slate-400 text-2xl leading-none">V</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{order.productName || "Artículo Fortnite"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Usuario Epic: <span className="font-medium text-slate-700">{order.deliveryContact || "—"}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Ref: {order.orderRef || order.id}</p>
                      {order.date && (
                        <p className="text-xs text-slate-400">{new Date(order.date).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-bold text-slate-800">Q{Number(order.total ?? order.price ?? 0).toFixed(2)}</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${color}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
