import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { parseISO, isToday, isWithinInterval, isAfter, isBefore, addDays, format } from "date-fns";
import { formatBRL, normalizarRecebiveis } from "@/lib/finCalc";
import { usePermissions } from "@/lib/PermissionsContext";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

const statusColor = {
  previsto: "#8A8A8A", pendente: "#FACC15", recebido: "#4ADE80",
  parcialmente_recebido: "#60A5FA", vencido: "#EF4444", antecipado: "#C8A96A", cancelado: "#555", estornado: "#555",
};

const filtros = [
  { id: "hoje", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "60d", label: "60 dias" },
  { id: "90d", label: "90 dias" },
  { id: "vencidas", label: "Vencidas" },
  { id: "todas", label: "Todas" },
];

export default function FinContasReceber() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState("30d");
  const { data: rawParcelas = [] } = useQuery({ queryKey: ["parcelas"], queryFn: () => base44.entities.ParcelaRecebivel.list("-vencimento", 500) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.Transaction.list("-due_date", 500) });
  const parcelas = useMemo(() => normalizarRecebiveis(rawParcelas, transactions), [rawParcelas, transactions]);

  const { perfil } = usePermissions();
  const isSuperAdmin = perfil === "super_admin";

  const receberMutation = useMutation({
    mutationFn: ({ id, data, source }) => source === "transaction" ? base44.entities.Transaction.update(id, data) : base44.entities.ParcelaRecebivel.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parcelas"] }); queryClient.invalidateQueries({ queryKey: ["transactions"] }); },
  });

  const excluirMutation = useMutation({
    mutationFn: ({ id, source }) => source === "transaction" ? base44.entities.Transaction.delete(id) : base44.entities.ParcelaRecebivel.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parcelas"] }); queryClient.invalidateQueries({ queryKey: ["transactions"] }); },
  });

  const excluirParcela = (p) => {
    if (window.confirm(`Excluir a parcela de ${p.patient_name}? Esta ação não pode ser desfeita.`)) {
      excluirMutation.mutate({ id: p.id, source: p._source });
    }
  };

  const marcarRecebido = (p) => {
    if (p._source === "transaction") {
      receberMutation.mutate({ id: p.id, source: "transaction", data: { status: "paid", payment_date: format(new Date(), "yyyy-MM-dd") } });
    } else {
      receberMutation.mutate({ id: p.id, data: { status: "recebido", data_recebimento: format(new Date(), "yyyy-MM-dd") } });
    }
  };

  const filtradas = useMemo(() => {
    const now = new Date();
    return parcelas.filter(p => {
      if (["recebido", "cancelado", "estornado"].includes(p.status)) return false;
      if (!p.vencimento) return false;
      let venc;
      try { venc = parseISO(p.vencimento); } catch { return false; }
      if (filtro === "hoje") return isToday(venc);
      if (filtro === "vencidas") return isBefore(venc, now) && p.status !== "recebido";
      if (filtro === "todas") return true;
      const dias = parseInt(filtro);
      return isWithinInterval(venc, { start: now, end: addDays(now, dias) });
    }).sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
  }, [parcelas, filtro]);

  const total = filtradas.reduce((s, p) => s + (p.valor_liquido || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {filtros.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)} style={{
            padding: "7px 14px", borderRadius: 6, cursor: "pointer",
            background: filtro === f.id ? T.gold : "transparent",
            color: filtro === f.id ? "#000" : T.muted,
            border: `1px solid ${filtro === f.id ? T.gold : T.border}`,
            fontFamily: "Inter", fontSize: 12, fontWeight: 500,
          }}>{f.label}</button>
        ))}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total a Receber</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: T.gold, margin: 0 }}>{formatBRL(total)}</p>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                {["Paciente", "Protocolo", "Parc.", "Vencimento", "Valor Bruto", "Taxa", "Líquido", "Status", ""].map(h => (
                  <th key={h} style={{ textAlign: h === "Líquido" || h === "Valor Bruto" ? "right" : "left", padding: "10px 14px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: T.dim, fontSize: 13 }}>Nenhuma parcela neste período.</td></tr>
              )}
              {filtradas.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid #1E1E1E` }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: T.text }}>{p.patient_name}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{p.protocolo_nome || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{p.tipo === "entrada" ? "Entrada" : `${p.numero_parcela}/${p.num_parcelas_total || "?"}`}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{p.vencimento ? format(parseISO(p.vencimento), "dd/MM/yyyy") : "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted, textAlign: "right" }}>{formatBRL(p.valor_bruto)}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: T.dim, textAlign: "right" }}>{formatBRL(p.taxa)}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: T.text, textAlign: "right", fontWeight: 500 }}>{formatBRL(p.valor_liquido)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: statusColor[p.status] || T.muted }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[p.status] || T.muted }} />
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {p.status !== "recebido" && (
                        <button onClick={() => marcarRecebido(p)} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.gold, borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "Inter" }}>Receber</button>
                      )}
                      {isSuperAdmin && (
                        <button onClick={() => excluirParcela(p)} style={{ background: "transparent", border: `1px solid #5B1A1A`, color: "#EF4444", borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "Inter" }}>Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.dim, fontStyle: "italic" }}>Venda parcelada cria faturamento, mas o caixa pinga aos poucos.</p>
    </div>
  );
}