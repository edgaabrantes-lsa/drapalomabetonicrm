import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { PenLine, Hash, Monitor, Calendar, User, ChevronDown, ChevronRight, Eye } from "lucide-react";

export default function HistoricoAssinaturas({ patient }) {
  const [expandedId, setExpandedId] = useState(null);

  const { data: assinaturas = [], isLoading } = useQuery({
    queryKey: ["assinaturas", patient?.id],
    queryFn: () => base44.entities.AssinaturaEletronica.filter({ patient_id: patient.id }, "-created_date"),
    enabled: !!patient?.id,
  });

  if (isLoading) return <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted }}>Carregando...</p>;

  if (assinaturas.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 20px" }}>
        <PenLine style={{ width: 32, height: 32, color: T.textMuted, margin: "0 auto 12px" }} />
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted }}>Nenhuma assinatura registrada</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ ...S.label, marginBottom: 14 }}>Histórico de Assinaturas Eletrônicas</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assinaturas.map(a => {
          const isExpanded = expandedId === a.id;
          return (
            <div key={a.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 10, overflow: "hidden",
            }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
                }}
              >
                {isExpanded
                  ? <ChevronDown style={{ width: 14, height: 14, color: T.textMuted }} />
                  : <ChevronRight style={{ width: 14, height: 14, color: T.textMuted }} />
                }
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  backgroundColor: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <PenLine style={{ width: 14, height: 14, color: "#22c55e" }} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                    {a.documento_nome}
                  </p>
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                    v{a.documento_versao} • Assinado por {a.assinante_nome}
                    {a.assinante_tipo === "responsavel_legal" ? ` (Responsável Legal${a.responsavel_parentesco ? " — " + a.responsavel_parentesco : ""})` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                    {a.data_assinatura ? new Date(a.data_assinatura).toLocaleDateString("pt-BR") : "—"}
                  </p>
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                    {a.data_assinatura ? new Date(a.data_assinatura).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </button>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 14px", background: T.bgSecondary }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Hash style={{ width: 12, height: 12, color: T.textMuted, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, marginBottom: 2 }}>HASH DO DOCUMENTO</p>
                        <p style={{ fontFamily: "monospace", fontSize: 12, color: T.textSecondary }}>{a.documento_hash || "—"}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <User style={{ width: 12, height: 12, color: T.textMuted, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, marginBottom: 2 }}>CPF DO ASSINANTE</p>
                        <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{a.assinante_cpf || "—"}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Monitor style={{ width: 12, height: 12, color: T.textMuted, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, marginBottom: 2 }}>DISPOSITIVO</p>
                        <p style={{ fontFamily: T.font, fontSize: 11, color: T.textSecondary }}>
                          {a.dispositivo ? a.dispositivo.substring(0, 60) + "..." : "—"}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <User style={{ width: 12, height: 12, color: T.textMuted, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, marginBottom: 2 }}>RESPONSÁVEL</p>
                        <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{a.usuario_responsavel_nome || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Preview da assinatura */}
                  {a.assinatura_data_url && (
                    <div>
                      <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <Eye style={{ width: 11, height: 11 }} /> ASSINATURA
                      </p>
                      <div style={{ background: "#1a1a1a", borderRadius: 6, padding: 8, border: `1px solid ${T.border}` }}>
                        <img src={a.assinatura_data_url} alt="Assinatura" style={{ maxWidth: "100%", maxHeight: 80, display: "block" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}