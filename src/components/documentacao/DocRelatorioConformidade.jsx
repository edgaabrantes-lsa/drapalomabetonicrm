import React from "react";
import { T, S } from "@/lib/designTokens";
import { calcularStatusGeral, STATUS_DOC } from "./documentacaoConfig";
import { ShieldCheck } from "lucide-react";

export default function DocRelatorioConformidade({ patient, checklist, procedimento }) {
  const status = calcularStatusGeral(checklist);
  const obrigatorios = checklist.filter(d => d.obrigatorio);
  const concluidos = obrigatorios.filter(d =>
    ["assinado_internamente", "pdf_anexado", "aprovado"].includes(d.status)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ShieldCheck style={{ width: 18, height: 18, color: T.gold }} />
        <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
          Relatório de Conformidade
        </span>
      </div>

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
              background: status.color + "20", color: status.color,
            }}>
              {status.label}
            </span>
            <p style={{ fontFamily: T.font, fontSize: 24, fontWeight: 700, color: status.color, margin: "4px 0 0" }}>
              {status.pct}%
            </p>
          </div>
        </div>

        <div style={{ background: T.bgSecondary, borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 12 }}>
          <div style={{
            height: "100%", borderRadius: 4, background: status.color,
            width: `${status.pct}%`, transition: "width 0.4s ease",
          }} />
        </div>

        <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, margin: "0 0 16px" }}>
          {concluidos.length} de {obrigatorios.length} documentos obrigatórios concluídos
          {procedimento && ` · Procedimento: ${procedimento}`}
          {` · Atualizado: ${new Date().toLocaleDateString("pt-BR")}`}
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Documento", "Tipo", "Obrig.", "Status", "Assinado em"].map(h => (
                <th key={h} style={{
                  fontFamily: T.font, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em",
                  textTransform: "uppercase", color: T.textMuted, padding: "6px 8px", textAlign: "left",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checklist.map((d, i) => {
              const st = STATUS_DOC[d.status] || STATUS_DOC.pendente;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}10` }}>
                  <td style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, padding: "8px 8px" }}>
                    {d.nome}
                  </td>
                  <td style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, padding: "8px 8px" }}>
                    {d.tipo}
                  </td>
                  <td style={{ fontFamily: T.font, fontSize: 11, color: d.obrigatorio ? "#EF4444" : T.textMuted, padding: "8px 8px" }}>
                    {d.obrigatorio ? "Sim" : "Não"}
                  </td>
                  <td style={{ padding: "8px 8px" }}>
                    <span style={{
                      fontFamily: T.font, fontSize: 10, padding: "2px 6px", borderRadius: 3,
                      background: st.bg, color: st.color, fontWeight: 500,
                    }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, padding: "8px 8px" }}>
                    {d.data_assinatura ? new Date(d.data_assinatura).toLocaleDateString("pt-BR") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}