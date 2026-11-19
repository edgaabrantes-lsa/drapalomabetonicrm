import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { T } from "@/lib/agendaTokens";

const HORAS = Array.from({ length: 17 }, (_, i) => `${String(6 + i).padStart(2, "0")}:00`);

const inputStyle = {
  background: T.pearl,
  border: `1px solid ${T.subtle}`,
  borderRadius: 2,
  color: T.onyx,
  fontFamily: "Inter",
  fontSize: 13,
  padding: "8px 12px",
  width: "100%",
};

const labelStyle = {
  fontFamily: "Inter",
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: T.charcoal,
  display: "block",
  marginBottom: 6,
};

const DateField = ({ label, value, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <CalendarIcon size={14} color={T.charcoal} />
          {format(value, "dd/MM/yyyy")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={(d) => d && onChange(d)} locale={ptBR} />
      </PopoverContent>
    </Popover>
  </div>
);

export default function BloqueioForm({ professionals = [], onSave, onCancel }) {
  const [professionalId, setProfessionalId] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFim, setHoraFim] = useState("16:00");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dataFim < dataInicio) {
      setErro("A data final não pode ser anterior à data inicial.");
      return;
    }
    if (!diaInteiro && horaFim <= horaInicio) {
      setErro("O horário final deve ser depois do horário inicial.");
      return;
    }
    const prof = professionals.find((p) => p.id === professionalId);
    onSave({
      professional_id: professionalId,
      professional_name: prof?.name || "Toda a clínica",
      data_inicio: format(dataInicio, "yyyy-MM-dd"),
      data_fim: format(dataFim, "yyyy-MM-dd"),
      dia_inteiro: diaInteiro,
      hora_inicio: diaInteiro ? "" : horaInicio,
      hora_fim: diaInteiro ? "" : horaFim,
      motivo: motivo.trim(),
      ativo: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label style={labelStyle}>Profissional</label>
        <Select value={professionalId || "todos"} onValueChange={(v) => setProfessionalId(v === "todos" ? "" : v)}>
          <SelectTrigger style={{ ...inputStyle, height: 38 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda a clínica</SelectItem>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DateField label="Data inicial *" value={dataInicio} onChange={setDataInicio} />
        <DateField label="Data final *" value={dataFim} onChange={setDataFim} />
      </div>

      <button
        type="button"
        onClick={() => setDiaInteiro((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 2,
          cursor: "pointer",
          border: `1px solid ${diaInteiro ? T.gold : T.subtle}`,
          background: diaInteiro ? "rgba(197,160,89,0.08)" : T.pearl,
          fontFamily: "Inter",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: diaInteiro ? T.gold : T.charcoal,
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 2,
            border: `1px solid ${diaInteiro ? T.gold : T.charcoal}`,
            background: diaInteiro ? T.gold : "transparent",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        Bloquear o dia inteiro
      </button>

      {!diaInteiro && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Das</label>
            <Select value={horaInicio} onValueChange={setHoraInicio}>
              <SelectTrigger style={{ ...inputStyle, height: 38 }}><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-52">
                {HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label style={labelStyle}>Às</label>
            <Select value={horaFim} onValueChange={setHoraFim}>
              <SelectTrigger style={{ ...inputStyle, height: 38 }}><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-52">
                {HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Motivo</label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex.: Gestação — sem atendimento"
          style={inputStyle}
        />
      </div>

      {erro && (
        <p style={{ fontFamily: "Inter", fontSize: 12, color: "#E53935", margin: 0 }}>{erro}</p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: `1px solid ${T.subtle}`,
            borderRadius: 2,
            fontFamily: "Inter",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.charcoal,
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            background: T.gold,
            color: "#000",
            border: "none",
            borderRadius: 2,
            fontFamily: "Inter",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Salvar Bloqueio
        </button>
      </div>
    </form>
  );
}