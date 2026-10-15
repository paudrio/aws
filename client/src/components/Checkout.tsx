import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, LogIn, Eye, EyeOff, AlertTriangle, Wallet, Tag, X, ChevronLeft, Star, Clock, User } from "lucide-react";

type Review = { id: string; userName: string; rating: number; comment: string; createdAt: string };

interface CheckoutProps {
  product: any;
  onClose: () => void;
}


export default function Checkout({ product, onClose }: CheckoutProps) {
  const { refreshData } = useApp() as any;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod] = useState<string>("saldo");
  const [customerName, setCustomerName] = useState(user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [orderRef] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());
  const [walletBalance, setWalletBalance] = useState(0);
  const [regularBalance, setRegularBalance] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<"regular" | "referral">("regular");
  const [payingWithWallet, setPayingWithWallet] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{ type: string; value: number; description: string } | null>(null);
  const [discountChecking, setDiscountChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingIsWallet, setProcessingIsWallet] = useState(false);
  const processingStartRef = useRef<number>(0);
  const [credDelivered, setCredDelivered] = useState(false);
  const [deliveredCredInfo, setDeliveredCredInfo] = useState<{ email: string; password: string; instructions?: string | null } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const finalPrice = discountApplied
    ? discountApplied.type === "percentage"
      ? Math.max(0, Math.round(product.price * (1 - discountApplied.value / 100)))
      : Math.max(0, product.price - discountApplied.value)
    : product.price;

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountChecking(true);
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountApplied({ type: data.discountType, value: data.discountValue, description: data.description });
        toast.success(`¡Código aplicado! ${data.discountType === "percentage" ? `${data.discountValue}% de descuento` : `Q${data.discountValue} de descuento`}`);
      } else {
        toast.error(data.error || "Código no válido");
      }
    } catch { toast.error("Error al validar el código"); } finally { setDiscountChecking(false); }
  };

  const removeDiscount = () => { setDiscountApplied(null); setDiscountCode(""); };


  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/user/balance", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            setWalletBalance(d.balance);
            setRegularBalance(d.regularBalance ?? d.balance);
            setReferralBalance(d.referralBalance ?? 0);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);


  useEffect(() => {
    fetch(`/api/products/${product.id}/reviews`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setReviews(d.reviews || []); setReviewsAvg(d.avg || 0); } })
      .catch(() => {});
  }, [product.id]);

  const handleSubmitReview = async () => {
    if (!reviewRating) { toast.error("Selecciona una calificación"); return; }
    if (reviewComment.trim().length < 5) { toast.error("El comentario debe tener al menos 5 caracteres"); return; }
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSubmitted(true);
        setReviews(prev => [data, ...prev]);
        toast.success("¡Gracias por tu reseña!");
      } else {
        toast.error(data.error || "Error al guardar reseña");
      }
    } catch { toast.error("Error al guardar reseña"); } finally { setReviewSubmitting(false); }
  };


  const startProcessingAnimation = (isWallet: boolean) => {
    const MIN_MS = 7000;
    processingStartRef.current = Date.now();
    setIsProcessing(true);
    setProcessingStep(0);
    setProcessingIsWallet(isWallet);
    const delays = [1300, 2600, 3900, 5200];
    delays.forEach((d, i) => setTimeout(() => setProcessingStep(i + 1), d));
    return (fn: () => void) => {
      const elapsed = Date.now() - processingStartRef.current;
      const remaining = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => { setIsProcessing(false); fn(); }, remaining);
    };
  };

  const activeBalance = balanceType === "referral" ? referralBalance : regularBalance;

  const handleWalletPurchase = async () => {
    if (!customerName) {
      toast.error("Completa tu nombre");
      return;
    }
    if (activeBalance < finalPrice) {
      toast.error(balanceType === "referral" ? "Saldo de referidos insuficiente." : "Saldo insuficiente. Recarga tu saldo desde tu perfil.");
      return;
    }
    const applyResult = startProcessingAnimation(true);
    setPayingWithWallet(true);
    try {
      const res = await fetch("/api/orders/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName,
          customerPhone: customerWhatsapp ? `502${customerWhatsapp}` : "",
          productId: product.id,
          productName: product.name,
          price: finalPrice,
          paymentMethod: "saldo",
          balanceType,
          deliveryMethod: customerWhatsapp ? "whatsapp" : "perfil",
          deliveryContact: customerWhatsapp ? `502${customerWhatsapp}` : "",
          customerEmail: customerEmail || "",
          customerPassword: customerPassword || "",
          orderRef,
          sellerId: product.sellerId || undefined,
        }),
      });
      if (res.ok) {
        const orderData = await res.json();
        if (orderData?.id) {
          if (orderData.credDelivered) {
            setCredDelivered(true);
            setDeliveredCredInfo({ email: orderData.credentialEmail, password: orderData.credentialPassword, instructions: orderData.credentialInstructions });
          }
          try {
            await fetch("/api/user/subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                productId: product.id,
                productName: product.name,
                productImage: product.image || "",
                price: finalPrice,
                status: "active",
                orderId: orderData.id,
                credentialEmail: orderData.credentialEmail || "",
                credentialPassword: orderData.credentialPassword || "",
                credentialInstructions: orderData.credentialInstructions || "",
              }),
            });
          } catch {}
          if (discountApplied && discountCode) {
            fetch("/api/discount-codes/use", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: discountCode }) }).catch(() => {});
          }
        }
        applyResult(() => { setPayingWithWallet(false); setStep(3); refreshData(); });
      } else {
        const err = await res.json();
        applyResult(() => { setPayingWithWallet(false); toast.error(err.error || "Error al procesar pago con saldo"); });
      }
    } catch {
      applyResult(() => { setPayingWithWallet(false); toast.error("Error al procesar pago"); });
    }
  };



  if (isAuthLoading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto animate-pulse" />
            <p className="text-slate-400 font-medium text-sm">Verificando sesión...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAuthenticated) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-[#6366f1]/10 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8 text-[#6366f1]" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Inicia Sesion</h2>
            <p className="text-slate-500 font-medium text-sm">
              Para comprar <strong className="text-slate-800">{product.name}</strong> necesitas iniciar sesion o crear una cuenta primero.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/auth">
                <Button className="w-full h-12 rounded-xl font-black uppercase bg-[#6366f1] hover:bg-[#6366f1]/90">
                  <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesion / Registrarse
                </Button>
              </a>
              <Button variant="outline" className="w-full h-10 rounded-xl font-bold" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const walletWords = [
    { text: "Verificando tu saldo...", sub: "Comprobando fondos disponibles" },
    { text: "Procesando el pago...", sub: "Descontando del saldo" },
    { text: "Entregando tu suscripción...", sub: "Buscando credenciales" },
    { text: "Activando acceso...", sub: "Configurando tu cuenta" },
    { text: "¡Compra exitosa!", sub: "Preparando tu información" },
  ];
  const orderWords = [
    { text: "Enviando tu pedido...", sub: "Conectando con el servidor" },
    { text: "Verificando información...", sub: "Validando datos del comprobante" },
    { text: "Validando comprobante...", sub: "Revisando el pago" },
    { text: "Notificando al equipo...", sub: "Asignando tu pedido" },
    { text: "¡Pedido recibido!", sub: "Preparando confirmación" },
  ];
  const processingWords = processingIsWallet ? walletWords : orderWords;

  return (
    <Dialog open={true} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl max-h-[90vh] flex flex-col [&>button.absolute]:hidden">

        {/* ── PROCESSING SCREEN (replaces content while processing) ── */}
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center min-h-[520px] px-8"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)" }} />

            <div className="relative w-36 h-36 flex items-center justify-center mb-8">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2"
                  style={{
                    width: 56 + i * 28, height: 56 + i * 28,
                    borderColor: i === 0 ? "#6366f1" : i === 1 ? "rgba(234,88,12,0.4)" : "rgba(234,88,12,0.15)",
                    borderStyle: i === 0 ? "solid" : "dashed",
                  }}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: 1.6 + i * 0.7, repeat: Infinity, ease: "linear" }}
                />
              ))}
              <motion.div
                className="relative w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <CheckCircle2 className="w-7 h-7 text-white" />
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={processingStep}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <p className="text-white text-xl font-black tracking-tight mb-1">
                  {processingWords[processingStep]?.text}
                </p>
                <p className="text-white/40 text-sm font-medium">
                  {processingWords[processingStep]?.sub}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2 mt-8">
              {processingWords.map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full h-2"
                  style={{ background: i <= processingStep ? "#6366f1" : "rgba(255,255,255,0.15)" }}
                  animate={{ width: i === processingStep ? 20 : 8 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>
        ) : (
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {step === 1 && (
            <div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-8 pb-7 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 60%)"}} />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Sesión de Pago</p>
                <p className="text-base font-black text-white leading-tight mb-5">{product.name}</p>
                <div className="flex items-center gap-3">
                  <div>
                    {discountApplied && <p className="text-sm line-through text-white/30 font-bold mb-0.5">Q{product.price}</p>}
                    <div className="flex items-baseline gap-2">
                      <span className="text-[42px] font-black tracking-tight leading-none">Q{finalPrice}</span>
                      {discountApplied && (
                        <span className="bg-green-400 text-green-900 text-xs font-black px-2 py-0.5 rounded-lg">
                          {discountApplied.type === "percentage" ? `-${discountApplied.value}%` : `-Q${discountApplied.value}`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/40 font-semibold mt-1">${product.priceUsd || Math.round(finalPrice / 7.75)} USD{product.isMonthly !== false ? " / mes" : ""}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Selecciona el saldo a usar</p>
                <div className="flex flex-col gap-2.5">
                  {/* Saldo recargado */}
                  <button
                    type="button"
                    onClick={() => setBalanceType("regular")}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left w-full ${balanceType === "regular" ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${balanceType === "regular" ? "bg-white/20" : "bg-indigo-50"}`}>
                      <Wallet className={`w-5 h-5 ${balanceType === "regular" ? "text-white" : "text-indigo-500"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm">Saldo recargado</p>
                      <p className={`text-xs ${balanceType === "regular" ? "text-white/70" : "text-slate-400"}`}>Disponible: Q{regularBalance}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${balanceType === "regular" ? "bg-white/30" : "border-2 border-slate-300"}`}>
                      {balanceType === "regular" && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  {/* Saldo de referidos */}
                  <button
                    type="button"
                    onClick={() => referralBalance > 0 && setBalanceType("referral")}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left w-full ${referralBalance === 0 ? "opacity-40 cursor-not-allowed" : ""} ${balanceType === "referral" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${balanceType === "referral" ? "bg-white/20" : "bg-emerald-50"}`}>
                      <span className={`text-lg ${balanceType === "referral" ? "text-white" : "text-emerald-500"}`}>👥</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm">Saldo de referidos</p>
                      <p className={`text-xs ${balanceType === "referral" ? "text-white/70" : "text-slate-400"}`}>
                        {referralBalance > 0 ? `Disponible: Q${referralBalance}` : "No tienes saldo de referidos"}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${balanceType === "referral" ? "bg-white/30" : "border-2 border-slate-300"}`}>
                      {balanceType === "referral" && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>

                {activeBalance < finalPrice && (
                  <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-800">Saldo insuficiente</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Necesitas <span className="font-black">Q{finalPrice}</span> · Tienes <span className="font-black">Q{activeBalance}</span>.
                          {balanceType === "regular" && " Recarga tu saldo para continuar."}
                          {balanceType === "referral" && " Invita más amigos para ganar referidos."}
                        </p>
                      </div>
                    </div>
                    {balanceType === "regular" && (
                      <button
                        onClick={() => { onClose(); window.location.href = "/perfil"; }}
                        className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                      >
                        <Wallet className="w-3.5 h-3.5" /> Ir a Recargar Saldo
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Código de descuento
                  </p>
                  {discountApplied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-3.5 py-2.5">
                      <div>
                        <p className="text-sm font-black text-green-700 font-mono">{discountCode} — {discountApplied.type === "percentage" ? `${discountApplied.value}% OFF` : `Q${discountApplied.value} OFF`}</p>
                        <p className="text-xs text-slate-400 line-through">Q{product.price} original</p>
                        <p className="text-base font-black text-green-700">Ahora Q{finalPrice}</p>
                      </div>
                      <button onClick={removeDiscount} className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Ingresa tu código aquí"
                        className="flex-1 rounded-xl h-11 border-slate-300 bg-white font-mono font-bold uppercase text-sm"
                        onKeyDown={e => { if (e.key === "Enter") applyDiscount(); }}
                        maxLength={20}
                      />
                      <Button
                        onClick={applyDiscount}
                        disabled={discountChecking || !discountCode.trim()}
                        variant="outline"
                        className="rounded-xl h-11 font-black text-xs uppercase px-5 shrink-0 border-slate-300"
                      >
                        {discountChecking ? "..." : "Aplicar"}
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-4 h-13 rounded-2xl font-black uppercase text-base bg-slate-900 hover:bg-slate-800"
                  disabled={activeBalance < finalPrice}
                  onClick={() => setStep(2)}
                >
                  {activeBalance < finalPrice ? "SALDO INSUFICIENTE" : `PAGAR Q${finalPrice}`}
                </Button>

                {/* ── Reviews Section ── */}
                {reviews.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opiniones de clientes</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= Math.round(reviewsAvg) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-xs font-black text-slate-700">{reviewsAvg.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({reviews.length})</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {reviews.slice(0, 4).map(r => (
                        <div key={r.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-white uppercase">{(r.userName || "U").charAt(0)}</span>
                              </div>
                              <span className="text-xs font-black text-slate-800">{r.userName}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {step === 2 && paymentMethod === "saldo" && (
          <div className="p-6 space-y-4">
            {/* Price summary */}
            <div className="bg-gradient-to-br from-[#6366f1] to-blue-700 rounded-3xl p-5 text-white shadow-lg">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Pago con Saldo</p>
              {discountApplied && <p className="text-xs line-through opacity-60">Q{product.price} (precio original)</p>}
              <p className="text-2xl font-black">Q{finalPrice} <span className="text-sm font-bold ml-1 opacity-80">(${product.priceUsd || Math.round(finalPrice / 7.75)} USD)</span></p>
              <p className="text-xs opacity-80 mt-1">{balanceType === "referral" ? "Saldo de referidos" : "Saldo recargado"}: Q{activeBalance}</p>
              <p className="text-xs opacity-80">Saldo después de la compra: Q{activeBalance - finalPrice}</p>
            </div>

            {/* MODO: producto requiere correo del cliente */}
            {product.requiresCustomerEmail ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-sm">
                  <div className="bg-gradient-to-r from-primary to-indigo-500 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                        {product.customerEmailLabel || "Datos de acceso requeridos"}
                      </p>
                      <p className="text-[11px] text-white/80 mt-0.5">Ingresa tus datos para activar el servicio</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="font-black text-xs uppercase tracking-widest text-slate-600">Correo electrónico <span className="text-red-500">*</span></Label>
                      <Input
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="rounded-xl bg-slate-50 h-11 text-sm border-slate-200 focus:border-primary"
                        type="email"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-xs uppercase tracking-widest text-slate-600">Contraseña <span className="text-slate-400 font-normal normal-case">(si aplica)</span></Label>
                      <div className="relative">
                        <Input
                          value={customerPassword}
                          onChange={(e) => setCustomerPassword(e.target.value)}
                          placeholder="Contraseña de tu cuenta"
                          className="rounded-xl bg-slate-50 h-11 text-sm border-slate-200 focus:border-primary pr-11"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO: producto normal — nombre, whatsapp y outlook opcional */
              <div className="space-y-3">
                <div>
                  <Label className="font-black uppercase text-xs">Nombre de tu Perfil</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={user?.firstName || "Tu nombre"} className="rounded-xl bg-slate-50" />
                  <p className="text-[10px] text-slate-400 mt-1">Este nombre aparece en tu perfil y pedido</p>
                </div>
                <div>
                  <Label className="font-black uppercase text-xs">Tu WhatsApp <span className="text-slate-400 font-normal normal-case">(opcional)</span></Label>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 font-black text-sm px-4 py-2.5 rounded-xl border border-slate-200">+502</span>
                    <Input value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="1234 5678" className="rounded-xl flex-1" maxLength={8} inputMode="numeric" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 flex items-start gap-2 border-b border-slate-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Correo Outlook y contraseña <span className="font-normal normal-case text-slate-400">(opcional)</span></p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Solo es necesario si el juego o servicio requiere correo y contraseña para iniciar sesión.</p>
                    </div>
                  </div>
                  <div className="p-3 space-y-2 bg-white">
                    <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="ejemplo@outlook.com" className="rounded-xl bg-slate-50" type="email" />
                    <div className="relative">
                      <Input value={customerPassword} onChange={(e) => setCustomerPassword(e.target.value)} placeholder="Contraseña de la cuenta" className="rounded-xl bg-slate-50 pr-10" type={showPassword ? "text" : "password"} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl font-black uppercase bg-[#6366f1] hover:bg-[#4f46e5]"
              onClick={handleWalletPurchase}
              disabled={payingWithWallet || activeBalance < finalPrice || (product.requiresCustomerEmail && !customerEmail.trim())}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {payingWithWallet ? "Procesando..." : activeBalance < finalPrice ? "Saldo Insuficiente" : `Pagar con ${balanceType === "referral" ? "Referidos" : "Saldo"}`}
            </Button>
            {product.requiresCustomerEmail && !customerEmail.trim() && (
              <p className="text-center text-xs text-red-500 font-bold -mt-2">Ingresa tu correo para continuar</p>
            )}
          </div>
        )}


        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden"
          >
            {/* Animated background */}
            <div className={`absolute inset-0 pointer-events-none ${(credDelivered || processingIsWallet) ? "bg-gradient-to-b from-emerald-50 via-white to-white" : "bg-gradient-to-b from-blue-50 via-white to-white"}`} />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full opacity-60 ${(credDelivered || processingIsWallet) ? ["bg-emerald-400","bg-yellow-400","bg-indigo-300","bg-yellow-400"][i%4] : ["bg-blue-400","bg-indigo-400","bg-purple-300","bg-sky-400"][i%4]}`}
                  initial={{ y: 60, x: `${8 + i * 8}%`, opacity: 0, scale: 0 }}
                  animate={{ y: -20, opacity: [0, 0.8, 0], scale: [0, 1.2, 0.6] }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 1.8, ease: "easeOut" }}
                />
              ))}
            </div>

            <div className="relative p-8 space-y-5">
              {/* Icon + title */}
              <div className="text-center space-y-4">
                {/* Animated icon */}
                <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                  <motion.div
                    className={`absolute inset-0 rounded-full ${(credDelivered || processingIsWallet) ? "bg-emerald-100" : "bg-blue-100"}`}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className={`absolute inset-2 rounded-full ${(credDelivered || processingIsWallet) ? "bg-emerald-200" : "bg-blue-200"}`}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                  />
                  <motion.div
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${(credDelivered || processingIsWallet) ? "bg-emerald-500" : "bg-blue-500"}`}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-9 h-9 text-white" />
                  </motion.div>
                  {/* Sparkle dots around icon */}
                  {[0,60,120,180,240,300].map((deg, i) => (
                    <motion.div
                      key={deg}
                      className={`absolute w-2 h-2 rounded-full ${(credDelivered || processingIsWallet) ? "bg-yellow-400" : "bg-indigo-400"}`}
                      style={{ transformOrigin: "50% 50%", left: "50%", top: "50%", marginLeft: -4, marginTop: -4 }}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1.2, 0],
                        x: Math.cos((deg * Math.PI) / 180) * 52,
                        y: Math.sin((deg * Math.PI) / 180) * 52,
                      }}
                      transition={{ delay: 0.5 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                    />
                  ))}
                </div>

                {/* Text */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  {credDelivered ? (
                    <>
                      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Entrega inmediata
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">¡Compra exitosa!</h2>
                      <p className="text-slate-600 font-medium mt-2 leading-relaxed">
                        Tus credenciales ya están disponibles. Encuéntralas en tu perfil en la sección <strong className="text-slate-800">Mis Suscripciones</strong>.
                      </p>
                    </>
                  ) : processingIsWallet ? (
                    <>
                      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pago con saldo
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">¡Compra exitosa!</h2>
                      <p className="text-slate-600 font-medium mt-2 leading-relaxed">
                        Tu saldo fue descontado exitosamente. Tus credenciales serán asignadas muy pronto y aparecerán en <strong className="text-slate-800">Mis Suscripciones</strong>.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                        <Clock className="w-3.5 h-3.5" /> En revisión
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">¡Pedido recibido!</h2>
                      <p className="text-slate-600 font-medium mt-2 leading-relaxed">
                        Tu pedido está siendo revisado por nuestro equipo. En breve recibirás tus credenciales. Puedes ver el estado en tu perfil.
                      </p>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Credentials card (instant delivery) */}
              {credDelivered && deliveredCredInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-2xl overflow-hidden border border-emerald-200 shadow-sm"
                >
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <p className="text-xs font-black uppercase tracking-widest text-white">Tus credenciales</p>
                  </div>
                  <div className="bg-white px-5 py-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <span className="text-lg">📧</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Correo</p>
                        <p className="text-sm font-mono font-bold text-slate-900">{deliveredCredInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <span className="text-lg">🔑</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Contraseña</p>
                        <p className="text-sm font-mono font-bold text-slate-900">{deliveredCredInfo.password}</p>
                      </div>
                    </div>
                    {deliveredCredInfo.instructions && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-lg">📋</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Instrucciones</p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{deliveredCredInfo.instructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Info card (pending — only for non-wallet non-instant) */}
              {!credDelivered && !processingIsWallet && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-blue-800">Seguimiento en tu perfil</p>
                    <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">Ve a <strong>Mis Suscripciones</strong> para ver el estado actualizado de tu pedido en tiempo real.</p>
                  </div>
                </motion.div>
              )}

              {/* Info card (wallet success without auto-credentials) */}
              {!credDelivered && processingIsWallet && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-800">Saldo descontado exitosamente</p>
                    <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">Tu acceso será asignado muy pronto y aparecerá en <strong>Mis Suscripciones</strong>.</p>
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col gap-2 pt-1"
              >
                <Button
                  className="w-full h-13 rounded-2xl font-black uppercase text-sm shadow-lg"
                  style={{ background: (credDelivered || processingIsWallet) ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #2563eb)", height: "52px" }}
                  onClick={() => { onClose(); window.location.href = "/perfil"; }}
                >
                  <User className="w-4 h-4 mr-2" />
                  {credDelivered ? "Ver mis credenciales" : processingIsWallet ? "Ver mis suscripciones" : "Ver estado del pedido"}
                </Button>
                <Button variant="ghost" className="w-full h-10 rounded-2xl font-bold text-slate-500 hover:bg-slate-100" onClick={onClose}>
                  Continuar comprando
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
