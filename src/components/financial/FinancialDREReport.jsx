import React, { useState, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, Percent, Calendar } from "lucide-react";

const categoryLabels = {
  procedure: "Procedimento",
  protocol: "Protocolo",
  product: "Produto",
  salary: "Salário",
  rent: "Aluguel",
  utilities: "Utilidades",
  supplies: "Insumos",
  marketing: "Marketing",
  taxes: "Impostos",
  equipment: "Equipamentos",
  maintenance: "Manutenção",
  other: "Outros",
};

const fmtBRL = (n) =>
  `R$ ${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n) => `${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export default function FinancialDREReport({ transactions }) {
  const now = new Date();
  const [periodMode, setPeriodMode] = useState("month"); // month | year | custom
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [view, setView] = useState("realizado"); // realizado | previsto

  const { rangeStart, rangeEnd, periodLabel } = useMemo(() => {
    if (periodMode === "month") {
      const d = new Date(year, month, 1);
      return {
        rangeStart: startOfMonth(d),
        rangeEnd: endOfMonth(d),
        periodLabel: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    }
    if (periodMode === "year") {
      const d = new Date(year, 0, 1);
      return {
        rangeStart: startOfYear(d),
        rangeEnd: endOfYear(d),
        periodLabel: `Ano de ${year}`,
      };
    }
    return {
      rangeStart: parseISO(fromDate),
      rangeEnd: parseISO(toDate),
      periodLabel: `${format(parseISO(fromDate), "dd/MM/yyyy")} a ${format(parseISO(toDate), "dd/MM/yyyy")}`,
    };
  }, [periodMode, month, year, fromDate, toDate]);

  const inRange = (t) => {
    if (!t.due_date) return false;
    const d = parseISO(t.due_date);
    return d >= rangeStart && d <= rangeEnd;
  };

  const periodTx = transactions.filter((t) => {
    if (!inRange(t)) return false;
    if (view === "realizado") return t.status === "paid";
    return true; // previsto: todas
  });

  const incomeTx = periodTx.filter((t) => t.type === "income");
  const expenseTx = periodTx.filter((t) => t.type === "expense");

  const groupByCategory = (list) => {
    const map = {};
    list.forEach((t) => {
      const key = t.category || "other";
      if (!map[key]) map[key] = { label: categoryLabels[key] || key, value: 0, count: 0 };
      map[key].value += t.amount || 0;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  };

  const incomeByCat = groupByCategory(incomeTx);
  const expenseByCat = groupByCategory(expenseTx);

  const totalIncome = incomeTx.reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = expenseTx.reduce((s, t) => s + (t.amount || 0), 0);
  const lucroLiquido = totalIncome - totalExpense;
  const margemLiquida = totalIncome > 0 ? (lucroLiquido / totalIncome) * 100 : 0;

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) years.push(y);

  const Row = ({ label, value, bold, color, indent }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid #1E1E1E",
        paddingLeft: indent ? 32 : 16,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: bold ? 600 : 400,
          color: bold ? "#FFFFFF" : "#B0B0B0",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: bold ? 600 : 500,
          color: color || (bold ? "#FFFFFF" : "#B0B0B0"),
        }}
      >
        {fmtBRL(value)}
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Controles de período */}
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          padding: 16,
        }}
      >
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
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
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
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Mês</p>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, color: "#FFF", padding: "7px 10px", fontSize: 13 }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {format(new Date(2020, i, 1), "MMMM", { locale: ptBR })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Ano</p>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, color: "#FFF", padding: "7px 10px", fontSize: 13 }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {periodMode === "year" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Ano</p>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, color: "#FFF", padding: "7px 10px", fontSize: 13 }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodMode === "custom" && (
            <>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>De</p>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, color: "#FFF", padding: "7px 10px", fontSize: 13 }}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Até</p>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, color: "#FFF", padding: "7px 10px", fontSize: 13 }}
                />
              </div>
            </>
          )}

          <div className="lg:ml-auto">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Base</p>
            <div style={{ display: "flex", backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, padding: 2 }}>
              <button
                onClick={() => setView("realizado")}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: view === "realizado" ? "#C8A96A" : "transparent",
                  color: view === "realizado" ? "#000" : "#666",
                }}
              >
                Realizado
              </button>
              <button
                onClick={() => setView("previsto")}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: view === "previsto" ? "#C8A96A" : "transparent",
                  color: view === "previsto" ? "#000" : "#666",
                }}
              >
                Previsto
              </button>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#C8A96A", marginTop: 12, fontWeight: 500 }}>
          {periodLabel} · {view === "realizado" ? "Apenas transações pagas" : "Todas as transações"}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Receitas", value: fmtBRL(totalIncome), accent: "#4ADE80", icon: TrendingUp },
          { label: "Total Despesas", value: fmtBRL(totalExpense), accent: "#EF4444", icon: TrendingDown },
          { label: "Lucro Líquido", value: fmtBRL(lucroLiquido), accent: lucroLiquido >= 0 ? "#C8A96A" : "#EF4444", icon: Wallet },
          { label: "Margem Líquida", value: fmtPct(margemLiquida), accent: margemLiquida >= 0 ? "#4ADE80" : "#EF4444", icon: Percent },
        ].map((k) => (
          <div key={k.label} style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <k.icon style={{ width: 14, height: 14, color: k.accent }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", margin: 0 }}>{k.label}</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: k.accent, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* DRE por categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receitas */}
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #2B2B2B", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp style={{ width: 16, height: 16, color: "#4ADE80" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Receitas por Categoria</p>
          </div>
          {incomeByCat.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: "#666", textAlign: "center", margin: 0 }}>Sem receitas no período</p>
          ) : (
            <>
              {incomeByCat.map((c) => (
                <Row key={c.label} label={`${c.label} (${c.count})`} value={c.value} indent />
              ))}
              <Row label="Total Receitas" value={totalIncome} bold color="#4ADE80" />
            </>
          )}
        </div>

        {/* Despesas */}
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #2B2B2B", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingDown style={{ width: 16, height: 16, color: "#EF4444" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Despesas por Categoria</p>
          </div>
          {expenseByCat.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: "#666", textAlign: "center", margin: 0 }}>Sem despesas no período</p>
          ) : (
            <>
              {expenseByCat.map((c) => (
                <Row key={c.label} label={`${c.label} (${c.count})`} value={c.value} indent />
              ))}
              <Row label="Total Despesas" value={totalExpense} bold color="#EF4444" />
            </>
          )}
        </div>
      </div>

      {/* Resumo final */}
      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(200,169,106,0.3)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #2B2B2B" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Resumo do Resultado</p>
        </div>
        <Row label="(=) Receita Total" value={totalIncome} bold color="#4ADE80" />
        <Row label="(-) Despesa Total" value={totalExpense} bold color="#EF4444" />
        <Row label="(=) Lucro Líquido" value={lucroLiquido} bold color={lucroLiquido >= 0 ? "#C8A96A" : "#EF4444"} />
        <Row label="Margem Líquida" value={margemLiquida / 100} bold color={margemLiquida >= 0 ? "#4ADE80" : "#EF4444"} />
      </div>
    </div>
  );
}