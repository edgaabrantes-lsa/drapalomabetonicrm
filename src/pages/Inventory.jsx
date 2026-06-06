import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  MoreVertical,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit,
  History,
  Filter,
  Trash2,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CurrencyInput from "@/components/ui/CurrencyInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryLabels = {
  injetavel: "Injetáveis",
  topico: "Tópicos",
  equipamento: "Equipamentos",
  descartavel: "Descartáveis",
  outros: "Outros"
};

const unitLabels = {
  ml: "mL",
  mg: "mg",
  un: "Unidade",
  cx: "Caixa",
  fr: "Frasco",
  amp: "Ampola"
};

const SupplyForm = ({ supply, onSave, onClose }) => {
  const [formData, setFormData] = useState(supply || {
    name: "",
    category: "injetavel",
    brand: "",
    unit: "un",
    current_stock: 0,
    minimum_stock: 5,
    cost_per_unit: 0,
    supplier: "",
    status: "active",
    requires_prescription: false,
    storage_conditions: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Nome do Insumo *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Marca</Label>
          <Input
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Unidade</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(unitLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Custo por Unidade (R$)</Label>
          <CurrencyInput
            value={formData.cost_per_unit}
            onChange={(v) => setFormData(prev => ({ ...prev, cost_per_unit: v }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Estoque Atual</Label>
          <Input
            type="number"
            value={formData.current_stock}
            onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Estoque Mínimo</Label>
          <Input
            type="number"
            value={formData.minimum_stock}
            onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Fornecedor</Label>
          <Input
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Condições de Armazenamento</Label>
          <Textarea
            value={formData.storage_conditions}
            onChange={(e) => setFormData(prev => ({ ...prev, storage_conditions: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {supply ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};

const BatchForm = ({ supply, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    supply_id: supply?.id || "",
    supply_name: supply?.name || "",
    batch_number: "",
    quantity: 0,
    quantity_remaining: 0,
    manufacture_date: "",
    expiry_date: "",
    purchase_date: format(new Date(), "yyyy-MM-dd"),
    purchase_price: 0,
    invoice_number: "",
    supplier: supply?.supplier || "",
    status: "active"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      quantity_remaining: formData.quantity
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Número do Lote *</Label>
          <Input
            value={formData.batch_number}
            onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Quantidade *</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Valor da Compra (R$)</Label>
          <CurrencyInput
            value={formData.purchase_price}
            onChange={(v) => setFormData(prev => ({ ...prev, purchase_price: v }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Data de Fabricação</Label>
          <Input
            type="date"
            value={formData.manufacture_date}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacture_date: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Data de Validade *</Label>
          <Input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Nota Fiscal</Label>
          <Input
            value={formData.invoice_number}
            onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          Registrar Entrada
        </Button>
      </div>
    </form>
  );
};

const SupplyCard = ({ supply, onEdit, onAddBatch, onDelete, isAdmin }) => {
  const stockPercentage = supply.minimum_stock > 0
    ? Math.min((supply.current_stock / supply.minimum_stock) * 100, 100)
    : 100;
  const isLowStock = supply.current_stock <= (supply.minimum_stock || 5);

  return (
    <Card className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-white">{supply.name}</h3>
            <p className="text-xs text-gray-500">{supply.brand}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#12121a] border-[#1e1e2a]">
              <DropdownMenuItem onClick={() => onEdit(supply)} className="text-white hover:bg-[#c9a55c]/10">
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBatch(supply)} className="text-white hover:bg-[#c9a55c]/10">
                <ArrowDownCircle className="mr-2 h-4 w-4" /> Entrada
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-[#c9a55c]/10">
                <History className="mr-2 h-4 w-4" /> Histórico
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => onDelete(supply)}
                  className="text-red-400 hover:bg-red-500/10 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-light text-white">{supply.current_stock}</span>
          <Badge className={categoryLabels[supply.category] ? "bg-[#c9a55c]/20 text-[#c9a55c]" : ""}>
            {categoryLabels[supply.category] || supply.category}
          </Badge>
        </div>
        
        <p className="text-xs text-gray-500 mb-2">
          {unitLabels[supply.unit] || supply.unit} • Mín: {supply.minimum_stock}
        </p>

        <Progress 
          value={stockPercentage} 
          className="h-1.5 bg-[#1e1e2a]"
        />

        {isLowStock && (
          <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
            <AlertTriangle className="h-3 w-3" />
            Estoque baixo
          </div>
        )}

        {supply.cost_per_unit > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Custo: R$ {supply.cost_per_unit.toFixed(2)}/{unitLabels[supply.unit] || supply.unit}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default function Inventory() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [selectedSupplyForBatch, setSelectedSupplyForBatch] = useState(null);
  const [activeTab, setActiveTab] = useState("supplies");
  const [supplyToDelete, setSupplyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      setIsAdmin(user?.role === "admin");
    }).catch(() => {});
  }, []);

  const { data: supplies = [] } = useQuery({
    queryKey: ["supplies"],
    queryFn: () => base44.entities.Supply.list(),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.SupplyBatch.list("-created_date", 500),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["movements"],
    queryFn: () => base44.entities.SupplyMovement.list("-created_date", 500),
  });

  const createSupplyMutation = useMutation({
    mutationFn: (data) => base44.entities.Supply.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setIsSupplyFormOpen(false);
      setEditingSupply(null);
    },
  });

  const updateSupplyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supply.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setIsSupplyFormOpen(false);
      setEditingSupply(null);
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data) => {
      // Create batch
      await base44.entities.SupplyBatch.create(data);
      // Update supply stock
      const supply = supplies.find(s => s.id === data.supply_id);
      if (supply) {
        await base44.entities.Supply.update(supply.id, {
          current_stock: (supply.current_stock || 0) + data.quantity
        });
      }
      // Create movement record
      await base44.entities.SupplyMovement.create({
        supply_id: data.supply_id,
        supply_name: data.supply_name,
        batch_number: data.batch_number,
        movement_type: "entry",
        quantity: data.quantity,
        reason: "Entrada de estoque"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setIsBatchFormOpen(false);
      setSelectedSupplyForBatch(null);
    },
  });

  const handleSaveSupply = (data) => {
    if (editingSupply) {
      updateSupplyMutation.mutate({ id: editingSupply.id, data });
    } else {
      createSupplyMutation.mutate(data);
    }
  };

  const handleSaveBatch = (data) => {
    createBatchMutation.mutate(data);
  };

  const handleDeleteSupply = async () => {
    if (!supplyToDelete || !isAdmin) return;
    setIsDeleting(true);
    try {
      // Verificar se tem histórico vinculado
      const linkedBatches = batches.filter(b => b.supply_id === supplyToDelete.id);
      const linkedMovements = movements.filter(m => m.supply_id === supplyToDelete.id);
      const hasHistory = linkedBatches.length > 0 || linkedMovements.length > 0;

      if (hasHistory) {
        // Exclusão lógica: preserva histórico, apenas oculta da listagem
        await base44.entities.Supply.update(supplyToDelete.id, {
          ...supplyToDelete,
          status: "inactive"
        });
      } else {
        // Sem histórico: exclusão física
        await base44.entities.Supply.delete(supplyToDelete.id);
      }

      // Registrar log de auditoria
      await base44.entities.AuditLog.create({
        action: "delete",
        entity_type: "Supply",
        entity_id: supplyToDelete.id,
        user_email: (await base44.auth.me())?.email || "admin",
        user_role: "admin",
        details: {
          supply_name: supplyToDelete.name,
          had_history: hasHistory,
          deletion_type: hasHistory ? "logical" : "physical",
        },
        old_values: supplyToDelete,
      }).catch(() => {}); // log não deve bloquear a exclusão

      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      toast.success(`Insumo "${supplyToDelete.name}" excluído com sucesso.`);
      setSupplyToDelete(null);
    } catch {
      toast.error("Não foi possível excluir este insumo. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Ocultar insumos marcados como excluídos logicamente (exclusão lógica)
  const activeSupplies = supplies.filter(s => s.status !== "inactive");

  const filteredSupplies = activeSupplies.filter(supply => {
    const matchesSearch = supply.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || supply.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = supplies.filter(s => s.current_stock <= (s.minimum_stock || 5));
  const expiringBatches = batches.filter(b => {
    if (!b.expiry_date) return false;
    const daysToExpiry = differenceInDays(parseISO(b.expiry_date), new Date());
    return daysToExpiry <= 30 && daysToExpiry > 0;
  });

  const totalValue = supplies.reduce((sum, s) => sum + (s.current_stock * (s.cost_per_unit || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Estoque</h1>
          <p className="text-gray-400">Controle de insumos e materiais</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isBatchFormOpen} onOpenChange={setIsBatchFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10">
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">Entrada de Estoque</DialogTitle>
              </DialogHeader>
              {selectedSupplyForBatch ? (
                <BatchForm
                  supply={selectedSupplyForBatch}
                  onSave={handleSaveBatch}
                  onClose={() => { setIsBatchFormOpen(false); setSelectedSupplyForBatch(null); }}
                />
              ) : (
                <div className="space-y-4">
                  <Label className="text-gray-300">Selecione o Insumo</Label>
                  <Select onValueChange={(value) => {
                    const supply = supplies.find(s => s.id === value);
                    setSelectedSupplyForBatch(supply);
                  }}>
                    <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white">
                      <SelectValue placeholder="Escolha um insumo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                      {supplies.map((supply) => (
                        <SelectItem key={supply.id} value={supply.id} className="text-white">
                          {supply.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={isSupplyFormOpen} onOpenChange={setIsSupplyFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" />
                Novo Insumo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl font-serif">
                  {editingSupply ? "Editar Insumo" : "Novo Insumo"}
                </DialogTitle>
              </DialogHeader>
              <SupplyForm
                supply={editingSupply}
                onSave={handleSaveSupply}
                onClose={() => { setIsSupplyFormOpen(false); setEditingSupply(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total de Itens</p>
            <p className="text-2xl font-light text-white mt-1">{supplies.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Valor em Estoque</p>
            <p className="text-2xl font-light text-[#c9a55c] mt-1">
              R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className={`bg-[#12121a] border-[#1e1e2a] ${lowStockItems.length > 0 ? "border-orange-500/30" : ""}`}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Estoque Baixo</p>
            <p className={`text-2xl font-light mt-1 ${lowStockItems.length > 0 ? "text-orange-400" : "text-white"}`}>
              {lowStockItems.length}
            </p>
          </CardContent>
        </Card>
        <Card className={`bg-[#12121a] border-[#1e1e2a] ${expiringBatches.length > 0 ? "border-red-500/30" : ""}`}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Próx. Vencimento</p>
            <p className={`text-2xl font-light mt-1 ${expiringBatches.length > 0 ? "text-red-400" : "text-white"}`}>
              {expiringBatches.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="supplies" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Insumos
          </TabsTrigger>
          <TabsTrigger value="batches" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Lotes
          </TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supplies" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-[#1a1a25] border-[#1e1e2a] text-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="all" className="text-white">Todas</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supply Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSupplies.map((supply) => (
              <SupplyCard
                key={supply.id}
                supply={supply}
                isAdmin={isAdmin}
                onEdit={(s) => { setEditingSupply(s); setIsSupplyFormOpen(true); }}
                onAddBatch={(s) => { setSelectedSupplyForBatch(s); setIsBatchFormOpen(true); }}
                onDelete={(s) => setSupplyToDelete(s)}
              />
            ))}
          </div>

          {filteredSupplies.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum insumo encontrado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2a]">
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Insumo</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Lote</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Quantidade</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Validade</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => {
                      const daysToExpiry = batch.expiry_date ? differenceInDays(parseISO(batch.expiry_date), new Date()) : null;
                      const isExpiring = daysToExpiry !== null && daysToExpiry <= 30;
                      const isExpired = daysToExpiry !== null && daysToExpiry <= 0;
                      
                      return (
                        <tr key={batch.id} className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5">
                          <td className="p-4 text-white">{batch.supply_name}</td>
                          <td className="p-4 text-gray-400">{batch.batch_number}</td>
                          <td className="p-4 text-white">{batch.quantity_remaining}/{batch.quantity}</td>
                          <td className="p-4">
                            <span className={isExpired ? "text-red-400" : isExpiring ? "text-orange-400" : "text-gray-400"}>
                              {batch.expiry_date && format(parseISO(batch.expiry_date), "dd/MM/yyyy")}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge className={
                              batch.status === "expired" ? "bg-red-500/20 text-red-400" :
                              batch.status === "depleted" ? "bg-gray-500/20 text-gray-400" :
                              "bg-emerald-500/20 text-emerald-400"
                            }>
                              {batch.status === "expired" ? "Vencido" :
                               batch.status === "depleted" ? "Esgotado" : "Ativo"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2a]">
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Data</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Insumo</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Tipo</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Quantidade</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5">
                        <td className="p-4 text-gray-400">
                          {movement.created_date && format(parseISO(movement.created_date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="p-4 text-white">{movement.supply_name}</td>
                        <td className="p-4">
                          <Badge className={
                            movement.movement_type === "entry" ? "bg-emerald-500/20 text-emerald-400" :
                            movement.movement_type === "exit" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }>
                            {movement.movement_type === "entry" ? "Entrada" :
                             movement.movement_type === "exit" ? "Saída" : "Ajuste"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className={movement.movement_type === "entry" ? "text-emerald-400" : "text-red-400"}>
                            {movement.movement_type === "entry" ? "+" : "-"}{movement.quantity}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{movement.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Diálogo de Confirmação de Exclusão */}
      {supplyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#12121a] border border-[#1e1e2a] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base mb-1">Excluir Insumo</h3>
                <p className="text-gray-400 text-sm">
                  Tem certeza que deseja excluir <span className="text-white font-medium">"{supplyToDelete.name}"</span>?
                  Esta ação não poderá ser desfeita.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Se existir histórico de lotes ou movimentações, o insumo será desativado logicamente para preservar a auditoria.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setSupplyToDelete(null)}
                disabled={isDeleting}
                className="border-[#1e1e2a] text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteSupply}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}