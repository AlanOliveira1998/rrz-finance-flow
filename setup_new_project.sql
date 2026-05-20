-- =====================================================
-- RRZ FINANCE FLOW — SETUP COMPLETO DO BANCO
-- Execute este arquivo no SQL Editor do novo projeto Supabase
-- =====================================================


-- =====================================================
-- STEP 1: FUNÇÃO UTILITÁRIA
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- =====================================================
-- STEP 2: TABELAS
-- =====================================================

-- Perfis de usuários (vinculado ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name      VARCHAR(255),
    email     VARCHAR(255),
    role      VARCHAR(50)  DEFAULT 'visualizador', -- 'admin', 'financeiro', 'visualizador'
    ativo     BOOLEAN      DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj         VARCHAR(18)  NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email        VARCHAR(255),
    telefone     VARCHAR(20),
    endereco     JSONB,
    ativo        BOOLEAN DEFAULT true,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj         VARCHAR(18)  NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email        VARCHAR(255),
    telefone     VARCHAR(20),
    endereco     JSONB,
    ativo        BOOLEAN DEFAULT true,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projetos
CREATE TABLE IF NOT EXISTS projects (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    descricao   TEXT,
    ativo       BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas Fiscais
CREATE TABLE IF NOT EXISTS invoices (
    id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero                VARCHAR(50)    NOT NULL,
    descricao             TEXT,
    tipo                  VARCHAR(20)    DEFAULT 'entrada', -- 'entrada', 'saida'
    status                VARCHAR(20)    DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    data_emissao          DATE           NOT NULL,
    data_vencimento       DATE           NOT NULL,
    data_recebimento      DATE,
    valor_bruto           DECIMAL(15,2)  NOT NULL,
    irrf                  DECIMAL(15,2)  DEFAULT 0,
    csll                  DECIMAL(15,2)  DEFAULT 0,
    pis                   DECIMAL(15,2)  DEFAULT 0,
    cofins                DECIMAL(15,2)  DEFAULT 0,
    valor_emitido         DECIMAL(15,2)  DEFAULT 0,
    valor_recebido        DECIMAL(15,2)  DEFAULT 0,
    valor_livre_impostos  DECIMAL(15,2)  DEFAULT 0,
    valor_livre           DECIMAL(15,2)  DEFAULT 0,
    cliente_id            UUID REFERENCES clients(id),
    cliente               VARCHAR(255),
    numero_parcela        INTEGER        DEFAULT 1,
    valor_parcela         DECIMAL(15,2),
    total_parcelas        INTEGER        DEFAULT 1,
    projeto_id            UUID REFERENCES projects(id),
    projeto               VARCHAR(255),
    tipo_projeto          VARCHAR(100),
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parcelas emitidas
CREATE TABLE IF NOT EXISTS emitted_installments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id      UUID REFERENCES invoices(id),
    numero_nota     VARCHAR(50)   NOT NULL,
    numero_parcela  INTEGER       NOT NULL,
    total_parcelas  INTEGER       NOT NULL,
    valor_parcela   DECIMAL(15,2) NOT NULL,
    data_emissao    DATE          NOT NULL,
    data_vencimento DATE          NOT NULL,
    data_pagamento  DATE,
    status          VARCHAR(20)   DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    cliente_id      UUID REFERENCES clients(id),
    cliente         VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(numero_nota, numero_parcela)
);

-- Contas a pagar (boletos)
CREATE TABLE IF NOT EXISTS pay_bills (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fornecedor_id  UUID REFERENCES suppliers(id),
    mes_referencia VARCHAR(7),  -- formato: YYYY-MM
    data_vencimento DATE,
    data_pagamento  DATE,
    categoria      VARCHAR(100),
    valor          DECIMAL(15,2),
    status         VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Propostas
CREATE TABLE IF NOT EXISTS proposals (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id    UUID REFERENCES clients(id),
    project_id   UUID REFERENCES projects(id),
    valor        DECIMAL(15,2),
    status       VARCHAR(20) DEFAULT 'rascunho', -- 'rascunho', 'enviado', 'assinado', 'rejeitado'
    docusign_id  VARCHAR(255),
    observacoes  TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de atividade
CREATE TABLE IF NOT EXISTS activity_logs (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id),
    user_name   VARCHAR(255),
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'invoice', 'project', etc.
    entity_id   UUID,
    entity_name VARCHAR(255),
    details     JSONB,
    timestamp   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist de rotinas (por usuário)
CREATE TABLE IF NOT EXISTS checklists (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text       TEXT    NOT NULL,
    done       BOOLEAN NOT NULL DEFAULT false,
    type       TEXT    NOT NULL CHECK (type IN ('Diário', 'Semanal', 'Mensal')),
    due_date   DATE,
    priority   INTEGER DEFAULT 0,
    tags       TEXT[]  DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tarefas do Kanban (por usuário)
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    status     TEXT NOT NULL CHECK (status IN ('todo', 'doing', 'done', 'lembretes', 'reunioes')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =====================================================
-- STEP 3: ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clients_cnpj         ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_razao_social  ON clients(razao_social);
CREATE INDEX IF NOT EXISTS idx_clients_ativo         ON clients(ativo);

CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj        ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_razao_social ON suppliers(razao_social);
CREATE INDEX IF NOT EXISTS idx_suppliers_ativo        ON suppliers(ativo);

CREATE INDEX IF NOT EXISTS idx_projects_nome         ON projects(nome);
CREATE INDEX IF NOT EXISTS idx_projects_ativo        ON projects(ativo);

CREATE INDEX IF NOT EXISTS idx_invoices_numero           ON invoices(numero);
CREATE INDEX IF NOT EXISTS idx_invoices_status           ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_data_emissao     ON invoices(data_emissao);
CREATE INDEX IF NOT EXISTS idx_invoices_data_vencimento  ON invoices(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_invoices_cliente_id       ON invoices(cliente_id);
CREATE INDEX IF NOT EXISTS idx_invoices_projeto_id       ON invoices(projeto_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tipo             ON invoices(tipo);

CREATE INDEX IF NOT EXISTS idx_emitted_numero_nota      ON emitted_installments(numero_nota);
CREATE INDEX IF NOT EXISTS idx_emitted_status           ON emitted_installments(status);
CREATE INDEX IF NOT EXISTS idx_emitted_data_vencimento  ON emitted_installments(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_emitted_cliente_id       ON emitted_installments(cliente_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id     ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp   ON activity_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_checklists_user_id    ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_id  ON kanban_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_bills_fornecedor  ON pay_bills(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client      ON proposals(client_id);


-- =====================================================
-- STEP 4: TRIGGERS DE UPDATED_AT
-- =====================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emitted_installments_updated_at
    BEFORE UPDATE ON emitted_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pay_bills_updated_at
    BEFORE UPDATE ON pay_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
    BEFORE UPDATE ON checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE emitted_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_bills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks         ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuário vê/edita somente o próprio perfil
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
-- admin pode ver todos os perfis (necessário para UserManagement)
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- demais tabelas: qualquer usuário autenticado tem acesso total
CREATE POLICY "clients_all"              ON clients              FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "suppliers_all"            ON suppliers            FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_all"             ON projects             FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "invoices_all"             ON invoices             FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "emitted_installments_all" ON emitted_installments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "pay_bills_all"            ON pay_bills            FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "proposals_all"            ON proposals            FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "checklists_all"           ON checklists           FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "kanban_tasks_all"         ON kanban_tasks         FOR ALL USING (auth.uid() IS NOT NULL);

-- activity_logs: leitura para autenticados, escrita sempre liberada (sistema)
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (true);


-- =====================================================
-- STEP 6: TRIGGER AUTOMÁTICO DE PERFIL NO CADASTRO
-- Cria o registro em `profiles` quando um usuário se cadastra
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'visualizador'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
