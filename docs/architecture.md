# Arquitetura do Frontend (Finager)

Visão geral da estrutura de pastas, roteamento, ciclo de vida de dados e layout da aplicação.

---

## 1. Estrutura de Diretórios (`src/`)

```text
src/
├── api/
│   └── axios.ts              # Instância do Axios, baseUrl e interceptores de JWT
├── assets/                   # Assets estáticos e imagens
├── components/
│   ├── layout/               # Estrutura mestra da aplicação
│   │   ├── AppLayout.vue     # Shell principal (Sidebar + Topbar + Content + BottomNav)
│   │   ├── Sidebar.vue       # Navegação lateral desktop
│   │   ├── Topbar.vue        # Cabeçalho com ações de usuário e tema
│   │   └── BottomNav.vue     # Navegação inferior para dispositivos móveis
│   └── ui/                   # Modais, seletores e componentes de interface
├── lib/
│   └── utils.ts              # Utilitário cn() para shadcn-vue (clsx + tailwind-merge)
├── router/
│   └── index.ts              # Definição de rotas e navigation guards de autenticação
├── stores/                   # Stores Pinia (estado reativo + ações assíncronas de API)
├── utils/
│   ├── feedback.ts           # Sistema oficial de Toasts e Alertas SweetAlert2
│   └── tour.ts               # Guias de onboarding do usuário (Driver.js)
├── views/                    # Páginas da aplicação mapeadas no Vue Router
├── App.vue                   # Componente raiz com <router-view />
├── main.ts                   # Ponto de entrada (Pinia + Router + Vue)
└── style.css                 # Importação do Tailwind e estilos Dark OLED
```

---

## 2. Layout e Roteamento

- **Controle de Acesso (`src/router/index.ts`):**
  - Rotas com `meta: { public: true }` (`/login`, `/register`) só podem ser acessadas por usuários não autenticados.
  - Todas as demais rotas são privadas e exigem `authStore.isAuthenticated === true`. Usuários não autenticados são redirecionados automaticamente para `/login`.
- **Layout Shell:**
  - Telas autenticadas são renderizadas dentro do `AppLayout.vue`, que inclui responsividade móvel (`Sidebar.vue` no desktop e `BottomNav.vue` no mobile).

---

## 3. Ciclo de Vida dos Dados

```
Usuário interage com a View (ex.: TransactionsView.vue)
             │
             ▼
Dispara action na Store Pinia (ex.: transactionsStore.fetchTransactions())
             │
             ▼
Store aciona api de src/api/axios.ts (anexa JWT via interceptor)
             │
             ▼
Backend Go processa e responde JSON
             │
             ▼
Store atualiza estado reativo local (state.transactions = data.data)
             │
             ▼
View reage automaticamente e renderiza os novos dados
```

---

## 4. Orientações para Criação de Novas Telas

1. Crie a página em `src/views/NomeView.vue`.
2. Registre a rota em `src/router/index.ts`.
3. Se envolver uma nova entidade de negócio, crie uma store em `src/stores/nome.ts` exportando a interface TypeScript do modelo.
4. Para feedback ao usuário em ações, use `src/utils/feedback.ts`.
5. Valide a integridade do código executando `npm run build`.
