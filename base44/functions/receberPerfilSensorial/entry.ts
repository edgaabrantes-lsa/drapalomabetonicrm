import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-SensorlyFlow-Secret, X-SensorFlow-Secret, X-Submission-ID',
};

Deno.serve(async (req) => {
  const log = { timestamp: new Date().toISOString(), method: req.method, url: req.url, steps: [] };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // ── AUTH: aceita header X-SensorlyFlow-Secret, X-SensorFlow-Secret, Authorization, ou query param api_key ──
    // Tenta CRM_WEBHOOK_SECRET primeiro, fallback para SENSORFLOW_API_KEY
    const expectedKey = Deno.env.get('CRM_WEBHOOK_SECRET') || Deno.env.get('SENSORFLOW_API_KEY');
    const url = new URL(req.url);
    const receivedKey =
      req.headers.get('X-SensorlyFlow-Secret') ||
      req.headers.get('X-SensorFlow-Secret') ||
      req.headers.get('x-sensorlyflow-secret') ||
      req.headers.get('x-sensorflow-secret') ||
      req.headers.get('Authorization')?.replace('Bearer ', '') ||
      url.searchParams.get('api_key');

    // Capturar headers para log (sem expor a chave)
    log.headers_received = {
      'content-type': req.headers.get('content-type'),
      'x-sensorlyflow-secret': receivedKey ? '***presente***' : 'AUSENTE',
      'x-submission-id': req.headers.get('X-Submission-ID'),
    };

    // Debug: verificar quais variáveis estão disponíveis
    const crmSecret = Deno.env.get('CRM_WEBHOOK_SECRET');
    const sensorSecret = Deno.env.get('SENSORFLOW_API_KEY');
    log.env_vars_available = {
      CRM_WEBHOOK_SECRET: crmSecret ? 'presente (***' + crmSecret.slice(-4) + ')' : 'AUSENTE',
      SENSORFLOW_API_KEY: sensorSecret ? 'presente (***' + sensorSecret.slice(-4) + ')' : 'AUSENTE',
    };

    if (!expectedKey) {
      log.steps.push('ERRO: CRM_WEBHOOK_SECRET e SENSORFLOW_API_KEY não configuradas');
      console.error('[SENSORFLOW] ERRO CRÍTICO: variáveis de ambiente não definidas', JSON.stringify(log));
      return Response.json({ error: 'Server configuration error', log }, { status: 500, headers: CORS_HEADERS });
    }

    if (!receivedKey) {
      log.steps.push('AUTH: chave ausente → 401');
      console.warn('[SENSORFLOW] 401 - Chave ausente', JSON.stringify(log));
      return Response.json({ error: 'Unauthorized: missing X-SensorlyFlow-Secret header', log }, { status: 401, headers: CORS_HEADERS });
    }

    if (receivedKey !== expectedKey) {
      log.steps.push(`AUTH: chave inválida → 401`);
      console.warn('[SENSORFLOW] 401 - Chave inválida', JSON.stringify(log));
      return Response.json({ error: 'Unauthorized: invalid key', log }, { status: 401, headers: CORS_HEADERS });
    }

    log.steps.push('AUTH: ok');

    // ── PARSE BODY ──
    let body;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      const text = await req.text();
      try { body = JSON.parse(text); } catch { body = {}; }
    }

    log.payload_received = body;
    log.steps.push('BODY: parseado com sucesso');

    // ── VALIDAÇÃO MÍNIMA ──
    const nome      = body.client_name     || body.nome     || body.name     || body.full_name     || body.paciente?.nome_completo || '';
    const cpf       = body.client_cpf      || body.cpf      || body.document_number || body.paciente?.cpf || '';
    const telefone  = body.client_phone    || body.telefone || body.phone    || body.whatsapp      || body.paciente?.telefone || body.paciente?.telefone_whatsapp || '';
    const email     = body.client_email    || body.email    || body.paciente?.email || '';
    const nascimento= body.client_birthdate|| body.data_nascimento || body.birthdate || body.birth_date || '';
    const cidade    = body.cidade          || body.city     || body.paciente?.cidade || '';
    const interesse = body.interesse       || body.procedimento_interesse || body.interest || body.paciente?.interesse || '';

    if (!nome && !telefone && !email) {
      log.steps.push('VALIDAÇÃO: payload inválido - nome, telefone e email ausentes');
      console.warn('[SENSORFLOW] 400 - Payload sem dados de identificação', JSON.stringify(log));
      return Response.json({ error: 'Bad Request: payload must contain at least name, phone or email', log }, { status: 400, headers: CORS_HEADERS });
    }

    log.steps.push(`IDENTIFICAÇÃO: nome="${nome}" tel="${telefone}" email="${email}"`);

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const cleanPhone = (p) => p ? String(p).replace(/\D/g, '') : '';
    const cleanCpf   = (c) => c ? String(c).replace(/\D/g, '') : '';
    const telClean   = cleanPhone(telefone);

    // ── BUSCA DE PACIENTE EXISTENTE ──
    let existing = [];

    // 1. Por CPF
    if (cpf && cleanCpf(cpf).length >= 11) {
      const r1 = await svc.entities.Patient.filter({ document_number: cpf });
      const r2 = r1.length === 0 ? await svc.entities.Patient.filter({ document_number: cleanCpf(cpf) }) : r1;
      existing = r2;
      if (existing.length > 0) log.steps.push(`BUSCA: encontrado por CPF`);
    }

    // 2. Por e-mail
    if (existing.length === 0 && email) {
      existing = await svc.entities.Patient.filter({ email });
      if (existing.length > 0) log.steps.push(`BUSCA: encontrado por email`);
    }

    // 3. Por telefone (formato original e normalizado)
    if (existing.length === 0 && telefone) {
      const byPhone1 = await svc.entities.Patient.filter({ phone: telefone });
      const byPhone2 = byPhone1.length === 0 && telClean ? await svc.entities.Patient.filter({ phone: telClean }) : byPhone1;
      const byWa1    = byPhone2.length === 0 ? await svc.entities.Patient.filter({ whatsapp: telefone }) : byPhone2;
      const byWa2    = byWa1.length === 0 && telClean ? await svc.entities.Patient.filter({ whatsapp: telClean }) : byWa1;
      existing = byWa2;
      if (existing.length > 0) log.steps.push(`BUSCA: encontrado por telefone`);
    }

    let patientId;
    let isNew = false;

    if (existing.length > 0) {
      patientId = existing[0].id;
      log.steps.push(`PACIENTE: existente ID=${patientId} nome="${existing[0].full_name}"`);

      // Atualizar campos vazios
      const updates = {};
      if (nome      && !existing[0].full_name)        updates.full_name       = nome;
      if (telefone  && !existing[0].phone)             updates.phone           = telefone;
      if (email     && !existing[0].email)             updates.email           = email;
      if (nascimento&& !existing[0].birth_date)        updates.birth_date      = nascimento;
      if (cpf       && !existing[0].document_number)  updates.document_number = cpf;
      if (interesse && !existing[0].interest)          updates.interest        = interesse;
      if (cidade    && !existing[0].address?.city)     updates.address        = { ...(existing[0].address || {}), city: cidade };
      if (Object.keys(updates).length > 0) {
        await svc.entities.Patient.update(patientId, updates);
        log.steps.push(`PACIENTE: atualizado campos=${Object.keys(updates).join(',')}`);
      } else {
        log.steps.push('PACIENTE: nenhum campo novo para atualizar');
      }
    } else {
      // Criar novo paciente
      isNew = true;
      const novoPatient = {
        full_name:       nome || `Lead SensorFlow ${new Date().toLocaleDateString('pt-BR')}`,
        phone:           telefone || '',
        email:           email || '',
        birth_date:      nascimento || '',
        document_number: cpf || '',
        source:          'other',
        dossie_status:   'lead',
        interest:        interesse || '',
        tags:            ['SensorFlow'],
        notes:           `Cadastrado automaticamente via SensorlyFlow em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      };
      if (cidade) novoPatient.address = { city: cidade };
      const created = await svc.entities.Patient.create(novoPatient);
      patientId = created.id;
      log.steps.push(`PACIENTE: criado ID=${patientId}`);
    }

    // ── PERFIL SENSORIAL ──
    // Campos extras além dos mapeados são salvos no hospitality_summary
    const camposMapeados = new Set([
      'client_name','nome','patient_name','name','full_name',
      'client_cpf','cpf','document_number','paciente',
      'client_phone','telefone','phone','whatsapp',
      'client_email','email',
      'client_birthdate','data_nascimento','birthdate','birth_date',
      'cidade','city','interesse','procedimento_interesse','interest',
      'submission_id','form_source','url_origem','dispositivo','navegador','crm_status',
      'appointment_periods','beverage_preferences','food_preferences','dietary_restrictions',
      'environment_preferences','temperature_preference','likes_aromas','aroma_preferences',
      'service_style','hospitality_summary','lgpd_consent','lgpd_consent_date','lgpd_consent_version',
    ]);

    const camposExtras = {};
    for (const [key, val] of Object.entries(body)) {
      if (!camposMapeados.has(key) && val !== null && val !== undefined && val !== '') {
        camposExtras[key] = val;
      }
    }

    const extrasSummary = Object.keys(camposExtras).length > 0
      ? '\n\nDados adicionais: ' + Object.entries(camposExtras).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      : '';

    const perfilData = {
      patient_id:              patientId,
      patient_name:            nome || existing?.[0]?.full_name || '',
      submission_id:           body.submission_id || req.headers.get('X-Submission-ID') || crypto.randomUUID(),
      appointment_periods:     toArray(body.appointment_periods),
      beverage_preferences:    toArray(body.beverage_preferences),
      food_preferences:        toArray(body.food_preferences),
      dietary_restrictions:    toArray(body.dietary_restrictions),
      environment_preferences: toArray(body.environment_preferences),
      temperature_preference:  body.temperature_preference || '',
      likes_aromas:            body.likes_aromas === true || body.likes_aromas === 'true',
      aroma_preferences:       toArray(body.aroma_preferences),
      service_style:           body.service_style || '',
      hospitality_summary:     (body.hospitality_summary || '') + extrasSummary,
      lgpd_consent:            body.lgpd_consent === true || body.lgpd_consent === 'true',
      lgpd_consent_date:       body.lgpd_consent_date || new Date().toISOString(),
      lgpd_consent_version:    body.lgpd_consent_version || '',
      form_source:             body.form_source || 'SensorlyFlow',
      url_origem:              body.url_origem || '',
      dispositivo:             body.dispositivo || '',
      navegador:               body.navegador || '',
      crm_status:              isNew ? 'novo_lead' : 'atualizado',
    };

    const existingPerfil = await svc.entities.PerfilSensorial.filter({ patient_id: patientId });
    if (existingPerfil.length > 0) {
      await svc.entities.PerfilSensorial.update(existingPerfil[0].id, perfilData);
      log.steps.push(`PERFIL_SENSORIAL: atualizado ID=${existingPerfil[0].id}`);
    } else {
      const criado = await svc.entities.PerfilSensorial.create(perfilData);
      log.steps.push(`PERFIL_SENSORIAL: criado ID=${criado.id}`);
    }

    log.steps.push('SUCESSO');
    const responseBody = {
      success: true,
      patient_id: patientId,
      patient_name: nome || existing?.[0]?.full_name,
      action: isNew ? 'patient_created' : 'patient_updated',
      perfil_sensorial: existingPerfil?.length > 0 ? 'updated' : 'created',
      log,
    };

    console.log('[SENSORFLOW] Sucesso:', JSON.stringify(responseBody));
    return Response.json(responseBody, { status: isNew ? 201 : 200, headers: CORS_HEADERS });

  } catch (error) {
    log.steps.push(`ERRO: ${error.message}`);
    log.error_stack = error.stack;
    console.error('[SENSORFLOW] Erro interno:', error.message, JSON.stringify(log));
    return Response.json({ error: error.message, log }, { status: 500, headers: CORS_HEADERS });
  }
});

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [String(val)];
}