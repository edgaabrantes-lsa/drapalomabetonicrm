/**
 * AIRecordInput — Painel de preenchimento por audio ou foto para prontuario.
 * IMPORTANTE: usa display:none para nao desmontar o AudioRecorder ao trocar aba.
 *
 * Contrato de saida (onResult):
 *   Para section="prontuario", chama onResult com objeto contendo:
 *     chief_complaint, medical_history, allergies_str, medications_str,
 *     evolution, recommendations, audio_transcription
 *   (allergies_str e medications_str sao strings separadas por virgula)
 *
 *   Para section="evolucao", chama onResult com objeto contendo:
 *     evolucao_tratamento, resultado_observado, feedback_paciente,
 *     intercorrencias, recomendacoes_pos_procedimento, proximo_retorno,
 *     observacoes_finais, audio_transcription
 */
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Camera, Upload, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioRecorder from "@/components/medical/AudioRecorder";

export default function AIRecordInput({ onResult, section = "prontuario", existingFields = {} }) {
  const [activeTab, setActiveTab]     = useState("audio");
  const [photoStatus, setPhotoStatus] = useState("idle");
  const [photoMsg, setPhotoMsg]       = useState("");
  const fileInputRef = useRef(null);

  // ── FOTO ────────────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoStatus("processing");
    setPhotoMsg("Enviando imagem para analise...");

    let file_url;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
    } catch (err) {
      setPhotoStatus("error");
      setPhotoMsg("Falha ao enviar a imagem: " + (err?.message || "erro de conexão"));
      return;
    }

    setPhotoMsg("IA lendo o prontuário na imagem...");
    let result;
    try {
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `Voce e uma assistente medica. Analise a imagem de um prontuario e extraia as informacoes clinicas visiveis.
Retorne SOMENTE JSON valido, sem explicacoes, sem Markdown.
Campos:
- chief_complaint (queixa principal)
- medical_history (historico medico)
- allergies_str (alergias, string separada por virgula)
- medications_str (medicacoes, string separada por virgula)
- evolution (evolucao clinica)
- recommendations (recomendacoes)
Se o campo nao estiver visivel, retorne string vazia.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint:  { type: "string" },
            medical_history:  { type: "string" },
            allergies_str:    { type: "string" },
            medications_str:  { type: "string" },
            evolution:        { type: "string" },
            recommendations:  { type: "string" },
          },
        },
      });
    } catch (err) {
      setPhotoStatus("error");
      setPhotoMsg("Falha ao analisar a imagem: " + (err?.message || "tente novamente"));
      return;
    }

    setPhotoStatus("done");
    setPhotoMsg("Informacoes extraidas da imagem com sucesso.");
    onResult?.({
      chief_complaint:     result.chief_complaint  || "",
      medical_history:     result.medical_history  || "",
      allergies_str:       result.allergies_str    || "",
      medications_str:     result.medications_str  || "",
      evolution:           result.evolution        || "",
      recommendations:     result.recommendations  || "",
      audio_transcription: "",
    });
  };

  const resetPhoto = () => {
    setPhotoStatus("idle");
    setPhotoMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── AUDIO: converte saída do AudioRecorder para contrato de onResult ────────
  // AudioRecorder retorna campos em portugues (queixa_principal, historico_medico, etc.)
  // Aqui fazemos o mapeamento definitivo para os nomes do formulario.
  const handleAudioStructured = (data) => {
    const s = (v) => (v && typeof v === "string" && v.trim()) ? v.trim() : "";
    console.log("[AIRecordInput] AudioRecorder entregou (PT):", data);

    if (section === "prontuario") {
      const mapped = {
        chief_complaint:          s(data.queixa_principal),
        medical_history:          s(data.historico_medico),
        evolution:                s(data.conduta_planejada),
        recommendations:          s(data.recomendacoes),
        allergies_str:            s(data.alergias),
        medications_str:          s(data.medicacoes_em_uso),
        observacoes_clinicas:     s(data.observacoes_clinicas),
        retorno_observacoes:      s(data.retorno_observacoes),
        procedimentos_anteriores: s(data.procedimentos_anteriores),
        audio_transcription:      s(data.transcricao_original),
      };
      console.log("[AIRecordInput] Mapeado (PT→EN) para formulario:", mapped);
      onResult?.(mapped);
    } else {
      const mapped = {
        evolucao_tratamento:            s(data.evolucao_tratamento),
        resultado_observado:            s(data.resultado_observado),
        feedback_paciente:              s(data.feedback_paciente),
        intercorrencias:                s(data.intercorrencias),
        recomendacoes_pos_procedimento: s(data.recomendacoes_pos_procedimento),
        proximo_retorno:                s(data.proximo_retorno),
        observacoes_finais:             s(data.observacoes_finais),
        audio_transcription:            s(data.transcricao_original),
      };
      console.log("[AIRecordInput] Mapeado evolucao para formulario:", mapped);
      onResult?.(mapped);
    }
  };

  return (
    <div className="rounded-xl border border-[#c9a55c]/30 bg-[#c9a55c]/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-[#c9a55c]" />
        <span className="text-sm font-medium text-[#c9a55c]">Preencher com Audio ou Foto</span>
        <span className="text-xs text-gray-500 hidden sm:inline">
          — grave um audio ou envie uma foto do prontuario
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "audio", icon: <Mic className="h-3.5 w-3.5" />, label: "Audio" },
          { id: "photo", icon: <Camera className="h-3.5 w-3.5" />, label: "Foto" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#c9a55c]/20 text-[#c9a55c] border border-[#c9a55c]/40"
                : "bg-[#1a1a25] text-gray-400 border border-[#1e1e2a] hover:text-white"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/*
        CRITICO: display:none preserva o estado do AudioRecorder ao trocar abas.
        Nao usar condicional (unmount/remount perderia o audioBlob).
      */}
      <div style={{ display: activeTab === "audio" ? "block" : "none" }}>
        <AudioRecorder
          section={section}
          existingFields={existingFields}
          onStructured={handleAudioStructured}
        />
      </div>

      {/* Aba Foto */}
      {activeTab === "photo" && (
        <div className="space-y-3">
          {photoStatus === "idle" && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#1a1a25] hover:bg-[#c9a55c]/10 text-white border border-[#1e1e2a]"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5 text-[#c9a55c]" />
                Selecionar Imagem
              </Button>
              <p className="text-xs text-gray-500">Foto de prontuario manuscrito ou impresso.</p>
            </div>
          )}

          {photoStatus === "processing" && (
            <div className="flex items-center gap-3 bg-[#1a1a25] rounded-lg p-3">
              <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
              <p className="text-sm text-gray-300">{photoMsg}</p>
            </div>
          )}

          {photoStatus === "done" && (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                {photoMsg}
              </div>
              <Button size="sm" variant="ghost" onClick={resetPhoto} className="text-gray-500 hover:text-white h-7 px-2">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {photoStatus === "error" && (
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{photoMsg}</p>
              <Button size="sm" variant="ghost" onClick={resetPhoto} className="text-gray-500 hover:text-white text-xs">
                Tentar novamente
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}