import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Gamepad2, Search, ShoppingCart, Tag, Monitor, Smartphone, Gamepad } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { toast } from "sonner";

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

const XboxIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <circle cx="12" cy="12" r="11" fill="#107c10"/>
    <path d="M6.5 7.2c1.1-1.0 2.5-1.7 4.0-1.9C9.2 6.8 7.5 8.8 6.0 11.0 5.0 9.8 5.5 8.2 6.5 7.2zm11 0c1.0 1.0 1.5 2.6 0.5 3.8C16.5 8.8 14.8 6.8 13.5 5.3c1.5.2 2.9.9 4.0 1.9zM12 6.8c1.2 1.2 2.8 3.0 4.0 5.2C14.8 14.0 13.5 15.8 12 17.5 10.5 15.8 9.2 14.0 8.0 12.0 9.2 9.8 10.8 8.0 12 6.8zM5.8 13.0c.5 2.0 2.0 3.7 4.0 4.5C8.3 16.5 6.8 14.8 5.8 13.0zm12.4 0c-1.0 1.8-2.5 3.5-4.0 4.5 2.0-.8 3.5-2.5 4.0-4.5z" fill="white"/>
  </svg>
);

const PSIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <rect width="24" height="24" rx="3" fill="#003087"/>
    <text x="3" y="17" fontSize="13" fontWeight="900" fill="white" fontFamily="Arial,sans-serif">PS</text>
  </svg>
);

const SwitchIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <rect width="24" height="24" rx="4" fill="#e4000f"/>
    <text x="4" y="17" fontSize="13" fontWeight="900" fill="white" fontFamily="Arial,sans-serif">N</text>
  </svg>
);

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  "PlayStation":     <PSIcon />,
  "Xbox":            <XboxIcon />,
  "PC":              <Monitor className="w-3 h-3" />,
  "Nintendo Switch": <SwitchIcon />,
  "Mobile":          <Smartphone className="w-3 h-3" />,
  "Otro":            <Gamepad2 className="w-3 h-3" />,
};

const PLATFORM_LABELS: Record<string, string> = {
  "PlayStation":     "PSN",
  "Xbox":            "Xbox Live",
  "PC":              "PC",
  "Nintendo Switch": "Nintendo",
  "Mobile":          "Mobile",
  "Otro":            "Otro",
};

export default function Juegos() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [activePlatform, setActivePlatform] = useState("Todos");
  const [, setLocation] = useLocation();
  const { addItem, openCart } = useCart();

  useEffect(() => {
    fetch("/api/games")
      .then(r => r.ok ? r.json() : [])
      .then((data: Game[]) => {
        const active = data.filter((g: Game) => g.isActive);
        setGames(active);
      })
      .catch(() => {});
  }, []);

  const platforms = ["Todos", ...Array.from(new Set(games.map(g => g.platform).filter(Boolean)))];

  const filtered = games.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) || g.platform.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = activePlatform === "Todos" || g.platform === activePlatform;
    return matchSearch && matchPlatform;
  });

  const handleBuy = (game: Game) => {
    if (game.price <= 0) {
      toast.info("Este juego es gratuito");
      return;
    }
    addItem({
      id: game.id,
      name: game.title,
      price: game.price,
      image: game.image,
      category: game.platform || "Juego",
      isMonthly: false,
      showWhatsapp: true,
      showBinance: false,
      showBanrural: false,
      showBac: false,
      showBi: false,
      requiresCustomerEmail: game.requiresCustomerEmail ?? false,
      customerEmailLabel: game.customerEmailLabel ?? "",
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#fff7ed 0%,#fff 40%,#fef3c7 100%)" }}>

      {/* HERO */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[400px] rounded-full opacity-25" style={{ background: "radial-gradient(circle,#fb923c 0%,transparent 70%)", transform: "translate(-30%,-40%)" }} />
          <div className="absolute top-0 right-0 w-[400px] h-[300px] rounded-full opacity-15" style={{ background: "radial-gradient(circle,#a855f7 0%,transparent 70%)", transform: "translate(30%,-40%)" }} />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm" style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)", color: "#fff" }}>
              <Gamepad2 className="w-3.5 h-3.5" /> Tienda de Juegos
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-tighter leading-none" style={{ color: "#1c1917" }}>
              LOS MEJORES <span style={{ color: "#6366f1" }}>JUEGOS</span>
            </h1>
            <p className="text-stone-500 text-lg max-w-lg mx-auto font-medium mb-10">
              Los mejores títulos para PC, PlayStation, Xbox y más plataformas.
            </p>

            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                placeholder="Buscar juego o plataforma..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl text-sm font-semibold text-stone-800 placeholder-stone-400 outline-none transition-all shadow-md"
                style={{ background: "#fff", border: "2px solid #fed7aa" }}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e => (e.target.style.borderColor = "#fed7aa")}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FILTROS */}
      {platforms.length > 1 && (
        <div className="container mx-auto px-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {platforms.map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                style={
                  activePlatform === p
                    ? { background: "linear-gradient(135deg,#6366f1,#6366f1)", color: "#fff", border: "2px solid transparent" }
                    : { background: "#fff", color: "#78716c", border: "2px solid #fed7aa" }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTEO */}
      <div className="container mx-auto px-4 mb-6 flex items-center gap-3">
        <span className="text-sm font-black text-stone-400 uppercase tracking-widest">
          {filtered.length} {filtered.length === 1 ? "juego" : "juegos"}
        </span>
        {search && (
          <button onClick={() => setSearch("")} className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 flex items-center gap-1" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* GRID */}
      <section className="container mx-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#fff7ed,#fed7aa)" }}>
              <Gamepad2 className="w-12 h-12 text-indigo-400" />
            </div>
            <p className="text-stone-500 font-black uppercase tracking-widest text-sm">No se encontraron juegos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
            {filtered.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-2 cursor-pointer bg-white flex flex-col"
                  style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)", border: "1.5px solid #f0e8dd" }}
                  onClick={() => setLocation(`/juego/${game.id}`)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 50px rgba(234,88,12,0.22)"; (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "#f0e8dd"; }}
                >
                  {/* IMAGEN */}
                  <div className="w-full overflow-hidden bg-gray-100 relative" style={{ aspectRatio: "3/4" }}>
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* BADGE PAÍS — arriba derecha */}
                    {game.countryImage ? (
                      <div className="absolute top-2 right-2 rounded-lg shadow-lg" style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", padding: "5px 10px" }}>
                        <img src={game.countryImage} alt="país" className="h-7 w-auto object-contain" />
                      </div>
                    ) : game.countryText ? (
                      <div className="absolute top-2 right-2 rounded-lg shadow-lg px-3 py-1.5" style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}>
                        <span className="text-white text-xs font-black uppercase tracking-widest">{game.countryText}</span>
                      </div>
                    ) : null}

                    {/* LOGO + NOMBRE — abajo, en línea recta */}
                    {(game.logoImage || game.platformName || game.platform) && (
                      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 pb-3 pt-8" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.82))" }}>
                        {game.logoImage && (
                          <img src={game.logoImage} alt={game.platform} className="h-8 w-auto object-contain drop-shadow-xl flex-shrink-0" />
                        )}
                        {(game.platformName || game.platform) && (
                          <span className="text-white font-black uppercase tracking-widest drop-shadow" style={{ fontSize: "clamp(11px,1.4vw,14px)" }}>
                            {game.platformName || PLATFORM_LABELS[game.platform] || game.platform}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* INFO ABAJO */}
                  <div className="flex flex-col gap-1.5 p-3 flex-1">
                    <h3 className="font-black text-gray-900 leading-tight line-clamp-2 uppercase tracking-tight" style={{ fontSize: "clamp(14px,2vw,17px)" }}>
                      {game.title}
                    </h3>
                    {game.description && (
                      <p className="text-[11px] text-stone-500 leading-snug line-clamp-2">
                        {game.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1 gap-2">
                      {game.price > 0 ? (
                        <>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-black text-indigo-500" style={{ fontSize: "clamp(13px,1.8vw,16px)" }}>Q{game.price}</p>
                              {(game as any).discountPercent > 0 && (
                                <span className="text-[9px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-md">-{(game as any).discountPercent}%</span>
                              )}
                            </div>
                            {(game as any).discountPercent > 0 && (
                              <p className="text-[9px] text-gray-400 line-through leading-none">Q{Math.round(game.price / (1 - (game as any).discountPercent / 100))}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleBuy(game)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide text-white transition-all hover:scale-105 active:scale-95 shadow"
                            style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)" }}
                          >
                            <ShoppingCart className="w-3 h-3" /> Comprar
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-black text-green-500 uppercase">Gratis</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
