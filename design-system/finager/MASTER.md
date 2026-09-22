# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Finager
**Generated:** 2026-04-16 22:53:15
**Category:** Fintech/Crypto

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#0F172A` | `--color-primary` |
| Secondary | `#1E293B` | `--color-secondary` |
| CTA/Accent | `#22C55E` | `--color-cta` |
| Background | `#020617` | `--color-background` |
| Text | `#F8FAFC` | `--color-text` |

**Color Notes:** Dark bg + green positive indicators

### Typography

- **Heading Font:** IBM Plex Sans
- **Body Font:** IBM Plex Sans
- **Mood:** financial, trustworthy, professional, corporate, banking, serious
- **Google Fonts:** [IBM Plex Sans + IBM Plex Sans](https://fonts.google.com/share?selection.family=IBM+Plex+Sans:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
```

### CSS Framework

**Tailwind CSS v3** — utilities-first. Cores do projeto mapeadas como tokens no `tailwind.config.js`:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      surface:    '#0F172A',
      'surface-2':'#1E293B',
      accent:     '#22C55E',
      bg:         '#020617',
    },
    fontFamily: {
      sans: ['IBM Plex Sans', 'sans-serif'],
    },
  },
}
```

### Icons

**Phosphor Icons** — `@phosphor-icons/vue`

```vue
<script setup>
import { PhArrowRight, PhWallet, PhTag } from '@phosphor-icons/vue'
</script>
<template>
  <PhArrowRight :size="20" weight="bold" />
</template>
```

- Sempre usar `weight="duotone"` para ícones de destaque, `weight="regular"` como padrão
- Tamanhos: `16` (inline), `20` (botões/nav), `24` (cards), `32` (hero)

---

## Component Specs (Tailwind)

### Buttons

```html
<!-- Primary -->
<button class="bg-accent text-bg font-semibold px-6 py-3 rounded-lg
               hover:opacity-90 hover:-translate-y-px transition-all duration-200
               cursor-pointer focus-visible:ring-2 focus-visible:ring-accent">
  Confirmar
</button>

<!-- Secondary -->
<button class="border border-surface-2 text-white font-semibold px-6 py-3 rounded-lg
               hover:bg-surface-2 transition-all duration-200 cursor-pointer">
  Cancelar
</button>
```

### Cards

```html
<div class="bg-surface rounded-xl p-6 border border-white/5
            hover:border-white/10 hover:-translate-y-0.5
            transition-all duration-200 cursor-pointer shadow-lg">
  <!-- content -->
</div>
```

### Inputs

```html
<input class="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-3
              text-white placeholder-white/30 text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
              transition-all duration-200" />
```

### Modals

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
<!-- Panel -->
<div class="bg-surface rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-auto">
  <!-- content -->
</div>
```

---

## Style Guidelines

**Style:** Dark Mode (OLED)

**Keywords:** Dark theme, low light, high contrast, deep black, midnight blue, eye-friendly, OLED, night mode, power efficient

**Best For:** Night-mode apps, coding platforms, entertainment, eye-strain prevention, OLED devices, low-light

**Key Effects:** Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus

### Page Patterns

- **Bento Grid & Métricas:** Utilizado no Dashboard para exibir saldos consolidados, gráficos interativos e resumos.
- **Tabelas Gerenciáveis:** Utilizado em Transações e Contas, com barra de filtros, paginação e ações contextuais.
- **Modais de Operação:** Painéis com backdrop escuro (`bg-surface`, borda sutil) para importações OFX, criação e detalhes.


---

## Anti-Patterns (Do NOT Use)

- ❌ Light backgrounds
- ❌ No security indicators

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use Phosphor Icons (@phosphor-icons/vue)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from Phosphor Icons (@phosphor-icons/vue)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
