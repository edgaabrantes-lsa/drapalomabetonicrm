import React, { useState } from "react";
import { T } from "@/lib/designTokens";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const STATUS_ICON = {
  incluido_no_kit:    { icon: CheckCircle2, color: "#3B82F6" },
  assinado_pelo_kit:  { icon: CheckCircle2, color: "#22C55E" },
  anexado_no_kit:     { icon: CheckCircle2, color: "#10B981" },
  pendente_no_kit:    { icon: Clock,        color: "#F59E0B" },
  pendente:           { icon: Clock,        color: "#666666" },
  gerado:             { icon: CheckCircle2, color: "#3B82F6" },
  assinado_internamente: { icon: CheckCircle2, color: "#22C55E" },
  pdf_anexado:        { icon: CheckCircle2, color: "#10B981" },
};

export default function KitChecklistInterno({ documentosIncluidos = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (documentosIncluidos.length === 0) return null;

  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 8,
      overflow: "hidden", marginTop: 12,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: T.bgSecondary, border: "none", cursor: "pointer",
          fontFamily: T.font, fontSize: 12, color: T.textMuted, fontWeight: 500,
        }}
      >
        <span>Ver documentos incluídos no kit ({documentosIncluidos.length})</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: "8px 14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {documentosIncluidos.map((d, i) => {
            const cfg = STATUS_ICON[d.status] || STATUS_ICON.pendente;
            const Icon = cfg.icon;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0", borderBottom: i < documentosIncluidos.length - 1 ? `1px solid ${T.borderLight}` : "none",
              }}>
                <Icon size={13} style={{ color: cfg.color, flexShrink: 0 }} />
                <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, flex: 1 }}>
                  {d.nome}
                  {d.obrigatorio && (
                    <span style={{ color: T.textMuted, fontSize: 10, marginLeft: 6 }}>obrigatório</span>
                  )}
                </span>
                <span style={{
                  fontSize: 10, color: cfg.color,
                  backgroundColor: `${cfg.color}15`, padding: "1px 6px", borderRadius: 3,
                  fontFamily: T.font, fontWeight: 500,
                }}>
                  {d.status?.replace(/_/g, " ") || "pendente"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}