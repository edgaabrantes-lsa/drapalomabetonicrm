import React, { useState } from "react";
import { T, S } from "@/lib/designTokens";
import { STATUS_DOC, ORIGENS_ASSINATURA } from "./documentacaoConfig";
import { FileDown, PenLine, Upload, Eye, CheckCircle2, RotateCcw, MoreHorizontal } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DocCard({ doc, patient, currentUser, onAssinar, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [showUploadPdf, setShowUploadPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [origem, setOrigem] = useState("assinatura_manual");
  const [obsUpload, setObsUpload] = useState("");
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const st = STATUS_DOC[doc.status] || STATUS_DOC.pendente;
  const concluido = ["assinado_internamente", "pdf_anexado", "aprovado"].includes(doc.status);

  const handleAnexarPdf = async () => {
    if (!pdfFile) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      await base44.entities.DossieDocumento.update(doc.id, {
        status: "pdf_anexado",
        file_url,
        file_name: pdfFile.name,
        origem_assinatura: origem,
        observacoes: obsUpload || doc.observacoes,
        data_upload_externo: new Date().toISOString(),
      });
      setShowUploadPdf(false);
      setPdfFile(null);
      setObsUpload("");
      if (onRefresh) onRefresh();
    } finally {
      setUploading(false);
    }
  };

  const handleAprovar = async () => {
    await base44.entities.DossieDocumento.update(doc.id, { status: "aprovado" });
    if (onRefresh) onRefresh();
  };

  const handleGerarPdf = async () => {
    if (!doc.file_url) {
      window.alert("Documento ainda não possui arquivo gerado.");
      return;
    }
    setGerandoPdf(true);
    try {
      const response = await base44.functions.invoke("gerarContratoAssinado", {
        documento_id: doc.id,
        patient_id: patient.id,
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(doc.nome || "Documento").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      if (doc.file_url) window.open(doc.file_url, "_blank");
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div style={{
      background: T.card, border: `1px solid ${concluido ? "#22C55E33" : T.border}`,
      borderRadius: 8, padding: "14px 16px", transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {concluido && <CheckCircle2 style={{ width: 14, height: 14, color: "#22C55E", flexShrink: 0 }} />}
            <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
              {doc.nome}
            </span>
            {doc.obrigatorio && (
              <span style={{ fontFamily: T.font, fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontWeight: 600 }}>
                Obrigatório
              </span>
            )}
            <span style={{ fontFamily: T.font, fontSize: 11, padding: "2px 7px", borderRadius: 4, background: st.bg, color: st.color, fontWeight: 500 }}>
              {st.label}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
            {doc.procedimento_nome && (
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                📋 {doc.procedimento_nome}
              </span>
            )}
            {doc.data_geracao && (
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                Gerado: {new Date(doc.data_geracao).toLocaleDateString("pt-BR")}
              </span>
            )}
            {doc.data_assinatura && (
              <span style={{ fontFamily: T.font, fontSize: 11, color: "#22C55E" }}>
                Assinado: {new Date(doc.data_assinatura).toLocaleDateString("pt-BR")}
              </span>
            )}
            {doc.versao && (
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>v{doc.versao}</span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noreferrer">
              <button style={{ ...btnStyle, borderColor: T.gold + "44", color: T.gold }}>
                <Eye style={{ width: 12, height: 12 }} /> Ver
              </button>
            </a>
          )}
          {doc.id && (
            <button
              onClick={handleGerarPdf}
              disabled={gerandoPdf}
              style={{ ...btnStyle, borderColor: T.border, color: T.textMuted }}
            >
              <FileDown style={{ width: 12, height: 12 }} />
              {gerandoPdf ? "..." : "PDF"}
            </button>
          )}
          {!concluido && doc.id && (
            <button
              onClick={() => onAssinar && onAssinar(doc)}
              style={{ ...btnStyle, borderColor: "#22C55E44", color: "#22C55E" }}
            >
              <PenLine style={{ width: 12, height: 12 }} /> Assinar
            </button>
          )}
          {!concluido && (
            <button
              onClick={() => setShowUploadPdf(!showUploadPdf)}
              style={{ ...btnStyle, borderColor: "#8B5CF644", color: "#8B5CF6" }}
            >
              <Upload style={{ width: 12, height: 12 }} /> Anexar PDF
            </button>
          )}
          {doc.status === "assinado_internamente" && (
            <button
              onClick={handleAprovar}
              style={{ ...btnStyle, borderColor: "#10B98144", color: "#10B981" }}
            >
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Aprovar
            </button>
          )}
        </div>
      </div>

      {/* Upload PDF externo */}
      {showUploadPdf && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.textPrimary, margin: 0 }}>
            Anexar PDF Assinado Externamente
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <p style={{ ...S.label, marginBottom: 4 }}>Arquivo PDF *</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setPdfFile(e.target.files[0])}
                style={{ ...S.input, fontSize: 12 }}
              />
            </div>
            <div>
              <p style={{ ...S.label, marginBottom: 4 }}>Origem da Assinatura</p>
              <select
                value={origem}
                onChange={e => setOrigem(e.target.value)}
                style={{ ...S.input, fontSize: 12 }}
              >
                {ORIGENS_ASSINATURA.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <p style={{ ...S.label, marginBottom: 4 }}>Observações</p>
              <input
                type="text"
                value={obsUpload}
                onChange={e => setObsUpload(e.target.value)}
                placeholder="Observações opcionais..."
                style={{ ...S.input, fontSize: 12 }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowUploadPdf(false)} style={{ ...S.btnGhost, fontSize: 12, height: 32 }}>
              Cancelar
            </button>
            <button
              onClick={handleAnexarPdf}
              disabled={!pdfFile || uploading}
              style={{ ...S.btnPrimary, fontSize: 12, height: 32, opacity: pdfFile && !uploading ? 1 : 0.5 }}
            >
              {uploading ? "Enviando..." : "Salvar PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500,
  padding: "4px 10px", height: 28, borderRadius: 5, border: "1px solid",
  background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
  transition: "opacity 0.15s",
};