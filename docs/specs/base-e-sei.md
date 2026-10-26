# Base da extensão e melhorias do SEI

- **Situação:** rascunho (falta a entrevista com o usuário: `/planejar base-e-sei`)
- **Pedido em:** 25/10/2026 · **Prazo ou prioridade:** primeira melhoria da extensão
- **Versão prevista:** 0.1.0

## 1. Objetivo (para quê)

Voltar a ter no SEI do IFTO as funções úteis do SEI++ (que parou de funcionar), numa extensão própria que depois também vai ler a planilha do sistema. Dá certo quando o usuário usar no dia a dia as funções escolhidas, no SEI do IFTO, sem o SEI++.

## 2. Fora do escopo

- Login Google e leitura da planilha (melhoria seguinte).
- Solicitação de nota de empenho e outros sites.
- Chrome e assinatura da Mozilla.

## 3. Decisões a confirmar

- [ ] D1 – Qual é a versão do SEI do IFTO (rodapé ou tela de login)?
  - Resposta:
- [ ] D2 – Quais funções do SEI++ eram úteis e quais ainda funcionam nas versões de teste (T01 e T02)?
  - Resposta:
- [ ] D3 – Aproveitar o código do SEI++ (a extensão passa a ser GPL-3.0, código aberto se for distribuída) ou escrever do zero usando o SEI++ só como inspiração? Sugestão do Claude: aproveitar, só as funções escolhidas, porque já foram testadas no SEI.
  - Resposta:
- [ ] D4 – Linguagem do código: JavaScript simples (como o SEI++, sem compilação) ou TypeScript (como o sistema, com compilação)? Sugestão do Claude: a decidir depois de D3; se aproveitar o SEI++, JavaScript simples evita reescrever.
  - Resposta:

## 4. Regras decididas

- Ver `docs/regras/geral.md` e `docs/regras/sei.md`.

## 5. O que muda

- A definir depois das decisões.

## 6. Etapas (proposta, a ajustar depois das decisões)

- [ ] Etapa 1 – Esqueleto da extensão (manifest, ícone, janela do ícone, configurações para ligar e desligar funções) e comandos do `web-ext`; instalação temporária no Firefox.
- [ ] Etapa 2 – Primeiras funções do SEI escolhidas em D2.

## 7. Testes manuais

Os testes de cada etapa vão para o `TESTES-PENDENTES.md` (números T…). Antes: T01 e T02 (levantamento das funções do SEI++ no SEI do IFTO).
