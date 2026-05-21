import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Você é uma assistente virtual especializada da Clínica Dra. Paloma Betoni, focada em harmonização facial e estética avançada.

TOM DE VOZ:
- Acolhedora, profissional e empática
- Linguagem clara, sem jargões médicos complexos
- Foco em agendar avaliação gratuita
- Use emojis moderadamente (1-2 por mensagem)

OBJETIVOS:
1. Responder dúvidas sobre procedimentos de forma educativa
2. Conduzir a conversa para agendamento de avaliação
3. Transmitir confiança e autoridade da Dra. Paloma
4. Nunca dar valores exatos - sempre direcionar para avaliação presencial

PROCEDIMENTOS PRINCIPAIS:
- Botox: relaxamento muscular, rugas, sulcos
- Preenchimento: lábios, olheiras, malar, mandíbula
- Bioestimuladores: colágeno, flacidez
- Skinbooster: hidratação profunda
- Fios de PDO: lifting não cirúrgico

IMPORTANTE:
- Não dê diagnósticos médicos
- Sempre convide para avaliação gratuita com a Dra. Paloma
- Mantenha respostas curtas (máx. 3-4 frases)`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { conversationHistory, leadContext } = await req.json();

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return Response.json({ error: 'Histórico da conversa é obrigatório' }, { status: 400 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      return Response.json({ 
        error: 'Chave da OpenAI não configurada',
        fallback: 'Olá! Fico feliz com seu interesse. Posso agendar uma avaliação gratuita para você conhecer melhor os resultados da Dra. Paloma. Qual seria o melhor dia para você?'
      }, { status: 500 });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'assistant' : 'user',
        content: msg.text
      }))
    ];

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!aiRes.ok) {
      throw new Error(`OpenAI API error: ${aiRes.status}`);
    }

    const aiJson = await aiRes.json();
    const suggestion = aiJson.choices[0].message.content.trim();

    return Response.json({
      success: true,
      suggestion,
      model: 'gpt-4o-mini'
    });

  } catch (error) {
    console.error('ERRO_AI_SUGGESTION:', error.message);
    return Response.json({
      error: 'Falha ao gerar sugestão',
      fallback: 'Olá! Obrigada pelo contato. Vamos agendar uma avaliação sem compromisso para a Dra. Paloma entender exatamente o que você precisa. Você prefere manhã ou tarde?'
    }, { status: 500 });
  }
});