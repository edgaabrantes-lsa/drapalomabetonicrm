/**
 * AudioRecorder — Gravacao de audio com transcricao e preenchimento automatico por IA.
 * Compativel com Chrome, Firefox, Safari (iOS/macOS), Edge, Android.
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

// ── ESTADOS ──────────────────────────────────────────────────────────────────
const ST_IDLE         = "IDLE";
const ST_REQUESTING   = "REQUESTING_PERMISSION";
const ST_RECORDING    = "RECORDING";
const ST_PAUSED       = "PAUSED";
const ST_RECORDED     = "RECORDED";
const ST_UPLOADING    = "UPLOADING";
const ST_TRANSCRIBING = "TRANSCRIBING";
const ST_STRUCTURING  = "STRUCTURING";
const ST_REVIEW       = "REVIEW";
const ST_DONE         = "DONE";
const ST_ERROR        = "ERROR";

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getBestMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function isMediaRecorderSupported() {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Props:
 *   section: "prontuario" | "evolucao"
 *   onStructured(data): chamado quando IA retorna JSON estruturado e usuario confirma
 *   existingFields: campos ja preenchidos no formulario
 */
export default function AudioRecorder({ section = "prontuario", onStructured, existingFields = {} }) {
  const [status, setStatus]             = useState(ST_IDLE);
  const [elapsed, setElapsed]           = useState(0);
  const [audioUrl, setAudioUrl]         = useState(null);
  const [audioBlob, setAudioBlob]       = useState(null);
  const [transcription, setTranscription] = useState("");
  const [structured, setStructured]     = useState(null);
  const [errorMsg, setErrorMsg]         = useState("");
  const [isPlaying, setIsPlaying]       = useState(false);
  const [conflicts, setConflicts]       = useState({});

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const streamRef        = useRef(null);
  const audioRef         = useRef(null);
  const fileInputRef     = useRef(null);
  // Guarda o status em ref para acesso dentro de callbacks assincronos
  const statusRef        = useRef(ST_IDLE);

  const setStatusAndRef = useCallback((s) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // Cleanup ao desmontar
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

  // ── GRAVAR ───────────────────────────────────────────────────────────────
  const requestAndStart = async () => {
    if (!isMediaRecorderSupported()) {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Este navegador nao suporta gravacao de audio. Use Chrome, Firefox ou Edge, ou envie um arquivo de audio.");
      return;
    }

    setStatusAndRef(ST_REQUESTING);
    setErrorMsg("");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      setStatusAndRef(ST_ERROR);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Permissao de microfone negada. Autorize o uso do microfone no navegador e tente novamente.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("Nenhum microfone encontrado. Verifique se o dispositivo esta conectado.");
      } else {
        setErrorMsg("Nao foi possivel acessar o microfone: " + err.message);
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
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mr.onstop = () => {
      // Parar todas as tracks do microfone
      streamRef.current?.getTracks().forEach(t => t.stop());

      if (chunksRef.current.length === 0) {
        setStatusAndRef(ST_ERROR);
        setErrorMsg("Nenhum audio foi gravado. Tente novamente.");
        return;
      }

      const resolvedMime = mr.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: resolvedMime });
      const url  = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);
      setStatusAndRef(ST_RECORDED);
    };

    mr.onerror = (e) => {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Erro durante a gravacao: " + (e.error?.message || "erro desconhecido"));
    };

    mediaRecorderRef.current = mr;

    // Coleta dados a cada 200ms para garantir que onstop receba todos os chunks
    mr.start(200);
    setElapsed(0);
    startTimer();
    setStatusAndRef(ST_RECORDING);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    stopTimer();
    setStatusAndRef(ST_PAUSED);
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
    }
    startTimer();
    setStatusAndRef(ST_RECORDING);
  };

  const stopRecording = () => {
    stopTimer();
    // onstop cuida do blob e muda o status para ST_RECORDED
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback: se ja estiver inativo, tentar gerar blob manualmente
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (chunksRef.current.length > 0) {
        const mimeType = getBestMimeType() || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatusAndRef(ST_RECORDED);
      } else {
        setStatusAndRef(ST_ERROR);
        setErrorMsg("Nenhum audio foi gravado. Tente novamente.");
      }
    }
  };

  const resetAll = () => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    chunksRef.current = [];
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setElapsed(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscription("");
    setStructured(null);
    setConflicts({});
    setErrorMsg("");
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatusAndRef(ST_IDLE);
  };

  // ── UPLOAD DE ARQUIVO ────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    const allowedTypes = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg",
      "audio/mp3", "audio/wav", "audio/x-wav", "audio/m4a", "audio/x-m4a", "audio/flac"];
    const allowedExts = ["webm", "ogg", "mp4", "mp3", "wav", "m4a", "flac"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Formato nao suportado. Envie um arquivo MP3, M4A, WAV, WEBM, OGG ou FLAC.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Arquivo muito grande. O limite e de 25MB.");
      return;
    }
    const blob = new Blob([file], { type: file.type || "audio/webm" });
    const url  = URL.createObjectURL(blob);
    setAudioBlob(blob);
    setAudioUrl(url);
    setElapsed(0);
    setStatusAndRef(ST_RECORDED);
  };

  // ── TRANSCREVER + ESTRUTURAR ─────────────────────────────────────────────
  const handleProcess = async () => {
    if (!audioBlob) {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Nenhum audio disponivel. Grave ou envie um arquivo de audio.");
      return;
    }
    if (audioBlob.size < 1000) {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Audio muito curto ou vazio. Grave um audio mais longo e tente novamente.");
      return;
    }

    setStatusAndRef(ST_UPLOADING);
    setErrorMsg("");

    // Upload
    let fileUrl;
    try {
      const ext = audioBlob.type.includes("mp4") ? "m4a"
        : audioBlob.type.includes("ogg") ? "ogg"
        : audioBlob.type.includes("wav") ? "wav"
        : "webm";
      const fileToUpload = new File([audioBlob], `audio-${section}.${ext}`, { type: audioBlob.type || "audio/webm" });
      const res = await base44.integrations.Core.UploadFile({ file: fileToUpload });
      fileUrl = res.file_url;
    } catch {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Falha ao enviar o audio. Verifique sua conexao e tente novamente.");
      return;
    }

    // Transcricao
    setStatusAndRef(ST_TRANSCRIBING);
    let transcricao = "";
    try {
      transcricao = await base44.integrations.Core.TranscribeAudio({ audio_url: fileUrl });
    } catch {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Nao foi possivel transcrever o audio. Tente gravar com melhor qualidade de microfone.");
      return;
    }

    if (!transcricao || transcricao.trim().length < 5) {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Audio sem conteudo identificavel. Fale mais proximo ao microfone e tente novamente.");
      return;
    }

    setTranscription(transcricao);
    setStatusAndRef(ST_STRUCTURING);

    // Estruturacao por IA
    let prompt, schema;

    if (section === "prontuario") {
      prompt = `Voce e uma IA clinica especializada em medicina estetica. Analise a transcricao abaixo e extraia APENAS as informacoes explicitamente mencionadas, distribuindo-as nos campos corretos do prontuario.

REGRAS:
- Preencha SOMENTE o que foi dito claramente. Nao invente, nao presuma.
- Se uma informacao nao foi mencionada, retorne string vazia "".
- Preserve os termos clinicos exatos.
- Escreva em portugues do Brasil com boa pontuacao.

TRANSCRICAO:
${transcricao}`;

      schema = {
        type: "object",
        properties: {
          queixa_principal:         { type: "string" },
          historico_medico:         { type: "string" },
          alergias:                 { type: "string" },
          medicacoes_em_uso:        { type: "string" },
          procedimentos_anteriores: { type: "string" },
          observacoes_clinicas:     { type: "string" },
          conduta_planejada:        { type: "string" },
          recomendacoes:            { type: "string" },
          retorno_observacoes:      { type: "string" },
          transcricao_original:     { type: "string" },
        },
      };
    } else {
      prompt = `Voce e uma IA clinica especializada em medicina estetica. Analise a transcricao de evolucao do tratamento abaixo e extraia APENAS as informacoes explicitamente mencionadas.

REGRAS:
- Preencha SOMENTE o que foi dito claramente. Nao invente.
- Se nao mencionado, retorne string vazia "".
- Preserve os termos clinicos exatos.
- Escreva em portugues do Brasil.

TRANSCRICAO:
${transcricao}`;

      schema = {
        type: "object",
        properties: {
          evolucao_tratamento:              { type: "string" },
          resultado_observado:              { type: "string" },
          feedback_paciente:                { type: "string" },
          procedimentos_realizados_retorno: { type: "string" },
          intercorrencias:                  { type: "string" },
          recomendacoes_pos_procedimento:   { type: "string" },
          proximo_retorno:                  { type: "string" },
          observacoes_finais:               { type: "string" },
          transcricao_original:             { type: "string" },
        },
      };
    }

    let result;
    try {
      result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
      });
    } catch {
      setStatusAndRef(ST_ERROR);
      setErrorMsg("Falha ao processar com a IA. Verifique sua conexao e tente novamente.");
      return;
    }

    // Sempre incluir a transcricao original do Whisper (mais fiel)
    result.transcricao_original = transcricao;

    // Detectar conflitos com campos ja preenchidos
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
    setStatusAndRef(ST_REVIEW);
  };

  // ── CONFIRMAR PREENCHIMENTO ───────────────────────────────────────────────
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
    setStatusAndRef(ST_DONE);
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

  // ── LABELS DOS CAMPOS ─────────────────────────────────────────────────────
  const fieldLabels = section === "prontuario"
    ? {
        queixa_principal:         "Queixa Principal",
        historico_medico:         "Historico Medico",
        alergias:                 "Alergias",
        medicacoes_em_uso:        "Medicacoes em Uso",
        procedimentos_anteriores: "Procedimentos Anteriores",
        observacoes_clinicas:     "Observacoes Clinicas",
        conduta_planejada:        "Conduta Planejada",
        recomendacoes:            "Recomendacoes",
        retorno_observacoes:      "Retorno / Observacoes",
      }
    : {
        evolucao_tratamento:              "Evolucao do Tratamento",
        resultado_observado:              "Resultado Observado",
        feedback_paciente:                "Feedback da Paciente",
        procedimentos_realizados_retorno: "Procedimentos no Retorno",
        intercorrencias:                  "Intercorrencias",
        recomendacoes_pos_procedimento:   "Recomendacoes",
        proximo_retorno:                  "Proximo Retorno",
        observacoes_finais:               "Observacoes Finais",
      };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  // DONE
  if (status === ST_DONE) return (
    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>Formulario preenchido. Revise os campos e salve o prontuario.</span>
      </div>
      <Button size="sm" variant="ghost" onClick={resetAll} className="text-gray-400 h-7 px-2 text-xs">
        Gravar novamente
      </Button>
    </div>
  );

  // ERROR
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

  // PROCESSANDO (UPLOADING / TRANSCRIBING / STRUCTURING)
  if (status === ST_UPLOADING || status === ST_TRANSCRIBING || status === ST_STRUCTURING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-200">
          {status === ST_UPLOADING
            ? "Enviando audio..."
            : status === ST_TRANSCRIBING
            ? "Transcrevendo audio com IA..."
            : "Organizando informacoes no formulario..."}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Aguarde, isso pode levar alguns segundos.</p>
      </div>
    </div>
  );

  // REVISAO
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

  // GRAVADO — mostrar player + botoes
  if (status === ST_RECORDED) return (
    <div className="space-y-3 bg-[#1a1a25] border border-[#c9a55c]/20 rounded-lg p-4">
      {/* Cabecalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-[#c9a55c]" />
          <span className="text-sm text-gray-200 font-medium">Audio pronto</span>
          {elapsed > 0 && (
            <span className="text-xs text-gray-500">{formatTime(elapsed)}</span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={resetAll} className="text-gray-500 h-7 px-2">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Player */}
      {audioUrl && (
        <div className="flex items-center gap-3 bg-[#12121a] rounded-lg px-3 py-2">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 w-8 p-0 text-[#c9a55c] hover:text-white hover:bg-[#c9a55c]/10 rounded-full"
          >
            {isPlaying
              ? <Pause className="h-4 w-4" />
              : <Play  className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <div className="text-xs text-gray-400">
              {isPlaying ? "Reproduzindo..." : "Clique para ouvir o audio antes de enviar"}
            </div>
          </div>
        </div>
      )}

      {/* Botoes de acao */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={handleProcess}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black font-medium"
        >
          <Mic className="h-3.5 w-3.5 mr-1.5" />
          Enviar Audio e Preencher Formulario
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetAll}
          className="border-[#1e1e2a] text-gray-400 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Regravar
        </Button>
      </div>

      <p className="text-xs text-gray-600">
        Ouça o audio acima antes de enviar para garantir a qualidade da gravacao.
      </p>
    </div>
  );

  // SOLICITANDO PERMISSAO
  if (status === ST_REQUESTING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <Loader2 className="h-4 w-4 text-[#c9a55c] animate-spin flex-shrink-0" />
      <p className="text-sm text-gray-400">Solicitando acesso ao microfone...</p>
    </div>
  );

  // GRAVANDO / PAUSADO
  if (status === ST_RECORDING || status === ST_PAUSED) return (
    <div className="bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4 space-y-3">
      {/* Status + Timer */}
      <div className="flex items-center gap-3">
        {status === ST_RECORDING
          ? <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
          : <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full flex-shrink-0" />}
        <Clock className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-white font-mono text-base font-medium">{formatTime(elapsed)}</span>
        <span className="text-gray-500 text-sm">
          {status === ST_PAUSED ? "Gravacao pausada" : "Gravando..."}
        </span>
      </div>

      {/* Botoes */}
      <div className="flex gap-2 flex-wrap">
        {status === ST_RECORDING ? (
          <Button size="sm" variant="outline" onClick={pauseRecording}
            className="border-[#1e1e2a] text-gray-300 hover:text-white h-9">
            <Pause className="h-3.5 w-3.5 mr-1.5" />
            Pausar
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={resumeRecording}
            className="border-[#1e1e2a] text-gray-300 hover:text-white h-9">
            <Mic className="h-3.5 w-3.5 mr-1.5" />
            Continuar
          </Button>
        )}

        <Button
          size="sm"
          onClick={stopRecording}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-9"
        >
          <Square className="h-3.5 w-3.5 mr-1.5" />
          Finalizar Gravacao
        </Button>

        <Button size="sm" variant="ghost" onClick={resetAll}
          className="text-gray-600 hover:text-gray-400 h-9">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Cancelar
        </Button>
      </div>

      <p className="text-xs text-gray-600">
        {section === "prontuario"
          ? "Descreva: queixa, historico, alergias, medicacoes e conduta planejada."
          : "Descreva: evolucao, resultados, intercorrencias e proximos passos."}
      </p>
    </div>
  );

  // ── IDLE — botoes iniciais ─────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          size="sm"
          onClick={requestAndStart}
          className="bg-[#1a1a25] hover:bg-[#c9a55c]/10 text-white border border-[#1e1e2a] h-9"
        >
          <Mic className="h-3.5 w-3.5 mr-1.5 text-[#c9a55c]" />
          Gravar Audio
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="border-[#1e1e2a] text-gray-400 hover:text-white h-9"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Enviar Arquivo de Audio
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac"
          className="hidden"
          onChange={e => {
            handleFileSelect(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-gray-600">
        Grave ou envie um arquivo — a IA transcreve e preenche os campos automaticamente.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PAINEL DE REVISAO
// ════════════════════════════════════════════════════════════════════════
function ReviewPanel({ structured, conflicts, fieldLabels, transcription, onConfirm, onCancel }) {
  const [resolutions, setResolutions] = useState({});
  const [edited, setEdited]           = useState(() => ({ ...structured }));

  const filledEntries = Object.entries(fieldLabels).filter(([key]) => {
    const v = edited[key];
    return v && v.trim() && v !== "Nao informado no audio." && v !== "Não informado no áudio.";
  });

  return (
    <div className="space-y-4 bg-[#1a1a25] rounded-xl border border-[#c9a55c]/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-[#c9a55c]" />
          <span className="text-sm font-medium text-[#c9a55c]">Revisao — verifique antes de confirmar</span>
        </div>
        <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] border-[#c9a55c]/30 text-xs">
          {filledEntries.length} campo{filledEntries.length !== 1 ? "s" : ""} preenchido{filledEntries.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Transcricao original — colapsavel */}
      <details className="text-xs group">
        <summary className="text-gray-500 cursor-pointer hover:text-gray-300 select-none list-none flex items-center gap-1">
          <span className="text-[#c9a55c]">▸</span> Ver transcricao literal do audio
        </summary>
        <div className="mt-2 p-3 bg-[#12121a] rounded-lg border border-[#1e1e2a] text-gray-400 leading-relaxed whitespace-pre-wrap">
          {transcription}
        </div>
      </details>

      {/* Campos */}
      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
        {filledEntries.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            Nenhuma informacao clinica identificada. Tente gravar com mais clareza.
          </div>
        )}
        {filledEntries.map(([key, label]) => {
          const hasConflict = !!conflicts[key];
          const resolution  = resolutions[key] || "substituir";
          return (
            <div
              key={key}
              className={`rounded-lg border p-3 space-y-2 ${
                hasConflict ? "border-yellow-500/30 bg-yellow-500/5" : "border-[#1e1e2a]"
              }`}
            >
              {/* Label + opcoes de conflito */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {label}
                </span>
                {hasConflict && (
                  <div className="flex gap-1">
                    {[
                      { val: "substituir", text: "Substituir" },
                      { val: "adicionar",  text: "Adicionar" },
                      { val: "manter",     text: "Manter atual" },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setResolutions(r => ({ ...r, [key]: opt.val }))}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          resolution === opt.val
                            ? "bg-[#c9a55c]/20 border-[#c9a55c]/50 text-[#c9a55c]"
                            : "border-[#1e1e2a] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Campo com valor */}
              {hasConflict && resolution === "manter" ? (
                <div className="text-xs text-gray-400 bg-[#12121a] rounded p-2">
                  {conflicts[key].atual}
                </div>
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
                  Este campo ja possuia conteudo. Escolha acima como deseja proceder.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodape */}
      <div className="flex justify-between items-center pt-2 border-t border-[#1e1e2a]">
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-gray-500 hover:text-white">
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() => onConfirm(resolutions, edited)}
          disabled={filledEntries.length === 0}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Confirmar e Preencher
        </Button>
      </div>
    </div>
  );
}