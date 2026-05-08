import React, { useState } from "react";
import { Sparkles, X, Check, RefreshCw } from "lucide-react";
import { AIService } from "@/services/AIService";

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
    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-sm shadow-2xl z-50 border"
      style={{ backgroundColor: "#171D29", borderColor: "rgba(197,160,89,0.3)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "#1E2535", background: "linear-gradient(90deg, rgba(197,160,89,0.08), transparent)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: "#C5A059" }} />
          <span className="text-xs font-semibold" style={{ color: "#E8EDF5" }}>Assistente IA</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#1A2030", color: "#8A95AA" }}>
            Sugestão para revisão
          </span>
        </div>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="h-3.5 w-3.5" style={{ color: "#5A6478" }} />
        </button>
      </div>

      <div className="p-4">
        {!generated ? (
          <div className="text-center py-2">
            <p className="text-xs mb-3" style={{ color: "#5A6478" }}>A IA vai analisar a conversa e sugerir uma resposta personalizada.</p>
            <button onClick={generate} disabled={loading}
              className="flex items-center gap-1.5 mx-auto text-xs px-4 py-2 rounded-sm font-medium transition-colors"
              style={{ backgroundColor: loading ? "#1A2030" : "#C5A059", color: loading ? "#5A6478" : "#111620" }}>
              {loading
                ? <><RefreshCw className="h-3 w-3 animate-spin" />Analisando...</>
                : <><Sparkles className="h-3 w-3" />Gerar Sugestão</>
              }
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5A6478" }}>Sugestão:</p>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="w-full text-xs rounded-sm p-3 resize-none h-20 outline-none"
              style={{ backgroundColor: "#1A2030", border: "1px solid #252D3E", color: "#E8EDF5" }}
              onFocus={(e) => e.target.style.borderColor = "#C5A059"}
              onBlur={(e) => e.target.style.borderColor = "#252D3E"}
            />
            <p className="text-[10px] mb-3" style={{ color: "#4A5568" }}>Você pode editar antes de usar.</p>
            <div className="flex gap-2">
              <button onClick={() => { onUse(suggestion); onClose(); }}
                className="flex items-center gap-1 flex-1 justify-center text-xs py-1.5 rounded-sm font-medium"
                style={{ backgroundColor: "#C5A059", color: "#111620" }}>
                <Check className="h-3 w-3" />Usar Resposta
              </button>
              <button onClick={generate} className="px-3 py-1.5 rounded-sm border text-xs"
                style={{ borderColor: "#252D3E", color: "#8A95AA" }}>
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}