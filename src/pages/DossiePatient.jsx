import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import DossieCadastro from "@/components/dossie/DossieCadastro";
import DossieProntuario from "@/components/dossie/DossieProntuario";
import DossieImagensArquivos from "@/components/dossie/DossieImagensArquivos";
import DossieDocumentacao from "@/components/dossie/DossieDocumentacao";
import DossieFinanceiroTab from "@/components/dossie/DossieFinanceiroTab";
import DossieContratos from "@/components/dossie/DossieContratos";
import DossieObservacoes from "@/components/dossie/DossieObservacoes";
import DossieLogHistorico from "@/components/dossie/DossieLogHistorico";

const ABAS = [
  { id: "cadastro", label: "Cadastro" },
  { id: "prontuario", label: "Prontuário" },
  { id: "fotos", label: "Arquivo Fotográfico" },
  { id: "juridico", label: "Documentação Jurídica" },
  { id: "financeiro", label: "Financeiro" },
  { id: "contratos_gerados", label: "Contratos Gerados" },
  { id: "contratos_assinados", label: "Contratos Assinados" },
  { id: "observacoes", label: "Observações" },
  { id: "logs", label: "Histórico" }
];

const DOSSIE_STATUS = {
  lead: { label: "Lead", color: "bg-blue-500/20 text-blue-400" },
  avaliacao_agendada: { label: "Avaliação Agendada", color: "bg-yellow-500/20 text-yellow-400" },
  avaliacao_realizada: { label: "Avaliação Realizada", color: "bg-orange-500/20 text-orange-400" },
  em_tratamento: { label: "Em Tratamento", color: "bg-green-500/20 text-green-400" },
  procedimento_realizado: { label: "Procedimento Realizado", color: "bg-emerald-500/20 text-emerald-400" },
  em_acompanhamento: { label: "Em Acompanhamento", color: "bg-purple-500/20 text-purple-400" },
  finalizado: { label: "Finalizado", color: "bg-gray-500/20 text-gray-400" },
  inativo: { label: "Inativo", color: "bg-red-500/20 text-red-400" },
  cancelado: { label: "Cancelado", color: "bg-red-700/20 text-red-600" }
};

export default function DossiePatient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeTab, setActiveTab] = useState("cadastro");
  const [searchTerm, setSearchTerm] = useState("");

  // Read patient ID from URL if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("patient_id");
    if (pid) setSelectedPatientId(pid);
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000)
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-160px)]">

      {/* Sidebar de pacientes */}
      <div className={`
        ${selectedPatientId ? "hidden lg:flex" : "flex"}
        flex-col w-full lg:w-72 xl:w-80 flex-shrink-0 border-r border-[#1A2030]
      `} style={{ backgroundColor: "#0D1119" }}>
        <div className="p-4 border-b border-[#1A2030]">
          <h2 className="text-sm font-semibold text-white mb-3">Dossiê da Paciente</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4A5568]" />
            <Input
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 bg-[#1A2030] border-[#252D3E] text-white text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map((p) => {
            const status = DOSSIE_STATUS[p.dossie_status];
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPatientId(p.id); setActiveTab("cadastro"); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition-all
                  ${selectedPatientId === p.id
                    ? "border-[#C5A059] bg-[#C5A059]/8"
                    : "border-transparent hover:bg-white/4 hover:border-[#252D3E]"
                  }
                `}
                style={selectedPatientId === p.id ? { backgroundColor: "rgba(197,160,89,0.08)" } : {}}
              >
                <Avatar className="h-8 w-8 border border-[#252D3E] flex-shrink-0">
                  <AvatarFallback style={{ backgroundColor: "rgba(197,160,89,0.12)", color: "#C5A059" }} className="text-xs">
                    {p.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{p.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {status && <span className={`text-[10px] px-1.5 py-0 rounded ${status.color}`}>{status.label}</span>}
                    <span className="text-xs text-[#4A5568] truncate">{p.phone}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área do dossiê */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedPatient ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[#4A5568] text-sm">Selecione uma paciente para acessar o dossiê</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da paciente */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1A2030]" style={{ backgroundColor: "#0F1521" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPatientId(null)}
                className="lg:hidden text-[#8A95AA] text-xs"
              >
                Voltar
              </Button>
              <Avatar className="h-10 w-10 border border-[#C5A059]/30 flex-shrink-0">
                <AvatarFallback style={{ backgroundColor: "rgba(197,160,89,0.12)", color: "#C5A059" }}>
                  {selectedPatient.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-medium">{selectedPatient.full_name}</h2>
                <div className="flex items-center gap-3 text-xs text-[#8A95AA]">
                  <span>{selectedPatient.phone}</span>
                  {selectedPatient.email && <span>{selectedPatient.email}</span>}
                  {DOSSIE_STATUS[selectedPatient.dossie_status] && (
                    <Badge className={`text-xs ${DOSSIE_STATUS[selectedPatient.dossie_status].color}`}>
                      {DOSSIE_STATUS[selectedPatient.dossie_status].label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Abas */}
            <div className="border-b border-[#1A2030] overflow-x-auto" style={{ backgroundColor: "#0F1521" }}>
              <div className="flex min-w-max px-4">
                {ABAS.map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => setActiveTab(aba.id)}
                    className={`
                      px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all
                      ${activeTab === aba.id
                        ? "border-[#C5A059] text-[#C5A059]"
                        : "border-transparent text-[#5A6478] hover:text-[#C8D0DF]"
                      }
                    `}
                  >
                    {aba.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo da aba */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "cadastro" && (
                <DossieCadastro
                  patient={selectedPatient}
                  onPatientUpdate={(updated) => {
                    // Optimistic: refresh
                  }}
                />
              )}
              {activeTab === "prontuario" && (
                <DossieProntuario patient={selectedPatient} currentUser={currentUser} />
              )}
              {activeTab === "fotos" && (
                <DossieImagensArquivos patient={selectedPatient} currentUser={currentUser} />
              )}
              {activeTab === "juridico" && (
                <DossieDocumentacao patient={selectedPatient} currentUser={currentUser} />
              )}
              {activeTab === "financeiro" && (
                <DossieFinanceiroTab patient={selectedPatient} currentUser={currentUser} />
              )}
              {activeTab === "contratos_gerados" && (
                <DossieContratos patient={selectedPatient} currentUser={currentUser} mode="gerados" />
              )}
              {activeTab === "contratos_assinados" && (
                <DossieContratos patient={selectedPatient} currentUser={currentUser} mode="assinados" />
              )}
              {activeTab === "observacoes" && (
                <DossieObservacoes patient={selectedPatient} currentUser={currentUser} />
              )}
              {activeTab === "logs" && (
                <DossieLogHistorico patient={selectedPatient} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}