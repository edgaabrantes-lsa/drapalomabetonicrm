import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calcularDRE,
  fmtBRL,
  fmtPercent,
  DRE_TIPOS,
} from "@/lib/dreUtils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Calendar,
  BarChart3,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

export default function FinancialDREReport() {
  const now = new Date();
  const [periodMode, setPeriodMode] = useState("month"); // month | year | custom
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [view, setView] = useState("realizado"); // realizado | previsto

  // ── Data fetching ──
  const { data: transactions = [], isLoading: ldTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-created_date", 2000),
  });
  const { data: lancamentos = [] } = useQuery({
    queryKey: ["dreLancamentos"],
    queryFn: () => base44.entities.DRELancamento.list("-created_date", 2000),
  });
  const { data: treatments = [] } = useQuery({
    queryKey: ["patientTreatments"],
    queryFn: () => base44.entities.PatientTreatment.list("-created_date", 2000),
  });
  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });
  const { data: supplies = [] } = useQuery({
    queryKey: ["supplies"],
    queryFn: () => base44.entities.Supply.list(),
  });

  // ── Period range ──
  const { filters, periodLabel } = useMemo(() => {
    if (periodMode === "month") {
      const d = new Date(year, month, 1);
      return {
        filters: { mes: month, ano: year, periodo: "mensal" },
        periodLabel: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    }
    if (periodMode === "year") {
      return {
        filters: { ano: year, periodo: "anual" },
        periodLabel: `Ano de ${year}`,
      };
    }
    return {
      filters: { data_inicio: fromDate, data_fim: toDate, periodo: "custom" },
      periodLabel: `${format(parseISO(fromDate), "dd/MM/yyyy")} a ${format(parseISO(toDate), "dd/MM/yyyy")}`,
    };
  }, [periodMode, month, year, fromDate, toDate]);

  // ── DRE calculation for selected period ──
  const dre = useMemo(
    () =>
      calcularDRE({
        transactions,
        lancamentos,
        treatments,
        procedures,
        supplies,
        filters,
        view,
      }),
    [transactions, lancamentos, treatments, procedures, supplies, filters, view]
  );

  // ── 12-month rolling evolution ──
  const monthlySeries = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const ref = subMonths(now, i);
      const m = ref.getMonth();
      const y = ref.getFullYear();
      const mDre = calcularDRE({
        transactions,
        lancamentos,
        treatments,
        procedures,
        supplies,
        filters: { mes: m, ano: y, periodo: "mensal" },
        view,
      });
      months.push({
        label: format(ref, "MMM/yy", { locale: ptBR }),
        Receitas: Math.round(mDre.receitaLiquida),
        Despesas: Math.round(
          mDre.totalCustosDiretos + mDre.totalDespesasFixas + mDre.totalDespesasVariaveis + mDre.totalOutrasDespesas
        ),
        Lucro: Math.round(mDre.lucroLiquido),
        Margem: Number(mDre.margemLiquida.toFixed(1)),
      });
    }
    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, lancamentos, treatments, procedures, supplies, view]);

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) years.push(y);

  // ── DRE statement sections ──
  const sectionConfig = [
    { key: "receita", label: "A. RECEITA BRUTA", sign: "+", color: "#4ADE80", bold: true },
    { key: "deducoes", label: "B. (-) DEDUÇÕES", sign: "-", color: "#F59E0B", bold: false },
    { key: "custo_direto", label: "D. (-) CUSTOS DIRETOS", sign: "-", color: "#EF4444", bold: false },
    { key: "despesa_fixa", label: "G. (-) DESPESAS FIXAS", sign: "-", color: "#F59E0B", bold: false },
    { key: "despesa_variavel", label: "H. (-) DESPESAS VARIÁVEIS", sign: "-", color: "#A78BFA", bold: false },
    { key: "outra_despesa", label: "J. (-) OUTRAS DESPESAS", sign: "-", color: "#EF4444", bold: false },
  ];

  const kpis = [
    { label: "Receita Bruta", value: fmtBRL(dre.receitaBruta), accent: "#FFFFFF", icon: TrendingUp },
    { label: "Receita Líquida", value: fmtBRL(dre.receitaLiquida), accent: "#C8A96A", icon: Wallet },
    { label: "Lucro Bruto", value: fmtBRL(dre.lucroBruto), accent: dre.lucroBruto >= 0 ? "#4ADE80" : "#EF4444", icon: BarChart3, sub: `Margem: ${fmtPercent(dre.margemBruta)}` },
    { label: "Lucro Líquido", value: fmtBRL(dre.lucroLiquido), accent: dre.lucroLiquido >= 0 ? "#4ADE80" : "#EF4444", icon: dre.lucroLiquido >= 0 ? TrendingUp : TrendingDown, sub: `Margem: ${fmtPercent(dre.margemLiquida)}` },
  ];

  function exportCSV() {
    const rows = [
      ["DRE - Demonstração do Resultado do Exercício", periodLabel],
      [],
      ["A. RECEITA BRUTA", fmtBRL(dre.receitaBruta)],
      ...Object.entries(dre.sections.receita.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
      [],
      ["B. (-) DEDUÇÕES", fmtBRL(dre.totalDeducoes)],
      ...Object.entries(dre.sections.deducoes.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
      [],
      ["C. = RECEITA LÍQUIDA", fmtBRL(dre.receitaLiquida)],
      [],
      ["D. (-) CUSTOS DIRETOS", fmtBRL(dre.totalCustosDiretos)],
      ...Object.entries(dre.sections.custo_direto.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
      [],
      ["E. = LUCRO BRUTO", fmtBRL(dre.lucroBruto)],
      ["F. MARGEM BRUTA", fmtPercent(dre.margemBruta)],
      [],
      ["G. (-) DESPESAS FIXAS", fmtBRL(dre.totalDespesasFixas)],
      ...Object.entries(dre.sections.despesa_fixa.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
      [],
      ["H. (-) DESPESAS VARIÁVEIS", fmtBRL(dre.totalDespesasVariaveis)],
      ...Object.entries(dre.sections.despesa_variavel.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
      [],
      ["I. = RESULTADO OPERACIONAL", fmtBRL(dre.resultadoOperacional)],
      [],
      ["J. (-) OUTRAS DESPESAS", fmtBRL(dre.totalOutrasDespesas)],
      ...Object.entries(dre.sections.outra_despesa.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
      [],
      ["K. = LUCRO LÍQUIDO", fmtBRL(dre.lucroLiquido)],
      ["L. MARGEM LÍQUIDA", fmtPercent(dre.margemLiquida)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DRE_${periodLabel.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (ldTx) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Controles de período ── */}
      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 16 }}>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>
              <Calendar style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} /> Período
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { val: "month", label: "Mês" },
                { val: "year", label: "Ano" },
                { val: "custom", label: "Personalizado" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setPeriodMode(opt.val)}
                  style={{
                    padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer",
                    backgroundColor: periodMode === opt.val ? "#C8A96A" : "transparent",
                    color: periodMode === opt.val ? "#000" : "#666",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {periodMode === "month" && (
            <>
              <div>
                <p style={labelStyle}>Mês</p>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{format(new Date(2020, i, 1), "MMMM", { locale: ptBR })}</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={labelStyle}>Ano</p>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {periodMode === "year" && (
            <div>
              <p style={labelStyle}>Ano</p>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {periodMode === "custom" && (
            <>
              <div>
                <p style={labelStyle}>De</p>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={selectStyle} />
              </div>
              <div>
                <p style={labelStyle}>Até</p>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={selectStyle} />
              </div>
            </>
          )}

          <div className="lg:ml-auto flex items-end gap-3">
            <div>
              <p style={labelStyle}>Base</p>
              <div style={{ display: "flex", backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, padding: 2 }}>
                <button onClick={() => setView("realizado")} style={toggleBtn(view === "realizado")}>Realizado</button>
                <button onClick={() => setView("previsto")} style={toggleBtn(view === "previsto")}>Previsto</button>
              </div>
            </div>
            <button onClick={exportCSV} title="Exportar CSV" style={{ ...selectStyle, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Download style={{ width: 14, height: 14 }} /> CSV
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#C8A96A", marginTop: 12, fontWeight: 500 }}>
          {periodLabel} · {view === "realizado" ? "Apenas transações pagas" : "Todas as transações (previsto)"}
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <k.icon style={{ width: 14, height: 14, color: k.accent }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", margin: 0 }}>{k.label}</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: k.accent, margin: 0 }}>{k.value}</p>
            {k.sub && <p style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Demonstração DRE ── */}
      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #2B2B2B" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Demonstração do Resultado do Exercício</p>
        </div>

        {/* Receita Bruta + categorias */}
        <DRESection title="A. RECEITA BRUTA" total={dre.receitaBruta} color="#4ADE80" bold items={dre.sections.receita.items} />

        {/* Deduções */}
        <DRESection title="B. (-) DEDUÇÕES" total={dre.totalDeducoes} color="#F59E0B" items={dre.sections.deducoes.items} />

        {/* Receita Líquida (subtotal) */}
        <SubtotalRow label="C. = RECEITA LÍQUIDA (A - B)" value={dre.receitaLiquida} color="#C8A96A" />

        {/* Custos Diretos */}
        <DRESection title="D. (-) CUSTOS DIRETOS" total={dre.totalCustosDiretos} color="#EF4444" items={dre.sections.custo_direto.items} />

        {/* Lucro Bruto */}
        <SubtotalRow label="E. = LUCRO BRUTO (C - D)" value={dre.lucroBruto} color={dre.lucroBruto >= 0 ? "#4ADE80" : "#EF4444"} extra={`Margem Bruta: ${fmtPercent(dre.margemBruta)}`} />

        {/* Despesas Fixas */}
        <DRESection title="G. (-) DESPESAS FIXAS" total={dre.totalDespesasFixas} color="#F59E0B" items={dre.sections.despesa_fixa.items} />

        {/* Despesas Variáveis */}
        <DRESection title="H. (-) DESPESAS VARIÁVEIS" total={dre.totalDespesasVariaveis} color="#A78BFA" items={dre.sections.despesa_variavel.items} />

        {/* Resultado Operacional */}
        <SubtotalRow label="I. = RESULTADO OPERACIONAL" value={dre.resultadoOperacional} color={dre.resultadoOperacional >= 0 ? "#4ADE80" : "#EF4444"} />

        {/* Outras Despesas */}
        <DRESection title="J. (-) OUTRAS DESPESAS" total={dre.totalOutrasDespesas} color="#EF4444" items={dre.sections.outra_despesa.items} />

        {/* Lucro Líquido (final) */}
        <div style={{ padding: "16px", backgroundColor: "rgba(200,169,106,0.06)", borderTop: "1px solid rgba(200,169,106,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>K. = LUCRO LÍQUIDO</span>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: dre.lucroLiquido >= 0 ? "#4ADE80" : "#EF4444", margin: 0 }}>{fmtBRL(dre.lucroLiquido)}</p>
              <p style={{ fontSize: 12, color: "#C8A96A", margin: 0, fontWeight: 500 }}>Margem Líquida: {fmtPercent(dre.margemLiquida)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Evolução mensal — 12 meses ── */}
      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #2B2B2B", display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 style={{ width: 16, height: 16, color: "#C8A96A" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Evolução Mensal — últimos 12 meses</p>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={{ stroke: "#2B2B2B" }} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={{ stroke: "#2B2B2B" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, color: "#FFF", fontSize: 12 }} formatter={(value, name) => [fmtBRL(value), name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="#4ADE80" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Despesas" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ height: 200, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={{ stroke: "#2B2B2B" }} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={{ stroke: "#2B2B2B" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, color: "#FFF", fontSize: 12 }} formatter={(value, name) => [`${value}%`, name]} />
                <Line type="monotone" dataKey="Margem" stroke="#C8A96A" strokeWidth={2} dot={{ r: 3, fill: "#C8A96A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                  {["Mês", "Receitas", "Despesas", "Lucro", "Margem"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlySeries.map((m) => (
                  <tr key={m.label} style={{ borderBottom: "1px solid #1E1E1E" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#FFF" }}>{m.label}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#4ADE80", textAlign: "right" }}>{fmtBRL(m.Receitas)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#EF4444", textAlign: "right" }}>{fmtBRL(m.Despesas)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: m.Lucro >= 0 ? "#C8A96A" : "#EF4444", textAlign: "right", fontWeight: 600 }}>{fmtBRL(m.Lucro)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: m.Margem >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtPercent(m.Margem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {dre.receitaBruta === 0 && dre.totalDespesasFixas === 0 && dre.totalDespesasVariaveis === 0 && dre.totalCustosDiretos === 0 && (
        <div style={{ backgroundColor: "rgba(200,169,106,0.04)", border: "1px solid rgba(200,169,106,0.15)", borderRadius: 8, padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#C8A96A", fontWeight: 500, margin: 0 }}>Sem dados para o período selecionado</p>
          <p style={{ fontSize: 12, color: "#666666", marginTop: 6 }}>
            Registre transações no módulo Financeiro ou lançamentos DRE para visualizar o resultado.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ──
function DRESection({ title, total, color, items, bold }) {
  const entries = Object.entries(items || {});
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderBottom: "1px solid #1E1E1E", backgroundColor: bold ? "rgba(255,255,255,0.015)" : "transparent" }}>
        <span style={{ fontSize: 13, fontWeight: bold ? 700 : 600, color: "#FFFFFF" }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmtBRL(total)}</span>
      </div>
      {entries.length > 0 && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
          {entries.map(([cat, val]) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 8px 36px", borderBottom: "1px solid #141414" }}>
              <span style={{ fontSize: 12, color: "#B0B0B0" }}>{cat}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#B0B0B0" }}>{fmtBRL(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubtotalRow({ label, value, color, extra }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #2B2B2B", backgroundColor: "rgba(255,255,255,0.02)" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color, margin: 0 }}>{fmtBRL(value)}</p>
        {extra && <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{extra}</p>}
      </div>
    </div>
  );
}

// ── Styles ──
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 };
const selectStyle = { backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, color: "#FFF", padding: "7px 10px", fontSize: 13 };
const toggleBtn = (active) => ({
  padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer",
  backgroundColor: active ? "#C8A96A" : "transparent", color: active ? "#000" : "#666",
});