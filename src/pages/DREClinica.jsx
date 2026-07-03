import React, { useState } from "react";
import { usePermissions } from "@/lib/PermissionsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Lock } from "lucide-react";
import DREFilters from "@/components/dre/DREFilters";
import DREDashboard from "@/components/dre/DREDashboard";
import RentabilidadeProcedimento from "@/components/dre/RentabilidadeProcedimento";
import LancamentosDRE from "@/components/dre/LancamentosDRE";
import CategoriasDRE from "@/components/dre/CategoriasDRE";
import DREReports from "@/components/dre/DREReports";

export default function DREClinica() {
  const { hasAction } = usePermissions();
  const [filters, setFilters] = useState({
    periodo: "mensal",
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
    view: "realizado",
    procedimento: "all",
    profissional: "all",
    status: "all",
    centro_custo: "all",
  });

  if (!hasAction("ver_financeiro")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="mx-auto mb-4" style={{ width: 40, height: 40, color: "#3A3A3A" }} />
          <h2 style={{ fontSize: 18, color: "#FFFFFF", fontWeight: 500 }}>Acesso Restrito</h2>
          <p style={{ fontSize: 13, color: "#666666", marginTop: 8, maxWidth: 360 }}>
            O módulo DRE da Clínica está disponível apenas para administradores com permissão financeira.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#FFFFFF", margin: 0 }}>
          DRE da Clínica
        </h1>
        <p style={{ fontSize: 13, color: "#666666", marginTop: 4 }}>
          Demonstração do Resultado do Exercício — análise de rentabilidade e gestão financeira
        </p>
      </div>

      {/* Filters */}
      <DREFilters filters={filters} setFilters={setFilters} />

      {/* Tabs */}
      <Tabs defaultValue="dashboard">
        <TabsList style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, flexWrap: "wrap" }}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#C8A96A]/15 data-[state=active]:text-[#C8A96A]" style={{ fontSize: 13 }}>
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="rentabilidade" className="data-[state=active]:bg-[#C8A96A]/15 data-[state=active]:text-[#C8A96A]" style={{ fontSize: 13 }}>
            Rentabilidade
          </TabsTrigger>
          <TabsTrigger value="lancamentos" className="data-[state=active]:bg-[#C8A96A]/15 data-[state=active]:text-[#C8A96A]" style={{ fontSize: 13 }}>
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="data-[state=active]:bg-[#C8A96A]/15 data-[state=active]:text-[#C8A96A]" style={{ fontSize: 13 }}>
            Categorias
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="data-[state=active]:bg-[#C8A96A]/15 data-[state=active]:text-[#C8A96A]" style={{ fontSize: 13 }}>
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DREDashboard filters={filters} />
        </TabsContent>
        <TabsContent value="rentabilidade" className="mt-6">
          <RentabilidadeProcedimento filters={filters} />
        </TabsContent>
        <TabsContent value="lancamentos" className="mt-6">
          <LancamentosDRE />
        </TabsContent>
        <TabsContent value="categorias" className="mt-6">
          <CategoriasDRE />
        </TabsContent>
        <TabsContent value="relatorios" className="mt-6">
          <DREReports filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}