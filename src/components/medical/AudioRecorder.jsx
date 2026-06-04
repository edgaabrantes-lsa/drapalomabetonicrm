/**
 * AudioRecorder — Gravação, upload e transcrição inteligente de áudio para prontuário.
 * Compatível com desktop, mobile (iOS/Android), Chrome, Safari, Edge.
 * A IA distribui as informações nos campos corretos do formulário.
 */
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Mic, Square, Play, Pause, Upload,
  Loader2, CheckCircle, Trash2, AlertTriangle,
  RotateCcw, FileAudio, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const ST_IDLE       = "idle";
const ST_REQUESTING = "requesting";
const ST_RECORDING  = "recording";
const ST_PAUSED     = "paused";
const ST_RECORDED   = "recorded";
const ST_UPLOADING  = "uploading";
const ST_TRANSCRIBING = "transcribing";
const ST_STRUCTURING  = "structuring";
const ST_REVIEW     = "review";
const ST_DONE       = "done";
const ST_ERROR      = "error";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Detecta o melhor mimeType suportado para gravação
function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

// Verifica se MediaRecorder está disponível
function mediaRecorderAvailable() {
  return typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";
}

/**
 * Props:
 *  - section: "prontuario" | "evolucao"
 *  - onStructured(data): chamado quando a IA retorna JSON estruturado
 *  - existingFields: objeto com os campos atualmente preenchidos (para decisão de sobrescrita)
 */
export default function AudioRecorder({ section = "prontuario", onStructured, existingFields = {} }) {
  const [status, setStatus]           = useState(ST_IDLE);
  const [elapsed, setElapsed]         = useState(0);
  const [audioUrl, setAudioUrl]       = useState(null);
  const [audioBlob, setAudioBlob]     = useState(null);
  const [transcription, setTranscription] = useState("");
  const [structured, setStructured]   = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  // Campos com conflito: {fieldKey: {novo, atual}}
  const [conflicts, setConflicts]     = useState({});

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const streamRef        = useRef(null);
  const audioRef         = useRef(null);
  const fileInputRef     = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => clearInterval(timerRef.current);

  // ── GRAVAR ─────────────────────────────────────────────────────────────
  const requestAndStart = async () => {
    if (!mediaRecorderAvailable()) {
      setStatus(ST_ERROR);
      setErrorMsg("Este navegador nao permite gravacao de audio. Tente pelo Chrome ou envie um arquivo de audio.");
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
        setErrorMsg("Permissao de microfone negada. Verifique as configuracoes do navegador e tente novamente.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("Nenhum microfone encontrado. Verifique se o dispositivo esta conectado.");
      } else {
        setErrorMsg("Nao foi possivel acessar o microfone. Verifique a permissao do navegador e tente novamente.");
      }
      return;
    }

    streamRef.current = stream;
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};
    let mr;
    try {
      mr = new MediaRecorder(stream, options);
    } catch {
      mr = new MediaRecorder(stream);
    }

    chunksRef.current = [];
    mr.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const mType = mr.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mType });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setStatus(ST_RECORDED);
    };

    mediaRecorderRef.current = mr;
    mr.start(200);
    setElapsed(0);
    startTimer();
    setStatus(ST_RECORDING);
  };

  const pauseRecording = () => {
    try { mediaRecorderRef.current?.pause(); } catch {}
    stopTimer();
    setStatus(ST_PAUSED);
  };

  const resumeRecording = () => {
    try { mediaRecorderRef.current?.resume(); } catch {}
    startTimer();
    setStatus(ST_RECORDING);
  };

  const stopRecording = () => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { mediaRecorderRef.current?.stop(); } catch {}
  };

  const cancelAll = () => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { mediaRecorderRef.current?.stop(); } catch {}
    chunksRef.current = [];
    setElapsed(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setStatus(ST_IDLE);
    setErrorMsg("");
    setStructured(null);
    setTranscription("");
    setConflicts({});
  };

  // ── UPLOAD DE ARQUIVO ──────────────────────────────────────────────────
  const handleUploadFile = (file) => {
    if (!file) return;
    const allowed = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/mp3",
      "audio/wav", "audio/x-wav", "audio/m4a", "audio/x-m4a"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = ["webm", "ogg", "mp4", "mp3", "wav", "m4a", "flac"];
    if (!allowed.includes(file.type) && !allowedExt.includes(ext)) {
      setStatus(ST_ERROR);
      setErrorMsg("Formato nao suportado. Envie um arquivo MP3, M4A, WAV, WEBM ou OGG.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatus(ST_ERROR);
      setErrorMsg("Arquivo muito grande. O limite e de 25MB.");
      return;
    }
    const blob = new Blob([file], { type: file.type || "audio/webm" });
    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    setStatus(ST_RECORDED);
  };

  // ── TRANSCREVER + ESTRUTURAR ────────────────────────────────────────────
  const handleTranscribeAndFill = async () => {
    if (!audioBlob) return;

    if (elapsed < 2 && audioBlob.size < 2000) {
      setStatus(ST_ERROR);
      setErrorMsg("Audio muito curto. Grave um audio mais longo para melhor resultado.");
      return;
    }

    setStatus(ST_UPLOADING);
    setErrorMsg("");

    let file_url;
    try {
      const ext = audioBlob.type.includes("mp4") ? "m4a"
        : audioBlob.type.includes("ogg") ? "ogg"
        : audioBlob.type.includes("wav") ? "wav"
        : "webm";
      const file = new File([audioBlob], `audio.${ext}`, { type: audioBlob.type || "audio/webm" });
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
      setUploadedUrl(file_url);
    } catch {
      setStatus(ST_ERROR);
      setErrorMsg("Falha ao enviar o audio. Verifique sua conexao com a internet e tente novamente.");
      return;
    }

    setStatus(ST_TRANSCRIBING);
    let transcricao = "";
    try {
      transcricao = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    } catch {
      setStatus(ST_ERROR);
      setErrorMsg("Nao foi possivel transcrever o audio. Tente gravar novamente ou envie um audio com melhor qualidade.");
      return;
    }

    if (!transcricao || transcricao.trim().length < 5) {
      setStatus(ST_ERROR);
      setErrorMsg("Audio sem conteudo identificavel. Tente gravar novamente com mais clareza.");
      return;
    }

    setTranscription(transcricao);
    setStatus(ST_STRUCTURING);

    // Prompts e schemas diferentes por secao
    let prompt, schema;

    if (section === "prontuario") {
      prompt = `Voce e uma IA clinica especializada em medicina estetica. Analise a transcricao abaixo e extraia APENAS as informacoes explicitamente mencionadas, distribuindo-as nos campos corretos do prontuario.

REGRAS OBRIGATORIAS:
- Preencha SOMENTE o que foi dito claramente. Nao invente, nao presuma, nao complete.
- Se uma informacao nao foi mencionada, deixe o campo com string vazia "".
- Preserve termos clinicos originais.
- Nao faca diagnosticos nao mencionados.
- Nao preencha alergias ou medicacoes se nao forem ditas explicitamente.
- Escreva em portugues do Brasil com boa pontuacao.

TRANSCRICAO:
${transcricao}

Retorne JSON com os campos abaixo. Campos nao mencionados devem ser string vazia "".`;
      schema = {
        type: "object",
        properties: {
          queixa_principal:        { type: "string", description: "Queixa principal do paciente" },
          historico_medico:        { type: "string", description: "Historico medico relevante mencionado" },
          alergias:                { type: "string", description: "Alergias mencionadas. Vazio se nao mencionado." },
          medicacoes_em_uso:       { type: "string", description: "Medicacoes em uso mencionadas. Vazio se nao mencionado." },
          procedimentos_anteriores:{ type: "string", description: "Procedimentos anteriores mencionados" },
          observacoes_clinicas:    { type: "string", description: "Observacoes clinicas gerais" },
          conduta_planejada:       { type: "string", description: "Conduta ou plano de tratamento planejado" },
          recomendacoes:           { type: "string", description: "Recomendacoes ao paciente" },
          retorno_observacoes:     { type: "string", description: "Informacoes sobre retorno ou acompanhamento" },
          transcricao_original:    { type: "string", description: "Transcricao literal do audio" },
        }
      };
    } else {
      prompt = `Voce e uma IA clinica especializada em medicina estetica. Analise a transcricao de evolucao do tratamento abaixo e extraia APENAS as informacoes explicitamente mencionadas.

REGRAS OBRIGATORIAS:
- Preencha SOMENTE o que foi dito claramente. Nao invente, nao presuma.
- Se uma informacao nao foi mencionada, deixe o campo com string vazia "".
- Preserve termos clinicos originais.
- Escreva em portugues do Brasil com boa pontuacao.

TRANSCRICAO:
${transcricao}

Retorne JSON com os campos abaixo. Campos nao mencionados devem ser string vazia "".`;
      schema = {
        type: "object",
        properties: {
          evolucao_tratamento:           { type: "string", description: "Evolucao geral do tratamento" },
          resultado_observado:           { type: "string", description: "Resultados observados" },
          feedback_paciente:             { type: "string", description: "Feedback do paciente" },
          procedimentos_realizados_retorno: { type: "string", description: "Procedimentos realizados no retorno" },
          intercorrencias:               { type: "string", description: "Intercorrencias ou complicacoes" },
          recomendacoes_pos_procedimento:{ type: "string", description: "Recomendacoes pos-procedimento" },
          proximo_retorno:               { type: "string", description: "Data ou prazo do proximo retorno" },
          observacoes_finais:            { type: "string", description: "Observacoes finais" },
          transcricao_original:          { type: "string", description: "Transcricao literal do audio" },
        }
      };
    }

    let result;
    try {
      result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
      });
    } catch {
      setStatus(ST_ERROR);
      setErrorMsg("Falha ao processar o audio com a IA. Verifique sua conexao e tente novamente.");
      return;
    }

    // Garantir transcricao_original do Whisper
    result.transcricao_original = transcricao;

    // Detectar conflitos com campos ja preenchidos
    const newConflicts = {};
    Object.keys(result).forEach(key => {
      if (key === "transcricao_original") return;
      const novo = result[key];
      const atual = existingFields[key];
      if (novo && novo.trim() && atual && atual.trim() && novo.trim() !== atual.trim()) {
        newConflicts[key] = { novo: novo.trim(), atual: atual.trim() };
      }
    });

    setStructured(result);
    setConflicts(newConflicts);
    setStatus(ST_REVIEW);
  };

  // ── CONFIRMAR ──────────────────────────────────────────────────────────
  const handleConfirm = (resolutions = {}) => {
    // resolutions: {fieldKey: "substituir" | "adicionar" | "manter"}
    const final = { ...structured };
    Object.keys(conflicts).forEach(key => {
      const res = resolutions[key] || "substituir";
      if (res === "manter") {
        final[key] = existingFields[key];
      } else if (res === "adicionar") {
        final[key] = existingFields[key]
          ? existingFields[key] + "\n\n" + structured[key]
          : structured[key];
      }
      // "substituir" mantém final[key] como está
    });
    onStructured?.(final);
    setStatus(ST_DONE);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  // ── LABELS ───────────────────────────────────────────────────────────────
  const fieldLabels = section === "prontuario" ? {
    queixa_principal:         "Queixa Principal",
    historico_medico:         "Historico Medico",
    alergias:                 "Alergias",
    medicacoes_em_uso:        "Medicacoes em Uso",
    procedimentos_anteriores: "Procedimentos Anteriores",
    observacoes_clinicas:     "Observacoes Clinicas",
    conduta_planejada:        "Conduta Planejada",
    recomendacoes:            "Recomendacoes",
    retorno_observacoes:      "Retorno / Observacoes",
  } : {
    evolucao_tratamento:            "Evolucao do Tratamento",
    resultado_observado:            "Resultado Observado",
    feedback_paciente:              "Feedback da Paciente",
    procedimentos_realizados_retorno: "Procedimentos no Retorno",
    intercorrencias:                "Intercorrencias",
    recomendacoes_pos_procedimento: "Recomendacoes",
    proximo_retorno:                "Proximo Retorno",
    observacoes_finais:             "Observacoes Finais",
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDERS POR ESTADO
  // ════════════════════════════════════════════════════════════════════════

  if (status === ST_DONE) return (
    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>Campos preenchidos. Revise e salve o prontuario.</span>
      </div>
      <Button size="sm" variant="ghost" onClick={cancelAll} className="text-gray-400 h-7 px-2">
        <RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  );

  if (status === ST_ERROR) return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-400 flex-1">{errorMsg}</p>
      </div>
      <Button size="sm" variant="outline" onClick={cancelAll}
        className="border-[#1e1e2a] text-gray-400 hover:text-white">
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Tentar novamente
      </Button>
    </div>
  );

  if (status === ST_UPLOADING || status === ST_TRANSCRIBING || status === ST_STRUCTURING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
      <p className="text-sm text-gray-300">
        {status === ST_UPLOADING    ? "Enviando audio..." :
         status === ST_TRANSCRIBING ? "Transcrevendo audio com IA..." :
                                      "Interpretando e estruturando os dados clinicos..."}
      </p>
    </div>
  );

  if (status === ST_REVIEW && structured) return (
    <ReviewPanel
      structured={structured}
      conflicts={conflicts}
      fieldLabels={fieldLabels}
      transcription={transcription}
      onConfirm={handleConfirm}
      onCancel={cancelAll}
    />
  );

  if (status === ST_RECORDED) return (
    <div className="space-y-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <FileAudio className="h-4 w-4 text-[#c9a55c]" />
          <span>Audio pronto — {elapsed > 0 ? formatTime(elapsed) : "arquivo enviado"}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={cancelAll} className="text-gray-500 h-7 px-2">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {audioUrl && (
        <div className="flex items-center gap-2">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
          <Button size="sm" variant="outline" onClick={togglePlay}
            className="border-[#1e1e2a] text-gray-300 h-8">
            {isPlaying
              ? <><Pause className="h-3.5 w-3.5 mr-1.5" />Pausar</>
              : <><Play  className="h-3.5 w-3.5 mr-1.5" />Ouvir</>}
          </Button>
          <span className="text-xs text-gray-500">Ouca antes de transcrever</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={handleTranscribeAndFill}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          <Mic className="h-3.5 w-3.5 mr-1.5" />
          Transcrever e Preencher
        </Button>
        <Button size="sm" variant="outline" onClick={cancelAll}
          className="border-[#1e1e2a] text-gray-400">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Regravar
        </Button>
      </div>
    </div>
  );

  if (status === ST_REQUESTING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <Loader2 className="h-4 w-4 text-[#c9a55c] animate-spin" />
      <p className="text-sm text-gray-400">Solicitando permissao de microfone...</p>
    </div>
  );

  if (status === ST_RECORDING || status === ST_PAUSED) return (
    <div className="bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === ST_RECORDING
            ? <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
            : <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full flex-shrink-0" />}
          <Clock className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-white font-mono text-sm">{formatTime(elapsed)}</span>
          <span className="text-gray-500 text-xs">
            {status === ST_PAUSED ? "Pausado" : "Gravando..."}
          </span>
        </div>
        <div className="flex gap-2">
          {status === ST_RECORDING ? (
            <Button size="sm" variant="outline" onClick={pauseRecording}
              className="border-[#1e1e2a] text-gray-300 h-8" title="Pausar">
              <Pause className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={resumeRecording}
              className="border-[#1e1e2a] text-gray-300 h-8" title="Retomar">
              <Mic className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" onClick={stopRecording}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-8"
            title="Finalizar">
            <Square className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelAll}
            className="text-gray-600 h-8" title="Cancelar">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2">
        Descreva o atendimento em voz — inclua queixa, historico, alergias, medicacoes e conduta.
      </p>
    </div>
  );

  // ── IDLE ──────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button type="button" size="sm" onClick={requestAndStart}
        className="bg-[#1a1a25] hover:bg-[#c9a55c]/10 text-white border border-[#1e1e2a]">
        <Mic className="h-3.5 w-3.5 mr-1.5 text-[#c9a55c]" />
        Gravar Audio
      </Button>
      <Button type="button" size="sm" variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="border-[#1e1e2a] text-gray-400 hover:text-white">
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        Enviar Audio
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac"
        className="hidden"
        onChange={e => handleUploadFile(e.target.files?.[0])}
      />
      <p className="text-xs text-gray-600 hidden sm:block">
        Grave ou envie — a IA transcreve e preenche os campos automaticamente
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PAINEL DE REVISAO
// ════════════════════════════════════════════════════════════════════════
function ReviewPanel({ structured, conflicts, fieldLabels, transcription, onConfirm, onCancel }) {
  const [resolutions, setResolutions] = useState({});
  const [editedFields, setEditedFields] = useState({ ...structured });

  const filledFields = Object.entries(fieldLabels).filter(([key]) =>
    editedFields[key] && editedFields[key].trim() && editedFields[key] !== "Nao informado no audio."
  );

  const setResolution = (key, val) => setResolutions(r => ({ ...r, [key]: val }));
  const updateField = (key, val) => setEditedFields(f => ({ ...f, [key]: val }));

  const handleConfirm = () => {
    onConfirm({ ...resolutions }, editedFields);
  };

  return (
    <div className="space-y-4 bg-[#1a1a25] rounded-xl border border-[#c9a55c]/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-[#c9a55c]" />
          <span className="text-sm font-medium text-[#c9a55c]">Revisao — verifique antes de salvar</span>
        </div>
        <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] border-[#c9a55c]/30 text-xs">
          {filledFields.length} campo{filledFields.length !== 1 ? "s" : ""} preenchido{filledFields.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Transcricao original */}
      <details className="text-xs">
        <summary className="text-gray-500 cursor-pointer hover:text-gray-300 select-none">
          Ver transcricao literal do audio
        </summary>
        <div className="mt-2 p-3 bg-[#12121a] rounded-lg border border-[#1e1e2a] text-gray-400 leading-relaxed">
          {transcription}
        </div>
      </details>

      {/* Campos preenchidos */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {filledFields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhuma informacao clinica identificada. Tente gravar novamente com mais detalhes.
          </p>
        )}
        {filledFields.map(([key, label]) => {
          const hasConflict = !!conflicts[key];
          return (
            <div key={key} className={`rounded-lg border p-3 space-y-2 ${hasConflict ? "border-yellow-500/30 bg-yellow-500/5" : "border-[#1e1e2a]"}`}>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {label}
                </label>
                {hasConflict && (
                  <div className="flex gap-1">
                    {[
                      { val: "substituir", label: "Substituir" },
                      { val: "adicionar",  label: "Adicionar" },
                      { val: "manter",     label: "Manter atual" },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setResolution(key, opt.val)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          (resolutions[key] || "substituir") === opt.val
                            ? "bg-[#c9a55c]/20 border-[#c9a55c]/50 text-[#c9a55c]"
                            : "border-[#1e1e2a] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {hasConflict && (resolutions[key] || "substituir") === "manter" ? (
                <div className="text-xs text-gray-400 bg-[#12121a] rounded p-2">
                  {conflicts[key].atual}
                </div>
              ) : (
                <Textarea
                  value={editedFields[key] || ""}
                  onChange={e => updateField(key, e.target.value)}
                  className="bg-[#12121a] border-[#1e1e2a] text-white text-xs resize-none"
                  rows={Math.min(4, Math.ceil((editedFields[key] || "").length / 80) + 1)}
                />
              )}
              {hasConflict && (resolutions[key] || "substituir") !== "manter" && (
                <p className="text-[10px] text-yellow-500/70">
                  Campo ja possuia conteudo. Escolha acima como proceder.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#1e1e2a]">
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-gray-500">
          Cancelar
        </Button>
        <Button size="sm" onClick={handleConfirm}
          disabled={filledFields.length === 0}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Confirmar e Preencher
        </Button>
      </div>
    </div>
  );
}