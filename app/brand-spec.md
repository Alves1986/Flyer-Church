# Brand DNA Visual — Flyer Church

## Paleta (OKLch-derived, single source of truth)

### Tema aplicativo (dashboard, configuração, geração) — escuro obsidian
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B0A08` | Fundo base do app |
| `--surface` | `#12100C` | Painéis, cards, dropdowns |
| `--fg` | `#F5F0E4` | Texto primário |
| `--muted` | `#A69C87` | Texto secundário, labels |
| `--border` | `#2A2418` | Borders leves; `brand-stone` como alias só no landing |
| `--accent` | `#B8860B` | Gold institucional — CTAs, hover ativo, ícones selecionados |
| `--accent-soft` | `oklch(0.70 0.16 75)` | Fundo sutil de hover (sem inverter fg) |
| `--accent-strong` | `oklch(0.55 0.18 72)` | Gold 600 — bordas ativas, hover de botão |
| `--danger` | `oklch(0.65 0.18 25)` | Vermelho sutil para rejeição/erro |
| `--success` | `oklch(0.70 0.16 145)` | Verde sutil para aprovação |

### Tema landing (marketing) — claro papel
| Token | Valor | Uso |
|---|---|---|
| `--landing-bg` | `#FCFCFA` | Fundo da landing |
| `--landing-surface` | `#F7F5F0` | Cards, seções alternadas |
| `--landing-fg` | `#0A0A0A` | Texto primário da landing |
| `--landing-muted` | `#6B604E` | Texto secundário |
| `--landing-border` | `#EAE7E0` | Borders |
| `--landing-accent` | `#B8860B` | Mesmo gold do app |

## Tipografia

| Role | Família | Tamanho base |
|---|---|---|
| Display (títulos) | Bebas Neue | `text-4xl` no dashboard, `text-5xl` na landing (não `text-8xl`) |
| Corpo | Manrope | `text-sm`–`text-base`, `leading-relaxed` |
| Mono / labels | Manrope (font-mono) | Labels uppercase, crídos, valores |

Regras:
- Display: `tracking-wide` em títulos ≥ `text-3xl`; nunca `tracking-tighter` em Bebas Neue grande.
- Corpo: `leading-relaxed` em parágrafos; `leading-normal` em labels.
- Labels uppercase: `text-[10px]`–`text-xs`, `tracking-widest`, `font-black`, cor `--muted`.

## Estatégia de hover (regra geral)
1. **Botões com texto escuro sobre fundo claro:** no hover, aplique `bg-opacity` mais escura ou `border` mais intenso — nunca deixe texto escuro sobre hover leve.
2. **Botões com texto claro sobre fundo escuro:** no hover, fundo mais escuro + texto permanece claro (ou gold se for acento).
3. **Cards:** fundo de hover sutil (`--accent-soft`) antes da borda ser ativada; ícone de ação mantém `bg-surface` no repouso.
4. **Nunca** mudar texto para `--muted` em hover — o contraste cai abaixo do mínimo.

## Estados de foco
Todo elemento interativo focusable recebe `:focus-visible` com anel de 2–3px em `--accent` com opacidade 0.4–0.6, além da mudança de border.

## Contraste mínimo
- Texto normal: ≥ 4.5:1
- Texto grande / ícone: ≥ 3:1
- Ícone sobre fundo: ≥ 3:1 em repouso e hover
