# FlyerForge — Guia de Trabalho para Assistentes

Leia este documento inteiro antes de alterar código. Preserve a arquitetura local-first, a degradação graciosa e a identidade visual premium do FlyerForge.

## Produto

O FlyerForge é um app Next.js que transforma um flyer de referência em um template reutilizável. Uma IA analisa estilo, paleta, layout, tipografia e direção de arte; depois o usuário cria novos flyers alterando dados variáveis, como evento, igreja, preletor, data, versículo, foto e logo.

O objetivo não é criar um editor gráfico genérico. O objetivo é permitir que igrejas comuniquem seus cultos e eventos com identidade visual consistente, clareza e qualidade.

O produto é local-first nesta fase. Multi-igreja, autenticação, cobrança e equipes são fases futuras: não as torne obrigatórias sem solicitação explícita.

## Fluxo atual

### Extração de template

Rota: `/templates/novo`

1. Usuário envia um flyer de referência.
2. Escolhe OpenRouter (padrão) ou Anthropic.
3. A IA com visão usa `lib/metaPrompt.ts`.
4. A resposta contém um prompt reutilizável com variáveis entre colchetes.
5. O resultado é salvo como `FlyerTemplate`.

### Geração de flyer

Rota: `/flyers/novo/[id]`

1. Usuário escolhe um template.
2. O app detecta variáveis no prompt.
3. Usuário preenche textos e envia mídia necessária.
4. `lib/promptMerge.ts` mescla os valores no prompt.
5. `app/api/generate/route.ts` chama Gemini 2.5 Flash Image por padrão.
6. Usuário visualiza e baixa a arte.

## Contrato de variáveis

Variáveis são uma API interna e obedecem estritamente ao formato `[NOME_EM_MAIUSCULO_COM_UNDERSCORE]`.

Exemplos de texto: `[NOME_EVENTO]`, `[DATA_EVENTO]`, `[HORARIO_EVENTO]`, `[NOME_PRELETOR]`, `[NOME_IGREJA]`, `[VERSICULO]`, `[LOCAL_EVENTO]`.

Exemplos de imagem: `[FOTO_PRELETOR_ANEXADA]`, `[LOGO_IGREJA_ANEXADO]`.

`lib/metaPrompt.ts`, `lib/promptMerge.ts`, `lib/types.ts` e a tela de geração devem evoluir juntos. Uma variável de imagem nova exige atualizar `ImageVarKey`, o parser, os rótulos/campos de upload e a validação da API.

## Regra de qualidade

A IA deve criar fundo, cenário, textura, atmosfera e direção de arte. Ela não é fonte confiável para texto factual dentro da imagem.

Novas evoluções devem priorizar títulos, datas, horários, nomes, endereços, versículos e CTAs como camadas controladas e editáveis pelo app, não como texto desenhado pela IA. Não quebre o fluxo atual apenas para aplicar essa evolução.

## Stack

- Next.js 14, App Router
- TypeScript strict
- Tailwind CSS
- Framer Motion
- Neon / Vercel Postgres opcional
- Vercel Blob opcional
- Vercel para deploy
- OpenRouter ou Anthropic para extração visual
- Gemini 2.5 Flash Image para geração final

## Comandos e validação

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
npx tsc --noEmit
```

Não há testes automatizados ainda. Execute `npx tsc --noEmit` antes de considerar uma mudança concluída. Em sandbox, `npm run build` pode falhar por falta de acesso a `fonts.googleapis.com` usado por `next/font/google`; isso não representa necessariamente falha de código.

## Degradação graciosa

O produto deve continuar funcional sem banco, Blob ou chaves de API no servidor.

1. Rotas em `app/api/**/route.ts` verificam a configuração. Se faltar integração, retornam HTTP 501 e `{ error: string }` em português, explicando a configuração necessária.
2. O cliente em `lib/store.ts` tenta a API e, em 501, falha de rede ou erro, faz fallback para `localStorage` para templates. Histórico e upload são best-effort e não podem quebrar a UI.
3. O usuário nunca deve ver tela quebrada por ausência de infraestrutura.

Não transforme integrações opcionais em obrigatórias.

## Chaves e segurança

Chaves de OpenRouter/Anthropic podem ser informadas pelo usuário no formulário. Elas ficam somente no `localStorage` (`flyerforge.openrouterKey` e `flyerforge.anthropicKey`), são enviadas no corpo de POST e têm prioridade sobre variáveis de ambiente do servidor.

Ordem: chave do formulário → variável de ambiente → HTTP 501 explicativo.

Nunca salve chaves do usuário em banco, logs, URL, query string, respostas ou mensagens de erro. Nunca exponha chave do servidor no cliente.

## Integrações

`lib/openrouter.ts` busca modelos de visão gratuitos em `https://openrouter.ai/api/v1/models`. Não crie listas hardcoded em outros locais. Atualize o fallback apenas após verificar a API pública.

A geração final está em `app/api/generate/route.ts` e usa `GOOGLE_API_KEY`. Se adicionar provedor, isole-o em adapter, preserve a rota e o fallback 501, e valide entrada/saída de imagens antes de trocar o padrão.

## Persistência

Sem `DATABASE_URL`/`POSTGRES_URL`, templates ficam no `localStorage`; não há sincronização entre navegadores e não há seed automático. Imagens podem trafegar como base64 durante a sessão, sem promessa de persistência.

Com banco, templates e histórico podem persistir. Com `BLOB_READ_WRITE_TOKEN`, fotos, logos e flyers podem ser armazenados no Vercel Blob. Mesmo com infraestrutura, preserve fallback local em caso de falha.

Use `@neondatabase/serverless`; não reintroduza `@vercel/postgres`.

## Estrutura relevante

```text
app/api/extract/             análise visual → prompt
app/api/generate/            geração do flyer
app/api/openrouter-models/   catálogo de visão
app/api/templates/           CRUD opcional
app/api/flyers/              histórico opcional
app/api/upload/              Blob opcional
app/api/assets/               biblioteca de mídia (CRUD opcional)
app/templates/novo/          extração
app/flyers/novo/[id]/        geração
app/biblioteca/                biblioteca de logos, fotos e fundos
components/                  Header, UploadDropzone
lib/types.ts                 tipos de domínio
lib/store.ts                 cliente híbrido
lib/promptMerge.ts           parser e merge
lib/metaPrompt.ts            meta-prompt
lib/db.ts                    Neon opcional
lib/blob.ts                  Blob opcional
lib/openrouter.ts            OpenRouter
lib/tiposAsset.ts              rótulos e helpers da biblioteca
```

## Convenções de interface

Toda UI e erro visível ao usuário é em português. A identidade visual é `ink` quase-preto, `gold` dourado e `parchment` claro, definida em `tailwind.config.ts`. Preserve um visual editorial, contemporâneo, sofisticado, mobile-first e de alto contraste.

Evite dashboards genéricos, azul/cinza como paleta dominante, gradientes exagerados, aparência infantil e alterações que prejudiquem leitura.

A fonte da verdade da marca é `public/brand/mark.svg`. Se mudar, regenere `app/icon.png`, `app/apple-icon.png` e `app/opengraph-image.png`.

## Privacidade

Não registre base64 de imagens, chaves ou dados pessoais em logs. Não envie mídias a provedores não selecionados pelo usuário. Não use mídia de uma igreja como referência para outra. Não prometa retenção, exclusão ou armazenamento que ainda não esteja implementado.

## Procedimento obrigatório

1. Leia este arquivo e os arquivos diretamente afetados.
2. Identifique impacto em variáveis, fallback, chaves, banco, upload e geração.
3. Explique o plano antes de mudanças grandes.
4. Faça alterações pequenas e reversíveis.
5. Preserve fluxos existentes e funcionamento sem infraestrutura.
6. Execute `npx tsc --noEmit`.
7. Informe arquivos alterados, validação, configuração necessária e riscos.

Use este formato ao concluir:

```md
## Alterações realizadas
- Arquivo: resumo

## Validação
- Resultado de `npx tsc --noEmit`
- Fluxos verificados

## Configuração necessária
- Variáveis, se houver

## Limitações ou próximos passos
- Validação manual e riscos
```

## Deploy

Fluxo normal: `git push` para `main` e redeploy automático na Vercel. Produção: `https://flyerchurch.vercel.app`.

Em ambientes sem acesso a git/GitHub (ex.: sessão Cowork sem repositório vinculado), o deploy pode ser feito por upload direto de arquivos à Vercel (`deploy_to_vercel`), que substitui a árvore inteira do projeto a cada chamada — não há merge incremental. Se o payload dos ~40 arquivos essenciais exceder o limite de tokens de saída de uma chamada, minifique o código-fonte antes de enviar (ex.: `esbuild <arquivo> --jsx=preserve --minify-whitespace`, sem `--format=esm` para preservar `export const runtime`/`export const maxDuration` inline e o formato original dos font loaders do `next/font/google`; remova qualquer `"use strict"` que o esbuild adicione antes de uma diretiva `"use client"`). `next.config.js` tem `typescript.ignoreBuildErrors: true` para tolerar a perda de anotações de tipo nesse processo — o código-fonte no repositório continua com tipos completos e `npx tsc --noEmit` limpo.

Variáveis possíveis: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`. Consulte `.env.example`. Nunca commite `.env.local` ou credenciais. Os nomes das variáveis são sensíveis a maiúsculas/minúsculas — cadastre exatamente com esses nomes (ex: `OPENROUTER_API_KEY`, não `openrouter_key`), senão a rota trata como não configurada.

`GOOGLE_API_KEY` precisa ser de um projeto do Google Cloud com faturamento (billing) habilitado: a partir de 2026 a Google não libera cota gratuita para o modelo `gemini-2.5-flash-image` (a chamada falha com HTTP 429 `RESOURCE_EXHAUSTED` e `limit: 0` no tier grátis). Habilitar billing no projeto ligado à chave, em ai.google.dev/pricing ou console.cloud.google.com, sem necessariamente gerar custo alto — a extração de template (OpenRouter) continua gratuita.
