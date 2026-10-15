import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tv, Play, Search, ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize, Star, List, Grid, Zap, Menu, X } from "lucide-react";
import Hls from "hls.js";

function ChannelLogo({ src, name, size = "md" }: { src?: string; name: string; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const dims = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const rounded = size === "sm" ? "rounded-lg" : "rounded-xl";
  const initials = name.slice(0, 2).toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={`${dims} ${rounded} object-cover bg-slate-800 shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={`${dims} ${rounded} bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0`}>
      <span className={`${iconSize} font-black text-primary`}>{initials}</span>
    </div>
  );
}

export default function TV() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("tv_favorites") || "[]"); } catch { return []; }
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeChannelRef = useRef<any>(null);

  const { data: channels = [] } = useQuery({
    queryKey: ["/api/tv-channels"],
    queryFn: () => fetch("/api/tv-channels").then(r => r.json()),
    staleTime: 60000,
  });

  const groups = useMemo(() => {
    return Array.from(new Set(channels.map((c: any) => c.group || "General"))).sort() as string[];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let list = channels;
    if (showFavorites) list = list.filter((c: any) => favorites.includes(c.id));
    if (selectedGroup) list = list.filter((c: any) => (c.group || "General") === selectedGroup);
    if (searchTerm) list = list.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [channels, selectedGroup, searchTerm, showFavorites, favorites]);

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      activeChannelRef.current = channels[0];
      setActiveChannel(channels[0]);
    }
  }, [channels]);

  const switchChannel = useCallback((channel: any) => {
    if (activeChannelRef.current?.id === channel.id) return;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    activeChannelRef.current = channel;
    setActiveChannel(channel);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!activeChannel?.streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = (activeChannel.streamUrl as string).replace(/\s+/g, "").trim();
    const channelId = activeChannel.id;
    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let stalledId: ReturnType<typeof setTimeout>;
    let attempt = 0;
    let cancelled = false;
    let resolved = false;

    const fail = () => {
      if (cancelled || resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      clearTimeout(stalledId);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      setError("Sin señal");
      setIsLoading(false);
    };

    const succeed = () => {
      if (cancelled || resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      clearTimeout(stalledId);
      setIsLoading(false);
      video.muted = isMuted;
      video.play().catch(() => {});
    };

    video.onstalled = () => {
      clearTimeout(stalledId);
      stalledId = setTimeout(() => { if (!resolved && !cancelled) fail(); }, 5000);
    };
    video.onwaiting = () => {
      clearTimeout(stalledId);
      stalledId = setTimeout(() => { if (!resolved && !cancelled) fail(); }, 8000);
    };
    video.onplaying = () => { clearTimeout(stalledId); };

    const tryLoad = (url: string) => {
      if (cancelled) return;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      attempt++;

      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 6,
        maxMaxBufferLength: 15,
        maxBufferSize: 4 * 1024 * 1024,
        manifestLoadingMaxRetry: 1,
        manifestLoadingRetryDelay: 200,
        manifestLoadingMaxRetryTimeout: 3000,
        levelLoadingMaxRetry: 1,
        levelLoadingRetryDelay: 200,
        fragLoadingMaxRetry: 1,
        fragLoadingRetryDelay: 200,
        startLevel: -1,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        testBandwidth: false,
        progressive: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
          xhr.timeout = 6000;
        }
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (cancelled) return;
        succeed();
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        if (cancelled) return;
        succeed();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (cancelled) return;
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && attempt <= 2) {
            hls.recoverMediaError();
            return;
          }
          if (attempt === 1) {
            clearTimeout(timeoutId);
            tryLoad(streamUrl);
            timeoutId = setTimeout(() => { if (!resolved && !cancelled) fail(); }, 6000);
            return;
          }
          fail();
        }
      });
    };

    if (Hls.isSupported()) {
      tryLoad(`/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`);
      timeoutId = setTimeout(() => {
        if (cancelled || activeChannelRef.current?.id !== channelId || resolved) return;
        tryLoad(streamUrl);
        timeoutId = setTimeout(() => { if (!resolved && !cancelled) fail(); }, 6000);
      }, 6000);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.onloadedmetadata = () => { succeed(); };
      video.onerror = () => { fail(); };
      timeoutId = setTimeout(() => { if (!resolved && !cancelled) fail(); }, 10000);
    } else {
      fail();
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(stalledId);
      video.onstalled = null;
      video.onwaiting = null;
      video.onplaying = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem("tv_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, []);

  const goFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.();
  }, []);

  const currentIndex = channels.findIndex((c: any) => c.id === activeChannel?.id);
  const goPrev = useCallback(() => {
    if (currentIndex > 0) switchChannel(channels[currentIndex - 1]);
  }, [currentIndex, channels, switchChannel]);
  const goNext = useCallback(() => {
    if (currentIndex < channels.length - 1) switchChannel(channels[currentIndex + 1]);
  }, [currentIndex, channels, switchChannel]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); goPrev(); break;
        case "ArrowDown": e.preventDefault(); goNext(); break;
        case "m": case "M": toggleMute(); break;
        case "f": case "F": goFullscreen(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, toggleMute, goFullscreen]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Mobile: vertical stack. Desktop: side-by-side */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Mobile top bar with channel toggle */}
        <div className="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#111118] border-b border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {activeChannel && (
              <>
                <Zap className="w-3 h-3 text-red-500 shrink-0" />
                <span className="text-red-400 text-[10px] font-black uppercase tracking-widest shrink-0">EN VIVO</span>
                <ChannelLogo src={activeChannel.logo} name={activeChannel.name} size="sm" />
                <span className="text-white font-bold truncate text-xs">{activeChannel.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={toggleMute} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={goFullscreen} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar - overlay on mobile, side panel on desktop */}
        <div
          className={`
            lg:relative lg:translate-x-0 lg:w-80 lg:shrink-0 lg:flex lg:flex-col lg:h-[calc(100vh-64px)]
            ${sidebarOpen
              ? "fixed inset-0 z-50 bg-[#111118] flex flex-col lg:static lg:inset-auto lg:z-auto"
              : "hidden lg:flex"
            }
          `}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Mobile close button inside sidebar */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-white/5">
            <span className="text-white font-bold text-sm">Canales ({channels.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-3 lg:p-4 border-b border-white/5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar canal..."
                className="bg-white/5 border-white/10 rounded-xl h-10 pl-10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                variant={showFavorites ? "default" : "ghost"}
                size="sm"
                onClick={() => { setShowFavorites(!showFavorites); setSelectedGroup(null); }}
                className="rounded-lg text-xs gap-1"
              >
                <Star className="w-3 h-3" /> Favoritos
              </Button>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-lg">
                <Grid className="w-3 h-3" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-lg">
                <List className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div
            className="flex gap-1.5 p-3 overflow-x-auto border-b border-white/5"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => { setSelectedGroup(null); setShowFavorites(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                !selectedGroup && !showFavorites ? "bg-primary text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              Todos ({channels.length})
            </button>
            {groups.map((g: string) => {
              const count = channels.filter((c: any) => (c.group || "General") === g).length;
              return (
                <button
                  key={g}
                  onClick={() => { setSelectedGroup(g); setShowFavorites(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedGroup === g ? "bg-primary text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>

          <div
            className="flex-1 overflow-y-auto p-3"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
          >
            {filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Tv className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No hay canales</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-0.5">
                {filteredChannels.map((ch: any) => (
                  <button
                    key={ch.id}
                    onClick={() => switchChannel(ch)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ${
                      activeChannel?.id === ch.id
                        ? "bg-primary/20 border border-primary/40 shadow-lg shadow-primary/10"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <ChannelLogo src={ch.logo} name={ch.name} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm truncate">{ch.name}</p>
                      <p className="text-[10px] text-slate-500">{ch.group || "General"}</p>
                    </div>
                    {activeChannel?.id === ch.id && (
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                    )}
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(ch.id); }} className="shrink-0 p-1">
                      <Star className={`w-3.5 h-3.5 transition-colors ${favorites.includes(ch.id) ? "text-yellow-400 fill-yellow-400" : "text-slate-700 hover:text-slate-500"}`} />
                    </button>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {filteredChannels.map((ch: any) => (
                  <button
                    key={ch.id}
                    onClick={() => switchChannel(ch)}
                    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150 ${
                      activeChannel?.id === ch.id
                        ? "bg-primary/20 border border-primary/40 shadow-lg shadow-primary/10"
                        : "hover:bg-white/5 border border-white/[0.03] bg-white/[0.02]"
                    }`}
                  >
                    <ChannelLogo src={ch.logo} name={ch.name} size="md" />
                    <p className="font-bold text-[10px] text-center leading-tight truncate w-full">{ch.name}</p>
                    {activeChannel?.id === ch.id && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    )}
                    {favorites.includes(ch.id) && (
                      <Star className="absolute top-1 left-1 w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar border */}
        <div className="hidden lg:block w-px bg-white/5" />

        {/* Video player area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop top bar */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#111118] border-b border-white/5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {activeChannel && (
                <>
                  <Zap className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-red-400 text-[10px] font-black uppercase tracking-widest shrink-0">EN VIVO</span>
                  <ChannelLogo src={activeChannel.logo} name={activeChannel.name} size="sm" />
                  <span className="text-white font-bold truncate text-sm">{activeChannel.name}</span>
                  {activeChannel.group && (
                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md shrink-0">{activeChannel.group}</span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIndex <= 0} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[10px] text-slate-500 min-w-[2.5rem] text-center tabular-nums">
                {currentIndex >= 0 ? `${currentIndex + 1}/${channels.length}` : "-"}
              </span>
              <Button variant="ghost" size="sm" onClick={goNext} disabled={currentIndex >= channels.length - 1} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <Button variant="ghost" size="sm" onClick={toggleMute} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={goFullscreen} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Video container */}
          <div className="flex-1 bg-black relative flex items-center justify-center min-h-[200px]">
            <video
              ref={videoRef}
              className="w-full h-full object-contain max-h-[40vh] lg:max-h-[calc(100vh-120px)]"
              autoPlay
              playsInline
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
                <div className="relative mb-4 lg:mb-6">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 lg:w-16 lg:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-white font-black uppercase tracking-widest text-[10px] lg:text-xs">Conectando...</p>
                <p className="text-slate-600 text-[10px] mt-1 max-w-[200px] truncate">{activeChannel?.name}</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                <Tv className="w-10 h-10 lg:w-14 lg:h-14 text-slate-800 mb-3" />
                <p className="text-red-400 font-bold text-xs lg:text-sm mb-3">{error}</p>
                <Button onClick={() => switchChannel({...activeChannel})} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
                  Reintentar
                </Button>
              </div>
            )}
            {!activeChannel && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                <Tv className="w-12 h-12 lg:w-16 lg:h-16 text-slate-800 mb-3" />
                <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] lg:text-xs">Selecciona un canal</p>
              </div>
            )}
          </div>

          {/* Mobile bottom channel nav */}
          <div className="lg:hidden flex items-center gap-1 px-3 py-2 bg-[#111118] border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIndex <= 0} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-[10px] text-slate-500 tabular-nums">
                {currentIndex >= 0 ? `Canal ${currentIndex + 1} de ${channels.length}` : "-"}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={goNext} disabled={currentIndex >= channels.length - 1} className="text-slate-400 hover:text-white rounded-lg h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-primary hover:text-primary/80 rounded-lg h-8 px-2 text-xs font-bold gap-1"
            >
              <Grid className="w-3.5 h-3.5" /> Canales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
