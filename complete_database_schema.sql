-- =====================================================
-- SCHEMA COMPLETO DO SISTEMA FINANCEIRO RRZ
-- =====================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS (já existe)
-- Verificar se a tabela profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
);

-- Criar a tabela profiles se ela não existir
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'leitura',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE CLIENTES (já existe)
-- Verificar se a tabela clients existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'clients'
);

-- Criar a tabela clients se ela não existir
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco JSONB,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.1. TABELA DE FORNECEDORES (nova)
-- Verificar se a tabela suppliers existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'suppliers'
);

-- Criar a tabela suppliers se ela não existir
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco JSONB,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PROJETOS (já existe)
-- Verificar se a tabela projects existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'projects'
);

-- Criar a tabela projects se ela não existir
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE NOTAS FISCAIS (já existe)
-- Verificar se a tabela invoices existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'invoices'
);

-- Criar a tabela invoices se ela não existir
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'entrada', -- 'entrada' ou 'saida'
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    valor_bruto DECIMAL(15,2) NOT NULL,
    irrf DECIMAL(15,2) DEFAULT 0,
    csll DECIMAL(15,2) DEFAULT 0,
    pis DECIMAL(15,2) DEFAULT 0,
    cofins DECIMAL(15,2) DEFAULT 0,
    valor_emitido DECIMAL(15,2) DEFAULT 0,
    valor_recebido DECIMAL(15,2) DEFAULT 0,
    valor_livre_impostos DECIMAL(15,2) DEFAULT 0,
    valor_livre DECIMAL(15,2) DEFAULT 0,
    cliente_id UUID REFERENCES clients(id),
    cliente VARCHAR(255),
    numero_parcela INTEGER DEFAULT 1,
    valor_parcela DECIMAL(15,2),
    total_parcelas INTEGER DEFAULT 1,
    projeto_id UUID REFERENCES projects(id),
    projeto VARCHAR(255),
    tipo_projeto VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE LOGS DE ALTERAÇÕES (nova)
-- Verificar se a tabela activity_logs existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'activity_logs'
);

-- Criar a tabela activity_logs se ela não existir
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'invoice', 'project'
    entity_id UUID,
    entity_name VARCHAR(255),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE PARCELAS EMITIDAS (nova)
-- Verificar se a tabela emitted_installments existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'emitted_installments'
);

-- Criar a tabela emitted_installments se ela não existir
CREATE TABLE IF NOT EXISTS emitted_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id),
    numero_nota VARCHAR(50) NOT NULL,
    numero_parcela INTEGER NOT NULL,
    total_parcelas INTEGER NOT NULL,
    valor_parcela DECIMAL(15,2) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    cliente_id UUID REFERENCES clients(id),
    cliente VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(numero_nota, numero_parcela)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_razao_social ON clients(razao_social);
CREATE INDEX IF NOT EXISTS idx_clients_ativo ON clients(ativo);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_nome ON projects(nome);
CREATE INDEX IF NOT EXISTS idx_projects_ativo ON projects(ativo);

-- Índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_numero ON invoices(numero);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_data_emissao ON invoices(data_emissao);
CREATE INDEX IF NOT EXISTS idx_invoices_data_vencimento ON invoices(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_invoices_cliente_id ON invoices(cliente_id);
CREATE INDEX IF NOT EXISTS idx_invoices_projeto_id ON invoices(projeto_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tipo ON invoices(tipo);

-- Índices para activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Índices para emitted_installments
CREATE INDEX IF NOT EXISTS idx_emitted_installments_numero_nota ON emitted_installments(numero_nota);
CREATE INDEX IF NOT EXISTS idx_emitted_installments_status ON emitted_installments(status);
CREATE INDEX IF NOT EXISTS idx_emitted_installments_data_vencimento ON emitted_installments(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_emitted_installments_cliente_id ON emitted_installments(cliente_id);

-- Índices para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_razao_social ON suppliers(razao_social);
CREATE INDEX IF NOT EXISTS idx_suppliers_ativo ON suppliers(ativo);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emitted_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para clients
CREATE POLICY "Authenticated users can manage clients" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para projects
CREATE POLICY "Authenticated users can manage projects" ON projects
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para invoices
CREATE POLICY "Authenticated users can manage invoices" ON invoices
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para activity_logs
CREATE POLICY "Authenticated users can view activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para emitted_installments
CREATE POLICY "Authenticated users can manage installments" ON emitted_installments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para suppliers
CREATE POLICY "Authenticated users can manage suppliers" ON suppliers
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emitted_installments_updated_at BEFORE UPDATE ON emitted_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar todas as tabelas criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'projects', 'invoices', 'activity_logs', 'emitted_installments', 'suppliers')
ORDER BY table_name;

-- Verificar contagem de registros em cada tabela
SELECT 'profiles' as table_name, COUNT(*) as total_records FROM profiles
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as total_records FROM clients
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as total_records FROM projects
UNION ALL
SELECT 'invoices' as table_name, COUNT(*) as total_records FROM invoices
UNION ALL
SELECT 'activity_logs' as table_name, COUNT(*) as total_records FROM activity_logs
UNION ALL
SELECT 'emitted_installments' as table_name, COUNT(*) as total_records FROM emitted_installments
UNION ALL
SELECT 'suppliers' as table_name, COUNT(*) as total_records FROM suppliers; 