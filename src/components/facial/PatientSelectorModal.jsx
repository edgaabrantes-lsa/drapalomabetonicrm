import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, User, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientSelectorModal({ open, onOpenChange, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Carrega todos os pacientes automaticamente quando o modal abre
  useEffect(() => {
    if (!open) return;
    setSelectedPatient(null);
    setSearchTerm("");
    if (loaded) return;
    setLoading(true);
    base44.entities.Patient.list("-created_date", 1000)
      .then((data) => {
        setAllPatients(data || []);
        setLoaded(true);
      })
      .catch((err) => console.error("Erro ao carregar pacientes:", err))
      .finally(() => setLoading(false));
  }, [open, loaded]);

  // Filtra a lista localmente conforme a digitação (busca instantânea)
  const filtered = searchTerm.trim()
    ? allPatients.filter((p) => {
        const term = searchTerm.toLowerCase();
        return (
          p.full_name?.toLowerCase().includes(term) ||
          p.phone?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term)
        );
      })
    : allPatients;

  const handleSelect = () => {
    if (selectedPatient) {
      onSelect(selectedPatient);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            Selecionar Paciente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca instantânea */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
            />
          </div>

          {/* Resultados */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#C5A059]" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
              </p>
            )}
            {!loading && filtered.map((patient) => (
              <Card
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`cursor-pointer transition-all ${
                  selectedPatient?.id === patient.id
                    ? "bg-[#c9a55c]/10 border-[#c9a55c]/50"
                    : "bg-[#1a1a25] border-[#1e1e2a] hover:border-[#c9a55c]/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#c9a55c]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{patient.full_name}</h4>
                        {patient.phone && (
                          <p className="text-sm text-gray-400">{patient.phone}</p>
                        )}
                        {patient.email && (
                          <p className="text-xs text-gray-500">{patient.email}</p>
                        )}
                      </div>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <CheckCircle className="h-5 w-5 text-[#c9a55c]" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e2a]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#1e1e2a] text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedPatient}
              className="bg-[#C5A059] text-[#111620]"
            >
              Selecionar Paciente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}