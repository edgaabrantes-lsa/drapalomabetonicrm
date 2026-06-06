import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";

const TIPOS = {
  contrato_mestre: "Contrato Mestre",
  anexo_financeiro: "Anexo Financeiro",
  consentimento: "Consentimento",
  termo_lgpd: "Termo LGPD",
  uso_imagem: "Uso de Imagem",
  contrato_assinado: "Contrato Assinado",
  outro: "Outro"
};

const STATUS_DOC = {
  nao_gerado: { label: "Não Gerado", color: "bg-gray-500/20 text-gray-400" },
  gerado: { label: "Gerado", color: "bg-blue-500/20 text-blue-400" },
  enviado_assinatura: { label: "Enviado p/ Assinatura", color: "bg-yellow-500/20 text-yellow-400" },
  assinado: { label: "Assinado", color: "bg-green-500/20 text-green-400" },
  substituido: { label: "Substituído", color: "bg-orange-500/20 text-orange-400" },
  cancelado: { label: "Cancelado", color: "bg-red-500/20 text-red-400" },
  expirado: { label: "Expirado", color: "bg-red-700/20 text-red-600" }
};

export default function DossieDocumentacao({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nome: "", tipo: "outro", status: "gerado",
    procedimento_vinculado: "", observacoes: "", file: null
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ["dossie-docs", patient.id],
    queryFn: () => base44.entities.DossieDocumento.filter({ patient_id: patient.id }, "-data_criacao", 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DossieDocumento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] });
      setShowForm(false);
      setForm({ nome: "", tipo: "outro", status: "gerado", procedimento_vinculado: "", observacoes: "", file: null });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DossieDocumento.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] })
  });

  const handleUpload = async () => {
    setUploading(true);
    try {
      let file_url = null;
      let file_name = null;
      if (form.file) {
        const res = await base44.integrations.Core.UploadFile({ file: form.file });
        file_url = res.file_url;
        file_name = form.file.name;
      }
      await createMutation.mutateAsync({
        patient_id: patient.id,
        patient_name: patient.full_name,
        nome: form.nome,
        tipo: form.tipo,
        status: form.status,
        procedimento_vinculado: form.procedimento_vinculado,
        observacoes: form.observacoes,
        file_url,
        file_name,
        data_criacao: new Date().toISOString(),
        criado_por: currentUser?.full_name || currentUser?.email || "Sistema",
        versao: 1
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = (doc, novoStatus) => {
    updateMutation.mutate({ id: doc.id, data: { status: novoStatus } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs">
          Adicionar Documento
        </Button>
      </div>

      {showForm && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-4">
          <h3 className="text-sm font-medium text-white">Novo Documento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Nome do Documento</Label>
              <Input value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(TIPOS).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(STATUS_DOC).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Procedimento Vinculado</Label>
              <Input value={form.procedimento_vinculado} onChange={(e) => setForm(p => ({ ...p, procedimento_vinculado: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Arquivo (PDF)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm(p => ({ ...p, file: e.target.files[0] }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#252D3E]">
            <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleUpload} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={!form.nome || uploading}>
              {uploading ? "Salvando..." : "Salvar Documento"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {documentos.length === 0 && (
          <div className="text-center py-10 text-[#4A5568] text-sm">Nenhum documento registrado</div>
        )}
        {documentos.map((doc) => (
          <div key={doc.id} className="border border-[#252D3E] rounded-md bg-[#0F1521] p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm">{doc.nome}</p>
                  <Badge className={STATUS_DOC[doc.status]?.color || "bg-gray-500/20 text-gray-400"}>
                    {STATUS_DOC[doc.status]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#8A95AA]">
                  <span>{TIPOS[doc.tipo]}</span>
                  {doc.versao && <span>v{doc.versao}</span>}
                  {doc.data_criacao && <span>{format(parseISO(doc.data_criacao), "dd/MM/yyyy")}</span>}
                  {doc.procedimento_vinculado && <span>{doc.procedimento_vinculado}</span>}
                </div>
                {doc.observacoes && <p className="text-xs text-[#4A5568] mt-1">{doc.observacoes}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {doc.file_url && (
                  <>
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="text-xs text-[#C5A059] h-7 border border-[#C5A059]/30 hover:bg-[#C5A059]/10">Ver</Button>
                    </a>
                    <a href={doc.file_url} download target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="text-xs text-[#8A95AA] h-7 border border-[#252D3E]">Baixar</Button>
                    </a>
                  </>
                )}
                <Select value={doc.status} onValueChange={(v) => handleUpdateStatus(doc, v)}>
                  <SelectTrigger className="h-7 bg-[#1A2030] border-[#252D3E] text-white text-xs w-36"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#171D29] border-[#252D3E]">
                    {Object.entries(STATUS_DOC).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-xs">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}