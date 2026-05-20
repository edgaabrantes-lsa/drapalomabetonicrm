import React, { useState } from "react";
import { Sparkles, Wand2, Crown, AlertCircle, RefreshCw, Download, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import BeforeAfterSlider from "./BeforeAfterSlider";

const MODES = [
  {
    id: "natural",
    label: "Resultado Natural",
    icon: Sparkles,
    desc: "Alterações ultra-suaves e conservadoras. Imperceptível como estética.",
    intensity: "Intensidade: 10–20%",
    color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
    active: "border-emerald-500 bg-emerald-500/15",
  },
  {
    id: "moderado",
    label: "Resultado Moderado",
    icon: Wand2,
    desc: "Refinamentos visíveis e harmoniosos. Equilíbrio entre naturalidade e impacto.",
    intensity: "Intensidade: 30–45%",
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400",
    active: "border-amber-500 bg-amber-500/15",
  },
  {
    id: "premium",
    label: "Resultado Premium",
    icon: Crown,
    desc: "Harmonização completa e sofisticada. Máximo potencial estético.",
    intensity: "Intensidade: 55–70%",
    color: "border-[#c9a55c]/40 bg-[#c9a55c]/5 text-[#c9a55c]",
    active: "border-[#c9a55c] bg-[#c9a55c]/15",
  },
];

const PROGRESS_MESSAGES = [
  "Estamos analisando sua estrutura facial.",
  "Mapeando pontos de simetria e proporção.",
  "Preservando identidade facial original.",
  "Gerando simulação hiper-realista baseada na sua foto.",
  "Aplicando refinamentos conservadores e proporcionais.",
  "Validando naturalidade do resultado.",
  "Finalizando simulação premium…",
];

function buildSimulationPrompt(mode, mapData, imageUrl) {
  const regions = mapData?.regions?.map(r => {
    const priority = r.marker === "red" || r.priority === "alto" ? "importante" : "sutil";
    return `${r.area} (${r.intervention}, melhoria ${priority})`;
  }).join(", ") || "harmonização facial geral";

  const intensityMap = {
    natural: "very subtle, barely noticeable (10-20% intensity), ultra-conservative changes",
    moderado: "moderate, harmonious improvements (30-45% intensity), visible but natural",
    premium: "sophisticated full harmonization (55-70% intensity), maximum natural potential",
  };

  const intensity = intensityMap[mode];

  return `HYPER-REALISTIC AESTHETIC SIMULATION — SAME PERSON, SAME PHOTO.

CRITICAL RULES:
- This MUST be the EXACT SAME PERSON from the reference photo
- Keep 90-95% of the image IDENTICAL: skin texture, pores, hair, background, clothing, lighting, shadows, expression, camera angle
- Do NOT change identity, do NOT create a new face, do NOT apply beauty filters
- Do NOT make it look AI-generated or fake
- The result must look like a real photograph taken after a real aesthetic procedure

ENHANCEMENT AREAS (apply ${intensity}):
${regions}

PRESERVATION REQUIREMENTS:
- Same skin tone and texture
- Same hair and hairline
- Same background and environment
- Same facial expression
- Same head angle and camera perspective
- Same clothing/outfit
- Same lighting and shadows
- Natural skin imperfections preserved

STYLE: Medical-grade photorealistic result. NOT Instagram filter. NOT beauty app filter. NOT AI avatar. Looks like a real photo of the same person after professional aesthetic treatment.

${mode === "natural" ? "Changes should be so subtle that most people would not notice they are retouched." : ""}
${mode === "premium" ? "Show the full aesthetic potential while maintaining 100% recognizable identity." : ""}`;
}

export default function SimulationPanel({ originalImageUrl, originalPreview, mapData }) {
  const [selectedMode, setSelectedMode] = useState("natural");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState(0);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("slider"); // slider | side | zoom

  const generate = async () => {
    if (!originalImageUrl) return;
    setIsGenerating(true);
    setError(null);
    setSimulation(null);
    setProgressMsg(0);

    const interval = setInterval(() => {
      setProgressMsg(prev => (prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 3500);

    try {
      const prompt = buildSimulationPrompt(selectedMode, mapData, originalImageUrl);
      const result = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: [originalImageUrl],
      });
      setSimulation(result?.url);
    } catch (err) {
      setError("Erro ao gerar simulação. Por favor, tente novamente.");
    } finally {
      clearInterval(interval);
      setProgressMsg(PROGRESS_MESSAGES.length - 1);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!simulation) return;
    const a = document.createElement("a");
    a.href = simulation;
    a.download = `simulacao-${selectedMode}-paloma-betoni.jpg`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Selecione o modo de resultado</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => { setSelectedMode(mode.id); setSimulation(null); setError(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${isActive ? mode.active : "border-[#1e1e2a] bg-[#12121a] hover:border-[#2e2e3a]"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${isActive ? mode.color.split(" ")[2] : "text-gray-500"}`} />
                  <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-400"}`}>{mode.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                <p className={`text-[10px] mt-2 font-medium ${isActive ? mode.color.split(" ")[2] : "text-gray-600"}`}>{mode.intensity}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      {!simulation && !isGenerating && (
        <Button
          onClick={generate}
          disabled={!originalImageUrl}
          className="w-full h-14 bg-gradient-to-r from-[#c9a55c] to-[#a17f3f] hover:from-[#a17f3f] hover:to-[#8a6a30] text-black font-semibold text-base rounded-xl disabled:opacity-40"
        >
          <Sparkles className="h-5 w-5 mr-2" />
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
          <p className="text-center text-white font-medium mb-1">{PROGRESS_MESSAGES[progressMsg]}</p>
          <p className="text-center text-gray-500 text-sm mb-5">Sua imagem está sendo processada com inteligência facial avançada.</p>
          <div className="w-full bg-[#1a1a25] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c9a55c] to-[#a17f3f] rounded-full transition-all duration-[3000ms] ease-out"
              style={{ width: `${((progressMsg + 1) / PROGRESS_MESSAGES.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-[10px] text-gray-700 mt-4">
            Processamento pode levar até 30–60 segundos · Identidade facial 100% preservada
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={generate} className="text-red-400 hover:text-red-300 text-xs gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </Button>
        </div>
      )}

      {/* Result */}
      {simulation && originalPreview && (
        <div className="space-y-4">
          {/* View mode controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { id: "slider", label: "Slider Antes/Depois" },
                { id: "side", label: "Lado a Lado" },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === v.id ? "bg-[#c9a55c] text-black" : "bg-[#1a1a25] text-gray-400 hover:text-white"}`}
                >
                  {v.label}
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

          {/* Disclaimer */}
          <Card className="bg-[#c9a55c]/5 border-[#c9a55c]/15">
            <CardContent className="p-3 flex gap-2 items-start">
              <Sparkles className="h-4 w-4 text-[#c9a55c] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-[#c9a55c]">Simulação ilustrativa.</strong> Esta imagem é gerada por inteligência artificial para fins de orientação estética. Resultados reais podem variar. Consulte a Dra. Paloma Betoni para avaliação presencial.
              </p>
            </CardContent>
          </Card>

          {/* Slider view */}
          {view === "slider" && (
            <div className="rounded-2xl overflow-hidden border border-[#1e1e2a]">
              <BeforeAfterSlider beforeUrl={originalPreview} afterUrl={simulation} />
            </div>
          )}

          {/* Side by side view */}
          {view === "side" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl overflow-hidden border border-[#1e1e2a]">
                <img src={originalPreview} alt="Antes" className="w-full object-contain" style={{ maxHeight: 400 }} />
                <div className="bg-[#12121a] py-2 text-center text-xs text-gray-400 uppercase tracking-widest">Antes</div>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#c9a55c]/30">
                <img src={simulation} alt="Depois" className="w-full object-contain" style={{ maxHeight: 400 }} />
                <div className="bg-[#c9a55c]/10 py-2 text-center text-xs text-[#c9a55c] uppercase tracking-widest">Depois · {MODES.find(m => m.id === selectedMode)?.label}</div>
              </div>
            </div>
          )}

          {/* Mode badge */}
          <div className="flex justify-center">
            {(() => {
              const m = MODES.find(m => m.id === selectedMode);
              const Icon = m.icon;
              return (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${m.active}`}>
                  <Icon className={`h-3.5 w-3.5 ${m.color.split(" ")[2]}`} />
                  <span className={`text-xs font-medium ${m.color.split(" ")[2]}`}>{m.label}</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}