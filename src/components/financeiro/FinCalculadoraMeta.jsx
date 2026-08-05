import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, addDays } from "date-fns";
import { formatBRL, formatPct, calcularBuracoCaixa, gerarCenarios, normalizarRecebiveis } from "@/lib/finCalc";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

export default function FinCalculadoraMeta() {
  const { data: config } = useQuery({ queryKey: ["configFin"], queryFn: () => base44.entities.ConfiguracaoFinanceira.list().then(r => r[0]) });
  const { data: rawParcelas = [] } = useQuery({ queryKey: ["parcelas"], queryFn: () => base44.entities.ParcelaRecebivel.list("-vencimento", 500) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.Transaction.list("-due_date", 500) });
  const { data: protocolos = [] } = useQuery({ queryKey: ["protocolos"], queryFn: () => base44.entities.ProtocoloPremium.list() });
  const parcelas = useMemo(() => normalizarRecebiveis(rawParcelas, transactions), [rawParcelas, transactions]);

  const calc = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(now), mEnd = endOfMonth(now);
    const meta = config?.meta_recebimento_liquido || 70000;

    const inMonth = (d, field) => {
      if (!d?.[field]) return false;
      try { return isWithinInterval(parseISO(d[field]), { start: mStart, end: mEnd }); } catch { return false; }
    };

    const recebidoLiquido = parcelas.filter(p => inMonth(p, "data_recebimento")).reduce((s, p) => s + (p.valor_liquido || 0), 0);
    const previstoLiquido = parcelas.filter(p => {
      if (!p.vencimento) return false;
      try { return isWithinInterval(parseISO(p.vencimento), { start: mEnd, end: addDays(mEnd, 30) }) && ["previsto", "pendente"].includes(p.status); } catch { return false; }
    }).reduce((s, p) => s + (p.valor_liquido || 0), 0);

    const buraco = calcularBuracoCaixa(meta, recebidoLiquido, previstoLiquido);
    const cenarios = gerarCenarios(buraco, protocolos.map(p => ({ nome: p.nome, valor: p.valor_min || p.valor_max || 5000, custo: (p.valor_min || 5000) * 0.3 })));

    return { meta, recebidoLiquido, previstoLiquido, buraco, cenarios };
  }, [config, parcelas, protocolos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Resumo do buraco de caixa */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Meta de Entrada Líquida</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: T.text, margin: "6px 0 0" }}>{formatBRL(calc.meta)}</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Já Recebido Líquido</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#4ADE80", margin: "6px 0 0" }}>{formatBRL(calc.recebidoLiquido)}</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Previsto a Receber</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: T.muted, margin: "6px 0 0" }}>{formatBRL(calc.previstoLiquido)}</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${calc.buraco > 0 ? "#FB923C" : "#4ADE80"}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Buraco de Caixa</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: calc.buraco > 0 ? "#FB923C" : "#4ADE80", margin: "6px 0 0" }}>{calc.buraco > 0 ? formatBRL(calc.buraco) : "Meta coberta"}</p>
          <p style={{ fontSize: 11, color: T.dim, margin: "4px 0 0" }}>{calc.buraco > 0 ? "Quanto ainda precisa entrar" : "Não há necessidade de novas vendas"}</p>
        </div>
      </div>

      {calc.buraco > 0 && calc.cenarios ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {calc.cenarios.map(c => (
            <div key={c.nome} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.gold, margin: 0 }}>{c.nome}</p>
              <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 16px" }}>{c.priorizar}</p>
              {c.combinacao.map(item => (
                <div key={item.protocolo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid #1E1E1E` }}>
                  <div>
                    <p style={{ fontSize: 12, color: T.text, margin: 0 }}>{item.qtd}x {item.protocolo}</p>
                    <p style={{ fontSize: 10, color: T.dim, margin: "2px 0 0" }}>{formatBRL(item.liquidoMes1Cada)} líquido/cada no 1º mês</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{formatBRL(item.totalCaixa)}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>A meta de entrada líquida está coberta pelos recebimentos realizados e previstos.</p>
        </div>
      )}

      <p style={{ fontSize: 12, color: T.dim, fontStyle: "italic", textAlign: "center" }}>
        12 vezes não é apenas uma condição de pagamento. É uma estratégia para vender tickets maiores. A plataforma considera somente entrada efetiva, parcela recebida no período e valor líquido após taxas.
      </p>
    </div>
  );
}