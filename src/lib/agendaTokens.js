// Tokens visuais compartilhados da Agenda (paleta LSA Dark)
export const T = {
  pearl: "#111620",
  white: "#171D29",
  onyx: "#E8EDF5",
  charcoal: "#8A95AA",
  subtle: "#252D3E",
  gold: "var(--color-accent)",
};

export const statusDot = {
  scheduled:   { dot: T.gold,    label: "Agendado" },
  confirmed:   { dot: T.onyx,    label: "Confirmado" },
  in_progress: { dot: T.gold,    label: "Em Andamento" },
  completed:   { dot: "#CCCCCC", label: "Concluído" },
  cancelled:   { dot: "#E53935", label: "Cancelado" },
  no_show:     { dot: "#E53935", label: "Não Compareceu" },
};