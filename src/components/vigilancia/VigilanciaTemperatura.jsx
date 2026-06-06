import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const TEMP_MIN = 2;
const TEMP_MAX = 8;

export default function VigilanciaTemperatura() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ data_hora: "", temperatura: "", responsavel: "", observacoes: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: registros = [] } = useQuery({
    queryKey: ["vigilancia-temperatura"],
    queryFn: () => base44.entities.VigilanciaTemperatura.list("-data_hora", 100),
  });

  const createMutation = useMutation({
    mutationFn: (d) => {
      const dentro_faixa = parseFloat(d.temperatura) >= TEMP_MIN && parseFloat(d.temperatura) <= TEMP_MAX;
      return base44.entities.VigilanciaTemperatura.create({ ...d, temperatura: parseFloat(d.temperatura), dentro_faixa });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vigilancia-temperatura"] });
      setForm({ data_hora: "", temperatura: "", responsavel: "", observacoes: "" });
      setShowForm(false);
    },
  });

  const alertas = registros.filter(r => !r.dentro_faixa);
  const chartData = [...registros].reverse().slice(-30).map(r => ({
    hora: r.data_hora ? r.data_hora.slice(0, 16).replace("T", " ") : "",
    temp: r.temperatura,
    fora: !r.dentro_faixa,
  }));

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}>
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">{alertas.length} registro(s) fora da faixa ({TEMP_MIN}–{TEMP_MAX}°C)</p>
            <p className="text-xs text-red-400/70 mt-0.5">Verifique o equipamento de refrigeração imediatamente.</p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-white">Histórico de Temperatura</p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Dentro da faixa</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Fora da faixa</span>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hora" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false}
                tickFormatter={v => v.slice(-5)} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} domain={[0, 15]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
                formatter={v => [`${v}°C`, "Temperatura"]}
              />
              <ReferenceLine y={TEMP_MIN} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Min ${TEMP_MIN}°C`, fill: "#f59e0b", fontSize: 10 }} />
              <ReferenceLine y={TEMP_MAX} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Max ${TEMP_MAX}°C`, fill: "#ef4444", fontSize: 10 }} />
              <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} dot={(props) => {
                const { cx, cy, payload } = props;
                return <circle key={payload.hora} cx={cx} cy={cy} r={3}
                  fill={payload.fora ? "#ef4444" : "#10b981"} stroke="none" />;
              }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
            Nenhum registro ainda
          </div>
        )}
      </div>

      {/* Novo registro */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          <Plus className="h-4 w-4 mr-1" /> Registrar Temperatura
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
          <p className="text-sm font-medium text-white">Novo Registro</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Data e Hora</Label>
              <Input type="datetime-local" value={form.data_hora}
                onChange={e => setForm(p => ({ ...p, data_hora: e.target.value }))}
                className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Temperatura (°C)</Label>
              <Input type="number" step="0.1" value={form.temperatura}
                onChange={e => setForm(p => ({ ...p, temperatura: e.target.value }))}
                className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Responsável</Label>
              <Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))}
                className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Observações</Label>
              <Input value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
            </div>
          </div>
          {form.temperatura && (
            <p className="text-xs" style={{ color: parseFloat(form.temperatura) >= TEMP_MIN && parseFloat(form.temperatura) <= TEMP_MAX ? "#10b981" : "#ef4444" }}>
              {parseFloat(form.temperatura) >= TEMP_MIN && parseFloat(form.temperatura) <= TEMP_MAX
                ? "Temperatura dentro da faixa ideal"
                : `Fora da faixa! Faixa ideal: ${TEMP_MIN}–${TEMP_MAX}°C`}
            </p>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={() => createMutation.mutate(form)}
              disabled={!form.data_hora || !form.temperatura}
              style={{ backgroundColor: "#1e40af", color: "#fff" }}>
              Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Tabela histórico */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#1e293b", backgroundColor: "#0a0f1e" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#0f172a" }}>
              {["Data/Hora", "Temperatura", "Status", "Responsável", "Obs"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registros.slice(0, 50).map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #1e293b" }}>
                <td className="px-4 py-2.5 text-slate-300 text-xs">{r.data_hora?.replace("T", " ").slice(0, 16)}</td>
                <td className="px-4 py-2.5">
                  <span className="font-semibold" style={{ color: r.dentro_faixa ? "#10b981" : "#ef4444" }}>
                    {r.temperatura}°C
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {r.dentro_faixa
                    ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />OK</span>
                    : <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="h-3 w-3" />Alerta</span>
                  }
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "#94a3b8" }}>{r.responsavel || "—"}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "#64748b" }}>{r.observacoes || "—"}</td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-600">Nenhum registro</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}