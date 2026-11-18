const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9"];

function sourceAspectRatio(metadata) {
  const width = Number(metadata?.width);
  const height = Number(metadata?.height);
  if (!(width > 0 && height > 0 && Number.isFinite(width / height))) return "1:1";
  const distance = ratio => {
    const [w, h] = ratio.split(":").map(Number);
    return Math.abs(Math.log((width / height) / (w / h)));
  };
  return ASPECT_RATIOS.reduce((best, ratio) => distance(ratio) < distance(best) ? ratio : best);
}

function jawPrompt(intensity, hasDraft) {
  const definition = {
    1: "A softly sculpted but identifiable posterior jaw corner and cleaner lower mandibular edge, without a sharp or square appearance.",
    2: "A clearly identifiable posterior jaw corner and a continuous, well-defined lower mandibular edge. The structural contour difference must be visible at ordinary comparison size.",
    3: "A pronounced yet anatomically plausible posterior jaw corner and crisp lower mandibular edge. Keep this person's proportions and avoid a widened, oversized or artificial jaw.",
  }[intensity] || "A clearly identifiable posterior jaw corner and lower mandibular edge.";
  return `Perform a LOCALIZED PHOTOREALISTIC MANDIBULAR-CONTOUR EDIT, not a general beauty retouch.
${hasDraft ? "Reference 1 is the current simulation: retain its existing treatment changes. Reference 2 is the original photo: use it only to preserve identity and camera geometry, not to undo reference 1." : "Reference 1 is the original photo to edit."}

PRIMARY TARGET: the gonial corner on each visible side, just below and slightly forward of the earlobe, where the posterior mandibular ramus turns into the lower jaw border. In a frontal photo define both visible lateral corners; in a three-quarter/profile photo follow the visible side and perspective, never invent the hidden side.
Resculpt the actual silhouette at this corner, restoring a localized angular transition instead of an indistinct rounded transition into the neck. Continue the lower mandibular border from the corner toward the chin and soften the small pre-jowl interruption along that border. Keep changes confined to the posterior jaw corners and the adjoining lower jawline.
Separate the jaw edge from the neck with a soft, physically plausible occlusion shadow immediately underneath the border, following the EXISTING light direction. A darker drawn line, contour makeup, sharpening filter or global contrast change is NOT a structural contour edit.

CONTOUR DEFINITION: ${definition}
Do not simply slim the whole face, enlarge the masseter or lengthen the chin as a substitute for defining the mandibular corner. Preserve the chin's existing projection and preserve lips, nose, cheeks, eyes, skin texture, age, ethnicity, hair, ears, expression, neck position, pose, clothes, background, light and framing. Preserve the photograph's proportions; do not crop, zoom or rotate it.
Exact gonial-angle measurements cannot be inferred from a frontal photo; prioritize the visibly localized contour and this person's anatomy, not a forced numeric angle.
Return one complete edited photograph with the changed contour integrated into the photo. No arrows, diagram, before/after panel, text, outline or annotations. This is an illustrative aesthetic simulation, not a promise of clinical results.`;
}

export async function refineJawContour(base44, { draftUrl, originalUrl, intensity, imageMetadata }) {
  const gateway = await base44.asServiceRole.aiGateway.connection();
  const response = await fetch(`${gateway.baseURL}/images/generations`, {
    method: "POST",
    headers: { ...gateway.headers, Authorization: `Bearer ${gateway.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "automatic", quality: "high", resolution: "1K",
      aspect_ratio: sourceAspectRatio(imageMetadata), output_format: "png", response_format: "url", n: 1,
      reference_image_urls: draftUrl === originalUrl ? [originalUrl] : [draftUrl, originalUrl],
      prompt: jawPrompt(intensity, draftUrl !== originalUrl),
    }),
    signal: AbortSignal.timeout(150000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Não foi possível refinar o contorno mandibular.");
  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) throw new Error("O refinamento mandibular não retornou uma imagem.");

  // Compare photograph content, not file hashes: a re-encoded unedited photo has different bytes.
  const validation = await base44.asServiceRole.integrations.Core.InvokeLLM({
    file_urls: [originalUrl, imageUrl],
    prompt: `Compare the two attached photographs visually. Image 1 is the ORIGINAL; image 2 is the proposed AFTER simulation. Do not assume that the requested edit succeeded. Inspect only the visible posterior mandibular corners immediately below the earlobes and the adjoining lower mandibular edge, not generic skin smoothing, lip changes or lighting. Set contour_visible to true only if image 2 shows a clearly distinguishable structural contour at those corners and cleaner separation of the jaw border from the neck at normal viewing size. Brightness, makeup, different crop, darker drawn lines or different encoding alone do not count. Set identity_consistent and framing_consistent based on the actual same person, pose, expression and camera framing. Changes in other selected aesthetic areas are allowed. Describe the observed mandibular difference, or its absence, in one short Portuguese sentence. This is visual quality control of an illustration, not clinical evaluation or gonial-angle measurement.`,
    response_json_schema: {
      type: "object",
      properties: {
        contour_visible: { type: "boolean" }, identity_consistent: { type: "boolean" },
        framing_consistent: { type: "boolean" }, observation: { type: "string" },
      },
      required: ["contour_visible", "identity_consistent", "framing_consistent", "observation"],
    },
  });
  const accepted = validation.contour_visible === true && validation.identity_consistent === true && validation.framing_consistent === true;
  return { imageUrl: accepted ? imageUrl : "", validation, method: "dedicated_jaw_contour_edit" };
}