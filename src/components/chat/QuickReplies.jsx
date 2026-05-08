import React, { useState } from "react";
import { X, Zap } from "lucide-react";

const DEFAULT_QUICK_REPLIES = [
  { id: "qr1", category: "Saudação", title: "Saudação Inicial", content: "Olá! Seja bem-vindo(a) à Clínica Dra. Paloma Bettoni 💛 Sou a assistente virtual da clínica. Como posso te ajudar hoje?" },
  { id: "qr2", category: "Agendamento", title: "Agendar Avaliação", content: "Que ótimo! Posso verificar os horários disponíveis para sua avaliação com a Dra. Paloma. Você prefere manhã ou tarde? E qual seria o melhor dia da semana para você?" },
  { id: "qr3", category: "Localização", title: "Enviar Localização", content: "Estamos localizados na Rua [Endereço]. Funcionamos de segunda a sexta das 9h às 18h, e aos sábados das 9h às 13h. Fica fácil de encontrar! 📍" },
  { id: "qr4", category: "Procedimento", title: "Harmonização Facial", content: "A harmonização facial é um conjunto de procedimentos minimamente invasivos que visam equilibrar e realçar a beleza natural do rosto. A Dra. Paloma realiza uma avaliação completa para identificar os melhores procedimentos para você. Quer agendar sua avaliação gratuita?" },
  { id: "qr5", category: "Procedimento", title: "Preenchimento Labial", content: "O preenchimento labial com ácido hialurônico é um dos procedimentos mais procurados! Ele define o contorno, aumenta o volume e hidrata os lábios de forma natural. O resultado dura entre 6 a 12 meses." },
  { id: "qr6", category: "Procedimento", title: "Sobre Botox", content: "O Botox é uma aplicação rápida, segura e com resultado incrível para suavizar linhas de expressão. O efeito dura entre 4 a 6 meses. Posso tirar mais dúvidas para você?" },
  { id: "qr7", category: "Objeção", title: "Quebra de Objeção", content: "Entendo que o investimento é uma consideração importante! Na Clínica Dra. Paloma, trabalhamos com produtos de primeira linha e atendimento altamente personalizado. Oferecemos condições de pagamento flexíveis." },
  { id: "qr8", category: "Follow-up", title: "Follow-up Pós-orçamento", content: "Olá! Tudo bem? Queria saber se ficou alguma dúvida sobre o orçamento que enviamos. Estamos à disposição para conversar! 😊" },
  { id: "qr9", category: "Reativação", title: "Reativação de Lead", content: "Olá! Faz um tempo que não nos falamos. Tudo bem com você? Gostaria de compartilhar algumas novidades incríveis sobre os tratamentos aqui na clínica." },
  { id: "qr10", category: "Confirmação", title: "Confirmar Horário", content: "Sua consulta está confirmada para [DIA] às [HORA] com a Dra. Paloma Bettoni. Por favor, chegue com 10 minutos de antecedência. Até lá! 🗓️" },
];

export default function QuickReplies({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = ["all", ...new Set(DEFAULT_QUICK_REPLIES.map((r) => r.category))];
  const filtered = DEFAULT_QUICK_REPLIES.filter((r) => {
    const matchCat = activeCategory === "all" || r.category === activeCategory;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-sm shadow-2xl z-50 max-h-80 flex flex-col border"
      style={{ backgroundColor: "#171D29", borderColor: "#252D3E" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "#1E2535" }}>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" style={{ color: "#C5A059" }} />
          <span className="text-xs font-semibold" style={{ color: "#E8EDF5" }}>Respostas Rápidas</span>
        </div>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="h-3.5 w-3.5" style={{ color: "#5A6478" }} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b" style={{ borderColor: "#1A2030" }}>
        <input
          placeholder="Buscar resposta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded-sm outline-none"
          style={{ backgroundColor: "#1A2030", border: "1px solid #252D3E", color: "#C8D0DF" }}
          onFocus={(e) => e.target.style.borderColor = "#C5A059"}
          onBlur={(e) => e.target.style.borderColor = "#252D3E"}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto border-b" style={{ borderColor: "#1A2030" }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-all"
            style={activeCategory === cat
              ? { backgroundColor: "#C5A059", color: "#111620", borderColor: "#C5A059" }
              : { backgroundColor: "transparent", color: "#5A6478", borderColor: "#252D3E" }
            }>
            {cat === "all" ? "Todas" : cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {filtered.map((reply) => (
          <button key={reply.id} onClick={() => { onSelect(reply.content); onClose(); }}
            className="w-full text-left px-4 py-2.5 border-b last:border-0 transition-colors hover:bg-white/4"
            style={{ borderColor: "#1A2030" }}>
            <p className="text-xs font-medium mb-0.5" style={{ color: "#E8EDF5" }}>{reply.title}</p>
            <p className="text-[11px] truncate" style={{ color: "#5A6478" }}>{reply.content}</p>
          </button>
        ))}
      </div>
    </div>
  );
}