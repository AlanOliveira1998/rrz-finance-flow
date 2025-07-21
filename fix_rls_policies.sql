-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- 1. VERIFICAR STATUS ATUAL DAS POLÍTICAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'projects', 'invoices', 'activity_logs', 'emitted_installments')
ORDER BY tablename, policyname;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'projects', 'invoices', 'activity_logs', 'emitted_installments')
ORDER BY tablename;

-- 3. REMOVER POLÍTICAS EXISTENTES E RECRIAR
-- Clients
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON clients;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON clients;

-- Projects
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
DROP POLICY IF EXISTS "Enable update for users based on email" ON projects;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON projects;

-- Invoices
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON invoices;
DROP POLICY IF EXISTS "Enable update for users based on email" ON invoices;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON invoices;

-- Activity Logs
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON activity_logs;

-- Emitted Installments
DROP POLICY IF EXISTS "Authenticated users can manage installments" ON emitted_installments;
DROP POLICY IF EXISTS "Enable read access for all users" ON emitted_installments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON emitted_installments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON emitted_installments;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON emitted_installments;

-- 4. CRIAR NOVAS POLÍTICAS MAIS PERMISSIVAS PARA TESTE
-- Política temporária para clients (permitir tudo para usuários autenticados)
CREATE POLICY "temp_clients_policy" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política temporária para projects
CREATE POLICY "temp_projects_policy" ON projects
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política temporária para invoices
CREATE POLICY "temp_invoices_policy" ON invoices
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política temporária para activity_logs
CREATE POLICY "temp_activity_logs_policy" ON activity_logs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política temporária para emitted_installments
CREATE POLICY "temp_emitted_installments_policy" ON emitted_installments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'projects', 'invoices', 'activity_logs', 'emitted_installments')
ORDER BY tablename, policyname;

-- 6. TESTE DE INSERÇÃO (executar manualmente)
-- INSERT INTO clients (cnpj, razao_social, nome_fantasia, email, telefone, endereco, ativo)
-- VALUES ('12345678000199', 'EMPRESA TESTE LTDA', 'TESTE', 'teste@teste.com', '(11) 99999-9999', 
--         '{"logradouro": "Rua Teste", "numero": "123", "complemento": "", "bairro": "Centro", "cidade": "São Paulo", "uf": "SP", "cep": "01001-000"}', 
--         true);

-- 7. SE NECESSÁRIO, DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE emitted_installments DISABLE ROW LEVEL SECURITY;

-- 8. VERIFICAR STATUS FINAL
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'projects', 'invoices', 'activity_logs', 'emitted_installments')
ORDER BY tablename; 