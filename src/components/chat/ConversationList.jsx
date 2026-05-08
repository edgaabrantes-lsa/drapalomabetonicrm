import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import ConversationItem from "./ConversationItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  conversations,
  activeId,
  onSelect,
  search,
  setSearch,
  filter,
  setFilter,
  totalUnread,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#F0F0F0] bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-base font-semibold text-[#121212]">Caixa de Entrada</h2>
            <p className="text-[10px] text-[#BBBBBB] uppercase tracking-wider">
              {conversations.length} conversas
              {totalUnread > 0 && <span className="ml-1 text-green-600">· {totalUnread} não lidas</span>}
            </p>
          </div>
          <Button size="sm" className="bg-[#121212] hover:bg-[#2a2a2a] text-white rounded-sm h-7 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Novo
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#BBBBBB]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-8 h-8 text-xs bg-[#F9F9F7] border-[#EEEEEE] rounded-sm placeholder:text-[#BBBBBB]"
          />
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                filter === f.value
                  ? "bg-[#121212] text-white border-[#121212]"
                  : "bg-white text-[#888] border-[#EEEEEE] hover:border-[#CCC]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-[#BBBBBB]">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeId === conv.id}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
}