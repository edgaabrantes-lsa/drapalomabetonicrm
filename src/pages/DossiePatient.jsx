import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { T, S, STATUS_DOSSIE } from "@/lib/designTokens";
import { ChevronLeft, Search, Menu, X } from "lucide-react";

import DossieCadastro         from "@/components/dossie/DossieCadastro";
import DossieProntuario        from "@/components/dossie/DossieProntuario";
import DossieImagensArquivos   from "@/components/dossie/DossieImagensArquivos";
import DossieDocumentacao      from "@/components/dossie/DossieDocumentacao";
import DossieFinanceiroTab     from "@/components/dossie/DossieFinanceiroTab";
import DossieContratos         from "@/components/dossie/DossieContratos";
import DossieObservacoes       from "@/components/dossie/DossieObservacoes";
import StatusDocumental        from "@/components/governanca/StatusDocumental";
import HistoricoAssinaturas    from "@/components/governanca/HistoricoAssinaturas";
import RelatorioConformidade   from "@/components/governanca/RelatorioConformidade";

const ABAS = [
  { id: "cadastro",            label: "Cadastro" },
  { id: "prontuario",          label: "Prontuário" },
  { id: "fotos",               label: "Fotos" },
  { id: "juridico",            label: "Jurídico" },
  { id: "status_documental",   label: "Status Doc." },
  { id: "assinaturas",         label: "Assinaturas" },
  { id: "financeiro",          label: "Financeiro" },
  { id: "contratos_gerados",   label: "Contratos" },
  { id: "contratos_assinados", label: "Assinados" },
  { id: "observacoes",         label: "Obs." },
  { id: "conformidade",        label: "Conformidade" },
];

export default function DossiePatient() {
  const [currentUser,       setCurrentUser]       = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeTab,         setActiveTab]         = useState("cadastro");
  const [searchTerm,        setSearchTerm]        = useState("");
  const [showSidebar,       setShowSidebar]       = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("patient_id");
    if (pid) setSelectedPatientId(pid);
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const selectedPatient  = patients.find(p => p.id === selectedPatientId);
  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  function selectPatient(id) {
    setSelectedPatientId(id);
    setActiveTab("cadastro");
    setShowSidebar(false);
  }

  const PatientList = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 12px 12px", borderBottom: `1px solid ${T.border}` }}>
        <p style={{ ...S.label, marginBottom: 10 }}>Dossiê da Paciente</p>
        <div style={{ position: "relative" }}>
          <Search style={{
            position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
            width: 13, height: 13, color: T.textMuted, pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
            style={{ ...S.input, paddingLeft: 30, fontSize: 13, height: 34 }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {filteredPatients.length === 0 && (
          <p style={{ ...S.pageSubtitle, textAlign: "center", padding: "32px 16px" }}>
            Nenhuma paciente encontrada
          </p>
        )}
        {filteredPatients.map(p => {
          const st = STATUS_DOSSIE[p.dossie_status];
          const isActive = selectedPatientId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => selectPatient(p.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                textAlign: "left",
                border: "none",
                borderLeft: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                backgroundColor: isActive ? T.goldSubtle : "transparent",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                backgroundColor: isActive ? T.goldSubtle : T.card,
                border: `1px solid ${isActive ? T.gold : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, color: isActive ? T.gold : T.textMuted,
              }}>
                {p.full_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ ...S.value, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.full_name}
                </p>
                {st && (
                  <span style={{ ...S.badge(st.color, st.bg), marginTop: 3, fontSize: 10, padding: "1px 6px" }}>
                    {st.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      {showSidebar && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowSidebar(false)}
        >
          <div
            className="overflow-y-auto"
            style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: "min(280px, 80vw)",
              backgroundColor: T.bgSecondary,
              borderRight: `1px solid ${T.border}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 0" }}>
              <span style={{ ...S.label }}>Pacientes</span>
              <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <PatientList />
          </div>
        </div>
      )}

      <div className="w-full max-w-full min-w-0" style={{ display: "flex", minHeight: "calc(100vh - 88px)", fontFamily: T.font }}>
        <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0" style={{ backgroundColor: T.bgSecondary, borderRight: `1px solid ${T.border}` }}>
          <PatientList />
        </aside>

        <div className="w-full max-w-full min-w-0 flex flex-col flex-1">
          {!selectedPatient && (
            <div className="flex lg:hidden flex-col w-full flex-1">
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderBottom: `1px solid ${T.border}`,
                backgroundColor: T.bgSecondary, flexShrink: 0,
              }}>
                <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
                  <Menu style={{ width: 20, height: 20 }} />
                </button>
                <p style={{ ...S.label, margin: 0 }}>Dossiê da Paciente</p>
              </div>

              <div className="w-full max-w-full flex-1 overflow-y-auto">
                <div style={{ padding: "12px 16px 8px" }}>
                  <div style={{ position: "relative" }}>
                    <Search style={{
                      position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
                      width: 13, height: 13, color: T.textMuted, pointerEvents: "none",
                    }} />
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full"
                      style={{ ...S.input, paddingLeft: 30, fontSize: 13, height: 38 }}
                    />
                  </div>
                </div>

                {filteredPatients.map(p => {
                  const st = STATUS_DOSSIE[p.dossie_status];
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", textAlign: "left", border: "none",
                        borderBottom: `1px solid ${T.border}`,
                        backgroundColor: "transparent", cursor: "pointer",
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                        backgroundColor: T.card, border: `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 600, color: T.gold,
                      }}>
                        {p.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p style={{ ...S.value, fontSize: 14, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.full_name}
                        </p>
                        <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>
                          {p.phone || "Sem telefone"}
                        </p>
                        {st && <span style={{ ...S.badge(st.color, st.bg), marginTop: 4, fontSize: 10 }}>{st.label}</span>}
                      </div>
                      <ChevronLeft style={{ width: 14, height: 14, color: T.textMuted, transform: "rotate(180deg)", flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedPatient && (
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div style={{ textAlign: "center" }}>
                <p style={{ ...S.label, marginBottom: 8 }}>Dossiê da Paciente</p>
                <p style={S.pageSubtitle}>Selecione uma paciente na lista</p>
              </div>
            </div>
          )}

          {selectedPatient && (
            <div className="w-full max-w-full min-w-0 flex flex-col flex-1">
              <div className="flex flex-wrap gap-3 md:gap-2 items-center p-3 md:p-2.5 border-b flex-shrink-0" style={{
                borderColor: T.border,
                backgroundColor: T.bgSecondary,
              }}>
                <button onClick={() => setSelectedPatientId(null)} className="flex lg:hidden flex-shrink-0" style={{
                  background: "none", border: "none", cursor: "pointer", color: T.textMuted,
                  fontFamily: T.font, fontSize: 13, padding: "4px 0",
                }}>
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </button>

                <div style={{
                  width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                  backgroundColor: T.goldSubtle, border: `1px solid ${T.goldBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, color: T.gold,
                }}>
                  {selectedPatient.full_name?.[0]?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p style={{ ...S.value, fontSize: 14, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedPatient.full_name}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs">
                    {selectedPatient.phone && <span style={{ color: T.textMuted }}>{selectedPatient.phone}</span>}
                    {selectedPatient.email && <span className="hidden sm:inline" style={{ color: T.textMuted }}>{selectedPatient.email}</span>}
                    {STATUS_DOSSIE[selectedPatient.dossie_status] && (() => {
                      const st = STATUS_DOSSIE[selectedPatient.dossie_status];
                      return <span style={{ ...S.badge(st.color, st.bg) }}>{st.label}</span>;
                    })()}
                  </div>
                </div>

                <button onClick={() => setShowSidebar(true)} className="flex lg:hidden flex-shrink-0" style={{
                  background: "none", border: `1px solid ${T.border}`, cursor: "pointer",
                  color: T.textMuted, borderRadius: 6, padding: "6px 10px",
                  fontFamily: T.font, fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Menu style={{ width: 13, height: 13 }} />
                </button>
              </div>

              <div className="w-full overflow-x-auto scrollbar-hide flex-shrink-0" style={{
                backgroundColor: T.bgSecondary,
                borderBottom: `1px solid ${T.border}`,
                WebkitOverflowScrolling: "touch",
              }}>
                <div style={{ display: "flex", padding: "0 8px", minWidth: "max-content" }}>
                  {ABAS.map(aba => {
                    const isActive = activeTab === aba.id;
                    return (
                      <button
                        key={aba.id}
                        onClick={() => setActiveTab(aba.id)}
                        style={{
                          fontFamily: T.font, fontSize: 12, fontWeight: isActive ? 600 : 400,
                          color: isActive ? T.textPrimary : T.textMuted,
                          padding: "10px 12px", border: "none",
                          borderBottom: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                          backgroundColor: "transparent", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                        }}
                      >
                        {aba.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full max-w-full min-w-0 flex-1 overflow-y-auto" style={{ padding: "max(12px, 1.5vw)", backgroundColor: T.bgPrimary }}>
                <div className="w-full max-w-full min-w-0">
                  {activeTab === "cadastro"            && <DossieCadastro patient={selectedPatient} onPatientUpdate={() => {}} />}
                  {activeTab === "prontuario"          && <DossieProntuario patient={selectedPatient} currentUser={currentUser} />}
                  {activeTab === "fotos"               && <DossieImagensArquivos patient={selectedPatient} currentUser={currentUser} />}
                  {activeTab === "juridico"            && <DossieDocumentacao patient={selectedPatient} currentUser={currentUser} />}
                  {activeTab === "financeiro"          && <DossieFinanceiroTab patient={selectedPatient} currentUser={currentUser} />}
                  {activeTab === "contratos_gerados"   && <DossieContratos patient={selectedPatient} currentUser={currentUser} mode="gerados" />}
                  {activeTab === "contratos_assinados" && <DossieContratos patient={selectedPatient} currentUser={currentUser} mode="assinados" />}
                  {activeTab === "observacoes"         && <DossieObservacoes patient={selectedPatient} currentUser={currentUser} />}
                  {activeTab === "status_documental"   && <StatusDocumental patient={selectedPatient} />}
                  {activeTab === "assinaturas"         && <HistoricoAssinaturas patient={selectedPatient} />}
                  {activeTab === "conformidade"        && <RelatorioConformidade patient={selectedPatient} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}