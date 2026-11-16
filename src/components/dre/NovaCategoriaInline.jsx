import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizarNome } from "@/lib/dreUtils";

/**
 * Criação rápida de categoria dentro do formulário de lançamento.
 * Reaproveita categoria existente com o mesmo nome (ignorando acentos, caixa e espaços).
 */
export default function NovaCategoriaInline({ tipo, categorias = [], onCreated, onCancel }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const limpo = nome.replace(/\s+/g, " ").trim();
    if (!limpo) { setErro("Informe o nome da categoria."); return; }
    setErro("");
    const existente = categorias.find(c => normalizarNome(c.nome) === normalizarNome(limpo));
    if (existente) {
      onCreated(existente);
      return;
    }
    setSalvando(true);
    try {
      const criada = await base44.entities.DRECategoria.create({
        nome: limpo,
        tipo,
        status: "ativo",
        predefinida: false,
        ordem: 100,
      });
      queryClient.invalidateQueries({ queryKey: ["dreCategorias"] });
      onCreated(criada);
    } catch (e) {
      setErro(e?.message || "Não foi possível salvar a categoria.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 6, padding: 12 }}>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666", marginBottom: 8 }}>
        Nova categoria
      </p>
      <div className="flex gap-2">
        <Input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); salvar(); } }}
          placeholder="Ex.: Material de limpeza"
          className="bg-[#0A0A0A] border-[#2B2B2B] text-white"
          style={{ height: 34, fontSize: 13 }}
        />
        <Button type="button" onClick={salvar} disabled={salvando} className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black" style={{ height: 34, fontSize: 12 }}>
          {salvando ? "Salvando..." : "Criar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-400" style={{ height: 34, fontSize: 12 }}>
          Cancelar
        </Button>
      </div>
      {erro && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>{erro}</p>}
    </div>
  );
}