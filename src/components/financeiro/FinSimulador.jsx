import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatBRL, formatPct, simularCondicao, maxParcelasByValor, entradaRecomendada } from "@/lib/finCalc";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };

const inputStyle = { background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontFamily: "Inter", fontSize: 13, padding: "8px 12px", width: "100%" };
const labelStyle = { fontFamily: "Inter", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, display: "block", marginBottom: 6 };

export default function FinSimulador() {
  const { data: config } = useQuery({ queryKey: ["configFin"], queryFn: () => base44.entities.ConfiguracaoFinanceira.list().then(r => r[0]) });
  const { data: protocolos = [] } = useQuery({ queryKey: ["protocolos"], queryFn: () => base44.entities.ProtocoloPremium.list() });

  const [form, setForm] = useState({
    valor: 12000, desconto: 0, custoDireto: 3500, entrada: 30,
    numParcelas: 12, taxaCartao: 3.5, taxaParcelamento: 2.5, taxaAntecipacao: 4, pctAntecipado: 0,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const maxParc = maxParcelasByValor(form.valor - form.desconto, config);
  const entradaVal = (form.valor - form.desconto) * (form.entrada / 100);

  const resultado = useMemo(() => simularCondicao({
    valor: form.valor - form.desconto,
    entrada: entradaVal,
    numParcelas: form.numParcelas,
    taxaCartaoPct: form.taxaCartao,
    taxaParcelamentoPct: form.taxaParcelamento,
    taxaAntecipacaoPct: form.taxaAntecipacao,
    pctAntecipado: form.pctAntecipado,
    custoDireto: form.custoDireto,
  }), [form, entradaVal]);

  // Comparação de condições
  const comparacao = useMemo(() => {
    const v = form.valor - form.desconto;
    const condicoes = [
      { nome: "Pix", entrada: v, parcelas: 0, taxaCartao: 0, taxaParc: 0 },
      { nome: "Cartão à vista", entrada: v, parcelas: 0, taxaCartao: form.taxaCartao, taxaParc: 0 },
      { nome: "3x", entrada: 0, parcelas: 3, taxaCartao: form.taxaCartao, taxaParc: form.taxaParcelamento },
      { nome: "6x", entrada: 0, parcelas: 6, taxaCartao: form.taxaCartao, taxaParc: form.taxaParcelamento },
      { nome: "12x s/ entrada", entrada: 0, parcelas: 12, taxaCartao: form.taxaCartao, taxaParc: form.taxaParcelamento },
      { nome: "12x c/ entrada 30%", entrada: v * 0.3, parcelas: 12, taxaCartao: form.taxaCartao, taxaParc: form.taxaParcelamento },
    ];
    return condicoes.map(c => {
      const r = simularCondicao({ valor: v, entrada: c.entrada, numParcelas: c.parcelas, taxaCartaoPct: c.taxaCartao, taxaParcelamentoPct: c.taxaParc, custoDireto: form.custoDireto });
      return { nome: c.nome, liquido: r.valorLiquido, margem: r.margemLiquida, caixaMes1: r.entradaMes1, pctLucro: r.pctLucro };
    });
  }, [form]);

  const alertaEntrada = entradaVal < form.custoDireto;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) 1fr", gap: 20 }}>
      {/* Form */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Simulador Financeiro de Protocolos</p>
        <div>
          <label style={labelStyle}>Valor de tabela (R$)</label>
          <input type="number" value={form.valor} onChange={e => set("valor", parseFloat(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Desconto (R$)</label>
          <input type="number" value={form.desconto} onChange={e => set("desconto", parseFloat(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Custo direto estimado (R$)</label>
          <input type="number" value={form.custoDireto} onChange={e => set("custoDireto", parseFloat(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Entrada (%) — Máx. parcelas p/ este valor: {maxParc}x</label>
          <input type="number" value={form.entrada} onChange={e => set("entrada", parseFloat(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Número de parcelas</label>
          <input type="number" value={form.numParcelas} min={0} max={maxParc} onChange={e => set("numParcelas", Math.min(parseInt(e.target.value) || 0, maxParc))} style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Taxa cartão (%)</label>
            <input type="number" step="0.1" value={form.taxaCartao} onChange={e => set("taxaCartao", parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Taxa parcelam. (%)</label>
            <input type="number" step="0.1" value={form.taxaParcelamento} onChange={e => set("taxaParcelamento", parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Taxa antecip. (%)</label>
            <input type="number" step="0.1" value={form.taxaAntecipacao} onChange={e => set("taxaAntecipacao", parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Antecipar (%)</label>
            <input type="number" value={form.pctAntecipado} onChange={e => set("pctAntecipado", parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
        </div>
        {alertaEntrada && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "10px 12px" }}>
            <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>Entrada ({formatBRL(entradaVal)}) inferior ao custo direto ({formatBRL(form.custoDireto)}). A venda produz caixa negativo na execução.</p>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {[
            { l: "Valor Bruto Vendido", v: formatBRL(form.valor - form.desconto) },
            { l: "Valor Líquido da Venda", v: formatBRL(resultado.valorLiquido), gold: true },
            { l: "Entrada", v: formatBRL(entradaVal) },
            { l: "Valor Parcelado", v: formatBRL((form.valor - form.desconto) - entradaVal) },
            { l: "Total de Taxas", v: formatBRL(resultado.totalTaxas), cor: "#EF4444" },
            { l: "Custo Antecipação", v: formatBRL(resultado.custoAntecipacao), cor: "#EF4444" },
            { l: "Líquido no 1º Mês", v: formatBRL(resultado.entradaMes1), gold: true },
            { l: "Contas a Receber", v: formatBRL(resultado.contasReceber) },
            { l: "Margem Bruta", v: formatBRL(resultado.margemBruta) },
            { l: "Margem Líquida", v: formatBRL(resultado.margemLiquida), gold: resultado.margemLiquida > 0 },
            { l: "% de Lucro", v: formatPct(resultado.pctLucro), gold: resultado.pctLucro > 0 },
          ].map(k => (
            <div key={k.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderBottom: k.gold ? `2px solid ${T.gold}` : `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 9, color: T.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.l}</p>
              <p style={{ fontSize: 17, fontWeight: 600, color: k.cor || (k.gold ? T.gold : T.text), margin: "6px 0 0" }}>{k.v}</p>
            </div>
          ))}
        </div>

        {/* Comparação */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Comparação de Condições de Pagamento</p>
          </div>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr>
                  {["Condição", "Líquido", "Margem Líquida", "Caixa no 1º Mês", "% Lucro"].map(h => (
                    <th key={h} style={{ textAlign: h === "Condição" ? "left" : "right", padding: "10px 14px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparacao.map(c => (
                  <tr key={c.nome} style={{ borderBottom: `1px solid #1E1E1E` }}>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: T.text }}>{c.nome}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: T.muted, textAlign: "right" }}>{formatBRL(c.liquido)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: c.margem > 0 ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{formatBRL(c.margem)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: T.gold, textAlign: "right", fontWeight: 500 }}>{formatBRL(c.caixaMes1)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: c.pctLucro > 0 ? T.text : "#EF4444", textAlign: "right" }}>{formatPct(c.pctLucro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p style={{ fontSize: 12, color: T.dim, fontStyle: "italic" }}>Procedimento pequeno, parcela curta. Protocolo grande, parcela longa, mas com entrada. Parcelar aumenta o custo da venda. Antecipar aumenta o custo do caixa.</p>
      </div>
    </div>
  );
}