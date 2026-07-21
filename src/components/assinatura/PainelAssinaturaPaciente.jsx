import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, CalendarClock, Check, Clock, XCircle, Activity } from "lucide-react";

const fmtBRL = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const STATUS_INFO = {
  ativo:      { label: "Ativo",      color: "#10B981", bg: "rgba(16,185,129,0.10)" },
  suspenso:   { label: "Suspenso",   color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  cancelado:  { label: "Cancelado",  color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  finalizado: { label: "Finalizado", color: "#B0B0B0", bg: "rgba(176,176,176,0.10)" },
};

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function NovaAssinaturaForm({ patient, planos, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    plano_id: "",
    data_inicio: new Date().toISOString().slice(0, 10),
    vigencia_meses: 12,
    forma_pagamento: "pix",
    observacoes: "",
  });

  const planoSel = planos?.find((p) => p.id === form.plano_id);

  const submit = (e) => {
    e.preventDefault();
    if (!planoSel) return;
    onSubmit({
      patient_id: patient.id,
      patient_name: patient.full_name,
      plano_id: planoSel.id,
      plano_nome: planoSel.nome,
      categoria: planoSel.categoria,
      valor_mensal: planoSel.valor_mensal,
      data_inicio: form.data_inicio,
      vigencia_meses: Number(form.vigencia_meses) || 12,
      data_fim: addMonths(form.data_inicio, Number(form.vigencia_meses) || 12),
      proximo_vencimento: addMonths(form.data_inicio, 1),
      status: "ativo",
      forma_pagamento: form.forma_pagamento,
      observacoes: form.observacoes,
      sessoes_previstas: (Number(form.vigencia_meses) || 12),
      sessoes_realizadas: 0,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Plano</Label>
        <Select value={form.plano_id} onValueChange={(v) => setForm({ ...form, plano_id: v })}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
          <SelectContent>
            {(planos || []).filter((p) => p.status === "ativo").map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome} — {fmtBRL(p.valor_mensal)}/mês</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {planoSel && (
        <div className="rounded-md p-3 text-sm" style={{ backgroundColor: "rgba(200,169,106,0.06)", border: "1px solid rgba(200,169,106,0.2)", color: "#B0B0B0" }}>
          <span style={{ color: "#C8A96A", fontWeight: 600 }}>{planoSel.objetivo}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Data de início</Label>
          <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} className="mt-1" required />
        </div>
        <div>
          <Label>Vigência (meses)</Label>
          <Input type="number" value={form.vigencia_meses} onChange={(e) => setForm({ ...form, vigencia_meses: e.target.value })} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Forma de pagamento</Label>
        <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
            <SelectItem value="cartao_debito">Cartão de débito</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-1" rows={2} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }}>Contratar Plano</Button>
      </div>
    </form>
  );
}

function PainelUtilizacao({ patient, assinatura }) {
  const { data: agendamentos = [] } = useQuery({
    queryKey: ["appointments-paciente", patient.id],
    queryFn: () => base44.entities.Appointment.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });
  const { data: imagens = [] } = useQuery({
    queryKey: ["dossie-imagens-paciente", patient.id],
    queryFn: () => base44.entities.DossieImagem.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  const realizadas = agendamentos.filter((a) => a.status === "completed").length;
  const previstas = assinatura?.sessoes_previstas || 0;
  const pendentes = Math.max(previstas - realizadas, 0);
  const proximos = agendamentos
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 4);

  const KPI = ({ label, value, icon: Icon, color }) => (
    <div className="rounded-lg p-4" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>{label}</span>
      </div>
      <p className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Previstas" value={previstas} icon={CalendarClock} color="#C8A96A" />
        <KPI label="Realizadas" value={realizadas} icon={Check} color="#10B981" />
        <KPI label="Pendentes" value={pendentes} icon={Clock} color="#F59E0B" />
        <KPI label="Fotos no dossiê" value={imagens.filter((i) => !i.deleted).length} icon={Activity} color="#B0B0B0" />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>Próximos procedimentos programados</p>
        {proximos.length === 0 ? (
          <p className="text-sm" style={{ color: "#666" }}>Nenhum agendamento futuro.</p>
        ) : (
          <div className="space-y-2">
            {proximos.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md px-3 py-2" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
                <span className="text-sm" style={{ color: "#FFFFFF" }}>{a.procedure_name || "Procedimento"}</span>
                <span className="text-xs" style={{ color: "#888" }}>{fmtDate(a.start_time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PainelAssinaturaPaciente({ patient }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: planos = [] } = useQuery({
    queryKey: ["planos-assinatura"],
    queryFn: () => base44.entities.PlanoAssinatura.list(),
  });

  const { data: assinaturas = [], isLoading } = useQuery({
    queryKey: ["assinaturas-paciente", patient?.id],
    queryFn: () => base44.entities.AssinaturaPaciente.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssinaturaPaciente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["assinaturas-paciente", patient.id]);
      setDialogOpen(false);
    },
  });

  const updateStatus = (id, status) =>
    base44.entities.AssinaturaPaciente.update(id, { status }).then(() =>
      queryClient.invalidateQueries(["assinaturas-paciente", patient.id])
    );

  const ativa = assinaturas.find((a) => a.status === "ativo");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>Plano de Assinatura</h3>
          <p className="text-xs mt-0.5" style={{ color: "#666" }}>Programa de acompanhamento contínuo</p>
        </div>
        {!ativa && (
          <Button className="gap-2" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }} onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Contratar Plano
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "#666" }}>Carregando...</p>
      ) : assinaturas.length === 0 ? (
        <div className="rounded-lg p-6 text-center" style={{ backgroundColor: "#1A1A1A", border: "1px dashed #2B2B2B" }}>
          <CalendarClock className="w-6 h-6 mx-auto mb-2" style={{ color: "#444" }} />
          <p className="text-sm" style={{ color: "#888" }}>Esta paciente ainda não possui um plano de assinatura.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assinaturas.map((a) => {
            const st = STATUS_INFO[a.status] || STATUS_INFO.ativo;
            return (
              <div key={a.id} className="rounded-lg p-4" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-base font-semibold" style={{ color: "#FFFFFF" }}>{a.plano_nome}</p>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "#C8A96A" }}>{a.categoria}</span>
                  </div>
                  <span className="px-2 py-1 rounded text-[11px] font-medium" style={{ color: st.color, backgroundColor: st.bg }}>
                    {st.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Início</p>
                    <p style={{ color: "#FFFFFF" }}>{fmtDate(a.data_inicio)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Vigência</p>
                    <p style={{ color: "#FFFFFF" }}>{a.vigencia_meses} meses</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Valor mensal</p>
                    <p style={{ color: "#C8A96A" }}>{fmtBRL(a.valor_mensal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Próx. vencimento</p>
                    <p style={{ color: "#FFFFFF" }}>{fmtDate(a.proximo_vencimento)}</p>
                  </div>
                </div>
                {a.observacoes && <p className="text-xs mt-3 pt-3 border-t" style={{ color: "#888", borderColor: "#2B2B2B" }}>{a.observacoes}</p>}

                {a.status === "ativo" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#2B2B2B" }}>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "suspenso")}>Suspender</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "cancelado")}>Cancelar</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "finalizado")}>Finalizar</Button>
                  </div>
                )}
                {a.status === "suspenso" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#2B2B2B" }}>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "ativo")}>Reativar</Button>
                  </div>
                )}

                {a.status === "ativo" && <PainelUtilizacao patient={patient} assinatura={a} />}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contratar Plano de Assinatura</DialogTitle>
          </DialogHeader>
          <NovaAssinaturaForm
            patient={patient}
            planos={planos}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}