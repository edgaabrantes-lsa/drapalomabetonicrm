import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, Shield } from "lucide-react";

export default function WebhookSecrets() {
  const [secrets, setSecrets] = useState({
    CRM_WEBHOOK_SECRET: "",
    SENSORFLOW_API_KEY: "",
  });
  const [visible, setVisible] = useState({
    CRM_WEBHOOK_SECRET: false,
    SENSORFLOW_API_KEY: false,
  });
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar segredos via função backend (apenas admin)
    base44.functions.invoke("getWebhookSecrets", {}).then((res) => {
      setSecrets(res.data || {});
      setLoading(false);
    }).catch((err) => {
      console.error("Erro ao buscar segredos:", err);
      setLoading(false);
    });
  }, []);

  const copyToClipboard = async (key, value) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-secondary-corp">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary-corp mb-2">
          🔐 Segredos do Webhook SensorFlow
        </h1>
        <p className="text-secondary-corp">
          Use estas chaves para configurar o SensorFlow. Mantenha-as em segredo.
        </p>
      </div>

      <div className="space-y-6">
        {/* CRM_WEBHOOK_SECRET */}
        <Card className="p-6 bg-card-corp border-border-corp">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gold-corp" />
            <h2 className="text-lg font-medium text-primary-corp">
              CRM_WEBHOOK_SECRET
            </h2>
            <span className="text-xs text-secondary-corp bg-secondary-corp px-2 py-1 rounded">
              Principal
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-secondary-corp mb-2 block">
                Valor da Chave
              </Label>
              <div className="flex gap-2">
                <Input
                  type={visible.CRM_WEBHOOK_SECRET ? "text" : "password"}
                  value={secrets.CRM_WEBHOOK_SECRET}
                  readOnly
                  className="flex-1 bg-secondary-corp border-border-corp text-primary-corp"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setVisible(prev => ({ ...prev, CRM_WEBHOOK_SECRET: !prev.CRM_WEBHOOK_SECRET }))}
                  className="border-border-corp text-secondary-corp hover:text-primary-corp"
                >
                  {visible.CRM_WEBHOOK_SECRET ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard("CRM_WEBHOOK_SECRET", secrets.CRM_WEBHOOK_SECRET)}
                  className="border-border-corp text-secondary-corp hover:text-primary-corp"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied === "CRM_WEBHOOK_SECRET" && (
                <p className="text-xs text-gold-corp mt-1">✓ Copiado!</p>
              )}
            </div>

            <div className="bg-secondary-corp rounded p-4">
              <h3 className="text-sm font-medium text-primary-corp mb-2">
                📋 Configuração no SensorFlow
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-secondary-corp w-32">URL:</span>
                  <code className="text-gold-corp">https://lofty-osprey-82-hhw6d677w1sj.deno.dev/</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary-corp w-32">Método:</span>
                  <code className="text-primary-corp">POST</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary-corp w-32">Header:</span>
                  <code className="text-primary-corp">X-SensorlyFlow-Secret</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary-corp w-32">Valor:</span>
                  <code className="text-gold-corp break-all">{secrets.CRM_WEBHOOK_SECRET}</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary-corp w-32">Content-Type:</span>
                  <code className="text-primary-corp">application/json</code>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SENSORFLOW_API_KEY (Fallback) */}
        <Card className="p-6 bg-card-corp border-border-corp">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-secondary-corp" />
            <h2 className="text-lg font-medium text-primary-corp">
              SENSORFLOW_API_KEY
            </h2>
            <span className="text-xs text-secondary-corp bg-secondary-corp px-2 py-1 rounded">
              Fallback
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-secondary-corp mb-2 block">
                Valor da Chave
              </Label>
              <div className="flex gap-2">
                <Input
                  type={visible.SENSORFLOW_API_KEY ? "text" : "password"}
                  value={secrets.SENSORFLOW_API_KEY}
                  readOnly
                  className="flex-1 bg-secondary-corp border-border-corp text-primary-corp"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setVisible(prev => ({ ...prev, SENSORFLOW_API_KEY: !prev.SENSORFLOW_API_KEY }))}
                  className="border-border-corp text-secondary-corp hover:text-primary-corp"
                >
                  {visible.SENSORFLOW_API_KEY ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard("SENSORFLOW_API_KEY", secrets.SENSORFLOW_API_KEY)}
                  className="border-border-corp text-secondary-corp hover:text-primary-corp"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied === "SENSORFLOW_API_KEY" && (
                <p className="text-xs text-gold-corp mt-1">✓ Copiado!</p>
              )}
            </div>

            <p className="text-xs text-secondary-corp">
              Esta chave é usada como fallback caso CRM_WEBHOOK_SECRET não esteja disponível.
            </p>
          </div>
        </Card>

        {/* Instruções */}
        <Card className="p-6 bg-card-corp border-border-corp">
          <h2 className="text-lg font-medium text-primary-corp mb-4">
            ✅ Instruções Finais
          </h2>
          <ol className="space-y-3 text-secondary-corp">
            <li className="flex gap-3">
              <span className="text-gold-corp font-bold">1.</span>
              Copie o valor de <strong className="text-primary-corp">CRM_WEBHOOK_SECRET</strong>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-corp font-bold">2.</span>
              Cole no painel do SensorFlow como valor do header <code className="text-gold-corp">X-SensorlyFlow-Secret</code>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-corp font-bold">3.</span>
              Teste o webhook no SensorFlow
            </li>
            <li className="flex gap-3">
              <span className="text-gold-corp font-bold">4.</span>
              Verifique se o paciente aparece na lista de <strong className="text-primary-corp">Pacientes</strong> do CRM
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}