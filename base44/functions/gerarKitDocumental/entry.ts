import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function s(value, fallback = '—') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('pt-BR');
}

function formatCurrency(val) {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

const CONSENTIMENTOS_TEXTO = {
  rinomodelacao: `TERMO DE CONSENTIMENTO INFORMADO — RINOMODELAÇÃO

A paciente declara estar ciente de que a rinomodelação com preenchimento é um procedimento minimamente invasivo que utiliza ácido hialurônico para harmonização nasal, sem cirurgia. Riscos incluem hematomas, assimetria temporária, edema e, raramente, oclusão vascular. O profissional explicou alternativas, limitações e expectativas. A paciente confirma ter compreendido e autoriza a realização do procedimento.`,
  toxina: `TERMO DE CONSENTIMENTO INFORMADO — TOXINA BOTULÍNICA

A paciente declara estar ciente de que a aplicação de toxina botulínica (Botox) é um procedimento minimamente invasivo para relaxamento muscular temporário. Riscos incluem ptose palpebral, assimetria, dor local e equimose. Os efeitos são temporários (3–6 meses). A paciente confirma ter compreendido e autoriza a realização do procedimento.`,
  preenchimento: `TERMO DE CONSENTIMENTO INFORMADO — PREENCHIMENTO COM ÁCIDO HIALURÔNICO

A paciente declara estar ciente de que o preenchimento com ácido hialurônico é um procedimento minimamente invasivo de harmonização facial. Riscos incluem edema, hematoma, nódulos e, raramente, oclusão vascular. O profissional explicou técnicas de reversão (hialuronidase). A paciente confirma ter compreendido e autoriza o procedimento.`,
  bioestimulador: `TERMO DE CONSENTIMENTO INFORMADO — BIOESTIMULADOR DE COLÁGENO

A paciente declara estar ciente de que o bioestimulador estimula a produção natural de colágeno. Os resultados são progressivos (2–6 meses). Riscos incluem nódulos, hematomas e assimetria transitória. A paciente confirma ter compreendido e autoriza o procedimento.`,
  fios: `TERMO DE CONSENTIMENTO INFORMADO — FIOS DE SUSTENTAÇÃO

A paciente declara estar ciente de que os fios de sustentação são utilizados para lifting facial minimamente invasivo. Riscos incluem assimetria temporária, equimose, desconforto e migração dos fios. A paciente confirma ter compreendido e autoriza o procedimento.`,
  pele: `TERMO DE CONSENTIMENTO INFORMADO — PROCEDIMENTOS DE PELE

A paciente declara estar ciente dos procedimentos de pele propostos (microagulhamento, skinbooster, limpeza profunda ou outros). Riscos incluem vermelhidão transitória, edema e sensibilidade. A paciente confirma ter compreendido e autoriza os procedimentos.`,
  corporal: `TERMO DE CONSENTIMENTO INFORMADO — PROCEDIMENTO CORPORAL

A paciente declara estar ciente do procedimento corporal proposto. Riscos incluem equimoses, irregularidades transitórias e desconforto local. A paciente confirma ter compreendido e autoriza o procedimento.`,
  full_face: `TERMO DE CONSENTIMENTO INFORMADO — PROTOCOLO FULL FACE

A paciente declara estar ciente de que o Protocolo Full Face inclui múltiplas técnicas de harmonização orofacial. Os riscos são cumulativos e incluem edema, assimetria transitória, equimoses e, raramente, oclusão vascular. O profissional explicou cada técnica individualmente. A paciente confirma ter compreendido e autoriza todos os procedimentos incluídos.`,
  labios: `TERMO DE CONSENTIMENTO INFORMADO — PREENCHIMENTO LABIAL

A paciente declara estar ciente de que o preenchimento labial usa ácido hialurônico. Riscos incluem edema significativo nas primeiras 48h, assimetria transitória e desconforto. A paciente confirma ter compreendido e autoriza o procedimento.`,
  mandibula: `TERMO DE CONSENTIMENTO INFORMADO — HARMONIZAÇÃO DE MANDÍBULA

A paciente declara estar ciente dos procedimentos de harmonização mandibular. Riscos incluem edema, hematoma e assimetria transitória. A paciente confirma ter compreendido e autoriza o procedimento.`,
  mento: `TERMO DE CONSENTIMENTO INFORMADO — MENTOPLASTIA NÃO CIRÚRGICA

A paciente declara estar ciente da harmonização de mento. Riscos incluem edema, hematoma e assimetria transitória. A paciente confirma ter compreendido e autoriza o procedimento.`,
  olheiras: `TERMO DE CONSENTIMENTO INFORMADO — TRATAMENTO DE OLHEIRAS

A paciente declara estar ciente do tratamento de olheiras (preenchimento com ácido hialurônico e/ou skinbooster). Riscos incluem edema, Tyndall effect e sensibilidade local. A paciente confirma ter compreendido e autoriza o procedimento.`,
};

const CONTRATO_MESTRE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

Pelo presente instrumento particular, as partes identificadas neste documento — a Contratada (Clínica) e a Contratante (Paciente) — acordam os seguintes termos:

1. OBJETO: Prestação de serviços de harmonização orofacial e estética conforme procedimento contratado.

2. OBRIGAÇÕES DA CLÍNICA: Realizar os procedimentos com técnica adequada, materiais certificados e profissionais habilitados; fornecer orientações pré e pós-procedimento; manter sigilo profissional.

3. OBRIGAÇÕES DA PACIENTE: Fornecer informações verídicas sobre saúde; seguir orientações pré e pós-procedimento; comparecer às consultas agendadas; comunicar reações adversas imediatamente.

4. RISCOS E LIMITAÇÕES: A paciente foi informada dos riscos inerentes ao procedimento e declara compreender que resultados individuais podem variar. Não há garantia de resultado específico.

5. PAGAMENTO: Conforme condições descritas no Anexo Financeiro deste Kit Documental.

6. RESCISÃO: Qualquer parte pode rescindir mediante comunicação prévia, respeitando política de cancelamento vigente.

7. FORO: Fica eleito o foro da comarca da clínica para dirimir eventuais conflitos.`;

const LGPD_TEXTO = `TERMO DE CONSENTIMENTO — LGPD (Lei Geral de Proteção de Dados — Lei 13.709/2018)

A Clínica coleta e trata dados pessoais e de saúde para finalidades clínicas, administrativas e de comunicação. A paciente declara ter sido informada sobre:

1. DADOS COLETADOS: Nome, CPF, RG, data de nascimento, endereço, contato, histórico de saúde, fotografias e dados financeiros.

2. FINALIDADE: Prestação de serviços de saúde e estética, prontuário eletrônico, comunicação sobre tratamentos e financeiro.

3. BASE LEGAL: Consentimento (Art. 7º, I) e tutela da saúde (Art. 7º, VIII).

4. ARMAZENAMENTO: Dados mantidos pelo prazo legal mínimo de 5 anos após o término do atendimento.

5. DIREITOS: Acesso, correção, portabilidade, eliminação e revogação do consentimento podem ser solicitados a qualquer tempo.

6. COMPARTILHAMENTO: Dados não são comercializados. Podem ser compartilhados apenas com parceiros operacionais sob sigilo.

A paciente autoriza o tratamento de seus dados pessoais para as finalidades descritas acima.`;

const USO_IMAGEM_TEXTO = `TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

A paciente autoriza ou não autoriza o uso de sua imagem (fotografias e vídeos) pela Clínica, conforme marcação no momento da assinatura. As opções são:

( ) Não autorizo qualquer uso
( ) Autorizo uso exclusivamente interno (prontuário/arquivo clínico)
( ) Autorizo uso científico sem identificação
( ) Autorizo divulgação em redes sociais sem identificação
( ) Autorizo divulgação em redes sociais com identificação (mediante acordo prévio)

A autorização pode ser revogada a qualquer momento mediante comunicação escrita à Clínica.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { kit_id, patient_id, assinatura_id } = await req.json();

    if (!kit_id || !patient_id) {
      return Response.json({ error: 'kit_id e patient_id são obrigatórios' }, { status: 400 });
    }

    // 1. Buscar kit
    const kits = await base44.entities.DossieKitDocumental.filter({ id: kit_id }, '-created_date', 1);
    const kit = kits[0];
    if (!kit) return Response.json({ error: 'Kit não encontrado' }, { status: 404 });

    // 2. Buscar paciente
    const patients = await base44.entities.Patient.filter({ id: patient_id }, '-created_date', 1);
    const patient = patients[0];

    // 3. Buscar clínica
    let clinica = null;
    try {
      const clinicas = await base44.entities.ClinicSettings.list('-created_date', 1);
      clinica = clinicas[0];
    } catch (e) { console.log('Sem config clinica:', e.message); }

    // 4. Buscar financeiro
    let financeiro = null;
    if (kit.financeiro_id) {
      try {
        const fins = await base44.entities.DossieFinanceiro.filter({ id: kit.financeiro_id }, '-created_date', 1);
        financeiro = fins[0];
      } catch (e) { console.log('Sem financeiro:', e.message); }
    }
    if (!financeiro && patient_id) {
      try {
        const fins = await base44.entities.DossieFinanceiro.filter({ patient_id }, '-created_date', 5);
        financeiro = fins.find(f => f.procedimento === kit.procedimento_nome) || fins[0] || null;
      } catch (e) { console.log('Sem financeiro2:', e.message); }
    }

    // 5. Buscar assinatura
    let assinatura = null;
    if (assinatura_id) {
      try {
        const sigs = await base44.entities.AssinaturaEletronica.filter({ id: assinatura_id }, '-created_date', 1);
        assinatura = sigs[0];
      } catch (e) { console.log('Sem assinatura por id:', e.message); }
    }
    if (!assinatura && kit.assinatura_id) {
      try {
        const sigs = await base44.entities.AssinaturaEletronica.filter({ id: kit.assinatura_id }, '-created_date', 1);
        assinatura = sigs[0];
      } catch (e) { console.log('Sem assinatura kit:', e.message); }
    }

    // ── MONTAR PDF ──
    const doc = new jsPDF({ format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const gold = [200, 169, 106];
    const black = [20, 20, 20];
    const gray = [120, 120, 120];
    const darkBg = [13, 17, 25];
    const green = [34, 197, 94];
    const white = [255, 255, 255];

    const clinicaNome = s(clinica?.clinic_name || kit.clinic_name, 'Clínica Dra. Paloma Betoni');
    const clinicaCNPJ = s(clinica?.cnpj, '');
    const profissional = s(clinica?.professional_name, 'Dra. Paloma Betoni');
    const registro = s(clinica?.professional_registry, '');
    const now = new Date();
    const codigoKit = `KIT-${kit.id?.substring(0,8).toUpperCase() || 'XXXXX'}`;

    function addPageHeader(pageNum) {
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setTextColor(...gold);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(clinicaNome.toUpperCase(), 15, 12);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Kit Documental — ${codigoKit}`, pageWidth - 15, 12, { align: 'right' });
    }

    function addSection(title, y) {
      if (y > pageHeight - 40) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.4);
      doc.line(15, y, pageWidth - 15, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gold);
      doc.text(title.toUpperCase(), 15, y);
      y += 8;
      return y;
    }

    function addText(text, y, fontSize = 9, isBold = false, color = black) {
      if (!text) return y;
      if (y > pageHeight - 30) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, pageWidth - 30);
      // check page breaks mid-text
      for (const line of lines) {
        if (y > pageHeight - 20) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
        doc.text(line, 15, y);
        y += 5.5;
      }
      return y + 2;
    }

    function addField(label, value, y) {
      if (y > pageHeight - 20) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gray);
      doc.text(`${label}:`, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      const lines = doc.splitTextToSize(s(value), pageWidth - 75);
      doc.text(lines, 60, y);
      return y + Math.max(6, lines.length * 5.5);
    }

    // ══════════════════════════════════════════
    // CAPA
    // ══════════════════════════════════════════
    addPageHeader(1);
    doc.setFillColor(...darkBg);
    doc.rect(0, 18, pageWidth, 80, 'F');

    doc.setTextColor(...gold);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('KIT DOCUMENTAL', pageWidth / 2, 50, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text(s(kit.procedimento_nome, 'Procedimento'), pageWidth / 2, 62, { align: 'center' });

    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(60, 68, pageWidth - 60, 68);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Paciente: ${s(patient?.full_name || kit.patient_name)}`, pageWidth / 2, 76, { align: 'center' });
    doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, pageWidth / 2, 83, { align: 'center' });
    doc.text(`Código: ${codigoKit}`, pageWidth / 2, 90, { align: 'center' });

    // Bloco de status
    const statusColor = assinatura ? green : [245, 158, 11];
    doc.setFillColor(...statusColor);
    const statusLabel = assinatura ? 'DOCUMENTO ASSINADO ELETRONICAMENTE' : 'AGUARDANDO ASSINATURA';
    const sw = doc.getTextWidth(statusLabel) + 20;
    doc.roundedRect((pageWidth - sw) / 2, 96, sw, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusLabel, pageWidth / 2, 102.5, { align: 'center' });

    let y = 115;

    // ══════════════════════════════════════════
    // SUMÁRIO
    // ══════════════════════════════════════════
    y = addSection('SUMÁRIO DO KIT DOCUMENTAL', y);
    const docsIncluidos = kit.documentos_incluidos || [];
    const sumarioItems = [
      'Seção 1 — Dados da Paciente',
      'Seção 2 — Dados da Clínica',
      'Seção 3 — Procedimento Contratado',
      'Seção 4 — Contrato Mestre',
      'Seção 5 — Termo LGPD',
      'Seção 6 — Autorização de Uso de Imagem',
      'Seção 7 — Consentimento do Procedimento',
      'Seção 8 — Anexo Financeiro',
      'Seção 9 — Documentos Anexados',
      'Seção 10 — Declarações Finais',
      'Seção 11 — Assinatura Única',
    ];
    sumarioItems.forEach((item, i) => {
      if (y > pageHeight - 15) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      doc.text(`${item}`, 20, y);
      y += 5.5;
    });
    y += 4;

    // ══════════════════════════════════════════
    // SEÇÃO 1 — DADOS DA PACIENTE
    // ══════════════════════════════════════════
    doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28;
    y = addSection('Seção 1 — Dados da Paciente', y);

    const addr = patient?.address;
    const endereco = addr ? `${s(addr.street)}, ${s(addr.number)}${addr.complement ? ', ' + addr.complement : ''} — ${s(addr.neighborhood)} — ${s(addr.city)}/${s(addr.state)} — CEP ${s(addr.zip_code)}` : '—';

    y = addField('Nome Completo', patient?.full_name || kit.patient_name, y);
    y = addField('CPF', patient?.document_number || '— Não informado', y);
    y = addField('RG', patient?.rg || '—', y);
    y = addField('Data de Nascimento', patient?.birth_date ? formatDate(patient.birth_date) : '—', y);
    y = addField('Telefone', patient?.phone || '—', y);
    y = addField('WhatsApp', patient?.whatsapp || '—', y);
    y = addField('E-mail', patient?.email || '—', y);
    y = addField('Endereço', endereco, y);
    if (patient?.responsavel_legal?.nome) {
      y += 4;
      y = addText('Responsável Legal:', y, 8, true, gray);
      y = addField('Nome', patient.responsavel_legal.nome, y);
      y = addField('CPF', patient.responsavel_legal.cpf || '—', y);
      y = addField('Parentesco', patient.responsavel_legal.parentesco || '—', y);
    }

    // ══════════════════════════════════════════
    // SEÇÃO 2 — DADOS DA CLÍNICA
    // ══════════════════════════════════════════
    y = addSection('Seção 2 — Dados da Clínica', y);
    y = addField('Clínica', clinicaNome, y);
    y = addField('Razão Social', s(clinica?.legal_name), y);
    y = addField('CNPJ/CPF', clinicaCNPJ || s(clinica?.cpf), y);
    const clinAddr = clinica?.address;
    if (clinAddr) {
      y = addField('Endereço', `${s(clinAddr.street)}, ${s(clinAddr.number)} — ${s(clinAddr.city)}/${s(clinAddr.state)}`, y);
    }
    y = addField('Telefone', s(clinica?.phone), y);
    y = addField('E-mail', s(clinica?.email), y);
    y = addField('Profissional Responsável', profissional, y);
    y = addField('Registro Profissional', registro, y);
    y = addField('Especialidade', s(clinica?.especialidade), y);

    // ══════════════════════════════════════════
    // SEÇÃO 3 — PROCEDIMENTO CONTRATADO
    // ══════════════════════════════════════════
    y = addSection('Seção 3 — Procedimento Contratado', y);
    y = addField('Procedimento', s(kit.procedimento_nome), y);
    if (kit.protocolo_nome) y = addField('Protocolo', s(kit.protocolo_nome), y);
    if (kit.tecnicas_full_face?.length > 0) {
      y = addField('Técnicas Incluídas', kit.tecnicas_full_face.join(', '), y);
    }
    y = addField('Tipo de Kit', s(kit.kit_tipo), y);
    y = addField('Profissional', profissional, y);
    y = addField('Data de Geração', formatDate(kit.data_geracao || now.toISOString()), y);
    if (kit.observacoes) y = addField('Observações', kit.observacoes, y);

    // ══════════════════════════════════════════
    // SEÇÃO 4 — CONTRATO MESTRE
    // ══════════════════════════════════════════
    doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28;
    y = addSection('Seção 4 — Contrato Mestre', y);
    y = addText(CONTRATO_MESTRE, y, 8.5);

    // ══════════════════════════════════════════
    // SEÇÃO 5 — LGPD
    // ══════════════════════════════════════════
    if (y > pageHeight - 60) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
    y = addSection('Seção 5 — Proteção de Dados (LGPD)', y);
    y = addText(LGPD_TEXTO, y, 8.5);

    // ══════════════════════════════════════════
    // SEÇÃO 6 — USO DE IMAGEM
    // ══════════════════════════════════════════
    if (y > pageHeight - 60) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
    y = addSection('Seção 6 — Autorização de Uso de Imagem', y);
    y = addText(USO_IMAGEM_TEXTO, y, 8.5);
    const consentImagem = patient?.consent_images;
    y = addText(`Status da autorização: ${consentImagem ? '✓ Autorizado' : '✗ Não autorizado / A definir na assinatura'}`, y, 8.5, true);

    // ══════════════════════════════════════════
    // SEÇÃO 7 — CONSENTIMENTO DO PROCEDIMENTO
    // ══════════════════════════════════════════
    doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28;

    const categorias = kit.tecnicas_full_face?.length > 0
      ? kit.tecnicas_full_face
      : [kit.categoria || 'outro'];

    for (const cat of categorias) {
      const texto = CONSENTIMENTOS_TEXTO[cat] || CONSENTIMENTOS_TEXTO[kit.categoria] || `TERMO DE CONSENTIMENTO — ${(kit.procedimento_nome || 'Procedimento').toUpperCase()}\n\nA paciente declara estar ciente dos procedimentos contratados, seus riscos, limitações e alternativas. O profissional forneceu todas as informações necessárias. A paciente confirma ter compreendido e autoriza a realização dos procedimentos.`;
      const titulo = `Seção 7 — Consentimento: ${kit.procedimento_nome || 'Procedimento'}`;
      if (y > pageHeight - 60) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
      y = addSection(titulo, y);
      y = addText(texto, y, 8.5);
    }

    // ══════════════════════════════════════════
    // SEÇÃO 8 — ANEXO FINANCEIRO
    // ══════════════════════════════════════════
    if (y > pageHeight - 60) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
    y = addSection('Seção 8 — Anexo Financeiro', y);

    if (financeiro) {
      y = addField('Procedimento', s(financeiro.procedimento), y);
      y = addField('Valor Total', formatCurrency(financeiro.valor_total), y);
      y = addField('Entrada', formatCurrency(financeiro.entrada), y);
      const saldo = (financeiro.valor_total || 0) - (financeiro.entrada || 0);
      y = addField('Saldo Restante', formatCurrency(saldo), y);
      y = addField('Parcelas', s(financeiro.num_parcelas, '1'), y);
      y = addField('Forma de Pagamento', s(financeiro.forma_pagamento), y);
      y = addField('Vencimento', financeiro.data_vencimento ? formatDate(financeiro.data_vencimento) : '—', y);
      y = addField('Status Financeiro', s(financeiro.status_financeiro), y);
      if (financeiro.observacoes) y = addField('Observações', financeiro.observacoes, y);
    } else {
      y = addText('Dados financeiros não informados no momento da geração do Kit. O valor será acordado separadamente.', y, 8.5, false, [245, 158, 11]);
    }

    // ══════════════════════════════════════════
    // SEÇÃO 9 — DOCUMENTOS ANEXADOS
    // ══════════════════════════════════════════
    if (y > pageHeight - 40) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
    y = addSection('Seção 9 — Documentos Anexados', y);

    const docsRef = docsIncluidos.filter(d =>
      ['documento_identificacao','comprovante_pagamento'].includes(d.tipo)
    );
    if (docsRef.length === 0) {
      y = addText('Nenhum documento de identificação ou comprovante de pagamento anexado no momento da geração.', y, 8.5, false, gray);
    } else {
      for (const d of docsRef) {
        y = addField(d.nome, d.status === 'anexado_no_kit' ? '✓ Documento anexado' : 'Pendente de anexo', y);
      }
    }

    // ══════════════════════════════════════════
    // SEÇÃO 10 — DECLARAÇÕES FINAIS
    // ══════════════════════════════════════════
    if (y > pageHeight - 60) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
    y = addSection('Seção 10 — Declarações Finais', y);

    const declaracaoFinal = `A paciente declara que:

1. Leu, compreendeu e aceitou integralmente todas as seções deste Kit Documental, incluindo Contrato Mestre, Termo LGPD, Autorização de Uso de Imagem, Consentimento do Procedimento e Condições Financeiras.

2. Recebeu explicações verbais e escritas sobre os procedimentos, seus riscos, benefícios, alternativas e limitações.

3. Teve oportunidade de fazer perguntas, que foram respondidas de forma satisfatória.

4. Está em plenas capacidades de compreensão e decisão, ou está acompanhada de responsável legal devidamente identificado.

5. Autoriza a realização dos procedimentos descritos neste Kit Documental.

6. Está ciente de que pode revogar este consentimento a qualquer momento antes da realização dos procedimentos, mediante comunicação expressa à Clínica.`;

    y = addText(declaracaoFinal, y, 8.5);

    // ══════════════════════════════════════════
    // SEÇÃO 11 — ASSINATURA ÚNICA
    // ══════════════════════════════════════════
    if (y > pageHeight - 120) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
    y = addSection('Seção 11 — Assinatura Única do Kit Documental', y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...gray);
    doc.text('Esta assinatura valida integralmente todo o Kit Documental, incluindo todas as seções acima.', 15, y);
    y += 8;

    if (assinatura) {
      // Badge verde
      doc.setFillColor(...green);
      const badgeW = 130;
      doc.roundedRect(15, y - 4, badgeW, 10, 2, 2, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ KIT DOCUMENTAL ASSINADO ELETRONICAMENTE', 15 + badgeW / 2, y + 2, { align: 'center' });
      y += 16;

      const dataAssinatura = assinatura.data_assinatura ? new Date(assinatura.data_assinatura) : now;
      const dataFmt = dataAssinatura.toLocaleDateString('pt-BR');
      const horaFmt = dataAssinatura.toLocaleTimeString('pt-BR');

      y = addText(`Assinado eletronicamente por ${s(assinatura.assinante_nome)}, CPF ${s(assinatura.assinante_cpf)}, em ${dataFmt} às ${horaFmt}, mediante aceite digital registrado na plataforma ${clinicaNome}.`, y, 8.5);

      y = addField('Nome do Assinante', assinatura.assinante_nome, y);
      y = addField('CPF', assinatura.assinante_cpf, y);
      y = addField('Tipo', assinatura.assinante_tipo === 'responsavel_legal' ? 'Responsável Legal' : 'Paciente', y);
      y = addField('Data da Assinatura', dataFmt, y);
      y = addField('Hora', horaFmt, y);
      y = addField('Hash / Identificador', s(assinatura.documento_hash), y);
      y = addField('Método', 'Assinatura Digital Presencial (Canvas)', y);
      y = addField('Responsável Admin', s(assinatura.usuario_responsavel_nome), y);
      y = addField('Declarou Leitura', assinatura.declarou_leitura ? 'Sim' : 'Não', y);
      y = addField('Concordou com os Termos', assinatura.concordou_termos ? 'Sim' : 'Não', y);
      y += 6;

      // Imagem da assinatura
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gold);
      doc.text('ASSINATURA MANUSCRITA:', 15, y);
      y += 6;

      const sigUrl = assinatura.assinatura_data_url;
      const isExternalUrl = typeof sigUrl === 'string' && (sigUrl.startsWith('http://') || sigUrl.startsWith('https://'));
      let imagemCarregada = false;

      if (isExternalUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const imgResponse = await fetch(sigUrl, { signal: controller.signal });
          clearTimeout(timeout);
          if (imgResponse.ok) {
            const imgBuffer = await imgResponse.arrayBuffer();
            if (imgBuffer.byteLength < 2 * 1024 * 1024) {
              const base64str = arrayBufferToBase64(imgBuffer);
              const contentType = imgResponse.headers.get('content-type') || 'image/png';
              const imgData = `data:${contentType};base64,${base64str}`;
              if (y > pageHeight - 50) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
              doc.addImage(imgData, 'PNG', 15, y, 100, 30);
              y += 34;
              imagemCarregada = true;
            }
          }
        } catch (e) { console.error('Erro imagem assinatura:', e.message); }
      }

      if (!imagemCarregada) {
        if (y > pageHeight - 30) { doc.addPage(); addPageHeader(doc.internal.getNumberOfPages()); y = 28; }
        doc.setTextColor(...gray);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('[ Assinatura eletrônica registrada — imagem não disponível neste relatório ]', 15, y + 6);
        y += 14;
      }

      // Linha
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(15, y + 1, 135, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...gray);
      doc.text(`${s(assinatura.assinante_nome)} — CPF ${s(assinatura.assinante_cpf)} — ${dataFmt}`, 15, y + 7);
      y += 14;

    } else {
      // Linha em branco para assinatura física
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(15, y, pageWidth - 30, 35, 2, 2, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, pageWidth - 30, 35, 2, 2, 'S');
      y += 39;
      doc.setDrawColor(...black);
      doc.line(15, y, 135, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text('Assinatura da Paciente — AGUARDANDO', 15, y + 7);
      y += 14;
    }

    // ══════════════════════════════════════════
    // RODAPÉ EM TODAS AS PÁGINAS
    // ══════════════════════════════════════════
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(6.5);
      doc.setTextColor(...gray);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `${clinicaNome} — Kit Documental ${codigoKit} — Gerado em ${now.toLocaleString('pt-BR')} — Página ${p}/${totalPages}`,
        pageWidth / 2, pageHeight - 8, { align: 'center' }
      );
      if (assinatura?.documento_hash) {
        doc.text(`Hash: ${assinatura.documento_hash}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
      }
    }

    const pdfBytes = doc.output('arraybuffer');
    const nomeArquivo = `KitDocumental_${s(kit.procedimento_nome || 'Procedimento').replace(/\s+/g, '_')}_${s(patient?.full_name || 'Paciente').replace(/\s+/g, '_')}_${assinatura ? 'Assinado' : 'Pendente'}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar kit:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});