import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SecaoHistoricoClinico, SecaoAvaliacaoEstetica } from "./AnamneseSecoes";
import MapaFacialPanel from "./MapaFacialPanel";

const labelStyle = { fontSize: 11, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: "0.07em" };
const STATUS_LABEL = {
  rascunho: "Rascunho", em_avaliacao: "Em avaliação", finalizada: "Finalizada", retificada: "Retificada",
};

const estadoSalvamento = {
  idle: { texto: "", cor: "#555555" },
  unsaved: { texto: "Alterações não salvas", cor: "#F59E0B" },
  saving: { texto: "Salvando...", cor: "#38BDF8" },
  saved: { texto: "Salvo", cor: "#4ADE80" },
  error: { texto: "Erro ao salvar", cor: "#EF4444" },
};

export default function AnamneseForm({ patient, anamnese, currentUser, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => anamnese || {
    patient_id: patient?.id,
    patient_name: patient?.full_name || "",
    data_avaliacao: format(new Date(), "yyyy-MM-dd"),
    profissional_nome: currentUser?.full_name || "",
    profissional_id: currentUser?.id || "",
    status: "rascunho",
    versao: 1,
    historico_clinico: {},
    avaliacao_estetica: {},
    mapa_facial: { objetos: [] },
    procedimento_realizado: {},
    historico_versoes: [],
  });
  const [saveState, setSaveState] = useState("idle");
  const dirty = useRef(false);
  const idRef = useRef(anamnese?.id || null);

  const somenteLeitura = form.status === "finalizada";

  // A URL assinada expira — é regenerada a cada abertura, nunca gravada no registro
  useEffect(() => {
    const uri = form.mapa_facial?.imagem_file_uri;
    if (!uri) return;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })
      .then(({ signed_url }) => setForm((f) => ({ ...f, mapa_facial: { ...f.mapa_facial, imagem_url: signed_url } })))
      .catch(() => {});
  }, []);

  const persist = async (extra = {}) => {
    const { imagem_url, ...mapaParaSalvar } = form.mapa_facial || {};
    const payload = { ...form, ...extra, mapa_facial: mapaParaSalvar };
    setSaveState("saving");
    try {
      let salvo;
      if (!idRef.current) {
        salvo = await base44.entities.Anamnese.create(payload);
        idRef.current = salvo.id;
        setForm((f) => ({ ...f, id: salvo.id }));
      } else {
        salvo = await base44.entities.Anamnese.update(idRef.current, payload);
      }
      dirty.current = false;
      setSaveState("saved");
      queryClient.invalidateQueries({ queryKey: ["anamneses"] });
      onSaved?.(salvo);
      return salvo;
    } catch (e) {
      setSaveState("error");
      return null;
    }
  };

  const update = (patch) => {
    setForm((p) => ({ ...p, ...patch }));
    dirty.current = true;
    setSaveState("unsaved");
  };

  useEffect(() => {
    if (somenteLeitura || !dirty.current || !idRef.current) return;
    const t = setTimeout(() => { persist(); }, 1200);
    return () => clearTimeout(t);
  }, [form]);

  const finalizar = async () => {
    const versao = (form.versao || 1) + 1;
    const historico = [...(form.historico_versoes || []), {
      versao, data: new Date().toISOString(), usuario: currentUser?.full_name || "", acao: "finalizacao",
    }];
    const salvo = await persist({ status: "finalizada", data_finalizacao: new Date().toISOString(), versao, historico_versoes: historico });
    if (salvo) setForm((f) => ({ ...f, status: "finalizada", versao, historico_versoes: historico }));
  };

  const retificar = async () => {
    const versao = (form.versao || 1) + 1;
    const historico = [...(form.historico_versoes || []), {
      versao, data: new Date().toISOString(), usuario: currentUser?.full_name || "", acao: "retificacao",
    }];
    const salvo = await persist({ status: "retificada", versao, historico_versoes: historico });
    if (salvo) {
      setForm((f) => ({ ...f, status: "retificada", versao, historico_versoes: historico }));
      dirty.current = true;
    }
  };

  const est = estadoSalvamento[saveState];

  return (
    <div className="space-y-4">
      {/* Cabeçalho / identificação */}
      <div style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, padding: 14 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label style={labelStyle}>Paciente</Label>
            <p style={{ fontSize: 13, color: "#FFFFFF", marginTop: 4 }}>{form.patient_name}</p>
          </div>
          <div>
            <Label style={labelStyle}>Nascimento</Label>
            <p style={{ fontSize: 13, color: "#B0B0B0", marginTop: 4 }}>
              {patient?.birth_date ? format(new Date(`${patient.birth_date}T12:00:00`), "dd/MM/yyyy") : "—"}
            </p>
          </div>
          <div>
            <Label style={labelStyle}>Data da avaliação</Label>
            <Input
              type="date"
              value={form.data_avaliacao || ""}
              disabled={somenteLeitura}
              onChange={(e) => update({ data_avaliacao: e.target.value })}
              className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
              style={{ height: 32, fontSize: 12 }}
            />
          </div>
          <div>
            <Label style={labelStyle}>Profissional</Label>
            <Input
              value={form.profissional_nome || ""}
              disabled={somenteLeitura}
              onChange={(e) => update({ profissional_nome: e.target.value })}
              className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
              style={{ height: 32, fontSize: 12 }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span style={{ fontSize: 11, color: "#666666" }}>
            Situação: <strong style={{ color: "#C8A96A" }}>{STATUS_LABEL[form.status] || form.status}</strong> · versão {form.versao || 1}
          </span>
          <span style={{ fontSize: 11, color: est.cor }}>{est.texto}</span>
        </div>
      </div>

      <SecaoHistoricoClinico
        historico={form.historico_clinico || {}}
        setHistorico={(h) => update({ historico_clinico: h })}
        readOnly={somenteLeitura}
      />

      <SecaoAvaliacaoEstetica
        estetica={form.avaliacao_estetica || {}}
        setEstetica={(e) => update({ avaliacao_estetica: e })}
        readOnly={somenteLeitura}
      />

      <MapaFacialPanel
        valor={form.mapa_facial || { objetos: [] }}
        onChange={(mapa) => update({ mapa_facial: mapa })}
        readOnly={somenteLeitura}
      />

      {/* Procedimento realizado */}
      <div style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, padding: 14 }} className="space-y-3">
        <p style={{ fontSize: 12, fontWeight: 600, color: "#C8A96A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Procedimento realizado
        </p>
        <p style={{ fontSize: 10, color: "#555555" }}>
          Preencha somente o que foi efetivamente executado — o planejamento não é copiado automaticamente.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["data", "Data", "date"],
            ["profissional", "Profissional", "text"],
            ["produto", "Produto utilizado", "text"],
            ["fabricante", "Fabricante", "text"],
            ["lote", "Lote", "text"],
            ["validade", "Validade", "text"],
            ["quantidade", "Quantidade utilizada", "text"],
          ].map(([campo, label, tipo]) => (
            <div key={campo}>
              <Label style={labelStyle}>{label}</Label>
              <Input
                type={tipo}
                value={form.procedimento_realizado?.[campo] || ""}
                disabled={somenteLeitura}
                onChange={(e) => update({ procedimento_realizado: { ...(form.procedimento_realizado || {}), [campo]: e.target.value } })}
                className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
                style={{ height: 32, fontSize: 12 }}
              />
            </div>
          ))}
        </div>
        <div>
          <Label style={labelStyle}>Procedimentos executados / intercorrências</Label>
          <Textarea
            rows={2}
            value={form.procedimento_realizado?.procedimentos || ""}
            readOnly={somenteLeitura}
            onChange={(e) => update({ procedimento_realizado: { ...(form.procedimento_realizado || {}), procedimentos: e.target.value } })}
            className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <Label style={labelStyle}>Observações</Label>
          <Textarea
            rows={2}
            value={form.procedimento_realizado?.observacoes || ""}
            readOnly={somenteLeitura}
            onChange={(e) => update({ procedimento_realizado: { ...(form.procedimento_realizado || {}), observacoes: e.target.value } })}
            className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button variant="ghost" onClick={onClose} className="text-gray-400">Fechar</Button>
        {!somenteLeitura && (
          <>
            <Button variant="outline" onClick={() => persist()} className="border-[#2B2B2B] text-[#B0B0B0]">
              Salvar rascunho
            </Button>
            <Button onClick={finalizar} className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black">
              Finalizar avaliação
            </Button>
          </>
        )}
        {somenteLeitura && (
          <Button onClick={retificar} className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black">
            Retificar (nova versão)
          </Button>
        )}
      </div>
    </div>
  );
}