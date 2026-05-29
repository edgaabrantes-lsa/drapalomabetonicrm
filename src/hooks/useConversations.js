import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ─── FONTE ÚNICA DE VERDADE ──────────────────────────────────────────────────
// Todos os módulos (CRM, Chat, Kanban) devem importar daqui
export const PIPELINE_STAGES = [
  { id: "inbox",         label: "Entrada / Frio",       color: "#6b7280" },
  { id: "first_contact", label: "Primeiro Contato",      color: "#3b82f6" },
  { id: "interested",    label: "Interessado / Morno",   color: "#8b5cf6" },
  { id: "scheduling",    label: "Agendando / Quente",    color: "#f59e0b" },
  { id: "scheduled",     label: "Agendado / Quente",     color: "#10b981" },
  { id: "converted",     label: "Convertido",            color: "#c9a55c" },
  { id: "lost",          label: "Perdido / Inativo",     color: "#ef4444" },
];

export const STAGE_MAP = Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s]));

// Converte um Lead em formato "Conversa" para o Chat
function leadToConversation(lead) {
  return {
    id: lead.id,
    lead_id: lead.id,
    lead,
    channel: lead.source === "whatsapp" ? "whatsapp"
            : lead.source === "instagram" ? "instagram"
            : "website",
    last_message: lead.notes || "",
    last_message_at: lead.last_contact_date || lead.updated_date || lead.created_date,
    unread_count: 0,
    pipeline_stage: lead.pipeline_stage || "inbox",
    status: lead.pipeline_stage || "inbox",  // alias para compatibilidade
    assigned_to: lead.assigned_to || null,
  };
}

export function useConversations() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Carga inicial
    setLoading(true);
    base44.entities.Lead.list("-updated_date", 500)
      .then(data => {
        if (mounted) {
          setLeads(data || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          console.error("[useConversations] Erro ao carregar leads:", err);
          setError("Não foi possível carregar as conversas.");
          setLoading(false);
        }
      });

    // Assinatura em tempo real
    const unsubscribe = base44.entities.Lead.subscribe((event) => {
      if (!mounted) return;
      if (event.type === "create") {
        setLeads(prev => [event.data, ...prev]);
      } else if (event.type === "update") {
        setLeads(prev => prev.map(l => l.id === event.id ? { ...l, ...event.data } : l));
      } else if (event.type === "delete") {
        setLeads(prev => prev.filter(l => l.id !== event.id));
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const conversations = leads.map(leadToConversation);

  const filtered = conversations.filter((c) => {
    const matchSearch = !search
      || c.lead?.name?.toLowerCase().includes(search.toLowerCase())
      || c.lead?.phone?.includes(search)
      || c.last_message?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.pipeline_stage === filter;
    return matchSearch && matchFilter;
  });

  // Atualiza pipeline_stage no banco — única função de mudança de status
  const updateConversationStatus = useCallback(async (leadId, newStage) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Atualização otimista imediata
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, pipeline_stage: newStage } : l
    ));

    try {
      await base44.entities.Lead.update(leadId, { ...lead, pipeline_stage: newStage });
    } catch (err) {
      console.error("[useConversations] Erro ao atualizar status:", err);
      // Reverter em caso de falha
      setLeads(prev => prev.map(l => l.id === leadId ? lead : l));
    }
  }, [leads]);

  const markAsRead = useCallback((leadId) => {
    // Marca visualmente como lido (sem campo de unread_count no Lead)
    setLeads(prev => prev.map(l => l.id === leadId ? l : l));
  }, []);

  // "Não lidas" = leads em inbox que ainda não tiveram primeiro contato
  const totalUnread = leads.filter(l => l.pipeline_stage === "inbox").length;

  return {
    conversations: filtered,
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    totalUnread,
    updateConversationStatus,
    markAsRead,
  };
}