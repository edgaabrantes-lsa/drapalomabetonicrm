import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, DollarSign, UserCheck, X, Phone, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = [
  { value: "new", label: "Novo" },
  { value: "in_progress", label: "Em Atendimento" },
  { value: "scheduled", label: "Consulta Agendada" },
  { value: "budget_sent", label: "Orçamento Enviado" },
  { value: "closing", label: "Fechamento" },
  { value: "active_patient", label: "Paciente Ativo" },
  { value: "lost", label: "Perdido" },
];

const CHANNEL_LABELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  website: "Site",
  google: "Google",
  referral: "Indicação",
};

const TEMP_CONFIG = {
  hot: { label: "Quente", className: "text-red-600 bg-red-50 border-red-200" },
  warm: { label: "Morno", className: "text-amber-600 bg-amber-50 border-amber-200" },
  cold: { label: "Frio", className: "text-blue-600 bg-blue-50 border-blue-200" },
};

export default function LeadInfoPanel({ conversation, onClose, onStatusChange }) {
  const lead = conversation?.lead;
  const temp = TEMP_CONFIG[conversation?.temperature] || TEMP_CONFIG.warm;

  if (!conversation) return null;

  return (
    <div className="h-full flex flex-col border-l border-[#F0F0F0] bg-white w-72">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
        <h3 className="text-xs font-semibold text-[#121212] uppercase tracking-wider">Ficha do Lead</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5 text-[#888]" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Lead Identity */}
        <div className="p-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A059]/30 to-[#C5A059]/10 flex items-center justify-center text-[#C5A059] font-bold text-lg">
              {lead?.name?.[0] || "?"}
            </div>
            <div>
              <p className="font-semibold text-sm text-[#121212]">{lead?.name}</p>
              <p className="text-xs text-[#888]">{lead?.phone}</p>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", temp.className)}>
              {temp.label}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {CHANNEL_LABELS[conversation.channel] || "Direto"}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 border-b border-[#F0F0F0]">
          <p className="text-[10px] uppercase tracking-wider text-[#BBBBBB] mb-2">Status do Funil</p>
          <Select value={conversation.status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 text-xs border-[#EEEEEE] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-[#F0F0F0]">
          <p className="text-[10px] uppercase tracking-wider text-[#BBBBBB] mb-2">Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-sm border-[#EEEEEE] text-[#555] gap-1">
              <Calendar className="h-3 w-3" /> Agendar
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-sm border-[#EEEEEE] text-[#555] gap-1">
              <DollarSign className="h-3 w-3" /> Orçamento
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-sm border-[#EEEEEE] text-[#555] gap-1">
              <FileText className="h-3 w-3" /> Ver Ficha
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-sm border-[#EEEEEE] text-[#555] gap-1">
              <UserCheck className="h-3 w-3" /> Transferir
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#BBBBBB] mb-2">Contato</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-[#BBBBBB]" />
              <span className="text-xs text-[#555]">{lead?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3 text-[#BBBBBB]" />
              <span className="text-xs text-[#555]">Origem: {CHANNEL_LABELS[lead?.source] || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}