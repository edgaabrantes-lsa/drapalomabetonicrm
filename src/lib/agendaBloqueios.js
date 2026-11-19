import { parseISO, startOfDay, endOfDay, format } from "date-fns";

const MINUTOS_DIA = 24 * 60;

const toMin = (hhmm) => {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const bloqueioNoDia = (bloqueio, date) => {
  if (!bloqueio?.data_inicio) return false;
  const inicio = startOfDay(parseISO(bloqueio.data_inicio));
  const fim = endOfDay(parseISO(bloqueio.data_fim || bloqueio.data_inicio));
  const dia = startOfDay(date);
  return dia >= inicio && dia <= fim;
};

export const bloqueiosDoDia = (bloqueios = [], date) =>
  bloqueios.filter((b) => b.ativo !== false && bloqueioNoDia(b, date));

export const faixaBloqueio = (bloqueio) =>
  bloqueio?.dia_inteiro
    ? { inicio: 0, fim: MINUTOS_DIA }
    : { inicio: toMin(bloqueio?.hora_inicio || "00:00"), fim: toMin(bloqueio?.hora_fim || "23:59") };

export const rotuloHorario = (bloqueio) =>
  bloqueio?.dia_inteiro
    ? "Dia inteiro"
    : `${bloqueio?.hora_inicio || "--:--"} às ${bloqueio?.hora_fim || "--:--"}`;

export const periodoBloqueio = (bloqueio) => {
  const inicio = parseISO(bloqueio.data_inicio);
  const fim = parseISO(bloqueio.data_fim || bloqueio.data_inicio);
  return format(inicio, "dd/MM/yyyy") === format(fim, "dd/MM/yyyy")
    ? format(inicio, "dd/MM/yyyy")
    : `${format(inicio, "dd/MM/yyyy")} a ${format(fim, "dd/MM/yyyy")}`;
};

export const conflitoBloqueio = (bloqueios = [], startDate, durationMinutes = 60, professionalId = "") => {
  const inicio = startDate.getHours() * 60 + startDate.getMinutes();
  const fim = inicio + (durationMinutes || 60);
  return bloqueios.find((b) => {
    if (b.ativo === false || !bloqueioNoDia(b, startDate)) return false;
    if (b.professional_id && professionalId && b.professional_id !== professionalId) return false;
    const faixa = faixaBloqueio(b);
    return inicio < faixa.fim && fim > faixa.inicio;
  }) || null;
};