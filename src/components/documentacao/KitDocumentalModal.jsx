import React, { useState } from "react";
import { T, S } from "@/lib/designTokens";
import { X, Zap, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  CATEGORIAS_PROCEDIMENTO,
  TECNICAS_FULL_FACE,
  getDocsParaProcedimento,
} from "./documentacaoConfig";

export default function KitDocumentalModal({ patient, financeiros, kitParaEditar, onClose, onKitGerado }) {
  const queryClient = useQueryClient();
  const [categoria, setCategoria] = useState(kitParaEditar?.categoria || "");
  const [procedimentoNome, setProcedimentoNome] = useState(kitParaEditar?.procedimento_nome || "");
  const [tecnicas, setTecnicas] = useState(kitParaEditar?.tecnicas_full_face || []);
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erros, setErros] = useState([]);

  const financeiro = financeiros?.[0] || null;
  const isRegerar = !!kitParaEditar;

  const toggleTecnica = (id) =>
    setTecnicas(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const validar = () => {
    const msgs = [];
    if (!categoria) msgs.push("Selecione a categoria do procedimento");
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
      if (!docs || docs.length === 0) throw new Error("Nenhum documento encontrado para a categoria selecionada.");
      const now = new Date().toISOString();
      const user = await base44.auth.me().catch(() => null);
      const criado_por = user?.full_name || "Sistema";
      const proc = procedimentoNome || CATEGORIAS_PROCEDIMENTO[categoria]?.label || "Procedimento";

      const kitTipo = categoria === "full_face" ? "full_face" : "procedimento_unico";
      const kitNome = `Kit ${proc} — ${patient.full_name}`;

      // Montar lista de documentos do kit
      const documentosIncluidos = docs.map(d => ({
        tipo: d.tipo,
        nome: d.nome,
        obrigatorio: d.obrigatorio,
        status: "incluido_no_kit",
        documento_id: null, // será preenchido após criar os docs individuais
      }));

      // Se for regerar, cancelar kit anterior
      if (kitParaEditar?.id) {
        await base44.entities.DossieKitDocumental.update(kitParaEditar.id, {
          status: "substituido",
          historico_status: [
            ...(kitParaEditar.historico_status || []),
            { status: "substituido", data: now, usuario: criado_por, observacao: "Kit substituído por nova geração" }
          ],
        });
        // Atualizar docs individuais do kit anterior
        if (kitParaEditar.documentos_incluidos?.length > 0) {
          for (const doc of kitParaEditar.documentos_incluidos) {
            if (doc.documento_id) {
              await base44.entities.DossieDocumento.update(doc.documento_id, { status: "substituido" });
            }
          }
        }
      }

      // Criar kit
      const kitCriado = await base44.entities.DossieKitDocumental.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        procedimento_nome: proc,
        kit_nome: kitNome,
        kit_tipo: kitTipo,
        categoria,
        tecnicas_full_face: tecnicas,
        financeiro_id: financeiro?.id || null,
        status: "aguardando_assinatura",
        assinatura_status: "pendente",
        documentos_incluidos: documentosIncluidos,
        documentos_obrigatorios: docs.filter(d => d.obrigatorio).map(d => d.tipo),
        documentos_pendentes: docs.map(d => d.tipo),
        data_geracao: now,
        gerado_por: criado_por,
        versao: "1.0",
        historico_status: [{ status: "gerado", data: now, usuario: criado_por, observacao: `Kit gerado para ${proc}` }],
      });

      // Criar documentos individuais e atualizar documentosIncluidos com os IDs
      const docsAtualizados = [];
      for (const d of docs) {
        const docData = {
          patient_id: patient.id,
          patient_name: patient.full_name,
          nome: d.nome,
          tipo: d.tipo,
          status: "incluido_no_kit",
          obrigatorio: d.obrigatorio,
          procedimento_nome: proc,
          kit_id: kitCriado.id,
          financeiro_id: financeiro?.id || null,
          data_geracao: now,
          versao: "1.0",
          criado_por,
        };
        const docCriado = await base44.entities.DossieDocumento.create(docData);
        docsAtualizados.push({
          tipo: d.tipo,
          nome: d.nome,
          obrigatorio: d.obrigatorio,
          status: "incluido_no_kit",
          documento_id: docCriado.id,
        });
      }

      // Atualizar kit com IDs dos documentos
      await base44.entities.DossieKitDocumental.update(kitCriado.id, {
        documentos_incluidos: docsAtualizados,
        documentos_pendentes: [],
        status: "aguardando_assinatura",
      });

      // Log
      await base44.entities.DossieLog.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        acao: `Kit Documental gerado: ${kitNome}`,
        tipo: "documento",
        usuario: criado_por,
        descricao: `${docs.length} documentos incluídos | Procedimento: ${proc}`,
        data_hora: now,
      });

      queryClient.invalidateQueries({ queryKey: ["kits-documentais", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] });
      setResultado({ kit: kitCriado, docs: docsAtualizados });
      if (onKitGerado) onKitGerado(kitCriado);
    } catch (err) {
      console.error("[KitModal] Erro ao gerar kit:", err);
      setErros([err.message || "Erro desconhecido ao gerar o kit. Tente novamente."]);
    } finally {
      setGerando(false);
    }
  };

  const docsPreview = categoria ? getDocsParaProcedimento(categoria, tecnicas) : [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Zap size={17} style={{ color: T.gold }} />
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
              {isRegerar ? "Regerar Kit Documental" : "Gerar Kit Documental"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {resultado ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 size={52} style={{ color: "#22C55E", marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
                Kit Documental Criado!
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                {resultado.docs.length} documentos criados — aguardando assinatura da paciente
              </p>
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {resultado.docs.map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: T.bgSecondary, borderRadius: 6, padding: "8px 12px",
                  }}>
                    <FileText size={12} style={{ color: T.gold, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary }}>{d.nome}</span>
                    {d.obrigatorio && <span style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted }}>obrigatório</span>}
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
                Próximo passo: clique em <strong style={{ color: T.gold }}>"Assinar Kit"</strong> para a paciente assinar uma única vez.
              </p>
              <button onClick={onClose} style={{ ...S.btnPrimary, minWidth: 180 }}>
                Ver Kit e Assinar
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Paciente */}
              <div>
                <p style={{ ...S.label, marginBottom: 6 }}>Paciente</p>
                <div style={{
                  background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 6,
                  padding: "10px 14px", fontFamily: T.font, fontSize: 13, color: T.textSecondary,
                }}>
                  {patient.full_name}
                  {patient.document_number
                    ? <span style={{ color: T.textMuted }}> — CPF: {patient.document_number}</span>
                    : <span style={{ color: "#F59E0B" }}> — ⚠ CPF não cadastrado</span>}
                </div>
              </div>

              {/* Aviso sem financeiro */}
              {!financeiro && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 6, padding: "10px 14px",
                }}>
                  <AlertTriangle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: T.font, fontSize: 12, color: "#F59E0B" }}>
                    Sem registro financeiro. O Anexo Financeiro será incluído sem valores. Recomendamos cadastrar o financeiro antes de gerar o kit.
                  </span>
                </div>
              )}

              {/* Categoria */}
              <div>
                <p style={{ ...S.label, marginBottom: 8 }}>Procedimento *</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 8 }}>
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
                      <span>{v.icon}</span><span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Face técnicas */}
              {categoria === "full_face" && (
                <div>
                  <p style={{ ...S.label, marginBottom: 8 }}>Técnicas Incluídas no Full Face *</p>
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

              {/* Nome personalizado */}
              <div>
                <p style={{ ...S.label, marginBottom: 6 }}>Nome do Procedimento (opcional)</p>
                <input
                  type="text"
                  value={procedimentoNome}
                  onChange={e => setProcedimentoNome(e.target.value)}
                  placeholder={categoria ? CATEGORIAS_PROCEDIMENTO[categoria]?.label : "Ex: Rinomodelação + Toxina"}
                  style={{ ...S.input, width: "100%" }}
                />
              </div>

              {/* Preview documentos */}
              {docsPreview.length > 0 && (
                <div style={{ background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ ...S.label, marginBottom: 8 }}>Documentos que serão incluídos no Kit:</p>
                  {docsPreview.map((d, i) => (
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
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 8 }}>
                    A paciente assina <strong style={{ color: T.textSecondary }}>uma única vez</strong> para validar todo o kit.
                  </p>
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
                  {gerando ? "Gerando..." : `⚡ ${isRegerar ? "Regerar" : "Gerar"} Kit Documental`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}