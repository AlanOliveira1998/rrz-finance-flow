
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ClientList } from '@/components/clients/ClientList';
import { ClientForm } from '@/components/clients/ClientForm';
import { Reports } from '@/components/reports/Reports';
import { UserManagement } from '@/components/admin/UserManagement';
import { Invoice } from '@/hooks/useInvoices';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaxesList } from '@/components/taxes/TaxesList';
import { Client } from '@/hooks/useClients';
import { Project } from '@/hooks/useProjects';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const LogsPanel = () => {
  const [logs, setLogs] = React.useState<any[]>([]);
  React.useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem('rrz_logs') || '[]').reverse());
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Histórico de Alterações</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Data/Hora</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Usuário</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Tipo</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Ação</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Detalhes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">Nenhuma alteração registrada.</td></tr>
            )}
            {logs.map((log, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.user}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.type}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.action}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {log.type === 'cliente' && log.razaoSocial && `Cliente: ${log.razaoSocial}`}
                  {log.type === 'nota' && log.numero && `Nota: ${log.numero}`}
                  {log.type === 'projeto' && log.nome && `Projeto: ${log.nome}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Novo componente de cadastro de fornecedores
const SupplierForm = () => {
  const [doc, setDoc] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [fields, setFields] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    ativo: true,
  });
  function isCNPJ(value: string) {
    return value.replace(/\D/g, '').length === 14;
  }
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoc(e.target.value);
    setError(null);
  };
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };
  const handleAutoFill = async () => {
    setAutoFillLoading(true);
    setError(null);
    const cleanDoc = doc.replace(/\D/g, '');
    if (isCNPJ(cleanDoc)) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`);
        if (!res.ok) {
          setError('CNPJ não encontrado na BrasilAPI. Preencha manualmente.');
          setAutoFillLoading(false);
          return;
        }
        const data = await res.json();
        setFields({
          ...fields,
          cnpj: cleanDoc,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          email: (data.qsa && data.qsa[0]?.nome) || '',
          telefone: data.telefone || '',
          endereco: data.descricao_tipo_de_logradouro && data.logradouro ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}` : '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || '',
          ativo: data.situacao_cadastral === 'ATIVA',
        });
      } catch (err) {
        setError('Erro ao buscar dados do CNPJ. Preencha manualmente.');
      }
    } else {
      setError('Digite um CNPJ válido para busca automática.');
    }
    setAutoFillLoading(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Usuário não está autenticado. Faça login novamente.');
        setLoading(false);
        return;
      }
      // Montar payload
      const payload = {
        cnpj: doc.replace(/\D/g, ''),
        razao_social: fields.razao_social,
        nome_fantasia: fields.nome_fantasia,
        email: fields.email,
        telefone: fields.telefone,
        endereco: JSON.stringify({
          logradouro: fields.endereco,
          numero: fields.numero,
          complemento: fields.complemento,
          bairro: fields.bairro,
          cidade: fields.cidade,
          uf: fields.uf,
          cep: fields.cep,
        }),
        ativo: fields.ativo,
      };
      const { data, error: supaError } = await supabase.from('suppliers').insert([payload]).select();
      if (supaError) {
        setError(supaError.message);
        toast({ title: 'Erro ao cadastrar fornecedor', description: supaError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Fornecedor cadastrado!', description: 'O fornecedor foi cadastrado com sucesso.' });
        setDoc('');
        setFields({
          cnpj: '', razao_social: '', nome_fantasia: '', email: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', ativo: true
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar fornecedor.');
      toast({ title: 'Erro ao cadastrar fornecedor', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Cadastro de Fornecedor</h2>
          <p className="text-gray-600">Preencha os dados do fornecedor</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">CNPJ *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={doc}
                  onChange={handleDocChange}
                  placeholder="Digite o CNPJ (apenas números)"
                  required
                  className="pl-3 w-full border rounded px-2 py-1"
                />
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={autoFillLoading || !isCNPJ(doc)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {autoFillLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Razão Social *</label>
              <input name="razao_social" value={fields.razao_social} onChange={handleFieldChange} placeholder="Razão social da empresa" required className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input name="nome_fantasia" value={fields.nome_fantasia} onChange={handleFieldChange} placeholder="Nome fantasia (opcional)" className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input name="email" value={fields.email} onChange={handleFieldChange} placeholder="E-mail de contato" type="email" className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <input name="telefone" value={fields.telefone} onChange={handleFieldChange} placeholder="Telefone" className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Logradouro</label>
              <input name="endereco" value={fields.endereco} onChange={handleFieldChange} placeholder="Rua, avenida..." className="w-full border rounded px-2 py-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input name="numero" value={fields.numero} onChange={handleFieldChange} placeholder="Número" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                <input name="complemento" value={fields.complemento} onChange={handleFieldChange} placeholder="Apto, sala, etc." className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input name="bairro" value={fields.bairro} onChange={handleFieldChange} placeholder="Bairro" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input name="cidade" value={fields.cidade} onChange={handleFieldChange} placeholder="Cidade" className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">UF</label>
                <input name="uf" value={fields.uf} onChange={handleFieldChange} placeholder="UF" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <input name="cep" value={fields.cep} onChange={handleFieldChange} placeholder="CEP" className="w-full border rounded px-2 py-1" />
              </div>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm font-semibold text-center border border-red-200 bg-red-50 rounded-md py-2">{error}</div>}
        <div className="flex justify-end space-x-4">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded" disabled={loading} >{loading ? 'Salvando...' : 'Cadastrar Fornecedor'}</button>
        </div>
      </form>
    </div>
  );
};

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase.from('suppliers').select('*').then(({ data, error }) => {
      if (error) setError(error.message);
      else setSuppliers(data || []);
      setLoading(false);
    });
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Fornecedores RRZ</h2>
      <p className="text-gray-600">Lista de fornecedores cadastrados</p>
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-4">{error}</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum fornecedor cadastrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">CNPJ</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Razão Social</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Nome Fantasia</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">E-mail</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Telefone</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Ativo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="px-2 py-1 whitespace-nowrap">{s.cnpj}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{s.razao_social}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{s.nome_fantasia}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{s.email}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{s.telefone}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{s.ativo ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map URL path to tab
  const path = location.pathname.replace(/^\/dashboard\/?/, '') || 'dashboard';

  // Função para navegar ao trocar de aba
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        navigate('/dashboard'); break;
      case 'clients':
        navigate('/dashboard/clients'); break;
      case 'new-client':
        navigate('/dashboard/new-client'); break;
      case 'projects':
        navigate('/dashboard/projects'); break;
      case 'new-project':
        navigate('/dashboard/new-project'); break;
      case 'invoices':
        navigate('/dashboard/invoices'); break;
      case 'new-invoice':
        navigate('/dashboard/new-invoice'); break;
      case 'reports':
        navigate('/dashboard/reports'); break;
      case 'users':
        navigate('/dashboard/users'); break;
      case 'taxes':
        navigate('/dashboard/taxes'); break;
      case 'logs':
        navigate('/dashboard/logs'); break;
      default:
        navigate('/dashboard');
    }
  };

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    navigate('/dashboard/new-invoice');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    navigate('/dashboard/new-client');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    // setActiveTab('clients'); // Removed
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    // setActiveTab('new-project'); // Removed
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    // setActiveTab('projects'); // Removed
  };

  const renderContent = () => {
    // Removed switch statement based on activeTab
    return (
      <Routes>
        <Route path="" element={<DashboardOverview />} />
        <Route path="clients" element={<ClientList onEdit={handleEditClient} />} />
        <Route path="new-client" element={<ClientForm client={selectedClient} onBack={handleBackToClients} />} />
        <Route path="projects" element={<ProjectList onEdit={handleEditProject} />} />
        <Route path="new-project" element={<ProjectForm project={selectedProject} onBack={handleBackToProjects} />} />
        <Route path="invoices" element={<InvoiceList onEdit={handleEditInvoice} />} />
        <Route path="new-invoice" element={<InvoiceForm invoice={selectedInvoice} onBack={() => navigate('/dashboard/invoices')} />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="taxes" element={<TaxesList />} />
        <Route path="logs" element={<LogsPanel />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };

  // Adicionar lógica para exibir DashboardOverview na aba Contas a Receber
  if (location.search.includes('tab=receber')) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={path} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <DashboardOverview />
          </main>
        </div>
      </div>
    );
  }

  // Adicionar lógica para exibir página inicial em branco na aba Contas a Pagar
  if (location.search.includes('tab=pagar')) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={path} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Contas a Pagar</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border-0 rounded shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pago</p>
                      <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
                    </div>
                    <div className="text-2xl">✔️</div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-0 rounded shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">A Pagar</p>
                      <p className="text-2xl font-bold text-yellow-600">R$ 0,00</p>
                    </div>
                    <div className="text-2xl">💸</div>
                  </div>
                </div>
                <div className="bg-red-50 border-0 rounded shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vencido</p>
                      <p className="text-2xl font-bold text-red-600">R$ 0,00</p>
                    </div>
                    <div className="text-2xl">⚠️</div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Renderizar SupplierForm na aba de cadastro de fornecedores
  if (location.search.includes('tab=pagar') && path === 'fornecedor-cadastro') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={path} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <SupplierForm />
          </main>
        </div>
      </div>
    );
  }

  // Renderizar SupplierList na aba de lista de fornecedores
  if (location.search.includes('tab=pagar') && path === 'fornecedor-lista') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={path} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <SupplierList />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={path} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
