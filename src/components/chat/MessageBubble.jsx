import React from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatusIcon = ({ status }) => {
  if (status === "sent") return <Clock className="w-3 h-3 text-gray-400" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-gray-400" />;
  if (status === "read") return <CheckCheck className="w-3 h-3 text-blue-500" />;
  return null;
};

export default function MessageBubble({ message }) {
  const isStaff = message.sender_type === "staff";
  const time = format(new Date(message.timestamp), "HH:mm", { locale: ptBR });

  return (
    <div className={cn("flex mb-1.5", isStaff ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[72%] px-3.5 py-2 rounded-2xl shadow-sm relative",
          isStaff
            ? "bg-[#DCF8C6] text-[#121212] rounded-br-sm"
            : "bg-white text-[#121212] rounded-bl-sm border border-[#F0F0F0]"
        )}
      >
        {!isStaff && (
          <p className="text-[10px] font-semibold text-[#C5A059] mb-0.5">{message.sender_name}</p>
        )}

        {message.message_type === "text" && (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}

        {message.message_type === "image" && message.media_url && (
          <img src={message.media_url} alt="Imagem" className="rounded-lg max-w-full mb-1" />
        )}

        {message.message_type === "audio" && (
          <div className="flex items-center gap-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#C5A059]"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </div>
            <div className="flex-1">
              <div className="h-1 bg-[#C5A059]/30 rounded-full w-24"></div>
            </div>
            <span className="text-[10px] text-[#888]">0:12</span>
          </div>
        )}

        <div className={cn("flex items-center gap-1 mt-0.5", isStaff ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-[#888]">{time}</span>
          {isStaff && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}