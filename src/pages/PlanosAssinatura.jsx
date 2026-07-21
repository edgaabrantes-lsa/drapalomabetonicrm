import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CalendarClock, Plus, Edit, Copy, Archive, Eye, Check, TrendingUp, Users, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import PlanoForm from "@/components/assinatura/PlanoForm";

const fmtBRL = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const CAT_LABEL = {
  entrada: "Plano de Entrada",
  principal: "Plano Principal",
  vip: "Plano VIP",
  outro: "Outro",
};

const STATUS_ASS = {
  ativo:      { label: "Ativo",      color: "#10B981", bg: "rgba(16,185,129,0.10)" },
  suspenso:   { label: "Suspenso",   color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  cancelado:  { label: "Cancelado",  color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  finalizado: { label: "Finalizado", color: "#B0B0B0", bg: "rgba(176,176,176,0.10)" },
};

function SecaoInclui({ titulo, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>{titulo}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#B0B0B0" }}>
            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#C8A96A" }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanoCard({ plano, onEdit, onDuplicate, onArchive, onView }) {
  const isVip = plano.categoria === "vip" || plano.destaque;
  return (
    <div
      className="rounded-xl border p-6 transition-all hover:border-[#3A3A3A] relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: isVip ? "#1C1813" : "#1A1A1A",
        borderColor: isVip ? "rgba(200,169,106,0.35)" : "#2B2B2B",
      }}
    >
      {isVip && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C8A96A" }}>
          <Sparkles className="w-3 h-3" /> Premium
        </div>
      )}
      <div className="flex items-center gap-2 mb-2 pr-16">
        <CalendarClock className="w-4 h-4" style={{ color: "#C8A96A" }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C8A96A" }}>
          {CAT_LABEL[plano.categoria] || plano.categoria}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#FFFFFF" }}>{plano.nome}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-semibold" style={{ color: "#C8A96A" }}>{fmtBRL(plano.valor_mensal)}</span>
        <span className="text-sm" style={{ color: "#666" }}>/mês</span>
      </div>
      {plano.contrato_anual && (
        <span className="text-[11px] mb-3 inline-block" style={{ color: "#888" }}>Contrato anual</span>
      )}
      <p className="text-sm mb-4" style={{ color: "#B0B0B0" }}>{plano.objetivo}</p>

      <div className="flex-1">
        <SecaoInclui titulo="Inclui todo mês" items={plano.inclui_mensal} />
        <SecaoInclui titulo="Rotação mensal" items={plano.rotacao_mensal} />
        <SecaoInclui titulo="Trimestralmente" items={plano.inclui_trimestral} />
        <SecaoInclui titulo="Semestralmente" items={plano.inclui_semestral} />
        <SecaoInclui titulo="Anualmente" items={plano.inclui_anual} />
        <SecaoInclui titulo="Benefícios" items={plano.beneficios} />
        {plano.desconto_procedimentos > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs" style={{ backgroundColor: "rgba(200,169,106,0.08)", color: "#C8A96A", border: "1px solid rgba(200,169,106,0.2)" }}>
            <TrendingUp className="w-3 h-3" /> {plano.desconto_procedimentos}% off em procedimentos
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t" style={{ borderColor: "#2B2B2B" }}>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onView(plano)}>
          <Eye className="w-3.5 h-3.5" /> Visualizar
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(plano)}>
          <Edit className="w-3.5 h-3.5" /> Editar
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onDuplicate(plano)}>
          <Copy className="w-3.5 h-3.5" /> Duplicar
        </Button>
        {plano.status !== "arquivado" && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onArchive(plano)}>
            <Archive className="w-3.5 h-3.5" /> Arquivar
          </Button>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ planos, assinaturas }) {
  const ativas = assinaturas.filter((a) => a.status === "ativo");
  const mrr = ativas.reduce((s, a) => s + (a.valor_mensal || 0), 0);
  const arr = mrr * 12;
  const canceladas = assinaturas.filter((a) => a.status === "cancelado");
  const totalContratadas = assinaturas.length;
  const churn = totalContratadas > 0 ? (canceladas.length / totalContratadas) * 100 : 0;
  const renovadas = assinaturas.filter((a) => a.status === "finalizado").length;
  const taxaRenovacao = totalContratadas > 0 ? (renovadas / totalContratadas) * 100 : 0;

  const distPorPlano = {};
  ativas.forEach((a) => {
    distPorPlano[a.plano_nome] = (distPorPlano[a.plano_nome] || 0) + 1;
  });
  const maxDist = Math.max(...Object.values(distPorPlano), 1);

  const hoje = new Date();
  const proxVenc = ativas
    .map((a) => ({ ...a, venc: new Date(a.proximo_vencimento) }))
    .filter((a) => a.venc >= hoje)
    .sort((a, b) => a.venc - b.venc)
    .slice(0, 6);

  const contratosFim = ativas
    .map((a) => ({ ...a, fim: new Date(a.data_fim) }))
    .filter((a) => a.fim >= hoje)
    .sort((a, b) => a.fim - b.fim)
    .slice(0, 6);

  const KPI = ({ label, value, sub, icon: Icon, color }) => (
    <div className="rounded-lg p-5" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>{label}</span>
      </div>
      <p className="text-2xl font-semibold" style={{ color: "#FFFFFF" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#666" }}>{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Assinantes Ativos" value={ativas.length} icon={Users} color="#C8A96A" />
        <KPI label="Receita Recorrente (MRR)" value={fmtBRL(mrr)} sub="por mês" icon={TrendingUp} color="#10B981" />
        <KPI label="Receita Anual (ARR)" value={fmtBRL(arr)} sub="projetada" icon={TrendingUp} color="#C8A96A" />
        <KPI label="Churn" value={`${churn.toFixed(1)}%`} sub={`${canceladas.length} cancelamentos`} icon={AlertCircle} color="#EF4444" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <KPI label="Taxa de Renovação" value={`${taxaRenovacao.toFixed(1)}%`} icon={RefreshCw} color="#10B981" />
        <KPI label="Distribuição por plano" value={Object.keys(distPorPlano).length || 0} sub="planos ativos" icon={CalendarClock} color="#C8A96A" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-lg p-5" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>Distribuição por plano</p>
          {Object.keys(distPorPlano).length === 0 ? (
            <p className="text-sm" style={{ color: "#666" }}>Sem assinantes ativos.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(distPorPlano).map(([nome, count]) => (
                <div key={nome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "#FFFFFF" }}>{nome}</span>
                    <span style={{ color: "#C8A96A" }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: "#2B2B2B" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${(count / maxDist) * 100}%`, backgroundColor: "#C8A96A" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg p-5" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>Próximos vencimentos</p>
          {proxVenc.length === 0 ? (
            <p className="text-sm" style={{ color: "#666" }}>Nenhum vencimento próximo.</p>
          ) : (
            <div className="space-y-2">
              {proxVenc.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: "#FFFFFF" }}>{a.patient_name}</span>
                  <span style={{ color: "#888" }}>{fmtDate(a.proximo_vencimento)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>Contratos próximos do encerramento</p>
        {contratosFim.length === 0 ? (
          <p className="text-sm" style={{ color: "#666" }}>Nenhum contrato próximo do fim.</p>
        ) : (
          <div className="space-y-2">
            {contratosFim.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <span style={{ color: "#FFFFFF" }}>{a.patient_name}</span>
                  <span className="ml-2 text-xs" style={{ color: "#666" }}>{a.plano_nome}</span>
                </div>
                <span style={{ color: "#F59E0B" }}>encerra em {fmtDate(a.data_fim)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssinantesTab({ assinaturas, planos }) {
  const [search, setSearch] = useState("");
  const filtered = assinaturas.filter((a) =>
    a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.plano_nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        placeholder="Buscar assinante ou plano..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 rounded-md text-sm"
        style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", color: "#FFFFFF" }}
      />
      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "#666" }}>Nenhuma assinatura encontrada.</p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #2B2B2B" }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Paciente</th>
                <th style={{ textAlign: "left" }}>Plano</th>
                <th style={{ textAlign: "left" }}>Início</th>
                <th style={{ textAlign: "left" }}>Próx. vencimento</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const st = STATUS_ASS[a.status] || STATUS_ASS.ativo;
                return (
                  <tr key={a.id}>
                    <td style={{ color: "#FFFFFF" }}>{a.patient_name}</td>
                    <td style={{ color: "#B0B0B0" }}>{a.plano_nome}</td>
                    <td style={{ color: "#888" }}>{fmtDate(a.data_inicio)}</td>
                    <td style={{ color: "#888" }}>{fmtDate(a.proximo_vencimento)}</td>
                    <td style={{ textAlign: "right", color: "#C8A96A" }}>{fmtBRL(a.valor_mensal)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="px-2 py-1 rounded text-[11px] font-medium" style={{ color: st.color, backgroundColor: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PlanosAssinatura() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("planos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["planos-assinatura"],
    queryFn: () => base44.entities.PlanoAssinatura.list(),
  });

  const { data: assinaturas = [] } = useQuery({
    queryKey: ["assinaturas-todas"],
    queryFn: () => base44.entities.AssinaturaPaciente.list("-created_date", 500),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.PlanoAssinatura.update(id, data) : base44.entities.PlanoAssinatura.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["planos-assinatura"]); setDialogOpen(false); setEditing(null); },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanoAssinatura.update(id, { status: "arquivado" }),
    onSuccess: () => queryClient.invalidateQueries(["planos-assinatura"]),
  });

  const duplicate = (plano) => {
    const { id, created_date, updated_date, created_by_id, ...rest } = plano;
    saveMutation.mutate({ id: null, data: { ...rest, nome: `${plano.nome} (cópia)`, status: "ativo" } });
  };

  const planosVisiveis = planos
    .filter((p) => p.status === "ativo")
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.nome.localeCompare(b.nome));

  const TABS = [
    { id: "planos", label: "Planos", icon: CalendarClock },
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "assinantes", label: "Assinantes", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#FFFFFF" }}>Planos de Assinatura</h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            Programa de acompanhamento contínuo — recorrência e fidelização de longo prazo.
          </p>
        </div>
        {tab === "planos" && (
          <Button className="gap-2" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }} onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4" /> Novo Plano
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: "#2B2B2B" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative"
            style={{ color: tab === t.id ? "#FFFFFF" : "#666" }}
          >
            <t.icon className="w-4 h-4" style={{ color: tab === t.id ? "#C8A96A" : "#666" }} />
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "#C8A96A" }} />}
          </button>
        ))}
      </div>

      {tab === "planos" && (
        isLoading ? (
          <p className="text-sm" style={{ color: "#666" }}>Carregando planos...</p>
        ) : planosVisiveis.length === 0 ? (
          <div className="rounded-lg p-10 text-center" style={{ backgroundColor: "#1A1A1A", border: "1px dashed #2B2B2B" }}>
            <CalendarClock className="w-8 h-8 mx-auto mb-3" style={{ color: "#444" }} />
            <p className="text-sm mb-3" style={{ color: "#888" }}>Nenhum plano cadastrado ainda.</p>
            <Button className="gap-2" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }} onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4" /> Criar primeiro plano
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {planosVisiveis.map((p) => (
              <PlanoCard
                key={p.id}
                plano={p}
                onView={setViewing}
                onEdit={(pl) => { setEditing(pl); setDialogOpen(true); }}
                onDuplicate={duplicate}
                onArchive={(pl) => archiveMutation.mutate(pl.id)}
              />
            ))}
          </div>
        )
      )}

      {tab === "dashboard" && <DashboardTab planos={planos} assinaturas={assinaturas} />}
      {tab === "assinantes" && <AssinantesTab assinaturas={assinaturas} planos={planos} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Plano" : "Novo Plano de Assinatura"}</DialogTitle>
          </DialogHeader>
          <PlanoForm
            plano={editing}
            onSubmit={(data) => saveMutation.mutate({ id: editing?.id, data })}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.nome}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C8A96A" }}>
                {CAT_LABEL[viewing.categoria]} · {fmtBRL(viewing.valor_mensal)}/mês {viewing.contrato_anual ? "· Contrato anual" : ""}
              </span>
              <p className="text-sm" style={{ color: "#B0B0B0" }}>{viewing.objetivo}</p>
              <SecaoInclui titulo="Inclui todo mês" items={viewing.inclui_mensal} />
              <SecaoInclui titulo="Rotação mensal" items={viewing.rotacao_mensal} />
              <SecaoInclui titulo="Trimestralmente" items={viewing.inclui_trimestral} />
              <SecaoInclui titulo="Semestralmente" items={viewing.inclui_semestral} />
              <SecaoInclui titulo="Anualmente" items={viewing.inclui_anual} />
              <SecaoInclui titulo="Benefícios" items={viewing.beneficios} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}