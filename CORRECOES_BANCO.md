# 🔧 Correções Necessárias no Banco de Dados

## 📊 Análise do Schema Atual

Baseado no schema real fornecido, identifiquei várias inconsistências que precisam ser corrigidas:

### 🚨 **Problemas Identificados:**

1. **Colunas Duplicadas na tabela `invoices`:**
   - `client_id` vs `cliente_id` (duplicado)
   - `project_id` vs `projeto_id` (duplicado)
   - `parcelas` vs `total_parcelas` (duplicado)
   - `valor_liquido` vs `valor_livre_impostos` (duplicado)

2. **Colunas Faltantes:**
   - `descricao` (descrição da nota)
   - `tipo` (entrada/saída)
   - `cliente` (nome do cliente)
   - `projeto` (nome do projeto)

3. **Tabela `taxes` desnecessária:**
   - Os impostos já estão na tabela `invoices`

4. **Tabela `logs` com nomes em português:**
   - Precisa ser renomeada para `activity_logs`
   - Colunas precisam ser padronizadas

## ✅ **Script de Correção Criado**

Criei o arquivo `fix_database_structure.sql` que:

### 🔄 **1. Limpa Duplicações:**
- Remove `client_id` (mantém `cliente_id`)
- Remove `project_id` (mantém `projeto_id`)
- Remove `parcelas` (mantém `total_parcelas`)
- Remove `valor_liquido` (mantém `