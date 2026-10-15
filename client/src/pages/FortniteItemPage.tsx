import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useCart } from "@/lib/cartContext";
import { ShoppingCart, ChevronLeft, Shield, Clock, Gift, CheckCircle2 } from "lucide-react";

type FortniteItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  image2: string;
  image3: string;
  section: string;
  imagesJson: string;
  pavos: number;
  price: number;
  originalPrice: number;
  isActive: boolean;
  order: number;
};

function getImages(item: FortniteItem): string[] {
  if (item.imagesJson) {
    try {
      const parsed = JSON.parse(item.imagesJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
    } catch {}
  }
  return [item.image, item.image2, item.image3].filter(Boolean);
}

function Slideshow({ images, title }: { images: string[]; title: string }) {
  const slides = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % slides.length), 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [slides.length]);

  if (slides.length === 0) return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="font-black text-purple-400 text-8xl leading-none opacity-20">V</span>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {slides.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={i === 0 ? title : ""}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      {slides.length > 1 && (
        <>
          {/* Thumbnails */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${i === idx ? "w-6 h-2 bg-yellow-400" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FortniteItemPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem, openCart } = useCart();

  const [item, setItem] = useState<FortniteItem | null>(null);
  const [related, setRelated] = useState<FortniteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0 });
    fetch("/api/fortnite-items")
      .then(r => r.ok ? r.json() : [])
      .then((all: FortniteItem[]) => {
        const found = all.find(i => i.id === id && i.isActive);
        setItem(found || null);
        if (found) {
          setRelated(
            all.filter(i => i.id !== id && i.isActive && i.section === found.section).slice(0, 8)
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleBuy = () => {
    if (!item) return;
    const imgs = getImages(item);
    addItem({
      id: item.id,
      name: item.title,
      price: item.price,
      image: imgs[0] || item.image || "",
      category: "Fortnite Pavos",
      isMonthly: false,
      showWhatsapp: true,
      showBinance: false,
      showBanrural: false,
      showBac: false,
      showBi: false,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 3000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
        <p className="text-slate-400 font-semibold">Cargando...</p>
      </div>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
      <div className="text-center">
        <span className="font-black text-slate-700 text-8xl leading-none block text-center mb-4">V</span>
        <p className="text-white font-black text-xl mb-2">Item no encontrado</p>
        <p className="text-slate-500 text-sm mb-6">Este item no existe o ya no está disponible.</p>
        <button
          onClick={() => setLocation("/pavos")}
          className="px-6 py-3 rounded-2xl font-black text-white"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );

  const images = getImages(item);
  const discountPct = item.originalPrice > 0 && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#13082e 0%,#0d1535 50%,#0a1628 100%)" }}>
      {/* ── Breadcrumb / back ── */}
      <div className="border-b border-white/10" style={{ background: "#1a0d3a" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <button
            onClick={() => setLocation("/pavos")}
            className="flex items-center gap-1.5 text-yellow-400 font-bold hover:text-yellow-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Pavos & Skins
          </button>
          <span className="text-slate-700">/</span>
          {item.section && (
            <>
              <span className="text-slate-500 font-medium uppercase text-xs tracking-wider">{item.section}</span>
              <span className="text-slate-700">/</span>
            </>
          )}
          <span className="text-slate-400 font-medium truncate max-w-[200px]">{item.title}</span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* LEFT — imagen grande */}
          <div className="lg:col-span-3 space-y-4">
            <div
              className="relative w-full rounded-3xl overflow-hidden border border-white/5"
              style={{ paddingBottom: "100%", background: "radial-gradient(ellipse at center,#3a1475 0%,#0d1848 100%)" }}
            >
              <div className="absolute inset-0">
                <Slideshow images={images} title={item.title} />
              </div>

              {/* Badges sobre imagen */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
                {discountPct > 0 && (
                  <span className="bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg">
                    -{discountPct}% DESCUENTO
                  </span>
                )}
                {item.pavos > 0 && (
                  <span className="flex items-center gap-1.5 bg-[#0f2a3a]/90 border border-[#5bc4f5]/60 text-[#5bc4f5] text-sm font-black px-3 py-1.5 rounded-xl">
                    {item.pavos.toLocaleString()} V-Bucks
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails list */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <img
                    key={src + i}
                    src={src}
                    alt=""
                    className="w-16 h-16 object-contain rounded-xl border-2 border-white/10 shrink-0 cursor-pointer hover:border-yellow-400/60 transition-colors"
                    style={{ background: "#0d0d1a" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — info + compra */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title & section */}
            {item.section && (
              <span className="inline-block bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 text-xs font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                {item.section}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{item.title}</h1>

            {/* Price block */}
            <div
              className="rounded-2xl p-5 border border-white/5"
              style={{ background: "linear-gradient(135deg,#18102e,#0d1225)" }}
            >
              {item.originalPrice > 0 && item.originalPrice > item.price && (
                <p className="text-slate-500 text-base line-through mb-1">
                  Q{Number(item.originalPrice).toFixed(2)}
                </p>
              )}
              <div className="flex items-end gap-3">
                <p
                  className="text-5xl font-black leading-none"
                  style={{ color: "#f8d43a", textShadow: "0 0 30px #f8d43a50" }}
                >
                  Q{Number(item.price).toFixed(2)}
                </p>
                {discountPct > 0 && (
                  <span className="text-sm text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded-full mb-1">
                    Ahorras Q{(Number(item.originalPrice) - Number(item.price)).toFixed(2)}
                  </span>
                )}
              </div>
              {item.pavos > 0 && (
                <p className="text-[#5bc4f5] font-black text-sm mt-2 flex items-center gap-1.5">
                  Incluye {item.pavos.toLocaleString()} V-Bucks
                </p>
              )}
            </div>

            {/* Buy button */}
            <button
              onClick={handleBuy}
              className="w-full h-14 rounded-2xl font-black text-lg uppercase tracking-wider text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xl"
              style={{ background: added ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 28px #7c3aed50" }}
            >
              {added ? (
                <><CheckCircle2 className="w-5 h-5" /> ¡Agregado al carrito!</>
              ) : (
                <><ShoppingCart className="w-5 h-5" /> Agregar al carrito</>
              )}
            </button>

            {/* Garantías */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: "100% Seguro", color: "#22c55e" },
                { icon: Clock, label: "Hasta 2 días", color: "#60a5fa" },
                { icon: Gift, label: "Regalo oficial", color: "#a855f7" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-white/5 text-center" style={{ background: "#ffffff05" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                  <p className="text-white text-[10px] font-bold leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {item.description && (
              <div className="rounded-2xl p-4 border border-white/5" style={{ background: "#ffffff06" }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Descripción</p>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
              </div>
            )}

            {/* Cómo funciona */}
            <div
              className="rounded-2xl p-5 border border-purple-500/20"
              style={{ background: "linear-gradient(135deg,#3a147590,#0d2b5e80)" }}
            >
              <p className="text-[11px] font-black uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-1.5">
                <span className="font-black text-xs leading-none">V</span> ¿Cómo funciona?
              </p>
              <div className="space-y-3">
                {[
                  { num: "1", icon: ShoppingCart, text: "Agrega al carrito y completa el pago con tu saldo PAUDRONIX GT" },
                  { num: "2", icon: Gift, text: "Nuestro bot envía solicitud de amistad desde Epic Games — acéptala" },
                  { num: "3", icon: Clock, text: "El skin o pavos llegan como regalo oficial en hasta 2 días" },
                  { num: "4", icon: Shield, text: "Nunca pedimos tu contraseña. Tu cuenta siempre segura" },
                ].map(({ num, icon: Icon, text }) => (
                  <div key={num} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Items relacionados ── */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h2
                className="text-3xl font-black uppercase tracking-tighter"
                style={{ color: "#f8d43a" }}
              >
                {item.section ? `Más de ${item.section}` : "También te puede interesar"}
              </h2>
              <div className="flex-1 h-0.5" style={{ background: "linear-gradient(to right,#f8d43a40,transparent)" }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {related.map(rel => {
                const relImgs = getImages(rel);
                const relDiscount = rel.originalPrice > 0 && rel.originalPrice > rel.price
                  ? Math.round(((rel.originalPrice - rel.price) / rel.originalPrice) * 100) : 0;
                return (
                  <div
                    key={rel.id}
                    className="rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-purple-500/40 transition-all hover:scale-[1.02] flex flex-col"
                    style={{ background: "linear-gradient(160deg,#2d1065,#0d1f4a)" }}
                    onClick={() => { setLocation(`/pavos/${rel.id}`); window.scrollTo({ top: 0 }); }}
                  >
                    <div className="relative" style={{ paddingBottom: "100%", background: "#1a0845" }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {relImgs[0] ? (
                          <img src={relImgs[0]} alt={rel.title} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-black text-purple-400 text-4xl leading-none opacity-20">V</span>
                        )}
                      </div>
                      {relDiscount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                          -{relDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-black text-white text-xs leading-snug mb-1">{rel.title}</p>
                      <p className="font-black text-base" style={{ color: "#f8d43a" }}>
                        Q{Number(rel.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
