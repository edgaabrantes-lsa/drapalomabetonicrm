import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, DollarSign, UserCheck, X, Phone, Tag } from "lucide-react";
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
  whatsapp: "WhatsApp", instagram: "Instagram", website: "Site", google: "Google", referral: "Indicação",
};

const TEMP_CONFIG = {
  hot: { label: "Quente", color: "#F87171", bg: "rgba(239,68,68,0.12)" },
  warm: { label: "Morno", color: "#FBBF24", bg: "rgba(245,158,11,0.12)" },
  cold: { label: "Frio", color: "#60A5FA", bg: "rgba(59,130,246,0.12)" },
};

export default function LeadInfoPanel({ conversation, onClose, onStatusChange }) {
  const lead = conversation?.lead;
  const temp = TEMP_CONFIG[conversation?.temperature] || TEMP_CONFIG.warm;
  if (!conversation) return null;

  return (
    <div className="h-full flex flex-col w-64 border-l flex-shrink-0" style={{ backgroundColor: "#0F1521", borderColor: "#1E2535" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#1E2535" }}>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#8A95AA" }}>Ficha do Lead</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" style={{ color: "#5A6478" }} onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Identity */}
        <div className="p-4 border-b" style={{ borderColor: "#1A2030" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: "linear-gradient(135deg, rgba(197,160,89,0.25), rgba(197,160,89,0.08))", color: "#C5A059" }}>
              {lead?.name?.[0] || "?"}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#E8EDF5" }}>{lead?.name}</p>
              <p className="text-xs" style={{ color: "#5A6478" }}>{lead?.phone}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: temp.bg, color: temp.color }}>
              {temp.label}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#1A2030", color: "#8A95AA" }}>
              {CHANNEL_LABELS[conversation.channel] || "Direto"}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 border-b" style={{ borderColor: "#1A2030" }}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4A5568" }}>Status do Funil</p>
          <Select value={conversation.status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 text-xs rounded-sm" style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#C8D0DF" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#1A2030", borderColor: "#252D3E" }}>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs" style={{ color: "#C8D0DF" }}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="p-4 border-b" style={{ borderColor: "#1A2030" }}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4A5568" }}>Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: Calendar, label: "Agendar" },
              { icon: DollarSign, label: "Orçamento" },
              { icon: FileText, label: "Ver Ficha" },
              { icon: UserCheck, label: "Transferir" },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="h-8 text-[10px] rounded-sm border flex items-center justify-center gap-1 transition-colors hover:bg-white/5"
                style={{ borderColor: "#252D3E", color: "#8A95AA" }}>
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4A5568" }}>Contato</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" style={{ color: "#4A5568" }} />
              <span className="text-xs" style={{ color: "#8A95AA" }}>{lead?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3" style={{ color: "#4A5568" }} />
              <span className="text-xs" style={{ color: "#8A95AA" }}>Origem: {CHANNEL_LABELS[lead?.source] || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}