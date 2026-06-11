import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { X, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

const ORIGENS = [
  { value: "upload_manual", label: "Upload Manual" },
  { value: "autentique",    label: "Autentique" },
  { value: "docusign",      label: "DocuSign" },
  { value: "clicksign",     label: "Clicksign" },
  { value: "zapsign",       label: "ZapSign" },
  { value: "cartorio",      label: "Cartório" },
  { value: "outro",         label: "Outro" },
];

export default function KitUploadExternoModal({ kit, patient, currentUser, onClose, onAnexado }) {
  const [arquivo, setArquivo] = useState(null);
  const [origem, setOrigem] = useState("upload_manual");
  const [observacoes, setObservacoes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const now = new Date();

  async function handleUpload() {
    if (!arquivo) { alert("Selecione um arquivo PDF."); return; }
    setUploading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: arquivo });
      if (!uploadRes.file_url) throw new Error("Falha no upload do arquivo");

      // Atualizar kit
      await base44.entities.DossieKitDocumental.update(kit.id, {
        status: "pdf_externo_anexado",
        assinatura_status: "externo",
        origem_assinatura: origem,
        pdf_final_url: uploadRes.file_url,
        pdf_file_name: arquivo.name,
        data_upload_externo: now.toISOString(),
        historico_status: [
          ...(kit.historico_status || []),
          {
            status: "pdf_externo_anexado",
            data: now.toISOString(),
            usuario: currentUser?.full_name || "Sistema",
            observacao: `PDF externo via ${ORIGENS.find(o => o.value === origem)?.label || origem}${observacoes ? ': ' + observacoes : ''}`,
          }
        ],
      });

      // Atualizar documentos internos
      if (kit.documentos_incluidos?.length > 0) {
        for (const doc of kit.documentos_incluidos) {
          if (doc.documento_id) {
            await base44.entities.DossieDocumento.update(doc.documento_id, {
              status: "assinado_pelo_kit",
              origem_assinatura: origem,
              data_assinatura: now.toISOString(),
            });
          }
        }
      }

      // Log
      await base44.entities.DossieLog.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        acao: `PDF externo do Kit anexado: ${kit.kit_nome || kit.procedimento_nome}`,
        tipo: "documento",
        usuario: currentUser?.full_name || "Sistema",
        descricao: `Origem: ${origem} | Arquivo: ${arquivo.name}${observacoes ? ' | Obs: ' + observacoes : ''}`,
        data_hora: now.toISOString(),
      });

      setSucesso(true);
      setTimeout(() => { if (onAnexado) onAnexado(); }, 200);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar PDF: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, width: "100%", maxWidth: 500,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Upload size={18} style={{ color: T.gold }} />
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
              Anexar PDF Assinado Externamente
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {sucesso ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 size={52} style={{ color: "#22c55e", marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
                PDF Anexado com Sucesso!
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
                O kit foi marcado como <strong style={{ color: "#10B981" }}>PDF Externo Anexado</strong>.
              </p>
              <button onClick={onClose} style={{ ...S.btnPrimary, minWidth: 140 }}>Fechar</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Info kit */}
              <div style={{ background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 2 }}>Kit:</p>
                <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                  {kit.kit_nome || kit.procedimento_nome}
                </p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>Paciente: {patient.full_name}</p>
              </div>

              {/* Aviso */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 6, padding: "10px 14px",
              }}>
                <AlertTriangle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: T.font, fontSize: 12, color: "#F59E0B", lineHeight: 1.5 }}>
                  O PDF enviado substituirá o kit como documento principal assinado. Os documentos internos serão atualizados para "assinado pelo kit".
                </span>
              </div>

              {/* Origem */}
              <div>
                <p style={{ ...S.label, marginBottom: 6 }}>Plataforma de Assinatura *</p>
                <select
                  value={origem}
                  onChange={e => setOrigem(e.target.value)}
                  style={{ ...S.input, width: "100%" }}
                >
                  {ORIGENS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Arquivo */}
              <div>
                <p style={{ ...S.label, marginBottom: 6 }}>Arquivo PDF Assinado *</p>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "20px", border: `2px dashed ${arquivo ? T.gold : T.border}`, borderRadius: 8,
                  cursor: "pointer", background: T.bgSecondary, transition: "all 0.15s",
                }}>
                  <Upload size={24} style={{ color: arquivo ? T.gold : T.textMuted, marginBottom: 8 }} />
                  <span style={{ fontFamily: T.font, fontSize: 13, color: arquivo ? T.gold : T.textMuted }}>
                    {arquivo ? arquivo.name : "Clique para selecionar o PDF"}
                  </span>
                  <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    Apenas arquivos PDF
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={e => setArquivo(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Observações */}
              <div>
                <p style={{ ...S.label, marginBottom: 6 }}>Observações (opcional)</p>
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Ex: Assinado via Autentique em 10/06/2026..."
                  rows={3}
                  style={{ ...S.input, height: "auto", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ ...S.btnGhost, flex: 1 }}>Cancelar</button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !arquivo}
                  style={{ ...S.btnPrimary, flex: 2, opacity: !uploading && arquivo ? 1 : 0.5 }}
                >
                  {uploading ? "Enviando..." : "Anexar PDF Assinado"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}