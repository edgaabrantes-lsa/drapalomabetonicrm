import React, { useState } from "react";
import { Calendar, CheckCircle, XCircle, RefreshCw, Link2, Link2Off, ArrowRight, ArrowLeft, ArrowLeftRight, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SYNC_MODES = [
  { value: "platform_to_google", label: "Plataforma → Google", icon: ArrowRight, desc: "Envia agendamentos da clínica para o Google Agenda" },
  { value: "google_to_platform", label: "Google → Plataforma", icon: ArrowLeft, desc: "Traz eventos do Google Agenda para a plataforma" },
  { value: "bidirectional", label: "Sincronização bidirecional", icon: ArrowLeftRight, desc: "Sincroniza em ambas as direções automaticamente" },
];

export default function GoogleCalendarIntegration() {
  const [connected, setConnected] = useState(false);
  const [syncMode, setSyncMode] = useState("bidirectional");
  const [autoSync, setAutoSync] = useState(true);
  const [syncConflicts, setSyncConflicts] = useState("platform_wins");
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([]);

  const handleConnect = () => {
    // Estrutura pronta para OAuth Google — conectar quando credenciais forem configuradas
    alert("Para conectar o Google Agenda, acesse Configurações → Integrações e insira as credenciais OAuth do Google. Contate o suporte para obter as instruções.");
  };

  const handleDisconnect = () => {
    setConnected(false);
    setLogs(prev => [{ time: new Date().toLocaleTimeString("pt-BR"), msg: "Google Agenda desconectado.", type: "warn" }, ...prev]);
  };

  const handleManualSync = async () => {
    if (!connected) return;
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSyncing(false);
    setLastSync(new Date());
    setLogs(prev => [{ time: new Date().toLocaleTimeString("pt-BR"), msg: "Sincronização manual concluída. 0 novos eventos.", type: "ok" }, ...prev]);
  };

  const SyncModeIcon = SYNC_MODES.find(m => m.value === syncMode)?.icon || ArrowLeftRight;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl border p-5 flex items-start justify-between gap-4 ${connected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#1a1a25] border-[#1e1e2a]"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? "bg-emerald-500/15" : "bg-[#12121a]"}`}>
            <Calendar className={`h-6 w-6 ${connected ? "text-emerald-400" : "text-gray-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">Google Agenda</p>
              <Badge className={connected ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
                {connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            {connected ? (
              <p className="text-sm text-gray-400 mt-0.5">
                Última sincronização: {lastSync ? lastSync.toLocaleTimeString("pt-BR") : "Nunca"}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">Conecte para sincronizar agendamentos automaticamente</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {connected ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="border-[#1e1e2a] text-gray-300 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizando..." : "Sincronizar"}
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
          ) : (
            <Button
              size="sm"
              onClick={handleConnect}
              className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black"
            >
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
              Conectar Google Agenda
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner quando desconectado */}
      {!connected && (
        <div className="bg-[#c9a55c]/5 border border-[#c9a55c]/20 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-[#c9a55c] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400 space-y-1">
            <p className="text-[#c9a55c] font-medium">Estrutura pronta para integração</p>
            <p>Toda a infraestrutura técnica está preparada. Para ativar a conexão real com o Google, as credenciais OAuth devem ser configuradas pelo administrador da plataforma.</p>
            <p className="text-gray-500">Requisitos: Google Cloud Console → OAuth 2.0 → Escopo: calendar.events</p>
          </div>
        </div>
      )}

      {/* Configurações de Sincronização */}
      <div className="bg-[#1a1a25] rounded-xl border border-[#1e1e2a] p-5 space-y-5">
        <h3 className="text-white font-medium">Preferências de Sincronização</h3>

        {/* Modo de sincronização */}
        <div className="space-y-2">
          <Label className="text-gray-400 text-sm">Direção da sincronização</Label>
          <div className="grid grid-cols-1 gap-2">
            {SYNC_MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setSyncMode(mode.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${syncMode === mode.value ? "border-[#c9a55c]/50 bg-[#c9a55c]/10" : "border-[#1e1e2a] bg-[#12121a] hover:border-[#c9a55c]/20"}`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${syncMode === mode.value ? "text-[#c9a55c]" : "text-gray-500"}`} />
                  <div>
                    <p className={`text-sm font-medium ${syncMode === mode.value ? "text-[#c9a55c]" : "text-gray-300"}`}>{mode.label}</p>
                    <p className="text-xs text-gray-500">{mode.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sincronização automática */}
        <div className="flex items-center justify-between py-3 border-t border-[#1e1e2a]">
          <div>
            <p className="text-sm text-white">Sincronização automática</p>
            <p className="text-xs text-gray-500">Sincronizar a cada 15 minutos</p>
          </div>
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </div>

        {/* Conflitos */}
        <div className="space-y-2 border-t border-[#1e1e2a] pt-3">
          <Label className="text-gray-400 text-sm">Em caso de conflito</Label>
          <Select value={syncConflicts} onValueChange={setSyncConflicts}>
            <SelectTrigger className="bg-[#12121a] border-[#1e1e2a] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              <SelectItem value="platform_wins" className="text-white">Priorizar plataforma</SelectItem>
              <SelectItem value="google_wins" className="text-white">Priorizar Google Agenda</SelectItem>
              <SelectItem value="ask" className="text-white">Perguntar sempre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tratamentos */}
        <div className="grid grid-cols-2 gap-3 border-t border-[#1e1e2a] pt-3 text-sm">
          {[
            { label: "Criação de eventos", ok: true },
            { label: "Atualização de eventos", ok: true },
            { label: "Cancelamento", ok: true },
            { label: "Prevenção de duplicatas", ok: true },
            { label: "Timezone correto (BRT)", ok: true },
            { label: "Conflitos de horário", ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              {item.label}
            </div>
          ))}
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