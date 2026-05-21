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

import { base44 } from "@/api/base44Client";

export const AIService = {
  /**
   * Sugere resposta baseada no histórico da conversa usando GPT-4o
   */
  async suggestReply(conversationHistory, leadContext) {
    try {
      const response = await base44.functions.invoke('aiSuggestReply', {
        conversationHistory,
        leadContext
      });
      
      if (response.data.success) {
        return response.data.suggestion;
      }
      
      // Fallback em caso de erro
      return response.data.fallback || "Olá! Fico feliz com seu interesse. Posso agendar uma avaliação gratuita para você conhecer melhor os resultados. Qual seria o melhor dia para você?";
    } catch (error) {
      console.error("[AIService] Erro ao gerar sugestão:", error);
      return "Olá! Obrigada pelo contato. Vamos agendar uma avaliação sem compromisso para a Dra. Paloma entender exatamente o que você precisa. Você prefere manhã ou tarde?";
    }
  },

  /**
   * Resume a conversa em formato executivo usando GPT-4o
   */
  async summarizeConversation(messages) {
    try {
      const response = await base44.functions.invoke('aiSummarizeConversation', { messages });
      if (response.data.success) {
        const s = response.data.summary;
        return {
          summary: s.summary,
          keyPoints: s.key_points || [],
          nextStep: s.recommended_action,
        };
      }
    } catch (error) {
      console.error("[AIService] Erro ao resumir:", error);
    }
    return {
      summary: "Resumo não disponível",
      keyPoints: [],
      nextStep: "Entrar em contato",
    };
  },

  /**
   * Classifica temperatura do lead (quente/morno/frio) usando GPT-4o
   */
  async classifyLeadTemperature(messages) {
    try {
      const response = await base44.functions.invoke('aiClassifyLead', { messages });
      if (response.data.success) {
        return response.data.classification.temperature;
      }
    } catch (error) {
      console.error("[AIService] Erro ao classificar:", error);
    }
    const temps = ["hot", "warm", "cold"];
    return temps[Math.floor(Math.random() * temps.length)];
  },

  /**
   * Detecta intenção principal do lead usando GPT-4o
   */
  async detectIntent(messages) {
    try {
      const response = await base44.functions.invoke('aiClassifyLead', { messages });
      if (response.data.success) {
        const c = response.data.classification;
        return {
          intent: c.intent,
          confidence: c.confidence,
          procedures: c.procedures_mentioned || [],
          urgency: c.urgency,
        };
      }
    } catch (error) {
      console.error("[AIService] Erro ao detectar intenção:", error);
    }
    return {
      intent: "interesse_procedimento",
      confidence: 0.87,
      procedures: ["harmonização facial"],
      urgency: "média",
    };
  },

  /**
   * Gera mensagem de follow-up personalizada usando GPT-4o
   */
  async generateFollowUp(lead, daysSinceLastContact) {
    try {
      const prompt = `Crie uma mensagem curta de follow-up para ${lead.name}, que não fala há ${daysSinceLastContact} dias. Tom: amigável e profissional. Máx. 2 frases.`;
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      return typeof response === 'string' ? response : response.text || `Olá ${lead.name}! Tudo bem? Ainda tem interesse em agendar sua avaliação com a Dra. Paloma? 😊`;
    } catch (error) {
      console.error("[AIService] Erro no follow-up:", error);
    }
    return `Olá ${lead.name}! Tudo bem? Estava pensando em você e queria saber se ainda tem interesse em agendar sua avaliação com a Dra. Paloma. Temos horários disponíveis essa semana! 😊`;
  },

  /**
   * Cria resumo comercial para prontuário usando GPT-4o
   */
  async createCommercialSummary(lead, conversation) {
    try {
      const summary = await this.summarizeConversation(conversation);
      const classification = await this.classifyLeadTemperature(conversation);
      
      return {
        leadName: lead.name,
        interestArea: summary.keyPoints[0] || "Harmonização Facial",
        estimatedValue: "R$ 2.500 - R$ 4.000",
        conversionProbability: classification === 'hot' ? "85%" : classification === 'warm' ? "60%" : "35%",
        recommendedApproach: summary.nextStep,
        notes: summary.summary,
      };
    } catch (error) {
      console.error("[AIService] Erro ao criar resumo:", error);
    }
    return {
      leadName: lead.name,
      interestArea: "Harmonização Facial",
      estimatedValue: "R$ 2.500 - R$ 4.000",
      conversionProbability: "75%",
      recommendedApproach: "Agendar avaliação gratuita",
      notes: "Resumo não disponível",
    };
  },
};