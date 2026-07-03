import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcularRentabilidade, fmtBRL, fmtPercent, getPeriodLabel, exportRentabilidadeCSV } from "@/lib/dreUtils";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export default function RentabilidadeProcedimento({ filters }) {
  const { data: treatments = [], isLoading } = useQuery({
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

  const rows = calcularRentabilidade(treatments, procedures, supplies, filters);
  const periodLabel = getPeriodLabel(filters);

  const totalReceita = rows.reduce((s, r) => s + r.receitaTotal, 0);
  const totalCusto = rows.reduce((s, r) => s + r.custoTotal, 0);
  const totalLucro = rows.reduce((s, r) => s + r.lucroBruto, 0);
  const maisRentavel = rows[0];
  const menosRentavel = rows[rows.length - 1];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Receita Total</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF" }}>{fmtBRL(totalReceita)}</p>
        </div>
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Custo Total</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#EF4444" }}>{fmtBRL(totalCusto)}</p>
        </div>
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Lucro Total</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: totalLucro >= 0 ? "#4ADE80" : "#EF4444" }}>{fmtBRL(totalLucro)}</p>
        </div>
        <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>Procedimentos</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#C8A96A" }}>{rows.reduce((s, r) => s + r.count, 0)}</p>
        </div>
      </div>

      {/* Highlights */}
      {maisRentavel && menosRentavel && rows.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div style={{ backgroundColor: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: 14 }}>
            <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
              <TrendingUp style={{ width: 14, height: 14, color: "#4ADE80" }} />
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4ADE80", margin: 0 }}>Mais Rentável</p>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>{maisRentavel.nome}</p>
            <p style={{ fontSize: 12, color: "#B0B0B0", marginTop: 2 }}>
              {maisRentavel.count}x | Lucro: {fmtBRL(maisRentavel.lucroBruto)} | Margem: {fmtPercent(maisRentavel.margem)}
            </p>
          </div>
          <div style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 14 }}>
            <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
              <TrendingDown style={{ width: 14, height: 14, color: "#EF4444" }} />
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#EF4444", margin: 0 }}>Menos Rentável</p>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>{menosRentavel.nome}</p>
            <p style={{ fontSize: 12, color: "#B0B0B0", marginTop: 2 }}>
              {menosRentavel.count}x | Lucro: {fmtBRL(menosRentavel.lucroBruto)} | Margem: {fmtPercent(menosRentavel.margem)}
            </p>
          </div>
        </div>
      )}

      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={() => exportRentabilidadeCSV(rows, periodLabel)}
          disabled={rows.length === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: "transparent",
            border: "1px solid #2B2B2B",
            borderRadius: 6,
            color: rows.length > 0 ? "#C8A96A" : "#3A3A3A",
            cursor: rows.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          <Download style={{ width: 13, height: 13 }} /> Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          overflow: "hidden",
          overflowX: "auto",
        }}
      >
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#666666" }}>Nenhum procedimento realizado no período</p>
            <p style={{ fontSize: 12, color: "#555555", marginTop: 4 }}>
              Registre tratamentos como "realizado" no módulo de pacientes para visualizar a rentabilidade.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Procedimento</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Vezes</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Preço Médio</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Custo Médio</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Receita Total</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Custo Total</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Lucro Bruto</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Margem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nome} style={{ borderBottom: "1px solid #1E1E1E" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{r.nome}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#B0B0B0", textAlign: "center" }}>{r.count}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#B0B0B0", textAlign: "right" }}>{fmtBRL(r.precoMedio)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#EF4444", textAlign: "right" }}>{fmtBRL(r.custoMedio)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#B0B0B0", textAlign: "right" }}>{fmtBRL(r.receitaTotal)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#EF4444", textAlign: "right" }}>{fmtBRL(r.custoTotal)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: r.lucroBruto >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtBRL(r.lucroBruto)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: r.margem >= 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtPercent(r.margem)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}