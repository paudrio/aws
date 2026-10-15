import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Film, Download, Upload, RefreshCw, RotateCcw,
  CheckCircle2, AlertTriangle, FileJson, Mail,
} from "lucide-react";

type RestoreResult = { restored: number; skipped: number };

export default function MoviesBackupSection() {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setLoadingExport(true);
    window.open("/api/admin/export-movies-backup", "_blank");
    setTimeout(() => setLoadingExport(false), 1000);
    toast.success("✅ Respaldo de películas abierto — guárdalo con Ctrl+S");
  };

  const handleEmail = async () => {
    setLoadingEmail(true);
    try {
      const res = await fetch("/api/admin/send-movies-backup-email", { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success("✅ Respaldo de películas enviado al correo");
      else toast.error(data.error || "Error al enviar");
    } catch {
      toast.error("Error al enviar el respaldo.");
    }
    setLoadingEmail(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error("Selecciona un archivo .json de respaldo de películas");
      return;
    }
    setSelectedFile(file);
    setConfirmed(false);
    setResult(null);
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setLoadingRestore(true);
    try {
      const text = await selectedFile.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("El archivo no es un JSON válido.");
        setLoadingRestore(false);
        return;
      }
      const res = await fetch("/api/admin/restore-movies-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json);
        setSelectedFile(null);
        setConfirmed(false);
        if (fileRef.current) fileRef.current.value = "";
        toast.success(`✅ Restauración completada — ${json.restored} película(s) recuperada(s)`);
      } else {
        toast.error(json.error || "Error al restaurar");
      }
    } catch {
      toast.error("Error al procesar el archivo.");
    }
    setLoadingRestore(false);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Respaldo de Películas</h3>
          <p className="text-xs text-slate-500 font-medium">Sistema exclusivo para respaldar y restaurar tu catálogo de películas</p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
        <p className="font-black text-amber-800 uppercase tracking-wide text-[11px]">Importante</p>
        <p>Este respaldo guarda los <strong>registros</strong> de tus películas (nombre, URL). Los archivos de video en sí deben seguir existiendo en el servidor para que se puedan ver.</p>
        <p>Si solo se perdieron los registros en la base de datos pero los videos siguen en el servidor, la restauración los recupera completamente.</p>
      </div>

      {/* Export actions */}
      <div className="space-y-3">
        <p className="font-black text-xs uppercase tracking-widest text-slate-400">Generar respaldo</p>
        <Button
          onClick={handleEmail}
          disabled={loadingEmail}
          className="w-full h-12 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
        >
          {loadingEmail ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</> : <><Mail className="w-4 h-4" /> Enviar respaldo al correo</>}
        </Button>
        <Button
          onClick={handleExport}
          disabled={loadingExport}
          variant="outline"
          className="w-full h-10 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 border-2"
        >
          <Download className="w-4 h-4" /> Descargar en nueva pestaña
        </Button>
      </div>

      {/* Restore */}
      <div className="space-y-3">
        <p className="font-black text-xs uppercase tracking-widest text-slate-400">Restaurar desde respaldo</p>

        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileJson className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <p className="font-black text-slate-800 text-sm">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-sm font-black text-slate-400">Seleccionar archivo .json de respaldo</p>
            </div>
          )}
        </div>

        {selectedFile && !confirmed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-800 text-xs">Solo agrega películas que falten. Las existentes no se modifican.</p>
              <button onClick={() => setConfirmed(true)} className="mt-2 text-xs font-black text-amber-700 underline">
                Entendido — restaurar ahora
              </button>
            </div>
          </div>
        )}

        {selectedFile && confirmed && (
          <Button
            onClick={handleRestore}
            disabled={loadingRestore}
            className="w-full h-12 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            {loadingRestore ? <><RefreshCw className="w-4 h-4 animate-spin" /> Restaurando...</> : <><RotateCcw className="w-4 h-4" /> Restaurar películas</>}
          </Button>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-black text-green-800 text-sm">Restauración completada</p>
              <p className="text-xs text-green-700 mt-0.5">
                <strong>{result.restored}</strong> película(s) recuperada(s) ·{" "}
                <strong>{result.skipped}</strong> ya existían (sin cambios)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
