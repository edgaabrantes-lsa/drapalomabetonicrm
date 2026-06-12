import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2, Download, Bug, FileText, RefreshCw } from "lucide-react";

export default function KitDiagnosticoModal({ kit, patient, onClose }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  async function executarDiagnostico() {
    setLoading(true);
    setErro(null);
    setResultado(null);
    try {
      const resp = await base44.functions.invoke("diagnosticarKitPdf", {
        kit_id: kit.id,
        patient_id: patient.id,
      });
      const data = resp?.data;
      if (data?.error) throw new Error(data.error);
      setResultado(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  const statusIcon = (ok) =>
    ok
      ? <CheckCircle2 size={14} style={{ color: "#22C55E", flexShrink: 0 }} />
      : <XCircle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />;

  const causeColor = (causa) => {
    if (!causa) return "#22C55E";
    if (causa.includes("jsPDF") || causa.includes("biblioteca")) return "#EF4444";
    if (causa.includes("imagem") || causa.includes("assinatura")) return "#F59E0B";
    if (causa.includes("Upload")) return "#F59E0B";
    if (causa.includes("passou")) return "#22C55E";
    return "#EF4444";
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      backgroundColor: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, width: "100%", maxWidth: 700,
        maxHeight: "92vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bug style={{ width: 18, height: 18, color: T.gold }} />
            <div>
              <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
                Diagnóstico de PDF
              </span>
              <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, margin: 0 }}>
                Kit: {kit.kit_nome || kit.procedimento_nome}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Botão inicial */}
          {!resultado && !loading && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Bug size={40} style={{ color: T.textMuted, marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary, marginBottom: 8 }}>
                Execute a auditoria completa do kit para identificar a causa raiz da falha no PDF.
              </p>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 24 }}>
                Serão testados: dados do kit, paciente, financeiro, assinatura, cada seção do PDF individualmente e o upload para storage.
              </p>
              <button
                onClick={executarDiagnostico}
                style={{ ...S.btnPrimary, fontSize: 13, height: 38, display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Bug size={14} /> Iniciar Diagnóstico Completo
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Loader2 size={36} style={{ color: T.gold, marginBottom: 16, animation: "spin 1s linear infinite" }} />
              <p style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary }}>
                Executando auditoria completa...
              </p>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 8 }}>
                Testando cada seção do PDF individualmente. Aguarde.
              </p>
            </div>
          )}

          {/* Erro geral */}
          {erro && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8, padding: 16, marginBottom: 16,
            }}>
              <p style={{ fontFamily: T.font, fontSize: 13, color: "#EF4444", fontWeight: 600, marginBottom: 4 }}>
                Erro ao executar diagnóstico:
              </p>
              <p style={{ fontFamily: T.font, fontSize: 12, color: "#EF4444", fontFamily: "monospace" }}>{erro}</p>
              <button onClick={executarDiagnostico} style={{ ...S.btnGhost, marginTop: 12, fontSize: 12, height: 32 }}>
                Tentar novamente
              </button>
            </div>
          )}

          {/* RESULTADO */}
          {resultado && (
            <div>
              {/* Causa Raiz */}
              <div style={{
                background: `${causeColor(resultado.causa_raiz)}18`,
                border: `1px solid ${causeColor(resultado.causa_raiz)}40`,
                borderRadius: 8, padding: "14px 16px", marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  {resultado.causa_raiz?.includes("passou") || !resultado.causa_raiz
                    ? <CheckCircle2 size={18} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
                    : <AlertTriangle size={18} style={{ color: causeColor(resultado.causa_raiz), flexShrink: 0, marginTop: 1 }} />
                  }
                  <div>
                    <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: causeColor(resultado.causa_raiz), marginBottom: 4 }}>
                      Causa Identificada
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
                      {resultado.causa_raiz || "Nenhuma causa bloqueante identificada."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kit Resumo */}
              <div style={{
                background: T.bgSecondary, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              }}>
                <p style={{ ...S.label, marginBottom: 8 }}>Resumo do Kit</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                  {Object.entries(resultado.kit_resumo || {}).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>{k}:</span>
                      <span style={{
                        fontFamily: "monospace", fontSize: 11,
                        color: v === true ? "#22C55E" : v === false ? "#EF4444" : T.textSecondary,
                      }}>
                        {String(v ?? "null")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist geral */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...S.label, marginBottom: 10 }}>Auditoria de Dados</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(resultado.results || []).map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "7px 10px",
                      background: item.ok ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.06)",
                      borderRadius: 6,
                      border: `1px solid ${item.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
                    }}>
                      {statusIcon(item.ok)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: T.font, fontSize: 12, color: item.ok ? T.textSecondary : "#EF4444", fontWeight: item.ok ? 400 : 600 }}>
                          {item.label}
                        </span>
                        {item.detail && (
                          <p style={{ fontFamily: "monospace", fontSize: 10, color: T.textMuted, marginTop: 2, wordBreak: "break-all" }}>
                            {item.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testes de Seção PDF */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...S.label, marginBottom: 10 }}>Teste Individual de Seções PDF</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(resultado.secoes_testadas || []).map((s, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px",
                      background: s.ok ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.06)",
                      borderRadius: 5,
                      border: `1px solid ${s.ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.2)"}`,
                    }}>
                      {statusIcon(s.ok)}
                      <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, flex: 1 }}>
                        {s.secao}
                      </span>
                      {s.ok && (
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#22C55E" }}>
                          {s.tamanho.toLocaleString()} bytes
                        </span>
                      )}
                      {!s.ok && s.erro && (
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#EF4444", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.erro}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Erros técnicos */}
              {resultado.errors?.length > 0 && (
                <div style={{
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                }}>
                  <p style={{ ...S.label, color: "#EF4444", marginBottom: 8 }}>Erros Técnicos</p>
                  {resultado.errors.map((e, i) => (
                    <p key={i} style={{ fontFamily: "monospace", fontSize: 11, color: "#F87171", marginBottom: 4 }}>
                      • {e}
                    </p>
                  ))}
                </div>
              )}

              {/* PDF de diagnóstico gerado */}
              {resultado.pdf_diagnostico_url && (
                <div style={{
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <FileText size={18} style={{ color: "#22C55E", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: T.font, fontSize: 12, color: "#22C55E", fontWeight: 600 }}>
                      PDF de Diagnóstico gerado com sucesso!
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                      Se este PDF abrir, a biblioteca PDF e o storage estão funcionando.
                    </p>
                  </div>
                  <button
                    onClick={() => window.open(resultado.pdf_diagnostico_url, "_blank")}
                    style={{ ...S.btnGhost, fontSize: 12, height: 32, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Download size={12} /> Abrir
                  </button>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={executarDiagnostico}
                  style={{ ...S.btnGhost, fontSize: 12, height: 34, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <RefreshCw size={12} /> Rediagnosticar
                </button>
                <button onClick={onClose} style={{ ...S.btnPrimary, fontSize: 12, height: 34, flex: 1 }}>
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}