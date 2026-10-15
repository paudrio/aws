import { ShoppingBag, Star, Gift, ShoppingCart, Zap } from "lucide-react";

const product = {
  name: "Netflix Premium",
  price: 85,
  originalPrice: 120,
  discountPercent: 29,
  isMonthly: true,
  isPopular: true,
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png",
};

export function FrescoVibrante() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #fef9c3 50%, #fdf2f8 100%)" }}>
      <div className="w-[300px]">
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: "#fff",
            boxShadow: "0 8px 40px rgba(16,185,129,0.13), 0 2px 8px rgba(0,0,0,0.06)",
            border: "1.5px solid #d1fae5",
          }}
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #10b981, #f59e0b, #ec4899)" }} />

          {/* Image area */}
          <div className="relative" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", padding: "24px 24px 16px" }}>
            {/* Popular badge */}
            {product.isPopular && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 2px 8px rgba(245,158,11,0.4)" }}>
                <Zap size={9} fill="currentColor" /> Popular
              </div>
            )}
            {/* Discount badge */}
            {product.discountPercent > 0 && (
              <div className="absolute top-3 right-3 flex items-center justify-center rounded-2xl text-white font-black"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", padding: "5px 10px", boxShadow: "0 2px 8px rgba(16,185,129,0.4)" }}>
                <span className="text-sm leading-none">-{product.discountPercent}%</span>
              </div>
            )}
            {/* Product image */}
            <div className="w-full h-[120px] flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4" />
            </div>
            {/* Stars */}
            <div className="flex items-center gap-0.5 mt-3 justify-center">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
              <span className="text-[10px] font-bold text-emerald-600 ml-1.5">4.9 · 847 ventas</span>
            </div>
          </div>

          {/* Card body */}
          <div className="flex flex-col gap-3 px-5 pt-3 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight tracking-tight">{product.name}</h3>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-700 uppercase tracking-wide" style={{ background: "#d1fae5" }}>
                {product.isMonthly ? "Pago mensual" : "Pago único"}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black" style={{ color: "#10b981" }}>Q{product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-slate-400 line-through pb-0.5">Q{product.originalPrice}</span>
              )}
              {product.isMonthly && <span className="text-xs text-slate-400 pb-0.5">/mes</span>}
            </div>

            {/* Info box */}
            <div className="rounded-2xl px-3 py-2.5 flex items-center gap-2" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
              <span className="text-base">💡</span>
              <p className="text-[10px] font-semibold text-amber-800 leading-snug">Lee la descripción antes de comprar. Sin reembolsos tras confirmar.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-1">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[12px] font-black text-white uppercase tracking-wide transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}>
                <ShoppingBag size={14} /> Comprar
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all active:scale-95" style={{ background: "#f0fdf4", border: "1.5px solid #d1fae5" }}>
                <Gift size={15} color="#10b981" />
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all active:scale-95" style={{ background: "#f0fdf4", border: "1.5px solid #d1fae5" }}>
                <ShoppingCart size={15} color="#10b981" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
