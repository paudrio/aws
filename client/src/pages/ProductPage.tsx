import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Checkout from "@/components/Checkout";
import GiftProductModal from "@/components/GiftProductModal";
import {
  Star, ShoppingBag, Gift, ShoppingCart, ChevronLeft, ChevronRight,
  Shield, Zap, CheckCircle2, MessageCircle,
  Users, ThumbsUp, Lock, BadgeCheck, Clock
} from "lucide-react";

type Review = { id: string; userName: string; email?: string; rating: number; comment: string; createdAt: string; isBot?: boolean };

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  useApp();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [userOwnsProduct, setUserOwnsProduct] = useState(false);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [relatedPage, setRelatedPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    window.scrollTo({ top: 0 });
    fetch("/api/products")
      .then(r => r.ok ? r.json() : [])
      .then((list: any[]) => {
        const found = list.find((p: any) => p.id === id);
        if (found) {
          setProduct(found);
          const related = list
            .filter((p: any) => p.id !== id && p.category === found.category && p.isActive !== false)
            .slice(0, 10);
          setRelatedProducts(related);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}/reviews`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setReviews(d.reviews || []); setReviewsAvg(d.avg || 0); setSalesCount(d.salesCount || 60); } })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user || !id) { setUserOwnsProduct(false); return; }
    setOwnershipLoading(true);
    fetch("/api/user/subscriptions", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((subs: any[]) => {
        const owns = subs.some((s: any) => s.productId === id);
        setUserOwnsProduct(owns);
      })
      .catch(() => setUserOwnsProduct(false))
      .finally(() => setOwnershipLoading(false));
  }, [user, id]);

  const handleSubmitReview = async () => {
    if (!reviewRating) { toast.error("Selecciona una calificación"); return; }
    if (reviewComment.trim().length < 5) { toast.error("El comentario debe tener al menos 5 caracteres"); return; }
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSubmitted(true);
        setReviews(prev => [data, ...prev]);
        const allRev = [...reviews, data];
        setReviewsAvg(Math.round((allRev.reduce((s, r) => s + r.rating, 0) / allRev.length) * 10) / 10);
        toast.success("¡Gracias por tu reseña!");
      } else {
        toast.error(data.error || "Error al guardar reseña");
      }
    } catch { toast.error("Error al guardar reseña"); } finally { setReviewSubmitting(false); }
  };

  const handleStartBuy = () => {
    setShowCheckout(true);
  };

  const descriptionLines = (product?.description || "")
    .split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  const ratingLabel = (r: number) =>
    r === 5 ? "Excelente" : r === 4 ? "Muy bueno" : r === 3 ? "Bueno" : r === 2 ? "Regular" : "Malo";

  const relatedPerPage = 5;
  const relatedTotalPages = Math.ceil(relatedProducts.length / relatedPerPage);
  const visibleRelated = relatedProducts.slice(relatedPage * relatedPerPage, (relatedPage + 1) * relatedPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-slate-500 font-semibold">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-800 text-xl font-black mb-2">Producto no encontrado</p>
          <p className="text-slate-400 text-sm mb-6">Este producto no existe o fue eliminado.</p>
          <Button onClick={() => setLocation("/")} className="rounded-2xl font-bold px-8">Volver al catálogo</Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.inStock === false || (product.stockQuantity !== null && product.stockQuantity !== -1 && product.stockQuantity !== undefined && product.stockQuantity <= 0);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center gap-2 text-sm">
          <button onClick={() => setLocation("/")} className="flex items-center gap-1 text-primary font-bold hover:underline transition-colors">
            <ChevronLeft className="w-4 h-4" /> Inicio
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 capitalize font-medium">{product.category}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold truncate max-w-[220px]">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ── HERO SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* LEFT: product info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Main product card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)" }} />

              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Product image */}
                <div className="shrink-0 mx-auto md:mx-0">
                  <div className="relative w-52 h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-md flex items-center justify-center">
                    <img
                      src={product.image?.startsWith("/") || product.image?.startsWith("http") ? product.image : `/uploads/${product.image}`}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {product.isPopular && (
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
                          🔥 Popular
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title, rating, highlights */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.verifiedSeller && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-white bg-slate-800">
                        <BadgeCheck className="w-3 h-3 text-amber-300" /> Verificado
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Disponible
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight mb-4">{product.name}</h1>

                  {/* Rating row */}
                  <div className="flex items-center gap-3 mb-5 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewsAvg || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <span className="font-black text-slate-800 text-sm">{reviewsAvg > 0 ? reviewsAvg.toFixed(1) : "5.0"}</span>
                    <span className="text-slate-400 text-sm">·</span>
                    <span className="text-slate-500 text-sm">{reviews.length > 0 ? `${reviews.length} reseña${reviews.length !== 1 ? "s" : ""}` : "Nuevo"}</span>
                    <span className="text-slate-400 text-sm">·</span>
                    <span className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> +{salesCount > 0 ? salesCount : 60} ventas
                    </span>
                  </div>

                  {/* Description features */}
                  {descriptionLines.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {descriptionLines.slice(0, 5).map((line: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </div>
                          <span className="text-sm text-slate-700 leading-snug">{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Remaining description */}
              {descriptionLines.length > 5 && (
                <div className="px-6 pb-6 border-t border-slate-50 pt-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Más detalles</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {descriptionLines.slice(5).map((line: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-sm text-slate-600 leading-snug">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Aviso importante — sin reembolso */}
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#a5b4fc', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#a5b4fc', background: 'rgba(99,102,241,0.1)' }}>
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-black uppercase tracking-wide" style={{ color: '#3730a3' }}>Aviso importante antes de comprar</p>
              </div>
              <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="text-base shrink-0">📋</span>
                  <div>
                    <p className="text-sm font-bold mb-0.5" style={{ color: '#3730a3' }}>Lee la descripción completa del producto</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#4f46e5' }}>Asegúrate de entender qué incluye el servicio, la duración y los requisitos antes de realizar tu compra. Esta información se muestra arriba.</p>
                  </div>
                </div>
                <div className="h-px sm:h-auto sm:w-px shrink-0" style={{ background: '#a5b4fc' }} />
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="text-base shrink-0">🚫</span>
                  <div>
                    <p className="text-sm font-bold text-red-700 mb-0.5">No se aceptan reembolsos</p>
                    <p className="text-xs text-red-600 leading-relaxed">Una vez confirmado y procesado el pago, <strong>no se realizan devoluciones bajo ningún concepto.</strong> Al comprar aceptas esta política.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarantees strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Zap, label: "Entrega inmediata", desc: "Credenciales al instante", color: "text-indigo-500", bg: "from-indigo-50 to-violet-50", border: "border-indigo-100" },
                { icon: Shield, label: "Pago 100% seguro", desc: "Datos cifrados y protegidos", color: "text-emerald-600", bg: "from-emerald-50 to-green-50", border: "border-emerald-100" },
                { icon: BadgeCheck, label: "Garantía total", desc: "Servicio garantizado", color: "text-blue-500", bg: "from-blue-50 to-indigo-50", border: "border-blue-100" },
                { icon: MessageCircle, label: "Soporte 24/7", desc: "Por WhatsApp directamente", color: "text-violet-500", bg: "from-violet-50 to-purple-50", border: "border-violet-100" },
              ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                <div key={label} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-4 flex flex-col items-center text-center`}>
                  <Icon className={`w-6 h-6 ${color} mb-2`} />
                  <p className="text-xs font-black text-slate-800 leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{desc}</p>
                </div>
              ))}
            </div>

            {/* ── REVIEWS ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Reseñas de compradores</p>
                    <div className="flex items-center gap-3">
                      <span className="text-5xl font-black text-slate-900 leading-none">
                        {reviewsAvg > 0 ? reviewsAvg.toFixed(1) : "4.9"}
                      </span>
                      <div>
                        <div className="flex items-center gap-0.5 mb-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-5 h-5 ${s <= Math.round(reviewsAvg || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{reviews.length} calificación{reviews.length !== 1 ? "es" : ""}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating bars — siempre visibles */}
                  <div className="flex flex-col gap-1.5 min-w-[180px]">
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-3 text-right">{star}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                          </div>
                          <span className="text-[10px] text-slate-400 w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  {reviews.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex gap-4 pb-5 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm font-black text-white text-sm uppercase"
                        style={{ background: [
                          'linear-gradient(135deg, #6366f1, #4f46e5)',
                          'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          'linear-gradient(135deg, #ec4899, #db2777)',
                          'linear-gradient(135deg, #06b6d4, #0891b2)',
                          'linear-gradient(135deg, #10b981, #059669)',
                          'linear-gradient(135deg, #3b82f6, #2563eb)',
                          'linear-gradient(135deg, #f59e0b, #d97706)',
                        ][idx % 7] }}>
                        {(r.userName || "U").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-slate-900">{r.userName}</span>
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <ThumbsUp className="w-2.5 h-2.5" /> Comprador verificado
                              </span>
                            </div>
                            {r.email && (
                              <span className="text-[10px] text-slate-400 font-medium">{r.email}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString("es-GT")}</span>
                          </div>
                        </div>
                        <p className="text-xs font-bold mb-1.5" style={{ color: r.rating >= 5 ? '#059669' : r.rating >= 4 ? '#2563eb' : r.rating >= 3 ? '#d97706' : '#dc2626' }}>{ratingLabel(r.rating)}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Review form — only if user owns the product */}
                {user && !ownershipLoading && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    {!userOwnsProduct ? (
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700">Reseña exclusiva para compradores</p>
                          <p className="text-xs text-slate-500 mt-0.5">Solo puedes dejar una reseña si adquiriste este producto.</p>
                        </div>
                        <button
                          onClick={() => handleStartBuy()}
                          className="ml-auto shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white"
                          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                        >
                          Comprar
                        </button>
                      </div>
                    ) : reviewSubmitted ? (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <p className="text-sm font-black text-emerald-700">¡Reseña publicada! Gracias por compartir tu experiencia.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Tu reseña</p>
                        <div className="flex items-center gap-1 mb-4">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => setReviewRating(s)} onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)} className="transition-transform hover:scale-110 p-0.5">
                              <Star className={`w-9 h-9 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            </button>
                          ))}
                          {(reviewHover || reviewRating) > 0 && (
                            <span className="ml-2 text-sm font-black text-amber-500">{ratingLabel(reviewHover || reviewRating)}</span>
                          )}
                        </div>
                        <textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          placeholder="Cuéntanos tu experiencia con este producto..."
                          rows={4}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400 mb-3 transition"
                          maxLength={500}
                        />
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs text-slate-400">{reviewComment.length}/500 caracteres</span>
                          <Button
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting || !reviewRating || reviewComment.trim().length < 5}
                            className="rounded-2xl font-black uppercase text-sm px-8"
                            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                          >
                            {reviewSubmitting ? "Publicando..." : "Publicar reseña"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!user && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-blue-800">Inicia sesión para dejar una reseña</p>
                        <p className="text-xs text-blue-600 mt-0.5">Solo los compradores verificados pueden calificar.</p>
                      </div>
                      <button
                        onClick={() => setLocation("/auth")}
                        className="ml-auto shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        Iniciar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RELATED PRODUCTS ── */}
            {relatedProducts.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7c3aed, #4c1d95)" }} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Categoría: <span className="capitalize">{product.category}</span></p>
                      <p className="text-lg font-black text-slate-900">Productos similares</p>
                    </div>
                    {relatedTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRelatedPage(p => Math.max(0, p - 1))}
                          disabled={relatedPage === 0}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                        <span className="text-xs text-slate-400 font-medium">{relatedPage + 1}/{relatedTotalPages}</span>
                        <button
                          onClick={() => setRelatedPage(p => Math.min(relatedTotalPages - 1, p + 1))}
                          disabled={relatedPage >= relatedTotalPages - 1}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <AnimatePresence mode="wait">
                      {visibleRelated.map((p, i) => (
                        <motion.button
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => { setRelatedPage(0); setLocation(`/producto/${p.id}`); }}
                          className="group text-left rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-2">
                            <img
                              src={p.image?.startsWith("/") || p.image?.startsWith("http") ? p.image : `/uploads/${p.image}`}
                              alt={p.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-black text-slate-800 leading-tight line-clamp-2 mb-1.5">{p.name}</p>
                            <p className="text-sm font-black" style={{ color: '#4f46e5' }}>Q{p.price}</p>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Buy card ── */}
          <div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
              <div className="p-6">
                {/* Price */}
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Precio</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-black text-slate-900 leading-none">Q{product.price}</span>
                  {product.isMonthly !== false && <span className="text-slate-400 text-sm font-semibold mb-0.5">/ mes</span>}
                </div>
                {product.priceUsd && (
                  <p className="text-slate-400 text-sm mb-4">${product.priceUsd} USD</p>
                )}

                {/* Buy button */}
                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase text-base mb-3 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                  style={{ background: isOutOfStock ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  onClick={() => !isOutOfStock && handleStartBuy()}
                  disabled={isOutOfStock}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {isOutOfStock ? "Sin stock" : "Comprar ahora"}
                </Button>

                {user && !isOutOfStock && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setShowGift(true)} className="flex-1 h-11 rounded-xl border-2 border-pink-300 text-pink-600 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-pink-50 transition-colors">
                      <Gift className="w-4 h-4" /> Regalar
                    </button>
                    <button onClick={() => { addItem(product); toast.success("Añadido al carrito"); }} className="flex-1 h-11 rounded-xl border-2 border-indigo-300 text-indigo-600 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-colors">
                      <ShoppingCart className="w-4 h-4" /> Carrito
                    </button>
                  </div>
                )}

                {/* Trust badges */}
                <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 mb-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Compra protegida</p>
                  {[
                    { icon: Shield, text: "Pago 100% seguro y cifrado", color: "text-emerald-500" },
                    { icon: Clock, text: "Entrega inmediata tras el pago", color: "text-amber-500" },
                    { icon: BadgeCheck, text: "Producto verificado por PAUDRONIX GT", color: "text-blue-500" },
                  ].map(({ icon: Icon, text, color }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                      <Icon className={`w-4 h-4 ${color} shrink-0`} />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Payment methods */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Método de pago</p>
                  <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: '#eef2ff', border: '1px solid #a5b4fc' }}>
                    <span className="text-[11px] font-black" style={{ color: '#4f46e5' }}>💳 Saldo PAUDRONIX GT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && <Checkout product={product} onClose={() => setShowCheckout(false)} />}
      {showGift && <GiftProductModal product={product} onClose={() => setShowGift(false)} />}
    </div>
  );
}
