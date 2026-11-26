import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { calcularDRE } from "@/lib/dreUtils";
import { usePermissions } from "@/lib/PermissionsContext";

const dia = (d) => format(d, "yyyy-MM-dd");
const DOSSIE_PAGO = ["pago_integral", "pago_parcial", "entrada_paga", "conferido"];

const periodoDe = (start, end) => ({
  periodo: "custom",
  data_inicio: dia(start),
  data_fim: dia(end),
  view: "realizado",
});

/** Números financeiros do dashboard — mesma base usada pelo módulo DRE. */
export function useDashboardFinanceiro() {
  const agora = new Date();
  const { hasAction } = usePermissions();
  const permitido = hasAction("ver_financeiro");

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-created_date", 2000),
    enabled: permitido,
  });
  const { data: dossieFinanceiro = [] } = useQuery({
    queryKey: ["dossie-financeiro-dre"],
    queryFn: () => base44.entities.DossieFinanceiro.list("-created_date", 2000),
    enabled: permitido,
  });
  const { data: lancamentos = [] } = useQuery({
    queryKey: ["dreLancamentos"],
    queryFn: () => base44.entities.DRELancamento.list("-created_date", 2000),
    enabled: permitido,
  });
  const { data: config } = useQuery({
    queryKey: ["configuracao-financeira"],
    queryFn: async () => (await base44.entities.ConfiguracaoFinanceira.list())[0] || null,
    enabled: permitido,
  });

  return useMemo(() => {
    const base = {
      transactions,
      dossieFinanceiro,
      lancamentos,
      treatments: [],
      procedures: [],
      supplies: [],
    };

    const resumo = (start, end) => {
      const dre = calcularDRE({ ...base, filters: periodoDe(start, end), view: "realizado" });
      return {
        recebido: dre.receitaBruta,
        despesas: dre.receitaBruta - dre.lucroLiquido,
        lucro: dre.lucroLiquido,
        margem: dre.margemLiquida,
        recebimentos: dre.periodTxs.length + dre.periodLancs.length,
      };
    };

    const hoje = resumo(startOfDay(agora), endOfDay(agora));
    const mes = resumo(startOfMonth(agora), endOfMonth(agora));

    const serie = [];
    for (let i = 5; i >= 0; i -= 1) {
      const ref = subMonths(agora, i);
      const r = resumo(startOfMonth(ref), endOfMonth(ref));
      serie.push({
        mes: format(ref, "MMM", { locale: ptBR }),
        receita: Math.round(r.recebido),
        despesas: Math.round(r.despesas),
      });
    }

    const inicioMes = startOfMonth(agora);
    const fimMes = endOfMonth(agora);
    const porProcedimento = {};
    dossieFinanceiro.forEach((d) => {
      if (!["pago_integral", "pago_parcial", "entrada_paga", "conferido"].includes(d.status_financeiro)) return;
      if (!d.data_pagamento) return;
      const data = parseISO(d.data_pagamento);
      if (data < inicioMes || data > fimMes) return;
      const nome = d.procedimento || "Outros";
      porProcedimento[nome] = (porProcedimento[nome] || 0) + (Number(d.valor_total) || 0);
    });
    const totalProcedimentos = Object.values(porProcedimento).reduce((s, v) => s + v, 0);
    const procedimentos = Object.entries(porProcedimento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, valor]) => ({
        name,
        valor,
        value: totalProcedimentos > 0 ? Math.round((valor / totalProcedimentos) * 100) : 0,
      }));

    const lancamentosMes = lancamentos.filter((l) => {
      if (l.status === "cancelado") return false;
      return (l.data_vencimento || "").startsWith(dia(inicioMes).slice(0, 7));
    });
    const lancamentosPagos = lancamentosMes.filter((l) => l.status === "pago");
    const taxaRecebimento = lancamentosMes.length > 0
      ? (lancamentosPagos.length / lancamentosMes.length) * 100
      : 0;

    const metaValor = Number(config?.meta_faturamento_mensal) || 0;
    const metaPct = metaValor > 0 ? Math.min(100, (mes.recebido / metaValor) * 100) : 0;

    return { hoje, mes, serie, procedimentos, metaValor, metaPct, taxaRecebimento };
  }, [transactions, dossieFinanceiro, lancamentos, config]);
}