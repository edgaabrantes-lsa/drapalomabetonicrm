import React from "react";
import { CheckCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatusIcon = ({ status }) => {
  if (status === "sent") return <Clock className="w-3 h-3" style={{ color: "#4A5568" }} />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3" style={{ color: "#4A5568" }} />;
  if (status === "read") return <CheckCheck className="w-3 h-3" style={{ color: "#60A5FA" }} />;
  return null;
};

export default function MessageBubble({ message }) {
  const isStaff = message.sender_type === "staff";
  const time = format(new Date(message.timestamp), "HH:mm", { locale: ptBR });

  return (
    <div className={`flex mb-1.5 ${isStaff ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[72%] px-3.5 py-2 rounded-2xl shadow-sm"
        style={
          isStaff
            ? { backgroundColor: "#1A3A2A", borderBottomRightRadius: "4px", color: "#D1FAE5" }
            : { backgroundColor: "#1A2030", border: "1px solid #252D3E", borderBottomLeftRadius: "4px", color: "#C8D0DF" }
        }
      >
        {!isStaff && (
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#C5A059" }}>{message.sender_name}</p>
        )}

        {message.message_type === "text" && (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}

        {message.message_type === "audio" && (
          <div className="flex items-center gap-2 py-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(197,160,89,0.15)" }}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ fill: "#C5A059" }}><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </div>
            <div className="flex-1">
              <div className="h-1 rounded-full w-20" style={{ backgroundColor: "rgba(197,160,89,0.2)" }}></div>
            </div>
            <span className="text-[10px]" style={{ color: "#5A6478" }}>0:12</span>
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 ${isStaff ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px]" style={{ color: "#4A5568" }}>{time}</span>
          {isStaff && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}