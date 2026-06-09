import React, { useState } from "react";
import { FileDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import CurrencyInput from "@/components/ui/CurrencyInput";

const STATUS_DOC = {
  assinado: { label: "Assinado", color: "bg-green-500/20 text-green-400" },
  pendente_assinatura: { label: "Pendente de Assinatura", color: "bg-yellow-500/20 text-yellow-400" },
  substituido: { label: "Substituído", color: "bg-orange-500/20 text-orange-400" },
  cancelado: { label: "Cancelado", color: "bg-red-500/20 text-red-400" }
};

// ------ Geração de PDF ------
const TEMPLATES = {
  contrato_mestre: (vars) => `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

Pelo presente instrumento, as partes abaixo qualificadas acordam o seguinte:

CONTRATANTE: ${vars.nome_paciente}
CPF: ${vars.cpf_paciente}
RG: ${vars.rg_paciente}
Telefone: ${vars.telefone_paciente}
E-mail: ${vars.email_paciente}
Endereço: ${vars.endereco_paciente}

CONTRATADA: ${vars.nome_clinica}
CNPJ: ${vars.cnpj_clinica}
Endereço: ${vars.endereco_clinica}

OBJETO DO CONTRATO
A CONTRATADA prestará os seguintes serviços:
Procedimento: ${vars.procedimento}
Descrição: ${vars.descricao_procedimento}

PROFISSIONAL RESPONSÁVEL: ${vars.profissional_responsavel}
DATA PREVISTA: ${vars.data_procedimento}

CONDIÇÕES FINANCEIRAS
Valor Total: R$ ${vars.valor_total}
Entrada: R$ ${vars.entrada}
Parcelamento: ${vars.parcelas}
Forma de Pagamento: ${vars.forma_pagamento}

OBSERVAÇÕES: ${vars.observacoes}

Data de emissão: ${vars.data_emissao}

_______________________________          _______________________________
Assinatura da Paciente                    Assinatura da Clínica`,

  anexo_financeiro: (vars) => `ANEXO FINANCEIRO

Paciente: ${vars.nome_paciente} — CPF: ${vars.cpf_paciente}
Procedimento: ${vars.procedimento}

DETALHAMENTO FINANCEIRO
Valor Total: R$ ${vars.valor_total}
Entrada: R$ ${vars.entrada}
Parcelamento: ${vars.parcelas}
Forma de Pagamento: ${vars.forma_pagamento}
Data de Emissão: ${vars.data_emissao}

Este anexo faz parte integrante do Contrato Mestre firmado entre as partes.

_______________________________          _______________________________
Assinatura da Paciente                    Assinatura da Clínica`,

  consentimento: (vars) => `TERMO DE CONSENTIMENTO INFORMADO

Paciente: ${vars.nome_paciente}
CPF: ${vars.cpf_paciente}
Procedimento: ${vars.procedimento}
Profissional: ${vars.profissional_responsavel}

Declaro que fui devidamente informada sobre o procedimento a ser realizado, seus riscos, benefícios, alternativas e cuidados pré e pós-procedimento.

Declaro estar ciente de que os resultados podem variar individualmente e que me comprometo a seguir as orientações fornecidas pelo profissional responsável.

Data: ${vars.data_emissao}

_______________________________
Assinatura da Paciente`,

  termo_lgpd: (vars) => `TERMO DE CONSENTIMENTO E PROTEÇÃO DE DADOS (LGPD)

Paciente: ${vars.nome_paciente} — CPF: ${vars.cpf_paciente}

Nos termos da Lei 13.709/2018 (LGPD), autorizo ${vars.nome_clinica} a coletar, armazenar e tratar meus dados pessoais e de saúde, exclusivamente para fins de prestação dos serviços contratados.

Meus dados não serão compartilhados com terceiros sem meu consentimento, exceto quando necessário para o cumprimento de obrigações legais.

Tenho ciência do meu direito de acesso, correção, exclusão e portabilidade dos meus dados.

Data: ${vars.data_emissao}

_______________________________
Assinatura da Paciente`,

  uso_imagem: (vars) => `AUTORIZAÇÃO DE USO DE IMAGEM

Paciente: ${vars.nome_paciente} — CPF: ${vars.cpf_paciente}

Autorizo ${vars.nome_clinica} a registrar imagens fotográficas e/ou vídeos do meu tratamento, para fins exclusivos de documentação clínica, acompanhamento do resultado e, se expressamente autorizado em separado, para fins educacionais ou de divulgação.

Procedimento: ${vars.procedimento}
Data: ${vars.data_emissao}

_______________________________
Assinatura da Paciente`
};

function generatePDF(patient, formData, selectedDocs) {
  const vars = {
    nome_paciente: patient.full_name || "",
    cpf_paciente: patient.document_number || "Não informado",
    rg_paciente: patient.rg || "Não informado",
    telefone_paciente: patient.phone || "",
    email_paciente: patient.email || "",
    endereco_paciente: patient.address ? `${patient.address.street || ""}, ${patient.address.number || ""}, ${patient.address.city || ""}` : "",
    nome_clinica: "Clínica Dra. Paloma Betoni",
    cnpj_clinica: formData.cnpj_clinica || "Não informado",
    endereco_clinica: formData.endereco_clinica || "",
    procedimento: formData.procedimento || "",
    descricao_procedimento: formData.descricao_procedimento || "",
    valor_total: formData.valor_total ? parseFloat(formData.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00",
    entrada: formData.entrada ? parseFloat(formData.entrada).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00",
    parcelas: formData.num_parcelas > 1 ? `${formData.num_parcelas}x de R$ ${(parseFloat(formData.valor_total) / parseInt(formData.num_parcelas)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Pagamento único",
    forma_pagamento: formData.forma_pagamento || "",
    data_procedimento: formData.data_procedimento || "",
    data_emissao: format(new Date(), "dd/MM/yyyy"),
    profissional_responsavel: formData.profissional_responsavel || "",
    observacoes: formData.observacoes || ""
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let isFirst = true;

  const addHeader = () => {
    doc.setFillColor(13, 17, 25);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(197, 160, 89);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CLÍNICA DRA. PALOMA BETONI", pageWidth / 2, 12, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Paciente: ${patient.full_name}   |   Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 20, { align: "center" });
  };

  const addFooter = (pageNum) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Página ${pageNum}   |   Documento gerado automaticamente — ${vars.data_emissao}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  };

  let pageCount = 1;
  const DOC_KEYS = ["contrato_mestre", "anexo_financeiro", "consentimento", "termo_lgpd", "uso_imagem"];

  DOC_KEYS.forEach((key) => {
    if (!selectedDocs[key]) return;
    if (!isFirst) { doc.addPage(); pageCount++; }
    isFirst = false;
    addHeader();
    addFooter(pageCount);
    const text = TEMPLATES[key](vars);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, pageWidth - 30);
    doc.text(lines, 15, 35);
  });

  return doc;
}

export default function DossieContratos({ patient, currentUser, mode = "gerados" }) {
  const queryClient = useQueryClient();
  const [showGerarForm, setShowGerarForm] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(null);

  const handleGerarPdfContrato = async (doc) => {
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
      alert('Erro ao gerar PDF: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGerandoPdf(null);
    }
  };
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState({
    contrato_mestre: true, anexo_financeiro: true, consentimento: true, termo_lgpd: true, uso_imagem: false
  });
  const [gerarForm, setGerarForm] = useState({
    procedimento: "", descricao_procedimento: "", valor_total: "", entrada: "",
    num_parcelas: "1", forma_pagamento: "PIX", data_procedimento: "",
    profissional_responsavel: "", observacoes: "", cnpj_clinica: "", endereco_clinica: ""
  });
  const [uploadForm, setUploadForm] = useState({
    nome: "", tipo: "contrato_assinado", procedimento_vinculado: "", valor: "",
    data_assinatura: "", status: "assinado", observacoes: "", file: null,
    origem: "upload_externo", tipo_documento_assinado: "pdf_assinado_externo"
  });

  const filterTipo = mode === "gerados"
    ? ["contrato_mestre", "anexo_financeiro", "consentimento", "termo_lgpd", "uso_imagem", "outro"]
    : ["contrato_assinado"];

  const { data: contratos = [] } = useQuery({
    queryKey: ["dossie-contratos", patient.id, mode],
    queryFn: async () => {
      const all = await base44.entities.DossieDocumento.filter({ patient_id: patient.id }, "-data_criacao", 100);
      return mode === "gerados"
        ? all.filter(d => d.tipo !== "contrato_assinado")
        : all.filter(d => d.tipo === "contrato_assinado");
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DossieDocumento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-contratos", patient.id, mode] });
      setShowGerarForm(false);
      setShowUploadForm(false);
    }
  });

  const handleGerarPDF = async () => {
    const missing = [];
    if (!patient.full_name) missing.push("Nome");
    if (!patient.document_number) missing.push("CPF");
    if (!patient.phone) missing.push("Telefone");
    if (!gerarForm.procedimento) missing.push("Procedimento");
    if (!gerarForm.valor_total) missing.push("Valor Total");
    if (!gerarForm.forma_pagamento) missing.push("Forma de Pagamento");
    if (!gerarForm.profissional_responsavel) missing.push("Profissional Responsável");

    if (missing.length > 0) {
      alert(`Não foi possível gerar o documento. Preencha os campos obrigatórios: ${missing.join(", ")}.`);
      return;
    }

    setGenerating(true);
    try {
      const pdfDoc = generatePDF(patient, gerarForm, selectedDocs);
      const pdfBlob = pdfDoc.output("blob");
      const fileName = `dossie_${patient.full_name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const docsGerados = Object.keys(selectedDocs).filter(k => selectedDocs[k]).join(", ");
      await createMutation.mutateAsync({
        patient_id: patient.id,
        patient_name: patient.full_name,
        nome: `Dossiê de Atendimento — ${gerarForm.procedimento}`,
        tipo: "contrato_mestre",
        status: "gerado",
        procedimento_vinculado: gerarForm.procedimento,
        file_url,
        file_name: fileName,
        data_criacao: new Date().toISOString(),
        criado_por: currentUser?.full_name || currentUser?.email || "Sistema",
        versao: String("1.0"),
        observacoes: `Documentos incluídos: ${docsGerados}`
      });

      pdfDoc.save(fileName);
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadAssinado = async () => {
    if (!uploadForm.file || !uploadForm.nome) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadForm.file });
      await createMutation.mutateAsync({
        patient_id: patient.id,
        patient_name: patient.full_name,
        nome: uploadForm.nome,
        tipo: "contrato_assinado",
        status: uploadForm.status,
        procedimento_vinculado: uploadForm.procedimento_vinculado,
        file_url,
        file_name: uploadForm.file.name,
        data_criacao: new Date().toISOString(),
        data_assinatura: uploadForm.data_assinatura ? new Date(uploadForm.data_assinatura).toISOString() : null,
        criado_por: currentUser?.full_name || currentUser?.email || "Sistema",
        versao: String("1.0"),
        observacoes: uploadForm.observacoes,
        origem: uploadForm.origem || "upload_externo",
        tipo_documento_assinado: uploadForm.tipo_documento_assinado || "pdf_assinado_externo"
      });
    } finally {
      setUploading(false);
    }
  };

  const DOC_LABELS = { contrato_mestre: "Contrato Mestre", anexo_financeiro: "Anexo Financeiro", consentimento: "Consentimento do Procedimento", termo_lgpd: "Termo LGPD", uso_imagem: "Autorização de Uso de Imagem" };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {mode === "gerados" && (
          <Button onClick={() => setShowGerarForm(!showGerarForm)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs">
            Gerar Dossiê em PDF
          </Button>
        )}
        {mode === "assinados" && (
          <Button onClick={() => setShowUploadForm(!showUploadForm)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs">
            Upload Contrato Assinado
          </Button>
        )}
      </div>

      {/* Formulário Gerar PDF */}
      {showGerarForm && mode === "gerados" && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-5">
          <h3 className="text-sm font-medium text-white">Gerar Dossiê de Atendimento</h3>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#8A95AA] mb-2">Documentos a incluir</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DOC_LABELS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <Checkbox id={`doc_${k}`} checked={!!selectedDocs[k]} onCheckedChange={(val) => setSelectedDocs(p => ({ ...p, [k]: val }))} />
                  <Label htmlFor={`doc_${k}`} className="text-[#C8D0DF] text-xs cursor-pointer">{v}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["Procedimento / Protocolo *", "procedimento", "text"],
              ["Descrição do Procedimento", "descricao_procedimento", "text"],
              ["Nº de Parcelas", "num_parcelas", "text"],
              ["Forma de Pagamento *", "forma_pagamento", "text"],
              ["Data Prevista do Procedimento", "data_procedimento", "date"],
              ["Profissional Responsável *", "profissional_responsavel", "text"],
              ["CNPJ da Clínica", "cnpj_clinica", "text"],
              ["Endereço da Clínica", "endereco_clinica", "text"]
            ].map(([label, key, type]) => (
              <div key={key}>
                <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">{label}</Label>
                <Input
                  type={type}
                  value={gerarForm[key] || ""}
                  onChange={(e) => setGerarForm(p => ({ ...p, [key]: e.target.value }))}
                  className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"
                />
              </div>
            ))}
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Valor Total (R$) *</Label>
              <CurrencyInput
                value={gerarForm.valor_total}
                onChange={(v) => setGerarForm(p => ({ ...p, valor_total: v }))}
                className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"
              />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Entrada (R$)</Label>
              <CurrencyInput
                value={gerarForm.entrada}
                onChange={(v) => setGerarForm(p => ({ ...p, entrada: v }))}
                className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Observações Comerciais</Label>
              <Textarea value={gerarForm.observacoes} onChange={(e) => setGerarForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#252D3E]">
            <Button onClick={() => setShowGerarForm(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleGerarPDF} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={generating}>
              {generating ? "Gerando PDF..." : "Gerar e Baixar PDF"}
            </Button>
          </div>
        </div>
      )}

      {/* Upload Contrato Assinado */}
      {showUploadForm && mode === "assinados" && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-4">
          <h3 className="text-sm font-medium text-white">Upload de Contrato Assinado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Nome do Contrato *</Label>
              <Input value={uploadForm.nome} onChange={(e) => setUploadForm(p => ({ ...p, nome: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Tipo do Contrato</Label>
              <Select value={uploadForm.tipo} onValueChange={(v) => setUploadForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  <SelectItem value="contrato_assinado" className="text-white">Contrato Assinado</SelectItem>
                  <SelectItem value="consentimento" className="text-white">Consentimento</SelectItem>
                  <SelectItem value="termo_lgpd" className="text-white">Termo LGPD</SelectItem>
                  <SelectItem value="uso_imagem" className="text-white">Uso de Imagem</SelectItem>
                  <SelectItem value="outro" className="text-white">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Status</Label>
              <Select value={uploadForm.status} onValueChange={(v) => setUploadForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(STATUS_DOC).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Procedimento Vinculado</Label>
              <Input value={uploadForm.procedimento_vinculado} onChange={(e) => setUploadForm(p => ({ ...p, procedimento_vinculado: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Data da Assinatura</Label>
              <Input type="date" value={uploadForm.data_assinatura} onChange={(e) => setUploadForm(p => ({ ...p, data_assinatura: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Arquivo (PDF) *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Observações</Label>
              <Textarea value={uploadForm.observacoes} onChange={(e) => setUploadForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#252D3E]">
            <Button onClick={() => setShowUploadForm(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleUploadAssinado} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={!uploadForm.nome || !uploadForm.file || uploading}>
              {uploading ? "Enviando..." : "Salvar Contrato"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contratos.length === 0 && (
          <div className="text-center py-10 text-[#4A5568] text-sm">Nenhum contrato registrado</div>
        )}
        {contratos.map((doc) => (
          <div key={doc.id} className="border border-[#252D3E] rounded-md bg-[#0F1521] p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-white font-medium text-sm">{doc.nome}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#8A95AA] flex-wrap">
                  <Badge className={STATUS_DOC[doc.status]?.color || "bg-gray-500/20 text-gray-400"}>
                    {STATUS_DOC[doc.status]?.label || doc.status}
                  </Badge>
                  {doc.versao && <span>v{doc.versao}</span>}
                  {doc.data_criacao && <span>{format(parseISO(doc.data_criacao), "dd/MM/yyyy")}</span>}
                  {doc.procedimento_vinculado && <span>{doc.procedimento_vinculado}</span>}
                  {doc.criado_por && <span>por {doc.criado_por}</span>}
                  {doc.origem === "upload_externo" && (
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs ml-2">PDF Externo</Badge>
                  )}
                  {doc.status === "assinado" && doc.origem !== "upload_externo" && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs ml-2">Assinatura Interna</Badge>
                  )}
                </div>
                {doc.observacoes && <p className="text-xs text-[#4A5568] mt-1">{doc.observacoes}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" className="text-xs text-[#C5A059] h-7 border border-[#C5A059]/30 hover:bg-[#C5A059]/10">Visualizar</Button>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-[#C5A059] h-7 border border-[#C5A059]/30 hover:bg-[#C5A059]/10"
                  onClick={() => handleGerarPdfContrato(doc)}
                  disabled={gerandoPdf === doc.id}
                >
                  <FileDown className="w-3 h-3 mr-1" />
                  {gerandoPdf === doc.id ? 'Gerando...' : doc.status === 'assinado' ? 'PDF Assinado' : 'PDF'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}