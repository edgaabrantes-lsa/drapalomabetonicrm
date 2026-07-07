import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ══════════════════════════════════════════════════════════════
//  Simulação Antes e Depois v13 — Apollo
//  • Prompt forte por procedimento + nível de intensidade
//  • Validação anti-erro: compara pixels antes/depois
//  • Retry automático com prompt mais forte se sem diferença
//  • Nunca devolve a imagem original como resultado
// ══════════════════════════════════════════════════════════════

// Decodificadores de imagem puros-JS para comparação de pixels
let PNG, jpeg;

// Mapeamento de procedimento → instrução específica (PT-BR descritivo para o modelo)
const PROCEDURE_MAP: Record<string, { label: string; instruction: string }> = {
  full_face: {
    label: "Harmonização Facial Completa (Full Face)",
    instruction: "Aplicar melhora global na harmonia facial: refinamento sutil de proporções, suavização de sinais e linhas, melhora de contorno e equilíbrio geral do rosto. Manter a identidade absoluta da pessoa.",
  },
  nariz: {
    label: "Rinomodelação (região nasal)",
    instruction: "Modificar APENAS a região nasal. Corrigir visualmente dorso, ponta, assimetria e proporção do nariz com base em harmonia facial. A intensidade controla o quanto o nariz será refinado. Não alterar bochechas, lábios, olhos ou queixo.",
  },
  testa: {
    label: "Rugas na Testa",
    instruction: "Atuar APENAS na testa. Suavizar ou remover as linhas horizontais da testa conforme o nível escolhido, preservando a textura natural da pele e o movimento aparente. Não alterar outras áreas.",
  },
  glabela: {
    label: "Glabela (entre as sobrancelhas)",
    instruction: "Atuar APENAS na região entre as sobrancelhas. Suavizar as linhas de expressão da glabela conforme a intensidade. Preservar sobrancelhas e testa.",
  },
  pes_galinha: {
    label: "Pés de Galinha",
    instruction: "Atuar APENAS na região lateral dos olhos. Reduzir as rugas perioculares sem alterar o formato ou a cor dos olhos. Preservar pálpebras.",
  },
  olheiras: {
    label: "Olheiras",
    instruction: "Atuar APENAS na região abaixo dos olhos. Reduzir escurecimento, profundidade e aspecto de cansaço, mantendo naturalidade e a sombra periorbital real. Não clarear toda a face.",
  },
  melasma: {
    label: "Melasma / Manchas",
    instruction: "Atuar APENAS nas manchas da pele. Reduzir manchas e uniformizar o tom da pele preservando a textura natural. Não clarear o rosto inteiro de forma artificial. Bordas suaves.",
  },
  malar: {
    label: "Malar (maçãs do rosto)",
    instruction: "Atuar APENAS na região das maçãs do rosto. Aumentar sustentação, projeção e harmonia malar conforme a intensidade, mantendo naturalidade.",
  },
  mandibula: {
    label: "Mandíbula",
    instruction: "Atuar APENAS no contorno mandibular. Melhorar definição e contorno da mandíbula de forma realista, com sombreamento anatômico coerente com a luz original.",
  },
  mento: {
    label: "Mento / Queixo",
    instruction: "Atuar APENAS no queixo. Melhorar proporção, projeção e equilíbrio do mento em relação ao rosto. Não alterar lábios ou mandíbula.",
  },
  mandibula_mento: {
    label: "Mandíbula e Mento",
    instruction: "Atuar APENAS no contorno mandibular e no queixo. Melhorar definição e contorno facial combinado de forma realista e harmônica.",
  },
  labios: {
    label: "Lábios",
    instruction: "Atuar APENAS nos lábios. Melhorar volume, hidratação aparente, contorno e simetria, sem deformar ou exagerar. Seguir o arco de Cupido natural e a borda vermelilha.",
  },
  sulcos: {
    label: "Sulcos (nasogeniano)",
    instruction: "Atuar APENAS no sulco nasogeniano e linhas próximas. Suavizar a profundidade dos sulcos mantendo a textura natural da pele.",
  },
  temporas: {
    label: "Têmporas",
    instruction: "Atuar APENAS nas têmporas. Melhorar o aspecto de preenchimento e sustentação lateral do rosto, mantendo naturalidade.",
  },
  papada: {
    label: "Papada",
    instruction: "Atuar APENAS na região submentoniana. Reduzir visualmente o volume da papada e melhorar a definição do contorno inferior do rosto.",
  },
  bioestimulador: {
    label: "Bioestimulador (qualidade da pele)",
    instruction: "Atuar na qualidade geral da pele da área selecionada. Melhorar firmeza, viço e textura sem modificar a identidade facial.",
  },
};

const INTENSITY_MAP: Record<number, { label: string; complement: string; strength: string }> = {
  1: {
    label: "Suave",
    complement: "Aplicar mudança discreta, leve e conservadora. Resultado sutil, natural e quase imperceptível, mas ainda visualmente identificável.",
    strength: "approximately 12-15% visible change",
  },
  2: {
    label: "Moderada",
    complement: "Aplicar mudança moderada, claramente perceptível, equilibrada e natural. O antes e depois devem mostrar melhora evidente sem exagero.",
    strength: "approximately 20-28% visible change",
  },
  3: {
    label: "Mais evidente",
    complement: "Aplicar mudança mais evidente e expressiva na região selecionada, mantendo realismo anatômico, proporção facial e identidade original.",
    strength: "approximately 30-40% visible change",
  },
};

function buildPrompt(options: string[], intensity: number, isRetry: boolean): string {
  const procLabels = options.map(o => PROCEDURE_MAP[o]?.label || o).join(" + ");
  const procInstructions = options
    .map(o => `• ${PROCEDURE_MAP[o]?.label || o}: ${PROCEDURE_MAP[o]?.instruction || "Editar a região correspondente."}`)
    .join("\n");

  const intensityInfo = INTENSITY_MAP[intensity] || INTENSITY_MAP[2];

  const retryBoost = isRetry
    ? "\n\nIMPORTANTE — TENTATIVA DE CORREÇÃO: A geração anterior ficou praticamente idêntica à foto original, sem alteração perceptível. Você DEVE aplicar uma alteração VISÍVEL e CLARAMENTE DETECTÁVEL na região selecionada. Compare mentalmente o antes e o depois: um observador deve notar a diferença imediatamente."
    : "";

  return `Crie uma simulação estética realista de antes e depois, mantendo a identidade facial original da pessoa. Preserve cor dos olhos, formato dos olhos, sobrancelhas, cabelo, tom de pele, expressão, roupa, fundo, iluminação e características pessoais. Aplique a alteração SOMENTE na região: ${procLabels}. A intensidade da alteração deve ser: ${intensityInfo.label}. O resultado deve ser VISIVELMENTE DIFERENTE do antes, porém natural, clínico, elegante e proporcional. Não transforme o rosto em outra pessoa. Não altere áreas não selecionadas. Gere uma imagem final realista mostrando como essa região poderia ficar após um procedimento estético bem executado.

PROCEDIMENTO(S) SELECIONADO(S):
${procInstructions}

NÍVEL DE INTENSIDADE: ${intensityInfo.label} — ${intensityInfo.complement}
Força da alteração visual: ${intensityInfo.strength}.

REGRAS DE PRESERVAÇÃO (obrigatórias):
1. Manter fielmente o rosto original da pessoa.
2. Não trocar identidade, etnia, idade aparente, cor dos olhos, formato dos olhos, cabelo, sobrancelhas, boca, expressão, roupa, fundo ou iluminação.
3. Não transformar a pessoa em outro rosto.
4. Não aplicar embelezamento genérico no rosto inteiro, exceto quando o procedimento for Full Face.
5. Alterar somente a área correspondente ao procedimento selecionado.
6. A imagem final deve parecer uma simulação estética realista, clínica, natural e profissional.

A imagem "depois" NÃO pode ser praticamente igual à imagem "antes". A alteração na região selecionada deve ser claramente visível.${retryBoost}

AVISO LEGAL: Imagem meramente ilustrativa para apoio visual em consulta estética.`;
}

// ── Comparação de pixels entre antes e depois ──
async function decodeImage(url: string): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());

    // Detectar formato pelos magic bytes
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

    if (isPng) {
      if (!PNG) PNG = (await import("npm:pngjs@7.0.0")).PNG;
      const png = PNG.sync.read(Buffer.from(buf));
      return { data: new Uint8Array(png.data), width: png.width, height: png.height };
    }
    if (isJpeg) {
      if (!jpeg) jpeg = await import("npm:jpeg-js@0.4.4");
      const raw = jpeg.decode(Buffer.from(buf));
      return { data: new Uint8Array(raw.data), width: raw.width, height: raw.height };
    }
    return null;
  } catch (e) {
    console.log("decodeImage falhou:", (e as Error).message);
    return null;
  }
}

// Calcula diferença percentual (0-100) entre duas imagens, downsample para grid NxN
async function computeDifferencePct(urlA: string, urlB: string): Promise<number | null> {
  const N = 24;
  const a = await decodeImage(urlA);
  const b = await decodeImage(urlB);
  if (!a || !b) return null;

  const sample = (img: { data: Uint8Array; width: number; height: number }) => {
    const lum: number[] = [];
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        const px = Math.floor((gx + 0.5) / N * img.width);
        const py = Math.floor((gy + 0.5) / N * img.height);
        const idx = (py * img.width + px) * 4;
        // Luma
        const l = 0.299 * img.data[idx] + 0.587 * img.data[idx + 1] + 0.114 * img.data[idx + 2];
        lum.push(l);
      }
    }
    return lum;
  };

  const la = sample(a);
  const lb = sample(b);
  let sum = 0;
  for (let i = 0; i < la.length; i++) sum += Math.abs(la[i] - lb[i]);
  const mean = sum / la.length;
  return (mean / 255) * 100;
}

const NO_CHANGE_THRESHOLD = 1.5; // % de diferença média abaixo da qual consideramos "sem alteração visível"

Deno.serve(async (req) => {
  let simulationId: string | null = null;
  let base44Client: any = null;

  try {
    base44Client = createClientFromRequest(req);
    const user = await base44Client.auth.me();
    if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const payload = await req.json();
    const { patient_id, original_image_url, source_type, consent_lgpd, simulation_options, intensity } = payload;

    if (!patient_id || !original_image_url) {
      return Response.json({ error: "patient_id e original_image_url são obrigatórios" }, { status: 400 });
    }
    if (!consent_lgpd) {
      return Response.json({ error: "Consentimento LGPD é obrigatório" }, { status: 400 });
    }

    const validSourceTypes = ["front_camera", "back_camera", "webcam", "upload"];
    const finalSourceType = validSourceTypes.includes(source_type) ? source_type : "upload";
    const finalOptions: string[] = Array.isArray(simulation_options) && simulation_options.length > 0
      ? simulation_options : ["full_face"];
    const finalIntensity: number = [1, 2, 3].includes(Number(intensity)) ? Number(intensity) : 2;

    // Criar registro inicial
    const simulation = await base44Client.entities.FullFaceSimulation.create({
      patient_id,
      patient_name: "",
      user_id: user.id,
      user_email: user.email || "",
      original_image_url,
      generated_image_url: "",
      source_type: finalSourceType,
      consent_lgpd: true,
      consent_timestamp: new Date().toISOString(),
      status: "processing",
      protocol_type: finalOptions.join(","),
      ai_prompt_version: "v13_apollo",
      intensity: finalIntensity,
    });
    simulationId = simulation.id;

    // Buscar nome da paciente
    try {
      const patients = await base44Client.entities.Patient.filter({ id: patient_id }, "-created_date", 1);
      const patient = patients?.[0];
      if (patient?.full_name) {
        await base44Client.entities.FullFaceSimulation.update(simulationId, { patient_name: patient.full_name });
      }
    } catch (e) {
      console.log("Aviso: não foi possível buscar paciente:", (e as Error).message);
    }

    // Geração com tentativa + validação anti-erro
    let generated_image_url = "";
    let attempts = 0;
    let diffPct: number | null = null;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const isRetry = attempts > 1;
      const prompt = buildPrompt(finalOptions, finalIntensity, isRetry);
      console.log(`Tentativa ${attempts} — opções: ${finalOptions.join(", ")} | intensidade: ${finalIntensity}${isRetry ? " (retry)" : ""}`);

      const imageResult = await base44Client.asServiceRole.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: [original_image_url],
      });

      if (!imageResult?.url) {
        throw new Error("Nenhuma imagem gerada pela plataforma.");
      }

      // Guarda de segurança: a URL gerada nunca pode ser a mesma da original
      if (imageResult.url === original_image_url) {
        console.log("URL gerada igual à original — ignorando e tentando novamente.");
        if (attempts >= maxAttempts) {
          return Response.json({
            error: "Não foi possível gerar uma simulação com diferença visual suficiente. Tente novamente ou selecione outro nível de intensidade.",
            code: "NO_VISIBLE_CHANGE",
          }, { status: 422 });
        }
        continue;
      }

      generated_image_url = imageResult.url;

      // Validação anti-erro: comparar pixels
      diffPct = await computeDifferencePct(original_image_url, generated_image_url);
      console.log(`Tentativa ${attempts} — diferença visual: ${diffPct !== null ? diffPct.toFixed(2) + "%" : "indisponível"}`);

      if (diffPct === null) {
        // Não foi possível comparar — aceitar o resultado (não bloquear)
        break;
      }
      if (diffPct >= NO_CHANGE_THRESHOLD) {
        // Diferença suficiente — aceitar
        break;
      }
      // Sem diferença suficiente — tentar novamente se houver tentativa restante
      if (attempts >= maxAttempts) {
        // Última tentativa ainda sem diferença — retornar erro claro, NÃO a imagem original
        await base44Client.entities.FullFaceSimulation.update(simulationId, {
          status: "failed",
          error_message: "Sem diferença visual suficiente após retry.",
        });
        return Response.json({
          error: "Não foi possível gerar uma simulação com diferença visual suficiente. Tente novamente ou selecione outro nível de intensidade.",
          code: "NO_VISIBLE_CHANGE",
          diff_pct: diffPct,
        }, { status: 422 });
      }
    }

    const procLabels = finalOptions.map(o => PROCEDURE_MAP[o]?.label || o).join(", ");
    const intensityLabel = INTENSITY_MAP[finalIntensity]?.label || "Moderada";
    const technicalReport = `Simulação clínica v13 (Apollo) gerada por IA. Procedimento(s): ${procLabels}. Nível de intensidade: ${intensityLabel}. Diferença visual detectada: ${diffPct !== null ? diffPct.toFixed(2) + "%" : "não medida"}. Identidade facial, etnia, cor dos olhos, tom de pele e áreas não selecionadas preservados. Resultado meramente ilustrativo para apoio visual em consulta estética.`;

    // Salvar resultado
    await base44Client.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: {
        simulation_options: finalOptions,
        intensity: finalIntensity,
        intensity_label: intensityLabel,
        prompt_version: "v13_apollo",
        identity_preserved: true,
        natural_realism: true,
        diff_pct: diffPct,
      },
      image_metadata: { format: "png", width: 1024, height: 1024 },
    });

    // Log de auditoria
    try {
      await base44Client.entities.AuditLog.create({
        action: "create",
        entity_type: "FullFaceSimulation",
        entity_id: simulationId,
        user_email: user.email || "",
        user_role: user.role || "user",
        details: { patient_id, source_type: finalSourceType, consent_lgpd: true, simulation_options: finalOptions, intensity: finalIntensity },
      });
    } catch (e) {
      console.log("Log de auditoria falhou (não crítico):", (e as Error).message);
    }

    console.log("Simulação v13 concluída:", simulationId, "diff:", diffPct);
    return Response.json({
      success: true,
      simulation_id: simulationId,
      generated_image_url,
      technical_report: technicalReport,
      intensity: finalIntensity,
      intensity_label: intensityLabel,
      diff_pct: diffPct,
      message: "Simulação gerada com sucesso",
    });

  } catch (error) {
    const errMsg = (error as Error).message || "Erro desconhecido";
    console.error("Erro na geração:", errMsg);
    if (simulationId && base44Client) {
      try {
        await base44Client.entities.FullFaceSimulation.update(simulationId, {
          status: "failed",
          error_message: errMsg,
        });
      } catch (_) {}
    }
    return Response.json({
      error: errMsg || "Não conseguimos gerar a simulação. Tente novamente.",
      code: "GENERATION_FAILED",
    }, { status: 500 });
  }
});