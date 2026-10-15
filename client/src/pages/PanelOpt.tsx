import React from "react";
import { ShieldCheck, Clock, Zap, ExternalLink, Lock, Wifi } from "lucide-react";

export default function PanelOpt() {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Acceso Seguro",
      text: "Para ingresar al panel de control, es indispensable contar con un usuario y contraseña autorizados por el administrador.",
      color: "from-blue-500 to-cyan-400",
      glow: "shadow-blue-500/20",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Disponibilidad Total",
      text: "El sistema funciona las 24 horas del día, los 7 días de la semana, garantizando acceso constante a tus configuraciones.",
      color: "from-violet-500 to-purple-400",
      glow: "shadow-violet-500/20",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Gestión en Tiempo Real",
      text: "Cualquier cambio realizado en las opciones se reflejará de inmediato en la plataforma principal.",
      color: "from-amber-500 to-indigo-400",
      glow: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050a18] text-white overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-64 bg-cyan-600/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Panel Externo
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
            Panel de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              OPT
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Configuración avanzada y gestión del sistema{" "}
            <span className="text-white font-semibold">Paudronix GT</span>
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {features.map((item, i) => (
            <div
              key={i}
              className={`relative group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300 shadow-xl ${item.glow}`}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-4 shadow-lg`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-base mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none`} />
            </div>
          ))}
        </div>

        {/* Access card */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-cyan-600/20" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />
          <div className="relative p-10 md:p-14 text-center">
            <div className="flex justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Lock className="w-3.5 h-3.5 text-green-400" />
                <span>Encriptado</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                <span>Conexión estable</span>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
              Acceso a la Plataforma
            </h2>
            <p className="text-slate-400 mb-10 max-w-md mx-auto">
              Utiliza el siguiente enlace para acceder a la gestión de opciones externas:
            </p>

            <a
              href="https://paudronixopt.foo/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-black uppercase tracking-widest text-sm px-10 py-5 rounded-2xl shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              <ExternalLink className="w-5 h-5" />
              Ir a paudronixopt.foo
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
