import React from "react";
import { T, S } from "@/lib/designTokens";
import { UserCheck } from "lucide-react";

export default function ResponsavelLegalForm({ data = {}, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div style={{
      background: T.bgSecondary, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: 16, marginTop: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <UserCheck style={{ width: 15, height: 15, color: T.gold }} />
        <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
          Responsável Legal
        </span>
        <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
          (Menor de idade, dependente ou representação legal)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <p style={S.label}>Nome Completo</p>
          <input
            value={data.nome || ""}
            onChange={e => set("nome", e.target.value)}
            placeholder="Nome do responsável"
            style={{ ...S.input, marginTop: 4 }}
          />
        </div>
        <div>
          <p style={S.label}>Parentesco</p>
          <select
            value={data.parentesco || ""}
            onChange={e => set("parentesco", e.target.value)}
            style={{ ...S.input, marginTop: 4 }}
          >
            <option value="">Selecione...</option>
            <option value="mae">Mãe</option>
            <option value="pai">Pai</option>
            <option value="conjuge">Cônjuge</option>
            <option value="filho">Filho(a)</option>
            <option value="tutor">Tutor Legal</option>
            <option value="representante">Representante Legal</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <p style={S.label}>CPF</p>
          <input
            value={data.cpf || ""}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 11);
              set("cpf", v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
            }}
            placeholder="000.000.000-00"
            style={{ ...S.input, marginTop: 4 }}
          />
        </div>
        <div>
          <p style={S.label}>RG</p>
          <input
            value={data.rg || ""}
            onChange={e => set("rg", e.target.value)}
            placeholder="Número do RG"
            style={{ ...S.input, marginTop: 4 }}
          />
        </div>
        <div>
          <p style={S.label}>Telefone</p>
          <input
            value={data.telefone || ""}
            onChange={e => set("telefone", e.target.value)}
            placeholder="(11) 99999-9999"
            style={{ ...S.input, marginTop: 4 }}
          />
        </div>
        <div>
          <p style={S.label}>E-mail</p>
          <input
            type="email"
            value={data.email || ""}
            onChange={e => set("email", e.target.value)}
            placeholder="email@exemplo.com"
            style={{ ...S.input, marginTop: 4 }}
          />
        </div>
      </div>
    </div>
  );
}