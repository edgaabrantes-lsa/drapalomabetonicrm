import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Analise a conversa e classifique o lead conforme critérios abaixo.

RETORNE APENAS ESTE JSON:
{
  "temperature": "hot|warm|cold",
  "intent": "interesse|duvida|objecao|agendamento|followup",
  "confidence": 0.0-1.0,
  "procedures_mentioned": ["lista de procedimentos"],
  "urgency": "alta|media|baixa",
  "next_step_recommended": "ação recomendada"
}

CRITÉRIOS:
- HOT: Já perguntou valores, quer agendar, demonstrou urgência
- WARM: Tem interesse, faz perguntas, mas sem urgência clara
- COLD: Apenas explorando, sem compromisso

INTENÇÕES:
- interesse: Pergunta sobre procedimentos/resultados
- duvida: Questiona sobre processo, segurança, etc.
- objecao: Questiona valores, teme dor, hesita
- agendamento: Quer marcar horário
- followup: Retomando contato anterior`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Mensagens são obrigatórias' }, { status: 400 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      return Response.json({ 
        temperature: 'warm',
        intent: 'interesse',
        confidence: 0.5,
        procedures_mentioned: [],
        urgency: 'media',
        next_step_recommended: 'Agendar avaliação'
      });
    }

    const conversationText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analise esta conversa:\n\n${conversationText}` }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300
      })
    });

    if (!aiRes.ok) {
      throw new Error(`OpenAI API error: ${aiRes.status}`);
    }

    const aiJson = await aiRes.json();
    const classification = JSON.parse(aiJson.choices[0].message.content);

    return Response.json({
      success: true,
      classification
    });

  } catch (error) {
    console.error('ERRO_AI_CLASSIFY:', error.message);
    return Response.json({
      temperature: 'warm',
      intent: 'interesse',
      confidence: 0.5,
      procedures_mentioned: [],
      urgency: 'media',
      next_step_recommended: 'Entrar em contato'
    });
  }
});