import React from "react";
import { T, S } from "@/lib/designTokens";
import { AlertTriangle } from "lucide-react";

export default function DocPendencias({ checklist }) {
  const pendentes = checklist.filter(d =>
    d.obrigatorio && !["assinado_internamente", "pdf_anexado", "aprovado"].includes(d.status)
  );

  if (pendentes.length === 0) return null;

  const mensagens = pendentes.map(d => {
    const msgs = {
      pendente:              `${d.nome} ainda não foi gerado`,
      gerado:                `${d.nome} gerado — aguardando assinatura`,
      aguardando_assinatura: `${d.nome} aguardando assinatura`,
    };
    return msgs[d.status] || `${d.nome} — pendente`;
  });

  return (
    <div style={{
      background: "rgba(239,68,68,0.05)",
      border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 8, padding: "12px 16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <AlertTriangle style={{ width: 15, height: 15, color: "#EF4444", flexShrink: 0 }} />
        <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: "#EF4444" }}>
          Pendências Documentais ({pendentes.length})
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
            <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}