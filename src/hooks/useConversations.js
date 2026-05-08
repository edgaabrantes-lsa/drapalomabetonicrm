import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Dados mockados para demonstração enquanto API real não está conectada
const MOCK_CONVERSATIONS = [
  {
    id: "conv_1",
    lead_id: "lead_1",
    lead: { id: "lead_1", name: "Marcos Almeida", phone: "(11) 99999-1111", source: "whatsapp", status: "new", pipeline_stage: "inbox" },
    channel: "whatsapp",
    last_message: "Gostaria de saber o valor da harmonização",
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    unread_count: 2,
    temperature: "hot",
    status: "new",
    assigned_to: null,
  },
  {
    id: "conv_2",
    lead_id: "lead_2",
    lead: { id: "lead_2", name: "Juliana Prado", phone: "(11) 99999-2222", source: "instagram", status: "contacted", pipeline_stage: "first_contact" },
    channel: "instagram",
    last_message: "Vocês fazem avaliação antes do procedimento?",
    last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
    unread_count: 1,
    temperature: "warm",
    status: "in_progress",
    assigned_to: "dra@clinica.com",
  },
  {
    id: "conv_3",
    lead_id: "lead_3",
    lead: { id: "lead_3", name: "Fernanda Lima", phone: "(11) 99999-3333", source: "google", status: "qualified", pipeline_stage: "scheduling" },
    channel: "website",
    last_message: "Gostaria de agendar uma avaliação com a Dra. Paloma.",
    last_message_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    unread_count: 0,
    temperature: "hot",
    status: "scheduled",
    assigned_to: "dra@clinica.com",
  },
  {
    id: "conv_4",
    lead_id: "lead_4",
    lead: { id: "lead_4", name: "Beatriz Castro", phone: "(11) 99999-4444", source: "whatsapp", status: "proposal", pipeline_stage: "interested" },
    channel: "whatsapp",
    last_message: "Qual o valor do preenchimento labial?",
    last_message_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    unread_count: 3,
    temperature: "warm",
    status: "budget_sent",
    assigned_to: null,
  },
  {
    id: "conv_5",
    lead_id: "lead_5",
    lead: { id: "lead_5", name: "Camila Rocha", phone: "(11) 99999-5555", source: "referral", status: "new", pipeline_stage: "inbox" },
    channel: "whatsapp",
    last_message: "Tenho interesse em botox, mas nunca fiz.",
    last_message_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    unread_count: 0,
    temperature: "warm",
    status: "new",
    assigned_to: null,
  },
  {
    id: "conv_6",
    lead_id: "lead_6",
    lead: { id: "lead_6", name: "Renata Alves", phone: "(11) 99999-6666", source: "instagram", status: "contacted", pipeline_stage: "first_contact" },
    channel: "instagram",
    last_message: "Olá! Vi os resultados no Instagram e fiquei encantada.",
    last_message_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    unread_count: 0,
    temperature: "cold",
    status: "new",
    assigned_to: null,
  },
];

export function useConversations() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = conversations.filter((c) => {
    const matchSearch = !search || c.lead?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.temperature === filter || c.status === filter;
    return matchSearch && matchFilter;
  });

  const updateConversationStatus = useCallback((convId, status) => {
    setConversations((prev) =>
      prev.map((c) => c.id === convId ? { ...c, status } : c)
    );
  }, []);

  const markAsRead = useCallback((convId) => {
    setConversations((prev) =>
      prev.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c)
    );
  }, []);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return { conversations: filtered, loading, search, setSearch, filter, setFilter, totalUnread, updateConversationStatus, markAsRead };
}