import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import {
  Zap, Shield, Download, Upload, Eye, RotateCcw, History,
  CheckCircle2, Clock, AlertTriangle, FileText, Trash2
} from "lucide-react";
import KitStatusBadge from "./KitStatusBadge";
import KitChecklistInterno from "./KitChecklistInterno";
import KitAssinaturaModal from "./KitAssinaturaModal";
import KitUploadExternoModal from "./KitUploadExternoModal";

export default function KitDocumentalCard({ kit, patient, currentUser, onRefresh, onRegerar }) {
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showUploadExterno, setShowUploadExterno] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  const isAssinado = ["assinado", "pdf_externo_anexado"].includes(kit.status);
  const podeAssinar = ["gerado", "em_revisao", "aguardando_assinatura"].includes(kit.status);
  const podeAnexar = !["assinado"].includes(kit.status);

  async function handleBaixarPdf() {
    setBaixandoPdf(true);
    try {
      // Usar fetch com token para receber o PDF como blob
      const token = await base44.auth.getToken?.().catch(() => null);
      const appId = import.meta.env.VITE_APP_ID || window.__APP_ID__;
      const res = await fetch(`/api/functions/gerarKitDocumental`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ kit_id: kit.id, patient_id: patient.id, assinatura_id: kit.assinatura_id || null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KitDocumental_${(kit.procedimento_nome || "Procedimento").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      alert("Erro ao gerar PDF: " + error.message);
    } finally {
      setBaixandoPdf(false);
    }
  }

  const conformidadePct = isAssinado ? 100 : kit.status === "gerado" ? 50 : kit.status === "aguardando_assinatura" ? 75 : 0;
  const conformidadeLabel = isAssinado ? "Conforme" : kit.status === "gerado" ? "Gerado" : kit.status === "aguardando_assinatura" ? "Aguardando Assinatura" : "Sem Kit";
  const conformidadeColor = isAssinado ? "#22C55E" : kit.status === "gerado" ? "#3B82F6" : kit.status === "aguardando_assinatura" ? "#F59E0B" : T.textMuted;

  return (
    <>
      {showAssinatura && (
        <KitAssinaturaModal
          kit={kit}
          patient={patient}
          currentUser={currentUser}
          onClose={() => setShowAssinatura(false)}
          onAssinado={() => { setShowAssinatura(false); onRefresh(); }}
        />
      )}
      {showUploadExterno && (
        <KitUploadExternoModal
          kit={kit}
          patient={patient}
          currentUser={currentUser}
          onClose={() => setShowUploadExterno(false)}
          onAnexado={() => { setShowUploadExterno(false); onRefresh(); }}
        />
      )}

      <div style={{
        background: T.card, border: `1px solid ${isAssinado ? "#22C55E30" : T.border}`,
        borderRadius: 10, overflow: "hidden",
        boxShadow: isAssinado ? "0 0 0 1px #22C55E20" : "none",
      }}>
        {/* Header do card */}
        <div style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
          background: isAssinado ? "rgba(34,197,94,0.03)" : T.bgSecondary,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <FileText size={15} style={{ color: T.gold, flexShrink: 0 }} />
              <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                {kit.kit_nome || `Kit — ${kit.procedimento_nome}`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <KitStatusBadge status={kit.status} />
              {kit.data_geracao && (
                <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                  Gerado: {new Date(kit.data_geracao).toLocaleDateString("pt-BR")}
                </span>
              )}
              {kit.data_assinatura && (
                <span style={{ fontFamily: T.font, fontSize: 11, color: "#22C55E" }}>
                  Assinado: {new Date(kit.data_assinatura).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>

          {/* Conformidade */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Conformidade</p>
            <span style={{
              fontFamily: T.font, fontSize: 20, fontWeight: 700, color: conformidadeColor,
            }}>
              {conformidadePct}%
            </span>
            <p style={{ fontFamily: T.font, fontSize: 10, color: conformidadeColor }}>{conformidadeLabel}</p>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: "14px 16px" }}>
          {/* Informações adicionais */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
            {kit.tecnicas_full_face?.length > 0 && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Técnicas</p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                  {kit.tecnicas_full_face.join(" · ")}
                </p>
              </div>
            )}
            {kit.gerado_por && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Gerado por</p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{kit.gerado_por}</p>
              </div>
            )}
            {kit.assinado_por && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Assinado por</p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{kit.assinado_por}</p>
              </div>
            )}
            {kit.origem_assinatura && kit.status !== "nao_gerado" && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Origem</p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                  {kit.origem_assinatura.replace(/_/g, " ")}
                </p>
              </div>
            )}
            {kit.hash && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Hash</p>
                <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>{kit.hash}</p>
              </div>
            )}
          </div>

          {/* Ações principais */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {podeAssinar && (
              <button
                onClick={() => setShowAssinatura(true)}
                style={{ ...S.btnPrimary, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Shield size={13} /> Assinar Kit
              </button>
            )}

            <button
              onClick={handleBaixarPdf}
              disabled={baixandoPdf}
              style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6, opacity: baixandoPdf ? 0.5 : 1 }}
            >
              <Download size={13} /> {baixandoPdf ? "Gerando..." : "Baixar PDF"}
            </button>

            {podeAnexar && (
              <button
                onClick={() => setShowUploadExterno(true)}
                style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Upload size={13} /> Anexar PDF Externo
              </button>
            )}

            <button
              onClick={() => onRegerar && onRegerar(kit)}
              style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RotateCcw size={13} /> Regerar Kit
            </button>

            <button
              onClick={() => setShowHistorico(!showHistorico)}
              style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
            >
              <History size={13} /> Histórico
            </button>
          </div>

          {/* Histórico */}
          {showHistorico && kit.historico_status?.length > 0 && (
            <div style={{
              background: T.bgSecondary, border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "10px 14px", marginTop: 8,
            }}>
              <p style={{ ...S.label, marginBottom: 8 }}>Histórico de Status</p>
              {[...kit.historico_status].reverse().map((h, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  paddingBottom: 6, marginBottom: 6,
                  borderBottom: i < kit.historico_status.length - 1 ? `1px solid ${T.borderLight}` : "none",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, marginBottom: 2 }}>
                      <strong>{h.status?.replace(/_/g, " ")}</strong>
                      {h.usuario && <span style={{ color: T.textMuted }}> — {h.usuario}</span>}
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                      {h.data ? new Date(h.data).toLocaleString("pt-BR") : ""}
                      {h.observacao && ` — ${h.observacao}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Checklist interno expansível */}
          <KitChecklistInterno documentosIncluidos={kit.documentos_incluidos || []} />
        </div>
      </div>
    </>
  );
}