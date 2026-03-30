import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * LSA - Luxure Sales Academy | SISTEMA DRA. PALOMA
 * Módulo: Triagem Inteligente (Intake)
 * Camada: 1.2 Lógica (Backend)
 * 
 * REGRAS DE SEGURANÇA:
 * - API Key NUNCA exposta ao frontend (injetada via env)
 * - Validação de permissão antes de qualquer operação
 * - Prontuário NÃO é criado automaticamente (validação humana obrigatória)
 * - Auditoria registrada em AuditLog a cada execução
 */

const SYSTEM_PROMPT = `Você é o Analista Clínico Estratégico da Clínica Dra. Paloma Betoni — especialista em harmonização facial e estética avançada.

INSTRUÇÃO CRÍTICA: Sua saída deve ser EXCLUSIVAMENTE um JSON válido. Sem texto antes ou depois.
Você NÃO toma decisões médicas — apenas categoriza relatos para triagem.

REGRAS LSA:
1. Identifique urgência de 0 a 5 (0 = sem urgência, 5 = urgência máxima).
2. Categorize o tratamento na área estética facial.
3. Se o paciente mencionar dor, evento próximo, insatisfação forte ou urgência → priority: true.

Retorne EXATAMENTE este JSON:
{
  "queixa_principal": "Resumo objetivo em até 6 palavras",
  "hipotese_triagem": "uma de: Botox, Preenchimento, Bioestimulador, Skinbooster, Fios, Peeling, Consulta Avaliação, Retorno, Urgência",
  "alerta_saude": "Alergias ou condições sistêmicas detectadas. Se nenhuma: 'Nenhum alerta identificado'",
  "tom_emocional": "um de: Ansioso, Calmo, Urgente, Entusiasmado, Inseguro",
  "urgency": 0,
  "priority": false,
  "area_tratamento": "região facial: fronte, olhos, nariz, lábios, mandíbula, pescoço, global, ou 'não especificada'"
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. AUTENTICAÇÃO (Regra 2 e 6)
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // CONTROLE DE ACESSO (Regra 1.4) — admin ou profissional da clínica
    const allowedRoles = ['admin', 'recepcao', 'dentista', 'user'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: 'Acesso negado para esta função.' }, { status: 403 });
    }

    const body = await req.json();
    const { patient_id, patient_name, raw_complaint } = body;

    // VALIDAÇÃO DE ENTRADA
    if (!patient_id || typeof patient_id !== 'string' || patient_id.trim() === '') {
      return Response.json({ error: 'Dados obrigatórios ausentes: patient_id.' }, { status: 400 });
    }
    if (!raw_complaint || typeof raw_complaint !== 'string' || raw_complaint.trim().length < 5) {
      return Response.json({ error: 'Dados obrigatórios ausentes: relato mínimo de 5 caracteres.' }, { status: 400 });
    }

    // Sanitização do input
    const sanitizedComplaint = raw_complaint.trim().substring(0, 2000);

    // 2. CAMADA DE INTELIGÊNCIA - CHAMADA SEGURA (Regra 1.5 e 2)
    // A API Key NUNCA aparece no frontend — processada exclusivamente aqui no servidor
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    let structuredData;

    if (OPENAI_API_KEY) {
      // Usa OpenAI diretamente se a chave estiver configurada
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: sanitizedComplaint }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!aiRes.ok) {
        throw new Error(`OpenAI API error: ${aiRes.status}`);
      }

      const aiJson = await aiRes.json();
      structuredData = JSON.parse(aiJson.choices[0].message.content);

    } else {
      // Fallback: usa integração nativa Base44 (sem expor chave)
      structuredData = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nRelato do paciente:\n"${sanitizedComplaint}"`,
        response_json_schema: {
          type: 'object',
          properties: {
            queixa_principal: { type: 'string' },
            hipotese_triagem: { type: 'string' },
            alerta_saude: { type: 'string' },
            tom_emocional: { type: 'string' },
            urgency: { type: 'number' },
            priority: { type: 'boolean' },
            area_tratamento: { type: 'string' }
          },
          required: ['queixa_principal', 'hipotese_triagem', 'alerta_saude', 'tom_emocional', 'urgency', 'priority', 'area_tratamento']
        }
      });
    }

    // Validação do output da IA
    if (!structuredData || structuredData.queixa_principal === undefined) {
      throw new Error('A IA retornou uma resposta inválida.');
    }

    // 3. REGRA DE NEGÓCIO LSA - INTERPRETAÇÃO (Regra 1.2)
    const processedResult = {
      timestamp: new Date().toISOString(),
      patient_id,
      analysis: structuredData,
      workflow_suggestion: structuredData.urgency > 3 ? 'MOVER_PARA_URGENCIA' : 'AGENDAR_AVALIACAO',
      lsa_commercial_hint: structuredData.priority
        ? 'Oferecer encaixe imediato via WhatsApp.'
        : 'Seguir fluxo padrão de agendamento.'
    };

    // Salva triagem com status "pending" — prontuário NÃO criado automaticamente
    const screening = await base44.asServiceRole.entities.IntakeScreening.create({
      patient_id,
      patient_name: patient_name || '',
      raw_complaint: sanitizedComplaint,
      ai_output: structuredData,
      validation_status: 'pending'
    });

    // 4. REGISTRO DE AUDITORIA (Regra 3)
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'create',
      entity_type: 'IntakeScreening',
      entity_id: screening.id,
      user_email: user.email,
      user_role: user.role,
      details: {
        action: 'intake_processed',
        urgency: structuredData.urgency,
        priority: structuredData.priority,
        workflow_suggestion: processedResult.workflow_suggestion
      }
    });

    // 5. RETORNO LIMPO (Regra 6)
    return Response.json({
      success: true,
      screening_id: screening.id,
      ai_analysis: structuredData,
      workflow_suggestion: processedResult.workflow_suggestion,
      lsa_commercial_hint: processedResult.lsa_commercial_hint,
      message: 'Triagem gerada. Aguardando validação da Dra. Paloma para gravar no prontuário.'
    });

  } catch (error) {
    // TRATAMENTO DE ERRO OBRIGATÓRIO (Regra 4)
    console.error('ERRO_INTAKE_PALOMA:', error.message);
    return Response.json({
      error: 'Falha interna no processamento da triagem.',
      code: 'AI_ORCHESTRATOR_ERROR'
    }, { status: 500 });
  }
});