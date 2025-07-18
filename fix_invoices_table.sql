-- =====================================================
-- CORREÇÃO DA TABELA INVOICES
-- =====================================================

-- Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- Adicionar colunas faltantes (se não existirem)
DO $$ 
BEGIN
    -- Adicionar data_emissao se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'data_emissao') THEN
        ALTER TABLE invoices ADD COLUMN data_emissao DATE;
    END IF;
    
    -- Adicionar data_vencimento se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'data_vencimento') THEN
        ALTER TABLE invoices ADD COLUMN data_vencimento DATE;
    END IF;
    
    -- Adicionar data_recebimento se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'data_recebimento') THEN
        ALTER TABLE invoices ADD COLUMN data_recebimento DATE;
    END IF;
    
    -- Adicionar valor_bruto se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'valor_bruto') THEN
        ALTER TABLE invoices ADD COLUMN valor_bruto DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar irrf se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'irrf') THEN
        ALTER TABLE invoices ADD COLUMN irrf DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar csll se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'csll') THEN
        ALTER TABLE invoices ADD COLUMN csll DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar pis se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'pis') THEN
        ALTER TABLE invoices ADD COLUMN pis DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar cofins se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'cofins') THEN
        ALTER TABLE invoices ADD COLUMN cofins DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar valor_emitido se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'valor_emitido') THEN
        ALTER TABLE invoices ADD COLUMN valor_emitido DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar valor_recebido se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'valor_recebido') THEN
        ALTER TABLE invoices ADD COLUMN valor_recebido DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar valor_livre_impostos se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'valor_livre_impostos') THEN
        ALTER TABLE invoices ADD COLUMN valor_livre_impostos DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar valor_livre se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'valor_livre') THEN
        ALTER TABLE invoices ADD COLUMN valor_livre DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar cliente_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'cliente_id') THEN
        ALTER TABLE invoices ADD COLUMN cliente_id UUID;
    END IF;
    
    -- Adicionar numero_parcela se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'numero_parcela') THEN
        ALTER TABLE invoices ADD COLUMN numero_parcela INTEGER DEFAULT 1;
    END IF;
    
    -- Adicionar valor_parcela se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'valor_parcela') THEN
        ALTER TABLE invoices ADD COLUMN valor_parcela DECIMAL(15,2);
    END IF;
    
    -- Adicionar total_parcelas se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'total_parcelas') THEN
        ALTER TABLE invoices ADD COLUMN total_parcelas INTEGER DEFAULT 1;
    END IF;
    
    -- Adicionar projeto_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'projeto_id') THEN
        ALTER TABLE invoices ADD COLUMN projeto_id UUID;
    END IF;
    
    -- Adicionar tipo_projeto se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'tipo_projeto') THEN
        ALTER TABLE invoices ADD COLUMN tipo_projeto VARCHAR(100);
    END IF;
    
    -- Adicionar proposal_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'proposal_url') THEN
        ALTER TABLE invoices ADD COLUMN proposal_url TEXT;
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'updated_at') THEN
        ALTER TABLE invoices ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
END $$;

-- Adicionar foreign keys se não existirem
DO $$
BEGIN
    -- Adicionar foreign key para cliente_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'invoices_cliente_id_fkey') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_cliente_id_fkey 
        FOREIGN KEY (cliente_id) REFERENCES clients(id);
    END IF;
    
    -- Adicionar foreign key para projeto_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'invoices_projeto_id_fkey') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_projeto_id_fkey 
        FOREIGN KEY (projeto_id) REFERENCES projects(id);
    END IF;
END $$;

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_invoices FROM invoices; 