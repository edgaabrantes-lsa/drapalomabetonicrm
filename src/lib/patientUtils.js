// ─────────────────────────────────────────────────────────────────────────
//  patientUtils.js
//  Utilitários de normalização e detecção de duplicidade de pacientes.
//  Prevenção de cadastro duplicado e mistura de dados entre pacientes.
// ─────────────────────────────────────────────────────────────────────────

/** Remove espaços extras, padroniza caixa baixa para comparação interna. */
export function normalizeName(s) {
  return (s || "").toString().toLowerCase().trim().replace(/\s+/g, " ");
}

/** Remove tudo que não é dígito e zeros à esquerda. */
export function normalizePhone(p) {
  return (p || "").toString().replace(/\D/g, "").replace(/^0+/, "");
}

/** Remove tudo que não é dígito do CPF. */
export function normalizeCpf(c) {
  return (c || "").toString().replace(/\D/g, "");
}

/** E-mail normalizado em caixa baixa. */
export function normalizeEmail(e) {
  return (e || "").toString().toLowerCase().trim();
}

/** Data normalizada (YYYY-MM-DD) ou vazia. */
export function normalizeDate(d) {
  if (!d) return "";
  const s = d.toString().slice(0, 10);
  return s;
}

/**
 * Verifica possíveis duplicidades comparando um candidato (dados do formulário)
 * contra a lista de pacientes existentes.
 * Critérios (qualquer um gera um alerta):
 *   - Mesmo CPF (ignora zeros e máscaras), quando CPF preenchido
 *   - Mesmo telefone normalizado, quando telefone >= 10 dígitos
 *   - Mesmo nome completo normalizado
 *   - Mesmo e-mail normalizado, quando e-mail preenchido
 * Retorna array de pacientes que parecem duplicados (pode ser vazio).
 */
export function findDuplicateCandidates(candidate, existingPatients) {
  if (!existingPatients || !Array.isArray(existingPatients)) return [];
  const cName = normalizeName(candidate.full_name);
  const cPhone = normalizePhone(candidate.phone || candidate.whatsapp);
  const cCpf = normalizeCpf(candidate.document_number);
  const cEmail = normalizeEmail(candidate.email);
  const excludeId = candidate.id || candidate._id || null;

  return existingPatients.filter((p) => {
    if (excludeId && p.id === excludeId) return false;
    const sameCpf = cCpf && cCpf !== "00000000000" && normalizeCpf(p.document_number) === cCpf;
    const samePhone = cPhone && cPhone.length >= 10 && normalizePhone(p.phone || p.whatsapp) === cPhone;
    const sameName = cName.length >= 6 && normalizeName(p.full_name) === cName;
    const sameEmail = cEmail && normalizeEmail(p.email) === cEmail;
    return sameCpf || samePhone || sameName || sameEmail;
  });
}

/**
 * Fábrica de objeto de paciente vazio — SEMPRE retorna um objeto novo
 * (deep clone) para evitar compartilhamento de referência entre cadastros.
 */
export function createEmptyPatient() {
  return {
    full_name: "",
    document_type: "cpf",
    document_number: "",
    rg: "",
    birth_date: "",
    gender: "female",
    phone: "",
    whatsapp: "",
    email: "",
    profession: "",
    marital_status: undefined,
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
    },
    status: "active",
    dossie_status: "lead",
    source: "instagram",
    notes: "",
    consent_whatsapp: false,
    consent_images: false,
    consent_terms_signed: false,
    tags: [],
  };
}

/**
 * Clona profundamente os dados de um paciente para edição, garantindo que
 * o objeto de endereço seja uma cópia isolada (nunca a referência original).
 */
export function clonePatientForEdit(patient) {
  if (!patient) return createEmptyPatient();
  const base = JSON.parse(JSON.stringify(patient));
  // Garante que address existe e é um objeto plano isolado
  if (!base.address || typeof base.address !== "object") base.address = {};
  const emptyAddr = createEmptyPatient().address;
  base.address = { ...emptyAddr, ...base.address };
  if (!Array.isArray(base.tags)) base.tags = [];
  return base;
}