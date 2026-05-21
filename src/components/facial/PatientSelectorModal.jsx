import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, User, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientSelectorModal({ open, onOpenChange, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const allPatients = await base44.entities.Patient.list();
      const filtered = allPatients.filter((p) =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
      );
      setPatients(filtered);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 bg-[#C5A059] text-[#111620]"
            >
              Buscar
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading && (
              <p className="text-sm text-gray-400 text-center py-4">Carregando pacientes...</p>
            )}
            {!loading && patients.length === 0 && searchTerm && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum paciente encontrado</p>
            )}
            {!loading && patients.length === 0 && !searchTerm && (
              <p className="text-sm text-gray-400 text-center py-4">Digite um nome ou telefone para buscar</p>
            )}
            {patients.map((patient) => (
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
                        <p className="text-sm text-gray-400">{patient.phone}</p>
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

          {/* Actions */}
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