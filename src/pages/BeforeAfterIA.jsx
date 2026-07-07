import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";

import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  Download, Trash2, Eye, User, FileText, Shield,
  Search, RefreshCw, ChevronLeft, ScanFace, ImageIcon,
  CheckCircle, RotateCcw, FlipHorizontal, ArrowLeft, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PatientSelectorModal from "@/components/facial/PatientSelectorModal";

const T = {
  bg: "#111620",
  card: "#171D29",
  border: "#252D3E",
  text: "#E8EDF5",
  muted: "#8A95AA",
  gold: "#C5A059",
};

const VALID_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

const SIMULATION_OPTIONS = [
  { id: "full_face", label: "Full Face", desc: "Simulação completa e harmônica do rosto" },
  { id: "testa", label: "Rugas da Testa", desc: "Suavização das linhas horizontais da testa" },
  { id: "glabela", label: "Glabela", desc: "Região entre as sobrancelhas" },
  { id: "pes_galinha", label: "Pés de Galinha", desc: "Canto externo dos olhos" },
  { id: "mandibula", label: "Mandíbula", desc: "Definição da linha mandibular" },
  { id: "mento", label: "Mento / Queixo", desc: "Equilíbrio do perfil facial" },
  { id: "mandibula_mento", label: "Mandíbula + Mento", desc: "Contorno facial combinado" },
  { id: "melasma", label: "Melasma / Manchas", desc: "Irregularidades de pigmentação" },
  { id: "olheiras", label: "Olheiras", desc: "Região infraorbital e escurecimento" },
  { id: "labios", label: "Lábios", desc: "Volume e definição labial natural" },
  { id: "nariz", label: "Nariz / Rinomodelação", desc: "Refinamento nasal sutil" },
  { id: "papada", label: "Papada / Contorno Inferior", desc: "Região submentoniana" },
];

const statusConfig = {
  pending:    { label: "Pendente",    color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  processing: { label: "Processando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed:  { label: "Concluído",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  failed:     { label: "Falhou",      color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

/* ─────────────────────────────────────
   CÂMERA — componente isolado e robusto
───────────────────────────────────────*/
function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const startStream = useCallback(async (mode) => {
    stopStream();
    setCameraError("");
    setCameraReady(false);
    try {
      // Checar se há múltiplas câmeras
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
          setCameraReady(true);
        };
      }
    } catch (err) {
      const msg = err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
        ? "Permissão negada. Permita o acesso à câmera nas configurações do navegador."
        : err.name === "NotFoundError"
        ? "Nenhuma câmera encontrada neste dispositivo."
        : "Não foi possível acessar a câmera. Tente pelo upload.";
      setCameraError(msg);
    }
  }, [stopStream]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Seu navegador não suporta câmera. Use o upload de foto.");
      return;
    }
    startStream(facingMode);
    return () => stopStream();
  }, []);

  const switchCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startStream(next);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      stopStream();
      onCapture(new File([blob], "camera_photo.jpg", { type: "image/jpeg" }), "front_camera");
    }, "image/jpeg", 0.92);
  };

  if (cameraError) return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-400 mb-1">Câmera indisponível</p>
        <p className="text-xs" style={{ color: T.muted }}>{cameraError}</p>
      </div>
      <Button variant="outline" onClick={onCancel} className="w-full" style={{ borderColor: T.border, color: T.muted }}>
        <Upload className="h-4 w-4 mr-2" /> Usar Upload em vez disso
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: 240 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full block"
          style={{ maxHeight: "50vh", objectFit: "cover" }}
        />
        <canvas ref={canvasRef} className="hidden" />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.gold }} />
          </div>
        )}
        {/* Botão trocar câmera */}
        {hasMultipleCameras && (
          <button onClick={switchCamera}
            className="absolute top-3 right-3 p-2 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)" }}
            title="Trocar câmera">
            <FlipHorizontal className="h-5 w-5 text-white" />
          </button>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
            {facingMode === "user" ? "Câmera Frontal" : "Câmera Traseira"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { stopStream(); onCancel(); }} className="flex-1"
          style={{ borderColor: T.border, color: T.muted }}>
          <X className="h-4 w-4 mr-2" /> Cancelar
        </Button>
        <Button onClick={capture} disabled={!cameraReady} className="flex-1"
          style={{ background: T.gold, color: "#111620" }}>
          <Camera className="h-4 w-4 mr-2" /> Capturar Foto
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   SLIDER ANTES / DEPOIS — alinhamento perfeito, sem corte
   Técnica: ambas as imagens ficam em position:absolute sobre
   um container com aspect-ratio determinado pela imagem DEPOIS.
   O clipPath na camada ANTES garante corte sem desalinhamento.
───────────────────────────────────────*/
function BeforeAfterSlider({ before, after }) {
  const [pos, setPos] = useState(50);
  const [containerH, setContainerH] = useState(0);
  const containerRef = useRef(null);
  const afterImgRef = useRef(null);
  const dragging = useRef(false);

  // Calcular altura do container baseado na imagem carregada
  const updateHeight = useCallback(() => {
    const img = afterImgRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.naturalWidth) return;
    const ratio = img.naturalHeight / img.naturalWidth;
    const h = container.offsetWidth * ratio;
    setContainerH(Math.min(h, window.innerHeight * 0.78));
  }, []);

  useLayoutEffect(() => {
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [updateHeight]);

  const updatePos = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  }, []);

  const imgStyle = {
    position: "absolute",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    userSelect: "none",
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none cursor-col-resize bg-black w-full"
      style={{
        touchAction: "none",
        height: containerH > 0 ? containerH : "auto",
        minHeight: containerH > 0 ? undefined : 240,
        overflow: "hidden",
      }}
      onMouseDown={e => { dragging.current = true; updatePos(e.clientX); }}
      onMouseMove={e => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={e => { e.preventDefault(); dragging.current = true; updatePos(e.touches[0].clientX); }}
      onTouchMove={e => { e.preventDefault(); if (dragging.current) updatePos(e.touches[0].clientX); }}
      onTouchEnd={() => { dragging.current = false; }}
    >
      {/* Imagem DEPOIS — camada base */}
      <img
        ref={afterImgRef}
        src={after}
        alt="Depois"
        style={imgStyle}
        draggable={false}
        onLoad={updateHeight}
      />

      {/* Imagem ANTES — sobreposta com clipPath exato */}
      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          clipPath: `inset(0 ${100 - pos}% 0 0)`,
        }}
      >
        <img
          src={before}
          alt="Antes"
          style={imgStyle}
          draggable={false}
        />
      </div>

      {/* Linha divisória + handle */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: `${pos}%`, width: 2, transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", boxShadow: "0 0 12px rgba(0,0,0,0.7)" }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center gap-0.5"
          style={{ border: "2px solid #C5A059" }}
        >
          <ArrowLeft className="h-3 w-3 text-gray-600" />
          <ArrowRight className="h-3 w-3 text-gray-600" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 text-xs font-bold text-white px-2.5 py-1 rounded-full pointer-events-none"
        style={{ background: "rgba(0,0,0,0.72)", letterSpacing: "0.06em" }}>ANTES</div>
      <div className="absolute bottom-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none"
        style={{ background: "rgba(197,160,89,0.92)", color: "#111620", letterSpacing: "0.06em" }}>DEPOIS</div>
    </div>
  );
}

/* ─────────────────────────────────────
   VISUALIZADOR LADO A LADO
───────────────────────────────────────*/
function SideBySideView({ before, after }) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <img src={before} alt="Antes"
          style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
        />
        <div className="absolute bottom-2 left-2 text-xs font-semibold text-white px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.65)" }}>ANTES</div>
      </div>
      <div className="relative rounded-xl overflow-hidden bg-black">
        <img src={after} alt="Depois"
          style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
        />
        <div className="absolute bottom-2 right-2 text-xs font-semibold text-white px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.65)" }}>DEPOIS</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MODAL FULLSCREEN
───────────────────────────────────────*/
function FullscreenModal({ image, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={image}
        alt="Imagem completa"
        style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}

/* ─────────────────────────────────────
   WIZARD PRINCIPAL DE SIMULAÇÃO
───────────────────────────────────────*/
function SimulationWizard({ patient, onBack, onSuccess }) {
  const [step, setStep] = useState("source"); // source | camera | options | preview | generating | result
  const [sourceType, setSourceType] = useState("upload");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(["full_face"]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [technicalReport, setTechnicalReport] = useState("");
  const [simulationId, setSimulationId] = useState(null);
  const [error, setError] = useState("");
  const [savedToRecord, setSavedToRecord] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [viewMode, setViewMode] = useState("slider");
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file, src = "upload") => {
    setError("");
    if (!VALID_FORMATS.includes(file.type) && !file.name?.endsWith(".heic")) {
      setError("Formato não suportado. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        setError("Resolução muito baixa. Use uma foto mais nítida.");
        URL.revokeObjectURL(url);
        return;
      }
      setImageFile(file);
      setImagePreview(url);
      setSourceType(src);
      setStep("options");
    };
    img.onerror = () => { setError("Imagem inválida ou corrompida."); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, "upload");
    e.target.value = "";
  };

  const toggleOption = (id) => {
    if (id === "full_face") {
      setSelectedOptions(["full_face"]);
      return;
    }
    setSelectedOptions(prev => {
      const without = prev.filter(o => o !== "full_face");
      return without.includes(id) ? without.filter(o => o !== id) : [...without, id];
    });
  };

  const handleGenerate = async () => {
    if (!consentChecked) { setError("Confirme o consentimento LGPD para continuar."); return; }
    if (!imageFile || !patient?.id) { setError("Selecione a paciente e a imagem."); return; }
    if (selectedOptions.length === 0) { setError("Selecione ao menos uma área de simulação."); return; }

    setStep("generating");
    setError("");

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      setOriginalImageUrl(file_url);

      const response = await base44.functions.invoke("generateFullFaceSimulation", {
        patient_id: patient.id,
        original_image_url: file_url,
        source_type: sourceType,
        consent_lgpd: true,
        simulation_options: selectedOptions,
      });

      const result = response.data;
      if (!result?.generated_image_url) throw new Error(result?.error || "Nenhuma imagem gerada.");

      setGeneratedImage(result.generated_image_url);
      setSimulationId(result.simulation_id);
      setTechnicalReport(result.technical_report || "");
      setStep("result");
      if (onSuccess) onSuccess(result);
      toast.success("Simulação gerada com sucesso!");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Falha ao gerar simulação. Tente novamente.";
      setError(msg);
      setStep("options");
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!simulationId || !generatedImage) {
      toast.error("Não foi possível salvar no prontuário. Verifique se a paciente está selecionada e tente novamente.");
      return;
    }
    if (savedToRecord) {
      toast.info("Esta simulação já foi salva no prontuário.");
      return;
    }

    setSavingRecord(true);
    try {
      let user = null;
      try { user = await base44.auth.me(); } catch { /* continua sem usuário */ }
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const optionLabels = selectedOptions.map(id => SIMULATION_OPTIONS.find(o => o.id === id)?.label || id).join(", ");

      // 1. Salvar imagem original no prontuário
      if (originalImageUrl) {
        await base44.entities.PatientImage.create({
          patient_id: patient.id,
          image_url: originalImageUrl,
          image_type: "before",
          procedure_name: `Simulação IA — ${optionLabels}`,
          capture_date: dateStr,
          consent_signed: true,
          notes: `Imagem ANTES — Simulação IA (ID: ${simulationId})`,
        });
      }

      // 2. Salvar imagem gerada (depois) no prontuário
      await base44.entities.PatientImage.create({
        patient_id: patient.id,
        image_url: generatedImage,
        image_type: "after",
        procedure_name: `Simulação IA — ${optionLabels}`,
        capture_date: dateStr,
        consent_signed: true,
        notes: `Imagem DEPOIS — Simulação IA (ID: ${simulationId}). Áreas: ${optionLabels}. Profissional: ${user?.email || "—"}. Consentimento LGPD confirmado.`,
      });

      // 3. Criar registro no prontuário (MedicalRecord)
      await base44.entities.MedicalRecord.create({
        patient_id: patient.id,
        record_date: now.toISOString(),
        chief_complaint: `Simulação de Antes e Depois com IA — ${optionLabels}`,
        evolution: `Simulação de Antes e Depois com IA realizada em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.\n\nOpções selecionadas: ${optionLabels}.\n\nImagem original e imagem simulada anexadas ao prontuário.\nConsentimento LGPD confirmado antes da geração.\n\nProfissional: ${user?.full_name || user?.email || "—"}.\nID da simulação: ${simulationId}`,
        recommendations: "Resultado meramente ilustrativo para apoio visual em consulta estética. Não representa promessa de resultado clínico.",
        professional_id: user?.id || "",
        status: "approved",
        attachments: [originalImageUrl, generatedImage].filter(Boolean),
      });

      // 4. Marcar simulação como salva no prontuário
      await base44.entities.FullFaceSimulation.update(simulationId, {
        facial_analysis_snapshot: {
          simulation_options: selectedOptions,
          saved_to_record: true,
          saved_at: now.toISOString(),
          saved_by: user?.email || "",
        },
      });

      setSavedToRecord(true);
      toast.success("Simulação salva com sucesso no prontuário da paciente.");
    } catch (err) {
      console.error("Erro ao salvar prontuário:", err);
      toast.error("Não foi possível salvar no prontuário. Verifique se a paciente está selecionada e tente novamente.");
    } finally {
      setSavingRecord(false);
    }
  };

  const reset = () => {
    setStep("source");
    setSourceType("upload");
    setImageFile(null);
    setImagePreview(null);
    setConsentChecked(false);
    setSelectedOptions(["full_face"]);
    setGeneratedImage(null);
    setOriginalImageUrl(null);
    setTechnicalReport("");
    setSimulationId(null);
    setError("");
    setSavedToRecord(false);
    setSavingRecord(false);
    setViewMode("slider");
    setFullscreen(false);
  };

  // ── STEP: source ──
  if (step === "source") return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm transition-colors hover:text-white" style={{ color: T.muted }}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}25` }}>
        <User className="h-4 w-4 flex-shrink-0" style={{ color: T.gold }} />
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: T.gold }}>Paciente selecionada</p>
          <p className="text-sm font-medium" style={{ color: T.text }}>{patient.full_name}</p>
        </div>
      </div>
      <p className="text-sm" style={{ color: T.muted }}>Como deseja capturar a foto?</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Câmera Frontal", sub: "Selfie", icon: Camera, action: () => setStep("camera") },
          { label: "Câmera Traseira", sub: "Melhor qualidade", icon: Camera, action: () => setStep("camera") },
          { label: "Webcam Desktop", sub: "Chrome / Safari", icon: Camera, action: () => setStep("camera") },
          { label: "Enviar Foto", sub: "JPG, PNG, WEBP", icon: Upload, action: () => fileInputRef.current?.click() },
        ].map(opt => (
          <button key={opt.label} onClick={opt.action}
            className="p-5 rounded-xl border flex flex-col items-center gap-2 transition-all hover:border-[#C5A059]/60 active:scale-95"
            style={{ background: T.bg, borderColor: T.border }}>
            <opt.icon className="h-6 w-6" style={{ color: T.gold }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: T.text }}>{opt.label}</p>
              <p className="text-xs" style={{ color: T.muted }}>{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        onChange={handleUpload} className="hidden" />
      {error && <ErrorMsg msg={error} />}
    </div>
  );

  // ── STEP: camera ──
  if (step === "camera") return (
    <div className="space-y-4">
      <button onClick={() => setStep("source")} className="flex items-center gap-1 text-sm" style={{ color: T.muted }}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>
      <CameraCapture
        onCapture={(file, src) => processFile(file, src)}
        onCancel={() => setStep("source")}
      />
      <div className="flex items-center gap-2 justify-center">
        <span className="text-xs" style={{ color: T.muted }}>Ou</span>
        <button onClick={() => { setStep("source"); setTimeout(() => fileInputRef.current?.click(), 100); }}
          className="text-xs underline" style={{ color: T.gold }}>
          usar upload de arquivo
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        onChange={handleUpload} className="hidden" />
    </div>
  );

  // ── STEP: options (preview + seleção de simulação + consentimento) ──
  if (step === "options") return (
    <div className="space-y-5">
      {/* Preview miniatura */}
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ maxHeight: "30vh" }}>
        <img src={imagePreview} alt="Foto selecionada" className="w-full h-full object-contain" style={{ maxHeight: "29vh" }} />
        <button onClick={reset}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <X className="h-3.5 w-3.5 text-white" />
        </button>
        <button onClick={() => setStep("source")}
          className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded flex items-center gap-1"
          style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
          <RotateCcw className="h-3 w-3" /> Trocar foto
        </button>
      </div>

      {/* Seleção de simulação */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: T.gold }}>Áreas para Simulação</p>
        <div className="grid grid-cols-2 gap-2">
          {SIMULATION_OPTIONS.map(opt => {
            const active = selectedOptions.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => toggleOption(opt.id)}
                className="p-3 rounded-lg border text-left transition-all"
                style={{
                  background: active ? `${T.gold}15` : T.bg,
                  borderColor: active ? T.gold : T.border,
                }}>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium" style={{ color: active ? T.gold : T.text }}>{opt.label}</p>
                  {active && <Check className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: T.gold }} />}
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{opt.desc}</p>
              </button>
            );
          })}
        </div>
        {selectedOptions.length > 0 && (
          <p className="text-xs mt-2" style={{ color: T.muted }}>
            Selecionado: {selectedOptions.map(id => SIMULATION_OPTIONS.find(o => o.id === id)?.label).join(", ")}
          </p>
        )}
      </div>

      {/* Consentimento LGPD */}
      <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-start gap-3">
          <Checkbox id="lgpd" checked={consentChecked} onCheckedChange={setConsentChecked} className="mt-0.5" />
          <Label htmlFor="lgpd" className="text-xs leading-relaxed cursor-pointer" style={{ color: T.text }}>
            Autorizo o uso desta imagem exclusivamente para análise facial, simulação estética, prontuário interno e planejamento do tratamento, conforme a política de privacidade da clínica. A imagem não será usada para treinamento de IA.
          </Label>
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={reset} className="flex-1" style={{ borderColor: T.border, color: T.muted }}>
          <RotateCcw className="h-4 w-4 mr-2" /> Recomeçar
        </Button>
        <Button onClick={handleGenerate} disabled={!consentChecked || selectedOptions.length === 0}
          className="flex-1 disabled:opacity-40" style={{ background: T.gold, color: "#111620" }}>
          <ScanFace className="h-4 w-4 mr-2" /> Gerar Simulação
        </Button>
      </div>
    </div>
  );

  // ── STEP: generating ──
  if (step === "generating") return (
    <div className="py-16 flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 rounded-full border-2 border-[#C5A059]/20 border-t-[#C5A059] animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: T.gold }}>IA Processando</p>
        <p className="text-base font-medium" style={{ color: T.text }}>Gerando simulação facial...</p>
        <p className="text-sm" style={{ color: T.muted }}>
          {selectedOptions.includes("full_face") ? "Full Face Premium" : selectedOptions.map(id => SIMULATION_OPTIONS.find(o => o.id === id)?.label).join(" + ")}
        </p>
        <p className="text-xs" style={{ color: T.muted }}>Isso pode levar até 60 segundos</p>
      </div>
    </div>
  );

  // ── STEP: result ──
  if (step === "result") return (
    <div className="space-y-8">

      {/* ══ RESULTADO FINAL DA SIMULAÇÃO ══ */}
      {generatedImage && (
        <div className="space-y-4">
          {/* Título do bloco */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: T.gold }}>
                Resultado Final
              </p>
              <h2 className="text-base font-semibold" style={{ color: T.text }}>
                Resultado Final da Simulação
              </h2>
            </div>
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.muted }}
            >
              <Eye className="h-3.5 w-3.5" /> Tela Cheia
            </button>
          </div>

          {/* Antes e Depois — lado a lado */}
          {originalImageUrl && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full"
                    style={{ background: `${T.gold}15`, color: T.gold, border: `1px solid ${T.gold}30` }}>
                    Antes
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#000", border: `1px solid ${T.border}` }}>
                  <img
                    src={originalImageUrl}
                    alt="Foto Original"
                    style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
                    draggable={false}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full"
                    style={{ background: `${T.gold}15`, color: T.gold, border: `1px solid ${T.gold}30` }}>
                    Depois
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#000", border: `1px solid ${T.border}` }}>
                  <img
                    src={generatedImage}
                    alt="Resultado Final da Simulação"
                    style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tags de áreas simuladas */}
          <div className="flex flex-wrap gap-1.5">
            {selectedOptions.map(id => {
              const opt = SIMULATION_OPTIONS.find(o => o.id === id);
              return opt ? (
                <span key={id} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${T.gold}15`, color: T.gold, border: `1px solid ${T.gold}30` }}>
                  {opt.label}
                </span>
              ) : null;
            })}
          </div>

          {/* Relatório técnico */}
          {technicalReport && (
            <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: T.gold }}>Relatório Técnico</p>
              <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{technicalReport}</p>
            </div>
          )}

          {/* Aviso legal */}
          <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Shield className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
              <span className="text-red-400 font-medium">Aviso Legal: </span>
              Imagem meramente ilustrativa para apoio visual em consulta. Resultado real depende de avaliação profissional.
            </p>
          </div>

          {/* ── Botões de ação ── */}
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={generatedImage}
              download={`simulacao_${patient.full_name?.replace(/\s+/g, "_")}.png`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: T.gold, color: "#111620" }}
            >
              <Download className="h-4 w-4" /> Baixar
            </a>

            {savedToRecord ? (
              <Button disabled variant="outline"
                style={{ borderColor: "#34d39940", color: "#34d399", opacity: 0.8 }}>
                <CheckCircle className="h-4 w-4 mr-2" /> Já salvo no prontuário
              </Button>
            ) : (
              <Button onClick={handleSaveMedicalRecord} disabled={savingRecord}
                variant="outline" style={{ borderColor: `${T.gold}40`, color: T.gold }}>
                {savingRecord
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                  : <><FileText className="h-4 w-4 mr-2" /> Enviar para o Prontuário</>}
              </Button>
            )}

            <Button onClick={reset} variant="outline" style={{ borderColor: T.border, color: T.muted }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Nova Simulação
            </Button>
          </div>
        </div>
      )}

      {/* Modal fullscreen */}
      {fullscreen && generatedImage && (
        <FullscreenModal image={generatedImage} onClose={() => setFullscreen(false)} />
      )}
    </div>
  );

  return null;
}

/* ─────────────────────────────────────
   HISTÓRICO DE SIMULAÇÕES
───────────────────────────────────────*/
function SimulationHistory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try { return await base44.auth.me(); } catch { return null; }
    },
  });
  const isAdmin = user?.role === "admin";

  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ["full-face-simulations"],
    queryFn: () => base44.entities.FullFaceSimulation.list("-created_date", 500),
  });
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FullFaceSimulation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-face-simulations"] });
      setToDelete(null);
      setSelected(null);
      toast.success("Simulação excluída.");
    },
  });

  const getPatient = (id) => patients.find(p => p.id === id);

  const filtered = simulations.filter(s => {
    if (!search) return true;
    const name = (getPatient(s.patient_id)?.full_name || s.patient_name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleDownload = async (url, name) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
    } catch { toast.error("Erro ao baixar imagem."); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: simulations.length, color: T.text },
          { label: "Concluídas", value: simulations.filter(s => s.status === "completed").length, color: "#34d399" },
          { label: "Processando", value: simulations.filter(s => s.status === "processing").length, color: "#60a5fa" },
          { label: "Com falha", value: simulations.filter(s => s.status === "failed").length, color: "#f87171" },
        ].map(stat => (
          <Card key={stat.label} style={{ background: T.card, borderColor: T.border }}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: T.muted }}>{stat.label}</p>
              <p className="text-2xl font-light" style={{ color: stat.color }}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
        <Input placeholder="Buscar por paciente..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 text-sm" style={{ background: T.card, borderColor: T.border, color: T.text }} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: T.gold }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ color: "#374151" }} />
          <p style={{ color: T.muted }}>Nenhuma simulação encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(sim => {
            const patient = getPatient(sim.patient_id);
            const status = statusConfig[sim.status] || statusConfig.pending;
            return (
              <Card key={sim.id} onClick={() => setSelected(sim)}
                className="cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: T.card, borderColor: T.border }}>
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg bg-black/40">
                    {sim.generated_image_url ? (
                      <img src={sim.generated_image_url} alt="Simulação" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {sim.status === "processing"
                          ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.gold }} />
                          : <ImageIcon className="h-8 w-8" style={{ color: "#374151" }} />}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-medium truncate" style={{ color: T.text }}>
                      {patient?.full_name || sim.patient_name || "Paciente"}
                    </p>
                    <p className="text-xs" style={{ color: T.muted }}>
                      {sim.created_date && format(parseISO(sim.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    {sim.facial_analysis_snapshot?.saved_to_record && (
                      <div className="flex items-center gap-1.5 text-xs py-1"
                        style={{ color: "#34d399" }}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Salvo no prontuário</span>
                        {sim.facial_analysis_snapshot?.saved_at && (
                          <span style={{ color: T.muted }}>
                            · {format(parseISO(sim.facial_analysis_snapshot.saved_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelected(sim); }}
                        className="flex-1 h-8 text-xs" style={{ borderColor: `${T.gold}40`, color: T.gold }}>
                        <Eye className="h-3 w-3 mr-1" /> Ver
                      </Button>
                      {sim.generated_image_url && (
                        <Button size="sm" variant="outline"
                          onClick={e => { e.stopPropagation(); handleDownload(sim.generated_image_url, `simulacao_${patient?.full_name || "paciente"}.png`); }}
                          className="flex-1 h-8 text-xs" style={{ borderColor: `${T.gold}40`, color: T.gold }}>
                          <Download className="h-3 w-3 mr-1" /> Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ background: T.card, borderColor: T.border, color: T.text }}>
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Simulação — {getPatient(selected?.patient_id)?.full_name || selected?.patient_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              {selected.generated_image_url && (
                <img src={selected.generated_image_url} alt="Antes e Depois" className="w-full rounded-xl" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Paciente", value: getPatient(selected.patient_id)?.full_name || "—" },
                  { label: "Data", value: selected.created_date ? format(parseISO(selected.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—" },
                  { label: "Origem", value: { front_camera: "Câmera Frontal", back_camera: "Câmera Traseira", webcam: "Webcam", upload: "Upload" }[selected.source_type] || "—" },
                  { label: "Profissional", value: selected.user_email || "—" },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg" style={{ background: T.bg }}>
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: T.muted }}>{item.label}</p>
                    <p className="text-sm font-medium truncate" style={{ color: T.text }}>{item.value}</p>
                  </div>
                ))}
              </div>
              {selected.technical_report && (
                <div className="p-4 rounded-lg" style={{ background: T.bg }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: T.muted }}>Relatório</p>
                  <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{selected.technical_report}</p>
                </div>
              )}
              <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: T.muted }}>
                <span className="text-red-400 font-medium">Aviso Legal: </span>
                Imagem ilustrativa gerada por IA. Não representa promessa de resultado.
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: T.border }}>
                {selected.generated_image_url && (
                  <a href={selected.generated_image_url}
                    download={`simulacao_${getPatient(selected.patient_id)?.full_name || "paciente"}.png`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                    style={{ background: T.gold, color: "#111620" }}>
                    <Download className="h-4 w-4" /> Baixar Imagem
                  </a>
                )}
                {isAdmin && (
                  <Button onClick={() => setToDelete(selected)} variant="destructive" className="ml-auto">
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent style={{ background: T.card, borderColor: T.border }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>Excluir simulação?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.muted }}>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: T.muted }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete.id)} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─────────────────────────────────────
   COMPONENTE ERRO
───────────────────────────────────────*/
function ErrorMsg({ msg }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-400">{msg}</p>
    </div>
  );
}

/* ─────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────*/
export default function BeforeAfterIA() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("gerar");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientSelectorOpen, setIsPatientSelectorOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif" style={{ color: T.text }}>Gerar Antes e Depois com IA</h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>Simulação visual de resultado estético gerada por inteligência artificial</p>
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); if (v === "gerar") setShowWizard(false); }}>
        <TabsList style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <TabsTrigger value="gerar" className="data-[state=active]:text-[#C5A059]">
            <ScanFace className="h-4 w-4 mr-2" /> Nova Simulação
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:text-[#C5A059]">
            <FileText className="h-4 w-4 mr-2" /> Histórico de Simulações Faciais
          </TabsTrigger>
        </TabsList>

        {/* ABA GERAR */}
        <TabsContent value="gerar" className="mt-5">
          {showWizard && selectedPatient ? (
            <SimulationWizard
              patient={selectedPatient}
              onBack={() => setShowWizard(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["full-face-simulations"] });
              }}
            />
          ) : (
            <div className="max-w-lg mx-auto">
              <Card style={{ background: T.card, borderColor: T.border }}>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${T.gold}15` }}>
                      <ScanFace className="h-5 w-5" style={{ color: T.gold }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: T.text }}>Simulação Facial com IA</p>
                      <p className="text-xs" style={{ color: T.muted }}>Resultado antes e depois realista</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.muted }}>Paciente</p>
                    {selectedPatient ? (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.gold}30` }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" style={{ color: T.gold }} />
                          <span className="text-sm font-medium" style={{ color: T.text }}>{selectedPatient.full_name}</span>
                        </div>
                        <button className="text-xs hover:underline" style={{ color: T.muted }} onClick={() => setSelectedPatient(null)}>
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsPatientSelectorOpen(true)} variant="outline" className="w-full"
                        style={{ borderColor: T.border, color: T.muted }}>
                        <User className="h-4 w-4 mr-2" /> Selecionar Paciente
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {[
                      "12 tipos de simulação selecionáveis",
                      "Câmera ou upload de foto",
                      "Comparação lado a lado com slider",
                      "Download da imagem gerada",
                      "Registro automático no histórico",
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: T.gold }} />
                        <span className="text-xs" style={{ color: T.muted }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl" style={{ background: `${T.gold}08`, border: `1px solid ${T.gold}20` }}>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: T.gold }} />
                      <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                        Consentimento LGPD obrigatório. Imagem meramente ilustrativa.
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => { if (!selectedPatient) setIsPatientSelectorOpen(true); else setShowWizard(true); }}
                    className="w-full h-12 text-sm font-semibold" style={{ background: T.gold, color: "#111620" }}>
                    <ScanFace className="h-4 w-4 mr-2" />
                    {selectedPatient ? "Iniciar Simulação" : "Selecionar Paciente para Iniciar"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ABA HISTÓRICO */}
        <TabsContent value="historico" className="mt-5">
          <div className="mb-4">
            <h2 className="text-lg font-medium uppercase tracking-widest" style={{ color: T.text }}>
              Histórico de Simulações Faciais
            </h2>
            <p className="text-xs mt-1" style={{ color: T.muted }}>Todas as simulações geradas por IA</p>
          </div>
          <SimulationHistory />
        </TabsContent>
      </Tabs>

      <PatientSelectorModal
        open={isPatientSelectorOpen}
        onOpenChange={setIsPatientSelectorOpen}
        onSelect={(patient) => {
          setSelectedPatient(patient);
          setIsPatientSelectorOpen(false);
          setShowWizard(true);
        }}
      />
    </div>
  );
}