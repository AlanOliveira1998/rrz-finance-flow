
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onBack: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onBack }) => {
  const { addInvoice, updateInvoice, loading } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
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
    totalParcelas: 1,
    projetoId: '',
    tipoProjeto: '',
  });

  const [calculatedValues, setCalculatedValues] = useState({
    irrf: 0,
    csll: 0,
    pis: 0,
    cofins: 0,
    totalImpostos: 0,
    valorEmitido: 0,
    valorRecebido: 0,
    valorLivreImpostos: 0,
    valorLivre: 0,
    valorParcela: 0
  });

  // Remover os estados relacionados a proposta
  // const [proposalFile, setProposalFile] = useState<File | null>(null);
  // const [proposalUrl, setProposalUrl] = useState<string | null>(invoice?.proposalUrl || null);
  // Adicionar estado para o checkbox
  const [deduzirPisCofins, setDeduzirPisCofins] = useState(true);

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
        totalParcelas: invoice.totalParcelas || 1,
        projetoId: invoice.projetoId || '',
        tipoProjeto: invoice.tipoProjeto || '',
      });
    }
  }, [invoice]);

  useEffect(() => {
    calculateTaxes();
  }, [formData.valorBruto, formData.totalParcelas]);

  const calculateTaxes = () => {
    const valorBruto = formData.valorBruto;
    const irrf = valorBruto * 0.015; // 1,5%
    const csll = valorBruto * 0.01; // 1%
    // No cálculo dos impostos, use o estado do checkbox:
    const pis = deduzirPisCofins ? formData.valorBruto * 0.0065 : 0;
    const cofins = deduzirPisCofins ? formData.valorBruto * 0.03 : 0;
    
    const totalImpostos = irrf + csll + pis + cofins;
    const valorEmitido = valorBruto - totalImpostos;
    const valorLivreImpostos = valorBruto - totalImpostos; // valor líquido real
    const valorLivre = valorBruto * 0.85; // 15% livre
    const valorParcela = formData.totalParcelas > 0 ? valorBruto / formData.totalParcelas : 0;

    setCalculatedValues({
      irrf,
      csll,
      pis,
      cofins,
      totalImpostos,
      valorEmitido,
      valorRecebido: formData.status === 'pago' ? valorEmitido : 0,
      valorLivreImpostos,
      valorLivre,
      valorParcela
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Remover lógica de upload de proposta do handleSubmit
      const selectedClient = clients.find(c => c.id === formData.clienteId);
      const selectedProject = projects.find(p => p.id === formData.projetoId);
      // No envio dos dados (handleSubmit), envie os valores de pis e cofins conforme o checkbox e os demais campos de impostos de calculatedValues:
      const invoiceData = {
        ...formData,
        irrf: calculatedValues.irrf,
        csll: calculatedValues.csll,
        pis: visualPis,
        cofins: visualCofins,
        valorEmitido: calculatedValues.valorEmitido,
        valorRecebido: calculatedValues.valorRecebido,
        valorLivreImpostos: calculatedValues.valorLivreImpostos,
        valorLivre: calculatedValues.valorLivre,
        cliente: selectedClient?.razaoSocial || '',
        projeto: selectedProject?.nome || '',
        tipoProjeto: formData.tipoProjeto,
        // Corrigir campos de data para null se vazio
        dataEmissao: formData.dataEmissao || null,
        dataVencimento: formData.dataVencimento || null,
        dataRecebimento: formData.dataRecebimento || null,
      };
      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
        toast({
          title: "Nota fiscal atualizada",
          description: "A nota fiscal foi atualizada com sucesso.",
        });
      } else {
        await addInvoice(invoiceData);
        toast({
          title: "Nota fiscal criada",
          description: "A nota fiscal foi criada com sucesso.",
        });
        // Limpar formulário após cadastrar nova nota
        setFormData({
          numero: '',
          descricao: '',
          tipo: 'entrada',
          status: 'pendente',
          dataEmissao: '',
          dataVencimento: '',
          dataRecebimento: '',
          valorBruto: 0,
          clienteId: '',
          numeroParcela: 1,
          totalParcelas: 1,
          projetoId: '',
          tipoProjeto: '',
        });
        setDeduzirPisCofins(true);
        // Não chama onBack, permanece na tela
      }
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a nota fiscal.",
        variant: "destructive"
      });
    } finally {
      // Remover: setLoading(false);
    }
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

  // No cálculo automático, use o valor do checkbox para exibir PIS e COFINS como zero se desmarcado
  const visualPis = deduzirPisCofins ? calculatedValues.pis : 0;
  const visualCofins = deduzirPisCofins ? calculatedValues.cofins : 0;
  const visualTotalImpostos = calculatedValues.irrf + calculatedValues.csll + visualPis + visualCofins;

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
                      {clients.filter(client => client.ativo).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razaoSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tipoProjeto">Tipo de Projeto</Label>
                <Select value={formData.tipoProjeto} onValueChange={(value) => handleInputChange('tipoProjeto', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Escopo Fechado">Escopo Fechado</SelectItem>
                    <SelectItem value="Assessoria Continua - Banco de Horas">Assessoria Continua - Banco de Horas</SelectItem>
                    <SelectItem value="Assessoria Continua - Por Demanda">Assessoria Continua - Por Demanda</SelectItem>
                    <SelectItem value="Processos e Controles">Processos e Controles</SelectItem>
                    <SelectItem value="Offshore">Offshore</SelectItem>
                    <SelectItem value="Não Financeiro">Não Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="projetoId">Projeto</Label>
                <Select value={formData.projetoId} onValueChange={(value) => handleInputChange('projetoId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(project => project.ativo).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="descricao">Observação</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Observação (opcional)"
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

              <div className="grid grid-cols-2 gap-4">
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
                    {formatCurrency(visualPis)}
                  </div>
                </div>
                <div>
                  <Label>COFINS (3%)</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {formatCurrency(visualCofins)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={deduzirPisCofins}
                    onChange={e => setDeduzirPisCofins(e.target.checked)}
                    id="deduzir-pis-cofins"
                  />
                  <label htmlFor="deduzir-pis-cofins" className="text-sm">Deduzir PIS e COFINS</label>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-lg">Total de Impostos:</span>
                  <span className="font-bold text-red-600 text-lg">
                    {formatCurrency(visualTotalImpostos)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-lg">Valor Emitido:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency(calculatedValues.valorEmitido)}
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading} aria-label="Salvar Nota Fiscal">
            {loading ? (invoice ? 'Atualizando...' : 'Criando...') : (invoice ? 'Atualizar' : 'Criar')} Nota Fiscal
          </Button>
        </div>
      </form>
    </div>
  );
};
