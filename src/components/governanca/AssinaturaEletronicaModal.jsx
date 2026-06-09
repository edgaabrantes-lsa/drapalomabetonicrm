import React, { useRef, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { X, PenLine, RotateCcw, CheckCircle2, Shield } from "lucide-react";

export default function AssinaturaEletronicaModal({ documento, patient, currentUser, onClose, onSigned }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [declarouLeitura, setDeclarouLeitura] = useState(false);
  const [concordouTermos, setConcordouTermos] = useState(false);
  const [assinanteNome, setAssinanteNome] = useState("");
  const [assinanteCpf, setAssinanteCpf] = useState("");
  const [tipoAssinante, setTipoAssinante] = useState("paciente");
  const [responsavelParentesco, setResponsavelParentesco] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("leitura"); // leitura | assinatura | confirmacao
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const now = new Date();
  const dataFormatada = now.toLocaleDateString("pt-BR");
  const horaFormatada = now.toLocaleTimeString("pt-BR");

  useEffect(() => {
    if (step === "assinatura") {
      setTimeout(() => initCanvas(), 100);
    }
  }, [step]);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#C8A96A";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setLastPos(pos);
    setHasSignature(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  }

  function stopDraw(e) {
    e?.preventDefault();
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSalvar() {
    if (!hasSignature || !assinanteNome.trim() || !assinanteCpf || !declarouLeitura || !concordouTermos) {
      alert("Preencha todos os campos obrigatórios e desenhe sua assinatura.");
      return;
    }
    
    const cpfNumeros = assinanteCpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      alert("CPF inválido. Digite 11 números.");
      return;
    }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas não encontrado");
      }

      // Garantir que documento_versao seja sempre uma string válida
      // documento.versao pode ser: número (1), string ("1.0"), undefined, null
      const documentoVersao = (
        String(
          documento?.documento_versao ||
          documento?.versao ||
          documento?.versao_atual ||
          documento?.version ||
          "1.0"
        ).trim() || "1.0"
      );

      const assinaturaDataUrl = canvas.toDataURL("image/png");
      const blob = await fetch(assinaturaDataUrl).then(r => r.blob());
      const file = new File([blob], "assinatura.png", { type: "image/png" });
      
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      if (!uploadRes.file_url) {
        throw new Error("Falha no upload da assinatura");
      }

      const hashInput = `${documento.id}-${documentoVersao}-${assinanteNome}-${assinanteCpf}-${now.toISOString()}`;
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) {
        hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
        hash |= 0;
      }
      const documentoHash = `DOC-${Math.abs(hash).toString(36).toUpperCase()}`;

      const payload = {
        patient_id: String(patient?.id || ""),
        patient_name: String(patient?.full_name || patient?.name || ""),
        documento_id: String(documento?.id || ""),
        documento_nome: String(documento?.nome || documento?.title || "Documento sem nome"),
        documento_tipo: String(documento?.tipo || "outro"),
        documento_versao: documentoVersao,
        documento_hash: documentoHash,
        assinatura_data_url: uploadRes.file_url,
        assinante_nome: String(assinanteNome || ""),
        assinante_cpf: String(assinanteCpf || ""),
        assinante_tipo: String(tipoAssinante || "paciente"),
        responsavel_parentesco: String(tipoAssinante === "responsavel_legal" ? responsavelParentesco : ""),
        declarou_leitura: Boolean(declarouLeitura),
        concordou_termos: Boolean(concordouTermos),
        data_assinatura: now.toISOString(),
        usuario_responsavel_id: String(currentUser?.id || ""),
        usuario_responsavel_nome: String(currentUser?.full_name || currentUser?.email || "Usuário não identificado"),
        dispositivo: String(navigator?.userAgent?.substring(0, 100) || ""),
        ip_address: "capturado-no-registro",
        status: "assinado",
      };

      // Validações de segurança antes de salvar
      if (!payload.patient_id) throw new Error("Paciente não identificado.");
      if (!payload.documento_id) throw new Error("Documento não identificado.");
      if (!payload.documento_nome) throw new Error("Nome do documento não identificado.");
      if (!payload.documento_versao) payload.documento_versao = "1.0";
      if (!payload.assinante_nome) throw new Error("Informe o nome do assinante.");
      if (!payload.assinatura_data_url) throw new Error("Falha no upload da assinatura.");

      console.log("Payload assinatura:", { ...payload, assinatura_data_url: "[URL omitida]" });

      const assinaturaCriada = await base44.entities.AssinaturaEletronica.create(payload);

      if (documento.id) {
        await base44.entities.DossieDocumento.update(documento.id, {
          status: "assinado",
          data_assinatura: now.toISOString(),
        });
      }

      await base44.entities.DossieLog.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        acao: `Documento assinado eletronicamente: ${documento.nome} v${documento.versao || "1.0"}`,
        tipo: "documento",
        usuario: currentUser?.full_name || "Sistema",
        descricao: `Hash: ${documentoHash} | Assinante: ${assinanteNome} | CPF: ${assinanteCpf}`,
        data_hora: now.toISOString(),
      });

      setStep("confirmacao");
    } catch (error) {
      console.error("Erro ao salvar assinatura:", error);
      const msg = error.message || "Erro desconhecido";
      const msgFriendly = msg.includes("documento_versao")
        ? "Não foi possível salvar a assinatura. O documento não possui versão válida."
        : "Erro ao salvar assinatura: " + msg;
      alert(msgFriendly);
    } finally {
      setSaving(false);
    }
    setTimeout(() => {
      if (onSigned) onSigned();
    }, 100);
  }

  const canProceed = declarouLeitura && concordouTermos;
  const canSign = hasSignature && assinanteNome.trim() && assinanteCpf.replace(/\D/g, "").length === 11 && declarouLeitura && concordouTermos;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, width: "100%", maxWidth: 640,
        maxHeight: "90vh", overflowY: "auto",
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
              Assinatura Eletrônica
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>

          {/* STEP: LEITURA */}
          {step === "leitura" && (
            <div>
              <p style={{ ...S.label, marginBottom: 8 }}>Documento</p>
              <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>
                {documento.nome}
              </p>
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
                Versão {documento.versao || "1.0"} — {dataFormatada}
              </p>

              {documento.conteudo && (
                <div style={{
                  background: T.bgSecondary, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: 16, maxHeight: 280, overflowY: "auto",
                  fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 1.7,
                  marginBottom: 20, whiteSpace: "pre-wrap",
                }}>
                  {documento.conteudo}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox" checked={declarouLeitura}
                    onChange={e => setDeclarouLeitura(e.target.checked)}
                    style={{ marginTop: 2, accentColor: T.gold, width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                    ☐ Declaro que li e compreendi o conteúdo apresentado.
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox" checked={concordouTermos}
                    onChange={e => setConcordouTermos(e.target.checked)}
                    style={{ marginTop: 2, accentColor: T.gold, width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                    ☐ Concordo com os termos apresentados.
                  </span>
                </label>
              </div>

              <button
                onClick={() => canProceed && setStep("assinatura")}
                disabled={!canProceed}
                style={{
                  ...S.btnPrimary,
                  width: "100%",
                  opacity: canProceed ? 1 : 0.4,
                  cursor: canProceed ? "pointer" : "not-allowed",
                }}
              >
                Prosseguir para Assinatura
              </button>
            </div>
          )}

          {/* STEP: ASSINATURA */}
          {step === "assinatura" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={S.label}>Tipo de Assinante</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {[
                      { val: "paciente", label: "Paciente" },
                      { val: "responsavel_legal", label: "Responsável Legal" },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setTipoAssinante(opt.val)}
                        style={{
                          ...S.btnGhost,
                          borderColor: tipoAssinante === opt.val ? T.gold : T.border,
                          color: tipoAssinante === opt.val ? T.gold : T.textMuted,
                          fontSize: 12,
                          height: 32,
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
                    <input
                      value={assinanteNome}
                      onChange={e => setAssinanteNome(e.target.value)}
                      placeholder="Nome do assinante"
                      style={{ ...S.input, marginTop: 4 }}
                    />
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

                {tipoAssinante === "responsavel_legal" && (
                  <div>
                    <p style={S.label}>Parentesco</p>
                    <input
                      value={responsavelParentesco}
                      onChange={e => setResponsavelParentesco(e.target.value)}
                      placeholder="Ex: Mãe, Pai, Tutor..."
                      style={{ ...S.input, marginTop: 4 }}
                    />
                  </div>
                )}

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

              {/* Canvas de assinatura */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ ...S.label, display: "flex", alignItems: "center", gap: 6 }}>
                    <PenLine style={{ width: 13, height: 13 }} /> Assinatura Manuscrita *
                  </p>
                  <button
                    onClick={clearCanvas}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: T.textMuted, fontSize: 12, fontFamily: T.font }}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} /> Limpar
                  </button>
                </div>
                <div style={{
                  border: `1px dashed ${hasSignature ? T.gold : T.border}`,
                  borderRadius: 8, overflow: "hidden",
                  touchAction: "none",
                }}>
                  <canvas
                    ref={canvasRef}
                    width={580} height={160}
                    style={{ width: "100%", height: 140, cursor: "crosshair", display: "block" }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                {!hasSignature && (
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    Desenhe sua assinatura acima com o dedo, mouse ou caneta digital
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setStep("leitura")}
                  style={{ ...S.btnGhost, flex: 1 }}
                >
                  Voltar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={!canSign || saving}
                  style={{
                    ...S.btnPrimary, flex: 2,
                    opacity: canSign && !saving ? 1 : 0.4,
                    cursor: canSign && !saving ? "pointer" : "not-allowed",
                  }}
                >
                  {saving ? "Salvando..." : "Confirmar Assinatura"}
                </button>
              </div>
            </div>
          )}

          {/* STEP: CONFIRMAÇÃO */}
          {step === "confirmacao" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: "#22c55e", marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
                Assinatura Registrada com Sucesso
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 4 }}>
                Documento: <strong style={{ color: T.textSecondary }}>{documento.nome}</strong>
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 4 }}>
                Assinante: <strong style={{ color: T.textSecondary }}>{assinanteNome}</strong>
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
                {dataFormatada} às {horaFormatada}
              </p>
              <button onClick={onClose} style={{ ...S.btnPrimary, minWidth: 160 }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}