-- Verificar estrutura atual da tabela invoices
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- Verificar se a tabela invoices existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'invoices'
);

-- Verificar dados de exemplo na tabela invoices (se existir)
SELECT * FROM invoices LIMIT 1; 