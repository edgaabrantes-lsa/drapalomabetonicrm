import React from "react";
import { format, parseISO } from "date-fns";
import { fmtBRL } from "@/lib/dreUtils";

/**
 * Resumo diário no formato de planilha: Data | Entradas | Saídas | Saldo.
 * Considera apenas movimentações efetivadas (pagas/recebidas) e não canceladas.
 */
export default function ResumoDiario({ lancamentos = [] }) {
  const porDia = {};
  lancamentos
    .filter(l => l.status === "pago")
    .forEach(l => {
      const data = l.data_pagamento || l.data_vencimento;
      if (!data) return;
      if (!porDia[data]) porDia[data] = { entrada: 0, saida: 0 };
      if (l.tipo === "receita") porDia[data].entrada += Number(l.valor || 0);
      else porDia[data].saida += Number(l.valor || 0);
    });

  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a));
  const totalEntrada = Object.values(porDia).reduce((s, d) => s + d.entrada, 0);
  const totalSaida = Object.values(porDia).reduce((s, d) => s + d.saida, 0);

  const exportar = () => {
    const linhas = [["Data", "Entradas", "Saidas", "Saldo"]];
    dias.forEach((dia) => {
      const d = porDia[dia];
      linhas.push([format(parseISO(dia), "dd/MM/yyyy"), d.entrada.toFixed(2), d.saida.toFixed(2), (d.entrada - d.saida).toFixed(2)]);
    });
    linhas.push(["TOTAL", totalEntrada.toFixed(2), totalSaida.toFixed(2), (totalEntrada - totalSaida).toFixed(2)]);
    const csv = linhas.map((l) => l.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Resumo_Entradas_Saidas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (dias.length === 0) {
    return (
      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 32, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#666666" }}>Nenhuma movimentação efetivada no período</p>
        <p style={{ fontSize: 11, color: "#555555", marginTop: 4 }}>
          O resumo considera lançamentos com status pago/recebido.
        </p>
      </div>
    );
  }

  const th = { textAlign: "left", padding: "9px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" };
  const td = { padding: "9px 14px", fontSize: 13, color: "#B0B0B0" };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportar}
          style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, background: "transparent", border: "1px solid #2B2B2B", borderRadius: 6, color: "#C8A96A", cursor: "pointer" }}
        >
          Exportar CSV
        </button>
      </div>

      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
              <th style={th}>Data</th>
              <th style={{ ...th, textAlign: "right" }}>Entradas</th>
              <th style={{ ...th, textAlign: "right" }}>Saídas</th>
              <th style={{ ...th, textAlign: "right" }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dias.map(dia => {
              const d = porDia[dia];
              const saldo = d.entrada - d.saida;
              return (
                <tr key={dia} style={{ borderBottom: "1px solid #1E1E1E" }}>
                  <td style={{ ...td, color: "#FFFFFF" }}>{format(parseISO(dia), "dd/MM/yyyy")}</td>
                  <td style={{ ...td, textAlign: "right", color: d.entrada > 0 ? "#4ADE80" : "#666666" }}>{fmtBRL(d.entrada)}</td>
                  <td style={{ ...td, textAlign: "right", color: d.saida > 0 ? "#EF4444" : "#666666" }}>{fmtBRL(d.saida)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, color: saldo >= 0 ? "#FFFFFF" : "#EF4444" }}>{fmtBRL(saldo)}</td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: "#121212" }}>
              <td style={{ ...td, fontWeight: 600, color: "#C8A96A" }}>Total do período</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#4ADE80" }}>{fmtBRL(totalEntrada)}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#EF4444" }}>{fmtBRL(totalSaida)}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#C8A96A" }}>{fmtBRL(totalEntrada - totalSaida)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}