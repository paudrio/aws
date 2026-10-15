import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Plus, ArrowLeft, CheckCircle2, Camera } from "lucide-react";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  isSeller: boolean;
  message: string;
  imageUrl?: string;
  createdAt: string;
  agentIndex?: number;
  agentImage?: string;
}

const AGENTS = [
  { name: "Sofía García", role: "Asesora de Cuentas", avatar: "https://i.pravatar.cc/80?img=5" },
  { name: "Valentina Reyes", role: "Coordinadora Comercial", avatar: "https://i.pravatar.cc/80?img=44" },
  { name: "Camila Ortiz", role: "Gestora de Vendedores", avatar: "https://i.pravatar.cc/80?img=49" },
  { name: "Sebastián López", role: "Asesor Senior", avatar: "https://i.pravatar.cc/80?img=33" },
  { name: "Mateo Hernández", role: "Ejecutivo de Cuenta", avatar: "https://i.pravatar.cc/80?img=15" },
  { name: "Andrés Morales", role: "Soporte Comercial", avatar: "https://i.pravatar.cc/80?img=57" },
];

export default function SupportChat() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("+50237871216");
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newFirstMessage, setNewFirstMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [typingAgentImage, setTypingAgentImage] = useState("");
  const [typingAgentName, setTypingAgentName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const typingPollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d?.whatsappNumber) setWhatsappNumber(d.whatsappNumber.replace(/\s+/g, ""));
    }).catch(() => {});
  }, []);

  const fetchTickets = async (syncActive = false) => {
    try {
      const res = await fetch("/api/support/tickets", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        if (syncActive) {
          setActiveTicket((prev: any) => {
            if (!prev) return prev;
            const updated = data.find((t: any) => t.id === prev.id);
            return updated ? { ...prev, status: updated.status } : prev;
          });
        }
      }
    } catch {}
  };

  const fetchMessages = async (ticketId: string, forceScroll = false) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (forceScroll) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      }
    } catch {}
  };

  const pollTyping = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/typing/support/${ticketId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setIsAdminTyping(data.typing);
        if (data.typing) {
          if (data.agentImage) setTypingAgentImage(data.agentImage);
          if (data.agentName) setTypingAgentName(data.agentName);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) fetchTickets();
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (view === "chat" && activeTicket) {
      fetchMessages(activeTicket.id, true);
      pollRef.current = setInterval(() => {
        fetchMessages(activeTicket.id, false);
        fetchTickets(true);
      }, 5000);
      typingPollRef.current = setInterval(() => pollTyping(activeTicket.id), 1500);
    } else {
      clearInterval(pollRef.current);
      clearInterval(typingPollRef.current);
      setIsAdminTyping(false);
    }
    return () => {
      clearInterval(pollRef.current);
      clearInterval(typingPollRef.current);
    };
  }, [view, activeTicket]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newFirstMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: newSubject, message: newFirstMessage }),
      });
      if (res.ok) {
        const ticket = await res.json();
        setNewSubject("");
        setNewFirstMessage("");
        setActiveTicket(ticket);
        setView("chat");
        fetchTickets();
      }
    } catch {} finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (imageUrl?: string) => {
    if (!imageUrl && !newMessage.trim()) return;
    if (!activeTicket) return;
    const msgText = newMessage;
    if (!imageUrl) setNewMessage("");
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      ticketId: activeTicket.id,
      senderId: user?.id || "",
      senderName: user?.firstName || "Tú",
      isAdmin: false,
      isSeller: false,
      message: imageUrl ? "" : msgText,
      imageUrl: imageUrl || "",
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    setIsSending(true);
    try {
      await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: imageUrl ? "" : msgText, imageUrl: imageUrl || "" }),
      });
      fetchMessages(activeTicket.id, true);
    } catch {} finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        await handleSendMessage(data.url);
      }
    } catch {} finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const openTicket = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setView("chat");
  };

  const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Hola%2C%20necesito%20ayuda%20con%20mi%20pedido%20en%20PAUDRONIX%20GT`;

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer">
          <button className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 flex items-center justify-center hover:scale-110 transition-transform">
            <WhatsAppIcon />
          </button>
        </a>
        <a href="/auth">
          <button className="w-14 h-14 rounded-full bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30 flex items-center justify-center hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6" />
          </button>
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
          <div className="bg-[#6366f1] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {view !== "list" && (
                <button onClick={() => { setView("list"); setActiveTicket(null); }} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">PAUDRONIX GT</h3>
                <p className="text-[10px] text-white/80 font-bold">Soporte al Cliente</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {view === "list" && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <Button onClick={() => setView("new")} className="w-full bg-[#6366f1] hover:bg-[#6366f1]/90 rounded-xl h-10 font-bold text-xs uppercase tracking-wider">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Mensaje
                </Button>
              </div>
              {tickets.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">No tienes conversaciones</p>
                  <p className="text-xs text-slate-300">Inicia una nueva para recibir ayuda</p>
                </div>
              ) : (
                <div className="space-y-1 px-3 pb-3">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => openTicket(ticket)}
                      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900 truncate flex-1">{ticket.subject}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                          ticket.status === "open" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {ticket.status === "open" ? "Abierto" : "Cerrado"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {new Date(ticket.updatedAt).toLocaleDateString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "new" && (
            <div className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <label className="font-bold text-xs uppercase tracking-widest text-slate-400">Asunto</label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ej: Problema con mi suscripcion"
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-xs uppercase tracking-widest text-slate-400">Mensaje</label>
                <textarea
                  value={newFirstMessage}
                  onChange={(e) => setNewFirstMessage(e.target.value)}
                  placeholder="Describe tu problema o pregunta..."
                  className="w-full h-28 rounded-xl border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                />
              </div>
              <Button
                onClick={handleCreateTicket}
                disabled={isSending || !newSubject.trim() || !newFirstMessage.trim()}
                className="w-full bg-[#6366f1] hover:bg-[#6366f1]/90 rounded-xl h-11 font-bold uppercase tracking-wider text-xs"
              >
                {isSending ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </div>
          )}

          {view === "chat" && activeTicket && (
            <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
                <p className="font-bold text-sm text-slate-700 truncate">{activeTicket.subject}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    activeTicket.status === "open" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {activeTicket.status === "open" ? "Abierto" : "Cerrado"}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "280px" }}>
                {messages.map((msg) => {
                  const fallbackAgent = AGENTS[msg.agentIndex ?? 0] || AGENTS[0];
                  const agentName = msg.isAdmin ? (msg.senderName || fallbackAgent.name) : fallbackAgent.name;
                  const agentAvatar = msg.agentImage || fallbackAgent.avatar;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.isAdmin || msg.isSeller ? "justify-start" : "justify-end"}`}>
                      {msg.isAdmin && (
                        <img src={agentAvatar} alt={agentName} className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white shadow-md" />
                      )}
                      <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                        msg.isAdmin
                          ? "bg-slate-100 text-slate-800 rounded-tl-md"
                          : msg.isSeller
                          ? "bg-blue-100 text-blue-800 rounded-tl-md"
                          : "bg-[#6366f1] text-white rounded-tr-md"
                      }`}>
                        {msg.imageUrl ? (
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img src={msg.imageUrl} alt="imagen" className="max-w-full max-h-48 object-cover" />
                          </a>
                        ) : (
                          <div className="px-4 py-2.5">
                            {msg.isAdmin && (
                              <p className="text-[9px] font-black uppercase tracking-wider mb-1 text-[#6366f1]">{agentName}</p>
                            )}
                            {msg.isSeller && (
                              <p className="text-[9px] font-black uppercase tracking-wider mb-1 text-blue-600">Revendedor</p>
                            )}
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        )}
                        <p className={`text-[9px] pb-2 px-3 ${msg.isAdmin || msg.isSeller ? "text-slate-400" : "text-white/60"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {isAdminTyping && (() => {
                  const lastAdmin = [...messages].reverse().find(m => m.isAdmin);
                  const resolvedAvatar = typingAgentImage || lastAdmin?.agentImage || (lastAdmin ? (AGENTS[lastAdmin.agentIndex ?? 0] || AGENTS[0]).avatar : AGENTS[0].avatar);
                  const resolvedName = typingAgentName || lastAdmin?.senderName || AGENTS[0].name;
                  return (
                  <div className="flex items-end gap-2 justify-start">
                    <img src={resolvedAvatar} alt={resolvedName} className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white shadow-md" />
                    <div className="bg-slate-100 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                  );
                })()}
                <div ref={messagesEndRef} />
              </div>
              {activeTicket.status === "open" ? (
                <div className="p-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading || isSending}
                    className="text-slate-400 hover:text-[#6366f1] transition-colors p-2 rounded-xl hover:bg-blue-50 shrink-0"
                    title="Enviar foto"
                  >
                    {imageUploading ? (
                      <div className="w-5 h-5 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe aqui..."
                    className="rounded-xl h-10 flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={isSending || (!newMessage.trim() && !imageUploading)}
                    size="icon"
                    className="bg-[#6366f1] hover:bg-[#6366f1]/90 rounded-xl w-10 h-10 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 border-t border-slate-100 text-center shrink-0">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="text-xs font-bold">Este caso ha sido cerrado</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer">
          <button
            title="Contactar por WhatsApp"
            className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <WhatsAppIcon />
          </button>
        </a>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${
            isOpen ? "bg-slate-700 shadow-slate-700/30" : "bg-[#6366f1] shadow-[#6366f1]/30"
          } text-white`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
