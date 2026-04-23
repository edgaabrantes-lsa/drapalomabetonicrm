import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle,
  X, Download, Loader2, ChevronRight, Info, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PATIENT_FIELDS = [
  { key: "full_name", label: "Nome Completo", required: true },
  { key: "phone", label: "Telefone", required: true },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "birth_date", label: "Data de Nascimento" },
  { key: "document_number", label: "CPF / Documento" },
  { key: "gender", label: "Gênero" },
  { key: "address.street", label: "Endereço (Rua)" },
  { key: "address.city", label: "Cidade" },
  { key: "address.state", label: "Estado" },
  { key: "address.zip_code", label: "CEP" },
  { key: "source", label: "Origem" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Observações" },
  { key: "tags", label: "Tags" },
  { key: "_ignore", label: "Ignorar coluna" },
];

const STEP_UPLOAD = "upload";
const STEP_MAPPING = "mapping";
const STEP_PREVIEW = "preview";
const STEP_DONE = "done";

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g, "").trim());
  const rows = lines.slice(1).map(line =>
    line.split(sep).map(cell => cell.replace(/^"|"$/g, "").trim())
  );
  return { headers, rows };
}

function autoMapColumns(headers) {
  const mapping = {};
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  headers.forEach((h, i) => {
    const n = normalize(h);
    if (n.includes("nome") || n.includes("name")) mapping[i] = "full_name";
    else if (n.includes("whatsapp") || n.includes("wpp")) mapping[i] = "whatsapp";
    else if (n.includes("tel") || n.includes("fone") || n.includes("phone")) mapping[i] = "phone";
    else if (n.includes("email") || n.includes("mail")) mapping[i] = "email";
    else if (n.includes("nasc") || n.includes("birth") || n.includes("datan")) mapping[i] = "birth_date";
    else if (n.includes("cpf") || n.includes("doc")) mapping[i] = "document_number";
    else if (n.includes("genero") || n.includes("sexo") || n.includes("gender")) mapping[i] = "gender";
    else if (n.includes("cidade") || n.includes("city")) mapping[i] = "address.city";
    else if (n.includes("estado") || n.includes("state") || n.includes("uf")) mapping[i] = "address.state";
    else if (n.includes("cep") || n.includes("zip")) mapping[i] = "address.zip_code";
    else if (n.includes("rua") || n.includes("end") || n.includes("street")) mapping[i] = "address.street";
    else if (n.includes("orig") || n.includes("source") || n.includes("canal")) mapping[i] = "source";
    else if (n.includes("status")) mapping[i] = "status";
    else if (n.includes("obs") || n.includes("note")) mapping[i] = "notes";
    else if (n.includes("tag")) mapping[i] = "tags";
    else mapping[i] = "_ignore";
  });
  return mapping;
}

function buildPatientFromRow(row, headers, mapping) {
  const patient = { address: {} };
  headers.forEach((_, i) => {
    const field = mapping[i];
    if (!field || field === "_ignore") return;
    const val = row[i] || "";
    if (field.startsWith("address.")) {
      const subKey = field.split(".")[1];
      patient.address[subKey] = val;
    } else if (field === "tags") {
      patient.tags = val ? val.split(/[,;|]/).map(t => t.trim()).filter(Boolean) : [];
    } else if (field === "birth_date" && val) {
      const parts = val.split(/[/\-\.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) patient.birth_date = val;
        else patient.birth_date = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
      } else {
        patient.birth_date = val;
      }
    } else {
      patient[field] = val;
    }
  });
  if (!patient.status) patient.status = "active";
  return patient;
}

function detectDuplicates(newPatients, existingPatients) {
  return newPatients.map(np => {
    const dup = existingPatients.find(ep =>
      (np.phone && ep.phone && np.phone.replace(/\D/g, "") === ep.phone.replace(/\D/g, "")) ||
      (np.email && ep.email && np.email.toLowerCase() === ep.email.toLowerCase()) ||
      (np.document_number && ep.document_number && np.document_number.replace(/\D/g, "") === ep.document_number.replace(/\D/g, ""))
    );
    return { ...np, _isDuplicate: !!dup, _existingId: dup?.id };
  });
}

export default function PatientImport({ existingPatients = [], onDone }) {
  const [step, setStep] = useState(STEP_UPLOAD);
  const [parsed, setParsed] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({});
  const [importMode, setImportMode] = useState("new_only"); // new_only | all | update_existing
  const [preview, setPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    setFileName(file.name);
    setError("");

    if (!["csv", "xls", "xlsx"].includes(ext)) {
      setError("Formato não suportado. Use .csv, .xls ou .xlsx");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    if (ext === "csv") {
      const text = await file.text();
      const data = parseCSV(text);
      if (data.headers.length === 0) {
        setError("Arquivo CSV vazio ou inválido.");
        return;
      }
      setParsed(data);
      setMapping(autoMapColumns(data.headers));
      setStep(STEP_MAPPING);
    } else {
      // xlsx/xls: use AI extraction
      setStep(STEP_MAPPING);
      setIsImporting(true);
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: "object",
          properties: {
            headers: { type: "array", items: { type: "string" } },
            rows: {
              type: "array",
              items: { type: "array", items: { type: "string" } }
            }
          }
        }
      });
      setIsImporting(false);
      if (extracted.status === "success" && extracted.output?.headers) {
        setParsed(extracted.output);
        setMapping(autoMapColumns(extracted.output.headers));
      } else {
        setError("Não foi possível ler o arquivo. Tente exportar como CSV.");
        setStep(STEP_UPLOAD);
      }
    }
  };

  const buildPreview = () => {
    if (!parsed) return;
    const patients = parsed.rows
      .filter(row => row.some(cell => cell.trim()))
      .map(row => buildPatientFromRow(row, parsed.headers, mapping));
    const withDups = detectDuplicates(patients, existingPatients);
    setPreview(withDups);
    setStep(STEP_PREVIEW);
  };

  const doImport = async () => {
    setIsImporting(true);
    let toImport = preview;
    if (importMode === "new_only") toImport = preview.filter(p => !p._isDuplicate);
    else if (importMode === "update_existing") toImport = preview;

    let created = 0, updated = 0, failed = 0, failedRows = [];

    for (const patient of toImport) {
      const { _isDuplicate, _existingId, ...data } = patient;
      if (!data.full_name || !data.phone) { failed++; failedRows.push(data.full_name || "sem nome"); continue; }
      if (_isDuplicate && importMode === "update_existing" && _existingId) {
        await base44.entities.Patient.update(_existingId, data);
        updated++;
      } else if (!_isDuplicate) {
        await base44.entities.Patient.create(data);
        created++;
      }
    }

    setIsImporting(false);
    setResult({ created, updated, failed, failedRows, total: toImport.length });
    setStep(STEP_DONE);
    onDone?.();
  };

  const reset = () => {
    setStep(STEP_UPLOAD);
    setParsed(null);
    setMapping({});
    setPreview([]);
    setResult(null);
    setError("");
    setFileName("");
  };

  // ── UPLOAD ──────────────────────────────────────
  if (step === STEP_UPLOAD) return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-[#c9a55c]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[#c9a55c]/60 transition-colors bg-[#c9a55c]/5"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      >
        <FileSpreadsheet className="h-12 w-12 text-[#c9a55c]/60 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Arraste a planilha ou clique para selecionar</p>
        <p className="text-gray-500 text-sm">Aceita .csv, .xlsx, .xls — Google Sheets, Excel, Numbers</p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      </div>
      {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</p>}
      <div className="bg-[#1a1a25] rounded-lg p-4 text-sm text-gray-400 space-y-1">
        <p className="flex items-center gap-2 text-[#c9a55c] font-medium"><Info className="h-4 w-4" />Dica de exportação</p>
        <p>• Google Sheets → Arquivo → Baixar → CSV</p>
        <p>• Apple Numbers → Arquivo → Exportar → CSV</p>
        <p>• Excel → Salvar como → CSV (UTF-8)</p>
      </div>
    </div>
  );

  // ── LOADING ──────────────────────────────────────
  if (step === STEP_MAPPING && isImporting) return (
    <div className="text-center py-12">
      <Loader2 className="h-10 w-10 text-[#c9a55c] animate-spin mx-auto mb-3" />
      <p className="text-gray-300">Lendo planilha...</p>
    </div>
  );

  // ── MAPPING ──────────────────────────────────────
  if (step === STEP_MAPPING && parsed) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{fileName}</p>
          <p className="text-sm text-gray-400">{parsed.rows.length} linhas encontradas</p>
        </div>
        <Button size="sm" variant="ghost" onClick={reset} className="text-gray-500"><X className="h-4 w-4" /></Button>
      </div>

      <div className="bg-[#1a1a25] rounded-lg p-3 text-sm text-gray-400">
        <p className="text-[#c9a55c] mb-2 font-medium">Mapeie as colunas da planilha para os campos do sistema:</p>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {parsed.headers.map((header, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-40 truncate text-gray-300 text-xs">{header}</span>
              <ChevronRight className="h-3 w-3 text-gray-600 flex-shrink-0" />
              <Select value={mapping[i] || "_ignore"} onValueChange={v => setMapping(prev => ({ ...prev, [i]: v }))}>
                <SelectTrigger className="flex-1 h-8 bg-[#12121a] border-[#1e1e2a] text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-48">
                  {PATIENT_FIELDS.map(f => (
                    <SelectItem key={f.key} value={f.key} className="text-white text-xs">
                      {f.label}{f.required ? " *" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={reset} className="text-gray-400">Voltar</Button>
        <Button onClick={buildPreview} className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          Pré-visualizar Dados <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  // ── PREVIEW ──────────────────────────────────────
  if (step === STEP_PREVIEW) {
    const newOnes = preview.filter(p => !p._isDuplicate);
    const dups = preview.filter(p => p._isDuplicate);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a25] rounded-lg p-3 text-center">
            <p className="text-2xl font-light text-white">{preview.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-[#1a1a25] rounded-lg p-3 text-center">
            <p className="text-2xl font-light text-emerald-400">{newOnes.length}</p>
            <p className="text-xs text-gray-500">Novos</p>
          </div>
          <div className="bg-[#1a1a25] rounded-lg p-3 text-center">
            <p className="text-2xl font-light text-yellow-400">{dups.length}</p>
            <p className="text-xs text-gray-500">Duplicados</p>
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Modo de importação</Label>
          <Select value={importMode} onValueChange={setImportMode}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              <SelectItem value="new_only" className="text-white">Importar apenas novos ({newOnes.length})</SelectItem>
              <SelectItem value="all" className="text-white">Importar todos ({preview.length})</SelectItem>
              <SelectItem value="update_existing" className="text-white">Novos + atualizar duplicados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1">
          {preview.slice(0, 50).map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded bg-[#1a1a25] text-sm">
              <span className="text-white">{p.full_name || <span className="text-red-400">sem nome</span>}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">{p.phone}</span>
                {p._isDuplicate
                  ? <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Duplicado</Badge>
                  : <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Novo</Badge>
                }
              </div>
            </div>
          ))}
          {preview.length > 50 && <p className="text-center text-gray-500 text-xs py-2">+{preview.length - 50} mais...</p>}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(STEP_MAPPING)} className="text-gray-400">Voltar</Button>
          <Button onClick={doImport} className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black" disabled={isImporting}>
            {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirmar Importação
          </Button>
        </div>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────
  if (step === STEP_DONE && result) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <CheckCircle className="h-8 w-8 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-white font-medium">Importação concluída!</p>
          <p className="text-sm text-gray-400">{result.created} criados · {result.updated} atualizados · {result.failed} com erro</p>
        </div>
      </div>

      {result.failedRows.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm font-medium mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Registros com erro:</p>
          {result.failedRows.map((r, i) => <p key={i} className="text-xs text-gray-400">• {r}</p>)}
        </div>
      )}

      <Button onClick={reset} variant="outline" className="w-full border-[#c9a55c]/30 text-[#c9a55c]">
        <RefreshCw className="h-4 w-4 mr-2" /> Importar outro arquivo
      </Button>
    </div>
  );

  return null;
}