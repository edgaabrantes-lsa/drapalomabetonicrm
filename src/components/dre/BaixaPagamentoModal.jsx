import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

/** Confirmação de baixa (pagamento/recebimento) com data editável. */
export default function BaixaPagamentoModal({ open, lancamento, isEntrada, onConfirm, onClose, salvando }) {
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));

  const confirmar = () => {
    if (!data) return;
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="text-white max-w-sm" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>
            {isEntrada ? "Registrar recebimento" : "Registrar pagamento"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p style={{ fontSize: 12, color: "#B0B0B0" }}>{lancamento?.descricao}</p>
          <div>
            <label style={{ fontSize: 12, color: "#B0B0B0" }}>Data efetiva</label>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="bg-[#121212] border-[#2B2B2B] text-white mt-1"
              style={{ height: 36 }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
            <Button onClick={confirmar} disabled={salvando} className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black">
              {salvando ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}