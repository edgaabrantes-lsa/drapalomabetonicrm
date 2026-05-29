import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Mic, MicOff, Square, Play, Pause, Upload,
  Loader2, CheckCircle, Trash2, Sparkles, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ST_IDLE = "idle";
const ST_REQUESTING = "requesting";
const ST_RECORDING = "recording";
const ST_PAUSED = "paused";
const ST_RECORDED = "recorded";
const ST_UPLOADING = "uploading";
const ST_TRANSCRIBING = "transcribing";
const ST_REVIEW = "review";
const ST_DONE = "done";
const ST_ERROR = "error";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioRecorder({ onSave }) {
  const [status, setStatus] = useState(ST_IDLE);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [editedText, setEditedText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);

  // Limpar timer ao desmontar
  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => clearInterval(timerRef.current);

  const requestAndStart = async () => {
    setStatus(ST_REQUESTING);
    setErrorMsg("");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus(ST_ERROR);
      setErrorMsg("Permissão de microfone negada. Verifique as configurações do navegador.");
      return;
    }
    streamRef.current = stream;
    const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg" });
    chunksRef.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
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
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current?.stop();
    chunksRef.current = [];
    setElapsed(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setStatus(ST_IDLE);
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    setStatus(ST_RECORDED);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setStatus(ST_UPLOADING);
    const file = new File([audioBlob], "audio.webm", { type: audioBlob.type || "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);

    setStatus(ST_TRANSCRIBING);
    // Usa TranscribeAudio para obter transcrição literal — sem interpretação, sem invenção
    let transcricao = "";
    try {
      transcricao = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    } catch {
      setStatus(ST_ERROR);
      setErrorMsg("Erro ao transcrever o áudio. Verifique a qualidade do áudio e tente novamente.");
      return;
    }

    if (!transcricao || transcricao.trim().length < 3) {
      setStatus(ST_ERROR);
      setErrorMsg("Áudio sem conteúdo identificável. Tente gravar novamente com mais clareza.");
      return;
    }

    setTranscription(transcricao);
    setEditedText(transcricao);
    setStatus(ST_REVIEW);
  };

  const handleConfirm = () => {
    onSave?.({ text: editedText, audio_url: uploadedUrl });
    setStatus(ST_DONE);
  };

  const handleReset = () => {
    setStatus(ST_IDLE);
    setElapsed(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscription("");
    setEditedText("");
    setUploadedUrl(null);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  // ── DONE ──────────────────────────────────────────────
  if (status === ST_DONE) return (
    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle className="h-4 w-4" />
        Áudio e transcrição salvos no prontuário
      </div>
      <Button size="sm" variant="ghost" onClick={handleReset} className="text-gray-400 h-7 px-2">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );

  // ── ERRO ──────────────────────────────────────────────
  if (status === ST_ERROR) return (
    <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl p-3">
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <AlertTriangle className="h-4 w-4" />
        {errorMsg}
      </div>
      <Button size="sm" variant="ghost" onClick={() => setStatus(ST_IDLE)} className="text-gray-400">Tentar novamente</Button>
    </div>
  );

  // ── REVIEW ──────────────────────────────────────────────
  if (status === ST_REVIEW) return (
    <div className="space-y-3 bg-[#1a1a25] rounded-xl border border-[#1e1e2a] p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#c9a55c]" />
        <span className="text-sm font-medium text-[#c9a55c]">Transcrição gerada — revise antes de salvar</span>
      </div>
      <Textarea
        value={editedText}
        onChange={e => setEditedText(e.target.value)}
        className="bg-[#12121a] border-[#1e1e2a] text-white text-sm"
        rows={5}
      />
      <div className="flex justify-between">
        <Button size="sm" variant="ghost" onClick={handleReset} className="text-gray-500">Cancelar</Button>
        <Button size="sm" onClick={handleConfirm} className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Confirmar e Salvar
        </Button>
      </div>
    </div>
  );

  // ── UPLOADING / TRANSCRIBING ──────────────────────────
  if (status === ST_UPLOADING || status === ST_TRANSCRIBING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-xl p-4">
      <Loader2 className="h-5 w-5 text-[#c9a55c] animate-spin flex-shrink-0" />
      <p className="text-sm text-gray-300">
        {status === ST_UPLOADING ? "Enviando áudio..." : "IA transcrevendo o áudio..."}
      </p>
    </div>
  );

  // ── RECORDED ──────────────────────────────────────────
  if (status === ST_RECORDED) return (
    <div className="space-y-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">Áudio gravado • {formatTime(elapsed)}</span>
        <Button size="sm" variant="ghost" onClick={cancelRecording} className="text-gray-500 h-7 px-2">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {audioUrl && (
        <div className="flex items-center gap-2">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
          <Button size="sm" variant="outline" onClick={togglePlay} className="border-[#1e1e2a] text-gray-300">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="ml-1.5">{isPlaying ? "Pausar" : "Ouvir"}</span>
          </Button>
          <span className="text-xs text-gray-500">ouça antes de transcrever</span>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleTranscribe} className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black flex-1">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Transcrever com IA
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          onSave?.({ text: "", audio_url: null });
          setStatus(ST_DONE);
        }} className="border-[#1e1e2a] text-gray-400">
          Salvar só áudio
        </Button>
      </div>
    </div>
  );

  // ── REQUESTING ──────────────────────────────────────────
  if (status === ST_REQUESTING) return (
    <div className="flex items-center gap-3 bg-[#1a1a25] border border-[#1e1e2a] rounded-xl p-4">
      <Loader2 className="h-4 w-4 text-[#c9a55c] animate-spin" />
      <p className="text-sm text-gray-400">Solicitando permissão de microfone...</p>
    </div>
  );

  // ── RECORDING / PAUSED ──────────────────────────────────
  if (status === ST_RECORDING || status === ST_PAUSED) return (
    <div className="flex items-center justify-between bg-[#1a1a25] border border-[#1e1e2a] rounded-xl p-4">
      <div className="flex items-center gap-3">
        {status === ST_RECORDING && <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />}
        {status === ST_PAUSED && <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />}
        <span className="text-white font-mono text-sm">{formatTime(elapsed)}</span>
        <span className="text-gray-500 text-xs">{status === ST_PAUSED ? "Pausado" : "Gravando..."}</span>
      </div>
      <div className="flex gap-2">
        {status === ST_RECORDING ? (
          <Button size="sm" variant="outline" onClick={pauseRecording} className="border-[#1e1e2a] text-gray-300 h-8">
            <Pause className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={resumeRecording} className="border-[#1e1e2a] text-gray-300 h-8">
            <Mic className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" onClick={stopRecording} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-8">
          <Square className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelRecording} className="text-gray-600 h-8">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // ── IDLE ──────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        type="button"
        size="sm"
        onClick={requestAndStart}
        className="bg-[#1a1a25] hover:bg-[#c9a55c]/10 text-white border border-[#1e1e2a]"
      >
        <Mic className="h-3.5 w-3.5 mr-1.5 text-[#c9a55c]" />
        Gravar Áudio
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="border-[#1e1e2a] text-gray-400 hover:text-white"
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        Enviar Áudio
      </Button>
      <p className="text-xs text-gray-600">Grave ou envie — a IA transcreve e preenche o prontuário</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={e => handleUploadFile(e.target.files[0])}
      />
    </div>
  );
}