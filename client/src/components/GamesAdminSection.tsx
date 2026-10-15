import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Gamepad2, Pencil, Image, Flag, Trophy, Type, ShoppingBag, Send, Mail, CheckCircle2, Clock, Key, AtSign, Lock, X, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type GameOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  deliveryContact: string;
  productId: string;
  productName: string;
  price: number;
  status: string;
  orderRef: string;
  date: string;
  gameCode: string;
  paymentMethod: string;
  deliveryType: "code" | "credentials";
};

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
  deliveryType: "code" | "credentials";
  requiresCustomerEmail: boolean;
  customerEmailLabel: string;
};

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile", "Otro"];

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/multimedia/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.url;
}

function UploadBox({
  number, label, hint, icon, bgClass, borderClass, textClass,
  currentUrl, uploading, onFile, previewMode = "cover",
}: {
  number: string; label: string; hint: string; icon: React.ReactNode;
  bgClass: string; borderClass: string; textClass: string;
  currentUrl: string; uploading: boolean; onFile: (f: File) => void;
  previewMode?: "cover" | "contain";
}) {
  return (
    <div className={`rounded-2xl border-2 ${borderClass} ${bgClass} overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className={`text-lg font-black ${textClass}`}>{number}</span>
        <span className={textClass}>{icon}</span>
        <div className="flex-1">
          <p className={`text-xs font-black uppercase tracking-wider ${textClass}`}>{label}</p>
          <p className="text-[10px] text-slate-400">{hint}</p>
        </div>
      </div>
      {currentUrl && (
        <div className={`mx-4 mb-2 rounded-xl overflow-hidden border border-white/50 ${previewMode === "contain" ? "flex justify-center bg-white py-2" : ""}`}>
          <img
            src={currentUrl}
            className={previewMode === "contain" ? "h-12 w-auto object-contain" : "w-full h-24 object-cover"}
          />
        </div>
      )}
      <label className={`flex items-center justify-center gap-2 mx-4 mb-3 cursor-pointer rounded-xl p-2.5 border-2 border-dashed ${borderClass} bg-white/70 hover:bg-white transition-colors`}>
        <span className={`text-sm font-bold ${textClass}`}>
          {uploading ? "Subiendo..." : currentUrl ? "Cambiar" : "Seleccionar imagen"}
        </span>
        <input type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          disabled={uploading} />
      </label>
    </div>
  );
}

export default function GamesAdminSection() {
  const [activeTab, setActiveTab] = useState<"juegos" | "pedidos">("juegos");
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");
  const [countryImageUrl, setCountryImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCountry, setIsUploadingCountry] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);

  const [formDeliveryType, setFormDeliveryType] = useState<"code" | "credentials">("code");
  const [formRequiresEmail, setFormRequiresEmail] = useState(false);
  const [formEmailLabel, setFormEmailLabel] = useState("");

  const [gameOrders, setGameOrders] = useState<GameOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [deliverOrderId, setDeliverOrderId] = useState<string | null>(null);
  const [deliverCode, setDeliverCode] = useState("");
  const [deliverEmail, setDeliverEmail] = useState("");
  const [deliverPassword, setDeliverPassword] = useState("");
  const [deliverInstructions, setDeliverInstructions] = useState("");
  const [delivering, setDelivering] = useState(false);

  const resetImages = () => { setImageUrl(""); setLogoImageUrl(""); setCountryImageUrl(""); setFormDeliveryType("code"); setFormRequiresEmail(false); setFormEmailLabel(""); };

  const resetDeliverFields = () => {
    setDeliverOrderId(null);
    setDeliverCode("");
    setDeliverEmail("");
    setDeliverPassword("");
    setDeliverInstructions("");
  };

  const fetchGames = async () => {
    try { const res = await fetch("/api/games"); if (res.ok) setGamesList(await res.json()); }
    catch {} setLoading(false);
  };

  const fetchGameOrders = async () => {
    setOrdersLoading(true);
    try { const res = await fetch("/api/game-orders"); if (res.ok) setGameOrders(await res.json()); }
    catch {} setOrdersLoading(false);
  };

  useEffect(() => { fetchGames(); }, []);
  useEffect(() => { if (activeTab === "pedidos") fetchGameOrders(); }, [activeTab]);

  const handleDeliverCode = async () => {
    if (!deliverOrderId || !deliverCode.trim()) return toast.error("Escribe el código a entregar");
    setDelivering(true);
    try {
      const res = await fetch(`/api/game-orders/${deliverOrderId}/deliver-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deliverCode.trim(), instructions: deliverInstructions.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.emailSent ? "✅ Código entregado y email enviado al usuario" : "✅ Código guardado (sin email — el pedido no tiene correo)");
        resetDeliverFields();
        fetchGameOrders();
      } else { toast.error(data.error || "Error al entregar código"); }
    } catch { toast.error("Error al entregar código"); }
    setDelivering(false);
  };

  const handleDeliverCredentials = async () => {
    if (!deliverOrderId || !deliverEmail.trim() || !deliverPassword.trim()) return toast.error("Escribe el correo y contraseña a entregar");
    setDelivering(true);
    try {
      const res = await fetch(`/api/game-orders/${deliverOrderId}/deliver-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deliverEmail.trim(), password: deliverPassword.trim(), instructions: deliverInstructions.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.emailSent ? "✅ Credenciales entregadas y email enviado al usuario" : "✅ Credenciales guardadas (sin email — el pedido no tiene correo)");
        resetDeliverFields();
        fetchGameOrders();
      } else { toast.error(data.error || "Error al entregar credenciales"); }
    } catch { toast.error("Error al entregar credenciales"); }
    setDelivering(false);
  };

  const doUpload = async (file: File, setter: (u: string) => void, setU: (v: boolean) => void, name: string) => {
    setU(true);
    try { setter(await uploadImage(file)); toast.success(`${name} lista`); }
    catch { toast.error(`Error al subir ${name.toLowerCase()}`); }
    setU(false);
  };

  const buildData = (fd: FormData, base?: Partial<Game>) => ({
    title: fd.get("title") as string,
    description: (fd.get("description") as string) || "",
    image: imageUrl || base?.image || "",
    logoImage: logoImageUrl || base?.logoImage || "",
    countryImage: countryImageUrl || base?.countryImage || "",
    platformName: (fd.get("platformName") as string) || "",
    countryText: (fd.get("countryText") as string) || "",
    platform: (fd.get("platform") as string) || "",
    price: parseFloat(fd.get("price") as string) || 0,
    link: (fd.get("link") as string) || "",
    order: parseInt(fd.get("order") as string) || 0,
    deliveryType: formDeliveryType,
    discountPercent: parseInt(fd.get("discountPercent") as string) || 0,
    requiresCustomerEmail: formRequiresEmail,
    customerEmailLabel: formEmailLabel,
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = buildData(new FormData(e.currentTarget));
    if (!data.title) return toast.error("El título es requerido");
    if (!data.image) return toast.error("Sube la portada del juego");
    try {
      const res = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { toast.success("Juego creado"); setCreateOpen(false); resetImages(); fetchGames(); }
    } catch { toast.error("Error al crear"); }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editGame) return;
    const data = buildData(new FormData(e.currentTarget), editGame);
    try {
      const res = await fetch(`/api/games/${editGame.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { toast.success("Actualizado"); setEditGame(null); resetImages(); fetchGames(); }
    } catch { toast.error("Error al actualizar"); }
  };

  const openEdit = (game: Game) => {
    setEditGame(game);
    setFormDeliveryType(game.deliveryType || "code");
    setFormRequiresEmail(game.requiresCustomerEmail ?? false);
    setFormEmailLabel(game.customerEmailLabel ?? "");
    setImageUrl("");
    setLogoImageUrl("");
    setCountryImageUrl("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await fetch(`/api/games/${id}`, { method: "DELETE" });
    toast.success("Eliminado"); fetchGames();
  };

  const handleToggleActive = async (game: Game) => {
    await fetch(`/api/games/${game.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !game.isActive }) });
    fetchGames();
  };

  const GameForm = ({ defaultValues, onSubmit, submitLabel }: { defaultValues?: Partial<Game>; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">

      {/* TIPO DE ENTREGA */}
      <div className="space-y-2">
        <Label className="font-black uppercase text-xs text-slate-600">Tipo de entrega *</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormDeliveryType("code")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 font-black text-xs uppercase transition-all ${formDeliveryType === "code" ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"}`}
          >
            <Key className="w-5 h-5" />
            Código digital
          </button>
          <button
            type="button"
            onClick={() => setFormDeliveryType("credentials")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 font-black text-xs uppercase transition-all ${formDeliveryType === "credentials" ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"}`}
          >
            <AtSign className="w-5 h-5" />
            Correo / Contraseña
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          {formDeliveryType === "code" ? "Al recibir un pedido, ingresas el código digital que se enviará al cliente." : "Al recibir un pedido, ingresas correo y contraseña que se enviarán al cliente."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="font-black uppercase text-xs text-slate-600">Título *</Label>
        <Input name="title" defaultValue={defaultValues?.title || ""} required className="rounded-xl h-11 border-2 border-slate-100 focus:border-indigo-400" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-black uppercase text-xs text-slate-600">Descripción</Label>
        <Input name="description" defaultValue={defaultValues?.description || ""} placeholder="Descripción..." className="rounded-xl h-11 border-2 border-slate-100" />
      </div>

      {/* 1. PORTADA */}
      <UploadBox
        number="1." label="Portada del Juego" hint="Imagen principal — requerida"
        icon={<Image className="w-4 h-4" />}
        bgClass="bg-indigo-50" borderClass="border-indigo-200" textClass="text-indigo-600"
        currentUrl={imageUrl || defaultValues?.image || ""}
        uploading={isUploading}
        onFile={f => doUpload(f, setImageUrl, setIsUploading, "Portada")}
        previewMode="cover"
      />

      {/* 2. LOGO */}
      <UploadBox
        number="2." label="Logo de Plataforma" hint="Xbox, PlayStation, Nintendo… aparece grande abajo"
        icon={<Trophy className="w-4 h-4" />}
        bgClass="bg-blue-50" borderClass="border-blue-200" textClass="text-blue-600"
        currentUrl={logoImageUrl || defaultValues?.logoImage || ""}
        uploading={isUploadingLogo}
        onFile={f => doUpload(f, setLogoImageUrl, setIsUploadingLogo, "Logo")}
        previewMode="contain"
      />

      {/* Nombre de plataforma */}
      <div className="space-y-1.5">
        <Label className="font-black uppercase text-xs text-blue-600 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> Nombre de la plataforma
        </Label>
        <Input name="platformName" defaultValue={defaultValues?.platformName || ""} placeholder='Ej: Xbox Live, PSN, Nintendo eShop...' className="rounded-xl h-11 border-2 border-blue-100 focus:border-blue-400" />
        <p className="text-[10px] text-slate-400">Este texto aparece en la tarjeta junto al logo</p>
      </div>

      {/* 3. PAÍS */}
      <UploadBox
        number="3." label="Imagen de País / Región" hint="Bandera u otra imagen — aparece arriba derecha (opcional)"
        icon={<Flag className="w-4 h-4" />}
        bgClass="bg-green-50" borderClass="border-green-200" textClass="text-green-600"
        currentUrl={countryImageUrl || defaultValues?.countryImage || ""}
        uploading={isUploadingCountry}
        onFile={f => doUpload(f, setCountryImageUrl, setIsUploadingCountry, "País")}
        previewMode="contain"
      />
      {/* Texto de país */}
      <div className="space-y-1.5">
        <Label className="font-black uppercase text-xs text-green-600 flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5" /> Texto de país / región
        </Label>
        <Input name="countryText" defaultValue={defaultValues?.countryText || ""} placeholder='Ej: Guatemala, México, USA, Latam...' className="rounded-xl h-11 border-2 border-green-100 focus:border-green-400" />
        <p className="text-[10px] text-slate-400">Si no subes imagen, se muestra este texto como badge arriba derecha</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600">Plataforma (categoría)</Label>
          <select name="platform" defaultValue={defaultValues?.platform || ""} className="w-full h-11 rounded-xl border-2 border-slate-100 px-3 text-sm font-medium bg-white">
            <option value="">— Seleccionar —</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600">Precio (Q)</Label>
          <Input name="price" type="number" step="0.01" defaultValue={defaultValues?.price ?? 0} className="rounded-xl h-11 border-2 border-slate-100" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600 flex items-center gap-1">
            Descuento simulado (%) <span className="text-indigo-500 font-black">ej: 95</span>
          </Label>
          <Input name="discountPercent" type="number" min="0" max="99" step="1" defaultValue={defaultValues?.discountPercent ?? 0} placeholder="0 = sin descuento" className="rounded-xl h-11 border-2 border-indigo-100 focus:border-indigo-400" />
          <p className="text-[10px] text-slate-400">Precio tachado visible en la tarjeta. No afecta el precio real.</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="font-black uppercase text-xs text-slate-600">Enlace</Label>
        <Input name="link" defaultValue={defaultValues?.link || ""} placeholder="https://..." className="rounded-xl h-11 border-2 border-slate-100" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-black uppercase text-xs text-slate-600">Orden</Label>
        <Input name="order" type="number" defaultValue={defaultValues?.order ?? 0} className="rounded-xl h-11 border-2 border-slate-100" />
      </div>
      <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Correo del cliente</p>
        <div className="flex items-center gap-3">
          <Switch
            id="gameRequiresEmail"
            checked={formRequiresEmail}
            onCheckedChange={(v) => { setFormRequiresEmail(v); if (!v) setFormEmailLabel(""); }}
          />
          <Label className="font-bold text-sm cursor-pointer" htmlFor="gameRequiresEmail">
            Pedir correo al cliente al comprar
          </Label>
        </div>
        {formRequiresEmail && (
          <div className="space-y-1">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Etiqueta del campo (opcional)</Label>
            <Input
              value={formEmailLabel}
              onChange={(e) => setFormEmailLabel(e.target.value)}
              placeholder="Ej: Ingresa tu correo de Xbox"
              className="rounded-xl h-10"
            />
            <p className="text-[10px] text-slate-400">Si se deja vacío, aparecerá como "Datos de acceso requeridos".</p>
          </div>
        )}
      </div>
      <Button type="submit" disabled={isUploading || isUploadingLogo || isUploadingCountry}
        className="w-full h-12 rounded-xl font-black uppercase tracking-wider text-base"
        style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
        {submitLabel}
      </Button>
    </form>
  );

  return (
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        {/* Header + Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-indigo-500" /> JUEGOS
            </h2>
          </div>
          {activeTab === "juegos" && (
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetImages(); }}>
              <DialogTrigger asChild>
                <Button className="font-black rounded-xl px-6" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                  <Plus className="w-4 h-4 mr-2" /> NUEVO JUEGO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white border-none rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Nuevo Juego</DialogTitle></DialogHeader>
                <GameForm onSubmit={handleCreate} submitLabel="CREAR JUEGO" />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab("juegos")} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black uppercase text-sm transition-all ${activeTab === "juegos" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}>
            <Gamepad2 className="w-4 h-4" /> Juegos
          </button>
          <button onClick={() => setActiveTab("pedidos")} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black uppercase text-sm transition-all ${activeTab === "pedidos" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}>
            <ShoppingBag className="w-4 h-4" /> Pedidos
            {gameOrders.filter(o => o.status !== "completed").length > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">{gameOrders.filter(o => o.status !== "completed").length}</span>
            )}
          </button>
        </div>

        {/* PEDIDOS TAB */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <p className="text-slate-400 text-center py-8">Cargando pedidos...</p>
            ) : gameOrders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No hay pedidos de juegos todavía.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 font-bold">{gameOrders.length} pedido(s) — haz clic en <strong>Entregar Código</strong> para enviar el código al usuario por email.</p>
                {gameOrders.map(order => {
                  const email = order.deliveryContact?.includes("@") ? order.deliveryContact : order.customerEmail;
                  return (
                    <div key={order.id} className={`rounded-2xl overflow-hidden border ${order.status === "completed" ? "border-green-100" : "border-indigo-100"}`} style={{ background: "#fff" }}>
                      {/* INFO HEADER */}
                      <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {order.status === "completed"
                              ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              : <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            }
                            <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${order.status === "completed" ? "bg-green-50 text-green-700" : "bg-indigo-50 text-indigo-700"}`}>
                              {order.status === "completed" ? "Entregado" : "Pendiente"}
                            </span>
                            <span className="text-xs text-slate-400 font-bold ml-1">
                              {order.deliveryType === "credentials" ? "· Correo/Contraseña" : "· Código digital"}
                            </span>
                          </div>
                          <h3 className="font-black text-slate-900 uppercase tracking-tight">{order.productName}</h3>
                          <p className="text-slate-500 text-xs font-medium mt-0.5">
                            {order.customerName} · <span className="font-bold text-slate-700">{email || <span className="text-red-400">Sin correo</span>}</span>
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">Q{order.price} · Ref: <span className="font-mono font-bold">{order.orderRef || order.id.slice(0, 8)}</span></p>
                          {order.gameCode && (
                            <div className="flex items-center gap-2 mt-2 rounded-lg px-3 py-1.5 w-fit" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              {order.deliveryType === "credentials" ? <AtSign className="w-3.5 h-3.5 text-indigo-500" /> : <Key className="w-3.5 h-3.5 text-indigo-500" />}
                              <span className="text-xs font-mono font-black text-slate-700">{order.gameCode}</span>
                            </div>
                          )}
                        </div>
                        <Button size="sm"
                          onClick={() => {
                            if (deliverOrderId === order.id) { resetDeliverFields(); return; }
                            setDeliverOrderId(order.id);
                            setDeliverInstructions(order.deliveredInstructions || "");
                            if (order.deliveryType === "credentials") {
                              const parts = (order.gameCode || "").split(" / ");
                              setDeliverEmail(parts[0] || "");
                              setDeliverPassword(parts[1] || "");
                            } else {
                              setDeliverCode(order.gameCode || "");
                            }
                          }}
                          className="rounded-xl font-bold text-xs shrink-0"
                          style={{ background: deliverOrderId === order.id ? "#64748b" : order.status === "completed" ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                          {deliverOrderId === order.id
                            ? <><X className="w-3.5 h-3.5 mr-1" /> Cerrar</>
                            : order.status === "completed"
                              ? <><Pencil className="w-3.5 h-3.5 mr-1" />{order.deliveryType === "credentials" ? "Editar credenciales" : "Editar código"}</>
                              : <><Send className="w-3.5 h-3.5 mr-1" />{order.deliveryType === "credentials" ? "Entregar credenciales" : "Entregar código"}</>
                          }
                        </Button>
                      </div>

                      {/* PANEL DE ENTREGA — aparece abajo cuando está abierto */}
                      {deliverOrderId === order.id && (
                        <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{ background: "#f8fafc", borderColor: order.status === "completed" ? "#dcfce7" : "#ffedd5" }}>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {order.status === "completed" ? "✏ Editar y reenviar" : "📦 Entregar al usuario"}
                          </p>

                          {/* Campos credenciales o código */}
                          {order.deliveryType === "credentials" ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Usuario / Correo</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="cuenta@gmail.com"
                                    value={deliverEmail}
                                    onChange={e => setDeliverEmail(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm font-bold border-2 border-indigo-200 focus:border-indigo-400 outline-none bg-white"
                                  />
                                  {deliverEmail && (
                                    <button onClick={() => setDeliverEmail("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Contraseña</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="contraseña123"
                                    value={deliverPassword}
                                    onChange={e => setDeliverPassword(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm font-bold font-mono border-2 border-indigo-200 focus:border-indigo-400 outline-none bg-white"
                                  />
                                  {deliverPassword && (
                                    <button onClick={() => setDeliverPassword("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Código del juego</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="XXXXX-XXXXX-XXXXX"
                                  value={deliverCode}
                                  onChange={e => setDeliverCode(e.target.value)}
                                  className="w-full rounded-xl px-3 py-2.5 text-sm font-black font-mono border-2 border-indigo-200 focus:border-indigo-400 outline-none bg-white tracking-widest"
                                />
                                {deliverCode && (
                                  <button onClick={() => setDeliverCode("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Instrucciones multilínea */}
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                              Instrucciones <span className="normal-case font-normal text-slate-300">(opcional — cada línea aparece separada)</span>
                            </label>
                            <div className="relative">
                              <textarea
                                rows={3}
                                placeholder={"Paso 1: Abre la plataforma oficial\nPaso 2: Ve a Canjear código\nPaso 3: Ingresa el código y activa"}
                                value={deliverInstructions}
                                onChange={e => setDeliverInstructions(e.target.value)}
                                className="w-full rounded-xl px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-slate-400 outline-none bg-white resize-none leading-relaxed"
                              />
                              {deliverInstructions && (
                                <button onClick={() => setDeliverInstructions("")} className="absolute right-2 top-2 text-slate-300 hover:text-slate-500">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Info correo + botones */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              {!email
                                ? <p className="text-indigo-500 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Sin correo — se guardará pero no se enviará email</p>
                                : <p className="text-slate-400 text-xs flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {email}</p>
                              }
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={resetDeliverFields} className="rounded-xl font-bold text-xs px-4">
                                Cancelar
                              </Button>
                              <Button size="sm"
                                onClick={order.deliveryType === "credentials" ? handleDeliverCredentials : handleDeliverCode}
                                disabled={delivering}
                                className="rounded-xl font-black text-xs px-5"
                                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                {delivering ? "Enviando..." : order.status === "completed" ? "Guardar y reenviar" : "Entregar ahora"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* JUEGOS TAB */}
        {activeTab === "juegos" && (
        <>
        {loading ? <p className="text-slate-400 text-center py-12">Cargando...</p>
        : gamesList.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No hay juegos. Presiona "NUEVO JUEGO".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gamesList.map(game => (
              <div key={game.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${game.isActive ? "border-slate-100" : "border-red-100 opacity-60"}`}>
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                  {/* País — arriba derecha */}
                  {game.countryImage && (
                    <div className="absolute top-2 right-2 rounded-lg shadow-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", padding: "4px 7px" }}>
                      <img src={game.countryImage} alt="país" className="h-6 w-auto object-contain" />
                    </div>
                  )}
                  {/* Logo — abajo, centrado */}
                  {game.logoImage && (
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2" style={{ background: "linear-gradient(transparent,rgba(0,0,0,0.7))" }}>
                      <img src={game.logoImage} alt={game.platform} className="h-9 w-auto object-contain drop-shadow-lg" />
                      {game.platformName && <span className="text-white text-[9px] font-bold mt-0.5 uppercase tracking-widest">{game.platformName}</span>}
                    </div>
                  )}
                  {/* Fallback si no hay logo */}
                  {!game.logoImage && game.platform && (
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                      {game.platformName || game.platform}
                    </span>
                  )}
                  {!game.isActive && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg">Inactivo</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{game.title}</h3>
                    <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${game.deliveryType === "credentials" ? "bg-purple-50 text-purple-600" : "bg-indigo-50 text-indigo-600"}`}>
                      {game.deliveryType === "credentials" ? <AtSign className="w-2.5 h-2.5" /> : <Key className="w-2.5 h-2.5" />}
                      {game.deliveryType === "credentials" ? "Correo/Pass" : "Código"}
                    </span>
                  </div>
                  {game.price > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-indigo-600 font-black text-base">Q{game.price}</p>
                      {(game as any).discountPercent > 0 && (
                        <>
                          <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-md">-{(game as any).discountPercent}%</span>
                          <span className="text-xs text-slate-400 line-through">Q{Math.round(game.price / (1 - (game as any).discountPercent / 100))}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Dialog onOpenChange={(o) => { if (o) { openEdit(game); } else { setEditGame(null); resetImages(); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl font-bold text-xs"><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg bg-white border-none rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tighter italic">Editar Juego</DialogTitle></DialogHeader>
                        {editGame && <GameForm defaultValues={editGame} onSubmit={handleEdit} submitLabel="GUARDAR CAMBIOS" />}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline" className={`rounded-xl font-bold text-xs px-3 ${game.isActive ? "text-slate-600" : "text-green-600"}`} onClick={() => handleToggleActive(game)}>
                      {game.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-xl px-3" onClick={() => handleDelete(game.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  );
}
