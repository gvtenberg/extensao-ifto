# Testes pendentes: só a fonte dos cartões do GitHub (formato no CLAUDE.md, seção Testes)

## Levantamento: SEI++ antigo no SEI do IFTO
> No computador de desenvolvimento (os pacotes ficam em ferramentas-de-teste/seipp/, fora do git). Desative o SEI Pro e outros SEI++; teste uma versão por vez.
### T01 – SEI++ 5.1.1 (2022)
F: Carregue seipp-v5.1.1.xpi em about:debugging (Carregar extensão temporária). No SEI, abra Controle de Processos, um processo e um documento; veja as opções no ícone do SEI++.
E: Comente quais funções aparecem, quais funcionam e quais eram úteis.
### T02 – SEI++ 6.0 beta (commit c53f1367, 2025)
F: Igual ao T01, com seipp-c53f136.xpi.
E: Comente o que funciona e o que não, comparando com o T01.

## Base da extensão e botão Novo documento (v0.1.0)
> Desative o SEI++ e o SEI Pro, para não aparecerem dois botões.
### T03 – Janela da extensão e Configurações (v0.1.0)
F: Com a extensão instalada (T11), clique no ícone dela > Configurações.
E: A janela mostra o nome e a versão; Configurações abre uma aba com "Botão Novo documento sempre visível" marcado.
### T04 – SEI reconhecido (v0.1.0)
F: Abra o Controle de Processos do SEI e clique no ícone da extensão.
E: Aparece em verde "SEI do IFTO reconhecido (versão 5.0.4)" (texto mudado na v0.4.1). Se ficar a mensagem amarela, comente o endereço do SEI na barra.
### T05 – Botão "Novo documento" sempre visível (v0.1.0)
F: Abra um processo e clique num documento da árvore onde o botão Incluir documento não aparecia; clique no botão. Desmarque a opção nas Configurações, aperte F5 e repita.
E: Marcada: o botão aparece no começo da barra e abre a escolha do tipo, sem repetir se o SEI já o mostra. Desmarcada: o SEI fica como era.

## Levantamento: nome e tamanho dos arquivos no SEI (etapas 2 e 3)
> No computador de desenvolvimento (arquivos em ferramentas-de-teste/arquivos-sei/, fora do git). Use um processo de teste; anexe por Incluir documento > Externo.
### T06 – Caracteres que o SEI não aceita no nome do arquivo
F: Anexe um a um os 20 arquivos da pasta caracteres.
E: Comente o número de cada arquivo recusado (com a mensagem) e de cada um com nome mudado (como ficou).
### T07 – Limite: 10 MB ou 10 MiB
F: Anexe A (9.900.000 bytes), B (10.200.000) e C (10.600.000) da pasta tamanhos.
E: Comente quais entraram e a mensagem do recusado. B recusado = 10 MB; B aceito e C recusado = 10 MiB.

## Perguntas (etapas 2 e 3; respostas vão para a spec base-e-sei, D11 a D13)
### P1 – Arquivo que não é PDF acima de 10 MB
?: Que tipos de arquivo além de PDF passam do limite (planilha, imagem, vídeo, .zip…)? O que fazem hoje: .zip, dividir, converter para PDF?
### P2 – Dica de compactação abaixo do limite
?: Sugerir compactar também abaixo de 10 MB? A partir de que tamanho? Só sugere ou pergunta antes de enviar?
### P4 – Dicas do pdf24.org
?: Que opção de compressão usam no pdf24.org quando o ilovepdf não resolve? Que tipo de PDF dá problema (digitalizado, muitas imagens, gerado por sistema)?

## Senha reconhecida pelo navegador no SEI 5 (v0.1.1)
### T08 – Senha na tela de entrada do SEI (v0.1.1)
F: Saia do SEI, entre de novo com usuário e senha e salve a senha quando o Firefox perguntar. Saia e abra a tela de entrada outra vez.
E: A senha aparece como ●. Na segunda vez o Firefox preenche ou oferece a senha guardada.
### T10 – Desligar a correção da senha (v0.1.1)
F: Configurações > desmarque "Navegador reconhece o campo de senha", recarregue a entrada do SEI e clique em Senha. Marque de novo.
E: Desmarcada, o Firefox não oferece a senha; marcada, oferece.

## Lista de assinaturas no SEI (v0.2.0 a v0.4.0)
> Instale a versão nova e entre no SEI com a unidade PAL/REI/IFTO (Direção-geral).
### T13 – Colar a lista e abrir os itens (v0.2.0)
F: No SEI, clique em "Lista de assinaturas" (canto superior direito), cole a sua lista do dia, clique em "Conferir e começar" e depois em "Próximo ▶" algumas vezes.
E: O painel fica à direita da barra de botões do processo, mostra "1/28", o processo, o documento e o comentário; cada clique abre o documento certo (ou o processo, quando a linha não tem documento). Comente se a busca do SEI não abrir o documento.
### T14 – Linhas não reconhecidas (v0.2.0)
F: Clique em "Limpar lista", cole a lista com uma linha errada (ex.: "23236.0214/2026-95") e clique em "Conferir e começar".
E: A linha errada aparece em vermelho; dá para corrigir ou "Começar só com as reconhecidas".
### T15 – Mover o painel e guardar a lista (v0.2.0)
F: Arraste o painel pela barra de cima, vá até o item 3, feche o Firefox, abra de novo e entre no SEI. Depois clique em "Lugar padrão".
E: O painel volta no lugar em que você o deixou e no item 3; "Lugar padrão" o devolve ao canto direito.
### T18 – Ciência, minimizar e atalhos (v0.3.0)
F: Vá a um item com "dar ciência", clique em "–" (minimizar) e depois em "▢"; com o documento aberto, aperte Alt+→ e Alt+←.
E: O item de ciência aparece em azul com "Só dar ciência"; minimizado, sobra uma barrinha com o contador; os atalhos passam para o próximo e voltam.
### T19 – Opção nas configurações (v0.3.0)
F: Configurações > Lista de assinaturas no SEI: escolha "Desligada", recarregue o SEI; depois "Sempre ligada" e troque para outra unidade; feche e abra o Firefox e veja a escolha.
E: Desligada, o painel some; "Sempre ligada", aparece em qualquer unidade; a escolha continua marcada depois de reabrir o Firefox.
### T25 – Dar ciência e próximo (v0.5.0)
F: Num item de "dar ciência", clique em "Dar ciência e próximo" e confirme no OK do SEI.
E: A ciência é registrada e o painel abre o próximo item, com o anterior marcado ✓.
### T27 – Instalar no Chrome (v0.5.0)
> No computador de desenvolvimento (ou com o .zip da Release, depois do git push).
F: Rode npm run empacotar-chrome, abra chrome://extensions > Modo do desenvolvedor > Carregar sem compactação > pasta web-ext-artifacts/chrome/extensao-ifto-chrome-0.5.0; entre no SEI na unidade PAL/REI/IFTO.
E: A extensão aparece sem erros, o painel da lista de assinaturas funciona e a janela do ícone mostra "Procurar atualização".

## Documentos do pagamento: preenchimento do documento externo (v0.6.0)
### T28 – Documento externo novo já preenchido (v0.6.0)
F: Num processo, clique em Incluir Documento > Externo (não salve).
E: Data de hoje, Nato-digital e Público já marcados, com o aviso verde "Preenchido pela extensão: confira…"; o botão "Novo documento" da extensão não aparece mais.
### T29 – Documento externo que já existe não muda (v0.6.0)
F: Abra um documento externo já incluído (com ou sem arquivo) e clique em Alterar; depois desmarque "Preencher documento externo novo" nas Configurações e repita o T28.
E: O documento existente fica como estava, sem aviso verde; com a opção desmarcada, o documento novo vem em branco, como no SEI.

## Documentos do pagamento: barra da extensão e botão da CGOC (v0.7.0)
### T30 – Botão da CGOC só com processo aberto (v0.7.0)
F: No SEI, na unidade CGOC/GAC/DAP/PAL/REI/IFTO, veja o Controle de Processos e depois abra um processo; troque para uma unidade sem função da extensão (ex.: outra coordenação).
E: No Controle de Processos não há botão nem barra; na outra unidade a barra não aparece; com o processo aberto aparece, no alto à direita, "IFTO Incluir Sicaf, Consulta e Anexo" (por enquanto, ao clicar, só avisa que chega na próxima versão).
### T31 – Lista de assinaturas na mesma barra (v0.7.0)
F: Na unidade PAL/REI/IFTO, veja o Controle de Processos e um processo; clique em "Lista de assinaturas". Depois, nas Configurações, ponha os dois em "Sempre ligada" e abra um processo.
E: O botão da lista fica no mesmo lugar de antes e o painel abre logo abaixo; com as duas ligadas, os dois botões ficam lado a lado.
### T32 – Configurações por unidade (v0.7.0)
F: Clique no ícone da extensão > Configurações.
E: Primeiro "Geral (todas as unidades)"; depois "Por unidade", com Direção-geral (lista de assinaturas) e CGOC (documentos do pagamento), cada uma com Automática, Sempre ligada e Desligada.

## Documentos do pagamento: incluir os três documentos (v0.8.0)
> Use um processo de teste (ou um processo de pagamento que vá mesmo receber os três), na unidade CGOC.
### T35 – Parar a inclusão (v0.8.0)
F: Em outro processo de teste, comece a inclusão e, enquanto o botão mostra "Incluindo…", clique nele e confirme que quer parar.
E: Aparece qual documento já foi incluído e a extensão não inclui mais nada.

## Documentos do pagamento: inclusão rápida (v0.9.0)
> Use um processo de teste, na unidade CGOC. Antes, em Firefox › about:debugging, clique em "Recarregar" na extensão (ou instale a versão nova).
### T36 – Incluir Sicaf, Consulta e Anexo direto, sem abrir telas (v0.9.0) (Crítico)
F: Abra um processo sem Sicaf, Consulta e Anexo, clique em "Incluir Sicaf, Consulta e Anexo" e em OK.
E: Nenhuma tela do SEI abre; em cerca de 1 a 3 segundos a árvore recarrega com Sicaf, Consulta e Anexo (data de hoje, Nato-digital, Público) e o botão mostra "Incluídos ✓". Se aparecer mensagem de erro, comente o texto e o que ficou na árvore.
### T37 – Pergunta curta antes de incluir (v0.9.0)
F: No mesmo processo do T36, clique de novo no botão e leia a pergunta; clique em Cancelar.
E: A pergunta é curta: "Este processo já tem Sicaf, Consulta e Anexo sem arquivo. Incluir mais três?"; nada é incluído.

### T39 – Intervalo de documentos na lista (v0.9.2)
F: Na lista de assinaturas, cole "23236.022730/2026-41 - 3383754-3383903" e clique em "Conferir e começar".
E: O processo abre e a linha vira um item para cada documento do processo entre 3383754 e 3383903 (o contador aumenta); "Assinar e próximo" passa por eles um a um.

### T40 – Intervalo sem o processo (v0.9.2)
F: Cole só "3383754 a 3383903" e comece.
E: Abre o documento 3383754 no processo dele e a linha vira os documentos desse processo no intervalo.

### T41 – Intervalo com documento externo ou de outro setor (v0.9.3)
F: Cole um intervalo de um processo que tenha, entre o primeiro e o último, um arquivo incluído (externo) e um documento de outro setor que não foi enviado em bloco de assinatura; clique em "Assinar e próximo" em cada item.
E: O arquivo externo não entra na lista. No documento de outro setor, a extensão não assina e pede para clicar em "Próximo"; se ele estiver em bloco de assinatura, assina normalmente.

### T42 – Erros e sugestões nas configurações (v0.9.4)
F: Clique no ícone da extensão > Configurações e role até o fim da página; clique em "abrir um pedido".
E: Aparece o quadro "Erros e sugestões de melhoria" com a orientação de procurar a CGOC; o link abre a página de pedidos numa nova aba.

### T43 – Novo ícone com a marca do IF (v0.9.5)
F: Depois de atualizar a extensão, olhe o ícone na barra do navegador (Firefox e Chrome), no tema claro e no escuro, e em Extensões (about:addons ou chrome://extensions).
E: Aparece a marca do Instituto Federal (bolinha vermelha e quadrados verdes), nítida e fácil de reconhecer. Se não ficar bom, comente no cartão para voltar ao ícone anterior.

### T44 – Vários documentos separados por vírgula (v0.9.6)
F: Cole na lista de assinaturas "23236.022824/2026-10 - 3384598, 3384598, 3384645, 3384674" e clique em "Conferir e começar"; depois limpe e cole "23236.022824/2026-10 - 3384598 a 3384674".
E: Na primeira forma, a lista tem 3 itens (3384598, 3384645, 3384674; o repetido conta uma vez). Na segunda, ao abrir o processo, a linha vira um item para cada documento do processo entre os dois números.

### T45 – Painel continua na tela ao abrir o processo (v0.9.6)
F: Clique no ícone da extensão; se aparecer "Permitir no SEI", clique e confirme. Na Direção-geral, cole uma lista e clique em "Conferir e começar"; depois aperte F5.
E: O processo abre e o painel da lista continua na tela, também depois de recarregar a página, sem precisar clicar no ícone da extensão.

### T46 – Atualizar pela página da versão (v0.9.7)
F: Com uma versão nova pronta, clique no ícone da extensão > Procurar atualização > Abrir a página da versão…; na página, clique no arquivo que termina em .xpi > Permitir > Adicionar.
E: Aparece só o botão "Abrir a página da versão…" (sem "Instalar a versão…"); a página abre numa nova aba e, depois de Adicionar, a janela do ícone mostra a versão nova.

## SICAF automático: notas sem SICAF (v0.10.0)
> Na CGOC (CGOC/GAC/DAP/PAL/REI/IFTO), com a opção "SICAF da nota fiscal" em Automática (padrão).
### T48 – Sem aviso quando o SICAF já está no processo (v0.10.0)
F: Abra um processo em que todas as notas depois da última Folha já têm Sicaf com o PDF; depois, abra um processo sem notas.
E: O aviso não aparece em nenhum dos dois; em outra unidade (não CGOC) ele também não aparece.

## SICAF automático: CNPJ selecionado (v0.11.0)
### T49 – Botão ao selecionar um CNPJ (v0.11.0)
F: Num documento do SEI (ex.: um ateste), selecione com o mouse só o CNPJ da empresa e clique no botão "Buscar SICAF" que aparece logo abaixo.
E: Abre a janela "Buscar SICAF" com o CNPJ e a mensagem "conferido"; selecionando um texto que não é CNPJ, o botão não aparece.
### T50 – Botão direito no PDF da nota (v0.11.0)
F: Abra no SEI o PDF de uma nota fiscal, selecione o CNPJ do emitente, clique com o botão direito > "Buscar SICAF deste CNPJ". Faça no Firefox e, se usar, no Chrome.
E: A janela "Buscar SICAF" abre na página do SEI com esse CNPJ. Comente se o item não aparecer no menu do leitor de PDF.
### T51 – Colar ou digitar o CNPJ (v0.11.0)
F: Abra a janela (T49), apague o CNPJ e digite um errado (mude o último número); depois cole um certo e clique em "Buscar no SICAF".
E: Com o errado aparece em vermelho "CNPJ com número errado"; com o certo, "conferido" e, por enquanto, "CNPJ encontrado".

## SICAF automático: conferência da nota com o ateste (v0.12.0)
### T53 – Diferença entre nota e ateste (v0.12.0)
F: Num processo em que o ateste tem um número, valor, empenho ou CNPJ diferente da nota (ou nota para outra unidade do IFTO), clique no aviso e depois em "Buscar no SICAF".
E: A diferença aparece em vermelho; o primeiro clique troca o botão para "Continuar mesmo assim" e só o segundo continua. Nome da empresa escrito diferente aparece só em amarelo.
### T54 – Nota escaneada (v0.12.0)
F: Num processo com uma nota fiscal que é só imagem (escaneada), clique no aviso.
E: Aparece em amarelo que a nota é uma imagem e a opção de escolher o CNPJ do ateste ou digitar outro.

## SICAF automático: PDF do SICAF (v0.13.0)
### T56 – Pedir SICAF de novo no mesmo dia (v0.13.0)
F: Depois do T55, clique de novo em "Buscar" e "Buscar no SICAF" no mesmo processo.
E: Não abre o SICAF de novo: a janela "SICAF" aparece logo, com o mesmo PDF.
### T57 – CNPJ selecionado vai ao SICAF (v0.13.0)
F: Selecione um CNPJ num documento do SEI > "Buscar SICAF" > "Buscar no SICAF".
E: O SICAF desse CNPJ é buscado como no T55 e volta para o SEI com o PDF.

## SICAF automático: incluir no SEI (v0.14.0)
### T59 – Duas notas da mesma empresa (v0.14.0)
F: Num processo com duas notas da mesma empresa sem SICAF, faça o T55 e o T58.
E: Aparecem um Sicaf e uma Consulta e dois Anexos, um com o número de cada nota.
### T60 – "Incluir Sicaf, Consulta e Anexo" continua igual (v0.14.0)
F: Na CGOC, com um processo aberto, clique no botão "Incluir Sicaf, Consulta e Anexo" > OK.
E: Os três documentos em branco aparecem na árvore, como antes.

## SICAF automático: botão "Incluir SICAF" em qualquer unidade (v0.15.0)
> Nas configurações, "SICAF da nota fiscal" em "Sempre ligada".
### T61 – Incluir SICAF em outra unidade (v0.15.0)
F: Numa unidade que não é a CGOC, abra um processo, clique em "Incluir SICAF" no alto à direita, cole um CNPJ e clique em "Buscar no SICAF"; depois, "Incluir no processo".
E: Volta do SICAF com o PDF e a janela mostra só "Sicaf <empresa>"; depois de incluir, a árvore mostra só esse Sicaf com o PDF (sem Consulta nem Anexo).
### T62 – Desligada (v0.15.0)
F: Nas configurações, deixe "SICAF da nota fiscal" em "Desligada"; no SEI, selecione um CNPJ e abra um processo com nota sem SICAF na CGOC.
E: Não aparece o botão "Buscar SICAF", nem o aviso de notas sem SICAF, nem "Incluir SICAF".

## SICAF automático: só na CGOC e documentos em branco (v0.16.0)
### T63 – Preencher Sicaf, Consulta e Anexo em branco (v0.16.0) (Crítico)
F: Num processo com nota sem SICAF, clique antes em "Incluir Sicaf, Consulta e Anexo" (cria os três em branco); depois faça o T55 e, na janela, clique em "Incluir no processo".
E: A janela diz "no Sicaf em branco …", "já existe em branco" e "no Anexo em branco …"; depois, a árvore mostra os mesmos três documentos (sem novos), o Sicaf com o nome da empresa e o PDF, o Anexo com o nome da nota.
### T64 – Buscar SICAF fora da CGOC com Automática (v0.16.0)
F: Com "SICAF da nota fiscal" em Automática, numa unidade que não é a CGOC, selecione um CNPJ num documento; depois clique com o botão direito > "Buscar SICAF deste CNPJ".
E: O botão "Buscar SICAF" não aparece; o menu abre uma janela dizendo para escolher "Sempre ligada" nas configurações.

## Consulta do Simples Nacional: PDF em texto (v0.17.0)
> O PDF de exemplo está no computador de desenvolvimento, na pasta ferramentas-de-teste/simples-nacional.
### T65 – PDF da consulta com texto (v0.17.0)
F: Abra o arquivo "exemplo-ConsultaOptantes_14159957000190_2026-11-13.pdf" e procure (Ctrl+F) "14.159.957/0001-90" e "optante".
E: O PDF mostra os mesmos dados da página do Simples Nacional (com acentos) e a linha "Consulta feita em …"; a busca encontra o CNPJ e a palavra.

## Consulta do Simples Nacional no site (v0.17.2)
> Nas configurações, clique de novo em "Permitir acesso ao Compras.gov.br e ao Simples Nacional" e confirme.
### T68 – Consulta com SICAF já buscado hoje (v0.17.2)
F: Repita o "Buscar" no mesmo processo no mesmo dia.
E: Não abre o SICAF nem o Simples Nacional de novo (os PDFs de hoje já servem).
## SICAF: correções depois do primeiro teste (v0.17.3)
> Na CGOC, num processo com nota sem SICAF (ex.: 23236.023830/2025-11). Antes, saia do Compras.gov.br (ou use outro navegador) para testar o login.
### T71 – Nota da HM lida pelo texto (v0.17.3)
F: No processo 23236.023830/2025-11, clique em "1 nota sem SICAF – Buscar".
E: A nota 3626 mostra o CNPJ 14.159.957/0006-02 tirado da nota, sem o aviso de "imagem". Se aparecer "Não consegui ler a nota", comente.
### T72 – Login do Compras e SICAF sem cliques (v0.17.3) (Crítico)
F: Saído do Compras.gov.br, clique em "Buscar" > "Buscar no SICAF".
E: A extensão clica em "Entrar com Gov.br"; depois do Gov.br, abre sozinha o SICAF pelo seu nome (no alto, à direita) e faz a busca. Comente em que página parou, se parar, e o texto do aviso.
### T73 – Incluir no processo com o PDF (v0.17.3) (Crítico)
F: Depois do T72, na janela "Incluir no processo…", clique em "Incluir no processo".
E: A árvore recarrega com "Sicaf <nome da empresa>" (abre o PDF do SICAF), "Consulta" e "Anexo Instrumento de Cobrança NF nº 3626 …", sem a mensagem de erro 404.

### T74 – Botões da extensão juntos numa caixa só (v0.17.4)
F: no SEI da CGOC, abra um processo com nota sem SICAF.
E: no alto à direita aparece uma caixa pequena com "IFTO" e os botões um embaixo do outro ("1 nota sem SICAF – Buscar" e "Incluir Sicaf, Consulta e Anexo"), sem cobrir os links do SEI; cada botão funciona como antes.

### T75 – Nota e PDF do SICAF lidos (v0.17.5)
F: no SEI da CGOC, abra um processo com nota sem SICAF, clique em "1 nota sem SICAF – Buscar" e faça a busca até voltar ao SEI.
E: o cartão da nota mostra o CNPJ lido da nota (sem "não consegui ler"); depois da busca, não aparece "Não consegui ler o PDF do SICAF para conferir o CNPJ".

### T76 – Nome do fornecedor limpo e janela sem rolagem para o lado (v0.17.5)
F: no fim da busca do T75, olhe a janela "Incluir Sicaf, Consulta e Anexo".
E: o título mostra só "CNPJ – NOME DA EMPRESA" (sem "Relatórios" nem texto estranho) e a janela não tem barra de rolagem para o lado.

### T77 – Janela do ícone sem a mensagem do SEI reconhecido (v0.17.6)
F: abra o SEI do IFTO e depois clique no ícone da extensão.
E: não aparece mais "SEI do IFTO reconhecido"; só aparece aviso amarelo se o SEI tiver um problema (com o motivo).

### T78 – Botão único na CGOC (v0.18.0)
F: abra um processo de pagamento com nota fiscal depois da última Folha de Encaminhamento, sem Sicaf nem Consulta.
E: a barra mostra só "1 nota sem SICAF ou Simples – Buscar"; o botão "Incluir Sicaf, Consulta e Anexo" não aparece mais. Num processo sem notas pendentes, nenhum botão.

### T79 – Busca do SICAF e do Simples juntos (v0.18.0)
F: clique no botão do T78 e em "Buscar SICAF e Simples"; faça o login Gov.br e a verificação, se pedirem.
E: na volta, a janela mostra para cada fornecedor "PDF do SICAF obtido" e "PDF do Simples Nacional obtido", cada um com "Ver o PDF", e a lista: Sicaf (com o PDF), Consulta Simples Nacional … (com o PDF) e Anexo de cada nota.

### T80 – Incluir os três no processo (v0.18.0) (Crítico)
F: na janela do T79, clique em "Incluir no processo".
E: aparecem na árvore o Sicaf com o PDF, a "Consulta Simples Nacional NOME DA EMPRESA" com o PDF (dá para procurar o CNPJ com Ctrl+F) e o Anexo em branco de cada nota; o botão da barra some.

### T81 – CNPJ selecionado (v0.18.0)
F: na CGOC, selecione um CNPJ num documento do SEI. Depois, em outra unidade com "Sempre ligada", faça o mesmo.
E: na CGOC aparece "Incluir SICAF, Simples e Anexo"; na outra unidade aparecem "Incluir SICAF" e "Incluir Simples Nacional", e cada um inclui só o seu documento.

### T82 – Equipe de licitação: "Sempre ligada" (v0.18.0)
F: Configurações > "SICAF e Simples Nacional" > "Sempre ligada"; abra qualquer processo (também na CGOC), clique em "Incluir SICAF" e digite um CNPJ.
E: a barra mostra só "Incluir SICAF" (sem aviso de notas); no fim, só o Sicaf com o PDF é incluído, sem Consulta nem Anexo. Depois, volte a opção para "Automática".

### T83 – Nomes dos arquivos para baixar (v0.18.1)
F: Abra a página da versão 0.18.1 no GitHub (ícone da extensão > Procurar atualização > Abrir a página da versão).
E: Aparecem extensao-ifto-firefox-0.18.1.xpi e extensao-ifto-chrome-edge-0.18.1.zip; clicar no do Firefox instala normalmente.

### T84 – PDFs buscados na hora e cópia opcional (v0.18.2)
F: Em Configurações, desmarque "Guardar uma cópia do PDF do SICAF na pasta Downloads"; num processo da CGOC, clique em "Incluir SICAF, Simples e Anexo" duas vezes seguidas (cancelando a primeira inclusão).
E: Nas duas vezes o SICAF e o Simples Nacional abrem e buscam de novo; o nome do fornecedor aparece limpo (só o nome da empresa); só o PDF do Simples vai para Downloads.

### T85 – Não incluir de novo o Sicaf e a Consulta que já estão no processo (v0.18.2)
F: Num processo onde a extensão já incluiu o Sicaf e a Consulta da nota, recarregue a página (F5); depois selecione o CNPJ do fornecedor e clique em "Incluir SICAF, Simples e Anexo".
E: Depois do F5, o botão "notas sem SICAF ou Simples" não aparece para essa nota; com o CNPJ selecionado, os sites não abrem e a janela diz que o Sicaf e a Consulta já estão no processo e não serão incluídos de novo.
### T86 – Dicas nas configurações (v0.18.3)
F: Clique no ícone da extensão > Configurações e desça até o quadro "Dicas".
E: Aparecem a dica de deixar só a senha do SEI no Firefox e a de diminuir PDF com links para o ilovepdf.com e o pdf24.org (abrem em outra aba).

### T87 – Senha reconhecida na assinatura feita dentro do editor (v0.18.4)
F: Abra um documento seu para editar (ex.: um ateste), clique em "Assinar" na barra do editor e clique no campo Senha.
E: O Firefox oferece a senha do SEI guardada (ou ela já aparece preenchida); depois de assinar com uma senha nova, o Firefox pergunta se quer guardá-la.

## SICAF: escolher as notas e site fora do ar (v0.18.5)
> antes de testar: um processo da CGOC com duas ou mais notas fiscais depois da última Folha de Encaminhamento.
### T88 – Escolher as notas que serão consultadas (v0.18.5)
F: Clique em "N notas sem SICAF ou Simples – Buscar", desmarque "Consultar esta nota" em uma nota e clique em "Buscar SICAF e Simples (1 de 2)".
E: Todas vêm marcadas; a desmarcada fica apagada e não é buscada; no fim, ela não ganha Sicaf, Consulta nem Anexo.
### T89 – Site sem responder: aviso e "Pular o SICAF" (v0.18.5)
F: Comece a busca e, na aba do SICAF, não entre com o Gov.br; volte ao SEI e espere uns 45 segundos; clique em "Pular o SICAF".
E: Aparece em amarelo "O SICAF não responde há mais de 45 segundos e pode estar fora do ar…"; ao pular, a busca segue para o Simples Nacional e a janela final mostra o SICAF como "Não consultado".
### T90 – "Cancelar e voltar" durante a busca (v0.18.5)
F: Comece a busca, desmarque antes uma nota, e no SEI clique em "Cancelar e voltar".
E: A aba do SICAF fecha, você volta ao SEI e a janela das notas reabre com a mesma nota desmarcada.
### T91 – Fechar a aba do site no meio da busca (v0.18.5)
F: Comece a busca e feche a aba do SICAF (ou do Simples Nacional) antes do fim.
E: A janela do SEI não fica parada: mostra o que já veio e o que faltou como "Não consultado: a aba do site foi fechada antes do fim", com o botão "Voltar".
### T92 – SICAF pulado: Sicaf sem PDF antes da Consulta (v0.18.6) (Crítico)
F: Num processo de teste com uma nota sem SICAF, clique em "N notas sem SICAF ou Simples – Buscar", clique em "Pular o SICAF", deixe o Simples terminar e clique em "Incluir no processo".
E: A janela lista "Sicaf <empresa> – sem PDF (complete depois…)", a Consulta e o Anexo; na árvore ficam nessa ordem, o Sicaf com o nome da empresa e sem PDF.
### T93 – SICAF e Simples pulados: nada incluído (v0.18.6)
F: Comece a busca e clique em "Pular o SICAF" e depois em "Pular o Simples Nacional".
E: A janela final não oferece incluir nada dessa empresa (nem o Anexo); a nota continua sem SICAF.
### T94 – Completar o Sicaf sem PDF depois (v0.18.6) (Crítico)
F: No processo do T92, clique de novo em "1 nota sem SICAF ou Simples – Buscar", faça a busca do SICAF e clique em "Incluir no processo".
E: A janela diz "no Sicaf em branco <número>"; nenhum documento novo é criado: o mesmo Sicaf ganha o PDF e o nome que está no SICAF.
### T95 – Aviso de Sicaf sem PDF antes da Folha (v0.18.6)
F: Num processo com um Sicaf sem PDF e uma Folha de Encaminhamento depois dele, abra o processo.
E: A barra da extensão mostra em vermelho "Sicaf sem PDF: <empresa>"; ao clicar, explica como anexar o PDF à mão.

## Peças do Compras IFTO no SEI (v0.19.0 a v0.21.0)
> Entre no SEI na CCL/GAC/DAP/PAL/REI/IFTO. O Compras IFTO do Render precisa estar com a versão que tem o botão "Enviar ao SEI". Use um processo de teste.
### T96 – Permitir no Compras IFTO e botão "Enviar ao SEI" (v0.19.0)
F: Ícone da extensão > Configurações > quadro "Licitação (CCL)" > "Permitir no Compras IFTO" e confirme. Abra o Compras IFTO, um processo e a fase Termo de Referência; aperte F5.
E: Ao lado de "Copiar para o SEI" aparece "Enviar ao SEI". Sem a permissão (ou com a extensão desligada), o botão não aparece.
### T97 – Peça chega à lista do SEI (v0.19.0)
F: No Compras IFTO, clique em "Enviar ao SEI" em duas fases (ex.: DFD e Termo de Referência). No SEI, abra o processo de teste.
E: O Compras IFTO diz "Peça enviada à extensão"; no SEI aparece no alto à direita "2 peças do Compras IFTO", que abre a lista com as duas; "Tirar da lista" tira uma. Enviar a mesma fase de novo não duplica.
### T98 – Janela de confirmação (v0.19.0)
F: Na lista, clique em "Incluir neste processo" no Termo de Referência. Troque o tipo, marque Restrito e veja a prévia. Feche sem criar.
E: O tipo "Termo de Referência" (ou o mais parecido) já vem escolhido; Restrito mostra a lista de hipóteses legais do SEI; a prévia mostra o texto da peça; se o NUP do Compras for de outro processo, aparece um aviso vermelho. Comente se o tipo sugerido estava errado.
### T99 – Criar o documento no processo (v0.20.0) (Crítico)
F: Na lista de peças, "Incluir neste processo" no Termo de Referência, confira o tipo, deixe Público e clique em "Criar e salvar".
E: Aparece "Documento criado: Termo de Referência …" e o documento novo aparece na árvore, com o cabeçalho do modelo e sem assinatura. Comente a mensagem se der erro.
### T100 – Texto no corpo e salvo, sem assinar (v0.21.0) (Crítico)
F: Repita o T99 com outra peça (ex.: DFD). Espere a janela do editor abrir e fechar sozinha.
E: A janela diz "Pronto: … criado com o texto da peça e salvo. Ele não foi assinado."; o documento na árvore tem o texto do Compras IFTO no corpo, com o cabeçalho e o rodapé do modelo; a peça sai da lista. Copie aqui a linha "Editor do SEI: …" que aparece na janela.
### T101 – Documento restrito (v0.21.0)
F: Inclua uma peça escolhendo Restrito e uma hipótese legal.
E: O documento é criado restrito (ícone de chave na árvore), com a hipótese legal escolhida e o texto salvo.
### T102 – Aviso de documento repetido (v0.21.0)
F: Envie de novo pelo Compras IFTO a mesma peça já incluída no T100 e clique em "Incluir neste processo".
E: A janela avisa em amarelo que o processo já tem um documento desse tipo e só cria depois de marcar "Criar mesmo assim".
### T103 – Fora da CCL (v0.21.0)
F: Com peças na lista, troque o SEI para outra unidade e abra um processo.
E: O botão "peças do Compras IFTO" não aparece. Com "Sempre ligada" nas configurações, aparece.

### T105 – Opção do SerproID desligada ou recusada (v0.21.3)
F: Em Configurações › SICAF, leia a explicação do SerproID; marque a opção e clique em "Não permitir". Depois busque um SICAF sem estar logado.
E: A explicação diz o que a extensão acessa e o que se perde; a opção volta a ficar desmarcada e, no Gov.br, nada é clicado (você clica em "Seu certificado digital em nuvem" e "SerproID").

### T108 – Depois do Gov.br, o SICAF abre sozinho na mesma aba (v0.21.6)
F: Saia do Compras.gov.br e, no SEI, use "Adicionar Sicaf" (com a opção do SerproID ligada). Faça o login no Gov.br.
E: Na Área de Trabalho do Compras, a mesma aba vai sozinha para o SICAF e a busca continua. Se o SICAF não abrir, em até 20 segundos o aviso diz onde clicar; se você abrir o SICAF em outra aba, o aviso "Abrindo o SICAF…" some.

### T109 – Abas do SICAF e do Simples fecham ao terminar (v0.21.6)
F: No SEI, use o botão que busca SICAF e Simples Nacional de uma nota e espere até o fim.
E: Quando os PDFs chegam ao SEI, a aba da busca (SICAF e depois Simples Nacional) fecha sozinha e o SEI volta a aparecer.

> antes de testar: SEI na unidade PAL/REI/IFTO (Direção-geral), com a extensão atualizada.

### T110 – Remover a marca MINUTA de um edital e salvar (v0.22.0) (Crítico)
F: Abra no editor um Edital criado a partir de uma minuta (ex.: 3390039), clique em "Remover marca MINUTA" no canto de baixo, confira o texto e clique em Salvar.
E: O MINUTA some do fundo do editor; depois de salvar, ao abrir o documento e gerar o PDF, não há MINUTA no fundo. Se o texto tiver "minuta de EDITAL", o aviso mostra onde corrigir.

### T111 – Botão só aparece onde deve (v0.22.0)
F: Abra no editor uma Minuta de Edital; depois, troque para outra unidade (ex.: CGOC) e abra o mesmo Edital no editor.
E: Na Minuta de Edital não aparece o botão. Na outra unidade também não (com a opção em "Automática").

### T112 – Remover também as linhas "* MINUTA DE DOCUMENTO" (v0.22.1)
F: Abra no editor um Edital que ainda tem as linhas "* MINUTA DE DOCUMENTO" (mesmo sem o MINUTA no fundo), clique em "Remover marca MINUTA" e depois em Salvar.
E: Todas as linhas "* MINUTA DE DOCUMENTO" somem de uma vez, sem deixar linhas em branco, e o resto do texto fica igual.

### T113 – Documento interno novo já vem com Público marcado (v0.22.2)
F: Num processo, clique em Incluir Documento e escolha Edital Gabinete (ou outro documento interno, como Despacho).
E: O nível de acesso Público já aparece marcado, com o aviso verde "Preenchido pela extensão"; nada é salvo até você clicar em Salvar.

### T114 – Mudar a data de um Ofício para hoje e salvar (v0.23.0) (Crítico)
F: Abra no editor um Ofício com data antiga, clique em "Mudar a data para hoje", confira e clique em Salvar; feche e abra o documento de novo.
E: A data passa a ser a de hoje e continua a de hoje depois de salvar e abrir de novo; o resto do texto fica igual.

### T115 – Mudar a data de uma Portaria para hoje (v0.23.0)
F: Abra no editor uma Portaria com data antiga, clique em "Mudar a data para hoje" e depois em Salvar.
E: Só a data da linha "PORTARIA … nº …, de …" muda para hoje; as datas citadas no texto (decretos, leis) ficam iguais.

### T116 – Aviso só quando a data já passou (v0.23.0)
F: Abra no editor um Ofício criado hoje e depois um Despacho antigo.
E: Nos dois não aparece o aviso "Mudar a data para hoje".

### T117 – Remover marca MINUTA continua igual (v0.23.0)
F: Abra no editor um Edital que ainda tem a marca MINUTA e clique em "Remover marca MINUTA".
E: O aviso aparece e funciona como antes (mesma aparência, a marca some do texto).

### T118 – Recortar e colar trecho com tabela (v0.24.0)
F: No editor, selecione um trecho com texto e uma tabela, Ctrl+X, clique em outro lugar do mesmo documento e Ctrl+V.
E: A tabela aparece no lugar novo com a mesma largura, as mesmas colunas e as mesmas margens; Ctrl+Z desfaz.

### T119 – Copiar trecho com tabela e colar duas vezes (v0.24.0)
F: Selecione um trecho com tabela, Ctrl+C e cole (Ctrl+V) em dois lugares diferentes do mesmo documento; depois clique em Salvar e abra o documento de novo.
E: As duas cópias ficam iguais à original, também depois de salvar e reabrir.

### T122 – Aviso só quando o número não cabe (v0.25.0)
F: Abra no editor um edital com itens até "9.9." e depois um com "10.10." em "Item nível 2 Edital".
E: No primeiro não aparece nada; no segundo aparece no canto de baixo "Corrigir a numeração", dizendo quantos itens estão quebrados.

### T123 – Corrigir a numeração e gerar o PDF (v0.25.0) (Crítico)
F: Clique em "Corrigir a numeração", confira o texto, clique em Salvar, feche o editor e gere o PDF do documento.
E: "10.10." fica na mesma linha do texto, no editor, no documento e no PDF; os números curtos ficam iguais a antes.

### T124 – Aviso aparece ao digitar (v0.25.0)
F: Num edital sem o aviso, crie itens "Item nível 2 Edital" até chegar em "10.10." (ou mude um parágrafo para esse estilo).
E: Pouco depois o aviso "Corrigir a numeração" aparece; depois de corrigir, ele some.

### T125 – Campos de margem mostram a tabela atual (v0.25.1)
F: Clique numa tabela, abra "Propriedades da tabela" e veja a parte "Margens, em pixels (px)".
E: Aparecem quatro campos (Acima, Direita, Abaixo, Esquerda) já preenchidos com as margens que a tabela tem hoje; parando o mouse num campo aparece o valor padrão dele.

### T126 – Mudar uma margem em pixels (v0.25.1)
F: Na mesma janela, troque só o campo Esquerda para 28 e clique em OK; abra a janela de novo.
E: A tabela vai para a esquerda com 28 px de recuo, as outras margens não mudam e o campo Esquerda mostra 28.

### T127 – Quarto botão "Alinhar com o texto" em Alinhamento (v0.25.1)
F: Numa tabela centralizada, abra "Propriedades da tabela", clique no quarto botão de Alinhamento (o mouse em cima mostra "Alinhar com o texto"), depois em OK e salve o documento.
E: Os campos ficam 10, 0, 10 e 28; a borda esquerda da tabela fica alinhada com o texto dos parágrafos; no documento salvo continua igual.

### T128 – Só um botão de Alinhamento marcado (v0.25.3)
F: Em "Propriedades da tabela", clique em "à esquerda", depois em "Alinhar com o texto", depois em "Centralizar" e por fim em "à esquerda"; clique em OK.
E: Em cada clique só o botão clicado fica marcado (nunca dois ao mesmo tempo); no fim a tabela fica alinhada à esquerda.

### T129 – Trocar o estilo sem perder o fundo da célula (v0.25.3)
F: Numa tabela com uma célula de fundo cinza, clique no texto dessa célula e troque o estilo (ex.: de "Tabela Texto Justificado" para "Tabela Texto Centralizado").
E: O texto muda de alinhamento e a célula continua cinza (bordas também); um Ctrl+Z volta ao estilo anterior, ainda com o fundo cinza.

## Conferir o documento do SEI (v0.26.0 a v0.26.4)

### T130 – Configurações com menu ao lado (v0.26.0)
F: Abra as Configurações da extensão e clique em cada item do menu à esquerda (Geral, Documentos do SEI, Minhas unidades…).
E: Cada clique mostra só aquele grupo; as escolhas que você já tinha continuam marcadas; em "Documentos do SEI" as quatro opções de "Conferir o documento" vêm ligadas.

### T131 – Cadastrar duas unidades (v0.26.0)
F: Em "Minhas unidades", clique em "Adicionar unidade" duas vezes, preencha sigla, telefone, e-mail e linhas do setor de cada uma, feche a página e abra as Configurações de novo.
E: As duas unidades continuam lá com os dados digitados; "Remover unidade" pede confirmação e tira a unidade.

### T132 – Copiar o nome de quem assinou (v0.26.1)
F: Abra um documento já assinado na árvore do processo, selecione com o mouse o nome na caixa "Documento assinado eletronicamente por…" e tecle Ctrl+C; cole num documento de texto.
E: O nome fica selecionado (azul) e é colado certo; com a opção "Copiar o nome de quem assinou" desligada, volta a não dar para selecionar.

### T133 – Aviso de processo errado na página do documento (v0.26.2)
F: Num processo, crie um Despacho e, no editor, troque o número da linha "Processo nº:" por outro; salve, feche o editor e clique no documento na árvore.
E: No alto do documento aparece "O documento está no processo X, mas o texto diz Y" e o botão "Abrir o editor para corrigir", que abre o editor; num documento já assinado nada aparece.

### T134 – Corrigir o número do processo no editor (v0.26.2)
F: Abra no editor o Despacho do teste anterior e clique em "Corrigir o número do processo"; confira e clique em Salvar.
E: Só o número da linha "Processo nº:" muda para o do processo; o resto do texto fica igual; Ctrl+Z desfaz antes de salvar.

### T135 – Edital com o processo errado no título (v0.26.2)
F: Abra no editor um Edital ou Minuta copiado de outro processo, com o título "(Processo Administrativo n° …)" de outro processo.
E: Aparece o aviso com os dois números, sem botão de correção, dizendo para apagar o número e colocar o link do processo certo.

### T136 – Parar antes de assinar pela árvore (v0.26.3) (Crítico)
F: Com o Despacho de número errado aberto na árvore, clique em "Assinar Documento" na barra do SEI; clique em "Não, corrigir antes"; depois clique de novo em "Assinar Documento" e em "Assinar mesmo assim".
E: Aparece a janela "O número do processo está errado (documento no processo X, texto diz Y). Assinar mesmo assim?"; "Não" abre o editor sem assinar; "Assinar mesmo assim" abre a assinatura normal do SEI. Num documento com o número certo a assinatura abre direto, sem janela.

### T137 – Parar antes de assinar no editor (v0.26.3) (Crítico)
F: No editor de um documento com o número do processo errado, clique em "Assinar" (e, noutra vez, tecle Ctrl+Shift+A).
E: Aparece a mesma janela antes da assinatura; "Não, corrigir antes" volta ao editor sem assinar; "Assinar mesmo assim" segue para a assinatura do SEI. Com o número certo, assina direto.

### T138 – "Assinar e próximo" com o número do processo errado (v0.26.4) (Crítico)
F: Na lista de assinaturas, chegue a um documento com o número do processo errado e clique em "Assinar e próximo"; na janela, clique em "Não, corrigir antes".
E: A janela "Assinar mesmo assim?" aparece antes da assinatura; com "Não" o documento não é assinado, o editor abre e o painel avisa que o documento não foi assinado (não fica esperando).

### T139 – Intervalo de documentos com números errados (v0.26.4) (Crítico)
F: Cole na lista um intervalo ("3383754 a 3383903") de um processo em que um ou mais documentos têm o número do processo errado e abra o processo.
E: Aparece uma janela só com a lista dos documentos errados (número e os dois processos); com "Assinar mesmo assim", "Assinar e próximo" assina esses documentos sem perguntar de novo; com "Não", a pergunta aparece em cada um.

## Timbre e rodapé do documento (v0.26.5)
> antes de testar: cadastre a sua unidade em Configurações > Minhas unidades (sigla, telefone, e-mail e linhas do setor).

### T140 – Aviso de timbre e rodapé na página do documento (v0.26.5)
F: Numa unidade do Campus Palmas, abra na árvore um documento ainda não assinado com "Reitoria" no timbre ou com o e-mail reitoria@ifto.edu.br no rodapé.
E: Embaixo, à esquerda, aparece "Confira o timbre e o rodapé desta unidade" com a lista do que está errado e o botão "Abrir o editor para corrigir"; num documento certo ou já assinado nada aparece.

### T141 – Corrigir timbre no editor (v0.26.5)
F: Abra no editor esse documento e clique em "Corrigir timbre"; confira e clique em Salvar.
E: O brasão fica; as linhas ficam "Ministério da Educação … Campus Palmas" e as linhas do setor cadastradas, sem "Reitoria"; Ctrl+Z desfaz antes de salvar.

### T142 – Corrigir rodapé no editor (v0.26.5)
F: No mesmo editor, clique em "Corrigir rodapé"; confira, clique em Salvar e gere o PDF.
E: O rodapé fica com o endereço, CEP 77021-090, "Palmas/TO —" e o telefone e o e-mail da unidade; e-mail, site e telefone são links; formatação diferente (pontos, parênteses) num rodapé com os dados certos não gera aviso.

### T143 – Usar este timbre como padrão da unidade (v0.26.5)
F: Num documento com o timbre certo do seu setor, mas com a unidade sem as linhas cadastradas (ou com outras), clique em "Usar este timbre como padrão da unidade" e confirme.
E: A janela mostra as linhas do setor; depois de confirmar, elas aparecem em Configurações > Minhas unidades na sua unidade.

### T144 – Unidade fora do Campus Palmas (v0.26.5)
F: Numa unidade sem "/PAL/" na sigla (por exemplo, da Reitoria), abra um documento no editor.
E: Não aparece aviso de timbre nem de rodapé (o do número do processo continua funcionando).

## Bloco de assinatura: número do processo (v0.26.6)
> antes de testar: tenha um bloco de assinatura com um documento de número do processo errado (como no teste T133).

### T145 – Assinar o bloco inteiro na lista de blocos (v0.26.6) (Crítico)
F: Em "Blocos de Assinatura", clique no ícone "Assinar Documentos do Bloco" desse bloco (e, noutra vez, marque o bloco e clique no botão "Assinar"); clique em "Não, corrigir antes".
E: Depois de um instante aparece uma janela com a lista dos documentos errados (número e os dois processos); "Não" não assina nada; "Assinar mesmo assim" abre a assinatura do SEI. Bloco sem erro: a assinatura abre direto.

### T146 – Assinar dentro do bloco (v0.26.6) (Crítico)
F: Entre no bloco (clique no número do bloco), clique no ícone de assinar da linha do documento errado e, noutra vez, marque documentos e clique em "Assinar".
E: A mesma janela aparece só com os documentos errados entre os escolhidos; documentos certos assinam direto.

### T147 – Assinar pela janela do documento no bloco (v0.26.6) (Crítico)
F: Dentro do bloco, clique no número do documento errado e, na janela que abre, clique em "Assinar Documento".
E: Aparece "O número do processo está errado (documento no processo X, texto diz Y). Assinar mesmo assim?"; "Não" fecha a pergunta sem assinar.
