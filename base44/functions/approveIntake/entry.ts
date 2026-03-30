import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { screening_id, action, notes } = body; // action: 'approve' | 'reject'

    if (!screening_id || !action) {
      return Response.json({ error: 'screening_id e action são obrigatórios' }, { status: 400 });
    }
    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'action deve ser approve ou reject' }, { status: 400 });
    }

    // Busca a triagem
    const screenings = await base44.asServiceRole.entities.IntakeScreening.filter({ id: screening_id });
    const screening = screenings[0];
    if (!screening) {
      return Response.json({ error: 'Triagem não encontrada' }, { status: 404 });
    }
    if (screening.validation_status !== 'pending') {
      return Response.json({ error: 'Triagem já foi processada' }, { status: 409 });
    }

    let medical_record_id = null;

    if (action === 'approve') {
      // Só aqui o prontuário é criado — após clique humano da Dra.
      const aiData = screening.ai_output || {};
      const newRecord = await base44.asServiceRole.entities.MedicalRecord.create({
        patient_id: screening.patient_id,
        record_date: new Date().toISOString(),
        chief_complaint: aiData.queixa_principal || screening.raw_complaint,
        medical_history: '',
        allergies: aiData.alerta_saude && aiData.alerta_saude !== 'Nenhum alerta identificado'
          ? [aiData.alerta_saude] : [],
        evolution: `[Triagem IA] ${screening.raw_complaint}\n\nHipótese: ${aiData.hipotese_triagem || '-'}\nTom emocional: ${aiData.tom_emocional || '-'}\nÁrea: ${aiData.area_tratamento || '-'}`,
        recommendations: '',
        status: 'pending_review',
        professional_id: user.id
      });
      medical_record_id = newRecord.id;
    }

    // Atualiza status da triagem
    await base44.asServiceRole.entities.IntakeScreening.update(screening_id, {
      validation_status: action === 'approve' ? 'approved' : 'rejected',
      validated_by: user.email,
      validated_at: new Date().toISOString(),
      medical_record_id,
      notes: notes || ''
    });

    // Log de auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      action: "update",
      entity_type: "IntakeScreening",
      entity_id: screening_id,
      user_email: user.email,
      user_role: user.role,
      details: { action: `intake_${action}d`, medical_record_created: !!medical_record_id }
    });

    return Response.json({
      success: true,
      action,
      medical_record_id,
      message: action === 'approve'
        ? 'Triagem aprovada e prontuário criado com sucesso.'
        : 'Triagem rejeitada.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});