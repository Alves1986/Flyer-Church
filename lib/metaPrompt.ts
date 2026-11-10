/**
 * Meta-prompt de extração — fornecido pelo Anderson.
 * Usado como instrução de sistema/tarefa na chamada de visão (Etapa 1: Extração).
 * Não editar variáveis aqui sem atualizar o parser de placeholders em lib/promptMerge.ts.
 */
export const META_PROMPT_EXTRACAO = `Analise profundamente a imagem de referência fornecida (o flyer de exemplo). Sua tarefa é desconstruir esta imagem e criar um prompt de geração de imagem (Creation Prompt) detalhado e técnico.

O prompt resultante deve ser capaz de recriar exatamente a mesma identidade visual, layout, estilo artístico, esquema de cores, iluminação e tipografia da referência, mas com as informações textuais específicas substituídas por variáveis genéricas editáveis, e os elementos visuais principais incorporando marcadores de posição para imagens fornecidas.

NÃO EXTRAIA A PESSOA: a aparência física, gênero ou pose específica da pessoa na imagem de referência não deve ser incluída no prompt de criação. Em vez disso, o prompt de criação deve instruir a incorporação de imagens fornecidas.

Siga estas diretrizes estritas para construir o prompt de saída:

1. Estilo e Identidade Visual: descreva com precisão o estilo (ex: Gospel Moderno, Minimalista, Dark Elegante, Futurista). Defina a paleta de cores exata e a atmosfera luminosa (ex: iluminação cinematográfica, tons de cobre e teal, gradientes suaves). Ordene que o prompt final mantenha essas cores para consistência futura.

2. Composição e Layout: descreva onde cada elemento está posicionado (centralizado, alinhado à esquerda). Descreva o fundo e quaisquer elementos gráficos sobrepostos (ex: formas geométricas, fumaça, luzes).

3. Incorporação de Imagens e Logotipos:
   - Onde houver a pessoa (preletor) na referência: substitua por "O preletor é representado pela imagem fornecida em [FOTO_PRELETOR_ANEXADA], integrada harmoniosamente com a iluminação e estilo visual da composição."
   - Onde houver o logotipo na referência: substitua por "O logotipo da igreja é baseado em [LOGO_IGREJA_ANEXADO] e posicionado conforme a referência."

4. Mapeamento de Variáveis de Texto — localize as informações de texto na imagem de referência e substitua-as pelas seguintes variáveis exatas entre colchetes, mantendo a mesma posição e estilo de fonte original:
   - data → [DATA_EVENTO]
   - hora → [HORA_EVENTO]
   - nome da igreja → [NOME_IGREJA]
   - nome do preletor → [NOME_PRELETOR]
   - nome/título do evento (texto de destaque, geralmente grande, tipográfico, no fundo ou centro da peça) → [NOME_EVENTO]
   - versículo ou frase → [FRASE_BIBLICA]

5. Posições de Texto (textPositions) — para CADA variável de texto detectada, estime sua posição, tamanho, fonte e cor na imagem de referência (assumindo canvas 1080x1350 feed). Retorne coordenadas em pixels, fonte (nome padrão: Inter, Playfair Display, Montserrat, etc.), tamanho em px, cor em hex, alinhamento e line-height.

SAÍDA ESPERADA: Um objeto JSON válido (sem markdown, sem texto extra) com exatamente dois campos:
{
  "prompt": "prompt de criação longo e descritivo em português...",
  "textPositions": [
    {
      "variable": "NOME_EVENTO",
      "x": 540, "y": 200, "maxWidth": 900,
      "fontFamily": "Playfair Display", "fontSize": 72,
      "color": "#BB9E49", "align": "center", "lineHeight": 1.1
    },
    {
      "variable": "DATA_EVENTO",
      "x": 540, "y": 320, "maxWidth": 600,
      "fontFamily": "Inter", "fontSize": 28,
      "color": "#F5F0E4", "align": "center", "lineHeight": 1.3
    }
  ]
}

Coordenadas (x,y) em pixels relativos à imagem 1080x1350 (feed).
Cores em hex. Fontes: use nomes padrão (Playfair Display, Inter, Montserrat, etc.).
Se não conseguir estimar posição exata, use layout padrão centralizado.`;

/** Rótulos amigáveis para exibir no formulário de preenchimento. */
export const ROTULOS_VARIAVEIS: Record<string, string> = {
  DATA_EVENTO: "Data do evento",
  HORA_EVENTO: "Horário",
  NOME_IGREJA: "Nome da igreja",
  NOME_PRELETOR: "Nome do preletor",
  NOME_EVENTO: "Nome / título do evento",
  FRASE_BIBLICA: "Frase ou versículo bíblico",
};

/**
 * Meta-prompt de proposta de Brand DNA (Fase 2 — docs/brand-dna.md).
 * Usado para pedir a um modelo de IA (texto ou visão, se houver referências
 * anexadas) que proponha um perfil visual estruturado a partir de respostas
 * curtas de um formulário e, opcionalmente, flyers de referência já aprovados
 * pela igreja. A saída deve ser exclusivamente um objeto JSON — sem markdown,
 * sem comentários — com os campos abaixo (os campos de controle do app, como
 * version/approvedByHuman/approvedAssetIds/eventOverrides, não fazem parte da
 * proposta e são preenchidos pelo próprio app).
 */
export const META_PROMPT_BRAND_DNA = `Você é um diretor de arte especializado em identidade visual de igrejas e comunicação cristã. Com base nas respostas do formulário abaixo e, se fornecidas, nas imagens de flyers de referência já aprovados pela igreja, proponha um perfil de identidade visual estruturado ("Brand DNA").

Regras importantes:
- Responda SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, sem comentários.
- Não copie literalmente nenhuma arte de referência: extraia padrões (paleta, tipografia, composição, tom, motivos), não o conteúdo específico de um evento.
- Escreva os valores em português, de forma objetiva e utilizável como instrução para geração de imagem.
- Cores em "palette" devem ser descritas como nome + código hex quando possível (ex: "dourado envelhecido (#BB9E49)").
- Preencha "confidence" com um número de 0 a 1 representando o quanto as respostas/referências foram suficientes para uma proposta segura (respostas vagas ou sem referência = confiança mais baixa).

Responda exatamente neste formato JSON:
{
  "name": "string curta identificando a marca/igreja",
  "voice": ["3 a 6 adjetivos de tom de voz, ex: acolhedor, contemporâneo, esperançoso"],
  "palette": {
    "primary": ["1 a 3 cores principais"],
    "secondary": ["1 a 3 cores de apoio"],
    "neutrals": ["1 a 3 neutros usados como fundo/texto"],
    "avoid": ["cores ou combinações a evitar"]
  },
  "typography": {
    "headline": "estilo de fonte de destaque sugerido (ex: condensada, serifada, manuscrita)",
    "body": "estilo de fonte de texto sugerido",
    "rules": ["2 a 4 regras curtas de uso tipográfico"]
  },
  "composition": {
    "preferred": ["2 a 4 padrões de composição preferidos"],
    "avoid": ["2 a 4 padrões a evitar"],
    "textSafeAreas": ["áreas da imagem que devem ficar livres de elementos gráficos para texto"]
  },
  "imagery": {
    "subjects": ["tipos de assunto/fotografia preferidos"],
    "mood": ["2 a 4 adjetivos de atmosfera/luz"],
    "treatments": ["tratamentos visuais recorrentes, ex: granulado, alto contraste, gradiente"],
    "avoid": ["o que evitar em imagens/fotos"]
  },
  "motifs": ["2 a 5 elementos gráficos ou motivos recorrentes"],
  "logoRules": ["1 a 3 regras de uso do logotipo"],
  "copyRules": ["1 a 3 regras de tom para textos/CTAs"],
  "negativeRules": ["1 a 4 restrições explícitas do que a IA nunca deve gerar para esta marca"],
  "confidence": 0.0
}`;
