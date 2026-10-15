import { useState, useEffect } from "react";
import { Gift, Send, User, DollarSign, Tv, CheckCircle2, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GiftType = "saldo" | "subscription";

export default function GiftSection() {
  const [giftType, setGiftType] = useState<GiftType>("saldo");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [productName, setProductName] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [useManualName, setUseManualName] = useState(false);

  useEffect(() => {
    fetch("/api/products", { credentials: "include" })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProductId(id);
    if (id) {
      const found = products.find((p: any) => p.id === id);
      if (found) setProductName(found.name);
      setUseManualName(false);
    }
  };

  const reset = () => {
    setEmail("");
    setAmount("");
    setProductName("");
    setDurationDays("30");
    setMessage("");
    setResult(null);
    setSelectedProductId("");
    setUseManualName(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, any> = { email, giftType, message };
      if (giftType === "saldo") body.amount = amount;
      if (giftType === "subscription") {
        body.productName = productName;
        body.durationDays = durationDays;
      }
      const res = await fetch("/api/admin/send-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          text: `Regalo enviado correctamente a ${data.recipientName || email}. Se le notificó por correo.`,
        });
        reset();
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
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">ENVIAR REGALO</h2>
              <p className="text-slate-500 font-bold italic">Regala saldo o una suscripción. El admin no paga — es gratis.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setGiftType("saldo"); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-black text-sm uppercase transition-all border-2 ${
                giftType === "saldo"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Regalar Saldo
            </button>
            <button
              type="button"
              onClick={() => { setGiftType("subscription"); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-black text-sm uppercase transition-all border-2 ${
                giftType === "subscription"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
              }`}
            >
              <Tv className="w-4 h-4" />
              Regalar Suscripción
            </button>
          </div>

          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl font-bold text-sm ${
              result.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {result.success
                ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
                : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
              }
              {result.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label className="font-black text-slate-700 uppercase text-xs tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Correo del usuario
              </Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200 h-12 font-medium"
              />
              <p className="text-xs text-slate-400 font-medium">El usuario debe estar registrado. Si el correo no existe, se mostrará un error.</p>
            </div>

            {giftType === "saldo" && (
              <div className="flex flex-col gap-2">
                <Label className="font-black text-slate-700 uppercase text-xs tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Monto a regalar (Q)
                </Label>
                <Input
                  type="number"
                  placeholder="50.00"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 h-12 font-medium"
                />
              </div>
            )}

            {giftType === "subscription" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="font-black text-slate-700 uppercase text-xs tracking-wide flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" /> Seleccionar producto del catálogo
                  </Label>
                  <div className="relative">
                    <select
                      value={selectedProductId}
                      onChange={handleProductSelect}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-10 font-medium text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— Elige un producto del catálogo —</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} (Q{p.price})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUseManualName(true); setSelectedProductId(""); setProductName(""); }}
                    className="text-xs text-primary font-bold underline text-left w-fit"
                  >
                    O escribe el nombre manualmente
                  </button>
                </div>

                {(useManualName || !selectedProductId) && (
                  <div className="flex flex-col gap-2">
                    <Label className="font-black text-slate-700 uppercase text-xs tracking-wide">
                      Nombre del servicio
                    </Label>
                    <Input
                      placeholder="Netflix, Disney+, HBO Max..."
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      required
                      className="rounded-xl border-slate-200 h-12 font-medium"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label className="font-black text-slate-700 uppercase text-xs tracking-wide">
                    Duración (días)
                  </Label>
                  <Input
                    type="number"
                    placeholder="30"
                    min="1"
                    value={durationDays}
                    onChange={e => setDurationDays(e.target.value)}
                    required
                    className="rounded-xl border-slate-200 h-12 font-medium"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <Label className="font-black text-slate-700 uppercase text-xs tracking-wide">
                Mensaje personalizado (opcional)
              </Label>
              <Textarea
                placeholder="Escribe un mensaje para el usuario..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="rounded-xl border-slate-200 font-medium resize-none"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase h-12 shadow-lg shadow-primary/25 flex items-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                : <><Send className="w-4 h-4" /> Enviar Regalo Gratis</>
              }
            </Button>
          </form>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 font-medium space-y-1">
            <p className="font-black uppercase text-xs tracking-wide text-amber-700">¿Cómo funciona?</p>
            <p>• <strong>Saldo:</strong> Se acredita directamente al balance del usuario sin costo alguno.</p>
            <p>• <strong>Suscripción:</strong> Aparece activa en el perfil del usuario con el servicio y duración que indiques.</p>
            <p>• El admin no paga nada — los regalos son completamente gratuitos desde aquí.</p>
            <p>• Los usuarios reciben un correo notificándoles del regalo.</p>
            <p>• Si el correo no está registrado, el sistema <strong>no permite enviar</strong> el regalo.</p>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
