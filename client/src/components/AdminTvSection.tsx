import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Upload, Plus, Download, Loader2, Tv, Search, X } from "lucide-react";

export default function AdminTvSection() {
  const queryClient = useQueryClient();
  const [m3uUrl, setM3uUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualGroup, setManualGroup] = useState("");
  const [manualLogo, setManualLogo] = useState("");
  const [manualStreamUrl, setManualStreamUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["/api/admin/tv-channels"],
    queryFn: () => fetch("/api/admin/tv-channels").then(r => r.json()),
  });

  const groups = Array.from(new Set(channels.map((c: any) => c.group || "General"))).sort() as string[];

  const filteredChannels = channels.filter((c: any) => {
    const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || c.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleImportM3U = async () => {
    if (!m3uUrl.trim()) {
      toast.error("Ingresa una URL de lista M3U");
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch("/api/admin/tv-channels/import-m3u", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: m3uUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.imported} canales importados exitosamente`);
      setM3uUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-channels"] });
    } catch (error: any) {
      toast.error(error.message || "Error al importar lista");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualStreamUrl.trim()) {
      toast.error("Nombre y URL son obligatorios");
      return;
    }
    try {
      const res = await fetch("/api/admin/tv-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          group: manualGroup || "General",
          logo: manualLogo,
          streamUrl: manualStreamUrl,
        }),
      });
      if (!res.ok) throw new Error("Error al crear canal");
      toast.success("Canal añadido");
      setManualName("");
      setManualGroup("");
      setManualLogo("");
      setManualStreamUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-channels"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/tv-channels/${id}`, { method: "DELETE" });
      toast.success("Canal eliminado");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-channels"] });
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleDeleteGroup = async (group: string) => {
    try {
      await fetch("/api/admin/tv-channels/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group }),
      });
      toast.success(`Grupo "${group}" eliminado`);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-channels"] });
    } catch {
      toast.error("Error al eliminar grupo");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch("/api/admin/tv-channels/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success("Todos los canales eliminados");
        setSelectedGroup(null);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-channels"] });
      } else {
        toast.error("Error al eliminar canales");
      }
    } catch {
      toast.error("Error al eliminar canales");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/tv-channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-channels"] });
    } catch {
      toast.error("Error al actualizar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black uppercase">Importar Lista M3U</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Importa canales desde una URL de lista M3U/M3U8. Compatible con listas de IPTV.
          </p>
          <div className="flex gap-2">
            <Input
              value={m3uUrl}
              onChange={(e) => setM3uUrl(e.target.value)}
              placeholder="https://ejemplo.com/lista.m3u"
              className="rounded-xl h-12 flex-1"
            />
            <Button
              onClick={handleImportM3U}
              disabled={isImporting}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6 font-black uppercase"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black uppercase">Añadir Canal Manual</h2>
          </div>
          <form onSubmit={handleAddManual} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nombre</Label>
                <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="ESPN" className="rounded-xl h-10" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Grupo</Label>
                <Input value={manualGroup} onChange={(e) => setManualGroup(e.target.value)} placeholder="Deportes" className="rounded-xl h-10" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">URL del Logo</Label>
              <Input value={manualLogo} onChange={(e) => setManualLogo(e.target.value)} placeholder="https://..." className="rounded-xl h-10" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">URL de Transmisión</Label>
              <Input value={manualStreamUrl} onChange={(e) => setManualStreamUrl(e.target.value)} placeholder="https://stream.m3u8" className="rounded-xl h-10" />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase h-10">
              <Plus className="w-4 h-4 mr-2" /> Añadir Canal
            </Button>
          </form>
        </Card>
      </div>

      <Card className="border-none bg-card rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Tv className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black uppercase">Canales ({channels.length})</h2>
          </div>
          {channels.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll} className="rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar Todos
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar canales..."
              className="rounded-xl h-10 pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedGroup ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGroup(null)}
              className="rounded-xl text-xs"
            >
              Todos
            </Button>
            {groups.map((g: string) => (
              <Button
                key={g}
                variant={selectedGroup === g ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGroup(g)}
                className="rounded-xl text-xs"
              >
                {g}
                <X
                  className="w-3 h-3 ml-1 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(g);
                  }}
                />
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredChannels.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No hay canales.</p>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Canal</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Grupo</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Estado</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map((ch: any) => (
                  <TableRow key={ch.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {ch.logo ? (
                          <img src={ch.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Tv className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <span className="font-bold text-sm">{ch.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted px-2 py-1 rounded-lg">{ch.group || "General"}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(ch.id, ch.isActive)}
                        className={`text-xs px-2 py-1 rounded-lg font-bold ${ch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {ch.isActive ? "Activo" : "Inactivo"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(ch.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
