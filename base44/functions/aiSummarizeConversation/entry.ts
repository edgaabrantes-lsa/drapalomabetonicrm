import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Crie um resumo executivo da conversa para o CRM da clínica.

RETORNE APENAS ESTE JSON:
{
  "summary": "Resumo em 2-3 frases do que foi tratado",
  "key_points": ["ponto1", "ponto2", "ponto3"],
  "procedures_interested": ["procedimentos mencionados"],
  "objections_raised": ["objeções ou preocupações"],
  "commitment_level": "alto|medio|baixo",
  "recommended_action": "ação recomendada para a equipe"
}

FOCO:
- Identificar interesse real vs. apenas curiosidade
- Capturar objeções (valores, medo, tempo)
- Sugerir próximo passo claro`;

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
        summary: "Resumo não disponível - IA não configurada",
        key_points: [],
        procedures_interested: [],
        objections_raised: [],
        commitment_level: "medio",
        recommended_action: "Entrar em contato para qualificar"
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
          { role: 'user', content: `Resuma esta conversa:\n\n${conversationText}` }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 400
      })
    });

    if (!aiRes.ok) {
      throw new Error(`OpenAI API error: ${aiRes.status}`);
    }

    const aiJson = await aiRes.json();
    const summary = JSON.parse(aiJson.choices[0].message.content);

    return Response.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('ERRO_AI_SUMMARIZE:', error.message);
    return Response.json({
      summary: "Não foi possível gerar o resumo",
      key_points: ["Erro ao processar conversa"],
      procedures_interested: [],
      objections_raised: [],
      commitment_level: "medio",
      recommended_action: "Revisar manualmente"
    }, { status: 500 });
  }
});