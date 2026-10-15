import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, PlayCircle, X, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { News } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const FALLBACK = "/assets/images/character.png";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}

function truncate(text: string, max = 120) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export default function Noticias() {
  const { data: news, isLoading } = useQuery<News[]>({ queryKey: ["/api/news"] });
  const [selected, setSelected] = useState<News | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const items = news ?? [];
  const [featured, ...rest] = items;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="container mx-auto px-4 py-12 max-w-6xl">

        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
            Blog & Novedades
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-950 uppercase italic tracking-tighter mb-3">
            Últimas <span className="text-primary">Noticias</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium">
            Mantente al día con los últimos estrenos, actualizaciones y novedades de PAUDRONIX GT.
          </p>
        </div>

        {items.length === 0 && (
          <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest text-sm">
            No hay noticias publicadas en este momento.
          </div>
        )}

        {featured && (
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 mb-12 cursor-pointer group"
            onClick={() => setSelected(featured)}
          >
            <div className="w-full h-[340px] md:h-[460px] bg-slate-200 relative overflow-hidden">
              {featured.video ? (
                <video
                  src={featured.video}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={featured.image || FALLBACK}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <Badge className="mb-3 bg-primary text-white border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Destacado
              </Badge>
              <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tight leading-tight mb-4 drop-shadow-lg">
                {featured.title}
              </h2>
              <p className="text-white/80 text-base md:text-lg mb-5 max-w-2xl hidden md:block font-medium leading-relaxed">
                {truncate(featured.content, 200)}
              </p>
              <div className="flex items-center gap-5 text-white/60 text-xs font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatDate(featured.date)}</span>
                <span className="flex items-center gap-1.5"><User className="w-3 h-3" />Admin</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{readingTime(featured.content)}</span>
                <span className="ml-auto flex items-center gap-1.5 text-white group-hover:gap-2.5 transition-all font-black">
                  Leer <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-slate-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-slate-100"
                onClick={() => setSelected(item)}
              >
                <div className="w-full h-48 bg-slate-100 overflow-hidden relative">
                  {item.video ? (
                    <>
                      <video
                        src={item.video}
                        className="w-full h-full object-cover"
                        muted
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <PlayCircle className="w-10 h-10 text-white/80" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.image || FALLBACK}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" />{formatDate(item.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" />{readingTime(item.content)}</span>
                  </div>
                  <h3 className="text-lg font-display font-black text-slate-900 uppercase italic tracking-tight leading-snug mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 font-medium leading-relaxed">
                    {truncate(item.content, 110)}
                  </p>
                  <span className="flex items-center gap-1.5 text-primary font-black uppercase tracking-widest text-[11px] group-hover:gap-2.5 transition-all">
                    Leer más <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden border-none bg-white rounded-3xl shadow-2xl">
          <div className="overflow-y-auto max-h-[90vh]">
            <div className="relative">
              {selected?.video ? (
                <div className="w-full bg-black flex items-center justify-center">
                  <video
                    src={selected.video}
                    className="w-full max-h-[70vh] object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                </div>
              ) : (
                <img
                  src={selected?.image || FALLBACK}
                  alt={selected?.title}
                  className="w-full max-h-[50vh] object-cover"
                />
              )}
              {!selected?.video && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {!selected?.video && (
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-xl md:text-2xl font-display font-black text-white uppercase italic tracking-tight leading-tight drop-shadow">
                    {selected?.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-white/70 text-[11px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(selected?.date)}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />Admin</span>
                    {selected && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readingTime(selected.content)}</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-white">
              {selected?.video && (
                <div className="mb-4">
                  <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 uppercase italic tracking-tight leading-tight">
                    {selected?.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(selected?.date)}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />Admin</span>
                    {selected && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readingTime(selected.content)}</span>}
                  </div>
                  <div className="border-b border-slate-100 mt-4" />
                </div>
              )}
              <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap break-words font-medium">
                {selected?.content}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
