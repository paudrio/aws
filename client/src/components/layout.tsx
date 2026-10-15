import React from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/lib/context";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cartContext";
import { ShieldCheck, ShoppingBag, ShoppingCart, LogOut, Menu, X, Phone, Mail, User, LogIn, Search, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Footer from "@/components/Footer";
import SupportChat from "@/components/SupportChat";

function ProductSearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      Promise.all([
        fetch("/api/products").then(r => r.json()).catch(() => []),
        fetch("/api/games").then(r => r.json()).catch(() => []),
      ]).then(([productsData, gamesData]) => {
        const products = (Array.isArray(productsData) ? productsData : [])
          .filter((p: any) => p.isActive !== false && (
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
          ))
          .map((p: any) => ({ ...p, _type: "producto", _href: `/producto/${p.id}` }));
        const games = (Array.isArray(gamesData) ? gamesData : [])
          .filter((g: any) => g.isActive !== false && (
            g.title?.toLowerCase().includes(q) ||
            g.platform?.toLowerCase().includes(q)
          ))
          .map((g: any) => ({ ...g, name: g.title, image: g.image, _type: "juego", _href: `/juego/${g.id}` }));
        setResults([...products, ...games].slice(0, 8));
      }).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: any) => {
    onClose();
    window.location.href = item._href || "/";
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full" style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-indigo-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar productos, servicios, categorías..."
              className="flex-1 text-base font-medium bg-transparent outline-none text-slate-800 placeholder-slate-400"
            />
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {(query.trim().length >= 2) && (
          <div className="container mx-auto px-4 pb-4">
            {loading && (
              <div className="py-6 text-center text-sm text-slate-400 font-medium">Buscando...</div>
            )}
            {!loading && results.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400 font-medium">No se encontraron resultados para "{query}"</div>
            )}
            {!loading && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {results.map((item: any) => (
                  <a
                    key={item.id}
                    href={item._href || "/#catalogo"}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group cursor-pointer"
                    style={{ border: '1px solid #f1f5f9' }}
                  >
                    {item.image && (
                      <img
                        src={item.image?.startsWith("/") || item.image?.startsWith("http") ? item.image : `/uploads/${item.image}`}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: "#eef2ff", color: "#4f46e5" }}>
                          {item._type === "juego" ? "🎮 Juego" : "📦 Producto"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{item.name}</p>
                      <p className="text-xs text-slate-400 truncate">{item.category || item.platform || "—"}</p>
                      <p className="text-sm font-black mt-0.5" style={{ color: '#6366f1' }}>Q{item.price}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineSearchBar() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setOpen(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      Promise.all([
        fetch("/api/products").then(r => r.json()).catch(() => []),
        fetch("/api/games").then(r => r.json()).catch(() => []),
      ]).then(([productsData, gamesData]) => {
        const prods = (Array.isArray(productsData) ? productsData : [])
          .filter((p: any) => p.isActive !== false && (
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
          ))
          .map((p: any) => ({ ...p, _type: "producto", _href: `/producto/${p.id}` }));
        const games = (Array.isArray(gamesData) ? gamesData : [])
          .filter((g: any) => g.isActive !== false && (
            g.title?.toLowerCase().includes(q) ||
            g.platform?.toLowerCase().includes(q)
          ))
          .map((g: any) => ({ ...g, name: g.title, _type: "juego", _href: `/juego/${g.id}` }));
        setResults([...prods, ...games].slice(0, 6));
      }).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style={{ background: '#f1f5f9', border: '2px solid #e2e8f0' }}>
        <Search className="w-5 h-5 text-indigo-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Buscar productos, servicios, categorías..."
          className="flex-1 text-sm font-medium bg-transparent outline-none text-slate-700 placeholder-slate-400 min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="shrink-0">
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}>
          {loading && <div className="py-4 text-center text-xs text-slate-400">Buscando...</div>}
          {!loading && results.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-400">Sin resultados para "{query}"</div>
          )}
          {!loading && results.map((item: any) => (
            <a key={item.id} href={item._href || "/#catalogo"} onClick={() => { setOpen(false); setQuery(""); }}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0">
              {item.image && (
                <img src={item.image?.startsWith("/") || item.image?.startsWith("http") ? item.image : `/uploads/${item.image}`}
                  alt={item.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-400">{item.category || item.platform || "—"}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-black" style={{ color: '#6366f1' }}>Q{item.price}</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                  style={{ background: "#eef2ff", color: "#4f46e5" }}>
                  {item._type === "juego" ? "🎮" : "📦"}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ReferralPromoBanner({ isAuth }: { isAuth: boolean }) {
  const [program, setProgram] = React.useState<any>(null);
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try { return sessionStorage.getItem("ref_promo_dismissed") === "1"; } catch { return false; }
  });

  React.useEffect(() => {
    fetch("/api/referral/program").then(r => r.json()).then(p => setProgram(p)).catch(() => {});
  }, []);

  if (dismissed || !program?.isActive) return null;

  const href = isAuth ? "/perfil?tab=referidos" : "/auth?next=/perfil?tab=referidos";
  const registerBonus = Number(program.registerBonus) || 0;
  const purchaseBonus = Number(program.purchaseBonus) || 0;

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-50 max-w-[calc(100vw-32px)] sm:max-w-xs animate-in slide-in-from-left-4 duration-500">
      <div
        className="relative rounded-2xl shadow-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #f59e0b 100%)',
          boxShadow: '0 12px 32px rgba(234,88,12,0.45), 0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.25)'
        }}
        onClick={() => { window.location.href = href; }}
      >
        <Sparkles className="absolute -top-2 -left-2 w-4 h-4 text-yellow-200 animate-pulse" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
            try { sessionStorage.setItem("ref_promo_dismissed", "1"); } catch {}
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors z-10"
          style={{ background: 'rgba(0,0,0,0.18)' }}
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-white/20">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/70">{isAuth ? "Programa de referidos" : "¡Bono gratis!"}</p>
            <p className="text-sm font-black text-white leading-tight">Comparte y gana saldo 💰</p>
          </div>
        </div>

        {/* Cómo funciona */}
        <div className="px-4 py-3 space-y-2">
          {registerBonus > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">👤</span>
              <p className="text-[11px] font-bold text-white leading-snug">
                Tu amigo se registra con tu link →{" "}
                <span className="text-yellow-200 font-black">ganas Q{registerBonus}</span>
              </p>
            </div>
          )}
          {purchaseBonus > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">🛒</span>
              <p className="text-[11px] font-bold text-white leading-snug">
                Tu amigo hace una compra →{" "}
                <span className="text-yellow-200 font-black">ganas Q{purchaseBonus} más</span>
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <div className="rounded-xl py-2 text-center font-black text-xs uppercase tracking-widest text-indigo-700" style={{ background: 'rgba(255,255,255,0.9)' }}>
            {isAuth ? "Ver mi link de referido →" : "Crear cuenta y comenzar →"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated: isAdminAuth, logout: adminLogout } = useApp();
  const { user, isAuthenticated: isUserAuth, isLoading: isAuthLoading } = useAuth();
  const { totalItems, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`text-sm font-black uppercase tracking-widest transition-colors hover:text-primary ${isActive ? "text-primary" : "text-slate-400"}`}>
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-body" style={{ background: '#f8fafc' }}>
      {showSearch && <ProductSearchBar onClose={() => setShowSearch(false)} />}

      <ReferralPromoBanner isAuth={isUserAuth} />

      <header className="sticky top-0 z-50 w-full" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}>
        <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="badge-clip">
                  <rect width="52" height="52" rx="13"/>
                </clipPath>
              </defs>
              <rect width="52" height="52" rx="13" fill="#1e293b"/>
              <polygon points="52,0 52,30 22,0" fill="#6366f1" clipPath="url(#badge-clip)"/>
              <text x="7" y="38" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="white">PG</text>
              <rect x="7" y="43" width="22" height="3" rx="1.5" fill="#6366f1"/>
            </svg>
            <div className="flex flex-col leading-none gap-1">
              <span className="font-black text-xl uppercase leading-none" style={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
                PAUDRONIX <span style={{ color: '#6366f1' }}>GT</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none" style={{ color: '#94a3b8', letterSpacing: '0.2em' }}>Guatemala</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/", label: "Inicio" },
              { href: "/tv", label: "TV en Vivo" },
              { href: "/#catalogo", label: "Catálogo" },
              { href: "/peliculas", label: "Películas" },
              { href: "/juegos", label: "Juegos" },
              { href: "/pavos", label: "Pavos V" },
              { href: "/noticias", label: "Noticias" },
              { href: "/panel-opt", label: "Panel OPT" },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-all"
                style={{ color: location === item.href ? '#6366f1' : '#64748b', background: location === item.href ? '#eef2ff' : 'transparent' }}
              >
                {item.label}
              </Link>
            ))}
            {isUserAuth && (
              <Link
                href="/regalos"
                className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5"
                style={{ color: location === "/regalos" ? '#6366f1' : '#64748b', background: location === "/regalos" ? '#eef2ff' : 'transparent' }}
              >
                <Gift className="w-3.5 h-3.5" />
                Regalos
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">

            {/* Carrito — visible en PC y móvil */}
            <button
              onClick={openCart}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-indigo-50 active:scale-95"
              style={{ border: '1px solid #e2e8f0' }}
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-5 h-5 text-slate-600" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-2">
              {isUserAuth ? (
                <div className="flex items-center gap-2">
                  <Link href="/perfil" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        {user?.firstName?.[0] || user?.email?.[0] || "U"}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-700">{user?.firstName || "Mi cuenta"}</span>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 h-8 w-8 p-0 rounded-lg" onClick={() => { localStorage.removeItem("uid"); window.location.href = "/api/logout"; }}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}>
                    <LogIn className="w-4 h-4" /> Iniciar sesión
                  </button>
                </Link>
              )}
              {isAdminAuth && (
                <div className="flex items-center gap-1 pl-2 ml-1 border-l border-slate-100">
                  <Link href="/admin">
                    <button className="px-3 py-2 rounded-lg text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">Admin</button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={adminLogout} className="h-8 px-3 text-[11px] font-bold rounded-lg">Salir</Button>
                </div>
              )}
            </div>

            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ background: '#f1f5f9' }}>
                    <Menu className="w-5 h-5 text-slate-600" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]" style={{ background: '#fff', borderLeft: '1px solid #e2e8f0' }}>
                  <div className="flex flex-col pt-6">
                    <div className="flex items-center gap-2.5 mb-6 px-1">
                      <svg width="44" height="44" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <clipPath id="badge-clip-m">
                            <rect width="52" height="52" rx="13"/>
                          </clipPath>
                        </defs>
                        <rect width="52" height="52" rx="13" fill="#1e293b"/>
                        <polygon points="52,0 52,30 22,0" fill="#6366f1" clipPath="url(#badge-clip-m)"/>
                        <text x="7" y="38" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="white">PG</text>
                        <rect x="7" y="43" width="22" height="3" rx="1.5" fill="#6366f1"/>
                      </svg>
                      <div className="flex flex-col leading-none gap-0.5">
                        <span className="font-black text-base uppercase tracking-tight" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>PAUDRONIX <span style={{ color: '#6366f1' }}>GT</span></span>
                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8', letterSpacing: '0.18em' }}>Guatemala</span>
                      </div>
                    </div>
                    {[
                      { href: "/", label: "Inicio" },
                      { href: "/tv", label: "TV en Vivo" },
                      { href: "/#catalogo", label: "Catálogo" },
                      { href: "/peliculas", label: "Películas" },
                      { href: "/juegos", label: "Juegos" },
                      { href: "/pavos", label: "Pavos V" },
                      { href: "/noticias", label: "Noticias" },
                      { href: "/panel-opt", label: "Panel OPT" },
                    ].map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-3.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors mb-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {isUserAuth && (
                      <Link
                        href="/regalos"
                        className="flex items-center gap-2 px-3 py-3.5 rounded-xl text-base font-semibold hover:bg-indigo-50 transition-colors mb-1"
                        style={{ color: '#6366f1' }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Gift className="w-4 h-4" />
                        Regalos
                      </Link>
                    )}
                    <div className="border-t border-slate-100 pt-4 mt-3">
                      {isUserAuth ? (
                        <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-slate-50">
                          {user?.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                              {user?.firstName?.[0] || "U"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{user?.firstName || "Usuario"}</p>
                            <p className="text-xs text-slate-400">{user?.email}</p>
                          </div>
                        </Link>
                      ) : null}
                      <Link href={isUserAuth ? "/perfil" : "/auth"} onClick={() => setIsMobileMenuOpen(false)}>
                        <button className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                          <LogIn className="w-4 h-4 inline mr-2" />
                          {isUserAuth ? "Ver Mi Perfil" : "Iniciar Sesión"}
                        </button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de búsqueda — oculta en perfil y admin */}
      {!location.startsWith('/perfil') && !location.startsWith('/admin') && (
        <div className="sticky top-[80px] md:top-[96px] z-40 w-full" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div className="container mx-auto px-4 py-2.5 flex justify-center">
            <InlineSearchBar />
          </div>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      <SupportChat />
    </div>
  );
}
