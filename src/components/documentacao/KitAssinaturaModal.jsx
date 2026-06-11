import React, { useRef, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { X, PenLine, RotateCcw, CheckCircle2, Shield, FileText } from "lucide-react";

const CHECKBOXES_PADRAO = [
  { id: "leitura",     label: "Li e compreendi integralmente todo o Kit Documental." },
  { id: "contrato",    label: "Concordo com o Contrato Mestre." },
  { id: "lgpd",        label: "Concordo com o Termo LGPD e autorizo o tratamento dos meus dados." },
  { id: "imagem",      label: "Estou ciente do Termo de Uso de Imagem." },
  { id: "consentimento",label: "Concordo com o Consentimento do Procedimento." },
  { id: "financeiro",  label: "Concordo com as Condições Financeiras descritas no Anexo Financeiro." },
];

export default function KitAssinaturaModal({ kit, patient, currentUser, onClose, onAssinado }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [checks, setChecks] = useState({});
  const [assinanteNome, setAssinanteNome] = useState(patient?.full_name || "");
  const [assinanteCpf, setAssinanteCpf] = useState(patient?.document_number || "");
  const [tipoAssinante, setTipoAssinante] = useState("paciente");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("revisao"); // revisao | assinatura | confirmacao
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [pdfGerado, setPdfGerado] = useState(false);

  const now = new Date();
  const dataFormatada = now.toLocaleDateString("pt-BR");
  const horaFormatada = now.toLocaleTimeString("pt-BR");

  useEffect(() => {
    if (step === "assinatura") setTimeout(() => initCanvas(), 100);
  }, [step]);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    const pos = getPos(e, canvasRef.current);
    setIsDrawing(true); setLastPos(pos); setHasSignature(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    setLastPos(pos);
  }

  function stopDraw(e) { e?.preventDefault(); setIsDrawing(false); }

  const todosChecked = CHECKBOXES_PADRAO.every(c => checks[c.id]);

  async function handleSalvar() {
    if (!hasSignature || !assinanteNome.trim() || !assinanteCpf || !todosChecked) {
      alert("Preencha todos os campos, marque todas as confirmações e desenhe a assinatura.");
      return;
    }
    const cpfNum = assinanteCpf.replace(/\D/g, "");
    if (cpfNum.length !== 11) { alert("CPF inválido. Digite 11 números."); return; }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await fetch(dataUrl).then(r => r.blob());
      const file = new File([blob], "assinatura_kit.png", { type: "image/png" });
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      if (!uploadRes.file_url) throw new Error("Falha no upload da assinatura");

      const hashInput = `${kit.id}-${assinanteNome}-${assinanteCpf}-${now.toISOString()}`;
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) { hash = ((hash << 5) - hash) + hashInput.charCodeAt(i); hash |= 0; }
      const documentoHash = `KIT-${Math.abs(hash).toString(36).toUpperCase()}`;

      // 1. Criar AssinaturaEletronica
      const assinaturaCriada = await base44.entities.AssinaturaEletronica.create({
        patient_id: String(patient.id),
        patient_name: String(patient.full_name),
        documento_id: String(kit.id),
        documento_nome: String(kit.kit_nome || kit.procedimento_nome),
        documento_tipo: "contrato_mestre",
        documento_versao: String(kit.versao || "1.0"),
        documento_hash: documentoHash,
        assinatura_data_url: uploadRes.file_url,
        assinante_nome: assinanteNome,
        assinante_cpf: assinanteCpf,
        assinante_tipo: tipoAssinante,
        declarou_leitura: true,
        concordou_termos: true,
        data_assinatura: now.toISOString(),
        usuario_responsavel_id: String(currentUser?.id || ""),
        usuario_responsavel_nome: String(currentUser?.full_name || "Sistema"),
        dispositivo: String(navigator?.userAgent?.substring(0, 100) || ""),
        ip_address: "capturado-no-registro",
        status: "assinado",
        metodo_assinatura: "presencial_canvas",
      });

      // 2. Atualizar kit
      await base44.entities.DossieKitDocumental.update(kit.id, {
        status: "assinado",
        assinatura_id: assinaturaCriada.id,
        assinatura_status: "assinado",
        origem_assinatura: "assinatura_interna",
        data_assinatura: now.toISOString(),
        assinado_por: assinanteNome,
        hash: documentoHash,
        historico_status: [
          ...(kit.historico_status || []),
          { status: "assinado", data: now.toISOString(), usuario: currentUser?.full_name || "Sistema", observacao: `Assinado por ${assinanteNome}` }
        ],
      });

      // 3. Atualizar documentos individuais para assinado_pelo_kit
      if (kit.documentos_incluidos?.length > 0) {
        for (const doc of kit.documentos_incluidos) {
          if (doc.documento_id) {
            await base44.entities.DossieDocumento.update(doc.documento_id, {
              status: "assinado_pelo_kit",
              assinatura_id: assinaturaCriada.id,
              data_assinatura: now.toISOString(),
              origem_assinatura: "assinatura_interna",
            });
          }
        }
      }

      // 4. Gerar PDF final assinado e salvar no storage
      let pdfFinalUrl = null;
      let pdfFinalNome = null;
      try {
        const nomeArquivo = `KitDocumental_${(kit.procedimento_nome || "Procedimento").replace(/[^a-zA-Z0-9]/g, "_")}_Assinado_${now.toISOString().slice(0,10)}.pdf`;
        const pdfResp = await base44.functions.invoke("gerarKitDocumental", {
          kit_id: kit.id,
          patient_id: patient.id,
          assinatura_id: assinaturaCriada.id,
        });
        // O SDK pode retornar o PDF como Blob, ArrayBuffer ou base64
        let pdfBlob = null;
        const pdfData = pdfResp?.data;
        if (pdfData instanceof Blob) {
          pdfBlob = pdfData;
        } else if (pdfData instanceof ArrayBuffer) {
          pdfBlob = new Blob([pdfData], { type: "application/pdf" });
        } else if (typeof pdfData === "string" && pdfData.length > 100) {
          try {
            const byteChars = atob(pdfData);
            const byteNums = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
            pdfBlob = new Blob([byteNums], { type: "application/pdf" });
          } catch { /* não é base64 válido */ }
        }
        if (pdfBlob && pdfBlob.size > 1000) {
          const pdfFile = new File([pdfBlob], nomeArquivo, { type: "application/pdf" });
          const uploadPdf = await base44.integrations.Core.UploadFile({ file: pdfFile });
          if (uploadPdf?.file_url) {
            pdfFinalUrl = uploadPdf.file_url;
            pdfFinalNome = nomeArquivo;
          }
        }
      } catch (pdfErr) {
        console.warn("PDF final não gerado após assinatura:", pdfErr.message);
      }

      // 5. Atualizar kit com pdf_final_url (se gerado)
      if (pdfFinalUrl) {
        await base44.entities.DossieKitDocumental.update(kit.id, {
          pdf_final_url: pdfFinalUrl,
          pdf_file_name: pdfFinalNome,
        });
      }

      // 6. Log
      await base44.entities.DossieLog.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        acao: `Kit Documental assinado: ${kit.kit_nome || kit.procedimento_nome}`,
        tipo: "documento",
        usuario: currentUser?.full_name || "Sistema",
        descricao: `Hash: ${documentoHash} | Assinante: ${assinanteNome} | CPF: ${assinanteCpf}${pdfFinalUrl ? " | PDF final gerado" : " | PDF pendente"}`,
        data_hora: now.toISOString(),
      });

      setPdfGerado(!!pdfFinalUrl);
      setStep("confirmacao");
      setTimeout(() => { if (onAssinado) onAssinado(assinaturaCriada); }, 200);
    } catch (error) {
      console.error("Erro ao assinar kit:", error);
      alert("Erro ao salvar assinatura: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const canProceed = todosChecked;
  const canSign = hasSignature && assinanteNome.trim() && assinanteCpf.replace(/\D/g, "").length === 11;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, width: "100%", maxWidth: 660,
        maxHeight: "92vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield style={{ width: 18, height: 18, color: T.gold }} />
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>
              Assinar Kit Documental
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>

          {/* STEP: REVISÃO */}
          {step === "revisao" && (
            <div>
              {/* Resumo do kit */}
              <div style={{
                background: T.bgSecondary, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: "12px 16px", marginBottom: 20,
              }}>
                <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Kit Documental
                </p>
                <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 2 }}>
                  {kit.kit_nome || kit.procedimento_nome}
                </p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>
                  Paciente: {patient.full_name} {patient.document_number ? `— CPF: ${patient.document_number}` : ""}
                </p>
              </div>

              {/* Documentos incluídos */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Documentos incluídos neste Kit
                </p>
                {(kit.documentos_incluidos || []).map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 0", borderBottom: `1px solid ${T.borderLight}`,
                  }}>
                    <FileText size={12} style={{ color: T.gold, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary }}>
                      {d.nome}
                    </span>
                    {d.obrigatorio && (
                      <span style={{ fontSize: 9, color: T.gold, marginLeft: "auto" }}>obrigatório</span>
                    )}
                  </div>
                ))}
                {(!kit.documentos_incluidos || kit.documentos_incluidos.length === 0) && (
                  <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>
                    Contrato Mestre · Termo LGPD · Uso de Imagem · Consentimento · Anexo Financeiro
                  </p>
                )}
              </div>

              {/* Checkboxes obrigatórios */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Confirmações obrigatórias
                  </p>
                  <button
                    onClick={() => {
                      const allSelected = CHECKBOXES_PADRAO.every(c => checks[c.id]);
                      const newChecks = {};
                      CHECKBOXES_PADRAO.forEach(c => { newChecks[c.id] = !allSelected; });
                      setChecks(newChecks);
                    }}
                    style={{ ...S.btnGhost, fontSize: 11, height: 28, padding: "4px 10px" }}
                  >
                    {todosChecked ? "Desmarcar todos" : "Selecionar todos"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CHECKBOXES_PADRAO.map(c => (
                    <label key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!checks[c.id]}
                        onChange={e => setChecks(p => ({ ...p, [c.id]: e.target.checked }))}
                        style={{ marginTop: 2, accentColor: T.gold, width: 15, height: 15, flexShrink: 0 }}
                      />
                      <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                        {c.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => canProceed && setStep("assinatura")}
                disabled={!canProceed}
                style={{ ...S.btnPrimary, width: "100%", opacity: canProceed ? 1 : 0.4, cursor: canProceed ? "pointer" : "not-allowed" }}
              >
                Prosseguir para Assinatura
              </button>
            </div>
          )}

          {/* STEP: ASSINATURA */}
          {step === "assinatura" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {/* Tipo */}
                <div>
                  <p style={{ ...S.label, marginBottom: 6 }}>Tipo de Assinante</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ val: "paciente", label: "Paciente" }, { val: "responsavel_legal", label: "Responsável Legal" }].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setTipoAssinante(opt.val)}
                        style={{
                          ...S.btnGhost, fontSize: 12, height: 32,
                          borderColor: tipoAssinante === opt.val ? T.gold : T.border,
                          color: tipoAssinante === opt.val ? T.gold : T.textMuted,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={S.label}>Nome Completo *</p>
                    <input value={assinanteNome} onChange={e => setAssinanteNome(e.target.value)} placeholder="Nome do assinante" style={{ ...S.input, marginTop: 4 }} />
                  </div>
                  <div>
                    <p style={S.label}>CPF *</p>
                    <input
                      value={assinanteCpf}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setAssinanteCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
                      }}
                      placeholder="000.000.000-00"
                      style={{ ...S.input, marginTop: 4 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={S.label}>Data</p>
                    <input value={dataFormatada} readOnly style={{ ...S.input, marginTop: 4, opacity: 0.6 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={S.label}>Hora</p>
                    <input value={horaFormatada} readOnly style={{ ...S.input, marginTop: 4, opacity: 0.6 }} />
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ ...S.label, display: "flex", alignItems: "center", gap: 6 }}>
                    <PenLine size={13} /> Assinatura Manuscrita *
                  </p>
                  <button
                    onClick={clearCanvas}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 12, fontFamily: T.font, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <RotateCcw size={12} /> Limpar
                  </button>
                </div>
                <div style={{
                  border: `1px dashed ${hasSignature ? T.gold : T.border}`,
                  borderRadius: 8, overflow: "hidden", touchAction: "none",
                  backgroundColor: "#fafafa",
                }}>
                  <canvas
                    ref={canvasRef}
                    width={580} height={160}
                    style={{ width: "100%", height: 140, cursor: "crosshair", display: "block" }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                  />
                </div>
                {!hasSignature && (
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    Desenhe sua assinatura acima com o dedo, mouse ou caneta digital
                  </p>
                )}
              </div>

              <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
                Esta assinatura valida integralmente todo o Kit Documental, incluindo Contrato Mestre, LGPD, Consentimentos e Condições Financeiras.
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep("revisao")} style={{ ...S.btnGhost, flex: 1 }}>Voltar</button>
                <button
                  onClick={handleSalvar}
                  disabled={!canSign || saving}
                  style={{ ...S.btnPrimary, flex: 2, opacity: canSign && !saving ? 1 : 0.4, cursor: canSign && !saving ? "pointer" : "not-allowed" }}
                >
                  {saving ? "Salvando..." : "✓ Confirmar Assinatura do Kit"}
                </button>
              </div>
            </div>
          )}

          {/* STEP: CONFIRMAÇÃO */}
          {step === "confirmacao" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 size={52} style={{ color: "#22c55e", marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
                Kit Documental Assinado!
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 4 }}>
                <strong style={{ color: T.textSecondary }}>{kit.kit_nome || kit.procedimento_nome}</strong>
              </p>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 4 }}>
                Assinante: {assinanteNome}
              </p>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 12 }}>
                {dataFormatada} às {horaFormatada}
              </p>
              {pdfGerado ? (
                <p style={{ fontFamily: T.font, fontSize: 12, color: "#22C55E", marginBottom: 20 }}>
                  ✓ PDF final assinado gerado e salvo com sucesso. Use "Baixar PDF" no card do kit.
                </p>
              ) : (
                <p style={{ fontFamily: T.font, fontSize: 12, color: "#F59E0B", marginBottom: 20 }}>
                  ⚠ Assinatura salva. O PDF final não foi gerado automaticamente. Use "Baixar PDF" no card do kit para gerar agora.
                </p>
              )}
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 20 }}>
                Todos os documentos foram atualizados para <strong style={{ color: "#22C55E" }}>assinado pelo kit</strong>.
              </p>
              <button onClick={onClose} style={{ ...S.btnPrimary, minWidth: 160 }}>Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}