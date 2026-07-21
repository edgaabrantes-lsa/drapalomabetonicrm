import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const fmtArr = (arr) => (arr || []).join(", ");

export default function PlanoForm({ plano, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    plano || {
      nome: "",
      categoria: "entrada",
      valor_mensal: 0,
      contrato_anual: true,
      objetivo: "",
      inclui_mensal: [],
      rotacao_mensal: [],
      inclui_trimestral: [],
      inclui_semestral: [],
      inclui_anual: [],
      beneficios: [],
      desconto_procedimentos: 0,
      destaque: false,
      cor: "",
      ordem: 0,
      status: "ativo",
    }
  );

  const [incluiMensal, setIncluiMensal] = useState(fmtArr(plano?.inclui_mensal));
  const [rotacaoMensal, setRotacaoMensal] = useState(fmtArr(plano?.rotacao_mensal));
  const [incluiTrimestral, setIncluiTrimestral] = useState(fmtArr(plano?.inclui_trimestral));
  const [incluiSemestral, setIncluiSemestral] = useState(fmtArr(plano?.inclui_semestral));
  const [incluiAnual, setIncluiAnual] = useState(fmtArr(plano?.inclui_anual));
  const [beneficios, setBeneficios] = useState(fmtArr(plano?.beneficios));

  const parseArr = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      valor_mensal: Number(form.valor_mensal) || 0,
      desconto_procedimentos: Number(form.desconto_procedimentos) || 0,
      ordem: Number(form.ordem) || 0,
      inclui_mensal: parseArr(incluiMensal),
      rotacao_mensal: parseArr(rotacaoMensal),
      inclui_trimestral: parseArr(incluiTrimestral),
      inclui_semestral: parseArr(incluiSemestral),
      inclui_anual: parseArr(incluiAnual),
      beneficios: parseArr(beneficios),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Nome do Plano</Label>
        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Plano de Entrada</SelectItem>
              <SelectItem value="principal">Plano Principal</SelectItem>
              <SelectItem value="vip">Plano VIP</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor mensal (R$)</Label>
          <Input type="number" value={form.valor_mensal || ""} onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })} className="mt-1" required />
        </div>
      </div>
      <div>
        <Label>Objetivo</Label>
        <Textarea value={form.objetivo || ""} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} className="mt-1" rows={2} />
      </div>
      <div>
        <Label>Inclui todo mês (vírgula)</Label>
        <Input value={incluiMensal} onChange={(e) => setIncluiMensal(e.target.value)} className="mt-1" placeholder="Ex: Limpeza de Pele Premium, LED Terapêutico" />
      </div>
      <div>
        <Label>Rotação mensal (vírgula)</Label>
        <Input value={rotacaoMensal} onChange={(e) => setRotacaoMensal(e.target.value)} className="mt-1" placeholder="Ex: Microagulhamento, Drug Delivery" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Trimestral</Label>
          <Input value={incluiTrimestral} onChange={(e) => setIncluiTrimestral(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Semestral</Label>
          <Input value={incluiSemestral} onChange={(e) => setIncluiSemestral(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Anual</Label>
          <Input value={incluiAnual} onChange={(e) => setIncluiAnual(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Benefícios (vírgula)</Label>
        <Input value={beneficios} onChange={(e) => setBeneficios(e.target.value)} className="mt-1" placeholder="Ex: 10% de desconto, Agenda prioritária" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Desconto em procedimentos (%)</Label>
          <Input type="number" value={form.desconto_procedimentos || 0} onChange={(e) => setForm({ ...form, desconto_procedimentos: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Ordem</Label>
          <Input type="number" value={form.ordem || 0} onChange={(e) => setForm({ ...form, ordem: e.target.value })} className="mt-1" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm" style={{ color: "#B0B0B0" }}>
        <input type="checkbox" checked={!!form.contrato_anual} onChange={(e) => setForm({ ...form, contrato_anual: e.target.checked })} />
        Contrato anual
      </label>
      <label className="flex items-center gap-2 text-sm" style={{ color: "#B0B0B0" }}>
        <input type="checkbox" checked={!!form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} />
        Destaque (Premium)
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }}>Salvar</Button>
      </div>
    </form>
  );
}