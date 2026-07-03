import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Power, Database } from "lucide-react";
import CategoriaForm from "./CategoriaForm";
import { DRE_TIPOS, DEFAULT_CATEGORIES } from "@/lib/dreUtils";
import { usePermissions } from "@/lib/PermissionsContext";

export default function CategoriasDRE() {
  const queryClient = useQueryClient();
  const { hasAction } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["dreCategorias"],
    queryFn: () => base44.entities.DRECategoria.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.DRECategoria.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dreCategorias"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DRECategoria.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dreCategorias"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.DRECategoria.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dreCategorias"] }),
  });
  const bulkCreateMut = useMutation({
    mutationFn: (data) => base44.entities.DRECategoria.bulkCreate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dreCategorias"] }),
  });

  const handleSave = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await base44.entities.DRECategoria.bulkCreate(DEFAULT_CATEGORIES);
      queryClient.invalidateQueries({ queryKey: ["dreCategorias"] });
    } catch (e) {
      console.error(e);
    }
    setSeeding(false);
  };

  const canEdit = hasAction("configurar");
  const canDelete = hasAction("excluir");

  const grouped = Object.keys(DRE_TIPOS).map((tipo) => ({
    tipo,
    label: DRE_TIPOS[tipo],
    items: categorias.filter((c) => c.tipo === tipo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p style={{ fontSize: 13, color: "#666666" }}>
          {categorias.length} categoria(s) cadastrada(s)
        </p>
        <div className="flex gap-3">
          {categorias.length === 0 && canEdit && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "1px solid #2B2B2B",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 16px",
                height: 36,
                cursor: seeding ? "not-allowed" : "pointer",
                color: "#C8A96A",
              }}
            >
              <Database style={{ width: 13, height: 13 }} /> {seeding ? "Criando..." : "Cadastrar Padrão"}
            </button>
          )}
          {canEdit && (
            <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <button
                  style={{
                    background: "#C8A96A",
                    color: "#000",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 18px",
                    height: 36,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Nova Categoria
                </button>
              </DialogTrigger>
              <DialogContent className="text-white max-w-md" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
                <DialogHeader>
                  <DialogTitle style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>
                    {editing ? "Editar Categoria" : "Nova Categoria"}
                  </DialogTitle>
                </DialogHeader>
                <CategoriaForm
                  categoria={editing}
                  onSave={handleSave}
                  onClose={() => { setIsFormOpen(false); setEditing(null); }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Categories by type */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
        </div>
      ) : categorias.length === 0 ? (
        <div
          style={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #2B2B2B",
            borderRadius: 8,
            padding: 40,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "#666666" }}>Nenhuma categoria cadastrada</p>
          <p style={{ fontSize: 12, color: "#555555", marginTop: 4 }}>
            Clique em "Cadastrar Padrão" para criar as categorias pré-definidas do DRE.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div
              key={group.tipo}
              style={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #2B2B2B",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid #2B2B2B",
                  backgroundColor: "rgba(200,169,106,0.04)",
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C8A96A", margin: 0 }}>
                  {group.label}
                </p>
              </div>
              {group.items.length === 0 ? (
                <p style={{ fontSize: 12, color: "#3A3A3A", padding: "10px 16px" }}>Nenhuma categoria</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                  {group.items.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        padding: "10px 16px",
                        borderRight: "1px solid #1E1E1E",
                        borderBottom: "1px solid #1E1E1E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: cat.cor || "#C8A96A" }} />
                        <span style={{ fontSize: 13, color: cat.status === "ativo" ? "#FFFFFF" : "#555555", fontWeight: 500 }}>
                          {cat.nome}
                        </span>
                        {cat.predefinida && (
                          <span style={{ fontSize: 9, color: "#3A3A3A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Padrão</span>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <button
                            onClick={() => { setEditing(cat); setIsFormOpen(true); }}
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                          >
                            <Pencil style={{ width: 12, height: 12, color: "#666666" }} />
                          </button>
                          <button
                            onClick={() => updateMut.mutate({ id: cat.id, data: { ...cat, status: cat.status === "ativo" ? "inativo" : "ativo" } })}
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                          >
                            <Power style={{ width: 12, height: 12, color: cat.status === "ativo" ? "#4ADE80" : "#555555" }} />
                          </button>
                          {!cat.predefinida && canDelete && (
                            <button
                              onClick={() => { if (confirm("Excluir esta categoria?")) deleteMut.mutate(cat.id); }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                            >
                              <Trash2 style={{ width: 12, height: 12, color: "#EF4444" }} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}