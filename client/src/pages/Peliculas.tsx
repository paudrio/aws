import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Search, Film, X, Star, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Peliculas() {
  const { refreshData } = useApp() as any;
  const [multimedia, setMultimedia] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/multimedia");
        if (res.ok) {
          const data = await res.json();
          setMultimedia(data.filter((m: any) => m.type === "video" && !m.isHero));
        }
      } catch (e) {
        console.error("Failed to fetch movies", e);
      }
    };
    fetchMovies();
  }, []);

  const filteredMovies = multimedia.filter((movie) =>
    movie.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #fff7ed 0%, #fff 40%, #fef3c7 100%)" }}>

      {/* HERO */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[400px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #fb923c 0%, transparent 70%)", transform: "translate(-30%, -40%)" }} />
          <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", transform: "translate(30%, -40%)" }} />
          <div className="absolute bottom-0 left-1/2 w-[800px] h-[200px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", transform: "translateX(-50%) translateY(50%)" }} />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm" style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)", color: "#fff" }}>
              <Film className="w-3.5 h-3.5" /> Zona de Películas
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-tighter leading-none" style={{ color: "#1c1917" }}>
              TODAS LAS <span style={{ color: "#6366f1" }}>PELÍCULAS</span>
            </h1>
            <p className="text-stone-500 text-lg max-w-lg mx-auto font-medium mb-10">
              Disfruta nuestra colección exclusiva de películas y contenido en video.
            </p>

            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                placeholder="Buscar película..."
                className="w-full pl-12 pr-5 py-4 rounded-2xl text-sm font-semibold text-stone-800 placeholder-stone-400 outline-none transition-all shadow-md"
                style={{ background: "#fff", border: "2px solid #fed7aa" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e => (e.target.style.borderColor = "#fed7aa")}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="container mx-auto px-4 mb-10">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-black text-stone-400 uppercase tracking-widest">
            {filteredMovies.length} {filteredMovies.length === 1 ? "película" : "películas"}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 flex items-center gap-1 transition-all hover:bg-indigo-100"
              style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
            >
              <X className="w-3 h-3" /> Limpiar búsqueda
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      <section className="container mx-auto px-4 pb-20">
        {filteredMovies.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#fff7ed,#fed7aa)" }}>
              <Film className="w-12 h-12 text-indigo-400" />
            </div>
            <p className="text-stone-500 font-black uppercase tracking-widest text-sm">No se encontraron películas</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie, idx) => (
              <motion.div
                key={movie.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(movie.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedMovie(movie)}
              >
                <div
                  className="rounded-3xl overflow-hidden transition-all duration-300 group-hover:-translate-y-2"
                  style={{
                    background: "#fff",
                    border: hoveredId === movie.id ? "2px solid #6366f1" : "2px solid #fed7aa",
                    boxShadow: hoveredId === movie.id
                      ? "0 20px 60px rgba(234,88,12,0.20)"
                      : "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="aspect-video relative overflow-hidden bg-indigo-50">
                    <video
                      src={movie.url}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: hoveredId === movie.id ? 1.15 : 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                        style={{ background: hoveredId === movie.id ? "linear-gradient(135deg,#6366f1,#6366f1)" : "rgba(255,255,255,0.85)" }}
                      >
                        <Play className="w-6 h-6 fill-current ml-0.5" style={{ color: hoveredId === movie.id ? "#fff" : "#6366f1" }} />
                      </motion.div>
                    </div>

                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white shadow-sm" style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)" }}>
                        HD
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight leading-snug mb-2 line-clamp-2">
                      {movie.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-200 fill-current" />
                      </div>
                      <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current" /> Ver ahora
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {selectedMovie && (
          <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
            <DialogContent className="max-w-5xl p-0 gap-0 border-none overflow-hidden rounded-3xl shadow-2xl">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                <div className="relative bg-stone-950">
                  <button
                    onClick={() => setSelectedMovie(null)}
                    className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <div className="absolute top-0 left-0 right-0 z-10 p-5" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight pr-14 italic">{selectedMovie?.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black"><Star className="w-2.5 h-2.5 fill-current" /> HD Quality</span>
                    </div>
                  </div>
                  <video ref={videoRef} src={selectedMovie?.url} controls autoPlay className="w-full aspect-video object-contain" />
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
