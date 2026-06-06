import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patient_id, patient_name, acao, tipo, descricao } = await req.json();

    if (!patient_id || !acao || !tipo) {
      return Response.json({ error: 'Campos obrigatórios: patient_id, acao, tipo' }, { status: 400 });
    }

    const log = await base44.entities.DossieLog.create({
      patient_id,
      patient_name: patient_name || '',
      acao,
      tipo,
      descricao: descricao || '',
      usuario: user.full_name || user.email || 'Sistema',
      data_hora: new Date().toISOString()
    });

    return Response.json({ success: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});