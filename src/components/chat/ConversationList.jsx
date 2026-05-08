import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ConversationItem from "./ConversationItem";

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "hot", label: "Quente 🔴" },
  { value: "warm", label: "Morno 🟡" },
  { value: "cold", label: "Frio 🔵" },
  { value: "new", label: "Novos" },
  { value: "in_progress", label: "Em Atendimento" },
  { value: "scheduled", label: "Agendados" },
];

export default function ConversationList({
  conversations, activeId, onSelect, search, setSearch, filter, setFilter, totalUnread,
}) {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0F1521" }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "#1E2535" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "#E8EDF5" }}>Caixa de Entrada</h2>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "#4A5568" }}>
              {conversations.length} conversas
              {totalUnread > 0 && <span className="ml-1" style={{ color: "#4ADE80" }}>· {totalUnread} não lidas</span>}
            </p>
          </div>
          <Button size="sm" className="h-7 px-2 text-xs rounded-sm" style={{ backgroundColor: "#C5A059", color: "#111620" }}>
            <Plus className="h-3 w-3 mr-1" />Novo
          </Button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conversa..."
          className="w-full text-xs px-3 py-1.5 rounded-sm outline-none"
          style={{ backgroundColor: "#1A2030", border: "1px solid #252D3E", color: "#C8D0DF" }}
        />

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
              style={
                filter === f.value
                  ? { backgroundColor: "#C5A059", color: "#111620", borderColor: "#C5A059" }
                  : { backgroundColor: "transparent", color: "#5A6478", borderColor: "#252D3E" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm" style={{ color: "#4A5568" }}>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} isActive={activeId === conv.id} onClick={() => onSelect(conv)} />
          ))
        )}
      </div>
    </div>
  );
}