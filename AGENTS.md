# Finager Frontend — Diretrizes para Agentes de Código

Aplicação Single-Page Application (SPA) para gestão financeira pessoal/familiar, construída em **Vue 3** (Composition API), **TypeScript**, **Vite** e **Tailwind CSS v3** sob estética Dark OLED.
Consome a API RESTful em Go do repositório parceiro `finager-backend` (rodando localmente em `http://localhost:8080`).

---

## 1. Comandos Essenciais

```bash
# Executar servidor de desenvolvimento (http://localhost:5173)
npm run dev

# Validação obrigatória de TypeScript e build de produção (EXECUTAR SEMPRE após alterações)
npm run build
# No Windows PowerShell, caso haja restrição de script de execução:
npm.cmd run build

# Prévia do bundle gerado
npm run preview
```

---

## 2. Regras Críticas e Invioláveis

1. **Proibição Estrita de Diálogos Nativos do Navegador:**
   - NUNCA utilize `window.alert()`, `window.confirm()` ou `window.prompt()`.
   - Utilize exclusivamente o utilitário padronizado em `src/utils/feedback.ts`:
     - Notificações rápidas: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`.
     - Modais/Confirmações: `await showAlert.confirm({ title, text, isDestructive: true })`, `showAlert.error()`, `showAlert.success()`.
2. **Estética Dark OLED Estrita:**
   - Fundo base: `bg-bg` (`#020617`).
   - Superfícies/Cards: `bg-surface` (`#0F172A`), `bg-surface-2` (`#1E293B`).
   - Destaque/Ação: `bg-accent` (`#22C55E`), `text-accent`.
   - Nunca introduza temas claros ou cores arbitrárias fora dos tokens mapeados no `tailwind.config.js`.
3. **Ícones SVG Padronizados:**
   - Utilize `@phosphor-icons/vue`. Nunca utilize emojis como ícones de interface.
   - Ícones de ação/destaque: `weight="duotone"`. Ícones informativos padrão: `weight="regular"`.
4. **Padrão de Componentes de UI (shadcn-vue):**
   - Para novos componentes de UI primitivos (botões, diálogos, dropdowns, inputs), siga o padrão **shadcn-vue** configurado em `components.json` e utilitário `cn()` em `src/lib/utils.ts`.

---

## 3. Integração com Backend & Swagger

- **Serviço Local:** Backend em Go rodando em `http://localhost:8080` (configurado via `.env`: `VITE_API_BASE_URL`).
- **Documentação Swagger Web (em tempo real):**
  - Interface Visual: `http://localhost:8080/swagger/index.html`
  - Especificação OpenAPI (JSON): `http://localhost:8080/swagger/doc.json`
- **Arquivos Físicos no Repositório Backend:**
  - Localização: `../finager-backend/docs/` ou `../finager/docs/` (`swagger.json`, `swagger.yaml`, `docs.go`).
- Não invente contratos nem adivinhe rotas; consulte a especificação do Swagger antes de integrar novas chamadas.

---

## 4. Diretrizes de Economia de Contexto e Tokens

- **Investigue com Precisão:** Use busca por nomes de símbolos ou termos específicos. Nunca leia views extensas inteiras (ex.: `TransactionsView.vue` de ~47 KB) para entender uma pequena função. Leia apenas os blocos de linhas necessários.
- **Tipos de Domínio:** As interfaces TypeScript (`Transaction`, `Account`, `UserProfile`, `Tag`, etc.) estão declaradas e exportadas diretamente em `src/stores/*.ts`.
- **Validação com `npm run build`:** Execute o build antes de finalizar tarefas com código para confirmar que o `vue-tsc` e o Vite compilaram perfeitamente sem erros de tipagem.

---

## 5. Índice de Documentação Modular (Carregar sob Demanda)

- **Regras de UI e Feedback:** `.claude/rules/ui-components.md` (carregado automaticamente ao tocar em `src/views/` ou `src/components/`)
- **Regras de Pinia & API:** `.claude/rules/state-api.md` (carregado automaticamente ao tocar em `src/stores/` ou `src/api/`)
- **Mapa da Arquitetura & Roteamento:** `docs/architecture.md`
- **Contratos da API Backend:** `docs/api-contracts.md`
- **Design System Master:** `design-system/finager/MASTER.md`
