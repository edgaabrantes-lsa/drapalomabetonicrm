import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X, RotateCcw, Check, ChevronRight, AlertTriangle, Lightbulb, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

const ANGLE_STEPS = [
  {
    id: "frontal",
    label: "Frontal",
    instruction: "Olhe diretamente para a câmera",
    detail: "Mantenha o rosto neutro e centralizado",
    icon: "😐",
    guide: "center",
  },
  {
    id: "perfil_direito",
    label: "Perfil Direito",
    instruction: "Vire levemente para a direita",
    detail: "Mostre o perfil direito do seu rosto",
    icon: "➡️",
    guide: "right",
  },
  {
    id: "perfil_esquerdo",
    label: "Perfil Esquerdo",
    instruction: "Vire levemente para a esquerda",
    detail: "Mostre o perfil esquerdo do seu rosto",
    icon: "⬅️",
    guide: "left",
  },
];

const FaceOverlay = ({ guide, quality }) => {
  const borderColor = quality === "good" ? "#22c55e" : quality === "warn" ? "#f59e0b" : "#c9a55c";

  const offsetX = guide === "right" ? 30 : guide === "left" ? -30 : 0;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Darkened corners */}
      <defs>
        <mask id="faceMask">
          <rect width="400" height="500" fill="white" />
          <ellipse cx={200 + offsetX} cy="230" rx="120" ry="155" fill="black" />
        </mask>
      </defs>
      <rect width="400" height="500" fill="rgba(0,0,0,0.45)" mask="url(#faceMask)" />

      {/* Face outline ellipse */}
      <ellipse
        cx={200 + offsetX}
        cy="230"
        rx="120"
        ry="155"
        fill="none"
        stroke={borderColor}
        strokeWidth="2.5"
        strokeDasharray={quality === "good" ? "0" : "8 5"}
        style={{ transition: "stroke 0.4s ease, stroke-dasharray 0.4s ease" }}
      />

      {/* Corner ticks */}
      {[
        [200 + offsetX - 120, 230 - 155],
        [200 + offsetX + 120, 230 - 155],
        [200 + offsetX - 120, 230 + 155],
        [200 + offsetX + 120, 230 + 155],
      ].map(([x, y], i) => (
        <g key={i}>
          <line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke={borderColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={borderColor} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}

      {/* Center crosshair (frontal only) */}
      {guide === "center" && (
        <>
          <line x1="196" y1="215" x2="204" y2="215" stroke={borderColor} strokeWidth="1.5" opacity="0.6" />
          <line x1="200" y1="211" x2="200" y2="219" stroke={borderColor} strokeWidth="1.5" opacity="0.6" />
        </>
      )}
    </svg>
  );
};

export default function GuidedCamera({ onComplete, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState(0);
  const [captured, setCaptured] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [quality, setQuality] = useState("idle"); // idle | good | warn
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // user = frontal, environment = traseira

  const currentStep = ANGLE_STEPS[step];

  const startCamera = useCallback(async (mode = "user") => {
    setCameraError(null);
    setCameraReady(false);
    // Stop existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop());
    const constraints = {
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 960 },
      },
    };

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = mediaStream;
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        setCameraReady(true);
        setQuality("warn");
        setTimeout(() => setQuality("good"), 1500);
      };
    }
  }, []);

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    await startCamera(newMode).catch(() => {
      setCameraError("Não foi possível alternar a câmera.");
    });
  }, [facingMode, startCamera]);

  useEffect(() => {
    startCamera("user").catch(() => {
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
    });
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  // Simulate quality check when step changes
  useEffect(() => {
    if (!cameraReady) return;
    setQuality("warn");
    const t = setTimeout(() => setQuality("good"), 1200);
    return () => clearTimeout(t);
  }, [step, cameraReady]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Mirror only for front camera (selfie)
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  const handleCapture = () => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        const dataUrl = capturePhoto();
        if (!dataUrl) return;

        // Flash effect
        setFlash(true);
        setTimeout(() => setFlash(false), 300);

        const newCaptures = [
          ...captured,
          { type: currentStep.id, dataUrl, label: currentStep.label },
        ];
        setCaptured(newCaptures);

        if (step < ANGLE_STEPS.length - 1) {
          setStep(s => s + 1);
        } else {
          // Done — stop stream and return results
          streamRef.current?.getTracks().forEach(t => t.stop());
          onComplete(newCaptures);
        }
      }
    }, 1000);
  };

  const handleSkipAngle = () => {
    if (step < ANGLE_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      onComplete(captured);
    }
  };

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur-sm z-10">
        <div>
          <p className="text-xs text-[#c9a55c] uppercase tracking-widest font-medium">
            Clínica Premium · Dra. Paloma Betoni
          </p>
          <p className="text-white font-semibold">Captura Guiada</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}
          className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress steps */}
      <div className="flex justify-center gap-3 py-3 bg-black/60 z-10">
        {ANGLE_STEPS.map((s, i) => {
          const done = i < step || (i === step && captured.length > step);
          const active = i === step;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                done ? "border-emerald-500/50 bg-emerald-500/10" :
                active ? "border-[#c9a55c]/60 bg-[#c9a55c]/10" :
                "border-gray-700 bg-transparent"
              }`}>
                <span className="text-sm">{s.icon}</span>
                <span className={`text-xs font-medium ${
                  done ? "text-emerald-400" : active ? "text-[#c9a55c]" : "text-gray-600"
                }`}>{s.label}</span>
                {done && <Check className="h-3 w-3 text-emerald-400" />}
              </div>
              {i < ANGLE_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {cameraError ? (
          <div className="text-center px-8">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-2">Câmera indisponível</p>
            <p className="text-gray-400 text-sm">{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face overlay */}
            {cameraReady && (
              <FaceOverlay guide={currentStep.guide} quality={quality} />
            )}

            {/* Flash overlay */}
            {flash && (
              <div className="absolute inset-0 bg-white pointer-events-none z-30 animate-pulse" />
            )}

            {/* Countdown */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="w-24 h-24 rounded-full bg-black/60 border-2 border-[#c9a55c] flex items-center justify-center">
                  <span className="text-5xl font-bold text-[#c9a55c]">{countdown}</span>
                </div>
              </div>
            )}

            {/* Quality indicator */}
            {cameraReady && quality !== "idle" && countdown === null && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border z-10 transition-all ${
                quality === "good"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${quality === "good" ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
                <span className="text-xs font-medium">
                  {quality === "good" ? "Posição ideal" : "Ajustando posição..."}
                </span>
              </div>
            )}

            {/* Captured previews (small) */}
            {captured.length > 0 && (
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {captured.map((c, i) => (
                  <div key={i} className="relative">
                    <img src={c.dataUrl} alt={c.label}
                      className="w-14 h-14 object-cover rounded-lg border-2 border-emerald-500/60" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Instruction bar */}
      <div className="bg-black/90 backdrop-blur-sm px-5 pt-4 pb-2 z-10">
        {/* Tip */}
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-[#c9a55c] flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Vamos capturar sua imagem para uma análise facial de alta precisão.
            Isso garante máxima assertividade no seu diagnóstico personalizado.
          </p>
        </div>

        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-white">{currentStep.instruction}</p>
          <p className="text-sm text-gray-400">{currentStep.detail}</p>
        </div>

        {/* Guidelines */}
        <div className="flex flex-wrap justify-center gap-3 mb-4 text-xs text-gray-500">
          {["Rosto neutro", "Fundo claro", "Boa iluminação", "Sem óculos escuros"].map(tip => (
            <span key={tip} className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#c9a55c]" />
              {tip}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center pb-4 items-center">
          {/* Flip camera button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={flipCamera}
            disabled={!cameraReady || countdown !== null}
            className="w-12 h-12 rounded-full border border-gray-700 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-40"
            title={facingMode === "user" ? "Câmera traseira" : "Câmera frontal"}
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
          {step > 0 && (
            <Button variant="outline" onClick={handleSkipAngle}
              className="border-gray-700 text-gray-400 hover:text-white rounded-full px-5">
              Pular ângulo
            </Button>
          )}
          <button
            onClick={handleCapture}
            disabled={!cameraReady || countdown !== null}
            className="w-16 h-16 rounded-full border-4 border-[#c9a55c] bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center disabled:opacity-40 active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-[#c9a55c]" />
          </button>
          {captured.length > 0 && step < ANGLE_STEPS.length - 1 && (
            <Button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onComplete(captured); }}
              className="bg-[#c9a55c]/20 hover:bg-[#c9a55c]/30 text-[#c9a55c] border border-[#c9a55c]/30 rounded-full px-5">
              Analisar agora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}