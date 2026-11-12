# Lista de assinaturas no SEI

**Seções**: 1. Objetivo · 2. Fora do escopo · 3. Decisões a confirmar · 4. Regras decididas · 5. O que muda · 6. Etapas · 7. Testes manuais

- **Situação:** em andamento (etapa 1 feita na v0.2.0)
- **Pedido em:** 12/11/2026 · **Prazo ou prioridade:** fazer agora, antes da etapa 2 de `base-e-sei.md` (não depende dela)
- **Versão prevista:** 0.2.0 (próxima funcionalidade nova; uma versão por etapa: 0.2, 0.3, 0.4)

## 1. Objetivo (para quê)

O usuário recebe uma lista de processos e documentos para assinar ou só dar ciência (ex.: `23236.021417/2026-95 - 3383423 dar ciência`). Hoje ele procura um a um no SEI. Com esta melhoria, ele cola a lista num painel flutuante no próprio SEI e passa de item em item com Anterior/Próximo, vendo o contador (8/28) e o que falta. Dá certo quando ele assinar uma lista de 28 itens sem digitar nenhum número.

## 2. Fora do escopo

- Assinar ou dar ciência sozinho: a extensão só abre o item e, no máximo, clica no botão do SEI; a senha e a confirmação são sempre do usuário.
- Perceber sozinho que o documento foi assinado (fica como ideia, se o "Feito" manual incomodar).
- Várias listas com nome, ou levar a lista para outro computador ou para a planilha.
- Abrir os documentos do bloco de assinatura do SEI (é outra função do SEI).

## 3. Decisões a confirmar

Nenhuma em aberto (todas respondidas no chat em 12/11/2026; ver seção 4).

## 4. Regras decididas

Decididas no chat em 12/11/2026.

- **Onde colar:** no painel do SEI, pelo botão "Colar lista", que abre uma caixa de texto.
- **Formatos aceitos (uma linha por item):** processo + documento + comentário (`23236.022730/2026-41 - 3383754 edital e todos os anexos`); só o processo (com ou sem comentário); só o número SEI do documento (com ou sem comentário); colunas coladas de planilha (tabulação); separadores ` - `, `;`, `,` ou só espaço. Linhas em branco são ignoradas. O processo segue a máscara `NNNNN.NNNNNN/AAAA-DD`; o documento é o número SEI (só algarismos, hoje com 7).
- **Linha não reconhecida:** antes de começar, o painel mostra as linhas em vermelho; o usuário corrige ou começa só com as boas.
- **Guardar:** no navegador (`storage.local`), até o usuário clicar em "Limpar lista": os itens, a posição atual, os feitos e a posição do painel. Continua depois de fechar o Firefox. Nada vai para a internet.
- **Abrir:** na mesma aba, pela pesquisa rápida do SEI (caixa de busca no alto da página). Com o número do documento, abre o documento; sem ele, abre o processo.
- **Navegar:** "Anterior" e "Próximo" passam sem marcar; "Feito ✓ e próximo" marca o item e abre o seguinte. Contador "8/28 · 7 feitos".
- **Lista completa:** o painel abre a lista inteira com a situação de cada item (feito/pendente); um clique leva a qualquer item.
- **Comentário em destaque:** o comentário da linha aparece bem visível; item cujo comentário tem "ciência" ou "ciencia" é de **ciência** e aparece em outra cor, para não assinar por engano.
- **Botões do SEI no painel:** "Assinar" (item de assinatura com documento) ou "Dar ciência" (item de ciência). Só clicam no botão do próprio SEI; a senha e a confirmação continuam com o usuário. Sem documento: só abre o processo (o "Dar ciência" do processo vale se o comentário pedir ciência).
- **Endereço (12/11/2026):** a extensão age no SEI só em `sei.ifto.edu.br` (antes, qualquer `*.ifto.edu.br`). Vale para a extensão toda: muda o `manifest.json` e a regra de `docs/regras/sei.md`. Outros sites (SUAP etc.), quando vierem, entram cada um com o seu endereço.
- **Posição padrão do painel (12/11/2026):** canto superior direito da tela do SEI, na altura da barra de botões do processo e à direita dela, sem cobrir os botões. A barra (`#divArvoreAcoes`) fica dentro do quadro da direita (`#divIframeVisualizacao`); o painel fica na página principal, alinhado ao topo desse quadro e encostado na borda direita. Nas páginas sem processo aberto, no mesmo canto, logo abaixo da barra do alto do SEI. Modelos: `ferramentas-de-teste/paginas-sei/botoes SEI.html` e `SEI - 23236.022473_2026-47.html`. Botão "Voltar ao lugar padrão" no painel.
- **Painel:** flutuante, pode ser arrastado (a posição fica guardada) e minimizado para uma barrinha com o contador. Atalhos: Alt+→ (próximo), Alt+← (anterior).
- **Quando aparece:** sem lista, só um botãozinho "Lista de assinaturas" num canto; com lista, o painel (aberto ou minimizado) em todas as páginas do SEI.
- **Para quem (12/11/2026):** a função é da **Direção-geral** (unidade `PAL/REI/IFTO` no SEI). A extensão lê a unidade aberta no campo do alto do SEI (`#lnkInfraUnidade`: texto `PAL/REI/IFTO`, título "Direção-geral do Campus Palmas") a cada página, porque o usuário pode trocar de unidade no meio do trabalho.
- **Configurações:** opção "Lista de assinaturas no SEI" com três escolhas: **Automática** (padrão: liga só quando a unidade aberta é a `PAL/REI/IFTO`), **Sempre ligada** (qualquer unidade) e **Desligada**. Nas outras unidades, a função só aparece se o usuário escolher "Sempre ligada". Desligada ou em outra unidade: o botãozinho e o painel somem, mas a lista continua guardada. A "Automática" ligada na Direção-geral é exceção à regra do `padrao-visual.md` de só mudar o site com a função ligada (anotar lá).
- **Perfis no futuro:** quando houver perfis padronizados (Direção-geral, Contratos, Licitação…; ideia em `melhorias-futuras.md`), a "Automática" passa a seguir o perfil da unidade.

## 5. O que muda

- Sites e páginas em que a extensão age: todas as páginas do SEI do IFTO (só `sei.ifto.edu.br`), menos as janelinhas internas (ex.: a de assinatura).
- Dados lidos ou gravados: só no navegador (`storage.local`, chave `listaAssinaturas`). No SEI, nada é gravado pela extensão: ela preenche a pesquisa rápida e, a pedido, clica nos botões "Assinar" e "Ciência", que pedem a confirmação do próprio SEI.
- A pesquisa rápida fica na página principal (`#frmProtocoloPesquisaRapida`, `#txtPesquisaRapida`); os botões do SEI ficam no quadro da direita, com os títulos "Assinar Documento" e "Ciência" (`botoes SEI.html`).
- Telas da extensão: painel flutuante e botãozinho nas páginas do SEI; uma opção nas configurações (Automática / Sempre ligada / Desligada). `padrao-visual.md`: painel e exceção da opção automática.
- Arquivos de código prováveis: `comum/lista-assinaturas.js` (ler as linhas, regra pura) e `testes/lista-assinaturas.test.js`; `sites/sei/lista-assinaturas.js` e `.css` (painel); `manifest.json`; configurações. Atualizar `docs/arquitetura.md`.

## 6. Etapas

Cada etapa cabe numa conversa curta (`/etapa lista-assinaturas <n>`) e termina com testes, versão e commit.

- [x] Etapa 1 – **Ler a lista e abrir um a um** (v0.2.0, feita em 12/11/2026). Restringir a extensão a `sei.ifto.edu.br` (`manifest.json`, `regras/sei.md`, `arquitetura.md`). Ler a unidade aberta (regra pura com teste) e mostrar a função só na `PAL/REI/IFTO`. Regra pura que lê as linhas (todos os formatos da seção 4, com testes no Node usando o exemplo `ferramentas-de-teste/paginas-sei/documentos assinar.txt`); botãozinho e painel no SEI: colar a lista, linhas não reconhecidas em vermelho, guardar, contador, Anterior/Próximo, abrir pela pesquisa rápida, arrastar o painel (posição padrão à direita da barra de botões), Limpar lista. Teste: na unidade PAL/REI/IFTO, colar o arquivo de exemplo, passar por três itens (processo com documento, só processo e só documento) e fechar e abrir o Firefox para ver a posição guardada. Conferir que a pesquisa rápida do SEI 5 abre o documento pelo número.
- [ ] Etapa 2 – **Feito, lista completa e conforto** (v0.3.0). "Feito ✓ e próximo", contador de feitos, lista completa clicável, comentário em destaque e cor dos itens de ciência, minimizar, atalhos Alt+→ e Alt+←, opção nas configurações (Automática / Sempre ligada / Desligada). Teste: marcar feitos, pular pela lista completa, minimizar; trocar para outra unidade e ver o painel sumir; escolher "Sempre ligada" e vê-lo voltar; escolher "Desligada".
- [ ] Etapa 3 – **Botões "Assinar" e "Dar ciência" no painel** (v0.4.0). Localizar os botões do SEI 5 (páginas salvas em `ferramentas-de-teste/paginas-sei/`) e clicar neles a pedido. Teste (crítico, grava no SEI): num documento real da lista, clicar em "Assinar" no painel e ver a janela de assinatura do SEI pedir a senha; num item de ciência, ver o SEI pedir a confirmação.
- [ ] Fim: regras para `docs/regras/sei.md`, painel em `docs/padrao-visual.md`, linha sai de `melhorias-futuras.md`, spec para `feitas/`.

## 7. Testes manuais

Os testes de cada etapa vão para o `TESTES-PENDENTES.md` (números T…).
