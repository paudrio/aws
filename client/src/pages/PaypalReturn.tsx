import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function PaypalReturn() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "cancelled">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const cancelled = window.location.pathname.includes("cancel");

    if (cancelled || !token) {
      setStatus("cancelled");
      setMessage("Pago cancelado. Puedes intentarlo de nuevo.");
      return;
    }

    const checkoutData = (() => {
      try { return JSON.parse(sessionStorage.getItem("paypal_checkout") || "{}"); } catch { return {}; }
    })();

    const process = async () => {
      try {
        const captureRes = await fetch(`/api/paypal/capture-order/${token}`, { method: "POST" });
        if (!captureRes.ok) throw new Error("Error al capturar pago");

        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            customerName: checkoutData.customerName || "Cliente PayPal",
            customerPhone: checkoutData.customerWhatsapp ? `502${checkoutData.customerWhatsapp}` : "",
            productId: checkoutData.productId || "",
            productName: checkoutData.productName || "",
            price: checkoutData.price || 0,
            paymentMethod: "paypal",
            deliveryMethod: "whatsapp",
            deliveryContact: checkoutData.customerWhatsapp ? `502${checkoutData.customerWhatsapp}` : "",
            paymentScreenshot: "",
            customerEmail: checkoutData.customerEmail || "",
            customerPassword: checkoutData.customerPassword || "",
            status: "pending",
            orderRef: checkoutData.orderRef || token.slice(0, 6).toUpperCase(),
          }),
        });

        if (!orderRes.ok) throw new Error("Error al registrar pedido");
        const orderData = await orderRes.json();

        if (checkoutData.productId && orderData?.id) {
          try {
            await fetch("/api/user/subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                productId: checkoutData.productId,
                productName: checkoutData.productName,
                productImage: checkoutData.productImage || "",
                price: checkoutData.price,
                status: "pending",
                orderId: orderData.id,
              }),
            });
          } catch {}
        }

        sessionStorage.removeItem("paypal_checkout");
        setStatus("success");
        setMessage(`Tu pedido fue registrado. Referencia: ${checkoutData.orderRef || token.slice(0, 6).toUpperCase()}`);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Error al procesar el pago. Contacta al administrador.");
      }
    };

    process();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-5">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Procesando pago...</h2>
            <p className="text-slate-500 text-sm">Por favor espera, estamos confirmando tu pago con PayPal.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800">¡Pago exitoso!</h2>
            <p className="text-slate-500 text-sm">{message}</p>
            <p className="text-slate-400 text-xs">Recibirás tus credenciales pronto. Puedes ver el estado en tu perfil.</p>
            <a href="/" className="block w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 transition-colors">
              Volver al inicio
            </a>
          </>
        )}
        {status === "cancelled" && (
          <>
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Pago cancelado</h2>
            <p className="text-slate-500 text-sm">{message}</p>
            <a href="/" className="block w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 transition-colors">
              Volver al inicio
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Error en el pago</h2>
            <p className="text-slate-500 text-sm">{message}</p>
            <a href="/" className="block w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 transition-colors">
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  );
}
