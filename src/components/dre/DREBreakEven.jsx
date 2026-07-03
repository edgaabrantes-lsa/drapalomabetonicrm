import React from "react";
import { fmtBRL } from "@/lib/dreUtils";
import { TrendingUp, Target, AlertTriangle } from "lucide-react";

export default function DREBreakEven({ dre }) {
  const { pontoEquilibrio, vendasAteAgora, faltaparaEquilibrio, acimaEquilibrio, totalDespesasFixas, totalDespesasVariaveis, margemContribuicao } = dre;

  const progresso = pontoEquilibrio > 0 ? Math.min((vendasAteAgora / pontoEquilibrio) * 100, 100) : 0;

  return (
    <div
      style={{
        backgroundColor: "#1A1A1A",
        border: "1px solid #2B2B2B",
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div className="flex items-center" style={{ marginBottom: 16, gap: 8 }}>
        <Target style={{ width: 16, height: 16, color: "#C8A96A" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Ponto de Equilíbrio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 4 }}>
            Necessário Vender
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF" }}>{fmtBRL(pontoEquilibrio)}</p>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 4 }}>
            Já Vendido
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#C8A96A" }}>{fmtBRL(vendasAteAgora)}</p>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 4 }}>
            {acimaEquilibrio ? "Acima do Equilíbrio" : "Falta para Equilíbrio"}
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, color: acimaEquilibrio ? "#4ADE80" : "#EF4444" }}>
            {acimaEquilibrio ? fmtBRL(vendasAteAgora - pontoEquilibrio) : fmtBRL(faltaparaEquilibrio)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#666666" }}>Progresso</span>
          <span style={{ fontSize: 11, color: acimaEquilibrio ? "#4ADE80" : "#B0B0B0", fontWeight: 600 }}>
            {progresso.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 6, backgroundColor: "#121212", borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progresso}%`,
              backgroundColor: acimaEquilibrio ? "#4ADE80" : "#C8A96A",
              borderRadius: 3,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 6,
          backgroundColor: acimaEquilibrio ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${acimaEquilibrio ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}
      >
        {acimaEquilibrio ? (
          <TrendingUp style={{ width: 14, height: 14, color: "#4ADE80" }} />
        ) : (
          <AlertTriangle style={{ width: 14, height: 14, color: "#EF4444" }} />
        )}
        <p style={{ fontSize: 12, color: acimaEquilibrio ? "#4ADE80" : "#EF4444", margin: 0 }}>
          {acimaEquilibrio
            ? "A clínica está acima do ponto de equilíbrio — operando com lucro."
            : "A clínica está abaixo do ponto de equilíbrio — atenção aos custos."}
        </p>
      </div>

      {/* Formula detail */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1E1E1E" }}>
        <p style={{ fontSize: 11, color: "#555555", margin: 0 }}>
          Margem de Contribuição: {(margemContribuicao * 100).toFixed(1)}% | Despesas Fixas: {fmtBRL(totalDespesasFixas)} | Despesas Variáveis: {fmtBRL(totalDespesasVariaveis)}
        </p>
      </div>
    </div>
  );
}