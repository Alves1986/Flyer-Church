# Decision Log — FlyerForge

Registre aqui decisões de produto e arquitetura que não devem ser rediscutidas a cada alteração.

## 2026-08-30 — Local-first por padrão

**Decisão:** templates funcionam sem banco configurado, usando `localStorage`.

**Motivo:** permitir teste, demonstração e uso inicial sem custo ou dependência de infraestrutura.

**Consequência:** templates não sincronizam entre navegadores/dispositivos sem banco e autenticação.

## 2026-08-30 — Degradação graciosa é obrigatória

**Decisão:** integrações externas respondem HTTP 501 explicativo quando ausentes; cliente faz fallback quando possível.

**Motivo:** uma chave ou serviço indisponível não pode quebrar a experiência.

**Consequência:** novas integrações devem implementar configuração, falha clara e fallback antes de serem consideradas concluídas.

## 2026-08-30 — Prompt com variáveis é contrato interno

**Decisão:** variáveis usam `[NOME_EM_MAIUSCULO_COM_UNDERSCORE]`; imagem e texto têm tratamento distinto.

**Motivo:** permitir detecção e preenchimento previsível em templates reutilizáveis.

**Consequência:** mudar o formato exige revisar meta-prompt, parser, tipos, tela e API.

## 2026-08-30 — Texto crítico deve migrar para camadas editáveis

**Decisão:** evoluções futuras devem renderizar nomes, datas, horários, versículos e CTAs fora da imagem gerada.

**Motivo:** modelos de imagem podem errar texto e informação factual.

**Consequência:** o pipeline ideal é híbrido: IA para direção de arte e app para conteúdo preciso.

## 2026-08-30 — Brand DNA antes de treinamento próprio

**Decisão:** não treinar modelo próprio por igreja no início. Construir perfil visual estruturado, referências aprovadas e feedback.

**Motivo:** menor custo, menor complexidade e validação mais rápida.

**Consequência:** a vantagem competitiva inicial é a memória visual e o fluxo de aprovação, não um modelo proprietário.

## 2026-08-30 — Biblioteca de mídia: URL no banco, base64 no local

**Decisão:** itens da biblioteca (`/api/assets`) só são aceitos pelo banco quando já têm uma `url` do Vercel Blob; sem banco/Blob configurados, `lib/store.ts` guarda a imagem em base64 no `localStorage`.

**Motivo:** evitar inflar linhas de Postgres com base64 de imagens (mesmo padrão já usado no histórico de flyers gerados, que só grava `imagem_url`); manter o app 100% funcional sem nenhuma infraestrutura.

**Alternativas consideradas:** salvar base64 diretamente em uma coluna do banco — descartado por custo/tamanho de armazenamento e por já existir um padrão equivalente (Blob-first) no restante do app.

**Consequência:** um item só migra do localStorage para o banco quando o Vercel Blob também estiver configurado; sem Blob, a biblioteca fica restrita a este navegador, igual aos templates.

**Arquivos ou áreas afetadas:** `lib/types.ts`, `lib/store.ts`, `lib/db.ts`, `app/api/assets/`, `app/biblioteca/`.

## 2026-08-30 — Domínio de produção e cota grátis do Gemini para imagem

**Decisão:** o domínio de produção passou a ser `flyerchurch.vercel.app` (definido pelo usuário nas configurações do projeto na Vercel); os fallbacks de `NEXT_PUBLIC_SITE_URL` em `app/layout.tsx` e `lib/openrouter.ts` foram atualizados para esse domínio. Além disso, `app/api/generate/route.ts` passou a detectar especificamente o erro HTTP 429 `RESOURCE_EXHAUSTED` (cota grátis "limit: 0") do Gemini e devolver uma mensagem explicando que é preciso habilitar faturamento no projeto do Google Cloud da `GOOGLE_API_KEY`, em vez do JSON cru da Google.

**Motivo:** o usuário reportou o erro em produção ao tentar gerar um flyer; a resposta bruta da Google não deixava claro que o problema é a ausência de faturamento no projeto (não uma chave inválida ou bug do app). Confirmado que, a partir de 2026, a Google não libera cota gratuita de API para `gemini-2.5-flash-image`.

**Alternativas consideradas:** trocar o modelo padrão de geração por um alegadamente gratuito — descartado por falta de fonte confiável de um modelo de geração de imagem realmente gratuito da Google no momento; a extração de template via OpenRouter continua gratuita e não é afetada.

**Consequência:** o botão "Gerar flyer" só funciona em produção depois que o usuário habilitar faturamento no Google Cloud para o projeto da `GOOGLE_API_KEY` (custo é por uso, não uma assinatura). Também identificado que a variável cadastrada na Vercel como `openrouter_key` (minúsculo) não é lida pelo servidor — nomes de variável são sensíveis a maiúsculas/minúsculas e precisam ser exatamente `OPENROUTER_API_KEY`; como o app aceita a chave colada no formulário como alternativa, isso não bloqueia o uso, mas o fallback do servidor não funciona até o nome ser corrigido.

**Arquivos ou áreas afetadas:** `app/layout.tsx`, `lib/openrouter.ts`, `app/api/generate/route.ts`, `.env.example`, `CLAUDE.md`.

## 2026-08-30 — Primeiro incremento de Brand DNA: perfil único por instalação, sem multi-tenancy

**Decisão:** implementar a Fase 2 (Brand DNA) como um único perfil por instalação/navegador (tabela `brand_dna` com id fixo `'default'`, ou `localStorage` sem banco), com tela própria (`/marca`) para formulário curto, proposta da IA via OpenRouter, edição manual de todos os campos e aprovação humana explícita (`approvedByHuman`). O Brand DNA aprovado é aplicado ao prompt final de geração de forma aditiva (`lib/brandDna.ts` → `aplicarBrandDnaAoPrompt`), sem alterar o contrato de variáveis existente.

**Motivo:** entregar o pipeline descrito em `docs/brand-dna.md` (propor → revisar → aprovar → usar na geração) sem esperar por organizações/autenticação (Fase 3), mantendo o produto local-first. `eventOverrides` por categoria de evento e a análise de múltiplos flyers aprovados/histórico de feedback ficam para um próximo incremento.

**Alternativas consideradas:** já modelar `organizationId` real e múltiplos perfis — descartado por não haver autenticação nem isolamento de dados ainda; adicionar isso agora criaria uma coluna sem uso real e risco de retrabalho quando a Fase 3 definir o modelo de organizações.

**Consequência:** existe no máximo um Brand DNA aprovado por instalação até a Fase 3. Templates continuam funcionando normalmente sem nenhum Brand DNA configurado — a integração é 100% opcional e aditiva.

**Arquivos ou áreas afetadas:** `lib/brandDna.ts`, `lib/metaPrompt.ts`, `lib/openrouter.ts`, `lib/db.ts`, `lib/store.ts`, `app/api/brand-dna/`, `app/marca/`, `app/flyers/novo/[templateId]/page.tsx`, `components/Header.tsx`.

## Template para novas decisões

```md
## AAAA-MM-DD — Título da decisão

**Decisão:**

**Motivo:**

**Alternativas consideradas:**

**Consequência:**

**Arquivos ou áreas afetadas:**
```
