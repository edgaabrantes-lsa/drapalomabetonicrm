import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-SensorlyFlow-Secret, X-Submission-ID',
      },
    });
  }

  try {
    // Segurança: verificar API key
    const expectedKey = Deno.env.get('SENSORFLOW_API_KEY');
    const receivedKey = req.headers.get('X-SensorlyFlow-Secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!receivedKey || receivedKey !== expectedKey) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json();

    // ── Extração de campos de identificação (aceita múltiplos formatos) ──
    const nome      = body.client_name     || body.nome     || body.paciente?.nome_completo || body.patient_name || body.name || '';
    const cpf       = body.client_cpf      || body.cpf      || body.paciente?.cpf           || body.document_number || '';
    const telefone  = body.client_phone    || body.telefone || body.paciente?.telefone_whatsapp || body.phone || body.whatsapp || '';
    const email     = body.client_email    || body.email    || body.paciente?.email          || '';
    const nascimento= body.client_birthdate|| body.data_nascimento || body.birthdate || body.birth_date || '';
    const cidade    = body.cidade          || body.city     || body.paciente?.cidade         || '';
    const interesse = body.interesse       || body.procedimento_interesse || body.interest   || '';

    // ── 1. Buscar paciente existente: CPF → email → telefone ──
    let existing = [];
    let patientId = null;
    let isNew = false;

    const cleanPhone = (p) => p ? p.replace(/\D/g, '') : '';
    const cleanCpf   = (c) => c ? c.replace(/\D/g, '') : '';

    if (cpf && cleanCpf(cpf).length >= 11) {
      existing = await svc.entities.Patient.filter({ document_number: cpf });
      // Tenta também sem formatação
      if (existing.length === 0) {
        existing = await svc.entities.Patient.filter({ document_number: cleanCpf(cpf) });
      }
    }

    if (existing.length === 0 && email) {
      existing = await svc.entities.Patient.filter({ email });
    }

    if (existing.length === 0 && telefone) {
      const tel = cleanPhone(telefone);
      // Busca por telefone ou whatsapp
      const byPhone = await svc.entities.Patient.filter({ phone: telefone });
      if (byPhone.length > 0) {
        existing = byPhone;
      } else {
        const byWa = await svc.entities.Patient.filter({ whatsapp: telefone });
        if (byWa.length > 0) existing = byWa;
      }
    }

    if (existing.length > 0) {
      // ── Paciente já existe: atualizar apenas campos não preenchidos ──
      patientId = existing[0].id;
      const updates = {};
      if (nome     && !existing[0].full_name)       updates.full_name       = nome;
      if (telefone && !existing[0].phone)            updates.phone           = telefone;
      if (email    && !existing[0].email)            updates.email           = email;
      if (nascimento && !existing[0].birth_date)     updates.birth_date      = nascimento;
      if (cidade   && !existing[0].address?.city)   updates.address         = { ...(existing[0].address || {}), city: cidade };
      if (interesse && !existing[0].interest)        updates.interest        = interesse;
      if (Object.keys(updates).length > 0) {
        await svc.entities.Patient.update(patientId, updates);
      }
    } else {
      // ── Paciente novo: criar com todos os dados disponíveis ──
      isNew = true;
      const novoPatient = {
        full_name:       nome || 'Paciente SensorFlow',
        phone:           telefone,
        email:           email,
        birth_date:      nascimento,
        document_number: cpf,
        source:          'other',
        dossie_status:   'lead',
        interest:        interesse,
        notes:           `Cadastrado automaticamente via SensorlyFlow em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      };
      if (cidade) novoPatient.address = { city: cidade };
      const created = await svc.entities.Patient.create(novoPatient);
      patientId = created.id;
    }

    // ── 2. Montar e salvar Perfil Sensorial ──
    // Captura campos extras/livres que o SensorFlow possa enviar além dos mapeados
    const camposMapeados = new Set([
      'client_name','nome','patient_name','name','client_cpf','cpf','document_number',
      'client_phone','telefone','phone','whatsapp','client_email','email',
      'client_birthdate','data_nascimento','birthdate','birth_date','cidade','city',
      'interesse','procedimento_interesse','interest',
      'submission_id','form_source','url_origem','dispositivo','navegador','crm_status',
      'appointment_periods','beverage_preferences','food_preferences','dietary_restrictions',
      'environment_preferences','temperature_preference','likes_aromas','aroma_preferences',
      'service_style','hospitality_summary','lgpd_consent','lgpd_consent_date','lgpd_consent_version',
      'paciente',
    ]);

    const camposExtras = {};
    for (const [key, val] of Object.entries(body)) {
      if (!camposMapeados.has(key) && val !== null && val !== undefined && val !== '') {
        camposExtras[key] = val;
      }
    }

    const perfilData = {
      patient_id:            patientId,
      patient_name:          nome,
      submission_id:         body.submission_id || req.headers.get('X-Submission-ID') || crypto.randomUUID(),
      appointment_periods:   toArray(body.appointment_periods),
      beverage_preferences:  toArray(body.beverage_preferences),
      food_preferences:      toArray(body.food_preferences),
      dietary_restrictions:  toArray(body.dietary_restrictions),
      environment_preferences: toArray(body.environment_preferences),
      temperature_preference:body.temperature_preference || '',
      likes_aromas:          body.likes_aromas === true || body.likes_aromas === 'true',
      aroma_preferences:     toArray(body.aroma_preferences),
      service_style:         body.service_style || '',
      hospitality_summary:   body.hospitality_summary || '',
      lgpd_consent:          body.lgpd_consent === true || body.lgpd_consent === 'true',
      lgpd_consent_date:     body.lgpd_consent_date || new Date().toISOString(),
      lgpd_consent_version:  body.lgpd_consent_version || '',
      form_source:           body.form_source || 'SensorlyFlow',
      url_origem:            body.url_origem || '',
      dispositivo:           body.dispositivo || '',
      navegador:             body.navegador || '',
      crm_status:            isNew ? 'novo_lead' : 'atualizado',
    };

    // Armazena campos extras no hospitality_summary se não houver resumo
    if (Object.keys(camposExtras).length > 0 && !perfilData.hospitality_summary) {
      perfilData.hospitality_summary = 'Dados adicionais: ' + Object.entries(camposExtras)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
    }

    // Upsert do perfil sensorial
    const existingPerfil = await svc.entities.PerfilSensorial.filter({ patient_id: patientId });
    if (existingPerfil.length > 0) {
      await svc.entities.PerfilSensorial.update(existingPerfil[0].id, perfilData);
    } else {
      await svc.entities.PerfilSensorial.create(perfilData);
    }

    return Response.json({
      success: true,
      patient_id: patientId,
      action: isNew ? 'patient_created' : 'patient_updated',
      perfil_sensorial: isNew ? 'created' : 'updated',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}