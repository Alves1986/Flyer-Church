# Roadmap de Produto — FlyerForge

## Norte

O FlyerForge deve se tornar o sistema de criação visual para igrejas: uma plataforma que preserva identidade, reduz trabalho repetitivo e torna a comunicação de eventos mais clara e digna da mensagem comunicada.

O diferencial não é apenas gerar imagens. É converter referências aprovadas em uma memória visual reutilizável por cada igreja.

## Métrica de valor

A principal métrica é a taxa de artes geradas que são realmente aprovadas e publicadas. Métricas auxiliares: tempo até primeira arte, tempo economizado, taxa de edição externa e retenção semanal da equipe de mídia.

## Fase 0 — Piloto real

Objetivo: validar valor com uma igreja durante 4 a 8 semanas.

- Criar template por análise de flyer de referência
- Detectar variáveis e gerar flyer
- Permitir download
- Registrar, ao menos localmente, aprovação, rejeição e motivo
- Testar os casos: culto semanal, evento especial e aviso institucional
- Medir tempo antes/depois e taxa de publicação

Critério de saída: equipe consegue produzir arte utilizável sem depender de editor externo na maior parte dos casos.

## Fase 1 — Consistência operacional

- Presets para Feed 1080x1350, quadrado, Story 1080x1920 e WhatsApp
- Duplicar e reutilizar templates
- Categorias: culto, jovens, ceia, conferência, vigília e aviso
- Campos estruturados de evento
- Biblioteca de logos, fotos e fundos
- Histórico de gerações quando houver infraestrutura
- Status: rascunho, gerado, aprovado, rejeitado, publicado
- Captura de feedback simples: “representa nossa igreja?” de 1 a 5

## Fase 2 — Brand DNA

- Perfil visual estruturado por template e por igreja
- Paleta, regras de tipografia, composição, tom e estilos proibidos
- Regras por categoria de evento
- Análise de múltiplos flyers aprovados
- Preferências derivadas de aprovação, edição e rejeição
- Geração de variações mantendo a marca
- Texto crítico em camadas editáveis e renderização determinística

## Fase 3 — SaaS multi-igreja

- Auth e organizações
- Papéis: owner, admin, designer, editor, viewer
- Isolamento de dados por `organization_id` e RLS
- Onboarding self-service
- Usuários e ministérios por igreja
- Planos, créditos e controle de consumo
- Auditoria de ações e versões

## Fase 4 — Copiloto de comunicação

- Calendário editorial
- Campanhas com várias peças consistentes
- Sugestão de formatos faltantes
- Legendas, CTAs e textos para canais sociais
- Fluxos de aprovação
- Integrações com inscrição, calendário e automações

## Fora de escopo agora

- Substituir Canva em recursos avançados
- Treinar modelo próprio por igreja
- Obrigatoriedade de login ou banco
- Cobrança antes de validação de valor
- Publicação automática em redes sociais sem revisão humana
