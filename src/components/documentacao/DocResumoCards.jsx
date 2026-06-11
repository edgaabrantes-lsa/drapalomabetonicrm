import React from "react";
import { T, S } from "@/lib/designTokens";
import { calcularStatusGeral } from "./documentacaoConfig";

export default function DocResumoCards({ checklist }) {
  const obrigatorios = checklist.filter(d => d.obrigatorio);
  const gerados      = checklist.filter(d => d.status !== "pendente");
  const assinados    = checklist.filter(d => ["assinado_internamente","pdf_anexado","aprovado"].includes(d.status));
  const pendentes    = obrigatorios.filter(d => !["assinado_internamente","pdf_anexado","aprovado"].includes(d.status));
  const statusGeral  = calcularStatusGeral(checklist);

  const cards = [
    { label: "Obrigatórios",  value: obrigatorios.length, color: "#666" },
    { label: "Gerados",       value: gerados.length,      color: "#3B82F6" },
    { label: "Assinados",     value: assinados.length,    color: "#22C55E" },
    { label: "Pendências",    value: pendentes.length,    color: pendentes.length > 0 ? "#EF4444" : "#22C55E" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 12, marginBottom: 20 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
          padding: "14px 16px",
        }}>
          <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted, margin: 0 }}>
            {c.label}
          </p>
          <p style={{ fontFamily: T.font, fontSize: 26, fontWeight: 700, color: c.color, margin: "4px 0 0", lineHeight: 1 }}>
            {c.value}
          </p>
        </div>
      ))}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "14px 16px", gridColumn: "span 2",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted, margin: 0 }}>
            Status Geral
          </p>
          <span style={{
            fontFamily: T.font, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
            backgroundColor: statusGeral.color + "20", color: statusGeral.color,
          }}>
            {statusGeral.label}
          </span>
        </div>
        <div style={{ background: T.bgSecondary, borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: statusGeral.color,
            width: `${statusGeral.pct}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
        <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
          {statusGeral.pct}% concluído
        </p>
      </div>
    </div>
  );
}