import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// ── Normalização (inline — backend não importa arquivos locais) ──
const normName = (s) => (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normPhone = (s) => (s || "").toString().replace(/\D/g, "").replace(/^0/, "").replace(/^55(?=\d{10,11})/, "");
const normCpf = (s) => (s || "").toString().replace(/\D/g, "");
const normEmail = (s) => (s || "").toString().trim().toLowerCase();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Apenas administradores" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const acao = body?.acao || "scan"; // scan | corrigir
    const dryRun = acao !== "corrigir";

    const b = base44.asServiceRole;

    // ── Carrega entidades (paginação simples) ──
    const [patients, sims, imgsDossie, imgsPatient] = await Promise.all([
      b.entities.Patient.list("-created_date", 2000),
      b.entities.FullFaceSimulation.list("-created_date", 2000),
      b.entities.DossieImagem.list("-data_upload", 3000),
      b.entities.PatientImage.list("-created_date", 2000),
    ]);

    const patientIds = new Set(patients.map((p) => p.id));

    // ── 1. Pacientes duplicados ──
    const patientGroups = {};
    for (const p of patients) {
      const keys = [];
      if (p.document_number) keys.push("cpf:" + normCpf(p.document_number));
      if (p.phone) keys.push("tel:" + normPhone(p.phone));
      if (p.email) keys.push("email:" + normEmail(p.email));
      const nk = normName(p.full_name);
      if (nk && nk.length > 5) keys.push("nome:" + nk);
      for (const k of keys) {
        if (!patientGroups[k]) patientGroups[k] = [];
        patientGroups[k].push(p);
      }
    }
    const dupPacientes = [];
    const seenPacientes = new Set();
    for (const k in patientGroups) {
      if (patientGroups[k].length > 1) {
        const ids = patientGroups[k].map((p) => p.id).sort().join("|");
        if (seenPacientes.has(ids)) continue;
        seenPacientes.add(ids);
        dupPacientes.push({
          criterio: k.split(":")[0],
          pacientes: patientGroups[k].map((p) => ({ id: p.id, nome: p.full_name, phone: p.phone, cpf: p.document_number, email: p.email, criado: p.created_date })),
        });
      }
    }

    // ── 2. Simulações faciais duplicadas ──
    const dupSims = [];
    const simByUrl = {};
    for (const s of sims) {
      const key = s.patient_id + "|" + (s.original_image_url || "");
      if (!simByUrl[key]) simByUrl[key] = [];
      simByUrl[key].push(s);
    }
    for (const key in simByUrl) {
      if (simByUrl[key].length > 1) {
        const [pid] = key.split("|");
        dupSims.push({
          patient_id: pid,
          patient_name: patients.find((p) => p.id === pid)?.full_name || "—",
          quantidade: simByUrl[key].length,
          ids: simByUrl[key].map((s) => ({ id: s.id, status: s.status, criado: s.created_date })),
        });
      }
    }

    // ── 3. Fotos duplicadas (DossieImagem) ──
    const dupImagens = [];
    const imgByUrl = {};
    for (const i of imgsDossie) {
      const key = i.patient_id + "|" + (i.file_url || "");
      if (!imgByUrl[key]) imgByUrl[key] = [];
      imgByUrl[key].push(i);
    }
    for (const key in imgByUrl) {
      if (imgByUrl[key].length > 1) {
        dupImagens.push({
          patient_id: key.split("|")[0],
          quantidade: imgByUrl[key].length,
          ids: imgByUrl[key].map((i) => ({ id: i.id, file_url: i.file_url, titulo: i.titulo, data: i.data_upload })),
        });
      }
    }

    // ── 4. Fotos vinculadas a paciente errado / órfãs ──
    const orfaosDossie = imgsDossie.filter((i) => i.patient_id && !patientIds.has(i.patient_id));
    const orfaosPatientImg = imgsPatient.filter((i) => i.patient_id && !patientIds.has(i.patient_id));
    const semPatientDossie = imgsDossie.filter((i) => !i.patient_id);

    // file_url presente em mais de um paciente (vínculo cruzado suspeito)
    const urlToPatients = {};
    for (const i of imgsDossie) {
      if (!i.file_url || !i.patient_id) continue;
      if (!urlToPatients[i.file_url]) urlToPatients[i.file_url] = new Set();
      urlToPatients[i.file_url].add(i.patient_id);
    }
    const fotosCruzadas = [];
    for (const url in urlToPatients) {
      if (urlToPatients[url].size > 1) {
        fotosCruzadas.push({
          file_url: url,
          patient_ids: [...urlToPatients[url]],
          patient_names: [...urlToPatients[url]].map((pid) => patients.find((p) => p.id === pid)?.full_name || pid),
        });
      }
    }

    // ── 5. Simulações órfãs (patient_id inválido) ──
    const simsOrfas = sims.filter((s) => s.patient_id && !patientIds.has(s.patient_id));

    const relatorio = {
      gerado_em: new Date().toISOString(),
      executado_por: user.full_name || user.email,
      modo: dryRun ? "scan (somente leitura)" : "correcao (aplicada)",
      totais: {
        pacientes: patients.length,
        simulacoes: sims.length,
        imagens_dossie: imgsDossie.length,
        imagens_patient: imgsPatient.length,
      },
      duplicidades: {
        pacientes: dupPacientes.length,
        simulacoes_faciais: dupSims.length,
        fotos_dossie: dupImagens.length,
        fotos_cruzadas_pacientes: fotosCruzadas.length,
      },
      integridade: {
        fotos_orfas_dossie: orfaosDossie.length,
        fotos_orfas_patient: orfaosPatientImg.length,
        fotos_sem_patient_id: semPatientDossie.length,
        simulacoes_orfas: simsOrfas.length,
      },
      detalhes: {
        pacientes_duplicados: dupPacientes,
        simulacoes_duplicadas: dupSims,
        fotos_duplicadas: dupImagens,
        fotos_cruzadas: fotosCruzadas,
        orfaos_dossie: orfaosDossie.map((i) => ({ id: i.id, patient_id: i.patient_id, file_url: i.file_url })),
        orfaos_patient: orfaosPatientImg.map((i) => ({ id: i.id, patient_id: i.patient_id, image_url: i.image_url })),
        sem_patient_id: semPatientDossie.map((i) => ({ id: i.id, file_url: i.file_url })),
        simulacoes_orfas: simsOrfas.map((s) => ({ id: s.id, patient_id: s.patient_id })),
      },
    };

    // ── Aplicar correções (se solicitado) ──
    const correcoes = { fotos_duplicadas_removidas: 0, simulacoes_duplicadas_removidas: 0, fotos_orfas_removidas: 0, simulacoes_orfas_removidas: 0 };

    if (!dryRun) {
      // Remove fotos duplicadas (mantém a mais antiga)
      const idsRemoverImagens = [];
      for (const key in imgByUrl) {
        if (imgByUrl[key].length > 1) {
          const ordenados = imgByUrl[key].sort((a, b) => (a.data_upload || "").localeCompare(b.data_upload || ""));
          ordenados.slice(1).forEach((i) => idsRemoverImagens.push(i.id));
        }
      }
      if (idsRemoverImagens.length > 0) {
        try { await b.entities.DossieImagem.deleteMany({ id: { $in: idsRemoverImagens } }); } catch (e) { /* ignore */ }
        correcoes.fotos_duplicadas_removidas = idsRemoverImagens.length;
      }

      // Remove simulações duplicadas (mantém a mais antiga concluída)
      const idsRemoverSims = [];
      for (const key in simByUrl) {
        if (simByUrl[key].length > 1) {
          const ordenados = simByUrl[key].sort((a, b) => (a.created_date || "").localeCompare(b.created_date || ""));
          ordenados.slice(1).forEach((s) => idsRemoverSims.push(s.id));
        }
      }
      if (idsRemoverSims.length > 0) {
        try { await b.entities.FullFaceSimulation.deleteMany({ id: { $in: idsRemoverSims } }); } catch (e) { /* ignore */ }
        correcoes.simulacoes_duplicadas_removidas = idsRemoverSims.length;
      }

      // Remove fotos órfãs (patient_id inexistente)
      const idsOrfaosDossie = orfaosDossie.map((i) => i.id);
      if (idsOrfaosDossie.length > 0) {
        try { await b.entities.DossieImagem.deleteMany({ id: { $in: idsOrfaosDossie } }); } catch (e) { /* ignore */ }
        correcoes.fotos_orfas_removidas += idsOrfaosDossie.length;
      }
      const idsOrfaosPatient = orfaosPatientImg.map((i) => i.id);
      if (idsOrfaosPatient.length > 0) {
        try { await b.entities.PatientImage.deleteMany({ id: { $in: idsOrfaosPatient } }); } catch (e) { /* ignore */ }
        correcoes.fotos_orfas_removidas += idsOrfaosPatient.length;
      }

      // Remove simulações órfãs
      const idsSimsOrfas = simsOrfas.map((s) => s.id);
      if (idsSimsOrfas.length > 0) {
        try { await b.entities.FullFaceSimulation.deleteMany({ id: { $in: idsSimsOrfas } }); } catch (e) { /* ignore */ }
        correcoes.simulacoes_orfas_removidas = idsSimsOrfas.length;
      }

      // Log de auditoria (action "delete" — enum do AuditLog)
      try {
        await b.entities.AuditLog.create({
          action: "delete",
          entity_type: "AuditoriaDuplicidades",
          entity_id: "global",
          user_email: user.email,
          user_role: user.role,
          details: {
            tipo: "auditoria_duplicidades",
            modo: "correcao",
            executado_por: user.full_name || user.email,
            ...correcoes,
            duplicidades_detectadas: relatorio.duplicidades,
            integridade_detectada: relatorio.integridade,
          },
        });
      } catch (e) { /* audit log opcional */ }

      relatorio.correcoes_aplicadas = correcoes;
    }

    return Response.json(relatorio);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});