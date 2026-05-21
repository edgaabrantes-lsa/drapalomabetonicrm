import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload, Sparkles, Brain, ChevronDown, ChevronUp,
  FileText, Star, Target, Zap, Eye, User, Shield,
  Download, RefreshCw, Camera, AlertCircle, CheckCircle2,
  TrendingUp, Layers, Clipboard, ImagePlus, X, Check, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import GuidedCamera from "@/components/facial/GuidedCamera";
import FacialMapDisplay from "@/components/facial/FacialMapDisplay";
import SimulationPanel from "@/components/facial/SimulationPanel";

const HOF_SYSTEM_PROMPT = `Você é um especialista em harmonização orofacial (HOF), estética avançada e análise estrutural da face humana, trabalhando para a Clínica Premium da Dra. Paloma Betoni.

PROTOCOLOS PREMIUM DISPONÍVEIS NA CLÍNICA:

1. **Preenchimento Full Face** (R$ 20.000 ou R$ 1.700/ml) - Reposicionamento global, malar, mandíbula, mento, têmporas, olheiras, pré-jowls, sulcos
2. **Preenchimento Labial** (R$ 2.997) - Definição, hidratação, contorno e volumização labial
3. **Rinomodelação** (R$ 6.997) - Correção estética nasal sem cirurgia (giba, ponta caída, assimetria)
4. **Preenchimento de Mento** (R$ 4.500) - Projetar e equilibrar o queixo
5. **Preenchimento Malar** (R$ 3.500) - Reposição de volume e sustentação
6. **Preenchimento de Mandíbula** (R$ 4.500) - Definição mandibular e estruturação
7. **Preenchimento Pré-Jowls** (R$ 3.500) - Correção de depressões e suavização da linha mandibular
8. **Preenchimento de Têmpora** (R$ 3.500) - Reposição volumétrica lateral
9. **Preenchimento Cauda da Sobrancelha** (R$ 3.000) - Elevação e sustentação lateral
10. **Preenchimento de Olheira** (R$ 3.500) - Suavização do aspecto cansado
11. **Preenchimento Pré-Maxila** (R$ 3.500) - Sustentação central e terço médio
12. **Preenchimento de Fossa Nasal** (R$ 3.500) - Correção estrutural lateral nasal
13. **Toxina Botulínica - Terço Superior** (R$ 3.500) - Testa, glabela, pés de galinha
14. **Toxina Botulínica - Terço Inferior** (R$ 3.500) - Sorriso gengival, código de barras, queixo
15. **Ultra Toxina Pescoço+Inferior+Superior** (R$ 6.000) - Bandas platismais, flacidez cervical
16. **Bruxismo** (R$ 3.500) - Relaxamento do masseter
17. **Fios de Tração** (R$ 7.000-15.000) - Lifting sem cirurgia
18. **Fios Lisos** (R$ 7.000-15.000) - Bioestimulação e textura
19. **Bioestimulador - Rosto** (R$ 4.000) - Sculptra, Radiesse, Elleva, HarmonyCa
20. **Bioestimulador - Pescoço** (R$ 4.500) - Flacidez cervical
21. **Microagulhamento com Peptídeos** (R$ 2.800) - Poros, acne, textura, viço
22. **Enzimas para Papada** (R$ 2.000) - Redução de gordura submentoniana

SEMPRE sugira protocolos REAIS desta lista acima, usando os nomes exatos e valores.

Sua função é transformar a imagem facial do paciente em um MAPA VISUAL DE MELHORIA ESTÉTICA, baseado em referência de harmonia facial ideal, comparação proporcional, identificação de desvios estruturais, sugestão estratégica de intervenção e conexão direta com protocolos HOF.

BASE DE ANÁLISE — ROSTO IDEAL DE REFERÊNCIA:
- Simetria equilibrada entre lados
- Proporção harmônica entre terços faciais (superior, médio, inferior)
- Harmonia entre: malar × mandíbula, mento × projeção labial, olhos × distância nasal
- Estrutura bem definida (ângulos e contorno)
⚠️ A IA nunca critica — sugere melhorias com base em potencial estético.

Siga RIGOROSAMENTE esta estrutura de resposta em Markdown:

---

## 1. LEITURA ESTRUTURAL COMPLETA

Analise tecnicamente comparando com o padrão de harmonia ideal:
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

Aponte diferenças visíveis entre lados do rosto, desvios estruturais e oportunidades de equilíbrio.

---

## 3. MAPEAMENTO DE PONTOS DE MELHORIA

SISTEMA DE PONTUAÇÃO VISUAL — para cada região identifique o marcador correto:
🔴 MARCADOR VERMELHO = melhoria estrutural relevante (ex: falta de mandíbula, mento retraído, perda de sustentação, desproporcionalidade significativa)
🔶 MARCADOR AMARELO = melhoria leve/moderada (ex: falta de leve projeção, pequeno desequilíbrio, olheira leve, potencial de refinamento)

Para cada ponto: Região | Marcador (🔴 ou 🔶) | Desvio em relação ao ideal | Oportunidade de harmonização | Grau de prioridade

Use linguagem consultiva:
- "Pode se beneficiar de…"
- "Existe potencial de melhoria em…"
- "Estruturalmente, essa região permite evolução…"

---

## 4. DIAGNÓSTICO ESTRATÉGICO

- Tipo de face e estrutura predominante
- Pontos fortes (valorize muito!)
- Regiões com maior potencial de transformação
- Percepção geral e objetivo estético

---

## 5. PROTOCOLOS HOF INDICADOS

### 🔹 PROTOCOLO PRINCIPAL (OBRIGATÓRIO — escolha UM):
Selecione com base na prioridade estrutural identificada:
- Estrutura completa → **Sculpt Full Face Protocol**
- Equilíbrio proporcional → **Facial Balance Protocol**
- Sustentação e lifting → **Lift & Structure Protocol**
- Foco em lábios → **Lip Design Atelier**
- Qualidade de pele → **Skin Regeneration Protocol**
- Pescoço e contorno → **Neck & Contour Protocol**

### 🔹 PROTOCOLOS COMPLEMENTARES (se aplicável):
Liste até 2-3 adicionais com justificativa

### 🪶 EXPERIÊNCIA DE ENTRADA (quando aplicável):
**Atelier de Estrutura Facial** — como porta de entrada estratégica

### 🔹 PLANO DE CONTINUIDADE:
Com base no perfil, recomende:
- Manutenção → Continuum Essentia
- Evolução → Continuum Refinement
- Gestão completa → Continuum Sovereign
- Alto padrão → Maison Privé

---

## 6. PLANO DE HARMONIZAÇÃO

- Ordem de execução (sessões)
- Estratégia (natural vs marcante)
- Impacto esperado após protocolo completo

---

## 🔬 VERSÃO TÉCNICA (PROFISSIONAL)
Resumo em linguagem clínica e objetiva para o prontuário.

---

## 💬 VERSÃO PARA A PACIENTE
Linguagem simples, acolhedora, emocional e motivadora. Nunca use linguagem negativa. Valorize pontos positivos. Use "pode se beneficiar de…" e "existe potencial em…". Posicione como refinamento e evolução.

---

REGRAS OBRIGATÓRIAS:
- Nunca critique — sempre sugira com base em potencial
- Nunca use linguagem negativa direta
- Sempre valorize pontos positivos primeiro
- Use análise visual e probabilidade (não afirme com 100% de certeza)
- Mantenha postura de especialista premium consultivo
- Não invente diagnósticos médicos

---

## 7. MAPA FACIAL ESTRATÉGICO (JSON)

OBRIGATÓRIO: retorne um bloco JSON ao final com esta estrutura EXATA:

\`\`\`json
{
  "main_protocol": "Nome do Protocolo Principal HOF",
  "complementary_protocols": ["Protocolo 2", "Protocolo 3"],
  "continuity_plan": "Continuum Essentia | Continuum Refinement | Continuum Sovereign | Maison Privé",
  "entry_experience": "Atelier de Estrutura Facial",
  "primary_issue": "falta_de_estrutura | desproporcao | envelhecimento | flacidez | qualidade_de_pele",
  "scoring_summary": {
    "red_dots": 2,
    "yellow_dots": 3,
    "total_regions": 5
  },
  "regions": [
    { "area": "Malar", "marker": "red", "intervention": "Preenchimento malar", "protocol": "Sculpt Full Face Protocol", "priority": "alto", "note": "Pode se beneficiar de maior projeção e definição" },
    { "area": "Lábios", "marker": "yellow", "intervention": "Preenchimento labial", "protocol": "Lip Design Atelier", "priority": "médio", "note": "Existe potencial de refinamento no contorno labial" }
  ],
  "image_prompt_technical": "DETAILED English prompt: On the exact patient photo, draw precise colored dot markers — RED filled circles (#CC2200, 12px) on [list specific anatomical points with coordinates like 'left malar prominence', 'chin apex', 'mandible angle bilateral'] and YELLOW/AMBER filled circles (#E8A020, 12px) on [list specific anatomical points]. Add ultra-thin white lines (#FFFFFF, 0.5px opacity 60%) connecting: golden ratio vertical thirds divisions across forehead, cheeks, chin. Add tiny serif labels in white (#FFFFFF, 8px, tracking-widest) next to each dot: 'ESTRUTURA', 'PROJEÇÃO', 'VOLUME', 'SUSTENTAÇÃO'. Show protocol name '[main_protocol]' in elegant serif typography at bottom center. Aesthetic: Prada visual identity, silent luxury, black/white/gray palette, ultra-minimal, authoritative.",
  "image_prompt_client": "DETAILED English prompt: On the exact patient photo, place only the essential colored dot markers — RED filled circles (#CC2200, 14px) on [2-3 most important points only] and YELLOW/AMBER circles (#E8A020, 14px) on [1-2 moderate points]. NO technical labels, NO lines. Protocol name '[main_protocol]' displayed in clean elegant serif font at top or bottom. Background slightly darkened outside face. Clean, elegant, easy to understand. Premium aesthetic.",
  "image_prompt_result": "DETAILED English prompt: On the exact patient photo, show subtle directional improvement vectors — thin white arrows (#FFFFFF, 0.7px) indicating: upward lift vectors at malar/cheekbone areas, forward projection vector at chin, lateral definition vectors at mandible. Add softly glowing highlight zones (very subtle white glow, 15% opacity) over the key transformation areas [list them]. Show the colored dot markers minimally. Protocol name '[main_protocol]' prominently displayed. Creates a sense of transformation direction and aesthetic potential. Aspirational, elegant, desire-inducing."
}
\`\`\`

CRÍTICO: Nos image_prompts, substitua [main_protocol] pelo nome real do protocolo escolhido, e descreva os pontos anatômicos específicos identificados na análise (não use texto genérico). Os prompts devem ser suficientemente detalhados para que a IA de imagem saiba EXATAMENTE onde colocar cada marcador sobre o rosto específico desta paciente.`;

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
    { key: "protocols",    start: "## 5. PROTOCOLOS HOF",            end: "## 6." },
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

// Compress a base64 dataUrl to max 800px wide at given quality
const compressImage = (dataUrl, quality = 0.75, maxWidth = 800) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });

const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
};

const ANALYSIS_STEPS = [
  { id: "compress",   label: "Preparando imagens",               detail: "Otimizando qualidade para análise" },
  { id: "upload",     label: "Enviando para o servidor",         detail: "Upload seguro das imagens" },
  { id: "structure",  label: "Processando estrutura facial",     detail: "Mapeando proporções e simetria" },
  { id: "protocols",  label: "Analisando proporções e ângulos",  detail: "Calculando terços e eixos faciais" },
  { id: "plan",       label: "Gerando plano de harmonização",    detail: "Estruturando protocolos HOF" },
  { id: "report",     label: "Elaborando laudo completo",        detail: "Preparando versões técnica e para paciente" },
  { id: "map",        label: "Criando mapa facial estratégico",  detail: "Gerando 3 versões do overlay visual" },
];

// Extract JSON map block from LLM response
const extractMapData = (text) => {
  try {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

export default function FacialAnalysis() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [capturedAngles, setCapturedAngles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [parsedSections, setParsedSections] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [facialMaps, setFacialMaps] = useState(null); // { technical, client, result }
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("structured");
  const [showCamera, setShowCamera] = useState(false);
  const [inputMode, setInputMode] = useState(null);
  const fileInputRef = useRef(null);
  const stepTimerRef = useRef(null);

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

  // Advance step indicator every ~4s to simulate progress
  const startStepProgress = () => {
    setAnalysisStep(0);
    let current = 0;
    stepTimerRef.current = setInterval(() => {
      current += 1;
      if (current < ANALYSIS_STEPS.length - 1) {
        setAnalysisStep(current);
      } else {
        clearInterval(stepTimerRef.current);
      }
    }, 4000);
  };

  const stopStepProgress = () => {
    clearInterval(stepTimerRef.current);
    setAnalysisStep(ANALYSIS_STEPS.length - 1);
  };

  const runAnalysis = async () => {
    const hasUpload = inputMode === "upload" && imageFile;
    const hasCamera = inputMode === "camera" && capturedAngles.length > 0;
    if (!hasUpload && !hasCamera) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setParsedSections(null);
    startStepProgress();

    try {
      let fileUrls = [];
      let firstPreview = imagePreview; // preserve preview for simulation

      if (hasUpload) {
        // Compress file → dataUrl → compress → back to File
        const dataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.readAsDataURL(imageFile);
        });
        const compressed = await compressImage(dataUrl);
        const compressedFile = dataUrlToFile(compressed, "facial.jpg");
        const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
        console.log("[FacialAnalysis] Upload OK:", file_url);
        setUploadedImageUrl(file_url);
        fileUrls = [file_url];
      } else {
        // Compress all angles then upload in parallel
        const compressedAngles = await Promise.all(
          capturedAngles.map(c => compressImage(c.dataUrl))
        );
        const uploads = await Promise.all(
          compressedAngles.map((dataUrl, i) => {
            const file = dataUrlToFile(dataUrl, `facial_${capturedAngles[i].type}_${i}.jpg`);
            return base44.integrations.Core.UploadFile({ file });
          })
        );
        fileUrls = uploads.map(u => u.file_url);
        console.log("[FacialAnalysis] Camera uploads OK:", fileUrls);
        setUploadedImageUrl(fileUrls[0]);
      }

      const angleContext = hasCamera && capturedAngles.length > 1
        ? `\n\nIMPORTANTE: Foram fornecidas ${capturedAngles.length} imagens: ${capturedAngles.map(c => c.label).join(", ")}. Cruze as informações de todos os ângulos para uma análise mais precisa.`
        : "";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: HOF_SYSTEM_PROMPT + angleContext + "\n\nAnalise as imagens faciais fornecidas e gere o laudo completo seguindo exatamente a estrutura solicitada.",
        file_urls: fileUrls,
        model: "claude_sonnet_4_6",
      });

      const text = typeof result === "string" ? result : JSON.stringify(result);
      setAnalysis(text);
      setParsedSections(parseAnalysis(text));
      setActiveTab("map");

      // Extract map data from JSON block
      const extracted = extractMapData(text);
      if (extracted) {
        setMapData(extracted);
        setAnalysisStep(6); // "Criando mapa facial"

        // Generate 3 map images — isolated try/catch so failure doesn't break simulation
        try {
          const basePromptSuffix = ` STYLE: Premium clinical facial mapping overlay inspired by Prada's silent luxury aesthetic. Ultra-thin lines (0.5px), elegant serif typography, restrained color palette — only black (#000), white (#FFF), gray (#7A7A7A), plus RED (#CC2200) and AMBER (#E8A020) for the dot markers. The dots MUST be clearly visible filled circles placed directly on the patient's face at the specified anatomical points. Protocol name displayed elegantly. Clean, authoritative, high-end medical aesthetic. DO NOT alter or retouch the patient's face — only add overlay graphics on top.`;

          const [techMap, clientMap, resultMap] = await Promise.all([
            base44.integrations.Core.GenerateImage({
              prompt: (extracted.image_prompt_technical || `Facial strategic map overlay on the patient photo with detailed clinical annotation points on malar, lips, chin, mandible, temples, under-eye areas. Thin connecting lines with elegant serif labels for each region. Show protocol name "${extracted.main_protocol}" at bottom.`) + basePromptSuffix,
              existing_image_urls: fileUrls.slice(0, 1),
            }),
            base44.integrations.Core.GenerateImage({
              prompt: (extracted.image_prompt_client || `Clean elegant facial map overlay on patient photo showing only key improvement areas with soft highlights. Protocol name "${extracted.main_protocol}" in elegant typography at top. Minimal clean aesthetic.`) + basePromptSuffix,
              existing_image_urls: fileUrls.slice(0, 1),
            }),
            base44.integrations.Core.GenerateImage({
              prompt: (extracted.image_prompt_result || `Facial transformation direction overlay on patient photo showing subtle lifting vectors and volumetric projection arrows. Shows before-to-after directional transformation. Elegant and sophisticated.`) + basePromptSuffix,
              existing_image_urls: fileUrls.slice(0, 1),
            }),
          ]);

          setFacialMaps({
            technical: techMap?.url,
            client: clientMap?.url,
            result: resultMap?.url,
          });
        } catch (mapErr) {
          console.warn("[FacialAnalysis] Mapa facial falhou (não bloqueia simulação):", mapErr);
          // Don't throw — analysis and simulation still work
        }
      }

      stopStepProgress();
    } catch (err) {
      const errMsg = err?.message || String(err);
      console.error("[FacialAnalysis] Erro:", errMsg);
      setError(`Erro ao gerar análise: ${errMsg}`);
    } finally {
      stopStepProgress();
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImageFile(null);
    setImagePreview(null);
    setCapturedAngles([]);
    setAnalysis(null);
    setParsedSections(null);
    setMapData(null);
    setFacialMaps(null);
    setUploadedImageUrl(null);
    setError(null);
    setInputMode(null);
    setIsAnalyzing(false);
    clearInterval(stepTimerRef.current);
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
      title: "5. Protocolos HOF Indicados",
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

      {/* ─── Premium Loading Overlay ─── */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#12121a] border border-[#c9a55c]/20 rounded-3xl p-8 shadow-2xl">
            {/* Minimal loader */}
            <div className="flex justify-center mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-[#c9a55c]/30 border-t-[#c9a55c] animate-spin" />
            </div>

            <p className="text-center text-xs text-[#c9a55c] uppercase tracking-widest mb-2">
              Clínica Premium · Dra. Paloma Betoni
            </p>
            <h3 className="text-center text-white font-semibold text-lg mb-1">
              {ANALYSIS_STEPS[analysisStep]?.label}
            </h3>
            <p className="text-center text-gray-500 text-sm mb-8">
              {ANALYSIS_STEPS[analysisStep]?.detail}
            </p>

            {/* Step list */}
            <div className="space-y-2.5">
              {ANALYSIS_STEPS.map((s, i) => {
                const done = i < analysisStep;
                const active = i === analysisStep;
                return (
                  <div key={s.id} className={`flex items-center gap-3 transition-all ${active ? "opacity-100" : done ? "opacity-60" : "opacity-25"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? "bg-emerald-500" : active ? "bg-[#c9a55c]" : "bg-[#1e1e2a]"
                    }`}>
                      {done ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : active ? (
                        <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                      )}
                    </div>
                    <span className={`text-xs ${active ? "text-white font-medium" : done ? "text-gray-400" : "text-gray-700"}`}>
                      {s.label}
                    </span>
                    {active && (
                      <div className="ml-auto flex gap-0.5">
                        {[0,1,2].map(j => (
                          <div key={j} className="w-1 h-1 rounded-full bg-[#c9a55c] animate-bounce"
                            style={{ animationDelay: `${j * 200}ms` }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-gray-700 mt-6">
              Análise gerada por IA avançada · Pode levar até 60 segundos
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif text-white">
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
              <Sparkles className="h-5 w-5" />
              Gerar Análise Facial
              {capturedAngles.length > 1 && (
                <Badge className="bg-black/20 text-black text-xs ml-1">
                  {capturedAngles.length} ângulos
                </Badge>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && parsedSections && (
        <div className="space-y-6">
          {/* Image + Quick Summary Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Thumbnail(s) */}
            <div className="flex flex-col items-center gap-3">
              {capturedAngles.length > 1 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {capturedAngles.map((c, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-[#c9a55c]/20">
                      <img src={c.dataUrl} alt={c.label} className="w-full aspect-square object-cover" />
                      <p className="text-[10px] text-[#c9a55c] text-center bg-[#12121a] py-1">{c.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <img src={imagePreview} alt="Analisada"
                  className="w-full max-h-60 object-contain rounded-2xl border border-[#c9a55c]/20" />
              )}
              <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {capturedAngles.length > 1 ? `${capturedAngles.length} ângulos analisados` : "Análise concluída"}
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
            <TabsList className="bg-[#1a1a25] border border-[#1e1e2a] flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="simulation"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <Sparkles className="mr-2 h-4 w-4" />
                Simulação
              </TabsTrigger>
              <TabsTrigger value="map"
                className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
                <Map className="mr-2 h-4 w-4" />
                Mapa Facial
                {(facialMaps || mapData) && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#c9a55c] inline-block" />
                )}
              </TabsTrigger>
              <TabsTrigger value="structured"
                className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
                <Layers className="mr-2 h-4 w-4" />
                Laudo Estruturado
              </TabsTrigger>
              <TabsTrigger value="patient"
                className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                <User className="mr-2 h-4 w-4" />
                Versão Paciente
              </TabsTrigger>
              <TabsTrigger value="technical"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <FileText className="mr-2 h-4 w-4" />
                Técnico
              </TabsTrigger>
              <TabsTrigger value="raw"
                className="data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-300">
                Completo
              </TabsTrigger>
            </TabsList>

            {/* Simulation Tab */}
            <TabsContent value="simulation" className="mt-5">
              <SimulationPanel
                originalImageUrl={uploadedImageUrl}
                originalPreview={imagePreview}
                mapData={mapData}
              />
            </TabsContent>

            {/* Facial Map Tab */}
            <TabsContent value="map" className="mt-5">
              {mapData || facialMaps ? (
                <div className="space-y-6">
                  <FacialMapDisplay maps={facialMaps} mapData={mapData} />

                  {/* Strategic summary cards */}
                  {mapData && (
                    <div className="space-y-4">
                      {/* Top row: scoring */}
                      <div className="grid grid-cols-3 gap-3">
                        <Card className="bg-[#0d0d14] border-[#1e1e2a]">
                          <CardContent className="p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Protocolo Principal</p>
                            <p className="text-sm font-medium text-[#c9a55c]">{mapData.main_protocol}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-[#0d0d14] border-red-900/30 border">
                          <CardContent className="p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Pontos Prioritários 🔴</p>
                            <p className="text-2xl font-bold text-red-400">{mapData.scoring_summary?.red_dots ?? mapData.regions?.filter(r => r.marker === "red" || r.priority === "alto").length ?? "—"}</p>
                            <p className="text-[10px] text-gray-600">melhorias estruturais</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-[#0d0d14] border-amber-900/30 border">
                          <CardContent className="p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Potencial de Refinamento 🔶</p>
                            <p className="text-2xl font-bold text-amber-400">{mapData.scoring_summary?.yellow_dots ?? mapData.regions?.filter(r => r.marker === "yellow" || r.priority === "médio").length ?? "—"}</p>
                            <p className="text-[10px] text-gray-600">melhorias moderadas</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Regions list with markers */}
                      {mapData.regions?.length > 0 && (
                        <Card className="bg-[#0d0d14] border-[#1e1e2a]">
                          <CardContent className="p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Regiões Mapeadas</p>
                            <div className="space-y-2">
                              {mapData.regions.map((r, i) => (
                                <div key={i} className="flex items-start gap-3 py-2 border-b border-[#1e1e2a] last:border-0">
                                  <span className="text-base mt-0.5 flex-shrink-0">
                                    {r.marker === "red" || r.priority === "alto" ? "🔴" : "🔶"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-white">{r.area}</span>
                                      <span className="text-[10px] text-gray-500 bg-[#1a1a25] px-2 py-0.5 rounded-full">{r.intervention}</span>
                                    </div>
                                    {r.note && <p className="text-xs text-gray-500 mt-0.5 italic">{r.note}</p>}
                                  </div>
                                  <span className="text-[10px] text-[#c9a55c] flex-shrink-0">{r.protocol}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Continuity + Entry */}
                      {(mapData.continuity_plan || mapData.entry_experience || mapData.complementary_protocols?.length > 0) && (
                        <div className="grid md:grid-cols-2 gap-3">
                          {mapData.entry_experience && (
                            <Card className="bg-[#c9a55c]/5 border-[#c9a55c]/20">
                              <CardContent className="p-4">
                                <p className="text-[10px] uppercase tracking-widest text-[#c9a55c]/70 mb-1">🪶 Porta de Entrada</p>
                                <p className="text-sm font-medium text-white">{mapData.entry_experience}</p>
                              </CardContent>
                            </Card>
                          )}
                          {mapData.continuity_plan && (
                            <Card className="bg-[#0d0d14] border-[#1e1e2a]">
                              <CardContent className="p-4">
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Plano de Continuidade</p>
                                <p className="text-sm font-medium text-white">{mapData.continuity_plan}</p>
                              </CardContent>
                            </Card>
                          )}
                          {mapData.complementary_protocols?.length > 0 && (
                            <Card className="bg-[#0d0d14] border-[#1e1e2a] md:col-span-2">
                              <CardContent className="p-4">
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Protocolos Complementares</p>
                                <div className="flex flex-wrap gap-2">
                                  {mapData.complementary_protocols.map((p, i) => (
                                    <span key={i} className="text-xs bg-[#1a1a25] text-gray-300 px-3 py-1 rounded-full border border-[#1e1e2a]">{p}</span>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!facialMaps && (
                    <div className="flex items-center gap-3 p-4 bg-[#0d0d14] border border-[#c9a55c]/10 rounded-xl">
                      <div className="w-4 h-4 border-2 border-[#c9a55c]/40 border-t-[#c9a55c] rounded-full animate-spin flex-shrink-0" />
                      <p className="text-sm text-gray-400">Gerando imagens do mapa facial estratégico...</p>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-[#0d0d14] border-[#1e1e2a]">
                  <CardContent className="p-8 text-center">
                    <Map className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">O mapa facial será gerado após a análise</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

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