# Claude Code — Instruções do Projeto Finager Frontend

As diretrizes unificadas do projeto estão descritas no arquivo principal:
👉 **[AGENTS.md](./AGENTS.md)**

---

## Regras Modulares Automáticas (.claude/rules/)
O Claude Code carrega instruções de contexto sob demanda (*path scoping*):
- **UI e Componentes:** `.claude/rules/ui-components.md` (acionado ao ler/editar `src/views/` e `src/components/`)
- **Estado e Integração HTTP:** `.claude/rules/state-api.md` (acionado ao ler/editar `src/stores/` e `src/api/`)

## Documentação Específica sob Demanda (docs/)
- [Arquitetura e Fluxo de Dados](docs/architecture.md)
- [Contratos da API Go e Swagger](docs/api-contracts.md)
- [Design System Master](design-system/finager/MASTER.md)

## Validação de Trabalho
Sempre execute `npm run build` (ou `npm.cmd run build` no Windows) antes de concluir qualquer tarefa de código para verificar tipos TypeScript e compilação do Vite.
