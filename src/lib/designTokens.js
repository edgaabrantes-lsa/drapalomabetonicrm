/**
 * Design System — Corporativo Premium
 * Paloma Betoni Clínica
 *
 * Tokens centralizados para uso em todas as páginas e componentes.
 * NUNCA usar cores hardcoded fora deste arquivo.
 */

export const T = {
  // Fundos
  bgPrimary:   "#0A0A0A",
  bgSecondary: "#121212",
  card:        "#1A1A1A",
  cardHover:   "#1E1E1E",

  // Bordas
  border:      "#2B2B2B",
  borderLight: "#1E1E1E",

  // Texto
  textPrimary:   "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted:     "#666666",

  // Destaque
  gold:        "#C8A96A",
  goldHover:   "#D4BC88",
  goldSubtle:  "rgba(200,169,106,0.08)",
  goldBorder:  "rgba(200,169,106,0.2)",

  // Semântico
  danger:      "#EF4444",
  dangerSubtle:"rgba(239,68,68,0.08)",
  success:     "#4ADE80",
  successSubtle:"rgba(74,222,128,0.08)",
  warning:     "#FBBF24",
  warningSubtle:"rgba(251,191,36,0.08)",

  // Fonte
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

/* ── Estilos reutilizáveis ── */

export const S = {
  pageWrapper: {
    fontFamily: T.font,
    maxWidth: 1400,
    margin: "0 auto",
  },

  pageHeader: {
    marginBottom: 32,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 16,
  },

  pageTitle: {
    fontFamily: T.font,
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: T.textPrimary,
    margin: 0,
    lineHeight: 1.2,
  },

  pageSubtitle: {
    fontFamily: T.font,
    fontSize: 13,
    fontWeight: 400,
    color: T.textMuted,
    marginTop: 4,
  },

  sectionTitle: {
    fontFamily: T.font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: T.textMuted,
    margin: 0,
    marginBottom: 16,
  },

  card: {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 24,
  },

  cardCompact: {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 16,
  },

  label: {
    fontFamily: T.font,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: T.textMuted,
  },

  value: {
    fontFamily: T.font,
    fontSize: 14,
    fontWeight: 500,
    color: T.textPrimary,
  },

  valueLg: {
    fontFamily: T.font,
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: T.textPrimary,
    lineHeight: 1.1,
  },

  btnPrimary: {
    background: T.gold,
    color: "#000000",
    border: "none",
    borderRadius: 6,
    fontFamily: T.font,
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 18px",
    height: 36,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  btnGhost: {
    background: "transparent",
    color: T.textSecondary,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    fontFamily: T.font,
    fontSize: 13,
    fontWeight: 500,
    padding: "8px 16px",
    height: 36,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  divider: {
    border: "none",
    borderTop: `1px solid ${T.border}`,
    margin: "24px 0",
  },

  tableHeader: {
    fontFamily: T.font,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: T.textMuted,
    padding: "10px 16px",
    borderBottom: `1px solid ${T.border}`,
    background: "transparent",
  },

  tableCell: {
    fontFamily: T.font,
    fontSize: 14,
    color: T.textSecondary,
    padding: "12px 16px",
    borderBottom: `1px solid ${T.borderLight}`,
  },

  input: {
    backgroundColor: T.bgSecondary,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    color: T.textPrimary,
    fontFamily: T.font,
    fontSize: 14,
    padding: "8px 12px",
    height: 36,
    width: "100%",
    outline: "none",
  },

  badge: (color = T.textMuted, bg = T.card) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    color,
    backgroundColor: bg,
    border: `1px solid ${T.border}`,
    letterSpacing: "0.02em",
  }),
};

/* ── Status badges padronizados ── */
export const STATUS_DOSSIE = {
  lead:                  { label: "Lead",                  color: T.textMuted,   bg: T.card },
  avaliacao_agendada:    { label: "Avaliação Agendada",    color: T.warning,     bg: T.warningSubtle },
  avaliacao_realizada:   { label: "Avaliação Realizada",   color: T.gold,        bg: T.goldSubtle },
  em_tratamento:         { label: "Em Tratamento",         color: T.success,     bg: T.successSubtle },
  procedimento_realizado:{ label: "Procedimento Realizado",color: T.success,     bg: T.successSubtle },
  em_acompanhamento:     { label: "Em Acompanhamento",     color: T.textSecondary,bg: T.card },
  finalizado:            { label: "Finalizado",            color: T.textMuted,   bg: T.card },
  inativo:               { label: "Inativo",               color: T.danger,      bg: T.dangerSubtle },
  cancelado:             { label: "Cancelado",             color: T.danger,      bg: T.dangerSubtle },
};

export const STATUS_LEAD = {
  new:         { label: "Novo",           color: T.gold,        bg: T.goldSubtle },
  contacted:   { label: "Contactado",     color: T.textSecondary,bg: T.card },
  qualified:   { label: "Qualificado",    color: T.success,     bg: T.successSubtle },
  proposal:    { label: "Proposta",       color: T.warning,     bg: T.warningSubtle },
  negotiation: { label: "Negociação",     color: T.gold,        bg: T.goldSubtle },
  won:         { label: "Convertido",     color: T.success,     bg: T.successSubtle },
  lost:        { label: "Perdido",        color: T.danger,      bg: T.dangerSubtle },
};

export const STATUS_APPOINTMENT = {
  scheduled:   { label: "Agendado",      color: T.gold,        bg: T.goldSubtle },
  confirmed:   { label: "Confirmado",    color: T.success,     bg: T.successSubtle },
  in_progress: { label: "Em Atendimento",color: T.gold,        bg: T.goldSubtle },
  completed:   { label: "Concluído",     color: T.textMuted,   bg: T.card },
  cancelled:   { label: "Cancelado",     color: T.danger,      bg: T.dangerSubtle },
  no_show:     { label: "Não Compareceu",color: T.danger,      bg: T.dangerSubtle },
};