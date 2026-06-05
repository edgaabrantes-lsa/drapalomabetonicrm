import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SECTIONS, STATUS_CONFIG } from "./vigilanciaData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Building2, ClipboardList, Shield, Zap, Package,
  Trash2, Lock, ChevronDown, ChevronRight, Upload, X, Check, Paperclip
} from "lucide-react";

const ICON_MAP = { FileText, Building2, ClipboardList, Shield, Zap, Package, Trash2, Lock };

function ItemRow({ secKey, itemLabel, savedItem, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    status: savedItem?.status || "nao_iniciado",
    completed_date: savedItem?.completed_date || "",
    responsible: savedItem?.responsible || "",
    observations: savedItem?.observations || "",
    file_urls: savedItem?.file_urls || [],
  });
  const [uploading, setUploading] = useState(false);

  const cfg = STATUS_CONFIG[form.status];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_urls: [...prev.file_urls, file_url] }));
    setUploading(false);
  };

  const handleSave = () => {
    onSave({
      section: secKey,
      item_key: `${secKey}__${itemLabel}`,
      label: itemLabel,
      ...form,
    });
    setExpanded(false);
  };

  return (
    <div className="rounded-xl border transition-all"
      style={{ borderColor: expanded ? "#334155" : "#1e293b", backgroundColor: "#0f172a" }}>
      {/* Row header */}
      <div className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}>
        {/* Status dot */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: cfg?.color || "#64748b" }} />
        <span className="text-sm text-slate-200 flex-1">{itemLabel}</span>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: cfg?.color, backgroundColor: cfg?.bg }}>
          {cfg?.label}
        </span>
        {savedItem?.file_urls?.length > 0 && (
          <Paperclip className="h-3 w-3 text-blue-400 flex-shrink-0" />
        )}
        {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "#1e293b" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-8 text-xs" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-slate-200 text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Data de Conclusão</Label>
              <Input type="date" value={form.completed_date}
                onChange={e => setForm(p => ({ ...p, completed_date: e.target.value }))}
                className="mt-1 h-8 text-xs" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label className="text-xs" style={{ color: "#94a3b8" }}>Responsável</Label>
              <Input value={form.responsible} placeholder="Nome..."
                onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))}
                className="mt-1 h-8 text-xs" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
            </div>
          </div>

          <div>
            <Label className="text-xs" style={{ color: "#94a3b8" }}>Observações</Label>
            <Textarea value={form.observations} rows={2}
              onChange={e => setForm(p => ({ ...p, observations: e.target.value }))}
              className="mt-1 text-xs resize-none" placeholder="Anotações, referências, etc..."
              style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
          </div>

          {/* Upload */}
          <div>
            <Label className="text-xs" style={{ color: "#94a3b8" }}>Anexos</Label>
            <div className="flex items-center gap-2 mt-1">
              <label className="cursor-pointer flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-blue-500/10"
                style={{ borderColor: "#334155", color: "#60a5fa" }}>
                <Upload className="h-3 w-3" />
                {uploading ? "Enviando..." : "Anexar arquivo"}
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {form.file_urls.map((url, i) => (
                <div key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ backgroundColor: "#1e40af20", border: "1px solid #1e40af40", color: "#93c5fd" }}>
                  <Paperclip className="h-3 w-3" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="max-w-[80px] truncate hover:underline">
                    Arquivo {i + 1}
                  </a>
                  <button onClick={() => setForm(p => ({ ...p, file_urls: p.file_urls.filter((_, idx) => idx !== i) }))}>
                    <X className="h-3 w-3 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave}
              className="text-xs gap-1"
              style={{ backgroundColor: "#1e40af", color: "#fff" }}>
              <Check className="h-3 w-3" /> Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VigilanciaChecklist() {
  const queryClient = useQueryClient();
  const [openSection, setOpenSection] = useState(SECTIONS[0].key);

  const { data: items = [] } = useQuery({
    queryKey: ["vigilancia-items"],
    queryFn: () => base44.entities.VigilanciaItem.list(),
  });

  const upsertMutation = useMutation({
    mutationFn: async (data) => {
      const existing = items.find(i => i.item_key === data.item_key);
      if (existing) return base44.entities.VigilanciaItem.update(existing.id, data);
      return base44.entities.VigilanciaItem.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vigilancia-items"] }),
  });

  return (
    <div className="space-y-3">
      {SECTIONS.map(sec => {
        const Icon = ICON_MAP[sec.icon] || FileText;
        const secItems = items.filter(i => i.section === sec.key);
        const done = secItems.filter(i => i.status === "concluido").length;
        const total = sec.items.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const barColor = pct >= 90 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";
        const isOpen = openSection === sec.key;

        return (
          <div key={sec.key} className="rounded-2xl border overflow-hidden"
            style={{ borderColor: isOpen ? "#334155" : "#1e293b", backgroundColor: "#0a0f1e" }}>
            {/* Section header */}
            <button className="w-full flex items-center gap-3 p-4 hover:bg-white/2 transition-colors text-left"
              onClick={() => setOpenSection(isOpen ? null : sec.key)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${sec.color}20` }}>
                <Icon className="h-4 w-4" style={{ color: sec.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{sec.label}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1.5 rounded-full max-w-[120px]" style={{ backgroundColor: "#1e293b" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                  <span className="text-xs" style={{ color: "#64748b" }}>{done}/{total} — {pct}%</span>
                </div>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
            </button>

            {/* Items */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "#1e293b" }}>
                <div className="pt-3 space-y-2">
                  {sec.items.map((itemLabel) => {
                    const saved = items.find(i => i.item_key === `${sec.key}__${itemLabel}`);
                    return (
                      <ItemRow key={itemLabel} secKey={sec.key} itemLabel={itemLabel}
                        savedItem={saved} onSave={(data) => upsertMutation.mutate(data)} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}