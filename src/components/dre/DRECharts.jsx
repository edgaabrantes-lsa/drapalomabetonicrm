import React from "react";
import { fmtBRL } from "@/lib/dreUtils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#C8A96A", "#4ADE80", "#EF4444", "#60A5FA", "#A78BFA", "#F59E0B"];

export default function DRECharts({ dre }) {
  const structureData = [
    { name: "Receita Bruta", value: dre.receitaBruta, fill: "#C8A96A" },
    { name: "Custos Diretos", value: dre.totalCustosDiretos, fill: "#EF4444" },
    { name: "Despesas Fixas", value: dre.totalDespesasFixas, fill: "#F59E0B" },
    { name: "Despesas Variáveis", value: dre.totalDespesasVariaveis, fill: "#A78BFA" },
    { name: "Lucro Líquido", value: dre.lucroLiquido, fill: dre.lucroLiquido >= 0 ? "#4ADE80" : "#EF4444" },
  ];

  const expenseData = [
    { name: "Custos Diretos", value: dre.totalCustosDiretos },
    { name: "Despesas Fixas", value: dre.totalDespesasFixas },
    { name: "Despesas Variáveis", value: dre.totalDespesasVariaveis },
    { name: "Outras Despesas", value: dre.totalOutrasDespesas },
  ].filter((d) => d.value > 0);

  const tooltipStyle = {
    backgroundColor: "#1A1A1A",
    border: "1px solid #2B2B2B",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 12,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Structure bar chart */}
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>
          Estrutura do DRE
        </p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={structureData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
              <XAxis dataKey="name" tick={{ fill: "#666666", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#666666", fontSize: 10 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBRL(v)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {structureData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense composition pie */}
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>
          Composição de Custos e Despesas
        </p>
        {expenseData.length > 0 ? (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                  {expenseData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: "#555555" }}>Sem dados de despesas</p>
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {expenseData.map((item, i) => (
            <div key={item.name} className="flex items-center" style={{ gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS[i % COLORS.length] }} />
              <span style={{ fontSize: 11, color: "#B0B0B0" }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}