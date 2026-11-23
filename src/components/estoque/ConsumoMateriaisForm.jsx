import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { Plus, Trash2, AlertTriangle, Package } from "lucide-react";

let seq = 0;
export function novaLinhaConsumo(patch = {}) {
  seq += 1;
  return {
    key: `linha-${Date.now()}-${seq}`,
    procedure_id: "",
    procedure_name: "",
    supply_id: "",
    batch_id: "",
    quantity: "",
    ...patch,
  };
}

function loteVencido(dataStr) {
  if (!dataStr) return false;
  const d = new Date(String(dataStr) + "T23:59:59");
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

export function conteudoDoProduto(supply) {
  const c = Number(supply?.conteudo_por_unidade);
  return Number.isFinite(c) && c > 0 ? c : 1;
}

export function unidadeDoProduto(supply) {
  return supply?.unidade_consumo || supply?.unit || "un";
}

export default function ConsumoMateriaisForm({ value, onChange, procedures = [], onValidChange, disabled }) {
  const [supplies, setSupplies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sups, lts] = await Promise.all([
          base44.entities.Supply.list("-created_date", 500),
          base44.entities.SupplyBatch.list("-created_date", 500),
        ]);
        setSupplies(sups || []);
        setBatches(lts || []);
      } finally {
        setLoading(false);
        setCarregado(true);
      }
    })();
  }, []);

  const rows = Array.isArray(value) ? value : [];
  const mostrarProcedimento = procedures.length > 1;

  const atualizar = (key, patch) => {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const adicionar = () => onChange([...rows, novaLinhaConsumo(
    procedures.length === 1 ? { procedure_id: procedures[0].id, procedure_name: procedures[0].name } : {},
  )]);

  const remover = (key) => onChange(rows.filter((r) => r.key !== key));

  // ── Validação ──
  const erros = {};
  rows.forEach((r) => {
    if (!r.supply_id) return;
    const sup = supplies.find((s) => s.id === r.supply_id);
    if (!sup) { erros[r.key] = "Produto não encontrado no estoque"; return; }
    const conteudo = conteudoDoProduto(sup);
    const unidade = unidadeDoProduto(sup);
    const lotes = batches.filter((b) => b.supply_id === sup.id && b.status === "active" && !loteVencido(b.expiry_date));
    const qty = Number(r.quantity);

    if (lotes.length > 0 && !r.batch_id) {
      erros[r.key] = "Selecione o lote do produto";
      return;
    }
    const lote = lotes.find((b) => b.id === r.batch_id);
    const disponivel = lote
      ? Number(lote.quantity_remaining || 0) * conteudo
      : Number(sup.current_stock || 0) * conteudo;

    if (!Number.isFinite(qty) || qty <= 0) {
      erros[r.key] = "Informe a quantidade efetivamente utilizada";
    } else if (qty > disponivel + 0.0001) {
      erros[r.key] = `Saldo insuficiente: disponível ${Math.round(disponivel * 100) / 100} ${unidade}`;
    }
    if (mostrarProcedimento && !r.procedure_name) {
      erros[r.key] = "Indique o procedimento deste material";
    }
  });

  const valido = rows.length > 0 && Object.keys(erros).length === 0;

  useEffect(() => {
    if (carregado && onValidChange) onValidChange(valido);
  }, [valido, carregado]);

  if (loading) {
    return <p style={{ ...S.pageSubtitle, margin: 0 }}>Carregando estoque...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.length === 0 && (
        <div style={{ background: T.bgSecondary, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "18px 14px", textAlign: "center" }}>
          <Package size={20} style={{ color: "#444", marginBottom: 6 }} />
          <p style={{ ...S.pageSubtitle, margin: 0 }}>
            Nenhum material adicionado. Registre o que foi efetivamente utilizado.
          </p>
        </div>
      )}

      {rows.map((r) => {
        const sup = supplies.find((s) => s.id === r.supply_id);
        const conteudo = conteudoDoProduto(sup);
        const unidade = unidadeDoProduto(sup);
        const lotes = sup
          ? batches.filter((b) => b.supply_id === sup.id && b.status === "active" && !loteVencido(b.expiry_date))
          : [];
        const lote = lotes.find((b) => b.id === r.batch_id);
        const disponivel = sup
          ? (lote ? Number(lote.quantity_remaining || 0) : Number(sup.current_stock || 0)) * conteudo
          : 0;
        const estoqueBaixo = sup && sup.minimum_stock != null && Number(sup.current_stock || 0) <= Number(sup.minimum_stock);

        return (
          <div key={r.key} style={{ background: T.bgSecondary, border: `1px solid ${erros[r.key] ? "rgba(239,68,68,0.35)" : T.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
              {mostrarProcedimento && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ ...S.label, marginBottom: 3 }}>Procedimento</p>
                  <select
                    value={r.procedure_id || ""}
                    disabled={disabled}
                    onChange={(e) => {
                      const p = procedures.find((x) => x.id === e.target.value);
                      atualizar(r.key, { procedure_id: p?.id || "", procedure_name: p?.name || "" });
                    }}
                    style={{ ...S.input, height: 34, fontSize: 13 }}
                  >
                    <option value="">Selecione</option>
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p style={{ ...S.label, marginBottom: 3 }}>Produto</p>
                <select
                  value={r.supply_id}
                  disabled={disabled}
                  onChange={(e) => atualizar(r.key, { supply_id: e.target.value, batch_id: "", quantity: "" })}
                  style={{ ...S.input, height: 34, fontSize: 13 }}
                >
                  <option value="">Selecione</option>
                  {supplies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.brand ? ` — ${s.brand}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p style={{ ...S.label, marginBottom: 3 }}>Lote</p>
                <select
                  value={r.batch_id || ""}
                  disabled={disabled || !sup || lotes.length === 0}
                  onChange={(e) => atualizar(r.key, { batch_id: e.target.value })}
                  style={{ ...S.input, height: 34, fontSize: 13 }}
                >
                  <option value="">{!sup ? "—" : lotes.length === 0 ? "Sem lote cadastrado" : "Selecione"}</option>
                  {lotes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {Math.round(Number(b.quantity_remaining || 0) * conteudo * 100) / 100} {unidade}
                      {b.expiry_date ? ` — val. ${new Date(b.expiry_date + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p style={{ ...S.label, marginBottom: 3 }}>Quantidade utilizada {sup ? `(${unidade})` : ""}</p>
                <input
                  type="number"
                  min="0"
                  step={unidade === "un" || unidade === "u" ? "1" : "0.1"}
                  value={r.quantity}
                  disabled={disabled || !sup}
                  onChange={(e) => atualizar(r.key, { quantity: e.target.value })}
                  placeholder={unidade === "ml" ? "Ex: 1.5" : unidade === "u" ? "Ex: 40" : "Ex: 1"}
                  style={{ ...S.input, height: 34, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ ...S.label, marginBottom: 3 }}>Disponível</p>
                  <p style={{ fontFamily: T.font, fontSize: 12, color: sup ? T.textSecondary : T.textMuted, margin: 0 }}>
                    {sup ? `${Math.round(disponivel * 100) / 100} ${unidade}` : "—"}
                  </p>
                </div>
                {!disabled && (
                  <button
                    onClick={() => remover(r.key)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.danger, display: "flex", alignItems: "center", gap: 3, fontSize: 11, paddingBottom: 2 }}
                  >
                    <Trash2 size={12} /> Remover
                  </button>
                )}
              </div>
            </div>

            {estoqueBaixo && !erros[r.key] && (
              <p style={{ fontFamily: T.font, fontSize: 11, color: T.warning, margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={11} /> Estoque abaixo do mínimo para este produto.
              </p>
            )}
            {erros[r.key] && (
              <p style={{ fontFamily: T.font, fontSize: 11, color: "#FCA5A5", margin: "6px 0 0" }}>{erros[r.key]}</p>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          onClick={adicionar}
          style={{ ...S.btnGhost, height: 32, fontSize: 12, display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}
        >
          <Plus size={12} /> Adicionar material
        </button>
      )}
    </div>
  );
}