import { base44 } from "@/api/base44Client";

// ── Identidade visual exclusiva · Jornada da Beleza Natural ──
// Paleta premium: bege/off-white + vinho/bordô + marsala
export const T = {
  bg: "#FAF8F3",          // fundo principal — off-white sofisticado
  surface: "#F2EDE3",     // seções / inputs — bege suave
  card: "#FFFFFF",        // cards limpos
  cardAlt: "#E9E2D4",     // bege card alternativo
  border: "#E7DFD1",      // borda sutil bege
  borderStrong: "#D8CFBE",
  text: "#2E2E2E",        // texto principal — grafite
  muted: "#6F6F6F",       // texto secundário — cinza elegante
  dim: "#9A8F80",         // cinza beje discreto
  wine: "#8F2D3A",        // vinho/bordô — cor principal
  marsala: "#6F1F2A",    // marsala escuro — secundária
  wineSoft: "rgba(143,45,58,0.10)",
  offWhite: "#FAF8F3",
  whiteSoft: "#FFFFFF",
  // aliases de compatibilidade (mantêm referências antigas funcionando)
  gold: "#8F2D3A",
  goldSoft: "rgba(143,45,58,0.10)",
};

// Link oficial do WhatsApp da clínica (fixo para toda a Jornada)
export const WHATSAPP_URL =
  "https://wa.me/5511980388999?text=" +
  encodeURIComponent("Clinica Dra Paloma Betoni, envie essa mensagem para ser atendida (o)");

// Número padrão mantido por compatibilidade (não é usado pelo link oficial)
export const DEFAULT_WHATSAPP = "5511980388999";

// ── Helper de chamadas ao backend do portal ──
export async function portalApi(action, payload = {}) {
  try {
    const res = await base44.functions.invoke("portalPaciente", { action, ...payload });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || "Erro de comunicação com o portal.";
    throw new Error(msg);
  }
}

// ── Link de WhatsApp (sempre o oficial da Jornada) ──
export function whatsappLink(_number, _message) {
  return WHATSAPP_URL;
}

// ── Abrir WhatsApp com registro prévio em DossieObservacao ──
export async function openWhatsapp(token, origem) {
  try {
    if (token) await portalApi("whatsapp_click", { token, origem: origem || "portal" });
  } catch (_) {}
  window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
}

// ── Mensagens contextuais (mantidas por compatibilidade) ──
export const WHATSAPP_MESSAGES = {
  duvida: "Olá, equipe da Dra. Paloma. Estou acessando minha Jornada da Beleza Natural.",
  agendar: "Olá, equipe da Dra. Paloma. Gostaria de agendar pela minha Jornada da Beleza Natural.",
  reagendar: "Olá, equipe da Dra. Paloma. Preciso reagendar um compromisso da minha Jornada da Beleza Natural.",
  foto: "Olá, equipe da Dra. Paloma. Vou enviar uma foto de evolução pela Jornada da Beleza Natural.",
  plano: "Olá, equipe da Dra. Paloma. Gostaria de falar sobre meu plano na Jornada da Beleza Natural.",
  valores: "Olá, equipe da Dra. Paloma. Gostaria de saber mais sobre valores pela Jornada da Beleza Natural.",
  consultora: "Olá, equipe da Dra. Paloma. Gostaria de falar com a consultora pela Jornada da Beleza Natural.",
  manutencao: "Olá, equipe da Dra. Paloma. Gostaria de agendar minha manutenção do Clube pela Jornada da Beleza Natural.",
};