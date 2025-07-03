import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { UpcomingInstallments } from './UpcomingInstallments';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onBack: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onBack }) => {
  const { addInvoice, updateInvoice } = useInvoices();
  const { clients } = useClients();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero: '',
    descricao: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    status: 'pendente' as 'pendente' | 'pago' | 'atrasado',
    dataEmissao: '',
    dataVencimento: '',
    dataRecebimento: '',
    valorBruto: 0,
    clienteId: '',
    numeroParcela: 1,
    valorParcela: 0,
    totalParcelas: 1
  });

  const [calculatedValues, setCalculatedValues] = useState({
    irrf: 0,
    csll: 0,
    pis: 0,
    cofins: 0,
    valorEmitido: 0,
    valorRecebido: 0,
    valorLivreImpostos: 0,
    valorLivre: 0
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        numero: invoice.numero,
        descricao: invoice.descricao,
        tipo: invoice.tipo,
        status: invoice.status,
        dataEmissao: invoice.dataEmissao,
        dataVencimento: invoice.dataVencimento,
        dataRecebimento: invoice.dataRecebimento || '',
        valorBruto: invoice.valorBruto,
        clienteId: invoice.clienteId || '',
        numeroParcela: invoice.numeroParcela || 1,
        valorParcela: invoice.valorParcela || invoice.valorBruto,
        totalParcelas: invoice.totalParcelas || 1
      });
    }
  }, [invoice]);

  useEffect(() => {
    calculateTaxes();
  }, [formData.valorBruto]);

  useEffect(() => {
    if (formData.totalParcelas > 0) {
      setFormData(prev => ({
        ...prev,
        valorParcela: prev.valorBruto / prev.totalParcelas
      }));
    }
  }, [formData.valorBruto, formData.totalParcelas]);

  const calculateTaxes = () => {
    const valorBruto = formData.valorBruto;
    const irrf = valorBruto * 0.015; // 1,5%
    const csll = valorBruto * 0.01; // 1%
    const pis = valorBruto * 0.0065; // 0,65%
    const cofins = valorBruto * 0.03; // 3%
    
    const totalImpostos = irrf + csll + pis + cofins;
    const valorEmitido = valorBruto - totalImpostos;
    const valorLivreImpostos = valorBruto * 0.975; // 2,5% livre
    const valorLivre = valorBruto * 0.85; // 15% livre

    setCalculatedValues({
      irrf,
      csll,
      pis,
      cofins,
      valorEmitido,
      valorRecebido: formData.status === 'pago' ? valorEmitido : 0,
      valorLivreImpostos,
      valorLivre
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClient = clients.find(c => c.id === formData.clienteId);
    
    const invoiceData = {
      ...formData,
      ...calculatedValues,
      cliente: selectedClient?.razaoSocial || ''
    };

    if (invoice) {
      updateInvoice(invoice.id, invoiceData);
      toast({
        title: "Nota fiscal atualizada",
        description: "A nota fiscal foi atualizada com sucesso.",
      });
    } else {
      addInvoice(invoiceData);
      toast({
        title: "Nota fiscal criada",
        description: "A nota fiscal foi criada com sucesso.",
      });
    }

    onBack();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {invoice ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          </h2>
          <p className="text-gray-600">Preencha os dados da nota fiscal</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dados">Dados da Nota</TabsTrigger>
          <TabsTrigger value="parcelas">Próximas Parcelas</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numero">Número da Nota</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clienteId">Cliente</Label>
                      <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.razaoSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => handleInputChange('descricao', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dataEmissao">Data de Emissão</Label>
                      <Input
                        id="dataEmissao"
                        type="date"
                        value={formData.dataEmissao}
                        onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                      <Input
                        id="dataVencimento"
                        type="date"
                        value={formData.dataVencimento}
                        onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataRecebimento">Data de Recebimento</Label>
                      <Input
                        id="dataRecebimento"
                        type="date"
                        value={formData.dataRecebimento}
                        onChange={(e) => handleInputChange('dataRecebimento', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="valorBruto">Valor Bruto</Label>
                    <Input
                      id="valorBruto"
                      type="number"
                      step="0.01"
                      value={formData.valorBruto}
                      onChange={(e) => handleInputChange('valorBruto', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="numeroParcela">Número da Parcela</Label>
                      <Input
                        id="numeroParcela"
                        type="number"
                        min="1"
                        value={formData.numeroParcela}
                        onChange={(e) => handleInputChange('numeroParcela', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalParcelas">Total de Parcelas</Label>
                      <Input
                        id="totalParcelas"
                        type="number"
                        min="1"
                        value={formData.totalParcelas}
                        onChange={(e) => handleInputChange('totalParcelas', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="valorParcela">Valor da Parcela</Label>
                      <Input
                        id="valorParcela"
                        type="number"
                        step="0.01"
                        value={formData.valorParcela}
                        onChange={(e) => handleInputChange('valorParcela', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cálculos Automáticos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>IRRF (1,5%)</Label>
                      <div className="p-2 bg-gray-50 rounded">
                        {formatCurrency(calculatedValues.irrf)}
                      </div>
                    </div>
                    <div>
                      <Label>CSLL (1%)</Label>
                      <div className="p-2 bg-gray-50 rounded">
                        {formatCurrency(calculatedValues.csll)}
                      </div>
                    </div>
                    <div>
                      <Label>PIS (0,65%)</Label>
                      <div className="p-2 bg-gray-50 rounded">
                        {formatCurrency(calculatedValues.pis)}
                      </div>
                    </div>
                    <div>
                      <Label>COFINS (3%)</Label>
                      <div className="p-2 bg-gray-50 rounded">
                        {formatCurrency(calculatedValues.cofins)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Valor Emitido:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(calculatedValues.valorEmitido)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Valor Recebido:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(calculatedValues.valorRecebido)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Valor Livre de Impostos:</span>
                      <span className="font-bold text-purple-600">
                        {formatCurrency(calculatedValues.valorLivreImpostos)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Valor Livre (15%):</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(calculatedValues.valorLivre)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {invoice ? 'Atualizar' : 'Criar'} Nota Fiscal
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="parcelas">
          <UpcomingInstallments 
            valorTotal={formData.valorBruto}
            numeroParcela={formData.numeroParcela}
            totalParcelas={formData.totalParcelas}
            dataVencimento={formData.dataVencimento}
            clienteId={formData.clienteId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
