import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  format, parseISO, startOfMonth, endOfMonth, isWithinInterval,
  subMonths, addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { formatBRL, formatPct, classificarSaudeCaixa } from "@/lib/finCalc";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

function KpiCard({ label, value, sub, gold, note }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18,
      borderBottom: gold ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 600, color: gold ? T.gold : T.text, margin: "8px 0 0", letterSpacing: "-0.01em" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>{sub}</p>}
      {note && <p style={{ fontSize: 11, color: T.dim, margin: "6px 0 0", lineHeight: 1.4 }}>{note}</p>}
    </div>
  );
}

export default function FinDashboardExecutivo() {
  const { data: config } = useQuery({ queryKey: ["configFin"], queryFn: () => base44.entities.ConfiguracaoFinanceira.list().then(r => r[0]) });
  const { data: parcelas = [] } = useQuery({ queryKey: ["parcelas"], queryFn: () => base44.entities.ParcelaRecebivel.list("-vencimento", 500) });
  const { data: lancamentos = [] } = useQuery({ queryKey: ["lancamentos"], queryFn: () => base44.entities.DRELancamento.list("-data_vencimento", 500) });

  const c = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(now), mEnd = endOfMonth(now);
    const meta = config?.meta_recebimento_liquido || 70000;
    const caixaObj = config?.objetivo_caixa_livre || 50000;
    const saldoSeg = config?.saldo_minimo_seguranca || 10000;

    const inMonth = (d, field) => {
      if (!d?.[field]) return false;
      try { return isWithinInterval(parseISO(d[field]), { start: mStart, end: mEnd }); } catch { return false; }
    };

    const faturamentoBruto = parcelas.filter(p => inMonth(p, "data_venda")).reduce((s, p) => s + (p.valor_bruto || 0), 0);
    const recebimentoBruto = parcelas.filter(p => inMonth(p, "data_recebimento")).reduce((s, p) => s + (p.valor_bruto || 0), 0);
    const recebimentoLiquido = parcelas.filter(p => inMonth(p, "data_recebimento")).reduce((s, p) => s + (p.valor_liquido || 0), 0);
    const pctMeta = meta > 0 ? (recebimentoLiquido / meta) * 100 : 0;
    const valorRestante = meta - recebimentoLiquido;

    const despesas = lancamentos.filter(l => ["despesa_fixa", "despesa_variavel", "custo_direto", "outra_despesa"].includes(l.tipo));
    const custosRealizados = despesas.filter(d => inMonth(d, "data_pagamento")).reduce((s, d) => s + (d.valor || 0), 0);
    const custosProjetados = despesas.filter(d => d.status === "pendente" && inMonth(d, "data_vencimento")).reduce((s, d) => s + (d.valor || 0), 0);

    const caixaLivreAtual = recebimentoLiquido - custosRealizados;
    const previstoReceber = parcelas.filter(p => ["previsto", "pendente"].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || 0), 0);
    const caixaLivreProjetado = (recebimentoLiquido + previstoReceber) - (custosRealizados + custosProjetados);

    const contasReceber = parcelas.filter(p => ["previsto", "pendente", "vencido"].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || 0), 0);
    const contasPagar = despesas.filter(d => ["pendente", "vencido"].includes(d.status)).reduce((s, d) => s + (d.valor || 0), 0);

    const despesasProx30 = despesas.filter(d => d.status === "pendente" && d.data_vencimento && (() => { try { return isWithinInterval(parseISO(d.data_vencimento), { start: now, end: addDays(now, 30) }); } catch { return false; } })()).reduce((s, d) => s + (d.valor || 0), 0);

    const saude = classificarSaudeCaixa({ caixaProjetado: caixaLivreProjetado, pctMeta, saldoSeguranca: saldoSeg, despesasProximos30d: despesasProx30 });

    const series = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const ms = startOfMonth(m), me = endOfMonth(m);
      const fat = parcelas.filter(p => { try { return p.data_venda && isWithinInterval(parseISO(p.data_venda), { start: ms, end: me }); } catch { return false; } }).reduce((s, p) => s + (p.valor_bruto || 0), 0);
      const rec = parcelas.filter(p => { try { return p.data_recebimento && isWithinInterval(parseISO(p.data_recebimento), { start: ms, end: me }); } catch { return false; } }).reduce((s, p) => s + (p.valor_liquido || 0), 0);
      series.push({ mes: format(m, "MMM", { locale: ptBR }), Faturamento: fat, Recebimento: rec, Meta: meta });
    }

    return { faturamentoBruto, recebimentoBruto, recebimentoLiquido, meta, pctMeta, valorRestante, custosRealizados, custosProjetados, caixaLivreAtual, caixaLivreProjetado, contasReceber, contasPagar, saude, series, caixaObj, diffCaixaObj: caixaLivreProjetado - caixaObj, previstoReceber };
  }, [parcelas, lancamentos, config]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Saúde do caixa */}
      <div style={{ background: T.card, border: `1px solid ${c.saude?.cor || T.border}`, borderLeft: `4px solid ${c.saude?.cor || T.border}`, borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, margin: 0 }}>Saúde do Caixa</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: c.saude?.cor, margin: "4px 0 0" }}>{c.saude?.nivel}</p>
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: 0, flex: 1, minWidth: 200 }}>{c.saude?.descricao}</p>
      </div>

      {/* KPIs principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        <KpiCard label="Faturamento Bruto" value={formatBRL(c.faturamentoBruto)} note="Total vendido no período (competência)." />
        <KpiCard label="Recebimento Bruto" value={formatBRL(c.recebimentoBruto)} note="Dinheiro que efetivamente entrou antes das taxas." />
        <KpiCard label="Recebimento Líquido" value={formatBRL(c.recebimentoLiquido)} gold note="Recebido depois de taxas, descontos e estornos." />
        <KpiCard label="Meta de Entrada Líquida" value={formatBRL(c.meta)} sub={`${formatPct(c.pctMeta)} atingida`} gold note="Valor necessário para custos + caixa livre." />
        <KpiCard label="Valor Restante p/ Meta" value={formatBRL(c.valorRestante < 0 ? 0 : c.valorRestante)} sub={c.valorRestante < 0 ? "Meta superada" : undefined} note="Meta líquida − recebimento líquido realizado." />
        <KpiCard label="Custos Realizados" value={formatBRL(c.custosRealizados)} note="Total efetivamente pago no período." />
        <KpiCard label="Custos Projetados" value={formatBRL(c.custosProjetados)} note="Ainda a pagar até o fim do mês." />
        <KpiCard label="Caixa Livre Atual" value={formatBRL(c.caixaLivreAtual)} note="Recebido líquido − despesas pagas." />
        <KpiCard label="Caixa Livre Projetado" value={formatBRL(c.caixaLivreProjetado)} sub={`Objetivo: ${formatBRL(c.caixaObj)}`} gold={c.diffCaixaObj >= 0} note="Recebido + previsto − despesas realizadas e previstas." />
        <KpiCard label="Contas a Receber" value={formatBRL(c.contasReceber)} note="Vendido e ainda não recebido." />
        <KpiCard label="Contas a Pagar" value={formatBRL(c.contasPagar)} note="Compromissos financeiros futuros." />
        <KpiCard label="Diferença p/ Caixa Livre" value={formatBRL(c.diffCaixaObj)} sub={c.diffCaixaObj >= 0 ? "Objetivo alcançado" : "Abaixo do objetivo"} note="Caixa livre projetado − objetivo de caixa." />
      </div>

      {/* Gráfico faturamento vs recebimento */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: "0 0 4px" }}>Faturamento versus Recebimento</p>
        <p style={{ fontSize: 11, color: T.dim, margin: "0 0 16px" }}>DRE mostra se a clínica dá lucro. Fluxo de caixa mostra se a clínica respira.</p>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={c.series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2B2B" vertical={false} />
              <XAxis dataKey="mes" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#B0B0B0" }} formatter={(v) => formatBRL(v)} />
              <Bar dataKey="Faturamento" fill="#8A8A8A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Recebimento" fill="#C8A96A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Meta" fill="#2B2B2B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Barra de meta */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Progresso da Meta de Entrada Líquida</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{formatBRL(c.recebimentoLiquido)} de {formatBRL(c.meta)}</p>
        </div>
        <div style={{ height: 14, background: "#121212", borderRadius: 7, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <div style={{
            height: "100%", width: `${Math.min(c.pctMeta, 100)}%`,
            background: c.pctMeta >= 100 ? "#4ADE80" : T.gold, borderRadius: 7,
            transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: c.pctMeta >= 100 ? "#4ADE80" : T.gold, fontWeight: 600 }}>{formatPct(c.pctMeta)}</span>
          <span style={{ fontSize: 12, color: T.dim }}>{c.valorRestante < 0 ? "Meta superada em " + formatBRL(Math.abs(c.valorRestante)) : "Faltam " + formatBRL(c.valorRestante)}</span>
        </div>
      </div>

      <p style={{ fontSize: 12, color: T.dim, textAlign: "center", margin: "8px 0 0", fontStyle: "italic" }}>
        A meta não é apenas vender R$ 70 mil. A meta é fazer entrar R$ 70 mil líquidos no caixa, depois das taxas e no prazo necessário.
      </p>
    </div>
  );
}