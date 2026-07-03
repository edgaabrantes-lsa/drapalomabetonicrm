import React from "react";
import { fmtBRL, fmtPercent } from "@/lib/dreUtils";

function Row({ label, value, indent, bold, color, bg }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: indent ? "7px 16px 7px 32px" : "10px 16px",
        backgroundColor: bg || "transparent",
        borderBottom: "1px solid #1E1E1E",
      }}
    >
      <span
        style={{
          fontSize: indent ? 12 : 13,
          fontWeight: bold ? 600 : 400,
          color: bold ? "#FFFFFF" : "#B0B0B0",
          letterSpacing: bold ? 0 : 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: indent ? 12 : 13,
          fontWeight: bold ? 600 : 500,
          color: color || (bold ? "#FFFFFF" : "#B0B0B0"),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ label, total, prefix }) {
  return (
    <Row
      label={`${prefix} ${label}`}
      value={fmtBRL(total)}
      bold
      color="#FFFFFF"
      bg="rgba(255,255,255,0.02)"
    />
  );
}

function SectionItems({ items }) {
  return Object.entries(items)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, val]) => (
      <Row key={cat} label={cat} value={fmtBRL(val)} indent color="#B0B0B0" />
    ));
}

function TotalRow({ label, value, color, bg }) {
  return (
    <Row
      label={label}
      value={value}
      bold
      color={color}
      bg={bg}
    />
  );
}

function EmptySection({ label }) {
  return (
    <Row label={label} value="R$ 0,00" indent color="#3A3A3A" />
  );
}

export default function DRETable({ dre }) {
  const hasItems = (section) => Object.keys(section.items).length > 0;

  return (
    <div
      style={{
        backgroundColor: "#1A1A1A",
        border: "1px solid #2B2B2B",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #2B2B2B",
          backgroundColor: "rgba(200,169,106,0.04)",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
          Demonstração do Resultado do Exercício
        </p>
      </div>

      {/* A. Receita Bruta */}
      <SectionHeader label="RECEITA BRUTA" total={dre.receitaBruta} prefix="A." />
      {hasItems(dre.sections.receita) ? <SectionItems items={dre.sections.receita.items} /> : <EmptySection label="Sem receitas no período" />}

      {/* B. Deduções */}
      <SectionHeader label="(-) DEDUÇÕES" total={dre.totalDeducoes} prefix="B." />
      {hasItems(dre.sections.deducoes) ? <SectionItems items={dre.sections.deducoes.items} /> : <EmptySection label="Sem deduções" />}

      {/* C. Receita Líquida */}
      <TotalRow label="C. = RECEITA LÍQUIDA" value={fmtBRL(dre.receitaLiquida)} color="#C8A96A" bg="rgba(200,169,106,0.06)" />

      {/* D. Custos Diretos */}
      <SectionHeader label="(-) CUSTOS DIRETOS" total={dre.totalCustosDiretos} prefix="D." />
      {hasItems(dre.sections.custo_direto) ? <SectionItems items={dre.sections.custo_direto.items} /> : <EmptySection label="Sem custos diretos" />}

      {/* E. Lucro Bruto */}
      <TotalRow label="E. = LUCRO BRUTO" value={fmtBRL(dre.lucroBruto)} color="#FFFFFF" bg="rgba(255,255,255,0.03)" />
      <Row label="   F. Margem Bruta" value={fmtPercent(dre.margemBruta)} indent bold color={dre.margemBruta >= 0 ? "#4ADE80" : "#EF4444"} />

      {/* G. Despesas Fixas */}
      <SectionHeader label="(-) DESPESAS FIXAS" total={dre.totalDespesasFixas} prefix="G." />
      {hasItems(dre.sections.despesa_fixa) ? <SectionItems items={dre.sections.despesa_fixa.items} /> : <EmptySection label="Sem despesas fixas" />}

      {/* H. Despesas Variáveis */}
      <SectionHeader label="(-) DESPESAS VARIÁVEIS" total={dre.totalDespesasVariaveis} prefix="H." />
      {hasItems(dre.sections.despesa_variavel) ? <SectionItems items={dre.sections.despesa_variavel.items} /> : <EmptySection label="Sem despesas variáveis" />}

      {/* I. Resultado Operacional */}
      <TotalRow label="I. = RESULTADO OPERACIONAL" value={fmtBRL(dre.resultadoOperacional)} color={dre.resultadoOperacional >= 0 ? "#4ADE80" : "#EF4444"} bg="rgba(255,255,255,0.03)" />

      {/* J. Outras Despesas */}
      <SectionHeader label="(-) OUTRAS DESPESAS" total={dre.totalOutrasDespesas} prefix="J." />
      {hasItems(dre.sections.outra_despesa) ? <SectionItems items={dre.sections.outra_despesa.items} /> : <EmptySection label="Sem outras despesas" />}

      {/* K. Lucro Líquido */}
      <TotalRow
        label="K. = LUCRO LÍQUIDO"
        value={fmtBRL(dre.lucroLiquido)}
        color={dre.lucroLiquido >= 0 ? "#4ADE80" : "#EF4444"}
        bg="rgba(200,169,106,0.08)"
      />
      <Row label="   L. Margem Líquida" value={fmtPercent(dre.margemLiquida)} indent bold color={dre.margemLiquida >= 0 ? "#4ADE80" : "#EF4444"} bg="rgba(200,169,106,0.04)" />
    </div>
  );
}