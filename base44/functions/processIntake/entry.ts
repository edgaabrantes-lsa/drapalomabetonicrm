import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SYSTEM_PROMPT = `Você é o Analista Clínico Estratégico da Clínica Dra. Paloma Betoni — especialista em harmonização facial e estética avançada.

INSTRUÇÃO CRÍTICA: Sua saída deve ser EXCLUSIVAMENTE um JSON válido. Sem texto antes ou depois. Você não toma decisões médicas, apenas categoriza relatos para triagem clínica.

Analise o relato do paciente e retorne EXATAMENTE este JSON:
{
  "queixa_principal": "Resumo objetivo em até 6 palavras",
  "hipotese_triagem": "uma de: Botox, Preenchimento, Bioestimulador, Skinbooster, Fios, Peeling, Consulta Avaliação, Retorno, Urgência",
  "alerta_saude": "Alergias ou condições sistêmicas detectadas no texto. Se nenhuma, retorne 'Nenhum alerta identificado'",
  "tom_emocional": "um de: Ansioso, Calmo, Urgente, Entusiasmado, Inseguro",
  "urgencia": "um de: baixa, media, alta",
  "comercial_priority": true ou false (true se mencionar dor, urgência, evento próximo ou insatisfação estética forte),
  "area_tratamento": "região facial principal mencionada: ex: fronte, olhos, nariz, lábios, mandíbula, pescoço, global, ou 'não especificada'"
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autenticação obrigatória
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { patient_id, raw_complaint } = body;

    // Validação de input
    if (!patient_id || typeof patient_id !== 'string' || patient_id.trim() === '') {
      return Response.json({ error: 'patient_id é obrigatório' }, { status: 400 });
    }
    if (!raw_complaint || typeof raw_complaint !== 'string' || raw_complaint.trim().length < 5) {
      return Response.json({ error: 'Relato do paciente é obrigatório (mínimo 5 caracteres)' }, { status: 400 });
    }

    // Sanitização do input
    const sanitizedComplaint = raw_complaint.trim().substring(0, 2000);

    // Chamada segura à IA (chave nunca exposta ao frontend)
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analise o seguinte relato de paciente de clínica estética:\n\n"${sanitizedComplaint}"`,
      response_json_schema: {
        type: "object",
        properties: {
          queixa_principal: { type: "string" },
          hipotese_triagem: { type: "string" },
          alerta_saude: { type: "string" },
          tom_emocional: { type: "string" },
          urgencia: { type: "string" },
          comercial_priority: { type: "boolean" },
          area_tratamento: { type: "string" }
        },
        required: ["queixa_principal", "hipotese_triagem", "alerta_saude", "tom_emocional", "urgencia", "comercial_priority", "area_tratamento"]
      }
    });

    // Validação do output da IA
    if (!aiResponse || !aiResponse.queixa_principal) {
      await base44.asServiceRole.entities.AuditLog.create({
        action: "create",
        entity_type: "IntakeScreening",
        entity_id: "unknown",
        user_email: user.email,
        user_role: user.role,
        details: { error: "IA retornou resposta inválida", raw_complaint: sanitizedComplaint.substring(0, 100) }
      });
      return Response.json({ error: 'A IA retornou uma resposta inválida. Tente novamente.' }, { status: 502 });
    }

    // Salva a triagem com status "pending" — nada é gravado no prontuário automaticamente
    const screening = await base44.asServiceRole.entities.IntakeScreening.create({
      patient_id,
      patient_name: body.patient_name || '',
      raw_complaint: sanitizedComplaint,
      ai_output: aiResponse,
      validation_status: 'pending'
    });

    // Log de auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      action: "create",
      entity_type: "IntakeScreening",
      entity_id: screening.id,
      user_email: user.email,
      user_role: user.role,
      details: { action: "intake_processed", urgencia: aiResponse.urgencia }
    });

    return Response.json({
      success: true,
      screening_id: screening.id,
      ai_analysis: aiResponse,
      message: 'Triagem gerada. Aguardando validação da Dra. Paloma.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});