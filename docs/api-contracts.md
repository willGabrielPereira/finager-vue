# Contratos da API Backend (Finager API)

Este documento orienta o agente sobre os endpoints da API RESTful em Go que o frontend consome.
Não é necessário adivinhar payloads ou inventar rotas; use as fontes oficiais abaixo.

---

## 1. Fontes Oficiais da Documentação da API

### Acesso Swagger Web (quando o backend estiver em execução local):
- **Swagger UI Interativo:** `http://localhost:8080/swagger/index.html`
- **Especificação OpenAPI JSON (bruta):** `http://localhost:8080/swagger/doc.json`

### Arquivos Físicos no Repositório Backend (Go / Swaggo):
- **Diretório no projeto backend parceiro:**
  - `../finager-backend/docs/` ou `../finager/docs/`
- **Arquivos-chave:**
  - `swagger.json` e `swagger.yaml`: Definição de todos os esquemas de entrada/saída.
  - `docs.go`: Código Go gerado pelo Swaggo.

---

## 2. Visão Geral dos Principais Agrupamentos de Rotas

| Domínio | Rota Base | Store Frontend | Descrição |
| :--- | :--- | :--- | :--- |
| **Autenticação** | `/auth/*` | `src/stores/auth.ts` | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/profile` |
| **Contas** | `/accounts/*` | `src/stores/accounts.ts` | Listagem (`GET /accounts`), criação (`POST`), edição (`PUT /:id`), deleção (`DELETE /:id`) |
| **Transações** | `/transactions/*` | `src/stores/transactions.ts` | Paginação (`/transactions`), criação manual (`POST`), tags (`PUT /:id`), conciliação |
| **Categorias/Tags**| `/tags/*` | `src/stores/tags.ts` | Listagem e regras de auto-tagueamento de extratos |
| **Assinatura/Plano**| `/billing/*` | `src/stores/billing.ts` | Status do plano familiar e limites de transações |

---

## 3. Padrões de Paginação e Filtros de Transações (`GET /transactions`)

Parâmetros de query aceitos pela API:
- `page`: Número da página (1-based, padrão 1).
- `limit`: Quantidade de itens por página (padrão 20, ou até 500 no dashboard).
- `search`: Busca textual por descrição (`name` ou `memo`).
- `status`: `POSTED`, `PLANNED`, `PENDING_RECONCILIATION`, `RECONCILED`.
- `type`: `DEBIT` ou `CREDIT`.
- `accounts`: IDs de contas separados por vírgula (ex.: `id1,id2`).
- `tags`: IDs de tags separados por vírgula.
- `date_from` e `date_to`: Formato ISO (`YYYY-MM-DD`).
- `amount_min` e `amount_max`: Filtro numérico de valores.

Estrutura de resposta padrão paginada:
```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 150,
  "total_pages": 8
}
```

---

## 4. Fluxo de Autenticação e Renovação de Token
1. Login retorna `{ access_token, refresh_token, user }`.
2. O `access_token` é enviado via `Authorization: Bearer <token>` em todas as rotas privadas.
3. Se a API responder `401 Unauthorized`, o interceptor Axios em `src/api/axios.ts` chama `POST /auth/refresh` com payload `{ refresh_token }`.
4. Os novos tokens são persistidos na `auth` store e a requisição original que havia falhado é reenviada automaticamente.
