import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { parseISO, isToday, isWithinInterval, isBefore, addDays, format, differenceInCalendarDays } from "date-fns";
import { formatBRL } from "@/lib/finCalc";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

const filtros = [
  { id: "hoje", label: "Vencem hoje" },
  { id: "3d", label: "3 dias" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "vencidas", label: "Vencidas" },
  { id: "todas", label: "Todas" },
];

export default function FinContasPagar() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState("30d");
  const { data: lancamentos = [] } = useQuery({ queryKey: ["lancamentos"], queryFn: () => base44.entities.DRELancamento.list("-data_vencimento", 500) });

  const pagarMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DRELancamento.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lancamentos"] }),
  });

  const marcarPago = (l) => {
    pagarMutation.mutate({ id: l.id, data: { status: "pago", data_pagamento: format(new Date(), "yyyy-MM-dd") } });
  };

  const despesas = useMemo(() => {
    return lancamentos.filter(l => ["despesa_fixa", "despesa_variavel", "custo_direto", "outra_despesa"].includes(l.tipo));
  }, [lancamentos]);

  const filtradas = useMemo(() => {
    const now = new Date();
    return despesas.filter(l => {
      if (["pago", "cancelado"].includes(l.status)) return false;
      if (!l.data_vencimento) return false;
      let venc;
      try { venc = parseISO(l.data_vencimento); } catch { return false; }
      if (filtro === "hoje") return isToday(venc);
      if (filtro === "vencidas") return isBefore(venc, now);
      if (filtro === "todas") return true;
      const dias = parseInt(filtro);
      return isWithinInterval(venc, { start: now, end: addDays(now, dias) });
    }).sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
  }, [despesas, filtro]);

  const total = filtradas.reduce((s, l) => s + (l.valor || 0), 0);

  const alertaVencimento = (l) => {
    if (l.status === "vencido") return { txt: "Vencido", cor: "#EF4444" };
    try {
      const dias = differenceInCalendarDays(parseISO(l.data_vencimento), new Date());
      if (dias <= 0) return { txt: "Vence hoje", cor: "#EF4444" };
      if (dias <= 3) return { txt: `${dias}d`, cor: "#FB923C" };
      if (dias <= 7) return { txt: `${dias}d`, cor: "#FACC15" };
      return { txt: `${dias}d`, cor: T.dim };
    } catch { return { txt: "—", cor: T.dim }; }
  };

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
          <p style={{ fontSize: 10, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total a Pagar</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: T.gold, margin: 0 }}>{formatBRL(total)}</p>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                {["Descrição", "Categoria", "Vencimento", "Alerta", "Valor", "Forma", "Status", ""].map(h => (
                  <th key={h} style={{ textAlign: h === "Valor" ? "right" : "left", padding: "10px 14px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: T.dim, fontSize: 13 }}>Nenhuma conta a pagar neste período.</td></tr>
              )}
              {filtradas.map(l => {
                const al = alertaVencimento(l);
                return (
                  <tr key={l.id} style={{ borderBottom: `1px solid #1E1E1E` }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: T.text }}>{l.descricao}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{l.categoria || l.tipo || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{l.data_vencimento ? format(parseISO(l.data_vencimento), "dd/MM/yyyy") : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: al.cor }}>{al.txt}</span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: T.text, textAlign: "right", fontWeight: 500 }}>{formatBRL(l.valor)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{l.forma_pagamento || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 11, color: l.status === "vencido" ? "#EF4444" : T.muted }}>{l.status}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {l.status !== "pago" && (
                        <button onClick={() => marcarPago(l)} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.gold, borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "Inter" }}>Pagar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}