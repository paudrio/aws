import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Zap, X, Upload, Tag, ImageIcon, LayoutGrid } from "lucide-react";

type FortniteItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  image2: string;
  image3: string;
  section: string;
  imagesJson: string;
  pavos: number;
  price: number;
  originalPrice: number;
  isActive: boolean;
  order: number;
};

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/multimedia/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.url;
}

function MultiImageUpload({
  images,
  setImages,
  uploading,
  setUploading,
  itemId,
  maxImages = 20,
}: {
  images: string[];
  setImages: (imgs: string[]) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  itemId: string;
  maxImages?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) { toast.error(`Máximo ${maxImages} imágenes`); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const urls: string[] = [];
    for (const file of toUpload) {
      try {
        const url = await uploadImage(file);
        urls.push(url);
      } catch {
        toast.error(`Error al subir ${file.name}`);
      }
    }
    setImages([...images, ...urls]);
    if (urls.length > 0) toast.success(`${urls.length} imagen${urls.length > 1 ? "es" : ""} subida${urls.length > 1 ? "s" : ""}`);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
  };

  const moveImage = (from: number, to: number) => {
    const next = [...images];
    const [el] = next.splice(from, 1);
    next.splice(to, 0, el);
    setImages(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Imágenes del item
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hasta {maxImages} fotos · rotan en slideshow cada 4 seg</p>
        </div>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${images.length >= maxImages ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-600"}`}>
          {images.length}/{maxImages}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((url, idx) => (
          <div key={url + idx} className="relative group rounded-xl overflow-hidden border-2 border-purple-200 aspect-square bg-slate-900">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {idx > 0 && (
                <button type="button" onClick={() => moveImage(idx, idx - 1)}
                  className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white text-xs font-black flex items-center justify-center"
                >←</button>
              )}
              <button type="button" onClick={() => removeImage(idx)}
                className="w-6 h-6 rounded bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {idx < images.length - 1 && (
                <button type="button" onClick={() => moveImage(idx, idx + 1)}
                  className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white text-xs font-black flex items-center justify-center"
                >→</button>
              )}
            </div>
            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-yellow-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">PORTADA</div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50 transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-500"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-[10px] font-bold">Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
      />

      {images.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-purple-500"
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs font-bold">Clic para subir imágenes (hasta {maxImages})</span>
          <span className="text-[10px] text-slate-300">JPG, PNG, WebP, GIF</span>
        </button>
      )}
    </div>
  );
}

function ItemForm({
  defaultValues, onSubmit, submitLabel,
  images, setImages, uploading, setUploading,
  section, setSection,
  formIsActive, setFormIsActive, itemId,
}: {
  defaultValues?: Partial<FortniteItem>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  images: string[]; setImages: (v: string[]) => void;
  uploading: boolean; setUploading: (v: boolean) => void;
  section: string; setSection: (v: string) => void;
  formIsActive: boolean; setFormIsActive: (v: boolean) => void;
  itemId: string;
}) {
  const [hasDiscount, setHasDiscount] = useState(!!(defaultValues?.originalPrice && defaultValues.originalPrice > 0));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Título y descripción */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600">Título del pack *</Label>
          <Input name="title" defaultValue={defaultValues?.title || ""} required placeholder="Ej: 1000 Pavos, Skin Galaxy..." className="rounded-xl h-11 border-2 border-slate-100 focus:border-yellow-400" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600">Descripción <span className="font-normal text-slate-400 normal-case">(opcional)</span></Label>
          <Input name="description" defaultValue={defaultValues?.description || ""} placeholder="Descripción breve del item..." className="rounded-xl h-11 border-2 border-slate-100" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600 flex items-center gap-1.5">
            <LayoutGrid className="w-3 h-3 text-yellow-500" /> Sección / Categoría
            <span className="font-normal text-slate-400 normal-case">(opcional — ej: Marvel, Arenas)</span>
          </Label>
          <Input
            value={section}
            onChange={e => setSection(e.target.value)}
            placeholder="Ej: MARVEL, TOY STORY, ARENAS, BATTLE PASS..."
            className="rounded-xl h-11 border-2 border-yellow-100 focus:border-yellow-400"
          />
          <p className="text-[10px] text-slate-400">Los items con la misma sección se agrupan juntos en la tienda</p>
        </div>
      </div>

      {/* Imágenes — multi upload */}
      <div className="rounded-2xl border-2 border-slate-100 p-4 bg-slate-50">
        <MultiImageUpload
          images={images}
          setImages={setImages}
          uploading={uploading}
          setUploading={setUploading}
          itemId={itemId}
        />
      </div>

      {/* Precio y descuento */}
      <div className="rounded-2xl border-2 border-slate-100 p-4 bg-slate-50 space-y-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Precio y descuento</p>

        <div className="space-y-1.5">
          <Label className="font-black uppercase text-xs text-slate-600 flex items-center gap-1.5">
            <span className="text-blue-500">⚡</span> Cantidad de V-Bucks / Pavos
            <span className="font-normal text-slate-400 normal-case">(opcional — ej: 1000)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-black text-sm">V</span>
            <Input name="pavos" type="number" min="0" step="1" defaultValue={defaultValues?.pavos ?? 0} className="rounded-xl h-11 border-2 border-blue-100 focus:border-blue-400 pl-7" placeholder="Ej: 1000, 2800, 13500..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-black uppercase text-xs text-slate-600">Precio actual (Q) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-purple-600 text-sm">Q</span>
              <Input name="price" type="number" step="0.01" min="0" defaultValue={defaultValues?.price ?? 0} required className="rounded-xl h-11 border-2 border-slate-100 focus:border-yellow-400 pl-7" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-black uppercase text-xs text-slate-600">Orden (posición)</Label>
            <Input name="order" type="number" defaultValue={defaultValues?.order ?? 0} className="rounded-xl h-11 border-2 border-slate-100" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <Switch id={`hasDiscount-${itemId}`} checked={hasDiscount} onCheckedChange={setHasDiscount} />
            <div>
              <Label className="font-bold text-sm cursor-pointer" htmlFor={`hasDiscount-${itemId}`}>Mostrar descuento / precio anterior</Label>
              <p className="text-[10px] text-slate-400">Muestra el precio tachado y el % de ahorro</p>
            </div>
          </div>

          {hasDiscount && (
            <div className="space-y-1.5">
              <Label className="font-black uppercase text-xs text-slate-600 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-red-500" /> Precio anterior / original (Q)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-red-500 text-sm">Q</span>
                <Input name="originalPrice" type="number" step="0.01" min="0" defaultValue={defaultValues?.originalPrice ?? 0} className="rounded-xl h-11 border-2 border-red-100 focus:border-red-400 pl-7" placeholder="Ej: 100" />
              </div>
            </div>
          )}
          {!hasDiscount && <Input name="originalPrice" type="hidden" value="0" readOnly />}
        </div>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <Switch id={`active-${itemId}`} checked={formIsActive} onCheckedChange={setFormIsActive} />
        <Label className="font-bold text-sm cursor-pointer" htmlFor={`active-${itemId}`}>Item activo (visible al público)</Label>
      </div>

      <Button
        type="submit"
        disabled={uploading}
        className="w-full h-12 rounded-xl font-black uppercase tracking-wider text-base"
        style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
      >
        {uploading ? "Subiendo imágenes..." : submitLabel}
      </Button>
    </form>
  );
}

function parseImages(item: FortniteItem): string[] {
  if (item.imagesJson) {
    try {
      const parsed = JSON.parse(item.imagesJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
    } catch {}
  }
  return [item.image, item.image2, item.image3].filter(Boolean);
}

export default function FortniteAdminSection() {
  const [items, setItems] = useState<FortniteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const [createImages, setCreateImages] = useState<string[]>([]);
  const [createSection, setCreateSection] = useState("");
  const [createUploading, setCreateUploading] = useState(false);
  const [createIsActive, setCreateIsActive] = useState(true);

  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSection, setEditSection] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/fortnite-items");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetCreate = () => { setCreateImages([]); setCreateSection(""); setCreateIsActive(true); };
  const resetEdit = () => { setEditImages([]); setEditSection(""); setEditIsActive(true); setEditItemId(null); };

  const buildData = (fd: FormData, imgs: string[], section: string, isActive: boolean) => {
    const arr = imgs.filter(Boolean);
    return {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || "",
      image: arr[0] || "",
      image2: arr[1] || "",
      image3: arr[2] || "",
      section,
      imagesJson: JSON.stringify(arr),
      pavos: parseInt(fd.get("pavos") as string) || 0,
      price: parseFloat(fd.get("price") as string) || 0,
      originalPrice: parseFloat(fd.get("originalPrice") as string) || 0,
      order: parseInt(fd.get("order") as string) || 0,
      isActive,
    };
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = buildData(new FormData(e.currentTarget), createImages, createSection, createIsActive);
    if (!data.title) return toast.error("El título es requerido");
    const res = await fetch("/api/fortnite-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { toast.success("Item creado"); setCreateOpen(false); resetCreate(); fetchItems(); }
    else toast.error("Error al crear");
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>, item: FortniteItem) => {
    e.preventDefault();
    const data = buildData(new FormData(e.currentTarget), editImages, editSection, editIsActive);
    const res = await fetch(`/api/fortnite-items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { toast.success("Actualizado"); resetEdit(); fetchItems(); }
    else toast.error("Error al actualizar");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este item?")) return;
    await fetch(`/api/fortnite-items/${id}`, { method: "DELETE" });
    toast.success("Eliminado"); fetchItems();
  };

  const handleToggleActive = async (item: FortniteItem) => {
    await fetch(`/api/fortnite-items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) });
    fetchItems();
  };

  const getDiscountPercent = (item: FortniteItem) => {
    if (item.originalPrice && item.originalPrice > item.price && item.price > 0) {
      return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    }
    return 0;
  };

  return (
    <Card className="border-none bg-slate-50/50 rounded-[2rem] overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" /> PAUDRONIX PAVOS
            </h2>
            <p className="text-slate-500 text-sm mt-1">Gestiona los items, skins y packs de Fortnite</p>
          </div>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate(); }}>
            <DialogTrigger asChild>
              <Button className="font-black rounded-xl px-6" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                <Plus className="w-4 h-4 mr-2" /> NUEVO ITEM
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white border-none rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Nuevo Item / Skin</DialogTitle>
              </DialogHeader>
              <ItemForm
                onSubmit={handleCreate}
                submitLabel="CREAR ITEM"
                images={createImages} setImages={setCreateImages}
                uploading={createUploading} setUploading={setCreateUploading}
                section={createSection} setSection={setCreateSection}
                formIsActive={createIsActive} setFormIsActive={setCreateIsActive}
                itemId="new"
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-12">Cargando items...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-yellow-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No hay items aún. Crea el primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => {
              const discountPct = getDiscountPercent(item);
              const allImgs = parseImages(item);
              const thumb = allImgs[0] || "";
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border-2 overflow-hidden flex flex-col ${item.isActive ? "border-purple-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}
                >
                  <div className="relative w-full" style={{ paddingBottom: "75%" }}>
                    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900">
                      {thumb ? (
                        <img src={thumb} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Zap className="w-8 h-8 text-purple-300 opacity-40" />
                        </div>
                      )}
                      {discountPct > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          -{discountPct}%
                        </div>
                      )}
                      {allImgs.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {allImgs.length} fotos
                        </div>
                      )}
                      {item.section && (
                        <div className="absolute top-2 left-2 bg-yellow-400/90 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          {item.section}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="font-black text-sm text-slate-900 leading-tight truncate">{item.title}</p>
                    {item.description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>}
                    <div className="mt-1">
                      {item.pavos > 0 && (
                        <p className="text-[10px] font-black text-blue-500 mb-0.5">⚡ +{item.pavos.toLocaleString()} V-Bucks</p>
                      )}
                      <p className="font-black text-purple-600 text-sm">Q{Number(item.price).toFixed(2)}</p>
                      {item.originalPrice > 0 && item.originalPrice > item.price && (
                        <p className="text-[10px] text-slate-400 line-through">Q{Number(item.originalPrice).toFixed(2)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`flex-1 text-[10px] font-black uppercase rounded-lg py-1 transition-colors ${item.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {item.isActive ? "Activo" : "Oculto"}
                      </button>
                      <Dialog onOpenChange={(o) => {
                        if (o) {
                          setEditItemId(item.id);
                          setEditIsActive(item.isActive);
                          setEditImages(parseImages(item));
                          setEditSection(item.section || "");
                        } else {
                          resetEdit();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg bg-white border-none rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Editar: {item.title}</DialogTitle>
                          </DialogHeader>
                          {editItemId === item.id && (
                            <ItemForm
                              defaultValues={item}
                              onSubmit={(e) => handleEdit(e, item)}
                              submitLabel="GUARDAR CAMBIOS"
                              images={editImages} setImages={setEditImages}
                              uploading={editUploading} setUploading={setEditUploading}
                              section={editSection} setSection={setEditSection}
                              formIsActive={editIsActive} setFormIsActive={setEditIsActive}
                              itemId={item.id}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
