// ─── Helper compartilhado: assinatura do profissional ─────────────────────────
// Usado por gerarContratoAssinado e gerarKitDocumental para incluir
// automaticamente a assinatura da Dra. Paloma Betoni em todos os contratos.

export function ab2b64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(bin);
}

export function sv(v, fb) {
  const f = fb !== undefined ? fb : '';
  if (v === null || v === undefined) return f;
  if (typeof v === 'string') return v.trim() || f;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return f;
}

// Busca a imagem da assinatura (data URL ou URL remota) e retorna { dataUrl, mime } ou null
export async function fetchImageAsDataUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:image')) {
    const comma = url.indexOf(',');
    const mime = comma > -1 ? (url.substring(5, comma).split(';')[0] || 'image/png') : 'image/png';
    return { dataUrl: url, mime };
  }
  if (url.startsWith('http')) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      if (buf.byteLength < 100 || buf.byteLength > 5 * 1024 * 1024) return null;
      const mime = r.headers.get('content-type') || 'image/png';
      return { dataUrl: 'data:' + mime + ';base64,' + ab2b64(buf), mime };
    } catch (_) { return null; }
  }
  return null;
}

/**
 * Renderiza o bloco de assinatura do profissional no PDF.
 * @returns novo y após o bloco (ou y inalterado se não houver dados do profissional)
 */
export async function renderAssinaturaProfissional({ doc, clinica, y, colors }) {
  const GOLD = colors?.GOLD || [200, 169, 106];
  const GRAY = colors?.GRAY || [120, 120, 120];
  const PH = doc.internal.pageSize.getHeight();
  const PW = doc.internal.pageSize.getWidth();

  const chk = (yy, need) => (yy > PH - (need || 30)) ? (doc.addPage(), 20) : yy;

  const titulo = (sv(clinica?.professional_title, 'Dra.') + ' ' + sv(clinica?.professional_name)).trim();
  const conselho = [sv(clinica?.conselho_regional), sv(clinica?.numero_conselho)].filter(Boolean).join(' ');
  const cpf = sv(clinica?.assinatura_profissional_cpf);
  const sigUrl = sv(clinica?.assinatura_profissional_url);

  if (!titulo && !sigUrl) return y;

  // Separador
  y = chk(y, 60);
  y += 6;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(15, y, PW - 15, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('ASSINATURA DA PROFISSIONAL', 15, y);
  y += 7;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('Assinatura eletrônica registrada pela profissional responsável.', 15, y);
  y += 8;

  // Imagem da assinatura
  let imgCarregada = false;
  if (sigUrl) {
    const img = await fetchImageAsDataUrl(sigUrl);
    if (img) {
      try {
        y = chk(y, 40);
        const mime = (img.mime || 'image/png').includes('jpeg') || (img.mime || '').includes('jpg') ? 'JPEG' : 'PNG';
        doc.addImage(img.dataUrl, mime, 15, y, 100, 30);
        y += 34;
        imgCarregada = true;
      } catch (_) { /* falha silenciosa */ }
    }
  }

  if (!imgCarregada) {
    y = chk(y, 20);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('[ Assinatura da profissional não disponível — cadastre nas Configurações da Clínica ]', 15, y + 6);
    y += 14;
  }

  // Linha + identificação
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.line(15, y + 1, 135, y + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const linhaId = [titulo, conselho && conselho, cpf && 'CPF ' + cpf].filter(Boolean).join(' — ');
  doc.text(linhaId || titulo, 15, y + 7);
  y += 14;

  return y;
}