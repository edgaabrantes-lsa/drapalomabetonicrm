import { parseISO, format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Formatters ───────────────────────────────────────────────
export const fmtBRL = (n) => `R$ ${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtPercent = (n) => `${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
export const fmtDate = (d) => {
  if (!d) return "-";
  try { return format(parseISO(d), "dd/MM/yyyy"); } catch { return "-"; }
};

// ─── DRE Types ────────────────────────────────────────────────
export const DRE_TIPOS = {
  receita: "Receita",
  deducoes: "Deduções",
  custo_direto: "Custo Direto",
  despesa_fixa: "Despesa Fixa",
  despesa_variavel: "Despesa Variável",
  outra_despesa: "Outra Despesa",
};

// ─── Transaction → DRE Mapping ────────────────────────────────
const TX_INCOME_MAP = {
  procedure: "Procedimentos",
  protocol: "Pacotes/Protocolos",
  product: "Outras Receitas",
  other: "Outras Receitas",
};

const TX_EXPENSE_MAP = {
  supplies: { tipo: "custo_direto", categoria: "Produtos/Insumos" },
  product: { tipo: "custo_direto", categoria: "Produtos/Insumos" },
  salary: { tipo: "despesa_fixa", categoria: "Salários Fixos" },
  rent: { tipo: "despesa_fixa", categoria: "Aluguel" },
  utilities: { tipo: "despesa_fixa", categoria: "Utilidades" },
  marketing: { tipo: "despesa_variavel", categoria: "Marketing" },
  taxes: { tipo: "deducoes", categoria: "Impostos" },
  equipment: { tipo: "despesa_fixa", categoria: "Equipamentos" },
  maintenance: { tipo: "despesa_fixa", categoria: "Manutenção" },
  other: { tipo: "outra_despesa", categoria: "Outras" },
};

// ─── Default Categories ───────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { nome: "Procedimentos", tipo: "receita", ordem: 1, predefinida: true },
  { nome: "Pacotes/Protocolos", tipo: "receita", ordem: 2, predefinida: true },
  { nome: "Consultas", tipo: "receita", ordem: 3, predefinida: true },
  { nome: "Outras Receitas", tipo: "receita", ordem: 4, predefinida: true },
  { nome: "Descontos", tipo: "deducoes", ordem: 5, predefinida: true },
  { nome: "Reembolsos", tipo: "deducoes", ordem: 6, predefinida: true },
  { nome: "Cancelamentos", tipo: "deducoes", ordem: 7, predefinida: true },
  { nome: "Taxas de Cartão", tipo: "deducoes", ordem: 8, predefinida: true },
  { nome: "Impostos", tipo: "deducoes", ordem: 9, predefinida: true },
  { nome: "Produtos/Insumos", tipo: "custo_direto", ordem: 10, predefinida: true },
  { nome: "Injetáveis", tipo: "custo_direto", ordem: 11, predefinida: true },
  { nome: "Materiais", tipo: "custo_direto", ordem: 12, predefinida: true },
  { nome: "Descartáveis", tipo: "custo_direto", ordem: 13, predefinida: true },
  { nome: "Comissões", tipo: "custo_direto", ordem: 14, predefinida: true },
  { nome: "Aluguel", tipo: "despesa_fixa", ordem: 15, predefinida: true },
  { nome: "Condomínio", tipo: "despesa_fixa", ordem: 16, predefinida: true },
  { nome: "Internet", tipo: "despesa_fixa", ordem: 17, predefinida: true },
  { nome: "Energia Elétrica", tipo: "despesa_fixa", ordem: 18, predefinida: true },
  { nome: "Água", tipo: "despesa_fixa", ordem: 19, predefinida: true },
  { nome: "Telefone", tipo: "despesa_fixa", ordem: 20, predefinida: true },
  { nome: "Sistema/Software", tipo: "despesa_fixa", ordem: 21, predefinida: true },
  { nome: "Contabilidade", tipo: "despesa_fixa", ordem: 22, predefinida: true },
  { nome: "Salários Fixos", tipo: "despesa_fixa", ordem: 23, predefinida: true },
  { nome: "Encargos Trabalhistas", tipo: "despesa_fixa", ordem: 24, predefinida: true },
  { nome: "Limpeza", tipo: "despesa_fixa", ordem: 25, predefinida: true },
  { nome: "Segurança", tipo: "despesa_fixa", ordem: 26, predefinida: true },
  { nome: "Manutenção", tipo: "despesa_fixa", ordem: 27, predefinida: true },
  { nome: "Assinaturas", tipo: "despesa_fixa", ordem: 28, predefinida: true },
  { nome: "Seguros", tipo: "despesa_fixa", ordem: 29, predefinida: true },
  { nome: "Outros Custos Fixos", tipo: "despesa_fixa", ordem: 30, predefinida: true },
  { nome: "Marketing", tipo: "despesa_variavel", ordem: 31, predefinida: true },
  { nome: "Tráfego Pago", tipo: "despesa_variavel", ordem: 32, predefinida: true },
  { nome: "Comissões Variáveis", tipo: "despesa_variavel", ordem: 33, predefinida: true },
  { nome: "Taxas de Cartão", tipo: "despesa_variavel", ordem: 34, predefinida: true },
  { nome: "Taxas de Plataforma", tipo: "despesa_variavel", ordem: 35, predefinida: true },
  { nome: "Fretes", tipo: "despesa_variavel", ordem: 36, predefinida: true },
  { nome: "Materiais Variáveis", tipo: "despesa_variavel", ordem: 37, predefinida: true },
  { nome: "Bonificações", tipo: "despesa_variavel", ordem: 38, predefinida: true },
  { nome: "Reembolsos", tipo: "despesa_variavel", ordem: 39, predefinida: true },
  { nome: "Outros Custos Variáveis", tipo: "despesa_variavel", ordem: 40, predefinida: true },
  { nome: "Juros", tipo: "outra_despesa", ordem: 41, predefinida: true },
  { nome: "Multas", tipo: "outra_despesa", ordem: 42, predefinida: true },
  { nome: "Empréstimos", tipo: "outra_despesa", ordem: 43, predefinida: true },
  { nome: "Despesas Financeiras", tipo: "outra_despesa", ordem: 44, predefinida: true },
  { nome: "Investimentos", tipo: "outra_despesa", ordem: 45, predefinida: true },
  { nome: "Compras Extraordinárias", tipo: "outra_despesa", ordem: 46, predefinida: true },
];

// ─── Payment fee estimates ────────────────────────────────────
const TAXAS_PAGAMENTO = {
  pix: 0, dinheiro: 0, cash: 0, transfer: 0, transferencia: 0,
  credit_card: 0.03, cartao_credito: 0.03,
  debit_card: 0.015, cartao_debito: 0.015,
  installments: 0.04, parcelado: 0.04,
  boleto: 0, link: 0.02, link_pagamento: 0.02, check: 0, outro: 0,
};

export function estimarTaxa(metodo, valor) {
  return (TAXAS_PAGAMENTO[metodo] || 0) * (valor || 0);
}

// ─── Period helpers ───────────────────────────────────────────
export function getPeriodRange(filters) {
  const { mes, ano, periodo = "mensal", data_inicio, data_fim } = filters;
  const year = ano || new Date().getFullYear();

  if (periodo === "anual") {
    return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59) };
  }
  if (periodo === "custom" && data_inicio && data_fim) {
    return { start: startOfDay(parseISO(data_inicio)), end: endOfDay(parseISO(data_fim)) };
  }
  const month = mes !== undefined ? mes : new Date().getMonth();
  return { start: startOfMonth(new Date(year, month, 1)), end: endOfMonth(new Date(year, month, 1)) };
}

export function getPeriodLabel(filters) {
  const { mes, ano, periodo = "mensal", data_inicio, data_fim } = filters;
  const year = ano || new Date().getFullYear();
  if (periodo === "anual") return `Anual ${year}`;
  if (periodo === "custom" && data_inicio && data_fim) return `${fmtDate(data_inicio)} a ${fmtDate(data_fim)}`;
  const month = mes !== undefined ? mes : new Date().getMonth();
  return `${format(new Date(year, month, 1), "MMMM 'yyyy", { locale: ptBR })}`;
}

// ─── Recurring lancamento expansion ──────────────────────────
export function isLancamentoInPeriod(lanc, periodStart, periodEnd) {
  if (lanc.status === "cancelado") return false;

  if (!lanc.recorrencia || lanc.recorrencia === "unica") {
    if (!lanc.data_vencimento) return false;
    try {
      const d = parseISO(lanc.data_vencimento);
      return d >= periodStart && d <= periodEnd;
    } catch { return false; }
  }

  const startDate = lanc.data_inicio ? parseISO(lanc.data_inicio) : (lanc.data_vencimento ? parseISO(lanc.data_vencimento) : new Date());
  if (startDate > periodEnd) return false;

  const endDate = lanc.data_fim ? parseISO(lanc.data_fim) : null;
  if (endDate && endDate < periodStart) return false;

  if (lanc.recorrencia === "mensal") return true;
  if (lanc.recorrencia === "anual") {
    return startDate.getMonth() === periodStart.getMonth() && startDate.getFullYear() <= periodStart.getFullYear();
  }
  return false;
}

// ─── Apply secondary filters (procedure, professional, etc) ──
function passesSecondaryFilters(item, filters) {
  if (filters.procedimento && filters.procedimento !== "all" && item.procedimento_nome && item.procedimento_nome !== filters.procedimento) return false;
  if (filters.profissional && filters.profissional !== "all" && item.profissional_id && item.profissional_id !== filters.profissional) return false;
  if (filters.status && filters.status !== "all" && item.status && item.status !== filters.status) return false;
  if (filters.centro_custo && filters.centro_custo !== "all" && item.centro_custo && item.centro_custo !== filters.centro_custo) return false;
  return true;
}

// ─── DRE Calculation Engine ───────────────────────────────────
export function calcularDRE({ transactions = [], lancamentos = [], treatments = [], procedures = [], supplies = [], filters = {}, view = "realizado" }) {
  const period = getPeriodRange(filters);

  const validTxStatus = view === "realizado" ? ["paid"] : ["paid", "pending", "overdue"];
  const validLancStatus = view === "realizado" ? ["pago"] : ["pago", "pendente", "vencido"];

  const periodTxs = transactions.filter(t => {
    if (!t.due_date) return false;
    try {
      const d = parseISO(t.due_date);
      if (d < period.start || d > period.end) return false;
    } catch { return false; }
    if (!validTxStatus.includes(t.status)) return false;
    if (t.status === "cancelled") return false;
    return passesSecondaryFilters(t, filters);
  });

  const periodLancs = lancamentos.filter(l => {
    if (!isLancamentoInPeriod(l, period.start, period.end)) return false;
    if (!validLancStatus.includes(l.status)) return false;
    if (l.status === "cancelado") return false;
    return passesSecondaryFilters(l, filters);
  });

  const sections = {
    receita: { items: {}, total: 0 },
    deducoes: { items: {}, total: 0 },
    custo_direto: { items: {}, total: 0 },
    despesa_fixa: { items: {}, total: 0 },
    despesa_variavel: { items: {}, total: 0 },
    outra_despesa: { items: {}, total: 0 },
  };

  periodTxs.forEach(t => {
    if (t.type === "income") {
      const cat = TX_INCOME_MAP[t.category] || "Outras Receitas";
      sections.receita.items[cat] = (sections.receita.items[cat] || 0) + (t.amount || 0);
    } else {
      const map = TX_EXPENSE_MAP[t.category] || { tipo: "outra_despesa", categoria: "Outras" };
      sections[map.tipo].items[map.categoria] = (sections[map.tipo].items[map.categoria] || 0) + (t.amount || 0);
    }
  });

  periodLancs.forEach(l => {
    const cat = l.categoria || "Outros";
    sections[l.tipo].items[cat] = (sections[l.tipo].items[cat] || 0) + (l.valor || 0);
  });

  Object.keys(sections).forEach(key => {
    sections[key].total = Object.values(sections[key].items).reduce((a, b) => a + b, 0);
  });

  const receitaBruta = sections.receita.total;
  const totalDeducoes = sections.deducoes.total;
  const receitaLiquida = receitaBruta - totalDeducoes;
  const totalCustosDiretos = sections.custo_direto.total;
  const lucroBruto = receitaLiquida - totalCustosDiretos;
  const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
  const totalDespesasFixas = sections.despesa_fixa.total;
  const totalDespesasVariaveis = sections.despesa_variavel.total;
  const resultadoOperacional = lucroBruto - totalDespesasFixas - totalDespesasVariaveis;
  const totalOutrasDespesas = sections.outra_despesa.total;
  const lucroLiquido = resultadoOperacional - totalOutrasDespesas;
  const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

  const margemContribuicao = receitaLiquida > 0 ? lucroBruto / receitaLiquida : 0;
  const pontoEquilibrio = margemContribuicao > 0
    ? totalDespesasFixas / margemContribuicao
    : totalDespesasFixas + totalDespesasVariaveis;

  const periodTreatments = treatments.filter(t => {
    if (t.status !== "realizado" || !t.data_realizacao) return false;
    try {
      const d = parseISO(t.data_realizacao);
      return d >= period.start && d <= period.end;
    } catch { return false; }
  });

  const totalProcedimentos = periodTreatments.length;
  const totalPacientes = new Set(periodTreatments.map(t => t.patient_id).filter(Boolean)).size;
  const receitaProcedimentos = periodTreatments.reduce((sum, t) => sum + (t.valor_pago || t.valor || 0), 0);
  const ticketMedio = totalProcedimentos > 0 ? receitaProcedimentos / totalProcedimentos : 0;
  const receitaPorPaciente = totalPacientes > 0 ? receitaProcedimentos / totalPacientes : 0;

  const totalDespesas = totalDespesasFixas + totalDespesasVariaveis + totalCustosDiretos + totalOutrasDespesas;
  const despPctReceita = receitaLiquida > 0 ? (totalDespesas / receitaLiquida) * 100 : 0;
  const custoPctReceita = receitaLiquida > 0 ? (totalCustosDiretos / receitaLiquida) * 100 : 0;
  const marketingPctReceita = receitaLiquida > 0 ? ((sections.despesa_variavel.items["Marketing"] || 0) / receitaLiquida) * 100 : 0;
  const folhaPctReceita = receitaLiquida > 0 ? ((sections.despesa_fixa.items["Salários Fixos"] || 0) / receitaLiquida) * 100 : 0;

  const vendasAteAgora = receitaBruta;
  const faltaparaEquilibrio = pontoEquilibrio - vendasAteAgora;
  const acimaEquilibrio = vendasAteAgora >= pontoEquilibrio;

  return {
    sections,
    receitaBruta, totalDeducoes, receitaLiquida,
    totalCustosDiretos, lucroBruto, margemBruta,
    totalDespesasFixas, totalDespesasVariaveis,
    resultadoOperacional, totalOutrasDespesas,
    lucroLiquido, margemLiquida,
    pontoEquilibrio, margemContribuicao,
    vendasAteAgora, faltaparaEquilibrio, acimaEquilibrio,
    indicadores: {
      receitaBruta, receitaLiquida, lucroBruto, lucroLiquido,
      margemBruta, margemLiquida,
      despPctReceita, custoPctReceita, marketingPctReceita, folhaPctReceita,
      ticketMedio, receitaPorPaciente, receitaPorProcedimento: ticketMedio,
      totalProcedimentos, totalPacientes,
    },
    periodTxs, periodLancs, periodTreatments,
  };
}

// ─── Yearly DRE ───────────────────────────────────────────────
export function calcularDREAnual(data, year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const monthFilters = { ...data.filters, mes: m, ano: year, periodo: "mensal" };
    const dre = calcularDRE({ ...data, filters: monthFilters });
    months.push({
      mes: format(new Date(year, m, 1), "MMM", { locale: ptBR }),
      mesNum: m,
      receitaBruta: dre.receitaBruta,
      receitaLiquida: dre.receitaLiquida,
      custos: dre.totalCustosDiretos,
      despesasFixas: dre.totalDespesasFixas,
      despesasVariaveis: dre.totalDespesasVariaveis,
      lucroLiquido: dre.lucroLiquido,
      margemLiquida: dre.margemLiquida,
    });
  }
  return months;
}

// ─── Procedure Profitability ──────────────────────────────────
export function calcularRentabilidade(treatments = [], procedures = [], supplies = [], filters = {}) {
  const period = getPeriodRange(filters);
  const periodTreatments = treatments.filter(t => {
    if (t.status !== "realizado" || !t.data_realizacao) return false;
    try {
      const d = parseISO(t.data_realizacao);
      return d >= period.start && d <= period.end;
    } catch { return false; }
  });

  const byName = {};
  periodTreatments.forEach(t => {
    const name = t.protocolo_nome || "Outros";
    if (!byName[name]) {
      byName[name] = { nome: name, categoria: t.categoria || "avulso", count: 0, receitaTotal: 0, custoTotal: 0, comissaoTotal: 0, taxaTotal: 0 };
    }
    const proc = procedures.find(p => p.name === name);
    const preco = t.valor_pago || t.valor || proc?.price || 0;
    const custo = proc?.cost || calcularCustoProcedimento(proc, supplies);
    byName[name].count++;
    byName[name].receitaTotal += preco;
    byName[name].custoTotal += custo;
    byName[name].taxaTotal += estimarTaxa(t.forma_pagamento, preco);
  });

  return Object.values(byName).map(p => {
    const lucroBruto = p.receitaTotal - p.custoTotal - p.comissaoTotal - p.taxaTotal;
    const margem = p.receitaTotal > 0 ? (lucroBruto / p.receitaTotal) * 100 : 0;
    return { ...p, precoMedio: p.count > 0 ? p.receitaTotal / p.count : 0, custoMedio: p.count > 0 ? p.custoTotal / p.count : 0, taxaMedio: p.count > 0 ? p.taxaTotal / p.count : 0, lucroBruto, margem };
  }).sort((a, b) => b.lucroBruto - a.lucroBruto);
}

function calcularCustoProcedimento(proc, supplies) {
  if (!proc?.supplies_required || !supplies) return proc?.cost || 0;
  return proc.supplies_required.reduce((sum, req) => {
    const supply = supplies.find(s => s.id === req.supply_id);
    return sum + (supply?.cost_per_unit || 0) * (req.quantity || 0);
  }, 0);
}

// ─── CSV Export ───────────────────────────────────────────────
export function exportDRECSV(dre, periodLabel) {
  const rows = [
    ["DRE - Demonstracao do Resultado do Exercicio", periodLabel],
    [],
    ["A. RECEITA BRUTA", fmtBRL(dre.receitaBruta)],
    ...Object.entries(dre.sections.receita.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
    [],
    ["B. (-) DEDUCOES", fmtBRL(dre.totalDeducoes)],
    ...Object.entries(dre.sections.deducoes.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
    [],
    ["C. = RECEITA LIQUIDA", fmtBRL(dre.receitaLiquida)],
    [],
    ["D. (-) CUSTOS DIRETOS", fmtBRL(dre.totalCustosDiretos)],
    ...Object.entries(dre.sections.custo_direto.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
    [],
    ["E. = LUCRO BRUTO", fmtBRL(dre.lucroBruto)],
    ["F. MARGEM BRUTA", fmtPercent(dre.margemBruta)],
    [],
    ["G. (-) DESPESAS FIXAS", fmtBRL(dre.totalDespesasFixas)],
    ...Object.entries(dre.sections.despesa_fixa.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
    [],
    ["H. (-) DESPESAS VARIAVEIS", fmtBRL(dre.totalDespesasVariaveis)],
    ...Object.entries(dre.sections.despesa_variavel.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
    [],
    ["I. = RESULTADO OPERACIONAL", fmtBRL(dre.resultadoOperacional)],
    [],
    ["J. (-) OUTRAS DESPESAS", fmtBRL(dre.totalOutrasDespesas)],
    ...Object.entries(dre.sections.outra_despesa.items).map(([k, v]) => [`  ${k}`, fmtBRL(v)]),
    [],
    ["K. = LUCRO LIQUIDO", fmtBRL(dre.lucroLiquido)],
    ["L. MARGEM LIQUIDA", fmtPercent(dre.margemLiquida)],
    [],
    ["PONTO DE EQUILIBRIO", fmtBRL(dre.pontoEquilibrio)],
    ["TICKET MEDIO", fmtBRL(dre.indicadores.ticketMedio)],
    ["PROCEDIMENTOS REALIZADOS", dre.indicadores.totalProcedimentos],
    ["PACIENTES ATENDIDOS", dre.indicadores.totalPacientes],
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DRE_${periodLabel.replace(/\s/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportRentabilidadeCSV(data, periodLabel) {
  const rows = [
    ["Rentabilidade por Procedimento", periodLabel],
    [],
    ["Procedimento", "Categoria", "Vezes Realizado", "Preco Medio", "Custo Medio", "Taxa Media", "Receita Total", "Custo Total", "Lucro Bruto", "Margem %"],
    ...data.map(p => [p.nome, p.categoria, p.count, fmtBRL(p.precoMedio), fmtBRL(p.custoMedio), fmtBRL(p.taxaMedio), fmtBRL(p.receitaTotal), fmtBRL(p.custoTotal), fmtBRL(p.lucroBruto), fmtPercent(p.margem)]),
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rentabilidade_${periodLabel.replace(/\s/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Procedure categories ─────────────────────────────────────
export const PROCEDURE_CATEGORIES = [
  "Full Face", "Lips Signature", "Rinomodelação", "Mento", "Malar", "Mandíbula",
  "Toxina Botulínica", "Bioestimulador", "Fios", "Microagulhamento", "Enzimas", "Consulta", "Outros",
];