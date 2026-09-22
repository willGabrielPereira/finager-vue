---
paths:
  - "src/views/**/*.vue"
  - "src/components/**/*.vue"
  - "src/style.css"
---

# Diretrizes de UI, Telas e Componentes (Finager)

## 1. Feedback Visual Obrigatório (`src/utils/feedback.ts`)
> **REGRA ABSOLUTA:** É terminantemente proibido o uso de `window.alert()`, `confirm()` ou `prompt()`.

Use exclusivamente o utilitário `src/utils/feedback.ts`:
```typescript
import { toast, showAlert } from '@/utils/feedback';

// Notificações rápidas não bloqueantes (toast 4s)
toast.success('Salvo!', 'Transação atualizada com sucesso.');
toast.error('Erro', 'Não foi possível salvar os dados.');
toast.warning('Atenção', 'Preencha todos os campos obrigatórios.');
toast.info('Informação', 'Sincronização em segundo plano.');

// Confirmações modais (retorna Promise<boolean>)
const confirmed = await showAlert.confirm({
  title: 'Excluir conta?',
  text: 'Esta ação não poderá ser revertida.',
  isDestructive: true, // botão vermelho de exclusão
  confirmText: 'Sim, excluir',
  cancelText: 'Cancelar'
});

// Alertas modais bloqueantes
await showAlert.error('Falha de Autenticação', 'Sua sessão expirou.');
await showAlert.success('Concluído', 'Extrato importado com sucesso.');
```

---

## 2. Padrão de Componentes Primitivos (shadcn-vue)
- Para novos componentes reutilizáveis primitivos (botões, cards, diálogos, comboboxes, dropdowns), utilize a convenção **shadcn-vue** em `src/components/ui/`.
- Utilize o helper de merge de classes `cn()` de `@/lib/utils` para combinar classes Tailwind dinâmicas com segurança.
- Mantenha a consistência com os componentes existentes construídos sob o tema Dark OLED.

---

## 3. Cores Semânticas e Tokens (Dark OLED)
Consulte sempre os tokens de `tailwind.config.js`:
- Fundo da aplicação: `bg-bg` (`#020617`)
- Superfícies/Containers: `bg-surface` (`#0F172A`) com borda sutil `border-white/5` ou `border-white/10`
- Contêineres secundários e inputs: `bg-surface-2` (`#1E293B`)
- Destaque/Ações principais (CTA): `bg-accent` (`#22C55E`) com texto contrastante `text-bg` e `font-semibold`
- Indicadores de perigo/exclusão: `text-red-500` / `bg-red-500/10`

---

## 4. Ícones Phosphor (`@phosphor-icons/vue`)
- Utilize ícones de `@phosphor-icons/vue` em vez de SVGs manuais ou emojis.
- Destaques, ações e estados ativos: `weight="duotone"`.
- Acompanhamento textual e tabelas padrão: `weight="regular"`.
- Tamanhos comuns: `size="16"` (inline/tabelas), `size="20"` (botões/nav), `size="24"` (cards/títulos).

---

## 5. Micro-interações e Usabilidade
- Todos os elementos clicáveis devem conter `cursor-pointer`.
- Transições de hover devem ser suaves: `transition-all duration-200`.
- Não cause layout-shifts em hover (evite `scale` excessivo que desloque elementos vizinhos).
