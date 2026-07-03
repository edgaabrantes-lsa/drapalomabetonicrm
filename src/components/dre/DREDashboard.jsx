import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcularDRE, fmtBRL, fmtPercent, getPeriodLabel } from "@/lib/dreUtils";
import DREKpiCard from "./DREKpiCard";
import DRETable from "./DRETable";
import DREBreakEven from "./DREBreakEven";
import DRECharts from "./DRECharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Calculator,
  BarChart3,
  Target,
  Users,
  Stethoscope,
  Percent,
  Wallet,
  PiggyBank,
} from "lucide-react";

export default function DREDashboard({ filters }) {
  const [view, setView] = useState(filters.view || "realizado");

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

  const dre = calcularDRE({
    transactions, lancamentos, treatments, procedures, supplies,
    filters: { ...filters, view },
    view,
  });

  const periodLabel = getPeriodLabel(filters);
  const isPositive = dre.lucroLiquido >= 0;

  const kpis = [
    { label: "Receita Bruta", value: fmtBRL(dre.receitaBruta), accent: "#FFFFFF", icon: DollarSign },
    { label: "Receita Líquida", value: fmtBRL(dre.receitaLiquida), accent: "#C8A96A", icon: Wallet },
    { label: "Custos/Insumos", value: fmtBRL(dre.totalCustosDiretos), accent: "#EF4444", icon: Package },
    { label: "Margem Bruta", value: fmtPercent(dre.margemBruta), accent: dre.margemBruta >= 0 ? "#4ADE80" : "#EF4444", icon: Percent, sublabel: `Lucro: ${fmtBRL(dre.lucroBruto)}` },
    { label: "Despesas Fixas", value: fmtBRL(dre.totalDespesasFixas), accent: "#F59E0B", icon: Calculator },
    { label: "Despesas Variáveis", value: fmtBRL(dre.totalDespesasVariaveis), accent: "#A78BFA", icon: TrendingDown },
    { label: "Lucro Operacional", value: fmtBRL(dre.resultadoOperacional), accent: dre.resultadoOperacional >= 0 ? "#4ADE80" : "#EF4444", icon: BarChart3 },
    { label: "Lucro Líquido", value: fmtBRL(dre.lucroLiquido), accent: isPositive ? "#4ADE80" : "#EF4444", icon: isPositive ? TrendingUp : TrendingDown, sublabel: `Margem: ${fmtPercent(dre.margemLiquida)}` },
    { label: "Margem Líquida", value: fmtPercent(dre.margemLiquida), accent: dre.margemLiquida >= 0 ? "#4ADE80" : "#EF4444", icon: Percent },
    { label: "Ponto Equilíbrio", value: fmtBRL(dre.pontoEquilibrio), accent: "#60A5FA", icon: Target, sublabel: dre.acimaEquilibrio ? "Acima" : "Abaixo" },
    { label: "Ticket Médio", value: fmtBRL(dre.indicadores.ticketMedio), accent: "#FFFFFF", icon: DollarSign },
    { label: "Procedimentos", value: dre.indicadores.totalProcedimentos, accent: "#FFFFFF", icon: Stethoscope },
    { label: "Pacientes", value: dre.indicadores.totalPacientes, accent: "#FFFFFF", icon: Users },
    { label: "Receita/Paciente", value: fmtBRL(dre.indicadores.receitaPorPaciente), accent: "#C8A96A", icon: PiggyBank },
  ];

  return (
    <div className="space-y-4">
      {/* View toggle + period */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center" style={{ gap: 12 }}>
          <p style={{ fontSize: 13, color: "#666666" }}>{periodLabel}</p>
        </div>
        <div
          style={{
            display: "flex",
            backgroundColor: "#121212",
            border: "1px solid #2B2B2B",
            borderRadius: 6,
            padding: 2,
          }}
        >
          <button
            onClick={() => setView("realizado")}
            style={{
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              backgroundColor: view === "realizado" ? "#C8A96A" : "transparent",
              color: view === "realizado" ? "#000000" : "#666666",
              transition: "all 0.15s ease",
            }}
          >
            DRE Realizado
          </button>
          <button
            onClick={() => setView("previsto")}
            style={{
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              backgroundColor: view === "previsto" ? "#C8A96A" : "transparent",
              color: view === "previsto" ? "#000000" : "#666666",
              transition: "all 0.15s ease",
            }}
          >
            DRE Previsto
          </button>
        </div>
      </div>

      {/* Loading state */}
      {ldTx && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
        </div>
      )}

      {/* KPI Cards */}
      {!ldTx && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpis.map((kpi) => (
            <DREKpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      {/* DRE Table + Break-even */}
      {!ldTx && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <DRETable dre={dre} />
          </div>
          <div>
            <DREBreakEven dre={dre} />
          </div>
        </div>
      )}

      {/* Charts */}
      {!ldTx && <DRECharts dre={dre} />}

      {/* Indicators table */}
      {!ldTx && (
        <div
          style={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #2B2B2B",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #2B2B2B" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Indicadores Gerenciais</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { label: "Despesas s/ Receita", value: fmtPercent(dre.indicadores.despPctReceita) },
              { label: "Custos s/ Receita", value: fmtPercent(dre.indicadores.custoPctReceita) },
              { label: "Marketing s/ Receita", value: fmtPercent(dre.indicadores.marketingPctReceita) },
              { label: "Folha s/ Receita", value: fmtPercent(dre.indicadores.folhaPctReceita) },
            ].map((ind) => (
              <div
                key={ind.label}
                style={{
                  padding: "14px 16px",
                  borderRight: "1px solid #1E1E1E",
                  borderBottom: "1px solid #1E1E1E",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666666", marginBottom: 4 }}>
                  {ind.label}
                </p>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>{ind.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!ldTx && dre.receitaBruta === 0 && dre.totalDespesasFixas === 0 && dre.totalDespesasVariaveis === 0 && (
        <div
          style={{
            backgroundColor: "rgba(200,169,106,0.04)",
            border: "1px solid rgba(200,169,106,0.15)",
            borderRadius: 8,
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "#C8A96A", fontWeight: 500, margin: 0 }}>
            Sem dados para o período selecionado
          </p>
          <p style={{ fontSize: 12, color: "#666666", marginTop: 6 }}>
            Cadastre lançamentos na aba "Lançamentos" ou registre transações no módulo Financeiro para visualizar o DRE.
          </p>
        </div>
      )}
    </div>
  );
}