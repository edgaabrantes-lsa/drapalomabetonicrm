import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { FileText, CheckCircle2, XCircle, Download, PenLine, Calendar } from "lucide-react";

const DOCS_CHECKLIST = [
  { key: "contrato_mestre", label: "Contrato Mestre", tipo: "contrato_mestre" },
  { key: "termo_lgpd",      label: "LGPD",            tipo: "termo_lgpd" },
  { key: "uso_imagem",      label: "Uso de Imagem",   tipo: "uso_imagem" },
  { key: "consentimento",   label: "Consentimento",   tipo: "consentimento" },
];

export default function RelatorioConformidade({ patient }) {
  const printRef = useRef(null);

  const { data: documentos = [] } = useQuery({
    queryKey: ["docs-conformidade", patient?.id],
    queryFn: () => base44.entities.DossieDocumento.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  const { data: assinaturas = [] } = useQuery({
    queryKey: ["assinaturas-conformidade", patient?.id],
    queryFn: () => base44.entities.AssinaturaEletronica.filter({ patient_id: patient.id }, "-created_date"),
    enabled: !!patient?.id,
  });

  const { data: tratamentos = [] } = useQuery({
    queryKey: ["tratamentos-conformidade", patient?.id],
    queryFn: () => base44.entities.PatientTreatment.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  function handlePrint() {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head>
        <title>Relatório de Conformidade — ${patient?.full_name}</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #000; padding: 32px; font-size: 13px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #666; padding: 8px 10px; border-bottom: 1px solid #ddd; }
          td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
          .ok { color: #16a34a; font-weight: 600; }
          .nok { color: #dc2626; font-weight: 600; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .badge-green { background: #dcfce7; color: #16a34a; }
          .badge-yellow { background: #fef9c3; color: #a16207; }
          .badge-red { background: #fee2e2; color: #dc2626; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  const docsAssinados = DOCS_CHECKLIST.map(d => ({
    ...d,
    assinado: documentos.some(doc => doc.tipo === d.tipo && doc.status === "assinado"),
    doc: documentos.find(doc => doc.tipo === d.tipo),
  }));

  const totalDocsOk = docsAssinados.filter(d => d.assinado).length;
  const totalAssinaturas = assinaturas.filter(a => a.status === "assinado").length;
  const pct = Math.round(((totalDocsOk + (totalAssinaturas > 0 ? 1 : 0)) / (docsAssinados.length + 1)) * 100);

  const statusGeral = pct === 100 ? "Conformidade Total" : pct >= 60 ? "Conformidade Parcial" : "Não Conforme";
  const statusClass = pct === 100 ? "badge-green" : pct >= 60 ? "badge-yellow" : "badge-red";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ ...S.pageTitle, fontSize: 18 }}>Relatório de Conformidade</p>
          <p style={S.pageSubtitle}>{patient?.full_name}</p>
        </div>
        <button
          onClick={handlePrint}
          style={{ ...S.btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <Download style={{ width: 13, height: 13 }} /> Exportar / Imprimir
        </button>
      </div>

      <div ref={printRef}>
        {/* Cabeçalho do relatório */}
        <h1 style={{ display: "none" }}>Relatório de Conformidade — {patient?.full_name}</h1>

        {/* Dados Cadastrais */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ ...S.label, marginBottom: 12 }}>Dados Cadastrais</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Nome", val: patient?.full_name },
              { label: "CPF", val: patient?.document_number || "—" },
              { label: "Telefone", val: patient?.phone || "—" },
              { label: "E-mail", val: patient?.email || "—" },
              { label: "Nascimento", val: patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString("pt-BR") : "—" },
              { label: "Status", val: patient?.status || "active" },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary }}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status de conformidade */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ ...S.label }}>Status Geral de Conformidade</p>
            <span style={{
              fontFamily: T.font, fontSize: 12, fontWeight: 700,
              color: pct === 100 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444",
              backgroundColor: pct === 100 ? "rgba(34,197,94,0.1)" : pct >= 60 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
              padding: "4px 12px", borderRadius: 20,
            }}>
              {statusGeral} — {pct}%
            </span>
          </div>
          <div style={{ background: T.bgSecondary, borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              backgroundColor: pct === 100 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444",
              borderRadius: 4, transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Documentos */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ ...S.label, marginBottom: 12 }}>Documentos Vinculados</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {docsAssinados.map(d => (
              <div key={d.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 6,
                backgroundColor: d.assinado ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                border: `1px solid ${d.assinado ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {d.assinado
                    ? <CheckCircle2 style={{ width: 14, height: 14, color: "#22c55e" }} />
                    : <XCircle style={{ width: 14, height: 14, color: "#ef4444" }} />
                  }
                  <span style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary }}>{d.label}</span>
                </div>
                {d.doc && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                      v{d.doc.versao || "1.0"}
                      {d.doc.data_assinatura ? " • " + new Date(d.doc.data_assinatura).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Assinaturas eletrônicas */}
        {assinaturas.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ ...S.label, marginBottom: 12 }}>Histórico de Assinaturas Eletrônicas</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {assinaturas.map(a => (
                <div key={a.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px", borderRadius: 6, background: T.bgSecondary,
                }}>
                  <div>
                    <p style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary }}>{a.documento_nome}</p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                      v{a.documento_versao} • {a.assinante_nome} • {a.assinante_cpf}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: T.font, fontSize: 12, color: T.gold }}>{a.documento_hash || "—"}</p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                      {a.data_assinatura ? new Date(a.data_assinatura).toLocaleDateString("pt-BR") + " " + new Date(a.data_assinatura).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Procedimentos */}
        {tratamentos.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <p style={{ ...S.label, marginBottom: 12 }}>Procedimentos Vinculados</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tratamentos.slice(0, 10).map(t => (
                <div key={t.id} style={{
                  display: "flex", justifyContent: "space-between", padding: "8px 10px",
                  borderRadius: 6, background: T.bgSecondary,
                }}>
                  <div>
                    <p style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary }}>{t.protocolo_nome}</p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>{t.categoria} • {t.status}</p>
                  </div>
                  <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                    {t.data_indicacao ? new Date(t.data_indicacao).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}