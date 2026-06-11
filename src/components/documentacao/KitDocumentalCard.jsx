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
  const precisaRegerarPdf = isAssinado && !kit.pdf_final_url;

  // Retorna a melhor URL disponível do kit
  function getKitPdfUrl() {
    if (isAssinado) return kit.pdf_final_url || kit.pdf_url || null;
    return kit.pdf_url || kit.pdf_final_url || null;
  }

  async function handleBaixarPdf() {
    const urlSalva = getKitPdfUrl();

    // Se já tem URL persistida no storage, abrir diretamente
    if (urlSalva) {
      window.open(urlSalva, "_blank");
      return;
    }

    // Sem URL salva: gerar PDF via função backend, salvar e baixar
    setBaixandoPdf(true);
    try {
      const response = await base44.functions.invoke("gerarKitDocumental", {
        kit_id: kit.id,
        patient_id: patient.id,
        assinatura_id: kit.assinatura_id || null,
      });

      let pdfBlob = null;
      const data = response?.data;
      if (data instanceof Blob) {
        pdfBlob = data;
      } else if (data instanceof ArrayBuffer) {
        pdfBlob = new Blob([data], { type: "application/pdf" });
      } else if (typeof data === "string" && data.length > 100) {
        try {
          const byteChars = atob(data);
          const byteNums = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
          pdfBlob = new Blob([byteNums], { type: "application/pdf" });
        } catch { /* não é base64 */ }
      }

      if (!pdfBlob || pdfBlob.size < 1000) {
        throw new Error(data?.error || "PDF gerado está vazio ou inválido.");
      }

      // Salvar no storage e persistir URL
      const nomeArq = `KitDocumental_${(kit.procedimento_nome || "Procedimento").replace(/[^a-zA-Z0-9]/g, "_")}_${isAssinado ? "Assinado" : "Pendente"}.pdf`;
      const pdfFile = new File([pdfBlob], nomeArq, { type: "application/pdf" });
      const uploadRes = await base44.integrations.Core.UploadFile({ file: pdfFile });

      if (uploadRes?.file_url) {
        // Persistir no kit para próximas consultas
        const updateField = isAssinado ? { pdf_final_url: uploadRes.file_url, pdf_file_name: nomeArq } : { pdf_url: uploadRes.file_url, pdf_file_name: nomeArq };
        await base44.entities.DossieKitDocumental.update(kit.id, updateField);
        window.open(uploadRes.file_url, "_blank");
        if (onRefresh) onRefresh();
      } else {
        // Fallback: download local via blob URL
        const tempUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = tempUrl;
        a.download = nomeArq;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(tempUrl);
      }
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

            {precisaRegerarPdf && (
              <button
                onClick={handleBaixarPdf}
                disabled={baixandoPdf}
                style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6, borderColor: "#F59E0B", color: "#F59E0B", opacity: baixandoPdf ? 0.5 : 1 }}
              >
                <RotateCcw size={13} /> {baixandoPdf ? "Gerando..." : "Regerar PDF Final"}
              </button>
            )}

            {!isAssinado && (
              <button
                onClick={() => onRegerar && onRegerar(kit)}
                style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
              >
                <RotateCcw size={13} /> Regerar Kit
              </button>
            )}

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

          {/* Aviso PDF ausente */}
          {precisaRegerarPdf && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8,
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 6, padding: "8px 12px",
            }}>
              <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: T.font, fontSize: 12, color: "#F59E0B" }}>
                Kit assinado, mas o PDF final não foi salvo. Clique em <strong>Regerar PDF Final</strong> para gerar e persistir o PDF assinado.
              </span>
            </div>
          )}

          {/* Checklist interno expansível */}
          <KitChecklistInterno documentosIncluidos={kit.documentos_incluidos || []} />
        </div>
      </div>
    </>
  );
}