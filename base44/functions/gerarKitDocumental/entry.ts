import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ─── Utilitários ──────────────────────────────────────────────────────────────

function ab2b64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(bin);
}

function sv(v, fb) {
  const f = fb !== undefined ? fb : '—';
  if (v === null || v === undefined) return f;
  if (typeof v === 'string') return v.trim() || f;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return f;
}

function fmtDate(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('pt-BR'); } catch { return '—'; }
}

function fmtCur(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
}

// ─── Textos ───────────────────────────────────────────────────────────────────

const CONTRATO_MESTRE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

Pelo presente instrumento particular, as partes identificadas neste documento acordam os seguintes termos:

1. OBJETO: Prestação de serviços de harmonização orofacial e estética conforme procedimento contratado.

2. OBRIGAÇÕES DA CLÍNICA: Realizar os procedimentos com técnica adequada, materiais certificados e profissionais habilitados; fornecer orientações pré e pós-procedimento; manter sigilo profissional.

3. OBRIGAÇÕES DA PACIENTE: Fornecer informações verídicas sobre saúde; seguir orientações pré e pós-procedimento; comparecer às consultas agendadas; comunicar reações adversas imediatamente.

4. RISCOS E LIMITAÇÕES: A paciente foi informada dos riscos inerentes ao procedimento e declara compreender que resultados individuais podem variar.

5. PAGAMENTO: Conforme condições descritas no Anexo Financeiro deste Kit Documental.

6. RESCISÃO: Qualquer parte pode rescindir mediante comunicação prévia, respeitando política de cancelamento vigente.

7. FORO: Fica eleito o foro da comarca da clínica para dirimir eventuais conflitos.`;

const LGPD_TEXTO = `TERMO DE CONSENTIMENTO — LGPD (Lei 13.709/2018)

A Clínica coleta e trata dados pessoais e de saúde para finalidades clínicas, administrativas e de comunicação.

1. DADOS COLETADOS: Nome, CPF, RG, data de nascimento, endereço, contato, histórico de saúde, fotografias e dados financeiros.
2. FINALIDADE: Prestação de serviços de saúde e estética, prontuário eletrônico, comunicação sobre tratamentos.
3. BASE LEGAL: Consentimento (Art. 7º, I) e tutela da saúde (Art. 7º, VIII).
4. ARMAZENAMENTO: Dados mantidos pelo prazo legal mínimo de 5 anos.
5. DIREITOS: Acesso, correção, portabilidade e eliminação podem ser solicitados a qualquer tempo.
6. COMPARTILHAMENTO: Dados não são comercializados.

A paciente autoriza o tratamento de seus dados pessoais para as finalidades descritas acima.`;

const USO_IMAGEM = `TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

A paciente declara a seguinte opção de autorização de uso de imagem:

( ) Não autorizo qualquer uso
( ) Autorizo uso exclusivamente interno (prontuário/arquivo clínico)
( ) Autorizo uso científico sem identificação
( ) Autorizo divulgação em redes sociais sem identificação
( ) Autorizo divulgação em redes sociais com identificação (mediante acordo prévio)

A autorização pode ser revogada a qualquer momento mediante comunicação escrita à Clínica.`;

const CONSENTIMENTOS = {
  rinomodelacao: `TERMO DE CONSENTIMENTO — RINOMODELAÇÃO\n\nA paciente declara estar ciente de que a rinomodelação com preenchimento é um procedimento minimamente invasivo que utiliza ácido hialurônico para harmonização nasal. Riscos incluem hematomas, assimetria temporária, edema e, raramente, oclusão vascular.`,
  toxina: `TERMO DE CONSENTIMENTO — TOXINA BOTULÍNICA\n\nA paciente declara estar ciente de que a aplicação de toxina botulínica é um procedimento minimamente invasivo para relaxamento muscular temporário. Riscos incluem ptose palpebral, assimetria e equimose. Os efeitos são temporários (3–6 meses).`,
  preenchimento: `TERMO DE CONSENTIMENTO — PREENCHIMENTO COM ÁCIDO HIALURÔNICO\n\nA paciente declara estar ciente de que o preenchimento é um procedimento de harmonização facial. Riscos incluem edema, hematoma, nódulos e, raramente, oclusão vascular.`,
  bioestimulador: `TERMO DE CONSENTIMENTO — BIOESTIMULADOR DE COLÁGENO\n\nA paciente declara estar ciente de que o bioestimulador estimula a produção natural de colágeno. Os resultados são progressivos (2–6 meses). Riscos incluem nódulos, hematomas e assimetria transitória.`,
  fios: `TERMO DE CONSENTIMENTO — FIOS DE SUSTENTAÇÃO\n\nA paciente declara estar ciente de que os fios são utilizados para lifting facial minimamente invasivo. Riscos incluem assimetria temporária, equimose e desconforto.`,
  pele: `TERMO DE CONSENTIMENTO — PROCEDIMENTOS DE PELE\n\nA paciente declara estar ciente dos procedimentos de pele propostos. Riscos incluem vermelhidão transitória, edema e sensibilidade.`,
  full_face: `TERMO DE CONSENTIMENTO — PROTOCOLO FULL FACE\n\nA paciente declara estar ciente de que o Protocolo Full Face inclui múltiplas técnicas de harmonização orofacial. Os riscos são cumulativos e incluem edema, assimetria transitória e equimoses.`,
  labios: `TERMO DE CONSENTIMENTO — PREENCHIMENTO LABIAL\n\nA paciente declara estar ciente de que o preenchimento labial usa ácido hialurônico. Riscos incluem edema significativo nas primeiras 48h e assimetria transitória.`,
  mandibula: `TERMO DE CONSENTIMENTO — HARMONIZAÇÃO DE MANDÍBULA\n\nA paciente declara estar ciente dos procedimentos de harmonização mandibular. Riscos incluem edema, hematoma e assimetria transitória.`,
  mento: `TERMO DE CONSENTIMENTO — MENTOPLASTIA NÃO CIRÚRGICA\n\nA paciente declara estar ciente da harmonização de mento. Riscos incluem edema, hematoma e assimetria transitória.`,
  olheiras: `TERMO DE CONSENTIMENTO — TRATAMENTO DE OLHEIRAS\n\nA paciente declara estar ciente do tratamento de olheiras. Riscos incluem edema, efeito Tyndall e sensibilidade local.`,
  corporal: `TERMO DE CONSENTIMENTO — PROCEDIMENTO CORPORAL\n\nA paciente declara estar ciente do procedimento corporal proposto. Riscos incluem equimoses, irregularidades transitórias e desconforto local.`,
};

function getConsentimento(kit) {
  const cats = (kit.tecnicas_full_face && kit.tecnicas_full_face.length > 0)
    ? kit.tecnicas_full_face
    : [kit.categoria || ''];
  for (const cat of cats) {
    const key = cat.toLowerCase().replace(/[^a-z]/g, '');
    if (CONSENTIMENTOS[key]) return CONSENTIMENTOS[key];
    for (const k of Object.keys(CONSENTIMENTOS)) {
      if (key.includes(k) || k.includes(key)) return CONSENTIMENTOS[k];
    }
  }
  return `TERMO DE CONSENTIMENTO — ${(sv(kit.procedimento_nome, 'PROCEDIMENTO')).toUpperCase()}\n\nA paciente declara estar ciente dos procedimentos contratados, seus riscos, limitações e alternativas. O profissional forneceu todas as informações necessárias. A paciente confirma ter compreendido e autoriza a realização dos procedimentos.`;
}

// ─── Geração do PDF via jsPDF ─────────────────────────────────────────────────

async function buildPdf(kit, patient, clinica, financeiro, assinatura) {
  const doc = new jsPDF({ format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  const GOLD  = [200, 169, 106];
  const BLACK = [20, 20, 20];
  const GRAY  = [120, 120, 120];
  const DARK  = [13, 17, 25];
  const GREEN = [34, 197, 94];
  const AMBER = [245, 158, 11];
  const WHITE = [255, 255, 255];

  const clinicaNome  = sv(clinica?.clinic_name || kit.clinic_name, 'Clínica Dra. Paloma Betoni');
  const profissional = sv(clinica?.professional_name, 'Dra. Paloma Betoni');
  const codigoKit    = 'KIT-' + sv(kit.id, 'XXXXX').substring(0, 8).toUpperCase();
  const now          = new Date();

  function header() {
    doc.setFillColor(...DARK);
    doc.rect(0, 0, PW, 18, 'F');
    doc.setTextColor(...GOLD);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(clinicaNome.toUpperCase(), 15, 12);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Kit Documental — ' + codigoKit, PW - 15, 12, { align: 'right' });
  }

  function newPage() { doc.addPage(); header(); return 28; }

  function chk(y, need) {
    return y > PH - (need || 30) ? newPage() : y;
  }

  function section(title, y) {
    y = chk(y, 40);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(15, y, PW - 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), 15, y);
    return y + 8;
  }

  function textBlock(text, y, size, bold, color) {
    if (!text) return y;
    y = chk(y, 20);
    doc.setFontSize(size || 9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...(color || BLACK));
    const lines = doc.splitTextToSize(String(text), PW - 30);
    for (const line of lines) {
      y = chk(y, 10);
      doc.text(line, 15, y);
      y += 5.5;
    }
    return y + 2;
  }

  function field(label, value, y) {
    y = chk(y, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label + ':', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    const lines = doc.splitTextToSize(sv(value), PW - 75);
    doc.text(lines, 62, y);
    return y + Math.max(6, lines.length * 5.5);
  }

  // ── CAPA ──────────────────────────────────────────────────────────────────
  header();
  doc.setFillColor(...DARK);
  doc.rect(0, 18, PW, 80, 'F');
  doc.setTextColor(...GOLD);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KIT DOCUMENTAL', PW / 2, 50, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text(sv(kit.procedimento_nome, 'Procedimento'), PW / 2, 62, { align: 'center' });
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(60, 68, PW - 60, 68);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Paciente: ' + sv(patient?.full_name || kit.patient_name, 'Não identificado'), PW / 2, 76, { align: 'center' });
  doc.text('Gerado em: ' + now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR'), PW / 2, 83, { align: 'center' });
  doc.text('Código: ' + codigoKit, PW / 2, 90, { align: 'center' });

  const statusLabel = assinatura ? 'DOCUMENTO ASSINADO ELETRONICAMENTE' : 'AGUARDANDO ASSINATURA';
  const statusColor = assinatura ? GREEN : AMBER;
  const sw = doc.getTextWidth(statusLabel) + 20;
  doc.setFillColor(...statusColor);
  doc.roundedRect((PW - sw) / 2, 96, sw, 10, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, PW / 2, 102.5, { align: 'center' });

  let y = 115;

  // ── SEÇÃO 1 — PACIENTE ────────────────────────────────────────────────────
  y = newPage();
  y = section('Seção 1 — Dados da Paciente', y);
  y = field('Nome Completo', patient?.full_name || kit.patient_name, y);
  y = field('CPF', patient?.document_number || 'Não informado', y);
  y = field('RG', patient?.rg || '—', y);
  y = field('Nascimento', patient?.birth_date ? fmtDate(patient.birth_date) : '—', y);
  y = field('Telefone', patient?.phone || '—', y);
  y = field('WhatsApp', patient?.whatsapp || '—', y);
  y = field('E-mail', patient?.email || '—', y);
  if (patient?.address) {
    const a = patient.address;
    y = field('Endereço', `${sv(a.street)}, ${sv(a.number)} — ${sv(a.neighborhood)} — ${sv(a.city)}/${sv(a.state)}`, y);
  }

  // ── SEÇÃO 2 — CLÍNICA ─────────────────────────────────────────────────────
  y = section('Seção 2 — Dados da Clínica', y);
  y = field('Clínica', clinicaNome, y);
  y = field('Razão Social', clinica?.legal_name || '—', y);
  y = field('CNPJ/CPF', clinica ? sv(clinica.cnpj || clinica.cpf) : '—', y);
  y = field('Telefone', clinica?.phone || '—', y);
  y = field('E-mail', clinica?.email || '—', y);
  y = field('Profissional', profissional, y);
  y = field('Registro', clinica?.professional_registry || '—', y);

  // ── SEÇÃO 3 — PROCEDIMENTO ────────────────────────────────────────────────
  y = section('Seção 3 — Procedimento Contratado', y);
  y = field('Procedimento', sv(kit.procedimento_nome), y);
  if (kit.protocolo_nome) y = field('Protocolo', sv(kit.protocolo_nome), y);
  if (kit.tecnicas_full_face?.length > 0) y = field('Técnicas', kit.tecnicas_full_face.join(', '), y);
  y = field('Tipo de Kit', sv(kit.kit_tipo), y);
  y = field('Data de Geração', fmtDate(kit.data_geracao || now.toISOString()), y);
  if (kit.observacoes) y = field('Observações', kit.observacoes, y);

  // ── SEÇÃO 4 — CONTRATO MESTRE ─────────────────────────────────────────────
  y = newPage();
  y = section('Seção 4 — Contrato Mestre', y);
  y = textBlock(CONTRATO_MESTRE, y, 8.5);

  // ── SEÇÃO 5 — LGPD ───────────────────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 5 — Proteção de Dados (LGPD)', y);
  y = textBlock(LGPD_TEXTO, y, 8.5);

  // ── SEÇÃO 6 — USO DE IMAGEM ───────────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 6 — Autorização de Uso de Imagem', y);
  y = textBlock(USO_IMAGEM, y, 8.5);

  // ── SEÇÃO 7 — CONSENTIMENTO ───────────────────────────────────────────────
  y = newPage();
  y = section('Seção 7 — Consentimento do Procedimento', y);
  y = textBlock(getConsentimento(kit), y, 8.5);

  // ── SEÇÃO 8 — FINANCEIRO ──────────────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 8 — Anexo Financeiro', y);
  if (financeiro) {
    y = field('Procedimento', sv(financeiro.procedimento), y);
    y = field('Valor Total', fmtCur(financeiro.valor_total), y);
    y = field('Entrada', fmtCur(financeiro.entrada), y);
    y = field('Saldo', fmtCur((financeiro.valor_total || 0) - (financeiro.entrada || 0)), y);
    y = field('Parcelas', sv(financeiro.num_parcelas, '1'), y);
    y = field('Pagamento', sv(financeiro.forma_pagamento), y);
    y = field('Vencimento', fmtDate(financeiro.data_vencimento), y);
    y = field('Status', sv(financeiro.status_financeiro), y);
    if (financeiro.observacoes) y = field('Obs.', financeiro.observacoes, y);
  } else {
    y = textBlock('Dados financeiros não registrados no momento da geração. O valor será acordado separadamente.', y, 8.5, false, AMBER);
  }

  // ── SEÇÃO 9 — DECLARAÇÕES FINAIS ──────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 9 — Declarações Finais', y);
  y = textBlock('A paciente declara que:\n\n1. Leu, compreendeu e aceitou integralmente todas as seções deste Kit Documental.\n2. Recebeu explicações verbais e escritas sobre os procedimentos, seus riscos, benefícios e limitações.\n3. Teve oportunidade de fazer perguntas, que foram respondidas satisfatoriamente.\n4. Está em plenas capacidades de compreensão e decisão.\n5. Autoriza a realização dos procedimentos descritos.\n6. Está ciente de que pode revogar este consentimento antes da realização dos procedimentos.', y, 8.5);

  // ── SEÇÃO 10 — ASSINATURA ─────────────────────────────────────────────────
  y = chk(y, 130);
  y = section('Seção 10 — Assinatura Única do Kit Documental', y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('Esta assinatura valida integralmente todo o Kit Documental.', 15, y);
  y += 8;

  if (assinatura) {
    // Badge assinado
    const badgeLabel = '✓ KIT DOCUMENTAL ASSINADO ELETRONICAMENTE';
    const bw = doc.getTextWidth(badgeLabel) + 20;
    doc.setFillColor(...GREEN);
    doc.roundedRect(15, y - 4, bw, 10, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(badgeLabel, 15 + bw / 2, y + 2, { align: 'center' });
    y += 16;

    // Dados textuais da assinatura (SEMPRE exibidos — nunca falham)
    const dtSig  = assinatura.data_assinatura ? new Date(assinatura.data_assinatura) : now;
    const dtFmt  = dtSig.toLocaleDateString('pt-BR');
    const hrFmt  = dtSig.toLocaleTimeString('pt-BR');

    y = textBlock(
      'Assinado eletronicamente por ' + sv(assinatura.assinante_nome) +
      ', CPF ' + sv(assinatura.assinante_cpf) +
      ', em ' + dtFmt + ' às ' + hrFmt + '.',
      y, 8.5
    );

    y = field('Nome do Assinante',   sv(assinatura.assinante_nome), y);
    y = field('CPF',                 sv(assinatura.assinante_cpf), y);
    y = field('Tipo',                assinatura.assinante_tipo === 'responsavel_legal' ? 'Responsável Legal' : 'Paciente', y);
    y = field('Data',                dtFmt, y);
    y = field('Hora',                hrFmt, y);
    y = field('Método',              'Assinatura Digital Presencial (Canvas)', y);
    y = field('Hash / Identificador', sv(assinatura.documento_hash), y);
    y = field('Status',              'ASSINADO', y);
    y = field('Declarou Leitura',    assinatura.declarou_leitura ? 'Sim' : 'Não', y);
    y = field('Concordou Termos',    assinatura.concordou_termos ? 'Sim' : 'Não', y);
    y += 6;

    // Imagem da assinatura (falha silenciosa — nunca quebra o PDF)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text('ASSINATURA MANUSCRITA:', 15, y);
    y += 8;

    let imgCarregada = false;
    const sigUrl = assinatura.assinatura_data_url;
    if (sigUrl && typeof sigUrl === 'string' && sigUrl.startsWith('http')) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 7000);
        const imgResp = await fetch(sigUrl, { signal: ctrl.signal });
        if (imgResp.ok) {
          const imgBuf = await imgResp.arrayBuffer();
          if (imgBuf.byteLength > 100 && imgBuf.byteLength < 5 * 1024 * 1024) {
            const b64 = ab2b64(imgBuf);
            const ct  = imgResp.headers.get('content-type') || 'image/png';
            y = chk(y, 50);
            doc.addImage('data:' + ct + ';base64,' + b64, 'PNG', 15, y, 100, 30);
            y += 34;
            imgCarregada = true;
          }
        }
      } catch (_) { /* falha silenciosa */ }
    }

    if (!imgCarregada) {
      y = chk(y, 20);
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('[ Assinatura eletrônica registrada — imagem não disponível neste relatório ]', 15, y + 6);
      y += 14;
    }

    // Linha de assinatura
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(15, y + 1, 135, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(sv(assinatura.assinante_nome) + ' — CPF ' + sv(assinatura.assinante_cpf) + ' — ' + dtFmt, 15, y + 7);
    y += 14;

  } else {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, y, PW - 30, 35, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(15, y, PW - 30, 35, 2, 2, 'S');
    y += 39;
    doc.setDrawColor(...BLACK);
    doc.line(15, y, 135, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Assinatura da Paciente — AGUARDANDO', 15, y + 7);
    y += 14;
  }

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'italic');
    doc.text(
      clinicaNome + ' — ' + codigoKit + ' — ' + now.toLocaleString('pt-BR') + ' — Página ' + p + '/' + totalPages,
      PW / 2, PH - 8, { align: 'center' }
    );
    if (assinatura?.documento_hash) {
      doc.text('Hash: ' + assinatura.documento_hash, PW / 2, PH - 4, { align: 'center' });
    }
  }

  return doc;
}

// ─── Handler HTTP ─────────────────────────────────────────────────────────────

Deno.serve(async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { kit_id, patient_id, assinatura_id: aIdParam } = body;

    if (!kit_id || !patient_id) {
      return Response.json({ error: 'kit_id e patient_id são obrigatórios' }, { status: 400 });
    }

    console.log('[gerarKit] START', { kit_id, patient_id });

    // 1. Kit
    const kArr = await base44.asServiceRole.entities.DossieKitDocumental.filter({ id: kit_id }, '-created_date', 1);
    const kit = kArr[0];
    if (!kit) return Response.json({ error: 'Kit não encontrado para o ID: ' + kit_id }, { status: 404 });
    console.log('[gerarKit] kit:', kit.procedimento_nome, 'status:', kit.status);

    // 2. Paciente
    let patient = null;
    try {
      const pArr = await base44.asServiceRole.entities.Patient.filter({ id: patient_id }, '-created_date', 1);
      patient = pArr[0] || null;
    } catch (e) { console.warn('[gerarKit] paciente:', e.message); }
    if (!patient) console.warn('[gerarKit] AVISO: paciente não encontrado — PDF gerado sem dados pessoais');

    // 3. Clínica
    let clinica = null;
    try {
      const cArr = await base44.asServiceRole.entities.ClinicSettings.list('-created_date', 1);
      clinica = cArr[0] || null;
    } catch (e) { console.warn('[gerarKit] clinica:', e.message); }

    // 4. Financeiro
    let financeiro = null;
    try {
      if (kit.financeiro_id) {
        const fArr = await base44.asServiceRole.entities.DossieFinanceiro.filter({ id: kit.financeiro_id }, '-created_date', 1);
        financeiro = fArr[0] || null;
      }
      if (!financeiro) {
        const fArr2 = await base44.asServiceRole.entities.DossieFinanceiro.filter({ patient_id }, '-created_date', 5);
        financeiro = fArr2.find(f => f.procedimento === kit.procedimento_nome) || fArr2[0] || null;
      }
    } catch (e) { console.warn('[gerarKit] financeiro:', e.message); }

    // 5. Assinatura
    let assinatura = null;
    const sigId = aIdParam || kit.assinatura_id;
    try {
      if (sigId) {
        const sArr = await base44.asServiceRole.entities.AssinaturaEletronica.filter({ id: sigId }, '-created_date', 1);
        assinatura = sArr[0] || null;
      }
    } catch (e) { console.warn('[gerarKit] assinatura:', e.message); }
    console.log('[gerarKit] assinatura:', assinatura ? assinatura.assinante_nome : 'sem assinatura');

    // 6. Construir PDF
    let pdfDoc;
    try {
      pdfDoc = await buildPdf(kit, patient, clinica, financeiro, assinatura);
    } catch (buildErr) {
      console.error('[gerarKit] buildPdf ERRO:', buildErr.message);
      return Response.json({
        error: 'Erro na construção do PDF: ' + buildErr.message,
        etapa: 'build_pdf',
        kit_id, patient_encontrado: !!patient, assinatura_encontrada: !!assinatura,
      }, { status: 500 });
    }

    const pdfBytes = pdfDoc.output('arraybuffer');
    console.log('[gerarKit] PDF bytes:', pdfBytes.byteLength);

    if (!pdfBytes || pdfBytes.byteLength < 500) {
      return Response.json({ error: 'PDF gerado está vazio ou corrompido (' + (pdfBytes?.byteLength || 0) + ' bytes)', etapa: 'pdf_vazio' }, { status: 500 });
    }

    const nomeLimpo   = sv(kit.procedimento_nome, 'Proc').replace(/[^a-zA-Z0-9]/g, '_');
    const nomePac     = sv(patient?.full_name || kit.patient_name, 'Paciente').replace(/[^a-zA-Z0-9]/g, '_');
    const nomeArq     = 'Kit_' + nomeLimpo + '_' + nomePac + '_' + (assinatura ? 'Assinado' : 'Pendente') + '_' + Date.now() + '.pdf';

    // 7. Upload: converter para base64 data URL (funciona no Deno SDK)
    let pdfUrl = null;
    let uploadErro = null;
    try {
      const b64 = ab2b64(pdfBytes);
      const dataUrl = 'data:application/pdf;base64,' + b64;
      const upRes = await base44.asServiceRole.integrations.Core.UploadFile({ file: dataUrl });
      if (upRes?.file_url) {
        pdfUrl = upRes.file_url;
        console.log('[gerarKit] upload OK:', pdfUrl.substring(0, 60));
      } else {
        uploadErro = 'UploadFile retornou sem file_url';
        console.warn('[gerarKit] upload sem URL:', JSON.stringify(upRes));
      }
    } catch (upErr) {
      uploadErro = upErr.message;
      console.warn('[gerarKit] upload erro:', upErr.message);
    }

    // 8. Persistir URL no kit
    if (pdfUrl) {
      try {
        const updateData = assinatura
          ? { pdf_final_url: pdfUrl, pdf_file_name: nomeArq }
          : { pdf_url: pdfUrl, pdf_file_name: nomeArq };
        await base44.asServiceRole.entities.DossieKitDocumental.update(kit_id, updateData);
        console.log('[gerarKit] kit atualizado:', assinatura ? 'pdf_final_url' : 'pdf_url');
      } catch (updErr) {
        console.warn('[gerarKit] atualização do kit falhou:', updErr.message);
      }

      return Response.json({
        success: true,
        pdf_url: pdfUrl,
        pdf_file_name: nomeArq,
        is_signed: !!assinatura,
        bytes: pdfBytes.byteLength,
      });
    }

    // 9. Fallback: retornar base64 no JSON para o frontend baixar sem storage
    console.warn('[gerarKit] storage falhou — retornando base64. Motivo:', uploadErro);
    const b64Final = ab2b64(pdfBytes);
    return Response.json({
      success: true,
      pdf_base64: b64Final,
      pdf_file_name: nomeArq,
      is_signed: !!assinatura,
      bytes: pdfBytes.byteLength,
      storage_error: uploadErro,
    });

  } catch (error) {
    console.error('[gerarKit] ERRO GERAL:', error.message);
    return Response.json({ error: error.message, etapa: 'geral' }, { status: 500 });
  }
});