import { base44 } from "@/api/base44Client";

// ── Tokens visuais premium ──
export const T = {
  bg: "#0A0A0A",
  surface: "#141414",
  card: "#1A1A1A",
  border: "#2B2B2B",
  text: "#FFFFFF",
  muted: "#B0B0B0",
  dim: "#666666",
  gold: "#C8A96A",
  goldSoft: "rgba(200,169,106,0.12)",
  offWhite: "#F9F9F7",
};

// Número padrão (formato internacional sem +); pode ser sobrescrito pelo ClinicSettings
export const DEFAULT_WHATSAPP = "5599999999999";

// ── Helper de chamadas ao backend do portal ──
export async function portalApi(action, payload = {}) {
  const res = await base44.functions.invoke("portalPaciente", { action, ...payload });
  return res.data;
}

// ── Link de WhatsApp ──
export function whatsappLink(number, message) {
  const clean = (number || DEFAULT_WHATSAPP).replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

// ── Mensagens contextuais ──
export const WHATSAPP_MESSAGES = {
  duvida: "Olá, equipe da Dra. Paloma. Estou acessando minha Jornada da Beleza Natural e gostaria de tirar uma dúvida sobre meu tratamento.",
  agendar: "Olá, equipe da Dra. Paloma. Gostaria de agendar uma nova sessão pela minha Jornada da Beleza Natural.",
  reagendar: "Olá, equipe da Dra. Paloma. Preciso reagendar um compromisso da minha Jornada da Beleza Natural.",
  foto: "Olá, equipe da Dra. Paloma. Vou enviar uma foto de evolução do meu tratamento pela Jornada da Beleza Natural.",
  plano: "Olá, equipe da Dra. Paloma. Gostaria de falar sobre meu plano de tratamento na Jornada da Beleza Natural.",
  valores: "Olá, equipe da Dra. Paloma. Gostaria de saber mais sobre os valores dos procedimentos da minha Jornada da Beleza Natural.",
  consultora: "Olá, equipe da Dra. Paloma. Gostaria de falar com a consultora pela minha Jornada da Beleza Natural.",
  manutencao: "Olá, equipe da Dra. Paloma. Gostaria de agendar minha manutenção do Clube pela Jornada da Beleza Natural.",
};