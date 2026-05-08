import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap } from "lucide-react";

const DEFAULT_QUICK_REPLIES = [
  { id: "qr1", category: "Saudação", title: "Saudação Inicial", content: "Olá! Seja bem-vindo(a) à Clínica Dra. Paloma Bettoni 💛 Sou a assistente virtual da clínica. Como posso te ajudar hoje?" },
  { id: "qr2", category: "Agendamento", title: "Agendar Avaliação", content: "Que ótimo! Posso verificar os horários disponíveis para sua avaliação com a Dra. Paloma. Você prefere manhã ou tarde? E qual seria o melhor dia da semana para você?" },
  { id: "qr3", category: "Localização", title: "Enviar Localização", content: "Estamos localizados na Rua [Endereço]. Funcionamos de segunda a sexta das 9h às 18h, e aos sábados das 9h às 13h. Fica fácil de encontrar! 📍" },
  { id: "qr4", category: "Procedimento", title: "Harmonização Facial", content: "A harmonização facial é um conjunto de procedimentos minimamente invasivos que visam equilibrar e realçar a beleza natural do rosto. A Dra. Paloma realiza uma avaliação completa para identificar os melhores procedimentos para você. Quer agendar sua avaliação gratuita?" },
  { id: "qr5", category: "Procedimento", title: "Preenchimento Labial", content: "O preenchimento labial com ácido hialurônico é um dos procedimentos mais procurados! Ele define o contorno, aumenta o volume e hidrata os lábios de forma natural. O resultado dura entre 6 a 12 meses. Gostaria de saber mais ou agendar uma avaliação?" },
  { id: "qr6", category: "Procedimento", title: "Sobre Botox", content: "O Botox (toxina botulínica) é uma aplicação rápida, segura e com resultado incrível para suavizar linhas de expressão. É indicado para área da testa, entre as sobrancelhas e ao redor dos olhos. O efeito dura entre 4 a 6 meses. Posso tirar mais dúvidas para você?" },
  { id: "qr7", category: "Objeção", title: "Quebra de Objeção Preço", content: "Entendo que o investimento é uma consideração importante! Na Clínica Dra. Paloma, trabalhamos com produtos de primeira linha e um atendimento altamente personalizado. Oferecemos condições de pagamento flexíveis. Posso apresentar as opções disponíveis?" },
  { id: "qr8", category: "Follow-up", title: "Follow-up Pós-orçamento", content: "Olá! Tudo bem? Queria saber se ficou alguma dúvida sobre o orçamento que enviamos. Estamos à disposição para conversar! 😊" },
  { id: "qr9", category: "Reativação", title: "Reativação de Lead", content: "Olá! Faz um tempo que não nos falamos. Tudo bem com você? Gostaria de compartilhar algumas novidades incríveis sobre os tratamentos aqui na clínica. Você ainda tem interesse em agendar sua avaliação?" },
  { id: "qr10", category: "Confirmação", title: "Confirmar Horário", content: "Sua consulta está confirmada para [DIA] às [HORA] com a Dra. Paloma Bettoni. Por favor, chegue com 10 minutos de antecedência. Caso precise reagendar, entre em contato conosco. Até lá! 🗓️" },
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
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#EEEEEE] rounded-sm shadow-xl z-50 max-h-80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
          <span className="text-xs font-semibold text-[#121212]">Respostas Rápidas</span>
        </div>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
          <X className="h-3 w-3 text-[#888]" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#F0F0F0]">
        <input
          placeholder="Buscar resposta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-[#F9F9F7] border border-[#EEEEEE] rounded-sm px-2 py-1.5 outline-none focus:border-[#121212]"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto border-b border-[#F0F0F0]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
              activeCategory === cat ? "bg-[#121212] text-white border-[#121212]" : "text-[#888] border-[#EEEEEE]"
            }`}
          >
            {cat === "all" ? "Todas" : cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {filtered.map((reply) => (
          <button
            key={reply.id}
            onClick={() => { onSelect(reply.content); onClose(); }}
            className="w-full text-left px-4 py-2.5 hover:bg-[#F9F9F7] border-b border-[#F5F5F5] last:border-0 transition-colors"
          >
            <p className="text-xs font-medium text-[#121212] mb-0.5">{reply.title}</p>
            <p className="text-[11px] text-[#888] line-clamp-1">{reply.content}</p>
          </button>
        ))}
      </div>
    </div>
  );
}