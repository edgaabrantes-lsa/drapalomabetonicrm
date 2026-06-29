import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ══════════════════════════════════════════════════════════════
//  Simulação Full Face v11 — Usando GenerateImage da plataforma
//  Migrado de gpt-image-1 (instável) para Base44 GenerateImage
// ══════════════════════════════════════════════════════════════

const AREA_LABELS: Record<string, string> = {
  testa:           "forehead wrinkle reduction",
  glabela:         "glabellar frown line softening",
  pes_galinha:     "crow's feet smoothing",
  olheiras:        "under-eye dark circle correction",
  nariz:           "nasal refinement",
  labios:          "lip definition and natural enhancement",
  melasma:         "melasma and hyperpigmentation reduction",
  mandibula:       "jawline contouring",
  mento:           "chin refinement",
  mandibula_mento: "jawline and chin contouring",
  papada:          "submental area reduction",
  full_face:       "full face harmonization",
};

function buildPrompt(options: string[], originalImageUrl: string): string {
  const areaLabels = options.map(o => AREA_LABELS[o] || o).join(", ");
  const isFull = options.includes("full_face");

  return `You are a professional medical-aesthetic photo editor. Based on the patient's original photo provided, create a realistic before/after simulation showing subtle aesthetic improvements.

ORIGINAL PATIENT PHOTO: Use the patient from this photo as reference — same person, same face, same ethnicity, same skin tone.

SELECTED TREATMENT AREAS: ${areaLabels}

CORE RULES:
• The patient must remain 100% recognizable as the same individual
• NEVER change: ethnicity, skin color, eye color, eye shape, facial bone structure, hair, clothing, background
• Apply ONLY minimal, realistic, clinical improvements to the selected areas
• Result must look like professional medical photo retouching — NOT AI-generated
• Transformation intensity: 15-20% maximum change
• Realism level: maximum — must look like the same photo taken at the same moment

${isFull ? `FULL FACE HARMONIZATION:
• Apply very subtle global improvements based on the patient's OWN facial proportions
• Minimal skin texture refinement and tone unification
• Slightly enhance natural facial symmetry without changing identity
• Do not impose external beauty standards` : `LOCALIZED EDITING ONLY:
• Apply improvements STRICTLY to: ${areaLabels}
• All other facial features must remain pixel-perfect identical to the original
• Do not edit ANY area outside the selected treatment zones`}

STYLE: Professional medical aesthetic photography. Clean, clinical, natural. Same lighting, same angle, same background as the original photo.

AVISO LEGAL: Resultado ilustrativo para apoio visual em consulta estética. Não representa promessa de resultado clínico.`;
}

Deno.serve(async (req) => {
  let simulationId: string | null = null;
  let base44Client: any = null;

  try {
    base44Client = createClientFromRequest(req);
    const user = await base44Client.auth.me();
    if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const payload = await req.json();
    const { patient_id, original_image_url, source_type, consent_lgpd, simulation_options } = payload;

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
      ai_prompt_version: "v11_platform",
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

    // Construir prompt
    const prompt = buildPrompt(finalOptions, original_image_url);
    console.log("Gerando simulação com GenerateImage, opções:", finalOptions.join(", "));

    // Chamar GenerateImage via SDK da plataforma (confiável)
    const imageResult = await base44Client.asServiceRole.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: [original_image_url],
    });

    if (!imageResult?.url) {
      throw new Error("Nenhuma imagem gerada pela plataforma.");
    }

    const generated_image_url = imageResult.url;
    const areaLabels = finalOptions.map(o => AREA_LABELS[o] || o).join(", ");
    const technicalReport = `Simulação clínica v11 gerada com IA nas áreas: ${areaLabels}. Identidade facial, etnia, cor dos olhos, tom de pele e elementos não selecionados preservados. Resultado meramente ilustrativo para apoio visual em consulta estética.`;

    // Salvar resultado
    await base44Client.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: {
        simulation_options: finalOptions,
        prompt_version: "v11_platform",
        identity_preserved: true,
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
        details: { patient_id, source_type: finalSourceType, consent_lgpd: true, simulation_options: finalOptions },
      });
    } catch (e) {
      console.log("Log de auditoria falhou (não crítico):", (e as Error).message);
    }

    console.log("Simulação v11 concluída:", simulationId);
    return Response.json({
      success: true,
      simulation_id: simulationId,
      generated_image_url,
      technical_report: technicalReport,
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