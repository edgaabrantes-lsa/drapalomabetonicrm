import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Camera, Upload, X, RotateCcw, Check, AlertCircle } from "lucide-react";

const CATEGORIAS = {
  antes: { label: "Antes", color: "bg-blue-500/20 text-blue-400" },
  depois: { label: "Depois", color: "bg-green-500/20 text-green-400" },
  analise_facial: { label: "Análise Facial", color: "bg-purple-500/20 text-purple-400" },
  simulacao_ia: { label: "Simulação IA", color: "bg-indigo-500/20 text-indigo-400" },
  prontuario_facial: { label: "Prontuário Facial", color: "bg-teal-500/20 text-teal-400" },
  evolucao: { label: "Evolução", color: "bg-yellow-500/20 text-yellow-400" },
  intercorrencia: { label: "Intercorrência", color: "bg-red-500/20 text-red-400" },
  documento_clinico: { label: "Documento Clínico", color: "bg-orange-500/20 text-orange-400" },
  outros: { label: "Outros", color: "bg-gray-500/20 text-gray-400" }
};

export default function DossieImagensArquivos({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("user");
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [form, setForm] = useState({
    categoria: "outros",
    titulo: "",
    descricao: "",
    procedimento_vinculado: "",
    file: null
  });

  // Buscar imagens do DossieImagem + simulações FullFace
  const { data: imagensDossie = [] } = useQuery({
    queryKey: ["dossie-imagens", patient.id],
    queryFn: () => base44.entities.DossieImagem.filter({ patient_id: patient.id }, "-data_upload", 200)
  });

  const { data: simulacoes = [] } = useQuery({
    queryKey: ["fullface-sims", patient.id],
    queryFn: () => base44.entities.FullFaceSimulation.filter({ patient_id: patient.id }, "-created_date", 50)
  });

  // Mesclar simulações como imagens da categoria simulacao_ia
  // Travas estruturais: só simulações concluídas, aprovadas, com imagem gerada e
  // vinculadas ao MESMO patient_id do dossiê aberto (defesa contra mistura de pacientes).
  const simComoImagens = simulacoes
    .filter(s => s.generated_image_url && s.status === "completed" && s.aprovada_dossie !== false && s.patient_id === patient.id)
    .map(s => ({
      id: `sim-${s.id}`,
      patient_id: s.patient_id,
      simulation_id: s.id,
      file_url: s.generated_image_url,
      file_name: `Simulação IA - ${s.created_date?.substring(0,10) || ""}`,
      file_type: "image/jpeg",
      categoria: "simulacao_ia",
      titulo: `Simulação IA — ${s.protocol_type || "Full Face"}`,
      descricao: s.technical_report || "",
      data_upload: s.created_date,
      uploaded_by: s.user_email || "IA",
      origem: "full_face_simulation",
      source_type: s.source_type,
    }));

  // Defesa em profundidade: garante vínculo correto ao paciente + remove duplicatas por URL
  const vinculadas = [
    ...imagensDossie.filter(i => i.patient_id === patient.id),
    ...simComoImagens,
  ];
  const vistos = new Set();
  const imagens = vinculadas.filter((img) => {
    const key = img.file_url;
    if (!key || vistos.has(key)) return false; // impede duplicidade de foto no dossiê
    vistos.add(key);
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DossieImagem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-imagens", patient.id] });
      setShowUpload(false);
      setForm({ categoria: "outros", titulo: "", descricao: "", procedimento_vinculado: "", file: null });
    }
  });

  const [dupWarn, setDupWarn] = useState("");

  const handleUpload = async () => {
    if (!form.file) return;
    setUploading(true);
    setDupWarn("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: form.file });
      // Trava de duplicidade: evita cadastrar a mesma foto duas vezes para o paciente
      const existentes = imagensDossie.filter((i) => i.file_url === file_url);
      if (existentes.length > 0) {
        setDupWarn("Esta imagem já existe no dossiê desta paciente. Upload cancelado para evitar duplicidade.");
        return;
      }
      await createMutation.mutateAsync({
        patient_id: patient.id,
        patient_name: patient.full_name,
        categoria: form.categoria,
        titulo: form.titulo || form.file.name,
        descricao: form.descricao,
        procedimento_vinculado: form.procedimento_vinculado,
        file_url,
        file_name: form.file.name,
        file_type: form.file.type,
        data_upload: new Date().toISOString(),
        uploaded_by: currentUser?.full_name || currentUser?.email || "Sistema"
      });
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError("Câmera não disponível: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const flipCamera = async () => {
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(newFacing);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError("Erro ao trocar câmera: " + err.message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.92));
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;
    setUploading(true);
    setDupWarn("");
    try {
      const blob = await fetch(capturedPhoto).then(r => r.blob());
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const existentes = imagensDossie.filter((i) => i.file_url === file_url);
      if (existentes.length > 0) {
        setDupWarn("Esta foto já existe no dossiê desta paciente. Captura descartada para evitar duplicidade.");
        return;
      }
      await createMutation.mutateAsync({
        patient_id: patient.id,
        patient_name: patient.full_name,
        categoria: form.categoria || "outros",
        titulo: `Foto — ${new Date().toLocaleDateString("pt-BR")}`,
        descricao: "",
        procedimento_vinculado: "",
        file_url,
        file_name: file.name,
        file_type: "image/jpeg",
        data_upload: new Date().toISOString(),
        uploaded_by: currentUser?.full_name || currentUser?.email || "Sistema"
      });
      stopCamera();
    } finally {
      setUploading(false);
    }
  };

  const filtradas = filtroCategoria === "all"
    ? imagens
    : imagens.filter(i => i.categoria === filtroCategoria);

  const isPdf = (img) => img.file_type === "application/pdf" || img.file_name?.endsWith(".pdf");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48 bg-[#1A2030] border-[#252D3E] text-white text-sm">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent className="bg-[#171D29] border-[#252D3E]">
            <SelectItem value="all" className="text-white">Todas as categorias</SelectItem>
            {Object.entries(CATEGORIAS).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button onClick={startCamera} size="sm" variant="outline" className="border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 text-xs gap-1">
            <Camera className="h-3 w-3" /> Tirar Foto
          </Button>
          <Button onClick={() => setShowUpload(!showUpload)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs gap-1">
            <Upload className="h-3 w-3" /> Upload
          </Button>
        </div>
      </div>

      {/* Modal Câmera */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F1521] border border-[#252D3E] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#252D3E]">
              <p className="text-white text-sm font-medium">Tirar Foto — {patient.full_name}</p>
              <button onClick={stopCamera} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {cameraError ? (
              <div className="p-6 text-center text-red-400 text-sm">{cameraError}</div>
            ) : capturedPhoto ? (
              <div>
                <img src={capturedPhoto} alt="Captura" className="w-full object-contain max-h-72" />
                <div className="p-3 flex gap-2 justify-end">
                  <Button onClick={() => setCapturedPhoto(null)} variant="ghost" size="sm" className="text-gray-400 gap-1">
                    <RotateCcw className="h-3 w-3" /> Refazer
                  </Button>
                  <Button onClick={savePhoto} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black gap-1" disabled={uploading}>
                    <Check className="h-3 w-3" /> {uploading ? "Salvando..." : "Salvar Foto"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
                <div className="p-3 flex gap-2 justify-center">
                  <Button onClick={flipCamera} variant="outline" size="sm" className="border-[#252D3E] text-gray-400 text-xs">
                    Virar Câmera
                  </Button>
                  <Button onClick={capturePhoto} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black gap-1">
                    <Camera className="h-4 w-4" /> Capturar
                  </Button>
                </div>
                <div className="px-4 pb-3">
                  <Label className="text-[#8A95AA] text-xs">Categoria da foto</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm(p => ({ ...p, categoria: v }))}>
                    <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#171D29] border-[#252D3E]">
                      {Object.entries(CATEGORIAS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showUpload && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-4">
          <h3 className="text-sm font-medium text-white">Novo Arquivo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm(p => ({ ...p, categoria: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(CATEGORIAS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Procedimento Vinculado</Label>
              <Input value={form.procedimento_vinculado} onChange={(e) => setForm(p => ({ ...p, procedimento_vinculado: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Arquivo (JPG, PNG, WEBP, PDF)</Label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setForm(p => ({ ...p, file: e.target.files[0] }))}
                className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#252D3E] pt-3">
            <Button onClick={() => setShowUpload(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleUpload} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={!form.file || uploading}>
              {uploading ? "Enviando..." : "Fazer Upload"}
            </Button>
          </div>
        </div>
      )}

      {dupWarn && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <AlertCircle className="h-4 w-4" /> {dupWarn}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtradas.map((img) => (
          <div key={img.id} className="border border-[#252D3E] rounded-md overflow-hidden bg-[#0F1521] group">
            {isPdf(img) ? (
              <div className="aspect-square flex items-center justify-center bg-[#1A2030]">
                <div className="text-center">
                  <div className="text-2xl text-[#C5A059] mb-1">PDF</div>
                  <p className="text-xs text-[#8A95AA] px-2 truncate">{img.file_name}</p>
                </div>
              </div>
            ) : (
              <div className="aspect-square overflow-hidden">
                <img
                  src={img.file_url}
                  alt={img.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => setPreviewImage(img)}
                />
              </div>
            )}
            <div className="p-2">
              <Badge className={`text-xs ${CATEGORIAS[img.categoria]?.color}`}>{CATEGORIAS[img.categoria]?.label}</Badge>
              {img.titulo && <p className="text-xs text-white mt-1 truncate">{img.titulo}</p>}
              {img.data_upload && (
                <p className="text-xs text-[#4A5568] mt-0.5">
                  {format(parseISO(img.data_upload), "dd/MM/yyyy")}
                </p>
              )}
              <div className="flex gap-1 mt-2">
                {!isPdf(img) && (
                  <Button size="sm" variant="ghost" onClick={() => setPreviewImage(img)} className="text-xs text-[#C5A059] h-6 px-2">Ver</Button>
                )}
                <a href={img.file_url} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost" className="text-xs text-[#8A95AA] h-6 px-2">Baixar</Button>
                </a>
              </div>
            </div>
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="col-span-full text-center py-10 text-[#4A5568] text-sm">
            Nenhum arquivo nesta categoria
          </div>
        )}
      </div>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="bg-[#0D1119] border-[#252D3E] max-w-3xl p-2">
          <DialogHeader className="px-4 pt-3">
            <DialogTitle className="text-white text-sm">{previewImage?.titulo || previewImage?.file_name}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative">
              <img src={previewImage.file_url} alt={previewImage.titulo} className="w-full max-h-[70vh] object-contain rounded" />
              <div className="p-3 flex items-center justify-between">
                <div className="text-xs text-[#8A95AA]">
                  {previewImage.descricao && <p>{previewImage.descricao}</p>}
                  {previewImage.uploaded_by && <p>Upload por: {previewImage.uploaded_by}</p>}
                </div>
                <a href={previewImage.file_url} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="border-[#C5A059]/40 text-[#C5A059] text-xs">Baixar</Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}