import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const T = {
  pearl: "#111620",
  white: "#171D29",
  onyx: "#E8EDF5",
  charcoal: "#8A95AA",
  subtle: "#252D3E",
  gold: "#C5A059",
};

const VALID_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function FullFaceSimulationModal({ 
  patientId, 
  patientName, 
  open, 
  onClose, 
  onSuccess 
}) {
  const [step, setStep] = useState("select_source"); // select_source, capture, preview, processing, result
  const [sourceType, setSourceType] = useState(null); // front_camera, back_camera, webcam, upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [technicalReport, setTechnicalReport] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setStep("select_source");
      setSourceType(null);
      setImageFile(null);
      setImagePreview(null);
      setConsentChecked(false);
      setIsGenerating(false);
      setGeneratedImage(null);
      setTechnicalReport("");
      setError("");
    }
  }, [open]);

  // Limpar stream de vídeo ao fechar
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Iniciar câmera
  const startCamera = async (facingMode) => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("capture");
    } catch (err) {
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setStep("select_source");
    }
  };

  // Capturar foto da câmera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      handleFileSelection({ target: { files: [blob] } });
    }, "image/jpeg", 0.95);

    // Parar câmera
    video.srcObject.getTracks().forEach(track => track.stop());
  };

  // Handle upload de arquivo
  const handleFileSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar formato
    if (!VALID_FORMATS.includes(file.type)) {
      setError("Formato não suportado. Use JPG, JPEG, PNG ou WEBP.");
      return;
    }

    // Validar tamanho
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Tamanho máximo: ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Validar imagem
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Validações básicas de qualidade
      if (img.width < 400 || img.height < 400) {
        setError("Imagem de baixa resolução. Por favor, use uma foto mais nítida.");
        return;
      }

      setImageFile(file);
      setImagePreview(objectUrl);
      setStep("preview");
      setError("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Não foi possível carregar a imagem. Tente novamente.");
    };
    img.src = objectUrl;
  };

  // Gerar simulação
  const handleGenerate = async () => {
    if (!consentChecked) {
      setError("É necessário confirmar o consentimento LGPD para continuar.");
      return;
    }

    if (!imageFile || !patientId) {
      setError("Dados incompletos. Verifique se a paciente foi selecionada.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Upload da imagem original via SDK
      const { file_url: original_image_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      if (!original_image_url) throw new Error("Falha no upload da imagem");

      // Chamar backend function via SDK
      const response = await base44.functions.invoke("generateFullFaceSimulation", {
        patient_id: patientId,
        original_image_url,
        source_type: sourceType || "upload",
        consent_lgpd: true,
        simulation_options: ["full_face"],
      });

      const result = response.data;
      if (!result?.generated_image_url) throw new Error(result?.error || "Nenhuma imagem gerada.");

      setGeneratedImage(result.generated_image_url);
      setTechnicalReport(result.technical_report || "");
      setStep("result");

      if (onSuccess) {
        onSuccess({
          simulation_id: result.simulation_id,
          generated_image_url: result.generated_image_url,
          technical_report: result.technical_report,
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Não conseguimos gerar a simulação neste momento.";
      setError(msg);
      setStep("preview");
    } finally {
      setIsGenerating(false);
    }
  };

  // Renderizar conteúdo baseado no step
  const renderContent = () => {
    switch (step) {
      case "select_source":
        return (
          <div className="space-y-4">
            <p style={{ fontFamily: "Inter", fontSize: 13, color: T.charcoal, textAlign: "center" }}>
              Selecione como deseja capturar ou enviar a foto da paciente:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startCamera("user")}
                className="p-4 rounded-lg border flex flex-col items-center gap-2 transition-all hover:border-[#C5A059]/40"
                style={{ background: T.pearl, borderColor: T.subtle }}
              >
                <Camera size={24} color={T.gold} />
                <span style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx }}>Câmera Frontal</span>
              </button>
              <button
                onClick={() => startCamera("environment")}
                className="p-4 rounded-lg border flex flex-col items-center gap-2 transition-all hover:border-[#C5A059]/40"
                style={{ background: T.pearl, borderColor: T.subtle }}
              >
                <Camera size={24} color={T.gold} />
                <span style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx }}>Câmera Traseira</span>
              </button>
              <button
                onClick={() => startCamera("user")}
                className="p-4 rounded-lg border flex flex-col items-center gap-2 transition-all hover:border-[#C5A059]/40"
                style={{ background: T.pearl, borderColor: T.subtle }}
              >
                <Camera size={24} color={T.gold} />
                <span style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx }}>Webcam</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-lg border flex flex-col items-center gap-2 transition-all hover:border-[#C5A059]/40"
                style={{ background: T.pearl, borderColor: T.subtle }}
              >
                <Upload size={24} color={T.gold} />
                <span style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx }}>Enviar Foto</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelection}
              className="hidden"
            />
          </div>
        );

      case "capture":
        return (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden" style={{ background: "#000", maxHeight: "50vh" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full object-contain"
                style={{ maxHeight: "48vh" }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  videoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
                  setStep("select_source");
                }}
                className="px-6 py-2 rounded-sm border flex items-center gap-2"
                style={{ background: "transparent", borderColor: T.subtle, color: T.charcoal }}
              >
                <X size={16} />
                <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancelar</span>
              </button>
              <button
                onClick={capturePhoto}
                className="px-6 py-2 rounded-sm flex items-center gap-2"
                style={{ background: T.onyx, color: "#fff" }}
              >
                <Camera size={16} />
                <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Capturar</span>
              </button>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black" style={{ maxHeight: "40vh" }}>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full object-contain"
                style={{ maxHeight: "39vh" }}
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setStep("select_source");
                }}
                className="absolute top-2 right-2 p-2 rounded-full"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>

            {/* Validações visuais */}
            <div className="p-3 rounded-lg" style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}30` }}>
              <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>
                Checklist de Qualidade
              </p>
              <div className="space-y-1">
                {[
                  "Imagem nítida e bem iluminada",
                  "Rosto visível e frontal/semi-frontal",
                  "Apenas uma pessoa na imagem",
                  "Sem óculos escuros cobrindo o rosto"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check size={12} color={T.gold} />
                    <span style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consentimento LGPD */}
            <div className="p-3 rounded-lg" style={{ background: T.pearl, border: `1px solid ${T.subtle}` }}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="lgpd_consent"
                  checked={consentChecked}
                  onCheckedChange={setConsentChecked}
                  style={{ marginTop: 2 }}
                />
                <Label
                  htmlFor="lgpd_consent"
                  style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx, cursor: "pointer" }}
                >
                  Confirmo que a paciente autorizou o uso desta imagem para análise facial e simulação estética dentro da plataforma.
                </Label>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#EF444410", border: "1px solid #EF444430" }}>
                <AlertCircle size={16} color="#EF4444" />
                <span style={{ fontFamily: "Inter", fontSize: 11, color: "#EF4444" }}>{error}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setStep("select_source");
                }}
                className="px-6 py-2 rounded-sm border"
                style={{ background: "transparent", borderColor: T.subtle, color: T.charcoal }}
              >
                <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Voltar</span>
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !consentChecked}
                className="px-6 py-2 rounded-sm flex items-center gap-2 disabled:opacity-50"
                style={{ background: T.gold, color: T.pearl }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Gerar Simulação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={48} className="animate-spin" color={T.gold} />
            <p style={{ fontFamily: "Inter", fontSize: 13, color: T.onyx }}>
              Gerando simulação facial com IA. Isso pode levar alguns segundos.
            </p>
          </div>
        );

      case "result":
        return (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={generatedImage}
                alt="Simulação Gerada"
                className="w-full object-cover"
              />
            </div>

            {/* Relatório técnico */}
            {technicalReport && (
              <div className="p-3 rounded-lg" style={{ background: T.pearl, border: `1px solid ${T.subtle}` }}>
                <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: 6 }}>
                  Relatório Técnico
                </p>
                <p style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx, lineHeight: 1.5 }}>
                  {technicalReport}
                </p>
              </div>
            )}

            {/* Aviso legal */}
            <div className="p-3 rounded-lg" style={{ background: `${T.charcoal}10`, border: `1px solid ${T.subtle}` }}>
              <p style={{ fontFamily: "Inter", fontSize: 9, color: T.charcoal, lineHeight: 1.5 }}>
                <strong style={{ color: T.onyx }}>Aviso Legal:</strong> Imagem meramente ilustrativa, criada por inteligência artificial para apoio visual em consulta. O resultado real depende de avaliação profissional, anatomia individual, técnica utilizada e resposta biológica da paciente.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-sm border"
                style={{ background: "transparent", borderColor: T.subtle, color: T.charcoal }}
              >
                <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Fechar</span>
              </button>
              <a
                href={generatedImage}
                download={`simulacao_${patientName || "paciente"}.png`}
                className="px-6 py-2 rounded-sm"
                style={{ background: T.gold, color: T.pearl, fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                Baixar Imagem
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-lg flex flex-col"
        style={{
          background: T.white,
          border: `1px solid ${T.subtle}`,
          maxHeight: "95vh",
          minHeight: "40vh",
        }}
      >
        {/* Header fixo */}
        <div className="flex items-start justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.subtle}` }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: T.onyx }}>
              Gerar Antes e Depois com IA
            </h2>
            {patientName && (
              <p style={{ fontFamily: "Inter", fontSize: 11, color: T.charcoal, marginTop: 3 }}>
                Paciente: {patientName}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 flex-shrink-0">
            <X size={20} color={T.charcoal} />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}