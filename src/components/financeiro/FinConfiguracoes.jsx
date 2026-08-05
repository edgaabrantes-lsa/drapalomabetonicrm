import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

const inputStyle = { background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontFamily: "Inter", fontSize: 13, padding: "8px 12px", width: "100%" };
const labelStyle = { fontFamily: "Inter", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, display: "block", marginBottom: 6 };

const campos = [
  { key: "meta_faturamento_mensal", label: "Meta de Faturamento Mensal (R$)" },
  { key: "meta_recebimento_liquido", label: "Meta de Recebimento Líquido (R$)" },
  { key: "objetivo_caixa_livre", label: "Objetivo de Caixa Livre (R$)" },
  { key: "custo_mensal_previsto", label: "Custo Mensal Previsto (R$)" },
  { key: "saldo_minimo_seguranca", label: "Saldo Mínimo de Segurança (R$)" },
  { key: "capital_giro_desejado", label: "Capital de Giro Desejado (R$)" },
  { key: "pct_max_vendas_12x", label: "% Máximo de Vendas em 12x" },
  { key: "entrada_minima_alto_valor", label: "% Entrada Mínima (alto valor)" },
  { key: "desconto_max_pix", label: "Desconto Máximo no Pix (%)" },
  { key: "taxa_media_cartao", label: "Taxa Média de Cartão (%)" },
  { key: "taxa_parcelamento", label: "Taxa de Parcelamento (%)" },
  { key: "taxa_media_antecipacao", label: "Taxa Média de Antecipação (%)" },
  { key: "margem_minima", label: "Margem Mínima (%)" },
  { key: "dia_fechamento_financeiro", label: "Dia do Fechamento Financeiro" },
];

export default function FinConfiguracoes() {
  const queryClient = useQueryClient();
  const { data: config } = useQuery({ queryKey: ["configFin"], queryFn: () => base44.entities.ConfiguracaoFinanceira.list().then(r => r[0]) });
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.ConfiguracaoFinanceira.update(id, data) : base44.entities.ConfiguracaoFinanceira.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configFin"] }),
  });

  const salvar = () => {
    saveMutation.mutate({ id: form?.id, data: form });
  };

  if (!form) return <div style={{ color: T.dim, fontSize: 13 }}>Carregando configurações...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: "0 0 4px" }}>Configurações Financeiras</p>
        <p style={{ fontSize: 12, color: T.dim, margin: "0 0 20px" }}>Meta de entrada líquida = custos mensais + objetivo de caixa livre. Exemplo: R$ 20.000 custos + R$ 50.000 caixa livre = R$ 70.000 entrada líquida necessária.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {campos.map(c => (
            <div key={c.key}>
              <label style={labelStyle}>{c.label}</label>
              <input type="number" step="0.01" value={form[c.key] ?? 0} onChange={e => setForm(prev => ({ ...prev, [c.key]: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button onClick={salvar} style={{ background: T.gold, color: "#000", border: "none", borderRadius: 6, padding: "9px 22px", fontFamily: "Inter", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Salvar Configurações</button>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: "0 0 12px" }}>Regras de Parcelamento Automático</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid #1E1E1E` }}>
            <span style={{ fontSize: 13, color: T.muted }}>Até R$ {form.faixa1_max?.toLocaleString("pt-BR") || "3.000"}</span>
            <span style={{ fontSize: 13, color: T.gold, fontWeight: 500 }}>Máximo {form.faixa1_parcelas || 3}x</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid #1E1E1E` }}>
            <span style={{ fontSize: 13, color: T.muted }}>De R$ {(form.faixa1_max || 3000).toLocaleString("pt-BR")} a R$ {form.faixa2_max?.toLocaleString("pt-BR") || "7.999"}</span>
            <span style={{ fontSize: 13, color: T.gold, fontWeight: 500 }}>Máximo {form.faixa2_parcelas || 6}x</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid #1E1E1E` }}>
            <span style={{ fontSize: 13, color: T.muted }}>A partir de R$ {form.faixa2_max?.toLocaleString("pt-BR") || "8.000"}</span>
            <span style={{ fontSize: 13, color: T.gold, fontWeight: 500 }}>Máximo {form.faixa3_parcelas || 12}x + entrada de {form.entrada_minima_alto_valor || 30}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}