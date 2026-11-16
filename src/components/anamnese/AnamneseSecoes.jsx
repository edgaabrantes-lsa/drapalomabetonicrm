import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { REGIOES_FACE } from "@/lib/mapaFacial";

const labelStyle = { fontSize: 11, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: "0.07em" };
const boxStyle = { backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, padding: 16 };

function Campo({ label, value, onChange, readOnly, rows }) {
  return (
    <div>
      <Label style={labelStyle}>{label}</Label>
      {rows ? (
        <Textarea
          rows={rows}
          value={value || ""}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
          style={{ fontSize: 13 }}
        />
      ) : (
        <Input
          value={value || ""}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-1"
          style={{ height: 34, fontSize: 13 }}
        />
      )}
    </div>
  );
}

export function SecaoHistoricoClinico({ historico = {}, setHistorico, readOnly }) {
  const set = (k, v) => setHistorico({ ...historico, [k]: v });
  return (
    <div style={boxStyle} className="space-y-3">
      <p style={{ fontSize: 12, fontWeight: 600, color: "#C8A96A", letterSpacing: "0.06em", textTransform: "uppercase" }}>Histórico clínico</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Queixa principal" value={historico.queixa_principal} onChange={(v) => set("queixa_principal", v)} readOnly={readOnly} rows={2} />
        <Campo label="Objetivo da paciente" value={historico.objetivo_paciente} onChange={(v) => set("objetivo_paciente", v)} readOnly={readOnly} rows={2} />
        <Campo label="Procedimentos estéticos anteriores" value={historico.procedimentos_esteticos_anteriores} onChange={(v) => set("procedimentos_esteticos_anteriores", v)} readOnly={readOnly} rows={2} />
        <Campo label="Medicamentos em uso" value={historico.medicamentos_em_uso} onChange={(v) => set("medicamentos_em_uso", v)} readOnly={readOnly} rows={2} />
        <Campo label="Alergias" value={historico.alergias} onChange={(v) => set("alergias", v)} readOnly={readOnly} rows={2} />
        <Campo label="Doenças e condições relevantes" value={historico.doencas_condicoes} onChange={(v) => set("doencas_condicoes", v)} readOnly={readOnly} rows={2} />
        <Campo label="Cirurgias anteriores" value={historico.cirurgias_anteriores} onChange={(v) => set("cirurgias_anteriores", v)} readOnly={readOnly} rows={2} />
        <Campo label="Histórico de intercorrências" value={historico.historico_intercorrencias} onChange={(v) => set("historico_intercorrencias", v)} readOnly={readOnly} rows={2} />
      </div>

      <div>
        <Label style={labelStyle}>Gestação ou amamentação</Label>
        <div className="flex gap-2 mt-1">
          {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map((op) => (
            <button
              key={op.l}
              type="button"
              disabled={readOnly}
              onClick={() => set("gestacao_amamentacao", op.v)}
              style={{
                padding: "6px 16px", fontSize: 12, fontWeight: 600, borderRadius: 5,
                border: `1px solid ${historico.gestacao_amamentacao === op.v ? "#C8A96A" : "#2B2B2B"}`,
                background: historico.gestacao_amamentacao === op.v ? "rgba(200,169,106,0.15)" : "transparent",
                color: historico.gestacao_amamentacao === op.v ? "#C8A96A" : "#B0B0B0",
                cursor: readOnly ? "default" : "pointer",
              }}
            >
              {op.l}
            </button>
          ))}
        </div>
        {historico.gestacao_amamentacao && (
          <Input
            value={historico.gestacao_amamentacao_obs || ""}
            readOnly={readOnly}
            onChange={(e) => set("gestacao_amamentacao_obs", e.target.value)}
            placeholder="Detalhes (tempo, restrições)"
            className="bg-[#0A0A0A] border-[#2B2B2B] text-white mt-2"
            style={{ height: 32, fontSize: 12 }}
          />
        )}
      </div>

      <Campo label="Informações complementares" value={historico.informacoes_complementares} onChange={(v) => set("informacoes_complementares", v)} readOnly={readOnly} rows={2} />
    </div>
  );
}

export function SecaoAvaliacaoEstetica({ estetica = {}, setEstetica, readOnly }) {
  const set = (k, v) => setEstetica({ ...estetica, [k]: v });
  const regioes = estetica.regioes_interesse || [];
  const toggleRegiao = (r) => {
    if (readOnly) return;
    set("regioes_interesse", regioes.includes(r) ? regioes.filter((x) => x !== r) : [...regioes, r]);
  };

  return (
    <div style={boxStyle} className="space-y-3">
      <p style={{ fontSize: 12, fontWeight: 600, color: "#C8A96A", letterSpacing: "0.06em", textTransform: "uppercase" }}>Avaliação estética</p>
      <div>
        <Label style={labelStyle}>Regiões de interesse</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {REGIOES_FACE.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRegiao(r)}
              style={{
                padding: "4px 10px", fontSize: 11, borderRadius: 12,
                border: `1px solid ${regioes.includes(r) ? "#C8A96A" : "#2B2B2B"}`,
                background: regioes.includes(r) ? "rgba(200,169,106,0.15)" : "transparent",
                color: regioes.includes(r) ? "#C8A96A" : "#8A8A8A",
                cursor: readOnly ? "default" : "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Observações sobre simetria" value={estetica.observacoes_simetria} onChange={(v) => set("observacoes_simetria", v)} readOnly={readOnly} rows={2} />
        <Campo label="Queixas relacionadas à aparência" value={estetica.queixas_aparencia} onChange={(v) => set("queixas_aparencia", v)} readOnly={readOnly} rows={2} />
        <Campo label="Planejamento de procedimentos" value={estetica.planejamento_procedimentos} onChange={(v) => set("planejamento_procedimentos", v)} readOnly={readOnly} rows={2} />
        <Campo label="Prioridades" value={estetica.prioridades} onChange={(v) => set("prioridades", v)} readOnly={readOnly} rows={2} />
        <Campo label="Expectativas" value={estetica.expectativas} onChange={(v) => set("expectativas", v)} readOnly={readOnly} rows={2} />
        <Campo label="Orientações fornecidas" value={estetica.orientacoes_fornecidas} onChange={(v) => set("orientacoes_fornecidas", v)} readOnly={readOnly} rows={2} />
      </div>
    </div>
  );
}