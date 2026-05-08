/**
 * CRMService
 * 
 * Integração entre o módulo de Bate-papo e o CRM da clínica.
 * Garante sincronização bidirecional de status e informações dos leads.
 */

import { base44 } from "@/api/base44Client";

export const CRMService = {
  /**
   * Busca ou cria lead pelo telefone (evita duplicidade)
   */
  async findOrCreateLeadByPhone(phone, name, source = "whatsapp") {
    const leads = await base44.entities.Lead.filter({ phone });
    if (leads && leads.length > 0) return leads[0];
    return await base44.entities.Lead.create({
      name,
      phone,
      source,
      status: "new",
      pipeline_stage: "inbox",
    });
  },

  /**
   * Atualiza status do lead no CRM
   */
  async updateLeadStatus(leadId, status, pipelineStage) {
    return await base44.entities.Lead.update(leadId, { status, pipeline_stage: pipelineStage });
  },

  /**
   * Registra interação no histórico do lead
   */
  async logInteraction(leadId, type, content, performedBy) {
    return await base44.entities.LeadInteraction.create({
      lead_id: leadId,
      interaction_type: type,
      content,
      performed_by: performedBy,
    });
  },

  /**
   * Busca todos os leads com conversas ativas
   */
  async getActiveLeads() {
    return await base44.entities.Lead.list("-updated_date", 50);
  },
};