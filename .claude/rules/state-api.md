---
paths:
  - "src/stores/**/*.ts"
  - "src/api/**/*.ts"
---

# Diretrizes de Estado (Pinia) e Rede (Axios)

## 1. Padrão das Stores Pinia (`src/stores/`)
- Cada domínio de negócio possui sua store dedicada:
  - `accounts.ts`: Contas bancárias/carteiras e permissões.
  - `auth.ts`: Sessão, tokens JWT, perfil do usuário e membros da família.
  - `billing.ts`: Planos, limites de uso e assinaturas.
  - `tags.ts`: Categorias e regras de auto-tagueamento.
  - `transactions.ts`: Transações, filtros avançados, paginação e importações.
- **Tipos TypeScript:** Os tipos e interfaces de domínio (`Transaction`, `Account`, `UserProfile`, `Tag`, etc.) são definidos e exportados diretamente na store do domínio correspondente. Não crie tipos duplicados.
- **Gestão de Estado de Loading:** Sempre envolva chamadas assíncronas com tratamento de loading:
  ```typescript
  this.loading = true;
  try {
    const { data } = await api.get('/endpoint');
    // atualize o state
  } finally {
    this.loading = false;
  }
  ```

---

## 2. Camada de Rede HTTP (`src/api/axios.ts`)
- Todas as requisições autenticadas devem utilizar a instância `api` exportada de `src/api/axios.ts`.
- **Autenticação JWT Automática:**
  - O interceptor de requisição anexa automaticamente o cabeçalho `Authorization: Bearer <accessToken>` a partir da `useAuthStore()`.
  - O interceptor de resposta intercepta erros `401 Unauthorized` e tenta renovar o token automaticamente contra `/auth/refresh` enfileirando requisições pendentes.
  - Em caso de falha irreversível de autenticação, o usuário é deslogado e redirecionado para `/login`.
- **Rotas Relativas:** Sempre passe URLs relativas ao `baseURL` (ex.: `api.get('/transactions')`, `api.post('/accounts', payload)`).
- **Tratamento de Erros:** Não silencie erros nas stores se a view precisar exibir feedback visual específico através do `src/utils/feedback.ts`.
