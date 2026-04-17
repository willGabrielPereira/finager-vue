# Finager Frontend 💰

Uma aplicação moderna e responsiva de gestão financeira, construída com **Vue 3** e **TypeScript**, atuando como a interface oficial para o sistema **Finager**. 

Este projeto foi desenhado sob uma estética "Dark OLED" utilizando **Tailwind CSS**, oferecendo componentes ricos e fluídos como visualizações em Bento Grid, gráficos interativos e gerenciamento de transações.

## 🔗 Integração com o Backend

O **Finager (Frontend)** não funciona isolado. Ele consume a API RESTful construída em Go do projeto parceiro:

👉 **[Finager Backend Repository](https://github.com/willGabrielPereira/finager-backend)**

Certifique-se de ter o backend rodando localmente (normalmente em `http://localhost:8080`) e com o banco de dados configurado para que a aplicação frontend consiga autenticar, buscar transações e gerenciar regras de "auto-tagging".

## 🛠️ Tecnologias Utilizadas

A stack base deste projeto foi desenhada para performance e escalabilidade:

- **Framework Core**: [Vue 3](https://vuejs.org/) (Composition API) + [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Pinia](https://pinia.vuejs.org/) (Gerenciamento global reativo)
- **Roteamento**: [Vue Router 4](https://router.vuejs.org/) (Com guards de autenticação)
- **Estilização e UI**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Camada de Rede (HTTP)**: [Axios](https://axios-http.com/) (Com interceptadores automáticos para expiração de token JWT)
- **Ícones**: [Phosphor Icons](https://phosphoricons.com/)

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- **Node.js** (v20+ recomendado)
- Instância local do **Finager Backend** acessível.

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/willGabrielPereira/finager-vue.git
cd finager-vue
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Copie o arquivo de exemplo para gerar o seu `.env`:
```bash
cp .env.example .env
```
Abra o `.env` gerado e tenha certeza de que a variável aponta para o seu backend rodando (exemplo):
```env
VITE_API_BASE_URL=http://localhost:8080
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Pronto! A aplicação estará acessível em **`http://localhost:5173`**.

---

## 🎨 Design System

A aplicação segue guias rígidas de UI/UX, utilizando um tema **Dark Mode** que privilegia clareza através de contrastes marcados. Os tokens oficiais estão registrados e mapeados no `tailwind.config.js`:

- **Primary Surface**: `#0F172A`
- **Background Root**: `#020617`
- **Accent (Call-to-Action)**: `#22C55E`
- **Tipografia Escalonada**: IBM Plex Sans

*(Você pode conferir detalhes mais minuciosos do Design System localizados nas documentações internas, na pasta `design-system/`).*

## 🔑 Funcionalidades Principais

* **🔒 Autenticação Robusta**: Login e logout controlados localmente via *Pinia*, integrado com um sistema nativo de interceptação no `Axios` para renovar (*refresh*) automaticamente os *Tokens* JWT caso eles expirem em uso contínuo.
* **📊 Dashboard Analítico**: Uma visão global com grids informativos.
* **📋 Transações & Filtros**: Tabela de transações gerenciável para explorar os gastos importados.
* **📂 Upload OFX**: Fluxo pronto para a assimilação de extratos bancários brutos (`.ofx`).
* **🏷️ Motor de Tags**: Capacidade de criar novas categorias (tags) e visualizá-las no balanço.
