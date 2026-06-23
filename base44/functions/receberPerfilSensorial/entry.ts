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
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json();

    const nome = body.paciente?.nome_completo || body.patient_name || '';
    const cpf = body.paciente?.cpf || body.cpf || '';
    const telefone = body.paciente?.telefone_whatsapp || body.paciente?.phone || body.phone || '';
    const email = body.paciente?.email || body.email || '';
    const dataNascimento = body.paciente?.data_nascimento || body.birthdate || '';

    // Busca paciente existente por CPF ou email
    let existing = [];
    if (cpf) {
      existing = await svc.entities.Patient.filter({ document_number: cpf });
    }
    if (existing.length === 0 && email) {
      existing = await svc.entities.Patient.filter({ email });
    }

    if (existing.length > 0) {
      // Atualiza paciente existente
      const updates = {};
      if (telefone) updates.phone = telefone;
      if (email) updates.email = email;
      if (dataNascimento) updates.birth_date = dataNascimento;
      if (nome) updates.full_name = nome;
      await svc.entities.Patient.update(existing[0].id, updates);
      return Response.json({ success: true, action: 'updated', id: existing[0].id });
    } else {
      // Cria novo paciente
      const created = await svc.entities.Patient.create({
        full_name: nome,
        document_number: cpf,
        phone: telefone,
        email,
        birth_date: dataNascimento,
        source: 'other',
        notes: 'Cadastrado via SensorlyFlow',
      });
      return Response.json({ success: true, action: 'created', id: created.id });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});