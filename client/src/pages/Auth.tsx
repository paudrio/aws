import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/context";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { setCurrentUserId } from "@/lib/queryClient";
import { ArrowLeft, Mail, Lock, User, Tv, ShoppingBag, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const features = [
  { icon: Tv, label: "TV en vivo", desc: "Cientos de canales en tiempo real" },
  { icon: ShoppingBag, label: "Marketplace", desc: "Productos y servicios digitales" },
  { icon: Zap, label: "Suscripciones", desc: "Streaming premium al mejor precio" },
  { icon: Shield, label: "100% Seguro", desc: "Pagos y datos protegidos" },
];

export default function Auth() {
  const { isAuthenticated } = useAuth();
  const { login } = useApp();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [credUser, setCredUser] = useState("");
  const [credPass, setCredPass] = useState("");
  const [credLoading, setCredLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [regData, setRegData] = useState({ username: "", password: "", firstName: "", lastName: "", email: "" });
  const [pendingRefCode] = useState(() => localStorage.getItem("paudronix_ref") || "");

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const handleGoogleLogin = () => {
    const ref = localStorage.getItem("paudronix_ref");
    window.location.href = ref ? `/api/auth/google?ref=${encodeURIComponent(ref)}` : "/api/login";
  };

  const handleCredLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credUser || !credPass) return;
    setCredLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: credUser.trim(), password: credPass.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user?.role === "admin") {
          await login(credUser, credPass);
        } else {
          if (data.user?.id) setCurrentUserId(data.user.id);
          queryClient.setQueryData(["/api/auth/user"], data.user);
          setLocation("/");
        }
      } else {
        alert(data.error || "Credenciales incorrectas");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setCredLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...regData, referralCode: pendingRefCode || undefined }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (pendingRefCode) localStorage.removeItem("paudronix_ref");
        if (data.user?.id) setCurrentUserId(data.user.id);
        queryClient.setQueryData(["/api/auth/user"], data.user);
        setLocation("/perfil");
      } else {
        alert(data.error || "Error al registrarse");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setCredLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* LEFT PANEL — dark brand side */}
      <div className="hidden md:flex md:w-[48%] bg-[#0f0f14] flex-col justify-between p-10 relative overflow-hidden">

        {/* Background glow effects */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-[#6366f1]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group w-fit">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><clipPath id="auth-badge-clip"><rect width="52" height="52" rx="13"/></clipPath></defs>
              <rect width="52" height="52" rx="13" fill="#1e293b"/>
              <polygon points="52,0 52,30 22,0" fill="#6366f1" clipPath="url(#auth-badge-clip)"/>
              <text x="7" y="38" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="white">PG</text>
              <rect x="7" y="43" width="22" height="3" rx="1.5" fill="#6366f1"/>
            </svg>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-3xl text-white uppercase italic tracking-tight">PAUDRONIX</span>
              <span className="font-display font-black text-3xl text-[#6366f1] uppercase italic tracking-tight">GT</span>
            </div>
          </div>
        </Link>

        {/* Headline */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl xl:text-5xl font-black text-white leading-tight"
          >
            La plataforma digital<br />
            <span className="text-[#6366f1]">#1 de Guatemala</span>
          </motion.h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Streaming, TV en vivo, suscripciones y más — todo en un solo lugar.
          </p>

          {/* Feature list */}
          <div className="space-y-4 pt-2">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-slate-600 text-xs">
          &copy; {new Date().getFullYear()} PAUDRONIX GT — Guatemala
        </p>
      </div>

      {/* RIGHT PANEL — form side */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-white px-6 py-12">

        {/* Mobile logo */}
        <Link href="/">
          <div className="flex md:hidden items-center gap-2 mb-10 cursor-pointer">
            <svg width="40" height="40" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><clipPath id="auth-mob-clip"><rect width="52" height="52" rx="13"/></clipPath></defs>
              <rect width="52" height="52" rx="13" fill="#1e293b"/>
              <polygon points="52,0 52,30 22,0" fill="#6366f1" clipPath="url(#auth-mob-clip)"/>
              <text x="7" y="38" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="white">PG</text>
              <rect x="7" y="43" width="22" height="3" rx="1.5" fill="#6366f1"/>
            </svg>
            <span className="font-display font-black text-2xl text-[#0f172a] uppercase italic">PAUDRONIX</span>
            <span className="font-display font-black text-2xl text-[#6366f1] uppercase italic">GT</span>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? "register" : "login"}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-black text-[#0f172a]">
                  {isRegister ? "Crear cuenta" : "Bienvenido de nuevo"}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {isRegister
                    ? "Completa los campos para registrarte"
                    : "Ingresa tus datos para continuar"}
                </p>
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700 mb-6 shadow-sm"
              >
                <GoogleIcon className="w-5 h-5" />
                Continuar con Google
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">o con tus datos</span>
                </div>
              </div>

              {/* Forms */}
              {!isRegister ? (
                <form onSubmit={handleCredLogin} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Usuario o Email"
                      value={credUser}
                      onChange={(e) => setCredUser(e.target.value)}
                      required
                      className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={credPass}
                      onChange={(e) => setCredPass(e.target.value)}
                      required
                      className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                  <button
                    type="submit"
                    disabled={credLoading}
                    className="w-full h-12 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm transition-all shadow-lg shadow-[#6366f1]/25 disabled:opacity-50 mt-1"
                  >
                    {credLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </button>
                  <p className="text-center text-sm text-slate-500 pt-1">
                    ¿Sin cuenta?{" "}
                    <button type="button" onClick={() => setIsRegister(true)} className="font-bold text-[#6366f1] hover:underline">
                      Regístrate gratis
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={regData.firstName}
                      onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={regData.lastName}
                      onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={credLoading}
                    className="w-full h-12 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm transition-all shadow-lg shadow-[#6366f1]/25 disabled:opacity-50"
                  >
                    {credLoading ? "Creando cuenta..." : "Crear cuenta"}
                  </button>
                  <p className="text-center text-sm text-slate-500 pt-1">
                    ¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => setIsRegister(false)} className="font-bold text-[#6366f1] hover:underline">
                      Inicia sesión
                    </button>
                  </p>
                </form>
              )}

              {/* Bottom links */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                  Al continuar aceptas nuestros{" "}
                  <span className="font-semibold text-slate-500">Términos</span> y{" "}
                  <span className="font-semibold text-slate-500">Política de privacidad</span>.
                </p>
                <Link href="/">
                  <button
                    type="button"
                    className="w-full h-10 rounded-xl border border-slate-200 hover:border-[#6366f1]/40 text-slate-500 hover:text-[#6366f1] font-semibold text-xs transition-all"
                  >
                    Explorar sin cuenta
                  </button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
