# <Nome da melhoria>

**Seções**: 1. Objetivo · 2. Fora do escopo · 3. Decisões a confirmar · 4. Regras decididas · 5. O que muda · 6. Etapas · 7. Testes manuais

- **Situação:** rascunho | aguardando decisões | pronta para programar | em andamento | feita
- **Pedido em:** dd/mm/aaaa · **Prazo ou prioridade:** …
- **Versão prevista:** 0.NN.0

## 1. Objetivo (para quê)

Uma ou duas frases: que problema do usuário isso resolve e como ele vai saber que deu certo.

## 2. Fora do escopo

O que **não** será feito agora (evita que a etapa cresça).

## 3. Decisões a confirmar

O Claude não programa enquanto houver `[ ]` que afete a etapa. O usuário marca `[x]` e escreve a resposta, ou risca a pergunta.

- [ ] D1 – Pergunta? Opções: (a) … (b) … Sugestão do Claude: … porque …
  - Resposta:

## 4. Regras decididas

Uma linha por regra. No fim da melhoria, estas linhas vão para `docs/regras/`.

## 5. O que muda

- Sites e páginas em que a extensão age: …
- Dados lidos ou gravados (planilha do sistema, SEI, outros): …
- Telas da extensão (janela do ícone, configurações, o que aparece nas páginas): …
- Arquivos de código prováveis: …

## 6. Etapas

Cada etapa cabe numa conversa curta (`/etapa <nome-da-spec> <n>`) e termina com testes, versão e commit.

- [ ] Etapa 1 – … (o que fica pronto e como testar)
- [ ] Etapa 2 – …

## 7. Testes manuais

Os testes de cada etapa vão para o `TESTES-PENDENTES.md` (números T…).
