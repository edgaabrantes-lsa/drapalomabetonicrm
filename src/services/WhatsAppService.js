/**
 * WhatsAppService
 * 
 * Camada de abstração para futura integração com API Oficial do WhatsApp (Meta Cloud API).
 * Atualmente todas as funções são simuladas (mock).
 * 
 * FUTURA INTEGRAÇÃO:
 * - Configurar WHATSAPP_TOKEN e WHATSAPP_PHONE_ID nas variáveis de ambiente
 * - Substituir as funções simuladas pelas chamadas reais à API
 * - Endpoint base: https://graph.facebook.com/v18.0/{phone_number_id}/messages
 */

export const WhatsAppService = {
  /**
   * Envia mensagem de texto
   * TODO: POST /messages { type: "text", to: phone, text: { body: content } }
   */
  async sendMessage(phone, content) {
    console.log("[WhatsAppService] sendMessage simulado:", { phone, content });
    return { id: `wamid.${Date.now()}`, status: "sent" };
  },

  /**
   * Simula recebimento de mensagem via webhook
   * TODO: Configurar webhook em /api/whatsapp/webhook
   */
  async receiveMessage(payload) {
    console.log("[WhatsAppService] receiveMessage simulado:", payload);
    return payload;
  },

  /**
   * Envia áudio
   * TODO: POST /messages { type: "audio", to: phone, audio: { id: mediaId } }
   */
  async sendAudio(phone, audioUrl) {
    console.log("[WhatsAppService] sendAudio simulado:", { phone, audioUrl });
    return { id: `wamid.${Date.now()}`, status: "sent" };
  },

  /**
   * Envia imagem
   * TODO: POST /messages { type: "image", to: phone, image: { link: imageUrl } }
   */
  async sendImage(phone, imageUrl, caption = "") {
    console.log("[WhatsAppService] sendImage simulado:", { phone, imageUrl, caption });
    return { id: `wamid.${Date.now()}`, status: "sent" };
  },

  /**
   * Envia documento
   * TODO: POST /messages { type: "document", to: phone, document: { link: docUrl } }
   */
  async sendDocument(phone, docUrl, filename) {
    console.log("[WhatsAppService] sendDocument simulado:", { phone, docUrl, filename });
    return { id: `wamid.${Date.now()}`, status: "sent" };
  },

  /**
   * Marca mensagens como lidas
   * TODO: POST /messages { messaging_product: "whatsapp", status: "read", message_id: id }
   */
  async markAsRead(messageId) {
    console.log("[WhatsAppService] markAsRead simulado:", { messageId });
    return { success: true };
  },

  /**
   * Busca histórico da conversa
   * TODO: Buscar no banco de dados local (mensagens salvas via webhook)
   */
  async getConversationHistory(phone) {
    console.log("[WhatsAppService] getConversationHistory simulado:", { phone });
    return [];
  },

  /**
   * Sincroniza contato com base no número de telefone
   * TODO: Integrar com base de leads/pacientes da clínica
   */
  async syncContact(phone, name) {
    console.log("[WhatsAppService] syncContact simulado:", { phone, name });
    return { phone, name, synced: true };
  },

  /**
   * Cria ou atualiza lead no CRM
   * TODO: Verificar duplicidade por telefone antes de criar
   */
  async createOrUpdateLead(leadData) {
    console.log("[WhatsAppService] createOrUpdateLead simulado:", leadData);
    return { ...leadData, id: `lead_${Date.now()}` };
  },
};