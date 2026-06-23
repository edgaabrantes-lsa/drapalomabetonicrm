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
    // Validação de segurança: verificar API key do SensorlyFlow
    const expectedKey = Deno.env.get('SENSORFLOW_API_KEY');
    const receivedKey = req.headers.get('X-SensorlyFlow-Secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!receivedKey || receivedKey !== expectedKey) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json();

    // Campos de identificação
    const nome = body.client_name || body.paciente?.nome_completo || body.patient_name || '';
    const cpf = body.client_cpf || body.paciente?.cpf || body.cpf || '';
    const telefone = body.client_phone || body.paciente?.telefone_whatsapp || body.phone || '';
    const email = body.client_email || body.paciente?.email || body.email || '';
    const dataNascimento = body.client_birthdate || body.paciente?.data_nascimento || body.birthdate || '';

    // 1. Upsert do paciente
    let patientId = null;
    let existing = [];

    if (cpf) {
      existing = await svc.entities.Patient.filter({ document_number: cpf });
    }
    if (existing.length === 0 && email) {
      existing = await svc.entities.Patient.filter({ email });
    }

    if (existing.length > 0) {
      patientId = existing[0].id;
      const updates = {};
      if (nome) updates.full_name = nome;
      if (telefone) updates.phone = telefone;
      if (email) updates.email = email;
      if (dataNascimento) updates.birth_date = dataNascimento;
      await svc.entities.Patient.update(patientId, updates);
    } else {
      const created = await svc.entities.Patient.create({
        full_name: nome,
        document_number: cpf,
        phone: telefone,
        email,
        birth_date: dataNascimento,
        source: 'other',
        dossie_status: 'lead',
        notes: 'Cadastrado via SensorlyFlow',
      });
      patientId = created.id;
    }

    // 2. Salvar/atualizar perfil sensorial
    const perfilData = {
      patient_id: patientId,
      patient_name: nome,
      submission_id: body.submission_id || req.headers.get('X-Submission-ID') || '',
      appointment_periods: toArray(body.appointment_periods),
      beverage_preferences: toArray(body.beverage_preferences),
      food_preferences: toArray(body.food_preferences),
      dietary_restrictions: toArray(body.dietary_restrictions),
      environment_preferences: toArray(body.environment_preferences),
      temperature_preference: body.temperature_preference || '',
      likes_aromas: body.likes_aromas === true || body.likes_aromas === 'true',
      aroma_preferences: toArray(body.aroma_preferences),
      service_style: body.service_style || '',
      hospitality_summary: body.hospitality_summary || '',
      lgpd_consent: body.lgpd_consent === true || body.lgpd_consent === 'true',
      lgpd_consent_date: body.lgpd_consent_date || null,
      lgpd_consent_version: body.lgpd_consent_version || '',
      form_source: body.form_source || 'SensorlyFlow',
      url_origem: body.url_origem || '',
      dispositivo: body.dispositivo || '',
      navegador: body.navegador || '',
      crm_status: body.crm_status || '',
    };

    // Se já existe perfil para este paciente, atualiza; senão cria
    const existingPerfil = await svc.entities.PerfilSensorial.filter({ patient_id: patientId });
    if (existingPerfil.length > 0) {
      await svc.entities.PerfilSensorial.update(existingPerfil[0].id, perfilData);
    } else {
      await svc.entities.PerfilSensorial.create(perfilData);
    }

    return Response.json({ success: true, patient_id: patientId, action: existing.length > 0 ? 'updated' : 'created' });
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