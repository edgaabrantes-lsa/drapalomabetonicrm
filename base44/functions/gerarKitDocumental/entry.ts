import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function s(value, fallback) {
  const fb = fallback !== undefined ? fallback : '—';
  if (value === null || value === undefined) return fb;
  if (typeof value === 'string') return value.trim() || fb;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fb;
}

function formatDate(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('pt-BR'); } catch { return '—'; }
}

function formatCurrency(val) {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

const CONSENTIMENTOS_TEXTO = {
  rinomodelacao: 'TERMO DE CONSENTIMENTO INFORMADO — RINOMODELAÇÃO\n\nA paciente declara estar ciente de que a rinomodelação com preenchimento é um procedimento minimamente invasivo que utiliza ácido hialurônico para harmonização nasal, sem cirurgia. Riscos incluem hematomas, assimetria temporária, edema e, raramente, oclusão vascular. O profissional explicou alternativas, limitações e expectativas. A paciente confirma ter compreendido e autoriza a realização do procedimento.',
  toxina: 'TERMO DE CONSENTIMENTO INFORMADO — TOXINA BOTULÍNICA\n\nA paciente declara estar ciente de que a aplicação de toxina botulínica é um procedimento minimamente invasivo para relaxamento muscular temporário. Riscos incluem ptose palpebral, assimetria, dor local e equimose. Os efeitos são temporários (3–6 meses). A paciente confirma ter compreendido e autoriza a realização do procedimento.',
  preenchimento: 'TERMO DE CONSENTIMENTO INFORMADO — PREENCHIMENTO COM ÁCIDO HIALURÔNICO\n\nA paciente declara estar ciente de que o preenchimento com ácido hialurônico é um procedimento minimamente invasivo de harmonização facial. Riscos incluem edema, hematoma, nódulos e, raramente, oclusão vascular. A paciente confirma ter compreendido e autoriza o procedimento.',
  bioestimulador: 'TERMO DE CONSENTIMENTO INFORMADO — BIOESTIMULADOR DE COLÁGENO\n\nA paciente declara estar ciente de que o bioestimulador estimula a produção natural de colágeno. Os resultados são progressivos (2–6 meses). Riscos incluem nódulos, hematomas e assimetria transitória. A paciente confirma ter compreendido e autoriza o procedimento.',
  fios: 'TERMO DE CONSENTIMENTO INFORMADO — FIOS DE SUSTENTAÇÃO\n\nA paciente declara estar ciente de que os fios de sustentação são utilizados para lifting facial minimamente invasivo. Riscos incluem assimetria temporária, equimose, desconforto e migração dos fios. A paciente confirma ter compreendido e autoriza o procedimento.',
  pele: 'TERMO DE CONSENTIMENTO INFORMADO — PROCEDIMENTOS DE PELE\n\nA paciente declara estar ciente dos procedimentos de pele propostos. Riscos incluem vermelhidão transitória, edema e sensibilidade. A paciente confirma ter compreendido e autoriza os procedimentos.',
  corporal: 'TERMO DE CONSENTIMENTO INFORMADO — PROCEDIMENTO CORPORAL\n\nA paciente declara estar ciente do procedimento corporal proposto. Riscos incluem equimoses, irregularidades transitórias e desconforto local. A paciente confirma ter compreendido e autoriza o procedimento.',
  full_face: 'TERMO DE CONSENTIMENTO INFORMADO — PROTOCOLO FULL FACE\n\nA paciente declara estar ciente de que o Protocolo Full Face inclui múltiplas técnicas de harmonização orofacial. Os riscos são cumulativos e incluem edema, assimetria transitória, equimoses e, raramente, oclusão vascular. A paciente confirma ter compreendido e autoriza todos os procedimentos incluídos.',
  labios: 'TERMO DE CONSENTIMENTO INFORMADO — PREENCHIMENTO LABIAL\n\nA paciente declara estar ciente de que o preenchimento labial usa ácido hialurônico. Riscos incluem edema significativo nas primeiras 48h, assimetria transitória e desconforto. A paciente confirma ter compreendido e autoriza o procedimento.',
  mandibula: 'TERMO DE CONSENTIMENTO INFORMADO — HARMONIZAÇÃO DE MANDÍBULA\n\nA paciente declara estar ciente dos procedimentos de harmonização mandibular. Riscos incluem edema, hematoma e assimetria transitória. A paciente confirma ter compreendido e autoriza o procedimento.',
  mento: 'TERMO DE CONSENTIMENTO INFORMADO — MENTOPLASTIA NÃO CIRÚRGICA\n\nA paciente declara estar ciente da harmonização de mento. Riscos incluem edema, hematoma e assimetria transitória. A paciente confirma ter compreendido e autoriza o procedimento.',
  olheiras: 'TERMO DE CONSENTIMENTO INFORMADO — TRATAMENTO DE OLHEIRAS\n\nA paciente declara estar ciente do tratamento de olheiras. Riscos incluem edema, Tyndall effect e sensibilidade local. A paciente confirma ter compreendido e autoriza o procedimento.',
};

const CONTRATO_MESTRE = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS\n\nPelo presente instrumento particular, as partes identificadas neste documento — a Contratada (Clínica) e a Contratante (Paciente) — acordam os seguintes termos:\n\n1. OBJETO: Prestação de serviços de harmonização orofacial e estética conforme procedimento contratado.\n\n2. OBRIGAÇÕES DA CLÍNICA: Realizar os procedimentos com técnica adequada, materiais certificados e profissionais habilitados; fornecer orientações pré e pós-procedimento; manter sigilo profissional.\n\n3. OBRIGAÇÕES DA PACIENTE: Fornecer informações verídicas sobre saúde; seguir orientações pré e pós-procedimento; comparecer às consultas agendadas; comunicar reações adversas imediatamente.\n\n4. RISCOS E LIMITAÇÕES: A paciente foi informada dos riscos inerentes ao procedimento e declara compreender que resultados individuais podem variar. Não há garantia de resultado específico.\n\n5. PAGAMENTO: Conforme condições descritas no Anexo Financeiro deste Kit Documental.\n\n6. RESCISÃO: Qualquer parte pode rescindir mediante comunicação prévia, respeitando política de cancelamento vigente.\n\n7. FORO: Fica eleito o foro da comarca da clínica para dirimir eventuais conflitos.';

const LGPD_TEXTO = 'TERMO DE CONSENTIMENTO — LGPD (Lei 13.709/2018)\n\nA Clínica coleta e trata dados pessoais e de saúde para finalidades clínicas, administrativas e de comunicação. A paciente declara ter sido informada sobre:\n\n1. DADOS COLETADOS: Nome, CPF, RG, data de nascimento, endereço, contato, histórico de saúde, fotografias e dados financeiros.\n\n2. FINALIDADE: Prestação de serviços de saúde e estética, prontuário eletrônico, comunicação sobre tratamentos e financeiro.\n\n3. BASE LEGAL: Consentimento (Art. 7º, I) e tutela da saúde (Art. 7º, VIII).\n\n4. ARMAZENAMENTO: Dados mantidos pelo prazo legal mínimo de 5 anos após o término do atendimento.\n\n5. DIREITOS: Acesso, correção, portabilidade, eliminação e revogação do consentimento podem ser solicitados a qualquer tempo.\n\n6. COMPARTILHAMENTO: Dados não são comercializados. Podem ser compartilhados apenas com parceiros operacionais sob sigilo.\n\nA paciente autoriza o tratamento de seus dados pessoais para as finalidades descritas acima.';

const USO_IMAGEM_TEXTO = 'TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM\n\nA paciente declara a seguinte opção de autorização de uso de imagem:\n\n( ) Não autorizo qualquer uso\n( ) Autorizo uso exclusivamente interno (prontuário/arquivo clínico)\n( ) Autorizo uso científico sem identificação\n( ) Autorizo divulgação em redes sociais sem identificação\n( ) Autorizo divulgação em redes sociais com identificação (mediante acordo prévio)\n\nA autorização pode ser revogada a qualquer momento mediante comunicação escrita à Clínica.';

// ─── Construção do PDF (async para poder fazer fetch da imagem de assinatura) ──

async function buildPdf(kit, patient, clinica, financeiro, assinatura) {
  const doc = new jsPDF({ format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  const gold   = [200, 169, 106];
  const black  = [20, 20, 20];
  const gray   = [120, 120, 120];
  const darkBg = [13, 17, 25];
  const green  = [34, 197, 94];
  const amber  = [245, 158, 11];
  const white  = [255, 255, 255];

  const clinicaNome  = s(clinica && clinica.clinic_name ? clinica.clinic_name : (kit.clinic_name || ''), 'Clínica Dra. Paloma Betoni');
  const profissional = s(clinica && clinica.professional_name ? clinica.professional_name : '', 'Dra. Paloma Betoni');
  const registro     = s(clinica && clinica.professional_registry ? clinica.professional_registry : '');
  const now          = new Date();
  const codigoKit    = 'KIT-' + (kit.id || 'XXXXX').substring(0, 8).toUpperCase();

  function header() {
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, PW, 18, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(clinicaNome.toUpperCase(), 15, 12);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Kit Documental — ' + codigoKit, PW - 15, 12, { align: 'right' });
  }

  function newPage() {
    doc.addPage();
    header();
    return 28;
  }

  function chk(y, need) {
    if (y > PH - (need || 30)) return newPage();
    return y;
  }

  function section(title, y) {
    y = chk(y, 40);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.4);
    doc.line(15, y, PW - 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text(title.toUpperCase(), 15, y);
    return y + 8;
  }

  function txt(text, y, size, bold, color) {
    if (!text) return y;
    const fsz = size || 9;
    const clr = color || black;
    y = chk(y, 20);
    doc.setFontSize(fsz);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...clr);
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
    doc.setTextColor(...gray);
    doc.text(label + ':', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    const lines = doc.splitTextToSize(s(value), PW - 75);
    doc.text(lines, 60, y);
    return y + Math.max(6, lines.length * 5.5);
  }

  // ── CAPA ──────────────────────────────────────────────────────────────
  header();
  doc.setFillColor(...darkBg);
  doc.rect(0, 18, PW, 80, 'F');
  doc.setTextColor(...gold);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KIT DOCUMENTAL', PW / 2, 50, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text(s(kit.procedimento_nome, 'Procedimento'), PW / 2, 62, { align: 'center' });
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(60, 68, PW - 60, 68);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Paciente: ' + s(patient ? patient.full_name : (kit.patient_name || ''), 'Não identificado'), PW / 2, 76, { align: 'center' });
  doc.text('Gerado em: ' + now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR'), PW / 2, 83, { align: 'center' });
  doc.text('Código: ' + codigoKit, PW / 2, 90, { align: 'center' });

  const statusColor = assinatura ? green : amber;
  const statusLabel = assinatura ? 'DOCUMENTO ASSINADO ELETRONICAMENTE' : 'AGUARDANDO ASSINATURA';
  const sw = doc.getTextWidth(statusLabel) + 20;
  doc.setFillColor(...statusColor);
  doc.roundedRect((PW - sw) / 2, 96, sw, 10, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, PW / 2, 102.5, { align: 'center' });

  let y = 115;

  // ── SUMÁRIO ───────────────────────────────────────────────────────────
  y = section('SUMÁRIO DO KIT DOCUMENTAL', y);
  const sumItems = ['Seção 1 — Dados da Paciente','Seção 2 — Dados da Clínica','Seção 3 — Procedimento Contratado','Seção 4 — Contrato Mestre','Seção 5 — Termo LGPD','Seção 6 — Autorização de Uso de Imagem','Seção 7 — Consentimento do Procedimento','Seção 8 — Anexo Financeiro','Seção 9 — Documentos Anexados','Seção 10 — Declarações Finais','Seção 11 — Assinatura Única'];
  for (const item of sumItems) {
    y = chk(y, 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    doc.text(item, 20, y);
    y += 5.5;
  }
  y += 4;

  // ── SEÇÃO 1 — PACIENTE ────────────────────────────────────────────────
  y = newPage();
  y = section('Seção 1 — Dados da Paciente', y);
  const addr = patient && patient.address ? patient.address : null;
  const endereco = addr ? s(addr.street) + ', ' + s(addr.number) + (addr.complement ? ', ' + addr.complement : '') + ' — ' + s(addr.neighborhood) + ' — ' + s(addr.city) + '/' + s(addr.state) + ' — CEP ' + s(addr.zip_code) : '—';
  y = field('Nome Completo', patient ? patient.full_name : (kit.patient_name || '—'), y);
  y = field('CPF', patient && patient.document_number ? patient.document_number : 'Não informado', y);
  y = field('RG', patient && patient.rg ? patient.rg : '—', y);
  y = field('Data de Nascimento', patient && patient.birth_date ? formatDate(patient.birth_date) : '—', y);
  y = field('Telefone', patient && patient.phone ? patient.phone : '—', y);
  y = field('WhatsApp', patient && patient.whatsapp ? patient.whatsapp : '—', y);
  y = field('E-mail', patient && patient.email ? patient.email : '—', y);
  y = field('Endereço', endereco, y);
  if (patient && patient.responsavel_legal && patient.responsavel_legal.nome) {
    y += 4;
    y = txt('Responsável Legal:', y, 8, true, gray);
    y = field('Nome', patient.responsavel_legal.nome, y);
    y = field('CPF', patient.responsavel_legal.cpf || '—', y);
    y = field('Parentesco', patient.responsavel_legal.parentesco || '—', y);
  }

  // ── SEÇÃO 2 — CLÍNICA ─────────────────────────────────────────────────
  y = section('Seção 2 — Dados da Clínica', y);
  y = field('Clínica', clinicaNome, y);
  y = field('Razão Social', clinica && clinica.legal_name ? clinica.legal_name : '—', y);
  y = field('CNPJ/CPF', clinica ? s(clinica.cnpj || clinica.cpf) : '—', y);
  const clinAddr = clinica && clinica.address ? clinica.address : null;
  if (clinAddr) {
    y = field('Endereço', s(clinAddr.street) + ', ' + s(clinAddr.number) + ' — ' + s(clinAddr.city) + '/' + s(clinAddr.state), y);
  }
  y = field('Telefone', clinica && clinica.phone ? clinica.phone : '—', y);
  y = field('E-mail', clinica && clinica.email ? clinica.email : '—', y);
  y = field('Profissional Responsável', profissional, y);
  y = field('Registro Profissional', registro, y);
  y = field('Especialidade', clinica && clinica.especialidade ? clinica.especialidade : '—', y);

  // ── SEÇÃO 3 — PROCEDIMENTO ────────────────────────────────────────────
  y = section('Seção 3 — Procedimento Contratado', y);
  y = field('Procedimento', s(kit.procedimento_nome), y);
  if (kit.protocolo_nome) y = field('Protocolo', s(kit.protocolo_nome), y);
  if (kit.tecnicas_full_face && kit.tecnicas_full_face.length > 0) {
    y = field('Técnicas Incluídas', kit.tecnicas_full_face.join(', '), y);
  }
  y = field('Tipo de Kit', s(kit.kit_tipo), y);
  y = field('Profissional', profissional, y);
  y = field('Data de Geração', formatDate(kit.data_geracao || now.toISOString()), y);
  if (kit.observacoes) y = field('Observações', kit.observacoes, y);

  // ── SEÇÃO 4 — CONTRATO MESTRE ─────────────────────────────────────────
  y = newPage();
  y = section('Seção 4 — Contrato Mestre', y);
  y = txt(CONTRATO_MESTRE, y, 8.5);

  // ── SEÇÃO 5 — LGPD ───────────────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 5 — Proteção de Dados (LGPD)', y);
  y = txt(LGPD_TEXTO, y, 8.5);

  // ── SEÇÃO 6 — USO DE IMAGEM ───────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 6 — Autorização de Uso de Imagem', y);
  y = txt(USO_IMAGEM_TEXTO, y, 8.5);
  const consentImagem = patient && patient.consent_images;
  y = txt('Status da autorização: ' + (consentImagem ? '✓ Autorizado' : '— A definir na assinatura'), y, 8.5, true);

  // ── SEÇÃO 7 — CONSENTIMENTO ───────────────────────────────────────────
  y = newPage();
  const categorias = (kit.tecnicas_full_face && kit.tecnicas_full_face.length > 0)
    ? kit.tecnicas_full_face
    : [kit.categoria || 'outro'];

  for (const cat of categorias) {
    const textoConsent = CONSENTIMENTOS_TEXTO[cat]
      || CONSENTIMENTOS_TEXTO[kit.categoria]
      || 'TERMO DE CONSENTIMENTO — ' + (kit.procedimento_nome || 'Procedimento').toUpperCase() + '\n\nA paciente declara estar ciente dos procedimentos contratados, seus riscos, limitações e alternativas. O profissional forneceu todas as informações necessárias. A paciente confirma ter compreendido e autoriza a realização dos procedimentos.';
    y = chk(y, 60);
    y = section('Seção 7 — Consentimento: ' + (kit.procedimento_nome || 'Procedimento'), y);
    y = txt(textoConsent, y, 8.5);
  }

  // ── SEÇÃO 8 — FINANCEIRO ──────────────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 8 — Anexo Financeiro', y);
  if (financeiro) {
    y = field('Procedimento', s(financeiro.procedimento), y);
    y = field('Valor Total', formatCurrency(financeiro.valor_total), y);
    y = field('Entrada', formatCurrency(financeiro.entrada), y);
    y = field('Saldo Restante', formatCurrency((financeiro.valor_total || 0) - (financeiro.entrada || 0)), y);
    y = field('Parcelas', s(financeiro.num_parcelas, '1'), y);
    y = field('Forma de Pagamento', s(financeiro.forma_pagamento), y);
    y = field('Vencimento', financeiro.data_vencimento ? formatDate(financeiro.data_vencimento) : '—', y);
    y = field('Status Financeiro', s(financeiro.status_financeiro), y);
    if (financeiro.observacoes) y = field('Observações', financeiro.observacoes, y);
  } else {
    y = txt('Dados financeiros não informados no momento da geração. O valor será acordado separadamente.', y, 8.5, false, amber);
  }

  // ── SEÇÃO 9 — DOCUMENTOS ANEXADOS ────────────────────────────────────
  y = chk(y, 40);
  y = section('Seção 9 — Documentos Anexados', y);
  const docsIncluidos = kit.documentos_incluidos || [];
  const docsRef = docsIncluidos.filter(function(d) { return d.tipo === 'documento_identificacao' || d.tipo === 'comprovante_pagamento'; });
  if (docsRef.length === 0) {
    y = txt('Nenhum documento de identificação ou comprovante de pagamento anexado no momento da geração.', y, 8.5, false, gray);
  } else {
    for (const d of docsRef) {
      y = field(d.nome, d.status === 'anexado_no_kit' ? '✓ Documento anexado' : 'Pendente de anexo', y);
    }
  }

  // ── SEÇÃO 10 — DECLARAÇÕES FINAIS ────────────────────────────────────
  y = chk(y, 60);
  y = section('Seção 10 — Declarações Finais', y);
  y = txt('A paciente declara que:\n\n1. Leu, compreendeu e aceitou integralmente todas as seções deste Kit Documental.\n\n2. Recebeu explicações verbais e escritas sobre os procedimentos, seus riscos, benefícios, alternativas e limitações.\n\n3. Teve oportunidade de fazer perguntas, que foram respondidas de forma satisfatória.\n\n4. Está em plenas capacidades de compreensão e decisão, ou está acompanhada de responsável legal devidamente identificado.\n\n5. Autoriza a realização dos procedimentos descritos neste Kit Documental.\n\n6. Está ciente de que pode revogar este consentimento a qualquer momento antes da realização dos procedimentos.', y, 8.5);

  // ── SEÇÃO 11 — ASSINATURA ÚNICA ───────────────────────────────────────
  y = chk(y, 120);
  y = section('Seção 11 — Assinatura Única do Kit Documental', y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...gray);
  doc.text('Esta assinatura valida integralmente todo o Kit Documental, incluindo todas as seções acima.', 15, y);
  y += 8;

  if (assinatura) {
    const badgeW = 130;
    doc.setFillColor(...green);
    doc.roundedRect(15, y - 4, badgeW, 10, 2, 2, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ KIT DOCUMENTAL ASSINADO ELETRONICAMENTE', 15 + badgeW / 2, y + 2, { align: 'center' });
    y += 16;

    const dtSig = assinatura.data_assinatura ? new Date(assinatura.data_assinatura) : now;
    const dataFmt = dtSig.toLocaleDateString('pt-BR');
    const horaFmt = dtSig.toLocaleTimeString('pt-BR');

    y = txt('Assinado eletronicamente por ' + s(assinatura.assinante_nome) + ', CPF ' + s(assinatura.assinante_cpf) + ', em ' + dataFmt + ' às ' + horaFmt + ', mediante aceite digital registrado na plataforma ' + clinicaNome + '.', y, 8.5);
    y = field('Nome do Assinante', assinatura.assinante_nome, y);
    y = field('CPF', assinatura.assinante_cpf, y);
    y = field('Tipo', assinatura.assinante_tipo === 'responsavel_legal' ? 'Responsável Legal' : 'Paciente', y);
    y = field('Data da Assinatura', dataFmt, y);
    y = field('Hora', horaFmt, y);
    y = field('Hash / Identificador', s(assinatura.documento_hash), y);
    y = field('Método', 'Assinatura Digital Presencial (Canvas)', y);
    y = field('Responsável Admin', s(assinatura.usuario_responsavel_nome), y);
    y = field('Declarou Leitura', assinatura.declarou_leitura ? 'Sim' : 'Não', y);
    y = field('Concordou com os Termos', assinatura.concordou_termos ? 'Sim' : 'Não', y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text('ASSINATURA MANUSCRITA:', 15, y);
    y += 6;

    // Tentar carregar imagem — nunca aborta se falhar
    let imagemCarregada = false;
    const sigUrl = assinatura.assinatura_data_url;
    if (sigUrl && typeof sigUrl === 'string' && (sigUrl.startsWith('http://') || sigUrl.startsWith('https://'))) {
      try {
        const ctrl = new AbortController();
        const tmr = setTimeout(function() { ctrl.abort(); }, 8000);
        const imgResp = await fetch(sigUrl, { signal: ctrl.signal });
        clearTimeout(tmr);
        if (imgResp.ok) {
          const imgBuf = await imgResp.arrayBuffer();
          if (imgBuf.byteLength > 100 && imgBuf.byteLength < 3 * 1024 * 1024) {
            const b64 = arrayBufferToBase64(imgBuf);
            const ct = imgResp.headers.get('content-type') || 'image/png';
            const imgData = 'data:' + ct + ';base64,' + b64;
            y = chk(y, 50);
            doc.addImage(imgData, 'PNG', 15, y, 100, 30);
            y += 34;
            imagemCarregada = true;
          }
        }
      } catch (imgErr) {
        console.warn('[buildPdf] Imagem assinatura não carregada:', imgErr.message);
      }
    }

    if (!imagemCarregada) {
      y = chk(y, 20);
      doc.setTextColor(...gray);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('[ Assinatura eletrônica registrada — imagem não disponível neste relatório ]', 15, y + 6);
      y += 14;
    }

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(15, y + 1, 135, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...gray);
    doc.text(s(assinatura.assinante_nome) + ' — CPF ' + s(assinatura.assinante_cpf) + ' — ' + dataFmt, 15, y + 7);
    y += 14;

  } else {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, y, PW - 30, 35, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, y, PW - 30, 35, 2, 2, 'S');
    y += 39;
    doc.setDrawColor(...black);
    doc.line(15, y, 135, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text('Assinatura da Paciente — AGUARDANDO', 15, y + 7);
    y += 14;
  }

  // ── RODAPÉ ────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(6.5);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'italic');
    doc.text(
      clinicaNome + ' — Kit Documental ' + codigoKit + ' — Gerado em ' + now.toLocaleString('pt-BR') + ' — Página ' + p + '/' + totalPages,
      PW / 2, PH - 8, { align: 'center' }
    );
    if (assinatura && assinatura.documento_hash) {
      doc.text('Hash: ' + assinatura.documento_hash, PW / 2, PH - 4, { align: 'center' });
    }
  }

  return doc;
}

// ─── Handler HTTP ─────────────────────────────────────────────────────────

Deno.serve(async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const kit_id = body.kit_id;
    const patient_id = body.patient_id;
    const assinatura_id = body.assinatura_id || null;

    if (!kit_id || !patient_id) {
      return Response.json({ error: 'kit_id e patient_id são obrigatórios' }, { status: 400 });
    }

    console.log('[gerarKitDocumental] START', { kit_id, patient_id, assinatura_id });

    // 1. Kit
    const kitsArr = await base44.entities.DossieKitDocumental.filter({ id: kit_id }, '-created_date', 1);
    const kit = kitsArr[0];
    if (!kit) return Response.json({ error: 'Kit não encontrado' }, { status: 404 });
    console.log('[gerarKitDocumental] kit:', kit.procedimento_nome, 'status:', kit.status);

    // 2. Paciente
    let patient = null;
    try {
      const pArr = await base44.entities.Patient.filter({ id: patient_id }, '-created_date', 1);
      patient = pArr[0] || null;
    } catch (e) { console.warn('[gerarKitDocumental] paciente não encontrado:', e.message); }
    console.log('[gerarKitDocumental] paciente:', patient ? patient.full_name : 'não encontrado');

    // 3. Clínica
    let clinica = null;
    try {
      const cArr = await base44.entities.ClinicSettings.list('-created_date', 1);
      clinica = cArr[0] || null;
    } catch (e) { console.warn('[gerarKitDocumental] clínica não encontrada:', e.message); }

    // 4. Financeiro
    let financeiro = null;
    try {
      if (kit.financeiro_id) {
        const fArr = await base44.entities.DossieFinanceiro.filter({ id: kit.financeiro_id }, '-created_date', 1);
        financeiro = fArr[0] || null;
      }
      if (!financeiro) {
        const fArr2 = await base44.entities.DossieFinanceiro.filter({ patient_id: patient_id }, '-created_date', 5);
        financeiro = fArr2.find(function(f) { return f.procedimento === kit.procedimento_nome; }) || fArr2[0] || null;
      }
    } catch (e) { console.warn('[gerarKitDocumental] financeiro não encontrado:', e.message); }
    console.log('[gerarKitDocumental] financeiro:', financeiro ? formatCurrency(financeiro.valor_total) : 'não encontrado');

    // 5. Assinatura
    let assinatura = null;
    try {
      const sigId = assinatura_id || kit.assinatura_id;
      if (sigId) {
        const sArr = await base44.entities.AssinaturaEletronica.filter({ id: sigId }, '-created_date', 1);
        assinatura = sArr[0] || null;
      }
    } catch (e) { console.warn('[gerarKitDocumental] assinatura não encontrada:', e.message); }
    console.log('[gerarKitDocumental] assinatura:', assinatura ? ('encontrada: ' + assinatura.assinante_nome) : 'sem assinatura');

    // 6. Gerar PDF
    let pdfDoc;
    try {
      pdfDoc = await buildPdf(kit, patient, clinica, financeiro, assinatura);
    } catch (buildErr) {
      console.error('[gerarKitDocumental] ERRO buildPdf:', buildErr.message, buildErr.stack);
      return Response.json({ error: 'Erro na construção do PDF: ' + buildErr.message }, { status: 500 });
    }

    const pdfBytes = pdfDoc.output('arraybuffer');
    console.log('[gerarKitDocumental] PDF bytes:', pdfBytes.byteLength);

    if (!pdfBytes || pdfBytes.byteLength < 500) {
      return Response.json({ error: 'PDF gerado inválido' }, { status: 500 });
    }

    const nomeLimpo = (kit.procedimento_nome || 'Procedimento').replace(/[^a-zA-Z0-9]/g, '_');
    const nomePaciente = (patient ? patient.full_name : (kit.patient_name || 'Paciente')).replace(/[^a-zA-Z0-9]/g, '_');
    const nomeArquivo = 'KitDocumental_' + nomeLimpo + '_' + nomePaciente + '_' + (assinatura ? 'Assinado' : 'Pendente') + '_' + Date.now() + '.pdf';

    // 7. Upload do PDF para storage e retorno da URL
    // No Deno: usar Blob nativo para enviar o arquivo
    let pdfUrl = null;
    try {
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const uploadRes = await base44.integrations.Core.UploadFile({ file: pdfBlob });
      if (uploadRes && uploadRes.file_url) {
        pdfUrl = uploadRes.file_url;
        console.log('[gerarKitDocumental] upload OK:', pdfUrl);
      }
    } catch (uploadErr) {
      console.warn('[gerarKitDocumental] upload falhou:', uploadErr.message);
    }

    // 8. Persistir URL no kit
    if (pdfUrl) {
      try {
        const updateData = assinatura
          ? { pdf_final_url: pdfUrl, pdf_file_name: nomeArquivo, pdf_final_generated_at: new Date().toISOString() }
          : { pdf_url: pdfUrl, pdf_file_name: nomeArquivo, pdf_generated_at: new Date().toISOString() };
        await base44.entities.DossieKitDocumental.update(kit_id, updateData);
        console.log('[gerarKitDocumental] kit atualizado com pdf_url');
      } catch (updErr) {
        console.warn('[gerarKitDocumental] falha ao atualizar kit com URL:', updErr.message);
      }

      return Response.json({
        success: true,
        pdf_url: pdfUrl,
        pdf_file_name: nomeArquivo,
        is_signed: !!assinatura,
      });
    }

    // Fallback binário se upload falhou
    console.warn('[gerarKitDocumental] fallback: retornando PDF binário');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + nomeArquivo + '"',
        'X-PDF-Fallback': 'true',
      },
    });

  } catch (error) {
    console.error('[gerarKitDocumental] ERRO GERAL:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});