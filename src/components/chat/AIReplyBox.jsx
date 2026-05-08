import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Check, RefreshCw } from "lucide-react";
import { AIService } from "@/services/AIService";
import { cn } from "@/lib/utils";

export default function AIReplyBox({ messages, leadContext, onUse, onClose }) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    const reply = await AIService.suggestReply(messages, leadContext);
    setSuggestion(reply);
    setGenerated(true);
    setLoading(false);
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#C5A059]/30 rounded-sm shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0] bg-gradient-to-r from-[#C5A059]/5 to-transparent">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
          <span className="text-xs font-semibold text-[#121212]">Assistente IA</span>
          <span className="text-[9px] text-[#888] bg-[#F0F0F0] px-1.5 py-0.5 rounded-full ml-1">Sugestão para revisão</span>
        </div>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
          <X className="h-3 w-3 text-[#888]" />
        </Button>
      </div>

      <div className="p-4">
        {!generated ? (
          <div className="text-center py-3">
            <p className="text-xs text-[#888] mb-3">A IA vai analisar a conversa e sugerir uma resposta personalizada.</p>
            <Button
              onClick={generate}
              disabled={loading}
              className="bg-[#121212] hover:bg-[#2a2a2a] text-white rounded-sm text-xs h-8"
            >
              {loading ? (
                <><RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />Analisando...</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-1.5" />Gerar Sugestão</>
              )}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Sugestão gerada pela IA:</p>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="w-full text-xs text-[#121212] border border-[#EEEEEE] rounded-sm p-3 bg-[#F9F9F7] resize-none h-20 outline-none focus:border-[#C5A059]"
            />
            <p className="text-[10px] text-[#BBBBBB] mb-3">Você pode editar antes de usar.</p>
            <div className="flex gap-2">
              <Button
                onClick={() => { onUse(suggestion); onClose(); }}
                className="bg-[#121212] hover:bg-[#2a2a2a] text-white rounded-sm text-xs h-7 flex-1"
              >
                <Check className="h-3 w-3 mr-1" /> Usar Resposta
              </Button>
              <Button
                variant="outline"
                onClick={generate}
                className="border-[#EEEEEE] text-[#555] rounded-sm text-xs h-7"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}