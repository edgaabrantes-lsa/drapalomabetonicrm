import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, Syringe, Star, DollarSign, Package,
  FileText, CheckCircle, Plus, Minus, Search, CreditCard, Banknote,
  Smartphone, Building, Receipt, Calculator, AlertCircle, User
} from "lucide-react";

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix", icon: Smartphone, fee: 0 },
  { value: "cash", label: "Dinheiro", icon: Banknote, fee: 0 },
  { value: "debit_card", label: "Débito", icon: CreditCard, fee: 1.99 },
  { value: "credit_card", label: "Crédito à Vista", icon: CreditCard, fee: 3.49 },
  { value: "installments", label: "Crédito Parcelado", icon: CreditCard, fee: null },
  { value: "transfer", label: "Transferência", icon: Building, fee: 0 },
  { value: "boleto", label: "Boleto", icon: Receipt, fee: 2.5 },
  { value: "link", label: "Link de Pagamento", icon: Smartphone, fee: 3.49 },
];

const INSTALLMENT_FEES = {
  2: 5.5, 3: 6.5, 4: 7.5, 5: 8.5, 6: 9.5,
  7: 10.5, 8: 11.0, 9: 11.5, 10: 12.0, 11: 12.5, 12: 13.5
};

const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

// ─── STEP INDICATOR ────────────────────────────────────────────────────────────
const StepBar = ({ currentStep, steps }) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i < currentStep ? "bg-[#C5A059] text-black" :
            i === currentStep ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]" :
            "bg-[#1e1e2a] text-gray-500 border border-[#252D3E]"
          }`}>
            {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === currentStep ? "text-[#C5A059]" : "text-gray-500"}`}>
            {step}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={`h-px flex-1 mx-3 ${i < currentStep ? "bg-[#C5A059]/50" : "bg-[#252D3E]"}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── STEP 1: TIPO ──────────────────────────────────────────────────────────────
const StepTipo = ({ onSelect }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-serif text-white mb-2">Selecione o Tipo de Tratamento</h2>
      <p className="text-gray-400 text-sm">Escolha entre um procedimento avulso ou um protocolo premium personalizado</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button
        onClick={() => onSelect("procedure")}
        className="group p-8 rounded-xl border border-[#252D3E] hover:border-[#C5A059]/60 bg-[#141820] hover:bg-[#C5A059]/5 transition-all text-left"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Syringe className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Procedimento</h3>
            <p className="text-xs text-gray-500">Avulso / Individual</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Um único procedimento estético realizado na sessão. Ideal para tratamentos pontuais.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[#C5A059]">
          <span className="text-xs font-medium">Selecionar</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      <button
        onClick={() => onSelect("protocol")}
        className="group p-8 rounded-xl border border-[#252D3E] hover:border-[#C5A059]/60 bg-[#141820] hover:bg-[#C5A059]/5 transition-all text-left"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20">
            <Star className="h-6 w-6 text-[#C5A059]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Protocolo Premium</h3>
            <p className="text-xs text-gray-500">Combo Estratégico</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Combinação de múltiplos procedimentos com desconto especial. Resultado superior e mais completo.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[#C5A059]">
          <span className="text-xs font-medium">Selecionar</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  </div>
);

// ─── STEP 2A: SELECIONAR PROCEDIMENTO ─────────────────────────────────────────
const StepProcedure = ({ onSelect, selection, onUpdateSelection }) => {
  const [search, setSearch] = useState("");
  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list("name", 100),
  });

  const filtered = procedures.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = selection.procedure;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-white mb-1">Selecione o Procedimento</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar procedimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#1a1a25] border-[#252D3E] text-white"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map(proc => (
          <button
            key={proc.id}
            onClick={() => onUpdateSelection({ procedure: proc, customValue: proc.price, qty: 1 })}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selected?.id === proc.id
                ? "border-[#C5A059] bg-[#C5A059]/10"
                : "border-[#252D3E] bg-[#141820] hover:border-[#C5A059]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white text-sm">{proc.name}</p>
                {proc.description && <p className="text-xs text-gray-500 mt-0.5">{proc.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-[#C5A059] font-semibold text-sm">
                  {proc.price ? `R$ ${proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Sob consulta"}
                </p>
                {proc.duration_minutes && (
                  <p className="text-xs text-gray-500">{proc.duration_minutes} min</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-[#1a1a25] rounded-lg border border-[#C5A059]/20 space-y-3">
          <h4 className="text-sm font-medium text-[#C5A059]">Detalhes do Procedimento</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Valor (editável)</Label>
              <Input
                type="number"
                value={selection.customValue || ""}
                onChange={(e) => onUpdateSelection({ ...selection, customValue: parseFloat(e.target.value) || 0 })}
                className="bg-[#12121a] border-[#252D3E] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Quantidade / ml</Label>
              <Input
                type="number"
                value={selection.qty || 1}
                onChange={(e) => onUpdateSelection({ ...selection, qty: parseFloat(e.target.value) || 1 })}
                className="bg-[#12121a] border-[#252D3E] text-white mt-1"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Regiões Tratadas</Label>
            <Input
              placeholder="Ex: labial superior, malar direito..."
              value={selection.regions || ""}
              onChange={(e) => onUpdateSelection({ ...selection, regions: e.target.value })}
              className="bg-[#12121a] border-[#252D3E] text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Observações Clínicas</Label>
            <Textarea
              placeholder="Notas importantes sobre este procedimento..."
              value={selection.notes || ""}
              onChange={(e) => onUpdateSelection({ ...selection, notes: e.target.value })}
              className="bg-[#12121a] border-[#252D3E] text-white mt-1"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STEP 2B: BUILDER DE PROTOCOLO ────────────────────────────────────────────
const StepProtocol = ({ selection, onUpdateSelection }) => {
  const [search, setSearch] = useState("");
  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list("name", 100),
  });

  const selectedItems = selection.protocolItems || [];
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.customValue || item.price || 0), 0);
  const discountPct = selectedItems.length >= 4 ? 15 : selectedItems.length >= 2 ? 10 : 0;
  const discountValue = subtotal * (discountPct / 100);
  const finalValue = subtotal - discountValue;

  const toggleItem = (proc) => {
    const exists = selectedItems.find(i => i.id === proc.id);
    let updated;
    if (exists) {
      updated = selectedItems.filter(i => i.id !== proc.id);
    } else {
      updated = [...selectedItems, { ...proc, customValue: proc.price || 0 }];
    }
    onUpdateSelection({
      ...selection,
      protocolItems: updated,
      finalValue,
      discountPct
    });
  };

  const updateItemValue = (id, val) => {
    const updated = selectedItems.map(i => i.id === id ? { ...i, customValue: parseFloat(val) || 0 } : i);
    onUpdateSelection({ ...selection, protocolItems: updated });
  };

  const filtered = procedures.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-serif text-white mb-1">Monte o Protocolo Premium</h2>
          <p className="text-sm text-gray-400">Selecione múltiplos procedimentos para criar um combo</p>
        </div>
        {discountPct > 0 && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
            {discountPct}% de desconto
          </Badge>
        )}
      </div>

      {/* Summary */}
      {selectedItems.length > 0 && (
        <div className="p-4 bg-[#0d1017] border border-[#C5A059]/20 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Subtotal ({selectedItems.length} procedimentos)</span>
            <span className="text-white">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-emerald-400">Desconto pacote</span>
              <span className="text-emerald-400">-R$ {discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-semibold border-t border-[#252D3E] pt-2 mt-2">
            <span className="text-[#C5A059]">Valor Final</span>
            <span className="text-xl text-[#C5A059]">R$ {(finalValue > 0 ? finalValue : subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar procedimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#1a1a25] border-[#252D3E] text-white"
        />
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {filtered.map(proc => {
          const isSelected = selectedItems.find(i => i.id === proc.id);
          return (
            <div
              key={proc.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isSelected ? "border-[#C5A059]/50 bg-[#C5A059]/5" : "border-[#252D3E] bg-[#141820]"
              }`}
            >
              <Checkbox
                checked={!!isSelected}
                onCheckedChange={() => toggleItem(proc)}
                className="border-[#C5A059]/40"
              />
              <div className="flex-1">
                <p className="text-sm text-white">{proc.name}</p>
              </div>
              {isSelected ? (
                <Input
                  type="number"
                  value={isSelected.customValue || 0}
                  onChange={(e) => updateItemValue(proc.id, e.target.value)}
                  className="w-28 bg-[#12121a] border-[#252D3E] text-[#C5A059] text-right"
                />
              ) : (
                <span className="text-sm text-gray-400">
                  {proc.price ? `R$ ${proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400 text-xs">Nome do Protocolo</Label>
          <Input
            placeholder="Ex: Full Face Premium"
            value={selection.protocolName || ""}
            onChange={(e) => onUpdateSelection({ ...selection, protocolName: e.target.value })}
            className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">Desconto Adicional (%)</Label>
          <Input
            type="number"
            placeholder="0"
            value={selection.extraDiscount || ""}
            onChange={(e) => onUpdateSelection({ ...selection, extraDiscount: parseFloat(e.target.value) || 0 })}
            className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-400 text-xs">Observações do Protocolo</Label>
        <Textarea
          placeholder="Indicações, contraindicações, notas clínicas..."
          value={selection.notes || ""}
          onChange={(e) => onUpdateSelection({ ...selection, notes: e.target.value })}
          className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          rows={2}
        />
      </div>
    </div>
  );
};

// ─── STEP 3: PAGAMENTO ─────────────────────────────────────────────────────────
const StepPayment = ({ totalValue, payment, onUpdate }) => {
  const method = PAYMENT_METHODS.find(m => m.value === payment.method);
  const isInstallment = payment.method === "installments";
  const installments = payment.installments || 2;
  const feeRate = isInstallment ? (payment.customFee ?? INSTALLMENT_FEES[installments] ?? 9) : (payment.customFee ?? (method?.fee || 0));
  const feeAmount = totalValue * (feeRate / 100);
  const netValue = totalValue - feeAmount;
  const installmentValue = isInstallment ? totalValue / installments : 0;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif text-white mb-1">Forma de Pagamento</h2>

      {/* Total */}
      <div className="p-4 bg-[#0d1017] border border-[#C5A059]/20 rounded-lg flex items-center justify-between">
        <span className="text-gray-400 text-sm">Valor Total do Tratamento</span>
        <span className="text-2xl font-bold text-[#C5A059]">
          R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Métodos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PAYMENT_METHODS.map(m => (
          <button
            key={m.value}
            onClick={() => onUpdate({ ...payment, method: m.value, installments: 2, customFee: null })}
            className={`p-3 rounded-lg border text-left transition-all ${
              payment.method === m.value
                ? "border-[#C5A059] bg-[#C5A059]/10"
                : "border-[#252D3E] bg-[#141820] hover:border-[#C5A059]/40"
            }`}
          >
            <m.icon className={`h-5 w-5 mb-1 ${payment.method === m.value ? "text-[#C5A059]" : "text-gray-500"}`} />
            <p className={`text-xs font-medium ${payment.method === m.value ? "text-[#C5A059]" : "text-gray-300"}`}>
              {m.label}
            </p>
            {m.fee > 0 && <p className="text-xs text-gray-500">{m.fee}%</p>}
          </button>
        ))}
      </div>

      {/* Parcelamento */}
      {isInstallment && (
        <div className="p-4 bg-[#1a1a25] border border-[#252D3E] rounded-lg space-y-3">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#C5A059]" />
            Configurar Parcelamento
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Parcelas</Label>
              <Select
                value={String(installments)}
                onValueChange={(v) => onUpdate({ ...payment, installments: parseInt(v), customFee: null })}
              >
                <SelectTrigger className="bg-[#12121a] border-[#252D3E] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#252D3E]">
                  {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
                    <SelectItem key={n} value={String(n)} className="text-white">
                      {n}x — R$ {(totalValue / n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Bandeira do Cartão</Label>
              <Select
                value={payment.cardBrand || "Visa"}
                onValueChange={(v) => onUpdate({ ...payment, cardBrand: v })}
              >
                <SelectTrigger className="bg-[#12121a] border-[#252D3E] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#252D3E]">
                  {CARD_BRANDS.map(b => (
                    <SelectItem key={b} value={b} className="text-white">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Taxa (%)</Label>
              <Input
                type="number"
                value={payment.customFee ?? INSTALLMENT_FEES[installments] ?? 9}
                onChange={(e) => onUpdate({ ...payment, customFee: parseFloat(e.target.value) || 0 })}
                className="bg-[#12121a] border-[#252D3E] text-white mt-1"
                step="0.1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">1ª Parcela em</Label>
              <Input
                type="date"
                value={payment.firstDueDate || ""}
                onChange={(e) => onUpdate({ ...payment, firstDueDate: e.target.value })}
                className="bg-[#12121a] border-[#252D3E] text-white mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Operadora</Label>
            <Input
              placeholder="Ex: Cielo, Rede, PagSeguro..."
              value={payment.operator || ""}
              onChange={(e) => onUpdate({ ...payment, operator: e.target.value })}
              className="bg-[#12121a] border-[#252D3E] text-white mt-1"
            />
          </div>
        </div>
      )}

      {/* Resumo Financeiro */}
      {payment.method && (
        <div className="p-4 bg-[#0d1017] border border-[#252D3E] rounded-lg space-y-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumo Financeiro</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Valor Bruto</span>
            <span className="text-white">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Taxa ({feeRate.toFixed(2)}%)</span>
            <span className="text-red-400">-R$ {feeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-[#252D3E] pt-2 mt-2">
            <span className="text-gray-300">Valor Líquido Recebido</span>
            <span className="text-emerald-400">R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          {isInstallment && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">{installments}x de</span>
              <span className="text-[#C5A059] font-semibold">
                R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-gray-400 text-xs">Observações do Pagamento</Label>
        <Textarea
          placeholder="Cupom, condição especial, acordo..."
          value={payment.notes || ""}
          onChange={(e) => onUpdate({ ...payment, notes: e.target.value })}
          className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          rows={2}
        />
      </div>
    </div>
  );
};

// ─── STEP 4: ESTOQUE ───────────────────────────────────────────────────────────
const StepStock = ({ deductStock, onUpdate }) => {
  const { data: supplies = [] } = useQuery({
    queryKey: ["supplies"],
    queryFn: () => base44.entities.Supply.list("name", 100),
  });

  const items = deductStock.items || [];

  const addItem = (supply) => {
    if (items.find(i => i.supply_id === supply.id)) return;
    onUpdate({ ...deductStock, items: [...items, { supply_id: supply.id, supply_name: supply.name, unit: supply.unit, qty: 1 }] });
  };

  const updateQty = (id, qty) => {
    onUpdate({ ...deductStock, items: items.map(i => i.supply_id === id ? { ...i, qty: parseFloat(qty) || 0 } : i) });
  };

  const removeItem = (id) => {
    onUpdate({ ...deductStock, items: items.filter(i => i.supply_id !== id) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif text-white mb-1">Baixa no Estoque</h2>
        <p className="text-sm text-gray-400">Informe os materiais utilizados neste procedimento</p>
      </div>

      <div className="flex items-center gap-3 p-3 bg-[#1a1a25] rounded-lg border border-[#252D3E]">
        <Checkbox
          id="skip-stock"
          checked={deductStock.skip}
          onCheckedChange={(v) => onUpdate({ ...deductStock, skip: v })}
          className="border-gray-500"
        />
        <Label htmlFor="skip-stock" className="text-gray-300 text-sm cursor-pointer">
          Pular baixa de estoque neste momento
        </Label>
      </div>

      {!deductStock.skip && (
        <>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {supplies.map(supply => (
              <button
                key={supply.id}
                onClick={() => addItem(supply)}
                className="w-full text-left p-3 rounded-lg border border-[#252D3E] bg-[#141820] hover:border-[#C5A059]/40 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-white">{supply.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({supply.unit})</span>
                </div>
                <span className="text-xs text-gray-500">Estoque: {supply.current_stock || 0}</span>
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#C5A059]">Materiais Selecionados</h4>
              {items.map(item => (
                <div key={item.supply_id} className="flex items-center gap-3 p-3 bg-[#1a1a25] border border-[#C5A059]/20 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.supply_name}</p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                  </div>
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateQty(item.supply_id, e.target.value)}
                    className="w-20 bg-[#12121a] border-[#252D3E] text-white text-center"
                    min="0.1"
                    step="0.1"
                  />
                  <button onClick={() => removeItem(item.supply_id)} className="text-red-400 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── STEP 5: PRONTUÁRIO ────────────────────────────────────────────────────────
const StepRecord = ({ record, onUpdate }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-serif text-white mb-1">Prontuário Clínico</h2>
    <p className="text-sm text-gray-400">Registre as informações clínicas desta sessão</p>

    <div className="space-y-3">
      <div>
        <Label className="text-gray-400 text-xs">Queixa Principal / Indicação</Label>
        <Textarea
          placeholder="Descreva a queixa principal ou indicação clínica..."
          value={record.chief_complaint || ""}
          onChange={(e) => onUpdate({ ...record, chief_complaint: e.target.value })}
          className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          rows={2}
        />
      </div>
      <div>
        <Label className="text-gray-400 text-xs">Evolução do Tratamento</Label>
        <Textarea
          placeholder="Evolução, intercorrências, observações pós-procedimento..."
          value={record.evolution || ""}
          onChange={(e) => onUpdate({ ...record, evolution: e.target.value })}
          className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          rows={3}
        />
      </div>
      <div>
        <Label className="text-gray-400 text-xs">Recomendações Pós-Procedimento</Label>
        <Textarea
          placeholder="Cuidados pós, retorno, restrições..."
          value={record.recommendations || ""}
          onChange={(e) => onUpdate({ ...record, recommendations: e.target.value })}
          className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400 text-xs">Alergias Conhecidas</Label>
          <Input
            placeholder="Ex: lidocaína, ácido hialurônico..."
            value={record.allergies || ""}
            onChange={(e) => onUpdate({ ...record, allergies: e.target.value })}
            className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">Medicamentos em Uso</Label>
          <Input
            placeholder="Ex: anticoagulantes, antibióticos..."
            value={record.current_medications || ""}
            onChange={(e) => onUpdate({ ...record, current_medications: e.target.value })}
            className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400 text-xs">Data de Retorno</Label>
          <Input
            type="date"
            value={record.return_date || ""}
            onChange={(e) => onUpdate({ ...record, return_date: e.target.value })}
            className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">Profissional Responsável</Label>
          <Input
            placeholder="Nome do profissional"
            value={record.professional || "Dra. Paloma Betoni"}
            onChange={(e) => onUpdate({ ...record, professional: e.target.value })}
            className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
          />
        </div>
      </div>
    </div>
  </div>
);

// ─── MAIN WIZARD ───────────────────────────────────────────────────────────────
export default function TreatmentWizard({ patient, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState(null); // "procedure" | "protocol"
  const [selection, setSelection] = useState({});
  const [payment, setPayment] = useState({ method: null });
  const [deductStock, setDeductStock] = useState({ skip: false, items: [] });
  const [record, setRecord] = useState({ professional: "Dra. Paloma Betoni" });
  const [saving, setSaving] = useState(false);

  const STEPS_PROCEDURE = ["Tipo", "Procedimento", "Pagamento", "Estoque", "Prontuário"];
  const STEPS_PROTOCOL = ["Tipo", "Protocolo", "Pagamento", "Estoque", "Prontuário"];
  const steps = tipo === "protocol" ? STEPS_PROTOCOL : STEPS_PROCEDURE;

  const getTotalValue = () => {
    if (tipo === "procedure") {
      return (selection.customValue || selection.procedure?.price || 0) * (selection.qty || 1);
    }
    if (tipo === "protocol") {
      const items = selection.protocolItems || [];
      const subtotal = items.reduce((s, i) => s + (i.customValue || 0), 0);
      const autoDisc = items.length >= 4 ? 15 : items.length >= 2 ? 10 : 0;
      const totalDisc = autoDisc + (selection.extraDiscount || 0);
      return subtotal * (1 - totalDisc / 100);
    }
    return 0;
  };

  const totalValue = getTotalValue();

  const canProceed = () => {
    if (step === 0) return !!tipo;
    if (step === 1) {
      if (tipo === "procedure") return !!selection.procedure;
      if (tipo === "protocol") return (selection.protocolItems || []).length > 0;
    }
    if (step === 2) return !!payment.method;
    return true;
  };

  const handleNext = () => {
    if (step === 0 && tipo) { setStep(1); return; }
    if (canProceed()) setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const procedureName = tipo === "procedure"
        ? selection.procedure?.name
        : (selection.protocolName || "Protocolo Premium");

      // 1. Criar tratamento
      await base44.entities.PatientTreatment.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        protocolo_nome: procedureName,
        categoria: tipo === "procedure" ? (selection.procedure?.category || "avulso") : "preenchimento",
        tipo: tipo === "procedure" ? "avulso" : "protocolo",
        status: "realizado",
        data_indicacao: now.split("T")[0],
        data_realizacao: now.split("T")[0],
        valor: totalValue,
        valor_pago: totalValue,
        quantidade_ml: selection.qty || 1,
        regioes_tratadas: selection.regions ? [selection.regions] : [],
        observacoes: selection.notes || record.evolution || "",
      });

      // 2. Criar transação financeira
      const installments = payment.method === "installments" ? (payment.installments || 2) : 1;
      const feeRate = payment.method === "installments"
        ? (payment.customFee ?? INSTALLMENT_FEES[installments] ?? 9)
        : (PAYMENT_METHODS.find(m => m.value === payment.method)?.fee || 0);

      for (let i = 0; i < installments; i++) {
        const dueDate = payment.firstDueDate
          ? new Date(new Date(payment.firstDueDate).setMonth(new Date(payment.firstDueDate).getMonth() + i))
              .toISOString().split("T")[0]
          : now.split("T")[0];

        await base44.entities.Transaction.create({
          type: "income",
          category: "procedure",
          description: `${procedureName} — ${patient.full_name}${installments > 1 ? ` (${i+1}/${installments})` : ""}`,
          amount: totalValue / installments,
          payment_method: payment.method,
          installments,
          current_installment: i + 1,
          due_date: dueDate,
          status: "pending",
          patient_id: patient.id,
          patient_name: patient.full_name,
          notes: payment.notes || "",
        });
      }

      // 3. Prontuário
      await base44.entities.MedicalRecord.create({
        patient_id: patient.id,
        record_date: now,
        chief_complaint: record.chief_complaint || procedureName,
        evolution: record.evolution || "",
        recommendations: record.recommendations || "",
        allergies: record.allergies ? [record.allergies] : [],
        current_medications: record.current_medications ? [record.current_medications] : [],
        procedures_performed: [{
          procedure_name: procedureName,
          quantity_applied: selection.qty || 1,
          unit: "ml",
          area_treated: selection.regions || "",
        }],
        status: "approved",
      });

      // 4. Baixa de estoque
      if (!deductStock.skip && deductStock.items.length > 0) {
        for (const item of deductStock.items) {
          const supply = await base44.entities.Supply.get ? null : null;
          await base44.entities.SupplyMovement.create({
            supply_id: item.supply_id,
            supply_name: item.supply_name,
            movement_type: "out",
            quantity: item.qty,
            reason: `Procedimento: ${procedureName} — ${patient.full_name}`,
            date: now.split("T")[0],
          }).catch(() => {}); // silenciar se entidade não existir
        }
      }

      queryClient.invalidateQueries({ queryKey: ["patient-treatments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Tratamento registrado com sucesso!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar tratamento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0f1117] border border-[#1e1e2a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e2a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 flex items-center justify-center">
              <Syringe className="h-4 w-4 text-[#C5A059]" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Iniciar Tratamento</h2>
              <p className="text-xs text-gray-500">{patient.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Bar */}
        <div className="px-6 pt-5">
          <StepBar currentStep={step} steps={tipo ? steps : ["Tipo", "Procedimento", "Pagamento", "Estoque", "Prontuário"]} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {step === 0 && (
            <StepTipo onSelect={(t) => { setTipo(t); setStep(1); }} />
          )}
          {step === 1 && tipo === "procedure" && (
            <StepProcedure selection={selection} onUpdateSelection={setSelection} />
          )}
          {step === 1 && tipo === "protocol" && (
            <StepProtocol selection={selection} onUpdateSelection={setSelection} />
          )}
          {step === 2 && (
            <StepPayment totalValue={totalValue} payment={payment} onUpdate={setPayment} />
          )}
          {step === 3 && (
            <StepStock deductStock={deductStock} onUpdate={setDeductStock} />
          )}
          {step === 4 && (
            <StepRecord record={record} onUpdate={setRecord} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e1e2a]">
          <Button
            variant="ghost"
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[#C5A059] hover:bg-[#D9BB82] text-black font-semibold"
            >
              Continuar
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#C5A059] hover:bg-[#D9BB82] text-black font-semibold"
            >
              {saving ? "Salvando..." : "Finalizar Tratamento"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}