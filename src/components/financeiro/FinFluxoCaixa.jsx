import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { parseISO, addDays, format, isWithinInterval, startOfDay } from "date-fns";
import { formatBRL } from "@/lib/finCalc";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

const horizontes = [
  { id: 7, label: "7 dias" },
  { id: 30, label: "30 dias" },
  { id: 60, label: "60 dias" },
  { id: 90, label: "90 dias" },
];

export default function FinFluxoCaixa() {
  const [dias, setDias] = useState(30);
  const { data: parcelas = [] } = useQuery({ queryKey: ["parcelas"], queryFn: () => base44.entities.ParcelaRecebivel.list("-vencimento", 500) });
  const { data: lancamentos = [] } = useQuery({ queryKey: ["lancamentos"], queryFn: () => base44.entities.DRELancamento.list("-data_vencimento", 500) });

  const projecao = useMemo(() => {
    const now = startOfDay(new Date());
    const fim = addDays(now, dias);
    const despesas = lancamentos.filter(l => ["despesa_fixa", "despesa_variavel", "custo_direto", "outra_despesa"].includes(l.tipo));

    // Saldo inicial = recebido líquido já realizado - despesas já pagas (até hoje)
    const recebidoAteHoje = parcelas.filter(p => p.data_recebimento && (() => { try { return isWithinInterval(parseISO(p.data_recebimento), { start: new Date(2020, 0, 1), end: now }); } catch { return false; } })()).reduce((s, p) => s + (p.valor_liquido || 0), 0);
    const pagoAteHoje = despesas.filter(d => d.data_pagamento && (() => { try { return isWithinInterval(parseISO(d.data_pagamento), { start: new Date(2020, 0, 1), end: now }); } catch { return false; } })()).reduce((s, d) => s + (d.valor || 0), 0);
    const saldoInicial = recebidoAteHoje - pagoAteHoje;

    const linhas = [];
    let saldo = saldoInicial;
    for (let d = 0; d <= dias; d++) {
      const dia = addDays(now, d);
      const diaStr = format(dia, "yyyy-MM-dd");
      const entradas = parcelas.filter(p => p.vencimento === diaStr && ["previsto", "pendente"].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || 0), 0);
      const saidas = despesas.filter(l => l.data_vencimento === diaStr && ["pendente", "vencido"].includes(l.status)).reduce((s, l) => s + (l.valor || 0), 0);
      saldo = saldo + entradas - saidas;
      if (d === 0 || d === 7 || d === 30 || d === 60 || d === 90 || d === dias) {
        linhas.push({ dia: format(dia, "dd/MM"), entradas, saidas, saldo });
      }
    }
    return { saldoInicial, linhas, entradasTotal: parcelas.filter(p => { try { return p.vencimento && isWithinInterval(parseISO(p.vencimento), { start: now, end: fim }) && ["previsto", "pendente"].includes(p.status); } catch { return false; } }).reduce((s, p) => s + (p.valor_liquido || 0), 0), saidasTotal: despesas.filter(l => { try { return l.data_vencimento && isWithinInterval(parseISO(l.data_vencimento), { start: now, end: fim }) && ["pendente", "vencido"].includes(l.status); } catch { return false; } }).reduce((s, l) => s + (l.valor || 0), 0) };
  }, [parcelas, lancamentos, dias]);

  const saldoFinal = projecao.linhas[projecao.linhas.length - 1]?.saldo || projecao.saldoInicial;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: T.dim }}>Horizonte:</span>
        {horizontes.map(h => (
          <button key={h.id} onClick={() => setDias(h.id)} style={{
            padding: "7px 14px", borderRadius: 6, cursor: "pointer",
            background: dias === h.id ? T.gold : "transparent",
            color: dias === h.id ? "#000" : T.muted,
            border: `1px solid ${dias === h.id ? T.gold : T.border}`,
            fontFamily: "Inter", fontSize: 12, fontWeight: 500,
          }}>{h.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Saldo Inicial</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: T.text, margin: "6px 0 0" }}>{formatBRL(projecao.saldoInicial)}</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Entradas Previstas ({dias}d)</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#4ADE80", margin: "6px 0 0" }}>{formatBRL(projecao.entradasTotal)}</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Saídas Previstas ({dias}d)</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#EF4444", margin: "6px 0 0" }}>{formatBRL(projecao.saidasTotal)}</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${saldoFinal < 0 ? "#EF4444" : T.gold}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Saldo Projetado Final</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: saldoFinal < 0 ? "#EF4444" : T.gold, margin: "6px 0 0" }}>{formatBRL(saldoFinal)}</p>
          {saldoFinal < 0 && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Risco de falta de caixa</p>}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Projeção Diária — Saldo Inicial + Entradas − Saídas = Saldo Final</p>
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr>
                {["Dia", "Entradas", "Saídas", "Saldo"].map(h => (
                  <th key={h} style={{ textAlign: h === "Entradas" || h === "Saídas" || h === "Saldo" ? "right" : "left", padding: "10px 14px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projecao.linhas.map((l, i) => (
                <tr key={i} style={{ borderBottom: `1px solid #1E1E1E` }}>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.muted }}>{l.dia}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#4ADE80", textAlign: "right" }}>{l.entradas > 0 ? formatBRL(l.entradas) : "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#EF4444", textAlign: "right" }}>{l.saidas > 0 ? formatBRL(l.saidas) : "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: l.saldo < 0 ? "#EF4444" : T.text, textAlign: "right", fontWeight: 500 }}>{formatBRL(l.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.dim, fontStyle: "italic" }}>Saldo inicial + entradas − saídas = saldo final. O caixa projetado mostra se a clínica respira nos próximos dias.</p>
    </div>
  );
}