import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { format } from "date-fns";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ANOS = [2024, 2025, 2026, 2027];

export default function DREFilters({ filters, setFilters }) {
  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list(),
  });

  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      style={{
        backgroundColor: "#1A1A1A",
        border: "1px solid #2B2B2B",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div className="flex items-center" style={{ marginBottom: 12, gap: 8 }}>
        <Filter style={{ width: 14, height: 14, color: "#C8A96A" }} />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666" }}>
          Filtros
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Período */}
        <div>
          <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Período</Label>
          <Select value={filters.periodo} onValueChange={(v) => update("periodo", v)}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="mensal" className="text-white">Mensal</SelectItem>
              <SelectItem value="anual" className="text-white">Anual</SelectItem>
              <SelectItem value="custom" className="text-white">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mês */}
        {filters.periodo !== "anual" && filters.periodo !== "custom" && (
          <div>
            <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Mês</Label>
            <Select value={String(filters.mes ?? new Date().getMonth())} onValueChange={(v) => update("mes", parseInt(v))}>
              <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={String(i)} className="text-white">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ano */}
        {filters.periodo !== "custom" && (
          <div>
            <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Ano</Label>
            <Select value={String(filters.ano || new Date().getFullYear())} onValueChange={(v) => update("ano", parseInt(v))}>
              <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
                {ANOS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom dates */}
        {filters.periodo === "custom" && (
          <>
            <div>
              <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Data Início</Label>
              <Input
                type="date"
                value={filters.data_inicio || ""}
                onChange={(e) => update("data_inicio", e.target.value)}
                className="bg-[#121212] border-[#2B2B2B] text-white"
                style={{ height: 34, fontSize: 13 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Data Fim</Label>
              <Input
                type="date"
                value={filters.data_fim || ""}
                onChange={(e) => update("data_fim", e.target.value)}
                className="bg-[#121212] border-[#2B2B2B] text-white"
                style={{ height: 34, fontSize: 13 }}
              />
            </div>
          </>
        )}

        {/* Procedimento */}
        <div>
          <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Procedimento</Label>
          <Select value={filters.procedimento || "all"} onValueChange={(v) => update("procedimento", v)}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {procedures.map((p) => (
                <SelectItem key={p.id} value={p.name} className="text-white">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profissional */}
        <div>
          <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Profissional</Label>
          <Select value={filters.profissional || "all"} onValueChange={(v) => update("profissional", v)}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-white">{p.name || p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>Status Pagamento</Label>
          <Select value={filters.status || "all"} onValueChange={(v) => update("status", v)}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="paid" className="text-white">Pago</SelectItem>
              <SelectItem value="pending" className="text-white">Pendente</SelectItem>
              <SelectItem value="overdue" className="text-white">Vencido</SelectItem>
              <SelectItem value="cancelled" className="text-white">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}