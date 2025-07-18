
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2 } from 'lucide-react';

export const ClientForm = () => {
  const { addClient, getClientByCnpj } = useClients();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    email: '',
    telefone: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: ''
    },
    ativo: true
  });

  const handleCnpjSearch = async () => {
    if (!formData.cnpj) {
      toast({
        title: "CNPJ obrigatório",
        description: "Por favor, digite um CNPJ para consultar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const clientData = await getClientByCnpj(formData.cnpj);
      console.log('Client data received:', clientData);
      
      setFormData(prev => ({
        ...prev,
        razaoSocial: clientData.razaoSocial || '',
        nomeFantasia: clientData.nomeFantasia || '',
        email: clientData.email || '',
        telefone: clientData.telefone || '',
        endereco: {
          logradouro: clientData.endereco?.logradouro || '',
          numero: clientData.endereco?.numero || '',
          complemento: clientData.endereco?.complemento || '',
          bairro: clientData.endereco?.bairro || '',
          cidade: clientData.endereco?.cidade || '',
          uf: clientData.endereco?.uf || '',
          cep: clientData.endereco?.cep || ''
        }
      }));
      
      toast({
        title: "CNPJ encontrado",
        description: "Dados preenchidos automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "CNPJ não encontrado ou inválido.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cnpj || !formData.razaoSocial) {
      toast({
        title: "Campos obrigatórios",
        description: "CNPJ e Razão Social são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simula loading
      addClient(formData);
      toast({
        title: "Cliente cadastrado",
        description: "Cliente foi cadastrado com sucesso.",
      });

      // Reset form
      setFormData({
        cnpj: '',
        razaoSocial: '',
        nomeFantasia: '',
        email: '',
        telefone: '',
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        },
        ativo: true
      });
    } catch (e) {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o cliente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Cadastro de Clientes</h2>
        <p className="text-gray-600">Cadastre novos clientes usando o CNPJ</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-end mb-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading} aria-label="Cadastrar Cliente">
            {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleCnpjSearch}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                    aria-label="Buscar CNPJ"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                <Input
                  id="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.endereco.logradouro}
                    onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco.numero}
                    onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.endereco.complemento}
                  onChange={(e) => handleInputChange('endereco.complemento', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco.bairro}
                    onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco.cep}
                    onChange={(e) => handleInputChange('endereco.cep', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco.cidade}
                    onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={formData.endereco.uf}
                    onChange={(e) => handleInputChange('endereco.uf', e.target.value)}
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};
