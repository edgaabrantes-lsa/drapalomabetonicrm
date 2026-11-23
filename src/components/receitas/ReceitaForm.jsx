import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

const VAZIO = {
  nome: "", apresentacao: "", dose: "", via: "",
  frequencia: "", duracao: "", quantidade: "", orientacoes: "",
};

export default function ReceitaForm({ receita, patient, currentUser, clinica, onSave, onCancel, saving }) {
  const [tipo, setTipo] = useState(receita?.tipo_receita || "simples");
  const [dataEmissao, setDataEmissao] = useState(
    receita?.data_emissao || new Date().toISOString().split("T")[0],
  );
  const [medicamentos, setMedicamentos] = useState(
    receita?.medicamentos?.length ? receita.medicamentos : [{ ...VAZIO }],
  );
  const [orientacoes, setOrientacoes] = useState(receita?.orientacoes_gerais || "");
  const [erro, setErro] = useState(null);

  const atualizar = (idx, campo, valor) => {
    setMedicamentos((prev) => prev.map((m, i) => (i === idx ? { ...m, [campo]: valor } : m)));
  };

  const adicionar = () => setMedicamentos((prev) => [...prev, { ...VAZIO }]);
  const remover = (idx) => setMedicamentos((prev) => prev.filter((_, i) => i !== idx));

  function salvar() {
    const validos = medicamentos.filter((m) => (m.nome || "").trim());
    if (validos.length === 0) {
      setErro("Informe ao menos um medicamento.");
      return;
    }
    setErro(null);
    onSave({
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_birth_date: patient.birth_date || "",
      data_emissao: dataEmissao,
      tipo_receita: tipo,
      medicamentos: validos,
      orientacoes_gerais: orientacoes,
      profissional_id: currentUser?.id || "",
      profissional_nome: [clinica?.professional_title, clinica?.professional_name].filter(Boolean).join(" ") || currentUser?.full_name || "",
      profissional_profissao: clinica?.especialidade || "",
      profissional_conselho: clinica?.conselho_regional || "",
      profissional_registro: clinica?.numero_conselho || "",
      assinatura_url: clinica?.assinatura_profissional_url || "",
      exige_receituario_especial: tipo === "controle_especial",
    });
  }

  const inputStyle = { ...S.input, fontSize: 13, height: 34 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
          <p style={{ ...S.label, marginBottom: 5 }}>Tipo de receita</p>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
            <option value="simples">Receita simples</option>
            <option value="controle_especial">Medicamento de controle especial</option>
          </select>
        </div>
        <div style={{ flex: "1 1 150px", minWidth: 0 }}>
          <p style={{ ...S.label, marginBottom: 5 }}>Data de emissão</p>
          <input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {tipo === "controle_especial" && (
        <div style={{ display: "flex", gap: 8, background: T.dangerSubtle, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "10px 12px" }}>
          <AlertTriangle size={14} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: T.font, fontSize: 12, color: "#FCA5A5", margin: 0, lineHeight: 1.5 }}>
            O documento gerado será identificado como <strong>receituário simples</strong> e não substitui a
            notificação de receita exigida para medicamentos de controle especial (Portaria SVS/MS 344/98),
            que requer formulário próprio e assinatura digital juridicamente válida.
          </p>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ ...S.label, margin: 0 }}>Medicamentos</p>
          <button onClick={adicionar} style={{ ...S.btnGhost, height: 30, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
            <Plus size={12} /> Adicionar
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {medicamentos.map((m, idx) => (
            <div key={idx} style={{ background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.gold }}>
                  Medicamento {idx + 1}
                </span>
                {medicamentos.length > 1 && (
                  <button onClick={() => remover(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: T.danger, display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <Trash2 size={12} /> Remover
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Medicamento</p>
                  <input value={m.nome} onChange={(e) => atualizar(idx, "nome", e.target.value)} placeholder="Ex: Ácido hialurônico" style={inputStyle} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Apresentação / concentração</p>
                  <input value={m.apresentacao} onChange={(e) => atualizar(idx, "apresentacao", e.target.value)} placeholder="Ex: 1 mL — 24 mg/mL" style={inputStyle} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Dose</p>
                  <input value={m.dose} onChange={(e) => atualizar(idx, "dose", e.target.value)} placeholder="Ex: 1 ampola" style={inputStyle} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Via de administração</p>
                  <input value={m.via} onChange={(e) => atualizar(idx, "via", e.target.value)} placeholder="Ex: intramuscular" style={inputStyle} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Frequência</p>
                  <input value={m.frequencia} onChange={(e) => atualizar(idx, "frequencia", e.target.value)} placeholder="Ex: 1x ao dia" style={inputStyle} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Duração</p>
                  <input value={m.duracao} onChange={(e) => atualizar(idx, "duracao", e.target.value)} placeholder="Ex: 7 dias" style={inputStyle} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 3 }}>Quantidade prescrita</p>
                  <input value={m.quantidade} onChange={(e) => atualizar(idx, "quantidade", e.target.value)} placeholder="Ex: 1 caixa" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <p style={{ ...S.label, marginBottom: 3 }}>Orientações adicionais</p>
                <textarea
                  value={m.orientacoes}
                  onChange={(e) => atualizar(idx, "orientacoes", e.target.value)}
                  rows={2}
                  style={{ ...S.input, fontSize: 13, width: "100%", resize: "vertical" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{ ...S.label, marginBottom: 5 }}>Orientações gerais</p>
        <textarea
          value={orientacoes}
          onChange={(e) => setOrientacoes(e.target.value)}
          rows={3}
          placeholder="Orientações válidas para toda a prescrição"
          style={{ ...S.input, fontSize: 13, width: "100%", resize: "vertical" }}
        />
      </div>

      {erro && (
        <p style={{ fontFamily: T.font, fontSize: 12, color: T.danger, margin: 0 }}>{erro}</p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <button onClick={onCancel} style={{ ...S.btnGhost, height: 34, fontSize: 12 }}>Cancelar</button>
        <button onClick={salvar} disabled={saving} style={{ ...S.btnPrimary, height: 34, fontSize: 12, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Salvando..." : "Salvar rascunho"}
        </button>
      </div>
    </div>
  );
}