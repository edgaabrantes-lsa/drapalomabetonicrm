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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickSelect = (content) => {
    setText(content);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative border-t border-[#F0F0F0] bg-white">
      {/* Quick Replies Popup */}
      {showQuick && (
        <QuickReplies onSelect={handleQuickSelect} onClose={() => setShowQuick(false)} />
      )}

      {/* AI Reply Popup */}
      {showAI && (
        <AIReplyBox
          messages={messages}
          leadContext={leadContext}
          onUse={(content) => { setText(content); textareaRef.current?.focus(); }}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#F5F5F5]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowQuick(!showQuick); setShowAI(false); }}
          className={cn("h-7 text-[10px] gap-1 rounded-sm text-[#888] hover:text-[#121212]", showQuick && "text-[#121212] bg-[#F0F0F0]")}
        >
          <Zap className="h-3 w-3 text-[#C5A059]" />
          Respostas Rápidas
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowAI(!showAI); setShowQuick(false); }}
          className={cn("h-7 text-[10px] gap-1 rounded-sm text-[#888] hover:text-[#121212]", showAI && "text-[#121212] bg-[#F0F0F0]")}
        >
          <Sparkles className="h-3 w-3 text-[#C5A059]" />
          Assistente IA
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-sm text-[#888] hover:text-[#121212]">
          <CheckSquare className="h-3 w-3" />
          Criar Tarefa
        </Button>
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#BBBBBB] hover:text-[#888] flex-shrink-0">
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem... (Enter para enviar)"
          disabled={disabled}
          rows={1}
          className="flex-1 text-sm text-[#121212] bg-[#F9F9F7] border border-[#EEEEEE] rounded-2xl px-4 py-2 resize-none outline-none focus:border-[#CCCCCC] placeholder:text-[#BBBBBB] leading-5 max-h-32 overflow-y-auto"
          style={{ minHeight: "38px" }}
          onInput={(e) => {
            e.target.style.height = "38px";
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
          }}
        />

        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#BBBBBB] hover:text-[#888] flex-shrink-0">
          <Smile className="h-4 w-4" />
        </Button>

        {text.trim() ? (
          <Button
            onClick={handleSend}
            disabled={disabled}
            className="h-8 w-8 p-0 bg-[#25D366] hover:bg-[#20c05c] rounded-full flex-shrink-0"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#BBBBBB] hover:text-[#25D366] flex-shrink-0">
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}