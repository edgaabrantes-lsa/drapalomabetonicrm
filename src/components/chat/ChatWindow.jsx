import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Calendar, DollarSign, CheckCircle, MoreVertical, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import LeadInfoPanel from "./LeadInfoPanel";
import { useMessages } from "@/hooks/useMessages";

const CHANNEL_ICONS = {
  whatsapp: <span className="text-green-500 font-semibold text-[10px]">WhatsApp</span>,
  instagram: <span className="text-pink-500 font-semibold text-[10px]">Instagram</span>,
  website: <span className="text-blue-500 font-semibold text-[10px]">Site</span>,
};

const TEMP_DOT = {
  hot: "bg-red-500",
  warm: "bg-amber-400",
  cold: "bg-blue-400",
};

function DateDivider({ date }) {
  const label = isToday(date) ? "Hoje" : isYesterday(date) ? "Ontem" : format(date, "dd 'de' MMMM", { locale: ptBR });
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#F0F0F0]" />
      <span className="text-[10px] text-[#BBBBBB] px-2 py-0.5 bg-[#F9F9F7] rounded-full border border-[#EEEEEE]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#F0F0F0]" />
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F7] text-center p-8">
        <div className="w-16 h-16 rounded-full bg-[#EEEEEE] flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#BBBBBB]"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        </div>
        <h3 className="font-serif text-lg text-[#333] mb-1">Selecione uma conversa</h3>
        <p className="text-xs text-[#BBBBBB]">Escolha uma conversa na lista ao lado para começar o atendimento</p>
      </div>
    );
  }

  const lead = conversation.lead;

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.timestamp);
    const dateKey = format(date, "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F0] bg-white flex-shrink-0">
          {/* Mobile back */}
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden text-[#888]" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C5A059]/30 to-[#C5A059]/10 flex items-center justify-center text-[#C5A059] font-semibold text-sm">
              {lead?.name?.[0] || "?"}
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", TEMP_DOT[conversation.temperature] || "bg-gray-300")} />
          </div>

          {/* Name & info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[#121212] truncate">{lead?.name}</p>
            <div className="flex items-center gap-2">
              {CHANNEL_ICONS[conversation.channel]}
              <span className="text-[10px] text-[#BBBBBB]">{lead?.phone}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#BBBBBB] hover:text-[#121212]">
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#BBBBBB] hover:text-[#121212]">
              <Calendar className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#BBBBBB] hover:text-[#121212]">
              <DollarSign className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#BBBBBB] hover:text-green-600"
              title="Marcar como resolvido"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", showInfo ? "text-[#121212]" : "text-[#BBBBBB] hover:text-[#121212]")}
              onClick={() => setShowInfo(!showInfo)}
            >
              <User className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ background: "linear-gradient(180deg, #F0F4F8 0%, #F9F9F7 100%)" }}
        >
          {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <DateDivider date={new Date(dateKey)} />
              {msgs.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-[#BBBBBB]">Sem mensagens ainda</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <MessageInput
          onSend={sendMessage}
          messages={messages}
          leadContext={lead}
          disabled={sending}
        />
      </div>

      {/* Info panel */}
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