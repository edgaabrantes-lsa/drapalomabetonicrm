import React, { useState } from "react";
import AssinaturaEletronicaModal from "@/components/governanca/AssinaturaEletronicaModal";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { FileDown } from "lucide-react";

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
  const [assinaturaDoc, setAssinaturaDoc] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(null);
  const [form, setForm] = useState({
    nome: "", tipo: "outro", status: "gerado",
    procedimento_vinculado: "", observacoes: "", file: null
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ["dossie-docs", patient.id],
    queryFn: () => base44.entities.DossieDocumento.filter({ patient_id: patient.id }, "-data_criacao", 100)
  });

  const { data: assinaturas = [] } = useQuery({
    queryKey: ["assinaturas", patient.id],
    queryFn: () => base44.entities.AssinaturaEletronica.filter({ patient_id: patient.id }, "-data_assinatura", 100)
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
        versao: String("1.0")
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = (doc, novoStatus) => {
    updateMutation.mutate({ id: doc.id, data: { status: novoStatus } });
  };

  const abrirImpressaoLocal = (doc) => {
    const assinatura = assinaturas.find(a => a.documento_id === doc.id && a.status === 'assinado')
      || assinaturas.find(a => a.patient_id === patient.id && a.status === 'assinado');

    const dataAssinatura = assinatura?.data_assinatura
      ? new Date(assinatura.data_assinatura).toLocaleString('pt-BR')
      : '—';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${doc.nome || 'Documento'}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; }
    h1 { font-size: 18px; text-align: center; }
    h2 { font-size: 13px; color: #7a6030; margin-top: 28px; }
    .header { text-align: center; border-bottom: 2px solid #c8a96a; padding-bottom: 16px; margin-bottom: 24px; }
    .clinic-name { font-size: 20px; font-weight: bold; color: #c8a96a; }
    .field { margin: 6px 0; }
    .label { font-weight: bold; }
    .sig-block { border: 1px solid #c8a96a; border-radius: 6px; padding: 16px; margin-top: 24px; background: #fffdf7; }
    .sig-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; margin-bottom: 12px; }
    .hash { font-size: 10px; color: #999; word-break: break-all; margin-top: 8px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">CLÍNICA DRA. PALOMA BETONI</div>
    <div>Documento Clínico — Registro Eletrônico Certificado</div>
  </div>
  <h1>${doc.nome || 'Documento'}</h1>
  <div class="field"><span class="label">Tipo:</span> ${doc.tipo || '—'} | <span class="label">Versão:</span> ${doc.versao || '1.0'} | <span class="label">Status:</span> ${doc.status || '—'}</div>
  <h2>DADOS DA PACIENTE</h2>
  <div class="field"><span class="label">Nome:</span> ${patient.full_name || '—'}</div>
  <div class="field"><span class="label">CPF:</span> ${patient.document_number || '—'}</div>
  <div class="field"><span class="label">Telefone:</span> ${patient.phone || '—'}</div>
  ${doc.observacoes ? `<h2>OBSERVAÇÕES</h2><p>${doc.observacoes}</p>` : ''}
  <div class="sig-block">
    ${assinatura ? `<div class="sig-badge">DOCUMENTO ASSINADO ELETRONICAMENTE</div>` : `<div style="color:#c85a00;font-weight:bold;">ASSINATURA PENDENTE</div>`}
    <h2 style="margin-top:8px;">ASSINATURA ELETRÔNICA</h2>
    <div class="field">Assinado eletronicamente por <strong>${assinatura?.assinante_nome || '—'}</strong>, CPF <strong>${assinatura?.assinante_cpf || '—'}</strong>, em <strong>${dataAssinatura}</strong>, mediante aceite digital registrado na plataforma.</div>
    <div class="field"><span class="label">Nome do Assinante:</span> ${assinatura?.assinante_nome || '—'}</div>
    <div class="field"><span class="label">CPF:</span> ${assinatura?.assinante_cpf || '—'}</div>
    <div class="field"><span class="label">Data/Hora:</span> ${dataAssinatura}</div>
    <div class="field"><span class="label">Declarou Leitura:</span> ${assinatura?.declarou_leitura ? 'Sim' : 'Não'}</div>
    <div class="field"><span class="label">Concordou com os Termos:</span> ${assinatura?.concordou_termos ? 'Sim' : 'Não'}</div>
    <div class="field"><span class="label">Método:</span> Assinatura Digital Presencial (Canvas)</div>
    <div class="field"><span class="label">Status:</span> ${assinatura ? 'Assinado Eletronicamente' : 'Pendente'}</div>
    ${assinatura?.documento_hash ? `<div class="hash"><span class="label">Hash:</span> ${assinatura.documento_hash}</div>` : ''}
    ${assinatura?.assinatura_data_url && assinatura.assinatura_data_url.startsWith('http')
      ? `<div style="margin-top:12px;"><div class="label">Assinatura Manuscrita:</div><img src="${assinatura.assinatura_data_url}" style="max-width:280px;max-height:100px;border:1px solid #ddd;background:#fff;padding:4px;" /></div>`
      : ''}
  </div>
  <p style="font-size:10px;color:#999;text-align:center;margin-top:32px;">Gerado em ${new Date().toLocaleString('pt-BR')} — Clínica Dra. Paloma Betoni</p>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleGerarPdf = async (doc) => {
    setGerandoPdf(doc.id);
    try {
      const response = await base44.functions.invoke('gerarContratoAssinado', {
        documento_id: doc.id,
        patient_id: patient.id,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato_${(doc.nome || 'Documento').replace(/\s+/g, '_')}_${doc.status === 'assinado' ? 'Assinado' : 'Pendente'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro PDF servidor, usando impressão local:', error);
      abrirImpressaoLocal(doc);
    } finally {
      setGerandoPdf(null);
    }
  };

  return (
    <div className="space-y-4">
      {assinaturaDoc && (
        <AssinaturaEletronicaModal
          documento={assinaturaDoc}
          patient={patient}
          currentUser={currentUser}
          onClose={() => setAssinaturaDoc(null)}
          onSigned={() => {
            queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] });
            queryClient.invalidateQueries({ queryKey: ["assinaturas", patient.id] });
            setAssinaturaDoc(null);
          }}
        />
      )}
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
                {doc.status !== "assinado" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-[#22c55e] h-7 border border-[#22c55e]/30 hover:bg-[#22c55e]/10"
                    onClick={() => setAssinaturaDoc({
                      ...doc,
                      conteudo: doc.observacoes || "",
                      versao: String(doc.versao ?? "1.0")
                    })}
                  >
                    ✍ Assinar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-[#C5A059] h-7 border border-[#C5A059]/30 hover:bg-[#C5A059]/10"
                  onClick={() => handleGerarPdf(doc)}
                  disabled={gerandoPdf === doc.id}
                >
                  <FileDown className="w-3 h-3 mr-1" />
                  {gerandoPdf === doc.id ? 'Gerando...' : doc.status === 'assinado' ? 'PDF Assinado' : 'PDF'}
                </Button>
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