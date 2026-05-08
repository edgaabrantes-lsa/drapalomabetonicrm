import { useState, useCallback } from "react";

const MOCK_MESSAGES = {
  conv_1: [
    { id: "m1", sender_type: "lead", sender_name: "Marcos Almeida", message_type: "text", content: "Olá, gostaria de saber mais sobre harmonização facial.", timestamp: new Date(Date.now() - 25 * 60000).toISOString(), status: "read" },
    { id: "m2", sender_type: "staff", sender_name: "Clínica", message_type: "text", content: "Olá, Marcos! Seja bem-vindo! 😊 A harmonização facial é um dos procedimentos mais procurados aqui na clínica. Posso agendar uma avaliação gratuita com a Dra. Paloma para você?", timestamp: new Date(Date.now() - 20 * 60000).toISOString(), status: "read" },
    { id: "m3", sender_type: "lead", sender_name: "Marcos Almeida", message_type: "text", content: "Sim, gostaria! Mas antes queria saber o preço.", timestamp: new Date(Date.now() - 10 * 60000).toISOString(), status: "read" },
    { id: "m4", sender_type: "lead", sender_name: "Marcos Almeida", message_type: "text", content: "Gostaria de saber o valor da harmonização", timestamp: new Date(Date.now() - 5 * 60000).toISOString(), status: "delivered" },
  ],
  conv_2: [
    { id: "m5", sender_type: "lead", sender_name: "Juliana Prado", message_type: "text", content: "Oi! Vi o perfil de vocês no Instagram e achei incrível!", timestamp: new Date(Date.now() - 60 * 60000).toISOString(), status: "read" },
    { id: "m6", sender_type: "staff", sender_name: "Clínica", message_type: "text", content: "Olá, Juliana! Que alegria receber seu contato! 💛 Em que posso te ajudar?", timestamp: new Date(Date.now() - 55 * 60000).toISOString(), status: "read" },
    { id: "m7", sender_type: "lead", sender_name: "Juliana Prado", message_type: "text", content: "Vocês fazem avaliação antes do procedimento?", timestamp: new Date(Date.now() - 30 * 60000).toISOString(), status: "delivered" },
  ],
  conv_3: [
    { id: "m8", sender_type: "lead", sender_name: "Fernanda Lima", message_type: "text", content: "Boa tarde! Encontrei a clínica pelo Google.", timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), status: "read" },
    { id: "m9", sender_type: "staff", sender_name: "Clínica", message_type: "text", content: "Boa tarde, Fernanda! Seja bem-vinda! Como posso ajudar?", timestamp: new Date(Date.now() - 2.8 * 3600000).toISOString(), status: "read" },
    { id: "m10", sender_type: "lead", sender_name: "Fernanda Lima", message_type: "text", content: "Gostaria de agendar uma avaliação com a Dra. Paloma.", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), status: "read" },
    { id: "m11", sender_type: "staff", sender_name: "Clínica", message_type: "text", content: "Perfeito! Tenho horários disponíveis na terça e quinta. Qual prefere?", timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), status: "read" },
  ],
  conv_4: [
    { id: "m12", sender_type: "lead", sender_name: "Beatriz Castro", message_type: "text", content: "Olá! Quero muito fazer o preenchimento labial.", timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), status: "read" },
    { id: "m13", sender_type: "lead", sender_name: "Beatriz Castro", message_type: "text", content: "Qual o valor do preenchimento labial?", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), status: "read" },
    { id: "m14", sender_type: "lead", sender_name: "Beatriz Castro", message_type: "text", content: "Vocês trabalham com ácido hialurônico?", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), status: "delivered" },
  ],
  conv_5: [
    { id: "m15", sender_type: "lead", sender_name: "Camila Rocha", message_type: "text", content: "Oi! Uma amiga me indicou a clínica.", timestamp: new Date(Date.now() - 25 * 3600000).toISOString(), status: "read" },
    { id: "m16", sender_type: "lead", sender_name: "Camila Rocha", message_type: "text", content: "Tenho interesse em botox, mas nunca fiz.", timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), status: "read" },
  ],
  conv_6: [
    { id: "m17", sender_type: "lead", sender_name: "Renata Alves", message_type: "text", content: "Olá! Vi os resultados no Instagram e fiquei encantada.", timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), status: "read" },
    { id: "m18", sender_type: "staff", sender_name: "Clínica", message_type: "text", content: "Renata, que lindo! Fico feliz que gostou dos resultados! Quer saber mais sobre algum procedimento específico?", timestamp: new Date(Date.now() - 2 * 24 * 3600000 + 5 * 60000).toISOString(), status: "read" },
  ],
};

export function useMessages(conversationId) {
  const [messages, setMessages] = useState(conversationId ? (MOCK_MESSAGES[conversationId] || []) : []);
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(async (content, type = "text") => {
    if (!content.trim()) return;
    setSending(true);
    const newMsg = {
      id: `m_${Date.now()}`,
      sender_type: "staff",
      sender_name: "Clínica",
      message_type: type,
      content,
      timestamp: new Date().toISOString(),
      status: "sent",
    };
    setMessages((prev) => [...prev, newMsg]);
    // Simula confirmação de entrega após 1s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: "delivered" } : m)
      );
    }, 1000);
    setSending(false);
  }, []);

  const loadMessages = useCallback((convId) => {
    setMessages(MOCK_MESSAGES[convId] || []);
  }, []);

  return { messages, sending, sendMessage, loadMessages };
}