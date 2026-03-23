import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload, Sparkles, Brain, ChevronDown, ChevronUp,
  FileText, Star, Target, Zap, Eye, User, Shield,
  Download, RefreshCw, Camera, AlertCircle, CheckCircle2,
  TrendingUp, Layers, Clipboard, ImagePlus, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import GuidedCamera from "@/components/facial/GuidedCamera";

const HOF_SYSTEM_PROMPT = `Você é um especialista em harmonização orofacial (HOF), estética avançada e análise estrutural da face humana, trabalhando para a Clínica Premium da Dra. Paloma Betoni.

Sua função é realizar uma análise facial completa, técnica e estratégica a partir da imagem enviada, simulando o olhar de um especialista de alto padrão.

Siga RIGOROSAMENTE esta estrutura de resposta em Markdown:

---

## 1. LEITURA ESTRUTURAL COMPLETA

Analise tecnicamente:
- Simetria facial (direita vs esquerda)
- Proporção dos terços faciais (superior, médio, inferior)
- Proporção horizontal (regra dos quintos)
- Ângulos faciais (mandibular, nasolabial, mentolabial)
- Projeção óssea (malar, mento, mandíbula)
- Volume e sustentação dos tecidos
- Qualidade da pele (visual)
- Padrão de envelhecimento (se aplicável)

---

## 2. IDENTIFICAÇÃO DE ASSIMETRIAS

Aponte diferenças visíveis entre lados do rosto, desvios estruturais, perda de volume desigual e compensações musculares.

---

## 3. MAPEAMENTO DE PONTOS DE MELHORIA

Para cada ponto, apresente: Região | Problema identificado | Impacto estético | Grau de prioridade (baixo, médio, alto)

---

## 4. DIAGNÓSTICO ESTRATÉGICO

- Tipo de face
- Pontos fortes (valorize muito!)
- Pontos que limitam a harmonia
- Percepção geral

---

## 5. SUGESTÃO DE PROTOCOLOS HOF

Utilize APENAS estes procedimentos padronizados (quando aplicável):
- Preenchimento full face
- Preenchimento labial
- Rinomodelação
- Preenchimento de mento
- Preenchimento malar
- Preenchimento de ângulo de mandíbula
- Preenchimento pré-jowls
- Preenchimento de têmpora
- Preenchimento cauda da sobrancelha
- Preenchimento de olheira
- Preenchimento pré-maxila
- Preenchimento fossa nasal
- Toxina botulínica

Para cada sugestão: Nome | Justificativa técnica | Resultado esperado

---

## 6. PLANO DE HARMONIZAÇÃO

- Ordem de execução
- Estratégia (natural vs marcante)
- Impacto esperado após protocolo completo

---

## 🔬 VERSÃO TÉCNICA (PROFISSIONAL)
Resumo em linguagem clínica e objetiva para o prontuário.

---

## 💬 VERSÃO PARA A PACIENTE
Linguagem simples, acolhedora, emocional e motivadora. Nunca use linguagem negativa. Valorize pontos positivos. Posicione como refinamento e melhoria.

---

REGRAS IMPORTANTES:
- Nunca critique o paciente
- Nunca use linguagem negativa direta
- Sempre valorize pontos positivos
- Trabalhe com análise visual e probabilidade (não afirme com 100% de certeza)
- Mantenha postura de especialista premium
- Não invente diagnósticos médicos`;

const SectionCard = ({ icon: Icon, title, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${open ? "border-[#c9a55c]/30" : "border-[#1e1e2a]"}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-5 text-left transition-all ${open ? "bg-gradient-to-r from-[#c9a55c]/10 to-transparent" : "bg-[#12121a] hover:bg-[#1a1a25]"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-medium text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {open && (
        <div className="p-5 bg-[#0d0d14] border-t border-[#1e1e2a]">
          {children}
        </div>
      )}
    </div>
  );
};

const MarkdownContent = ({ content }) => (
  <ReactMarkdown
    className="text-gray-300 text-sm leading-relaxed"
    components={{
      h1: ({ children }) => <h1 className="text-lg font-semibold text-white mb-3">{children}</h1>,
      h2: ({ children }) => <h2 className="text-base font-semibold text-[#c9a55c] mb-2 mt-4">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-2 mt-3">{children}</h3>,
      p: ({ children }) => <p className="mb-3 text-gray-300 leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="space-y-1.5 mb-3 ml-1">{children}</ul>,
      li: ({ children }) => (
        <li className="flex items-start gap-2 text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a55c] mt-2 flex-shrink-0" />
          <span>{children}</span>
        </li>
      ),
      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
      hr: () => <hr className="border-[#1e1e2a] my-4" />,
    }}
  >
    {content}
  </ReactMarkdown>
);

// Parse the AI response into named sections
const parseAnalysis = (text) => {
  const sections = {
    structural: "",
    asymmetries: "",
    improvements: "",
    diagnostic: "",
    protocols: "",
    plan: "",
    technical: "",
    patient: "",
    raw: text,
  };

  const patterns = [
    { key: "structural",   start: "## 1. LEITURA ESTRUTURAL",       end: "## 2." },
    { key: "asymmetries",  start: "## 2. IDENTIFICAÇÃO",            end: "## 3." },
    { key: "improvements", start: "## 3. MAPEAMENTO",               end: "## 4." },
    { key: "diagnostic",   start: "## 4. DIAGNÓSTICO",              end: "## 5." },
    { key: "protocols",    start: "## 5. SUGESTÃO",                 end: "## 6." },
    { key: "plan",         start: "## 6. PLANO",                    end: "## 🔬" },
    { key: "technical",    start: "## 🔬 VERSÃO TÉCNICA",           end: "## 💬" },
    { key: "patient",      start: "## 💬 VERSÃO PARA",              end: null },
  ];

  for (const p of patterns) {
    const startIdx = text.indexOf(p.start);
    if (startIdx === -1) continue;
    const endIdx = p.end ? text.indexOf(p.end, startIdx + p.start.length) : text.length;
    sections[p.key] = text.slice(startIdx, endIdx === -1 ? text.length : endIdx).trim();
  }

  return sections;
};

export default function FacialAnalysis() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // Multi-angle captures: [{type, dataUrl, label}]
  const [capturedAngles, setCapturedAngles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [parsedSections, setParsedSections] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("structured");
  const [showCamera, setShowCamera] = useState(false);
  const [inputMode, setInputMode] = useState(null); // null | 'upload' | 'camera'
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Por favor, selecione um arquivo de imagem."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Imagem muito grande. Máximo 10MB."); return; }
    setError(null);
    setImageFile(file);
    setCapturedAngles([]);
    setAnalysis(null);
    setParsedSections(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setInputMode("upload");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect({ target: { files: [file] } });
  };

  // Called when GuidedCamera finishes capturing
  const handleCameraComplete = (captures) => {
    setShowCamera(false);
    if (!captures || captures.length === 0) return;
    setCapturedAngles(captures);
    setImagePreview(captures[0].dataUrl);
    setImageFile(null);
    setAnalysis(null);
    setParsedSections(null);
    setInputMode("camera");
  };

  const removeAngle = (idx) => {
    const updated = capturedAngles.filter((_, i) => i !== idx);
    setCapturedAngles(updated);
    if (updated.length > 0) setImagePreview(updated[0].dataUrl);
    else { setImagePreview(null); setInputMode(null); }
  };

  // Convert base64 dataUrl → File blob for upload
  const dataUrlToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
  };

  const runAnalysis = async () => {
    const hasUpload = inputMode === "upload" && imageFile;
    const hasCamera = inputMode === "camera" && capturedAngles.length > 0;
    if (!hasUpload && !hasCamera) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setParsedSections(null);

    let fileUrls = [];

    if (hasUpload) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      fileUrls = [file_url];
    } else {
      // Upload all captured angles in parallel
      const uploads = await Promise.all(
        capturedAngles.map((c, i) => {
          const file = dataUrlToFile(c.dataUrl, `facial_${c.type}_${i}.jpg`);
          return base44.integrations.Core.UploadFile({ file });
        })
      );
      fileUrls = uploads.map(u => u.file_url);
    }

    const angleContext = hasCamera && capturedAngles.length > 1
      ? `\n\nIMPORTANTE: Foram fornecidas ${capturedAngles.length} imagens: ${capturedAngles.map(c => c.label).join(", ")}. Cruze as informações de todos os ângulos para uma análise mais precisa. Identifique cada ângulo e use-os de forma complementar.`
      : "";

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: HOF_SYSTEM_PROMPT + angleContext + "\n\nAnalise as imagens faciais fornecidas e gere o laudo completo seguindo exatamente a estrutura solicitada.",
      file_urls: fileUrls,
      model: "claude_sonnet_4_6",
    });

    const text = typeof result === "string" ? result : JSON.stringify(result);
    setAnalysis(text);
    setParsedSections(parseAnalysis(text));
    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    setImageFile(null);
    setImagePreview(null);
    setCapturedAngles([]);
    setAnalysis(null);
    setParsedSections(null);
    setError(null);
    setInputMode(null);
  };

  const canAnalyze = (inputMode === "upload" && imageFile) || (inputMode === "camera" && capturedAngles.length > 0);

  const sections = [
    {
      key: "structural",
      icon: Layers,
      title: "1. Leitura Estrutural Completa",
      color: "bg-blue-500/20 text-blue-400",
      defaultOpen: true,
    },
    {
      key: "asymmetries",
      icon: Eye,
      title: "2. Identificação de Assimetrias",
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      key: "improvements",
      icon: Target,
      title: "3. Mapeamento de Pontos de Melhoria",
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      key: "diagnostic",
      icon: Brain,
      title: "4. Diagnóstico Estratégico",
      color: "bg-emerald-500/20 text-emerald-400",
    },
    {
      key: "protocols",
      icon: Zap,
      title: "5. Sugestão de Protocolos HOF",
      color: "bg-[#c9a55c]/20 text-[#c9a55c]",
    },
    {
      key: "plan",
      icon: Clipboard,
      title: "6. Plano de Harmonização",
      color: "bg-pink-500/20 text-pink-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Guided camera fullscreen */}
      {showCamera && (
        <GuidedCamera
          onComplete={handleCameraComplete}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a55c] to-[#a17f3f] flex items-center justify-center">
              <Brain className="h-5 w-5 text-black" />
            </div>
            Análise Facial com IA
          </h1>
          <p className="text-gray-400 mt-1">
            Laudo HOF completo gerado por inteligência artificial especializada
          </p>
        </div>
        {analysis && (
          <Button variant="outline" onClick={resetAnalysis}
            className="border-[#1e1e2a] text-gray-400 hover:text-white">
            <RefreshCw className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        )}
      </div>

      {/* Input area — only show before analysis */}
      {!analysis && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Image input */}
          <div className="space-y-3">
            {/* Mode selector */}
            {!inputMode && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setInputMode("upload"); setTimeout(() => fileInputRef.current?.click(), 50); }}
                  className="flex flex-col items-center gap-3 p-6 bg-[#12121a] hover:bg-[#1a1a25] border border-[#1e1e2a] hover:border-[#c9a55c]/30 rounded-2xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#c9a55c]/10 flex items-center justify-center group-hover:bg-[#c9a55c]/20 transition-all">
                    <Upload className="h-7 w-7 text-[#c9a55c]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium text-sm">Enviar Foto</p>
                    <p className="text-gray-500 text-xs mt-0.5">JPG, PNG, WEBP</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowCamera(true)}
                  className="flex flex-col items-center gap-3 p-6 bg-[#12121a] hover:bg-[#1a1a25] border border-[#1e1e2a] hover:border-[#c9a55c]/30 rounded-2xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#c9a55c]/10 flex items-center justify-center group-hover:bg-[#c9a55c]/20 transition-all">
                    <Camera className="h-7 w-7 text-[#c9a55c]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium text-sm">Câmera Guiada</p>
                    <p className="text-gray-500 text-xs mt-0.5">Multi-ângulo · Premium</p>
                  </div>
                  <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] text-[10px] px-2 py-0">
                    Recomendado
                  </Badge>
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            {/* Upload drop zone */}
            {inputMode === "upload" && (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center min-h-[260px] rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  imagePreview ? "border-[#c9a55c]/50 bg-[#c9a55c]/5" : "border-[#1e1e2a] hover:border-[#c9a55c]/30 hover:bg-[#c9a55c]/5 bg-[#12121a]"
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Prévia" className="max-h-[240px] max-w-full object-contain rounded-xl" />
                    <button onClick={(e) => { e.stopPropagation(); resetAnalysis(); }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center px-8">
                    <Upload className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Arraste ou clique para enviar</p>
                    <p className="text-gray-500 text-sm">JPG, PNG, WEBP — máx. 10MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Camera multi-angle result */}
            {inputMode === "camera" && capturedAngles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400 font-medium">{capturedAngles.length} ângulo{capturedAngles.length > 1 ? "s" : ""} capturado{capturedAngles.length > 1 ? "s" : ""}</p>
                  <button onClick={() => setShowCamera(true)}
                    className="text-xs text-[#c9a55c] hover:underline flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    Recapturar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {capturedAngles.map((c, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-[#c9a55c]/20">
                      <img src={c.dataUrl} alt={c.label} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button onClick={() => removeAngle(i)}
                          className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center">
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1 px-2">
                        <p className="text-[10px] text-[#c9a55c] font-medium">{c.label}</p>
                      </div>
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ))}
                  {/* Add more button */}
                  {capturedAngles.length < 3 && (
                    <button onClick={() => setShowCamera(true)}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#1e1e2a] hover:border-[#c9a55c]/30 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-[#c9a55c] transition-all">
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Adicionar</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Change mode link */}
            {inputMode && !analysis && (
              <button onClick={resetAnalysis} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                ← Alterar modo de captura
              </button>
            )}
          </div>

          {/* Right: Info + CTA */}
          <div className="space-y-4">
            <Card className="bg-[#12121a] border-[#1e1e2a]">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-[#c9a55c]" />
                  <h3 className="font-semibold text-white">O que este laudo inclui</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Layers, text: "Leitura estrutural da face (proporções, ângulos, simetria)" },
                    { icon: Eye, text: "Mapeamento de assimetrias e compensações musculares" },
                    { icon: Target, text: "Pontos de melhoria com grau de prioridade" },
                    { icon: Brain, text: "Diagnóstico estratégico do tipo facial" },
                    { icon: Zap, text: "Protocolos HOF sugeridos com justificativa técnica" },
                    { icon: Clipboard, text: "Plano de harmonização estruturado" },
                    { icon: User, text: "Versão para paciente em linguagem acessível" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#c9a55c]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-3.5 w-3.5 text-[#c9a55c]" />
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#c9a55c]/5 border-[#c9a55c]/20">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-[#c9a55c] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Aviso de uso profissional</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Esta análise é gerada por IA com fins de apoio clínico.
                      Deve ser revisada e validada por profissional habilitado.
                      Não substitui consulta médica ou odontológica.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={runAnalysis}
              disabled={!canAnalyze || isAnalyzing}
              className="w-full h-14 bg-gradient-to-r from-[#c9a55c] to-[#a17f3f] hover:from-[#a17f3f] hover:to-[#8a6a30] text-black font-semibold text-base rounded-xl disabled:opacity-40"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Analisando face com IA...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  Gerar Análise Facial
                  {capturedAngles.length > 1 && (
                    <Badge className="bg-black/20 text-black text-xs">
                      {capturedAngles.length} ângulos
                    </Badge>
                  )}
                </div>
              )}
            </Button>

            {isAnalyzing && (
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  {capturedAngles.length > 1
                    ? `Processando ${capturedAngles.length} ângulos com modelo avançado de visão...`
                    : "Processando com modelo avançado de visão..."}
                </p>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-[#c9a55c] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && parsedSections && (
        <div className="space-y-6">
          {/* Image + Quick Summary Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Thumbnail */}
            <div className="flex flex-col items-center gap-3">
              <img src={imagePreview} alt="Analisada"
                className="w-full max-h-60 object-contain rounded-2xl border border-[#c9a55c]/20" />
              <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Análise concluída
              </Badge>
            </div>

            {/* Quick info */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              {[
                { label: "Modelo IA",       value: "Claude Sonnet",       icon: Brain,       color: "text-purple-400" },
                { label: "Protocolo",        value: "HOF Premium",         icon: Star,        color: "text-[#c9a55c]" },
                { label: "Clínica",          value: "Dra. Paloma Betoni",  icon: User,        color: "text-emerald-400" },
                { label: "Tipo de Análise",  value: "Facial Completa",     icon: TrendingUp,  color: "text-blue-400" },
              ].map(item => (
                <div key={item.label} className="p-4 bg-[#12121a] border border-[#1e1e2a] rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                  <p className="text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs: Structured vs Raw */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
              <TabsTrigger value="structured"
                className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
                <Layers className="mr-2 h-4 w-4" />
                Laudo Estruturado
              </TabsTrigger>
              <TabsTrigger value="patient"
                className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                <User className="mr-2 h-4 w-4" />
                Versão para Paciente
              </TabsTrigger>
              <TabsTrigger value="technical"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <FileText className="mr-2 h-4 w-4" />
                Versão Técnica
              </TabsTrigger>
              <TabsTrigger value="raw"
                className="data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-300">
                Laudo Completo
              </TabsTrigger>
            </TabsList>

            {/* Structured Tab */}
            <TabsContent value="structured" className="mt-5 space-y-3">
              {sections.map(sec => (
                <SectionCard
                  key={sec.key}
                  icon={sec.icon}
                  title={sec.title}
                  color={sec.color}
                  defaultOpen={sec.defaultOpen}
                >
                  {parsedSections[sec.key] ? (
                    <MarkdownContent content={parsedSections[sec.key]} />
                  ) : (
                    <p className="text-gray-500 text-sm italic">Seção não disponível na análise.</p>
                  )}
                </SectionCard>
              ))}
            </TabsContent>

            {/* Patient Tab */}
            <TabsContent value="patient" className="mt-5">
              <Card className="bg-gradient-to-br from-emerald-950/40 to-[#12121a] border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-emerald-400">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                    💬 Mensagem para a Paciente
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Linguagem simplificada, acolhedora e motivadora
                  </p>
                </CardHeader>
                <CardContent>
                  {parsedSections.patient ? (
                    <MarkdownContent content={parsedSections.patient} />
                  ) : (
                    <MarkdownContent content={parsedSections.raw} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical" className="mt-5">
              <Card className="bg-gradient-to-br from-blue-950/40 to-[#12121a] border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-blue-400">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    🔬 Laudo Técnico — Prontuário
                  </CardTitle>
                  <p className="text-sm text-gray-500">Linguagem clínica para uso interno</p>
                </CardHeader>
                <CardContent>
                  {parsedSections.technical ? (
                    <MarkdownContent content={parsedSections.technical} />
                  ) : (
                    <MarkdownContent content={parsedSections.raw} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Raw Tab */}
            <TabsContent value="raw" className="mt-5">
              <Card className="bg-[#0d0d14] border-[#1e1e2a]">
                <CardContent className="p-6">
                  <MarkdownContent content={parsedSections.raw} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}