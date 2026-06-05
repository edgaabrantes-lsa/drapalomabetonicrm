/**
 * AudioRecorder — Gravação de áudio com transcrição e preenchimento automático por IA.
 * Fluxo: Gravar/Enviar arquivo → Upload → Whisper transcreve → LLM estrutura em JSON → onStructured(data)
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Mic, Square, Play, Pause, Upload,
  Loader2, CheckCircle, Trash2,
  RotateCcw, FileAudio, Clock, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const ST_IDLE         = "IDLE";
const ST_REQUESTING   = "REQUESTING";
const ST_RECORDING    = "RECORDING";
const ST_PAUSED       = "PAUSED";
const ST_RECORDED     = "RECORDED";
const ST_PROCESSING   = "PROCESSING";
const ST_REVIEW       = "REVIEW";
const ST_DONE         = "DONE";
const ST_ERROR        = "ERROR";

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getBestMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"];
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

/**
 * Props:
 *   section: "prontuario" | "evolucao"
 *   onStructured(data): chamado com o JSON estruturado pela IA
 *   existingFields: campos já preenchidos (para detecção de conflitos)
 */
export default function AudioRecorder({ section = "prontuario", onStructured, existingFields = {} }) {
  const [status, setStatus]         = useState(ST_IDLE);
  const [elapsed, setElapsed]       = useState(0);
  const [audioUrl, setAudioUrl]     = useState(null);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [transcription, setTranscription] = useState("");
  const [structured, setStructured] = useState(null);
  const [errorMsg, setErrorMsg]     = useState("");
  const [isPlaying, setIsPlaying]   = useState(false);
  const [conflicts, setConflicts]   = useState({});
  const [processStep, setProcessStep] = useState(""); // mensagem de progresso

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const streamRef        = useRef(null);
  const audioRef         = useRef(null);
  const fileInputRef     = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []); // eslint-disable-line

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => clearInterval(timerRef.current);

  // ── GRAVAÇÃO ──────────────────────────────────────────────────────────────
  const requestAndStart = async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus(ST_ERROR);
      setErrorMsg("Este navegador não suporta gravação de áudio. Use Chrome, Firefox ou Edge.");
      return;
    }

    setStatus(ST_REQUESTING);
    setErrorMsg("");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      setStatus(ST_ERROR);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Permissão de microfone negada. Autorize o microfone nas configurações do navegador.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("Nenhum microfone encontrado. Verifique se o dispositivo está conectado.");
      } else {
        setErrorMsg("Não foi possível acessar o microfone: " + err.message);
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = getBestMimeType();
    let mr;
    try {
      mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      mr = new MediaRecorder(stream);
    }

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (chunksRef.current.length === 0) {
        setStatus(ST_ERROR);
        setErrorMsg("Nenhum áudio foi gravado. Tente novamente.");
        return;
      }
      const resolvedMime = mr.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: resolvedMime });
      const url  = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      setStatus(ST_RECORDED);
    };

    mr.onerror = () => {
      setStatus(ST_ERROR);
      setErrorMsg("Erro durante a gravação. Tente novamente.");
    };

    mediaRecorderRef.current = mr;
    mr.start(200);
    setElapsed(0);
    startTimer();
    setStatus(ST_RECORDING);
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    stopTimer();
    setStatus(ST_PAUSED);
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    startTimer();
    setStatus(ST_RECORDING);
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (chunksRef.current.length > 0) {
        const mimeType = getBestMimeType() || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus(ST_RECORDED);
      } else {
        setStatus(ST_ERROR);
        setErrorMsg("Nenhum áudio foi gravado. Tente novamente.");
      }
    }
  };

  const resetAll = useCallback(() => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    chunksRef.current = [];
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setElapsed(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscription("");
    setStructured(null);
    setConflicts({});
    setErrorMsg("");
    setProcessStep("");
    setIsPlaying(false);
    setStatus(ST_IDLE);
  }, [audioUrl]);

  // ── UPLOAD DE ARQUIVO ─────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    const allowedExts = ["webm", "ogg", "mp4", "mp3", "wav", "m4a", "flac", "mpeg", "mpga"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExts.includes(ext) && !file.type.startsWith("audio/")) {
      setStatus(ST_ERROR);
      setErrorMsg("Formato não suportado. Envie MP3, M4A, WAV, WEBM, OGG ou FLAC.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatus(ST_ERROR);
      setErrorMsg("Arquivo muito grande. O limite é de 25MB.");
      return;
    }
    const blob = new Blob([file], { type: file.type || "audio/webm" });
    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    setElapsed(0);
    setStatus(ST_RECORDED);
  };

  // ── PROCESSAR: Upload → Transcrição → IA ──────────────────────────────────
  const handleProcess = async () => {
    if (!audioBlob || audioBlob.size < 500) {
      setStatus(ST_ERROR);
      setErrorMsg("Áudio muito curto ou inválido. Grave novamente.");
      return;
    }

    setStatus(ST_PROCESSING);
    setErrorMsg("");

    // 1. Upload
    setProcessStep("Enviando áudio...");
    let fileUrl;
    try {
      const ext = audioBlob.type.includes("mp4") ? "m4a"
        : audioBlob.type.includes("ogg") ? "ogg"
        : audioBlob.type.includes("wav") ? "wav"
        : "webm";
      const file = new File([audioBlob], `audio-prontuario.${ext}`, { type: audioBlob.type || "audio/webm" });
      const res = await base44.integrations.Core.UploadFile({ file });
      fileUrl = res.file_url;
    } catch (err) {
      setStatus(ST_ERROR);
      setErrorMsg("Falha ao enviar o áudio: " + (err?.message || "erro de conexão"));
      return;
    }

    // 2. Transcrição (Whisper)
    setProcessStep("Transcrevendo com IA (Whisper)...");
    let transcricao = "";
    try {
      transcricao = await base44.integrations.Core.TranscribeAudio({ audio_url: fileUrl });
    } catch (err) {
      setStatus(ST_ERROR);
      setErrorMsg("Falha na transcrição: " + (err?.message || "tente com melhor qualidade de microfone"));
      return;
    }

    if (!transcricao || transcricao.trim().length < 5) {
      setStatus(ST_ERROR);
      setErrorMsg("Áudio sem conteúdo identificável. Fale mais próximo ao microfone e tente novamente.");
      return;
    }

    setTranscription(transcricao);

    // 3. Estruturação por IA
    setProcessStep("Organizando informações nos campos...");

    const prontuarioSchema = {
      type: "object",
      properties: {
        queixa_principal:         { type: "string" },
        historico_medico:         { type: "string" },
        alergias:                 { type: "string" },
        medicacoes_em_uso:        { type: "string" },
        procedimentos_anteriores: { type: "string" },
        observacoes_clinicas:     { type: "string" },
        conduta_planejada:        { type: "string" },
        procedimentos_realizados: { type: "string" },
        recomendacoes:            { type: "string" },
        retorno_observacoes:      { type: "string" },
      },
    };

    const evolucaoSchema = {
      type: "object",
      properties: {
        evolucao_tratamento:            { type: "string" },
        resultado_observado:            { type: "string" },
        feedback_paciente:              { type: "string" },
        intercorrencias:                { type: "string" },
        recomendacoes_pos_procedimento: { type: "string" },
        proximo_retorno:                { type: "string" },
        observacoes_finais:             { type: "string" },
      },
    };

    const prontuarioPrompt = `Você é uma IA auxiliar de prontuário clínico-estético.
Leia a transcrição abaixo e extraia APENAS as informações EXPLICITAMENTE mencionadas.

REGRAS:
- Não invente dados. Não diagnostique. Não complete informações ausentes.
- Se uma informação não foi mencionada, retorne string vazia "" para aquele campo.
- Preserve os termos clínicos exatos usados.
- Escreva em português do Brasil.
- Para alergias e medicações: retorne como texto corrido (ex: "AAS, dipirona").

CAMPOS:
- queixa_principal: queixa, reclamação ou motivo da consulta
- historico_medico: histórico de saúde, antecedentes médicos
- alergias: alergias conhecidas (ou vazio se não mencionado)
- medicacoes_em_uso: medicamentos que usa regularmente
- procedimentos_anteriores: procedimentos estéticos ou médicos anteriores
- observacoes_clinicas: observações técnicas feitas pela profissional
- conduta_planejada: o que será feito, tratamento indicado
- procedimentos_realizados: procedimentos feitos nesta consulta
- recomendacoes: orientações dadas à paciente
- retorno_observacoes: prazo ou data de retorno

TRANSCRIÇÃO:
${transcricao}`;

    const evolucaoPrompt = `Você é uma IA auxiliar de prontuário clínico-estético.
Leia a transcrição de EVOLUÇÃO/RETORNO abaixo e extraia APENAS o que foi mencionado.

REGRAS:
- Não invente dados. Se não mencionado, retorne "".
- Escreva em português do Brasil.

CAMPOS:
- evolucao_tratamento: como o tratamento evoluiu
- resultado_observado: resultado estético ou clínico constatado
- feedback_paciente: o que a paciente relata
- intercorrencias: efeitos adversos ou complicações
- recomendacoes_pos_procedimento: cuidados pós-procedimento
- proximo_retorno: prazo ou data do próximo retorno
- observacoes_finais: observações gerais de encerramento

TRANSCRIÇÃO:
${transcricao}`;

    let result;
    try {
      result = await base44.integrations.Core.InvokeLLM({
        prompt: section === "prontuario" ? prontuarioPrompt : evolucaoPrompt,
        response_json_schema: section === "prontuario" ? prontuarioSchema : evolucaoSchema,
      });
    } catch (err) {
      setStatus(ST_ERROR);
      setErrorMsg("Falha ao processar com a IA: " + (err?.message || "erro desconhecido"));
      return;
    }

    result.transcricao_original = transcricao;

    // Detectar conflitos com campos já preenchidos
    const newConflicts = {};
    Object.keys(result).forEach(key => {
      if (key === "transcricao_original") return;
      const novo  = (result[key] || "").trim();
      const atual = (existingFields[key] || "").trim();
      if (novo && atual && novo !== atual) {
        newConflicts[key] = { novo, atual };
      }
    });

    setStructured(result);
    setConflicts(newConflicts);
    setProcessStep("");
    setStatus(ST_REVIEW);
  };

  // ── CONFIRMAR ─────────────────────────────────────────────────────────────
  const handleConfirm = (resolutions, editedFields) => {
    const final = { ...editedFields };
    Object.keys(conflicts).forEach(key => {
      const res = resolutions[key] || "substituir";
      if (res === "manter") {
        final[key] = existingFields[key];
      } else if (res === "adicionar") {
        final[key] = existingFields[key]
          ? existingFields[key] + "\n\n" + (editedFields[key] || "")
          : (editedFields[key] || "");
      }
    });
    onStructured?.(final);
    setStatus(ST_DONE);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const fieldLabels = section === "prontuario"
    ? {
        queixa_principal:         "Queixa Principal",
        historico_medico:         "Histórico Médico",
        alergias:                 "Alergias",
        medicacoes_em_uso:        "Medicações em Uso",
        procedimentos_anteriores: "Procedimentos Anteriores",
        observacoes_clinicas:     "Observações Clínicas",
        conduta_planejada:        "Conduta Planejada",
        procedimentos_realizados: "Procedimentos Realizados",
        recomendacoes:            "Recomendações",
        retorno_observacoes:      "Retorno / Observações",
      }
    : {
        evolucao_tratamento:            "Evolução do Tratamento",
        resultado_observado:            "Resultado Observado",
        feedback_paciente:              "Feedback da Paciente",
        intercorrencias:                "Intercorrências",
        recomendacoes_pos_procedimento: "Recomendações Pós",
        proximo_retorno:                "Próximo Retorno",
        observacoes_finais:             "Observações Finais",
      };

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (status === ST_DONE) return (
    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>Formulário preenchido. Revise os campos e salve o prontuário.</span>
      </div>
      <Button size="sm" variant="ghost" onClick={resetAll} className="text-gray-400 h-7 px-2 text-xs">
        Gravar novamente
      </Button>
    </div>
  );

  if (status === ST_ERROR) return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-400 flex-1">{errorMsg}</p>
      </div>
      <Button size="sm" variant="outline" onClick={resetAll}
        className="border-[#1e1e2a] text-gray-400 hover:text-white h-8">
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Tentar novamente
      </Button>
    </div>
  );

  if (status === ST_PROCESSING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-200">{processStep || "Processando..."}</p>
        <p className="text-xs text-gray-500 mt-0.5">Aguarde, isso pode levar alguns segundos.</p>
      </div>
    </div>
  );

  if (status === ST_REVIEW && structured) return (
    <ReviewPanel
      structured={structured}
      conflicts={conflicts}
      fieldLabels={fieldLabels}
      transcription={transcription}
      onConfirm={handleConfirm}
      onCancel={resetAll}
    />
  );

  if (status === ST_RECORDED) return (
    <div className="space-y-3 bg-[#1a1a25] border border-[#c9a55c]/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-[#c9a55c]" />
          <span className="text-sm text-gray-200 font-medium">Áudio pronto</span>
          {elapsed > 0 && <span className="text-xs text-gray-500">{formatTime(elapsed)}</span>}
        </div>
        <Button size="sm" variant="ghost" onClick={resetAll} className="text-gray-500 h-7 px-2">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {audioUrl && (
        <div className="flex items-center gap-3 bg-[#12121a] rounded-lg px-3 py-2">
          <audio ref={audioRef} src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)} />
          <Button size="sm" variant="ghost" onClick={togglePlay}
            className="h-8 w-8 p-0 text-[#c9a55c] hover:text-white hover:bg-[#c9a55c]/10 rounded-full">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <p className="text-xs text-gray-400 flex-1">
            {isPlaying ? "Reproduzindo..." : "Clique para ouvir antes de enviar"}
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={handleProcess}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black font-medium">
          <Mic className="h-3.5 w-3.5 mr-1.5" />
          Enviar e Preencher Formulário
        </Button>
        <Button size="sm" variant="outline" onClick={resetAll}
          className="border-[#1e1e2a] text-gray-400 hover:text-white">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Regravar
        </Button>
      </div>
    </div>
  );

  if (status === ST_REQUESTING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <Loader2 className="h-4 w-4 text-[#c9a55c] animate-spin flex-shrink-0" />
      <p className="text-sm text-gray-400">Solicitando acesso ao microfone...</p>
    </div>
  );

  if (status === ST_RECORDING || status === ST_PAUSED) return (
    <div className="bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        {status === ST_RECORDING
          ? <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
          : <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full flex-shrink-0" />}
        <Clock className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-white font-mono text-base font-medium">{formatTime(elapsed)}</span>
        <span className="text-gray-500 text-sm">
          {status === ST_PAUSED ? "Pausado" : "Gravando..."}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {status === ST_RECORDING ? (
          <Button size="sm" variant="outline" onClick={pauseRecording}
            className="border-[#1e1e2a] text-gray-300 hover:text-white h-9">
            <Pause className="h-3.5 w-3.5 mr-1.5" /> Pausar
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={resumeRecording}
            className="border-[#1e1e2a] text-gray-300 hover:text-white h-9">
            <Mic className="h-3.5 w-3.5 mr-1.5" /> Continuar
          </Button>
        )}
        <Button size="sm" onClick={stopRecording}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-9">
          <Square className="h-3.5 w-3.5 mr-1.5" /> Finalizar Gravação
        </Button>
        <Button size="sm" variant="ghost" onClick={resetAll}
          className="text-gray-600 hover:text-gray-400 h-9">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Cancelar
        </Button>
      </div>

      <p className="text-xs text-gray-600">
        {section === "prontuario"
          ? "Descreva: queixa, histórico, alergias, medicações e conduta planejada."
          : "Descreva: evolução, resultados, intercorrências e próximos passos."}
      </p>
    </div>
  );

  // IDLE
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" size="sm" onClick={requestAndStart}
          className="bg-[#1a1a25] hover:bg-[#c9a55c]/10 text-white border border-[#1e1e2a] h-9">
          <Mic className="h-3.5 w-3.5 mr-1.5 text-[#c9a55c]" />
          Gravar Áudio
        </Button>
        <Button type="button" size="sm" variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="border-[#1e1e2a] text-gray-400 hover:text-white h-9">
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Enviar Arquivo de Áudio
        </Button>
        <input ref={fileInputRef} type="file"
          accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac"
          className="hidden"
          onChange={e => { handleFileSelect(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>
      <p className="text-xs text-gray-600">
        Grave ou envie um arquivo — a IA transcreve e preenche os campos automaticamente.
      </p>
    </div>
  );
}

// ── PAINEL DE REVISÃO ─────────────────────────────────────────────────────────
function ReviewPanel({ structured, conflicts, fieldLabels, transcription, onConfirm, onCancel }) {
  const [resolutions, setResolutions] = useState({});
  const [edited, setEdited] = useState(() => ({ ...structured }));

  const filledEntries = Object.entries(fieldLabels).filter(([key]) => {
    const v = edited[key];
    return v && typeof v === "string" && v.trim().length > 0;
  });

  return (
    <div className="space-y-4 bg-[#1a1a25] rounded-xl border border-[#c9a55c]/30 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-[#c9a55c]" />
          <span className="text-sm font-medium text-[#c9a55c]">Revisão — verifique antes de confirmar</span>
        </div>
        <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] border-[#c9a55c]/30 text-xs">
          {filledEntries.length} campo{filledEntries.length !== 1 ? "s" : ""} preenchido{filledEntries.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <details className="text-xs">
        <summary className="text-gray-500 cursor-pointer hover:text-gray-300 select-none list-none flex items-center gap-1">
          <span className="text-[#c9a55c]">▸</span> Ver transcrição literal do áudio
        </summary>
        <div className="mt-2 p-3 bg-[#12121a] rounded-lg border border-[#1e1e2a] text-gray-400 leading-relaxed whitespace-pre-wrap">
          {transcription}
        </div>
      </details>

      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
        {filledEntries.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            Nenhuma informação clínica identificada. Tente gravar com mais clareza.
          </div>
        )}
        {filledEntries.map(([key, label]) => {
          const hasConflict = !!conflicts[key];
          const resolution  = resolutions[key] || "substituir";
          return (
            <div key={key}
              className={`rounded-lg border p-3 space-y-2 ${hasConflict ? "border-yellow-500/30 bg-yellow-500/5" : "border-[#1e1e2a]"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                {hasConflict && (
                  <div className="flex gap-1">
                    {[
                      { val: "substituir", text: "Substituir" },
                      { val: "adicionar",  text: "Adicionar" },
                      { val: "manter",     text: "Manter atual" },
                    ].map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => setResolutions(r => ({ ...r, [key]: opt.val }))}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          resolution === opt.val
                            ? "bg-[#c9a55c]/20 border-[#c9a55c]/50 text-[#c9a55c]"
                            : "border-[#1e1e2a] text-gray-500 hover:text-gray-300"
                        }`}>
                        {opt.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {hasConflict && resolution === "manter" ? (
                <div className="text-xs text-gray-400 bg-[#12121a] rounded p-2">{conflicts[key].atual}</div>
              ) : (
                <Textarea
                  value={edited[key] || ""}
                  onChange={e => setEdited(f => ({ ...f, [key]: e.target.value }))}
                  className="bg-[#12121a] border-[#1e1e2a] text-white text-xs resize-none"
                  rows={Math.min(5, Math.max(2, Math.ceil((edited[key] || "").length / 70) + 1))}
                />
              )}
              {hasConflict && resolution !== "manter" && (
                <p className="text-[10px] text-yellow-400/70">
                  Este campo já possuía conteúdo. Escolha acima como deseja proceder.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#1e1e2a]">
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-gray-500 hover:text-white">
          Cancelar
        </Button>
        <Button size="sm" onClick={() => onConfirm(resolutions, edited)}
          disabled={filledEntries.length === 0}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Confirmar e Preencher
        </Button>
      </div>
    </div>
  );
}