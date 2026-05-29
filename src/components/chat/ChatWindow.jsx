import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Calendar, DollarSign, CheckCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import LeadInfoPanel from "./LeadInfoPanel";
import { useMessages } from "@/hooks/useMessages";

const CHANNEL_LABELS = {
  whatsapp: { label: "WhatsApp", color: "#4ADE80" },
  instagram: { label: "Instagram", color: "#F472B6" },
  website: { label: "Site", color: "#60A5FA" },
};

import { STAGE_MAP } from "@/hooks/useConversations";

// Mapeamento de cor por pipeline_stage — alinhado com CRM
const getStageDotColor = (pipeline_stage) => {
  return STAGE_MAP[pipeline_stage]?.color || "#6b7280";
};

function DateDivider({ date }) {
  const label = isToday(date) ? "Hoje" : isYesterday(date) ? "Ontem" : format(date, "dd 'de' MMMM", { locale: ptBR });
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ backgroundColor: "#1E2535" }} />
      <span className="text-[10px] px-3 py-0.5 rounded-full border" style={{ color: "#5A6478", borderColor: "#252D3E", backgroundColor: "#151C2A" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: "#1E2535" }} />
    </div>
  );
}

export default function ChatWindow({ conversation, onBack, onStatusChange }) {
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, sending, sendMessage, loadMessages } = useMessages(conversation?.id);

  useEffect(() => {
    if (conversation?.id) loadMessages(conversation.id);
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8" style={{ backgroundColor: "#111620" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#1A2030" }}>
          <svg viewBox="0 0 24 24" className="w-8 h-8" style={{ fill: "#2D3650" }}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        </div>
        <h3 className="font-serif text-lg mb-1" style={{ color: "#C8D0DF" }}>Selecione uma conversa</h3>
        <p className="text-xs" style={{ color: "#4A5568" }}>Escolha uma conversa na lista ao lado para começar o atendimento</p>
      </div>
    );
  }

  const lead = conversation.lead;
  const ch = CHANNEL_LABELS[conversation.channel] || { label: "Direto", color: "#8A95AA" };

  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = format(new Date(msg.timestamp), "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 border-b"
          style={{ backgroundColor: "#0F1521", borderColor: "#1E2535" }}>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden hover:bg-white/5" style={{ color: "#5A6478" }} onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, rgba(197,160,89,0.25), rgba(197,160,89,0.08))", color: "#C5A059" }}>
              {lead?.name?.[0] || "?"}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ backgroundColor: getStageDotColor(conversation.pipeline_stage), borderColor: "#0F1521" }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "#E8EDF5" }}>{lead?.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold" style={{ color: ch.color }}>{ch.label}</span>
              <span className="text-[10px]" style={{ color: "#4A5568" }}>{lead?.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5" style={{ color: "#4A5568" }} title="Ligar">
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5" style={{ color: "#4A5568" }} title="Agendar">
              <Calendar className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5" style={{ color: "#4A5568" }} title="Orçamento">
              <DollarSign className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5" style={{ color: "#4A5568" }} title="Resolver">
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 hover:bg-white/5"
              style={{ color: showInfo ? "#C5A059" : "#4A5568" }}
              onClick={() => setShowInfo(!showInfo)}
            >
              <User className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundColor: "#111620" }}>
          {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <DateDivider date={new Date(dateKey)} />
              {msgs.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs" style={{ color: "#4A5568" }}>Sem mensagens ainda</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <MessageInput onSend={sendMessage} messages={messages} leadContext={lead} disabled={sending} />
      </div>

      {showInfo && (
        <LeadInfoPanel
          conversation={conversation}
          onClose={() => setShowInfo(false)}
          onStatusChange={(status) => onStatusChange(conversation.id, status)}
        />
      )}
    </div>
  );
}