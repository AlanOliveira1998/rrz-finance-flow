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

# Deploy na Vercel

Este projeto está pronto para deploy na Vercel utilizando Vite + React + TypeScript.

## Passos para Deploy

1. **Importe o projeto no painel da Vercel**
   - Clique em "Add New... > Project" e conecte o repositório.

2. **Configure o build**
   - Framework Preset: `Vite`
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install` (ou `pnpm install` se usar pnpm)

3. **Variáveis de ambiente**
   - Se necessário, adicione as variáveis do Supabase no painel da Vercel (ex: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - No seu código, prefira usar `import.meta.env.VITE_SUPABASE_URL` para ler essas variáveis.

4. **Configuração de SPA (Single Page Application)**
   - A Vercel já trata rotas de SPA automaticamente para projetos Vite/React. Se necessário, adicione um arquivo `vercel.json` com:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

5. **Deploy**
   - Clique em "Deploy" e aguarde a publicação.

## Observações
- Certifique-se de que todas as URLs de API do Supabase estejam corretas e públicas.
- O backend local foi removido, todo o sistema depende apenas do frontend + Supabase.
- Para builds locais, use `npm run build` e sirva a pasta `dist` com um servidor estático.
