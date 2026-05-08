/**
 * AIService
 * 
 * Camada de abstração para futura integração com OpenAI / ChatGPT.
 * Atualmente todas as funções são simuladas (mock).
 * 
 * FUTURA INTEGRAÇÃO:
 * - Configurar OPENAI_API_KEY nas variáveis de ambiente
 * - Substituir funções simuladas por chamadas à API OpenAI
 * - Modelo recomendado: gpt-4o ou gpt-4o-mini
 * 
 * REGRA IMPORTANTE:
 * A IA nunca envia mensagens automaticamente sem aprovação humana.
 * Por padrão: IA sugere → humano aprova → mensagem enviada.
 */

export const AIService = {
  /**
   * Sugere resposta baseada no histórico da conversa
   * TODO: Enviar histórico para GPT e retornar sugestão contextualizada
   */
  async suggestReply(conversationHistory, leadContext) {
    console.log("[AIService] suggestReply simulado");
    const suggestions = [
      "Olá! Fico feliz com seu interesse. A harmonização facial é um procedimento muito procurado aqui na clínica. Posso agendar uma avaliação gratuita para você conhecer melhor os resultados. Qual seria o melhor dia para você?",
      "Oi! Que ótimo que você entrou em contato. A Dra. Paloma tem horários disponíveis essa semana. Você prefere manhã ou tarde para a avaliação?",
      "Olá! Obrigada pelo contato. Vamos agendar uma avaliação sem compromisso para a Dra. Paloma entender exatamente o que você precisa e apresentar o melhor tratamento personalizado para você.",
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  },

  /**
   * Resume a conversa em formato executivo
   * TODO: Enviar conversa completa para GPT e retornar resumo estruturado
   */
  async summarizeConversation(messages) {
    console.log("[AIService] summarizeConversation simulado");
    return {
      summary: "Lead demonstrou interesse em harmonização facial. Perguntou sobre valores e disponibilidade. Perfil: primeira vez considerando o procedimento. Potencial de conversão: alto.",
      keyPoints: ["Interesse em harmonização facial", "Aguardando informações de valores", "Primeira vez considerando procedimento"],
      nextStep: "Agendar avaliação gratuita",
    };
  },

  /**
   * Classifica temperatura do lead (quente/morno/frio)
   * TODO: Analisar intenção, urgência e engajamento via GPT
   */
  async classifyLeadTemperature(messages) {
    console.log("[AIService] classifyLeadTemperature simulado");
    const temps = ["hot", "warm", "cold"];
    return temps[Math.floor(Math.random() * temps.length)];
  },

  /**
   * Detecta intenção principal do lead
   * TODO: Classificar intenção: interesse, dúvida, objeção, agendamento, etc.
   */
  async detectIntent(message) {
    console.log("[AIService] detectIntent simulado:", message);
    return {
      intent: "interesse_procedimento",
      confidence: 0.87,
      procedures: ["harmonização facial"],
      urgency: "média",
    };
  },

  /**
   * Gera mensagem de follow-up personalizada
   * TODO: Criar follow-up baseado no estágio do funil e última interação
   */
  async generateFollowUp(lead, daysSinceLastContact) {
    console.log("[AIService] generateFollowUp simulado:", { lead, daysSinceLastContact });
    return `Olá ${lead.name}! Tudo bem? Estava pensando em você e queria saber se ainda tem interesse em agendar sua avaliação com a Dra. Paloma. Temos horários disponíveis essa semana! 😊`;
  },

  /**
   * Cria resumo comercial para prontuário
   * TODO: Gerar resumo formatado para incluir no prontuário do paciente
   */
  async createCommercialSummary(lead, conversation) {
    console.log("[AIService] createCommercialSummary simulado");
    return {
      leadName: lead.name,
      interestArea: "Harmonização Facial",
      estimatedValue: "R$ 2.500 - R$ 4.000",
      conversionProbability: "75%",
      recommendedApproach: "Agendar avaliação gratuita com apresentação de antes/depois",
      notes: "Lead bem informado, primeira vez considerando procedimento estético.",
    };
  },
};