import React, { useState } from "react";
import { T, S } from "@/lib/designTokens";
import { X, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  CATEGORIAS_PROCEDIMENTO,
  TECNICAS_FULL_FACE,
  getDocsParaProcedimento,
} from "./documentacaoConfig";

export default function KitDocumentalModal({ patient, financeiros, onClose, onKitGerado }) {
  const queryClient = useQueryClient();
  const [categoria, setCategoria] = useState("");
  const [procedimentoNome, setProcedimentoNome] = useState("");
  const [tecnicas, setTecnicas] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erros, setErros] = useState([]);

  const financeiro = financeiros?.[0] || null;

  const toggleTecnica = (id) => {
    setTecnicas(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const validar = () => {
    const msgs = [];
    if (!categoria) msgs.push("Selecione a categoria do procedimento");
    if (!patient.document_number) msgs.push("CPF da paciente não cadastrado");
    if (!patient.full_name) msgs.push("Nome da paciente não informado");
    if (categoria === "full_face" && tecnicas.length === 0) msgs.push("Selecione ao menos uma técnica do Full Face");
    return msgs;
  };

  const handleGerar = async () => {
    const msgs = validar();
    if (msgs.length > 0) { setErros(msgs); return; }
    setErros([]);
    setGerando(true);

    try {
      const docs = getDocsParaProcedimento(categoria, tecnicas);
      const now = new Date().toISOString();
      const criado_por = (await base44.auth.me().catch(() => null))?.full_name || "Sistema";
      const proc = procedimentoNome || CATEGORIAS_PROCEDIMENTO[categoria]?.label || "Procedimento";

      const gerados = [];
      for (const d of docs) {
        const docData = {
          patient_id: patient.id,
          patient_name: patient.full_name,
          nome: d.nome,
          tipo: d.tipo,
          status: "gerado",
          obrigatorio: d.obrigatorio,
          procedimento_nome: proc,
          financeiro_id: financeiro?.id || null,
          data_geracao: now,
          versao: "1.0",
          criado_por,
        };
        const criado = await base44.entities.DossieDocumento.create(docData);
        gerados.push(criado);
      }

      queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] });
      setResultado(gerados);
      if (onKitGerado) onKitGerado();
    } finally {
      setGerando(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Zap style={{ width: 17, height: 17, color: T.gold }} />
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
              Gerar Kit Documental
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          {resultado ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: "#22C55E", marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
                Kit Documental Gerado!
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                {resultado.length} documentos criados para <strong style={{ color: T.textSecondary }}>{patient.full_name}</strong>
              </p>
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {resultado.map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: T.bgSecondary, borderRadius: 6, padding: "8px 12px",
                  }}>
                    <CheckCircle2 style={{ width: 13, height: 13, color: "#22C55E", flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary }}>{d.nome}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
                Próximos passos: assine os documentos ou anexe PDFs externos no checklist.
              </p>
              <button onClick={onClose} style={{ ...S.btnPrimary, minWidth: 160 }}>
                Ver Checklist
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ ...S.label, marginBottom: 8 }}>Paciente</p>
                <div style={{
                  background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 6,
                  padding: "10px 14px", fontFamily: T.font, fontSize: 13, color: T.textSecondary,
                }}>
                  {patient.full_name} {patient.document_number ? `— CPF: ${patient.document_number}` : "⚠ CPF não cadastrado"}
                </div>
              </div>

              {!financeiro && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 6, padding: "10px 14px",
                }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: "#F59E0B", flexShrink: 0 }} />
                  <span style={{ fontFamily: T.font, fontSize: 12, color: "#F59E0B" }}>
                    Não há registro financeiro vinculado. O Anexo Financeiro será gerado sem dados de pagamento.
                  </span>
                </div>
              )}

              <div>
                <p style={{ ...S.label, marginBottom: 8 }}>Categoria do Procedimento *</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8 }}>
                  {Object.entries(CATEGORIAS_PROCEDIMENTO).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => { setCategoria(k); setTecnicas([]); }}
                      style={{
                        fontFamily: T.font, fontSize: 12, padding: "10px 12px", borderRadius: 6,
                        border: `1px solid ${categoria === k ? T.gold : T.border}`,
                        background: categoria === k ? T.goldSubtle : T.bgSecondary,
                        color: categoria === k ? T.gold : T.textSecondary,
                        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <span>{v.icon}</span>
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {categoria === "full_face" && (
                <div>
                  <p style={{ ...S.label, marginBottom: 8 }}>Técnicas do Full Face *</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TECNICAS_FULL_FACE.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleTecnica(t.id)}
                        style={{
                          fontFamily: T.font, fontSize: 12, padding: "6px 12px", borderRadius: 20,
                          border: `1px solid ${tecnicas.includes(t.id) ? T.gold : T.border}`,
                          background: tecnicas.includes(t.id) ? T.goldSubtle : "transparent",
                          color: tecnicas.includes(t.id) ? T.gold : T.textMuted,
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {tecnicas.includes(t.id) ? "✓ " : ""}{t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={{ ...S.label, marginBottom: 8 }}>Nome do Procedimento (opcional)</p>
                <input
                  type="text"
                  value={procedimentoNome}
                  onChange={e => setProcedimentoNome(e.target.value)}
                  placeholder={categoria ? CATEGORIAS_PROCEDIMENTO[categoria]?.label : "Ex: Toxina Botulínica Facial"}
                  style={{ ...S.input, width: "100%" }}
                />
              </div>

              {categoria && (
                <div style={{ background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 6, padding: "12px 14px" }}>
                  <p style={{ ...S.label, marginBottom: 8 }}>Documentos que serão gerados:</p>
                  {getDocsParaProcedimento(categoria, tecnicas).map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: d.obrigatorio ? T.gold : T.textMuted,
                      }} />
                      <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                        {d.nome}
                        {!d.obrigatorio && <span style={{ color: T.textMuted }}> (opcional)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {erros.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "10px 14px" }}>
                  {erros.map((e, i) => (
                    <p key={i} style={{ fontFamily: T.font, fontSize: 12, color: "#EF4444", margin: "2px 0" }}>⚠ {e}</p>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button onClick={onClose} style={{ ...S.btnGhost, flex: 1 }}>Cancelar</button>
                <button
                  onClick={handleGerar}
                  disabled={gerando || !categoria}
                  style={{ ...S.btnPrimary, flex: 2, opacity: categoria && !gerando ? 1 : 0.5 }}
                >
                  {gerando ? "Gerando..." : "⚡ Gerar Kit Documental"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}