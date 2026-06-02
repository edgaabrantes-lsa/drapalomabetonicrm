import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import OpenAI from 'npm:openai@4.0.0';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY não configurada. Verifique as variáveis de ambiente.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Prompt interno para geração da imagem
const FULL_FACE_PROMPT = `Generate a realistic, natural, and elegant full face facial harmonization simulation. Create a side-by-side comparison image:

LEFT SIDE: Original "BEFORE" photo
RIGHT SIDE: Enhanced "AFTER" simulation

Apply these subtle, premium aesthetic improvements to the AFTER side:
- Soft chin/mento projection enhancement
- Gentle jawline definition
- Subtle reduction of submental area (double chin)
- Minimal rhinoplasty refinement based on facial symmetry
- Discrete facial contour lift/suspension
- Natural skin texture improvement (not plastic or artificial)
- Rested, elegant, and harmonious appearance
- Light, sophisticated makeup (if applicable)
- Preserve original facial identity, ethnicity, and age appearance

CRITICAL REQUIREMENTS:
- Maintain the same person's identity
- Keep original clothing and background when possible
- Natural, clinical premium aesthetic
- No artificial, plastic, or filtered appearance
- No exaggerated rejuvenation
- No extreme changes to eyes, lips, or facial structure
- No masculine or aggressive jawline
- Professional medical simulation style

IMAGE FORMAT:
- Horizontal side-by-side layout
- "ANTES" label in bottom-left of original side
- "DEPOIS" label in bottom-left of simulated side
- Premium dark footer bar (black/graphite) with subtle gold/beige accents
- Footer should list these procedures with checkmark icons:
  • Projeção suave de mento
  • Definição da linha mandibular
  • Redução da papada
  • Rinomodelação sutil
  • Suspensão do contorno facial
  • Resultado natural e equilibrado

STYLE: Clinical photography, professional aesthetic medicine, premium quality, realistic lighting, high resolution`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Parse do payload
    const payload = await req.json();
    const { 
      patient_id, 
      original_image_url, 
      source_type, 
      consent_lgpd,
      facial_analysis_data_optional,
      requested_protocol = "full_face_premium"
    } = payload;

    // Validações obrigatórias
    if (!patient_id || !original_image_url) {
      return Response.json({ 
        error: "Dados incompletos: patient_id e original_image_url são obrigatórios" 
      }, { status: 400 });
    }

    if (!consent_lgpd) {
      return Response.json({ 
        error: "Consentimento LGPD é obrigatório para gerar simulação" 
      }, { status: 400 });
    }

    if (!["front_camera", "back_camera", "webcam", "upload"].includes(source_type)) {
      return Response.json({ 
        error: "source_type inválido. Use: front_camera, back_camera, webcam, ou upload" 
      }, { status: 400 });
    }

    // Criar registro inicial no banco
    const simulation = await base44.entities.FullFaceSimulation.create({
      patient_id,
      patient_name: "", // Será preenchido depois
      user_id: user.id,
      user_email: user.email || "",
      original_image_url,
      generated_image_url: "",
      source_type,
      consent_lgpd: true,
      consent_timestamp: new Date().toISOString(),
      status: "processing",
      protocol_type: requested_protocol,
      ai_prompt_version: "v1"
    });

    // Buscar nome da paciente
    try {
      const patient = await base44.entities.Patient.get(patient_id);
      if (patient?.full_name) {
        await base44.entities.FullFaceSimulation.update(simulation.id, {
          patient_name: patient.full_name
        });
      }
    } catch (e) {
      console.log("Não foi possível buscar nome da paciente:", e.message);
    }

    // Baixar imagem original para enviar à OpenAI
    const imageResponse = await fetch(original_image_url);
    if (!imageResponse.ok) {
      throw new Error("Falha ao baixar imagem original");
    }
    
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const imageFormat = original_image_url.split(".").pop()?.toLowerCase() || "jpg";
    const mimeType = `image/${imageFormat === "jpg" ? "jpeg" : imageFormat}`;

    // Chamar OpenAI API para gerar a simulação
    const aiResponse = await openai.images.edit({
      image: new Blob([arrayBuffer], { type: mimeType }),
      prompt: FULL_FACE_PROMPT,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    if (!aiResponse.data?.[0]?.b64_json) {
      throw new Error("OpenAI não retornou imagem válida");
    }

    // Converter base64 para blob e fazer upload
    const generatedBase64 = aiResponse.data[0].b64_json;
    const generatedBuffer = Buffer.from(generatedBase64, "base64");
    const generatedBlob = new Blob([generatedBuffer], { type: "image/png" });
    
    // Upload da imagem gerada
    const uploadForm = new FormData();
    uploadForm.append("file", generatedBlob, `simulation_${simulation.id}.png`);
    
    const uploadResponse = await fetch("https://api.base44.com/v1/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("BASE44_SERVICE_ROLE_KEY")}`
      },
      body: uploadForm
    });

    if (!uploadResponse.ok) {
      throw new Error("Falha ao fazer upload da imagem gerada");
    }

    const uploadResult = await uploadResponse.json();
    const generated_image_url = uploadResult.file_url;

    // Gerar relatório técnico
    const technicalReport = `Simulação gerada com foco em equilíbrio do terço inferior facial, projeção suave de mento, definição mandibular, redução visual da região submentoniana e refinamento nasal sutil. Resultado meramente ilustrativo para apoio visual em consulta, não representando promessa de resultado.`;

    // Atualizar registro com sucesso
    await base44.entities.FullFaceSimulation.update(simulation.id, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: facial_analysis_data_optional || null,
      image_metadata: {
        format: "png",
        width: 1024,
        height: 1024
      }
    });

    // Registrar log de auditoria
    try {
      await base44.entities.AuditLog.create({
        action: "create",
        entity_type: "FullFaceSimulation",
        entity_id: simulation.id,
        user_email: user.email || "",
        user_role: user.role || "user",
        details: {
          patient_id,
          source_type,
          consent_lgpd: true
        }
      });
    } catch (e) {
      console.log("Falha ao criar log de auditoria:", e.message);
    }

    return Response.json({
      success: true,
      simulation_id: simulation.id,
      generated_image_url,
      technical_report: technicalReport,
      message: "Simulação gerada com sucesso"
    });

  } catch (error) {
    console.error("Erro na geração da simulação:", error);
    
    // Atualizar status para failed se tiver simulation_id
    const simulationId = error.simulation_id;
    if (simulationId) {
      try {
        await base44.entities.FullFaceSimulation.update(simulationId, {
          status: "failed",
          error_message: error.message
        });
      } catch (e) {
        console.log("Falha ao atualizar status para failed:", e.message);
      }
    }

    return Response.json({ 
      error: "Não conseguimos gerar a simulação neste momento. Tente novamente com outra imagem ou aguarde alguns instantes.",
      technical_error: error.message
    }, { status: 500 });
  }
});