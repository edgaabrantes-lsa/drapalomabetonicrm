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

function s(v, fb) {
  const fallback = fb !== undefined ? fb : '—';
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'string') return v.trim() || fallback;
  return String(v);
}

function check(label, condition, detail) {
  return { label, ok: !!condition, detail: detail || null };
}

Deno.serve(async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { kit_id, patient_id, mode } = body;

    if (!kit_id || !patient_id) {
      return Response.json({ error: 'kit_id e patient_id são obrigatórios' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // ── 1. KIT ──────────────────────────────────────────────────────────
    let kit = null;
    try {
      const kArr = await base44.entities.DossieKitDocumental.filter({ id: kit_id }, '-created_date', 1);
      kit = kArr[0] || null;
    } catch (e) { errors.push('Erro ao buscar kit: ' + e.message); }

    results.push(check('Kit encontrado', !!kit, kit ? `ID: ${kit.id} | Nome: ${kit.kit_nome || kit.procedimento_nome} | Status: ${kit.status}` : 'kit_id não encontrado'));
    if (!kit) {
      return Response.json({ results, errors, causa_raiz: 'Kit não encontrado para o kit_id fornecido.', abortado: true });
    }

    results.push(check('Kit tem procedimento_nome', !!(kit.procedimento_nome), kit.procedimento_nome || 'VAZIO'));
    results.push(check('Status do kit', !!kit.status, kit.status || 'VAZIO'));
    results.push(check('assinatura_status', !!kit.assinatura_status, kit.assinatura_status || 'VAZIO'));
    results.push(check('pdf_final_url existe', !!kit.pdf_final_url, kit.pdf_final_url ? kit.pdf_final_url.substring(0, 60) + '...' : 'AUSENTE'));
    results.push(check('pdf_url existe', !!kit.pdf_url, kit.pdf_url ? kit.pdf_url.substring(0, 60) + '...' : 'AUSENTE'));

    // ── 2. PACIENTE ──────────────────────────────────────────────────────
    let patient = null;
    try {
      const pArr = await base44.entities.Patient.filter({ id: patient_id }, '-created_date', 1);
      patient = pArr[0] || null;
    } catch (e) { errors.push('Erro ao buscar paciente: ' + e.message); }

    results.push(check('Paciente encontrado', !!patient, patient ? `Nome: ${patient.full_name} | CPF: ${patient.document_number || 'N/A'}` : 'patient_id não encontrado'));
    if (patient) {
      results.push(check('Paciente tem full_name', !!(patient.full_name?.trim()), patient.full_name || 'VAZIO'));
    }

    // ── 3. CLÍNICA ───────────────────────────────────────────────────────
    let clinica = null;
    try {
      const cArr = await base44.entities.ClinicSettings.list('-created_date', 1);
      clinica = cArr[0] || null;
    } catch (e) { errors.push('Erro ao buscar clínica: ' + e.message); }

    results.push(check('ClinicSettings encontrado', !!clinica, clinica ? `Nome: ${clinica.clinic_name}` : 'Nenhum registro de ClinicSettings'));

    // ── 4. FINANCEIRO ────────────────────────────────────────────────────
    let financeiro = null;
    try {
      if (kit.financeiro_id) {
        const fArr = await base44.entities.DossieFinanceiro.filter({ id: kit.financeiro_id }, '-created_date', 1);
        financeiro = fArr[0] || null;
      }
      if (!financeiro) {
        const fArr2 = await base44.entities.DossieFinanceiro.filter({ patient_id }, '-created_date', 5);
        financeiro = fArr2.find(f => f.procedimento === kit.procedimento_nome) || fArr2[0] || null;
      }
    } catch (e) { errors.push('Erro ao buscar financeiro: ' + e.message); }

    results.push(check('Financeiro encontrado', !!financeiro, financeiro ? `Proc: ${financeiro.procedimento} | Valor: ${financeiro.valor_total}` : 'Sem registro financeiro (não é bloqueante)'));

    // ── 5. ASSINATURA ────────────────────────────────────────────────────
    let assinatura = null;
    const sigId = kit.assinatura_id;
    try {
      if (sigId) {
        const sArr = await base44.entities.AssinaturaEletronica.filter({ id: sigId }, '-created_date', 1);
        assinatura = sArr[0] || null;
      }
    } catch (e) { errors.push('Erro ao buscar assinatura: ' + e.message); }

    results.push(check('assinatura_id no kit', !!sigId, sigId || 'AUSENTE — kit não tem assinatura_id'));
    results.push(check('Assinatura encontrada', !!assinatura, assinatura ? `Assinante: ${assinatura.assinante_nome} | CPF: ${assinatura.assinante_cpf}` : (sigId ? 'ID existe mas registro não encontrado' : 'Sem assinatura')));

    if (assinatura) {
      const sigUrl = assinatura.assinatura_data_url;
      results.push(check('assinatura_data_url existe', !!sigUrl, sigUrl ? `URL: ${sigUrl.substring(0, 80)}...` : 'AUSENTE — fallback texto será usado'));
      results.push(check('assinante_nome preenchido', !!(assinatura.assinante_nome?.trim()), assinatura.assinante_nome || 'VAZIO'));
      results.push(check('assinante_cpf preenchido', !!(assinatura.assinante_cpf?.trim()), assinatura.assinante_cpf || 'VAZIO'));
      results.push(check('documento_hash existe', !!(assinatura.documento_hash?.trim()), assinatura.documento_hash || 'AUSENTE'));

      // Testar fetch da imagem de assinatura
      if (sigUrl && typeof sigUrl === 'string' && sigUrl.startsWith('http')) {
        try {
          const ctrl = new AbortController();
          const tmr = setTimeout(() => ctrl.abort(), 5000);
          const imgResp = await fetch(sigUrl, { signal: ctrl.signal });
          clearTimeout(tmr);
          const imgBuf = await imgResp.arrayBuffer();
          results.push(check(
            'Imagem assinatura acessível',
            imgResp.ok && imgBuf.byteLength > 100,
            imgResp.ok ? `HTTP ${imgResp.status} | Tamanho: ${imgBuf.byteLength} bytes` : `HTTP ${imgResp.status} — inacessível`
          ));
        } catch (fetchErr) {
          results.push(check('Imagem assinatura acessível', false, `Fetch falhou: ${fetchErr.message} (não bloqueante)`));
        }
      }
    }

    // ── 6. TESTAR CONSTRUÇÃO DO PDF POR SEÇÃO ────────────────────────────
    const secoes_testadas = [];

    // Teste 1: PDF mínimo
    try {
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(12);
      d.text('Teste mínimo — ' + s(patient ? patient.full_name : kit.patient_name), 15, 30);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'PDF Mínimo (biblioteca)', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
      results.push(check('Biblioteca jsPDF funcional', bytes.byteLength > 500, `PDF mínimo: ${bytes.byteLength} bytes`));
    } catch (e) {
      secoes_testadas.push({ secao: 'PDF Mínimo (biblioteca)', ok: false, tamanho: 0, erro: e.message });
      results.push(check('Biblioteca jsPDF funcional', false, 'ERRO: ' + e.message));
      errors.push('jsPDF falhou no teste mínimo: ' + e.message);
    }

    // Teste 2: Seção paciente
    try {
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(10);
      d.text('Paciente: ' + s(patient ? patient.full_name : kit.patient_name), 15, 30);
      d.text('CPF: ' + s(patient ? patient.document_number : '—'), 15, 40);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'Seção Paciente', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
    } catch (e) {
      secoes_testadas.push({ secao: 'Seção Paciente', ok: false, tamanho: 0, erro: e.message });
      errors.push('Seção Paciente falhou: ' + e.message);
    }

    // Teste 3: Contrato Mestre
    try {
      const CONTRATO = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS\n\nPelo presente instrumento particular, as partes identificadas neste documento acordam os seguintes termos:\n1. OBJETO: Prestação de serviços de harmonização orofacial e estética conforme procedimento contratado.';
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(9);
      const lines = d.splitTextToSize(CONTRATO, 180);
      d.text(lines, 15, 20);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'Contrato Mestre', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
    } catch (e) {
      secoes_testadas.push({ secao: 'Contrato Mestre', ok: false, tamanho: 0, erro: e.message });
      errors.push('Contrato Mestre falhou: ' + e.message);
    }

    // Teste 4: LGPD
    try {
      const LGPD = 'TERMO DE CONSENTIMENTO — LGPD\nA Clínica coleta e trata dados pessoais para finalidades clínicas e administrativas.';
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(9);
      const lines = d.splitTextToSize(LGPD, 180);
      d.text(lines, 15, 20);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'LGPD', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
    } catch (e) {
      secoes_testadas.push({ secao: 'LGPD', ok: false, tamanho: 0, erro: e.message });
      errors.push('LGPD falhou: ' + e.message);
    }

    // Teste 5: Consentimento
    try {
      const cat = (kit.tecnicas_full_face && kit.tecnicas_full_face.length > 0) ? kit.tecnicas_full_face[0] : (kit.categoria || 'outro');
      const CONSENT_TEXTO = `TERMO DE CONSENTIMENTO — ${(kit.procedimento_nome || 'Procedimento').toUpperCase()}\n\nA paciente declara estar ciente dos procedimentos contratados. Categoria: ${cat}.`;
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(9);
      const lines = d.splitTextToSize(CONSENT_TEXTO, 180);
      d.text(lines, 15, 20);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'Consentimento (' + cat + ')', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
    } catch (e) {
      secoes_testadas.push({ secao: 'Consentimento', ok: false, tamanho: 0, erro: e.message });
      errors.push('Consentimento falhou: ' + e.message);
    }

    // Teste 6: Financeiro
    try {
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(9);
      d.text('Financeiro: ' + s(financeiro ? financeiro.procedimento : 'N/A'), 15, 20);
      d.text('Valor: ' + s(financeiro ? String(financeiro.valor_total) : '—'), 15, 30);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'Financeiro', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
    } catch (e) {
      secoes_testadas.push({ secao: 'Financeiro', ok: false, tamanho: 0, erro: e.message });
      errors.push('Financeiro falhou: ' + e.message);
    }

    // Teste 7: Assinatura (sem imagem)
    try {
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(9);
      const nome = assinatura ? assinatura.assinante_nome : 'Sem assinatura';
      const cpf = assinatura ? assinatura.assinante_cpf : '—';
      const hash = assinatura ? (assinatura.documento_hash || '—') : '—';
      d.text('Assinante: ' + s(nome), 15, 20);
      d.text('CPF: ' + s(cpf), 15, 30);
      d.text('Hash: ' + s(hash), 15, 40);
      const bytes = d.output('arraybuffer');
      secoes_testadas.push({ secao: 'Assinatura (sem imagem)', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
    } catch (e) {
      secoes_testadas.push({ secao: 'Assinatura (sem imagem)', ok: false, tamanho: 0, erro: e.message });
      errors.push('Seção Assinatura falhou: ' + e.message);
    }

    // Teste 8: Assinatura COM imagem (se disponível)
    if (assinatura && assinatura.assinatura_data_url && assinatura.assinatura_data_url.startsWith('http')) {
      try {
        const d = new jsPDF({ format: 'a4' });
        d.setFontSize(9);
        d.text('Assinante: ' + s(assinatura.assinante_nome), 15, 20);

        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 6000);
        const imgResp = await fetch(assinatura.assinatura_data_url, { signal: ctrl.signal });
        if (imgResp.ok) {
          const imgBuf = await imgResp.arrayBuffer();
          const b64 = arrayBufferToBase64(imgBuf);
          const ct = imgResp.headers.get('content-type') || 'image/png';
          const imgData = 'data:' + ct + ';base64,' + b64;
          d.addImage(imgData, 'PNG', 15, 30, 100, 30);
        }
        const bytes = d.output('arraybuffer');
        secoes_testadas.push({ secao: 'Assinatura (com imagem)', ok: bytes.byteLength > 500, tamanho: bytes.byteLength, erro: null });
      } catch (e) {
        secoes_testadas.push({ secao: 'Assinatura (com imagem)', ok: false, tamanho: 0, erro: e.message });
        errors.push('Seção Assinatura COM imagem falhou: ' + e.message + ' — pode ser CAUSA RAIZ do problema');
      }
    }

    // ── 7. TENTAR PDF DIAGNÓSTICO SIMPLES ────────────────────────────────
    let pdfDiagUrl = null;
    try {
      const d = new jsPDF({ format: 'a4' });
      d.setFontSize(14);
      d.text('PDF DIAGNÓSTICO', 15, 20);
      d.setFontSize(10);
      d.text('Paciente: ' + s(patient ? patient.full_name : kit.patient_name), 15, 35);
      d.text('Procedimento: ' + s(kit.procedimento_nome), 15, 45);
      d.text('Hash: ' + s(assinatura ? assinatura.documento_hash : 'Sem assinatura'), 15, 55);
      d.text('Assinante: ' + s(assinatura ? assinatura.assinante_nome : '—'), 15, 65);
      d.text('CPF: ' + s(assinatura ? assinatura.assinante_cpf : '—'), 15, 75);
      d.text('Data: ' + new Date().toLocaleString('pt-BR'), 15, 85);
      d.text('Status: ' + s(kit.status), 15, 95);
      d.text('Kit ID: ' + kit.id, 15, 105);

      const pdfBytes = d.output('arraybuffer');
      if (pdfBytes.byteLength > 500) {
        try {
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const upRes = await base44.integrations.Core.UploadFile({ file: blob });
          if (upRes && upRes.file_url) {
            pdfDiagUrl = upRes.file_url;
          }
        } catch (upErr) {
          errors.push('Upload PDF diagnóstico falhou: ' + upErr.message);
        }
      }
      results.push(check('PDF diagnóstico simples gerado', pdfBytes.byteLength > 500, `Tamanho: ${pdfBytes.byteLength} bytes${pdfDiagUrl ? ' | URL: ' + pdfDiagUrl.substring(0,60) : ' | Upload falhou'}`));
    } catch (diagErr) {
      results.push(check('PDF diagnóstico simples gerado', false, 'ERRO: ' + diagErr.message));
      errors.push('PDF diagnóstico falhou: ' + diagErr.message);
    }

    // ── 8. ANÁLISE DE CAUSA RAIZ ─────────────────────────────────────────
    let causa_raiz = null;

    const falhas = secoes_testadas.filter(s => !s.ok);
    const secoesComErroImagem = secoes_testadas.find(s => s.secao.includes('com imagem') && !s.ok);

    if (!kit.procedimento_nome?.trim()) {
      causa_raiz = 'Campo obrigatório ausente: procedimento_nome está vazio no kit.';
    } else if (secoes_testadas.find(s => s.secao === 'PDF Mínimo (biblioteca)' && !s.ok)) {
      causa_raiz = 'Erro crítico na biblioteca jsPDF — a biblioteca não está funcionando no servidor.';
    } else if (secoesComErroImagem) {
      causa_raiz = `Imagem da assinatura está quebrando o PDF. Erro: ${secoesComErroImagem.erro}. A assinatura_data_url pode conter dados inválidos ou o fetch está falhando.`;
    } else if (falhas.length > 0) {
      causa_raiz = `Seções com erro: ${falhas.map(f => f.secao + ' — ' + f.erro).join(' | ')}`;
    } else if (!kit.assinatura_id) {
      causa_raiz = 'Kit não tem assinatura_id vinculado. Execute a assinatura antes de gerar o PDF final.';
    } else if (!assinatura) {
      causa_raiz = `assinatura_id (${sigId}) existe no kit mas o registro AssinaturaEletronica não foi encontrado.`;
    } else if (!pdfDiagUrl && errors.some(e => e.includes('Upload'))) {
      causa_raiz = 'Upload para storage falhou — verifique permissões de integração. PDF pode ser gerado mas não salvo.';
    } else if (falhas.length === 0) {
      causa_raiz = 'Todas as seções individuais passaram. O problema pode estar na combinação das seções (multipage). Tente clicar em "Regerar PDF Final" no card do kit.';
    }

    return Response.json({
      success: true,
      kit_resumo: {
        id: kit.id,
        nome: kit.kit_nome || kit.procedimento_nome,
        status: kit.status,
        assinatura_status: kit.assinatura_status,
        tem_pdf_url: !!kit.pdf_url,
        tem_pdf_final_url: !!kit.pdf_final_url,
        assinatura_id: kit.assinatura_id || null,
      },
      results,
      secoes_testadas,
      errors,
      causa_raiz,
      pdf_diagnostico_url: pdfDiagUrl,
    });

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.substring(0, 500) }, { status: 500 });
  }
});