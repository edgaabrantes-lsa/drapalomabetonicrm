import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Mic, Paperclip, Smile, Zap, Sparkles, CheckSquare } from "lucide-react";
import QuickReplies from "./QuickReplies";
import AIReplyBox from "./AIReplyBox";
import { cn } from "@/lib/utils";

export default function MessageInput({ onSend, messages, leadContext, disabled }) {
  const [text, setText] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="relative border-t" style={{ borderColor: "#1E2535", backgroundColor: "#0F1521" }}>
      {showQuick && <QuickReplies onSelect={(c) => { setText(c); textareaRef.current?.focus(); }} onClose={() => setShowQuick(false)} />}
      {showAI && <AIReplyBox messages={messages} leadContext={leadContext} onUse={(c) => { setText(c); textareaRef.current?.focus(); }} onClose={() => setShowAI(false)} />}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b" style={{ borderColor: "#1A2030" }}>
        <button
          onClick={() => { setShowQuick(!showQuick); setShowAI(false); }}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-sm transition-colors"
          style={{ color: showQuick ? "#C5A059" : "#5A6478", backgroundColor: showQuick ? "rgba(197,160,89,0.1)" : "transparent" }}
        >
          <Zap className="h-3 w-3" style={{ color: "#C5A059" }} />
          Respostas Rápidas
        </button>
        <button
          onClick={() => { setShowAI(!showAI); setShowQuick(false); }}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-sm transition-colors"
          style={{ color: showAI ? "#C5A059" : "#5A6478", backgroundColor: showAI ? "rgba(197,160,89,0.1)" : "transparent" }}
        >
          <Sparkles className="h-3 w-3" style={{ color: "#C5A059" }} />
          Assistente IA
        </button>
        <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-sm" style={{ color: "#5A6478" }}>
          <CheckSquare className="h-3 w-3" />
          Criar Tarefa
        </button>
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hover:bg-white/5" style={{ color: "#4A5568" }}>
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          disabled={disabled}
          rows={1}
          className="flex-1 text-sm rounded-2xl px-4 py-2 resize-none outline-none leading-5 max-h-32 overflow-y-auto"
          style={{
            backgroundColor: "#1A2030",
            border: "1px solid #252D3E",
            color: "#E8EDF5",
            minHeight: "38px",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#C5A059"; }}
          onBlur={(e) => { e.target.style.borderColor = "#252D3E"; }}
          onInput={(e) => {
            e.target.style.height = "38px";
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
          }}
        />

        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hover:bg-white/5" style={{ color: "#4A5568" }}>
          <Smile className="h-4 w-4" />
        </Button>

        {text.trim() ? (
          <Button onClick={handleSend} disabled={disabled} className="h-8 w-8 p-0 rounded-full flex-shrink-0" style={{ backgroundColor: "#25D366" }}>
            <Send className="h-4 w-4 text-white" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hover:text-green-400 hover:bg-white/5" style={{ color: "#4A5568" }}>
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}