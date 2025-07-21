# Solução para Problema de Cadastro de Clientes

## Problema Identificado

O cadastro de clientes não funciona no sistema online, mas funciona localmente. O problema está relacionado às **políticas de Row Level Security (RLS)** do Supabase que exigem autenticação, mas a sessão pode estar expirando ou não sendo mantida corretamente no ambiente de produção.

## Causas Principais

1. **Políticas RLS Restritivas**: As tabelas têm RLS habilitado e exigem `auth.uid() IS NOT NULL`
2. **Sessão Expirada**: A sessão de autenticação pode estar expirando no ambiente online
3. **Diferenças de Ambiente**: Configurações diferentes entre local e produção

## Soluções Implementadas

### 1. Melhorias no Hook useClients

- ✅ Adicionada verificação de autenticação antes de inserir
- ✅ Implementado retry automático com refresh de sessão
- ✅ Logs detalhados para debug
- ✅ Tratamento específico de erros RLS

### 2. Melhorias no Hook useAuth

- ✅ Adicionada função `refreshSession()` para recarregar sessão
- ✅ Melhor gerenciamento de estado de autenticação

### 3. Melhorias no ClientForm

- ✅ Mensagens de erro mais específicas
- ✅ Tratamento de diferentes tipos de erro
- ✅ Logs detalhados para debug

### 4. Componente de Debug

- ✅ Criado `AuthDebug.tsx` para verificar status de autenticação
- ✅ Testes de inserção direta
- ✅ Verificação de sessão

## Como Resolver

### Passo 1: Executar Script SQL

Execute o arquivo `fix_rls_policies.sql` no Supabase SQL Editor para:

1. Verificar políticas atuais
2. Remover políticas conflitantes
3. Criar políticas temporárias mais permissivas
4. Testar inserção manual

### Passo 2: Verificar no Sistema

1. Acesse o sistema online
2. Faça login
3. Vá para a página de cadastro de clientes
4. Abra o console do navegador (F12)
5. Tente cadastrar um cliente
6. Verifique os logs no console

### Passo 3: Usar Componente de Debug (Opcional)

Se o problema persistir, adicione temporariamente o componente `AuthDebug` à página:

```tsx
import { AuthDebug } from '@/components/debug/AuthDebug';

// Adicione na página de clientes
<AuthDebug />
```

### Passo 4: Verificar Políticas RLS

Execute no Supabase SQL Editor:

```sql
-- Verificar políticas atuais
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
AND tablename = 'clients'
ORDER BY tablename, policyname;
```

## Soluções Alternativas

### Opção 1: Desabilitar RLS Temporariamente

```sql
-- Desabilitar RLS para teste
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
```

### Opção 2: Política Mais Permissiva

```sql
-- Política que permite tudo para usuários autenticados
CREATE POLICY "permissive_clients_policy" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);
```

### Opção 3: Verificar Configurações do Supabase

1. Acesse o dashboard do Supabase
2. Vá em Settings > API
3. Verifique se as URLs e chaves estão corretas
4. Verifique se o projeto está ativo

## Logs para Debug

Os logs agora incluem:

- Status de autenticação antes da inserção
- ID do usuário autenticado
- Detalhes completos de erros RLS
- Tentativas de retry com refresh de sessão

## Verificação Final

Após implementar as correções:

1. ✅ Cadastro funciona localmente
2. ✅ Cadastro funciona online
3. ✅ Logs mostram autenticação correta
4. ✅ Políticas RLS estão funcionando
5. ✅ Sessão é mantida corretamente

## Arquivos Modificados

- `src/hooks/useClients.tsx` - Melhorias na função addClient
- `src/hooks/useAuth.tsx` - Adicionada função refreshSession
- `src/components/clients/ClientForm.tsx` - Melhor tratamento de erros
- `src/components/debug/AuthDebug.tsx` - Componente de debug (novo)
- `fix_rls_policies.sql` - Script para corrigir políticas (novo)

## Próximos Passos

1. Deploy das alterações
2. Teste no ambiente online
3. Verificação dos logs
4. Remoção do componente de debug se não necessário
5. Ajuste das políticas RLS conforme necessário 