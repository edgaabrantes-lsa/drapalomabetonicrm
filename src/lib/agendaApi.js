import { base44 } from "@/api/base44Client";

/**
 * Acesso autorizado à agenda da clínica.
 * A validação de identidade, perfil e vínculo ativo acontece no backend.
 */
async function chamar(payload) {
  try {
    const resposta = await base44.functions.invoke("agendaClinica", payload);
    const dados = resposta?.data || {};
    if (dados.error) throw new Error(dados.error);
    return dados;
  } catch (erro) {
    const mensagem =
      erro?.response?.data?.error ||
      erro?.message ||
      "Não foi possível acessar a agenda.";
    throw new Error(mensagem);
  }
}

export const agendaList = (payload) => chamar({ action: "list", ...payload });
export const agendaCreate = (data) => chamar({ action: "create", data });
export const agendaUpdate = (id, data) => chamar({ action: "update", id, data });
export const agendaDelete = (id) => chamar({ action: "delete", id });
export const bloqueiosList = (payload) => chamar({ action: "listBloqueios", ...payload });
export const bloqueioCreate = (data) => chamar({ action: "createBloqueio", data });
export const bloqueioDelete = (id) => chamar({ action: "deleteBloqueio", id });

/** Carrega o período em páginas, sem o limite fixo de registros. */
export async function agendaListPeriodo({ start, end, limit = 200, maxPaginas = 1 }) {
  const itens = [];
  let cursor = null;

  for (let i = 0; i < maxPaginas; i += 1) {
    const pagina = await agendaList({ start, end, limit, cursor });
    itens.push(...(pagina.items || []));
    cursor = pagina.next_cursor;
    if (!pagina.has_more || !cursor) break;
  }

  return itens;
}