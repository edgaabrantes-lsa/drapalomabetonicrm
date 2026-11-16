import React, { useState } from "react";
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
import NovaCategoriaInline from "./NovaCategoriaInline";

const labelStyle = { fontSize: 12, color: "#B0B0B0" };
const fieldStyle = { height: 36 };

const CLASSIFICACAO_ENTRADA = ["receita", "deducoes"];
const CLASSIFICACAO_SAIDA = ["custo_direto", "despesa_fixa", "despesa_variavel", "outra_despesa"];

export default function LancamentoForm({ lancamento, onSave, onClose }) {
  const [formData, setFormData] = useState(
    lancamento || {
      tipo: "receita",
      categoria: "",
      descricao: "",
      fornecedor: "",
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
  const [parcelas, setParcelas] = useState(2);
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const isEntrada = formData.tipo === "receita";

  const { data: categorias = [] } = useQuery({
    queryKey: ["dreCategorias"],
    queryFn: () => base44.entities.DRECategoria.list(),
  });

  const categoriasFiltradas = categorias.filter(
    (c) => c.tipo === formData.tipo && c.status === "ativo"
  );

  const setMovimento = (mov) => {
    if (mov === "entrada") {
      setFormData((p) => ({ ...p, tipo: "receita", categoria: "" }));
    } else {
      setFormData((p) => ({ ...p, tipo: "despesa_fixa", categoria: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.descricao?.trim() || !Number(formData.valor)) return;
    const data = { ...formData };
    if (data.status === "pago" && !data.data_pagamento) {
      data.data_pagamento = format(new Date(), "yyyy-MM-dd");
    }
    if (data.recorrencia === "unica") data.data_inicio = data.data_vencimento;
    onSave(data, { parcelas: data.recorrencia === "parcelada" ? Number(parcelas) || 1 : 0 });
  };

  const classificacoes = isEntrada ? CLASSIFICACAO_ENTRADA : CLASSIFICACAO_SAIDA;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
      {/* Entrada / Saída */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "entrada", label: "ENTRADA", hint: "Dinheiro a receber ou recebido" },
          { key: "saida", label: "SAÍDA", hint: "Dinheiro a pagar ou pago" },
        ].map((op) => {
          const ativo = (op.key === "entrada") === isEntrada;
          return (
            <button
              key={op.key}
              type="button"
              onClick={() => setMovimento(op.key)}
              style={{
                padding: "14px 12px",
                borderRadius: 8,
                border: `1px solid ${ativo ? "#C8A96A" : "#2B2B2B"}`,
                backgroundColor: ativo ? "rgba(200,169,106,0.12)" : "#121212",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: ativo ? "#C8A96A" : "#B0B0B0", margin: 0 }}>
                {op.label}
              </p>
              <p style={{ fontSize: 10, color: "#666666", marginTop: 2 }}>{op.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label style={labelStyle}>Descrição *</Label>
          <Input
            value={formData.descricao}
            onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
            placeholder={isEntrada ? "Ex.: Procedimento — paciente Ana" : "Ex.: Fatura fornecedor Allergan"}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            style={fieldStyle}
            required
          />
        </div>

        <div>
          <Label style={labelStyle}>Valor (R$) *</Label>
          <CurrencyInput
            value={formData.valor}
            onChange={(v) => setFormData((p) => ({ ...p, valor: v }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
          />
        </div>

        <div>
          <Label style={labelStyle}>{isEntrada ? "Origem do recebimento" : "Fornecedor"}</Label>
          <Input
            value={formData.fornecedor || ""}
            onChange={(e) => setFormData((p) => ({ ...p, fornecedor: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            style={fieldStyle}
          />
        </div>

        <div>
          <Label style={labelStyle}>Categoria</Label>
          <Select
            value={formData.categoria}
            onValueChange={(v) => {
              if (v === "__nova__") { setCriandoCategoria(true); return; }
              setFormData((p) => ({ ...p, categoria: v }));
            }}
          >
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={fieldStyle}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              {categoriasFiltradas.map((c) => (
                <SelectItem key={c.id} value={c.nome} className="text-white">{c.nome}</SelectItem>
              ))}
              <SelectItem value="__nova__" className="text-[#C8A96A]">+ Adicionar nova categoria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label style={labelStyle}>Classificação gerencial (DRE)</Label>
          <Select value={formData.tipo} onValueChange={(v) => setFormData((p) => ({ ...p, tipo: v, categoria: "" }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={fieldStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              {classificacoes.map((k) => (
                <SelectItem key={k} value={k} className="text-white">{DRE_TIPOS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {criandoCategoria && (
          <div className="col-span-2">
            <NovaCategoriaInline
              tipo={formData.tipo}
              categorias={categorias}
              onCreated={(cat) => {
                setFormData((p) => ({ ...p, categoria: cat.nome, categoria_id: cat.id }));
                setCriandoCategoria(false);
              }}
              onCancel={() => setCriandoCategoria(false)}
            />
          </div>
        )}

        <div>
          <Label style={labelStyle}>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}
          >
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={fieldStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="pendente" className="text-white">Pendente</SelectItem>
              <SelectItem value="pago" className="text-white">{isEntrada ? "Recebido" : "Pago"}</SelectItem>
              <SelectItem value="cancelado" className="text-white">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label style={labelStyle}>Vencimento *</Label>
          <Input
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData((p) => ({ ...p, data_vencimento: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            style={fieldStyle}
            required
          />
        </div>

        <div>
          <Label style={labelStyle}>{isEntrada ? "Data do recebimento" : "Data do pagamento"}</Label>
          <Input
            type="date"
            value={formData.data_pagamento || ""}
            onChange={(e) => setFormData((p) => ({ ...p, data_pagamento: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            style={fieldStyle}
          />
        </div>

        <div>
          <Label style={labelStyle}>Forma de pagamento</Label>
          <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData((p) => ({ ...p, forma_pagamento: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={fieldStyle}>
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
          <Label style={labelStyle}>Recorrência</Label>
          <Select value={formData.recorrencia} onValueChange={(v) => setFormData((p) => ({ ...p, recorrencia: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={fieldStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="unica" className="text-white">Única</SelectItem>
              <SelectItem value="mensal" className="text-white">Mensal</SelectItem>
              <SelectItem value="anual" className="text-white">Anual</SelectItem>
              <SelectItem value="parcelada" className="text-white">Parcelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.recorrencia === "parcelada" && (
          <div>
            <Label style={labelStyle}>Número de parcelas</Label>
            <Input
              type="number"
              min={2}
              max={60}
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
              className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
              style={fieldStyle}
            />
            <p style={{ fontSize: 10, color: "#555555", marginTop: 4 }}>
              A 1ª parcela vence na data de vencimento acima; as demais a cada 30 dias.
            </p>
          </div>
        )}

        {(formData.recorrencia === "mensal" || formData.recorrencia === "anual") && (
          <div>
            <Label style={labelStyle}>Fim da recorrência (opcional)</Label>
            <Input
              type="date"
              value={formData.data_fim || ""}
              onChange={(e) => setFormData((p) => ({ ...p, data_fim: e.target.value }))}
              className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
              style={fieldStyle}
            />
          </div>
        )}

        <div>
          <Label style={labelStyle}>Centro de custo</Label>
          <Select value={formData.centro_custo} onValueChange={(v) => setFormData((p) => ({ ...p, centro_custo: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={fieldStyle}>
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
          <Label style={labelStyle}>Observações</Label>
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