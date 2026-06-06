import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { T, S, STATUS_DOSSIE } from "@/lib/designTokens";

import DossieCadastro         from "@/components/dossie/DossieCadastro";
import DossieProntuario        from "@/components/dossie/DossieProntuario";
import DossieImagensArquivos   from "@/components/dossie/DossieImagensArquivos";
import DossieDocumentacao      from "@/components/dossie/DossieDocumentacao";
import DossieFinanceiroTab     from "@/components/dossie/DossieFinanceiroTab";
import DossieContratos         from "@/components/dossie/DossieContratos";
import DossieObservacoes       from "@/components/dossie/DossieObservacoes";

const ABAS = [
  { id: "cadastro",            label: "Cadastro" },
  { id: "prontuario",          label: "Prontuário" },
  { id: "fotos",               label: "Arquivo Fotográfico" },
  { id: "juridico",            label: "Documentação Jurídica" },
  { id: "financeiro",          label: "Financeiro" },
  { id: "contratos_gerados",   label: "Contratos Gerados" },
  { id: "contratos_assinados", label: "Contratos Assinados" },
  { id: "observacoes",         label: "Observações" },
];

export default function DossiePatient() {
  const [currentUser,       setCurrentUser]       = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeTab,         setActiveTab]         = useState("cadastro");
  const [searchTerm,        setSearchTerm]        = useState("");

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

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "calc(100vh - 88px)", fontFamily: T.font }}>

      {/* ── Lista de pacientes ── */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          backgroundColor: T.bgSecondary,
          borderRight: `1px solid ${T.border}`,
          display: selectedPatientId ? "none" : "flex",
          flexDirection: "column",
        }}
        className="lg:!flex"
      >
        {/* Search */}
        <div style={{ padding: "16px 12px 12px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ ...S.label, marginBottom: 12 }}>Dossiê da Paciente</p>
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              ...S.input,
              fontSize: 13,
              height: 34,
            }}
          />
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredPatients.length === 0 && (
            <p style={{ ...S.pageSubtitle, textAlign: "center", padding: "32px 16px" }}>Nenhuma paciente encontrada</p>
          )}
          {filteredPatients.map(p => {
            const st      = STATUS_DOSSIE[p.dossie_status];
            const isActive = selectedPatientId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPatientId(p.id); setActiveTab("cadastro"); }}
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
                {/* Iniciais */}
                <div style={{
                  width: 30, height: 30, borderRadius: 6,
                  backgroundColor: isActive ? T.goldSubtle : T.card,
                  border: `1px solid ${isActive ? T.gold : T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, color: isActive ? T.gold : T.textMuted,
                  flexShrink: 0,
                }}>
                  {p.full_name?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ ...S.value, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.full_name}
                  </p>
                  {st && (
                    <span style={{
                      ...S.badge(st.color, st.bg),
                      marginTop: 3,
                      fontSize: 10,
                      padding: "1px 6px",
                    }}>
                      {st.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Área do dossiê ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {!selectedPatient ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ ...S.label, marginBottom: 8 }}>Dossiê da Paciente</p>
              <p style={S.pageSubtitle}>Selecione uma paciente na lista para acessar o dossiê</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da paciente */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 24px",
              borderBottom: `1px solid ${T.border}`,
              backgroundColor: T.bgSecondary,
              flexShrink: 0,
            }}>
              {/* Voltar — mobile */}
              <button
                onClick={() => setSelectedPatientId(null)}
                className="lg:hidden"
                style={{
                  ...S.btnGhost,
                  fontSize: 12,
                  height: 30,
                  padding: "4px 12px",
                }}
              >
                Voltar
              </button>

              {/* Iniciais */}
              <div style={{
                width: 36, height: 36, borderRadius: 6,
                backgroundColor: T.goldSubtle,
                border: `1px solid ${T.goldBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 600, color: T.gold, flexShrink: 0,
              }}>
                {selectedPatient.full_name?.[0]?.toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...S.value, fontSize: 15 }}>{selectedPatient.full_name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2, flexWrap: "wrap" }}>
                  {selectedPatient.phone && (
                    <span style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>{selectedPatient.phone}</span>
                  )}
                  {selectedPatient.email && (
                    <span style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>{selectedPatient.email}</span>
                  )}
                  {STATUS_DOSSIE[selectedPatient.dossie_status] && (() => {
                    const st = STATUS_DOSSIE[selectedPatient.dossie_status];
                    return (
                      <span style={S.badge(st.color, st.bg)}>{st.label}</span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              backgroundColor: T.bgSecondary,
              borderBottom: `1px solid ${T.border}`,
              overflowX: "auto",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", padding: "0 24px", minWidth: "max-content" }}>
                {ABAS.map(aba => {
                  const isActive = activeTab === aba.id;
                  return (
                    <button
                      key={aba.id}
                      onClick={() => setActiveTab(aba.id)}
                      style={{
                        fontFamily: T.font,
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? T.textPrimary : T.textMuted,
                        padding: "12px 16px",
                        border: "none",
                        borderBottom: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.textSecondary; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.textMuted; }}
                    >
                      {aba.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, backgroundColor: T.bgPrimary }}>
              {activeTab === "cadastro"            && <DossieCadastro patient={selectedPatient} onPatientUpdate={() => {}} />}
              {activeTab === "prontuario"          && <DossieProntuario patient={selectedPatient} currentUser={currentUser} />}
              {activeTab === "fotos"               && <DossieImagensArquivos patient={selectedPatient} currentUser={currentUser} />}
              {activeTab === "juridico"            && <DossieDocumentacao patient={selectedPatient} currentUser={currentUser} />}
              {activeTab === "financeiro"          && <DossieFinanceiroTab patient={selectedPatient} currentUser={currentUser} />}
              {activeTab === "contratos_gerados"   && <DossieContratos patient={selectedPatient} currentUser={currentUser} mode="gerados" />}
              {activeTab === "contratos_assinados" && <DossieContratos patient={selectedPatient} currentUser={currentUser} mode="assinados" />}
              {activeTab === "observacoes"         && <DossieObservacoes patient={selectedPatient} currentUser={currentUser} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}