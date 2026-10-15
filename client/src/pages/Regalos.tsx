import { useState, useEffect } from "react";
import { Gift, Mail, CheckCircle2, AlertCircle, Loader2, Send, X, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  isActive?: boolean;
  inStock?: boolean;
}

interface RecipientInfo {
  found: boolean;
  name?: string;
}

export default function Regalos() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<{ productName: string; recipientName: string; credDelivered: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data.filter((p: Product) => p.isActive !== false && p.inStock !== false) : [];
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) { setRecipientInfo(null); return; }
    if (email === user?.email) {
      setRecipientInfo({ found: false });
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/user/check-recipient?email=" + encodeURIComponent(email), { credentials: "include" });
      const data = await res.json();
      setRecipientInfo(data);
    } catch {
      setRecipientInfo(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedProduct || !recipientInfo?.found) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/user/send-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipientEmail, productId: selectedProduct.id, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess({ productName: data.productName, recipientName: data.recipientName, credDelivered: !!data.credDelivered });
        setSelectedProduct(null);
        setRecipientEmail("");
        setRecipientInfo(null);
        setMessage("");
      } else {
        setError(data.error || "Error al enviar el regalo");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fffbf5' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 32px rgba(234,88,12,0.3)' }}>
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Regalos</h2>
          <p className="text-slate-500 font-medium mb-6">Debes iniciar sesión para poder regalar suscripciones.</p>
          <Link href="/auth">
            <button className="w-full py-3 rounded-2xl font-black uppercase text-white text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              Iniciar Sesión
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fffbf5' }}>
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 8px 32px rgba(22,163,74,0.3)' }}>
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">¡Regalo Enviado!</h2>
          {success.credDelivered ? (
            <>
              <p className="text-slate-600 font-medium mb-1">
                <strong>{success.recipientName}</strong> ya tiene su suscripción de <strong>{success.productName}</strong> activa con sus credenciales de acceso.
              </p>
              <p className="text-slate-400 text-sm font-medium mb-8">
                Le enviamos un correo con sus datos de acceso inmediatamente.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-600 font-medium mb-1">
                <strong>{success.recipientName}</strong> recibió el regalo de <strong>{success.productName}</strong>.
              </p>
              <p className="text-amber-600 text-sm font-bold mb-1">
                ⏳ Sus credenciales de acceso serán asignadas por el equipo muy pronto.
              </p>
              <p className="text-slate-400 text-sm font-medium mb-8">
                Recibirá un correo en cuanto estén listas.
              </p>
            </>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSuccess(null)}
              className="w-full py-3 rounded-2xl font-black uppercase text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              Enviar Otro Regalo
            </button>
            <Link href="/">
              <button className="w-full py-3 rounded-2xl font-black uppercase text-slate-600 text-sm border-2 border-slate-200 hover:bg-slate-50">
                Volver al Inicio
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#fffbf5' }}>

      {/* Header */}
      <div className="py-10 px-4 text-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Gift className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">Enviar un Regalo</h1>
        <p className="text-white/80 font-medium text-lg">Regala una suscripción a alguien especial</p>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Paso 1: Correo del destinatario */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-black">1</span>
            ¿A quién le vas a regalar?
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-4">El destinatario debe estar registrado en PAUDRONIX GT.</p>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={recipientEmail}
                onChange={e => { setRecipientEmail(e.target.value); setRecipientInfo(null); }}
                onBlur={() => checkEmail(recipientEmail)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
            <button
              onClick={() => checkEmail(recipientEmail)}
              disabled={checkingEmail}
              className="px-5 py-3 rounded-2xl font-black uppercase text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              {checkingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
            </button>
          </div>

          {recipientInfo !== null && (
            <div className={`mt-3 flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl ${
              recipientInfo.found ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {recipientInfo.found
                ? <><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> Usuario encontrado: <span className="font-black">{recipientInfo.name}</span></>
                : <><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> {recipientEmail === user?.email ? "No puedes regalarte a ti mismo." : "No existe ningún usuario con ese correo."}</>
              }
            </div>
          )}
        </div>

        {/* Paso 2: Elegir producto */}
        <div className="mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-black">2</span>
            Elige qué quieres regalar
          </h2>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">No hay productos disponibles.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border-2 transition-all hover:shadow-md"
                  style={{ borderColor: selectedProduct?.id === product.id ? '#6366f1' : '#f1f5f9' }}
                >
                  {product.image && (
                    <img
                      src={product.image.startsWith("/") || product.image.startsWith("http") ? product.image : `/uploads/${product.image}`}
                      alt={product.name}
                      className="w-full h-28 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight mb-1 line-clamp-2">{product.name}</p>
                    <p className="font-black text-base mb-3" style={{ color: '#6366f1' }}>Q{product.price}</p>
                    <button
                      onClick={() => {
                        if (!recipientInfo?.found) {
                          document.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
                          return;
                        }
                        setSelectedProduct(product);
                        setError("");
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
                        recipientInfo?.found
                          ? "text-white hover:opacity-90 active:scale-[0.97]"
                          : "text-slate-400 cursor-not-allowed"
                      }`}
                      style={{
                        background: recipientInfo?.found
                          ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                          : '#f1f5f9',
                        boxShadow: recipientInfo?.found ? '0 2px 8px rgba(234,88,12,0.25)' : 'none'
                      }}
                    >
                      <Gift className="w-3 h-3" />
                      {recipientInfo?.found ? "Regalar" : "Escribe el correo"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {selectedProduct && recipientInfo?.found && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tight">Confirmar regalo</p>
                  <p className="text-xs text-slate-500 font-medium">Se descontará de tu saldo</p>
                </div>
              </div>
              <button onClick={() => { setSelectedProduct(null); setError(""); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="px-6 pb-2">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 mb-4">
                {selectedProduct.image && (
                  <img
                    src={selectedProduct.image.startsWith("/") || selectedProduct.image.startsWith("http") ? selectedProduct.image : `/uploads/${selectedProduct.image}`}
                    alt={selectedProduct.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{selectedProduct.name}</p>
                  <p className="font-black text-indigo-600 text-base">Q{selectedProduct.price}</p>
                  <p className="text-xs text-slate-500">Para: <strong>{recipientInfo.name}</strong></p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wide mb-1.5">Mensaje (opcional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="¡Feliz cumpleaños! Te regalo esta suscripción..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-sm font-medium resize-none focus:outline-none focus:border-indigo-400"
                  rows={2}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm font-bold px-4 py-3 rounded-2xl mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pb-6">
                <button
                  onClick={() => { setSelectedProduct(null); setError(""); }}
                  className="flex-1 py-3 rounded-2xl font-black uppercase text-sm text-slate-600 border-2 border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendGift}
                  disabled={sending}
                  className="flex-1 py-3 rounded-2xl font-black uppercase text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 12px rgba(234,88,12,0.3)' }}
                >
                  {sending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : <><Send className="w-4 h-4" /> Confirmar</>
                  }
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
