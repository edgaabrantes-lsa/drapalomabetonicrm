import React, { useState, useRef } from "react";
import { Sparkles, Wand2, Crown, AlertCircle, RefreshCw, Download, Upload, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import BeforeAfterSlider from "./BeforeAfterSlider";

const MODES = [
  {
    id: "natural",
    label: "Resultado Natural",
    icon: Sparkles,
    desc: "Alterações ultra-suaves. Refinamento imperceptível.",
    intensity: "Intensidade: 10–20%",
    activeClass: "border-emerald-500 bg-emerald-500/10",
    textClass: "text-emerald-400",
  },
  {
    id: "moderado",
    label: "Resultado Moderado",
    icon: Wand2,
    desc: "Refinamentos visíveis e harmoniosos.",
    intensity: "Intensidade: 30–45%",
    activeClass: "border-amber-500 bg-amber-500/10",
    textClass: "text-amber-400",
  },
  {
    id: "premium",
    label: "Resultado Premium",
    icon: Crown,
    desc: "Máximo potencial estético com naturalidade.",
    intensity: "Intensidade: 55–70%",
    activeClass: "border-[#c9a55c] bg-[#c9a55c]/10",
    textClass: "text-[#c9a55c]",
  },
];

const PROGRESS_MESSAGES = [
  "Estamos analisando sua estrutura facial…",
  "Mapeando pontos de simetria e proporção…",
  "Preservando identidade facial original…",
  "Gerando simulação hiper-realista baseada na sua foto…",
  "Aplicando refinamentos conservadores e proporcionais…",
  "Validando naturalidade do resultado…",
  "Finalizando simulação premium…",
];

function buildPrompt(mode, mapData) {
  const regions = mapData?.regions?.map(r =>
    `${r.area}: ${r.intervention}`
  ).join("; ") || "subtle facial harmonization";

  const intensityMap = {
    natural: "10-20% intensity, very subtle, barely noticeable",
    moderado: "30-45% intensity, visible but harmonious",
    premium: "55-70% intensity, sophisticated full harmonization",
  };

  return `Photorealistic aesthetic simulation. Use the reference photo as the BASE IMAGE.

CRITICAL: This is the EXACT SAME PERSON. Preserve identity 100%.
Preserve: face shape, skin texture/pores, hair, background, clothing, lighting, shadows, expression, camera angle.
Do NOT change identity. Do NOT create a new face. Do NOT apply beauty filters or AI effects.

Apply ONLY these specific conservative improvements (${intensityMap[mode]}):
${regions}

The result must look like a real photograph of the same person after a natural, professional aesthetic procedure.
Medical-grade photorealism. NOT AI-generated looking. NOT filtered. NOT avatar.`;
}

// compress image to base64, max 1024px
const compressDataUrl = (dataUrl, maxWidth = 1024) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const dataUrlToFile = (dataUrl, name) => {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], name, { type: mime });
};

export default function SimulationPanel({ originalImageUrl, originalPreview, mapData }) {
  const [selectedMode, setSelectedMode] = useState("natural");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [view, setView] = useState("slider");
  const [retryCount, setRetryCount] = useState(0);

  // fallback: local upload within this panel
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  const activeImageUrl = originalImageUrl || localImageUrl;
  const activePreview = originalPreview || localPreview;

  const handleLocalFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((res) => {
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      });
      const compressed = await compressDataUrl(dataUrl);
      setLocalPreview(compressed);
      const f = dataUrlToFile(compressed, "simulation-photo.jpg");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setLocalImageUrl(file_url);
    } catch (err) {
      setError("Erro ao fazer upload da imagem. Tente novamente.");
      setErrorDetail(String(err?.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const generate = async (attempt = 1) => {
    const imgUrl = originalImageUrl || localImageUrl;
    if (!imgUrl) return;

    setIsGenerating(true);
    setError(null);
    setErrorDetail(null);
    setSimulation(null);
    setProgressIdx(0);
    setRetryCount(attempt - 1);

    const interval = setInterval(() => {
      setProgressIdx(prev => prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev);
    }, 3500);

    try {
      // On retry, use simpler prompt
      const prompt = attempt > 1
        ? `Subtle facial aesthetic enhancement of the person in the reference photo. Preserve identity, skin texture, hair, background, lighting. Apply only: ${mapData?.regions?.slice(0, 2).map(r => r.intervention).join(", ") || "gentle facial refinement"}. Photorealistic, same person.`
        : buildPrompt(selectedMode, mapData);

      console.log("[SimulationPanel] Generating simulation. Attempt:", attempt, "ImageURL:", imgUrl);
      console.log("[SimulationPanel] Prompt:", prompt.slice(0, 200));

      const result = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: [imgUrl],
      });

      console.log("[SimulationPanel] Raw result:", JSON.stringify(result));

      const url = result?.url || result?.image_url || result?.data?.[0]?.url || (typeof result === "string" ? result : null);

      if (!url) {
        throw new Error(`GenerateImage returned no URL. Result: ${JSON.stringify(result)}`);
      }

      console.log("[SimulationPanel] Simulation URL:", url);
      setSimulation(url);
    } catch (err) {
      const msg = err?.message || String(err);
      console.error("[SimulationPanel] Error:", msg);

      if (attempt < 2) {
        // Auto-retry once with simplified prompt
        console.log("[SimulationPanel] Auto-retrying with simplified prompt...");
        clearInterval(interval);
        setIsGenerating(false);
        setTimeout(() => generate(2), 1000);
        return;
      }

      setError("Não foi possível gerar a simulação. Tente novamente ou mude o modo.");
      setErrorDetail(msg);
    } finally {
      clearInterval(interval);
      setProgressIdx(PROGRESS_MESSAGES.length - 1);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!simulation) return;
    const a = document.createElement("a");
    a.href = simulation;
    a.download = `simulacao-${selectedMode}-paloma-betoni.jpg`;
    a.target = "_blank";
    a.click();
  };

  // ── No image available: show upload fallback ──
  if (!activeImageUrl && !isUploading) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400 mb-1">Foto não detectada</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Para gerar a simulação, você pode fazer upload da foto aqui diretamente, ou voltar à etapa de análise e realizar o processo completo primeiro.
              </p>
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => handleLocalFile(e.target.files?.[0])}
        />

        <Button
          onClick={() => fileRef.current?.click()}
          className="w-full h-14 bg-gradient-to-r from-[#c9a55c] to-[#a17f3f] hover:from-[#a17f3f] hover:to-[#8a6a30] text-black font-semibold rounded-xl gap-2"
        >
          <Upload className="h-5 w-5" />
          Carregar foto para simulação
        </Button>
      </div>
    );
  }

  // ── Uploading local file ──
  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-2 border-[#c9a55c]/40 border-t-[#c9a55c] rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Enviando sua foto…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photo confirmed */}
      {activePreview && !simulation && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <img src={activePreview} alt="Foto" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Foto pronta para simulação
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Identidade facial será 100% preservada</p>
          </div>
          {!originalImageUrl && (
            <button
              onClick={() => { setLocalImageUrl(null); setLocalPreview(null); fileRef.current?.click(); }}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Trocar
            </button>
          )}
        </div>
      )}

      {/* Mode selector */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Modo de resultado</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => { setSelectedMode(mode.id); setSimulation(null); setError(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${isActive ? mode.activeClass : "border-[#1e1e2a] bg-[#12121a] hover:border-[#2e2e3a]"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${isActive ? mode.textClass : "text-gray-500"}`} />
                  <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-400"}`}>{mode.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                <p className={`text-[10px] mt-2 font-medium ${isActive ? mode.textClass : "text-gray-600"}`}>{mode.intensity}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      {!simulation && !isGenerating && (
        <Button
          onClick={() => generate(1)}
          className="w-full h-14 bg-gradient-to-r from-[#c9a55c] to-[#a17f3f] hover:from-[#a17f3f] hover:to-[#8a6a30] text-black font-semibold text-base rounded-xl gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Gerar Simulação Hiper-Realista
        </Button>
      )}

      {/* Loading */}
      {isGenerating && (
        <div className="rounded-2xl border border-[#c9a55c]/20 bg-[#0d0d14] p-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-[#c9a55c]/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-[#c9a55c]/50 animate-spin" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#c9a55c] to-[#a17f3f] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-black" />
              </div>
            </div>
          </div>
          {retryCount > 0 && (
            <p className="text-center text-xs text-amber-400 mb-2">Tentativa {retryCount + 1} — usando prompt simplificado…</p>
          )}
          <p className="text-center text-white font-medium mb-1">{PROGRESS_MESSAGES[progressIdx]}</p>
          <p className="text-center text-gray-500 text-sm mb-5">Sua imagem está sendo processada com inteligência facial avançada.</p>
          <div className="w-full bg-[#1a1a25] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c9a55c] to-[#a17f3f] rounded-full transition-all duration-[3000ms] ease-out"
              style={{ width: `${((progressIdx + 1) / PROGRESS_MESSAGES.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4">Pode levar até 60 segundos</p>
        </div>
      )}

      {/* Error */}
      {error && !isGenerating && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              {errorDetail && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">Detalhes técnicos (admin)</summary>
                  <pre className="text-[10px] text-gray-600 mt-1 whitespace-pre-wrap break-all bg-black/30 p-2 rounded">{errorDetail}</pre>
                </details>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => generate(1)}
            className="w-full border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </Button>
        </div>
      )}

      {/* Result */}
      {simulation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              {["slider", "side"].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === v ? "bg-[#c9a55c] text-black" : "bg-[#1a1a25] text-gray-400 hover:text-white"}`}>
                  {v === "slider" ? "Slider" : "Lado a Lado"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSimulation(null); setError(null); }}
                className="text-gray-500 hover:text-white text-xs gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Regerar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}
                className="text-[#c9a55c] hover:text-[#d9bb82] text-xs gap-1">
                <Download className="h-3.5 w-3.5" /> Baixar
              </Button>
            </div>
          </div>

          <Card className="bg-[#c9a55c]/5 border-[#c9a55c]/15">
            <CardContent className="p-3 flex gap-2 items-start">
              <Sparkles className="h-4 w-4 text-[#c9a55c] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-[#c9a55c]">Simulação ilustrativa.</strong> Gerada por IA para fins de orientação estética. Resultados reais podem variar. Consulte a Dra. Paloma Betoni para avaliação presencial.
              </p>
            </CardContent>
          </Card>

          {view === "slider" && activePreview && (
            <div className="rounded-2xl overflow-hidden border border-[#1e1e2a]">
              <BeforeAfterSlider beforeUrl={activePreview} afterUrl={simulation} />
            </div>
          )}

          {view === "side" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl overflow-hidden border border-[#1e1e2a]">
                {activePreview ? (
                  <img src={activePreview} alt="Antes" className="w-full object-cover" style={{ maxHeight: 420 }} />
                ) : (
                  <div className="h-64 bg-[#12121a] flex items-center justify-center text-gray-600 text-xs">Foto original</div>
                )}
                <div className="bg-[#12121a] py-2 text-center text-xs text-gray-400 uppercase tracking-widest">Antes</div>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#c9a55c]/30">
                <img src={simulation} alt="Depois" className="w-full object-cover" style={{ maxHeight: 420 }} />
                <div className="bg-[#c9a55c]/10 py-2 text-center text-xs text-[#c9a55c] uppercase tracking-widest">
                  Depois · {MODES.find(m => m.id === selectedMode)?.label}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for fallback upload */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="hidden"
        onChange={(e) => handleLocalFile(e.target.files?.[0])} />
    </div>
  );
}