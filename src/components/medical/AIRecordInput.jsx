import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Camera, Upload, Loader2, Sparkles, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MODE_IDLE = "idle";
const MODE_RECORDING = "recording";
const MODE_PROCESSING = "processing";
const MODE_DONE = "done";

export default function AIRecordInput({ onResult }) {
  const [mode, setMode] = useState(MODE_IDLE);
  const [activeTab, setActiveTab] = useState("audio"); // "audio" | "photo"
  const [statusText, setStatusText] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // ── ÁUDIO ──────────────────────────────────────────────
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await processAudio(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setMode(MODE_RECORDING);
    setStatusText("Gravando... clique em parar quando terminar.");
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setMode(MODE_PROCESSING);
    setStatusText("Processando áudio com IA...");
  };

  const processAudio = async (blob) => {
    setMode(MODE_PROCESSING);
    setStatusText("Enviando áudio para análise...");

    const file = new File([blob], "audio.webm", { type: "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setStatusText("IA preenchendo o prontuário...");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é uma assistente médica da Clínica Dra. Paloma Betoni, especializada em medicina estética.
Analise a transcrição do áudio do médico e extraia as informações clínicas para preencher um prontuário.

Retorne um JSON com os campos:
- chief_complaint: queixa principal mencionada
- medical_history: histórico médico relevante
- allergies: array de strings com alergias mencionadas
- current_medications: array de strings com medicações
- procedures_performed: array de objetos {procedure_name, quantity_applied, unit, area_treated, batch_number}
- evolution: texto de evolução/observações clínicas
- recommendations: recomendações pós-procedimento

Se algum campo não for mencionado, retorne string vazia ou array vazio.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          chief_complaint: { type: "string" },
          medical_history: { type: "string" },
          allergies: { type: "array", items: { type: "string" } },
          current_medications: { type: "array", items: { type: "string" } },
          procedures_performed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                procedure_name: { type: "string" },
                quantity_applied: { type: "number" },
                unit: { type: "string" },
                area_treated: { type: "string" },
                batch_number: { type: "string" },
              },
            },
          },
          evolution: { type: "string" },
          recommendations: { type: "string" },
        },
      },
    });

    setMode(MODE_DONE);
    setStatusText("Prontuário preenchido com sucesso!");
    onResult(result);
  };

  // ── FOTO / IMAGEM ──────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setMode(MODE_PROCESSING);
    setStatusText("Enviando imagem para análise...");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setStatusText("IA lendo o prontuário na imagem...");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é uma assistente médica da Clínica Dra. Paloma Betoni.
Analise a imagem de um prontuário manuscrito ou impresso e extraia todas as informações clínicas.

Retorne um JSON com os campos:
- chief_complaint: queixa principal
- medical_history: histórico médico
- allergies: array de alergias
- current_medications: array de medicações
- procedures_performed: array de objetos {procedure_name, quantity_applied, unit, area_treated, batch_number}
- evolution: evolução clínica
- recommendations: recomendações

Se algum campo não estiver legível, retorne string vazia ou array vazio.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          chief_complaint: { type: "string" },
          medical_history: { type: "string" },
          allergies: { type: "array", items: { type: "string" } },
          current_medications: { type: "array", items: { type: "string" } },
          procedures_performed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                procedure_name: { type: "string" },
                quantity_applied: { type: "number" },
                unit: { type: "string" },
                area_treated: { type: "string" },
                batch_number: { type: "string" },
              },
            },
          },
          evolution: { type: "string" },
          recommendations: { type: "string" },
        },
      },
    });

    setMode(MODE_DONE);
    setStatusText("Prontuário extraído da imagem com sucesso!");
    onResult(result);
  };

  const reset = () => {
    setMode(MODE_IDLE);
    setStatusText("");
    setPreviewUrl(null);
  };

  return (
    <div className="rounded-xl border border-[#c9a55c]/30 bg-[#c9a55c]/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#c9a55c]" />
        <span className="text-sm font-medium text-[#c9a55c]">Preencher com IA</span>
        <span className="text-xs text-gray-500 ml-1">— grave um áudio ou envie uma foto do prontuário</span>
      </div>

      {mode === MODE_DONE ? (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            {statusText}
          </div>
          <Button size="sm" variant="ghost" onClick={reset} className="text-gray-500 hover:text-white h-7 px-2">
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : mode === MODE_PROCESSING ? (
        <div className="flex items-center gap-3 bg-[#1a1a25] rounded-lg p-3">
          <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-300">{statusText}</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
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
              <Mic className="h-3.5 w-3.5" /> Gravar Áudio
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
              <Camera className="h-3.5 w-3.5" /> Enviar Foto
            </button>
          </div>

          {/* Audio Panel */}
          {activeTab === "audio" && (
            <div className="flex items-center gap-3">
              {mode === MODE_RECORDING ? (
                <>
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    Gravando...
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={stopRecording}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                  >
                    <MicOff className="h-3.5 w-3.5 mr-1.5" /> Parar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={startRecording}
                  className="bg-[#1a1a25] hover:bg-[#c9a55c]/10 text-white border border-[#1e1e2a]"
                >
                  <Mic className="h-3.5 w-3.5 mr-1.5 text-[#c9a55c]" />
                  Iniciar Gravação
                </Button>
              )}
              <p className="text-xs text-gray-500">Descreva o atendimento em voz — a IA preencherá o prontuário.</p>
            </div>
          )}

          {/* Photo Panel */}
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
              <p className="text-xs text-gray-500">Foto de prontuário manuscrito ou impresso.</p>
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

      {previewUrl && mode === MODE_DONE && (
        <img src={previewUrl} alt="Preview" className="h-24 rounded-lg object-cover border border-[#1e1e2a]" />
      )}
    </div>
  );
}