# RRZ Finance Flow

Sistema financeiro completo para gestão de clientes, projetos, notas fiscais, conciliação bancária e relatórios.

## ✨ Funcionalidades Principais

- **Dashboard (Página Inicial):**
  - Resumo financeiro (recebido, pendente, atrasado, total de notas)
  - Controle de recebimento de notas (data, status, valor)
  - Notificações automáticas para notas a vencer e vencidas
- **Notas Fiscais:**
  - Cadastro, edição, exclusão e listagem
  - Busca avançada e filtros dinâmicos (projeto, tipo, cliente, valor, período, status)
  - Controle de parcelas, conciliação e histórico
- **Clientes:**
  - Cadastro, edição, exclusão e busca por CNPJ (integração BrasilAPI)
- **Projetos:**
  - Cadastro, edição, exclusão e vinculação a notas
  - Tipos de projeto customizáveis
- **Impostos:**
  - Resumo de impostos por nota
  - Filtros por período
- **Histórico de Alterações:**
  - Log de criação, edição e exclusão de clientes, notas e projetos
- **Acessibilidade e UX:**
  - Toasts de feedback, loading states, modais de confirmação, navegação por teclado

## 🚀 Tecnologias Utilizadas
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- Radix UI (modais, alertas)
- LocalStorage para persistência

## 📁 Estrutura de Pastas
```
src/
  components/        # Componentes de UI e páginas
  hooks/             # Hooks customizados (clientes, notas, projetos, auth)
  pages/             # Páginas principais
  lib/               # Utilitários
  App.tsx            # Composição de providers e rotas
```

## 🛠️ Como rodar o projeto localmente
```sh
# Clone o repositório
$ git clone <URL_DO_REPO>
$ cd <NOME_DO_PROJETO>

# Instale as dependências
$ npm install

# Rode o servidor de desenvolvimento
$ npm run dev
```
Acesse http://localhost:5173 no navegador.

## 🧪 Testes e Contribuição
- Sinta-se à vontade para abrir issues ou pull requests.
- Sugestões de melhorias são bem-vindas!

## 📄 Licença
Este projeto é privado/empresarial. Consulte o responsável antes de redistribuir.

---
Desenvolvido por RRZ Consultoria.
