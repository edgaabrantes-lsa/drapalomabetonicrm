import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import OpenAI from 'npm:openai@4.0.0';

const FULL_FACE_PROMPT = `You are a professional aesthetic medicine simulation AI. Generate a realistic, natural, and elegant facial harmonization "before and after" image.

Create a SIDE-BY-SIDE comparison image in HORIZONTAL layout:
- LEFT SIDE: Original "ANTES" (Before) photo — unchanged, exactly as provided
- RIGHT SIDE: Enhanced "DEPOIS" (After) simulation — subtle, realistic improvements

Apply these subtle premium aesthetic improvements to the AFTER side only:
- Soft chin projection enhancement (not dramatic)
- Gentle jawline definition and lift
- Minimal submental area reduction
- Subtle nasal refinement based on facial symmetry
- Discrete facial contour improvement
- Natural skin texture improvement
- Rested and harmonious appearance

CRITICAL IDENTITY PRESERVATION:
- MUST maintain the exact same person's identity, ethnicity, and age range
- Keep original clothing, hair, and background intact
- NO artificial, plastic, or over-filtered appearance
- NO extreme youth rejuvenation or age alteration
- NO gender changes
- NO dramatic structural changes
- NO artistic or cartoon effects
- NO background replacement

IMAGE FORMAT:
- Horizontal side-by-side layout (1:1 aspect each side)
- "ANTES" label on bottom-left of original side (white text, dark background)
- "DEPOIS" label on bottom-left of simulated side (white text, dark background)
- Thin dark divider line between the two sides
- Premium dark footer bar with subtle gold accents
- Footer text (small, elegant): "Simulação Estética IA — Resultado Ilustrativo"

STYLE: Clinical photography aesthetic, professional medical imaging, premium quality, realistic lighting, 1024x512 output`;

Deno.serve(async (req) => {
  let simulationId = null;

  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const payload = await req.json();
    const {
      patient_id,
      original_image_url,
      source_type,
      consent_lgpd,
      requested_protocol = "full_face_premium"
    } = payload;

    if (!patient_id || !original_image_url) {
      return Response.json({ error: "patient_id e original_image_url são obrigatórios" }, { status: 400 });
    }

    if (!consent_lgpd) {
      return Response.json({ error: "Consentimento LGPD é obrigatório" }, { status: 400 });
    }

    const validSourceTypes = ["front_camera", "back_camera", "webcam", "upload"];
    const finalSourceType = validSourceTypes.includes(source_type) ? source_type : "upload";

    // Criar registro inicial
    const simulation = await base44.entities.FullFaceSimulation.create({
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
      protocol_type: requested_protocol,
      ai_prompt_version: "v2"
    });
    simulationId = simulation.id;

    // Buscar nome da paciente
    try {
      const patient = await base44.entities.Patient.get(patient_id);
      if (patient?.full_name) {
        await base44.entities.FullFaceSimulation.update(simulationId, { patient_name: patient.full_name });
      }
    } catch (e) {
      console.log("Aviso: não foi possível buscar nome da paciente:", e.message);
    }

    // Baixar imagem original
    const imageResponse = await fetch(original_image_url);
    if (!imageResponse.ok) {
      throw new Error("Falha ao baixar imagem original. Verifique a URL.");
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageArrayBuffer);

    // Determinar tipo MIME
    const urlPath = original_image_url.split("?")[0];
    const ext = urlPath.split(".").pop()?.toLowerCase() || "jpg";
    const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const mimeType = mimeMap[ext] || "image/jpeg";

    const imageBlob = new Blob([imageBytes], { type: mimeType });

    // Chamar OpenAI images.edit
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

    const aiResponse = await openai.images.edit({
      image: new File([imageBlob], `photo.${ext}`, { type: mimeType }),
      prompt: FULL_FACE_PROMPT,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    if (!aiResponse.data?.[0]?.b64_json) {
      throw new Error("OpenAI não retornou imagem válida");
    }

    // Converter base64 para Uint8Array
    const generatedBase64 = aiResponse.data[0].b64_json;
    const binaryString = atob(generatedBase64);
    const generatedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      generatedBytes[i] = binaryString.charCodeAt(i);
    }
    const generatedBlob = new Blob([generatedBytes], { type: "image/png" });

    // Upload via SDK do base44 (serviço interno)
    const generatedFile = new File([generatedBlob], `simulation_${simulationId}.png`, { type: "image/png" });
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: generatedFile });

    if (!uploadResult?.file_url) {
      throw new Error("Falha ao fazer upload da imagem gerada");
    }

    const generated_image_url = uploadResult.file_url;
    const technicalReport = "Simulação com foco em equilíbrio do terço inferior facial, projeção suave de mento, definição mandibular, redução visual submentoniana e refinamento nasal sutil. Resultado meramente ilustrativo para apoio visual em consulta.";

    // Atualizar registro com sucesso
    await base44.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      image_metadata: { format: "png", width: 1024, height: 1024 }
    });

    // Log de auditoria
    try {
      await base44.entities.AuditLog.create({
        action: "create",
        entity_type: "FullFaceSimulation",
        entity_id: simulationId,
        user_email: user.email || "",
        user_role: user.role || "user",
        details: { patient_id, source_type: finalSourceType, consent_lgpd: true }
      });
    } catch (e) {
      console.log("Aviso: log de auditoria falhou:", e.message);
    }

    return Response.json({
      success: true,
      simulation_id: simulationId,
      generated_image_url,
      technical_report: technicalReport,
      message: "Simulação gerada com sucesso"
    });

  } catch (error) {
    console.error("Erro na geração:", error.message);

    // Marcar como failed
    if (simulationId) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.entities.FullFaceSimulation.update(simulationId, {
          status: "failed",
          error_message: error.message
        });
      } catch (e) {
        console.log("Não foi possível atualizar status para failed:", e.message);
      }
    }

    return Response.json({
      error: "Não conseguimos gerar a simulação. Tente com outra foto ou aguarde instantes.",
      technical_error: error.message
    }, { status: 500 });
  }
});