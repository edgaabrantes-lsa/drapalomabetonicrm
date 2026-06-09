import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Filter, Download } from "lucide-react";

const ITENS_DOCS = [
  { key: "contrato_mestre",  label: "Contrato Mestre",          tipo: "contrato_mestre" },
  { key: "termo_lgpd",       label: "LGPD",                     tipo: "termo_lgpd" },
  { key: "uso_imagem",       label: "Uso de Imagem",            tipo: "uso_imagem" },
  { key: "consentimento",    label: "Consentimento",            tipo: "consentimento" },
  { key: "assinatura",       label: "Assinatura Eletrônica",    tipo: null },
  { key: "comprovante",      label: "Comprovante Pagamento",    tipo: null },
];

export default function AuditoriaDocumental() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroDoc, setFiltroDoc] = useState("todos");

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-auditoria"],
    queryFn: () => base44.entities.Patient.list("-created_date", 500),
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ["docs-auditoria"],
    queryFn: () => base44.entities.DossieDocumento.list("-created_date", 2000),
  });

  const { data: assinaturas = [] } = useQuery({
    queryKey: ["assinaturas-auditoria"],
    queryFn: () => base44.entities.AssinaturaEletronica.list("-created_date", 2000),
  });

  const { data: financeiros = [] } = useQuery({
    queryKey: ["financeiros-auditoria"],
    queryFn: () => base44.entities.DossieFinanceiro.list("-created_date", 2000),
  });

  function getPatientStatus(patient) {
    const docs = documentos.filter(d => d.patient_id === patient.id);
    const assinsPaciente = assinaturas.filter(a => a.patient_id === patient.id);
    const finsPaciente = financeiros.filter(f => f.patient_id === patient.id);

    const items = {
      contrato_mestre: docs.some(d => d.tipo === "contrato_mestre" && d.status === "assinado"),
      termo_lgpd: docs.some(d => d.tipo === "termo_lgpd" && d.status === "assinado") || !!patient.consent_terms_signed,
      uso_imagem: docs.some(d => d.tipo === "uso_imagem" && d.status === "assinado") || !!patient.consent_images,
      consentimento: docs.some(d => d.tipo === "consentimento" && d.status === "assinado"),
      assinatura: assinsPaciente.some(a => a.status === "assinado"),
      comprovante: finsPaciente.some(f => f.comprovantes && f.comprovantes.length > 0),
    };

    const totalOk = Object.values(items).filter(Boolean).length;
    const total = Object.keys(items).length;
    const pct = Math.round((totalOk / total) * 100);

    let status;
    if (pct === 100) status = "completo";
    else if (pct >= 50) status = "parcial";
    else status = "incompleto";

    return { items, totalOk, total, pct, status };
  }

  const patientsComStatus = patients.map(p => ({ ...p, _audit: getPatientStatus(p) }));

  const filtrados = patientsComStatus.filter(p => {
    if (filtroStatus !== "todos" && p._audit.status !== filtroStatus) return false;
    if (filtroDoc !== "todos" && p._audit.items[filtroDoc]) return false;
    return true;
  });

  const resumo = {
    completos: patientsComStatus.filter(p => p._audit.status === "completo").length,
    parciais: patientsComStatus.filter(p => p._audit.status === "parcial").length,
    incompletos: patientsComStatus.filter(p => p._audit.status === "incompleto").length,
  };

  const STATUS_CONFIG = {
    completo:   { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle2, label: "Completa" },
    parcial:    { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: AlertTriangle, label: "Parcial" },
    incompleto: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: XCircle,      label: "Incompleta" },
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <ShieldCheck style={{ width: 20, height: 20, color: T.gold }} />
        <div>
          <p style={{ ...S.pageTitle, fontSize: 18 }}>Auditoria Documental</p>
          <p style={S.pageSubtitle}>Conformidade documental de todas as pacientes</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { key: "completos",   label: "Documentação Completa",   color: "#22c55e" },
          { key: "parciais",    label: "Documentação Parcial",     color: "#f59e0b" },
          { key: "incompletos", label: "Documentação Incompleta",  color: "#ef4444" },
        ].map(card => (
          <div key={card.key} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px",
            borderLeft: `3px solid ${card.color}`,
          }}>
            <p style={{ fontFamily: T.font, fontSize: 26, fontWeight: 700, color: card.color }}>{resumo[card.key]}</p>
            <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter style={{ width: 13, height: 13, color: T.textMuted }} />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...S.input, height: 32, fontSize: 12 }}>
            <option value="todos">Todos os Status</option>
            <option value="completo">Completo</option>
            <option value="parcial">Parcial</option>
            <option value="incompleto">Incompleto</option>
          </select>
        </div>
        <select value={filtroDoc} onChange={e => setFiltroDoc(e.target.value)} style={{ ...S.input, height: 32, fontSize: 12 }}>
          <option value="todos">Todos os Documentos</option>
          {ITENS_DOCS.map(d => (
            <option key={d.key} value={d.key}>Sem {d.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontFamily: T.font, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted }}>Paciente</th>
                {ITENS_DOCS.map(d => (
                  <th key={d.key} style={{ padding: "10px 8px", textAlign: "center", fontFamily: T.font, fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.textMuted, whiteSpace: "nowrap" }}>
                    {d.label}
                  </th>
                ))}
                <th style={{ padding: "10px 14px", textAlign: "center", fontFamily: T.font, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.slice(0, 50).map(p => {
                const st = STATUS_CONFIG[p._audit.status];
                const Icon = st.icon;
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px", fontFamily: T.font, fontSize: 13, color: T.textPrimary }}>
                      {p.full_name}
                    </td>
                    {ITENS_DOCS.map(d => (
                      <td key={d.key} style={{ padding: "10px 8px", textAlign: "center" }}>
                        {p._audit.items[d.key]
                          ? <CheckCircle2 style={{ width: 15, height: 15, color: "#22c55e", margin: "0 auto" }} />
                          : <XCircle style={{ width: 15, height: 15, color: "#ef4444", margin: "0 auto" }} />
                        }
                      </td>
                    ))}
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{
                        fontFamily: T.font, fontSize: 11, fontWeight: 600,
                        color: st.color, backgroundColor: st.bg,
                        padding: "3px 8px", borderRadius: 20,
                      }}>
                        {st.label} ({p._audit.pct}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && (
          <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, textAlign: "center", padding: "24px" }}>
            Nenhuma paciente encontrada com os filtros aplicados
          </p>
        )}
        {filtrados.length > 50 && (
          <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, textAlign: "center", padding: "12px" }}>
            Exibindo 50 de {filtrados.length} pacientes
          </p>
        )}
      </div>
    </div>
  );
}