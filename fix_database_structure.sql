-- =====================================================
-- CORREÇÃO DA ESTRUTURA DO BANCO - BASEADO NO SCHEMA REAL
-- =====================================================

-- 1. CORRIGIR TABELA CLIENTS
-- Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
        ALTER TABLE clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. CORRIGIR TABELA INVOICES
-- Remover colunas duplicadas e padronizar
DO $$ 
BEGIN
    -- Remover client_id (usar cliente_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'client_id') THEN
        -- Migrar dados se necessário
        UPDATE invoices SET cliente_id = client_id WHERE cliente_id IS NULL AND client_id IS NOT NULL;
        ALTER TABLE invoices DROP COLUMN client_id;
    END IF;
    
    -- Remover project_id (usar projeto_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'project_id') THEN
        -- Migrar dados se necessário
        UPDATE invoices SET projeto_id = project_id WHERE projeto_id IS NULL AND project_id IS NOT NULL;
        ALTER TABLE invoices DROP COLUMN project_id;
    END IF;
    
    -- Remover parcelas (usar total_parcelas)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'parcelas') THEN
        -- Migrar dados se necessário
        UPDATE invoices SET total_parcelas = parcelas WHERE total_parcelas IS NULL AND parcelas IS NOT NULL;
        ALTER TABLE invoices DROP COLUMN parcelas;
    END IF;
    
    -- Remover proposalurl (usar proposal_url)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'proposalurl') THEN
        -- Migrar dados se necessário
        UPDATE invoices SET proposal_url = proposalurl WHERE proposal_url IS NULL AND proposalurl IS NOT NULL;
        ALTER TABLE invoices DROP COLUMN proposalurl;
    END IF;
    
    -- Remover valor_liquido (usar valor_livre_impostos)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'valor_liquido') THEN
        -- Migrar dados se necessário
        UPDATE invoices SET valor_livre_impostos = valor_liquido WHERE valor_livre_impostos IS NULL AND valor_liquido IS NOT NULL;
        ALTER TABLE invoices DROP COLUMN valor_liquido;
    END IF;
    
    -- Adicionar colunas faltantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'descricao') THEN
        ALTER TABLE invoices ADD COLUMN descricao TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'tipo') THEN
        ALTER TABLE invoices ADD COLUMN tipo VARCHAR(20) DEFAULT 'entrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'cliente') THEN
        ALTER TABLE invoices ADD COLUMN cliente VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'projeto') THEN
        ALTER TABLE invoices ADD COLUMN projeto VARCHAR(255);
    END IF;
END $$;

-- 3. REMOVER TABELA TAXES (dados já estão em invoices)
DROP TABLE IF EXISTS taxes;

-- 4. RENOMEAR TABELA LOGS PARA ACTIVITY_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
        ALTER TABLE logs RENAME TO activity_logs;
    END IF;
END $$;

-- 5. CORRIGIR TABELA ACTIVITY_LOGS
DO $$
BEGIN
    -- Renomear colunas para padrão
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activity_logs' AND column_name = 'tipo') THEN
        ALTER TABLE activity_logs RENAME COLUMN tipo TO entity_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activity_logs' AND column_name = 'acao') THEN
        ALTER TABLE activity_logs RENAME COLUMN acao TO action_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activity_logs' AND column_name = 'referencia_id') THEN
        ALTER TABLE activity_logs RENAME COLUMN referencia_id TO entity_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activity_logs' AND column_name = 'descricao') THEN
        ALTER TABLE activity_logs RENAME COLUMN descricao TO entity_name;
    END IF;
    
    -- Adicionar colunas faltantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activity_logs' AND column_name = 'user_name') THEN
        ALTER TABLE activity_logs ADD COLUMN user_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activity_logs' AND column_name = 'details') THEN
        ALTER TABLE activity_logs ADD COLUMN details JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activity_logs' AND column_name = 'updated_at') THEN
        ALTER TABLE activity_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. CRIAR TABELA EMITTED_INSTALLMENTS (se não existir)
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
    status VARCHAR(20) DEFAULT 'pendente',
    cliente_id UUID REFERENCES clients(id),
    cliente VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(numero_nota, numero_parcela)
);

-- 7. ADICIONAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_razao_social ON clients(razao_social);
CREATE INDEX IF NOT EXISTS idx_clients_ativo ON clients(ativo);

CREATE INDEX IF NOT EXISTS idx_projects_nome ON projects(nome);
CREATE INDEX IF NOT EXISTS idx_projects_ativo ON projects(ativo);

CREATE INDEX IF NOT EXISTS idx_invoices_numero ON invoices(numero);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_data_emissao ON invoices(data_emissao);
CREATE INDEX IF NOT EXISTS idx_invoices_data_vencimento ON invoices(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_invoices_cliente_id ON invoices(cliente_id);
CREATE INDEX IF NOT EXISTS idx_invoices_projeto_id ON invoices(projeto_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tipo ON invoices(tipo);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_emitted_installments_numero_nota ON emitted_installments(numero_nota);
CREATE INDEX IF NOT EXISTS idx_emitted_installments_status ON emitted_installments(status);
CREATE INDEX IF NOT EXISTS idx_emitted_installments_data_vencimento ON emitted_installments(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_emitted_installments_cliente_id ON emitted_installments(cliente_id);

-- 8. HABILITAR ROW LEVEL SECURITY
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emitted_installments ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS DE ACESSO
-- Políticas para clients
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON clients;
CREATE POLICY "Authenticated users can manage clients" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para projects
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
CREATE POLICY "Authenticated users can manage projects" ON projects
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para invoices
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
CREATE POLICY "Authenticated users can manage invoices" ON invoices
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para activity_logs
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON activity_logs;
CREATE POLICY "Authenticated users can view activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para emitted_installments
DROP POLICY IF EXISTS "Authenticated users can manage installments" ON emitted_installments;
CREATE POLICY "Authenticated users can manage installments" ON emitted_installments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 10. CRIAR TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON activity_logs;
CREATE TRIGGER update_activity_logs_updated_at BEFORE UPDATE ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emitted_installments_updated_at ON emitted_installments;
CREATE TRIGGER update_emitted_installments_updated_at BEFORE UPDATE ON emitted_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. VERIFICAÇÃO FINAL
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'projects', 'invoices', 'activity_logs', 'emitted_installments')
ORDER BY table_name;

-- Verificar contagem de registros
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
SELECT 'emitted_installments' as table_name, COUNT(*) as total_records FROM emitted_installments; 