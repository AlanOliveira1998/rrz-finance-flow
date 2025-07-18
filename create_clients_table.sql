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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_razao_social ON clients(razao_social);
CREATE INDEX IF NOT EXISTS idx_clients_ativo ON clients(ativo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso autenticado
CREATE POLICY "Users can view their own clients" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_clients FROM clients;

-- Listar todos os clientes (se houver)
SELECT * FROM clients ORDER BY created_at DESC; 