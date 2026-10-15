import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Download, Database, Users, CreditCard, ShoppingBag, RefreshCw,
  Wallet, Gamepad2, Gift, CheckCircle2, Mail,
  Upload, AlertTriangle, RotateCcw, FileJson, Tv, MessageSquare,
  Megaphone, Settings, Tag, ShieldOff, UserCheck, Star, FolderArchive,
} from "lucide-react";

const DATA_ITEMS = [
  { icon: <Users className="w-4 h-4 text-indigo-500" />, label: "Usuarios y suscriptores", desc: "Clientes registrados, roles, correos" },
  { icon: <CreditCard className="w-4 h-4 text-indigo-500" />, label: "Suscripciones y renovaciones", desc: "Todas activas e inactivas con credenciales y fechas" },
  { icon: <ShoppingBag className="w-4 h-4 text-indigo-500" />, label: "Pedidos", desc: "Historial completo de pedidos y compras" },
  { icon: <Wallet className="w-4 h-4 text-indigo-500" />, label: "Transacciones de cartera", desc: "Todos los movimientos de saldo (créditos y débitos)" },
  { icon: <Wallet className="w-4 h-4 text-indigo-500" />, label: "Recargas", desc: "Solicitudes de recarga de saldo" },
  { icon: <Gamepad2 className="w-4 h-4 text-indigo-500" />, label: "Productos y juegos", desc: "Catálogo completo de productos y juegos" },
  { icon: <Tag className="w-4 h-4 text-indigo-500" />, label: "Categorías", desc: "Todas las categorías del catálogo" },
  { icon: <Tv className="w-4 h-4 text-indigo-500" />, label: "Canales de TV", desc: "Lista completa de canales IPTV con URLs" },
  { icon: <CreditCard className="w-4 h-4 text-indigo-500" />, label: "Credenciales de productos", desc: "Correos y contraseñas del inventario de credenciales" },
  { icon: <Megaphone className="w-4 h-4 text-indigo-500" />, label: "Banners y secciones destacadas", desc: "Imágenes y bloques visuales de la página principal" },
  { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: "Noticias", desc: "Publicaciones y noticias de la plataforma" },
  { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: "Soporte — tickets y mensajes", desc: "Todos los tickets, mensajes y reportes de problemas" },
  { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: "Chat de clientes", desc: "Historial de mensajes entre clientes y administradores" },
  { icon: <UserCheck className="w-4 h-4 text-indigo-500" />, label: "Agentes de soporte", desc: "Avatares y agentes del chat" },
  { icon: <Wallet className="w-4 h-4 text-indigo-500" />, label: "Vendedores — transacciones y retiros", desc: "Movimientos y solicitudes de retiro de vendedores" },
  { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: "Chat de vendedores", desc: "Mensajes entre vendedores y administradores" },
  { icon: <Gift className="w-4 h-4 text-indigo-500" />, label: "Programa de referidos", desc: "Configuración y transacciones del programa" },
  { icon: <Tag className="w-4 h-4 text-indigo-500" />, label: "Códigos de descuento", desc: "Todos los cupones y descuentos creados" },
  { icon: <ShieldOff className="w-4 h-4 text-indigo-500" />, label: "Correos bloqueados", desc: "Lista de correos baneados de la plataforma" },
  { icon: <Settings className="w-4 h-4 text-indigo-500" />, label: "Configuración", desc: "Ajustes generales del sistema (hero URL, etc.)" },
  { icon: <Star className="w-4 h-4 text-indigo-500" />, label: "Métodos de pago para recargas", desc: "Bancos y métodos de pago configurados" },
];

const RESTORE_TABLE_LABELS: Record<string, { icon: string; label: string }> = {
  users: { icon: "👤", label: "Usuarios" },
  subscriptions: { icon: "🔄", label: "Suscripciones" },
  orders: { icon: "🛍️", label: "Pedidos" },
  transactions: { icon: "💳", label: "Transacciones" },
  products: { icon: "📦", label: "Productos" },
  games: { icon: "🎮", label: "Juegos" },
  renewals: { icon: "🔁", label: "Renovaciones" },
  recharges: { icon: "💰", label: "Recargas" },
  referralTransactions: { icon: "🎁", label: "Ref. transacc." },
  categories: { icon: "🏷️", label: "Categorías" },
  news: { icon: "📰", label: "Noticias" },
  featuredSections: { icon: "⭐", label: "Secciones dest." },
  banners: { icon: "🖼️", label: "Banners" },
  subscribers: { icon: "📧", label: "Suscriptores" },
  tvChannels: { icon: "📺", label: "Canales TV" },
  supportTickets: { icon: "🎫", label: "Tickets" },
  supportMessages: { icon: "💬", label: "Msgs soporte" },
  problemReports: { icon: "⚠️", label: "Reportes" },
  clientMessages: { icon: "📩", label: "Chat clientes" },
  supportAgents: { icon: "🧑‍💼", label: "Agentes" },
  sellerTransactions: { icon: "💼", label: "Vend. txns" },
  sellerWithdrawals: { icon: "🏧", label: "Retiros" },
  sellerMessages: { icon: "🤝", label: "Chat vend." },
  rechargePaymentMethods: { icon: "🏦", label: "Métodos pago" },
  discountCodes: { icon: "🏷️", label: "Descuentos" },
  productCredentials: { icon: "🔑", label: "Credenciales" },
  bannedEmails: { icon: "🚫", label: "Bloqueados" },
  referralProgram: { icon: "🔗", label: "Prog. referidos" },
  settings: { icon: "⚙️", label: "Configuración" },
};

type RestoreResult = Record<string, number>;
type TableErrors = Record<string, string>;

export default function BackupSection() {
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [loadingFullZip, setLoadingFullZip] = useState(false);
  const [lastDownload, setLastDownload] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [tableErrors, setTableErrors] = useState<TableErrors>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFullZipDownload = async () => {
    setLoadingFullZip(true);
    toast.info("Generando ZIP completo con imágenes... puede tardar unos segundos.");
    try {
      const response = await fetch("/api/admin/export-full-zip", { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Error al generar el ZIP completo");
        setLoadingFullZip(false);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `paudronix-backup-completo-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("✅ ZIP completo descargado — incluye base de datos + imágenes");
    } catch {
      toast.error("Error al descargar el ZIP completo.");
    }
    setLoadingFullZip(false);
  };

  const handleDownload = async () => {
    setLoadingDownload(true);
    try {
      window.open("/api/admin/export-backup", "_blank");
      const now = new Date().toLocaleString("es-GT", { dateStyle: "long", timeStyle: "short" });
      setLastDownload(now);
      toast.success("✅ Respaldo abierto — guárdalo con Ctrl+S en la nueva pestaña");
    } catch {
      toast.error("Error al generar el respaldo.");
    }
    setLoadingDownload(false);
  };

  const handleEmailBackup = async () => {
    setLoadingEmail(true);
    try {
      const res = await fetch("/api/admin/send-backup-email", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const now = new Date().toLocaleString("es-GT", { dateStyle: "long", timeStyle: "short" });
        setLastEmail(now);
        toast.success("✅ Respaldo enviado a tu correo de administrador");
      } else {
        toast.error(data.error || "Error al enviar el respaldo por correo");
      }
    } catch {
      toast.error("Error al enviar el respaldo por correo.");
    }
    setLoadingEmail(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error("El archivo debe ser un .json de respaldo de PAUDRONIX GT");
      return;
    }
    setSelectedFile(file);
    setConfirmRestore(false);
    setRestoreResult(null);
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setLoadingRestore(true);
    try {
      const text = await selectedFile.text();
      let backup: any;
      try {
        backup = JSON.parse(text);
      } catch {
        toast.error("El archivo no es un JSON válido.");
        setLoadingRestore(false);
        return;
      }

      const res = await fetch("/api/admin/restore-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(backup),
      });
      const data = await res.json();
      if (res.ok) {
        setRestoreResult(data.restored);
        setTableErrors(data.tableErrors ?? {});
        setSelectedFile(null);
        setConfirmRestore(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        const errCount = Object.keys(data.tableErrors ?? {}).length;
        if (errCount > 0) {
          toast.warning(`Restauración completada con ${errCount} advertencia(s). Revisa los detalles.`);
        } else {
          toast.success("✅ Restauración completada sin errores");
        }
      } else if (res.status === 403) {
        toast.error("⛔ Debes iniciar sesión como administrador para restaurar datos.");
      } else {
        toast.error(data.error || "Error al restaurar los datos");
      }
    } catch {
      toast.error("Error al procesar el archivo de respaldo.");
    }
    setLoadingRestore(false);
  };

  const totalRestored = restoreResult
    ? Object.values(restoreResult).reduce((a, b) => a + b, 0)
    : 0;
  const errorCount = Object.keys(tableErrors).length;

  return (
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="max-w-2xl mx-auto space-y-10">

          {/* ── Header ── */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">RESPALDO DE DATOS</h2>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Copia completa de <strong>toda</strong> la plataforma — excepto películas</p>
            </div>
          </div>

          {/* ── What's included ── */}
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-4">¿Qué incluye el respaldo? ({DATA_ITEMS.length} categorías)</h3>
            <div className="grid grid-cols-1 gap-2">
              {DATA_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm">{item.label}</p>
                    <p className="text-slate-400 text-xs truncate">{item.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Manual backup actions ── */}
          <div className="space-y-3">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-2">Generar respaldo ahora</h3>

            {/* Full ZIP with images */}
            <Button
              onClick={handleFullZipDownload}
              disabled={loadingFullZip}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-wider text-base flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
            >
              {loadingFullZip
                ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generando ZIP completo...</>
                : <><FolderArchive className="w-5 h-5" /> Descargar ZIP completo (BD + imágenes)</>}
            </Button>
            <p className="text-xs text-slate-400 text-center -mt-1">Incluye base de datos + todas las imágenes/archivos subidos</p>

            <Button
              onClick={handleEmailBackup}
              disabled={loadingEmail}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-wider text-base flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
            >
              {loadingEmail
                ? <><RefreshCw className="w-5 h-5 animate-spin" /> Enviando al correo...</>
                : <><Mail className="w-5 h-5" /> Enviar respaldo al correo ahora</>}
            </Button>
            {lastEmail && (
              <p className="text-center text-xs text-green-600 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enviado: {lastEmail}
              </p>
            )}

            <Button
              onClick={handleDownload}
              disabled={loadingDownload}
              variant="outline"
              className="w-full h-12 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-3 border-2"
            >
              {loadingDownload
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Abriendo...</>
                : <><Download className="w-4 h-4" /> Ver / descargar en nueva pestaña</>}
            </Button>
            {lastDownload && (
              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Abierto: {lastDownload}
              </p>
            )}
          </div>

          {/* ── RESTORE SECTION ── */}
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-4">Restaurar datos desde respaldo</h3>

            {/* How it works */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 space-y-2 text-sm text-slate-600">
              <p className="font-black text-slate-700 text-xs uppercase tracking-wide mb-2">¿Cómo funciona la restauración?</p>
              <p>1. Abre el correo del administrador y descarga el archivo <strong>.json</strong> del respaldo.</p>
              <p>2. Sube ese archivo aquí con el botón de abajo.</p>
              <p>3. Presiona <strong>"Restaurar ahora"</strong> — el sistema revisa qué datos faltan y los vuelve a agregar.</p>
              <p>4. Lo que <strong>ya existe</strong> en la plataforma <em>no se toca</em>. Solo se agregan los registros que hayan desaparecido.</p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">Los usuarios restaurados deben iniciar sesión nuevamente con Google para actualizar su contraseña.</p>
            </div>

            {/* File picker */}
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileJson className="w-6 h-6 text-indigo-500" />
                  <div className="text-left">
                    <p className="font-black text-slate-800 text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB — listo para restaurar</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-black text-slate-500 text-sm">Toca aquí para seleccionar el archivo de respaldo</p>
                  <p className="text-xs text-slate-400">Solo archivos .json de PAUDRONIX GT</p>
                </div>
              )}
            </div>

            {/* Confirmation checkbox */}
            {selectedFile && !confirmRestore && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-black text-amber-800 text-sm">Confirma antes de continuar</p>
                  <p className="text-amber-700 text-xs mt-1">
                    Se restaurarán datos faltantes del archivo <strong>{selectedFile.name}</strong>. Los datos que ya existen no se modificarán.
                  </p>
                  <button
                    onClick={() => setConfirmRestore(true)}
                    className="mt-3 text-xs font-black text-amber-800 underline"
                  >
                    Entiendo — quiero restaurar
                  </button>
                </div>
              </div>
            )}

            {/* Restore button */}
            {selectedFile && confirmRestore && (
              <Button
                onClick={handleRestore}
                disabled={loadingRestore}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-wider text-base flex items-center justify-center gap-3"
                style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
              >
                {loadingRestore
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Restaurando datos...</>
                  : <><RotateCcw className="w-5 h-5" /> Restaurar ahora</>}
              </Button>
            )}

            {/* Restore result */}
            {restoreResult && (
              <div className={`rounded-2xl p-5 mt-4 border ${errorCount > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className={`w-5 h-5 ${errorCount > 0 ? "text-amber-600" : "text-green-600"}`} />
                  <p className={`font-black text-sm uppercase tracking-wide ${errorCount > 0 ? "text-amber-800" : "text-green-800"}`}>
                    Restauración completada — {totalRestored} registro{totalRestored !== 1 ? "s" : ""} recuperado{totalRestored !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-sm mb-3">
                  {Object.entries(restoreResult).map(([key, val]) => {
                    const meta = RESTORE_TABLE_LABELS[key] ?? { icon: "📋", label: key };
                    const hasError = tableErrors[key];
                    return (
                      <div key={key} className={`bg-white rounded-xl p-2 border flex items-center gap-1.5 ${hasError ? "border-red-200" : "border-green-100"}`}>
                        <span className="text-base leading-none">{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="font-black text-slate-600 text-[10px] leading-tight truncate">{meta.label}</p>
                          {hasError ? (
                            <p className="text-[10px] text-red-500 font-bold">Error</p>
                          ) : (
                            <p className={`text-base font-black leading-tight ${val > 0 ? "text-green-600" : "text-slate-300"}`}>{val}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errorCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-1">
                    <p className="font-black text-red-700 text-xs uppercase tracking-wide mb-1">Advertencias ({errorCount})</p>
                    {Object.entries(tableErrors).map(([table, msg]) => (
                      <p key={table} className="text-xs text-red-600"><strong>{table}:</strong> {msg}</p>
                    ))}
                  </div>
                )}
                {totalRestored === 0 && errorCount === 0 && (
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Todos los datos del respaldo ya estaban presentes — no había nada que recuperar.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
