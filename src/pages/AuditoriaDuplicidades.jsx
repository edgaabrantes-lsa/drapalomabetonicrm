import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck, Loader2, AlertTriangle, Copy, Images, ScanFace, Link2, FileQuestion, Users, Trash2,
} from "lucide-react";

export default function AuditoriaDuplicidades() {
  const [loading, setLoading] = useState(null); // 'scan' | 'corrigir' | null
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState("");
  const [confirmCorrigir, setConfirmCorrigir] = useState(false);

  const executar = async (acao) => {
    setLoading(acao);
    setErro("");
    try {
      const res = await base44.functions.invoke("auditoriaDuplicidades", { acao });
      setRelatorio(res.data);
    } catch (e) {
      setErro(e?.response?.data?.error || e?.message || "Erro ao executar auditoria");
    } finally {
      setLoading(null);
    }
  };

  const Stat = ({ icon: Icon, label, valor, cor }) => (
    <Card className="bg-[#12121a] border-[#1e1e2a]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: cor + "20" }}>
          <Icon className="h-5 w-5" style={{ color: cor }} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-light text-white">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );

  const Secao = ({ titulo, itens, render }) => (
    <Card className="bg-[#12121a] border-[#1e1e2a]">
      <CardContent className="p-5">
        <h3 className="text-sm font-medium text-white mb-3">{titulo} <Badge variant="outline" className="ml-2 text-gray-400">{itens.length}</Badge></h3>
        {itens.length === 0 ? (
          <p className="text-xs text-emerald-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Nenhum problema encontrado</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {itens.map((it, i) => render(it, i))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-white flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-[#C5A059]" /> Auditoria de Duplicidades</h1>
        <p className="text-gray-400">Verificação estrutural de pacientes, análises faciais, fotos e relacionamentos em toda a base.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => executar("scan")} disabled={!!loading} variant="outline" className="border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 gap-2">
          {loading === "scan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
          Escanear Base (Somente Leitura)
        </Button>
        <Button onClick={() => setConfirmCorrigir(true)} disabled={!!loading} className="bg-[#C5A059] hover:bg-[#a17f3f] text-black gap-2">
          {loading === "corrigir" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Aplicar Correções
        </Button>
      </div>

      {erro && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4" /> {erro}
        </div>
      )}

      {relatorio && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Relatório gerado em: {new Date(relatorio.gerado_em).toLocaleString("pt-BR")}</span>
            <span>·</span>
            <span>por {relatorio.executado_por}</span>
            <span>·</span>
            <Badge variant={relatorio.modo.includes("correcao") ? "default" : "outline"}>{relatorio.modo}</Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={Users} label="Pacientes" valor={relatorio.totais.pacientes} cor="#C5A059" />
            <Stat icon={ScanFace} label="Simulações Faciais" valor={relatorio.totais.simulacoes} cor="#8B5CF6" />
            <Stat icon={Images} label="Fotos (Dossiê)" valor={relatorio.totais.imagens_dossie} cor="#3B82F6" />
            <Stat icon={Images} label="Fotos (Prontuário)" valor={relatorio.totais.imagens_patient} cor="#10B981" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={Copy} label="Pacientes Duplicados" valor={relatorio.duplicidades.pacientes} cor="#EF4444" />
            <Stat icon={ScanFace} label="Simulações Duplicadas" valor={relatorio.duplicidades.simulacoes_faciais} cor="#EF4444" />
            <Stat icon={Images} label="Fotos Duplicadas" valor={relatorio.duplicidades.fotos_dossie} cor="#EF4444" />
            <Stat icon={Link2} label="Fotos em +1 Paciente" valor={relatorio.duplicidades.fotos_cruzadas_pacientes} cor="#F59E0B" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={FileQuestion} label="Fotos Órfãs (Dossiê)" valor={relatorio.integridade.fotos_orfas_dossie} cor="#F59E0B" />
            <Stat icon={FileQuestion} label="Fotos Órfãs (Pront.)" valor={relatorio.integridade.fotos_orfas_patient} cor="#F59E0B" />
            <Stat icon={FileQuestion} label="Fotos sem Paciente" valor={relatorio.integridade.fotos_sem_patient_id} cor="#F59E0B" />
            <Stat icon={ScanFace} label="Simulações Órfãs" valor={relatorio.integridade.simulacoes_orfas} cor="#F59E0B" />
          </div>

          {relatorio.correcoes_aplicadas && (
            <Card className="bg-emerald-500/5 border-emerald-500/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Correções aplicadas</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-300">
                  <p>Fotos duplicadas removidas: <strong className="text-white">{relatorio.correcoes_aplicadas.fotos_duplicadas_removidas}</strong></p>
                  <p>Simulações duplicadas removidas: <strong className="text-white">{relatorio.correcoes_aplicadas.simulacoes_duplicadas_removidas}</strong></p>
                  <p>Fotos órfãs removidas: <strong className="text-white">{relatorio.correcoes_aplicadas.fotos_orfas_removidas}</strong></p>
                  <p>Simulações órfãs removidas: <strong className="text-white">{relatorio.correcoes_aplicadas.simulacoes_orfas_removidas}</strong></p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Secao titulo="Pacientes Duplicados" itens={relatorio.detalhes.pacientes_duplicados}
              render={(g, i) => (
                <div key={i} className="p-2 rounded bg-[#0f0f17] border border-[#1e1e2a]">
                  <p className="text-xs text-[#C5A059] mb-1">Critério: {g.criterio}</p>
                  {g.pacientes.map((p, j) => (
                    <p key={j} className="text-xs text-gray-300">{p.nome} · {p.phone || p.email || p.cpf || "—"} · {new Date(p.criado).toLocaleDateString("pt-BR")}</p>
                  ))}
                </div>
              )} />
            <Secao titulo="Simulações Faciais Duplicadas" itens={relatorio.detalhes.simulacoes_duplicadas}
              render={(g, i) => (
                <div key={i} className="p-2 rounded bg-[#0f0f17] border border-[#1e1e2a]">
                  <p className="text-xs text-white">{g.patient_name} — {g.quantidade} simulações</p>
                  {g.ids.map((s, j) => (
                    <p key={j} className="text-xs text-gray-400">{s.status} · {new Date(s.criado).toLocaleString("pt-BR")}</p>
                  ))}
                </div>
              )} />
            <Secao titulo="Fotos Duplicadas (mesma URL no mesmo paciente)" itens={relatorio.detalhes.fotos_duplicadas}
              render={(g, i) => (
                <div key={i} className="p-2 rounded bg-[#0f0f17] border border-[#1e1e2a]">
                  <p className="text-xs text-white">Paciente: {g.patient_id} — {g.quantidade} cópias</p>
                  {g.ids.map((f, j) => <p key={j} className="text-xs text-gray-400 truncate">{f.titulo || f.file_url}</p>)}
                </div>
              )} />
            <Secao titulo="Fotos vinculadas a mais de um paciente" itens={relatorio.detalhes.fotos_cruzadas}
              render={(f, i) => (
                <div key={i} className="p-2 rounded bg-[#0f0f17] border border-[#1e1e2a]">
                  <p className="text-xs text-amber-400 truncate">{f.file_url}</p>
                  <p className="text-xs text-gray-300">Pacientes: {f.patient_names.join(", ")}</p>
                </div>
              )} />
            <Secao titulo="Fotos Órfãs (paciente inexistente)" itens={[...relatorio.detalhes.orfaos_dossie, ...relatorio.detalhes.orfaos_patient]}
              render={(o, i) => (
                <p key={i} className="text-xs text-gray-400 truncate">{o.id} · {o.file_url || o.image_url}</p>
              )} />
            <Secao titulo="Simulações Órfãs" itens={relatorio.detalhes.simulacoes_orfas}
              render={(s, i) => (
                <p key={i} className="text-xs text-gray-400">{s.id} · patient_id: {s.patient_id}</p>
              )} />
          </div>
        </>
      )}

      <AlertDialog open={confirmCorrigir} onOpenChange={setConfirmCorrigir}>
        <AlertDialogContent className="bg-[#12121a] border-[#1e1e2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Aplicar correções na base?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação remove fotos duplicadas (mantendo a mais antiga), simulações duplicadas, fotos órfãs e simulações órfãs. Pacientes duplicados NÃO são mesclados automaticamente — use a ferramenta "Mesclar Pacientes". A ação é irreversível e registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-400">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmCorrigir(false); executar("corrigir"); }} className="bg-[#C5A059] hover:bg-[#a17f3f] text-black">
              Confirmar Correção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}