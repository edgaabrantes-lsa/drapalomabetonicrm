import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcularRentabilidade, fmtBRL, fmtPercent, getPeriodLabel, exportRentabilidadeCSV } from "@/lib/dreUtils";

const cardStyle = { backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "14px 16px" };
const th = { textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666", whiteSpace: "nowrap" };
const td = { padding: "10px 12px", fontSize: 13, color: "#B0B0B0", whiteSpace: "nowrap" };

function Kpi({ label, value, color = "#FFFFFF", hint }) {
  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 600, color }}>{value}</p>
      {hint && <p style={{ fontSize: 10, color: "#555555", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

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
  const { data: dossieFinanceiro = [] } = useQuery({
    queryKey: ["dossieFinanceiro"],
    queryFn: () => base44.entities.DossieFinanceiro.list("-created_date", 2000),
  });

  const rows = calcularRentabilidade({ treatments, procedures, supplies, dossieFinanceiro, filters });
  const periodLabel = getPeriodLabel(filters);

  const receitaTotal = rows.reduce((s, r) => s + r.receitaTotal, 0);
  const rowsComCusto = rows.filter(r => r.custoInformado);
  const rowsSemCusto = rows.filter(r => !r.custoInformado);
  const custoTotal = rowsComCusto.reduce((s, r) => s + (r.custoTotal || 0), 0);
  const receitaComCusto = rowsComCusto.reduce((s, r) => s + r.receitaTotal, 0);
  const lucroTotal = receitaComCusto - custoTotal;
  const margemMedia = receitaComCusto > 0 ? (lucroTotal / receitaComCusto) * 100 : 0;
  const qtdTotal = rows.reduce((s, r) => s + r.count, 0);
  const ticketMedio = qtdTotal > 0 ? receitaTotal / qtdTotal : 0;

  const ordenadoPorLucro = [...rowsComCusto].sort((a, b) => (b.lucroBruto || 0) - (a.lucroBruto || 0));
  const maisRentavel = ordenadoPorLucro[0];
  const menosRentavel = ordenadoPorLucro.length > 1 ? ordenadoPorLucro[ordenadoPorLucro.length - 1] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Receita do período" value={fmtBRL(receitaTotal)} />
        <Kpi label="Custo direto" value={rowsComCusto.length ? fmtBRL(custoTotal) : "Não informado"} color="#EF4444" hint={rowsSemCusto.length ? `${rowsSemCusto.length} procedimento(s) sem custo cadastrado` : undefined} />
        <Kpi label="Lucro bruto" value={rowsComCusto.length ? fmtBRL(lucroTotal) : "Indisponível"} color={lucroTotal >= 0 ? "#4ADE80" : "#EF4444"} hint={rowsComCusto.length ? `Margem ${fmtPercent(margemMedia)}` : "Cadastre o custo dos procedimentos"} />
        <Kpi label="Procedimentos" value={qtdTotal} color="#C8A96A" hint={`Ticket médio ${fmtBRL(ticketMedio)}`} />
      </div>

      {(maisRentavel || menosRentavel) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {maisRentavel && (
            <div style={{ backgroundColor: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4ADE80", margin: 0 }}>Mais rentável</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF", marginTop: 4 }}>{maisRentavel.nome}</p>
              <p style={{ fontSize: 12, color: "#B0B0B0", marginTop: 2 }}>
                {maisRentavel.count}x · Lucro {fmtBRL(maisRentavel.lucroBruto)} · Margem {fmtPercent(maisRentavel.margem)}
              </p>
            </div>
          )}
          {menosRentavel && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#EF4444", margin: 0 }}>Menos rentável</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF", marginTop: 4 }}>{menosRentavel.nome}</p>
              <p style={{ fontSize: 12, color: "#B0B0B0", marginTop: 2 }}>
                {menosRentavel.count}x · Lucro {fmtBRL(menosRentavel.lucroBruto)} · Margem {fmtPercent(menosRentavel.margem)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p style={{ fontSize: 11, color: "#555555" }}>
          Fonte: Dossiê Financeiro + tratamentos realizados no período ({periodLabel}). Custos vindos do cadastro de procedimentos.
        </p>
        <button
          onClick={() => exportRentabilidadeCSV(rows, periodLabel)}
          disabled={rows.length === 0}
          style={{
            padding: "7px 16px", fontSize: 12, fontWeight: 600, backgroundColor: "transparent",
            border: "1px solid #2B2B2B", borderRadius: 6,
            color: rows.length > 0 ? "#C8A96A" : "#3A3A3A",
            cursor: rows.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Exportar CSV
        </button>
      </div>

      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflowX: "auto" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#666666" }}>Nenhum procedimento no período</p>
            <p style={{ fontSize: 12, color: "#555555", marginTop: 4 }}>
              Registre procedimentos no Dossiê Financeiro da paciente ou marque tratamentos como "realizado".
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                <th style={th}>Procedimento</th>
                <th style={{ ...th, textAlign: "center" }}>Qtd</th>
                <th style={{ ...th, textAlign: "right" }}>Preço médio</th>
                <th style={{ ...th, textAlign: "right" }}>Custo médio</th>
                <th style={{ ...th, textAlign: "right" }}>Receita</th>
                <th style={{ ...th, textAlign: "right" }}>Custo total</th>
                <th style={{ ...th, textAlign: "right" }}>Lucro bruto</th>
                <th style={{ ...th, textAlign: "right" }}>Margem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.nome} style={{ borderBottom: "1px solid #1E1E1E" }}>
                  <td style={{ ...td, color: "#FFFFFF", fontWeight: 500 }}>
                    {r.nome}
                    {r.categoria && <span style={{ fontSize: 10, color: "#555555", marginLeft: 6 }}>{r.categoria}</span>}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>{r.count}</td>
                  <td style={{ ...td, textAlign: "right" }}>{fmtBRL(r.precoMedio)}</td>
                  <td style={{ ...td, textAlign: "right", color: r.custoInformado ? "#EF4444" : "#666666" }}>
                    {r.custoInformado ? fmtBRL(r.custoMedio) : "Custo não informado"}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>{fmtBRL(r.receitaTotal)}</td>
                  <td style={{ ...td, textAlign: "right", color: r.custoInformado ? "#EF4444" : "#666666" }}>
                    {r.custoInformado ? fmtBRL(r.custoTotal) : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, color: r.lucroBruto === null ? "#666666" : r.lucroBruto >= 0 ? "#4ADE80" : "#EF4444" }}>
                    {r.lucroBruto === null ? "Indisponível" : fmtBRL(r.lucroBruto)}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, color: r.margem === null ? "#666666" : r.margem >= 0 ? "#4ADE80" : "#EF4444" }}>
                    {r.margem === null ? "—" : fmtPercent(r.margem)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}