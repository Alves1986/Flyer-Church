# Brand DNA — Especificação Inicial

## Objetivo

Brand DNA é a representação estruturada da identidade visual de uma igreja. Ele permite criar novos flyers consistentes sem exigir que o usuário envie um flyer de referência a cada evento.

O Brand DNA não substitui revisão humana. Ele orienta geração, layout, seleção de ativos e variações de campanha.

## Princípios

- Começar com configuração explícita e referências aprovadas
- Guardar dados estruturados, não somente um prompt longo
- Versionar alterações de marca
- Separar identidade global da igreja de regras por tipo de evento
- Não copiar literalmente artes de referência
- Permitir que um administrador corrija sugestões da IA

## Estrutura proposta

```ts
export type BrandDna = {
  version: number
  organizationId?: string
  name: string
  voice: string[]
  palette: {
    primary: string[]
    secondary: string[]
    neutrals: string[]
    avoid: string[]
  }
  typography: {
    headline?: string
    body?: string
    rules: string[]
  }
  composition: {
    preferred: string[]
    avoid: string[]
    textSafeAreas: string[]
  }
  imagery: {
    subjects: string[]
    mood: string[]
    treatments: string[]
    avoid: string[]
  }
  motifs: string[]
  logoRules: string[]
  copyRules: string[]
  negativeRules: string[]
  approvedAssetIds: string[]
  eventOverrides: Record<string, Partial<BrandDna>>
  confidence: number
  approvedByHuman: boolean
}
```

## Fontes de informação

1. Formulário da igreja: nome, tom, público, paleta e fontes
2. Logo e arquivos aprovados
3. Flyers de referência classificados como aprovados ou rejeitados
4. Feedback em cada geração
5. Templates usados com frequência

## Pipeline futuro

1. Usuário envia referências e responde perguntas curtas.
2. IA propõe um Brand DNA estruturado.
3. Administrador revisa, corrige e aprova.
4. A geração recebe Brand DNA + categoria do evento + dados do evento + formato + ativos aprovados.
5. Após uso, aprovação e rejeição alimentam preferências futuras.

## Eventos e variações

A identidade global pode ter variações. Exemplo: culto semanal pode ser acolhedor e fotográfico; ceia pode ser sóbria e minimalista; jovens pode ter contraste maior. Isso deve ser modelado por `eventOverrides`, sem criar marcas independentes e incoerentes.

## Dados de aprendizado permitidos

Registrar com consentimento e transparência:

- Template escolhido
- Resultado aprovado, rejeitado ou publicado
- Motivo de rejeição selecionado pelo usuário
- Alterações feitas antes de baixar
- Formato de exportação

Nunca use mídia ou dados de uma organização para gerar resultados de outra.

## Próximo incremento técnico

Antes de criar multi-tenancy, adicionar opcionalmente `visualProfile` ao `FlyerTemplate`, preservando compatibilidade com os templates existentes. O prompt atual continua como fonte de geração; o perfil estruturado melhora validação, filtros e evolução posterior.
