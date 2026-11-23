import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { renderAssinaturaProfissional, fetchImageAsDataUrl, ab2b64, sv } from '../../shared/assinaturaProfissional.js';

// ─── Utilitários ─────────────────────────────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return '—';
  try {
    const d = new Date(String(dt).length <= 10 ? String(dt) + 'T12:00:00' : dt);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Construção do PDF ───────────────────────────────────────────────────────
async function buildPdf(receita, patient, clinica, hash) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 18;

  const BLACK = [17, 17, 17];
  const GRAY = [110, 110, 110];
  const LIGHT = [235, 235, 235];
  const GOLD = [200, 169, 106];
  const RED = [185, 28, 28];

  const isDraft = receita.status === 'rascunho';
  const isEspecial = receita.tipo_receita === 'controle_especial';

  const clinicaNome = sv(clinica?.clinic_name, 'Clínica Dra. Paloma Betoni');
  const endereco = clinica?.address
    ? [
        [clinica.address.street, clinica.address.number].filter(Boolean).join(', '),
        clinica.address.neighborhood,
        [clinica.address.city, clinica.address.state].filter(Boolean).join('/'),
      ].filter(Boolean).join(' — ')
    : '';
  const contato = [clinica?.phone, clinica?.whatsapp, clinica?.email].filter(Boolean).join(' · ');
  const codigo = 'REC-' + sv(receita.id, 'XXXXX').substring(0, 8).toUpperCase();

  let y = M;

  // ── Cabeçalho institucional ──
  const logoUrl = clinica?.logo_url || clinica?.favicon_url || '';
  let logoOk = false;
  if (logoUrl) {
    const img = await fetchImageAsDataUrl(logoUrl);
    if (img) {
      try {
        const fmt = (img.mime || '').includes('jpeg') || (img.mime || '').includes('jpg') ? 'JPEG' : 'PNG';
        doc.addImage(img.dataUrl, fmt, M, y, 26, 26);
        logoOk = true;
      } catch {
        logoOk = false;
      }
    }
  }

  const textX = logoOk ? M + 32 : M;
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(clinicaNome, textX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  let hy = y + 11;
  if (endereco) {
    const linhas = doc.splitTextToSize(endereco, PW - textX - M);
    doc.text(linhas, textX, hy);
    hy += linhas.length * 3.6;
  }
  if (contato) {
    doc.text(contato, textX, hy);
    hy += 3.6;
  }
  if (clinica?.cnpj || clinica?.cpf) {
    doc.text('CNPJ/CPF: ' + sv(clinica.cnpj || clinica.cpf), textX, hy);
  }

  y = Math.max(hy + 4, y + 30);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(M, y, PW - M, y);
  y += 9;

  // ── Título ──
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RECEITUÁRIO', PW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Documento de prescrição — ' + codigo, PW / 2, y, { align: 'center' });
  y += 8;

  // ── Aviso de controle especial ──
  if (isEspecial) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, PW - M * 2, 16, 1.5, 1.5, 'FD');
    doc.setTextColor(...RED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ATENÇÃO — RECEITUÁRIO SIMPLES', M + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const aviso = doc.splitTextToSize(
      'Este documento não substitui receituário de controle especial (Portaria SVS/MS nº 344/98 e atualizações). Medicamentos sujeitos a controle especial exigem notificação de receita específica e assinatura digital juridicamente válida.',
      PW - M * 2 - 6,
    );
    doc.text(aviso, M + 3, y + 9.5);
    y += 21;
  }

  // ── Paciente ──
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.3);
  doc.line(M, y, PW - M, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text('PACIENTE', M, y);
  y += 5.5;

  const campo = (label, valor, yy) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(label, M, yy);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(sv(valor, '—'), M + 32, yy);
    return yy + 5;
  };

  y = campo('Nome completo', patient?.full_name || receita.patient_name, y);
  y = campo('Nascimento', patient?.birth_date ? fmtDate(patient.birth_date) : fmtDate(receita.patient_birth_date), y);
  y = campo('Data de emissão', fmtDate(receita.data_emissao), y);
  if (patient?.document_number) y = campo('CPF', patient.document_number, y);
  if (patient?.phone) y = campo('Telefone', patient.phone, y);

  // ── Prescrição ──
  y += 4;
  doc.setDrawColor(...LIGHT);
  doc.line(M, y, PW - M, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text('PRESCRIÇÃO', M, y);
  y += 7;

  const medicamentos = Array.isArray(receita.medicamentos) ? receita.medicamentos : [];
  if (medicamentos.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Nenhum medicamento informado.', M, y);
    y += 6;
  }

  const quebra = (need) => {
    if (y > PH - need) {
      doc.addPage();
      y = M;
    }
  };

  medicamentos.forEach((med, idx) => {
    quebra(45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...BLACK);
    const titulo = `${idx + 1}. ${sv(med.nome, 'Medicamento')}${med.apresentacao ? ' — ' + med.apresentacao : ''}`;
    const linhasTitulo = doc.splitTextToSize(titulo, PW - M * 2);
    doc.text(linhasTitulo, M, y);
    y += linhasTitulo.length * 4.6 + 1;

    const detalhe = (label, valor) => {
      if (!sv(valor)) return;
      quebra(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(label, M + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BLACK);
      const linhas = doc.splitTextToSize(sv(valor), PW - M * 2 - 30);
      doc.text(linhas, M + 30, y);
      y += Math.max(4.6, linhas.length * 4.2);
    };

    detalhe('Dose', med.dose);
    detalhe('Via', med.via);
    detalhe('Frequência', med.frequencia);
    detalhe('Duração', med.duracao);
    detalhe('Quantidade', med.quantidade);
    detalhe('Orientações', med.orientacoes);
    y += 3;
  });

  // ── Orientações gerais ──
  if (sv(receita.orientacoes_gerais)) {
    quebra(30);
    doc.setDrawColor(...LIGHT);
    doc.line(M, y, PW - M, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text('ORIENTAÇÕES GERAIS', M, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    const linhas = doc.splitTextToSize(sv(receita.orientacoes_gerais), PW - M * 2);
    for (const l of linhas) {
      quebra(14);
      doc.text(l, M, y);
      y += 4.4;
    }
    y += 3;
  }

  // ── Assinatura ──
  y = await renderAssinaturaProfissional({ doc, clinica, y, colors: { GOLD, GRAY, BLACK } });

  quebra(28);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const notaAssinatura = doc.splitTextToSize(
    'Assinatura eletrônica simples: identifica a profissional responsável e registra data, hora e integridade do documento por hash. Não constitui assinatura digital qualificada (ICP-Brasil). A imagem de assinatura cadastrada é elemento visual e, isoladamente, não equivale a assinatura digital válida.',
    PW - M * 2,
  );
  doc.text(notaAssinatura, M, y);
  y += notaAssinatura.length * 3.4 + 3;

  // ── Marca d'água de rascunho ──
  if (isDraft) {
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setTextColor(225, 225, 225);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(46);
      doc.text('RASCUNHO', PW / 2, PH / 2, { align: 'center', angle: 32 });
      doc.setFontSize(10);
      doc.text('SEM VALIDADE CLÍNICA', PW / 2, PH / 2 + 12, { align: 'center', angle: 32 });
    }
  }

  // ── Rodapé ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.line(M, PH - 14, PW - M, PH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(
      clinicaNome + ' — ' + codigo + ' — ' + (isDraft ? 'RASCUNHO' : 'EMITIDA') + ' — Página ' + p + '/' + totalPages,
      M,
      PH - 9.5,
    );
    if (hash) doc.text('Hash: ' + hash, M, PH - 6);
  }

  return doc;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const receita_id = body?.receita_id;
    if (!receita_id) return Response.json({ error: 'receita_id é obrigatório' }, { status: 400 });

    const service = base44.asServiceRole;
    const receita = await service.entities.Receita
      .get(receita_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!receita) return Response.json({ error: 'Receita não encontrada' }, { status: 404 });

    let patient = null;
    try {
      patient = await service.entities.Patient.get(receita.patient_id);
    } catch {
      patient = null;
    }

    let clinica = null;
    try {
      const lista = await service.entities.ClinicSettings.list('-created_date', 1);
      clinica = lista?.[0] || null;
    } catch {
      clinica = null;
    }

    // Hash de integridade do conteúdo clínico
    const hash = await sha256Hex(
      JSON.stringify({
        id: receita.id,
        patient_id: receita.patient_id,
        data_emissao: receita.data_emissao,
        tipo: receita.tipo_receita,
        medicamentos: receita.medicamentos || [],
        orientacoes: receita.orientacoes_gerais || '',
        versao: receita.versao || 1,
      }),
    );

    const doc = await buildPdf(receita, patient, clinica, hash);
    const pdfBytes = doc.output('arraybuffer');

    if (!pdfBytes || pdfBytes.byteLength < 500) {
      return Response.json({ error: 'PDF gerado está vazio' }, { status: 500 });
    }

    const nomePac = sv(patient?.full_name || receita.patient_name, 'Paciente').replace(/[^a-zA-Z0-9]/g, '_');
    const nomeArq = 'Receita_' + nomePac + '_' + (receita.data_emissao || '').replace(/-/g, '') + '_' + Date.now() + '.pdf';

    return Response.json({
      success: true,
      pdf_base64: ab2b64(pdfBytes),
      pdf_file_name: nomeArq,
      hash,
      is_draft: receita.status === 'rascunho',
      bytes: pdfBytes.byteLength,
    });
  } catch (error) {
    return Response.json({ error: error.message, etapa: 'geral' }, { status: 500 });
  }
}