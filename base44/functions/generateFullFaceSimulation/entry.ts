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

  return `Edit this patient's photo to show the realistic, natural-looking result of these aesthetic procedures: ${areaLabels}.

The output must be the SAME PERSON in the same photo — same face, same ethnicity, same skin tone, same eyes, same hair, same clothes, same background, same lighting and angle. It must look like an authentic clinical before/after, not an AI render.

FIDELITY RULES:
• Keep the patient 100% recognizable — preserve identity, facial structure, and natural proportions.
• Preserve real skin texture, pores and micro-imperfections — do not produce smooth, plastic or waxy skin.
• Keep the patient's natural facial asymmetry — do not force a perfectly symmetrical "mask" face.
• No generic beautification filters, no glow overlays, no over-brightening. Subtle, conservative changes only (max ~18% visible change).
${isFull
    ? `• Full Face: apply balanced, conservative harmonization across all zones respecting the patient's own facial proportions.`
    : `• Edit ONLY the selected areas (${areaLabels}); leave the rest of the face unchanged.`}

PROCEDURE NOTES:
• Nose (rinomodelação): refine the nose profile and tip following the patient's natural nasal anatomy, correcting asymmetries anatomically (not mirrored-perfect) — like a well-executed non-surgical rhinoplasty.
• Lips: enhance volume and definition following the natural Cupid's bow — never exaggerated, never blurred borders.
• Wrinkles: soften line depth partially, keeping natural residual expression lines.
• Under-eye: reduce dark circles subtly while keeping natural periorbital shadow.
• Jawline/chin/submental: contour with realistic shading consistent with the original light source.
• Pigmentation: even out tone only within the affected area, blending with surrounding skin.

Match the original photo's color temperature, noise and lighting exactly. The result must look like a real photograph of the same person.`;
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
      ai_prompt_version: "v12_natural",
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
    const technicalReport = `Simulação clínica v12 gerada com IA nas áreas: ${areaLabels}. Edição fotorealista preservando identidade, textura de pele natural e assimetria característica do rosto. Procedimentos aplicados de forma anatômica e conservadora (máx. 18% de alteração visível). Resultado meramente ilustrativo para apoio visual em consulta estética.`;

    // Salvar resultado
    await base44Client.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: {
        simulation_options: finalOptions,
        prompt_version: "v12_natural",
        identity_preserved: true,
        natural_realism: true,
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