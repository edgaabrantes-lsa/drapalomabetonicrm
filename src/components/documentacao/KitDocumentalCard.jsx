import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import {
  Shield, Download, Upload, RotateCcw, History,
  AlertTriangle, FileText, Bug, Printer, Eye
} from "lucide-react";
import KitStatusBadge from "./KitStatusBadge";
import KitChecklistInterno from "./KitChecklistInterno";
import KitAssinaturaModal from "./KitAssinaturaModal";
import KitUploadExternoModal from "./KitUploadExternoModal";
import KitDiagnosticoModal from "./KitDiagnosticoModal";

// Gera HTML de fallback para impressão pelo navegador (nunca vazio)
function buildKitHtml(kit, patient) {
  const now = new Date().toLocaleString("pt-BR");
  const nome = patient?.full_name || kit.patient_name || "Paciente";
  const proc = kit.procedimento_nome || "Procedimento";
  const hash = kit.hash || "—";
  const status = kit.status || "—";
  const dataAss = kit.data_assinatura ? new Date(kit.data_assinatura).toLocaleString("pt-BR") : "—";
  const assinadoPor = kit.assinado_por || "—";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Kit Documental — ${proc} — ${nome}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 22px; margin-bottom: 4px; color: #1a1a1a; }
    h2 { font-size: 14px; color: #C8A96A; border-bottom: 1px solid #C8A96A; padding-bottom: 4px; margin-top: 28px; }
    .badge { display: inline-block; background: #22c55e; color: white; padding: 4px 14px; border-radius: 4px; font-size: 11px; font-weight: bold; margin: 8px 0 20px; }
    .field { margin: 4px 0; } .field strong { display: inline-block; width: 140px; color: #555; }
    .section-text { white-space: pre-wrap; line-height: 1.7; color: #333; font-size: 11.5px; }
    .sig-block { border: 1px solid #ccc; border-radius: 4px; padding: 16px; margin-top: 16px; background: #f9f9f9; }
    .hash { font-family: monospace; font-size: 10px; color: #666; word-break: break-all; }
    footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #999; }
    @media print { button { display: none !important; } }
  </style>
</head>
<body>
  <h1>Kit Documental Assinado</h1>
  <div class="badge">✓ ASSINADO ELETRONICAMENTE</div>

  <h2>Identificação</h2>
  <div class="field"><strong>Paciente:</strong> ${nome}</div>
  <div class="field"><strong>Procedimento:</strong> ${proc}</div>
  <div class="field"><strong>Status:</strong> ${status}</div>
  <div class="field"><strong>Data Assinatura:</strong> ${dataAss}</div>
  <div class="field"><strong>Assinado por:</strong> ${assinadoPor}</div>
  <div class="field"><strong>Gerado em:</strong> ${now}</div>

  <h2>Contrato de Prestação de Serviços</h2>
  <div class="section-text">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

Pelo presente instrumento particular, as partes identificadas acordam os seguintes termos:

1. OBJETO: Prestação de serviços de harmonização orofacial e estética conforme procedimento contratado.
2. OBRIGAÇÕES DA CLÍNICA: Realizar os procedimentos com técnica adequada e profissionais habilitados.
3. OBRIGAÇÕES DA PACIENTE: Fornecer informações verídicas e seguir orientações pré e pós-procedimento.
4. RISCOS: A paciente foi informada dos riscos inerentes ao procedimento.
5. PAGAMENTO: Conforme condições do Anexo Financeiro.
6. FORO: Comarca da clínica.</div>

  <h2>Proteção de Dados (LGPD)</h2>
  <div class="section-text">TERMO DE CONSENTIMENTO — LGPD (Lei 13.709/2018)

A Clínica coleta e trata dados pessoais para finalidades clínicas e administrativas.
A paciente autoriza o tratamento de seus dados conforme as finalidades descritas e pode revogar o consentimento a qualquer momento.</div>

  <h2>Autorização de Uso de Imagem</h2>
  <div class="section-text">TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

A paciente manifesta sua opção de autorização de uso de imagem conforme acordado com a clínica.
A autorização pode ser revogada mediante comunicação escrita.</div>

  <h2>Consentimento do Procedimento</h2>
  <div class="section-text">TERMO DE CONSENTIMENTO — ${proc.toUpperCase()}

A paciente declara estar ciente dos procedimentos contratados, seus riscos, limitações e alternativas.
O profissional forneceu todas as informações necessárias. A paciente confirma ter compreendido e autoriza a realização dos procedimentos.</div>

  <h2>Declarações Finais</h2>
  <div class="section-text">A paciente declara que leu, compreendeu e aceitou integralmente todas as seções deste Kit Documental.
Teve oportunidade de fazer perguntas, que foram respondidas satisfatoriamente.
Autoriza a realização dos procedimentos descritos e está ciente que pode revogar o consentimento antes da realização.</div>

  <h2>Assinatura Eletrônica</h2>
  <div class="sig-block">
    <div class="field"><strong>Nome:</strong> ${assinadoPor}</div>
    <div class="field"><strong>Data:</strong> ${dataAss}</div>
    <div class="field"><strong>Método:</strong> Assinatura Digital Presencial</div>
    <div class="field"><strong>Status:</strong> ✓ ASSINADO</div>
    <div style="margin-top:12px"><strong>Hash:</strong><br/><span class="hash">${hash}</span></div>
  </div>

  <footer>
    Kit Documental — ${proc} — ${nome} — Gerado em ${now}
  </footer>
</body>
</html>`;
}

export default function KitDocumentalCard({ kit, patient, currentUser, onRefresh, onRegerar }) {
  const [showAssinatura, setShowAssinatura]     = useState(false);
  const [showUploadExterno, setShowUploadExterno] = useState(false);
  const [baixandoPdf, setBaixandoPdf]           = useState(false);
  const [showHistorico, setShowHistorico]       = useState(false);
  const [showDiagnostico, setShowDiagnostico]   = useState(false);
  const [erroDetalhe, setErroDetalhe]           = useState(null);

  const isAdmin      = currentUser?.role === "admin";
  const isAssinado   = ["assinado", "pdf_externo_anexado"].includes(kit.status);
  const podeAssinar  = ["gerado", "em_revisao", "aguardando_assinatura"].includes(kit.status);
  const podeAnexar   = !["assinado"].includes(kit.status);
  const precisaRegerarPdf = isAssinado && !kit.pdf_final_url;

  function getKitPdfUrl() {
    if (isAssinado) return kit.pdf_final_url || kit.pdf_url || null;
    return kit.pdf_url || kit.pdf_final_url || null;
  }

  // Abre o kit como HTML imprimível em nova aba
  function handleImprimir() {
    const html = buildKitHtml(kit, patient);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  }

  // Visualizar HTML gerado (para diagnóstico)
  function handleVerHtml() {
    const html = buildKitHtml(kit, patient);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function handleBaixarPdf() {
    setErroDetalhe(null);

    // 1. Se já tem URL persistida, abre diretamente
    const urlSalva = getKitPdfUrl();
    if (urlSalva) {
      window.open(urlSalva, "_blank");
      return;
    }

    // 2. Gerar via backend
    setBaixandoPdf(true);
    try {
      const response = await base44.functions.invoke("gerarKitDocumental", {
        kit_id: kit.id,
        patient_id: patient.id,
        assinatura_id: kit.assinatura_id || null,
      });

      const data = response?.data;

      if (!data) {
        throw new Error("Sem resposta do servidor. Verifique a função backend.");
      }

      // Erro explícito com detalhes
      if (data.error) {
        const msg = data.error + (data.etapa ? ` [etapa: ${data.etapa}]` : "");
        setErroDetalhe(msg);
        return;
      }

      // Sucesso com URL de storage
      if (data.success && data.pdf_url) {
        window.open(data.pdf_url, "_blank");
        if (onRefresh) onRefresh();
        return;
      }

      // Fallback: base64 retornado pelo backend (storage falhou)
      if (data.success && data.pdf_base64) {
        try {
          const byteStr  = atob(data.pdf_base64);
          const bytes    = new Uint8Array(byteStr.length);
          for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
          const blob     = new Blob([bytes], { type: "application/pdf" });
          const tempUrl  = URL.createObjectURL(blob);
          window.open(tempUrl, "_blank");
          setTimeout(() => URL.revokeObjectURL(tempUrl), 15000);
          if (data.storage_error) {
            setErroDetalhe("PDF gerado, mas não salvo no storage. Use Imprimir Kit para garantir acesso permanente. Detalhe: " + data.storage_error);
          }
          return;
        } catch (b64Err) {
          setErroDetalhe("PDF retornado mas falhou ao abrir: " + b64Err.message);
          return;
        }
      }

      // Nenhum dos casos acima
      setErroDetalhe("Resposta inesperada do servidor: " + JSON.stringify(data).substring(0, 200));
    } catch (error) {
      setErroDetalhe("Erro de comunicação: " + error.message);
    } finally {
      setBaixandoPdf(false);
    }
  }

  const conformidadePct   = isAssinado ? 100 : kit.status === "gerado" ? 50 : kit.status === "aguardando_assinatura" ? 75 : 0;
  const conformidadeLabel = isAssinado ? "Conforme" : kit.status === "gerado" ? "Gerado" : kit.status === "aguardando_assinatura" ? "Aguardando Assinatura" : "Sem Kit";
  const conformidadeColor = isAssinado ? "#22C55E" : kit.status === "gerado" ? "#3B82F6" : kit.status === "aguardando_assinatura" ? "#F59E0B" : T.textMuted;

  return (
    <>
      {showAssinatura && (
        <KitAssinaturaModal
          kit={kit} patient={patient} currentUser={currentUser}
          onClose={() => setShowAssinatura(false)}
          onAssinado={() => { setShowAssinatura(false); onRefresh(); }}
        />
      )}
      {showUploadExterno && (
        <KitUploadExternoModal
          kit={kit} patient={patient} currentUser={currentUser}
          onClose={() => setShowUploadExterno(false)}
          onAnexado={() => { setShowUploadExterno(false); onRefresh(); }}
        />
      )}
      {showDiagnostico && (
        <KitDiagnosticoModal
          kit={kit} patient={patient}
          onClose={() => setShowDiagnostico(false)}
        />
      )}

      <div style={{
        background: T.card,
        border: `1px solid ${isAssinado ? "#22C55E30" : T.border}`,
        borderRadius: 10, overflow: "hidden",
        boxShadow: isAssinado ? "0 0 0 1px #22C55E20" : "none",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
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
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Conformidade</p>
            <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 700, color: conformidadeColor }}>
              {conformidadePct}%
            </span>
            <p style={{ fontFamily: T.font, fontSize: 10, color: conformidadeColor }}>{conformidadeLabel}</p>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: "14px 16px" }}>
          {/* Metadados */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
            {kit.tecnicas_full_face?.length > 0 && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Técnicas</p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{kit.tecnicas_full_face.join(" · ")}</p>
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
            {kit.hash && (
              <div>
                <p style={{ ...S.label, marginBottom: 2 }}>Hash</p>
                <p style={{ fontFamily: "monospace", fontSize: 10, color: T.textMuted }}>{kit.hash}</p>
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

            {/* Imprimir Kit — sempre disponível como fallback */}
            <button
              onClick={handleImprimir}
              style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6, borderColor: "#3B82F6", color: "#3B82F6" }}
            >
              <Printer size={13} /> Imprimir Kit
            </button>

            <button
              onClick={() => setShowHistorico(!showHistorico)}
              style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
            >
              <History size={13} /> Histórico
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={handleVerHtml}
                  style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6, borderColor: "#8B5CF6", color: "#8B5CF6" }}
                >
                  <Eye size={13} /> Visualizar HTML
                </button>
                <button
                  onClick={() => setShowDiagnostico(true)}
                  style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6, borderColor: "#7C3AED", color: "#7C3AED" }}
                >
                  <Bug size={13} /> Diagnosticar PDF
                </button>
              </>
            )}
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
          {precisaRegerarPdf && !erroDetalhe && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8,
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 6, padding: "8px 12px",
            }}>
              <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: T.font, fontSize: 12, color: "#F59E0B" }}>
                Kit assinado, mas o PDF final não foi salvo. Clique em <strong>Regerar PDF Final</strong> ou use <strong>Imprimir Kit</strong>.
              </span>
            </div>
          )}

          {/* Erro detalhado */}
          {erroDetalhe && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 6, padding: "10px 12px",
            }}>
              <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontFamily: T.font, fontSize: 12, color: "#EF4444", fontWeight: 600, marginBottom: 4 }}>
                  Falha ao gerar PDF
                </p>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#F87171", lineHeight: 1.5 }}>
                  {erroDetalhe}
                </p>
                <p style={{ fontFamily: T.font, fontSize: 11, color: "#F59E0B", marginTop: 6 }}>
                  Use <strong>Imprimir Kit</strong> para salvar o documento pelo navegador, ou <strong>Diagnosticar PDF</strong> para identificar a causa.
                </p>
              </div>
            </div>
          )}

          <KitChecklistInterno documentosIncluidos={kit.documentos_incluidos || []} />
        </div>
      </div>
    </>
  );
}