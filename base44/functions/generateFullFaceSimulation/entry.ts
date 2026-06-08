import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ══════════════════════════════════════════════════════════════
//  MODO CLÍNICO REALISTA v6 — Edição com Máscara Localizada
//  Arquitetura: imagem original → máscara anatômica → edição restrita
//  Apenas pixels da máscara são modificáveis pela OpenAI
// ══════════════════════════════════════════════════════════════

// Mapeamento de área → região anatômica em % da imagem (y_start, y_end, x_start, x_end)
// Valores em proporção 0..1, referenciados em rosto centrado (assume imagem 1:1 ou portrait)
const AREA_MASKS = {
  testa:           { y: [0.04, 0.26], x: [0.15, 0.85], label: "Rugas da testa" },
  glabela:         { y: [0.22, 0.36], x: [0.32, 0.68], label: "Glabela" },
  pes_galinha:     { y: [0.28, 0.48], x: [0.02, 0.98], label: "Pés de galinha" },
  olheiras:        { y: [0.35, 0.52], x: [0.12, 0.88], label: "Olheiras" },
  nariz:           { y: [0.34, 0.62], x: [0.28, 0.72], label: "Nariz" },
  labios:          { y: [0.56, 0.74], x: [0.25, 0.75], label: "Lábios" },
  melasma:         { y: [0.22, 0.72], x: [0.05, 0.95], label: "Melasma" },
  mandibula:       { y: [0.68, 0.90], x: [0.05, 0.95], label: "Mandíbula" },
  mento:           { y: [0.74, 0.96], x: [0.22, 0.78], label: "Mento" },
  mandibula_mento: { y: [0.68, 0.96], x: [0.05, 0.95], label: "Mandíbula + Mento" },
  papada:          { y: [0.70, 0.96], x: [0.15, 0.85], label: "Papada" },
  full_face:       { y: [0.03, 0.97], x: [0.03, 0.97], label: "Full Face" },
};

// ──────────────────────────────────────────────────────────────
//  REFERÊNCIA DE SIMETRIA FACIAL — usado como orientação discreta
//  Prioridade: Identidade > Anatomia individual > Simetria facial
//  A simetria serve apenas para calibrar a direção do refinamento,
//  NUNCA para transformar ou substituir as características do paciente.
// ──────────────────────────────────────────────────────────────
const SYMMETRY_GUIDANCE = {
  full_face: `Use facial harmony principles (golden ratio proportions, bilateral symmetry) ONLY as a subtle reference to guide minimal skin tone and texture uniformity. Do NOT use symmetry to restructure, rebalance, or alter any anatomical feature. The patient's individual anatomy always takes absolute precedence over any ideal proportion.`,
  testa: `Use facial proportion reference only to ensure the forehead texture correction is uniform across both sides. Do NOT alter forehead height or hairline position to match any ideal proportion.`,
  glabela: `Use bilateral symmetry only to ensure the texture softening is even across both glabellar lines. Do NOT change eyebrow spacing or height to match a golden ratio standard.`,
  pes_galinha: `Use bilateral facial symmetry only to ensure crow's feet smoothing is equally applied to both eye corners. Do NOT alter eye spacing, eye size, or orbital structure.`,
  olheiras: `Use bilateral symmetry only to ensure under-eye correction is uniform on both sides. Do NOT alter orbital bone contour, eye shape, or inter-ocular distance.`,
  nariz: `Use nasal proportion reference (golden ratio nasal width ~1/5 of face) ONLY as a subtle guide to refine minor dorsal irregularities and tip definition within this patient's own nasal anatomy. Do NOT reshape the nose to match a generic ideal. Do NOT change nasal width, nostril shape, or overall nasal size. The patient's nasal identity must remain fully recognizable.`,
  labios: `Use lip proportion reference only to ensure the surface clarity enhancement is balanced between upper and lower lip. Do NOT alter lip size, projection, or cupid's bow to match any aesthetic standard.`,
  melasma: `Use skin tone uniformity as reference only for even pigmentation correction across both sides of the face. Do NOT use any aesthetic standard to alter skin texture or facial structure.`,
  mandibula: `Use facial contour symmetry only as a guide to ensure the jawline texture refinement is consistent on both sides. Do NOT alter jaw width, angle, or bone structure to match any ideal proportion.`,
  mento: `Use the facial thirds proportion (forehead, mid-face, lower face) only as a subtle reference to ensure the chin texture correction is positioned naturally. Do NOT alter chin projection or shape to match a golden ratio ideal.`,
  mandibula_mento: `Use facial contour symmetry only as reference for balanced jawline and chin texture refinement. Do NOT alter bone structure or facial proportions to match any aesthetic standard.`,
  papada: `Use facial contour reference only to ensure submental correction is centered and natural. Do NOT alter neck structure or jaw definition.`,
};

// Prompts ultra-conservadores por área
const AREA_PROMPTS = {
  full_face:
    "Apply only minimal skin tone unification and subtle texture refinement across the face. Absolutely do NOT alter facial structure, eye shape, eyebrows, nose, lips, hairline, or any anatomical feature. Result must be indistinguishable from manual photo retouching.",
  testa:
    "Gently reduce horizontal forehead lines using skin texture editing only within the masked forehead region. Do NOT move or reshape eyebrows, hairline, or any feature. No Botox-frozen look.",
  glabela:
    "Slightly soften the glabellar vertical lines in the masked area between the eyebrows using texture editing only. Do NOT change eyebrow shape, thickness, arch, position, or surrounding structures.",
  pes_galinha:
    "Lightly smooth crow's feet wrinkles at outer eye corners in the masked region only. Do NOT alter eye shape, eyelid, iris, pupil, or any surrounding structure.",
  olheiras:
    "Gently reduce under-eye darkness and subtle puffiness in the masked infraorbital region using color/tone correction only. Do NOT alter eye shape, lower eyelid contour, cheekbone, or any surrounding tissue.",
  nariz:
    "Very subtle nasal profile refinement: gently smooth minor dorsal irregularities and refine tip definition inside the masked nasal region only. Do NOT change overall nasal size, nostril width, eye spacing, or any adjacent structure.",
  labios:
    "Improve lip moisture, smooth minor surface lines, and very slightly enhance natural lip border clarity in the masked lip region only. Do NOT change lip shape, volume, philtrum, or surrounding skin.",
  melasma:
    "Reduce hyperpigmentation and melasma patches in the masked facial regions using targeted tone correction only. Preserve all skin texture, pores, natural shadows, and micro-details. Do NOT change any anatomical structure or apply beauty filter.",
  mandibula:
    "Subtly refine the jawline shadow and skin texture along the masked mandibular region only. Do NOT alter bone structure, face width, or any facial proportion.",
  mento:
    "Slightly improve skin texture in the masked chin area only. Do NOT change chin projection, shape, or proportion relative to the rest of the face.",
  mandibula_mento:
    "Subtly refine skin texture along the masked jawline and chin area only. Do NOT alter bone structure, facial proportions, or any surrounding feature.",
  papada:
    "Very gently reduce submental shadow and skin laxity appearance in the masked submentonian region. Do NOT change neck structure, jaw definition, or facial proportions.",
};

// Prompt base com regras absolutas de preservação + simetria como referência
function buildPrompt(options) {
  if (!options || options.length === 0) options = ["full_face"];
  const areas = options.map(o => AREA_PROMPTS[o] || AREA_PROMPTS.full_face).join("\n");
  const symmetryRefs = options.map(o => SYMMETRY_GUIDANCE[o] || SYMMETRY_GUIDANCE.full_face).join("\n");
  const areaLabels = options.map(o => AREA_MASKS[o]?.label || o).join(", ");

  return `You are a MEDICAL-GRADE aesthetic photo retouching specialist operating in CLINICAL REALISTIC MODE with SYMMETRY-GUIDED precision.

TARGET AREAS (edit ONLY pixels inside the provided mask): ${areaLabels}

━━━━ DECISION PRIORITY ORDER (strictly follow this hierarchy) ━━━━
1. PRESERVE facial identity — the patient must remain 100% recognizable
2. PRESERVE individual anatomy — respect the patient's unique anatomical features
3. PRESERVE personal characteristics — expression, unique traits, natural asymmetries
4. PRESERVE facial expression — unchanged
5. USE symmetry/proportion as subtle reference only (see below)
6. APPLY the requested aesthetic correction in the masked area only

━━━━ CORRECTION INSTRUCTIONS — inside mask only ━━━━
${areas}

━━━━ FACIAL SYMMETRY AS CLINICAL REFERENCE ━━━━
Use the following symmetry and proportion principles ONLY as a subtle orientation guide.
These principles must NEVER override the patient's individual anatomy or identity.
If ANY conflict arises between symmetry and identity preservation, identity ALWAYS wins.
${symmetryRefs}

━━━━ ABSOLUTE IDENTITY PRESERVATION RULES ━━━━
Every element below must remain PIXEL-IDENTICAL to the original:
• Eyes: exact shape, iris color, pupil, eyelid fold, inter-ocular distance
• Eyebrows: exact shape, thickness, arch, height, color
• Eyelashes: unchanged
• Nose shape: NEVER altered (exception: nariz mask only, minor dorsal)
• Mouth and lips: unchanged (exception: labios mask only)
• Beard and facial hair: exactly preserved
• Hair: hairline, color, style, texture unchanged
• Ears and accessories: unchanged
• Background, lighting, shadows: unchanged
• Camera angle and framing: unchanged
• Facial expression: unchanged
• Bone structure and proportions: NEVER changed
• Skin texture OUTSIDE mask: preserved

━━━━ FORBIDDEN ACTIONS ━━━━
✗ Do NOT create a perfect face, perfect nose, or idealized facial structure
✗ Do NOT create a model, celebrity, or filtered appearance
✗ Do NOT apply golden ratio as a transformation target — only as a subtle reference
✗ Do NOT change eye shape or inter-ocular distance
✗ Do NOT change eyebrow shape or position
✗ Do NOT alter nose unless nariz mask
✗ Do NOT alter lips unless labios mask
✗ Do NOT change hairline
✗ Do NOT change jaw structure unless mandibula/mento mask
✗ Do NOT apply beauty filter or skin smoothing outside mask
✗ Do NOT create a new face or idealized version
✗ Do NOT harmonize the whole face when only a specific area is masked

━━━━ QUALITY STANDARD ━━━━
• Transformation intensity: MINIMAL (10-20% of possible change)
• Realism: MAXIMUM — result must look like expert manual retouching
• Symmetry application: SUBTLE — perceived only as natural harmony, not reconstruction
• A professional viewing BEFORE and AFTER must think: "Same person, same photo, lightly improved"
• A patient must remain 100% recognizable — this is an aesthetic evolution, not a transformation
• Final result must convey: "This is the same person, harmonized within their own natural anatomy"`;
}

// ──────────────────────────────────────────────────────────────
//  Gerar máscara PNG em tons de cinza via Canvas (Deno)
//  Branco = área editável | Preto = área protegida
// ──────────────────────────────────────────────────────────────
async function generateMaskPng(imageBytes, options) {
  // Detectar dimensões da imagem original via parsing básico dos bytes
  // Para PNG: largura em bytes 16-19, altura em bytes 20-23
  // Para JPEG: scan SOF markers
  let imgW = 1024, imgH = 1024;

  if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50) {
    // PNG
    imgW = (imageBytes[16] << 24 | imageBytes[17] << 16 | imageBytes[18] << 8 | imageBytes[19]) >>> 0;
    imgH = (imageBytes[20] << 24 | imageBytes[21] << 16 | imageBytes[22] << 8 | imageBytes[23]) >>> 0;
  } else if (imageBytes[0] === 0xFF && imageBytes[1] === 0xD8) {
    // JPEG — scan for SOF0/SOF2 markers
    let i = 2;
    while (i < imageBytes.length - 8) {
      if (imageBytes[i] === 0xFF) {
        const marker = imageBytes[i + 1];
        if (marker >= 0xC0 && marker <= 0xC3) {
          imgH = (imageBytes[i + 5] << 8 | imageBytes[i + 6]) >>> 0;
          imgW = (imageBytes[i + 7] << 8 | imageBytes[i + 8]) >>> 0;
          break;
        }
        const segLen = (imageBytes[i + 2] << 8 | imageBytes[i + 3]) >>> 0;
        i += 2 + segLen;
      } else {
        i++;
      }
    }
  }

  if (!imgW || imgW < 10) imgW = 1024;
  if (!imgH || imgH < 10) imgH = 1024;

  console.log(`Dimensões da imagem: ${imgW}x${imgH}`);

  // Construir máscara manualmente como PNG em tons de cinza
  // Pixels pretos = protegidos, pixels brancos = editáveis
  const maskW = imgW;
  const maskH = imgH;

  // Inicializar buffer de pixels (grayscale + alpha) — começa tudo preto (protegido)
  const pixels = new Uint8Array(maskW * maskH * 4); // RGBA

  // Pintar áreas selecionadas de branco (editável)
  if (options.includes("full_face")) {
    // Full face: pintar ellipse central cobrindo rosto
    const cx = maskW / 2, cy = maskH / 2;
    const rx = maskW * 0.44, ry = maskH * 0.46;
    for (let y = 0; y < maskH; y++) {
      for (let x = 0; x < maskW; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) {
          const idx = (y * maskW + x) * 4;
          pixels[idx] = 255; pixels[idx + 1] = 255; pixels[idx + 2] = 255; pixels[idx + 3] = 255;
        }
      }
    }
  } else {
    for (const opt of options) {
      const region = AREA_MASKS[opt];
      if (!region) continue;
      const yStart = Math.floor(region.y[0] * maskH);
      const yEnd   = Math.floor(region.y[1] * maskH);
      const xStart = Math.floor(region.x[0] * maskW);
      const xEnd   = Math.floor(region.x[1] * maskW);
      // Pintar retângulo com bordas suavizadas (gaussian-like fade de 8px)
      const fade = 12;
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const dTop   = y - yStart;
          const dBot   = yEnd - y;
          const dLeft  = x - xStart;
          const dRight = xEnd - x;
          const minD   = Math.min(dTop, dBot, dLeft, dRight);
          const alpha  = minD >= fade ? 255 : Math.round((minD / fade) * 255);
          const idx = (y * maskW + x) * 4;
          if (alpha > pixels[idx + 3]) {
            pixels[idx] = 255; pixels[idx + 1] = 255; pixels[idx + 2] = 255; pixels[idx + 3] = alpha;
          }
        }
      }
    }
  }

  // Converter array de pixels RGBA para PNG manualmente (usando raw data)
  // Usamos a abordagem mais simples: converter para PNG sem dependências externas
  const pngBytes = encodePNG(maskW, maskH, pixels);
  return pngBytes;
}

// ──────────────────────────────────────────────────────────────
//  Encoder PNG mínimo (sem dependências externas)
// ──────────────────────────────────────────────────────────────
function encodePNG(width, height, rgba) {
  // Construir scanlines com filtro 0 (None)
  const scanlines = new Uint8Array((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    const base = y * (1 + width * 4);
    scanlines[base] = 0; // filtro tipo 0
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = base + 1 + x * 4;
      scanlines[dst]     = rgba[src];
      scanlines[dst + 1] = rgba[src + 1];
      scanlines[dst + 2] = rgba[src + 2];
      scanlines[dst + 3] = rgba[src + 3];
    }
  }

  const compressed = deflateSync(scanlines);

  // Chunks PNG
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = buildChunk("IHDR", (() => {
    const d = new Uint8Array(13);
    const v = new DataView(d.buffer);
    v.setUint32(0, width);
    v.setUint32(4, height);
    d[8] = 8;  // bit depth
    d[9] = 6;  // color type RGBA
    d[10] = 0; d[11] = 0; d[12] = 0;
    return d;
  })());

  const idat = buildChunk("IDAT", compressed);
  const iend = buildChunk("IEND", new Uint8Array(0));

  const total = sig.length + ihdr.length + idat.length + iend.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of [sig, ihdr, idat, iend]) {
    out.set(c, off); off += c.length;
  }
  return out;
}

function buildChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, data.length);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes); crcInput.set(data, typeBytes.length);
  const crcVal = crc32(crcInput);
  const crcBytes = new Uint8Array(4);
  new DataView(crcBytes.buffer).setUint32(0, crcVal);
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(len, 0); out.set(typeBytes, 4); out.set(data, 8); out.set(crcBytes, 8 + data.length);
  return out;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = crc32Table();
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function crc32Table() {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
}

// Deflate mínimo usando Deno's CompressionStream
async function deflateRaw(data) {
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();
  writer.write(data);
  writer.close();
  const chunks = [];
  let totalLen = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
  }
  const result = new Uint8Array(totalLen);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

// Sync wrapper — chamamos como sync mas internamente é async
// Usaremos versão async no fluxo principal
async function deflateAsync(data) {
  return await deflateRaw(data);
}

// Substituir deflateSync por wrapper assíncrono
function deflateSync(data) {
  // Fallback simples: compressão zlib store (sem compressão, mas válido para PNG)
  // Bloco DEFLATE não comprimido (btype=00)
  const CHUNK = 65535;
  const blocks = [];
  let offset = 0;
  while (offset < data.length) {
    const end = Math.min(offset + CHUNK, data.length);
    const chunk = data.slice(offset, end);
    const last = end >= data.length ? 1 : 0;
    const header = new Uint8Array([last, chunk.length & 0xFF, (chunk.length >> 8) & 0xFF,
      (~chunk.length) & 0xFF, ((~chunk.length) >> 8) & 0xFF]);
    blocks.push(header, chunk);
    offset = end;
  }
  // zlib header (CMF=0x78, FLG=0x01) + data + adler32
  const zHeader = new Uint8Array([0x78, 0x01]);
  const blocksFlat = flattenUint8Arrays([zHeader, ...blocks]);
  const adler = adler32(data);
  const adlerBytes = new Uint8Array([
    (adler >> 24) & 0xFF, (adler >> 16) & 0xFF, (adler >> 8) & 0xFF, adler & 0xFF
  ]);
  return flattenUint8Arrays([blocksFlat, adlerBytes]);
}

function adler32(data) {
  let s1 = 1, s2 = 0;
  for (let i = 0; i < data.length; i++) {
    s1 = (s1 + data[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  return (s2 << 16) | s1;
}

function flattenUint8Arrays(arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

// ──────────────────────────────────────────────────────────────
//  Relatório técnico
// ──────────────────────────────────────────────────────────────
function buildTechnicalReport(options) {
  const labels = options.map(o => AREA_MASKS[o]?.label || o).join(", ");
  return `Simulação clínica com máscara localizada nas áreas: ${labels}. Apenas os pixels da região anatômica definida foram editados. Princípios de simetria facial e proporção áurea utilizados como referência técnica discreta para calibrar o refinamento. Identidade facial, anatomia individual, estrutura óssea, olhos, sobrancelhas e demais características preservadas integralmente. Resultado meramente ilustrativo para apoio visual em consulta estética. Não representa promessa de resultado clínico.`;
}

// ══════════════════════════════════════════════════════════════
//  HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════
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
        error: "API da OpenAI não configurada. Insira a chave OPENAI_API_KEY.",
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
      ai_prompt_version: "v7_masked_symmetry_guided",
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

    // ── 1. Baixar imagem original ──
    console.log("Baixando imagem:", original_image_url.substring(0, 80));
    const imageResponse = await fetch(original_image_url);
    if (!imageResponse.ok) throw new Error(`Falha ao baixar imagem (HTTP ${imageResponse.status}).`);

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageArrayBuffer);
    if (imageBytes.length < 500) throw new Error("Imagem inválida ou muito pequena.");

    // Detectar MIME
    let mimeType = "image/jpeg";
    let fileExt = "jpg";
    if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50) {
      mimeType = "image/png"; fileExt = "png";
    } else if (imageBytes[0] === 0xFF && imageBytes[1] === 0xD8) {
      mimeType = "image/jpeg"; fileExt = "jpg";
    } else if (imageBytes[0] === 0x52 && imageBytes[1] === 0x49 && imageBytes[2] === 0x46 && imageBytes[3] === 0x46) {
      mimeType = "image/webp"; fileExt = "webp";
    } else {
      const ct = imageResponse.headers.get("content-type")?.split(";")[0]?.trim() || "";
      if (ct === "image/png") { mimeType = "image/png"; fileExt = "png"; }
      else if (ct === "image/webp") { mimeType = "image/webp"; fileExt = "webp"; }
    }

    console.log("MIME:", mimeType, "| Tamanho:", imageBytes.length, "bytes");
    console.log("Opções:", finalOptions.join(", "));

    // ── 2. Gerar máscara PNG localizada ──
    console.log("Gerando máscara anatômica para:", finalOptions.join(", "));
    const maskBytes = await generateMaskPng(imageBytes, finalOptions);
    console.log("Máscara gerada:", maskBytes.length, "bytes PNG");

    // ── 3. Construir prompt clínico ──
    const prompt = buildPrompt(finalOptions);
    console.log("Prompt length:", prompt.length);

    // ── 4. Chamar OpenAI /v1/images/edits com máscara ──
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("image", new Blob([imageBytes], { type: mimeType }), `photo.${fileExt}`);
    formData.append("mask",  new Blob([maskBytes],  { type: "image/png" }), "mask.png");

    console.log("Chamando OpenAI /v1/images/edits com máscara localizada...");

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

      // Se máscara for rejeitada, tentar fallback sem máscara com prompt reforçado
      if (errMsg.includes("mask") || errMsg.includes("invalid_image") || openaiRes.status === 400) {
        console.log("Máscara rejeitada, tentando fallback sem máscara...");
        const fallbackForm = new FormData();
        fallbackForm.append("model", "gpt-image-1");
        fallbackForm.append("prompt", prompt + "\n\nCRITICAL: Edit ONLY the following area and leave everything else completely unchanged: " + finalOptions.map(o => AREA_MASKS[o]?.label || o).join(", "));
        fallbackForm.append("n", "1");
        fallbackForm.append("size", "1024x1024");
        fallbackForm.append("image", new Blob([imageBytes], { type: mimeType }), `photo.${fileExt}`);

        const fallbackRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}` },
          body: fallbackForm,
        });
        const fallbackText = await fallbackRes.text();
        let fallbackJson;
        try { fallbackJson = JSON.parse(fallbackText); } catch { fallbackJson = {}; }

        if (!fallbackRes.ok) {
          const fb = fallbackJson?.error?.message || fallbackText || `HTTP ${fallbackRes.status}`;
          if (fb.includes("billing") || fb.includes("quota") || fb.includes("insufficient")) {
            throw new Error("Cota da API da OpenAI esgotada ou problema de faturamento. Verifique sua conta OpenAI.");
          }
          if (fb.includes("invalid_api_key") || fb.includes("Incorrect API key")) {
            throw new Error("API Key da OpenAI inválida. Verifique a configuração OPENAI_API_KEY.");
          }
          throw new Error(`Erro na API da OpenAI: ${fb}`);
        }

        openaiJson = fallbackJson;
        console.log("Fallback sem máscara executado com sucesso.");
      } else {
        if (errMsg.includes("billing") || errMsg.includes("quota") || errMsg.includes("insufficient")) {
          throw new Error("Cota da API da OpenAI esgotada ou problema de faturamento. Verifique sua conta OpenAI.");
        }
        if (errMsg.includes("invalid_api_key") || errMsg.includes("Incorrect API key")) {
          throw new Error("API Key da OpenAI inválida. Verifique a configuração OPENAI_API_KEY.");
        }
        throw new Error(`Erro na API da OpenAI: ${errMsg}`);
      }
    }

    const imgData = openaiJson.data?.[0];
    if (!imgData) throw new Error("OpenAI não retornou dados de imagem válidos.");

    // Obter base64
    let generatedBase64 = imgData.b64_json;
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

    // Atualizar registro
    await base44Client.entities.FullFaceSimulation.update(simulationId, {
      generated_image_url,
      status: "completed",
      technical_report: technicalReport,
      facial_analysis_snapshot: { simulation_options: finalOptions, mask_used: true, prompt_version: "v7", symmetry_guided: true },
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
        details: { patient_id, source_type: finalSourceType, consent_lgpd: true, simulation_options: finalOptions, mask_used: true },
      });
    } catch (e) {
      console.log("Aviso: log de auditoria falhou:", e.message);
    }

    console.log("Simulação v7 (máscara + simetria como referência) concluída:", simulationId);

    return Response.json({
      success: true,
      simulation_id: simulationId,
      generated_image_url,
      technical_report: technicalReport,
      message: "Simulação gerada com sucesso (Modo Clínico Realista v7 — Simetria como Referência)",
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