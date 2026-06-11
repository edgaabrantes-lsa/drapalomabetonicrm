import React from "react";
import { T, S } from "@/lib/designTokens";
import { ShieldCheck, Package, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import KitStatusBadge from "./KitStatusBadge";

const STATUS_DOC_LABEL = {
  pendente:             { label: "Pendente",           color: "#666666" },
  gerado:               { label: "Gerado",             color: "#3B82F6" },
  aguardando_assinatura:{ label: "Aguard. Assinatura", color: "#F59E0B" },
  assinado_internamente:{ label: "Assinado",           color: "#22C55E" },
  pdf_anexado:          { label: "PDF Anexado",        color: "#8B5CF6" },
  aprovado:             { label: "Aprovado",           color: "#10B981" },
  incluido_no_kit:      { label: "Incluído no Kit",    color: "#3B82F6" },
  assinado_pelo_kit:    { label: "Assinado pelo Kit",  color: "#22C55E" },
  anexado_no_kit:       { label: "Anexado no Kit",     color: "#10B981" },
  pendente_no_kit:      { label: "Pendente no Kit",    color: "#F59E0B" },
  substituido:          { label: "Substituído",        color: "#F97316" },
  cancelado:            { label: "Cancelado",          color: "#EF4444" },
};

export default function DocRelatorioConformidade({ patient, kits = [], checklist = [], procedimento, conformidadeGeral }) {
  const kitsAtivos = kits.filter(k => !["substituido","cancelado"].includes(k.status));
  const kitsAssinados = kits.filter(k => ["assinado","pdf_externo_anexado"].includes(k.status));

  const pct = conformidadeGeral?.pct ?? 0;
  const conformidadeLabel = conformidadeGeral?.label ?? "Pendente";
  const conformidadeColor = conformidadeGeral?.color ?? T.textMuted;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ShieldCheck size={18} style={{ color: T.gold }} />
        <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
          Relatório de Conformidade Documental
        </span>
      </div>

      {/* Card conformidade geral */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <p style={{ ...S.label, margin: 0 }}>Paciente</p>
            <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: "2px 0 0" }}>
              {patient.full_name}
            </p>
            {patient.document_number && (
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>
                CPF: {patient.document_number}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              fontFamily: T.font, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6,
              background: `${conformidadeColor}20`, color: conformidadeColor,
            }}>
              {conformidadeLabel}
            </span>
            <p style={{ fontFamily: T.font, fontSize: 24, fontWeight: 700, color: conformidadeColor, margin: "4px 0 0" }}>
              {pct}%
            </p>
          </div>
        </div>

        <div style={{ background: T.bgSecondary, borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 12 }}>
          <div style={{
            height: "100%", borderRadius: 4, background: conformidadeColor,
            width: `${pct}%`, transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={13} style={{ color: T.gold }} />
            <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
              {kitsAtivos.length} kit{kitsAtivos.length !== 1 ? "s" : ""} ativo{kitsAtivos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={13} style={{ color: "#22C55E" }} />
            <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
              {kitsAssinados.length} assinado{kitsAssinados.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={13} style={{ color: T.textMuted }} />
            <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
              {checklist.length} documentos individuais
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Kits */}
      {kits.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ ...S.label, marginBottom: 12 }}>Kits Documentais</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {kits.map((kit, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", background: T.bgSecondary, borderRadius: 6, gap: 12,
                opacity: ["substituido","cancelado"].includes(kit.status) ? 0.5 : 1,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary, marginBottom: 2 }}>
                    {kit.kit_nome || kit.procedimento_nome}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                      Gerado: {kit.data_geracao ? new Date(kit.data_geracao).toLocaleDateString("pt-BR") : "—"}
                    </span>
                    {kit.data_assinatura && (
                      <span style={{ fontFamily: T.font, fontSize: 11, color: "#22C55E" }}>
                        Assinado: {new Date(kit.data_assinatura).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {kit.assinado_por && (
                      <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                        por {kit.assinado_por}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <KitStatusBadge status={kit.status} size="small" />
                  {["assinado","pdf_externo_anexado"].includes(kit.status) && (
                    <span style={{ fontFamily: T.font, fontSize: 10, color: "#22C55E", fontWeight: 600 }}>
                      ✓ Conforme
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critérios de conformidade */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <p style={{ ...S.label, marginBottom: 12 }}>Critérios de Conformidade do Kit</p>
        {[
          { label: "Kit Documental gerado", ok: kitsAtivos.length > 0 },
          { label: "Procedimento vinculado", ok: kitsAtivos.some(k => k.procedimento_nome) },
          { label: "Paciente vinculada", ok: !!patient.id },
          { label: "Data de geração registrada", ok: kitsAtivos.some(k => k.data_geracao) },
          { label: "Kit assinado ou PDF externo anexado", ok: kitsAssinados.length > 0 },
          { label: "Assinatura ou origem externa registrada", ok: kitsAtivos.some(k => k.assinatura_id || k.origem_assinatura) },
        ].map((c, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          }}>
            {c.ok
              ? <CheckCircle2 size={14} style={{ color: "#22C55E", flexShrink: 0 }} />
              : <Clock size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />}
            <span style={{
              fontFamily: T.font, fontSize: 12,
              color: c.ok ? T.textSecondary : T.textMuted,
              textDecoration: c.ok ? "none" : "none",
            }}>
              {c.label}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: T.font, fontSize: 11, color: c.ok ? "#22C55E" : "#F59E0B", fontWeight: 600 }}>
              {c.ok ? "✓ OK" : "Pendente"}
            </span>
          </div>
        ))}
      </div>

      {/* Nota: documentos individuais não precisam ser assinados se kit assinado */}
      {kitsAssinados.length > 0 && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 6, padding: "10px 14px",
        }}>
          <CheckCircle2 size={14} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: T.font, fontSize: 12, color: "#22C55E", lineHeight: 1.5 }}>
            Kit assinado — os documentos individuais não precisam ser assinados separadamente. A assinatura única do kit valida todo o conjunto documental.
          </span>
        </div>
      )}

      {/* Tabela documentos individuais */}
      {checklist.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ ...S.label, margin: 0 }}>Documentos Individuais (Auditoria)</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Documento", "Tipo", "Kit", "Status", "Data"].map(h => (
                    <th key={h} style={{
                      fontFamily: T.font, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em",
                      textTransform: "uppercase", color: T.textMuted, padding: "8px 12px", textAlign: "left",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checklist.slice(0, 30).map((d, i) => {
                  const st = STATUS_DOC_LABEL[d.status] || STATUS_DOC_LABEL.pendente;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, padding: "8px 12px", maxWidth: 200 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.nome}
                        </span>
                      </td>
                      <td style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, padding: "8px 12px", whiteSpace: "nowrap" }}>
                        {d.tipo?.replace(/_/g, " ")}
                      </td>
                      <td style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, padding: "8px 12px" }}>
                        {d.kit_id ? "✓" : "—"}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{
                          fontFamily: T.font, fontSize: 10, padding: "2px 6px", borderRadius: 3,
                          background: `${st.color}15`, color: st.color, fontWeight: 500, whiteSpace: "nowrap",
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, padding: "8px 12px", whiteSpace: "nowrap" }}>
                        {d.data_assinatura ? new Date(d.data_assinatura).toLocaleDateString("pt-BR") : 
                         d.data_geracao ? new Date(d.data_geracao).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}