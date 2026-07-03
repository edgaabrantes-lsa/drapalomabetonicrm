import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DRE_TIPOS } from "@/lib/dreUtils";

export default function CategoriaForm({ categoria, onSave, onClose }) {
  const [formData, setFormData] = useState(
    categoria || {
      nome: "",
      tipo: "despesa_fixa",
      descricao: "",
      cor: "#C8A96A",
      status: "ativo",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome) return;
    onSave({ ...formData, ordem: formData.ordem || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Nome *</Label>
          <Input
            value={formData.nome}
            onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Tipo *</Label>
          <Select value={formData.tipo} onValueChange={(v) => setFormData((p) => ({ ...p, tipo: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              {Object.entries(DRE_TIPOS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
            <SelectTrigger className="bg-[#121212] border-[#2B2B2B] text-white mt-1" style={{ height: 36 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="ativo" className="text-white">Ativo</SelectItem>
              <SelectItem value="inativo" className="text-white">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Cor (hex)</Label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={formData.cor || "#C8A96A"}
              onChange={(e) => setFormData((p) => ({ ...p, cor: e.target.value }))}
              style={{ width: 36, height: 36, border: "1px solid #2B2B2B", borderRadius: 6, cursor: "pointer", backgroundColor: "transparent" }}
            />
            <Input
              value={formData.cor || "#C8A96A"}
              onChange={(e) => setFormData((p) => ({ ...p, cor: e.target.value }))}
              className="bg-[#121212] border-[#2B2B2B] text-white"
              style={{ height: 36 }}
            />
          </div>
        </div>
        <div className="col-span-2">
          <Label style={{ fontSize: 12, color: "#B0B0B0" }}>Descrição</Label>
          <Textarea
            value={formData.descricao || ""}
            onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
            className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
        <Button type="submit" className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black">
          {categoria ? "Salvar" : "Criar Categoria"}
        </Button>
      </div>
    </form>
  );
}