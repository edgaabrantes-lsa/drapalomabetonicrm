import { addMonths, format, parseISO, differenceInCalendarDays } from "date-fns";

export const formatBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;

export const formatNumber = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Regras de parcelamento por faixa de valor ──
export function maxParcelasByValor(valor, config) {
  const faixa1 = config?.faixa1_max ?? 3000;
  const faixa2 = config?.faixa2_max ?? 7999.99;
  const p1 = config?.faixa1_parcelas ?? 3;
  const p2 = config?.faixa2_parcelas ?? 6;
  const p3 = config?.faixa3_parcelas ?? 12;
  if (valor <= faixa1) return p1;
  if (valor <= faixa2) return p2;
  return p3;
}

export function entradaRecomendada(valor, pct = 30) {
  return valor * (pct / 100);
}

// ── Geração do cronograma de parcelas ──
export function gerarCronograma(valorTotal, entrada, numParcelas, dataVenda, taxaCartaoPct = 3.5, taxaParcelamentoPct = 2.5) {
  const saldo = valorTotal - (entrada || 0);
  const parcelas = [];
  const taxaTotal = (taxaCartaoPct + taxaParcelamentoPct) / 100;
  const base = dataVenda ? new Date(dataVenda) : new Date();

  if ((entrada || 0) > 0) {
    parcelas.push({
      numero: 0, tipo: "entrada",
      vencimento: format(base, "yyyy-MM-dd"),
      valor_bruto: entrada, taxa: 0, valor_liquido: entrada,
    });
  }
  const vp = numParcelas > 0 ? saldo / numParcelas : 0;
  for (let i = 1; i <= numParcelas; i++) {
    const venc = addMonths(base, i);
    const taxa = vp * taxaTotal;
    parcelas.push({
      numero: i, tipo: "parcela",
      vencimento: format(venc, "yyyy-MM-dd"),
      valor_bruto: vp, taxa, valor_liquido: vp - taxa,
    });
  }
  return parcelas;
}

// ── Simulação completa de uma condição de pagamento ──
export function simularCondicao({
  valor, entrada = 0, numParcelas = 0,
  taxaCartaoPct = 3.5, taxaParcelamentoPct = 2.5,
  taxaAntecipacaoPct = 4, pctAntecipado = 0,
  custoDireto = 0, dataVenda,
}) {
  const parcelas = gerarCronograma(valor, entrada, numParcelas, dataVenda, taxaCartaoPct, taxaParcelamentoPct);
  const totalTaxas = parcelas.reduce((s, p) => s + p.taxa, 0);
  const valorLiquido = valor - totalTaxas;
  const margemBruta = valor - custoDireto;
  const margemLiquida = valorLiquido - custoDireto;
  const parcelasFuturas = parcelas.filter(p => p.tipo === "parcela");
  const valorAntecipavel = parcelasFuturas.reduce((s, p) => s + p.valor_liquido, 0) * (pctAntecipado / 100);
  const custoAntecipacao = valorAntecipavel * (taxaAntecipacaoPct / 100);
  const liquidoAntecipado = valorAntecipavel - custoAntecipacao;
  const entradaMes1 = (parcelas.find(p => p.tipo === "entrada")?.valor_liquido || 0) + liquidoAntecipado;
  const contasReceber = parcelasFuturas.reduce((s, p) => s + p.valor_liquido, 0) - valorAntecipavel;
  return {
    parcelas, totalTaxas, valorLiquido, margemBruta, margemLiquida,
    custoAntecipacao, liquidoAntecipado, entradaMes1, contasReceber,
    pctLucro: valor > 0 ? (margemLiquida / valor) * 100 : 0,
  };
}

// ── Classificação da saúde do caixa ──
export function classificarSaudeCaixa({ caixaProjetado, pctMeta, saldoSeguranca, despesasProximos30d }) {
  if (pctMeta >= 100 && caixaProjetado >= saldoSeguranca && despesasProximos30d <= caixaProjetado) {
    return { nivel: "Saudável", cor: "#4ADE80", descricao: "Despesas dos próximos 30 dias cobertas, meta em dia, saldo de segurança preservado." };
  }
  if (pctMeta >= 80 && caixaProjetado > 0) {
    return { nivel: "Atenção", cor: "#FACC15", descricao: "Meta projetada entre 80% e 99%. Capital de giro reduzido, atenção às vendas parceladas." };
  }
  if (pctMeta >= 60) {
    return { nivel: "Risco", cor: "#FB923C", descricao: "Meta entre 60% e 79%. Despesas sem cobertura integral, risco de antecipação frequente." };
  }
  return { nivel: "Crítico", cor: "#EF4444", descricao: "Meta abaixo de 60%. Saldo insuficiente para os compromissos dos próximos 7 dias." };
}

// ── Buraco de caixa ──
export function calcularBuracoCaixa(meta, recebidoLiquido, previstoLiquido) {
  return meta - recebidoLiquido - previstoLiquido;
}

// ── Prazo médio de recebimento (dias) ──
export function prazoMedioRecebimento(parcelas) {
  const recebidas = parcelas.filter(p => p.data_recebimento && p.tipo !== "entrada");
  if (recebidas.length === 0) return 0;
  const total = recebidas.reduce((s, p) => {
    try {
      const dias = differenceInCalendarDays(parseISO(p.data_recebimento), parseISO(p.vencimento));
      return s + Math.max(0, dias);
    } catch { return s; }
  }, 0);
  return total / recebidas.length;
}

// ── Cenários comerciais para preencher buraco de caixa ──
export function gerarCenarios(buraco, protocolos) {
  if (buraco <= 0) return null;
  const protos = protocolos?.length ? protocolos : [
    { nome: "Consulta/Procedimento pequeno", valor: 2000, custo: 400 },
    { nome: "Protocolo intermediário", valor: 4000, custo: 900 },
    { nome: "Protocolo premium / Full Face", valor: 12000, custo: 3500 },
  ];
  const cenarios = [
    { nome: "Conservador", priorizar: "Pix, cartão à vista e entradas maiores", pctEntrada: 100, parcelas: 0 },
    { nome: "Equilibrado", priorizar: "Pix, 3x, 6x e protocolos com entrada", pctEntrada: 30, parcelas: 6 },
    { nome: "Agressivo", priorizar: "Maior volume e tickets elevados, 12x com entrada", pctEntrada: 30, parcelas: 12 },
  ];
  return cenarios.map(c => {
    const combinacao = protos.map(p => {
      const entrada = p.valor * (c.pctEntrada / 100);
      const liquidoMes1 = c.parcelas === 0 ? p.valor * 0.965 : entrada * 0.965;
      const qtd = Math.ceil(buraco / Math.max(liquidoMes1, 1));
      return { protocolo: p.nome, qtd, liquidoMes1Cada: liquidoMes1, totalCaixa: qtd * liquidoMes1 };
    });
    return { ...c, combinacao };
  });
}

// ── Normaliza recebíveis de múltiplas fontes (ParcelaRecebivel + Transaction) ──
export function normalizarRecebiveis(parcelas = [], transactions = []) {
  const fromTransactions = transactions
    .filter(t => t.type === "income")
    .map(t => ({
      id: t.id,
      _source: "transaction",
      patient_name: t.patient_name || "",
      protocolo_nome: t.description || (t.category === "procedure" ? "Procedimento" : t.category === "protocol" ? "Protocolo" : "Venda"),
      data_venda: t.created_date ? t.created_date.slice(0, 10) : (t.due_date || ""),
      numero_parcela: t.current_installment || 1,
      tipo: (t.current_installment || 1) <= 1 ? "entrada" : "parcela",
      valor_bruto: t.amount || 0,
      taxa: 0,
      valor_liquido: t.amount || 0,
      vencimento: t.due_date,
      data_recebimento: t.payment_date,
      forma_pagamento: t.payment_method,
      num_parcelas_total: t.installments || 1,
      status: t.status === "paid" ? "recebido"
        : t.status === "overdue" ? "vencido"
        : t.status === "cancelled" ? "cancelado"
        : "pendente",
    }));
  return [...parcelas, ...fromTransactions];
}