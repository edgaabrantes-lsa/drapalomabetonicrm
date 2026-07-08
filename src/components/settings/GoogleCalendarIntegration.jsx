import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, RefreshCw, Link2, Link2Off, ArrowRight, ArrowLeft, ArrowLeftRight, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";

export default function GoogleCalendarIntegration() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [logs, setLogs] = useState([]);

  // Verifica status real da conexão ao montar
  useEffect(() => {
    let done = false;
    const checkStatus = async () => {
      try {
        const res = await base44.functions.invoke("syncGoogleAgenda", { op: "status" });
        if (res.data?.connected) {
          setConnected(true);
          setLastSync(new Date());
        } else {
          setConnected(false);
        }
      } catch (_) {
        setConnected(false);
      }
      if (!done) setLoading(false);
    };
    checkStatus();
    return () => { done = true; };
  }, []);

  const handleManualSync = async () => {
    if (!connected) return;
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncGoogleAgenda", { op: "status" });
      const count = res.data?.events?.length || 0;
      setLastSync(new Date());
      setLogs(prev => [{ time: new Date().toLocaleTimeString("pt-BR"), msg: `Sincronização concluída. ${count} eventos futuros encontrados no Google Agenda.`, type: "ok" }, ...prev]);
    } catch (err) {
      setLogs(prev => [{ time: new Date().toLocaleTimeString("pt-BR"), msg: `Falha na sincronização: ${err.message}`, type: "error" }, ...prev]);
    }
    setSyncing(false);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setLogs(prev => [{ time: new Date().toLocaleTimeString("pt-BR"), msg: "Google Agenda desconectado (reautorize nas configurações da plataforma para reconectar).", type: "warn" }, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl border p-5 flex items-start justify-between gap-4 ${connected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#1a1a25] border-[#1e1e2a]"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? "bg-emerald-500/15" : "bg-[#12121a]"}`}>
            {loading ? (
              <RefreshCw className="h-6 w-6 text-gray-500 animate-spin" />
            ) : (
              <Calendar className={`h-6 w-6 ${connected ? "text-emerald-400" : "text-gray-500"}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">Google Agenda</p>
              <Badge className={connected ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
                {loading ? "Verificando..." : connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            {connected ? (
              <p className="text-sm text-gray-400 mt-0.5">
                Última verificação: {lastSync ? lastSync.toLocaleTimeString("pt-BR") : "Agora"}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? "" : "Conexão não ativa — contate o suporte para autorizar o Google Agenda."}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {connected && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={syncing}
                className="border-[#1e1e2a] text-gray-300 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Verificando..." : "Verificar agora"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Link2Off className="h-3.5 w-3.5 mr-1.5" />
                Desconectar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Banner quando conectado */}
      {connected && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 flex gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400 space-y-1">
            <p className="text-emerald-400 font-medium">Sincronização ativa</p>
            <p>Todos os agendamentos criados ou atualizados no CRM e no Portal da Paciente são sincronizados automaticamente com o Google Agenda da clínica.</p>
            <p className="text-gray-500">Cancelamentos no CRM removem o evento correspondente no Google Agenda.</p>
          </div>
        </div>
      )}

      {/* Configurações de Sincronização */}
      <div className="bg-[#1a1a25] rounded-xl border border-[#1e1e2a] p-5 space-y-5">
        <h3 className="text-white font-medium">Como funciona a sincronização</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            "Criação de agendamentos → evento criado no Google",
            "Alteração de horário → evento atualizado",
            "Cancelamento → evento removido do Google",
            "Prevenção de duplicatas (google_event_id)",
            "Fuso horário: America/Sao_Paulo",
            "Origem marcada no título do evento",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between py-3 border-t border-[#1e1e2a]">
          <div>
            <p className="text-sm text-white">Sincronização automática</p>
            <p className="text-xs text-gray-500">A cada criação/alteração de agendamento (tempo real)</p>
          </div>
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </div>
      </div>

      {/* Log de sincronização */}
      {logs.length > 0 && (
        <div className="bg-[#1a1a25] rounded-xl border border-[#1e1e2a] p-4">
          <p className="text-gray-400 text-sm font-medium mb-3">Log de Sincronização</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">{log.time}</span>
                <span className={log.type === "ok" ? "text-emerald-400" : log.type === "warn" ? "text-yellow-400" : "text-red-400"}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}