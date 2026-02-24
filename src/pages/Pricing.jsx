import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Calculator,
  DollarSign,
  Percent,
  Package,
  Clock,
  TrendingUp,
  RefreshCw,
  Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
  const [activeTab, setActiveTab] = useState("service");

  // Service Pricing State
  const [serviceData, setServiceData] = useState({
    supply_cost: 0,
    hour_cost: 150,
    duration_minutes: 60,
    fixed_cost_ratio: 0.15,
    desired_margin: 0.50,
    service_tax: 0.08
  });

  // Product Pricing State
  const [productData, setProductData] = useState({
    unit_cost: 0,
    freight: 0,
    fixed_cost_ratio: 0.10,
    desired_margin: 0.40,
    product_tax: 0.18
  });

  const { data: supplies = [] } = useQuery({
    queryKey: ["supplies"],
    queryFn: () => base44.entities.Supply.list(),
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  // Service Calculations
  const calculateServicePrice = () => {
    const laborCost = (serviceData.hour_cost / 60) * serviceData.duration_minutes;
    const totalCost = serviceData.supply_cost + laborCost;
    const withFixedCosts = totalCost / (1 - serviceData.fixed_cost_ratio);
    const withMargin = withFixedCosts / (1 - serviceData.desired_margin);
    const finalPrice = withMargin / (1 - serviceData.service_tax);
    return {
      laborCost,
      totalCost,
      withFixedCosts,
      withMargin,
      finalPrice,
      profit: finalPrice - totalCost - (finalPrice * serviceData.service_tax),
      profitMargin: ((finalPrice - totalCost - (finalPrice * serviceData.service_tax)) / finalPrice) * 100
    };
  };

  // Product Calculations
  const calculateProductPrice = () => {
    const baseCost = productData.unit_cost + productData.freight;
    const withFixedCosts = baseCost / (1 - productData.fixed_cost_ratio);
    const withMargin = withFixedCosts / (1 - productData.desired_margin);
    const finalPrice = withMargin / (1 - productData.product_tax);
    return {
      baseCost,
      withFixedCosts,
      withMargin,
      finalPrice,
      profit: finalPrice - baseCost - (finalPrice * productData.product_tax),
      profitMargin: ((finalPrice - baseCost - (finalPrice * productData.product_tax)) / finalPrice) * 100
    };
  };

  const serviceCalc = calculateServicePrice();
  const productCalc = calculateProductPrice();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Calculadora de Precificação</h1>
          <p className="text-gray-400">Calcule preços ideais para serviços e produtos</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="service" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            <Clock className="mr-2 h-4 w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="product" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            <Package className="mr-2 h-4 w-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        {/* Service Pricing */}
        <TabsContent value="service" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="bg-[#12121a] border-[#1e1e2a]">
              <CardHeader>
                <CardTitle className="text-lg font-light text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#c9a55c]" />
                  Dados do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supply Cost */}
                <div>
                  <Label className="text-gray-300">Custo de Insumos (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={serviceData.supply_cost}
                    onChange={(e) => setServiceData(prev => ({ ...prev, supply_cost: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Custo total dos insumos utilizados</p>
                </div>

                {/* Hour Cost */}
                <div>
                  <Label className="text-gray-300">Custo Hora Profissional (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={serviceData.hour_cost}
                    onChange={(e) => setServiceData(prev => ({ ...prev, hour_cost: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
                  />
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-gray-300">Duração do Procedimento (min)</Label>
                  <Input
                    type="number"
                    value={serviceData.duration_minutes}
                    onChange={(e) => setServiceData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                    className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
                  />
                </div>

                {/* Fixed Cost Ratio */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-300">Rateio Custos Fixos</Label>
                    <span className="text-[#c9a55c]">{(serviceData.fixed_cost_ratio * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[serviceData.fixed_cost_ratio * 100]}
                    onValueChange={([value]) => setServiceData(prev => ({ ...prev, fixed_cost_ratio: value / 100 }))}
                    max={50}
                    step={1}
                    className="[&_[role=slider]]:bg-[#c9a55c]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aluguel, contas, administrativo</p>
                </div>

                {/* Desired Margin */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-300">Margem Desejada</Label>
                    <span className="text-[#c9a55c]">{(serviceData.desired_margin * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[serviceData.desired_margin * 100]}
                    onValueChange={([value]) => setServiceData(prev => ({ ...prev, desired_margin: value / 100 }))}
                    max={80}
                    step={1}
                    className="[&_[role=slider]]:bg-[#c9a55c]"
                  />
                </div>

                {/* Service Tax */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-300">Impostos sobre Serviço</Label>
                    <span className="text-[#c9a55c]">{(serviceData.service_tax * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[serviceData.service_tax * 100]}
                    onValueChange={([value]) => setServiceData(prev => ({ ...prev, service_tax: value / 100 }))}
                    max={30}
                    step={0.5}
                    className="[&_[role=slider]]:bg-[#c9a55c]"
                  />
                  <p className="text-xs text-gray-500 mt-1">ISS, PIS, COFINS, etc.</p>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-6">
              {/* Price Result */}
              <Card className="bg-gradient-to-br from-[#c9a55c]/20 to-[#12121a] border-[#c9a55c]/30">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Preço Sugerido</p>
                  <p className="text-5xl font-light text-white">
                    R$ {serviceCalc.finalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      Lucro: R$ {serviceCalc.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                    <Badge className="bg-[#c9a55c]/20 text-[#c9a55c]">
                      Margem: {serviceCalc.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card className="bg-[#12121a] border-[#1e1e2a]">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-white">Composição do Preço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">Custo dos Insumos</span>
                    <span className="text-white">R$ {serviceData.supply_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">Custo da Mão de Obra</span>
                    <span className="text-white">R$ {serviceCalc.laborCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400 font-medium">Custo Total</span>
                    <span className="text-white font-medium">R$ {serviceCalc.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">+ Custos Fixos ({(serviceData.fixed_cost_ratio * 100).toFixed(0)}%)</span>
                    <span className="text-white">R$ {(serviceCalc.withFixedCosts - serviceCalc.totalCost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">+ Margem ({(serviceData.desired_margin * 100).toFixed(0)}%)</span>
                    <span className="text-white">R$ {(serviceCalc.withMargin - serviceCalc.withFixedCosts).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">+ Impostos ({(serviceData.service_tax * 100).toFixed(0)}%)</span>
                    <span className="text-white">R$ {(serviceCalc.finalPrice - serviceCalc.withMargin).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Procedures */}
              <Card className="bg-[#12121a] border-[#1e1e2a]">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-white">Procedimentos Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {procedures.map((proc) => (
                      <div
                        key={proc.id}
                        onClick={() => setServiceData(prev => ({
                          ...prev,
                          supply_cost: proc.cost || 0,
                          duration_minutes: proc.duration_minutes || 60
                        }))}
                        className="flex justify-between p-3 bg-[#1a1a25] rounded-lg hover:bg-[#c9a55c]/10 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="text-white">{proc.name}</p>
                          <p className="text-xs text-gray-500">{proc.duration_minutes} min</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#c9a55c]">R$ {proc.price?.toLocaleString("pt-BR")}</p>
                          <p className="text-xs text-gray-500">Custo: R$ {proc.cost?.toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    ))}
                    {procedures.length === 0 && (
                      <p className="text-gray-500 text-center py-4">Nenhum procedimento cadastrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Product Pricing */}
        <TabsContent value="product" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="bg-[#12121a] border-[#1e1e2a]">
              <CardHeader>
                <CardTitle className="text-lg font-light text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#c9a55c]" />
                  Dados do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Unit Cost */}
                <div>
                  <Label className="text-gray-300">Custo Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productData.unit_cost}
                    onChange={(e) => setProductData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
                  />
                </div>

                {/* Freight */}
                <div>
                  <Label className="text-gray-300">Frete/Transporte (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productData.freight}
                    onChange={(e) => setProductData(prev => ({ ...prev, freight: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
                  />
                </div>

                {/* Fixed Cost Ratio */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-300">Rateio Custos Fixos</Label>
                    <span className="text-[#c9a55c]">{(productData.fixed_cost_ratio * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[productData.fixed_cost_ratio * 100]}
                    onValueChange={([value]) => setProductData(prev => ({ ...prev, fixed_cost_ratio: value / 100 }))}
                    max={50}
                    step={1}
                    className="[&_[role=slider]]:bg-[#c9a55c]"
                  />
                </div>

                {/* Desired Margin */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-300">Margem Desejada</Label>
                    <span className="text-[#c9a55c]">{(productData.desired_margin * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[productData.desired_margin * 100]}
                    onValueChange={([value]) => setProductData(prev => ({ ...prev, desired_margin: value / 100 }))}
                    max={80}
                    step={1}
                    className="[&_[role=slider]]:bg-[#c9a55c]"
                  />
                </div>

                {/* Product Tax */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-300">Impostos sobre Produto</Label>
                    <span className="text-[#c9a55c]">{(productData.product_tax * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[productData.product_tax * 100]}
                    onValueChange={([value]) => setProductData(prev => ({ ...prev, product_tax: value / 100 }))}
                    max={40}
                    step={0.5}
                    className="[&_[role=slider]]:bg-[#c9a55c]"
                  />
                  <p className="text-xs text-gray-500 mt-1">ICMS, IPI, PIS, COFINS, etc.</p>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-6">
              {/* Price Result */}
              <Card className="bg-gradient-to-br from-[#c9a55c]/20 to-[#12121a] border-[#c9a55c]/30">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Preço Sugerido</p>
                  <p className="text-5xl font-light text-white">
                    R$ {productCalc.finalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      Lucro: R$ {productCalc.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                    <Badge className="bg-[#c9a55c]/20 text-[#c9a55c]">
                      Margem: {productCalc.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card className="bg-[#12121a] border-[#1e1e2a]">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-white">Composição do Preço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">Custo Unitário</span>
                    <span className="text-white">R$ {productData.unit_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">Frete/Transporte</span>
                    <span className="text-white">R$ {productData.freight.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400 font-medium">Custo Base</span>
                    <span className="text-white font-medium">R$ {productCalc.baseCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">+ Custos Fixos ({(productData.fixed_cost_ratio * 100).toFixed(0)}%)</span>
                    <span className="text-white">R$ {(productCalc.withFixedCosts - productCalc.baseCost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e1e2a]">
                    <span className="text-gray-400">+ Margem ({(productData.desired_margin * 100).toFixed(0)}%)</span>
                    <span className="text-white">R$ {(productCalc.withMargin - productCalc.withFixedCosts).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">+ Impostos ({(productData.product_tax * 100).toFixed(0)}%)</span>
                    <span className="text-white">R$ {(productCalc.finalPrice - productCalc.withMargin).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Supplies */}
              <Card className="bg-[#12121a] border-[#1e1e2a]">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-white">Insumos Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {supplies.map((supply) => (
                      <div
                        key={supply.id}
                        onClick={() => setProductData(prev => ({
                          ...prev,
                          unit_cost: supply.cost_per_unit || 0
                        }))}
                        className="flex justify-between p-3 bg-[#1a1a25] rounded-lg hover:bg-[#c9a55c]/10 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="text-white">{supply.name}</p>
                          <p className="text-xs text-gray-500">{supply.brand}</p>
                        </div>
                        <p className="text-[#c9a55c]">R$ {supply.cost_per_unit?.toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                    {supplies.length === 0 && (
                      <p className="text-gray-500 text-center py-4">Nenhum insumo cadastrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}