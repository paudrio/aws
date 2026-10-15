import { ShoppingBag, Star, Gift, ShoppingCart, Shield } from "lucide-react";

const product = {
  name: "Spotify Premium",
  price: 65,
  originalPrice: 90,
  discountPercent: 28,
  isMonthly: true,
  isPopular: false,
  verifiedSeller: true,
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Spotify.png/1200px-Spotify.png",
};

export function ModernoLimpio() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f8fafc" }}>
      <div className="w-[300px]">
        <div
          className="relative rounded-[20px] overflow-hidden flex flex-col"
          style={{
            background: "#ffffff",
            boxShadow: "0 0 0 1px #e2e8f0, 0 4px 24px rgba(99,102,241,0.08)",
          }}
        >
          {/* Image area with colored bg */}
          <div className="relative" style={{ background: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)", padding: "20px" }}>
            {/* Badges */}
            <div className="flex items-start justify-between mb-3">
              {product.verifiedSeller ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide text-indigo-700"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Shield size={9} fill="currentColor" /> Verificado
                </div>
              ) : <span />}
              {product.discountPercent > 0 && (
                <div className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white"
                  style={{ background: "#6366f1" }}>
                  -{product.discountPercent}%
                </div>
              )}
            </div>

            {/* Product image */}
            <div className="w-full h-[110px] flex items-center justify-center rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
              <img src={product.image} alt={product.name} className="w-full h-full object-contain p-5" />
            </div>
          </div>

          {/* Card body */}
          <div className="flex flex-col gap-3.5 px-5 pt-4 pb-5">
            {/* Rating */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />)}
              <span className="text-[10px] font-semibold text-slate-500 ml-1">(523 reseñas)</span>
            </div>

            {/* Name + badge */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[17px] font-black text-slate-900 leading-tight">{product.name}</h3>
              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md text-indigo-600 mt-0.5" style={{ background: "#eef2ff" }}>
                Mensual
              </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full" style={{ background: "#f1f5f9" }} />

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-600">Q{product.price}</span>
                <span className="text-xs text-slate-400 line-through">Q{product.originalPrice}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-md" style={{ background: "#f0fdf4" }}>
                Ahorras Q{product.originalPrice - product.price}
              </span>
            </div>

            {/* Info */}
            <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <span className="text-sm">⚠️</span>
              <p className="text-[10px] text-slate-500 leading-snug">Lee la descripción. Sin reembolsos tras confirmar el pago.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-black text-white uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
                <ShoppingBag size={13} /> Comprar
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: "#eef2ff" }}>
                <Gift size={14} color="#6366f1" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: "#eef2ff" }}>
                <ShoppingCart size={14} color="#6366f1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
