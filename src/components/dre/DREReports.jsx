import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  calcularDRE,
  calcularDREAnual,
  calcularRentabilidade,
  fmtBRL,
  fmtPercent,
  getPeriodLabel,
  exportDRECSV,
  exportRentabilidadeCSV,
} from "@/lib/dreUtils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Download, Printer, FileText } from "lucide-react";

export default function DREReports({ filters }) {
  const [reportType, setReportType] = useState("mensal");

  const { data: transactions = [] } = useQuery({
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

  const periodLabel = getPeriodLabel(filters);
  const year = filters.ano || new Date().getFullYear();

  const dreAtual = calcularDRE({
    transactions, lancamentos, treatments, procedures, supplies, filters, view: "realizado",
  });

  const monthlyData = calcularDREAnual(
    { transactions, lancamentos, treatments, procedures, supplies, filters, view: "realizado" },
    year
  );

  const rentabilidade = calcularRentabilidade(treatments, procedures, supplies, filters);

  // Cost report: top expense categories
  const allExpenses = [
    ...Object.entries(dreAtual.sections.custo_direto.items).map(([k, v]) => ({ name: k, value: v, tipo: "Custo Direto" })),
    ...Object.entries(dreAtual.sections.despesa_fixa.items).map(([k, v]) => ({ name: k, value: v, tipo: "Despesa Fixa" })),
    ...Object.entries(dreAtual.sections.despesa_variavel.items).map(([k, v]) => ({ name: k, value: v, tipo: "Despesa Variável" })),
    ...Object.entries(dreAtual.sections.outra_despesa.items).map(([k, v]) => ({ name: k, value: v, tipo: "Outra" })),
  ].sort((a, b) => b.value - a.value);

  const tooltipStyle = {
    backgroundColor: "#1A1A1A",
    border: "1px solid #2B2B2B",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 12,
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Report type selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div
          style={{
            display: "flex",
            backgroundColor: "#121212",
            border: "1px solid #2B2B2B",
            borderRadius: 6,
            padding: 2,
          }}
        >
          {[
            { key: "mensal", label: "DRE Mensal" },
            { key: "anual", label: "Comparativo Anual" },
            { key: "custos", label: "Relatório de Custos" },
            { key: "rentabilidade", label: "Rentabilidade" },
            { key: "equilibrio", label: "Ponto de Equilíbrio" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setReportType(r.key)}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                backgroundColor: reportType === r.key ? "#C8A96A" : "transparent",
                color: reportType === r.key ? "#000000" : "#666666",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => exportDRECSV(dreAtual, periodLabel)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid #2B2B2B",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 14px",
              height: 34,
              cursor: "pointer",
              color: "#C8A96A",
            }}
          >
            <Download style={{ width: 13, height: 13 }} /> CSV
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid #2B2B2B",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 14px",
              height: 34,
              cursor: "pointer",
              color: "#C8A96A",
            }}
          >
            <Printer style={{ width: 13, height: 13 }} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Monthly DRE Report */}
      {reportType === "mensal" && (
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #2B2B2B" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>DRE Mensal</p>
            <p style={{ fontSize: 13, color: "#666666", marginTop: 2 }}>{periodLabel}</p>
          </div>
          <div className="space-y-1">
            {[
              { label: "A. Receita Bruta", value: fmtBRL(dreAtual.receitaBruta) },
              { label: "B. (-) Deduções", value: fmtBRL(dreAtual.totalDeducoes) },
              { label: "C. = Receita Líquida", value: fmtBRL(dreAtual.receitaLiquida), highlight: true },
              { label: "D. (-) Custos Diretos", value: fmtBRL(dreAtual.totalCustosDiretos) },
              { label: "E. = Lucro Bruto", value: fmtBRL(dreAtual.lucroBruto), highlight: true },
              { label: "   F. Margem Bruta", value: fmtPercent(dreAtual.margemBruta) },
              { label: "G. (-) Despesas Fixas", value: fmtBRL(dreAtual.totalDespesasFixas) },
              { label: "H. (-) Despesas Variáveis", value: fmtBRL(dreAtual.totalDespesasVariaveis) },
              { label: "I. = Resultado Operacional", value: fmtBRL(dreAtual.resultadoOperacional), highlight: true },
              { label: "J. (-) Outras Despesas", value: fmtBRL(dreAtual.totalOutrasDespesas) },
              { label: "K. = Lucro Líquido", value: fmtBRL(dreAtual.lucroLiquido), highlight: true, color: dreAtual.lucroLiquido >= 0 ? "#4ADE80" : "#EF4444" },
              { label: "   L. Margem Líquida", value: fmtPercent(dreAtual.margemLiquida) },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: row.highlight ? "10px 12px" : "7px 12px",
                  backgroundColor: row.highlight ? "rgba(200,169,106,0.06)" : "transparent",
                  borderRadius: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: row.highlight ? 600 : 400, color: row.highlight ? "#FFFFFF" : "#B0B0B0" }}>
                  {row.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: row.highlight ? 600 : 500, color: row.color || (row.highlight ? "#FFFFFF" : "#B0B0B0") }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yearly comparison */}
      {reportType === "anual" && (
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #2B2B2B" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Comparativo Anual {year}</p>
            <p style={{ fontSize: 13, color: "#666666", marginTop: 2 }}>Receita, Custos e Lucro por mês</p>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                <XAxis dataKey="mes" tick={{ fill: "#666666", fontSize: 11 }} />
                <YAxis tick={{ fill: "#666666", fontSize: 10 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#B0B0B0" }} />
                <Bar dataKey="receitaLiquida" name="Receita Líquida" fill="#C8A96A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="custos" name="Custos Diretos" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="#4ADE80" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Mês</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Receita</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Custos</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Desp. Fixas</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Desp. Variáveis</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Lucro</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Margem</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => (
                  <tr key={m.mesNum} style={{ borderBottom: "1px solid #1E1E1E" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#FFFFFF", fontWeight: 500, textTransform: "capitalize" }}>{m.mes}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#B0B0B0", textAlign: "right" }}>{fmtBRL(m.receitaLiquida)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#EF4444", textAlign: "right" }}>{fmtBRL(m.custos)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#F59E0B", textAlign: "right" }}>{fmtBRL(m.despesasFixas)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#A78BFA", textAlign: "right" }}>{fmtBRL(m.despesasVariaveis)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: m.lucroLiquido >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtBRL(m.lucroLiquido)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: m.margemLiquida >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtPercent(m.margemLiquida)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost report */}
      {reportType === "custos" && (
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #2B2B2B" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Relatório de Custos</p>
            <p style={{ fontSize: 13, color: "#666666", marginTop: 2 }}>{periodLabel} — Maiores categorias de despesa</p>
          </div>
          {allExpenses.length === 0 ? (
            <p style={{ fontSize: 13, color: "#555555", textAlign: "center", padding: 30 }}>Sem despesas no período</p>
          ) : (
            <div className="space-y-2">
              {allExpenses.slice(0, 15).map((exp, i) => {
                const maxVal = allExpenses[0].value;
                const pct = maxVal > 0 ? (exp.value / maxVal) * 100 : 0;
                return (
                  <div key={exp.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#666666", width: 24, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 500 }}>{exp.name}</span>
                        <span style={{ fontSize: 12, color: "#B0B0B0" }}>{exp.tipo}</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: "#121212", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#C8A96A", borderRadius: 3 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", width: 100, textAlign: "right" }}>{fmtBRL(exp.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rentabilidade report */}
      {reportType === "rentabilidade" && (
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #2B2B2B" }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Rentabilidade por Procedimento</p>
              <p style={{ fontSize: 13, color: "#666666", marginTop: 2 }}>{periodLabel}</p>
            </div>
            <button
              onClick={() => exportRentabilidadeCSV(rentabilidade, periodLabel)}
              disabled={rentabilidade.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "1px solid #2B2B2B",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                cursor: rentabilidade.length > 0 ? "pointer" : "not-allowed",
                color: rentabilidade.length > 0 ? "#C8A96A" : "#3A3A3A",
              }}
            >
              <Download style={{ width: 13, height: 13 }} /> CSV
            </button>
          </div>
          {rentabilidade.length === 0 ? (
            <p style={{ fontSize: 13, color: "#555555", textAlign: "center", padding: 30 }}>Nenhum procedimento realizado no período</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Procedimento</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Qtd</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Receita</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Custo</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Lucro</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {rentabilidade.map((r) => (
                    <tr key={r.nome} style={{ borderBottom: "1px solid #1E1E1E" }}>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#FFFFFF", fontWeight: 500 }}>{r.nome}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#B0B0B0", textAlign: "center" }}>{r.count}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#B0B0B0", textAlign: "right" }}>{fmtBRL(r.receitaTotal)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#EF4444", textAlign: "right" }}>{fmtBRL(r.custoTotal)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: r.lucroBruto >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtBRL(r.lucroBruto)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: r.margem >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtPercent(r.margem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Break-even report */}
      {reportType === "equilibrio" && (
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #2B2B2B" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Relatório de Ponto de Equilíbrio</p>
            <p style={{ fontSize: 13, color: "#666666", marginTop: 2 }}>{periodLabel}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {[
                { label: "Despesas Fixas", value: fmtBRL(dreAtual.totalDespesasFixas) },
                { label: "Despesas Variáveis", value: fmtBRL(dreAtual.totalDespesasVariaveis) },
                { label: "Margem de Contribuição", value: fmtPercent(dreAtual.margemContribuicao * 100) },
                { label: "Ponto de Equilíbrio", value: fmtBRL(dreAtual.pontoEquilibrio), highlight: true },
                { label: "Vendas Realizadas", value: fmtBRL(dreAtual.vendasAteAgora) },
                { label: dreAtual.acimaEquilibrio ? "Excedente" : "Déficit", value: fmtBRL(Math.abs(dreAtual.faltaparaEquilibrio)), color: dreAtual.acimaEquilibrio ? "#4ADE80" : "#EF4444" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    backgroundColor: row.highlight ? "rgba(200,169,106,0.06)" : "#121212",
                    borderRadius: 6,
                    border: "1px solid #1E1E1E",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#666666" }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: row.color || (row.highlight ? "#C8A96A" : "#FFFFFF") }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 8,
                backgroundColor: dreAtual.acimaEquilibrio ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${dreAtual.acimaEquilibrio ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <FileText style={{ width: 24, height: 24, color: dreAtual.acimaEquilibrio ? "#4ADE80" : "#EF4444", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: dreAtual.acimaEquilibrio ? "#4ADE80" : "#EF4444", margin: 0 }}>
                {dreAtual.acimaEquilibrio
                  ? "A clínica está operando acima do ponto de equilíbrio."
                  : "A clínica está operando abaixo do ponto de equilíbrio."}
              </p>
              <p style={{ fontSize: 12, color: "#B0B0B0", marginTop: 8 }}>
                {dreAtual.acimaEquilibrio
                  ? `Faturamento ${((dreAtual.vendasAteAgora / dreAtual.pontoEquilibrio - 1) * 100).toFixed(1)}% acima do necessário.`
                  : `Faltam ${fmtBRL(dreAtual.faltaparaEquilibrio)} para atingir o equilíbrio.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}