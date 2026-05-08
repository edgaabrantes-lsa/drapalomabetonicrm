import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHANNEL_ICONS = {
  whatsapp: (
    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-pink-500"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-blue-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
  ),
};

const TEMPERATURE_CONFIG = {
  hot: { label: "Quente", className: "bg-red-50 text-red-600 border-red-200" },
  warm: { label: "Morno", className: "bg-amber-50 text-amber-600 border-amber-200" },
  cold: { label: "Frio", className: "bg-blue-50 text-blue-600 border-blue-200" },
};

const STATUS_CONFIG = {
  new: { label: "Novo", className: "bg-green-50 text-green-700" },
  in_progress: { label: "Em Atendimento", className: "bg-blue-50 text-blue-700" },
  scheduled: { label: "Consulta Agendada", className: "bg-purple-50 text-purple-700" },
  budget_sent: { label: "Orçamento Enviado", className: "bg-orange-50 text-orange-700" },
  closing: { label: "Fechamento", className: "bg-yellow-50 text-yellow-700" },
  active_patient: { label: "Paciente Ativo", className: "bg-teal-50 text-teal-700" },
  lost: { label: "Perdido", className: "bg-gray-100 text-gray-500" },
};

export default function ConversationItem({ conversation, isActive, onClick }) {
  const temp = TEMPERATURE_CONFIG[conversation.temperature] || TEMPERATURE_CONFIG.warm;
  const status = STATUS_CONFIG[conversation.status] || STATUS_CONFIG.new;
  const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-[#F0F0F0] transition-all duration-150 hover:bg-slate-50 relative",
        isActive && "bg-slate-50 border-l-[3px] border-l-[#C5A059]"
      )}
    >
      {/* Unread indicator */}
      {conversation.unread_count > 0 && (
        <span className="absolute top-3 right-3 bg-green-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
          {conversation.unread_count}
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5A059]/30 to-[#C5A059]/10 flex items-center justify-center text-[#C5A059] font-semibold text-sm">
            {conversation.lead?.name?.[0] || "?"}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
            {CHANNEL_ICONS[conversation.channel] || CHANNEL_ICONS.website}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className={cn("text-sm font-medium truncate mr-2", isActive ? "text-[#121212]" : "text-[#333]")}>
              {conversation.lead?.name || "Contato"}
            </p>
            <span className="text-[10px] text-[#BBBBBB] flex-shrink-0">{timeAgo}</span>
          </div>

          <p className="text-xs text-[#888] truncate mb-1.5">
            {conversation.last_message}
          </p>

          <div className="flex items-center gap-1 flex-wrap">
            <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full border", temp.className)}>
              {temp.label}
            </span>
            <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", status.className)}>
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}