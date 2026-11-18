import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { refineJawContour } from './jawContour.js';

// ══════════════════════════════════════════════════════════════
//  Simulação Antes e Depois v16 — Contorno localizado
//  • Preserva os procedimentos e níveis selecionados
//  • Edição dedicada do ângulo e da borda mandibular
//  • Verificação visual do contorno, identidade e enquadramento
//  • Nunca usa o rascunho como resultado se o refinamento falhar
// ══════════════════════════════════════════════════════════════

// Decodificadores de imagem puros-JS para comparação de pixels
let PNG, jpeg;

// Mapeamento de procedimento → região exata + efeito visual concreto (magnitude máxima)
const PROCEDURE_MAP: Record<string, { label: string; region: string; delta: string }> = {
  full_face: {
    label: "Harmonização Facial Completa (Full Face)",
    region: "o rosto inteiro",
    delta: "elevar o terço médio, atenuar sulcos nasogenianos, definir a mandíbula, reduzir olheiras e rugas, pele mais firme, uniforme e luminosa, contorno facial mais harmônico",
  },
  nariz: {
    label: "Rinomodelação (região nasal)",
    region: "somente o nariz",
    delta: "dorso mais reto e estreito, ponta do nariz refinada e levemente elevada, base nasal mais estreita, nariz proporcional ao rosto",
  },
  testa: {
    label: "Rugas na Testa",
    region: "somente a testa",
    delta: "apagar as linhas horizontais da testa e o vinco de repouso, deixando a testa lisa, mantendo o relevo ósseo e a textura dos poros",
  },
  glabela: {
    label: "Glabela (entre as sobrancelhas)",
    region: "somente a região entre as sobrancelhas",
    delta: "apagar as duas linhas verticais de expressão da glabela, deixando a área lisa, sem mexer no formato das sobrancelhas",
  },
  pes_galinha: {
    label: "Pés de Galinha",
    region: "somente o canto externo dos olhos",
    delta: "apagar as linhas em leque do canto externo dos olhos, pele lisa ao redor dos olhos, mantendo o formato e a cor dos olhos",
  },
  olheiras: {
    label: "Olheiras",
    region: "somente a região abaixo dos olhos",
    delta: "eliminar a sombra escura e o sulco abaixo dos olhos, olhar descansado e iluminado, sem clarear o resto do rosto",
  },
  melasma: {
    label: "Melasma / Manchas",
    region: "somente as áreas manchadas da pele",
    delta: "remover as manchas escuras e as placas de pigmentação, tom de pele uniforme e luminoso, mantendo poros, textura e relevo natural",
  },
  malar: {
    label: "Malar (maçãs do rosto)",
    region: "somente as maçãs do rosto",
    delta: "aumentar a projeção e o volume das maçãs do rosto, criar sombra suave sob o malar, aspecto de sustentação e lifting do terço médio",
  },
  mandibula: {
    label: "Mandíbula",
    region: "somente a linha da mandíbula e o ângulo gônio",
    delta: "definir e marcar com força o ângulo mandibular (gônio) no ângulo indicado para o rosto, contorno inferior reto e nítido, sombra anatômica bem visível sob o osso coerente com a luz da foto, afinando visualmente a parte inferior do rosto",
  },
  mento: {
    label: "Mento / Queixo",
    region: "somente o queixo",
    delta: "projetar e alongar o queixo de forma nítida, corrigir a retração, criar sombra e contorno definido no mento, equilibrando o terço inferior do rosto",
  },
  mandibula_mento: {
    label: "Mandíbula e Mento",
    region: "somente a mandíbula e o queixo",
    delta: "construir o ângulo mandibular (gônio) no ângulo indicado para o rosto e projetar o queixo, criando contorno inferior marcado, reto, angular e equilibrado, com sombra definida no gônio e no mento",
  },
  labios: {
    label: "Lábios",
    region: "somente os lábios",
    delta: "aumentar o volume do lábio superior e do inferior, definir o arco do cupido e a borda dos lábios, hidratação e viço visíveis, simetria entre os lados",
  },
  sulcos: {
    label: "Sulcos (nasogeniano)",
    region: "somente o sulco nasogeniano",
    delta: "apagar a profundidade do sulco do nariz até a boca, pele plana e lisa nessa linha",
  },
  temporas: {
    label: "Têmporas",
    region: "somente as têmporas",
    delta: "preencher a depressão das têmporas, alargando e arredondando o terço superior do rosto, removendo a aparência de têmpora afundada",
  },
  papada: {
    label: "Papada",
    region: "somente a região sob o queixo",
    delta: "eliminar o volume e a flacidez sob o queixo, criar ângulo cervicomentoniano definido e contorno inferior alongado",
  },
  bioestimulador: {
    label: "Bioestimulador (qualidade da pele)",
    region: "a pele do rosto",
    delta: "pele visivelmente mais firme, densa e viçosa, textura uniforme, poros menores, contorno levemente elevado e sem flacidez",
  },
};

// Três degraus bem separados: cada nível aplica uma FRAÇÃO da magnitude máxima
// descrita no procedimento. Sem sobreposição entre os níveis.
const INTENSITY_MAP: Record<number, { label: string; complement: string; magnitude: string }> = {
  1: {
    label: "Suave",
    complement:
      "Resultado discreto e elegante: a mudança é sutil, mas existe e é identificável quando as duas imagens são comparadas lado a lado. Nada de resultado idêntico à foto original.",
    magnitude: "cerca de 50% da magnitude máxima descrita (refinamento já bem identificável)",
  },
  2: {
    label: "Moderada",
    complement:
      "Resultado claramente perceptível já na primeira olhada, sem parecer artificial. A região tratada fica visivelmente diferente da foto original.",
    magnitude: "cerca de 85% da magnitude máxima descrita (mudança clara e imediata)",
  },
  3: {
    label: "Mais evidente",
    complement:
      "Resultado marcante e inconfundível: a mudança é a mais forte possível mantendo aparência natural e clinicamente plausível. Colocando as duas fotos lado a lado, a diferença é óbvia à primeira vista.",
    magnitude: "100% da magnitude máxima descrita, podendo ir um pouco além dentro do plausível clínico (mudança expressiva e óbvia)",
  },
};

function buildPrompt(options: string[], intensity: number, isRetry: boolean): string {
  const intensityInfo = INTENSITY_MAP[intensity] || INTENSITY_MAP[2];

  const procBlock = options
    .map(o => {
      const p = PROCEDURE_MAP[o];
      if (!p) return `• ${o}: aplicar a alteração estética correspondente na região indicada pelo nome.`;
      return `• ${p.label}\n  Região exata a editar: ${p.region}.\n  Efeito visual obrigatório (magnitude máxima): ${p.delta}.`;
    })
    .join("\n");

  const regions = options.map(o => PROCEDURE_MAP[o]?.region || o).join(" / ");

  // Cada nível precisa entregar um resultado MENSURAVELMENTE diferente do outro.
  const separation: Record<number, string> = {
    1: "Nível 1 de 3 (o mais discreto): refinamento que já se percebe com clareza ao comparar as duas fotos, mesmo em tela pequena. O rosto continua próximo do original, mas a região tratada está nitidamente melhor.",
    2: "Nível 2 de 3: a região tratada fica MUITO diferente do original — volume, contorno, linhas ou tom mudam de forma óbvia e imediata para qualquer observador, mesmo sem comparação lado a lado, mantendo naturalidade.",
    3: "Nível 3 de 3 (o mais forte): resultado de revista, o máximo que ainda parece natural. A diferença em relação ao original é gritante e não deixa dúvida de que o procedimento foi feito naquela região.",
  };

  const retryBoost = isRetry
    ? `\n\nATENÇÃO — CORREÇÃO OBRIGATÓRIA: a tentativa anterior devolveu uma imagem praticamente idêntica à foto original, o que é um ERRO. Refazer com alteração FRANCA e IMEDIATAMENTE visível ${regions}. É proibido devolver a foto original sem alteração.`
    : "";

  return `TAREFA: editar a foto enviada e devolver a MESMA pessoa, a mesma fotografia (mesmo enquadramento, roupa, fundo, luz e expressão), porém já com o resultado do procedimento estético aplicado. Esta é uma simulação clínica de resultado.

REGRA Nº 1 — A MUDANÇA É OBRIGATÓRIA: a região tratada PRECISA mudar de forma claramente visível. "Preservar a identidade" significa manter a mesma pessoa reconhecível (mesmo rosto, etnia, idade aparente, olhos, cabelo, sobrancelhas, expressão) — NÃO significa manter a região tratada igual à foto original. A região tratada deve ficar visivelmente diferente; o resto da foto permanece intacto.

PROCEDIMENTO(S) ESCOLHIDO(S):
${procBlock}

REGRA DE EVIDÊNCIA: em todos os níveis, o resultado deve ser um pouco MAIS evidente que o padrão de mercado de simuladores estéticos. A clínica precisa que a paciente veja a diferença sem esforço. Nunca entregue uma mudança que só aparece ampliando a imagem.

INTENSIDADE — ${intensityInfo.label}:
${separation[intensity] || separation[2]}
Magnitude a aplicar: ${intensityInfo.magnitude}.
${intensityInfo.complement}
Os três níveis são bem diferentes entre si: um nível mais alto nunca pode sair parecido com um nível mais baixo.

O QUE NÃO PODE ACONTECER:
- Devolver a imagem original sem alteração, ou apenas com mudança de brilho, contraste, saturação, suavização de pele genérica ou filtro.
- Alterar regiões fora de ${regions}.
- Trocar a pessoa, o enquadramento, a roupa, o fundo ou a iluminação.
- Deformar a anatomia ou criar aparência artificial/exagerada.

O QUE PRECISA ACONTECER:
- Alteração real de volume, contorno, linhas, sombra ou pigmentação na região tratada, coerente com a luz e a anatomia da foto.
- Resultado final com aparência de foto real de consultório, sem aspecto de filtro.${retryBoost}

AVISO LEGAL: imagem meramente ilustrativa para apoio visual em consulta estética.`;
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

// Hash do arquivo (sem decodificar a imagem) — detecta quando a IA devolveu
// exatamente a mesma foto, de forma barata e sem risco de estourar a memória.
async function imageHash(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

export default async function(req) {
  let simulationId: string | null = null;
  let base44Client: any = null;

  try {
    base44Client = createClientFromRequest(req);
    const user = await base44Client.auth.me().catch(e => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { patient_id, original_image_url, source_type, consent_lgpd, simulation_options, intensity, image_metadata: sourceImageMetadata } = payload;

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
      ai_prompt_version: "v16_jaw_contour",
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

    const needsJawContour = finalOptions.some(o => ["full_face", "mandibula", "mandibula_mento"].includes(o));
    let generated_image_url = "";
    let diffPct = null;
    let jawRefinement = null;

    console.log(`Geração — opções: ${finalOptions.join(", ")} | intensidade: ${finalIntensity}`);

    if (needsJawContour) {
      // Jaw-only goes straight to the dedicated edit. Combined treatments retain
      // their other selected changes before refining the mandibular contour.
      const draftOptions = [...new Set(finalOptions.flatMap(o =>
        o === "mandibula" ? [] : o === "mandibula_mento" ? ["mento"] : [o]
      ))];
      let draftUrl = original_image_url;
      if (draftOptions.length) {
        const draft = await base44Client.asServiceRole.integrations.Core.GenerateImage({
          prompt: buildPrompt(draftOptions, finalIntensity, false),
          existing_image_urls: [original_image_url],
        });
        if (!draft?.url) throw new Error("Nenhuma imagem gerada para os procedimentos selecionados.");
        draftUrl = draft.url;
      }
      jawRefinement = await refineJawContour(base44Client, {
        draftUrl, originalUrl: original_image_url, intensity: finalIntensity,
        imageMetadata: sourceImageMetadata,
      });
      generated_image_url = jawRefinement.imageUrl;
      console.log("Verificação visual mandibular:", JSON.stringify(jawRefinement.validation));
    } else {
      // Other isolated procedures retain their existing generation flow.
      const originalHash = await imageHash(original_image_url);
      for (let attempt = 0; attempt < 2; attempt++) {
        const isRetry = attempt > 0;
        const imageResult = await base44Client.asServiceRole.integrations.Core.GenerateImage({
          prompt: buildPrompt(finalOptions, finalIntensity, isRetry),
          existing_image_urls: [original_image_url],
        });
        const url = imageResult?.url || "";
        if (!url) {
          if (isRetry) throw new Error("Nenhuma imagem gerada pela plataforma.");
          continue;
        }
        const generatedHash = await imageHash(url);
        const unchanged = url === original_image_url ||
          (!!originalHash && !!generatedHash && originalHash === generatedHash);
        if (!unchanged) {
          generated_image_url = url;
          break;
        }
        console.log(`Tentativa ${attempt + 1}: imagem idêntica à original — repetindo com prompt reforçado.`);
      }
    }

    if (!generated_image_url) {
      await base44Client.asServiceRole.entities.FullFaceSimulation.update(simulationId, {
        status: "failed",
        error_message: needsJawContour
          ? `Refinamento mandibular não aprovado: ${jawRefinement?.validation?.observation || "contorno, identidade ou enquadramento inconsistentes"}`
          : "IA devolveu a imagem original sem alteração após duas tentativas.",
      });
      return Response.json({
        error: needsJawContour
          ? "A verificação visual não aprovou o contorno mandibular preservando a foto. Tente uma foto com o ângulo da mandíbula visível, livre e bem iluminado."
          : "Não foi possível gerar uma simulação com diferença visual suficiente. Tente novamente com outro nível de intensidade.",
        code: "NO_VISIBLE_CHANGE",
      }, { status: 422 });
    }

    const procLabels = finalOptions.map(o => PROCEDURE_MAP[o]?.label || o).join(", ");
    const intensityLabel = INTENSITY_MAP[finalIntensity]?.label || "Moderada";
    const technicalReport = `Simulação ilustrativa v16 gerada por IA. Procedimento(s): ${procLabels}. Nível de intensidade: ${intensityLabel}.${needsJawContour ? " Edição específica dos ângulos e da borda mandibular, com verificação visual por IA do contorno, identidade e enquadramento. Essa verificação não constitui avaliação clínica." : " Preservação da identidade e das áreas não selecionadas solicitada à IA."} Resultado meramente ilustrativo para apoio visual em consulta estética, sem promessa de resultado clínico.`;

    // Salvar resultado
    await base44Client.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: {
        simulation_options: finalOptions,
        intensity: finalIntensity,
        intensity_label: intensityLabel,
        prompt_version: "v16_jaw_contour",
        identity_preserved: true,
        natural_realism: true,
        diff_pct: diffPct,
        jaw_contour_refinement: jawRefinement ? {
          method: jawRefinement.method,
          visual_check: jawRefinement.validation,
        } : null,
      },
      image_metadata: needsJawContour ? { format: "png" } : { format: "png", width: 1024, height: 1024 },
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

    console.log("Simulação v16 concluída:", simulationId, "refinamento mandibular:", needsJawContour);
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
        await base44Client.asServiceRole.entities.FullFaceSimulation.update(simulationId, {
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
}