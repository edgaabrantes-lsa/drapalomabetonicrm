/**
 * Monta e baixa a imagem de simulação com as fotos lado a lado,
 * legendadas "ANTES" (foto enviada) e "DEPOIS" (resultado da IA).
 */
const GOLD = "#C98A9B";
const BG = "#0A0A0A";
const BORDER = "#2B2B2B";

async function loadBitmap(url) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("Não foi possível carregar a imagem.");
  const blob = await res.blob();
  if (typeof createImageBitmap === "function") return await createImageBitmap(blob);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Formato de imagem não suportado."));
      img.src = objectUrl;
    });
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawSpacedLabel(ctx, text, centerX, baselineY, spacing) {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const chars = [...text];
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, baselineY);
    x += widths[i] + spacing;
  });
}

function drawPanel(ctx, image, x, y, width, height, label) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 26);
  ctx.clip();
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, width, height);

  const scale = Math.min(width / image.width, height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  ctx.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
  ctx.restore();

  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, 26);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = '600 30px Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
  drawSpacedLabel(ctx, label, x + width / 2, y - 32, 7);
}

export async function buildSimulationComposite({ beforeUrl, afterUrl }) {
  const [before, after] = await Promise.all([loadBitmap(beforeUrl), loadBitmap(afterUrl)]);

  const PANEL_H = 1200;
  const ratio = Math.min(1.5, Math.max(0.66, before.width / before.height));
  const PANEL_W = Math.round(PANEL_H * ratio);
  const PAD = 44;
  const GAP = 28;
  const LABEL = 86;

  const width = PAD * 2 + PANEL_W * 2 + GAP;
  const height = PAD + LABEL + PANEL_H + PAD;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  drawPanel(ctx, before, PAD, PAD + LABEL, PANEL_W, PANEL_H, "ANTES");
  drawPanel(ctx, after, PAD + PANEL_W + GAP, PAD + LABEL, PANEL_W, PANEL_H, "DEPOIS");

  return canvas;
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function downloadImageFile(url, fileName) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("Não foi possível baixar a imagem.");
  saveBlob(await res.blob(), fileName);
}

export async function downloadSimulationComposite({ beforeUrl, afterUrl, fileName }) {
  const canvas = await buildSimulationComposite({ beforeUrl, afterUrl });
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("Falha ao montar a imagem.")), "image/png");
  });
  saveBlob(blob, fileName);
}