import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VigilanciaDashboard from "@/components/vigilancia/VigilanciaDashboard";
import VigilanciaChecklist from "@/components/vigilancia/VigilanciaChecklist";
import VigilanciaEquipamentos from "@/components/vigilancia/VigilanciaEquipamentos";
import VigilanciaRastreabilidade from "@/components/vigilancia/VigilanciaRastreabilidade";
import VigilanciaTemperatura from "@/components/vigilancia/VigilanciaTemperatura";
import VigilanciaTreinamentos from "@/components/vigilancia/VigilanciaTreinamentos";
import { ShieldCheck } from "lucide-react";

export default function VigilanciaPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}>
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-white">Vigilância Sanitária</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Centro de Conformidade — Fiscalização e Auditoria</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 rounded-xl border"
          style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
          {[
            { value: "dashboard",      label: "Painel Geral" },
            { value: "checklist",      label: "Checklists" },
            { value: "equipamentos",   label: "Equipamentos" },
            { value: "rastreabilidade",label: "Rastreabilidade" },
            { value: "temperatura",    label: "Temperatura" },
            { value: "treinamentos",   label: "Treinamentos" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:text-white transition-all"
              style={{ color: "#64748b" }}
              data-active-style={{ backgroundColor: "#1e40af", color: "#fff" }}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <VigilanciaDashboard onNavigate={setActiveTab} />
        </TabsContent>
        <TabsContent value="checklist" className="mt-4">
          <VigilanciaChecklist />
        </TabsContent>
        <TabsContent value="equipamentos" className="mt-4">
          <VigilanciaEquipamentos />
        </TabsContent>
        <TabsContent value="rastreabilidade" className="mt-4">
          <VigilanciaRastreabilidade />
        </TabsContent>
        <TabsContent value="temperatura" className="mt-4">
          <VigilanciaTemperatura />
        </TabsContent>
        <TabsContent value="treinamentos" className="mt-4">
          <VigilanciaTreinamentos />
        </TabsContent>
      </Tabs>
    </div>
  );
}