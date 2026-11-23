import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { usePermissions } from "@/lib/PermissionsContext";
import { base64ToPdfBlob, uploadFileToStorage, openPdfFromBase64 } from "@/lib/pdfUpload";
import { Plus, AlertTriangle, FileText, X } from "lucide-react";
import ReceitaForm from "./ReceitaForm";
import ReceitaCard from "./ReceitaCard";

export default function DossieReceitas({ patient, currentUser }) {
  const { hasAction } = usePermissions();
  const [receitas, setReceitas] = useState([]);
  const [clinica, setClinica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);

  const podeEmitir = currentUser?.role === "admin" || hasAction("assinar");

  async function carregar() {
    setLoading(true);
    try {
      const [lista, config] = await Promise.all([
        base44.entities.Receita.filter({ patient_id: patient.id }, "-created_date", 200),
        base44.entities.ClinicSettings.list("-created_date", 1),
      ]);
      setReceitas(lista || []);
      setClinica(config?.[0] || null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [patient.id]);

  async function salvarRascunho(data) {
    setSalvando(true);
    setErro(null);
    try {
      if (editando) {
        await base44.entities.Receita.update(editando.id, data);
      } else {
        await base44.entities.Receita.create({
          ...data,
          status: "rascunho",
          versao: 1,
          historico: [{ acao: "rascunho_criado", data: new Date().toISOString(), usuario: currentUser?.full_name || "" }],
        });
      }
      setFormAberto(false);
      setEditando(null);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function gerarPdf(receita) {
    const res = await base44.functions.invoke("gerarReceitaPdf", { receita_id: receita.id });
    const data = res?.data;
    if (!data) throw new Error("Sem resposta do servidor ao gerar o PDF.");
    if (data.error) throw new Error(data.error);
    if (!data.success || !data.pdf_base64) throw new Error("Não foi possível gerar o PDF da receita.");
    return data;
  }

  async function emitir(receita) {
    if (!podeEmitir) {
      setErro("Sua conta não tem permissão para emitir receitas.");
      return;
    }
    if (receita.tipo_receita === "controle_especial") {
      const ok = window.confirm(
        "Esta receita contém medicamento de controle especial.\n\nO documento será emitido como RECEITUÁRIO SIMPLES e não substitui a notificação de receita específica exigida pela Portaria SVS/MS 344/98.\n\nDeseja emitir mesmo assim?",
      );
      if (!ok) return;
    } else {
      const ok = window.confirm("Emitir a receita? Após a emissão, o documento não poderá ser editado — correções geram nova versão.");
      if (!ok) return;
    }

    setBusyId(receita.id);
    setErro(null);
    setAviso(null);
    try {
      const data = await gerarPdf(receita);
      const blob = base64ToPdfBlob(data.pdf_base64);

      let url = null;
      try {
        url = await uploadFileToStorage(blob, data.pdf_file_name);
      } catch (upErr) {
        console.warn("[receita] upload falhou:", upErr.message);
      }

      const agora = new Date().toISOString();
      await base44.entities.Receita.update(receita.id, {
        status: "emitida",
        emitida_em: agora,
        documento_hash: data.hash,
        ...(url ? { pdf_url: url, pdf_file_name: data.pdf_file_name } : {}),
        historico: [
          ...(receita.historico || []),
          { acao: "emitida", data: agora, usuario: currentUser?.full_name || "" },
        ],
      });

      if (receita.receita_anterior_id) {
        await base44.entities.Receita
          .update(receita.receita_anterior_id, { status: "substituida", substituida_por_id: receita.id })
          .catch(() => {});
      }

      openPdfFromBase64(data.pdf_base64);
      if (!url) {
        setAviso("Receita emitida. O PDF não foi salvo no armazenamento — use “Baixar PDF” para gerar novamente quando precisar.");
      }
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function baixar(receita) {
    setErro(null);
    if (receita.pdf_url) {
      window.open(receita.pdf_url, "_blank");
      return;
    }
    setBusyId(receita.id);
    try {
      const data = await gerarPdf(receita);
      openPdfFromBase64(data.pdf_base64);
      if (receita.status === "emitida") {
        try {
          const url = await uploadFileToStorage(base64ToPdfBlob(data.pdf_base64), data.pdf_file_name);
          await base44.entities.Receita.update(receita.id, { pdf_url: url, pdf_file_name: data.pdf_file_name });
          await carregar();
        } catch {
          /* PDF já foi aberto para a profissional */
        }
      }
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function whatsapp(receita) {
    const digits = (patient.whatsapp || patient.phone || "").replace(/\D/g, "");
    if (!digits) {
      setErro("Paciente sem telefone/WhatsApp cadastrado.");
      return;
    }
    if (!receita.pdf_url) {
      setErro("Gere o PDF da receita antes de compartilhar.");
      return;
    }
    const tel = digits.length <= 11 ? "55" + digits : digits;
    const primeiroNome = (patient.full_name || "").split(" ")[0];
    const dataFmt = receita.data_emissao
      ? new Date(receita.data_emissao + "T12:00:00").toLocaleDateString("pt-BR")
      : "";
    const msg = `Olá, ${primeiroNome}! Segue sua receita emitida em ${dataFmt}:\n${receita.pdf_url}\n\nQualquer dúvida estou à disposição.`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function cancelar(receita) {
    const motivo = window.prompt("Motivo do cancelamento da receita:");
    if (!motivo || !motivo.trim()) return;
    setBusyId(receita.id);
    setErro(null);
    try {
      await base44.entities.Receita.update(receita.id, {
        status: "cancelada",
        motivo_cancelamento: motivo.trim(),
        cancelada_em: new Date().toISOString(),
        historico: [
          ...(receita.historico || []),
          { acao: "cancelada", data: new Date().toISOString(), usuario: currentUser?.full_name || "", observacao: motivo.trim() },
        ],
      });
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function novaVersao(receita) {
    setBusyId(receita.id);
    setErro(null);
    try {
      const nova = await base44.entities.Receita.create({
        patient_id: receita.patient_id,
        patient_name: receita.patient_name,
        patient_birth_date: receita.patient_birth_date || patient.birth_date || "",
        data_emissao: new Date().toISOString().split("T")[0],
        tipo_receita: receita.tipo_receita,
        status: "rascunho",
        medicamentos: receita.medicamentos || [],
        orientacoes_gerais: receita.orientacoes_gerais || "",
        profissional_id: receita.profissional_id || "",
        profissional_nome: receita.profissional_nome || "",
        profissional_profissao: receita.profissional_profissao || "",
        profissional_conselho: receita.profissional_conselho || "",
        profissional_registro: receita.profissional_registro || "",
        assinatura_url: receita.assinatura_url || "",
        exige_receituario_especial: receita.tipo_receita === "controle_especial",
        versao: (receita.versao || 1) + 1,
        receita_anterior_id: receita.id,
        historico: [
          {
            acao: "nova_versao",
            data: new Date().toISOString(),
            usuario: currentUser?.full_name || "",
            observacao: `Substitui a receita v${receita.versao || 1} de ${receita.data_emissao || ""}`,
          },
        ],
      });
      await carregar();
      setEditando(nova);
      setFormAberto(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p style={{ ...S.pageSubtitle, padding: "24px 0" }}>Carregando receitas...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ ...S.value, fontSize: 15, margin: 0 }}>Receitas</p>
          <p style={{ ...S.pageSubtitle, margin: 0 }}>
            Histórico de prescrições emitidas para {patient.full_name?.split(" ")[0]}
          </p>
        </div>
        {podeEmitir && !formAberto && (
          <button
            onClick={() => { setEditando(null); setFormAberto(true); setErro(null); }}
            style={{ ...S.btnPrimary, height: 34, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={13} /> Nova receita
          </button>
        )}
      </div>

      {!podeEmitir && (
        <div style={{ display: "flex", gap: 8, background: T.warningSubtle, border: "1px solid rgba(251,191,36,0.3)", borderRadius: 6, padding: "10px 12px" }}>
          <AlertTriangle size={14} style={{ color: T.warning, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: T.font, fontSize: 12, color: "#FCD34D", margin: 0 }}>
            Sua conta pode consultar o histórico, mas não está habilitada a criar ou emitir receitas.
          </p>
        </div>
      )}

      {podeEmitir && !clinica?.numero_conselho && (
        <p style={{ fontFamily: T.font, fontSize: 11.5, color: T.textMuted, margin: 0 }}>
          Registro no conselho não cadastrado — complete em Configurações da Clínica para que apareça no documento.
        </p>
      )}

      {erro && (
        <div style={{ display: "flex", gap: 8, background: T.dangerSubtle, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "10px 12px" }}>
          <AlertTriangle size={14} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: T.font, fontSize: 12, color: "#FCA5A5", margin: 0 }}>{erro}</p>
        </div>
      )}

      {aviso && (
        <div style={{ display: "flex", gap: 8, background: T.warningSubtle, border: "1px solid rgba(251,191,36,0.3)", borderRadius: 6, padding: "10px 12px" }}>
          <AlertTriangle size={14} style={{ color: T.warning, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: T.font, fontSize: 12, color: "#FCD34D", margin: 0 }}>{aviso}</p>
        </div>
      )}

      {formAberto && (
        <div style={{ background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ ...S.value, fontSize: 14, margin: 0 }}>
              {editando ? `Editar receita v${editando.versao || 1}` : "Nova receita"}
            </p>
            <button
              onClick={() => { setFormAberto(false); setEditando(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}
            >
              <X size={16} />
            </button>
          </div>
          <ReceitaForm
            receita={editando}
            patient={patient}
            currentUser={currentUser}
            clinica={clinica}
            saving={salvando}
            onSave={salvarRascunho}
            onCancel={() => { setFormAberto(false); setEditando(null); }}
          />
        </div>
      )}

      {receitas.length === 0 ? (
        <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 10, padding: "28px 16px", textAlign: "center" }}>
          <FileText size={22} style={{ color: "#444", marginBottom: 8 }} />
          <p style={{ ...S.pageSubtitle, margin: 0 }}>Nenhuma receita registrada para esta paciente.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {receitas.map((r) => (
            <ReceitaCard
              key={r.id}
              receita={r}
              podeEmitir={podeEmitir}
              podeCorrigir={podeEmitir}
              busy={busyId === r.id}
              onEditar={() => { setEditando(r); setFormAberto(true); }}
              onEmitir={() => emitir(r)}
              onBaixar={() => baixar(r)}
              onImprimir={() => baixar(r)}
              onWhatsapp={() => whatsapp(r)}
              onCancelar={() => cancelar(r)}
              onNovaVersao={() => novaVersao(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}