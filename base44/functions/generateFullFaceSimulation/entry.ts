import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import OpenAI from 'npm:openai@4.0.0';

// Mapa de prompts por opção de simulação
const OPTION_PROMPTS = {
  full_face: "Apply a complete Full Face harmonization: subtly improve facial symmetry, jawline definition, slight chin projection, minimal submental reduction, soft nasal refinement, natural skin texture improvement, and overall balanced appearance.",
  testa: "Soften horizontal forehead lines and wrinkles, maintaining natural expression and skin texture. Do not over-smooth — keep realistic skin appearance.",
  glabela: "Reduce the vertical frown lines between the eyebrows (glabellar lines), maintaining natural facial expression and identity.",
  pes_galinha: "Soften the crow's feet wrinkles at the outer corners of the eyes, keeping a natural and expressive look.",
  mandibula: "Enhance the jawline definition and symmetry, maintaining natural anatomy and identity. Subtle improvement only.",
  mento: "Slightly improve chin projection and balance for better facial profile proportion. Natural and subtle enhancement.",
  mandibula_mento: "Improve jawline definition and chin projection together for a more balanced facial contour. Natural and realistic.",
  melasma: "Reduce the appearance of melasma, dark spots, and skin pigmentation irregularities. Maintain natural skin texture — do not create an artificial or overly smooth look.",
  olheiras: "Reduce the appearance of dark circles and under-eye hollows, maintaining natural facial expression and realistic skin tone.",
  labios: "Add subtle lip hydration, definition, and slight natural volume. No dramatic augmentation — keep it realistic and natural.",
  nariz: "Apply a subtle rhinomodeling simulation: refine nasal bridge, slightly improve tip definition, maintain identity and natural proportions.",
  papada: "Reduce the appearance of a double chin and improve the submental contour and lower face definition. Realistic and natural result.",
};

const BASE_PROMPT = `You are a professional aesthetic medicine simulation AI. Generate a realistic, natural, and elegant "before and after" facial simulation.

Create a SIDE-BY-SIDE comparison image:
- LEFT SIDE: Original "ANTES" (Before) photo — UNCHANGED, exactly as provided
- RIGHT SIDE: Enhanced "DEPOIS" (After) simulation with the requested improvements

IMPROVEMENTS TO APPLY (right side only):
{IMPROVEMENTS}

CRITICAL IDENTITY PRESERVATION RULES:
- MUST maintain the exact same person's identity, ethnicity, and age range
- Keep original clothing, hair color, eye color, and background
- NO artificial, plastic, over-filtered, or fantasy appearance
- NO extreme rejuvenation or age alteration beyond 5 years
- NO gender changes or dramatic structural changes
- NO cartoon, artistic, or photoshop-filter effects
- The result must look like a real clinical photograph

OUTPUT FORMAT:
- Horizontal side-by-side layout (1024x512 or 1024x1024)
- "ANTES" label on the left side (white text, dark semi-transparent background)
- "DEPOIS" label on the right side (white text, dark semi-transparent background)
- Thin white divider line between the two sides
- Small footer: "Simulação Estética IA — Resultado Ilustrativo"
- Premium clinical photography aesthetic, professional medical imaging quality`;

function buildPrompt(simulationOptions) {
  if (!simulationOptions || simulationOptions.length === 0) {
    simulationOptions = ["full_face"];
  }

  const improvements = simulationOptions
    .map(opt => OPTION_PROMPTS[opt] || "")
    .filter(Boolean)
    .map((p, i) => `${i + 1}. ${p}`)
    .join("\n");

  return BASE_PROMPT.replace("{IMPROVEMENTS}", improvements);
}

function buildTechnicalReport(simulationOptions) {
  const labels = {
    full_face: "Harmonização Full Face",
    testa: "Suavização de rugas da testa",
    glabela: "Tratamento da região glabelar",
    pes_galinha: "Suavização de pés de galinha",
    mandibula: "Definição mandibular",
    mento: "Projeção e equilíbrio do mento",
    mandibula_mento: "Contorno mandibular e mento",
    melasma: "Tratamento de melasma e manchas",
    olheiras: "Suavização de olheiras",
    labios: "Hidratação e definição labial",
    nariz: "Rinomodelação sutil",
    papada: "Contorno submentoniano e papada",
  };
  const areas = simulationOptions.map(o => labels[o] || o).join(", ");
  return `Simulação clínica realizada nas seguintes áreas: ${areas}. Resultado meramente ilustrativo para apoio visual em consulta estética. Não representa promessa de resultado. O resultado real depende de avaliação profissional, anatomia individual e resposta biológica da paciente.`;
}

Deno.serve(async (req) => {
  let simulationId = null;
  let base44Client = null;

  try {
    base44Client = createClientFromRequest(req);

    const user = await base44Client.auth.me();
    if (!user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar API Key
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({
        error: "API da OpenAI ainda não configurada. Insira a chave OPENAI_API_KEY nas variáveis de ambiente para ativar a geração de antes e depois.",
        code: "MISSING_API_KEY"
      }, { status: 503 });
    }

    const payload = await req.json();
    const {
      patient_id,
      original_image_url,
      source_type,
      consent_lgpd,
      simulation_options,
    } = payload;

    if (!patient_id || !original_image_url) {
      return Response.json({ error: "patient_id e original_image_url são obrigatórios" }, { status: 400 });
    }

    if (!consent_lgpd) {
      return Response.json({ error: "Consentimento LGPD é obrigatório" }, { status: 400 });
    }

    const validSourceTypes = ["front_camera", "back_camera", "webcam", "upload"];
    const finalSourceType = validSourceTypes.includes(source_type) ? source_type : "upload";
    const finalOptions = Array.isArray(simulation_options) && simulation_options.length > 0
      ? simulation_options
      : ["full_face"];

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
      ai_prompt_version: "v3",
    });
    simulationId = simulation.id;

    // Buscar nome da paciente
    try {
      const patient = await base44Client.entities.Patient.get(patient_id);
      if (patient?.full_name) {
        await base44Client.entities.FullFaceSimulation.update(simulationId, { patient_name: patient.full_name });
      }
    } catch (e) {
      console.log("Aviso: não foi possível buscar nome da paciente:", e.message);
    }

    // Baixar imagem original
    const imageResponse = await fetch(original_image_url);
    if (!imageResponse.ok) {
      throw new Error(`Falha ao baixar imagem original (HTTP ${imageResponse.status}). Verifique a URL.`);
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageArrayBuffer);

    if (imageBytes.length < 1000) {
      throw new Error("Imagem inválida ou muito pequena. Tente novamente com outra foto.");
    }

    // Determinar tipo MIME
    const urlPath = original_image_url.split("?")[0];
    const ext = urlPath.split(".").pop()?.toLowerCase() || "jpg";
    const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const mimeType = mimeMap[ext] || "image/jpeg";
    const fileExt = mimeType === "image/png" ? "png" : "jpg";

    const imageBlob = new Blob([imageBytes], { type: mimeType });
    const imageFile = new File([imageBlob], `photo.${fileExt}`, { type: mimeType });

    // Chamar OpenAI
    const openai = new OpenAI({ apiKey });
    const prompt = buildPrompt(finalOptions);

    console.log("Chamando OpenAI images.edit para opções:", finalOptions.join(", "));

    let aiResponse;
    try {
      aiResponse = await openai.images.edit({
        image: imageFile,
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });
    } catch (openaiErr) {
      const msg = openaiErr?.message || "Erro desconhecido na API da OpenAI";
      if (msg.includes("billing") || msg.includes("quota") || msg.includes("insufficient")) {
        throw new Error("Cota da API da OpenAI esgotada ou problema de faturamento. Verifique sua conta.");
      }
      if (msg.includes("invalid_api_key") || msg.includes("Incorrect API key")) {
        throw new Error("API Key da OpenAI inválida. Verifique a configuração OPENAI_API_KEY.");
      }
      throw new Error(`Erro na geração de imagem: ${msg}`);
    }

    if (!aiResponse.data?.[0]?.b64_json) {
      throw new Error("OpenAI não retornou imagem válida. Tente novamente.");
    }

    // Converter base64 → Uint8Array
    const generatedBase64 = aiResponse.data[0].b64_json;
    const binaryString = atob(generatedBase64);
    const generatedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      generatedBytes[i] = binaryString.charCodeAt(i);
    }
    const generatedBlob = new Blob([generatedBytes], { type: "image/png" });
    const generatedFile = new File([generatedBlob], `simulation_${simulationId}.png`, { type: "image/png" });

    // Upload da imagem gerada
    const uploadResult = await base44Client.asServiceRole.integrations.Core.UploadFile({ file: generatedFile });

    if (!uploadResult?.file_url) {
      throw new Error("Falha ao fazer upload da imagem gerada.");
    }

    const generated_image_url = uploadResult.file_url;
    const technicalReport = buildTechnicalReport(finalOptions);

    // Atualizar registro com sucesso
    await base44Client.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: { simulation_options: finalOptions },
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
        details: { patient_id, source_type: finalSourceType, consent_lgpd: true, simulation_options: finalOptions },
      });
    } catch (e) {
      console.log("Aviso: log de auditoria falhou:", e.message);
    }

    console.log("Simulação gerada com sucesso:", simulationId);

    return Response.json({
      success: true,
      simulation_id: simulationId,
      generated_image_url,
      technical_report: technicalReport,
      message: "Simulação gerada com sucesso",
    });

  } catch (error) {
    console.error("Erro na geração:", error.message);

    if (simulationId && base44Client) {
      try {
        await base44Client.entities.FullFaceSimulation.update(simulationId, {
          status: "failed",
          error_message: error.message,
        });
      } catch (e) {
        console.log("Não foi possível atualizar status para failed:", e.message);
      }
    }

    return Response.json({
      error: error.message || "Não conseguimos gerar a simulação. Tente com outra foto ou aguarde instantes.",
      code: "GENERATION_FAILED",
    }, { status: 500 });
  }
});