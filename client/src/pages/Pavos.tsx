import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { ShoppingCart, Gift, Shield, Clock, ChevronDown, ChevronUp } from "lucide-react";

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

function CardSlideshow({ images, title, contain }: { images: string[]; title: string; contain?: boolean }) {
  const slides = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % slides.length), 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [slides.length]);

  if (slides.length === 0) return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a0a30] to-[#0d1b3e]">
      <span className="font-black text-purple-400 text-5xl leading-none opacity-30">V</span>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {slides.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={i === 0 ? title : ""}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${contain ? "object-contain" : "object-cover"}`}
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      {slides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`rounded-full transition-all ${i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CARD
───────────────────────────────────────────── */
function ItemCard({ item, onClick }: { item: FortniteItem; onClick: () => void }) {
  const images = getImages(item);
  const discountPct = item.originalPrice > 0 && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
      style={{ boxShadow: "0 6px 32px #000c" }}
      onClick={onClick}
    >
      {/* ── Imagen principal – cubre todo el card ── */}
      <div className="relative w-full" style={{ paddingBottom: "130%", background: "linear-gradient(160deg,#2d1065,#0d1f4a)" }}>
        {images.length > 0 ? (
          <div className="absolute inset-0">
            <CardSlideshow images={images} title={item.title} contain />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-black text-purple-400 text-7xl leading-none opacity-15">V</span>
          </div>
        )}

        {/* Gradiente inferior para legibilidad del texto */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, #000000ee 0%, #00000088 35%, transparent 65%)" }}
        />

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ background: "linear-gradient(to top,#7c3aed22,transparent 50%)", border: "2px solid #a855f740", borderRadius: "inherit" }}
        />

        {/* ── Badge descuento – arriba izquierda, GRANDE ── */}
        {discountPct > 0 && (
          <div className="absolute top-3 left-3 z-20">
            <div
              className="flex items-center justify-center font-black text-white rounded-xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg,#dc2626,#ef4444)",
                fontSize: "1.05rem",
                lineHeight: 1,
                padding: "6px 10px",
                boxShadow: "0 4px 16px #dc262660",
                letterSpacing: "-0.02em",
              }}
            >
              -{discountPct}%
            </div>
          </div>
        )}

        {/* ── Badge V-Bucks – arriba derecha ── */}
        {item.pavos > 0 && (
          <div className="absolute top-3 right-3 z-20">
            <span
              className="flex items-center gap-1 font-black text-[11px] rounded-xl px-2.5 py-1.5"
              style={{
                background: "rgba(10,35,55,0.92)",
                border: "1px solid rgba(91,196,245,0.5)",
                color: "#5bc4f5",
                backdropFilter: "blur(4px)",
              }}
            >
              {item.pavos.toLocaleString()} V
            </span>
          </div>
        )}

        {/* ── Texto sobre la imagen – abajo ── */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 z-10">
          {/* Título grande y llamativo */}
          <p
            className="text-white font-black leading-tight mb-2"
            style={{ fontSize: "1rem", textShadow: "0 2px 8px #000", letterSpacing: "-0.01em" }}
          >
            {item.title}
          </p>

          {/* Fila precio + botón */}
          <div className="flex items-center justify-between gap-2">
            <div>
              {item.originalPrice > 0 && item.originalPrice > item.price && (
                <p className="text-slate-400 text-[10px] line-through leading-none mb-0.5 font-semibold">
                  Q{Number(item.originalPrice).toFixed(2)}
                </p>
              )}
              <p
                className="font-black leading-none"
                style={{ fontSize: "1.25rem", color: "#f8d43a", textShadow: "0 0 16px #f8d43a60" }}
              >
                Q{Number(item.price).toFixed(2)}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-xl text-white font-black text-xs uppercase px-3 py-2 shrink-0 transition-all group-hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 2px 12px #7c3aed60" }}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Ver
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FAQ
───────────────────────────────────────────── */
const faqs = [
  { q: "¿Necesito dar mi correo o contraseña?", a: "No. Nunca pedimos tus credenciales. Los pavos y skins se envían directamente a tu cuenta de Fortnite como regalo oficial. Solo necesitas tu nombre de usuario de Epic Games." },
  { q: "¿Cuánto tiempo tarda en llegar el regalo?", a: "Generalmente en minutos después de confirmar el pago. En horarios de alta demanda puede tardar hasta 2 días. Te notificaremos por WhatsApp cuando esté enviado." },
  { q: "¿Es seguro? ¿Está permitido por Epic Games?", a: "Sí, totalmente seguro. Usamos el sistema oficial de regalos de Fortnite. No viola ninguna norma del juego." },
  { q: "¿Puedo pedir para otra cuenta?", a: "Sí. Al realizar el pedido indícanos el nombre de usuario de Epic Games de la cuenta que recibirá el regalo." },
  { q: "¿Cómo pago?", a: "Con tu saldo de cuenta PAUDRONIX GT. Puedes recargarlo desde la sección de recarga o ganar saldo por referidos." },
];

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
export default function Pavos() {
  const [items, setItems] = useState<FortniteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("/api/fortnite-items")
      .then(r => r.ok ? r.json() : [])
      .then((data: FortniteItem[]) => { setItems(data.filter(i => i.isActive)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, FortniteItem[]>();
    items.forEach(item => {
      const key = (item.section || "").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [items]);

  const sectionOrder = useMemo(() => {
    const keys = Array.from(sections.keys());
    return [...keys.filter(k => k !== "").sort(), ...keys.filter(k => k === "")];
  }, [sections]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#13082e 0%,#0d1535 50%,#0a1628 100%)" }}>

      {/* ───── HERO ───── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#2a0f5c 0%,#13082e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/3 w-[600px] h-[600px] rounded-full opacity-40" style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }} />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-25" style={{ background: "radial-gradient(circle,#06b6d4,transparent 70%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-5 text-yellow-400 border-yellow-400/30 bg-yellow-400/5">
            <span className="font-black text-xs leading-none">V</span> Paudronix Pavos — Fortnite
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            Pavos &<br />
            <span style={{ background: "linear-gradient(90deg,#f8d43a,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Skins Fortnite
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed mb-8">
            Compra pavos y skins de forma segura. Sin contraseñas —{" "}
            <span className="text-yellow-400 font-bold">enviados directamente a tu cuenta como regalo oficial</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {[
              { icon: Shield, label: "100% Seguro", color: "#22c55e" },
              { icon: Clock, label: "Entrega rápida", color: "#60a5fa" },
              { icon: Gift, label: "Envío como regalo", color: "#a855f7" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white font-semibold">
                <Icon className="w-3.5 h-3.5" style={{ color }} /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───── ITEMS ───── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ paddingBottom: "155%", background: "linear-gradient(160deg,#2d1065,#0d1f4a)" }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <span className="font-black text-purple-500 text-8xl leading-none block text-center mb-4 opacity-30">V</span>
            <p className="text-slate-500 font-bold text-lg">Próximamente</p>
            <p className="text-slate-600 text-sm mt-1">Estamos preparando los mejores packs.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {sectionOrder.map(sectionKey => {
              const sectionItems = sections.get(sectionKey)!;
              return (
                <div key={sectionKey}>
                  {/* ── Section header — grande ── */}
                  {sectionKey ? (
                    <div className="flex items-center gap-5 mb-7">
                      <div>
                        <h2
                          className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none"
                          style={{ color: "#f8d43a", textShadow: "0 0 40px #f8d43a40" }}
                        >
                          {sectionKey}
                        </h2>
                        <p className="text-slate-600 text-xs mt-1 uppercase tracking-widest font-bold">
                          {sectionItems.length} item{sectionItems.length !== 1 ? "s" : ""} disponibles
                        </p>
                      </div>
                      <div className="flex-1 h-0.5" style={{ background: "linear-gradient(to right,#f8d43a50,transparent)" }} />
                    </div>
                  ) : sectionOrder.length > 1 ? (
                    <div className="flex items-center gap-5 mb-7">
                      <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-slate-400 leading-none">Otros</h2>
                      <div className="flex-1 h-0.5" style={{ background: "linear-gradient(to right,#ffffff30,transparent)" }} />
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {sectionItems.map(item => (
                      <ItemCard key={item.id} item={item} onClick={() => setLocation(`/pavos/${item.id}`)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───── AVISO ───── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div
          className="rounded-2xl p-6 flex items-start gap-4 border"
          style={{ background: "linear-gradient(135deg,#3b1a7a 0%,#0d2b5e 100%)", borderColor: "#9d5cff60" }}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="font-black text-white text-sm uppercase tracking-wide mb-1">⚠️ Cómo funciona el regalo</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Nuestros bots enviarán una solicitud de amistad desde Epic Games.{" "}
              <span className="text-yellow-300 font-bold">Debes aceptarla</span> para recibir el skin o pavos como regalo. El regalo llega en{" "}
              <span className="text-yellow-300 font-bold">hasta 2 días</span> después de confirmar el pago. Nunca pedimos tu contraseña.
            </p>
          </div>
        </div>
      </div>

      {/* ───── FAQ ───── */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter text-center mb-6">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#141020" }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <span className="font-bold text-sm text-white">{faq.q}</span>
                {faqOpen === i
                  ? <ChevronUp className="w-4 h-4 text-yellow-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
