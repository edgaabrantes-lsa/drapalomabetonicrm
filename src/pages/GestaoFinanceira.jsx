import React, { useState } from "react";
import FinDashboardExecutivo from "@/components/financeiro/FinDashboardExecutivo";
import FinContasReceber from "@/components/financeiro/FinContasReceber";
import FinContasPagar from "@/components/financeiro/FinContasPagar";
import FinFluxoCaixa from "@/components/financeiro/FinFluxoCaixa";
import FinSimulador from "@/components/financeiro/FinSimulador";
import FinCalculadoraMeta from "@/components/financeiro/FinCalculadoraMeta";
import FinConfiguracoes from "@/components/financeiro/FinConfiguracoes";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "receber", label: "Contas a Receber" },
  { id: "pagar", label: "Contas a Pagar" },
  { id: "fluxo", label: "Fluxo de Caixa" },
  { id: "simulador", label: "Simulador" },
  { id: "meta", label: "Meta Comercial" },
  { id: "config", label: "Configurações" },
];

export default function GestaoFinanceira() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>Gestão Financeira</h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Inteligência financeira da clínica — faturamento, recebimento, caixa e metas.</p>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2B2B2B", marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 18px", background: "transparent", border: "none",
            borderBottom: tab === t.id ? "2px solid #C8A96A" : "2px solid transparent",
            color: tab === t.id ? "#FFFFFF" : "#666", cursor: "pointer",
            fontFamily: "Inter", fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
            whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      <div>
        {tab === "dashboard" && <FinDashboardExecutivo />}
        {tab === "receber" && <FinContasReceber />}
        {tab === "pagar" && <FinContasPagar />}
        {tab === "fluxo" && <FinFluxoCaixa />}
        {tab === "simulador" && <FinSimulador />}
        {tab === "meta" && <FinCalculadoraMeta />}
        {tab === "config" && <FinConfiguracoes />}
      </div>
    </div>
  );
}