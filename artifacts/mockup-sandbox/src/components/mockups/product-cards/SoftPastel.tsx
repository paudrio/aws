import { ShoppingBag, Star, Gift, ShoppingCart, Flame } from "lucide-react";

const product = {
  name: "Disney+ Estándar",
  price: 75,
  originalPrice: 105,
  discountPercent: 29,
  isMonthly: true,
  isPopular: true,
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/2560px-Disney%2B_logo.svg.png",
};

export function SoftPastel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #eff6ff 100%)" }}>
      <div className="w-[300px]">
        <div
          className="relative rounded-[24px] overflow-hidden flex flex-col"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(168,85,247,0.12), 0 1px 4px rgba(0,0,0,0.05)",
            border: "1.5px solid rgba(216,180,254,0.5)",
          }}
        >
          {/* Image area */}
          <div className="relative" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)", padding: "22px 22px 14px" }}>
            {/* Popular badge */}
            {product.isPopular && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 2px 10px rgba(168,85,247,0.4)" }}>
                <Flame size={9} fill="currentColor" /> Hot
              </div>
            )}

            {/* Discount */}
            {product.discountPercent > 0 && (
              <div className="absolute top-3 right-3 rounded-2xl text-white font-black text-sm px-2.5 py-1"
                style={{ background: "linear-gradient(135deg,#f43f5e,#e11d48)", boxShadow: "0 2px 8px rgba(244,63,94,0.4)" }}>
                -{product.discountPercent}%
              </div>
            )}

            {/* Product image */}
            <div className="w-full h-[120px] flex items-center justify-center rounded-[16px] overflow-hidden mt-6"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(216,180,254,0.4)" }}>
              <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.08))" }} />
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />)}
              <span className="text-[10px] font-semibold text-purple-500 ml-1.5">4.8 · 1.2k ventas</span>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 px-5 pt-3.5 pb-5">
            {/* Name */}
            <div>
              <h3 className="text-[17px] font-black text-slate-800 leading-tight">{product.name}</h3>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-purple-600 uppercase tracking-wide"
                style={{ background: "rgba(168,85,247,0.1)" }}>
                Mensual
              </span>
            </div>

            {/* Price row */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-black leading-none" style={{ color: "#a855f7" }}>Q{product.price}</span>
                <span className="text-xs text-slate-400 line-through">/Q{product.originalPrice}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-wide font-bold text-slate-400">Ahorras</span>
                <span className="text-[13px] font-black text-emerald-500">Q{product.originalPrice - product.price}</span>
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-2xl px-3 py-2.5 flex items-start gap-2"
              style={{ background: "rgba(255,237,213,0.6)", border: "1px solid rgba(253,186,116,0.4)" }}>
              <span className="text-sm shrink-0">⚠️</span>
              <p className="text-[10px] font-medium text-orange-700 leading-snug">Lee bien la descripción. Sin reembolsos luego de confirmar.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[12px] font-black text-white uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 4px 16px rgba(168,85,247,0.35)" }}>
                <ShoppingBag size={13} /> Comprar
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-2xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(216,180,254,0.5)" }}>
                <Gift size={14} color="#a855f7" />
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-2xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(216,180,254,0.5)" }}>
                <ShoppingCart size={14} color="#a855f7" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
