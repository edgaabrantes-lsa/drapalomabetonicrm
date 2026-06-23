import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Normaliza campos comuns entre apps
    const payload = {
      ...body,
      name: body.name || body.full_name || body.nome || 'Sem nome',
      source: body.source || 'other',
      status: body.status || 'new',
      pipeline_stage: body.pipeline_stage || 'inbox',
    };

    // Remove campos que não existem na entidade Lead
    delete payload.full_name;
    delete payload.nome;

    // Salva na entidade Lead (perfil sensorial vindo do outro app)
    const record = await base44.asServiceRole.entities.Lead.create(payload);

    return Response.json({ success: true, id: record.id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});