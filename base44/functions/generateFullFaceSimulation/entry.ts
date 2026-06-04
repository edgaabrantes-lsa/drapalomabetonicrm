import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Prompts por opção de simulação
const OPTION_PROMPTS = {
  full_face: "Apply a complete Full Face harmonization: subtly improve facial symmetry, jawline definition, slight chin projection, minimal submental reduction, soft nasal refinement, natural skin texture improvement, and overall balanced appearance.",
  testa: "Soften horizontal forehead lines and wrinkles, maintaining natural expression and skin texture.",
  glabela: "Reduce the vertical frown lines between the eyebrows (glabellar lines), maintaining natural facial expression.",
  pes_galinha: "Soften the crow's feet wrinkles at the outer corners of the eyes, keeping a natural and expressive look.",
  mandibula: "Enhance the jawline definition and symmetry, maintaining natural anatomy. Subtle improvement only.",
  mento: "Slightly improve chin projection and balance for better facial profile proportion. Natural and subtle.",
  mandibula_mento: "Improve jawline definition and chin projection together for a more balanced facial contour.",
  melasma: "Reduce the appearance of melasma, dark spots, and skin pigmentation irregularities. Maintain natural skin texture.",
  olheiras: "Reduce the appearance of dark circles and under-eye hollows, maintaining natural facial expression.",
  labios: "Add subtle lip hydration, definition, and slight natural volume. No dramatic augmentation.",
  nariz: "Apply a subtle rhinomodeling simulation: refine nasal bridge, slightly improve tip definition.",
  papada: "Reduce the appearance of a double chin and improve the submental contour. Realistic and natural.",
};

function buildPrompt(simulationOptions) {
  if (!simulationOptions || simulationOptions.length === 0) simulationOptions = ["full_face"];
  const improvements = simulationOptions
    .map((opt, i) => `${i + 1}. ${OPTION_PROMPTS[opt] || ""}`)
    .filter(p => p.trim().length > 3)
    .join("\n");

  return `You are a professional aesthetic medicine simulation AI. Generate a realistic, natural "before and after" facial simulation.

Create a SIDE-BY-SIDE comparison image:
- LEFT SIDE: Original "ANTES" (Before) photo — UNCHANGED, exactly as provided
- RIGHT SIDE: Enhanced "DEPOIS" (After) simulation with requested improvements

IMPROVEMENTS TO APPLY (right side only):
${improvements}

CRITICAL RULES:
- MUST maintain exact same person's identity, ethnicity, and age
- Keep original clothing, hair, background, eye color
- NO artificial, plastic, or over-filtered appearance
- NO dramatic structural changes or extreme rejuvenation
- Result must look like a real clinical photograph
- Add small "ANTES" label on left side and "DEPOIS" on right side
- Add footer text: "Simulação Estética IA — Resultado Ilustrativo"`;
}

function buildTechnicalReport(simulationOptions) {
  const labels = {
    full_face: "Harmonização Full Face",
    testa: "Rugas da testa",
    glabela: "Glabela",
    pes_galinha: "Pés de galinha",
    mandibula: "Definição mandibular",
    mento: "Mento/queixo",
    mandibula_mento: "Mandíbula + mento",
    melasma: "Melasma e manchas",
    olheiras: "Olheiras",
    labios: "Lábios",
    nariz: "Rinomodelação",
    papada: "Papada e contorno inferior",
  };
  const areas = simulationOptions.map(o => labels[o] || o).join(", ");
  return `Simulação clínica nas áreas: ${areas}. Resultado meramente ilustrativo para apoio visual em consulta estética. Não representa promessa de resultado clínico.`;
}

Deno.serve(async (req) => {
  let simulationId = null;
  let base44Client = null;

  try {
    base44Client = createClientFromRequest(req);

    const user = await base44Client.auth.me();
    if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({
        error: "API da OpenAI não configurada. Insira a chave OPENAI_API_KEY no ambiente seguro para ativar a geração de imagens.",
        code: "MISSING_API_KEY"
      }, { status: 503 });
    }

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
    const finalOptions = Array.isArray(simulation_options) && simulation_options.length > 0
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
      ai_prompt_version: "v4",
    });
    simulationId = simulation.id;

    // Buscar nome da paciente (não crítico)
    try {
      const patient = await base44Client.entities.Patient.get(patient_id);
      if (patient?.full_name) {
        await base44Client.entities.FullFaceSimulation.update(simulationId, { patient_name: patient.full_name });
      }
    } catch (e) {
      console.log("Aviso: não foi possível buscar nome da paciente:", e.message);
    }

    // Baixar imagem original
    console.log("Baixando imagem:", original_image_url.substring(0, 80));
    const imageResponse = await fetch(original_image_url);
    if (!imageResponse.ok) {
      throw new Error(`Falha ao baixar imagem (HTTP ${imageResponse.status}).`);
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageArrayBuffer);
    if (imageBytes.length < 500) throw new Error("Imagem inválida ou muito pequena.");

    // Detectar MIME pelos magic bytes (mais confiável que Content-Type ou URL)
    let mimeType = "image/jpeg";
    let fileExt = "jpg";
    if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50) {
      mimeType = "image/png"; fileExt = "png";
    } else if (imageBytes[0] === 0xFF && imageBytes[1] === 0xD8) {
      mimeType = "image/jpeg"; fileExt = "jpg";
    } else if (imageBytes[0] === 0x52 && imageBytes[1] === 0x49 && imageBytes[2] === 0x46 && imageBytes[3] === 0x46) {
      mimeType = "image/webp"; fileExt = "webp";
    } else {
      // Fallback: tentar pelo Content-Type
      const ct = imageResponse.headers.get("content-type")?.split(";")[0]?.trim() || "";
      if (ct === "image/png") { mimeType = "image/png"; fileExt = "png"; }
      else if (ct === "image/webp") { mimeType = "image/webp"; fileExt = "webp"; }
    }

    console.log("MIME:", mimeType, "| Tamanho:", imageBytes.length, "bytes | API Key presente:", !!apiKey);
    console.log("Opções:", finalOptions.join(", "));

    // Montar prompt
    const prompt = buildPrompt(finalOptions);
    console.log("Prompt length:", prompt.length);

    // Chamar OpenAI via fetch direto com FormData (evita problema de MIME do SDK no Deno)
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    // Usar Blob com type explícito e filename com extensão correta
    formData.append("image", new Blob([imageBytes], { type: mimeType }), `photo.${fileExt}`);

    console.log("Chamando OpenAI /v1/images/edits com model gpt-image-1...");

    const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: formData,
    });

    const openaiText = await openaiRes.text();
    let openaiJson;
    try { openaiJson = JSON.parse(openaiText); } catch { openaiJson = {}; }

    console.log("OpenAI status:", openaiRes.status);

    if (!openaiRes.ok) {
      const errMsg = openaiJson?.error?.message || openaiText || `HTTP ${openaiRes.status}`;
      console.error("OpenAI error:", errMsg);
      if (errMsg.includes("billing") || errMsg.includes("quota") || errMsg.includes("insufficient")) {
        throw new Error("Cota da API da OpenAI esgotada ou problema de faturamento. Verifique sua conta OpenAI.");
      }
      if (errMsg.includes("invalid_api_key") || errMsg.includes("Incorrect API key")) {
        throw new Error("API Key da OpenAI inválida. Verifique a configuração OPENAI_API_KEY.");
      }
      throw new Error(`Erro na API da OpenAI: ${errMsg}`);
    }

    const imgData = openaiJson.data?.[0];
    if (!imgData) throw new Error("OpenAI não retornou dados de imagem válidos.");

    // Obter base64 — gpt-image-1 retorna b64_json por padrão
    let generatedBase64 = imgData.b64_json;

    // Fallback: se retornou URL
    if (!generatedBase64 && imgData.url) {
      console.log("Baixando imagem gerada da URL...");
      const imgRes = await fetch(imgData.url);
      const imgBuf = await imgRes.arrayBuffer();
      const bytes = new Uint8Array(imgBuf);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      generatedBase64 = btoa(bin);
    }

    if (!generatedBase64) throw new Error("OpenAI não retornou imagem válida.");
    console.log("Imagem gerada! base64 length:", generatedBase64.length);

    // Converter base64 → Uint8Array → File
    const binaryString = atob(generatedBase64);
    const generatedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      generatedBytes[i] = binaryString.charCodeAt(i);
    }
    const generatedFile = new File(
      [new Blob([generatedBytes], { type: "image/png" })],
      `simulation_${simulationId}.png`,
      { type: "image/png" }
    );

    // Upload da imagem gerada
    console.log("Fazendo upload da imagem gerada...");
    const uploadResult = await base44Client.asServiceRole.integrations.Core.UploadFile({ file: generatedFile });
    if (!uploadResult?.file_url) throw new Error("Falha ao fazer upload da imagem gerada.");

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

    // Log de auditoria (não crítico)
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

    console.log("Simulação concluída com sucesso:", simulationId);

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
      error: error.message || "Não conseguimos gerar a simulação. Tente novamente.",
      code: "GENERATION_FAILED",
    }, { status: 500 });
  }
});