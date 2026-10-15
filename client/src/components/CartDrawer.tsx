import React, { useState } from "react";
import { useCart } from "@/lib/cartContext";
import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, PackageOpen } from "lucide-react";
import Checkout from "@/components/Checkout";
import CartCheckout from "@/components/CartCheckout";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [showCartCheckout, setShowCartCheckout] = useState(false);

  if (!isOpen && !checkoutProduct && !showCartCheckout) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Panel lateral */}
      {isOpen && (
        <div
          className="fixed right-0 top-0 h-full z-50 flex flex-col"
          style={{
            width: 'min(420px, 100vw)',
            background: '#fff',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                <ShoppingCart className="w-4.5 h-4.5 text-white w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-black text-slate-900">Mi Carrito</p>
                <p className="text-xs text-slate-500">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
                  <PackageOpen className="w-10 h-10 text-indigo-300" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700 text-base">Tu carrito está vacío</p>
                  <p className="text-slate-400 text-sm mt-1">Agrega productos para comenzar</p>
                </div>
                <button
                  onClick={closeCart}
                  className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="rounded-2xl p-3 flex gap-3"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  {/* Imagen */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ffedd5' }}>
                      <ShoppingBag className="w-7 h-7 text-indigo-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight truncate">{product.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{product.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-base font-black" style={{ color: '#6366f1' }}>
                        Q{(product.price * quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                          style={{ background: '#e2e8f0' }}
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-700 w-5 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors"
                          style={{ background: '#ffedd5' }}
                        >
                          <Plus className="w-3 h-3 text-indigo-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Botones acción */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="w-full py-1.5 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                      style={{ border: '1px solid #fee2e2' }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con total y acciones */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4 space-y-3" style={{ background: '#fffbf5' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">Total</span>
                <span className="text-xl font-black" style={{ color: '#6366f1' }}>Q{totalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => {
                  closeCart();
                  setShowCartCheckout(true);
                }}
                className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 20px rgba(234,88,12,0.35)' }}
              >
                <ShoppingBag className="w-4 h-4" />
                Pagar todo — Q{totalPrice.toLocaleString()}
              </button>
              <button
                onClick={clearCart}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                style={{ border: '1px solid #e2e8f0' }}
              >
                Vaciar carrito
              </button>
            </div>
          )}
        </div>
      )}

      {/* Checkout individual (por si acaso) */}
      {checkoutProduct && (
        <Checkout
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
        />
      )}

      {/* Checkout de todo el carrito */}
      {showCartCheckout && (
        <CartCheckout onClose={() => setShowCartCheckout(false)} />
      )}
    </>
  );
}
