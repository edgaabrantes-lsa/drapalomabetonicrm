/**
 * AIRecordInput — Painel de preenchimento por audio ou foto para prontuario.
 * Usa AudioRecorder para audio e InvokeLLM para foto/imagem.
 * Sem emojis. Sem icones proibidos.
 */
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Camera, Upload, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioRecorder from "@/components/medical/AudioRecorder";

const MODE_IDLE       = "idle";
const MODE_PROCESSING = "processing";
const MODE_DONE       = "done";
const MODE_ERROR      = "error";

/**
 * Props:
 *   onResult(data): chamado com os campos estruturados (prontuario ou evolucao)
 *   section: "prontuario" | "evolucao"
 *   existingFields: campos ja preenchidos no formulario (para conflito)
 */
export default function AIRecordInput({ onResult, section = "prontuario", existingFields = {} }) {
  const [activeTab, setActiveTab] = useState("audio");
  const [mode, setMode]           = useState(MODE_IDLE);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef(null);

  // ── FOTO ──────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMode(MODE_PROCESSING);
    setStatusText("Enviando imagem para analise...");

    let file_url;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
    } catch {
      setMode(MODE_ERROR);
      setStatusText("Falha ao enviar a imagem. Verifique sua conexao e tente novamente.");
      return;
    }

    setStatusText("IA lendo o prontuario na imagem...");
    let result;
    try {
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `Voce e uma assistente medica da Clinica Dra. Paloma Betoni.
Analise a imagem de um prontuario manuscrito ou impresso e extraia todas as informacoes clinicas visiveis.

Retorne um JSON com os campos:
- chief_complaint: queixa principal
- medical_history: historico medico
- allergies: lista de alergias (string separada por virgula)
- current_medications: lista de medicacoes (string separada por virgula)
- evolution: evolucao clinica
- recommendations: recomendacoes

Se algum campo nao estiver legivel, retorne string vazia.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint:     { type: "string" },
            medical_history:     { type: "string" },
            allergies:           { type: "string" },
            current_medications: { type: "string" },
            evolution:           { type: "string" },
            recommendations:     { type: "string" },
          },
        },
      });
    } catch {
      setMode(MODE_ERROR);
      setStatusText("Falha ao analisar a imagem. Tente novamente.");
      return;
    }

    setMode(MODE_DONE);
    setStatusText("Informacoes extraidas da imagem com sucesso.");
    onResult?.({
      chief_complaint:     result.chief_complaint  || "",
      medical_history:     result.medical_history  || "",
      alergias:            result.allergies         || "",
      medicacoes_em_uso:   result.current_medications || "",
      evolution:           result.evolution         || "",
      recommendations:     result.recommendations   || "",
      transcricao_original: "",
    });
  };

  const reset = () => {
    setMode(MODE_IDLE);
    setStatusText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rounded-xl border border-[#c9a55c]/30 bg-[#c9a55c]/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-[#c9a55c]" />
        <span className="text-sm font-medium text-[#c9a55c]">Preencher com Audio ou Foto</span>
        <span className="text-xs text-gray-500 ml-1">
          — grave um audio ou envie uma foto do prontuario
        </span>
      </div>

      {/* Estado: processando foto */}
      {mode === MODE_PROCESSING && (
        <div className="flex items-center gap-3 bg-[#1a1a25] rounded-lg p-3">
          <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-300">{statusText}</p>
        </div>
      )}

      {/* Estado: foto concluida */}
      {mode === MODE_DONE && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            {statusText}
          </div>
          <Button size="sm" variant="ghost" onClick={reset} className="text-gray-500 hover:text-white h-7 px-2">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Estado: erro foto */}
      {mode === MODE_ERROR && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-400">{statusText}</p>
          <Button size="sm" variant="ghost" onClick={reset} className="text-gray-500">Tentar novamente</Button>
        </div>
      )}

      {/* Tabs — sempre visiveis quando idle */}
      {mode === MODE_IDLE && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("audio")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "audio"
                  ? "bg-[#c9a55c]/20 text-[#c9a55c] border border-[#c9a55c]/40"
                  : "bg-[#1a1a25] text-gray-400 border border-[#1e1e2a] hover:text-white"
              }`}
            >
              <Mic className="h-3.5 w-3.5" /> Audio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photo")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "photo"
                  ? "bg-[#c9a55c]/20 text-[#c9a55c] border border-[#c9a55c]/40"
                  : "bg-[#1a1a25] text-gray-400 border border-[#1e1e2a] hover:text-white"
              }`}
            >
              <Camera className="h-3.5 w-3.5" /> Foto
            </button>
          </div>

          {activeTab === "audio" && (
            <AudioRecorder
              section={section}
              existingFields={existingFields}
              onStructured={(data) => {
                // Mapear campos de audio para campos do formulario (prontuario)
                if (section === "prontuario") {
                  onResult?.({
                    chief_complaint:  data.queixa_principal         || "",
                    medical_history:  data.historico_medico         || "",
                    alergias:         data.alergias                 || "",
                    medicacoes_em_uso: data.medicacoes_em_uso       || "",
                    evolution:        data.conduta_planejada        || "",
                    recommendations:  data.recomendacoes            || "",
                    observacoes_clinicas: data.observacoes_clinicas || "",
                    conduta_planejada: data.conduta_planejada       || "",
                    retorno_observacoes: data.retorno_observacoes   || "",
                    procedimentos_anteriores: data.procedimentos_anteriores || "",
                    audio_transcription: data.transcricao_original  || "",
                  });
                } else {
                  onResult?.({
                    evolution:         data.evolucao_tratamento             || "",
                    resultado_observado: data.resultado_observado           || "",
                    feedback_paciente: data.feedback_paciente               || "",
                    procedimentos_retorno: data.procedimentos_realizados_retorno || "",
                    intercorrencias:   data.intercorrencias                 || "",
                    recommendations:   data.recomendacoes_pos_procedimento  || "",
                    proximo_retorno:   data.proximo_retorno                 || "",
                    observacoes_finais: data.observacoes_finais             || "",
                    audio_transcription: data.transcricao_original         || "",
                  });
                }
              }}
            />
          )}

          {activeTab === "photo" && (
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
        </>
      )}
    </div>
  );
}