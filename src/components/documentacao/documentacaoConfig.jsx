// Mapeamento de documentos obrigatórios por categoria de procedimento

export const CATEGORIAS_PROCEDIMENTO = {
  toxina: { label: "Toxina Botulínica", icon: "💉" },
  preenchimento: { label: "Preenchimento Facial", icon: "✨" },
  bioestimulador: { label: "Bioestimulador", icon: "🔬" },
  fios: { label: "Fios Faciais", icon: "🧵" },
  pele: { label: "Skinbooster / Microagulhamento / Pele", icon: "🌿" },
  corporal: { label: "Enzimas / Procedimentos Corporais", icon: "💪" },
  full_face: { label: "Full Face", icon: "👤" },
  labios: { label: "Lábios", icon: "💋" },
  mandibula: { label: "Mandíbula", icon: "🦷" },
  mento: { label: "Mento", icon: "🔹" },
  olheiras: { label: "Olheiras", icon: "👁️" },
  rinomodelacao: { label: "Rinomodelação", icon: "👃" },
  microagulhamento: { label: "Microagulhamento", icon: "🪡" },
  enzimas: { label: "Enzimas", icon: "💊" },
  outro: { label: "Outro", icon: "📋" },
};

export const TECNICAS_FULL_FACE = [
  { id: "toxina", label: "Toxina Botulínica" },
  { id: "preenchimento", label: "Preenchimento" },
  { id: "bioestimulador", label: "Bioestimulador" },
  { id: "fios", label: "Fios de Sustentação" },
  { id: "pele", label: "Procedimento de Pele" },
  { id: "labios", label: "Lábios" },
  { id: "mandibula", label: "Mandíbula" },
  { id: "mento", label: "Mento" },
  { id: "olheiras", label: "Olheiras" },
  { id: "rinomodelacao", label: "Rinomodelação" },
];

export const DOCS_BASE = [
  { tipo: "contrato_mestre",     nome: "Contrato Mestre",           obrigatorio: true,  ordem: 1 },
  { tipo: "anexo_financeiro",    nome: "Anexo Financeiro",          obrigatorio: true,  ordem: 2 },
  { tipo: "termo_lgpd",          nome: "Termo LGPD",                obrigatorio: true,  ordem: 3 },
  { tipo: "uso_imagem",          nome: "Termo de Uso de Imagem",    obrigatorio: false, ordem: 4 },
  { tipo: "documento_identificacao", nome: "Documento de Identificação", obrigatorio: true, ordem: 5 },
  { tipo: "comprovante_pagamento", nome: "Comprovante de Pagamento", obrigatorio: false, ordem: 9 },
];

export const CONSENTIMENTOS_POR_CATEGORIA = {
  toxina:        { tipo: "consentimento_toxina",        nome: "Consentimento – Toxina Botulínica",        ordem: 6 },
  preenchimento: { tipo: "consentimento_preenchimento", nome: "Consentimento – Preenchimento c/ Ácido Hialurônico", ordem: 6 },
  bioestimulador:{ tipo: "consentimento_bioestimulador",nome: "Consentimento – Bioestimulador",           ordem: 6 },
  fios:          { tipo: "consentimento_fios",          nome: "Consentimento – Fios de Sustentação",      ordem: 6 },
  pele:          { tipo: "consentimento_pele",          nome: "Consentimento – Procedimentos de Pele",    ordem: 6 },
  corporal:      { tipo: "consentimento_corporal",      nome: "Consentimento – Procedimento Corporal",    ordem: 6 },
  full_face:     { tipo: "consentimento_full_face",     nome: "Consentimento – Full Face",                ordem: 6 },
  labios:        { tipo: "consentimento_labios",        nome: "Consentimento – Lábios",                   ordem: 7 },
  mandibula:     { tipo: "consentimento_mandibula",     nome: "Consentimento – Mandíbula",                ordem: 7 },
  mento:         { tipo: "consentimento_mento",         nome: "Consentimento – Mento",                    ordem: 7 },
  olheiras:      { tipo: "consentimento_olheiras",      nome: "Consentimento – Olheiras",                 ordem: 7 },
  rinomodelacao: { tipo: "consentimento_rinomodelacao", nome: "Consentimento – Rinomodelação",            ordem: 7 },
  outro:         { tipo: "consentimento",               nome: "Termo de Consentimento",                   ordem: 6 },
};

export function getDocsParaProcedimento(categoria, tecnicasFullFace = []) {
  const docs = [...DOCS_BASE];

  if (categoria === "full_face") {
    const tecnicas = tecnicasFullFace.length > 0 ? tecnicasFullFace : ["toxina"];
    tecnicas.forEach((t) => {
      const c = CONSENTIMENTOS_POR_CATEGORIA[t];
      if (c) docs.push({ ...c, obrigatorio: true });
    });
  } else {
    const c = CONSENTIMENTOS_POR_CATEGORIA[categoria || "outro"];
    if (c) docs.push({ ...c, obrigatorio: true });
  }

  return docs.sort((a, b) => a.ordem - b.ordem);
}

export const STATUS_DOC = {
  pendente:             { label: "Pendente",             color: "#666666", bg: "rgba(100,100,100,0.15)" },
  gerado:               { label: "Gerado",               color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  aguardando_assinatura:{ label: "Aguard. Assinatura",   color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  assinado_internamente:{ label: "Assinado",             color: "#22C55E", bg: "rgba(34,197,94,0.12)"  },
  pdf_anexado:          { label: "PDF Anexado",          color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  aprovado:             { label: "Aprovado",             color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  substituido:          { label: "Substituído",          color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  cancelado:            { label: "Cancelado",            color: "#EF4444", bg: "rgba(239,68,68,0.12)"  },
  expirado:             { label: "Expirado",             color: "#DC2626", bg: "rgba(220,38,38,0.12)"  },
  // Novos status de kit
  incluido_no_kit:      { label: "Incluído no Kit",     color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  assinado_pelo_kit:    { label: "Assinado pelo Kit",   color: "#22C55E", bg: "rgba(34,197,94,0.10)"  },
  anexado_no_kit:       { label: "Anexado no Kit",      color: "#10B981", bg: "rgba(16,185,129,0.10)" },
  pendente_no_kit:      { label: "Pendente no Kit",     color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
};

export const ORIGENS_ASSINATURA = [
  { value: "assinatura_interna",  label: "Assinatura Interna (plataforma)" },
  { value: "upload_manual",       label: "Upload Manual" },
  { value: "autentique",          label: "Autentique" },
  { value: "docusign",            label: "DocuSign" },
  { value: "clicksign",           label: "Clicksign" },
  { value: "zapsign",             label: "ZapSign" },
  { value: "cartorio",            label: "Cartório" },
  { value: "outro",               label: "Outro" },
];

export function calcularStatusGeral(checklist) {
  if (!checklist || checklist.length === 0) return { label: "Pendente", color: "#F59E0B", pct: 0 };
  const obrigatorios = checklist.filter(d => d.obrigatorio);
  if (obrigatorios.length === 0) return { label: "Pendente", color: "#F59E0B", pct: 0 };

  const concluidos = obrigatorios.filter(d =>
    ["assinado_internamente", "pdf_anexado", "aprovado", "assinado_pelo_kit", "anexado_no_kit"].includes(d.status)
  ).length;

  const pct = Math.round((concluidos / obrigatorios.length) * 100);

  if (pct === 100) return { label: "Completo",      color: "#10B981", pct };
  if (pct >= 80)   return { label: "Quase completo",color: "#22C55E", pct };
  if (pct >= 50)   return { label: "Parcial",        color: "#F59E0B", pct };
  if (pct > 0)     return { label: "Pendente",       color: "#F97316", pct };
  return               { label: "Crítico",           color: "#EF4444", pct };
}