import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_COLORS = {
  anamnese: "bg-blue-500/20 text-blue-400",
  evolucao: "bg-green-500/20 text-green-400",
  intercorrencia: "bg-red-500/20 text-red-400",
  revisao: "bg-yellow-500/20 text-yellow-400",
  orientacao: "bg-purple-500/20 text-purple-400"
};

const TIPO_LABELS = {
  anamnese: "Anamnese",
  evolucao: "Evolução Clínica",
  intercorrencia: "Intercorrência",
  revisao: "Revisão",
  orientacao: "Orientações"
};

const emptyForm = {
  tipo: "evolucao",
  queixa_principal: "",
  expectativa: "",
  historico_clinico: "",
  historico_estetico: "",
  medicamentos: "",
  alergias: "",
  doencas_preexistentes: "",
  procedimentos_anteriores: "",
  contraindicacoes: "",
  descricao: "",
  orientacoes_pre: "",
  orientacoes_pos: "",
  profissional: ""
};

export default function DossieProntuario({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [expandedId, setExpandedId] = useState(null);

  const { data: evolucoes = [] } = useQuery({
    queryKey: ["dossie-evolucoes", patient.id],
    queryFn: () => base44.entities.DossieEvolucao.filter({ patient_id: patient.id }, "-data_registro", 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DossieEvolucao.create({
      ...data,
      patient_id: patient.id,
      patient_name: patient.full_name,
      data_registro: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-evolucoes", patient.id] });
      setShowForm(false);
      setFormData({ ...emptyForm });
    }
  });

  const field = (label, key, rows = 0) => (
    <div>
      <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">{label}</Label>
      {rows > 0 ? (
        <Textarea
          value={formData[key] || ""}
          onChange={(e) => setFormData(p => ({ ...p, [key]: e.target.value }))}
          rows={rows}
          className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"
        />
      ) : (
        <Input
          value={formData[key] || ""}
          onChange={(e) => setFormData(p => ({ ...p, [key]: e.target.value }))}
          className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A95AA]">{evolucoes.length} registro(s) no prontuário</p>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs"
          size="sm"
        >
          Adicionar Evolução
        </Button>
      </div>

      {showForm && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Nova Entrada no Prontuário</h3>
          </div>

          <div>
            <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Tipo de Registro</Label>
            <Select value={formData.tipo} onValueChange={(v) => setFormData(p => ({ ...p, tipo: v }))}>
              <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#171D29] border-[#252D3E]">
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.tipo === "anamnese" && (
            <>
              {field("Queixa Principal", "queixa_principal", 2)}
              {field("Expectativa da Paciente", "expectativa", 2)}
              {field("Histórico Clínico", "historico_clinico", 3)}
              {field("Histórico Estético", "historico_estetico", 2)}
              {field("Medicamentos em Uso", "medicamentos", 2)}
              {field("Alergias", "alergias", 2)}
              {field("Doenças Pré-existentes", "doencas_preexistentes", 2)}
              {field("Procedimentos Anteriores", "procedimentos_anteriores", 2)}
              {field("Contraindicações", "contraindicacoes", 2)}
            </>
          )}

          {field("Descrição / Observação Clínica", "descricao", 4)}

          {(formData.tipo === "evolucao" || formData.tipo === "anamnese") && (
            <>
              {field("Orientações Pré-procedimento", "orientacoes_pre", 2)}
              {field("Orientações Pós-procedimento", "orientacoes_pos", 2)}
            </>
          )}

          {field("Profissional Responsável", "profissional")}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#252D3E]">
            <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              size="sm"
              className="bg-[#C5A059] hover:bg-[#a17f3f] text-black"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Salvar Prontuário"}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {evolucoes.length === 0 && (
          <div className="text-center py-10 text-[#4A5568] text-sm">
            Nenhum registro no prontuário
          </div>
        )}
        {evolucoes.map((ev) => {
          const isOpen = expandedId === ev.id;
          return (
            <div key={ev.id} className="border border-[#252D3E] rounded-md bg-[#0F1521]">
              <button
                onClick={() => setExpandedId(isOpen ? null : ev.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#C5A059] flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${TIPO_COLORS[ev.tipo]}`}>{TIPO_LABELS[ev.tipo]}</Badge>
                      {ev.profissional && <span className="text-xs text-[#8A95AA]">— {ev.profissional}</span>}
                    </div>
                    <p className="text-xs text-[#4A5568] mt-0.5">
                      {ev.data_registro ? format(parseISO(ev.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
                    </p>
                  </div>
                </div>
                <span className="text-[#4A5568] text-xs">{isOpen ? "Fechar" : "Ver detalhes"}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#252D3E] pt-3">
                  {[
                    ["Queixa Principal", ev.queixa_principal],
                    ["Expectativa", ev.expectativa],
                    ["Histórico Clínico", ev.historico_clinico],
                    ["Histórico Estético", ev.historico_estetico],
                    ["Medicamentos", ev.medicamentos],
                    ["Alergias", ev.alergias],
                    ["Doenças Pré-existentes", ev.doencas_preexistentes],
                    ["Procedimentos Anteriores", ev.procedimentos_anteriores],
                    ["Contraindicações", ev.contraindicacoes],
                    ["Descrição / Observação", ev.descricao],
                    ["Orientações Pré-procedimento", ev.orientacoes_pre],
                    ["Orientações Pós-procedimento", ev.orientacoes_pos]
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs uppercase tracking-wider text-[#8A95AA]">{label}</p>
                      <p className="text-sm text-[#C8D0DF] mt-0.5 whitespace-pre-wrap">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}