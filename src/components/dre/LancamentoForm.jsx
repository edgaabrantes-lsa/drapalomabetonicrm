import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { DRE_TIPOS } from "@/lib/dreUtils";
import { format } from "date-fns";

export default function LancamentoForm({ lancamento, onSave, onClose }) {
  const [formData, setFormData] = useState(
    lancamento || {
      tipo: "despesa_fixa",
      categoria: "",
      descricao: "",
      valor: 0,
      data_vencimento: format(new Date(), "yyyy-MM-dd"),
      data_pagamento: "",
      status: "pendente",
      forma_pagamento: "pix",
      recorrencia: "unica",
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      data_fim: "",
      centro_custo: "clinical",
      observacoes: "",
    }
  );

  const { data: categorias = [] } = useQuery({
    queryKey: ["dreCategorias"],
    queryFn: () => base44.entities.DRECategoria.list(),
  });

  const categoriasFiltradas = categorias.filter(
    (c) => c.tipo === formData.tipo && c.status === "ativo"
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor) return;
    const data = { ...formData };
    if (formData.status === "pago" && !formData.data_pagamento) {
      data.data_pagamento = format(new Date(), "yyyy-MM-dd");
    }
    if (formData.recorrencia === "unica") {
      data.data_inicio = formData.data_vencimento;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Tipo *</Label>
          <Select value={formData.tipo} onValueChange={(v) => setFormData((p) => ({ ...p, tipo: v, categoria: "" }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              {Object.entries(DRE_TIPOS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Categoria</Label>
          <Select value={formData.categoria} onValueChange={(v) => setFormData((p) => ({ ...p, categoria: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              {categoriasFiltradas.map((c) => (
                <SelectItem key={c.id} value={c.nome} className="text-white">{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Descrição *</Label>
          <Input
            value={formData.descricao}
            onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Valor (R$) *</Label>
          <CurrencyInput
            value={formData.valor}
            onChange={(v) => setFormData((p) => ({ ...p, valor: v }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
          />
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="pendente" className="text-white">Pendente</SelectItem>
              <SelectItem value="pago" className="text-white">Pago</SelectItem>
              <SelectItem value="vencido" className="text-white">Vencido</SelectItem>
              <SelectItem value="cancelado" className="text-white">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Vencimento *</Label>
          <Input
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData((p) => ({ ...p, data_vencimento: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Data Pagamento</Label>
          <Input
            type="date"
            value={formData.data_pagamento || ""}
            onChange={(e) => setFormData((p) => ({ ...p, data_pagamento: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
          />
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Forma de Pagamento</Label>
          <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData((p) => ({ ...p, forma_pagamento: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="pix" className="text-white">PIX</SelectItem>
              <SelectItem value="dinheiro" className="text-white">Dinheiro</SelectItem>
              <SelectItem value="cartao_credito" className="text-white">Cartão Crédito</SelectItem>
              <SelectItem value="cartao_debito" className="text-white">Cartão Débito</SelectItem>
              <SelectItem value="transferencia" className="text-white">Transferência</SelectItem>
              <SelectItem value="boleto" className="text-white">Boleto</SelectItem>
              <SelectItem value="link_pagamento" className="text-white">Link de Pagamento</SelectItem>
              <SelectItem value="outro" className="text-white">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Recorrência</Label>
          <Select value={formData.recorrencia} onValueChange={(v) => setFormData((p) => ({ ...p, recorrencia: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="unica" className="text-white">Única</SelectItem>
              <SelectItem value="mensal" className="text-white">Mensal</SelectItem>
              <SelectItem value="anual" className="text-white">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.recorrencia !== "unica" && (
          <>
            <div>
              <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Início</Label>
              <Input
                type="date"
                value={formData.data_inicio || ""}
                onChange={(e) => setFormData((p) => ({ ...p, data_inicio: e.target.value }))}
                className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
              />
            </div>
            <div>
              <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Fim (opcional)</Label>
              <Input
                type="date"
                value={formData.data_fim || ""}
                onChange={(e) => setFormData((p) => ({ ...p, data_fim: e.target.value }))}
                className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
              />
            </div>
          </>
        )}
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Centro de Custo</Label>
          <Select value={formData.centro_custo} onValueChange={(v) => setFormData((p) => ({ ...p, centro_custo: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="clinical" className="text-white">Clínico</SelectItem>
              <SelectItem value="administrative" className="text-white">Administrativo</SelectItem>
              <SelectItem value="marketing" className="text-white">Marketing</SelectItem>
              <SelectItem value="infrastructure" className="text-white">Infraestrutura</SelectItem>
              <SelectItem value="personnel" className="text-white">Pessoal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Observações</Label>
          <Textarea
            value={formData.observacoes || ""}
            onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
        <Button type="submit" className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black">
          {lancamento ? "Salvar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}