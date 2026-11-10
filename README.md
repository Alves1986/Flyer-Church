<p align="center">
  <img src="public/brand/logo-horizontal.png" alt="Flyer Church" width="420" />
</p>

# Flyer Church

Gerador de flyers a partir de um flyer de referência: extrai a identidade
visual uma vez (estilo, paleta, layout, tipografia) e reaproveita esse
template para gerar um novo flyer a cada evento, com a foto do preletor e
o logo da igreja de cada cliente.

## Como funciona

1. **Extrair template** (`/templates/novo`) — envie um flyer de referência.
   O app chama a Anthropic (Claude, com visão) usando o meta-prompt fixo em
   `lib/metaPrompt.ts` e recebe de volta um prompt de criação com variáveis
   entre colchetes (`[DATA_EVENTO]`, `[NOME_PRELETOR]`, `[FOTO_PRELETOR_ANEXADA]`
   etc.). Esse prompt fica salvo como um template reutilizável.
2. **Gerar flyer** (`/flyers/novo/[id]`) — escolha um template, preencha os
   campos detectados automaticamente a partir das variáveis do prompt, envie
   a foto do preletor e o logo, e gere. O app mescla os valores no prompt e
   chama a API de geração de imagem (Gemini 2.5 Flash Image, por padrão) com
   o prompt final + as duas imagens como referência multimodal.

Por padrão os **templates e o histórico ficam no `localStorage` do
navegador** — não precisa de banco de dados para testar. Isso permite ver o
app funcionando assim que fizer o deploy, sem configurar nada além das
chaves de IA. Quando quiser multiusuário / múltiplos dispositivos, conecte
um banco Postgres da própria Vercel — veja "Persistência com Vercel
Postgres" abaixo.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
Vercel Postgres + Vercel Blob (opcionais) · identidade visual preto +
dourado.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

## Configurar as chaves de IA

Sem essas variáveis, os botões de extrair/gerar mostram um aviso claro em
vez de travar. Adicione em **Vercel → Project Settings → Environment
Variables**:

| Variável | Para quê | Onde conseguir |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Extração (visão) — **provedor padrão, grátis** | openrouter.ai/keys |
| `ANTHROPIC_API_KEY` | Extração (visão) — alternativa paga (Claude) | console.anthropic.com |
| `GOOGLE_API_KEY` | Geração da imagem final (Gemini 2.5 Flash Image) | aistudio.google.com/apikey |

Depois de adicionar, redeploy o projeto para as variáveis surtirem efeito.

### Extração com OpenRouter (grátis)

O formulário em `/templates/novo` tem um seletor de "Modelo de IA". Por
padrão ele usa a **OpenRouter** com um modelo gratuito (o seletor busca ao
vivo em `/api/openrouter-models`, que lê o catálogo público da OpenRouter e
filtra só modelos `:free` com suporte a imagem — hoje isso inclui modelos
como *Thinking Machines: Inkling* e *Dots3-Note Preview*; se a lista ao vivo
falhar, cai para uma lista de reserva em `lib/openrouter.ts`).

Mesmo nos modelos gratuitos, a OpenRouter exige uma chave de API (grátis,
sem cartão) — crie a sua em [openrouter.ai/keys](https://openrouter.ai/keys).
O tier grátis tem limite de ~20 requisições/minuto e 50/dia (sobe para
1000/dia depois de adicionar US$10 de crédito à conta, mesmo sem gastar
esse crédito).

Se preferir, o seletor também tem a opção "Anthropic Claude (sua chave)",
que usa `ANTHROPIC_API_KEY` como antes.

A etapa de **geração** da imagem final continua usando `GOOGLE_API_KEY`
(Gemini 2.5 Flash Image) — a OpenRouter não tem, até o momento, um modelo
de geração de imagem gratuito; ver `app/api/generate/route.ts` para trocar
de provedor nessa etapa no futuro.

### Trocando o modelo de geração

`app/api/generate/route.ts` está isolado justamente para isso: se depois de
testar você preferir Flux.2 Pro, GPT Image ou outro modelo com melhor
qualidade de texto embutido (datas, versículos), troque a chamada fetch
dentro desse arquivo — o resto do app (formulário, merge de prompt,
preview) não muda.

## Persistência com Vercel Postgres (opcional)

O app funciona sem banco (localStorage), mas já está preparado para usar o
**Postgres da própria Vercel** (Neon por baixo dos panos) assim que você
conectar um:

1. No dashboard do projeto na Vercel, abra a aba **Storage** → **Create
   Database** → **Postgres** (integração nativa com a Neon) → conecte ao
   projeto.
2. A Vercel injeta `DATABASE_URL` (e variações) automaticamente nas
   variáveis de ambiente. Redeploy o projeto.
3. Pronto — `app/api/templates` e `app/api/flyers` passam a ler/escrever
   no banco em vez de responder "não configurado", e `lib/store.ts` no
   navegador usa o banco automaticamente (com fallback para localStorage
   se algo falhar). As tabelas são criadas sozinhas na primeira chamada
   (`lib/db.ts`, `ensureSchema`) — o schema também está documentado em
   `db/schema.sql` caso prefira rodar a migração manualmente.

Para persistir as imagens (logo, foto do preletor, flyer gerado) em vez de
só base64 embutido, conecte também um **Blob store**: Storage → Create
Database → **Blob**. Isso injeta `BLOB_READ_WRITE_TOKEN` e habilita o
upload em `app/api/upload`.

Nada disso é obrigatório — é um caminho de evolução opcional, não um
requisito para rodar o app.

## Deploy

### 1. Suba o código para o GitHub

Este projeto já vem com um repositório git inicializado e o commit inicial
pronto — só falta apontar para o seu GitHub e enviar:

```bash
git remote add origin https://github.com/SEU-USUARIO/flyerforge.git
git push -u origin main
```

(crie o repositório vazio antes em github.com/new, sem README/gitignore
para não conflitar com o que já vem neste projeto).

### 2. Importe na Vercel

- Vá em [vercel.com/new](https://vercel.com/new), importe o repositório
  recém-criado e clique em **Deploy** — a Vercel detecta o Next.js
  automaticamente, não precisa configurar nada.
- Depois do primeiro deploy, adicione as variáveis de ambiente da seção
  acima (chaves de IA e, se quiser, o banco/Blob) em **Project Settings →
  Environment Variables** e faça um redeploy.
- A partir daí, todo `git push` na branch `main` gera um novo deploy
  automaticamente.

## Estrutura do projeto

```
app/
  api/
    extract/            # visão (OpenRouter grátis ou Anthropic) — extrai o prompt do flyer de referência
    generate/           # geração de imagem (Gemini) — compõe o flyer final
    openrouter-models/  # lista modelos grátis com visão da OpenRouter (para o seletor)
    templates/          # CRUD de templates (Vercel Postgres, opcional)
    flyers/             # histórico de flyers gerados (Vercel Postgres, opcional)
    upload/             # upload de imagens (Vercel Blob, opcional)
  templates/novo/       # tela de extração de identidade visual
  flyers/novo/[id]/     # tela de geração de um novo flyer
  icon.png, apple-icon.png, opengraph-image.png   # favicon e preview social
components/       # UI compartilhada (Header, dropzone de upload)
lib/              # tipos, merge de prompt, storage híbrido (DB + localStorage), cliente OpenRouter
db/schema.sql     # schema de referência do Postgres
public/brand/     # logo (SVG fonte + PNGs exportados)
```
