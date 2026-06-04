import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  Download, Trash2, Eye, MessageSquare, User, Calendar,
  CheckCircle, ImageIcon, ScanFace, FileText, Shield,
  Search, Filter, RefreshCw, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PatientSelectorModal from "@/components/facial/PatientSelectorModal";

const T = {
  bg: "#111620",
  card: "#171D29",
  border: "#252D3E",
  text: "#E8EDF5",
  muted: "#8A95AA",
  gold: "#C5A059",
};

const VALID_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

const statusConfig = {
  pending:    { label: "Pendente",     color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  processing: { label: "Processando",  color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed:  { label: "Concluído",    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  failed:     { label: "Falhou",       color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

/* ══════════════════════════════════════
   GERADOR — fluxo completo de simulação
══════════════════════════════════════ */
function SimulationWizard({ patient, onBack, onSuccess }) {
  const [step, setStep] = useState("source"); // source | capture | preview | generating | result
  const [sourceType, setSourceType] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [technicalReport, setTechnicalReport] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Limpar stream ao desmontar
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (facingMode) => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setSourceType(facingMode === "user" ? "webcam" : "back_camera");
      setStep("capture");
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      stopCamera();
      processFile(new File([blob], "camera.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  const processFile = (file) => {
    setError("");
    if (!VALID_FORMATS.includes(file.type)) {
      setError("Formato não suportado. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < 300 || img.height < 300) {
        setError("Resolução muito baixa. Use uma foto mais nítida.");
        URL.revokeObjectURL(url);
        return;
      }
      setImageFile(file);
      setImagePreview(url);
      setStep("preview");
    };
    img.onerror = () => { setError("Imagem inválida."); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { setSourceType("upload"); processFile(file); }
  };

  const handleGenerate = async () => {
    if (!consentChecked) { setError("É necessário confirmar o consentimento LGPD."); return; }
    if (!imageFile || !patient?.id) { setError("Selecione a paciente e a imagem."); return; }

    setStep("generating");
    setError("");

    try {
      // Upload da imagem original
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

      // Chamar backend
      const response = await base44.functions.invoke("generateFullFaceSimulation", {
        patient_id: patient.id,
        original_image_url: file_url,
        source_type: sourceType || "upload",
        consent_lgpd: true,
      });

      const result = response.data;
      setGeneratedImage(result.generated_image_url);
      setTechnicalReport(result.technical_report || "");
      setStep("result");
      if (onSuccess) onSuccess(result);
      toast.success("Simulação gerada com sucesso!");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Falha ao gerar simulação. Tente novamente.");
      setStep("preview");
    }
  };

  const reset = () => {
    stopCamera();
    setStep("source");
    setSourceType(null);
    setImageFile(null);
    setImagePreview(null);
    setConsentChecked(false);
    setGeneratedImage(null);
    setTechnicalReport("");
    setError("");
  };

  // ── STEP: source ──
  if (step === "source") return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-sm flex items-center gap-1 hover:text-white transition-colors" style={{ color: T.muted }}>
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}25` }}>
        <User className="h-4 w-4 flex-shrink-0" style={{ color: T.gold }} />
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: T.gold }}>Paciente selecionada</p>
          <p className="text-sm font-medium" style={{ color: T.text }}>{patient.full_name}</p>
        </div>
      </div>

      <p className="text-sm" style={{ color: T.muted }}>Selecione como deseja capturar a foto:</p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Câmera Frontal", sub: "Selfie", icon: Camera, action: () => startCamera("user") },
          { label: "Câmera Traseira", sub: "Melhor qualidade", icon: Camera, action: () => startCamera("environment") },
          { label: "Webcam", sub: "Desktop", icon: Camera, action: () => startCamera("user") },
          { label: "Enviar Foto", sub: "JPG, PNG, WEBP", icon: Upload, action: () => fileInputRef.current?.click() },
        ].map((opt) => (
          <button key={opt.label} onClick={opt.action}
            className="p-5 rounded-lg border flex flex-col items-center gap-2 transition-all hover:border-[#C5A059]/50"
            style={{ background: T.bg, borderColor: T.border }}>
            <opt.icon className="h-6 w-6" style={{ color: T.gold }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: T.text }}>{opt.label}</p>
              <p className="text-xs" style={{ color: T.muted }}>{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleUpload} className="hidden" />
      {error && <ErrorMsg msg={error} />}
    </div>
  );

  // ── STEP: capture ──
  if (step === "capture") return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black" style={{ maxHeight: "60vh" }}>
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" style={{ maxHeight: "55vh" }} />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => { stopCamera(); reset(); }} style={{ borderColor: T.border, color: T.muted }}>
          <X className="h-4 w-4 mr-2" /> Cancelar
        </Button>
        <Button onClick={capturePhoto} style={{ background: T.gold, color: "#111620" }}>
          <Camera className="h-4 w-4 mr-2" /> Capturar Foto
        </Button>
      </div>
      {error && <ErrorMsg msg={error} />}
    </div>
  );

  // ── STEP: preview ──
  if (step === "preview") return (
    <div className="space-y-4">
      {/* Preview da imagem */}
      <div className="relative rounded-lg overflow-hidden" style={{ background: "#000", maxHeight: "45vh" }}>
        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" style={{ maxHeight: "44vh" }} />
        <button onClick={reset}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Checklist */}
      <div className="p-3 rounded-lg" style={{ background: `${T.gold}08`, border: `1px solid ${T.gold}25` }}>
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.gold }}>Checklist de qualidade</p>
        <div className="space-y-1">
          {["Rosto visível e bem iluminado", "Imagem nítida e sem borrão", "Apenas uma pessoa na foto", "Sem óculos escuros"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="h-3 w-3" style={{ color: T.gold }} />
              <span className="text-xs" style={{ color: T.muted }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Consentimento LGPD */}
      <div className="p-4 rounded-lg" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-start gap-3">
          <Checkbox id="lgpd" checked={consentChecked} onCheckedChange={setConsentChecked} className="mt-0.5" />
          <Label htmlFor="lgpd" className="text-xs leading-relaxed cursor-pointer" style={{ color: T.text }}>
            Autorizo o uso desta imagem exclusivamente para análise facial, simulação estética, prontuário interno e planejamento do tratamento, conforme a política de privacidade da clínica.
          </Label>
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      {/* Botões — sempre visíveis */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={reset} className="flex-1" style={{ borderColor: T.border, color: T.muted }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Trocar Foto
        </Button>
        <Button onClick={handleGenerate} disabled={!consentChecked}
          className="flex-1 disabled:opacity-40" style={{ background: T.gold, color: "#111620" }}>
          <ScanFace className="h-4 w-4 mr-2" /> Gerar Antes e Depois
        </Button>
      </div>
    </div>
  );

  // ── STEP: generating ──
  if (step === "generating") return (
    <div className="py-16 flex flex-col items-center justify-center space-y-6">
      <div className="w-14 h-14 rounded-full border-2 border-[#C5A059]/30 border-t-[#C5A059] animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest" style={{ color: T.gold }}>IA Processando</p>
        <p className="text-base font-medium" style={{ color: T.text }}>Gerando simulação facial...</p>
        <p className="text-sm" style={{ color: T.muted }}>Isso pode levar até 60 segundos</p>
      </div>
    </div>
  );

  // ── STEP: result ──
  if (step === "result") return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <img src={generatedImage} alt="Simulação Antes/Depois" className="w-full h-auto" />
      </div>

      {technicalReport && (
        <div className="p-4 rounded-lg" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.gold }}>Relatório da Simulação</p>
          <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{technicalReport}</p>
        </div>
      )}

      <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <Shield className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
          <span className="text-red-400 font-medium">Aviso Legal: </span>
          Imagem meramente ilustrativa gerada por IA para apoio visual em consulta. O resultado real depende de avaliação profissional, anatomia individual e resposta biológica da paciente.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={reset} variant="outline" style={{ borderColor: T.border, color: T.muted }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Nova Simulação
        </Button>
        <a href={generatedImage} download={`simulacao_${patient.full_name}.png`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: T.gold, color: "#111620" }}>
          <Download className="h-4 w-4" /> Baixar Imagem
        </a>
      </div>
    </div>
  );

  return null;
}

/* ══════════════════════════════
   HISTÓRICO DE SIMULAÇÕES
══════════════════════════════ */
function SimulationHistory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => base44.auth.me() });
  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ["full-face-simulations"],
    queryFn: () => base44.entities.FullFaceSimulation.list("-created_date", 500),
  });
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FullFaceSimulation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-face-simulations"] });
      setToDelete(null);
      setSelected(null);
      toast.success("Simulação excluída.");
    },
  });

  useEffect(() => { if (user?.role === "admin") setIsAdmin(true); }, [user]);

  const getPatient = (id) => patients.find(p => p.id === id);

  const filtered = simulations.filter(s => {
    if (!search) return true;
    const name = (getPatient(s.patient_id)?.full_name || s.patient_name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleDownload = async (url, name) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch { toast.error("Erro ao baixar imagem."); }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: simulations.length, color: T.text },
          { label: "Concluídas", value: simulations.filter(s => s.status === "completed").length, color: "#34d399" },
          { label: "Processando", value: simulations.filter(s => s.status === "processing").length, color: "#60a5fa" },
          { label: "Com falha", value: simulations.filter(s => s.status === "failed").length, color: "#f87171" },
        ].map(stat => (
          <Card key={stat.label} style={{ background: T.card, borderColor: T.border }}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: T.muted }}>{stat.label}</p>
              <p className="text-2xl font-light" style={{ color: stat.color }}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
        <Input placeholder="Buscar por paciente..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 text-sm" style={{ background: T.card, borderColor: T.border, color: T.text }} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: T.gold }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ color: "#374151" }} />
          <p style={{ color: T.muted }}>Nenhuma simulação encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(sim => {
            const patient = getPatient(sim.patient_id);
            const status = statusConfig[sim.status] || statusConfig.pending;
            return (
              <Card key={sim.id} onClick={() => setSelected(sim)}
                className="cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: T.card, borderColor: T.border }}>
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg bg-black/40">
                    {sim.generated_image_url ? (
                      <img src={sim.generated_image_url} alt="Simulação" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {sim.status === "processing"
                          ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.gold }} />
                          : <ImageIcon className="h-8 w-8" style={{ color: "#374151" }} />}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-medium truncate" style={{ color: T.text }}>
                      {patient?.full_name || sim.patient_name || "Paciente"}
                    </p>
                    <p className="text-xs" style={{ color: T.muted }}>
                      {sim.created_date && format(parseISO(sim.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelected(sim); }}
                        className="flex-1 h-8 text-xs" style={{ borderColor: `${T.gold}40`, color: T.gold }}>
                        <Eye className="h-3 w-3 mr-1" /> Ver
                      </Button>
                      {sim.generated_image_url && (
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleDownload(sim.generated_image_url, `simulacao_${patient?.full_name || "paciente"}.png`); }}
                          className="flex-1 h-8 text-xs" style={{ borderColor: `${T.gold}40`, color: T.gold }}>
                          <Download className="h-3 w-3 mr-1" /> Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ background: T.card, borderColor: T.border, color: T.text }}>
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Simulação — {getPatient(selected?.patient_id)?.full_name || selected?.patient_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              {selected.generated_image_url && (
                <img src={selected.generated_image_url} alt="Antes e Depois" className="w-full rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Paciente", value: getPatient(selected.patient_id)?.full_name || "—" },
                  { label: "Data", value: selected.created_date ? format(parseISO(selected.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—" },
                  { label: "Origem", value: { front_camera: "Câmera Frontal", back_camera: "Câmera Traseira", webcam: "Webcam", upload: "Upload" }[selected.source_type] || "—" },
                  { label: "Profissional", value: selected.user_email || "—" },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg" style={{ background: T.bg }}>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: T.muted }}>{item.label}</p>
                    <p className="text-sm font-medium truncate" style={{ color: T.text }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {selected.technical_report && (
                <div className="p-4 rounded-lg" style={{ background: T.bg }}>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.muted }}>Relatório</p>
                  <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{selected.technical_report}</p>
                </div>
              )}

              <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: T.muted }}>
                <span className="text-red-400 font-medium">Aviso Legal: </span>
                Imagem ilustrativa gerada por IA para apoio visual. Não representa promessa de resultado.
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: T.border }}>
                {selected.generated_image_url && (
                  <a href={selected.generated_image_url}
                    download={`simulacao_${getPatient(selected.patient_id)?.full_name || "paciente"}.png`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                    style={{ background: T.gold, color: "#111620" }}>
                    <Download className="h-4 w-4" /> Baixar Imagem
                  </a>
                )}
                {isAdmin && (
                  <Button onClick={() => setToDelete(selected)} variant="destructive" className="ml-auto">
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent style={{ background: T.card, borderColor: T.border }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>Excluir simulação?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.muted }}>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: T.muted }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete.id)}
              className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══════════════════════════════
   ERRO
══════════════════════════════ */
function ErrorMsg({ msg }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-400">{msg}</p>
    </div>
  );
}

/* ══════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════ */
export default function BeforeAfterIA() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("gerar");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientSelectorOpen, setIsPatientSelectorOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif" style={{ color: T.text }}>Gerar Antes e Depois com IA</h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>Simulação visual de resultado estético gerada por inteligência artificial</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <TabsTrigger value="gerar"
            className="data-[state=active]:text-[#C5A059]"
            style={{ "--tw-ring-color": T.gold }}>
            <ScanFace className="h-4 w-4 mr-2" /> Nova Simulação
          </TabsTrigger>
          <TabsTrigger value="historico"
            className="data-[state=active]:text-[#C5A059]">
            <FileText className="h-4 w-4 mr-2" /> Histórico de Simulações Faciais
          </TabsTrigger>
        </TabsList>

        {/* ABA GERAR */}
        <TabsContent value="gerar" className="mt-5">
          {showWizard && selectedPatient ? (
            <SimulationWizard
              patient={selectedPatient}
              onBack={() => { setShowWizard(false); }}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["full-face-simulations"] });
                setTimeout(() => setActiveTab("historico"), 2000);
              }}
            />
          ) : (
            <div className="max-w-lg mx-auto space-y-6">
              <Card style={{ background: T.card, borderColor: T.border }}>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${T.gold}15` }}>
                      <ScanFace className="h-5 w-5" style={{ color: T.gold }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: T.text }}>Simulação Facial com IA</p>
                      <p className="text-xs" style={{ color: T.muted }}>Resultado antes e depois realista</p>
                    </div>
                  </div>

                  {/* Selecionar paciente */}
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.muted }}>Paciente</p>
                    {selectedPatient ? (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.gold}30` }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" style={{ color: T.gold }} />
                          <span className="text-sm font-medium" style={{ color: T.text }}>{selectedPatient.full_name}</span>
                        </div>
                        <button className="text-xs hover:underline" style={{ color: T.muted }} onClick={() => setSelectedPatient(null)}>
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsPatientSelectorOpen(true)} variant="outline" className="w-full"
                        style={{ borderColor: T.border, color: T.muted }}>
                        <User className="h-4 w-4 mr-2" /> Selecionar Paciente
                      </Button>
                    )}
                  </div>

                  {/* O que inclui */}
                  <div className="space-y-2">
                    {[
                      "Simulação visual de harmonização facial",
                      "Comparação lado a lado (antes / depois)",
                      "Geração por IA com foco em naturalidade",
                      "Download da imagem",
                      "Histórico salvo automaticamente",
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: T.gold }} />
                        <span className="text-xs" style={{ color: T.muted }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg" style={{ background: `${T.gold}08`, border: `1px solid ${T.gold}20` }}>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: T.gold }} />
                      <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                        Imagem meramente ilustrativa. Não representa promessa de resultado clínico.
                        Consentimento LGPD obrigatório antes da geração.
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => { if (!selectedPatient) { setIsPatientSelectorOpen(true); } else { setShowWizard(true); } }}
                    className="w-full h-12 text-sm font-semibold" style={{ background: T.gold, color: "#111620" }}>
                    <ScanFace className="h-4 w-4 mr-2" />
                    {selectedPatient ? "Iniciar Simulação" : "Selecionar Paciente para Iniciar"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ABA HISTÓRICO */}
        <TabsContent value="historico" className="mt-5">
          <div className="mb-2">
            <h2 className="text-lg font-medium uppercase tracking-widest" style={{ color: T.text }}>
              Histórico de Simulações Faciais
            </h2>
            <p className="text-xs mt-1" style={{ color: T.muted }}>Todas as simulações geradas por IA</p>
          </div>
          <SimulationHistory />
        </TabsContent>
      </Tabs>

      {/* Patient Selector */}
      <PatientSelectorModal
        open={isPatientSelectorOpen}
        onOpenChange={setIsPatientSelectorOpen}
        onSelect={(patient) => {
          setSelectedPatient(patient);
          setIsPatientSelectorOpen(false);
          setShowWizard(true);
        }}
      />
    </div>
  );
}