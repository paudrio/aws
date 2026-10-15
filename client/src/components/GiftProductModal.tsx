import { useState } from "react";
import { Gift, X, Send, AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface GiftProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function GiftProductModal({ product, onClose }: GiftProductModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/user/send-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipientEmail, productId: product.id, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          text: `¡Regalo enviado! ${data.recipientName || recipientEmail} ya tiene su suscripción de ${data.productName} activa y recibió un correo notificándole.`,
        });
      } else {
        setResult({ success: false, text: data.error || "Error al enviar el regalo" });
      }
    } catch {
      setResult({ success: false, text: "Error de conexión. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Regalar</h2>
              <p className="text-xs text-slate-500 font-medium">Se descontará de tu saldo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 pb-2">
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-3">
            {product.image && (
              <img
                src={product.image.startsWith("/") || product.image.startsWith("http") ? product.image : `/uploads/${product.image}`}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{product.name}</p>
              <p className="text-indigo-600 font-black text-base">Q{product.price}</p>
              <p className="text-xs text-slate-500 font-medium">30 días de suscripción</p>
            </div>
          </div>
        </div>

        {result ? (
          <div className="px-6 py-4">
            <div className={`flex items-start gap-3 p-4 rounded-2xl font-medium text-sm ${
              result.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {result.success
                ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
                : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
              }
              <span>{result.text}</span>
            </div>
            <Button
              onClick={result.success ? onClose : () => setResult(null)}
              className="w-full mt-4 rounded-xl font-black uppercase h-11"
              style={{ background: result.success ? "#16a34a" : "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff" }}
            >
              {result.success ? "Cerrar" : "Intentar de nuevo"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pt-3 pb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-black text-slate-700 uppercase text-xs tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Correo del destinatario
              </Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200 h-11 font-medium text-sm"
              />
              <p className="text-xs text-slate-400 font-medium">El destinatario debe estar registrado en PAUDRONIX GT.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-black text-slate-700 uppercase text-xs tracking-wide">
                Mensaje (opcional)
              </Label>
              <Textarea
                placeholder="¡Feliz cumpleaños! Te regalo esta suscripción..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="rounded-xl border-slate-200 font-medium text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 rounded-xl font-black uppercase h-11 border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl font-black uppercase h-11 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", boxShadow: "0 2px 12px rgba(234,88,12,0.3)" }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <><Send className="w-4 h-4" /> Enviar Regalo</>
                }
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
