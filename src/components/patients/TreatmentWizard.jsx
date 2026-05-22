import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, Syringe, Star, CheckCircle,
  CreditCard, Banknote, Smartphone, Building, Receipt,
  Calculator, AlertTriangle, Info
} from "lucide-react";

// ─── DADOS OFICIAIS ────────────────────────────────────────────────────────────

const PROCEDIMENTOS = [
  { id: "lab", nome: "Preenchimento Labial", objetivo: "Definição, hidratação, contorno e volumização labial", valor: 2997, categoria: "preenchimento" },
  { id: "rino", nome: "Rinomodelação", objetivo: "Correção estética nasal sem cirurgia", valor: 6997, categoria: "preenchimento" },
  { id: "mento", nome: "Preenchimento de Mento", objetivo: "Projetar e equilibrar o queixo", valor: 4500, categoria: "preenchimento" },
  { id: "malar", nome: "Preenchimento Malar", objetivo: "Reposição de volume e sustentação facial", valor: 3500, categoria: "preenchimento" },
  { id: "mandib", nome: "Preenchimento de Ângulo de Mandíbula", objetivo: "Definição mandibular e estruturação facial", valor: 4500, categoria: "preenchimento" },
  { id: "jowls", nome: "Preenchimento Pré-Jowls", objetivo: "Correção de depressões e suavização da linha mandibular", valor: 3500, categoria: "preenchimento" },
  { id: "tempora", nome: "Preenchimento de Têmpora", objetivo: "Reposição volumétrica e rejuvenescimento lateral da face", valor: 3500, categoria: "preenchimento" },
  { id: "sobrancelha", nome: "Preenchimento de Cauda da Sobrancelha", objetivo: "Elevação e sustentação lateral da sobrancelha", valor: 3000, categoria: "preenchimento" },
  { id: "olheira", nome: "Preenchimento de Olheiras", objetivo: "Suavização do aspecto cansado", valor: 3500, categoria: "preenchimento" },
  { id: "premaxila", nome: "Preenchimento Pré-Máxila", objetivo: "Sustentação central facial", valor: 3500, categoria: "preenchimento" },
  { id: "fossa", nome: "Preenchimento de Fossa Nasal", objetivo: "Correção estrutural nasal lateral", valor: 3500, categoria: "preenchimento" },
  { id: "toxsup", nome: "Toxina Botulínica — Terço Superior", objetivo: "Testa, glabela e pés de galinha", valor: 3500, categoria: "toxina" },
  { id: "toxinf", nome: "Toxina Botulínica — Terço Inferior", objetivo: "Sorriso gengival, código de barras e contorno inferior", valor: 3500, categoria: "toxina" },
  { id: "brux", nome: "Bruxismo", objetivo: "Relaxamento do masseter e alívio funcional", valor: 3500, categoria: "toxina" },
  { id: "micro", nome: "Microagulhamento com Peptídeos", objetivo: "Regeneração cutânea avançada", valor: 2800, categoria: "microagulhamento" },
  { id: "enzimas", nome: "Enzimas para Papada", objetivo: "Redução de gordura submentoniana", valor: 2000, categoria: "enzimas" },
];

const PROTOCOLOS = [
  {
    id: "fullface",
    nome: "Protocolo Premium — Full Face",
    objetivo: "Reposicionamento global da face, harmonização estrutural e rejuvenescimento tridimensional",
    regioes: ["Malar", "Mandíbula", "Mento", "Têmporas", "Olheiras", "Pré-Jowls", "Sulcos", "Lábios (quando necessário)"],
    valor: 20000,
    valorPorMl: 1700,
    tipo: "fixo_ou_ml",
    destaque: true,
  },
  {
    id: "ultratox",
    nome: "Ultra Toxina Botulínica",
    objetivo: "Cobertura completa com toxina de alta performance",
    regioes: ["Pescoço", "Terço Superior", "Terço Inferior"],
    valor: 6000,
    tipo: "fixo",
  },
  {
    id: "fiostracao",
    nome: "Fios de Tração",
    objetivo: "Lifting sem cirurgia e reposicionamento tecidual",
    regioes: ["Face", "Pescoço"],
    valor: 7000,
    valorMax: 15000,
    tipo: "range",
    aviso: "Valor exato definido após avaliação clínica.",
  },
  {
    id: "fioslisos",
    nome: "Fios Lisos",
    objetivo: "Bioestimulação e melhora estrutural",
    regioes: ["Face", "Pescoço"],
    valor: 7000,
    valorMax: 15000,
    tipo: "range",
    aviso: "Valor exato definido após avaliação clínica.",
  },
  {
    id: "biorosto",
    nome: "Bioestimulador — Rosto",
    objetivo: "Estimular colágeno e firmeza facial",
    regioes: ["Face completa"],
    produtos: ["Sculptra", "Radiesse", "Elleva", "HarmonyCa"],
    valor: 4000,
    tipo: "fixo",
  },
  {
    id: "biopescoço",
    nome: "Bioestimulador — Pescoço",
    objetivo: "Melhora da flacidez e qualidade cervical",
    regioes: ["Pescoço", "Colo"],
    valor: 4500,
    tipo: "fixo",
  },
];

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

const INSTALLMENT_FEES = { 2: 5.5, 3: 6.5, 4: 7.5, 5: 8.5, 6: 9.5, 7: 10.5, 8: 11.0, 9: 11.5, 10: 12.0, 11: 12.5, 12: 13.5 };
const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

const fmtBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── STEP BAR ──────────────────────────────────────────────────────────────────
const StepBar = ({ current, steps }) => (
  <div className="flex items-center gap-0 mb-6">
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i < current ? "bg-[#C5A059] text-black" :
            i === current ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]" :
            "bg-[#1e2535] text-gray-500 border border-[#252D3E]"
          }`}>
            {i < current ? <CheckCircle className="h-3 w-3" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block whitespace-nowrap ${i === current ? "text-[#C5A059]" : "text-gray-500"}`}>{s}</span>
        </div>
        {i < steps.length - 1 && <div className={`h-px flex-1 mx-2 min-w-[12px] ${i < current ? "bg-[#C5A059]/50" : "bg-[#252D3E]"}`} />}
      </React.Fragment>
    ))}
  </div>
);

// ─── STEP 1: TIPO ──────────────────────────────────────────────────────────────
const StepTipo = ({ onSelect }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-serif text-white mb-2">Tipo de Tratamento</h2>
      <p className="text-gray-400 text-sm">Selecione a categoria do atendimento</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <button onClick={() => onSelect("procedure")}
        className="group p-7 rounded-xl border border-[#252D3E] hover:border-[#C5A059]/70 bg-[#141820] hover:bg-[#C5A059]/5 transition-all text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Syringe className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Procedimentos</h3>
            <p className="text-xs text-gray-500">16 procedimentos avulsos</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Procedimentos individuais com valores fixos. Preenchimentos, toxinas, microagulhamento e mais.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[#C5A059] text-xs font-medium">
          Selecionar <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      <button onClick={() => onSelect("protocol")}
        className="group p-7 rounded-xl border border-[#C5A059]/30 hover:border-[#C5A059]/70 bg-gradient-to-br from-[#C5A059]/5 to-[#141820] transition-all text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#C5A059]/15 flex items-center justify-center border border-[#C5A059]/30">
            <Star className="h-5 w-5 text-[#C5A059]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Protocolos Premium</h3>
            <p className="text-xs text-[#C5A059]/70">6 protocolos exclusivos</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Combinações estratégicas de alta performance para resultados superiores e completos.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[#C5A059] text-xs font-medium">
          Selecionar <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  </div>
);

// ─── STEP 2A: PROCEDIMENTOS ────────────────────────────────────────────────────
const StepProcedimento = ({ sel, onUpdate }) => {
  const [search, setSearch] = useState("");
  const filtered = PROCEDIMENTOS.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif text-white mb-1">Procedimentos Avulsos</h2>
        <p className="text-sm text-gray-400">Selecione o procedimento e ajuste os detalhes</p>
      </div>

      <input
        placeholder="Buscar procedimento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[#1a1a25] border border-[#252D3E] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
      />

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {filtered.map(proc => (
          <button
            key={proc.id}
            onClick={() => onUpdate({ ...sel, item: proc, valorFinal: proc.valor, qty: 1, ml: "" })}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              sel.item?.id === proc.id
                ? "border-[#C5A059] bg-[#C5A059]/8"
                : "border-[#252D3E] bg-[#141820] hover:border-[#C5A059]/40"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{proc.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{proc.objetivo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#C5A059] font-semibold text-sm">{fmtBRL(proc.valor)}</p>
                <Badge className="text-xs bg-[#1e2535] text-gray-400 border-0 mt-0.5">{proc.categoria}</Badge>
              </div>
            </div>
          </button>
        ))}
      </div>

      {sel.item && (
        <div className="mt-3 p-4 bg-[#0d1017] rounded-xl border border-[#C5A059]/20 space-y-3">
          <p className="text-sm font-medium text-[#C5A059]">Detalhes — {sel.item.nome}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Valor (editável)</Label>
              <Input
                type="number"
                value={sel.valorFinal || ""}
                onChange={(e) => onUpdate({ ...sel, valorFinal: parseFloat(e.target.value) || 0 })}
                className="bg-[#141820] border-[#252D3E] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Quantidade / ml</Label>
              <Input
                placeholder="1"
                value={sel.qty || ""}
                onChange={(e) => onUpdate({ ...sel, qty: e.target.value })}
                className="bg-[#141820] border-[#252D3E] text-white mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Regiões Tratadas</Label>
            <Input
              placeholder="Ex: lábio superior, comissura..."
              value={sel.regioes || ""}
              onChange={(e) => onUpdate({ ...sel, regioes: e.target.value })}
              className="bg-[#141820] border-[#252D3E] text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Observações Clínicas</Label>
            <Textarea
              rows={2}
              placeholder="Notas importantes..."
              value={sel.obs || ""}
              onChange={(e) => onUpdate({ ...sel, obs: e.target.value })}
              className="bg-[#141820] border-[#252D3E] text-white mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STEP 2B: PROTOCOLOS PREMIUM ──────────────────────────────────────────────
const StepProtocolo = ({ sel, onUpdate }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-xl font-serif text-white mb-1">Protocolos Premium</h2>
      <p className="text-sm text-gray-400">Soluções completas e estratégicas</p>
    </div>

    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {PROTOCOLOS.map(proto => {
        const isSelected = sel.item?.id === proto.id;
        return (
          <div key={proto.id}
            onClick={() => onUpdate({ ...sel, item: proto, valorFinal: proto.valor, mlUsado: "" })}
            className={`cursor-pointer p-5 rounded-xl border transition-all ${
              isSelected
                ? "border-[#C5A059] bg-gradient-to-br from-[#C5A059]/8 to-[#141820]"
                : "border-[#252D3E] bg-[#141820] hover:border-[#C5A059]/40"
            } ${proto.destaque ? "ring-1 ring-[#C5A059]/20" : ""}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {proto.destaque && <Star className="h-4 w-4 text-[#C5A059] flex-shrink-0" />}
                <h3 className={`font-semibold text-sm ${isSelected ? "text-[#C5A059]" : "text-white"}`}>{proto.nome}</h3>
              </div>
              <div className="text-right flex-shrink-0">
                {proto.tipo === "range" ? (
                  <div>
                    <p className="text-[#C5A059] font-semibold text-sm">{fmtBRL(proto.valor)} — {fmtBRL(proto.valorMax)}</p>
                  </div>
                ) : proto.tipo === "fixo_ou_ml" ? (
                  <div>
                    <p className="text-[#C5A059] font-semibold text-sm">{fmtBRL(proto.valor)}</p>
                    <p className="text-gray-500 text-xs">ou {fmtBRL(proto.valorPorMl)}/ml</p>
                  </div>
                ) : (
                  <p className="text-[#C5A059] font-semibold text-sm">{fmtBRL(proto.valor)}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-2">{proto.objetivo}</p>

            <div className="flex flex-wrap gap-1 mb-2">
              {proto.regioes.map((r, i) => (
                <Badge key={i} className="text-xs bg-[#1e2535] text-gray-400 border-0">{r}</Badge>
              ))}
            </div>

            {proto.produtos && (
              <div className="flex flex-wrap gap-1 mb-2">
                {proto.produtos.map((p, i) => (
                  <Badge key={i} className="text-xs bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">{p}</Badge>
                ))}
              </div>
            )}

            {proto.aviso && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">{proto.aviso}</p>
              </div>
            )}

            {isSelected && (
              <div className="mt-3 pt-3 border-t border-[#252D3E] space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-gray-400 text-xs">Valor Final (editável)</Label>
                    <Input
                      type="number"
                      value={sel.valorFinal || ""}
                      onChange={(e) => onUpdate({ ...sel, valorFinal: parseFloat(e.target.value) || 0 })}
                      className="bg-[#0d1017] border-[#252D3E] text-white mt-1"
                    />
                  </div>
                  {proto.tipo === "fixo_ou_ml" && (
                    <div>
                      <Label className="text-gray-400 text-xs">ml Utilizado</Label>
                      <Input
                        placeholder="Ex: 12"
                        value={sel.mlUsado || ""}
                        onChange={(e) => {
                          const ml = parseFloat(e.target.value) || 0;
                          onUpdate({ ...sel, mlUsado: e.target.value, valorFinal: ml > 0 ? ml * proto.valorPorMl : proto.valor });
                        }}
                        className="bg-[#0d1017] border-[#252D3E] text-white mt-1"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Observações</Label>
                  <Textarea
                    rows={2}
                    placeholder="Notas clínicas do protocolo..."
                    value={sel.obs || ""}
                    onChange={(e) => onUpdate({ ...sel, obs: e.target.value })}
                    className="bg-[#0d1017] border-[#252D3E] text-white mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── STEP 3: PAGAMENTO ─────────────────────────────────────────────────────────
const StepPagamento = ({ baseValue, payment, onUpdate }) => {
  const method = PAYMENT_METHODS.find(m => m.value === payment.method);
  const isInstallment = payment.method === "installments";
  const installments = payment.installments || 2;

  const feeRate = isInstallment
    ? (payment.customFee ?? INSTALLMENT_FEES[installments] ?? 9)
    : (payment.customFee ?? (method?.fee || 0));

  // TAXA É ADICIONADA AO VALOR DO CLIENTE
  const feeAmount = baseValue * (feeRate / 100);
  const valorCliente = baseValue + feeAmount;
  const installmentValue = isInstallment ? valorCliente / installments : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-serif text-white mb-1">Forma de Pagamento</h2>
        <p className="text-xs text-gray-500">A taxa da máquina é adicionada ao valor do cliente</p>
      </div>

      {/* Valor base */}
      <div className="p-4 bg-[#0d1017] border border-[#C5A059]/20 rounded-xl flex items-center justify-between">
        <span className="text-gray-400 text-sm">Valor do Procedimento</span>
        <span className="text-2xl font-bold text-white">{fmtBRL(baseValue)}</span>
      </div>

      {/* Métodos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PAYMENT_METHODS.map(m => (
          <button
            key={m.value}
            onClick={() => onUpdate({ ...payment, method: m.value, installments: 2, customFee: null })}
            className={`p-3 rounded-xl border text-left transition-all ${
              payment.method === m.value
                ? "border-[#C5A059] bg-[#C5A059]/10"
                : "border-[#252D3E] bg-[#141820] hover:border-[#C5A059]/40"
            }`}
          >
            <m.icon className={`h-4 w-4 mb-1.5 ${payment.method === m.value ? "text-[#C5A059]" : "text-gray-500"}`} />
            <p className={`text-xs font-medium leading-tight ${payment.method === m.value ? "text-[#C5A059]" : "text-gray-300"}`}>{m.label}</p>
            {m.fee > 0 && <p className="text-xs text-gray-500 mt-0.5">+{m.fee}%</p>}
          </button>
        ))}
      </div>

      {/* Parcelamento */}
      {isInstallment && (
        <div className="p-4 bg-[#1a1a25] border border-[#252D3E] rounded-xl space-y-3">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#C5A059]" />
            Configurar Parcelamento
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Parcelas</Label>
              <Select value={String(installments)} onValueChange={(v) => onUpdate({ ...payment, installments: parseInt(v), customFee: null })}>
                <SelectTrigger className="bg-[#0d1017] border-[#252D3E] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#252D3E]">
                  {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
                    <SelectItem key={n} value={String(n)} className="text-white">
                      {n}x — taxa {INSTALLMENT_FEES[n]}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Bandeira</Label>
              <Select value={payment.cardBrand || "Visa"} onValueChange={(v) => onUpdate({ ...payment, cardBrand: v })}>
                <SelectTrigger className="bg-[#0d1017] border-[#252D3E] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#252D3E]">
                  {CARD_BRANDS.map(b => <SelectItem key={b} value={b} className="text-white">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Taxa (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={payment.customFee ?? INSTALLMENT_FEES[installments] ?? 9}
                onChange={(e) => onUpdate({ ...payment, customFee: parseFloat(e.target.value) || 0 })}
                className="bg-[#0d1017] border-[#252D3E] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">1ª Parcela em</Label>
              <Input type="date" value={payment.firstDueDate || ""} onChange={(e) => onUpdate({ ...payment, firstDueDate: e.target.value })} className="bg-[#0d1017] border-[#252D3E] text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-400 text-xs">Operadora</Label>
              <Input placeholder="Ex: Cielo, Rede, PagSeguro..." value={payment.operator || ""} onChange={(e) => onUpdate({ ...payment, operator: e.target.value })} className="bg-[#0d1017] border-[#252D3E] text-white mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* Resumo — só aparece quando método selecionado */}
      {payment.method && (
        <div className="p-4 bg-[#0d1017] border border-[#252D3E] rounded-xl space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-[#C5A059]" />
            <h4 className="text-xs font-semibold text-[#C5A059] uppercase tracking-wider">Resumo Financeiro</h4>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Valor do procedimento</span>
            <span className="text-white">{fmtBRL(baseValue)}</span>
          </div>
          {feeRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Taxa da máquina ({feeRate.toFixed(2)}%)</span>
              <span className="text-amber-400">+{fmtBRL(feeAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-[#252D3E] pt-2 mt-2">
            <span className="text-white">Valor cobrado do cliente</span>
            <span className="text-2xl text-[#C5A059] font-bold">{fmtBRL(valorCliente)}</span>
          </div>
          {isInstallment && (
            <div className="flex justify-between text-sm pt-1">
              <span className="text-gray-400">{installments}x de</span>
              <span className="text-white font-semibold">{fmtBRL(installmentValue)}</span>
            </div>
          )}
          <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <p className="text-xs text-emerald-400 font-medium">✓ Clínica recebe integralmente: {fmtBRL(baseValue)}</p>
          </div>
        </div>
      )}

      <div>
        <Label className="text-gray-400 text-xs">Observações do Pagamento</Label>
        <Textarea
          rows={2}
          placeholder="Condição especial, desconto autorizado, observação..."
          value={payment.notes || ""}
          onChange={(e) => onUpdate({ ...payment, notes: e.target.value })}
          className="bg-[#1a1a25] border-[#252D3E] text-white mt-1"
        />
      </div>
    </div>
  );
};

// ─── STEP 4: PRONTUÁRIO ────────────────────────────────────────────────────────
const StepProntuario = ({ record, onUpdate }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-xl font-serif text-white mb-1">Prontuário Clínico</h2>
      <p className="text-sm text-gray-400">Registre as informações desta sessão</p>
    </div>
    <div className="space-y-3">
      <div>
        <Label className="text-gray-400 text-xs">Queixa / Indicação Clínica</Label>
        <Textarea rows={2} placeholder="Descreva a indicação clínica..." value={record.queixa || ""} onChange={(e) => onUpdate({ ...record, queixa: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
      </div>
      <div>
        <Label className="text-gray-400 text-xs">Evolução / Intercorrências</Label>
        <Textarea rows={3} placeholder="Evolução do tratamento, intercorrências..." value={record.evolucao || ""} onChange={(e) => onUpdate({ ...record, evolucao: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
      </div>
      <div>
        <Label className="text-gray-400 text-xs">Recomendações Pós-Procedimento</Label>
        <Textarea rows={2} placeholder="Cuidados, retorno, restrições..." value={record.recomendacoes || ""} onChange={(e) => onUpdate({ ...record, recomendacoes: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400 text-xs">Alergias</Label>
          <Input placeholder="Ex: lidocaína..." value={record.alergias || ""} onChange={(e) => onUpdate({ ...record, alergias: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">Medicamentos em Uso</Label>
          <Input placeholder="Ex: anticoagulantes..." value={record.medicamentos || ""} onChange={(e) => onUpdate({ ...record, medicamentos: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">Data de Retorno</Label>
          <Input type="date" value={record.retorno || ""} onChange={(e) => onUpdate({ ...record, retorno: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">Profissional</Label>
          <Input value={record.profissional || "Dra. Paloma Betoni"} onChange={(e) => onUpdate({ ...record, profissional: e.target.value })} className="bg-[#1a1a25] border-[#252D3E] text-white mt-1" />
        </div>
      </div>
    </div>
  </div>
);

// ─── MAIN WIZARD ───────────────────────────────────────────────────────────────
export default function TreatmentWizard({ patient, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState(null);
  const [sel, setSel] = useState({});
  const [payment, setPayment] = useState({ method: null });
  const [record, setRecord] = useState({ profissional: "Dra. Paloma Betoni" });
  const [saving, setSaving] = useState(false);

  const STEPS = ["Tipo", tipo === "protocol" ? "Protocolo" : "Procedimento", "Pagamento", "Prontuário"];

  const baseValue = sel.valorFinal || sel.item?.valor || 0;

  const feeRate = (() => {
    const isInstallment = payment.method === "installments";
    const m = PAYMENT_METHODS.find(x => x.value === payment.method);
    return isInstallment
      ? (payment.customFee ?? INSTALLMENT_FEES[payment.installments || 2] ?? 9)
      : (payment.customFee ?? (m?.fee || 0));
  })();

  const valorCliente = baseValue + baseValue * (feeRate / 100);

  const canNext = () => {
    if (step === 0) return !!tipo;
    if (step === 1) return !!sel.item;
    if (step === 2) return !!payment.method;
    return true;
  };

  const handleSelect = (t) => { setTipo(t); setStep(1); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const nome = sel.item?.nome || "Tratamento";
      const isInstallment = payment.method === "installments";
      const numParcelas = isInstallment ? (payment.installments || 2) : 1;

      await base44.entities.PatientTreatment.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        protocolo_nome: nome,
        categoria: sel.item?.categoria || (tipo === "protocol" ? "preenchimento" : "avulso"),
        tipo: tipo === "procedure" ? "avulso" : "protocolo",
        status: "realizado",
        data_indicacao: now.split("T")[0],
        data_realizacao: now.split("T")[0],
        valor: valorCliente,
        valor_pago: valorCliente,
        quantidade_ml: parseFloat(sel.qty) || parseFloat(sel.mlUsado) || 1,
        regioes_tratadas: sel.regioes ? [sel.regioes] : (sel.item?.regioes || []),
        observacoes: sel.obs || record.evolucao || "",
      });

      for (let i = 0; i < numParcelas; i++) {
        const due = payment.firstDueDate
          ? new Date(new Date(payment.firstDueDate).setMonth(new Date(payment.firstDueDate).getMonth() + i)).toISOString().split("T")[0]
          : now.split("T")[0];
        await base44.entities.Transaction.create({
          type: "income",
          category: "procedure",
          description: `${nome} — ${patient.full_name}${numParcelas > 1 ? ` (${i + 1}/${numParcelas})` : ""}`,
          amount: valorCliente / numParcelas,
          payment_method: payment.method,
          installments: numParcelas,
          current_installment: i + 1,
          due_date: due,
          status: "pending",
          patient_id: patient.id,
          patient_name: patient.full_name,
          notes: payment.notes || "",
        });
      }

      await base44.entities.MedicalRecord.create({
        patient_id: patient.id,
        record_date: now,
        chief_complaint: record.queixa || nome,
        evolution: record.evolucao || "",
        recommendations: record.recomendacoes || "",
        allergies: record.alergias ? [record.alergias] : [],
        current_medications: record.medicamentos ? [record.medicamentos] : [],
        procedures_performed: [{ procedure_name: nome, quantity_applied: parseFloat(sel.qty) || 1, unit: "un", area_treated: sel.regioes || "" }],
        status: "approved",
      });

      queryClient.invalidateQueries({ queryKey: ["patient-treatments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Tratamento registrado com sucesso!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0c0f16] border border-[#1e2535] rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2535]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 flex items-center justify-center">
              <Syringe className="h-4 w-4 text-[#C5A059]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Iniciar Tratamento</p>
              <p className="text-sm font-semibold text-white">{patient.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step bar */}
        <div className="px-6 pt-5">
          <StepBar current={step} steps={STEPS} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {step === 0 && <StepTipo onSelect={handleSelect} />}
          {step === 1 && tipo === "procedure" && <StepProcedimento sel={sel} onUpdate={setSel} />}
          {step === 1 && tipo === "protocol" && <StepProtocolo sel={sel} onUpdate={setSel} />}
          {step === 2 && <StepPagamento baseValue={baseValue} payment={payment} onUpdate={setPayment} />}
          {step === 3 && <StepProntuario record={record} onUpdate={setRecord} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e2535]">
          <Button variant="ghost" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)} className="text-gray-400 hover:text-white">
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-[#C5A059] hover:bg-[#D9BB82] text-black font-semibold min-w-28">
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="bg-[#C5A059] hover:bg-[#D9BB82] text-black font-semibold min-w-36">
              {saving ? "Salvando..." : "Finalizar"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}