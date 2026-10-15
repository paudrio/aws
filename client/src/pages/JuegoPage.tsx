import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cartContext";
import {
  ChevronLeft, ShoppingCart, Shield, Zap, BadgeCheck, MessageCircle,
  Gamepad2, CheckCircle2, Monitor, Smartphone, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Game = {
  id: string;
  title: string;
  description: string;
  image: string;
  logoImage: string;
  countryImage: string;
  platformName: string;
  countryText: string;
  platform: string;
  price: number;
  link: string;
  isActive: boolean;
  order: number;
  discountPercent?: number;
  requiresCustomerEmail?: boolean;
  customerEmailLabel?: string;
};

const PLATFORM_COLORS: Record<string, string> = {
  "PlayStation":     "linear-gradient(135deg,#003087,#0070d1)",
  "Xbox":            "linear-gradient(135deg,#107c10,#52b043)",
  "PC":              "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "Nintendo Switch": "linear-gradient(135deg,#e4000f,#ff6b6b)",
  "Mobile":          "linear-gradient(135deg,#0ea5e9,#38bdf8)",
  "Otro":            "linear-gradient(135deg,#6366f1,#6366f1)",
};

const PLATFORM_LABELS: Record<string, string> = {
  "PlayStation":     "PSN",
  "Xbox":            "Xbox Live",
  "PC":              "PC",
  "Nintendo Switch": "Nintendo",
  "Mobile":          "Mobile",
  "Otro":            "Otro",
};

export default function JuegoPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem, openCart } = useCart();

  const [game, setGame] = useState<Game | null>(null);
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setGame(null);
    window.scrollTo({ top: 0 });
    fetch("/api/games")
      .then(r => r.ok ? r.json() : [])
      .then((list: Game[]) => {
        const found = list.find((g: Game) => g.id === id);
        if (found) {
          setGame(found);
          const related = list
            .filter((g: Game) => g.id !== id && g.platform === found.platform && g.isActive !== false)
            .slice(0, 6);
          setRelatedGames(related);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleBuy = (g: Game) => {
    if (g.price <= 0) return;
    addItem({
      id: g.id,
      name: g.title,
      price: g.price,
      image: g.image,
      category: g.platform || "Juego",
      isMonthly: false,
      showWhatsapp: true,
      showBinance: false,
      showBanrural: false,
      showBac: false,
      showBi: false,
      requiresCustomerEmail: g.requiresCustomerEmail ?? false,
      customerEmailLabel: g.customerEmailLabel ?? "",
    });
    openCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 font-semibold">Cargando juego...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-800 text-xl font-black mb-2">Juego no encontrado</p>
          <p className="text-slate-400 text-sm mb-6">Este juego no existe o fue eliminado.</p>
          <Button onClick={() => setLocation("/juegos")} className="rounded-2xl font-bold px-8">
            Volver a juegos
          </Button>
        </div>
      </div>
    );
  }

  const discountPercent = game.discountPercent ?? 0;
  const originalPrice = discountPercent > 0
    ? Math.round(game.price / (1 - discountPercent / 100))
    : null;

  const descriptionLines = (game.description || "")
    .split("\n").map(l => l.trim()).filter(l => l.length > 0);

  const platformColor = PLATFORM_COLORS[game.platform] || PLATFORM_COLORS["Otro"];
  const platformLabel = PLATFORM_LABELS[game.platform] || game.platform;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center gap-2 text-sm">
          <button onClick={() => setLocation("/")} className="text-primary font-bold hover:underline">
            Inicio
          </button>
          <span className="text-slate-300">/</span>
          <button onClick={() => setLocation("/juegos")} className="flex items-center gap-1 text-primary font-bold hover:underline">
            <ChevronLeft className="w-4 h-4" /> Juegos
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold truncate max-w-[220px]">{game.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* LEFT: info del juego */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tarjeta principal */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ background: platformColor }} />

              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Imagen */}
                <div className="shrink-0 mx-auto md:mx-0">
                  <div className="relative w-52 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-md flex items-center justify-center" style={{ aspectRatio: "3/4" }}>
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                    {discountPercent > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="text-xs font-black px-2 py-1 rounded-lg text-white shadow"
                          style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                          -{discountPercent}%
                        </span>
                      </div>
                    )}
                    {game.countryImage && (
                      <div className="absolute bottom-2 left-2 rounded-lg px-2 py-1 shadow" style={{ background: "rgba(0,0,0,0.65)" }}>
                        <img src={game.countryImage} alt="región" className="h-4 w-auto object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Plataforma badge */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {game.platform && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg text-white"
                        style={{ background: platformColor }}>
                        <Gamepad2 className="w-3 h-3" /> {platformLabel}
                      </span>
                    )}
                    {game.countryText && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                        <Tag className="w-3 h-3" /> {game.countryText}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Disponible
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight mb-4 uppercase">
                    {game.title}
                  </h1>

                  {/* Descripción */}
                  {descriptionLines.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {descriptionLines.slice(0, 6).map((line, i) => (
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

              {/* Más detalles si hay más de 6 líneas */}
              {descriptionLines.length > 6 && (
                <div className="px-6 pb-6 border-t border-slate-50 pt-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Más detalles</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {descriptionLines.slice(6).map((line, i) => (
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

            {/* Garantías */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Zap, label: "Entrega inmediata", desc: "Código al instante", color: "text-amber-500", bg: "from-amber-50 to-indigo-50", border: "border-amber-100" },
                { icon: Shield, label: "Pago 100% seguro", desc: "Datos protegidos", color: "text-emerald-600", bg: "from-emerald-50 to-green-50", border: "border-emerald-100" },
                { icon: BadgeCheck, label: "Garantía total", desc: "Servicio garantizado", color: "text-blue-500", bg: "from-blue-50 to-indigo-50", border: "border-blue-100" },
                { icon: MessageCircle, label: "Soporte 24/7", desc: "Por WhatsApp", color: "text-indigo-500", bg: "from-indigo-50 to-amber-50", border: "border-indigo-100" },
              ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                <div key={label} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-4 flex flex-col items-center text-center`}>
                  <Icon className={`w-6 h-6 ${color} mb-2`} />
                  <p className="text-xs font-black text-slate-800 leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{desc}</p>
                </div>
              ))}
            </div>

            {/* Juegos relacionados */}
            {relatedGames.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#6366f1)" }} />
                <div className="p-6">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    Más juegos de {platformLabel}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {relatedGames.map(g => (
                      <motion.button
                        key={g.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setLocation(`/juego/${g.id}`)}
                        className="flex flex-col rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:shadow-md transition-all text-left"
                      >
                        <div className="w-full bg-gray-100" style={{ aspectRatio: "3/4" }}>
                          <img src={g.image} alt={g.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2.5">
                          <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-tight">{g.title}</p>
                          <p className="text-sm font-black text-indigo-500 mt-1">Q{g.price}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: panel de compra */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden sticky top-4">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#6366f1)" }} />
              <div className="p-6 space-y-5">

                {/* Precio */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Precio</p>
                  {game.price > 0 ? (
                    <div className="flex items-end gap-2 flex-wrap">
                      <span className="text-4xl font-black text-indigo-500">Q{game.price}</span>
                      {originalPrice && (
                        <span className="text-lg font-bold text-slate-400 line-through mb-0.5">Q{originalPrice}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-4xl font-black text-emerald-500">Gratis</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="inline-block mt-2 text-xs font-black px-3 py-1 rounded-xl text-white"
                      style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                      Ahorras {discountPercent}%
                    </span>
                  )}
                </div>

                {/* Botón comprar */}
                {game.price > 0 ? (
                  <button
                    onClick={() => handleBuy(game)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-black uppercase tracking-wide text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)", boxShadow: "0 4px 20px rgba(234,88,12,0.4)" }}
                  >
                    <ShoppingCart className="w-5 h-5" /> Comprar ahora
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-wide text-center text-emerald-600 bg-emerald-50 border-2 border-emerald-200">
                    Gratis
                  </div>
                )}

                {/* Info plataforma */}
                {game.platform && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fff7ed" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{ background: platformColor }}>
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Plataforma</p>
                      <p className="text-sm font-black text-slate-800">{game.platformName || platformLabel}</p>
                    </div>
                  </div>
                )}

                {/* Región */}
                {game.countryText && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    {game.countryImage ? (
                      <img src={game.countryImage} alt="región" className="w-9 h-9 object-contain rounded-lg" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Región</p>
                      <p className="text-sm font-black text-slate-800">{game.countryText}</p>
                    </div>
                  </div>
                )}

                {/* Garantías mini */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {[
                    { icon: Shield, text: "Pago 100% seguro y encriptado" },
                    { icon: Zap, text: "Entrega inmediata del código" },
                    { icon: BadgeCheck, text: "Código garantizado y activo" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-slate-500">
                      <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
