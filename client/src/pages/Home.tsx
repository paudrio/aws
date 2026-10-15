import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";

import { useApp, Product } from "@/lib/context";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Phone, Video, Volume2, VolumeX, CheckCircle, Star, ShoppingBag, ShoppingCart, Play, Info, MessageCircle, Film, Tv, Mail, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import defaultHeroBg from "@assets/generated_images/neon_cyberpunk_streaming_services_abstract_background.png";

/* ── Animated counter: counts up when section enters viewport ── */
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

/* ── Fade-up wrapper triggered on scroll ── */
const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

import Checkout from "@/components/Checkout";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryBar from "@/components/CategoryBar";
import GiftProductModal from "@/components/GiftProductModal";
/* ─────────────────────────────────────────────────────── */

export default function Home() {
  const { products, settings, categories, refreshData, isLoading } = useApp() as any;
  const { user } = useAuth();
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("catalogo");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [giftProduct, setGiftProduct] = useState<any>(null);
  const [multimedia, setMultimedia] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [streamUrl, setStreamUrl] = useState("/api/stream-proxy/danny.m3u8");
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroHlsRef = useRef<Hls | null>(null);
  const userWantsAudioRef = useRef(false);
  const [referralBanner, setReferralBanner] = useState<{ code: string; bonus: number } | null>(null);

  const movieVideos = Array.isArray(multimedia) ? multimedia.filter(m => m.type === 'video' && !m.isHero).reverse() : [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loginError") === "true") {
      toast.error("Error al iniciar sesión con Google. Intenta de nuevo.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("suspended") === "true") {
      toast.error("Tu cuenta ha sido suspendida. Contacta al administrador.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("paudronix_ref", ref.toUpperCase());
      window.history.replaceState({}, "", window.location.pathname);
      fetch("/api/referral/program")
        .then(r => r.ok ? r.json() : null)
        .then(program => {
          if (program?.isActive) {
            setReferralBanner({ code: ref.toUpperCase(), bonus: Number(program.registerBonus) || 1 });
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const videoElement = heroVideoRef.current;
    if (!videoElement) return;

    const heroM3u8 = settings?.heroStreamUrl || "http://167.71.179.60:8080/hls/danny.m3u8";

    const startHeroStream = () => {
      const finalUrl = heroM3u8.startsWith('http') 
        ? `/api/stream-proxy?url=${encodeURIComponent(heroM3u8)}`
        : heroM3u8;

      if (Hls.isSupported()) {
        if (heroHlsRef.current) heroHlsRef.current.destroy();
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingMaxRetry: 20,
          levelLoadingMaxRetry: 20,
          fragLoadingMaxRetry: 20,
          backBufferLength: 0
        });
        heroHlsRef.current = hls;
        hls.loadSource(finalUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const alreadyUnlocked = userWantsAudioRef.current || sessionStorage.getItem('audioUnlocked') === '1';
          videoElement.muted = !alreadyUnlocked;
          videoElement.play().catch(() => {
            videoElement.muted = true;
            videoElement.play().catch(() => {});
          });
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            hls.destroy();
            setTimeout(startHeroStream, 1000);
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = finalUrl;
        videoElement.muted = true;
        videoElement.play().catch(() => {});
      }
    };

    startHeroStream();

    return () => {
      if (heroHlsRef.current) heroHlsRef.current.destroy();
    };
  }, [settings?.heroStreamUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const changeStream = (url: string) => {
    if (url === streamUrl) return;
    setStreamUrl(url);
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
  };

  useEffect(() => {
    const fetchMultimedia = async () => {
      try {
        const res = await fetch("/api/multimedia");
        if (res.ok) {
          const data = await res.json();
          setMultimedia(data);
        }
      } catch (e) {
        console.error("Failed to fetch multimedia", e);
      }
    };
    const url = window.location.href;
    if (url.includes("#catalogo")) {
      setActiveCategory("catalogo");
      setTimeout(() => {
        const el = document.getElementById('catalogo');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('autoplay', 'true');
    videoElement.crossOrigin = "anonymous"; 

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 0,
      maxBufferLength: 10,
      maxMaxBufferLength: 20,
      maxBufferHole: 0.5,
      manifestLoadingMaxRetry: 100,
      levelLoadingMaxRetry: 100,
      fragLoadingMaxRetry: 100,
      startLevel: -1,
      liveSyncDuration: 3,
      liveMaxLatencyDuration: 10,
      enableSoftwareAES: true,
      xhrSetup: (xhr) => {
        xhr.withCredentials = false;
      }
    });
    hlsRef.current = hls;

    const startHls = () => {
      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);
    };

    const enableAudio = () => {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
      }
    };

    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');

    // Escuchar botones físicos de volumen en móviles
    const handleVolumeChange = () => {
      if (videoElement.muted && videoElement.volume > 0) {
        videoElement.muted = false;
        setIsMuted(false);
        videoElement.play().catch(() => {});
      }
    };
    videoElement.addEventListener('volumechange', handleVolumeChange);

    // Si el usuario ya desbloqueó audio antes, intentar directo con audio
    const audioAlreadyUnlocked = sessionStorage.getItem('audioUnlocked') === '1';

    const forcePlay = () => {
      videoElement.muted = !audioAlreadyUnlocked;
      setIsMuted(!audioAlreadyUnlocked);
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoElement.muted = true;
          setIsMuted(true);
          videoElement.play().catch(() => {});
        });
      }
    };
    forcePlay();

    // Desbloquear audio al primer toque — guardar en localStorage para próximas visitas
    const unlock = () => {
      sessionStorage.setItem('audioUnlocked', '1');
      videoElement.muted = false;
      setIsMuted(false);
      videoElement.play().catch(() => {});
      ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(ev =>
        document.removeEventListener(ev, unlock)
      );
    };

    if (!audioAlreadyUnlocked) {
      ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(ev =>
        document.addEventListener(ev, unlock, { once: true, passive: true })
      );
    }

    // Restaurar audio cuando el usuario vuelve con el botón atrás (bfcache)
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && videoRef.current) {
        videoRef.current.muted = sessionStorage.getItem('audioUnlocked') === '1' ? false : true;
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('pageshow', onPageShow);

    if (Hls.isSupported()) {
      startHls();
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const wantsAudio = userWantsAudioRef.current || sessionStorage.getItem('audioUnlocked') === '1';
        videoElement.muted = !wantsAudio;
        videoElement.play().catch(() => {
          if (!wantsAudio) {
            videoElement.muted = true;
            setIsMuted(true);
          }
          videoElement.play().catch(() => {});
        });
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Error de red detectado, reintentando...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Error de media detectado, recuperando...");
              hls.recoverMediaError();
              break;
            default:
              console.log("Error fatal, reiniciando...");
              hls.destroy();
              setTimeout(startHls, 1000);
              break;
          }
        }
      });

      // Watchdog para detectar si el video se queda congelado
      const checkStall = setInterval(() => {
        if (videoElement && !videoElement.paused) {
          const lastTime = videoElement.currentTime;
          setTimeout(() => {
            if (videoElement.currentTime === lastTime && !videoElement.paused) {
              console.log("Detección de congelamiento, forzando salto...");
              videoElement.currentTime += 0.1;
              videoElement.play().catch(() => {});
            }
          }, 2000);
        }
      }, 5000);

      return () => {
        videoElement.removeEventListener('volumechange', handleVolumeChange);
        ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(ev => document.removeEventListener(ev, unlock));
        window.removeEventListener('pageshow', onPageShow);
        clearInterval(checkStall);
        hls.destroy();
      };
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = streamUrl;
      videoElement.crossOrigin = "anonymous";
      videoElement.muted = false;
      setIsMuted(false);
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(() => {
          videoElement.muted = true;
          setIsMuted(true);
          videoElement.play().catch(() => {});
          
          ['click', 'touchstart', 'scroll', 'mousedown'].forEach(ev => {
            document.addEventListener(ev, enableAudio, { once: true, passive: true });
          });
        });
      });
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      window.removeEventListener('pageshow', onPageShow);
      ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(ev => {
        document.removeEventListener(ev, enableAudio);
        document.removeEventListener(ev, unlock);
      });
    };
  }, [streamUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const TVSection = () => {
    const tvChannels = categories?.filter((c: any) => c.streamUrl) || [];
    if (tvChannels.length === 0) return null;

    return (
      <section className="py-10 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <FadeUp>
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12">
            <motion.div
              animate={{ boxShadow: ["0 0 16px rgba(99,102,241,0.3)", "0 0 32px rgba(99,102,241,0.6)", "0 0 16px rgba(99,102,241,0.3)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center"
              style={{ background: '#6366f1' }}
            >
              <Video className="text-white w-5 h-5 md:w-6 md:h-6" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">TV EN VIVO</h2>
              <p className="text-slate-500 font-semibold text-xs md:text-sm uppercase tracking-widest mt-0.5">Canales disponibles para ti</p>
            </div>
          </div>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-black rounded-xl md:rounded-[2rem] overflow-hidden shadow-2xl relative group border-4 md:border-8 border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-3 left-3 md:top-6 md:left-8 z-50 pointer-events-none select-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-start"
                  >
                    <motion.div
                      animate={{ 
                        filter: [
                          "drop-shadow(0 0 2px #fff) drop-shadow(0 0 5px #0fa)",
                          "drop-shadow(0 0 5px #fff) drop-shadow(0 0 15px #0fa)",
                          "drop-shadow(0 0 2px #fff) drop-shadow(0 0 5px #0fa)"
                        ],
                        y: [0, -2, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="relative"
                    >
                      <span className="text-lg md:text-4xl font-black italic tracking-tighter text-white flex items-center gap-1">
                        PAUDRONIX <span className="text-primary">GT</span>
                      </span>
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-white/20 blur-[1px] z-10"
                      />
                    </motion.div>
                    
                    <motion.div 
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-1.5 md:gap-2 mt-1 bg-black/40 backdrop-blur-sm px-1.5 md:px-2 py-0.5 rounded-md border border-white/10"
                    >
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-600 shadow-[0_0_10px_#f00]" />
                      <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.2em]">TV EN VIVO</span>
                    </motion.div>
                  </motion.div>
                </div>

                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                />
                {!isMuted && (
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-500 text-white px-2 md:px-3 py-1 rounded-full animate-pulse text-[8px] md:text-[10px] font-black uppercase shadow-lg z-20">
                    EN VIVO
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm w-8 h-8 md:w-10 md:h-10"
                  onClick={() => {
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = newMuted;
                      if (!newMuted) {
                        sessionStorage.setItem('audioUnlocked', '1');
                        videoRef.current.play().catch(() => {});
                      }
                    }
                  }}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 md:w-6 md:h-6" /> : <Volume2 className="w-4 h-4 md:w-6 md:h-6" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 max-h-[300px] md:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {tvChannels.map((channel: any) => (
                <button
                  key={channel.id}
                  onClick={() => changeStream(channel.streamUrl)}
                  className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ${
                    streamUrl === channel.streamUrl
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                      : "border-slate-100 bg-white hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-colors ${
                      streamUrl === channel.streamUrl ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                    }`}>
                      <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                    </div>
                    <span className={`font-black uppercase tracking-tight text-sm md:text-lg ${
                      streamUrl === channel.streamUrl ? "text-primary" : "text-slate-600"
                    }`}>
                      {channel.name}
                    </span>
                  </div>
                  {streamUrl === channel.streamUrl && (
                    <motion.div
                      layoutId="active-indicator"
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const [heroTvStreamUrl, setHeroTvStreamUrl] = useState("");
  const heroTvVideoRef = useRef<HTMLVideoElement>(null);
  const heroTvHlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (settings?.heroTvStreamUrl) {
      setHeroTvStreamUrl(settings.heroTvStreamUrl);
    }
  }, [settings?.heroTvStreamUrl]);

  useEffect(() => {
    const videoElement = heroTvVideoRef.current;
    if (!videoElement || !heroTvStreamUrl) return;

    const startTvStream = () => {
      const finalUrl = heroTvStreamUrl.startsWith('http') 
        ? `/api/stream-proxy?url=${encodeURIComponent(heroTvStreamUrl)}`
        : heroTvStreamUrl;

      if (Hls.isSupported()) {
        if (heroTvHlsRef.current) heroTvHlsRef.current.destroy();
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingMaxRetry: 20,
          levelLoadingMaxRetry: 20,
          fragLoadingMaxRetry: 20,
          backBufferLength: 0
        });
        heroTvHlsRef.current = hls;
        hls.loadSource(finalUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const alreadyUnlocked = userWantsAudioRef.current || sessionStorage.getItem('audioUnlocked') === '1';
          videoElement.muted = !alreadyUnlocked;
          videoElement.play().catch(() => {
            videoElement.muted = true;
            videoElement.play().catch(() => {});
          });
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            hls.destroy();
            setTimeout(startTvStream, 1000);
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = finalUrl;
        videoElement.muted = true;
        videoElement.play().catch(() => {});
      }
    };

    startTvStream();

    return () => {
      if (heroTvHlsRef.current) heroTvHlsRef.current.destroy();
    };
  }, [heroTvStreamUrl]);

  const [showUnlockOverlay, setShowUnlockOverlay] = useState(true);

  const TW_PHRASES = [
    "Estos precios no los verás en otro lugar.",
    "Más de 2 años desarrollando la página web.",
    "Streaming, películas y series — todo aquí.",
    "Suscripciones digitales al mejor precio.",
    "Canales en vivo, juegos y tarjetas de regalo.",
    "La plataforma digital #1 de Guatemala.",
  ];
  const [twText, setTwText] = useState("");
  const twState = useRef({ phrase: 0, pos: 0, deleting: false, pause: 0 });

  useEffect(() => {
    if (!showUnlockOverlay) return;
    const interval = setInterval(() => {
      const s = twState.current;
      const full = TW_PHRASES[s.phrase];
      if (s.pause > 0) { s.pause--; return; }
      if (!s.deleting) {
        if (s.pos < full.length) {
          s.pos++;
          setTwText(full.slice(0, s.pos));
        } else {
          s.pause = 40; // ~1.6s pausa al terminar
          s.deleting = true;
        }
      } else {
        if (s.pos > 0) {
          s.pos--;
          setTwText(full.slice(0, s.pos));
        } else {
          s.deleting = false;
          s.phrase = (s.phrase + 1) % TW_PHRASES.length;
          s.pause = 4; // pequeña pausa antes de la siguiente
        }
      }
    }, 28); // 28ms más rápido
    return () => clearInterval(interval);
  }, [showUnlockOverlay]);

  const globalUnlock = () => {
    sessionStorage.setItem('audioUnlocked', '1');
    userWantsAudioRef.current = true;

    // Desbloquear contexto de audio del navegador (técnica garantizada para móviles)
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume();
      }
    } catch (e) {}

    const playWithAudio = (el: HTMLVideoElement | null) => {
      if (!el) return;
      el.muted = false;
      el.volume = 1;
      el.play().catch(() => {
        setTimeout(() => {
          el.muted = false;
          el.play().catch(() => {});
        }, 300);
      });
    };

    playWithAudio(heroVideoRef.current);
    playWithAudio(heroTvVideoRef.current);
    playWithAudio(videoRef.current);
    setIsMuted(false);
    setShowUnlockOverlay(false);

    // Reintentos para streams que aún no han cargado — garantiza sonido siempre
    const retryDelays = [600, 1200, 2000, 3500];
    retryDelays.forEach(delay => {
      setTimeout(() => {
        if (!userWantsAudioRef.current) return;
        document.querySelectorAll('video').forEach(v => {
          if (v.muted) {
            v.muted = false;
            v.volume = 1;
            v.play().catch(() => {});
          }
        });
      }, delay);
    });
  };

  const whatsappNumber = settings?.whatsappNumber || "50237871216";
  const storeName = settings?.storeName || "Paudronix GT";
  const email = "paudronixpro@gmail.com";

  const filteredProducts = activeCategory === "all" || activeCategory === "catalogo" || activeCategory === "inicio"
    ? products 
    : products?.filter((p: any) => p.category?.trim().toLowerCase() === activeCategory.trim().toLowerCase());


  const handleBuyClick = (product: Product, paymentMethod?: string) => {
    setSelectedProduct(product);
  };

  const categoriesList = [
    { id: 'inicio', label: 'INICIO' },
    { id: 'catalogo', label: 'CATÁLOGO' },
    { id: 'peliculas', label: 'PELÍCULAS' },
    { id: 'noticias', label: 'NOTICIAS' },
    ...(categories || []).map((c: any) => ({ id: c.name.trim().toLowerCase(), label: c.name.toUpperCase() }))
  ];

  const FeaturedGallery = () => {
    const items = featuredSections || [];
    if (items.length === 0) return null;

    return (
      <section className="py-10 md:py-14 bg-white">
        <div className="container mx-auto px-4">
          <FadeUp>
          <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: '#0f172a' }}>
              SECCIONES <span style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DESTACADAS</span>
            </h2>
          </div>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((item: any, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group rounded-2xl overflow-hidden bg-white cursor-pointer"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}
                onClick={() => {
                  if (!item.link) return;
                  let url = item.link.trim();
                  if (!url.startsWith('/') && !url.startsWith('#') && !url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  window.location.href = url;
                }}
              >
                {/* Imagen */}
                <div className="aspect-square overflow-hidden relative rounded-t-2xl">
                  <img
                    src={item.image}
                    alt={item.title || ''}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {/* Texto */}
                {(item.title || item.description) && (
                  <div className="p-3 md:p-4 border-t border-slate-100">
                    {item.title && (
                      <div className="mb-2">
                        <div className="w-8 h-[3px] rounded-full mb-2" style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
                        <h3 className="font-black text-base md:text-xl uppercase tracking-tight leading-snug" style={{ color: '#0f172a' }}>
                          {item.title}
                        </h3>
                      </div>
                    )}
                    {item.description && (
                      <p className="text-xs md:text-sm leading-relaxed line-clamp-2 break-words font-semibold" style={{ color: '#64748b' }}>
                        {item.description}
                      </p>
                    )}
                    {item.link && (
                      <span className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6366f1' }}>
                        Ver más <span className="text-base leading-none">→</span>
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const ProductSection = () => {
    const displayProducts = filteredProducts?.filter((p: any) => p.isActive !== false) || [];
    
    return (
      <section className="py-20" id="catalogo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map((product: any) => (
              <Card key={product.id} className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group hover:shadow-2xl transition-all duration-500">
                <div className="aspect-square overflow-hidden relative">
                  <img src={product.image?.startsWith("/") || product.image?.startsWith("http") ? product.image : `/uploads/${product.image}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    {product.discountPercent > 0 && (
                      <span className="bg-red-500 text-white px-3 py-0.5 rounded-full font-black text-[10px] uppercase shadow">
                        {product.discountPercent}% OFF
                      </span>
                    )}
                    <span className="bg-primary text-white px-4 py-1 rounded-full font-black text-xs uppercase">
                      Q{product.price}
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="bg-black/50 text-white/70 px-3 py-0.5 rounded-full font-bold text-[10px] line-through">
                        Q{product.originalPrice ? Math.round(product.originalPrice) : Math.round(product.price / (1 - product.discountPercent / 100))}
                      </span>
                    )}
                    {product.priceUsd && (
                      <span className="bg-green-600 text-white px-3 py-0.5 rounded-full font-black text-[10px] uppercase">
                        ${product.priceUsd} USD
                      </span>
                    )}
                  </div>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{product.name}</h3>
                  <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-300 px-4 py-3.5 flex items-start gap-3">
                    <span className="text-xl shrink-0">⚠️</span>
                    <p className="text-sm font-bold text-amber-800 leading-snug">Se recomienda leer la descripción de este producto. <span className="text-red-600">No se aceptará reembolsos luego de confirmar el pago.</span> Tomar en cuenta.</p>
                  </div>
                  <div className="space-y-2.5 mb-8">
                    {product.description?.split('\n').map((line: string, i: number) => (
                      line.trim() ? (
                        <div key={i} className="flex items-center gap-3">
                          {product.showCheckmarks && (
                            <span className="text-xl leading-none shrink-0">✅</span>
                          )}
                          <span className="text-slate-700 font-bold text-sm leading-snug">{line}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => handleBuyClick(product)}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase shadow-lg shadow-primary/20"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" /> Comprar Ahora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const [featuredSections, setFeaturedSections] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/featured-sections");
        if (res.ok) {
          const data = await res.json();
          setFeaturedSections(data.filter((s: any) => s.isActive));
        }
      } catch (e) {
        console.error("Failed to fetch featured sections", e);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 selection:bg-primary/20 relative">
      {/* Pantalla de carga */}
      <AnimatePresence>
        {showUnlockOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none"
            onClick={globalUnlock}
          >
            {/* ══ Imagen de fondo ══ */}
            <img
              src="/splash-bg.gif"
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: 'center 15%', transform: 'scale(1.12)', transformOrigin: 'center top' }}
            />
            {/* Overlay oscuro suave encima de la imagen */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 100%)" }} />


            {/* ── Contenido central ── CSS animations, sin framer-motion interno ── */}
            <div className="relative flex flex-col items-center text-center px-6 max-w-xl w-full gap-4 splash-content">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[2px] splash-item-1"
                style={{ border: "1px solid rgba(167,139,250,0.4)", color: "#c4b5fd", background: "rgba(0,0,0,0.35)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                Guatemala — Plataforma Digital
              </div>

              <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter leading-none whitespace-nowrap splash-item-2"
                style={{ color: "#fff", textShadow: "0 2px 18px rgba(139,92,246,0.5)" }}>
                PAUDRONIX <span style={{ color: "#6366f1" }}>GT</span>
              </h1>

              <div className="h-[2px] w-24 rounded-full splash-item-3"
                style={{ background: "linear-gradient(90deg,#7c3aed,#6366f1)" }} />

              <div className="flex items-center justify-center gap-1 min-h-[1.6rem] splash-item-4">
                <span className="text-sm sm:text-base font-semibold italic" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {twText}
                </span>
                <span className="inline-block w-[2px] h-[1em] rounded-full align-middle bg-indigo-400" style={{ animation: "splashBlink 0.9s step-end infinite" }} />
              </div>

              <button
                className="mt-1 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[3px] text-white splash-item-5 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg,#6d28d9,#6366f1)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
              >
                ✦ Toca para continuar ✦
              </button>

              <p className="mt-3 text-amber-300 text-base font-black text-center drop-shadow-lg" style={{ textShadow: "0 2px 12px rgba(0,0,0,1), 0 0px 4px rgba(0,0,0,1)" }}>🔊 Se recomienda bajar el volumen — transmisión en vivo 24 horas</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative w-full bg-white flex flex-col pt-12 md:pt-16 pb-8 md:pb-12">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="w-full max-w-5xl mb-4 md:mb-6 text-left flex flex-col" id="video-header">
            <div className="flex flex-col">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                {settings?.heroTitle || "ESTILO Y STREAMING"}
              </h2>
              <p className="text-primary font-bold text-sm md:text-lg uppercase tracking-[0.2em]">
                {settings?.heroSubtitle || "PAUDRONIX GT"}
              </p>
            </div>
          </div>

          {/* TV Menú Principal Section - Directly below titles */}
          {heroTvStreamUrl && (
            <div className="w-full max-w-5xl mt-4 md:mt-8 px-2 md:px-0">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#6366f1', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                  <Tv className="text-white w-4 h-4 md:w-5 md:h-5" />
                </div>
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">TV MENÚ PRINCIPAL</h2>
              </div>
              
              <div className="aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl relative border-2 md:border-4 border-slate-50">
                <video
                  ref={heroTvVideoRef}
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                  loop
                />
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
                  <span className="text-white/15 text-sm md:text-4xl font-black italic tracking-widest select-none pointer-events-none uppercase">
                    PAUDRONIX GT
                  </span>
                </div>
                <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-1.5 md:gap-2 bg-red-500 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-md animate-pulse text-[8px] md:text-[10px] font-black uppercase shadow-lg z-20">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full" /> EN VIVO
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <BannerCarousel />
      <CategoryBar onCategorySelect={(name) => setActiveCategory(name)} />

      {/* Hero Content */}
      <section style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #f0f4ff 100%)' }} className="py-14 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Plataforma Digital #1 en Guatemala
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="text-4xl sm:text-6xl md:text-8xl mb-5 leading-[1.0] font-black tracking-tighter uppercase" style={{ color: '#0f172a' }}>
              TODO LO QUE<br/>
              <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                NECESITAS
              </span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium px-4 mb-10">
              Streaming, suscripciones, canales en vivo, juegos digitales y mucho más.<br className="hidden md:block" /> Todo al mejor precio del mercado guatemalteco.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="#catalogo" onClick={(e) => { e.preventDefault(); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 6px 20px rgba(99,102,241,0.40)' }}>
                <ShoppingBag className="w-4 h-4" /> Ver Catálogo
              </a>
              <a href="https://wa.me/50237871216" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:border-indigo-300 hover:scale-105 transition-all" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <Phone className="w-4 h-4 text-green-500" /> WhatsApp
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── STATS COUNTER SECTION ── */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)' }} className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[
              { target: 40,  suffix: "+", label: "Servicios Disponibles",     sub: "streaming, juegos y más"   },
              { target: 500, suffix: "+", label: "Clientes Satisfechos",       sub: "en toda Guatemala"         },
              { target: 24,  suffix: "/7", label: "Soporte Disponible",        sub: "siempre disponibles"       },
              { target: 4,   suffix: "+", label: "Años en el Mercado",         sub: "confianza y experiencia"   },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <div className="text-3xl md:text-5xl font-black tabular-nums leading-none mb-1" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-white font-bold text-xs md:text-sm uppercase tracking-wider mt-2">{stat.label}</div>
                <div className="text-white/40 text-[10px] md:text-xs mt-0.5">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedGallery />

      {(activeCategory === 'tv' || activeCategory === 'inicio') && <TVSection />}

      {activeCategory === 'noticias' && (
        <section className="py-20 container mx-auto px-4">
          <h2 className="text-5xl font-black text-slate-950 mb-12 tracking-tighter uppercase">ÚLTIMAS NOTICIAS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Aquí se cargarán las noticias del API */}
            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-center">Próximamente más noticias...</p>
            </div>
          </div>
        </section>
      )}

      {(activeCategory === 'catalogo' || activeCategory === 'peliculas' || activeCategory === 'all' || activeCategory === 'inicio' || categories?.some((c: any) => c.name.trim().toLowerCase() === activeCategory.trim().toLowerCase())) && (
        <section className="py-12 md:py-20" id="catalogo" style={{ background: '#f8fafc' }}>
          <div className="container mx-auto px-4">

            {/* Section header */}
            <FadeUp>
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Nuestro Catálogo
              </div>
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase mb-3" style={{ color: '#0f172a' }}>
                EXPLORA EL <span style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CATÁLOGO</span>
              </h2>
              <p className="text-sm md:text-base text-slate-400 font-medium mb-8">Encuentra el servicio digital perfecto para ti</p>

              {/* Category filters */}
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setActiveCategory("catalogo")}
                  className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                  style={activeCategory === "catalogo"
                    ? { background: '#6366f1', color: '#fff', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }
                    : { background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}
                >
                  Todos
                </button>
                {categories && categories.filter((c: any) => !c.streamUrl).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 capitalize"
                    style={activeCategory.trim().toLowerCase() === cat.name.trim().toLowerCase()
                      ? { background: '#6366f1', color: '#fff', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }
                      : { background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            </FadeUp>

            {/* Aviso + grid juntos sin separación */}
            <div className="flex flex-col gap-2">

            {/* Aviso completo sin reembolso */}
            <div className="rounded-t-2xl rounded-b-lg border-2 overflow-hidden" style={{ borderColor: '#a5b4fc', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: '#a5b4fc', background: 'rgba(99,102,241,0.1)' }}>
                <span className="text-lg">⚠️</span>
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: '#3730a3' }}>Aviso importante antes de comprar</p>
              </div>
              <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-sm shrink-0">📋</span>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: '#3730a3' }}>Lee la descripción completa del producto</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#4f46e5' }}>Asegúrate de entender qué incluye el servicio, la duración y los requisitos antes de realizar tu compra.</p>
                  </div>
                </div>
                <div className="h-px sm:h-auto sm:w-px shrink-0" style={{ background: '#a5b4fc' }} />
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-sm shrink-0">🚫</span>
                  <div>
                    <p className="text-xs font-bold text-red-700 mb-0.5">No se aceptan reembolsos</p>
                    <p className="text-[11px] text-red-600 leading-relaxed">Una vez confirmado y procesado el pago, <strong>no se realizan devoluciones bajo ningún concepto.</strong> Al comprar aceptas esta política.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product grid — 1 col mobile (horizontal cards), 2 tablet, 3 md, 4 desktop */}
            <div id="catalogo" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {filteredProducts?.filter((p: any) => p.isActive !== false).map((product: any) => {
              const isOutOfStock = product.inStock === false || (product.stockQuantity !== null && product.stockQuantity !== -1 && product.stockQuantity !== undefined && product.stockQuantity <= 0);
              const hasLimitedStock = product.stockQuantity !== null && product.stockQuantity !== -1 && product.stockQuantity !== undefined;
              return (
                <motion.div
                  layout
                  key={product.id}
                  className="group"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div
                    className={`relative bg-white overflow-hidden flex flex-row sm:flex-col h-full transition-all duration-300 cursor-pointer ${isOutOfStock ? 'opacity-60' : ''}`}
                    style={{ borderRadius: 16, boxShadow: '0 0 0 1px #e2e8f0, 0 4px 24px rgba(99,102,241,0.08)' }}
                    onClick={() => setLocation(`/producto/${product.id}`)}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1.5px #a5b4fc, 0 8px 32px rgba(99,102,241,0.15)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px #e2e8f0, 0 4px 24px rgba(99,102,241,0.08)'; }}
                  >
                    {/* Image area — mobile: fixed 130px left column | sm+: full-width top */}
                    <div
                      className="relative flex-none sm:flex-none w-[200px] sm:w-full flex flex-col items-center justify-center p-2 sm:p-3"
                      style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)' }}
                    >
                      {/* Discount badge */}
                      {product.discountPercent > 0 && (
                        <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-lg text-white z-10" style={{ background: '#6366f1' }}>
                          -{product.discountPercent}%
                        </span>
                      )}

                      {/* Popular badge */}
                      {product.isPopular && (
                        <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide text-amber-700 z-10"
                          style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)' }}>
                          🔥
                        </span>
                      )}

                      {/* Product image */}
                      <div className="w-full flex items-center justify-center rounded-xl overflow-hidden h-[195px] sm:h-[260px]"
                        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)' }}>
                        <img
                          src={product.image?.startsWith("/") || product.image?.startsWith("http") ? product.image : `/uploads/${product.image}`}
                          alt={product.name}
                          className={`w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                        />
                      </div>

                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center z-20"
                          style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)' }}>
                          <span className="bg-white text-slate-700 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow border border-slate-200">
                            Sin Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 px-3 py-3 sm:px-4 sm:pt-3.5 sm:pb-4 gap-2 min-w-0">
                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-amber-400" fill="currentColor" />)}
                        <span className="text-[10px] font-semibold text-slate-400 ml-1">5.0</span>
                      </div>

                      {/* Name */}
                      <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2 min-w-0">{product.name}</h3>

                      {/* Divider */}
                      <div className="h-px w-full" style={{ background: '#f1f5f9' }} />

                      {/* Price block */}
                      <div className="flex flex-col gap-1">
                        {/* Línea 1: precio actual + /mes o Único */}
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xl sm:text-2xl font-black" style={{ color: '#4f46e5' }}>Q{product.price}</span>
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                            style={product.isMonthly !== false
                              ? { background: '#eef2ff', color: '#4f46e5' }
                              : { background: '#fef9c3', color: '#854d0e' }}>
                            {product.isMonthly !== false ? '/mes' : 'Único'}
                          </span>
                        </div>
                        {/* Línea 2: precio anterior + ahorras */}
                        {product.discountPercent > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm text-slate-400 line-through font-medium">
                              Q{product.originalPrice ? Math.round(product.originalPrice) : Math.round(product.price / (1 - product.discountPercent / 100))}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-md" style={{ background: '#f0fdf4' }}>
                              Ahorras Q{Math.round((product.originalPrice || product.price / (1 - product.discountPercent / 100)) - product.price)}
                            </span>
                          </div>
                        )}
                        {product.priceUsd && !product.discountPercent && (
                          <span className="text-[10px] font-bold" style={{ color: '#059669' }}>${product.priceUsd} USD</span>
                        )}
                      </div>

                      {/* Stock */}
                      {hasLimitedStock && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider w-fit px-2 py-0.5 rounded-md"
                          style={{
                            background: product.stockQuantity > 5 ? '#d1fae5' : product.stockQuantity > 0 ? '#fef3c7' : '#fee2e2',
                            color: product.stockQuantity > 5 ? '#065f46' : product.stockQuantity > 0 ? '#92400e' : '#991b1b',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: product.stockQuantity > 5 ? '#10b981' : product.stockQuantity > 0 ? '#f59e0b' : '#ef4444' }} />
                          {product.stockQuantity > 0 ? `${product.stockQuantity} disp.` : 'Sin stock'}
                        </div>
                      )}

                      {/* Description — only desktop */}
                      {product.description && (
                        <div className="space-y-0.5 flex-1 hidden sm:block">
                          {product.description.split('\n').slice(0, 2).map((line: string, index: number) => (
                            line.trim() ? (
                              <div key={index} className="flex items-start gap-1.5 leading-snug">
                                {product.showCheckmarks !== false && <span className="text-xs leading-none shrink-0 mt-0.5">✅</span>}
                                <span className="text-[11px] text-slate-500 line-clamp-1 break-words">{line}</span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      )}

                      {/* Botones — stopPropagation para no navegar al producto */}
                      <div className="flex gap-1.5 mt-auto items-center min-w-0">
                        <button
                          disabled={isOutOfStock}
                          onClick={e => { e.stopPropagation(); if (!isOutOfStock) handleBuyClick(product); }}
                          className={`flex-1 min-w-0 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1 transition-all duration-200 ${isOutOfStock ? 'cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.97]'}`}
                          style={isOutOfStock
                            ? { background: '#f1f5f9', color: '#94a3b8' }
                            : { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }
                          }
                        >
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{isOutOfStock ? 'Sin stock' : 'Comprar'}</span>
                        </button>
                        {!isOutOfStock && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); if (user) { setGiftProduct(product); } else { setLocation('/auth'); } }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                              style={{ background: '#fdf2f8', color: '#db2777' }}
                              title="Regalar a alguien"
                            >
                              <Gift className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); addItem(product); }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                              style={{ background: '#eef2ff', color: '#6366f1' }}
                              title="Agregar al carrito"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            </div>
            </div>{/* end aviso+grid wrapper */}
          </div>
        </section>
    )}

      {/* Why choose us */}
      <section className="py-16 md:py-28" style={{ background: '#fff' }}>
        <div className="container mx-auto px-4">
          <FadeUp>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              Por qué elegirnos
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter" style={{ color: '#0f172a' }}>
              ¿Por qué miles confían en{" "}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                PAUDRONIX GT
              </span>?
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-3 max-w-lg mx-auto">Más de 500 clientes en Guatemala nos eligen cada día por nuestra calidad y precio.</p>
          </div>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 max-w-5xl mx-auto">
            {[
              { icon: <Zap className="w-5 h-5" />, title: "Entrega inmediata", desc: "Credenciales al instante después del pago.", color: '#6366f1', bg: '#eef2ff' },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, title: "Pago 100% seguro", desc: "Múltiples métodos verificados.", color: '#059669', bg: '#d1fae5' },
              { icon: <MessageCircle className="w-5 h-5" />, title: "Soporte 24/7", desc: "Atención siempre disponible.", color: '#6366f1', bg: '#eef2ff' },
              { icon: <ShoppingBag className="w-5 h-5" />, title: "Precio accesible", desc: "Lo mejor al menor costo del mercado.", color: '#7c3aed', bg: '#ede9fe' },
              { icon: <CheckCircle className="w-5 h-5" />, title: "Garantía total", desc: "Protección completa al comprador.", color: '#059669', bg: '#d1fae5' },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>, title: "Streaming en HD", desc: "Calidad de imagen superior.", color: '#dc2626', bg: '#fee2e2' },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, title: "Múltiples pagos", desc: "Banrural, BAC, Binance y más.", color: '#0d9488', bg: '#ccfbf1' },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>, title: "TV en Vivo", desc: "Canales desde cualquier lugar.", color: '#d97706', bg: '#fef3c7' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, boxShadow: '0 8px 24px rgba(99,102,241,0.12)' }}
                className="bg-white rounded-2xl p-4 md:p-5 flex flex-col gap-3 cursor-default"
                style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm mb-1 tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 overflow-hidden">
        <FadeUp>
        <div className="container mx-auto px-4 mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 bg-amber-50 border border-amber-100 text-amber-600 font-black tracking-[0.25em] text-[11px] uppercase px-5 py-2 rounded-full">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            Lo que dicen nuestros clientes
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter uppercase">OPINIONES REALES</h2>
          <p className="text-slate-400 text-sm mt-3">Clientes reales de toda Guatemala compartiendo su experiencia</p>
        </div>
        </FadeUp>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10" />
          <div
            className="flex gap-5 w-max"
            style={{
              animation: "marquee 40s linear infinite",
            }}
          >
            {[
              { name: "Carlos M.", location: "Guatemala", color: "bg-indigo-500", text: "Excelente servicio, recibí mi pedido súper rápido. Muy recomendado 100%.", stars: 5 },
              { name: "María López", location: "Quetzaltenango", color: "bg-violet-500", text: "Los precios son increíbles y la calidad es top. Ya compré 3 veces y siempre perfecto.", stars: 5 },
              { name: "Josué R.", location: "Escuintla", color: "bg-emerald-500", text: "Pensé que era muy bueno para ser verdad pero sí cumple todo lo que promete. Gracias!", stars: 5 },
              { name: "Andrea T.", location: "Mixco", color: "bg-rose-500", text: "Atención al cliente excelente, me resolvieron todo en minutos. Definitivamente vuelvo.", stars: 5 },
              { name: "Diego F.", location: "Villa Nueva", color: "bg-indigo-500", text: "El streaming funciona perfectísimo en todos mis dispositivos. Vale cada quetzal.", stars: 5 },
              { name: "Sofía Ch.", location: "Antigua", color: "bg-pink-500", text: "No esperaba tanta calidad a ese precio. Me sorprendió gratamente. Muy feliz con la compra.", stars: 5 },
              { name: "Roberto A.", location: "Cobán", color: "bg-cyan-500", text: "Llevo 6 meses siendo cliente y jamás he tenido un problema. Servicio de primera.", stars: 5 },
              { name: "Lupita V.", location: "Chiquimula", color: "bg-indigo-500", text: "Me lo recomendó una amiga y ahora lo recomiendo a todos. Los mejores precios de GT.", stars: 5 },
              { name: "Ernesto P.", location: "Petén", color: "bg-teal-500", text: "Pedido llegó en menos tiempo del esperado. Todo bien empacado y funcionando perfecto.", stars: 5 },
              { name: "Claudia B.", location: "Huehuetenango", color: "bg-fuchsia-500", text: "Súper fácil de comprar, el proceso es rápido y seguro. Ya hice mi segunda orden!", stars: 5 },
            ].concat([
              { name: "Carlos M.", location: "Guatemala", color: "bg-indigo-500", text: "Excelente servicio, recibí mi pedido súper rápido. Muy recomendado 100%.", stars: 5 },
              { name: "María López", location: "Quetzaltenango", color: "bg-violet-500", text: "Los precios son increíbles y la calidad es top. Ya compré 3 veces y siempre perfecto.", stars: 5 },
              { name: "Josué R.", location: "Escuintla", color: "bg-emerald-500", text: "Pensé que era muy bueno para ser verdad pero sí cumple todo lo que promete. Gracias!", stars: 5 },
              { name: "Andrea T.", location: "Mixco", color: "bg-rose-500", text: "Atención al cliente excelente, me resolvieron todo en minutos. Definitivamente vuelvo.", stars: 5 },
              { name: "Diego F.", location: "Villa Nueva", color: "bg-indigo-500", text: "El streaming funciona perfectísimo en todos mis dispositivos. Vale cada quetzal.", stars: 5 },
            ]).map((t, i) => (
              <div key={i} className="w-[300px] shrink-0 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl ${t.color} flex items-center justify-center text-white font-black text-lg shadow-md`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{t.name}</p>
                    <p className="text-slate-400 text-[11px] font-medium">{t.location}, GT</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(t.stars)].map((_, s) => <Star key={s} size={12} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-[13px] leading-relaxed font-medium flex-1">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* Footer */}
      {selectedProduct && (
        <Checkout 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {giftProduct && (
        <GiftProductModal
          product={giftProduct}
          onClose={() => setGiftProduct(null)}
        />
      )}

      {/* ── REFERRAL WELCOME BANNER ── */}
      <AnimatePresence>
        {referralBanner && !user && (
          <motion.div
            initial={{ y: 140, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 140, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl"
            style={{ transform: "translateX(-50%)" }}
          >
            {/* outer glow */}
            <div className="absolute -inset-1 rounded-[28px] opacity-60 blur-xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }} />
            <div className="relative rounded-[24px] overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(145deg, #0a0318 0%, #0d0530 40%, #0a0318 100%)", border: "1.5px solid rgba(99,102,241,0.45)" }}>
              {/* decorative blobs */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }} />

              {/* close */}
              <button
                onClick={() => setReferralBanner(null)}
                className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all text-sm"
              >✕</button>

              <div className="relative z-10 p-6 sm:p-8">
                {/* header row */}
                <div className="flex items-start gap-4 mb-5">
                  {/* big icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.45)" }}>
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[3px] mb-0.5" style={{ color: "#818cf8" }}>
                      Invitación especial
                    </p>
                    <p className="text-white font-black text-xl sm:text-2xl leading-tight">
                      ¡Has sido invitado!
                    </p>
                  </div>
                </div>

                {/* bonus highlight */}
                <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 mb-6">
                  <div className="flex-1 rounded-2xl p-4 text-center"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Bono de bienvenida</p>
                    <p className="font-black leading-none" style={{ color: "#818cf8", fontSize: "clamp(2rem, 8vw, 3rem)" }}>
                      Q{referralBanner.bonus}
                    </p>
                    <p className="text-white/40 text-[10px] mt-1">en tu saldo al registrarte</p>
                  </div>
                  <div className="flex-1 rounded-2xl p-4 flex flex-col justify-center text-center sm:text-left">
                    <p className="text-white/60 text-sm leading-relaxed">
                      Regístrate con el código
                    </p>
                    <div className="inline-flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="font-black text-white text-base tracking-widest px-3 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "monospace" }}>
                        {referralBanner.code}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mt-2 leading-relaxed">
                      El saldo se acredita automáticamente al crear tu cuenta.
                    </p>
                  </div>
                </div>

                {/* CTA button */}
                <Link href="/auth">
                  <button
                    className="w-full py-4 rounded-2xl font-black text-white text-base sm:text-lg tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      boxShadow: "0 8px 28px rgba(99,102,241,0.50)",
                    }}
                  >
                    Crear cuenta y recibir Q{referralBanner.bonus} gratis →
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
