import React, { useState, useEffect, useRef } from "react";
import { useCart, CartItem } from "@/lib/cartContext";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wallet, ChevronLeft,
  CheckCircle2, ShoppingBag, LogIn, Eye, EyeOff, AlertTriangle, Clock, User, Gamepad2, UserCheck,
} from "lucide-react";

interface CartCheckoutProps {
  onClose: () => void;
}

export default function CartCheckout({ onClose }: CartCheckoutProps) {
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { refreshData } = useApp() as any;

  const [step, setStep] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);

  const [customerName, setCustomerName] = useState(
    user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : ""
  );
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [fortniteUsername, setFortniteUsername] = useState("");

  const isPavosOrder = items.length > 0 && items.every(i => i.product?.category === "Fortnite Pavos");
  const [showPassword, setShowPassword] = useState(false);
  const [payingWithWallet, setPayingWithWallet] = useState(false);
  const [orderRef] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingIsWallet, setProcessingIsWallet] = useState(false);
  const processingStartRef = useRef<number>(0);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/user/balance", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setWalletBalance(d.balance); })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleWalletPurchase = async () => {
    if (isPavosOrder) {
      if (!fortniteUsername.trim()) { toast.error("Ingresa tu usuario de Fortnite"); return; }
    } else {
      if (!customerName) { toast.error("Ingresa tu nombre"); return; }
    }
    if (walletBalance < totalPrice) { toast.error("Saldo insuficiente"); return; }
    setPayingWithWallet(true);
    const finishProcessing = startProcessingAnimation(true);
    try {
      const effectiveName = isPavosOrder ? fortniteUsername.trim() : customerName;
      const promises = items.map(({ product, quantity }) =>
        fetch("/api/orders/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            customerName: effectiveName,
            customerPhone: customerWhatsapp ? `502${customerWhatsapp}` : "",
            productId: product.id,
            productName: product.name,
            price: product.price * quantity,
            paymentMethod: "saldo",
            deliveryMethod: isPavosOrder ? "perfil" : (customerWhatsapp ? "whatsapp" : "perfil"),
            deliveryContact: isPavosOrder ? fortniteUsername.trim() : (customerWhatsapp ? `502${customerWhatsapp}` : ""),
            customerEmail: customerEmail || "",
            customerPassword: customerPassword || "",
            orderRef,
          }),
        }).then(async r => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Error al crear pedido");
          return data;
        })
      );
      await Promise.all(promises);
      finishProcessing(() => { setStep(3); refreshData(); });
    } catch {
      setIsProcessing(false);
      toast.error("Error al procesar pago con saldo");
    } finally {
      setPayingWithWallet(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Inicia Sesión</h2>
            <p className="text-slate-500 text-sm">Para completar tu compra necesitas iniciar sesión primero.</p>
            <div className="flex flex-col gap-3">
              <a href="/auth">
                <Button className="w-full h-12 rounded-xl font-black uppercase" style={{ background: '#6366f1' }}>
                  <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión / Registrarse
                </Button>
              </a>
              <Button variant="outline" className="w-full h-10 rounded-xl font-bold" onClick={onClose}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const walletWords = [
    { text: "Verificando tu saldo...", sub: "Comprobando fondos disponibles" },
    { text: "Procesando el pago...", sub: "Descontando del saldo" },
    { text: "Entregando tu compra...", sub: "Buscando información del producto" },
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
    <Dialog open onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl max-h-[92vh] flex flex-col [&>button.absolute]:hidden">
        {/* PROCESSING SCREEN */}
        {isProcessing && (
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
        )}
        <div className={`overflow-y-auto flex-1 ${isProcessing ? "hidden" : ""}`}>

          {/* PASO 1 — Selección de método de pago */}
          {step === 1 && (
            <div>
              {/* Header */}
              <div className="px-6 pt-7 pb-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 60%)' }} />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Pago del Carrito</p>

                {/* Items resumen */}
                <div className="space-y-1 mb-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <span className="text-sm text-white/70 truncate mr-2">{product.name}{quantity > 1 ? ` ×${quantity}` : ""}</span>
                      <span className="text-sm font-bold text-white shrink-0">Q{product.price * quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/20 pt-3 flex items-baseline gap-2">
                  <span className="text-white/50 text-sm font-bold">Total</span>
                  <span className="text-[40px] font-black tracking-tight leading-none">Q{totalPrice}</span>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Método de pago</p>
                <div className="flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-[#6366f1] bg-[#6366f1] text-white">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/20">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm">Saldo PAUDRONIX GT</p>
                    <p className="text-xs text-white/70">Saldo disponible: Q{walletBalance}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                </div>
                {walletBalance < totalPrice && (
                  <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-800">Saldo insuficiente</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Necesitas <span className="font-black">Q{totalPrice}</span> · Tienes <span className="font-black">Q{walletBalance}</span>. Recarga tu saldo para continuar.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { onClose(); window.location.href = "/perfil"; }}
                      className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                    >
                      <Wallet className="w-3.5 h-3.5" /> Ir a Recargar Saldo
                    </button>
                  </div>
                )}

                <Button
                  className="w-full mt-5 h-13 rounded-2xl font-black uppercase text-base"
                  style={{ background: '#0f172a' }}
                  disabled={walletBalance < totalPrice}
                  onClick={() => setStep(2)}
                >
                  {walletBalance < totalPrice ? "SALDO INSUFICIENTE" : `PAGAR Q${totalPrice}`}
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2 — Saldo */}
          {step === 2 && (() => {
            const emailRequired = items.some(i => i.product?.requiresCustomerEmail);
            const emailLabel = items.find(i => i.product?.requiresCustomerEmail)?.product?.customerEmailLabel || "Datos de acceso requeridos";
            return (
            <div className="p-6 space-y-4">
              <div className="rounded-3xl p-5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#1d4ed8)' }}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Pago con Saldo</p>
                <p className="text-2xl font-black">Q{totalPrice}</p>
                <p className="text-xs opacity-70 mt-1">Tu saldo: Q{walletBalance} → Q{walletBalance - totalPrice} después</p>
              </div>

              {isPavosOrder ? (
                /* Modo Fortnite Pavos: solo usuario de Fortnite + aviso del bot */
                <div className="space-y-3">
                  <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 overflow-hidden">
                    <div className="px-4 py-3 flex items-start gap-3" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                      <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-wide leading-tight">¡Importante antes de comprar!</p>
                        <p className="text-[11px] text-white/85 mt-1 leading-relaxed">
                          Debes <span className="font-black text-yellow-300">mandar solicitud de amistad a nuestro bot</span> en Fortnite antes de pagar. La skin llega como regalo en hasta <span className="font-black text-yellow-300">2 días</span>. Sin la solicitud de amistad no podremos enviarte el regalo.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-600" /> Usuario de Fortnite <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={fortniteUsername}
                      onChange={e => setFortniteUsername(e.target.value)}
                      placeholder="Tu usuario de Epic Games"
                      className="rounded-xl bg-slate-50 h-11 text-sm border-slate-200 focus:border-purple-500"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-slate-500">Ingresa exactamente como aparece en Fortnite. Sin contraseñas — todo llega como regalo oficial.</p>
                  </div>
                </div>
              ) : emailRequired ? (
                /* Modo email requerido: solo correo + contraseña, sin nombre ni whatsapp */
                <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-sm">
                  <div className="bg-gradient-to-r from-primary to-indigo-500 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wide leading-tight">{emailLabel}</p>
                      <p className="text-[11px] text-white/80 mt-0.5">Ingresa tus datos para activar el servicio</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="font-black text-xs uppercase tracking-widest text-slate-600">Correo electrónico <span className="text-red-500">*</span></Label>
                      <Input
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
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
                          onChange={e => setCustomerPassword(e.target.value)}
                          placeholder="Contraseña de tu cuenta"
                          className="rounded-xl bg-slate-50 h-11 text-sm border-slate-200 focus:border-primary pr-11"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Modo normal: nombre, whatsapp y outlook opcional */
                <div className="space-y-3">
                  <div>
                    <Label className="font-black uppercase text-xs">Tu nombre</Label>
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={user?.firstName || "Tu nombre"} className="rounded-xl bg-slate-50 mt-1" />
                  </div>
                  <div>
                    <Label className="font-black uppercase text-xs">WhatsApp <span className="text-slate-400 font-normal normal-case">(opcional)</span></Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-100 text-slate-700 font-black text-sm px-4 py-2.5 rounded-xl border border-slate-200">+502</span>
                      <Input value={customerWhatsapp} onChange={e => setCustomerWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="1234 5678" className="rounded-xl flex-1" maxLength={8} inputMode="numeric" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2.5 flex items-start gap-2 border-b border-slate-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Correo Outlook y contraseña <span className="font-normal normal-case text-slate-400">(opcional)</span></p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Solo necesario si el juego o servicio requiere correo y contraseña para iniciar sesión.</p>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 bg-white">
                      <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="ejemplo@outlook.com" className="rounded-xl bg-slate-50" type="email" />
                      <div className="relative">
                        <Input value={customerPassword} onChange={e => setCustomerPassword(e.target.value)} placeholder="Contraseña de la cuenta" className="rounded-xl bg-slate-50 pr-10" type={showPassword ? "text" : "password"} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-black uppercase"
                  style={{ background: '#6366f1' }}
                  disabled={payingWithWallet || walletBalance < totalPrice || (isPavosOrder && !fortniteUsername.trim()) || (!isPavosOrder && !emailRequired && !customerName) || (!isPavosOrder && emailRequired && !customerEmail.trim())}
                  onClick={handleWalletPurchase}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {payingWithWallet ? "Procesando..." : walletBalance < totalPrice ? "Saldo insuficiente" : "Pagar"}
                </Button>
              </div>
              {isPavosOrder && !fortniteUsername.trim() && (
                <p className="text-center text-xs text-red-500 font-bold -mt-2">Ingresa tu usuario de Fortnite para continuar</p>
              )}
              {!isPavosOrder && emailRequired && !customerEmail.trim() && (
                <p className="text-center text-xs text-red-500 font-bold -mt-2">Ingresa tu correo para continuar</p>
              )}
            </div>
            );
          })()}

          {/* PASO 3 — Confirmación */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden">
              {/* Animated background */}
              <div className={`absolute inset-0 pointer-events-none ${processingIsWallet ? "bg-gradient-to-b from-emerald-50 via-white to-white" : "bg-gradient-to-b from-blue-50 via-white to-white"}`} />

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full opacity-60 ${processingIsWallet ? ["bg-emerald-400","bg-amber-400","bg-indigo-300","bg-yellow-400"][i%4] : ["bg-blue-400","bg-indigo-400","bg-purple-300","bg-sky-400"][i%4]}`}
                    initial={{ y: 60, x: `${8 + i * 8}%`, opacity: 0, scale: 0 }}
                    animate={{ y: -20, opacity: [0, 0.8, 0], scale: [0, 1.2, 0.6] }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 1.8, ease: "easeOut" }}
                  />
                ))}
              </div>

              <div className="relative p-7 space-y-5">
                {/* Icon + title */}
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                    <motion.div
                      className={`absolute inset-0 rounded-full ${processingIsWallet ? "bg-emerald-100" : "bg-blue-100"}`}
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className={`absolute inset-2 rounded-full ${processingIsWallet ? "bg-emerald-200" : "bg-blue-200"}`}
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                    />
                    <motion.div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${processingIsWallet ? "bg-emerald-500" : "bg-blue-500"}`}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-9 h-9 text-white" />
                    </motion.div>
                    {[0,60,120,180,240,300].map((deg, i) => (
                      <motion.div
                        key={deg}
                        className={`absolute w-2 h-2 rounded-full ${processingIsWallet ? "bg-amber-400" : "bg-indigo-400"}`}
                        style={{ transformOrigin: "50% 50%", left: "50%", top: "50%", marginLeft: -4, marginTop: -4 }}
                        initial={{ scale: 0, x: 0, y: 0 }}
                        animate={{ scale: [0, 1.2, 0], x: Math.cos((deg * Math.PI) / 180) * 52, y: Math.sin((deg * Math.PI) / 180) * 52 }}
                        transition={{ delay: 0.5 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                      />
                    ))}
                  </div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    {processingIsWallet ? (
                      <>
                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago con saldo
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">¡Compra exitosa!</h2>
                        <p className="text-slate-600 font-medium mt-2 leading-relaxed">Tu saldo fue descontado. Tu compra quedó registrada y aparecerá en tu perfil muy pronto.</p>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                          <Clock className="w-3.5 h-3.5" /> En revisión
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">¡Pedido recibido!</h2>
                        <p className="text-slate-600 font-medium mt-2 leading-relaxed">Tu pedido está siendo revisado. En breve nuestro equipo confirmará y procesará tu entrega.</p>
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Summary card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  className={`rounded-2xl p-4 space-y-1 text-left border ${processingIsWallet ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${processingIsWallet ? "text-emerald-600" : "text-blue-600"}`}>Resumen</p>
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-slate-600 truncate mr-2">{product.name}{quantity > 1 ? ` ×${quantity}` : ""}</span>
                      <span className="font-bold text-slate-800 shrink-0">Q{(product.price * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-black text-slate-900">
                    <span>Total</span>
                    <span>Q{totalPrice.toFixed(2)}</span>
                  </div>
                </motion.div>

                {/* Buttons */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-col gap-2">
                  <Button
                    className="w-full h-13 rounded-2xl font-black uppercase text-sm shadow-lg"
                    style={{ background: processingIsWallet ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#3b82f6,#2563eb)", height: "52px" }}
                    onClick={() => { clearCart(); onClose(); window.location.href = "/perfil"; }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {processingIsWallet ? "Ver mis compras" : "Ver estado del pedido"}
                  </Button>
                  <Button variant="ghost" className="w-full h-10 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                    onClick={() => { clearCart(); onClose(); }}>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Seguir comprando
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
