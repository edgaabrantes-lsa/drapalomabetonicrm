import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// ─────────────────────────────────────────────────────────────────────────
//  mergePatients — Função administrativa de mesclagem de pacientes duplicados.
//  Migra TODOS os dados relacionados do paciente duplicado para o oficial,
//  arquiva o duplicado (status inativo + marca), e registra auditoria.
//  Acesso restrito a administradores.
// ─────────────────────────────────────────────────────────────────────────

const RELATED_ENTITIES = [
  { name: "PatientTreatment", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "Appointment", idField: "patient_id", nameFields: [], keep: true },
  { name: "DossieDocumento", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DossieKitDocumental", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DossieImagem", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DossieFinanceiro", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DossieObservacao", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DossieEvolucao", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DossieLog", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "MedicalRecord", idField: "patient_id", nameFields: [], keep: true },
  { name: "FullFaceSimulation", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "PerfilSensorial", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "Transaction", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "DRELancamento", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "AssinaturaEletronica", idField: "patient_id", nameFields: ["patient_name"], keep: true },
  { name: "SolicitacaoCancelamento", idField: "patient_id", nameFields: ["patient_name"], keep: true },
];

const normPhone = (p) => (p || "").toString().replace(/\D/g, "").replace(/^0+/, "");
const normCpf = (c) => (c || "").toString().replace(/\D/g, "");
const normName = (s) => (s || "").toString().toLowerCase().trim().replace(/\s+/g, " ");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Nao autorizado" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { oficial_id, duplicado_id, campos_escolhidos } = body;

    if (!oficial_id || !duplicado_id) {
      return Response.json({ error: "oficial_id e duplicado_id sao obrigatorios" }, { status: 400 });
    }
    if (oficial_id === duplicado_id) {
      return Response.json({ error: "Os IDs nao podem ser iguais" }, { status: 400 });
    }

    const e = base44.asServiceRole.entities;
    const [oficial, duplicado] = await Promise.all([
      e.Patient.get(oficial_id),
      e.Patient.get(duplicado_id),
    ]);

    if (!oficial || !duplicado) {
      return Response.json({ error: "Paciente nao encontrado" }, { status: 404 });
    }

    const report = { migrados: {}, atualizado_oficial: null, duplicado_arquivado: false, audit_log: null };

    // 1. Mesclar campos escolhidos no registro oficial (campos que estiverem vazios)
    const mergedFields = {};
    const chosen = campos_escolhidos || {};
    const FIELD_MAP = {
      full_name: "full_name",
      document_number: "document_number",
      rg: "rg",
      birth_date: "birth_date",
      gender: "gender",
      phone: "phone",
      whatsapp: "whatsapp",
      email: "email",
      profession: "profession",
      marital_status: "marital_status",
      notes: "notes",
      interest: "interest",
      emergency_contact: "emergency_contact",
      emergency_phone: "emergency_phone",
      photo_url: "photo_url",
      address: "address",
      responsavel_legal: "responsavel_legal",
      tags: "tags",
    };
    for (const [key, entityField] of Object.entries(FIELD_MAP)) {
      if (chosen[key] && duplicado[entityField] !== undefined && duplicado[entityField] !== null && duplicado[entityField] !== "") {
        mergedFields[entityField] = duplicado[entityField];
      }
    }
    if (Object.keys(mergedFields).length > 0) {
      const updated = await e.Patient.update(oficial_id, mergedFields);
      report.atualizado_oficial = { id: oficial_id, campos: Object.keys(mergedFields) };
    }

    // 2. Migrar todos os dados relacionados (update patient_id -> oficial_id)
    for (const rel of RELATED_ENTITIES) {
      try {
        const items = await e[rel.name].filter({ patient_id: duplicado_id });
        if (items.length === 0) continue;
        const updates = items.map((it) => {
          const patch = { patient_id: oficial_id };
          for (const nf of rel.nameFields) {
            if (oficial.full_name) patch[nf] = oficial.full_name;
          }
          return { id: it.id, ...patch };
        });
        if (updates.length > 0) {
          await e[rel.name].bulkUpdate(updates);
        }
        report.migrados[rel.name] = items.length;
      } catch (err) {
        report.migrados[rel.name] = `erro: ${err.message}`;
      }
    }

    // 3. Arquivar o duplicado: marcar inativo + prefixar nome + limpar dados pessoais sensíveis
    await e.Patient.update(duplicado_id, {
      status: "inactive",
      dossie_status: "inativo",
      full_name: `[ARQUIVADO - DUPLICADO] ${duplicado.full_name}`,
      // Limpa dados sensíveis para evitar dupla exposição LGPD
      document_number: "",
      rg: "",
      email: "",
      phone: "",
      whatsapp: "",
      address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "" },
      responsavel_legal: {},
      notes: `Registro arquivado em ${new Date().toISOString()} — mesclado no paciente oficial ${oficial_id} (${oficial.full_name}).`,
    });
    report.duplicado_arquivado = true;

    // 4. Log de auditoria
    await e.AuditLog.create({
      action: "update",
      entity_type: "Patient",
      entity_id: oficial_id,
      user_email: user.email,
      user_role: user.role,
      details: {
        acao: "MESCLAGEM_DE_PACIENTES",
        oficial_id,
        oficial_nome: oficial.full_name,
        duplicado_id,
        duplicado_nome: duplicado.full_name,
        campos_migrados: Object.keys(mergedFields),
        entidades_migradas: report.migrados,
        responsavel: user.email,
      },
      old_values: { duplicado_snapshot: { full_name: duplicado.full_name, phone: duplicado.phone, document_number: duplicado.document_number, address: duplicado.address } },
      new_values: { oficial_atualizado: mergedFields, duplicado_arquivado: true },
    });
    report.audit_log = "criado";

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});