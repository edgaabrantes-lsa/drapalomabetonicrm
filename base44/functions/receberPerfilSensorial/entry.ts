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
    const body = await req.json();

    const paciente = body.paciente || {};

    await base44.asServiceRole.entities.Pacientes.create({
      nome_completo: paciente.nome_completo || body.patient_name || '',
      cpf: paciente.cpf || body.cpf || '',
      telefone: paciente.telefone_whatsapp || paciente.phone || body.phone || '',
      email: paciente.email || body.email || '',
      data_nascimento: paciente.data_nascimento || body.birthdate || '',
      origem: 'SensorlyFlow - Clínica Alba',
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});