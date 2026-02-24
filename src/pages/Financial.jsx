import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const categoryLabels = {
  procedure: "Procedimento",
  protocol: "Protocolo",
  product: "Produto",
  salary: "Salário",
  rent: "Aluguel",
  utilities: "Utilidades",
  supplies: "Insumos",
  marketing: "Marketing",
  taxes: "Impostos",
  equipment: "Equipamentos",
  maintenance: "Manutenção",
  other: "Outros"
};

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400" },
  paid: { label: "Pago", color: "bg-emerald-500/20 text-emerald-400" },
  overdue: { label: "Vencido", color: "bg-red-500/20 text-red-400" },
  cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400" }
};

const paymentMethods = {
  cash: "Dinheiro",
  credit_card: "Cartão Crédito",
  debit_card: "Cartão Débito",
  pix: "PIX",
  transfer: "Transferência",
  check: "Cheque",
  installments: "Parcelado"
};

const TransactionForm = ({ transaction, patients, onSave, onClose }) => {
  const [formData, setFormData] = useState(transaction || {
    type: "income",
    category: "procedure",
    description: "",
    amount: 0,
    payment_method: "pix",
    due_date: format(new Date(), "yyyy-MM-dd"),
    status: "pending",
    patient_id: "",
    patient_name: "",
    cost_center: "clinical",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Tipo</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              <SelectItem value="income" className="text-white">Receita</SelectItem>
              <SelectItem value="expense" className="text-white">Despesa</SelectItem>
            </SelectContent>
          </Select>
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
        <div className="col-span-2">
          <Label className="text-gray-300">Descrição *</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Valor (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Forma de Pagamento</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(paymentMethods).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Vencimento *</Label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {formData.type === "income" && (
          <div className="col-span-2">
            <Label className="text-gray-300">Paciente</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => {
                const patient = patients.find(p => p.id === value);
                setFormData(prev => ({
                  ...prev,
                  patient_id: value,
                  patient_name: patient?.full_name || ""
                }));
              }}
            >
              <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id} className="text-white">
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="col-span-2">
          <Label className="text-gray-300">Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
          {transaction ? "Salvar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
};

export default function Financial() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-created_date", 1000),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsFormOpen(false);
      setEditingTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsFormOpen(false);
      setEditingTransaction(null);
    },
  });

  const handleSave = (data) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Calculations
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyTransactions = transactions.filter(t => {
    if (!t.due_date) return false;
    const date = parseISO(t.due_date);
    return date >= monthStart && date <= monthEnd;
  });

  const totalIncome = transactions
    .filter(t => t.type === "income" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === "income" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingReceivables = transactions
    .filter(t => t.type === "income" && t.status === "pending")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingPayables = transactions
    .filter(t => t.type === "expense" && t.status === "pending")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const overdueCount = transactions.filter(t => t.status === "overdue").length;

  // Chart data
  const revenueByCategory = Object.entries(
    transactions
      .filter(t => t.type === "income" && t.status === "paid")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {})
  ).map(([name, value]) => ({
    name: categoryLabels[name] || name,
    value
  }));

  const chartColors = ["#c9a55c", "#e4c98a", "#a17f3f", "#8b6914", "#5c4a1f", "#d4af37"];

  const filteredTransactions = transactions.filter(t => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Financeiro</h1>
          <p className="text-gray-400">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">
                  {editingTransaction ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
              </DialogHeader>
              <TransactionForm
                transaction={editingTransaction}
                patients={patients}
                onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-gray-500">Receita (Mês)</p>
            </div>
            <p className="text-2xl font-light text-emerald-400">
              R$ {monthlyIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-red-400" />
              <p className="text-xs text-gray-500">Despesas (Mês)</p>
            </div>
            <p className="text-2xl font-light text-red-400">
              R$ {monthlyExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[#c9a55c]" />
              <p className="text-xs text-gray-500">Lucro (Mês)</p>
            </div>
            <p className={`text-2xl font-light ${monthlyIncome - monthlyExpenses >= 0 ? "text-[#c9a55c]" : "text-red-400"}`}>
              R$ {(monthlyIncome - monthlyExpenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className={`bg-[#12121a] border-[#1e1e2a] ${overdueCount > 0 ? "border-red-500/30" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-xs text-gray-500">Vencidos</p>
            </div>
            <p className={`text-2xl font-light ${overdueCount > 0 ? "text-red-400" : "text-white"}`}>
              {overdueCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Transações
          </TabsTrigger>
          <TabsTrigger value="receivables" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            A Receber
          </TabsTrigger>
          <TabsTrigger value="payables" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            A Pagar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            <Card className="bg-[#12121a] border-[#1e1e2a]">
              <CardHeader>
                <CardTitle className="text-lg font-light text-white">Receita por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByCategory.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {revenueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#12121a",
                            border: "1px solid #1e1e2a",
                            borderRadius: "8px",
                            color: "#fff"
                          }}
                          formatter={(value) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    Sem dados de receita
                  </div>
                )}
                <div className="space-y-2 mt-4">
                  {revenueByCategory.slice(0, 5).map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i] }} />
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-gray-400">R$ {item.value.toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="space-y-4">
              <Card className="bg-[#12121a] border-[#1e1e2a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">A Receber</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-emerald-400">
                    R$ {pendingReceivables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {transactions.filter(t => t.type === "income" && t.status === "pending").length} transações pendentes
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#12121a] border-[#1e1e2a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">A Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-red-400">
                    R$ {pendingPayables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {transactions.filter(t => t.type === "expense" && t.status === "pending").length} transações pendentes
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#12121a] border-[#c9a55c]/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Saldo Projetado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-[#c9a55c]">
                    R$ {(pendingReceivables - pendingPayables).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Receitas - Despesas pendentes
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-[#1a1a25] border-[#1e1e2a] text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                <SelectItem value="income" className="text-white">Receitas</SelectItem>
                <SelectItem value="expense" className="text-white">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-[#1a1a25] border-[#1e1e2a] text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2a]">
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Data</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Descrição</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Categoria</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Valor</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 50).map((transaction) => (
                      <tr
                        key={transaction.id}
                        onClick={() => { setEditingTransaction(transaction); setIsFormOpen(true); }}
                        className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5 cursor-pointer"
                      >
                        <td className="p-4 text-gray-400">
                          {transaction.due_date && format(parseISO(transaction.due_date), "dd/MM/yyyy")}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-white">{transaction.description}</p>
                            {transaction.patient_name && (
                              <p className="text-xs text-gray-500">{transaction.patient_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-gray-400">
                          {categoryLabels[transaction.category] || transaction.category}
                        </td>
                        <td className="p-4">
                          <span className={transaction.type === "income" ? "text-emerald-400" : "text-red-400"}>
                            {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount?.toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={statusConfig[transaction.status]?.color}>
                            {statusConfig[transaction.status]?.label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="mt-6">
          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2a]">
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Vencimento</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Descrição</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Paciente</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Valor</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => t.type === "income" && (t.status === "pending" || t.status === "overdue"))
                      .map((transaction) => (
                        <tr key={transaction.id} className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5">
                          <td className="p-4 text-gray-400">
                            {transaction.due_date && format(parseISO(transaction.due_date), "dd/MM/yyyy")}
                          </td>
                          <td className="p-4 text-white">{transaction.description}</td>
                          <td className="p-4 text-gray-400">{transaction.patient_name || "-"}</td>
                          <td className="p-4 text-emerald-400">
                            R$ {transaction.amount?.toLocaleString("pt-BR")}
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMutation.mutate({
                                id: transaction.id,
                                data: { ...transaction, status: "paid", payment_date: format(new Date(), "yyyy-MM-dd") }
                              })}
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Receber
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="mt-6">
          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2a]">
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Vencimento</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Descrição</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Categoria</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Valor</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => t.type === "expense" && (t.status === "pending" || t.status === "overdue"))
                      .map((transaction) => (
                        <tr key={transaction.id} className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5">
                          <td className="p-4 text-gray-400">
                            {transaction.due_date && format(parseISO(transaction.due_date), "dd/MM/yyyy")}
                          </td>
                          <td className="p-4 text-white">{transaction.description}</td>
                          <td className="p-4 text-gray-400">
                            {categoryLabels[transaction.category] || transaction.category}
                          </td>
                          <td className="p-4 text-red-400">
                            R$ {transaction.amount?.toLocaleString("pt-BR")}
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMutation.mutate({
                                id: transaction.id,
                                data: { ...transaction, status: "paid", payment_date: format(new Date(), "yyyy-MM-dd") }
                              })}
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Pagar
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}