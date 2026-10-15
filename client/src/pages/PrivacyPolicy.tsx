import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "Política de Entrega",
      items: [
        "Entrega inmediata vía WhatsApp (5-15 minutos)",
        "Horario de atención: 8:00 AM - 10:00 PM",
        "Confirmación de pago requerida antes del envío",
        "Datos de acceso enviados de forma segura"
      ]
    },
    {
      title: "Garantía del Servicio",
      items: [
        "Garantía de 30 días en todas las cuentas",
        "Reemplazo gratuito si la cuenta presenta fallas",
        "Soporte técnico incluido durante la garantía",
        "No aplica si se cambia la contraseña"
      ]
    },
    {
      title: "Métodos de Pago",
      items: [
        "Transferencia bancaria (Banrural, BAM, BI)",
        "Depósito en agente bancario",
        "Pago móvil (Tigo Money, etc.)",
        "Efectivo solo en zona metropolitana"
      ]
    },
    {
      title: "Términos de Uso",
      items: [
        "Las cuentas son para uso personal únicamente",
        "Prohibido compartir credenciales con terceros",
        "No modificar datos del perfil asignado",
        "Respetar las políticas de cada plataforma"
      ]
    },
    {
      title: "Política de Devoluciones",
      items: [
        "Reembolso solo si no podemos entregar el servicio",
        "No hay devoluciones una vez entregada la cuenta",
        "Cambios permitidos dentro de las primeras 24 horas",
        "Comunicar cualquier problema inmediatamente"
      ]
    },
    {
      title: "Contacto y Soporte",
      items: [
        "WhatsApp: +502 3787-1216",
        "Respuesta en menos de 1 hora",
        "Atención personalizada",
        "Seguimiento post-venta incluido"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">
            POLÍTICAS Y <span className="text-primary">TÉRMINOS</span>
          </h1>
          <div className="w-24 h-2 bg-primary mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform">
              <CardContent className="p-8">
                <h2 className="text-xl font-black text-primary uppercase mb-6 tracking-tight">
                  {section.title}
                </h2>
                <ul className="space-y-4">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-600 font-bold text-sm leading-relaxed">
                      <span className="text-primary">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
