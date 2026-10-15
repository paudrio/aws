import React, { useState, useEffect, useRef, Component } from "react";

class AdminErrorBoundary extends Component<{ children: React.ReactNode; section?: string }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("Admin section error:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <p className="text-slate-700 font-semibold">Ocurrió un error al cargar esta sección.</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
            onClick={() => this.setState({ hasError: false })}
          >Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertCategorySchema, insertOrderSchema } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, ShoppingBag, Settings, ImageIcon, Plus, Trash2, CheckCircle2, AlertCircle, Upload, Play, Music, Layout, Save, X, Video, Zap, Lock, LogOut, Pencil, Loader2, MessageSquare, Send, Users, Camera, Edit3, Mail, Calendar, Key, Eye, EyeOff, ClipboardList, Store, CreditCard, Wallet, ChevronDown, RefreshCw, Check, Gamepad2, Gift, Link, Copy, ToggleLeft, ToggleRight, Download, Database, ShieldCheck, Search } from "lucide-react";
import Hls from "hls.js";
import AdminTvSection from "@/components/AdminTvSection";
import GamesAdminSection from "@/components/GamesAdminSection";
import FortniteAdminSection from "@/components/FortniteAdminSection";
import BackupSection from "@/components/BackupSection";
import MoviesBackupSection from "@/components/MoviesBackupSection";
import GiftSection from "@/components/GiftSection";

function HeroPreview({ streamUrl }: { streamUrl?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(`/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden relative border-4 border-slate-100">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse text-[10px] font-black uppercase shadow-lg">
        <div className="w-2 h-2 bg-white rounded-full" /> VISTA PREVIA
      </div>
    </div>
  );
}

function GlobalPaymentMethodPicker({ selectedIds, onChange, showWhatsapp, onWhatsappChange }: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  showWhatsapp: boolean;
  onWhatsappChange: (v: boolean) => void;
}) {
  const [methods, setMethods] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/recharge-payment-methods/active")
      .then(r => r.ok ? r.json() : [])
      .then(setMethods)
      .catch(() => {});
  }, []);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="mt-3 p-4 bg-green-50 rounded-2xl border border-green-100">
      <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-2">Métodos de pago visibles</p>
      <div className="flex flex-wrap gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${showWhatsapp ? "bg-green-600 border-green-600 text-white" : "bg-white border-slate-200 text-slate-500"}`}
          onClick={() => onWhatsappChange(!showWhatsapp)}
        >
          WhatsApp
        </div>
        {methods.map(m => (
          <div
            key={m.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${selectedIds.includes(m.id) ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500"}`}
            onClick={() => toggle(m.id)}
          >
            {m.name}
          </div>
        ))}
        {methods.length === 0 && (
          <p className="text-[10px] text-slate-400 italic">Agrega métodos en "Métodos de Recarga" del admin para que aparezcan aquí.</p>
        )}
      </div>
    </div>
  );
}

function SellerProductSwitches({ product }: { product: any }) {
  const [isMonthly, setIsMonthly] = useState(!!product.isMonthly);
  const [inStock, setInStock] = useState(product.inStock !== false);
  const [showCheckmarks, setShowCheckmarks] = useState(!!product.showCheckmarks);
  const [verifiedSeller, setVerifiedSeller] = useState(!!product.verifiedSeller);
  const [showWhatsapp, setShowWhatsapp] = useState(product.showWhatsapp !== false);
  const [showBinance, setShowBinance] = useState(!!product.showBinance);
  const [showBanrural, setShowBanrural] = useState(!!product.showBanrural);
  const [showBac, setShowBac] = useState(!!product.showBac);
  const [showBi, setShowBi] = useState(!!product.showBi);

  return (
    <div className="space-y-3">
      <input type="hidden" id="sp_isMonthly" data-checked={String(isMonthly)} />
      <input type="hidden" id="sp_inStock" data-checked={String(inStock)} />
      <input type="hidden" id="sp_showCheckmarks" data-checked={String(showCheckmarks)} />
      <input type="hidden" id="sp_verifiedSeller" data-checked={String(verifiedSeller)} />
      <input type="hidden" id="sp_showWhatsapp" data-checked={String(showWhatsapp)} />
      <input type="hidden" id="sp_showBinance" data-checked={String(showBinance)} />
      <input type="hidden" id="sp_showBanrural" data-checked={String(showBanrural)} />
      <input type="hidden" id="sp_showBac" data-checked={String(showBac)} />
      <input type="hidden" id="sp_showBi" data-checked={String(showBi)} />

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-slate-200">
          <Switch checked={inStock} onCheckedChange={v => setInStock(v)} />
          <Label className="font-bold text-xs cursor-pointer">En Stock</Label>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-slate-200">
          <Switch checked={showCheckmarks} onCheckedChange={v => setShowCheckmarks(v)} />
          <Label className="font-bold text-xs cursor-pointer">Mostrar ✓</Label>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-slate-200">
          <Switch checked={verifiedSeller} onCheckedChange={v => setVerifiedSeller(v)} />
          <Label className="font-bold text-xs cursor-pointer">Verificado</Label>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-slate-200">
          <Switch checked={showWhatsapp} onCheckedChange={v => setShowWhatsapp(v)} />
          <Label className="font-bold text-xs cursor-pointer">WhatsApp</Label>
        </div>
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Tipo de Pago</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsMonthly(true)} className={`flex-1 py-2 px-3 rounded-lg font-black text-xs border-2 transition-all ${isMonthly ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
            Por Mes
          </button>
          <button type="button" onClick={() => setIsMonthly(false)} className={`flex-1 py-2 px-3 rounded-lg font-black text-xs border-2 transition-all ${!isMonthly ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
            Pago Único
          </button>
        </div>
      </div>

      <div className="p-3 bg-green-50 rounded-xl border border-green-100 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-green-700">Métodos de Pago</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowBinance(!showBinance)} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black transition-all ${showBinance ? "bg-yellow-400 border-yellow-400 text-black" : "bg-white border-slate-200 text-slate-500"}`}>Binance</button>
          <button type="button" onClick={() => setShowBanrural(!showBanrural)} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black transition-all ${showBanrural ? "bg-[#00843D] border-[#00843D] text-white" : "bg-white border-slate-200 text-slate-500"}`}>Banrural</button>
          <button type="button" onClick={() => setShowBac(!showBac)} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black transition-all ${showBac ? "bg-[#E31E24] border-[#E31E24] text-white" : "bg-white border-slate-200 text-slate-500"}`}>BAC</button>
          <button type="button" onClick={() => setShowBi(!showBi)} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black transition-all ${showBi ? "bg-[#004A99] border-[#004A99] text-white" : "bg-white border-slate-200 text-slate-500"}`}>Banco Industrial</button>
        </div>
      </div>
    </div>
  );
}

function NovedadesPanel() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ total: number; message: string } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Escribe el asunto y el contenido antes de enviar");
      return;
    }
    if (!confirm(`¿Enviar este correo a TODOS los usuarios registrados?`)) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`✅ Enviando a ${data.total} usuarios — llegan en segundos`);
        setSubject("");
        setBody("");
      } else {
        toast.error(data.error || "Error al enviar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5">
          <h2 className="text-white text-xl font-black flex items-center gap-2">
            📢 Novedades — Correo masivo
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Envía un correo a todos los usuarios registrados en la plataforma</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wide">Asunto del correo</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej: 🎉 Novedades de mayo en PAUDRONIX GT"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wide">Contenido del correo</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={"Escribe aquí tu mensaje...\n\nPuedes usar varias líneas, el correo respetará el formato."}
              rows={10}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50 resize-y font-mono"
            />
            <p className="text-xs text-slate-400">El correo lleva el diseño oficial de PAUDRONIX GT automáticamente.</p>
          </div>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-black text-green-800">Correos en camino</p>
                <p className="text-xs text-green-700">Enviando a {result.total} usuarios en segundo plano — llegarán en el correo principal en segundos.</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            {sending ? (
              <><span className="animate-spin">⏳</span> Procesando...</>
            ) : (
              <>📧 Enviar a todos los usuarios</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
        <p className="text-blue-800 text-sm font-black mb-1">💡 Cómo funciona</p>
        <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
          <li>Al dar enviar, el servidor empieza a mandar en <strong>segundo plano</strong> sin bloquearse</li>
          <li>Se envían en grupos de 5 a la vez — rápido y sin timeouts</li>
          <li>Los correos llegan al <strong>correo principal</strong>, no a spam</li>
          <li>Revisá bien el asunto y contenido antes de enviar — no se puede deshacer</li>
        </ul>
      </div>
    </div>
  );
}

function DiagnosticoPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [reassignFor, setReassignFor] = useState<{ subId: string; userId: string } | null>(null);
  const doSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true); setSearchResult(null);
    try {
      const r = await fetch(`/api/admin/diagnostico/by-email?email=${encodeURIComponent(searchEmail.trim())}&_=${Date.now()}`, { credentials: "include", cache: "no-store" });
      const d = await r.json();
      setSearchResult(d);
    } catch { toast.error("Error de conexión"); }
    setSearching(false);
  };
  const reassign = async (subId: string, toUserId: string) => {
    if (!confirm(`Mover esta suscripción a la cuenta ${toUserId}? Así aparecerá en su perfil.`)) return;
    try {
      const r = await fetch(`/api/admin/subscriptions/${subId}/reassign`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: toUserId })
      });
      const j = await r.json();
      if (r.ok) { toast.success(`✅ Movida a ${j.newOwner}`); doSearch(); }
      else toast.error(j.error || "Error");
    } catch { toast.error("Error de conexión"); }
  };
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/diagnostico/subscriptions?_=${Date.now()}`, { credentials: "include", cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [auto]);
  const fixOne = async (p: any) => {
    if (!confirm(`Reenviar y arreglar las suscripciones de ${p.userEmail || p.userId}?`)) return;
    setBusyId(p.id);
    try {
      const r = await fetch(`/api/admin/users/${p.userId}/resync-subscriptions`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 30 })
      });
      const j = await r.json();
      if (r.ok) { toast.success(`✅ ${j.refreshed} reenviadas a ${j.email}`); load(); }
      else toast.error(j.error || "Error");
    } catch { toast.error("Error de conexión"); }
    setBusyId(null);
  };
  return (
    <Card className="border-none bg-gradient-to-br from-rose-50 to-amber-50 rounded-[2rem] overflow-hidden shadow-sm">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2">🔍 Diagnóstico de Suscripciones</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Aquí ves <strong>en tiempo real</strong> cuáles suscripciones tienen problema y podrían no aparecer al cliente. Revisa con calma — sin presión.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={load} disabled={loading} className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔄 Actualizar"}
            </Button>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} className="rounded" />
              Auto cada 10s
            </label>
          </div>
        </div>
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total suscripciones</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{data.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Con problema</p>
              <p className="text-3xl font-black text-rose-600 mt-1">{data.problemCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sanas</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{data.total - data.problemCount}</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl p-5 border-2 border-indigo-200 shadow-sm space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">🔎 Buscar TODO por correo del cliente</p>
            <p className="text-xs text-slate-500 mt-1">Si un cliente dice que no ve sus suscripciones, busca su correo aquí. Verás si tiene cuentas duplicadas y podrás mover la suscripción a la cuenta correcta.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              placeholder="correo@cliente.com"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none font-bold text-sm"
            />
            <Button onClick={doSearch} disabled={searching} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔎 Buscar"}
            </Button>
          </div>
          {searchResult && (
            <div className="space-y-3 pt-2">
              <div className="text-sm">
                <p className="font-black text-slate-700">📊 Resumen para <span className="text-indigo-600">{searchResult.email}</span></p>
                <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <li>• Cuentas con ese correo: <strong>{searchResult.accounts?.length || 0}</strong> {searchResult.accounts?.length > 1 && <span className="text-rose-600 font-black">⚠️ DUPLICADAS</span>}</li>
                  <li>• Suscripciones de esas cuentas: <strong>{searchResult.subscriptionsOfThoseAccounts?.length || 0}</strong></li>
                  <li>• Compras (orders) con ese correo: <strong>{searchResult.ordersWithThisEmail?.length || 0}</strong></li>
                  <li>• Suscripciones generadas por esas compras: <strong>{searchResult.subscriptionsCreatedFromThoseOrders?.length || 0}</strong></li>
                </ul>
              </div>
              {searchResult.accounts?.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cuentas encontradas</p>
                  {searchResult.accounts.map((a: any) => (
                    <div key={a.id} className="text-xs bg-white rounded-lg p-2 border border-slate-200">
                      <p className="font-bold text-slate-700">{a.firstName} {a.lastName} — {a.role}</p>
                      <p className="text-slate-400 font-mono text-[10px]">ID: {a.id}</p>
                      <p className="text-slate-400">Creada: {a.createdAt ? new Date(a.createdAt).toLocaleDateString("es-GT") : "—"}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResult.subscriptionsCreatedFromThoseOrders?.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 space-y-2 border border-amber-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Suscripciones de sus compras (puedes mover a la cuenta correcta)</p>
                  {searchResult.subscriptionsCreatedFromThoseOrders.map((s: any) => {
                    const ownedByCorrectAccount = searchResult.accounts?.some((a: any) => a.id === s.userId);
                    return (
                      <div key={s.id} className="bg-white rounded-lg p-2 border border-amber-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs">
                          <p className="font-bold text-slate-700">{s.productName} — {s.status}</p>
                          <p className="text-slate-400 font-mono text-[10px]">Asignada a: {s.userId} {ownedByCorrectAccount ? "✅" : "❌ otra cuenta"}</p>
                        </div>
                        {!ownedByCorrectAccount && searchResult.accounts?.length > 0 && (
                          <select
                            className="text-xs rounded-lg border border-slate-300 px-2 py-1"
                            onChange={e => e.target.value && reassign(s.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="">Mover a…</option>
                            {searchResult.accounts.map((a: any) => (
                              <option key={a.id} value={a.id}>{a.firstName || a.email} ({a.id.slice(0, 8)})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {data?.problemCount === 0 && (
          <div className="text-center py-16 text-emerald-700 bg-white/70 rounded-2xl border-2 border-dashed border-emerald-200">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-black text-xl">Todo en orden</p>
            <p className="text-sm text-slate-500 mt-1">No hay suscripciones con problema. Los clientes ven todas las suyas.</p>
          </div>
        )}
        {data?.problems?.length > 0 && (
          <div className="space-y-2">
            {data.problems.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <p className="font-black text-slate-800">{p.productName}</p>
                  <p className="text-xs text-slate-500">{p.userName || "Usuario"} — {p.userEmail || p.userId}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.reasons.map((r: string, i: number) => (
                      <span key={i} className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                        {r}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Estado: <strong>{p.status}</strong> • Vence: {p.endDate ? new Date(p.endDate).toLocaleDateString("es-GT") : "—"}
                  </p>
                </div>
                <Button size="sm" onClick={() => fixOne(p)} disabled={busyId === p.id} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {busyId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "✉️ Reenviar y arreglar"}
                </Button>
              </div>
            ))}
          </div>
        )}
        {data?.generatedAt && (
          <p className="text-[10px] text-slate-400 text-right">Última lectura: {new Date(data.generatedAt).toLocaleTimeString("es-GT")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { products, categories, orders, settings, refreshData, isAuthenticated, logout, login } = useApp();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [heroStreamUrl, setHeroStreamUrl] = useState("");
  const [heroTvStreamUrl, setHeroTvStreamUrl] = useState("");
  const [fulfillOrder, setFulfillOrder] = useState<any>(null);
  const [fulfillForm, setFulfillForm] = useState({ credentialName: "", credentialEmail: "", credentialPassword: "", credentialInstructions: "", endDate: "" });
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [refundOrderDialog, setRefundOrderDialog] = useState<any>(null);
  const [refundOrderReason, setRefundOrderReason] = useState("");
  const [refundingOrder, setRefundingOrder] = useState(false);

  const [adminRechargeMethods, setAdminRechargeMethods] = useState<any[]>([]);
  const [adminRechargeRequests, setAdminRechargeRequests] = useState<any[]>([]);
  const [renewalRequests, setRenewalRequests] = useState<any[]>([]);
  const [renewalEndDates, setRenewalEndDates] = useState<Record<string, string>>({});
  const [renewalFilter, setRenewalFilter] = useState<"all"|"pending"|"approved"|"rejected">("all");
  const [renewalSearch, setRenewalSearch] = useState("");
  const [renewalLastUpdated, setRenewalLastUpdated] = useState<Date>(new Date());
  const [renewalTicking, setRenewalTicking] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [methodForm, setMethodForm] = useState({ name: "", type: "Binance", accountNumber: "", accountName: "", instructions: "", order: "0" });
  const [methodLogo, setMethodLogo] = useState<File | null>(null);
  const methodLogoRef = useRef<HTMLInputElement>(null);

  const loadRechargeMethods = async () => {
    try {
      const res = await fetch("/api/recharge-payment-methods");
      if (res.ok) setAdminRechargeMethods(await res.json());
    } catch {}
  };

  const loadRechargeRequests = async () => {
    try {
      const res = await fetch("/api/admin/recharge-requests");
      if (res.ok) setAdminRechargeRequests(await res.json());
    } catch {}
  };

  const loadRenewalRequests = async () => {
    try {
      const res = await fetch("/api/admin/renewal-requests", { credentials: "include" });
      if (res.ok) setRenewalRequests(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRechargeMethods();
      loadRechargeRequests();
      loadRenewalRequests();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setRenewalTicking(true);
      await loadRenewalRequests();
      setRenewalLastUpdated(new Date());
      setTimeout(() => setRenewalTicking(false), 600);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const saveRechargeMethod = async () => {
    const formData = new FormData();
    formData.append("name", methodForm.name);
    formData.append("type", methodForm.type);
    formData.append("accountNumber", methodForm.accountNumber);
    formData.append("accountName", methodForm.accountName);
    formData.append("instructions", methodForm.instructions);
    formData.append("order", methodForm.order);
    if (methodLogo) formData.append("logo", methodLogo);

    try {
      const url = editingMethod ? `/api/admin/recharge-payment-methods/${editingMethod.id}` : "/api/admin/recharge-payment-methods";
      const method = editingMethod ? "PUT" : "POST";
      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        toast.success(editingMethod ? "Metodo actualizado" : "Metodo creado");
        setShowAddMethod(false);
        setEditingMethod(null);
        setMethodForm({ name: "", type: "Binance", accountNumber: "", accountName: "", instructions: "", order: "0" });
        setMethodLogo(null);
        loadRechargeMethods();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    }
  };

  const deleteRechargeMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/recharge-payment-methods/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Metodo eliminado");
        loadRechargeMethods();
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const toggleMethodActive = async (method: any) => {
    const formData = new FormData();
    formData.append("name", method.name);
    formData.append("type", method.type);
    formData.append("accountNumber", method.accountNumber || "");
    formData.append("accountName", method.accountName || "");
    formData.append("instructions", method.instructions || "");
    formData.append("order", String(method.order || 0));
    formData.append("isActive", String(!method.isActive));
    try {
      const res = await fetch(`/api/admin/recharge-payment-methods/${method.id}`, { method: "PUT", body: formData });
      if (res.ok) {
        toast.success(method.isActive ? "Metodo desactivado" : "Metodo activado");
        loadRechargeMethods();
      }
    } catch {}
  };

  const handleRechargeAction = async (requestId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/recharge-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "approved" ? "Recarga aprobada - Saldo acreditado" : "Recarga rechazada");
        loadRechargeRequests();
      } else {
        toast.error("Error al procesar");
      }
    } catch {
      toast.error("Error al procesar");
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(loginForm.username, loginForm.password);
    setIsLoggingIn(false);
    if (success) {
      toast.success("Bienvenido al panel");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    logout();
    window.location.replace("/");
  };

  const queryClient = useQueryClient();
  const newsQuery = useQuery({ queryKey: ["/api/news"], queryFn: () => fetch("/api/news", { credentials: "include" }).then(r => r.ok ? r.json() : []) });
  const news = Array.isArray(newsQuery.data) ? newsQuery.data : [];

  const featuredSectionsQuery = useQuery({ queryKey: ["/api/featured-sections"], queryFn: () => fetch("/api/featured-sections", { credentials: "include" }).then(r => r.ok ? r.json() : []) });
  const featuredSectionsData = Array.isArray(featuredSectionsQuery.data) ? featuredSectionsQuery.data : [];

  // Use a ref to prevent unnecessary re-renders or hook mismatches
  const isDataLoaded = products && categories && Array.isArray(products) && Array.isArray(categories);

  useEffect(() => {
    if (isAuthenticated) {
      if (settings?.heroStreamUrl) setHeroStreamUrl(settings.heroStreamUrl);
      if (settings?.heroTvStreamUrl) setHeroTvStreamUrl(settings.heroTvStreamUrl);
    }
  }, [isAuthenticated, settings?.heroStreamUrl, settings?.heroTvStreamUrl]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshData?.();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshData, isAuthenticated]);

  const saveHeroStream = async () => {
    if (!heroStreamUrl) {
      toast.error("Por favor ingresa un enlace");
      return;
    }
    
    console.log("Intentando guardar:", heroStreamUrl);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "heroStreamUrl", value: heroStreamUrl }),
      });
      
      // Auto-save audio setting if it's not set - Default to true
      if (settings?.heroAudioEnabled === undefined || settings?.heroAudioEnabled === "false") {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "heroAudioEnabled", value: "true" }),
        });
      }
      
      toast.success("¡Video actualizado y guardado!");
      refreshData();
    } catch (e) {
      toast.error("Error al guardar la configuración");
    }
  };

  const saveHeroTvStream = async () => {
    if (!heroTvStreamUrl) {
      toast.error("Por favor ingresa un enlace");
      return;
    }
    
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "heroTvStreamUrl", value: heroTvStreamUrl }),
      });
      
      toast.success("¡TV Menú Principal actualizado!");
      refreshData();
    } catch (e) {
      toast.error("Error al guardar la configuración");
    }
  };

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  const mainUsersQuery = useQuery({ queryKey: ["/api/admin/users"], queryFn: () => fetch("/api/admin/users", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 5 * 60 * 1000 });
  const mainAllUsers: any[] = Array.isArray(mainUsersQuery.data) ? mainUsersQuery.data : [];
  const isUserSuspended = (userId: string) => mainAllUsers.find((u: any) => u.id === userId)?.suspended ?? false;
  const doSuspendAction = async (userId: string, displayName: string) => {
    const suspended = isUserSuspended(userId);
    const msg = suspended
      ? `¿Reactivar la cuenta de ${displayName}?`
      : `¿Suspender permanentemente la cuenta de ${displayName}? Esto cerrará su sesión y cancelará sus suscripciones.`;
    if (!confirm(msg)) return;
    const endpoint = suspended ? `/api/admin/users/${userId}/unsuspend` : `/api/admin/users/${userId}/suspend`;
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Cuenta suspendida por el administrador" }) });
    if (res.ok) { toast.success(suspended ? "Cuenta reactivada" : "Cuenta suspendida"); mainUsersQuery.refetch(); }
    else toast.error("Error al realizar la acción");
  };
  const SuspendBtn = ({ userId, displayName }: { userId: string; displayName: string }) => {
    const suspended = isUserSuspended(userId);
    return (
      <Button size="sm" className={`rounded-xl text-[10px] font-black uppercase h-8 px-3 border-0 ${suspended ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
        onClick={() => doSuspendAction(userId, displayName)}>
        {suspended ? <><CheckCircle2 className="w-3 h-3 mr-1" />Reactivar</> : <><Lock className="w-3 h-3 mr-1" />Suspender</>}
      </Button>
    );
  };
  const [isUploading, setIsUploading] = useState(false);
  const [multimedia, setMultimedia] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProductCredentials, setEditProductCredentials] = useState<any[]>([]);
  const [credStockLoading, setCredStockLoading] = useState(false);
  const [newCred, setNewCred] = useState({ email: "", password: "", instructions: "" });
  const [pendingCreateCredentials, setPendingCreateCredentials] = useState<{email:string;password:string;instructions:string}[]>([]);
  const [newCreateCred, setNewCreateCred] = useState({ email: "", password: "", instructions: "" });
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [movieName, setMovieName] = useState("");
  const [pendingMovieFile, setPendingMovieFile] = useState<File | null>(null);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [isEditNewsDialogOpen, setIsEditNewsDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [isEditMovieDialogOpen, setIsEditMovieDialogOpen] = useState(false);
  const [editMovieName, setEditMovieName] = useState("");
  const [adminBanners, setAdminBanners] = useState<any[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [expandedWithdrawal, setExpandedWithdrawal] = useState<string | null>(null);
  const [editingSellerProduct, setEditingSellerProduct] = useState<any>(null);
  const [isSellerEditDialogOpen, setIsSellerEditDialogOpen] = useState(false);
  const [contactSellerProduct, setContactSellerProduct] = useState<any>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactChatMessages, setContactChatMessages] = useState<any[]>([]);
  const contactChatEndRef = React.useRef<HTMLDivElement>(null);
  const contactChatContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollContactChatToBottom = () => {
    if (contactChatContainerRef.current) {
      contactChatContainerRef.current.scrollTop = contactChatContainerRef.current.scrollHeight;
    }
  };
  const contactPollRef = React.useRef<ReturnType<typeof setInterval>>();

  const AGENTS = [
    { name: "Sofía García", role: "Asesora de Cuentas", avatar: "https://i.pravatar.cc/80?img=5", gender: "f" },
    { name: "Valentina Reyes", role: "Coordinadora Comercial", avatar: "https://i.pravatar.cc/80?img=44", gender: "f" },
    { name: "Camila Ortiz", role: "Gestora de Vendedores", avatar: "https://i.pravatar.cc/80?img=49", gender: "f" },
    { name: "Sebastián López", role: "Asesor Senior", avatar: "https://i.pravatar.cc/80?img=33", gender: "m" },
    { name: "Mateo Hernández", role: "Ejecutivo de Cuenta", avatar: "https://i.pravatar.cc/80?img=15", gender: "m" },
    { name: "Andrés Morales", role: "Soporte Comercial", avatar: "https://i.pravatar.cc/80?img=57", gender: "m" },
  ];
  const [selectedAgentIdx, setSelectedAgentIdx] = React.useState<number>(0);
  const [showAgentPicker, setShowAgentPicker] = React.useState(false);
  const contactImageInputRef = React.useRef<HTMLInputElement>(null);
  const [contactImageUploading, setContactImageUploading] = React.useState(false);

  // Agentes dinámicos de soporte (desde la BD)
  const [supDbAgents, setSupDbAgents] = React.useState<any[]>([]);
  const [selectedSupAgent, setSelectedSupAgent] = React.useState<any | null>(null);
  const [showSupNewAgent, setShowSupNewAgent] = React.useState(false);
  const [supNewAgentName, setSupNewAgentName] = React.useState("");
  const [supNewAgentFile, setSupNewAgentFile] = React.useState<File | null>(null);
  const [savingSupAgent, setSavingSupAgent] = React.useState(false);
  const supAgentFileRef = React.useRef<HTMLInputElement>(null);

  const loadSupAgents = async () => {
    try {
      const res = await fetch("/api/admin/support-agents");
      if (res.ok) setSupDbAgents(await res.json());
    } catch {}
  };

  const saveSupNewAgent = async () => {
    if (!supNewAgentName.trim()) return;
    setSavingSupAgent(true);
    try {
      const fd = new FormData();
      fd.append("name", supNewAgentName.trim());
      if (supNewAgentFile) fd.append("image", supNewAgentFile);
      const res = await fetch("/api/admin/support-agents", { method: "POST", body: fd });
      if (res.ok) {
        setSupNewAgentName("");
        setSupNewAgentFile(null);
        setShowSupNewAgent(false);
        await loadSupAgents();
        toast.success("Agente creado");
      }
    } catch {}
    setSavingSupAgent(false);
  };

  const deleteSupAgent = async (id: string) => {
    await fetch(`/api/admin/support-agents/${id}`, { method: "DELETE" });
    if (selectedSupAgent?.id === id) setSelectedSupAgent(null);
    await loadSupAgents();
  };

  const selectAgent = (idx: number) => {
    setSelectedAgentIdx(idx);
    setShowAgentPicker(false);
  };

  React.useEffect(() => {
    if (showAgentPicker) loadSupAgents();
  }, [showAgentPicker]);

  const fetchSellerChatMessages = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/seller-products/${productId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setContactChatMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch {}
  };

  const openSellerChat = async (product: any) => {
    setContactSellerProduct(product);
    setContactMessage("");
    setContactChatMessages([]);
    await fetchSellerChatMessages(product.id);
    setTimeout(() => scrollContactChatToBottom(), 100);
  };

  React.useEffect(() => {
    if (contactSellerProduct) {
      contactPollRef.current = setInterval(() => fetchSellerChatMessages(contactSellerProduct.id), 5000);
    } else {
      clearInterval(contactPollRef.current);
    }
    return () => clearInterval(contactPollRef.current);
  }, [contactSellerProduct?.id]);

  const sendSellerChatMessage = async (imageUrl?: string) => {
    if (!contactMessage.trim() && !imageUrl) return;
    if (!contactSellerProduct) return;
    setContactSending(true);
    const agent = AGENTS[selectedAgentIdx];
    try {
      const res = await fetch(`/api/admin/seller-products/${contactSellerProduct.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: imageUrl ? "" : contactMessage,
          imageUrl: imageUrl || "",
          agentIndex: selectedAgentIdx,
          agentName: agent.name,
        }),
      });
      if (res.ok) {
        setContactMessage("");
        await fetchSellerChatMessages(contactSellerProduct.id);
        setTimeout(() => scrollContactChatToBottom(), 100);
      } else { toast.error("Error al enviar mensaje"); }
    } catch { toast.error("Error al enviar mensaje"); } finally { setContactSending(false); }
  };

  const handleContactImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contactSellerProduct) return;
    setContactImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        await sendSellerChatMessage(data.url);
      }
    } catch { toast.error("Error al subir imagen"); } finally {
      setContactImageUploading(false);
      if (contactImageInputRef.current) contactImageInputRef.current.value = "";
    }
  };
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [activeSupTicket, setActiveSupTicket] = useState<any>(null);
  const [supMessages, setSupMessages] = useState<any[]>([]);
  const [supReply, setSupReply] = useState("");
  const [supSending, setSupSending] = useState(false);
  const supMsgEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/multimedia")
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        setMultimedia(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Multimedia fetch error:", err);
        setMultimedia([]);
      });
    fetch("/api/banners")
      .then(res => res.json())
      .then(data => setAdminBanners(Array.isArray(data) ? data : []))
      .catch(() => setAdminBanners([]));
    fetchSupportTickets();
    loadSupAgents();
    if (activeTab === "seller_products") {
      fetch("/api/admin/seller-products")
        .then(res => res.json())
        .then(data => setSellerProducts(Array.isArray(data) ? data : []))
        .catch(() => setSellerProducts([]));
    }
    if (activeTab === "withdrawals") {
      fetch("/api/admin/withdrawals")
        .then(res => res.json())
        .then(data => setAllWithdrawals(Array.isArray(data) ? data : []))
        .catch(() => setAllWithdrawals([]));
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (!activeSupTicket || activeTab !== "support") return;
    const interval = setInterval(() => {
      fetchSupMessages(activeSupTicket.id);
      fetchSupportTickets();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSupTicket, activeTab]);

  const fetchBanners = () => {
    fetch("/api/banners")
      .then(res => res.json())
      .then(data => setAdminBanners(Array.isArray(data) ? data : []))
      .catch(() => setAdminBanners([]));
  };

  const fetchSupportTickets = () => {
    fetch("/api/admin/support/tickets")
      .then(res => res.json())
      .then(data => setSupportTickets(Array.isArray(data) ? data : []))
      .catch(() => setSupportTickets([]));
  };

  const fetchSupMessages = (ticketId: string, forceScroll = false) => {
    fetch(`/api/admin/support/tickets/${ticketId}/messages`)
      .then(res => res.json())
      .then(data => {
        setSupMessages(Array.isArray(data) ? data : []);
        setTimeout(() => {
          const container = supMsgEndRef.current?.parentElement;
          if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
            if (forceScroll || isNearBottom) container.scrollTop = container.scrollHeight;
          }
        }, 100);
      })
      .catch(() => setSupMessages([]));
  };

  const handleSupReply = async () => {
    if (!supReply.trim()) { toast.error("Escribe un mensaje primero"); return; }
    if (!activeSupTicket) { toast.error("Ningún ticket activo"); return; }
    const agentName = selectedSupAgent ? selectedSupAgent.name : AGENTS[selectedAgentIdx].name;
    const agentImage = selectedSupAgent ? (selectedSupAgent.image || "") : "";
    const msgText = supReply;
    setSupReply("");
    const optimistic = {
      id: `opt-${Date.now()}`,
      ticketId: activeSupTicket.id,
      isAdmin: true,
      isSeller: false,
      message: msgText,
      imageUrl: "",
      senderName: agentName,
      agentImage,
      agentIndex: selectedAgentIdx,
      createdAt: new Date().toISOString(),
    };
    setSupMessages((prev: any[]) => [...prev, optimistic]);
    setTimeout(() => {
      const container = supMsgEndRef.current?.parentElement;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
        if (isNearBottom) container.scrollTop = container.scrollHeight;
      }
    }, 30);
    setSupSending(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${activeSupTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText, agentIndex: selectedAgentIdx, agentName, agentImage }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al enviar");
        return;
      }
      fetchSupMessages(activeSupTicket.id, false);
      fetchSupportTickets();
    } catch (e) {
      toast.error("Error de red al enviar");
    } finally {
      setSupSending(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      await fetch(`/api/admin/support/tickets/${id}/close`, { method: "PATCH" });
      fetchSupportTickets();
      if (activeSupTicket?.id === id) setActiveSupTicket((prev: any) => prev ? { ...prev, status: "closed" } : null);
      toast.success("Caso cerrado");
    } catch {
      toast.error("Error al cerrar");
    }
  };

  const handleReopenTicket = async (id: string) => {
    try {
      await fetch(`/api/admin/support/tickets/${id}/reopen`, { method: "PATCH" });
      fetchSupportTickets();
      if (activeSupTicket?.id === id) setActiveSupTicket((prev: any) => prev ? { ...prev, status: "open" } : null);
      toast.success("Caso reabierto");
    } catch {
      toast.error("Error al reabrir");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("order", String(adminBanners.length));
    try {
      const res = await fetch("/api/banners", { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Banner subido");
        fetchBanners();
      } else {
        toast.error("Error al subir banner");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setBannerUploading(false);
    e.target.value = "";
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Banner eliminado");
        fetchBanners();
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleToggleBanner = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchBanners();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const productForm = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      price: 0,
      image: "",
      category: "",
      description: "",
      inStock: true,
      isActive: true,
      isMonthly: true,
      whatsappNumber: "",
      showCheckmarks: true,
      showWhatsapp: true,
      showBinance: false,
      showBanrural: false,
      showBac: false,
      showBi: false,
      binanceData: "",
      banruralData: "",
      bacData: "",
      biData: "",
      isPopular: false,
      streamUrl: "",
      productEmail: "",
      productPassword: "",
      productInstructions: "",
      discountPercent: 0,
      originalPrice: null as number | null,
      requiresCustomerEmail: false,
      customerEmailLabel: "",
      enableBotReviews: true,
    }
  });

  const editForm = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      price: 0,
      image: "",
      category: "",
      description: "",
      inStock: true,
      isActive: true,
      isMonthly: true,
      whatsappNumber: "",
      showCheckmarks: true,
      showWhatsapp: true,
      showBinance: false,
      showBanrural: false,
      showBac: false,
      showBi: false,
      binanceData: "",
      banruralData: "",
      bacData: "",
      biData: "",
      isPopular: false,
      streamUrl: "",
      productEmail: "",
      productPassword: "",
      productInstructions: "",
      discountPercent: 0,
      originalPrice: null as number | null,
      requiresCustomerEmail: false,
      customerEmailLabel: "",
      enableBotReviews: true,
    }
  });

  const categoryForm = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      image: "",
      streamUrl: ""
    }
  });

  const [featuredNames, setFeaturedNames] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const names: Record<string, string> = {};
      const local: Record<string, string> = {};
      [1, 2, 3, 4].forEach(num => {
        names[`featuredName${num}`] = String(settings[`featuredName${num}`] || "");
        local[`featuredName${num}`] = String(settings[`featuredName${num}`] || "");
        local[`featuredImage${num}`] = String(settings[`featuredImage${num}`] || "");
      });
      setFeaturedNames(names);
      setLocalSettings(local);
    }
  }, [settings]);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string = "image") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    
    if (target === "hero" || target === "hero-video") {
      formData.append("isHero", "true");
    } else {
      formData.append("isHero", "false");
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/multimedia/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

      const data: any = await uploadPromise;
      
      if (target === "image") {
        productForm.setValue("image", data.url);
      } else if (target === "editImage") {
        editForm.setValue("image", data.url);
      }
      
      if (target === "hero" || target === "hero-video") {
        const syncTime = Date.now().toString();
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "videoSyncTime", value: syncTime }),
        });
        
        const socket = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);
        socket.onopen = () => {
          socket.send(JSON.stringify({ type: 'video-control', action: 'seek', time: 0 }));
          socket.send(JSON.stringify({ type: 'video-control', action: 'play' }));
          setTimeout(() => socket.close(), 1000);
        };
        
        if (refreshData) refreshData();
      }

      const updated = await fetch("/api/multimedia").then(r => r.json());
      setMultimedia(updated);
      toast.success("Archivo subido correctamente");
      if (refreshData) refreshData();
    } catch (e) {
      console.error(e);
      toast.error("Error al subir el archivo");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onUploadMovieWithName = async () => {
    if (!pendingMovieFile || !movieName.trim()) {
      toast.error("Por favor ingresa un nombre para la película");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", pendingMovieFile);
    formData.append("isHero", "false");
    formData.append("customName", movieName.trim());

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/multimedia/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

      await uploadPromise;
      const updated = await fetch("/api/multimedia").then(r => r.json());
      setMultimedia(updated);
      toast.success("Película subida correctamente");
      setIsMovieDialogOpen(false);
      setMovieName("");
      setPendingMovieFile(null);
    } catch (e) {
      console.error(e);
      toast.error("Error al subir la película");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const [quickCatOpen, setQuickCatOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState("");
  const [quickCatImage, setQuickCatImage] = useState("");
  const [quickCatForm, setQuickCatForm] = useState<any>(null);
  const [quickCatUploading, setQuickCatUploading] = useState(false);

  const openQuickCatDialog = (form: any) => {
    setQuickCatName("");
    setQuickCatImage("");
    setQuickCatForm(form);
    setQuickCatOpen(true);
  };

  const onQuickAddCategory = async () => {
    if (!quickCatName) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: quickCatName, label: quickCatName, image: quickCatImage || null })
      });
      if (res.ok) {
        toast.success(`Categoría "${quickCatName}" creada`);
        await refreshData();
        if (quickCatForm) quickCatForm.setValue("category", quickCatName, { shouldValidate: true });
        setQuickCatOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProductCredentials = async (productId: string) => {
    setCredStockLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/credentials`);
      if (res.ok) setEditProductCredentials(await res.json());
    } catch {}
    setCredStockLoading(false);
  };

  const onAddCredential = async (productId: string) => {
    if (!newCred.email || !newCred.password) { toast.error("Correo y contraseña son obligatorios"); return; }
    try {
      const res = await fetch(`/api/admin/products/${productId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credEmail: newCred.email, credPassword: newCred.password, credInstructions: newCred.instructions })
      });
      if (res.ok) {
        setNewCred({ email: "", password: "", instructions: "" });
        await loadProductCredentials(productId);
        toast.success("Credencial agregada al stock");
      }
    } catch { toast.error("Error al agregar credencial"); }
  };

  const onDeleteCredential = async (credId: string, productId: string) => {
    if (!confirm("¿Eliminar esta credencial del stock?")) return;
    try {
      const res = await fetch(`/api/admin/products/credentials/${credId}`, { method: "DELETE" });
      if (res.ok) { await loadProductCredentials(productId); toast.success("Credencial eliminada"); }
    } catch { toast.error("Error al eliminar"); }
  };

  const onAddProduct = async (data: any) => {
    try {
      const payload = {
        ...data,
        price: Number(data.price) || 0,
        priceUsd: data.priceUsd ? Number(data.priceUsd) : null,
        inStock: !!data.inStock,
        isActive: !!data.isActive,
        isMonthly: !!data.isMonthly,
        showCheckmarks: !!data.showCheckmarks,
        showWhatsapp: data.showWhatsapp !== false,
        showBinance: !!data.showBinance,
        showBanrural: !!data.showBanrural,
        showBac: !!data.showBac,
        showBi: !!data.showBi,
        isPopular: !!data.isPopular
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        // Save all pending credentials to the pool
        if (created?.id && pendingCreateCredentials.length > 0) {
          await Promise.all(pendingCreateCredentials.map(c =>
            fetch(`/api/admin/products/${created.id}/credentials`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credEmail: c.email, credPassword: c.password, credInstructions: c.instructions })
            })
          ));
        }
        productForm.reset();
        setPendingCreateCredentials([]);
        setNewCreateCred({ email: "", password: "", instructions: "" });
        setIsProductDialogOpen(false);
        toast.success("Producto añadido correctamente");
        refreshData();
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.details?.[0]?.message || errData?.error || "Error al crear el producto";
        toast.error(msg);
        console.error("[AddProduct] Server error:", errData);
      }
    } catch (e) {
      console.error("[AddProduct] Exception:", e);
      toast.error("Error de conexión al crear el producto");
    }
  };

  const onDeleteProduct = async (id: number) => {
    if (!confirm("¿Estás seguro?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const onEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditProductCredentials([]);
    setNewCred({ email: "", password: "", instructions: "" });
    if (product.id) loadProductCredentials(product.id);
    editForm.reset({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description || "",
      inStock: product.inStock,
      isActive: product.isActive,
      isMonthly: product.isMonthly,
      whatsappNumber: product.whatsappNumber || "",
      showCheckmarks: product.showCheckmarks,
      showWhatsapp: product.showWhatsapp !== false,
      showBinance: product.showBinance,
      showBanrural: product.showBanrural,
      showBac: !!product.showBac,
      showBi: !!product.showBi,
      binanceData: product.binanceData || "",
      binanceName: product.binanceName || "",
      binanceInstructions: product.binanceInstructions || "",
      banruralData: product.banruralData || "",
      banruralName: product.banruralName || "",
      banruralInstructions: product.banruralInstructions || "",
      bacData: product.bacData || "",
      bacName: product.bacName || "",
      bacInstructions: product.bacInstructions || "",
      biData: product.biData || "",
      biName: product.biName || "",
      biInstructions: product.biInstructions || "",
      paymentMethodIds: product.paymentMethodIds || "[]",
      isPopular: product.isPopular,
      streamUrl: product.streamUrl || "",
      productEmail: product.productEmail || "",
      productPassword: product.productPassword || "",
      productInstructions: product.productInstructions || "",
      discountPercent: product.discountPercent ?? 0,
      originalPrice: product.originalPrice ?? null,
      requiresCustomerEmail: product.requiresCustomerEmail ?? false,
      customerEmailLabel: product.customerEmailLabel || "",
      enableBotReviews: product.enableBotReviews !== false,
    });
    setIsEditDialogOpen(true);
  };

  const onUpdateProduct = async (data: any) => {
    try {
      // Ensure booleans are correctly sent
      const payload = {
        ...data,
        inStock: !!data.inStock,
        isActive: !!data.isActive,
        isMonthly: !!data.isMonthly,
        showCheckmarks: !!data.showCheckmarks,
        showWhatsapp: data.showWhatsapp !== false,
        showBinance: !!data.showBinance,
        showBanrural: !!data.showBanrural,
        showBac: !!data.showBac,
        showBi: !!data.showBi,
        isPopular: !!data.isPopular
      };
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsEditDialogOpen(false);
        toast.success("Producto actualizado correctamente");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onAddCategory = async (data: any) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: data.name, 
          label: data.name,
          image: data.image || null,
          streamUrl: data.streamUrl || null
        })
      });
      if (res.ok) {
        categoryForm.reset({ name: "", image: "", streamUrl: "" });
        toast.success("Categoría añadida correctamente");
        await refreshData();
      } else {
        const errData = await res.json();
        console.error("Error response:", errData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onDeleteCategory = async (id: number) => {
    if (!confirm("¿Estás seguro?")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const onUpdateOrderStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const onQuickDeliver = async (order: any) => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/quick-deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Credenciales enviadas al cliente desde el stock.");
        refreshData();
      } else {
        toast.error(data.error || "Error al entregar");
      }
    } catch (e) {
      toast.error("Error al entregar");
    }
  };

  const onFulfillOrder = async () => {
    if (!fulfillOrder) return;
    setIsFulfilling(true);
    try {
      const res = await fetch("/api/admin/fulfill-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: fulfillOrder.id,
          ...fulfillForm,
        }),
      });
      if (res.ok) {
        toast.success("Pedido atendido! Las credenciales fueron enviadas al usuario.");
        setFulfillOrder(null);
        setFulfillForm({ credentialName: "", credentialEmail: "", credentialPassword: "", credentialInstructions: "", endDate: "" });
        refreshData();
      } else {
        toast.error("Error al atender el pedido");
      }
    } catch (e) {
      toast.error("Error al atender el pedido");
    } finally {
      setIsFulfilling(false);
    }
  };

  const onDeleteMultimedia = async (id: number) => {
    try {
      await fetch(`/api/multimedia/${id}`, { method: "DELETE" });
      setMultimedia(multimedia.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const onSaveSettings = async (key: string, value: string) => {
    try {
      console.log("Forcing save:", key, value);
      
      // Update local state immediately for visual feedback
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      if (key.startsWith('featuredName')) {
        setFeaturedNames(prev => ({ ...prev, [key]: value }));
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar");
      }
      
      // Refetch data to ensure global state is correct
      if (refreshData) {
        await refreshData();
      }
      if (queryClient) {
        await queryClient.invalidateQueries({ queryKey: ["settings"] });
      }
      
      if (key === "heroAudioEnabled") {
        toast.success(value === "true" ? "¡SONIDO ACTIVADO!" : "Sonido Silenciado");
      } else {
        toast.success("¡Guardado correctamente!");
      }
    } catch (e: any) {
      console.error("Error saving setting:", e);
      toast.error(`Error: ${e.message}`);
      // Revert local state on error if needed
      if (refreshData) await refreshData();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Panel de Control</CardTitle>
            <p className="text-muted-foreground text-sm">Ingresa tus credenciales para acceder</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-bold text-xs uppercase tracking-widest">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-xs uppercase tracking-widest">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 rounded-xl font-black uppercase bg-primary hover:bg-primary/90"
              >
                {isLoggingIn ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Settings className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Panel de Control</h1>
            <p className="text-muted-foreground font-medium">Administra tu tienda, productos y multimedia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open('/', '_blank')}
            className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5"
          >
            <Layout className="w-4 h-4 mr-2" /> Ver Sitio Web
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="rounded-xl font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </Button>
        </div>
      </div>

      {/* Hero Video Management */}
      <Card className="mb-8 border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col gap-6">
            {/* Nueva Sección: TV Menú Principal */}
            <div>
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">TV MENÚ PRINCIPAL</h2>
              <p className="text-slate-500 font-bold italic">Configura aquí el canal que aparecerá justo debajo del video de bienvenida.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm h-fit">
                <h2 className="text-2xl font-black uppercase mb-6">Añadir Canal</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">URL de Transmisión (m3u8)</Label>
                    <Input 
                      placeholder="https://ejemplo.com/canal.m3u8"
                      value={heroTvStreamUrl}
                      onChange={(e) => setHeroTvStreamUrl(e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      saveHeroTvStream();
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase h-12 shadow-lg shadow-primary/20"
                  >
                    Añadir Canal a Menú
                  </Button>
                </div>
              </Card>

              <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
                <h2 className="text-2xl font-black uppercase mb-6">Canal Guardado</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-black uppercase tracking-widest text-[10px]">URL</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings?.heroTvStreamUrl ? (
                      <TableRow>
                        <TableCell className="font-bold max-w-[200px] truncate" title={settings.heroTvStreamUrl}>
                          {settings.heroTvStreamUrl.length > 40 
                            ? settings.heroTvStreamUrl.substring(0, 40) + '...' 
                            : settings.heroTvStreamUrl}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              try {
                                await fetch("/api/settings", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ key: "heroTvStreamUrl", value: "" }),
                                });
                                setHeroTvStreamUrl("");
                                toast.success("Canal eliminado");
                                refreshData();
                              } catch (e) {
                                toast.error("Error al eliminar");
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No hay canal guardado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList onMouseDown={(e) => e.preventDefault()} className="bg-muted p-1 rounded-2xl flex flex-wrap justify-start h-auto gap-1 shadow-sm">
          <TabsTrigger value="products" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Package className="w-4 h-4 mr-2" /> Productos
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Layout className="w-4 h-4 mr-2" /> Categorías de Productos
          </TabsTrigger>
          <TabsTrigger value="tv" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Video className="w-4 h-4 mr-2" /> TV en Vivo
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <ShoppingBag className="w-4 h-4 mr-2" /> Pedidos
          </TabsTrigger>
          <TabsTrigger value="featured" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <ImageIcon className="w-4 h-4 mr-2" /> Destacados
          </TabsTrigger>
          <TabsTrigger value="movies" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Video className="w-4 h-4 mr-2" /> Películas
          </TabsTrigger>
          <TabsTrigger value="juegos" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Gamepad2 className="w-4 h-4 mr-2" /> Juegos
          </TabsTrigger>
          <TabsTrigger value="pavos" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Zap className="w-4 h-4 mr-2" /> Pavos
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Settings className="w-4 h-4 mr-2" /> Ajustes
          </TabsTrigger>
          <TabsTrigger value="news" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Plus className="w-4 h-4 mr-2" /> Noticias
          </TabsTrigger>
          <TabsTrigger value="featured_sections" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <ImageIcon className="w-4 h-4 mr-2" /> Secciones Destacadas
          </TabsTrigger>
          <TabsTrigger value="banners" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <ImageIcon className="w-4 h-4 mr-2" /> Ofertas / Banners
          </TabsTrigger>
          <TabsTrigger value="support" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <MessageSquare className="w-4 h-4 mr-2" /> Soporte
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Users className="w-4 h-4 mr-2" /> Usuarios
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <AlertCircle className="w-4 h-4 mr-2" /> Reportes
          </TabsTrigger>
          <TabsTrigger value="seller_products" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Store className="w-4 h-4 mr-2" /> Revendedores
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <CreditCard className="w-4 h-4 mr-2" /> Retiros
          </TabsTrigger>
          <TabsTrigger value="recharge_methods" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Wallet className="w-4 h-4 mr-2" /> Metodos Recarga
          </TabsTrigger>
          <TabsTrigger value="recharge_requests" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <ClipboardList className="w-4 h-4 mr-2" /> Solicitudes Recarga
          </TabsTrigger>
          <TabsTrigger value="renewals" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <RefreshCw className="w-4 h-4 mr-2" /> Renovaciones
          </TabsTrigger>
          <TabsTrigger value="discount_codes" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Zap className="w-4 h-4 mr-2" /> Códigos Descuento
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Users className="w-4 h-4 mr-2" /> Suscripciones
          </TabsTrigger>
          <TabsTrigger value="mis_clientes" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <MessageSquare className="w-4 h-4 mr-2" /> Mis Clientes
          </TabsTrigger>
          <TabsTrigger value="referidos" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Gift className="w-4 h-4 mr-2" /> Referidos
          </TabsTrigger>
          <TabsTrigger value="regalos" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Gift className="w-4 h-4 mr-2" /> Regalos
          </TabsTrigger>
          <TabsTrigger value="novedades" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Mail className="w-4 h-4 mr-2" /> Novedades
          </TabsTrigger>
          <TabsTrigger value="respaldo" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Database className="w-4 h-4 mr-2" /> Respaldo
          </TabsTrigger>
          <TabsTrigger value="diagnostico" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-md transition-all">
            🔍 Diagnóstico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novedades" className="space-y-6">
          <NovedadesPanel />
        </TabsContent>

        <TabsContent value="diagnostico" className="space-y-6">
          <DiagnosticoPanel />
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">GESTIÓN DE NOTICIAS</h2>
                    <p className="text-slate-500 font-bold italic">Publica novedades, imágenes y videos para tus clientes.</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase px-6 h-12 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> NUEVA NOTICIA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white border-none rounded-[2rem] p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Publicar Noticia</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = {
                          title: formData.get("title"),
                          content: formData.get("content"),
                          image: formData.get("image_url"),
                          video: formData.get("video_url"),
                        };
                        try {
                          const res = await fetch("/api/news", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(data)
                          });
                          if (res.ok) {
                            toast.success("Noticia publicada");
                            window.location.reload();
                          }
                        } catch (e) {
                          toast.error("Error al publicar");
                        }
                      }} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Título</Label>
                          <Input name="title" required className="rounded-xl h-12 border-2 border-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Contenido</Label>
                          <textarea 
                            name="content" 
                            required 
                            className="w-full min-h-[150px] rounded-xl border-2 border-slate-100 p-4 font-body"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-black uppercase text-xs">Imagen o Video (Archivo - Soporta GIF)</Label>
                            <Input 
                              type="file" 
                              accept="image/*,video/*,.gif"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploading(true);
                                setUploadProgress(0);
                                const formData = new FormData();
                                formData.append("file", file);
                                
                                try {
                                  const xhr = new XMLHttpRequest();
                                  xhr.open("POST", "/api/multimedia/upload", true);
                                  xhr.upload.onprogress = (ev) => {
                                    if (ev.lengthComputable) {
                                      setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                                    }
                                  };
                                  
                                  const uploadPromise = new Promise((resolve, reject) => {
                                    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.statusText));
                                    xhr.onerror = () => reject(new Error("Network Error"));
                                    xhr.send(formData);
                                  });
                                  
                                  const data: any = await uploadPromise;
                                  const isVideo = file.type.startsWith("video");
                                  if (isVideo) {
                                    (document.getElementsByName("video_url")[0] as HTMLInputElement).value = data.url;
                                  } else {
                                    (document.getElementsByName("image_url")[0] as HTMLInputElement).value = data.url;
                                  }
                                  toast.success("Archivo listo para publicar");
                                } catch (err) {
                                  toast.error("Error al subir archivo");
                                } finally {
                                  setIsUploading(false);
                                  setUploadProgress(0);
                                }
                              }}
                              className="rounded-xl border-2 border-slate-100"
                            />
                            {isUploading && (
                              <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            )}
                            <Input type="hidden" name="image_url" />
                            <Input type="hidden" name="video_url" />
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-primary h-12 rounded-xl font-black uppercase">PUBLICAR</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* News list with delete button */}
                  {Array.isArray(multimedia) && multimedia.filter((m:any) => false).length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 font-bold uppercase tracking-widest italic">
                      Cargando noticias...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(news) && news.map((item: any) => (
              <Card key={item.id} className="overflow-hidden bg-white border-slate-100 rounded-2xl group relative shadow-sm">
                <div className="aspect-video relative bg-slate-100">
                  {item.video ? (
                    <video src={item.video} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.image || "/placeholder.jpg"} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-lg h-8 w-8 bg-white shadow-md"
                      onClick={() => {
                        setEditingNews(item);
                        setIsEditNewsDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="rounded-lg h-8 w-8"
                      onClick={async () => {
                        if (confirm("¿Eliminar noticia?")) {
                          await fetch(`/api/news/${item.id}`, { method: "DELETE" });
                          window.location.reload();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-black text-sm uppercase truncate">{item.title}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                    {new Date(item.date).toLocaleDateString("es-GT", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dialog para editar noticias */}
          <Dialog open={isEditNewsDialogOpen} onOpenChange={setIsEditNewsDialogOpen}>
            <DialogContent className="max-w-2xl bg-white border-none rounded-[2rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Editar Noticia</DialogTitle>
              </DialogHeader>
              {editingNews && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    title: formData.get("edit_title"),
                    content: formData.get("edit_content"),
                    image: formData.get("edit_image_url") || editingNews.image,
                    video: formData.get("edit_video_url") || editingNews.video,
                  };
                  try {
                    const res = await fetch(`/api/news/${editingNews.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(data)
                    });
                    if (res.ok) {
                      toast.success("Noticia actualizada");
                      setIsEditNewsDialogOpen(false);
                      setEditingNews(null);
                      window.location.reload();
                    }
                  } catch (e) {
                    toast.error("Error al actualizar");
                  }
                }} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Titulo</Label>
                    <Input name="edit_title" defaultValue={editingNews.title} required className="rounded-xl h-12 border-2 border-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Contenido</Label>
                    <textarea 
                      name="edit_content" 
                      defaultValue={editingNews.content}
                      required 
                      className="w-full min-h-[150px] rounded-xl border-2 border-slate-100 p-4 font-body"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Cambiar Imagen/Video (opcional)</Label>
                      <Input 
                        type="file" 
                        accept="image/*,video/*,.gif"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          setUploadProgress(0);
                          const formData = new FormData();
                          formData.append("file", file);
                          
                          try {
                            const xhr = new XMLHttpRequest();
                            xhr.open("POST", "/api/multimedia/upload", true);
                            xhr.upload.onprogress = (ev) => {
                              if (ev.lengthComputable) {
                                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                              }
                            };
                            
                            const uploadPromise = new Promise((resolve, reject) => {
                              xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.statusText));
                              xhr.onerror = () => reject(new Error("Network Error"));
                              xhr.send(formData);
                            });
                            
                            const data: any = await uploadPromise;
                            const isVideo = file.type.startsWith("video");
                            if (isVideo) {
                              (document.getElementsByName("edit_video_url")[0] as HTMLInputElement).value = data.url;
                            } else {
                              (document.getElementsByName("edit_image_url")[0] as HTMLInputElement).value = data.url;
                            }
                            toast.success("Archivo listo para guardar");
                          } catch (err) {
                            toast.error("Error al subir archivo");
                          } finally {
                            setIsUploading(false);
                            setUploadProgress(0);
                          }
                        }}
                        className="rounded-xl border-2 border-slate-100"
                      />
                      {isUploading && (
                        <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                      <Input type="hidden" name="edit_image_url" />
                      <Input type="hidden" name="edit_video_url" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Media Actual</Label>
                      <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                        {editingNews.video ? (
                          <video src={editingNews.video} className="w-full h-full object-cover" controls />
                        ) : editingNews.image ? (
                          <img src={editingNews.image} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin media</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-black uppercase" onClick={() => setIsEditNewsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="flex-1 bg-primary h-12 rounded-xl font-black uppercase">GUARDAR CAMBIOS</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {multimedia.filter(m => m.type === 'video').map((item: any) => (
                            <Card key={item.id} className="overflow-hidden bg-card border-border/50 rounded-2xl group">
                              <div className="aspect-video relative bg-black">
                                <video src={item.url} className="w-full h-full object-contain" />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    size="icon"
                                    variant={item.isHero ? "default" : "secondary"}
                                    className="rounded-lg h-8 w-8"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/multimedia/toggle-hero/${item.id}`, {
                                          method: "POST"
                                        });
                                        if (res.ok) {
                                          toast.success(item.isHero ? "Video quitado de Hero" : "Video establecido como Hero y Sincronizado");
                                          const updated = await fetch("/api/multimedia").then(r => r.json());
                                          setMultimedia(updated);
                                          refreshData();
                                        }
                                      } catch (e) {
                                        toast.error("Error al actualizar estado Hero");
                                      }
                                    }}
                                  >
                                    <Zap className={`w-4 h-4 ${item.isHero ? 'fill-current' : ''}`} />
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="rounded-lg h-8 w-8"
                                    onClick={() => onDeleteMultimedia(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                {item.isHero && (
                                  <div className="absolute bottom-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg">
                                    EN VIVO (HERO)
                                  </div>
                                )}
                              </div>
                              <CardContent className="p-4">
                                <p className="font-bold text-sm truncate">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{item.type}</p>
                              </CardContent>
                            </Card>
                          ))}
          </div>
        </TabsContent>

        <TabsContent value="movies" className="space-y-6">
          <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
            <div>
              <h2 className="text-2xl font-black uppercase">Zona de Películas</h2>
              <p className="text-sm text-muted-foreground">Sube tus películas y videos aquí. Se guardarán en esta galería para que puedas verlos cuando quieras.</p>
              {isUploading && (
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                  <p className="text-[10px] font-black mt-1 uppercase text-primary">Subiendo archivo: {uploadProgress}%</p>
                </div>
              )}
            </div>
            <Dialog open={isMovieDialogOpen} onOpenChange={setIsMovieDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase px-6 h-12 shadow-lg shadow-primary/20" disabled={isUploading}>
                  <Upload className="w-5 h-5 mr-2" /> {isUploading ? "Subiendo..." : "Subir Película"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase">Subir Nueva Película</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Nombre de la Película</Label>
                    <Input 
                      value={movieName}
                      onChange={(e) => setMovieName(e.target.value)}
                      placeholder="Ej: Avengers Endgame, Spider-Man..."
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Archivo de Video</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                      {pendingMovieFile ? (
                        <div className="space-y-2">
                          <Video className="w-10 h-10 mx-auto text-primary" />
                          <p className="text-sm font-bold text-slate-700">{pendingMovieFile.name}</p>
                          <p className="text-xs text-slate-400">{(pendingMovieFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <Button variant="outline" size="sm" onClick={() => setPendingMovieFile(null)}>
                            Cambiar archivo
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm text-slate-500">Click para seleccionar video</p>
                          <p className="text-xs text-slate-400">Soporta videos de hasta 5GB</p>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setPendingMovieFile(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  {isUploading && (
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <Button 
                    className="w-full h-12 rounded-xl font-black uppercase"
                    onClick={onUploadMovieWithName}
                    disabled={!movieName.trim() || !pendingMovieFile || isUploading}
                  >
                    {isUploading ? `Subiendo... ${uploadProgress}%` : "Subir Película"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {multimedia.filter(m => m.type === 'video' && !m.isHero).length === 0 && !isUploading && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay películas subidas todavía</p>
              </div>
            )}
            {multimedia.filter(m => m.type === 'video' && !m.isHero).map((movie) => (
              <Card key={movie.id} className="overflow-hidden bg-card border-border/50 rounded-2xl group hover:shadow-xl transition-all duration-300">
                <div className="aspect-video relative bg-black">
                  <video 
                    src={movie.url} 
                    className="w-full h-full object-contain"
                    controls
                    preload="metadata"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-lg shadow-lg bg-white"
                      onClick={() => {
                        setEditingMovie(movie);
                        setEditMovieName(movie.name);
                        setIsEditMovieDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="rounded-lg shadow-lg"
                      onClick={() => onDeleteMultimedia(movie.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-sm truncate uppercase tracking-tight text-slate-900">{movie.name}</p>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">Video</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dialog para editar películas */}
          <Dialog open={isEditMovieDialogOpen} onOpenChange={setIsEditMovieDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase">Editar Película</DialogTitle>
              </DialogHeader>
              {editingMovie && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Nombre de la Película</Label>
                    <Input 
                      value={editMovieName}
                      onChange={(e) => setEditMovieName(e.target.value)}
                      placeholder="Nuevo nombre..."
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <video src={editingMovie.url} className="w-full h-full object-contain" controls />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl font-black uppercase"
                      onClick={() => {
                        setIsEditMovieDialogOpen(false);
                        setEditingMovie(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="flex-1 h-12 rounded-xl font-black uppercase"
                      onClick={async () => {
                        if (!editMovieName.trim()) {
                          toast.error("El nombre es obligatorio");
                          return;
                        }
                        try {
                          const res = await fetch(`/api/multimedia/${editingMovie.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: editMovieName.trim() })
                          });
                          if (res.ok) {
                            toast.success("Película actualizada");
                            const updated = await fetch("/api/multimedia").then(r => r.json());
                            setMultimedia(updated);
                            setIsEditMovieDialogOpen(false);
                            setEditingMovie(null);
                          }
                        } catch (e) {
                          toast.error("Error al actualizar");
                        }
                      }}
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-6">Nueva Noticia</h2>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const data = {
                    title: formData.get('title'),
                    content: formData.get('content'),
                    image: formData.get('image'),
                    video: formData.get('video')
                  };
                  await fetch('/api/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  });
                  form.reset();
                  toast.success("Noticia publicada");
                  refreshData();
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Título</Label>
                  <Input name="title" required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen (URL)</Label>
                  <Input name="image" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Video (URL m3u8 o MP4)</Label>
                  <Input name="video" className="rounded-xl h-12" />
                </div>
                <div className="col-span-full space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Contenido</Label>
                  <textarea name="content" required rows={4} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900" />
                </div>
                <Button type="submit" className="col-span-full bg-primary hover:bg-primary/90 text-white font-black uppercase h-14 rounded-2xl shadow-xl shadow-primary/20">
                  Publicar Noticia
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
            <div>
              <h2 className="text-2xl font-black uppercase">Gestión de Inventario</h2>
              <p className="text-sm text-muted-foreground">Agrega, edita o elimina productos de tu catálogo</p>
            </div>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase px-6 h-12 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5 mr-2" /> Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card rounded-3xl border-border/50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Añadir Nuevo Producto</DialogTitle>
                </DialogHeader>
                <form onSubmit={productForm.handleSubmit(onAddProduct, (errors) => {
                    const firstKey = Object.keys(errors)[0];
                    const msg = firstKey ? `Campo inválido: "${firstKey}"` : "Por favor completa todos los campos requeridos";
                    toast.error(msg);
                    console.error("[ProductForm] Validation errors:", errors);
                  })} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre del Producto</Label>
                    <Input {...productForm.register("name")} placeholder="Ej: Netflix Premium 1 Mes" className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio en Quetzales</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Q</span>
                      <Input type="number" step="0.01" min="0.01" {...productForm.register("price", { valueAsNumber: true })} className="rounded-xl h-12 pl-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio en Dólares (opcional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                      <Input type="number" step="0.01" min="0.01" {...productForm.register("priceUsd", { valueAsNumber: true, setValueAs: (v: any) => v === "" || v === undefined ? null : Number(v) })} placeholder="Opcional" className="rounded-xl h-12 pl-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Descuento simulado (%) <span className="text-indigo-500 ml-1">ej: 95 = 95% OFF</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
                      <Input type="number" min="0" max="99" step="1" {...productForm.register("discountPercent", { valueAsNumber: true, setValueAs: (v: any) => v === "" || v === undefined ? 0 : Number(v) })} placeholder="0 = sin descuento" className="rounded-xl h-12 pl-8" />
                    </div>
                    <p className="text-xs text-muted-foreground">Muestra un precio tachado mayor. No afecta el precio real.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio antes (tachado) <span className="text-slate-400 ml-1">Q — opcional</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Q</span>
                      <Input type="number" step="0.01" min="0" {...productForm.register("originalPrice", { valueAsNumber: true, setValueAs: (v: any) => v === "" || v === undefined ? null : Number(v) })} placeholder="Ej: 254 — se muestra tachado" className="rounded-xl h-12 pl-8" />
                    </div>
                    <p className="text-xs text-muted-foreground">Si lo ingresas, se usa este precio tachado exacto en lugar del calculado.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen (Link o Subir)</Label>
                    <div className="flex gap-2">
                      <Input {...productForm.register("image")} placeholder="https://ejemplo.com/imagen.jpg" className="rounded-xl h-12 flex-1" />
                      <div className="relative">
                        <Button type="button" variant="outline" className="h-12 w-12 rounded-xl p-0 border-primary/20" disabled={isUploading}>
                          <Upload className="w-5 h-5" />
                        </Button>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept="image/*"
                          onChange={(e) => onFileUpload(e, "image")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Categoría</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={productForm.watch("category")}
                        onValueChange={(v) => {
                          console.log("Setting category to:", v);
                          productForm.setValue("category", v, { shouldValidate: true });
                        }}
                      >
                        <SelectTrigger className="rounded-xl h-12 flex-1">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {categories && categories.filter((c: any) => !c.streamUrl).map((c: any) => (
                            <SelectItem key={c.id} value={c.name} className="capitalize">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" className="rounded-xl h-12 font-bold text-xs uppercase" onClick={() => openQuickCatDialog(productForm)}>
                        Nueva...
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-full space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Descripción (Cada línea es un beneficio - hasta 10+ líneas)</Label>
                    <textarea 
                      {...productForm.register("description")} 
                      rows={12} 
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 min-h-[300px]"
                      placeholder="Beneficio 1&#10;Beneficio 2&#10;Beneficio 3&#10;Beneficio 4&#10;Beneficio 5&#10;Beneficio 6&#10;Beneficio 7&#10;Beneficio 8&#10;Beneficio 9&#10;Beneficio 10"
                    />
                  </div>

                  {/* ── STOCK DE CREDENCIALES (create) ── */}
                  <div className="col-span-full">
                    <div className="p-5 rounded-2xl border-2 border-green-200 bg-green-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            Stock de Cuentas (Entrega Automática)
                          </p>
                          <p className="text-[11px] text-green-600 mt-0.5">Agrega todas las cuentas que quieras. Cada compra entrega una diferente, sin repetir.</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-green-700">{pendingCreateCredentials.length}</span>
                          <span className="text-[10px] text-green-600 block -mt-1">en lista</span>
                        </div>
                      </div>

                      {/* Lista de cuentas agregadas */}
                      {pendingCreateCredentials.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {pendingCreateCredentials.map((c, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white border-green-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{c.email}</p>
                                <p className="text-[11px] text-slate-500 truncate">{c.password}{c.instructions ? ` · ${c.instructions}` : ""}</p>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">LISTA</span>
                              <button type="button" onClick={() => setPendingCreateCredentials(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0 p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulario para agregar */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={newCreateCred.email}
                            onChange={e => setNewCreateCred(p => ({ ...p, email: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                            className="rounded-xl h-10 bg-white border-green-200 focus:border-green-400 text-sm"
                          />
                          <Input
                            type="text"
                            placeholder="Contraseña"
                            value={newCreateCred.password}
                            onChange={e => setNewCreateCred(p => ({ ...p, password: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                            className="rounded-xl h-10 bg-white border-green-200 focus:border-green-400 text-sm"
                          />
                        </div>
                        <textarea
                          placeholder="Instrucciones (opcional) — ej: Perfil 'Cliente' en netflix.com"
                          value={newCreateCred.instructions}
                          onChange={e => setNewCreateCred(p => ({ ...p, instructions: e.target.value }))}
                          rows={2}
                          className="w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCreateCred.email || !newCreateCred.password) { toast.error("Correo y contraseña son obligatorios"); return; }
                            setPendingCreateCredentials(prev => [...prev, { ...newCreateCred }]);
                            setNewCreateCred({ email: "", password: "", instructions: "" });
                          }}
                          className="w-full h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-black uppercase tracking-wide transition-colors"
                        >
                          + Agregar Cuenta a la Lista
                        </button>
                      </div>
                    </div>
                  </div>

                <div className="col-span-full">
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Switch id="inStock" checked={!!productForm.watch("inStock")} onCheckedChange={(v) => productForm.setValue("inStock", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="inStock">En Stock</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="isPopular" checked={!!productForm.watch("isPopular")} onCheckedChange={(v) => productForm.setValue("isPopular", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="isPopular">Popular</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="verifiedSeller" checked={!!productForm.watch("verifiedSeller")} onCheckedChange={(v) => productForm.setValue("verifiedSeller", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="verifiedSeller">Vendedor Verificado</Label>
                    </div>
                  </div>
                  <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Tipo de Pago</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => productForm.setValue("isMonthly", true)}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-black text-sm border-2 transition-all ${productForm.watch("isMonthly") ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"}`}
                      >
                        Por Mes (Suscripción)
                      </button>
                      <button
                        type="button"
                        onClick={() => productForm.setValue("isMonthly", false)}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-black text-sm border-2 transition-all ${!productForm.watch("isMonthly") ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                      >
                        Pago Único
                      </button>
                    </div>
                  </div>
                  <GlobalPaymentMethodPicker
                    selectedIds={(() => { try { return JSON.parse(productForm.watch("paymentMethodIds") || "[]"); } catch { return []; } })()}
                    onChange={(ids) => productForm.setValue("paymentMethodIds" as any, JSON.stringify(ids))}
                    showWhatsapp={productForm.watch("showWhatsapp") !== false}
                    onWhatsappChange={(v) => productForm.setValue("showWhatsapp" as any, v)}
                  />
                </div>
                  
                  <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-2xl col-span-full">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-bold text-sm">WhatsApp Directo</Label>
                        <p className="text-[10px] text-muted-foreground">Usa el número principal si se deja vacío</p>
                      </div>
                      <Input {...productForm.register("whatsappNumber")} placeholder="50212345678" className="w-[180px] h-10 rounded-lg text-xs" />
                    </div>
                    
                    <div className="h-px bg-border/50" />
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch id="showCheckmarks" checked={!!productForm.watch("showCheckmarks")} onCheckedChange={(v) => productForm.setValue("showCheckmarks", v)} />
                        <Label className="font-bold text-sm cursor-pointer" htmlFor="showCheckmarks">Mostrar ✓ en descripción</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="isActive" checked={!!productForm.watch("isActive")} onCheckedChange={(v) => productForm.setValue("isActive", v)} />
                        <Label className="font-bold text-sm cursor-pointer" htmlFor="isActive">Producto Activo</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="enableBotReviews" checked={productForm.watch("enableBotReviews") !== false} onCheckedChange={(v) => productForm.setValue("enableBotReviews" as any, v)} />
                        <Label className="font-bold text-sm cursor-pointer" htmlFor="enableBotReviews">⭐ Reseñas automáticas</Label>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-full p-4 bg-purple-50 border border-purple-100 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Correo del cliente</p>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="requiresCustomerEmailCreate"
                        checked={!!productForm.watch("requiresCustomerEmail")}
                        onCheckedChange={(v) => productForm.setValue("requiresCustomerEmail" as any, v)}
                      />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="requiresCustomerEmailCreate">
                        Pedir correo al cliente al comprar
                      </Label>
                    </div>
                    {productForm.watch("requiresCustomerEmail") && (
                      <div className="space-y-1">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Etiqueta del campo (opcional)</Label>
                        <Input
                          {...productForm.register("customerEmailLabel" as any)}
                          placeholder="Ej: Ingresa tu correo de Spotify"
                          className="rounded-xl h-10"
                        />
                        <p className="text-[10px] text-slate-400">Si se deja vacío, aparecerá como "Correo del cliente".</p>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="col-span-full bg-primary hover:bg-primary/90 text-white font-black uppercase h-14 rounded-2xl shadow-xl shadow-primary/20 mt-2">
                    Añadir Producto
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase tracking-widest text-[10px] pl-8 py-6">Producto</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Categoría</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Precio</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Estado</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-widest text-[10px] pr-8">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium">
                      No hay productos registrados aún.
                    </TableCell>
                  </TableRow>
                ) : products.map((product: any) => (
                  <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <img src={product.image?.startsWith("/") || product.image?.startsWith("http") ? product.image : `/uploads/${product.image}`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <span className="font-bold text-slate-900">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize font-semibold text-slate-500">{product.category}</TableCell>
                    <TableCell>
                      <span className="font-black text-primary">Q{product.price}</span>
                    </TableCell>
                    <TableCell>
                      {product.inStock ? (
                        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          <AlertCircle className="w-3 h-3" /> Agotado
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary/5 rounded-lg" 
                          onClick={() => onEditProduct(product)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" 
                          onClick={() => onDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-card rounded-3xl border-border/50 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Editar Producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onUpdateProduct)} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre del Producto</Label>
                <Input {...editForm.register("name")} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio en Quetzales</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Q</span>
                  <Input type="number" step="0.01" min="0.01" {...editForm.register("price", { valueAsNumber: true })} className="rounded-xl h-12 pl-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio en Dólares (opcional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                  <Input type="number" step="0.01" min="0.01" {...editForm.register("priceUsd", { valueAsNumber: true, setValueAs: (v: any) => v === "" || v === undefined ? null : Number(v) })} placeholder="Opcional" className="rounded-xl h-12 pl-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Descuento simulado (%) <span className="text-indigo-500 ml-1">ej: 95 = 95% OFF</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
                  <Input type="number" min="0" max="99" step="1" {...editForm.register("discountPercent", { valueAsNumber: true, setValueAs: (v: any) => v === "" || v === undefined ? 0 : Number(v) })} placeholder="0 = sin descuento" className="rounded-xl h-12 pl-8" />
                </div>
                <p className="text-xs text-muted-foreground">Muestra un precio tachado mayor. No afecta el precio real.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio antes (tachado) <span className="text-slate-400 ml-1">Q — opcional</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Q</span>
                  <Input type="number" step="0.01" min="0" {...editForm.register("originalPrice", { valueAsNumber: true, setValueAs: (v: any) => v === "" || v === undefined ? null : Number(v) })} placeholder="Ej: 254 — se muestra tachado" className="rounded-xl h-12 pl-8" />
                </div>
                <p className="text-xs text-muted-foreground">Si lo ingresas, se usa este precio tachado exacto en lugar del calculado.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen (Link o Subir)</Label>
                <div className="flex gap-2">
                  <Input {...editForm.register("image")} className="rounded-xl h-12 flex-1" />
                  <div className="relative">
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-xl p-0 border-primary/20" disabled={isUploading}>
                      <Upload className="w-5 h-5" />
                    </Button>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={(e) => onFileUpload(e, "editImage")}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Categoría</Label>
                <div className="flex gap-2">
                  <Select 
                    value={editForm.watch("category")}
                    onValueChange={(v) => {
                      console.log("Setting edit category to:", v);
                      editForm.setValue("category", v, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-12 flex-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {categories && categories.filter((c: any) => !c.streamUrl).map((c: any) => (
                        <SelectItem key={c.id} value={c.name} className="capitalize">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" className="rounded-xl h-12 font-bold text-xs uppercase" onClick={() => openQuickCatDialog(editForm)}>
                    Nueva...
                  </Button>
                </div>
              </div>
              <div className="col-span-full space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Descripción (Cada línea es un beneficio - hasta 10+ líneas)</Label>
                <textarea 
                  {...editForm.register("description")} 
                  rows={12} 
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 min-h-[300px]"
                  placeholder="Beneficio 1&#10;Beneficio 2&#10;Beneficio 3&#10;Beneficio 4&#10;Beneficio 5&#10;Beneficio 6&#10;Beneficio 7&#10;Beneficio 8&#10;Beneficio 9&#10;Beneficio 10"
                />
              </div>

              {/* ── STOCK DE CREDENCIALES ── */}
              <div className="col-span-full">
                <div className="p-5 rounded-2xl border-2 border-green-200 bg-green-50 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        Stock de Cuentas (Entrega Automática)
                      </p>
                      <p className="text-[11px] text-green-600 mt-0.5">Cada compra entrega una cuenta diferente, sin repetir.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-green-700">{editProductCredentials.filter(c => !c.isUsed).length}</span>
                      <span className="text-[10px] text-green-600 block -mt-1">disponibles</span>
                    </div>
                  </div>

                  {/* Current stock list */}
                  {credStockLoading ? (
                    <p className="text-xs text-green-600 text-center py-2">Cargando stock...</p>
                  ) : editProductCredentials.length === 0 ? (
                    <p className="text-xs text-green-600 italic text-center py-2">No hay cuentas en el stock todavía.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {editProductCredentials.map((cred: any) => (
                        <div key={cred.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${cred.isUsed ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-green-200"}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{cred.credEmail}</p>
                            <p className="text-[11px] text-slate-500 truncate">{cred.credPassword}{cred.credInstructions ? ` · ${cred.credInstructions}` : ""}</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${cred.isUsed ? "bg-slate-200 text-slate-500" : "bg-green-100 text-green-700"}`}>
                            {cred.isUsed ? "ENTREGADA" : "DISPONIBLE"}
                          </span>
                          {!cred.isUsed && (
                            <button type="button" onClick={() => onDeleteCredential(cred.id, editingProduct?.id)} className="text-red-400 hover:text-red-600 shrink-0 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new credential */}
                  <div className="border-t border-green-200 pt-4 space-y-3">
                    <p className="text-[11px] font-black text-green-700 uppercase tracking-wider">Agregar nueva cuenta al stock</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={newCred.email}
                        onChange={e => setNewCred(p => ({ ...p, email: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                        className="rounded-xl h-10 bg-white border-green-200 focus:border-green-400 text-sm"
                      />
                      <Input
                        type="text"
                        placeholder="Contraseña"
                        value={newCred.password}
                        onChange={e => setNewCred(p => ({ ...p, password: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                        className="rounded-xl h-10 bg-white border-green-200 focus:border-green-400 text-sm"
                      />
                    </div>
                    <textarea
                      placeholder="Instrucciones (opcional) — ej: Perfil 'Cliente' en netflix.com"
                      value={newCred.instructions}
                      onChange={e => setNewCred(p => ({ ...p, instructions: e.target.value }))}
                      rows={2}
                      className="w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => editingProduct?.id && onAddCredential(editingProduct.id)}
                      className="w-full h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-black uppercase tracking-wide transition-colors"
                    >
                      + Agregar al Stock
                    </button>
                  </div>
                </div>
              </div>

                <div className="col-span-full">
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Switch id="editInStock" checked={!!editForm.watch("inStock")} onCheckedChange={(v) => editForm.setValue("inStock", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editInStock">En Stock</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="editIsActive" checked={!!editForm.watch("isActive")} onCheckedChange={(v) => editForm.setValue("isActive", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editIsActive">Activo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="editIsPopular" checked={!!editForm.watch("isPopular")} onCheckedChange={(v) => editForm.setValue("isPopular", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editIsPopular">Popular</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="editVerifiedSeller" checked={!!editForm.watch("verifiedSeller")} onCheckedChange={(v) => editForm.setValue("verifiedSeller", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editVerifiedSeller">Vendedor Verificado</Label>
                    </div>
                  </div>
                  <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Tipo de Pago</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => editForm.setValue("isMonthly", true)} className={`flex-1 py-2.5 px-4 rounded-xl font-black text-sm border-2 transition-all ${editForm.watch("isMonthly") ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                        Por Mes (Suscripción)
                      </button>
                      <button type="button" onClick={() => editForm.setValue("isMonthly", false)} className={`flex-1 py-2.5 px-4 rounded-xl font-black text-sm border-2 transition-all ${!editForm.watch("isMonthly") ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                        Pago Único
                      </button>
                    </div>
                  </div>
                  <GlobalPaymentMethodPicker
                    selectedIds={(() => { try { return JSON.parse(editForm.watch("paymentMethodIds") || "[]"); } catch { return []; } })()}
                    onChange={(ids) => editForm.setValue("paymentMethodIds" as any, JSON.stringify(ids))}
                    showWhatsapp={editForm.watch("showWhatsapp") !== false}
                    onWhatsappChange={(v) => editForm.setValue("showWhatsapp" as any, v)}
                  />
                </div>
              
                  <div className="col-span-full flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Switch id="editShowCheckmarks" checked={!!editForm.watch("showCheckmarks")} onCheckedChange={(v) => editForm.setValue("showCheckmarks", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editShowCheckmarks">Mostrar ✓ en descripción</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="editIsActive2" checked={!!editForm.watch("isActive")} onCheckedChange={(v) => editForm.setValue("isActive", v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editIsActive2">Producto Activo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="editEnableBotReviews" checked={editForm.watch("enableBotReviews") !== false} onCheckedChange={(v) => editForm.setValue("enableBotReviews" as any, v)} />
                      <Label className="font-bold text-sm cursor-pointer" htmlFor="editEnableBotReviews">⭐ Reseñas automáticas</Label>
                    </div>
                  </div>
              <div className="col-span-full p-4 bg-purple-50 border border-purple-100 rounded-2xl space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Correo del cliente</p>
                <div className="flex items-center gap-3">
                  <Switch
                    id="requiresCustomerEmailEdit"
                    checked={!!editForm.watch("requiresCustomerEmail")}
                    onCheckedChange={(v) => editForm.setValue("requiresCustomerEmail" as any, v)}
                  />
                  <Label className="font-bold text-sm cursor-pointer" htmlFor="requiresCustomerEmailEdit">
                    Pedir correo al cliente al comprar
                  </Label>
                </div>
                {editForm.watch("requiresCustomerEmail") && (
                  <div className="space-y-1">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Etiqueta del campo (opcional)</Label>
                    <Input
                      {...editForm.register("customerEmailLabel" as any)}
                      placeholder="Ej: Ingresa tu correo de Spotify"
                      className="rounded-xl h-10"
                    />
                    <p className="text-[10px] text-slate-400">Si se deja vacío, aparecerá como "Correo del cliente".</p>
                  </div>
                )}
              </div>

              <Button type="submit" className="col-span-full bg-primary hover:bg-primary/90 text-white font-black uppercase h-14 rounded-2xl shadow-xl shadow-primary/20 mt-2">
                Guardar Cambios
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm h-fit">
              <h2 className="text-2xl font-black uppercase mb-6">Añadir Categoría</h2>
              <form onSubmit={categoryForm.handleSubmit(onAddCategory)} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre de la Categoría</Label>
                  <Input 
                    {...categoryForm.register("name")} 
                    placeholder="Ej: Netflix, Disney+, etc."
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen de la Categoría (Subir)</Label>
                  <div className="flex gap-2">
                    <Input 
                      {...categoryForm.register("image")} 
                      placeholder="URL de la imagen..."
                      className="rounded-xl h-12 flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        className="hidden"
                        id="cat-img-upload"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const res = await fetch("/api/multimedia/upload", { method: "POST", body: formData });
                            const data = await res.json();
                            categoryForm.setValue("image", data.url);
                            toast.success("Imagen subida");
                          } catch (e) {
                            toast.error("Error al subir");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-12 rounded-xl"
                        onClick={() => document.getElementById('cat-img-upload')?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? "..." : "Subir"}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase h-12 shadow-lg shadow-primary/20">
                  Añadir Categoría
                </Button>
              </form>
            </Card>

            <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-2xl font-black uppercase mb-6">Categorías Existentes</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Nombre</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories && categories.filter((c: any) => !c.streamUrl).map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-bold">{cat.name}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteCategory(cat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tv" className="space-y-6">
          <AdminTvSection />
        </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] pl-8 py-6">Fecha</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px]">Cliente</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px]">Producto</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px]">Pago</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px]">Entrega</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px]">Comprobante</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px]">Estado</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-widest text-[10px] pr-8">Gestión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-20 text-muted-foreground font-medium">
                            Aún no has recibido pedidos.
                          </TableCell>
                        </TableRow>
                      ) : orders.map((order: any) => {
                        const orderDate = order.date ? new Date(order.date) : null;
                        return (
                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-8 py-5">
                            {orderDate ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-[11px]">
                                  {orderDate.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {orderDate.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">Sin fecha</span>
                            )}
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                              <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                              {(order.customerEmail || order.customerPassword) && (
                                <div className="mt-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 space-y-0.5">
                                  {order.customerEmail && (
                                    <a
                                      href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(order.customerEmail)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 hover:text-blue-900 hover:underline"
                                      title="Abrir en Gmail"
                                    >
                                      <Mail className="w-3 h-3 shrink-0" /> {order.customerEmail}
                                    </a>
                                  )}
                                  {order.customerPassword && (
                                    <p className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                                      <Key className="w-3 h-3" /> {order.customerPassword}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-500">
                            {order.productName}
                            <div className="text-[10px] font-black text-primary uppercase">Q{order.price}</div>
                            {order.sellerId && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[9px] font-black uppercase">
                                <Store className="w-3 h-3" /> Vendedor{order.sellerName ? `: ${order.sellerName}` : ""}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                              {order.paymentMethod}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-[10px] uppercase">{order.deliveryMethod}</span>
                              <span className="text-[10px] text-muted-foreground">{order.deliveryContact}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.paymentScreenshot ? (
                              <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" className="block group relative">
                                <img
                                  src={order.paymentScreenshot}
                                  alt="Comprobante"
                                  className="w-16 h-12 object-cover rounded-xl border-2 border-slate-200 group-hover:border-primary transition-colors cursor-pointer shadow-sm"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </a>
                            ) : (
                              <span className="text-slate-300 text-[10px] italic">Sin comprobante</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              order.status === 'completed' ? 'bg-green-50 text-green-600' : 
                              order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                              'bg-indigo-50 text-indigo-600'
                            }`}>
                              {order.status === 'pending' ? 'Pendiente' : order.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex items-center gap-1.5 justify-end flex-wrap">
                              {order.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase h-8 rounded-lg px-3"
                                    onClick={() => onQuickDeliver(order)}
                                  >
                                    Enviar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-black text-[9px] uppercase h-7 rounded-lg px-2 border-slate-300 text-slate-500"
                                    onClick={() => {
                                      setFulfillOrder(order);
                                      setFulfillForm({ credentialName: order.productName, credentialEmail: "", credentialPassword: "", credentialInstructions: "", endDate: "" });
                                    }}
                                  >
                                    Manual
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="font-black text-[9px] uppercase h-7 rounded-lg px-2"
                                onClick={async () => {
                                  if (!confirm(`ATENCION: Esto va a SUSPENDER PERMANENTEMENTE la cuenta del cliente "${order.customerName}" y cancelar todas sus suscripciones. Se le enviara un correo de suspension.\n\n¿Estas seguro que es ESTAFA?`)) return;
                                  try {
                                    const res = await fetch(`/api/admin/orders/${order.id}/fraud`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({})
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      if (data.userSuspended) {
                                        toast.success("Usuario suspendido permanentemente. Se envio correo de notificacion.");
                                      } else {
                                        toast.warning("Pedido cancelado. No se encontro cuenta de usuario vinculada para suspender.");
                                      }
                                      refreshData();
                                    } else {
                                      toast.error(data.error || "Error al procesar fraude");
                                    }
                                  } catch {
                                    toast.error("Error al procesar");
                                  }
                                }}
                              >
                                ESTAFA
                              </Button>
                              <Button
                                size="sm"
                                className="font-black text-[9px] uppercase h-7 rounded-lg px-2"
                                style={{ background: "#7c3aed", color: "#fff" }}
                                onClick={async () => {
                                  if (!confirm(`¿Eliminar las suscripciones del pedido de "${order.customerName}"? NO se baneará la cuenta.`)) return;
                                  try {
                                    const res = await fetch(`/api/admin/orders/${order.id}/delete-subscriptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                                    if (res.ok) {
                                      toast.success("Suscripciones eliminadas. Cuenta intacta.");
                                      refreshData();
                                    } else { toast.error("Error al eliminar suscripciones"); }
                                  } catch { toast.error("Error al procesar"); }
                                }}
                              >
                                BORRAR
                              </Button>
                              {order.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  className="font-black text-[9px] uppercase h-7 rounded-lg px-2"
                                  style={{ background: "#0369a1", color: "#fff" }}
                                  onClick={() => {
                                    setRefundOrderDialog(order);
                                    setRefundOrderReason("");
                                  }}
                                >
                                  REEMBOLSAR
                                </Button>
                              )}
                              <Select 
                                defaultValue={order.status} 
                                onValueChange={(v) => onUpdateOrderStatus(order.id, v)}
                              >
                                <SelectTrigger className="w-[100px] h-8 text-[10px] rounded-lg font-black uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendiente</SelectItem>
                                  <SelectItem value="completed">Completado</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      })}
                    </TableBody>
                  </Table>
                </Card>

                {fulfillOrder && (
                  <Dialog open={!!fulfillOrder} onOpenChange={() => setFulfillOrder(null)}>
                    <DialogContent className="max-w-md bg-white rounded-3xl p-0 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                      <div className="p-6 space-y-4">
                        <div>
                          <h2 className="text-xl font-black uppercase tracking-tight">Atender Pedido</h2>
                          <p className="text-sm text-slate-500 mt-1">
                            <strong>{fulfillOrder.customerName}</strong> - {fulfillOrder.productName} (Q{fulfillOrder.price})
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="font-black uppercase text-xs">Nombre de la Suscripcion</Label>
                            <Input 
                              value={fulfillForm.credentialName} 
                              onChange={(e) => setFulfillForm({...fulfillForm, credentialName: e.target.value})} 
                              placeholder="Ej. Netflix Premium, Spotify Familiar" 
                              className="rounded-xl" 
                            />
                          </div>
                          <div>
                            <Label className="font-black uppercase text-xs">Correo de la Cuenta</Label>
                            <Input 
                              value={fulfillForm.credentialEmail} 
                              onChange={(e) => setFulfillForm({...fulfillForm, credentialEmail: e.target.value})} 
                              placeholder="correo@ejemplo.com" 
                              className="rounded-xl" 
                            />
                          </div>
                          <div>
                            <Label className="font-black uppercase text-xs">Contrasena</Label>
                            <Input 
                              value={fulfillForm.credentialPassword} 
                              onChange={(e) => setFulfillForm({...fulfillForm, credentialPassword: e.target.value})} 
                              placeholder="Contrasena de la cuenta" 
                              className="rounded-xl" 
                            />
                          </div>
                          <div>
                            <Label className="font-black uppercase text-xs">Fecha de Vencimiento</Label>
                            <Input 
                              type="date"
                              value={fulfillForm.endDate} 
                              onChange={(e) => setFulfillForm({...fulfillForm, endDate: e.target.value})} 
                              className="rounded-xl" 
                              min={new Date().toISOString().split("T")[0]}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">El usuario recibira un aviso 3 dias antes de que venza</p>
                          </div>
                          <div>
                            <Label className="font-black uppercase text-xs">Instrucciones (opcional)</Label>
                            <textarea 
                              value={fulfillForm.credentialInstructions} 
                              onChange={(e) => setFulfillForm({...fulfillForm, credentialInstructions: e.target.value})} 
                              placeholder="Instrucciones adicionales para el usuario. Puedes escribir varias lineas..."
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setFulfillOrder(null)}>
                            Cancelar
                          </Button>
                          <Button 
                            className="flex-1 rounded-xl font-black uppercase bg-primary" 
                            onClick={onFulfillOrder}
                            disabled={isFulfilling || !fulfillForm.credentialEmail || !fulfillForm.credentialPassword || !fulfillForm.credentialName}
                          >
                            {isFulfilling ? "Enviando..." : "Enviar al Usuario"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </TabsContent>

        <TabsContent value="multimedia" className="space-y-6">
          <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Video de Inicio (Hero)</h2>
                <p className="text-sm text-muted-foreground">Sube el video que aparecerá en la página principal</p>
              </div>
              <div className="relative">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase px-6 h-12 shadow-lg shadow-primary/20" disabled={isUploading}>
                  <Upload className="w-5 h-5 mr-2" /> {isUploading ? "Subiendo..." : "Subir Video Hero"}
                </Button>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="video/*"
                  onChange={(e) => onFileUpload(e, "hero")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {multimedia.filter((m: any) => m.isHero).map((item: any) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden aspect-video bg-muted border border-border/50">
                  <video src={item.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => onDeleteMultimedia(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="movies" className="space-y-6">
          <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase">Galería Multimedia</h2>
                <p className="text-sm text-muted-foreground">Gestiona las imágenes y videos promocionales</p>
              </div>
              <div className="relative">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase px-6 h-12 shadow-lg shadow-primary/20" disabled={isUploading}>
                  <Upload className="w-5 h-5 mr-2" /> {isUploading ? "Subiendo..." : "Subir Archivo"}
                </Button>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="video/*,image/*"
                  onChange={(e) => {
                    onFileUpload(e, "movie");
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {multimedia.filter((m: any) => !m.isHero).map((item: any) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden aspect-video bg-muted border border-border/50">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => onDeleteMultimedia(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white font-bold truncate">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Imágenes Destacadas</h2>
              <Button 
                onClick={async () => {
                  try {
                    const promises = [];
                    for (let num = 1; num <= 4; num++) {
                      const name = featuredNames[`featuredName${num}`] || "";
                      const image = localSettings[`featuredImage${num}`] || "";
                      promises.push(onSaveSettings(`featuredName${num}`, name));
                      promises.push(onSaveSettings(`featuredImage${num}`, image));
                    }
                    await Promise.all(promises);
                    toast.success("¡TODO GUARDADO CORRECTAMENTE!");
                  } catch (err) {
                    toast.error("Error al guardar todo");
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-white font-black uppercase px-8 rounded-xl h-12 shadow-lg"
              >
                <Save className="w-5 h-5 mr-2" /> GUARDAR TODO
              </Button>
            </div>
            <p className="text-slate-500 font-bold italic mb-8">Personaliza las 4 imágenes que aparecen en la página de inicio.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-4 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <h3 className="font-black text-primary uppercase tracking-widest text-sm">Espacio #{num}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre del Destacado</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Ej: Calzado, Moda..."
                          value={featuredNames[`featuredName${num}`] || ""}
                          name={`featuredName${num}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFeaturedNames(prev => ({
                              ...prev,
                              [`featuredName${num}`]: val
                            }));
                            setLocalSettings(prev => ({
                              ...prev,
                              [`featuredName${num}`]: val
                            }));
                          }}
                          className="rounded-xl h-12 flex-1"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-xl border-primary/20 hover:bg-primary/5"
                          onClick={() => onSaveSettings(`featuredName${num}`, featuredNames[`featuredName${num}`] || "")}
                        >
                          <Save className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen (Link o Subir)</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://ejemplo.com/imagen.jpg"
                          value={localSettings[`featuredImage${num}`] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings(prev => ({
                              ...prev,
                              [`featuredImage${num}`]: val
                            }));
                          }}
                          onBlur={(e) => {
                            // Guardado automático removido a petición del usuario
                            // onSaveSettings(`featuredImage${num}`, e.target.value);
                          }}
                          className="rounded-xl h-12 flex-1"
                          id={`featuredImageInput${num}`}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-xl border-primary/20 hover:bg-primary/5"
                          onClick={async () => {
                            const input = document.getElementById(`featuredImageInput${num}`) as HTMLInputElement;
                            if (input) {
                              await onSaveSettings(`featuredImage${num}`, input.value);
                              // We don't know the type from just a link easily without checking extension,
                              // but let's assume image unless it ends in common video extensions
                              const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(input.value);
                              await onSaveSettings(`featuredType${num}`, isVideo ? 'video' : 'image');
                            }
                          }}
                        >
                          <Save className="w-5 h-5" />
                        </Button>
                        <div className="relative">
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl p-0 border-primary/20" disabled={isUploading}>
                            {isUploading ? <div className="text-[10px]">{uploadProgress}%</div> : <Upload className="w-5 h-5" />}
                          </Button>
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*,video/*"
                            onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            setIsUploading(true);
                            setUploadProgress(0); // Reset progress
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("isHero", "false");
                            
                            try {
                              const xhr = new XMLHttpRequest();
                              xhr.open("POST", "/api/multimedia/upload", true);

                              xhr.upload.onprogress = (event) => {
                                if (event.lengthComputable) {
                                  const percentComplete = Math.round((event.loaded / event.total) * 100);
                                  setUploadProgress(percentComplete);
                                }
                              };

                              const uploadPromise = new Promise((resolve, reject) => {
                                xhr.onload = () => {
                                  if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve(JSON.parse(xhr.responseText));
                                  } else {
                                    reject(new Error(xhr.statusText));
                                  }
                                };
                                xhr.onerror = () => reject(new Error("Network Error"));
                                xhr.send(formData);
                              });

                              const data: any = await uploadPromise;
                              
                              // Actualizar el estado local inmediatamente
                              setLocalSettings(prev => ({
                                ...prev,
                                [`featuredImage${num}`]: data.url
                              }));

                              await fetch("/api/settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ key: `featuredImage${num}`, value: data.url }),
                              });
                              
                              const type = file.type.startsWith('video') ? 'video' : 'image';
                              await fetch("/api/settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ key: `featuredType${num}`, value: type }),
                              });
                              
                              toast.success("¡Contenido subido y guardado!");
                              if (refreshData) await refreshData();
                            } catch (err: any) {
                              toast.error("Error al guardar: " + err.message);
                            } finally {
                              setIsUploading(false);
                              setUploadProgress(0);
                              e.target.value = "";
                            }
                          }}
                          />
                        </div>
                      </div>
                    </div>
                    {settings?.[`featuredImage${num}`] && (
                      <div className="aspect-video rounded-xl overflow-hidden border-2 border-slate-200 bg-black mt-4">
                        {String(settings?.[`featuredType${num}`]) === 'video' ? (
                          <video src={String(settings?.[`featuredImage${num}`])} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={String(settings?.[`featuredImage${num}`])} className="w-full h-full object-cover" alt="" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-2xl font-black uppercase mb-6">Ajustes del Sitio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen del Splash (pantalla de entrada)</Label>
                  <div className="flex gap-2">
                    <Input
                      defaultValue={settings.splashImage || ""}
                      className="rounded-xl h-12"
                      id="splashImage"
                      placeholder="https://... URL de la imagen de fondo"
                    />
                    <Button
                      className="h-12 w-12 rounded-xl p-0"
                      onClick={() => onSaveSettings('splashImage', (document.getElementById('splashImage') as HTMLInputElement).value)}
                    >
                      <Save className="w-5 h-5" />
                    </Button>
                  </div>
                  {settings.splashImage && (
                    <img src={settings.splashImage} alt="Splash preview" className="w-full max-h-28 object-cover rounded-xl border border-slate-200 mt-1" />
                  )}
                  <p className="text-xs text-slate-400">Pega la URL de cualquier imagen. Si no hay imagen, se usa el fondo oscuro por defecto.</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre de la Tienda</Label>
                  <div className="flex gap-2">
                    <Input 
                      defaultValue={settings.storeName || "Paudronix GT"} 
                      className="rounded-xl h-12"
                      id="storeName"
                    />
                    <Button 
                      className="h-12 w-12 rounded-xl p-0"
                      onClick={() => onSaveSettings('storeName', (document.getElementById('storeName') as HTMLInputElement).value)}
                    >
                      <Save className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">WhatsApp Principal</Label>
                  <div className="flex gap-2">
                    <Input 
                      defaultValue={settings.whatsappNumber || "50237871216"} 
                      className="rounded-xl h-12"
                      id="whatsappNumber"
                    />
                    <Button 
                      className="h-12 w-12 rounded-xl p-0"
                      onClick={() => onSaveSettings('whatsappNumber', (document.getElementById('whatsappNumber') as HTMLInputElement).value)}
                    >
                      <Save className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ── DATOS DE DOMINIO ── */}
          <Card className="border-2 border-indigo-200 bg-indigo-50/60 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
                <span className="text-white text-lg">🌐</span>
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Datos de Dominio</h2>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Aparecen en todos los correos que se envían a clientes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Dominio del sitio</Label>
                <p className="text-xs text-slate-400">El enlace que aparece en el pie de cada correo. Ej: <span className="font-mono font-bold text-indigo-600">paudronix.foo</span></p>
                <div className="flex gap-2">
                  <Input
                    defaultValue={settings.siteDomain || "paudronix.foo"}
                    className="rounded-xl h-12 font-mono bg-white border-indigo-200 focus-visible:ring-orange-400"
                    id="siteDomain"
                    placeholder="paudronix.foo"
                  />
                  <Button
                    className="h-12 w-12 rounded-xl p-0 bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-200"
                    onClick={() => onSaveSettings('siteDomain', (document.getElementById('siteDomain') as HTMLInputElement).value)}
                  >
                    <Save className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">WhatsApp de soporte</Label>
                <p className="text-xs text-slate-400">El número que aparece en los correos para que el cliente te contacte. Incluye código de país.</p>
                <div className="flex gap-2">
                  <Input
                    defaultValue={settings.whatsappNumber || "50237871216"}
                    className="rounded-xl h-12 bg-white border-indigo-200 focus-visible:ring-orange-400"
                    id="whatsappNumberDomain"
                    placeholder="50237871216"
                  />
                  <Button
                    className="h-12 w-12 rounded-xl p-0 bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-200"
                    onClick={() => onSaveSettings('whatsappNumber', (document.getElementById('whatsappNumberDomain') as HTMLInputElement).value)}
                  >
                    <Save className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-5 p-4 rounded-2xl bg-indigo-100 border border-indigo-200">
              <p className="text-xs text-indigo-700 font-semibold">
                💡 <strong>¿Cómo funciona?</strong> Al guardar, todos los correos nuevos que se envíen usarán automáticamente el dominio y WhatsApp que pongas aquí. No necesitas cambiar nada más en el código.
              </p>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="featured_sections" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">SECCIONES DESTACADAS</h2>
                    <p className="text-slate-500 font-bold italic">Gestiona las imágenes cuadradas de la galería principal.</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase px-6 h-12 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> NUEVA SECCIÓN
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white border-none rounded-[2rem] p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Nueva Sección Destacada</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = {
                          title: formData.get("title"),
                          description: formData.get("description") || "",
                          image: formData.get("image_url"),
                          link: formData.get("link") || "",
                          order: parseInt(formData.get("order") as string) || 0,
                        };
                        try {
                          const res = await fetch("/api/featured-sections", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(data)
                          });
                          if (res.ok) {
                            toast.success("Sección creada");
                            window.location.reload();
                          }
                        } catch (e) {
                          toast.error("Error al crear");
                        }
                      }} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Título</Label>
                          <Input name="title" required className="rounded-xl h-12 border-2 border-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Descripción <span className="text-slate-400 font-normal normal-case">(opcional)</span></Label>
                          <Input name="description" placeholder="Ej: Acceso premium, Calzado deportivo..." className="rounded-xl h-12 border-2 border-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Imagen</Label>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              setUploadProgress(0);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const xhr = new XMLHttpRequest();
                                xhr.open("POST", "/api/multimedia/upload", true);
                                xhr.upload.onprogress = (ev) => {
                                  if (ev.lengthComputable) {
                                    setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                                  }
                                };
                                const uploadPromise = new Promise((resolve, reject) => {
                                  xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.statusText));
                                  xhr.onerror = () => reject(new Error("Network Error"));
                                  xhr.send(formData);
                                });
                                const data: any = await uploadPromise;
                                (document.getElementsByName("image_url")[0] as HTMLInputElement).value = data.url;
                                toast.success("Imagen lista");
                              } catch (err) {
                                toast.error("Error al subir");
                              } finally {
                                setIsUploading(false);
                                setUploadProgress(0);
                              }
                            }}
                            className="rounded-xl border-2 border-slate-100"
                          />
                          <Input type="hidden" name="image_url" required />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Enlace (Opcional)</Label>
                          <Input name="link" className="rounded-xl h-12 border-2 border-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-xs">Orden</Label>
                          <Input name="order" type="number" defaultValue="0" className="rounded-xl h-12 border-2 border-slate-100" />
                        </div>
                        <Button type="submit" className="w-full bg-primary h-12 rounded-xl font-black uppercase">CREAR SECCIÓN</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(featuredSectionsData) && featuredSectionsData.map((section: any) => (
                    <Card key={section.id} className="overflow-hidden bg-white border-slate-100 rounded-2xl group relative shadow-sm">
                      <div className="aspect-square relative bg-slate-100">
                        <img src={section.image} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="rounded-lg h-8 w-8"
                            onClick={async () => {
                              if (confirm("¿Eliminar sección?")) {
                                await fetch(`/api/featured-sections/${section.id}`, { method: "DELETE" });
                                window.location.reload();
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título de la sección</Label>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Ej: Netflix, Calzado, etc"
                                defaultValue={section.title || ""}
                                onBlur={async (e) => {
                                  const newVal = e.target.value;
                                  if (newVal === section.title) return;
                                  try {
                                    const res = await fetch(`/api/featured-sections/${section.id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ title: newVal })
                                    });
                                    if (res.ok) {
                                      toast.success("Título actualizado");
                                      refreshData();
                                    }
                                  } catch (err) {
                                    toast.error("Error al actualizar título");
                                  }
                                }}
                                className="h-10 rounded-xl font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="banners" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">OFERTAS / BANNERS</h2>
                    <p className="text-slate-500 font-bold italic">Sube imagenes de ofertas que se mostraran en un carrusel en la pagina principal.</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      disabled={bannerUploading}
                    />
                    <div className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors">
                      {bannerUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                      ) : (
                        <><Plus className="w-4 h-4" /> Subir Banner</>
                      )}
                    </div>
                  </label>
                </div>

                {adminBanners.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg">No hay banners</p>
                    <p className="text-sm">Sube imagenes de ofertas para que aparezcan en la pagina principal</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminBanners.map((banner: any) => (
                      <div key={banner.id} className="relative group rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                        <div className="aspect-video">
                          <img src={banner.image} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${banner.isActive ? "bg-yellow-500 text-black" : "bg-green-500 text-white"}`}
                          >
                            {banner.isActive ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold uppercase"
                          >
                            Eliminar
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 truncate">{banner.title || "Sin titulo"}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${banner.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {banner.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden lg:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight">Tickets</h2>
                  <Button size="sm" variant="outline" className="text-xs font-bold" onClick={fetchSupportTickets}>
                    Actualizar
                  </Button>
                </div>
                {supportTickets.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="font-bold">No hay tickets</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {supportTickets.map((ticket: any) => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          setActiveSupTicket(ticket);
                          fetchSupMessages(ticket.id, true);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-colors border ${
                          activeSupTicket?.id === ticket.id
                            ? "bg-primary/5 border-primary/20"
                            : "bg-white border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-900 truncate">{ticket.subject}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                            ticket.status === "open" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                          }`}>
                            {ticket.status === "open" ? "Abierto" : "Cerrado"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{ticket.userName}</p>
                        <p className="text-[10px] text-slate-400">{ticket.userEmail}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(ticket.updatedAt).toLocaleDateString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden lg:col-span-2">
              <CardContent className="p-0 flex flex-col h-[600px]">
                {!activeSupTicket ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-bold text-lg">Selecciona un ticket</p>
                      <p className="text-sm">Elige un ticket de la lista para ver la conversacion</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-[#6366f1] text-white p-4 flex items-center justify-between shrink-0 rounded-t-[2rem]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowAgentPicker(p => !p)}
                          className="relative shrink-0"
                          title="Cambiar agente"
                        >
                          <img
                            src={selectedSupAgent?.image || AGENTS[selectedAgentIdx].avatar}
                            alt={selectedSupAgent?.name || AGENTS[selectedAgentIdx].name}
                            className="w-10 h-10 rounded-full border-2 border-white/50 object-cover hover:border-white transition-all"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white"></span>
                        </button>
                        <div>
                          <h3 className="font-black text-sm uppercase">{activeSupTicket.subject}</h3>
                          <p className="text-[10px] text-white/80">{selectedSupAgent ? selectedSupAgent.name : AGENTS[selectedAgentIdx].name} · {activeSupTicket.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeSupTicket.userId && (
                          <SuspendBtn userId={activeSupTicket.userId} displayName={activeSupTicket.userName || activeSupTicket.userEmail || "Usuario"} />
                        )}
                        {activeSupTicket.status === "open" ? (
                          <Button size="sm" variant="secondary" className="text-[10px] font-black uppercase h-8 rounded-lg" onClick={() => handleCloseTicket(activeSupTicket.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Cerrar Caso
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" className="text-[10px] font-black uppercase h-8 rounded-lg" onClick={() => handleReopenTicket(activeSupTicket.id)}>
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </div>

                    {showAgentPicker && (
                      <div className="bg-white border-b border-slate-100 px-4 py-3 shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Seleccionar agente de soporte</p>
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                          {/* Agentes originales */}
                          {AGENTS.map((a, i) => (
                            <button key={i} onClick={() => { setSelectedSupAgent(null); selectAgent(i); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all shrink-0 ${!selectedSupAgent && selectedAgentIdx === i ? "bg-blue-50 ring-2 ring-blue-500" : "hover:bg-slate-50"}`}>
                              <img src={a.avatar} alt={a.name} className="w-12 h-12 rounded-full object-cover" />
                              <span className="text-[9px] font-bold text-slate-700 text-center leading-tight w-14 truncate">{a.name.split(" ")[0]}</span>
                            </button>
                          ))}
                          {/* Agentes creados desde la BD */}
                          {supDbAgents.map((a: any) => (
                            <div key={a.id} onClick={() => { setSelectedSupAgent(selectedSupAgent?.id === a.id ? null : a); setShowAgentPicker(false); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all shrink-0 relative group cursor-pointer ${selectedSupAgent?.id === a.id ? "bg-blue-50 ring-2 ring-blue-500" : "hover:bg-slate-50"}`}>
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                                {a.image ? <img src={a.image} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{a.name[0]}</div>}
                              </div>
                              <span className="text-[9px] font-bold text-slate-700 text-center leading-tight w-14 truncate">{a.name.split(" ")[0]}</span>
                              <button onClick={e => { e.stopPropagation(); deleteSupAgent(a.id); }} className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white hidden group-hover:flex items-center justify-center">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                          {/* Botón crear nuevo agente */}
                          <button onClick={() => setShowSupNewAgent(!showSupNewAgent)} className="flex flex-col items-center gap-1 p-2 rounded-xl shrink-0 hover:bg-slate-50">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-400 transition-all">
                              <Plus className="w-5 h-5 text-slate-400" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Nuevo</span>
                          </button>
                        </div>
                        {/* Formulario nuevo agente */}
                        {showSupNewAgent && (
                          <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 shrink-0" onClick={() => supAgentFileRef.current?.click()}>
                              {supNewAgentFile ? <img src={URL.createObjectURL(supNewAgentFile)} alt="" className="w-full h-full object-cover" /> : <Camera className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                            <input ref={supAgentFileRef} type="file" accept="image/*" className="hidden" onChange={e => setSupNewAgentFile(e.target.files?.[0] || null)} />
                            <input value={supNewAgentName} onChange={e => setSupNewAgentName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveSupNewAgent(); }} placeholder="Nombre del agente..." className="flex-1 text-xs border-none outline-none bg-transparent" />
                            <button onClick={saveSupNewAgent} disabled={savingSupAgent || !supNewAgentName.trim()} className="bg-[#6366f1] text-white rounded-lg px-2 py-1 text-xs font-bold disabled:opacity-50"><Save className="w-3 h-3" /></button>
                            <button onClick={() => setShowSupNewAgent(false)} className="text-slate-400"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                      {supMessages.map((msg: any) => {
                        const msgAgentImage = msg.agentImage || "";
                        const msgAgentName = msg.senderName || "Soporte";
                        return (
                          <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                            {msg.isAdmin && (
                              msgAgentImage ? (
                                <img src={msgAgentImage} alt={msgAgentName} className="w-10 h-10 rounded-full object-cover ml-2 self-end order-2 shrink-0 border-2 border-white shadow-md" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 ml-2 self-end order-2 shrink-0 flex items-center justify-center border-2 border-white shadow-md">
                                  <Users className="w-4 h-4 text-blue-400" />
                                </div>
                              )
                            )}
                            <div className={`max-w-[70%] rounded-2xl overflow-hidden ${
                              msg.isAdmin
                                ? "bg-[#6366f1] text-white rounded-tr-md order-1"
                                : msg.isSeller
                                ? "bg-blue-50 text-blue-700 rounded-tl-md border border-blue-100"
                                : "bg-slate-100 text-slate-800 rounded-tl-md"
                            }`}>
                              {msg.imageUrl ? (
                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.imageUrl} alt="imagen" className="max-w-full max-h-48 object-cover" />
                                </a>
                              ) : (
                                <div className="px-4 py-3">
                                  <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${msg.isAdmin ? "text-white/70" : msg.isSeller ? "text-blue-600" : "text-slate-400"}`}>
                                    {msg.isAdmin ? msgAgentName : msg.isSeller ? `Revendedor: ${msg.senderName}` : msg.senderName}
                                  </p>
                                  <p className="text-sm">{msg.message}</p>
                                </div>
                              )}
                              <p className={`text-[9px] pb-2 px-3 ${msg.isAdmin ? "text-white/50" : "text-slate-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={supMsgEndRef} />
                    </div>

                    {activeSupTicket.status === "open" ? (
                      <div className="p-4 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white rounded-b-[2rem]">
                        <img
                          src={selectedSupAgent?.image || AGENTS[selectedAgentIdx].avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <Input
                          value={supReply}
                          onChange={(e) => {
                            setSupReply(e.target.value);
                            if (activeSupTicket) {
                              const agentName = selectedSupAgent ? selectedSupAgent.name : AGENTS[selectedAgentIdx].name;
                              const agentImage = selectedSupAgent ? (selectedSupAgent.image || "") : "";
                              fetch(`/api/typing/support/${activeSupTicket.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentImage, agentName }) }).catch(() => {});
                            }
                          }}
                          placeholder={`Responder como ${(selectedSupAgent?.name || AGENTS[selectedAgentIdx].name).split(" ")[0]}...`}
                          className="rounded-xl h-11 flex-1"
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSupReply(); } }}
                        />
                        <Button
                          onClick={handleSupReply}
                          disabled={supSending || !supReply.trim()}
                          className="bg-[#6366f1] hover:bg-[#6366f1]/90 rounded-xl h-11 px-6 font-bold uppercase text-xs"
                        >
                          <Send className="w-4 h-4 mr-2" /> Enviar
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 border-t border-slate-100 text-center bg-slate-50 rounded-b-[2rem]">
                        <p className="text-sm text-slate-400 font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Caso cerrado
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <AdminErrorBoundary><AdminUsersSection queryClient={queryClient} /></AdminErrorBoundary>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AdminErrorBoundary><AdminReportsSection /></AdminErrorBoundary>
        </TabsContent>

        <TabsContent value="seller_products" className="space-y-6">
          <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">PRODUCTOS DE VENDEDORES</h2>
                  <p className="text-slate-500 font-bold italic">Revisa, edita y publica productos enviados por vendedores.</p>
                </div>
              </div>
              {sellerProducts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground font-medium">
                  No hay productos de vendedores pendientes.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerProducts.map((sp: any) => (
                    <div key={sp.id} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex gap-4 p-4">
                        {sp.image ? (
                          <button
                            type="button"
                            className="w-28 h-28 rounded-xl shrink-0 bg-slate-100 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all relative group"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewImageUrl(sp.image.startsWith("/") || sp.image.startsWith("http") ? sp.image : `/uploads/${sp.image}`); }}
                          >
                            <img src={sp.image.startsWith("/") || sp.image.startsWith("http") ? sp.image : `/uploads/${sp.image}`} alt={sp.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-28 h-28 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight truncate">{sp.name}</h3>
                            <div className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              sp.sellerStatus === 'approved' ? 'bg-green-50 text-green-600 border border-green-200' :
                              sp.sellerStatus === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                              'bg-indigo-50 text-indigo-600 border border-indigo-200'
                            }`}>
                              {sp.sellerStatus === 'approved' ? 'Publicado' : sp.sellerStatus === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xl font-black text-primary">Q{sp.price}</span>
                            <span className="text-sm font-bold text-green-600">${sp.priceUsd || Math.round(sp.price / 7.75)} USD</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-0.5"><span className="font-bold">Categoría:</span> {sp.category || "Sin categoría"}</p>
                          <p className="text-xs text-slate-500 truncate"><span className="font-bold">Vendedor:</span> {sp.sellerEmail || sp.sellerId || "N/A"}</p>
                          {sp.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sp.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-black text-[10px] uppercase h-8 rounded-lg px-3"
                          onClick={() => { setEditingSellerProduct(sp); setIsSellerEditDialogOpen(true); }}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-black text-[10px] uppercase h-8 rounded-lg px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => openSellerChat(sp)}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Hablar con vendedor
                        </Button>
                        {sp.sellerId && <SuspendBtn userId={sp.sellerId} displayName={sp.sellerEmail || sp.sellerId} />}
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-black text-[10px] uppercase h-8 rounded-lg px-3 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={async () => {
                            if (!confirm(`¿Seguro que quieres eliminar "${sp.name}"? Esta acción no se puede deshacer.`)) return;
                            try {
                              const res = await fetch(`/api/admin/seller-products/${sp.id}`, { method: "DELETE" });
                              if (res.ok) {
                                toast.success("Producto eliminado");
                                const data = await fetch("/api/admin/seller-products").then(r => r.json());
                                setSellerProducts(Array.isArray(data) ? data : []);
                              } else { toast.error("Error al eliminar"); }
                            } catch { toast.error("Error al eliminar"); }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                        </Button>
                        {sp.sellerStatus !== 'approved' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase h-9 rounded-lg px-4 ml-auto shadow-md shadow-green-200"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/seller-products/${sp.id}/publish`, { method: "POST" });
                                if (res.ok) {
                                  toast.success("Producto publicado");
                                  const data = await fetch("/api/admin/seller-products").then(r => r.json());
                                  setSellerProducts(Array.isArray(data) ? data : []);
                                } else { toast.error("Error al publicar"); }
                              } catch { toast.error("Error al publicar"); }
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PUBLICAR
                          </Button>
                        )}
                        {sp.sellerStatus !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="font-black text-xs uppercase h-9 rounded-lg px-4"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/seller-products/${sp.id}/reject`, { method: "POST" });
                                if (res.ok) {
                                  toast.success("Producto rechazado");
                                  const data = await fetch("/api/admin/seller-products").then(r => r.json());
                                  setSellerProducts(Array.isArray(data) ? data : []);
                                } else { toast.error("Error al rechazar"); }
                              } catch { toast.error("Error al rechazar"); }
                            }}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> RECHAZAR
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {editingSellerProduct && (
            <Dialog open={isSellerEditDialogOpen} onOpenChange={(open) => { setIsSellerEditDialogOpen(open); if (!open) setEditingSellerProduct(null); }}>
              <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Editar Producto de Vendedor</DialogTitle>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const spPriceUsdVal = formData.get("sp_priceUsd");
                  const payload: any = {
                    name: formData.get("sp_name"),
                    price: Number(formData.get("sp_price")),
                    priceUsd: spPriceUsdVal && spPriceUsdVal !== "" ? Number(spPriceUsdVal) : null,
                    image: formData.get("sp_image"),
                    category: formData.get("sp_category"),
                    description: formData.get("sp_description"),
                    whatsappNumber: formData.get("sp_whatsapp"),
                    isMonthly: (document.getElementById("sp_isMonthly") as HTMLInputElement)?.dataset.checked === "true",
                    inStock: (document.getElementById("sp_inStock") as HTMLInputElement)?.dataset.checked === "true",
                    showCheckmarks: (document.getElementById("sp_showCheckmarks") as HTMLInputElement)?.dataset.checked === "true",
                    verifiedSeller: (document.getElementById("sp_verifiedSeller") as HTMLInputElement)?.dataset.checked === "true",
                    showWhatsapp: (document.getElementById("sp_showWhatsapp") as HTMLInputElement)?.dataset.checked === "true",
                    stockQuantity: Number(formData.get("sp_stockQuantity")) || 0,
                    showBinance: (document.getElementById("sp_showBinance") as HTMLInputElement)?.dataset.checked === "true",
                    binanceData: formData.get("sp_binanceData"),
                    binanceName: formData.get("sp_binanceName"),
                    binanceInstructions: formData.get("sp_binanceInstructions"),
                    showBanrural: (document.getElementById("sp_showBanrural") as HTMLInputElement)?.dataset.checked === "true",
                    banruralData: formData.get("sp_banruralData"),
                    banruralName: formData.get("sp_banruralName"),
                    banruralInstructions: formData.get("sp_banruralInstructions"),
                    showBac: (document.getElementById("sp_showBac") as HTMLInputElement)?.dataset.checked === "true",
                    bacData: formData.get("sp_bacData"),
                    bacName: formData.get("sp_bacName"),
                    bacInstructions: formData.get("sp_bacInstructions"),
                    showBi: (document.getElementById("sp_showBi") as HTMLInputElement)?.dataset.checked === "true",
                    biData: formData.get("sp_biData"),
                    biName: formData.get("sp_biName"),
                    biInstructions: formData.get("sp_biInstructions"),
                  };
                  try {
                    const res = await fetch(`/api/admin/seller-products/${editingSellerProduct.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                      toast.success("Producto actualizado");
                      setIsSellerEditDialogOpen(false);
                      setEditingSellerProduct(null);
                      const data = await fetch("/api/admin/seller-products").then(r => r.json());
                      setSellerProducts(Array.isArray(data) ? data : []);
                    } else {
                      toast.error("Error al actualizar");
                    }
                  } catch {
                    toast.error("Error al actualizar");
                  }
                }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Nombre</Label>
                      <Input name="sp_name" defaultValue={editingSellerProduct.name} className="rounded-xl h-12 border-2 border-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Precio (Q)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Q</span>
                        <Input name="sp_price" type="number" step="0.01" defaultValue={editingSellerProduct.price} className="rounded-xl h-12 border-2 border-slate-100 pl-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Precio (USD, opcional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                        <Input name="sp_priceUsd" type="number" step="0.01" defaultValue={editingSellerProduct.priceUsd || ""} placeholder="Opcional" className="rounded-xl h-12 border-2 border-slate-100 pl-8" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">URL de Imagen</Label>
                    <Input name="sp_image" defaultValue={editingSellerProduct.image || ""} className="rounded-xl h-12 border-2 border-slate-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Categoría</Label>
                      <Input name="sp_category" defaultValue={editingSellerProduct.category || ""} className="rounded-xl h-12 border-2 border-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">WhatsApp</Label>
                      <Input name="sp_whatsapp" defaultValue={editingSellerProduct.whatsappNumber || ""} className="rounded-xl h-12 border-2 border-slate-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Descripción</Label>
                    <textarea name="sp_description" defaultValue={editingSellerProduct.description || ""} className="w-full min-h-[100px] rounded-xl border-2 border-slate-100 p-4 font-body" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Cantidad en Stock</Label>
                      <Input name="sp_stockQuantity" type="number" defaultValue={editingSellerProduct.stockQuantity || 0} className="rounded-xl h-12 border-2 border-slate-100" />
                    </div>
                  </div>
                  <SellerProductSwitches product={editingSellerProduct} />

                  <div className="grid grid-cols-1 gap-6 p-6 bg-muted/20 rounded-2xl border border-slate-200">
                    <div className="space-y-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-600">Binance Pay</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="sp_binanceData" defaultValue={editingSellerProduct.binanceData || ""} className="h-10 bg-white" placeholder="ID / Billetera" />
                        <Input name="sp_binanceName" defaultValue={editingSellerProduct.binanceName || ""} className="h-10 bg-white" placeholder="Nombre de la cuenta" />
                      </div>
                      <textarea name="sp_binanceInstructions" defaultValue={editingSellerProduct.binanceInstructions || ""} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs h-20" placeholder="Instrucciones de pago..." />
                    </div>

                    <div className="space-y-4 p-4 bg-green-50/30 rounded-xl border border-green-100/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-green-600">Banrural</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="sp_banruralData" defaultValue={editingSellerProduct.banruralData || ""} className="h-10 bg-white" placeholder="No. Cuenta" />
                        <Input name="sp_banruralName" defaultValue={editingSellerProduct.banruralName || ""} className="h-10 bg-white" placeholder="Nombre de la cuenta" />
                      </div>
                      <textarea name="sp_banruralInstructions" defaultValue={editingSellerProduct.banruralInstructions || ""} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs h-20" placeholder="Instrucciones de pago..." />
                    </div>

                    <div className="space-y-4 p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-red-600">BAC</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="sp_bacData" defaultValue={editingSellerProduct.bacData || ""} className="h-10 bg-white" placeholder="No. Cuenta" />
                        <Input name="sp_bacName" defaultValue={editingSellerProduct.bacName || ""} className="h-10 bg-white" placeholder="Nombre de la cuenta" />
                      </div>
                      <textarea name="sp_bacInstructions" defaultValue={editingSellerProduct.bacInstructions || ""} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs h-20" placeholder="Instrucciones de pago..." />
                    </div>

                    <div className="space-y-4 p-4 bg-blue-50/30 rounded-xl border border-blue-100/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-600">Banco Industrial (BI)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="sp_biData" defaultValue={editingSellerProduct.biData || ""} className="h-10 bg-white" placeholder="No. Cuenta" />
                        <Input name="sp_biName" defaultValue={editingSellerProduct.biName || ""} className="h-10 bg-white" placeholder="Nombre de la cuenta" />
                      </div>
                      <textarea name="sp_biInstructions" defaultValue={editingSellerProduct.biInstructions || ""} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs h-20" placeholder="Instrucciones de pago..." />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-black uppercase" onClick={() => { setIsSellerEditDialogOpen(false); setEditingSellerProduct(null); }}>Cancelar</Button>
                    <Button type="submit" className="flex-1 bg-primary h-12 rounded-xl font-black uppercase">GUARDAR CAMBIOS</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={!!contactSellerProduct} onOpenChange={(open) => { if (!open) { setContactSellerProduct(null); setContactMessage(""); setContactChatMessages([]); setShowAgentPicker(false); clearInterval(contactPollRef.current); } }}>
            <DialogContent className="max-w-md bg-white border-none rounded-[2rem] p-0 overflow-hidden flex flex-col" style={{ maxHeight: "88vh" }}>
              <input ref={contactImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleContactImageUpload} />
              {contactSellerProduct && (() => {
                const agent = AGENTS[selectedAgentIdx];
                return (
                <div className="bg-blue-600 text-white px-5 py-3 flex items-center gap-3 shrink-0 rounded-t-[2rem] relative">
                  <button
                    onClick={() => setShowAgentPicker(v => !v)}
                    className="relative shrink-0"
                    title="Cambiar agente"
                  >
                    <img src={agent.avatar} alt={agent.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/40 hover:border-white transition-all" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-blue-600 text-[8px] font-black">✎</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm">{agent.name}</h3>
                    <p className="text-[10px] text-blue-100">{agent.role} · {contactSellerProduct.sellerEmail || "N/A"}</p>
                  </div>
                  {showAgentPicker && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-2xl z-50 border-b border-slate-100 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Elige tu personaje</p>
                      <div className="flex gap-3 justify-center flex-wrap">
                        {AGENTS.map((a, i) => (
                          <button
                            key={i}
                            onClick={() => selectAgent(i)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedAgentIdx === i ? "bg-blue-50 ring-2 ring-blue-500" : "hover:bg-slate-50"}`}
                          >
                            <img src={a.avatar} alt={a.name} className="w-12 h-12 rounded-full object-cover" />
                            <span className="text-[9px] font-bold text-slate-700 text-center leading-tight max-w-[60px]">{a.name.split(" ")[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}

              <div ref={contactChatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ minHeight: "220px" }}>
                {contactChatMessages.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">Sin mensajes aún</p>
                    <p className="text-xs">Escribe para iniciar la conversación</p>
                  </div>
                )}
                {contactSellerProduct && contactChatMessages.map((msg: any) => {
                  const msgAgent = AGENTS[msg.agentIndex ?? 0] || AGENTS[0];
                  return (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                    {!msg.isAdmin && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mb-1 text-[10px] font-black text-slate-500">
                        {(contactSellerProduct.sellerEmail || "V")[0].toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                      msg.isAdmin
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    }`}>
                      {msg.imageUrl ? (
                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={msg.imageUrl} alt="imagen" className="max-w-full max-h-48 object-cover" />
                        </a>
                      ) : (
                        <div className="px-4 py-2.5">
                          {!msg.isAdmin && <p className="text-[9px] font-black text-slate-500 mb-0.5">Vendedor</p>}
                          {msg.isAdmin && <p className="text-[9px] font-black text-blue-200 mb-0.5">{msgAgent.name}</p>}
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      )}
                      <p className={`text-[9px] pb-2 px-4 ${msg.isAdmin ? "text-blue-200" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {msg.isAdmin && (
                      <img src={msgAgent.avatar} alt={msgAgent.name} className="w-10 h-10 rounded-full object-cover shrink-0 mb-1 border-2 border-white shadow-md" />
                    )}
                  </div>
                  );
                })}
                <div ref={contactChatEndRef} />
              </div>

              <div className="p-3 border-t border-slate-100 flex gap-2 shrink-0 items-center">
                <button
                  onClick={() => contactImageInputRef.current?.click()}
                  disabled={contactImageUploading}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-blue-50 shrink-0"
                  title="Enviar imagen"
                >
                  {contactImageUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
                <input
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSellerChatMessage(); } }}
                  placeholder="Escribe tu mensaje al vendedor..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => sendSellerChatMessage()}
                  disabled={contactSending || (!contactMessage.trim())}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">SOLICITUDES DE RETIRO</h2>
                  <p className="text-slate-500 font-bold italic">Gestiona los retiros solicitados por vendedores.</p>
                </div>
              </div>
              {allWithdrawals.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground font-medium">
                  No hay solicitudes de retiro.
                </div>
              ) : (
                <div className="space-y-4">
                  {allWithdrawals.map((wd: any) => {
                    const isExpanded = (expandedWithdrawal === wd.id);
                    return (
                      <div key={wd.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-5 flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {wd.sellerPhoto ? (
                              <img src={wd.sellerPhoto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                <Users className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{wd.sellerName || "Sin nombre"}</h4>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                wd.status === 'paid' ? 'bg-green-100 text-green-700' :
                                wd.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                wd.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {wd.status === 'paid' ? 'Pagado' : wd.status === 'approved' ? 'Aprobado' : wd.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{wd.sellerEmail || "Sin correo"}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-black text-[#6366f1]">Q{wd.amount}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                              {wd.createdAt ? new Date(wd.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => setExpandedWithdrawal(isExpanded ? null : wd.id)}
                            className="ml-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                              <div className="bg-white rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metodo de Pago</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{wd.paymentMethod || "N/A"}</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo de Cuenta</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{wd.accountType || "N/A"}</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre en Cuenta</p>
                                <p className="text-sm font-black text-slate-900">{wd.accountName || "N/A"}</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Numero de Cuenta</p>
                                <p className="text-sm font-black text-slate-900 font-mono">{wd.accountNumber || "N/A"}</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 mb-5">
                              <div className="flex items-center gap-3">
                                {wd.sellerPhoto ? (
                                  <img src={wd.sellerPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendedor Registrado</p>
                                  <p className="text-sm font-bold text-slate-900">{wd.sellerName || "Sin nombre"}</p>
                                  <p className="text-xs text-slate-500">{wd.sellerEmail || "Sin correo"}</p>
                                </div>
                                {wd.sellerId && <div className="ml-auto"><SuspendBtn userId={wd.sellerId} displayName={wd.sellerName || wd.sellerEmail || "Vendedor"} /></div>}
                              </div>
                            </div>
                            {(wd.status === 'pending' || wd.status === 'approved') && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500 font-bold uppercase" id={`receipt-label-${wd.id}`}>
                                      Adjuntar comprobante (opcional)
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*,.webp,.avif,.svg,.ico,.bmp,.tiff,.heic,.heif,.pdf"
                                      className="hidden"
                                      id={`receipt-input-${wd.id}`}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        const label = document.getElementById(`receipt-label-${wd.id}`);
                                        if (label && f) label.textContent = f.name;
                                      }}
                                    />
                                  </label>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Button
                                    className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                                    onClick={async () => {
                                      try {
                                        const fileInput = document.getElementById(`receipt-input-${wd.id}`) as HTMLInputElement;
                                        const formData = new FormData();
                                        formData.append("status", "paid");
                                        if (fileInput?.files?.[0]) {
                                          formData.append("receiptImage", fileInput.files[0]);
                                        }
                                        const res = await fetch(`/api/admin/withdrawals/${wd.id}`, {
                                          method: "PATCH",
                                          body: formData
                                        });
                                        if (res.ok) {
                                          toast.success("Retiro marcado como pagado y correo enviado");
                                          const data = await fetch("/api/admin/withdrawals").then(r => r.json());
                                          setAllWithdrawals(Array.isArray(data) ? data : []);
                                        } else {
                                          toast.error("Error al actualizar");
                                        }
                                      } catch {
                                        toast.error("Error al actualizar");
                                      }
                                    }}
                                  >
                                    <Wallet className="w-4 h-4 mr-2" /> Marcar como Pagado
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/admin/withdrawals/${wd.id}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ status: "rejected" })
                                        });
                                        if (res.ok) {
                                          toast.success("Retiro rechazado");
                                          const data = await fetch("/api/admin/withdrawals").then(r => r.json());
                                          setAllWithdrawals(Array.isArray(data) ? data : []);
                                        } else {
                                          toast.error("Error al rechazar");
                                        }
                                      } catch {
                                        toast.error("Error al rechazar");
                                      }
                                    }}
                                  >
                                    <X className="w-4 h-4 mr-2" /> Rechazar
                                  </Button>
                                </div>
                              </div>
                            )}
                            {wd.processedAt && (
                              <p className="text-xs text-slate-400 mt-3">
                                Procesado: {new Date(wd.processedAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recharge_methods" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">METODOS DE PAGO PARA RECARGA</h2>
                  <p className="text-slate-500 text-sm mt-1">Configura los metodos de pago que los usuarios veran para recargar saldo</p>
                </div>
                <Button
                  className="bg-[#6366f1] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                  onClick={() => { setShowAddMethod(true); setEditingMethod(null); setMethodForm({ name: "", type: "Binance", accountNumber: "", accountName: "", instructions: "", order: "0" }); setMethodLogo(null); }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Agregar Metodo
                </Button>
              </div>

              {showAddMethod && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 mb-4">{editingMethod ? "Editar Metodo" : "Nuevo Metodo de Pago"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Nombre</Label>
                      <Input value={methodForm.name} onChange={e => setMethodForm({...methodForm, name: e.target.value})} placeholder="Ej: Binance" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Tipo</Label>
                      <select value={methodForm.type} onChange={e => setMethodForm({...methodForm, type: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mt-1">
                        <option>Binance</option>
                        <option>Banrural</option>
                        <option>BAC</option>
                        <option>Banco Industrial</option>
                        <option>Transferencia</option>
                        <option>Efectivo</option>
                        <option>Otro</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Numero de Cuenta</Label>
                      <Input value={methodForm.accountNumber} onChange={e => setMethodForm({...methodForm, accountNumber: e.target.value})} placeholder="Numero, ID o direccion" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Nombre de la Cuenta</Label>
                      <Input value={methodForm.accountName} onChange={e => setMethodForm({...methodForm, accountName: e.target.value})} placeholder="Titular" className="rounded-xl mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wider">Instrucciones</Label>
                      <textarea value={methodForm.instructions} onChange={e => setMethodForm({...methodForm, instructions: e.target.value})} placeholder="Instrucciones para el usuario..." rows={3} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mt-1 resize-none" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Orden</Label>
                      <Input type="number" value={methodForm.order} onChange={e => setMethodForm({...methodForm, order: e.target.value})} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Logo (opcional)</Label>
                      <label className="flex items-center gap-2 mt-1 px-3 py-2 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{methodLogo ? methodLogo.name : "Subir imagen"}</span>
                        <input ref={methodLogoRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setMethodLogo(e.target.files[0]); }} />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl font-bold text-xs uppercase" onClick={() => { setShowAddMethod(false); setEditingMethod(null); }}>Cancelar</Button>
                    <Button className="bg-[#6366f1] hover:bg-blue-700 rounded-xl font-bold text-xs uppercase" onClick={saveRechargeMethod}>
                      <Save className="w-4 h-4 mr-1" /> {editingMethod ? "Actualizar" : "Guardar"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {adminRechargeMethods.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {m.logo ? (
                        <img src={m.logo} alt={m.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-[#6366f1]" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-slate-900">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.type} {m.accountNumber ? `- ${m.accountNumber}` : ""}</p>
                        {m.accountName && <p className="text-xs text-slate-400">Titular: {m.accountName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${m.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" onClick={() => toggleMethodActive(m)}>
                        {m.isActive ? "Desactivar" : "Activar"}
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" onClick={() => {
                        setEditingMethod(m);
                        setMethodForm({ name: m.name, type: m.type, accountNumber: m.accountNumber || "", accountName: m.accountName || "", instructions: m.instructions || "", order: String(m.order || 0) });
                        setShowAddMethod(true);
                      }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="destructive" size="sm" className="rounded-xl text-xs font-bold" onClick={() => deleteRechargeMethod(m.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {adminRechargeMethods.length === 0 && (
                  <p className="text-center text-slate-400 py-8 text-sm">No hay metodos de pago configurados. Agrega uno para que los usuarios puedan recargar saldo.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recharge_requests" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">SOLICITUDES DE RECARGA</h2>
                  <p className="text-slate-500 text-sm mt-1">Revisa y aprueba las solicitudes de recarga de saldo de los usuarios</p>
                </div>
                <Button variant="outline" className="rounded-xl font-bold text-xs uppercase" onClick={loadRechargeRequests}>
                  Actualizar
                </Button>
              </div>

              {adminRechargeRequests.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No hay solicitudes de recarga pendientes.</p>
              ) : (
                <div className="space-y-4">
                  {adminRechargeRequests.map(req => (
                    <div key={req.id} className={`bg-white rounded-2xl border-2 ${req.status === "pending" ? "border-amber-200" : req.status === "approved" ? "border-green-200" : "border-red-200"} p-5 shadow-sm`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                              req.status === "approved" ? "bg-green-100 text-green-700" :
                              req.status === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {req.status === "approved" ? "Aprobada" : req.status === "rejected" ? "Rechazada" : "Pendiente"}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{req.code}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Usuario</p>
                              <p className="text-sm font-bold text-slate-900">{req.userName}</p>
                              <p className="text-xs text-slate-500">{req.userEmail}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Monto</p>
                              <p className="text-lg font-black text-[#6366f1]">Q{req.amount}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Metodo</p>
                              <p className="text-sm font-bold text-slate-700">{req.paymentMethodName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Fecha</p>
                              <p className="text-xs text-slate-600">{new Date(req.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                          {req.screenshot && (
                            <div className="mt-2">
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Comprobante</p>
                              <a href={req.screenshot} target="_blank" rel="noopener noreferrer">
                                <img src={req.screenshot} alt="Comprobante" className="w-40 h-28 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer" />
                              </a>
                            </div>
                          )}
                        </div>
                        {req.status === "pending" && (
                          <div className="flex flex-col gap-2">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                              onClick={() => handleRechargeAction(req.id, "approved")}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar y Acreditar
                            </Button>
                            <Button
                              variant="destructive"
                              className="font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                              onClick={() => handleRechargeAction(req.id, "rejected")}
                            >
                              <X className="w-4 h-4 mr-2" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">RENOVACIONES</h2>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full bg-green-400 ${renewalTicking ? "animate-ping" : ""}`}></span>
                En vivo — actualiza cada 15 seg · Última vez: {renewalLastUpdated.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
            <Button variant="outline" className="rounded-xl font-bold text-xs uppercase" onClick={async () => { setRenewalTicking(true); await loadRenewalRequests(); setRenewalLastUpdated(new Date()); setTimeout(() => setRenewalTicking(false), 600); }}>
              <RefreshCw className={`w-4 h-4 mr-2 ${renewalTicking ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-slate-900">{renewalRequests.length}</p>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mt-1">Total</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-amber-600">{renewalRequests.filter((r:any) => r.status === "pending").length}</p>
              <p className="text-xs font-bold uppercase text-amber-500 tracking-widest mt-1">🕐 Pendientes</p>
            </div>
            <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-green-600">{renewalRequests.filter((r:any) => r.status === "approved").length}</p>
              <p className="text-xs font-bold uppercase text-green-500 tracking-widest mt-1">✅ Aprobadas</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-red-500">{renewalRequests.filter((r:any) => r.status === "rejected").length}</p>
              <p className="text-xs font-bold uppercase text-red-400 tracking-widest mt-1">❌ Rechazadas</p>
            </div>
          </div>

          {/* Filtros + Buscador */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex gap-2 flex-wrap">
              {([
                { val: "all", label: "Todas" },
                { val: "pending", label: "🕐 Pendientes" },
                { val: "approved", label: "✅ Aprobadas" },
                { val: "rejected", label: "❌ Rechazadas" },
              ] as const).map(f => (
                <button
                  key={f.val}
                  onClick={() => setRenewalFilter(f.val)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${renewalFilter === f.val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Buscar usuario, email, servicio o código..."
              value={renewalSearch}
              onChange={e => setRenewalSearch(e.target.value)}
              className="rounded-xl text-sm md:max-w-xs"
            />
          </div>

          {/* Lista */}
          {(() => {
            const filtered = renewalRequests.filter((r: any) => {
              const matchFilter = renewalFilter === "all" || r.status === renewalFilter;
              const q = renewalSearch.toLowerCase();
              const matchSearch = !q ||
                (r.userName || "").toLowerCase().includes(q) ||
                (r.userEmail || "").toLowerCase().includes(q) ||
                (r.subscription?.credentialName || r.subscription?.productName || "").toLowerCase().includes(q) ||
                (r.renewalCode || "").toLowerCase().includes(q);
              return matchFilter && matchSearch;
            });
            if (filtered.length === 0) return (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-bold text-sm">No hay renovaciones{renewalFilter !== "all" ? " con ese filtro" : ""}.</p>
              </div>
            );
            return (
              <div className="space-y-4">
                {filtered.map((req: any) => (
                  <div key={req.id} className={`bg-white rounded-2xl border-2 shadow-sm ${
                    req.status === "pending" ? "border-amber-300" :
                    req.status === "approved" ? "border-green-300" : "border-red-200"
                  } p-5`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                            req.status === "approved" ? "bg-green-100 text-green-700" :
                            req.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {req.status === "approved" ? "✅ Aprobada" : req.status === "rejected" ? "❌ Rechazada" : "🕐 Pendiente"}
                          </span>
                          {req.paymentMethod === "wallet" && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">💳 Saldo</span>
                          )}
                          {req.paymentMethod === "screenshot" && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">🧾 Comprobante</span>
                          )}
                          {req.paymentMethod === "admin_review" && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200">📋 Masiva</span>
                          )}
                          {req.months > 0 && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              📦 {req.months} {req.months === 1 ? "mes" : "meses"}
                            </span>
                          )}
                          {req.totalAmount > 0 && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              💰 Q{req.totalAmount}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">{req.renewalCode}</span>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">👤 Usuario</p>
                            <p className="text-sm font-black text-slate-900">{req.userName || "—"}</p>
                            <p className="text-xs text-slate-500 truncate">{req.userEmail || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">📺 Servicio</p>
                            <p className="text-sm font-bold text-slate-800">{req.subscription?.credentialName || req.subscription?.productName || "N/A"}</p>
                            <p className="text-[10px] text-slate-400">{req.subscription?.credentialEmail || ""}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">📅 Fecha solicitud</p>
                            <p className="text-xs font-bold text-slate-700">
                              {new Date(req.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <p className="text-xs text-slate-500">
                              🕐 {new Date(req.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">⏳ Vencimiento</p>
                            {req.subscription?.endDate ? (
                              <>
                                <p className={`text-xs font-black ${new Date(req.subscription.endDate) < new Date() ? "text-red-600" : "text-emerald-600"}`}>
                                  {new Date(req.subscription.endDate).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                                <p className="text-[10px] text-slate-400">{new Date(req.subscription.endDate) < new Date() ? "⚠ Ya expiró" : "✅ Activa"}</p>
                              </>
                            ) : <p className="text-xs text-slate-400">Sin fecha</p>}
                          </div>
                        </div>

                        {/* Comprobante / Método pago */}
                        {req.paymentMethod === "wallet" ? (
                          <div className="mb-2 flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 w-fit">
                            <span className="text-purple-600 text-sm">💳</span>
                            <p className="text-xs font-black text-purple-700">Pagado con saldo interno — renovación automática</p>
                          </div>
                        ) : req.paymentScreenshot ? (
                          <div className="mb-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">🧾 Comprobante</p>
                            <a href={req.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                              <img src={req.paymentScreenshot} alt="Comprobante" className="w-44 h-32 object-cover rounded-xl border-2 border-slate-200 hover:opacity-80 transition-opacity cursor-pointer shadow-sm" />
                            </a>
                          </div>
                        ) : null}
                        {req.adminNotes && (
                          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notas admin</p>
                            <p className="text-xs text-slate-600 mt-0.5">{req.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Acciones solo pendientes */}
                      {req.status === "pending" && (
                        <div className="flex flex-col gap-2 min-w-[210px]">
                          {req.paymentMethod === "admin_review" ? (
                            <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 mb-1">
                              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Renovacion Masiva</p>
                              <p className="text-xs text-blue-700 font-semibold mt-0.5">Al aprobar se suman <strong>+30 días</strong> automáticamente</p>
                            </div>
                          ) : (
                            <div>
                              <Label className="font-black uppercase text-[10px] text-slate-400">Nueva Fecha de Vencimiento</Label>
                              <Input
                                type="date"
                                value={renewalEndDates[req.id] || ""}
                                onChange={(e) => setRenewalEndDates(prev => ({ ...prev, [req.id]: e.target.value }))}
                                className="rounded-xl text-sm"
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                          )}
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                            disabled={req.paymentMethod !== "admin_review" && !renewalEndDates[req.id]}
                            onClick={async () => {
                              try {
                                const body: any = { status: "approved" };
                                if (req.paymentMethod !== "admin_review") body.newEndDate = renewalEndDates[req.id];
                                const res = await fetch(`/api/admin/renewal-requests/${req.id}`, {
                                  method: "PUT", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(body),
                                });
                                if (res.ok) {
                                  toast.success("✅ Renovacion aprobada!");
                                  setRenewalEndDates(prev => { const n = { ...prev }; delete n[req.id]; return n; });
                                  loadRenewalRequests();
                                  setRenewalLastUpdated(new Date());
                                }
                              } catch { toast.error("Error al aprobar"); }
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> {req.paymentMethod === "admin_review" ? "Aprobar (+30 días)" : "Aprobar"}
                          </Button>
                          <Button
                            variant="destructive"
                            className="font-black text-xs uppercase tracking-wider rounded-xl px-6 h-10"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/renewal-requests/${req.id}`, {
                                  method: "PUT", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "rejected" }),
                                });
                                if (res.ok) {
                                  toast.success("Renovacion rechazada");
                                  loadRenewalRequests();
                                  setRenewalLastUpdated(new Date());
                                }
                              } catch { toast.error("Error al rechazar"); }
                            }}
                          >
                            <X className="w-4 h-4 mr-2" /> Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="discount_codes" className="space-y-6">
          <AdminErrorBoundary><AdminDiscountCodesSection /></AdminErrorBoundary>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <AdminErrorBoundary><AdminSubscriptionsSection /></AdminErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mis_clientes" className="space-y-6">
          <AdminClientMessagesSection />
        </TabsContent>

        {/* ===== JUEGOS ===== */}
        <TabsContent value="juegos" className="space-y-6">
          <GamesAdminSection />
        </TabsContent>

        <TabsContent value="pavos" className="space-y-6">
          <FortniteAdminSection />
        </TabsContent>

        {/* ===== REFERIDOS ===== */}
        <TabsContent value="referidos" className="space-y-6">
          <ReferralAdminSection />
        </TabsContent>

        <TabsContent value="regalos" className="space-y-6">
          <GiftSection />
        </TabsContent>

        <TabsContent value="respaldo" className="space-y-6">
          <BackupSection />
          <MoviesBackupSection />
        </TabsContent>

      </Tabs>

      <Dialog open={quickCatOpen} onOpenChange={setQuickCatOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input value={quickCatName} onChange={e => setQuickCatName(e.target.value)} placeholder="Ej: Netflix, Disney+..." className="rounded-xl h-12 mt-1" />
            </div>
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Imagen</Label>
              <div className="flex gap-2 mt-1">
                <Input value={quickCatImage} onChange={e => setQuickCatImage(e.target.value)} placeholder="URL de la imagen..." className="rounded-xl h-12 flex-1" />
                <div className="relative">
                  <input type="file" className="hidden" id="quick-cat-img" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setQuickCatUploading(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/multimedia/upload", { method: "POST", body: formData });
                      const data = await res.json();
                      setQuickCatImage(data.url);
                      toast.success("Imagen subida");
                    } catch { toast.error("Error al subir"); }
                    finally { setQuickCatUploading(false); }
                  }} />
                  <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={() => document.getElementById('quick-cat-img')?.click()} disabled={quickCatUploading}>
                    <Upload className="w-4 h-4 mr-2" /> {quickCatUploading ? "..." : "Subir"}
                  </Button>
                </div>
              </div>
              {quickCatImage && <img src={quickCatImage} alt="" className="mt-2 h-16 rounded-xl object-contain bg-slate-50 border p-1" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCatOpen(false)} className="rounded-xl font-bold text-xs uppercase">Cancelar</Button>
            <Button onClick={onQuickAddCategory} disabled={!quickCatName} className="rounded-xl font-bold text-xs uppercase bg-primary hover:bg-primary/90">Crear Categoría</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImageUrl} onOpenChange={(open) => { if (!open) setPreviewImageUrl(null); }}>
        <DialogContent className="max-w-3xl p-2 bg-black/90 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Vista previa de imagen</DialogTitle>
          </DialogHeader>
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Vista previa"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ===== MODAL REEMBOLSO ===== */}
      {refundOrderDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setRefundOrderDialog(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-black text-gray-900 mb-1">Reembolsar pedido</h2>
            <p className="text-sm text-gray-500 mb-4">El monto se acreditará al saldo del usuario y se eliminará la suscripción.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Cliente</span><span className="font-semibold text-gray-800">{refundOrderDialog.customerName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Producto</span><span className="font-semibold text-gray-800">{refundOrderDialog.productName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Monto</span><span className="font-bold text-blue-700">Q{Number(refundOrderDialog.price).toFixed(2)}</span></div>
            </div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Motivo del reembolso <span className="text-red-500">*</span></label>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={3}
              placeholder="Ej: El servicio no funcionó correctamente, duplicado, error en el pedido..."
              value={refundOrderReason}
              onChange={(e) => setRefundOrderReason(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1 mb-5">Este mensaje se incluirá en el correo de notificación al usuario.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRefundOrderDialog(null)} disabled={refundingOrder}>
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold"
                style={{ background: "#0369a1", color: "#fff" }}
                disabled={refundingOrder || !refundOrderReason.trim()}
                onClick={async () => {
                  setRefundingOrder(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${refundOrderDialog.id}/refund`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reason: refundOrderReason.trim() }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(`✅ Reembolso de Q${data.refundAmount} procesado. Suscripción eliminada.`);
                      setRefundOrderDialog(null);
                      refreshData();
                    } else {
                      toast.error(data.error || "Error al reembolsar");
                    }
                  } catch {
                    toast.error("Error al procesar");
                  } finally {
                    setRefundingOrder(false);
                  }
                }}
              >
                {refundingOrder ? "Procesando..." : "Confirmar reembolso"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveBalancesPanel({ queryClient }: { queryClient: any }) {
  const balancesQuery = useQuery({
    queryKey: ["/api/admin/users-with-balance"],
    queryFn: () => fetch("/api/admin/users-with-balance", { credentials: "include" }).then(r => r.ok ? r.json() : []),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const list: any[] = Array.isArray(balancesQuery.data) ? balancesQuery.data : [];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = list.filter((u: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (u.email || "").toLowerCase().includes(q) ||
           (u.firstName || "").toLowerCase().includes(q) ||
           (u.lastName || "").toLowerCase().includes(q) ||
           (u.id || "").toLowerCase().includes(q);
  });

  const totalBalance = filtered.reduce((s, u) => s + Number(u.balance || 0), 0);

  const submitAdjustment = async () => {
    if (!editing) return;
    const amt = parseInt(adjAmount);
    if (!amt || amt <= 0) { toast.error("Ingresa un monto valido"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/user-balance/${editing.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, type: adjType, description: adjReason || (adjType === "credit" ? "Ajuste manual (admin)" : "Debito manual (admin)") }),
      });
      if (res.ok) {
        toast.success(adjType === "credit" ? `Saldo agregado: Q${amt}` : `Saldo descontado: Q${amt}`);
        setEditing(null); setAdjAmount(""); setAdjReason(""); setAdjType("credit");
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-balance"] });
        balancesQuery.refetch();
      } else {
        toast.error("Error al ajustar saldo");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRel = (d: string | null) => {
    if (!d) return "Sin actividad";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days} d`;
  };

  return (
    <Card className="border-none bg-gradient-to-br from-emerald-50 to-white rounded-[2rem] overflow-hidden mb-6">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">SALDOS ACTIVOS</h2>
              <p className="text-sm text-muted-foreground font-bold">
                {filtered.length} usuarios · <span className="text-emerald-600">Q{totalBalance.toLocaleString("es-GT")}</span> en total
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> En vivo
                </span>
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => balancesQuery.refetch()} className="rounded-xl font-bold text-xs uppercase">
            <RefreshCw className={`w-4 h-4 mr-2 ${balancesQuery.isFetching ? "animate-spin" : ""}`} /> Actualizar ahora
          </Button>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o ID..."
          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 mb-4 bg-white"
        />

        {balancesQuery.isLoading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto text-emerald-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">{search ? "Ningun usuario coincide con la busqueda." : "Ningun usuario tiene saldo activo."}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map((u: any) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all">
                {(u.customProfileImage || u.profileImageUrl) ? (
                  <img src={u.customProfileImage || u.profileImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 uppercase tracking-tight text-sm truncate">
                      {(u.firstName || u.email?.split("@")[0] || "Sin nombre")} {u.lastName || ""}
                    </p>
                    {u.suspended && <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full">SUSPENDIDO</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" /> {u.email || "Sin correo"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ultimo movimiento: {formatRel(u.lastTxnAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-emerald-600 leading-none">Q{Number(u.balance).toLocaleString("es-GT")}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">+Q{u.totalCredits} / -Q{u.totalDebits}</p>
                </div>
                <Button size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shrink-0" onClick={() => { setEditing(u); setAdjType("credit"); setAdjAmount(""); setAdjReason(""); }}>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Ajustar
                </Button>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !submitting && setEditing(null)}>
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Ajustar saldo</h3>
                <button onClick={() => !submitting && setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center" disabled={submitting}><X className="w-4 h-4" /></button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <p className="text-xs text-slate-500 font-bold uppercase">Usuario</p>
                <p className="font-black text-slate-900 text-sm">{(editing.firstName || editing.email?.split("@")[0])} {editing.lastName || ""}</p>
                <p className="text-xs text-slate-500">{editing.email}</p>
                <p className="text-2xl font-black text-emerald-600 mt-2">Saldo actual: Q{Number(editing.balance).toLocaleString("es-GT")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button type="button" onClick={() => setAdjType("credit")} className={`h-12 rounded-xl font-black text-sm uppercase transition-all ${adjType === "credit" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-600"}`}>+ Agregar</button>
                <button type="button" onClick={() => setAdjType("debit")} className={`h-12 rounded-xl font-black text-sm uppercase transition-all ${adjType === "debit" ? "bg-red-600 text-white shadow-md" : "bg-slate-100 text-slate-600"}`}>- Descontar</button>
              </div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monto (Q)</label>
              <input type="number" min="1" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-lg font-black focus:outline-none focus:border-emerald-400 mb-4" disabled={submitting} />
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Razon (opcional)</label>
              <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Ajuste manual..." className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 mb-5" disabled={submitting} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setEditing(null)} disabled={submitting}>Cancelar</Button>
                <Button className={`flex-1 rounded-xl font-black uppercase ${adjType === "credit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white`} onClick={submitAdjustment} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (adjType === "credit" ? "Agregar saldo" : "Descontar saldo")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminUsersSection({ queryClient }: { queryClient: any }) {
  const usersQuery = useQuery({ queryKey: ["/api/admin/users"], queryFn: () => fetch("/api/admin/users", { credentials: "include" }).then(r => r.ok ? r.json() : []) });
  const allUsers: any[] = Array.isArray(usersQuery.data) ? usersQuery.data : [];
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [viewingSubs, setViewingSubs] = useState<any>(null);
  const [userSubs, setUserSubs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannedList, setBannedList] = useState<any[]>([]);
  const [banEmail, setBanEmail] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);
  const [showSuspendedOnly, setShowSuspendedOnly] = useState(false);

  useEffect(() => {
    fetch("/api/admin/banned-emails").then(r => r.json()).then(d => Array.isArray(d) ? setBannedList(d) : []).catch(() => {});
  }, []);

  const startEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email || "" });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("firstName", editForm.firstName);
      formData.append("lastName", editForm.lastName);
      formData.append("email", editForm.email);
      const res = await fetch(`/api/admin/users/${editingUser.id}`, { method: "PUT", body: formData });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setEditingUser(null);
        toast.success("Usuario actualizado");
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "PUT", body: formData });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast.success("Foto actualizada");
    } else {
      toast.error("Error al subir foto");
    }
  };

  const viewSubscriptions = async (u: any) => {
    setViewingSubs(u);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/subscriptions`);
      const data = await res.json();
      setUserSubs(Array.isArray(data) ? data : []);
    } catch {
      setUserSubs([]);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-GT", { year: "numeric", month: "short", day: "numeric" });

  return (
    <>
    <ActiveBalancesPanel queryClient={queryClient} />
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">GESTION DE USUARIOS</h2>
            <p className="text-sm text-muted-foreground">Registrados: {allUsers.length} · Suspendidos: {allUsers.filter((u: any) => u.suspended).length}</p>
          </div>
          <div className="flex gap-2">
            <Button variant={showSuspendedOnly ? "default" : "outline"} onClick={() => setShowSuspendedOnly(!showSuspendedOnly)} className="rounded-xl font-bold text-xs uppercase">
              <Lock className="w-4 h-4 mr-2" /> {showSuspendedOnly ? "Ver todos" : "Ver suspendidos"}
            </Button>
            <Button variant="outline" onClick={() => usersQuery.refetch()} className="rounded-xl font-bold text-xs uppercase">
              <Loader2 className={`w-4 h-4 mr-2 ${usersQuery.isFetching ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>
        </div>

        {allUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">No hay usuarios registrados aun.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showSuspendedOnly ? allUsers.filter((u: any) => u.suspended) : allUsers).map((u: any) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="relative group shrink-0">
                  {(u.customProfileImage || u.profileImageUrl) ? (
                    <img
                      src={u.customProfileImage || u.profileImageUrl}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-slate-200">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(u.id, f); }} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 uppercase tracking-tight text-sm truncate">
                      {(u.firstName || u.email?.split("@")[0] || "Sin nombre")} {u.lastName || ""}
                    </p>
                    {u.suspended && (
                      <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">SUSPENDIDO</span>
                    )}
                    {u.googleId && (
                      <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email || "Sin correo"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Registro: {u.createdAt ? formatDate(u.createdAt) : "N/A"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold" onClick={() => viewSubscriptions(u)}>
                    <Package className="w-3.5 h-3.5 mr-1" /> Suscripciones
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold" onClick={() => startEdit(u)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  {u.suspended ? (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white border-0"
                      onClick={async () => {
                        if (!confirm(`¿Reactivar la cuenta de ${u.firstName || u.email}?`)) return;
                        const res = await fetch(`/api/admin/users/${u.id}/unsuspend`, { method: "POST" });
                        if (res.ok) { toast.success("Cuenta reactivada"); usersQuery.refetch(); }
                        else toast.error("Error al reactivar");
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reactivar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white border-0"
                      onClick={async () => {
                        if (!confirm(`¿Suspender permanentemente la cuenta de ${u.firstName || u.email}? Esto cerrará su sesión y cancelará sus suscripciones.`)) return;
                        const res = await fetch(`/api/admin/users/${u.id}/suspend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Cuenta suspendida por el administrador" }) });
                        if (res.ok) { toast.success("Cuenta suspendida"); usersQuery.refetch(); }
                        else toast.error("Error al suspender");
                      }}
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" /> Suspender
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">Correos Baneados</h3>
              <p className="text-xs text-slate-500">Estos correos no pueden iniciar sesión, ni crear cuentas nuevas</p>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={banEmail}
              onChange={e => setBanEmail(e.target.value)}
              placeholder="correo@gmail.com"
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400"
            />
            <input
              type="text"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400"
            />
            <Button
              disabled={banning || !banEmail}
              className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase"
              onClick={async () => {
                setBanning(true);
                try {
                  const res = await fetch("/api/admin/banned-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: banEmail, reason: banReason }) });
                  if (res.ok) {
                    const data = await res.json();
                    setBannedList(prev => [data, ...prev]);
                    setBanEmail(""); setBanReason("");
                    toast.success("Correo baneado");
                  } else {
                    const err = await res.json();
                    toast.error(err.error || "Error al banear");
                  }
                } finally { setBanning(false); }
              }}
            >
              <Lock className="w-3.5 h-3.5 mr-1" /> Banear
            </Button>
          </div>
          {bannedList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No hay correos baneados.</p>
          ) : (
            <div className="space-y-2">
              {bannedList.map((b: any) => (
                <div key={b.id} className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-red-700 truncate">{b.email}</p>
                    {b.reason && <p className="text-xs text-red-400 truncate">{b.reason}</p>}
                    <p className="text-[10px] text-red-300">{new Date(b.bannedAt).toLocaleDateString("es-GT", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-black text-green-600 border-green-300 hover:bg-green-50 shrink-0"
                    onClick={async () => {
                      if (!confirm(`¿Desbanear ${b.email}?`)) return;
                      const res = await fetch(`/api/admin/banned-emails/${b.id}`, { method: "DELETE" });
                      if (res.ok) { setBannedList(prev => prev.filter(x => x.id !== b.id)); toast.success("Correo desbaneado"); }
                      else toast.error("Error al desbanear");
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Desbanear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {editingUser && (
        <Dialog open onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight">Editar Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Nombre</Label>
                <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Apellido</Label>
                <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Email</Label>
                <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl font-bold text-xs uppercase">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold text-xs uppercase">
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {viewingSubs && (
        <Dialog open onOpenChange={() => setViewingSubs(null)}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight">
                Suscripciones de {viewingSubs.firstName || "Usuario"} {viewingSubs.lastName || ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
              {userSubs.length === 0 ? (
                <p className="text-center text-slate-500 py-8 font-bold">Sin suscripciones</p>
              ) : userSubs.map((sub: any) => (
                <div key={sub.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-900 uppercase">{sub.credentialName || sub.productName}</span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      sub.status === "active" ? "bg-green-100 text-green-700" : sub.status === "expired" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {sub.status === "active" ? "Activa" : sub.status === "expired" ? "Expirada" : "Pendiente"}
                    </span>
                  </div>
                  {sub.credentialEmail && (
                    <p className="text-xs text-slate-600">Correo: {sub.credentialEmail}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">Precio: Q{sub.price} | Inicio: {sub.startDate ? formatDate(sub.startDate) : "N/A"}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
    </>
  );
}

function AdminReportsSection() {
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({ queryKey: ["/api/admin/reports"], queryFn: () => fetch("/api/admin/reports", { credentials: "include" }).then(r => r.ok ? r.json() : []) });
  const reports: any[] = Array.isArray(reportsQuery.data) ? reportsQuery.data : [];
  const usersQuery = useQuery({ queryKey: ["/api/admin/users"], queryFn: () => fetch("/api/admin/users", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 5 * 60 * 1000 });
  const allUsers: any[] = Array.isArray(usersQuery.data) ? usersQuery.data : [];
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [subForm, setSubForm] = useState({ credentialEmail: "", credentialPassword: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [reportSubs, setReportSubs] = useState<any[]>([]);
  const [refunding, setRefunding] = useState(false);
  const [refundOrderDialog, setRefundOrderDialog] = useState<any>(null);
  const [refundOrderReason, setRefundOrderReason] = useState("");
  const [refundingOrder, setRefundingOrder] = useState(false);

  const isReportUserSuspended = (userId: string) => allUsers.find((u: any) => u.id === userId)?.suspended ?? false;
  const doReportSuspend = async (userId: string, displayName: string) => {
    const suspended = isReportUserSuspended(userId);
    if (!confirm(suspended ? `¿Reactivar la cuenta de ${displayName}?` : `¿Suspender permanentemente la cuenta de ${displayName}?`)) return;
    const res = await fetch(suspended ? `/api/admin/users/${userId}/unsuspend` : `/api/admin/users/${userId}/suspend`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Cuenta suspendida por el administrador" })
    });
    if (res.ok) { toast({ title: suspended ? "Cuenta reactivada" : "Cuenta suspendida" }); usersQuery.refetch(); }
    else toast({ title: "Error al realizar la acción", variant: "destructive" });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-GT", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatDateShort = (d: string) => new Date(d).toLocaleDateString("es-GT", { year: "numeric", month: "short", day: "numeric" });

  const viewReport = async (report: any) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || "");
    if (report.userId) {
      try {
        const res = await fetch(`/api/admin/users/${report.userId}/subscriptions`);
        const data = await res.json();
        setReportSubs(Array.isArray(data) ? data : []);
      } catch {
        setReportSubs([]);
      }
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast.success(status === "resolved" ? "Reporte resuelto" : "Estado actualizado");
      if (selectedReport?.id === reportId) {
        setSelectedReport((prev: any) => prev ? { ...prev, status, adminNotes } : null);
      }
    } catch {
      toast.error("Error al actualizar reporte");
    }
  };

  const startEditSub = (sub: any) => {
    setEditingSub(sub);
    setSubForm({
      credentialEmail: sub.credentialEmail || "",
      credentialPassword: sub.credentialPassword || "",
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : "",
    });
    setShowPassword(false);
  };

  const saveSub = async () => {
    if (!editingSub) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/subscriptions/${editingSub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subForm),
      });
      toast.success("Suscripcion actualizada");
      setEditingSub(null);
      if (selectedReport?.userId) {
        const res = await fetch(`/api/admin/users/${selectedReport.userId}/subscriptions`);
        const data = await res.json();
        setReportSubs(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm("¿Seguro que quieres eliminar este reporte?")) return;
    try {
      await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast.success("Reporte eliminado");
      if (selectedReport?.id === reportId) setSelectedReport(null);
    } catch {
      toast.error("Error al eliminar reporte");
    }
  };

  const handleRefund = async (reportId: string) => {
    if (!confirm("¿Reembolsar el saldo de esta suscripción al usuario? Esta acción no se puede deshacer.")) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al procesar reembolso"); return; }
      toast.success(`✅ Reembolso de Q${data.refundAmount} procesado. Se notificó al usuario por correo.`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setSelectedReport((prev: any) => prev ? { ...prev, refunded: true, status: "resolved" } : null);
    } catch {
      toast.error("Error al procesar reembolso");
    } finally {
      setRefunding(false);
    }
  };

  const openCount = reports.filter((r: any) => r.status === "open").length;

  return (
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">REPORTES DE PROBLEMAS</h2>
            <p className="text-sm text-muted-foreground">
              {openCount > 0 ? `${openCount} reporte${openCount > 1 ? "s" : ""} pendiente${openCount > 1 ? "s" : ""}` : "Sin reportes pendientes"} | Total: {reports.length}
            </p>
          </div>
          <Button variant="outline" onClick={() => reportsQuery.refetch()} className="rounded-xl font-bold text-xs uppercase">
            <Loader2 className={`w-4 h-4 mr-2 ${reportsQuery.isFetching ? "animate-spin" : ""}`} /> Actualizar
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">No hay reportes de problemas aun.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div key={report.id} className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow cursor-pointer ${report.status === "open" ? "border-indigo-200" : "border-slate-200"}`} onClick={() => viewReport(report)}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.status === "open" ? "bg-indigo-100" : "bg-green-100"}`}>
                    <AlertCircle className={`w-5 h-5 ${report.status === "open" ? "text-indigo-600" : "text-green-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-sm text-slate-900 uppercase tracking-tight">{report.userName}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${report.status === "open" ? "bg-indigo-100 text-indigo-700" : report.status === "resolved" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {report.status === "open" ? "Abierto" : report.status === "resolved" ? "Resuelto" : report.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1 font-medium">
                      Servicio: <span className="font-bold">{report.subscriptionName || "General"}</span>
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{report.description}</p>
                    {report.image && <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 mt-1"><ImageIcon className="w-3 h-3" /> Imagen adjunta</span>}
                    <p className="text-[10px] text-slate-400 mt-1.5">{formatDate(report.createdAt)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }} className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar reporte">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedReport && (
        <Dialog open onOpenChange={() => { setSelectedReport(null); setEditingSub(null); }}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" /> Reporte de {selectedReport.userName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${selectedReport.status === "open" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"}`}>
                    {selectedReport.status === "open" ? "Abierto" : "Resuelto"}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(selectedReport.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1"><span className="font-bold">Email:</span> {selectedReport.userEmail || "N/A"}</p>
                <p className="text-xs text-slate-500 mb-1"><span className="font-bold">Servicio:</span> {selectedReport.subscriptionName || "General"}</p>
                <p className="text-sm text-slate-700 mt-3 bg-white rounded-lg p-3 border border-slate-100">{selectedReport.description}</p>
                {selectedReport.image && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Imagen adjunta:</p>
                    <a href={selectedReport.image} target="_blank" rel="noopener noreferrer">
                      <img src={selectedReport.image} alt="Adjunto" className="max-h-48 rounded-lg border border-slate-200 object-contain hover:opacity-80 transition-opacity" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Notas del admin</Label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 p-3 text-sm resize-none h-20"
                  placeholder="Escribe notas sobre este reporte..."
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedReport.userId && (() => {
                  const susp = isReportUserSuspended(selectedReport.userId);
                  return (
                    <Button onClick={() => doReportSuspend(selectedReport.userId, selectedReport.userName || selectedReport.userEmail || "Usuario")}
                      className={`rounded-xl font-bold text-xs uppercase border-0 ${susp ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}>
                      {susp ? <><CheckCircle2 className="w-4 h-4 mr-1" />Reactivar</> : <><Lock className="w-4 h-4 mr-1" />Suspender cuenta</>}
                    </Button>
                  );
                })()}
                {selectedReport.status === "open" && (
                  <Button onClick={() => updateReportStatus(selectedReport.id, "resolved")} className="rounded-xl font-bold text-xs uppercase bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar Resuelto
                  </Button>
                )}
                {selectedReport.status === "resolved" && (
                  <Button onClick={() => updateReportStatus(selectedReport.id, "open")} variant="outline" className="rounded-xl font-bold text-xs uppercase">
                    Reabrir
                  </Button>
                )}
                {!selectedReport.refunded && (
                  <Button
                    onClick={() => handleRefund(selectedReport.id)}
                    disabled={refunding}
                    className="rounded-xl font-bold text-xs uppercase bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    {refunding ? "Procesando..." : "Reembolsar Saldo"}
                  </Button>
                )}
                {selectedReport.refunded && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-black uppercase border border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reembolso Procesado
                  </span>
                )}
                <Button onClick={() => updateReportStatus(selectedReport.id, selectedReport.status)} variant="outline" className="rounded-xl font-bold text-xs uppercase">
                  <Save className="w-4 h-4 mr-1" /> Guardar Notas
                </Button>
                <Button onClick={() => deleteReport(selectedReport.id)} variant="outline" className="rounded-xl font-bold text-xs uppercase text-red-500 hover:bg-red-50 border-red-200 ml-auto">
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-black text-sm uppercase tracking-tight mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Suscripciones del usuario
                </h3>
                {reportSubs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4 font-bold">Sin suscripciones</p>
                ) : (
                  <div className="space-y-2">
                    {reportSubs.map((sub: any) => (
                      <div key={sub.id} className="bg-white rounded-xl p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-xs text-slate-900 uppercase">{sub.credentialName || sub.productName}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sub.status === "active" ? "bg-green-100 text-green-700" : sub.status === "expired" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {sub.status === "active" ? "Activa" : sub.status === "expired" ? "Expirada" : "Pendiente"}
                            </span>
                            <Button size="sm" variant="outline" className="rounded-lg text-[10px] font-bold h-7 px-2" onClick={() => startEditSub(sub)}>
                              <Edit3 className="w-3 h-3 mr-1" /> Editar
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                          <p><span className="font-bold">Correo:</span> {sub.credentialEmail || "N/A"}</p>
                          <p><span className="font-bold">Precio:</span> Q{sub.price}</p>
                          <p><span className="font-bold">Inicio:</span> {sub.startDate ? formatDateShort(sub.startDate) : "N/A"}</p>
                          <p><span className="font-bold">Vence:</span> {sub.endDate ? formatDateShort(sub.endDate) : "Sin fecha"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingSub && (
        <Dialog open onOpenChange={() => setEditingSub(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight">Editar Suscripcion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Nombre: {editingSub.credentialName || editingSub.productName}</Label>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Correo</Label>
                <Input value={subForm.credentialEmail} onChange={e => setSubForm(f => ({ ...f, credentialEmail: e.target.value }))} className="rounded-xl mt-1" placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Key className="w-3 h-3" /> Contrasena</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={subForm.credentialPassword}
                    onChange={e => setSubForm(f => ({ ...f, credentialPassword: e.target.value }))}
                    className="rounded-xl pr-10"
                    placeholder="Contrasena del servicio"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha de Vencimiento</Label>
                <Input type="date" value={subForm.endDate} onChange={e => setSubForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSub(null)} className="rounded-xl font-bold text-xs uppercase">Cancelar</Button>
              <Button onClick={saveSub} disabled={saving} className="rounded-xl font-bold text-xs uppercase bg-[#6366f1] hover:bg-[#6366f1]/90">
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </Card>
  );
}

function AdminSubscriptionsSection() {
  const subsQuery = useQuery({ queryKey: ["/api/admin/subscriptions"], queryFn: () => fetch("/api/admin/subscriptions", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 0 });
  const usersQuery = useQuery({ queryKey: ["/api/admin/users"], queryFn: () => fetch("/api/admin/users", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 0 });
  const productsQuery = useQuery({ queryKey: ["/api/products"], queryFn: () => fetch("/api/products", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 0 });

  const subs: any[] = Array.isArray(subsQuery.data) ? subsQuery.data : [];
  const allUsers: any[] = Array.isArray(usersQuery.data) ? usersQuery.data : [];
  const allProducts: any[] = Array.isArray(productsQuery.data) ? productsQuery.data : [];

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState("");
  const [newForm, setNewForm] = React.useState({ userId: "", productName: "", productId: "", price: "", status: "active", endDate: "", credentialName: "", credentialEmail: "", credentialPassword: "", credentialInstructions: "" });
  const [editSub, setEditSub] = React.useState<any | null>(null);
  const [editForm, setEditForm] = React.useState({ credentialName: "", credentialEmail: "", credentialPassword: "", credentialInstructions: "", endDate: "", status: "" });
  const [editSaving, setEditSaving] = React.useState(false);
  const [dateSub, setDateSub] = React.useState<any | null>(null);
  const [dateValue, setDateValue] = React.useState("");
  const [dateSaving, setDateSaving] = React.useState(false);

  const openDatePicker = (sub: any) => {
    setDateSub(sub);
    setDateValue(sub.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : "");
  };

  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDateValue(d.toISOString().slice(0, 10));
  };

  const saveDateOnly = async () => {
    if (!dateSub || !dateValue) { toast.error("Selecciona una fecha"); return; }
    setDateSaving(true);
    try {
      const isoDate = new Date(dateValue + "T23:59:59").toISOString();
      const res = await fetch(`/api/admin/subscriptions/${dateSub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endDate: isoDate, status: "active" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.endDate) {
        toast.success(`✅ Fecha guardada — vence ${new Date(data.endDate).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}. Cliente notificado.`);
        setDateSub(null);
        setDateValue("");
        await subsQuery.refetch();
      } else {
        toast.error(`❌ Error: ${data?.error || res.status + " - la fecha NO se guardó"}`);
      }
    } catch (e: any) { toast.error(`Error de conexión: ${e?.message || ""}`); } finally { setDateSaving(false); }
  };

  const filteredUsers = allUsers.filter((u: any) =>
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    ((u.firstName || "") + " " + (u.lastName || "")).toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 6);

  const filtered = subs.filter((s: any) => {
    const matchSearch = !search ||
      (s.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.productName || "").toLowerCase().includes(search.toLowerCase()) ||
      ((s.userFirstName || "") + " " + (s.userLastName || "")).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const renewalRequestsQuery = useQuery({ queryKey: ["/api/admin/renewal-requests"], queryFn: () => fetch("/api/admin/renewal-requests", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 0 });
  const renewalRequests: any[] = Array.isArray(renewalRequestsQuery.data) ? renewalRequestsQuery.data : [];

  const totalActive = subs.filter((s: any) => s.status === "active").length;
  const totalExpired = subs.filter((s: any) => s.status === "expired").length;
  const totalPending = subs.filter((s: any) => s.status === "pending").length;

  const [showProximosPagos, setShowProximosPagos] = React.useState(false);
  const [showVerTodo, setShowVerTodo] = React.useState(false);
  const [verTodoSearch, setVerTodoSearch] = React.useState("");
  const [showRecordar, setShowRecordar] = React.useState(false);
  const [sendingReminders, setSendingReminders] = React.useState(false);

  function getDaysLeft(endDate: string | null): number | null {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  const proximosPagos = subs
    .filter((s: any) => s.status === "active" && s.endDate)
    .map((s: any) => {
      const daysLeft = getDaysLeft(s.endDate);
      const renewal = renewalRequests.find((r: any) => r.subscriptionId === s.id || r.renewalCode === s.renewalCode);
      return { ...s, daysLeft, renewal };
    })
    .filter((s: any) => s.daysLeft !== null && s.daysLeft <= 7)
    .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

  // "Ver Todo" — lista completa ordenada por fecha de vencimiento con estado de renovación
  const verTodoList = subs
    .map((s: any) => {
      const daysLeft = getDaysLeft(s.endDate);
      // Buscar la solicitud de renovación más reciente para esta suscripción
      const subRenewals = renewalRequests
        .filter((r: any) => r.subscriptionId === s.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestRenewal = subRenewals[0] || null;
      return { ...s, daysLeft, latestRenewal };
    })
    .filter((s: any) => {
      if (!verTodoSearch) return true;
      const q = verTodoSearch.toLowerCase();
      return (s.userEmail || "").toLowerCase().includes(q) ||
        (s.productName || "").toLowerCase().includes(q) ||
        ((s.userFirstName || "") + " " + (s.userLastName || "")).toLowerCase().includes(q);
    })
    .sort((a: any, b: any) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });

  function durationText(startDate: string) {
    if (!startDate) return "—";
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoy";
    if (days === 1) return "1 día";
    if (days < 30) return `${days} días`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 mes";
    return `${months} meses`;
  }

  function statusBadge(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      active: { label: "Activa", color: "bg-green-100 text-green-700 border border-green-200" },
      expired: { label: "Expirada", color: "bg-red-100 text-red-700 border border-red-200" },
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
      cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-600 border border-slate-200" },
    };
    const s = map[status] || { label: status, color: "bg-slate-100 text-slate-500 border border-slate-200" };
    return <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${s.color}`}>{s.label}</span>;
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Suscripción eliminada");
        subsQuery.refetch();
      } else {
        toast.error("Error al eliminar");
      }
    } catch { toast.error("Error al eliminar"); } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const openEdit = (sub: any) => {
    setEditSub(sub);
    setEditForm({
      credentialName: sub.credentialName || "",
      credentialEmail: sub.credentialEmail || "",
      credentialPassword: sub.credentialPassword || "",
      credentialInstructions: sub.credentialInstructions || "",
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : "",
      status: sub.status || "active",
    });
  };

  const handleSaveEdit = async () => {
    if (!editSub) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${editSub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success("Suscripción actualizada — se notificó al cliente por correo");
        setEditSub(null);
        subsQuery.refetch();
      } else {
        toast.error("Error al guardar cambios");
      }
    } catch { toast.error("Error al guardar"); } finally { setEditSaving(false); }
  };

  const handleCreate = async () => {
    if (!newForm.userId || !newForm.productName || !newForm.price) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newForm.userId,
          productId: newForm.productId || "manual",
          productName: newForm.productName,
          price: parseFloat(newForm.price) || 0,
          status: newForm.status,
          endDate: newForm.endDate || null,
          credentialName: newForm.credentialName || "",
          credentialEmail: newForm.credentialEmail || "",
          credentialPassword: newForm.credentialPassword || "",
          credentialInstructions: newForm.credentialInstructions || "",
        }),
      });
      if (res.ok) {
        toast.success("Suscripción creada");
        setCreateOpen(false);
        setNewForm({ userId: "", productName: "", productId: "", price: "", status: "active", endDate: "", credentialName: "", credentialEmail: "", credentialPassword: "", credentialInstructions: "" });
        setUserSearch("");
        subsQuery.refetch();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear");
      }
    } catch { toast.error("Error al crear"); } finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Suscripciones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión completa de suscripciones de usuarios</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              if (!confirm("¿Entregar credenciales a TODAS las suscripciones que están 'en proceso'? Se enviará correo a cada usuario.")) return;
              try {
                const res = await fetch("/api/admin/deliver-pending-credentials", { method: "POST", credentials: "include" });
                const data = await res.json();
                if (res.ok) {
                  toast.success(`✅ ${data.delivered} entregadas, ${data.skipped} sin credenciales configuradas`);
                  subsQuery.refetch();
                } else {
                  toast.error(data.error || "Error al entregar credenciales");
                }
              } catch { toast.error("Error de conexión"); }
            }}
            className="rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md"
          >
            <Send className="w-4 h-4 mr-2" /> Entregar Pendientes
          </Button>
          <Button
            onClick={async () => {
              const days = prompt("¿Cuántos días desde la fecha de inicio? (Por ejemplo: 30)", "30");
              if (!days || isNaN(Number(days))) return;
              if (!confirm(`¿Poner fecha de vencimiento (inicio + ${days} días) a TODAS las suscripciones activas que no tengan fecha?`)) return;
              try {
                const res = await fetch("/api/admin/subscriptions/fix-missing-dates", {
                  method: "POST", credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ days: Number(days) }),
                });
                const data = await res.json();
                if (res.ok) {
                  toast.success(`✅ ${data.fixed} suscripciones arregladas con +${data.days} días`);
                  subsQuery.refetch();
                } else {
                  toast.error(data.error || "Error");
                }
              } catch { toast.error("Error de conexión"); }
            }}
            className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <Calendar className="w-4 h-4 mr-2" /> Arreglar TODAS las fechas
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Nueva Suscripción
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 text-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black">{subs.length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-1">Total</p>
        </div>
        <div className="bg-green-500 text-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black">{totalActive}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-green-100 mt-1">Activas</p>
        </div>
        <div className="bg-yellow-400 text-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black">{totalPending}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-100 mt-1">Pendientes</p>
        </div>
        <div className="bg-red-500 text-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black">{totalExpired}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-red-100 mt-1">Expiradas</p>
        </div>
        <button
          onClick={() => setShowProximosPagos(v => !v)}
          className={`rounded-2xl p-4 text-center shadow-sm border-2 transition-all ${proximosPagos.length > 0 ? "bg-indigo-500 text-white border-indigo-600 animate-pulse" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}
        >
          <p className="text-3xl font-black">{proximosPagos.length}</p>
          <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90">Próx. Pagos</p>
        </button>
      </div>

      {/* ===== PANEL PRÓXIMOS PAGOS ===== */}
      {showProximosPagos && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-black text-indigo-800 text-lg">⏰ Próximos Pagos (7 días)</h3>
              <p className="text-xs text-indigo-600 mt-0.5">Suscripciones activas que vencen pronto — verificá si ya renovaron</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecordar(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-colors"
              >
                🔔 Recordar
              </button>
              <button onClick={() => setShowProximosPagos(false)} className="text-indigo-400 hover:text-indigo-700 font-black text-xl leading-none">✕</button>
            </div>
          </div>

          {/* Sub-panel Recordar */}
          {showRecordar && (() => {
            const aRecordar = proximosPagos.filter((s: any) => s.daysLeft >= 1 && s.daysLeft <= 3 && !s.renewal);
            return (
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-indigo-800 text-sm">🔔 Recordatorio masivo — 1 a 3 días</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {aRecordar.length === 0
                        ? "Nadie cumple el criterio (sin renovación, 1-3 días)"
                        : `Se enviará correo a ${aRecordar.length} usuario${aRecordar.length !== 1 ? "s" : ""} que aún no han renovado`}
                    </p>
                  </div>
                  {aRecordar.length > 0 && (
                    <button
                      disabled={sendingReminders}
                      onClick={async () => {
                        if (!confirm(`¿Enviar recordatorio por correo a ${aRecordar.length} usuario${aRecordar.length !== 1 ? "s" : ""}?`)) return;
                        setSendingReminders(true);
                        try {
                          const res = await fetch("/api/admin/subscriptions/send-reminders", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ days: 3 }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            toast.success(`✅ Recordatorios enviados: ${data.sent} correo${data.sent !== 1 ? "s" : ""} enviado${data.sent !== 1 ? "s" : ""}${data.errors > 0 ? ` (${data.errors} errores)` : ""}`);
                            setShowRecordar(false);
                          } else {
                            toast.error(data.error || "Error al enviar");
                          }
                        } catch { toast.error("Error de conexión"); }
                        finally { setSendingReminders(false); }
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-black transition-colors"
                    >
                      {sendingReminders ? "Enviando..." : `📧 Enviar a todos (${aRecordar.length})`}
                    </button>
                  )}
                </div>
                {aRecordar.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {aRecordar.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-indigo-100 shadow-sm">
                        {s.productImage && <img src={s.productImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-indigo-100" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{s.userFirstName || ""} {s.userLastName || ""}</p>
                          <p className="text-xs text-slate-500 truncate">{s.userEmail} · {s.productName}</p>
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">⏰ Vence en {s.daysLeft} día{s.daysLeft !== 1 ? "s" : ""}</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/admin/subscriptions/send-reminder-single", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ subscriptionId: s.id }),
                              });
                              const data = await res.json();
                              if (res.ok) toast.success(`📧 Correo enviado a ${s.userEmail}`);
                              else toast.error(data.error || "Error al enviar");
                            } catch { toast.error("Error de conexión"); }
                          }}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-colors shadow-sm"
                        >
                          📧 Enviar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {proximosPagos.length === 0 ? (
            <p className="text-center text-indigo-400 py-6 font-bold text-sm">✅ Ninguna suscripción vence en los próximos 7 días</p>
          ) : (
            <div className="space-y-2">
              {proximosPagos.map((s: any) => {
                const isExpired = s.daysLeft <= 0;
                const isUrgent = s.daysLeft >= 1 && s.daysLeft <= 2;
                const isWarning = s.daysLeft >= 3 && s.daysLeft <= 5;

                let rowBg = "bg-white border border-indigo-100";
                if (isExpired) rowBg = "bg-red-50 border border-red-300";
                else if (isUrgent) rowBg = "bg-indigo-50 border border-indigo-300";
                else if (isWarning) rowBg = "bg-yellow-50 border border-yellow-200";

                let daysLabel = "";
                if (isExpired) daysLabel = s.daysLeft === 0 ? "🔴 Vence HOY" : `🔴 Venció hace ${Math.abs(s.daysLeft)} día${Math.abs(s.daysLeft) !== 1 ? "s" : ""}`;
                else if (isUrgent) daysLabel = `🟠 ${s.daysLeft} día${s.daysLeft !== 1 ? "s" : ""}`;
                else daysLabel = `🟡 ${s.daysLeft} días`;

                let renewalBadge = null;
                if (s.renewal) {
                  if (s.renewal.status === "approved") {
                    renewalBadge = <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-green-100 text-green-700 border border-green-200">✅ Ya renovó</span>;
                  } else if (s.renewal.status === "pending") {
                    renewalBadge = <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">🕐 Renovación pendiente</span>;
                  } else {
                    renewalBadge = <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">Solicitud: {s.renewal.status}</span>;
                  }
                } else {
                  renewalBadge = <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200">⚠ Sin renovar</span>;
                }

                return (
                  <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ${rowBg}`}>
                    {s.productImage && (
                      <img src={s.productImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-800 truncate">{s.userFirstName || ""} {s.userLastName || ""}</p>
                      <p className="text-xs text-slate-500 truncate">{s.userEmail} · {s.productName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-black text-slate-700">{daysLabel}</span>
                      {renewalBadge}
                      <span className="text-xs text-slate-400">{s.endDate ? new Date(s.endDate).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/admin/subscriptions/send-reminder-single", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ subscriptionId: s.id }),
                            });
                            const data = await res.json();
                            if (res.ok) toast.success(`📧 Correo enviado a ${s.userEmail}`);
                            else toast.error(data.error || "Error al enviar");
                          } catch { toast.error("Error de conexión"); }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-colors shadow-sm"
                      >
                        📧 Recordar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== PANEL VER TODO ===== */}
      <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowVerTodo(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div className="text-left">
              <p className="font-black text-slate-800 text-sm">VER TODO — Estado de Pagos y Renovaciones</p>
              <p className="text-xs text-slate-500">Todos los usuarios con fecha de vencimiento, si renovaron o no y cuándo</p>
            </div>
          </div>
          <span className="text-slate-400 font-black text-lg">{showVerTodo ? "▲" : "▼"}</span>
        </button>

        {showVerTodo && (
          <div className="border-t-2 border-slate-200 p-5 space-y-3 bg-white">
            <Input
              value={verTodoSearch}
              onChange={e => setVerTodoSearch(e.target.value)}
              placeholder="Buscar por usuario o producto..."
              className="rounded-xl h-10 border-slate-200 text-sm"
            />

            {verTodoList.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm font-bold">Sin resultados</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {verTodoList.map((s: any) => {
                  const expired = s.daysLeft !== null && s.daysLeft <= 0;
                  const endFmt = s.endDate
                    ? new Date(s.endDate).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })
                    : "—";

                  // Badge de días
                  let daysBadge = null;
                  if (s.daysLeft === null) {
                    daysBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">Sin fecha</span>;
                  } else if (s.daysLeft <= 0) {
                    daysBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-300">Venció hace {Math.abs(s.daysLeft)} día{Math.abs(s.daysLeft) !== 1 ? "s" : ""}</span>;
                  } else if (s.daysLeft <= 3) {
                    daysBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-300">Vence en {s.daysLeft} día{s.daysLeft !== 1 ? "s" : ""}</span>;
                  } else if (s.daysLeft <= 7) {
                    daysBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200">Vence en {s.daysLeft} días</span>;
                  } else {
                    daysBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-green-100 text-green-700 border border-green-200">{s.daysLeft} días restantes</span>;
                  }

                  // Badge de renovación
                  let renewBadge = null;
                  if (s.latestRenewal) {
                    const renewDate = new Date(s.latestRenewal.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
                    if (s.latestRenewal.status === "approved") {
                      renewBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-green-100 text-green-700 border border-green-200">✅ Renovó el {renewDate}</span>;
                    } else if (s.latestRenewal.status === "pending") {
                      renewBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">🕐 Solicitó renovar el {renewDate} — pendiente</span>;
                    } else {
                      renewBadge = <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">Solicitud rechazada ({renewDate})</span>;
                    }
                  } else {
                    renewBadge = expired
                      ? <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-300">⚠ No renovó</span>
                      : <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">Sin solicitud</span>;
                  }

                  return (
                    <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 border ${expired ? "bg-red-50 border-red-200" : "bg-white border-slate-100"}`}>
                      {s.productImage && (
                        <img src={s.productImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-800 truncate">
                          {s.userFirstName || ""} {s.userLastName || ""}
                          <span className="font-normal text-slate-400 ml-2 text-xs">{s.userEmail}</span>
                        </p>
                        <p className="text-xs text-slate-500 truncate">{s.productName} · Vence: <strong className="text-slate-700">{endFmt}</strong></p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 flex-shrink-0 items-center">
                        {daysBadge}
                        {renewBadge}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario o producto..."
            className="rounded-xl h-11 border-slate-200"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "pending", "expired", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${statusFilter === s ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
              {s === "all" ? "Todos" : s === "active" ? "Activas" : s === "pending" ? "Pendientes" : s === "expired" ? "Expiradas" : "Canceladas"}
            </button>
          ))}
        </div>
      </div>

      {subsQuery.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-bold">No hay suscripciones</p>
          <p className="text-sm mt-1">Crea una nueva o ajusta los filtros</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Usuario</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Producto</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Estado</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Desde</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Duración</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Vence</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600">Renovó</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-slate-600 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub: any) => {
                const subRenewals = renewalRequests
                  .filter((r: any) => r.subscriptionId === sub.id)
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const latestRenewal = subRenewals[0] || null;
                return (
                <TableRow key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sub.userProfileImage ? (
                        <img src={sub.userProfileImage} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-slate-800 leading-tight">
                          {sub.userFirstName ? `${sub.userFirstName} ${sub.userLastName || ""}`.trim() : "Usuario"}
                        </p>
                        <p className="text-xs text-slate-500 leading-tight">{sub.userEmail || sub.userId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sub.productImage && <img src={sub.productImage} className="w-8 h-8 rounded-lg object-cover border border-slate-100" alt="" />}
                      <div>
                        <p className="font-bold text-sm text-slate-800">{sub.productName}</p>
                        <p className="text-xs text-slate-500">Q{sub.price}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(sub.status)}</TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-600">
                      {sub.startDate ? new Date(sub.startDate).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-bold text-slate-700">{durationText(sub.startDate)}</p>
                  </TableCell>
                  <TableCell>
                    {sub.endDate ? (
                      <button
                        type="button"
                        onClick={() => openDatePicker(sub)}
                        className="text-sm text-slate-600 hover:text-indigo-600 hover:underline font-bold flex items-center gap-1"
                        title="Cambiar fecha"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(sub.endDate).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openDatePicker(sub)}
                        className="rounded-xl text-[10px] font-black uppercase h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                      >
                        <Calendar className="w-3 h-3 mr-1" /> Programar
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {latestRenewal ? (
                      latestRenewal.status === "approved" ? (
                        <div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-green-100 text-green-700 border border-green-200 block mb-1">✅ Renovó</span>
                          <span className="text-[10px] font-bold text-slate-600 block">
                            📅 {new Date(latestRenewal.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 block">
                            🕐 {new Date(latestRenewal.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                          {latestRenewal.months && (
                            <span className="text-[10px] font-bold text-blue-600 block">
                              📦 {latestRenewal.months} mes{latestRenewal.months > 1 ? "es" : ""}
                            </span>
                          )}
                          {sub.endDate && (
                            <span className="text-[10px] font-bold text-green-700 block">
                              Vence: {new Date(sub.endDate).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      ) : latestRenewal.status === "pending" ? (
                        <div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 block mb-1">🕐 Pendiente</span>
                          <span className="text-[10px] text-slate-500 block">
                            📅 {new Date(latestRenewal.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            🕐 {new Date(latestRenewal.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 block mb-1">❌ Rechazada</span>
                          <span className="text-[10px] text-slate-400 block">
                            📅 {new Date(latestRenewal.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )
                    ) : (
                      sub.status === "expired"
                        ? <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-600 border border-red-200">⚠ No renovó</span>
                        : <span className="text-[10px] text-slate-400 px-2">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`¿Forzar que TODAS las suscripciones de ${sub.userEmail || "este usuario"} aparezcan en su perfil + reenviar correo?`)) return;
                          try {
                            const res = await fetch(`/api/admin/users/${sub.userId}/resync-subscriptions`, {
                              method: "POST", credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ days: 30 }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              toast.success(`✅ ${data.refreshed} suscripciones reenviadas a ${data.email} (${data.updated} corregidas)`);
                              subsQuery.refetch();
                            } else { toast.error(data.error || "Error"); }
                          } catch { toast.error("Error de conexión"); }
                        }}
                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold"
                        title="Reenviar suscripciones al cliente (forzar que aparezcan en su perfil + correo)"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(sub)}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl font-bold">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(sub.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ); })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!dateSub} onOpenChange={open => !open && !dateSaving && setDateSub(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" /> Programar Fecha de Vencimiento
            </DialogTitle>
            {dateSub && (
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-bold">{dateSub.productName}</span> — {dateSub.userFirstName || ""} {dateSub.userLastName || ""}
                <br /><span className="text-xs text-slate-400">{dateSub.userEmail}</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            {dateSub?.startDate && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inicio de la suscripción</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {new Date(dateSub.startDate).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Atajos rápidos</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { d: 7, l: "1 semana" },
                  { d: 30, l: "1 mes" },
                  { d: 60, l: "2 meses" },
                  { d: 90, l: "3 meses" },
                  { d: 180, l: "6 meses" },
                  { d: 365, l: "1 año" },
                ].map(p => (
                  <button
                    key={p.d}
                    type="button"
                    onClick={() => setPresetDays(p.d)}
                    className="rounded-xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 px-2 py-2 text-[11px] font-black uppercase text-slate-600 hover:text-amber-600 transition-all"
                  >
                    +{p.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Fecha exacta de vencimiento</Label>
              <Input value={dateValue} onChange={e => setDateValue(e.target.value)} type="date" className="rounded-xl h-12 mt-1 font-bold text-base" />
              {dateValue && (
                <p className="text-xs text-amber-700 mt-2 font-bold">
                  📅 Vence el <span className="uppercase">{new Date(dateValue).toLocaleDateString("es-GT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Mail className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-bold">El cliente recibirá un correo con la nueva fecha y verá el contador en su perfil.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDateSub(null)} disabled={dateSaving} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={saveDateOnly} disabled={dateSaving || !dateValue} className="rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white">
              {dateSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Guardar y Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black text-red-600">Eliminar Suscripción</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">Esta acción eliminará la suscripción del usuario y desaparecerá de su perfil. ¿Confirmas?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleDelete} disabled={deleting} className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar Suscripción ── */}
      <Dialog open={!!editSub} onOpenChange={open => !open && setEditSub(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-600" /> Editar Suscripción
            </DialogTitle>
            {editSub && (
              <p className="text-sm text-slate-500 mt-1">
                {editSub.productName} — {editSub.userFirstName || ""} {editSub.userLastName || ""} <span className="text-xs text-slate-400">({editSub.userEmail})</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre del perfil / cuenta</Label>
                <Input value={editForm.credentialName} onChange={e => setEditForm(f => ({ ...f, credentialName: e.target.value }))} placeholder="Ej: Perfil 1" className="rounded-xl h-11 mt-1" />
              </div>
              <div>
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Correo de acceso</Label>
                <Input value={editForm.credentialEmail} onChange={e => setEditForm(f => ({ ...f, credentialEmail: e.target.value }))} type="email" placeholder="correo@ejemplo.com" className="rounded-xl h-11 mt-1" />
              </div>
              <div>
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                <Input value={editForm.credentialPassword} onChange={e => setEditForm(f => ({ ...f, credentialPassword: e.target.value }))} placeholder="••••••••" className="rounded-xl h-11 mt-1" />
              </div>
              <div>
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Estado</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-xl h-11 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Fecha de vencimiento</Label>
                <Input value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} type="date" className="rounded-xl h-11 mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Instrucciones adicionales</Label>
                <textarea value={editForm.credentialInstructions} onChange={e => setEditForm(f => ({ ...f, credentialInstructions: e.target.value }))} placeholder="Pasos de acceso, notas para el cliente..." rows={3}
                  className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-xs text-indigo-700 font-bold">Al guardar, el cliente recibirá automáticamente un correo con sus datos actualizados.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditSub(null)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Guardar y Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight">Nueva Suscripción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Buscar Usuario</Label>
              <Input
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setNewForm(f => ({ ...f, userId: "" })); }}
                placeholder="Nombre o email del usuario..."
                className="rounded-xl h-11 mt-1"
              />
              {userSearch && !newForm.userId && filteredUsers.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {filteredUsers.map((u: any) => (
                    <button key={u.id} type="button" onClick={() => {
                      setNewForm(f => ({ ...f, userId: u.id }));
                      setUserSearch((u.email || `${u.firstName || ""} ${u.lastName || ""}`.trim()) || u.id);
                    }} className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 flex items-center gap-2 border-b border-slate-100 last:border-0 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{`${u.firstName || ""} ${u.lastName || ""}`.trim() || "Sin nombre"}</p>
                        <p className="text-xs text-slate-500">{u.email || u.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {newForm.userId && (
                <p className="text-xs text-indigo-600 font-bold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Usuario seleccionado: {newForm.userId.slice(0, 12)}...
                </p>
              )}
            </div>

            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Producto</Label>
              <Select onValueChange={v => {
                const prod = allProducts.find((p: any) => p.id === v);
                setNewForm(f => ({ ...f, productId: v, productName: prod?.name || v, price: String(prod?.price || "") }));
              }}>
                <SelectTrigger className="rounded-xl h-11 mt-1">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — Q{p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Precio (Q)</Label>
                <Input value={newForm.price} onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))} type="number" step="0.01" min="0" placeholder="0.00" className="rounded-xl h-11 mt-1" />
              </div>
              <div>
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Estado</Label>
                <Select value={newForm.status} onValueChange={v => setNewForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-xl h-11 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Fecha de Vencimiento (opcional)</Label>
              <Input value={newForm.endDate} onChange={e => setNewForm(f => ({ ...f, endDate: e.target.value }))} type="date" className="rounded-xl h-11 mt-1" />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Credenciales de acceso</p>
              <div className="space-y-3">
                <div>
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre del perfil / cuenta</Label>
                  <Input value={newForm.credentialName} onChange={e => setNewForm(f => ({ ...f, credentialName: e.target.value }))} placeholder="Ej: Perfil 1" className="rounded-xl h-11 mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Correo de acceso</Label>
                    <Input value={newForm.credentialEmail} onChange={e => setNewForm(f => ({ ...f, credentialEmail: e.target.value }))} type="email" placeholder="correo@ejemplo.com" className="rounded-xl h-11 mt-1" />
                  </div>
                  <div>
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                    <Input value={newForm.credentialPassword} onChange={e => setNewForm(f => ({ ...f, credentialPassword: e.target.value }))} placeholder="••••••••" className="rounded-xl h-11 mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Instrucciones (opcional)</Label>
                  <textarea value={newForm.credentialInstructions} onChange={e => setNewForm(f => ({ ...f, credentialInstructions: e.target.value }))} placeholder="Pasos de acceso, notas..." rows={2}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Crear Suscripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminDiscountCodesSection() {
  const codesQuery = useQuery({ queryKey: ["/api/admin/discount-codes"], queryFn: () => fetch("/api/admin/discount-codes", { credentials: "include" }).then(r => r.ok ? r.json() : []), staleTime: 0 });
  const codes: any[] = Array.isArray(codesQuery.data) ? codesQuery.data : [];
  const [form, setForm] = React.useState({ code: "", discountType: "percentage", discountValue: "", description: "", maxUses: "" });
  const [saving, setSaving] = React.useState(false);

  const createCode = async () => {
    if (!form.code.trim() || !form.discountValue) { toast.error("Ingresa el código y el valor de descuento"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase().trim() }),
      });
      if (res.ok) {
        toast.success("Código creado correctamente");
        setForm({ code: "", discountType: "percentage", discountValue: "", description: "", maxUses: "" });
        codesQuery.refetch();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear código");
      }
    } catch { toast.error("Error al crear código"); } finally { setSaving(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      await fetch(`/api/admin/discount-codes/${id}/toggle`, { method: "PATCH" });
      codesQuery.refetch();
    } catch { toast.error("Error al actualizar"); }
  };

  const deleteCode = async (id: string, code: string) => {
    if (!confirm(`¿Eliminar el código "${code}"?`)) return;
    try {
      await fetch(`/api/admin/discount-codes/${id}`, { method: "DELETE" });
      toast.success("Código eliminado");
      codesQuery.refetch();
    } catch { toast.error("Error al eliminar"); }
  };

  return (
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">CÓDIGOS DE DESCUENTO</h2>
            <p className="text-slate-500 font-bold italic text-sm mt-1">Crea códigos que los usuarios pueden aplicar en el checkout para obtener descuentos.</p>
          </div>
          <Button variant="outline" onClick={() => codesQuery.refetch()} className="rounded-xl font-bold text-xs uppercase">
            <Loader2 className={`w-4 h-4 mr-2 ${codesQuery.isFetching ? "animate-spin" : ""}`} /> Actualizar
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="font-black text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" /> Crear Nuevo Código
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Código</Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Ej: VERANO20"
                className="rounded-xl mt-1 font-mono font-bold uppercase"
                maxLength={20}
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo de Descuento</Label>
              <select
                value={form.discountType}
                onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 h-10 text-sm mt-1 bg-white"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (Q)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {form.discountType === "percentage" ? "Descuento (%)" : "Monto a descontar (Q)"}
              </Label>
              <Input
                type="number"
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === "percentage" ? "Ej: 20" : "Ej: 50"}
                min={1}
                max={form.discountType === "percentage" ? 100 : undefined}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Descripción (opcional)</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Descuento de verano"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Máximo de usos (vacío = ilimitado)</Label>
              <Input
                type="number"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Sin límite"
                min={1}
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <Button onClick={createCode} disabled={saving} className="bg-[#6366f1] hover:bg-[#6366f1]/90 rounded-xl font-bold text-xs uppercase h-10 px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {saving ? "Creando..." : "Crear Código"}
          </Button>
        </div>

        {codes.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">No hay códigos creados aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((dc: any) => (
              <div key={dc.id} className={`bg-white rounded-2xl border-2 ${dc.isActive ? "border-slate-100" : "border-slate-100 opacity-60"} p-4 flex items-center gap-4`}>
                <div className={`px-4 py-2 rounded-xl font-mono font-black text-lg tracking-widest ${dc.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500"}`}>
                  {dc.code}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${dc.discountType === "percentage" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {dc.discountType === "percentage" ? `${dc.discountValue}% OFF` : `Q${dc.discountValue} OFF`}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${dc.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                      {dc.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {dc.description && <p className="text-xs text-slate-500 font-medium">{dc.description}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Usos: <span className="font-bold text-slate-600">{dc.usedCount}</span>
                    {dc.maxUses && <> / {dc.maxUses}</>}
                    {" · "}Creado: {new Date(dc.createdAt).toLocaleDateString("es-GT")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleCode(dc.id)}
                    className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-colors ${dc.isActive ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                  >
                    {dc.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => deleteCode(dc.id, dc.code)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminClientMessagesSection() {
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [replyInput, setReplyInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [clientImgUploading, setClientImgUploading] = React.useState(false);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const selectedUserIdRef = React.useRef<string | null>(null);
  const prevMsgCountRef = React.useRef(0);
  const clientImgRef = React.useRef<HTMLInputElement>(null);

  // Agentes
  const [agents, setAgents] = React.useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = React.useState<any | null>(null);
  const [showAgentPicker, setShowAgentPicker] = React.useState(false);
  const [showNewAgent, setShowNewAgent] = React.useState(false);
  const [newAgentName, setNewAgentName] = React.useState("");
  const [newAgentFile, setNewAgentFile] = React.useState<File | null>(null);
  const [savingAgent, setSavingAgent] = React.useState(false);
  const agentFileRef = React.useRef<HTMLInputElement>(null);

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/admin/support-agents");
      if (res.ok) setAgents(await res.json());
    } catch {}
  };

  const scrollChatToBottom = (force = false) => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (force || isNearBottom) el.scrollTop = el.scrollHeight;
  };

  const loadConversations = async (forceScroll = false) => {
    try {
      const res = await fetch("/api/admin/client-messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (selectedUserIdRef.current) {
          const updated = data.find((c: any) => c.userId === selectedUserIdRef.current);
          if (updated) {
            const newCount = updated.messages?.length ?? 0;
            const hasNewMsgs = newCount > prevMsgCountRef.current;
            prevMsgCountRef.current = newCount;
            setSelected(updated);
            if (forceScroll) setTimeout(() => scrollChatToBottom(true), 50);
            else if (hasNewMsgs) setTimeout(() => scrollChatToBottom(false), 50);
          }
        }
      }
    } catch {}
  };

  React.useEffect(() => {
    loadConversations();
    loadAgents();
    const iv = setInterval(() => loadConversations(false), 5000);
    return () => clearInterval(iv);
  }, []);

  const openConversation = async (conv: any) => {
    selectedUserIdRef.current = conv.userId;
    prevMsgCountRef.current = conv.messages?.length ?? 0;
    setSelected(conv);
    setReplyInput("");
    setShowAgentPicker(false);
    await fetch("/api/admin/client-messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: conv.userId }),
    });
    await loadConversations(true);
  };

  const sendReply = async (imageUrl?: string) => {
    if (!imageUrl && !replyInput.trim()) return;
    if (!selected) return;
    const msgText = replyInput.trim();
    if (!imageUrl) setReplyInput("");
    const optimistic = {
      id: `opt-${Date.now()}`,
      isAdmin: true,
      message: imageUrl ? "" : msgText,
      imageUrl: imageUrl || "",
      agentName: selectedAgent?.name || "Soporte",
      agentImage: selectedAgent?.image || "",
      createdAt: new Date().toISOString(),
    };
    setSelected((prev: any) => prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev);
    setTimeout(() => scrollChatToBottom(false), 30);
    setSending(true);
    try {
      const res = await fetch("/api/admin/client-messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.userId,
          userName: selected.userName,
          userEmail: selected.userEmail,
          message: imageUrl ? "" : msgText,
          imageUrl: imageUrl || "",
          agentName: selectedAgent?.name || "",
          agentImage: selectedAgent?.image || "",
        }),
      });
      if (res.ok) {
        await loadConversations(true);
      }
    } catch {}
    setSending(false);
  };

  const handleClientImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setClientImgUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        await sendReply(data.url);
      }
    } catch {}
    setClientImgUploading(false);
    if (clientImgRef.current) clientImgRef.current.value = "";
  };

  const saveNewAgent = async () => {
    if (!newAgentName.trim()) return;
    setSavingAgent(true);
    try {
      const fd = new FormData();
      fd.append("name", newAgentName.trim());
      if (newAgentFile) fd.append("image", newAgentFile);
      const res = await fetch("/api/admin/support-agents", { method: "POST", body: fd });
      if (res.ok) {
        setNewAgentName("");
        setNewAgentFile(null);
        setShowNewAgent(false);
        await loadAgents();
        toast.success("Agente creado");
      }
    } catch {}
    setSavingAgent(false);
  };

  const deleteAgent = async (id: string) => {
    await fetch(`/api/admin/support-agents/${id}`, { method: "DELETE" });
    if (selectedAgent?.id === id) setSelectedAgent(null);
    await loadAgents();
  };

  return (
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">MIS CLIENTES</h2>
            <p className="text-slate-500 text-sm mt-1">Mensajes directos de tus clientes</p>
          </div>
        </div>
        <div className="flex gap-4 h-[540px]">
          {/* Lista de conversaciones */}
          <div className="w-64 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-6 text-center">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <p className="text-xs font-bold uppercase">Sin mensajes aún</p>
              </div>
            )}
            {conversations.map((conv: any) => (
              <button
                key={conv.userId}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors hover:bg-blue-50/50 ${selected?.userId === conv.userId ? "bg-blue-50 border-l-2 border-l-[#6366f1]" : ""}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-black text-sm text-slate-900 truncate">{conv.userName}</span>
                  {conv.unread > 0 && (
                    <span className="bg-[#6366f1] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shrink-0">{conv.unread}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">{conv.userEmail}</p>
              </button>
            ))}
          </div>

          {/* Panel de chat */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <MessageSquare className="w-10 h-10 opacity-20" />
                <p className="text-sm font-bold uppercase">Selecciona una conversación</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="font-black text-sm text-slate-900 uppercase">{selected.userName}</p>
                  <p className="text-xs text-slate-400">{selected.userEmail}</p>
                </div>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selected.messages?.map((m: any) => (
                    <div key={m.id} className={`flex items-end gap-2 ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                      {m.isAdmin && m.agentImage && (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 order-2 border-2 border-white shadow-md">
                          <img src={m.agentImage} alt={m.agentName} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className={`max-w-[72%] rounded-2xl overflow-hidden shadow-sm ${
                        m.isAdmin ? "bg-[#6366f1] text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"
                      }`}>
                        {m.imageUrl ? (
                          <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img src={m.imageUrl} alt="imagen" className="max-w-full max-h-48 object-cover" />
                          </a>
                        ) : (
                          <div className="px-4 py-2.5 text-sm font-medium">
                            {!m.isAdmin && <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{selected.userName}</p>}
                            {m.isAdmin && <p className="text-[10px] font-black text-blue-200 uppercase mb-1">{m.agentName || "Soporte"}</p>}
                            <p className="leading-snug">{m.message}</p>
                          </div>
                        )}
                        <p className={`text-[9px] pb-2 px-3 ${m.isAdmin ? "text-blue-200" : "text-slate-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selector de agente desplegable */}
                {showAgentPicker && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Seleccionar agente de soporte</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {agents.map((a: any) => (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedAgent(selectedAgent?.id === a.id ? null : a); setShowAgentPicker(false); }}
                          className={`flex flex-col items-center gap-1 group relative`}
                        >
                          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${selectedAgent?.id === a.id ? "border-[#6366f1] scale-110" : "border-slate-200 hover:border-slate-400"}`}>
                            {a.image ? <img src={a.image} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center font-black text-slate-500">{a.name[0]}</div>}
                          </div>
                          <span className="text-[10px] font-black text-slate-600 uppercase">{a.name}</span>
                          <button
                            onClick={e => { e.stopPropagation(); deleteAgent(a.id); }}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white hidden group-hover:flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </button>
                      ))}
                      {/* Botón crear nuevo agente */}
                      <button
                        onClick={() => setShowNewAgent(!showNewAgent)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-[#6366f1] hover:bg-blue-50 transition-all">
                          <Plus className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Nuevo</span>
                      </button>
                    </div>

                    {/* Formulario nuevo agente */}
                    {showNewAgent && (
                      <div className="mt-3 flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
                        <div
                          className="w-10 h-10 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#6366f1] shrink-0"
                          onClick={() => agentFileRef.current?.click()}
                        >
                          {newAgentFile ? <img src={URL.createObjectURL(newAgentFile)} alt="" className="w-full h-full object-cover" /> : <Camera className="w-4 h-4 text-slate-400" />}
                        </div>
                        <input ref={agentFileRef} type="file" accept="image/*" className="hidden" onChange={e => setNewAgentFile(e.target.files?.[0] || null)} />
                        <input
                          value={newAgentName}
                          onChange={e => setNewAgentName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveNewAgent(); }}
                          placeholder="Nombre del agente..."
                          className="flex-1 text-sm border-none outline-none bg-transparent"
                        />
                        <button onClick={saveNewAgent} disabled={savingAgent || !newAgentName.trim()} className="bg-[#6366f1] text-white rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setShowNewAgent(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 border-t border-slate-100 flex gap-2 items-center">
                  <input
                    ref={clientImgRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleClientImageUpload}
                  />
                  {/* Botón selector de agente */}
                  <button
                    onClick={() => setShowAgentPicker(!showAgentPicker)}
                    title="Seleccionar agente"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 overflow-hidden ${showAgentPicker ? "border-[#6366f1] bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                  >
                    {selectedAgent?.image ? (
                      <img src={selectedAgent.image} alt="" className="w-full h-full object-cover" />
                    ) : selectedAgent ? (
                      <span className="text-xs font-black text-[#6366f1]">{selectedAgent.name[0]}</span>
                    ) : (
                      <Users className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {/* Botón cámara */}
                  <button
                    onClick={() => clientImgRef.current?.click()}
                    disabled={clientImgUploading || sending}
                    title="Enviar imagen"
                    className="text-slate-400 hover:text-[#6366f1] transition-colors p-2 rounded-xl hover:bg-blue-50 shrink-0"
                  >
                    {clientImgUploading ? (
                      <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={replyInput}
                    onChange={e => {
                      setReplyInput(e.target.value);
                      if (selected?.userId) {
                        const agentName = selectedAgent?.name || "Soporte";
                        const agentImage = selectedAgent?.image || "";
                        fetch(`/api/typing/client/${selected.userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentImage, agentName }) }).catch(() => {});
                      }
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder={selectedAgent ? `Responder como ${selectedAgent.name}...` : "Escribe tu respuesta..."}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
                    disabled={sending}
                  />
                  <button
                    onClick={() => sendReply()}
                    disabled={sending || (!replyInput.trim() && !clientImgUploading)}
                    className="bg-[#6366f1] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl px-4 py-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralSaldosSection() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [filtered, setFiltered] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any>(null);
  const [action, setAction] = React.useState<"add" | "deduct">("add");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const totalBalance = users.reduce((s, u) => s + (u.referralBalance || 0), 0);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/referral/user-balances")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        setFiltered(list);
      })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  React.useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.lastName || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      String(u.id).includes(q)
    ));
  }, [search, users]);

  const openModal = (u: any) => {
    setSelected(u);
    setAction("add");
    setAmount("");
    setReason("");
  };

  const closeModal = () => { setSelected(null); };

  const handleSave = async () => {
    if (!selected || !amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/referral/adjust-user-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, amount, action, reason }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "add" ? "Saldo de referido agregado" : "Saldo descontado");
      closeModal();
      load();
    } catch {
      toast.error("Error al ajustar saldo");
    } finally {
      setSaving(false);
    }
  };

  const timeSince = (date: string | null) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Hoy";
    return `Hace ${d} d`;
  };

  const initials = (u: any) => {
    const name = `${u.firstName || u.username || "?"}`;
    return name.slice(0, 1).toUpperCase();
  };

  return (
    <>
      <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  Saldos Activos
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                    En vivo
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {users.length} usuario{users.length !== 1 ? "s" : ""} · <span className="font-bold text-green-700">Q{totalBalance.toFixed(0)}</span> en total
                </p>
              </div>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-input bg-background text-sm font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar ahora
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o ID..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-green-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-semibold">
              {search ? "Sin resultados para esa búsqueda" : "Ningún usuario tiene saldo de referido aún"}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto rounded-xl border border-slate-100 bg-white">
              {filtered.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {initials(u)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase tracking-tight truncate">
                      {u.firstName || ""} {u.lastName || u.username || ""}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <span>✉</span> {u.email || "sin correo"}
                    </p>
                    <p className="text-xs text-muted-foreground">Último movimiento: {timeSince(u.lastMovement)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-3">
                    <p className="text-xl font-black text-green-600">Q{(u.referralBalance || 0).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">+Q{(u.totalAdded || 0).toFixed(0)} total acumulado</p>
                  </div>
                  <button
                    onClick={() => openModal(u)}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex-shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Ajustar
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal Ajustar Saldo ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight mb-5">Ajustar Saldo</h3>

            {/* User info */}
            <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Usuario</p>
              <p className="font-black">{selected.firstName || ""} {selected.lastName || selected.username || ""}</p>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
              <p className="text-base font-black text-green-600 mt-1">Saldo actual: Q{(selected.referralBalance || 0).toFixed(0)}</p>
            </div>

            {/* Add / Deduct toggle */}
            <div className="flex rounded-xl overflow-hidden border border-input mb-5">
              <button
                onClick={() => setAction("add")}
                className="flex-1 py-2.5 text-sm font-black uppercase tracking-wider transition-all"
                style={{ background: action === "add" ? "#16a34a" : "transparent", color: action === "add" ? "white" : "#6b7280" }}
              >
                + Agregar
              </button>
              <button
                onClick={() => setAction("deduct")}
                className="flex-1 py-2.5 text-sm font-black uppercase tracking-wider transition-all"
                style={{ background: action === "deduct" ? "#dc2626" : "transparent", color: action === "deduct" ? "white" : "#6b7280" }}
              >
                - Descontar
              </button>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Monto (Q)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-green-600">Q</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-input bg-background pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Razón (opcional)</label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ajuste manual..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-input bg-background text-sm font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !amount}
                className="flex-1 py-3 rounded-xl text-white text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: action === "add" ? "#16a34a" : "#dc2626" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {action === "add" ? "Agregar saldo" : "Descontar saldo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReferralAdminSection() {
  const [program, setProgram] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    isActive: false,
    title: "Programa de Referidos",
    description: "Comparte tu link y gana saldo por cada amigo que se registre o compre",
    registerBonus: "1",
    purchaseBonus: "4",
  });

  React.useEffect(() => {
    Promise.all([
      fetch("/api/referral/program").then(r => r.json()),
      fetch("/api/admin/referral/stats").then(r => r.json()),
    ]).then(([prog, st]) => {
      if (prog) {
        setProgram(prog);
        setForm({
          isActive: prog.isActive,
          title: prog.title || "Programa de Referidos",
          description: prog.description || "",
          registerBonus: String(prog.registerBonus ?? 1),
          purchaseBonus: String(prog.purchaseBonus ?? 4),
        });
      }
      setStats(st);
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/referral/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: form.isActive,
          title: form.title,
          description: form.description,
          registerBonus: parseFloat(form.registerBonus) || 1,
          purchaseBonus: parseFloat(form.purchaseBonus) || 4,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProgram(updated);
      toast.success("Programa de referidos actualizado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── SALDOS ACTIVOS ── */}
      <ReferralSaldosSection />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none bg-indigo-50 rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground font-semibold">Usuarios referidos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-indigo-50 rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black">Q{(stats.totalPaid || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground font-semibold">Total pagado en bonos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none rounded-2xl" style={{ background: form.isActive ? "#dcfce7" : "#fee2e2" }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: form.isActive ? "#16a34a" : "#dc2626" }}>
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black">{form.isActive ? "Activo" : "Inactivo"}</p>
                <p className="text-sm text-muted-foreground font-semibold">Estado del programa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config Card */}
      <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Programa de Referidos</h2>
                <p className="text-sm text-muted-foreground">Configura los bonos y el mensaje que verán los usuarios</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const newActive = !form.isActive;
                setForm(f => ({ ...f, isActive: newActive }));
                try {
                  await fetch("/api/admin/referral/program", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      isActive: newActive,
                      title: form.title,
                      description: form.description,
                      registerBonus: parseFloat(form.registerBonus) || 1,
                      purchaseBonus: parseFloat(form.purchaseBonus) || 4,
                    }),
                  });
                  toast.success(newActive ? "Programa activado" : "Programa desactivado");
                } catch {
                  toast.error("Error al cambiar estado");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all"
              style={{ background: form.isActive ? "#16a34a" : "#e5e7eb", color: form.isActive ? "white" : "#374151" }}
            >
              {form.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              {form.isActive ? "Activado" : "Desactivado"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Título del anuncio</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  placeholder="Programa de Referidos"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descripción / Mensaje</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  placeholder="Comparte tu link y gana saldo..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Bono por registro (Q)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#6366f1]">Q</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={form.registerBonus}
                    onChange={e => setForm(f => ({ ...f, registerBonus: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Saldo que recibe el referidor cuando alguien se registra con su link</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Bono por compra (Q)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#6366f1]">Q</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={form.purchaseBonus}
                    onChange={e => setForm(f => ({ ...f, purchaseBonus: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Saldo que recibe el referidor cuando su referido hace una compra</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <p className="text-sm font-bold text-[#6366f1] mb-1">Vista previa del anuncio (lo que verán los usuarios en su perfil):</p>
              <p className="text-base font-black">{form.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs bg-[#6366f1] text-white px-3 py-1 rounded-full font-bold">Q{form.registerBonus} al registrarse</span>
                <span className="text-xs bg-indigo-700 text-white px-3 py-1 rounded-full font-bold">Q{form.purchaseBonus} al comprar</span>
              </div>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full md:w-auto bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-60 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {stats?.transactions?.length > 0 && (
        <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#6366f1]" /> Historial de Bonos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-bold text-muted-foreground">Tipo</th>
                    <th className="text-left py-2 px-3 font-bold text-muted-foreground">Monto</th>
                    <th className="text-left py-2 px-3 font-bold text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.transactions.map((t: any) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === "register" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {t.type === "register" ? "Registro" : "Compra"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-[#6366f1]">Q{t.amount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("es-GT")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
