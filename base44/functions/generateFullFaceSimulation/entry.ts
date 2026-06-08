import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Prompts por opção de simulação — MODO CLÍNICO REALISTA
const OPTION_PROMPTS = {
  full_face: "Very subtly improve overall skin texture and tone uniformity only. Do NOT alter any facial structure, proportions, or features.",
  testa: "Very gently reduce forehead lines using skin texture editing only. Do NOT move, reshape, or alter eyebrows, hairline, or any structural feature.",
  glabela: "Slightly soften the vertical lines between the eyebrows using texture-only editing. Do NOT change eyebrow shape, thickness, or position.",
  pes_galinha: "Lightly smooth crow's feet lines at the outer eye corners using texture editing only. Do NOT alter eye shape, size, or surrounding structures.",
  mandibula: "Very subtly improve skin texture and shadow along the jawline only. Do NOT alter bone structure, jaw shape, or face width.",
  mento: "Slightly improve skin texture in the chin area only. Do NOT change chin projection, shape, or proportion.",
  mandibula_mento: "Very subtly refine skin texture along jawline and chin area only. Do NOT alter bone structure or facial proportions.",
  melasma: "Reduce melasma patches and dark spots using skin tone correction only. Do NOT change skin texture, pore visibility, or any facial feature.",
  olheiras: "Gently reduce under-eye darkness and puffiness using color correction only. Do NOT alter eye shape, lower eyelid, or surrounding skin structure.",
  labios: "Very slightly improve lip moisture and surface texture. Do NOT change lip shape, volume, borders, or proportion.",
  nariz: "Very subtle nasal skin texture refinement only. Do NOT alter nasal shape, size, tip, bridge, or width.",
  papada: "Very gently reduce submental shadow and skin laxity appearance. Do NOT change facial structure, neck shape, or jaw definition.",
};

function buildPrompt(simulationOptions) {
  if (!simulationOptions || simulationOptions.length === 0) simulationOptions = ["full_face"];
  const improvements = simulationOptions
    .map((opt, i) => `${i + 1}. ${OPTION_PROMPTS[opt] || ""}`)
    .filter(p => p.trim().length > 3)
    .join("\n");

  return `You are a professional medical-aesthetic retouching specialist. Your task is to produce a CLINICAL REALISTIC simulation that looks like a photograph lightly retouched by an expert Photoshop artist — NOT an AI-generated image.

Create a SIDE-BY-SIDE comparison image:
- LEFT SIDE: The original photo labeled "ANTES" — completely UNCHANGED, pixel-perfect copy
- RIGHT SIDE: The same photo with ONLY the requested minimal corrections, labeled "DEPOIS"

REQUESTED CORRECTIONS (right side only — apply with maximum conservatism):
${improvements}

ABSOLUTE PRESERVATION RULES — these elements must be PIXEL-IDENTICAL between left and right:
- Eyes: exact same shape, iris color, iris size, pupil, eyelid fold, eye distance
- Eyebrows: exact same shape, thickness, arch, position, color
- Eyelashes: exact same length and curl
- Nose: exact same shape, width, tip, bridge, nostrils
- Mouth and lips: exact same shape, volume, borders, philtrum
- Beard and facial hair: exactly preserved
- Hair: exact same hairline, style, color, texture
- Ears: unchanged
- Clothing and accessories: unchanged
- Background and scenery: unchanged
- Lighting and shadows: unchanged
- Camera angle and framing: unchanged
- Facial expression: unchanged
- Skin texture and pore pattern: preserved except in specifically requested zones
- Bone structure and facial proportions: NEVER altered

FORBIDDEN ALTERATIONS — if any of these occur, the result is invalid:
- Any change to eye shape or inter-ocular distance
- Any change to eyebrow shape or thickness
- Any change to nose shape or size
- Any change to lip shape or volume
- Any change to hairline
- Any structural change to jawbone or mandible
- Any change to overall facial proportions

QUALITY STANDARD:
- Realism = maximum
- Transformation intensity = minimal/conservative
- Result must be indistinguishable from a manual professional retouch
- A viewer must think: "This is the exact same photograph, slightly improved" — NOT "This was created by AI"
- Add small "ANTES" label on left and "DEPOIS" label on right
- Add footer: "Simulação Estética IA — Resultado Ilustrativo"`;
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
      ai_prompt_version: "v5_clinical_realistic",
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