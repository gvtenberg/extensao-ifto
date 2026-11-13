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
### P3 – Restritos ou sigilosos em sites de compactação
?: Mostrar a dica do pdf24.org e do ilovepdf (que recebem o arquivo) também para documentos restritos ou sigilosos, ou sugerir um programa no computador? O setor usa Windows ou Linux?
### P4 – Dicas do pdf24.org
?: Que opção de compressão usam no pdf24.org quando o ilovepdf não resolve? Que tipo de PDF dá problema (digitalizado, muitas imagens, gerado por sistema)?

## Senha reconhecida pelo navegador no SEI 5 (v0.1.1)
### T08 – Senha na tela de entrada do SEI (v0.1.1)
F: Saia do SEI, entre de novo com usuário e senha e salve a senha quando o Firefox perguntar. Saia e abra a tela de entrada outra vez.
E: A senha aparece como ●. Na segunda vez o Firefox preenche ou oferece a senha guardada.
### T09 – Senha na assinatura de documento (v0.1.1) (Crítico)
F: Abra um documento seu > Assinar documento > clique em Senha; escolha a senha guardada ou digite, aperte Enter e salve se o Firefox perguntar. Assine um segundo documento.
E: Enter e Assinar funcionam como antes; no segundo documento não é preciso digitar. Comente se o Firefox oferecer salvar com o seu nome completo.
### T10 – Desligar a correção da senha (v0.1.1)
F: Configurações > desmarque "Navegador reconhece o campo de senha", recarregue a entrada do SEI e clique em Senha. Marque de novo.
E: Desmarcada, o Firefox não oferece a senha; marcada, oferece.

## Instalação e atualização pelo GitHub (v0.1.2 e v0.1.3)
### T11 – Instalar pelo GitHub (v0.1.2)
F: Depois de "Assinar extensão" ficar verde (aba Actions), no Firefox do trabalho abra Releases > extensao-ifto-X.Y.Z.xpi > Adicionar. Feche e abra o Firefox.
E: A extensão continua instalada; a janela do ícone mostra a versão.
### T12 – Botão "Procurar atualização" (v0.1.3)
F: Depois de uma versão nova ficar pronta no GitHub, clique no ícone da extensão > Procurar atualização > Instalar a versão… > Permitir > Adicionar. Procure de novo.
E: Aparece "Versão X disponível"; depois de instalar, "Você já tem a versão mais nova".

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
### T16 – Outra unidade (v0.2.0)
F: Com a lista colada, troque para outra unidade no SEI e depois volte para PAL/REI/IFTO.
E: Na outra unidade o painel some; ao voltar, reaparece no mesmo item.
### T17 – Feito e lista completa (v0.3.0)
F: Com a lista colada, clique em "Marcar feito e ir ao próximo" (link do painel) em dois itens, depois em "Lista completa" e num item qualquer da lista.
E: O contador mostra "3/28 · 2 feitos"; na lista, os feitos têm ✓ e o clique abre o item escolhido.
### T18 – Ciência, minimizar e atalhos (v0.3.0)
F: Vá a um item com "dar ciência", clique em "–" (minimizar) e depois em "▢"; com o documento aberto, aperte Alt+→ e Alt+←.
E: O item de ciência aparece em azul com "Só dar ciência"; minimizado, sobra uma barrinha com o contador; os atalhos passam para o próximo e voltam.
### T19 – Opção nas configurações (v0.3.0)
F: Configurações > Lista de assinaturas no SEI: escolha "Desligada", recarregue o SEI; depois "Sempre ligada" e troque para outra unidade; feche e abra o Firefox e veja a escolha.
E: Desligada, o painel some; "Sempre ligada", aparece em qualquer unidade; a escolha continua marcada depois de reabrir o Firefox.
### T20 – Botões do painel conforme o item (v0.4.0; v0.5.0)
F: Passe por um item com documento, um de "dar ciência" e um só com o processo.
E: Com documento: "Assinar e próximo"; de ciência: "Dar ciência e próximo"; só processo: "✓ Feito e próximo".
### T21 – Textos da janela do ícone (v0.4.1)
F: Clique no ícone da extensão e em "Procurar atualização".
E: Os textos falam só do que acontece (versão, SEI reconhecido, atualização), sem GitHub, Actions ou código. Comente qualquer texto que ainda pareça de programador.
### T22 – Instalar a atualização pela página da versão (v0.4.2)
F: Com uma versão nova pronta, clique no ícone > Procurar atualização > Instalar a versão…; na página que abrir, clique no arquivo que termina em .xpi e em Adicionar. Em outra versão, tente o caminho ☰ > Extensões e temas > ⚙ > Procurar atualizações.
E: A janela de instalação do Firefox aparece já no primeiro clique, sem recarregar a página; pelo menu, a extensão atualiza sozinha.
### T23 – Assinar e próximo (v0.5.0) (Crítico)
F: Com a senha do SEI guardada no Firefox, num item com documento clique em "Assinar e próximo" e espere.
E: A janela de assinatura abre, a senha aparece preenchida, o documento é assinado sozinho e o painel abre o próximo item com o anterior marcado ✓. Se a senha não vier preenchida, digite e aperte Enter: depois de assinar, avança. Comente se não avançar.
### T24 – Senha errada ou janela fechada (v0.5.0)
F: Clique em "Assinar e próximo", digite uma senha errada; depois feche a janela de assinatura.
E: O painel não avança e mostra "Aguardando a assinatura…"; "Cancelar a espera" volta ao normal.
### T25 – Dar ciência e próximo (v0.5.0)
F: Num item de "dar ciência", clique em "Dar ciência e próximo" e confirme no OK do SEI.
E: A ciência é registrada e o painel abre o próximo item, com o anterior marcado ✓.
### T26 – Só a senha do SEI (v0.5.0)
F: Siga "Saved passwords in the SEI" em docs/publicacao.md (about:config > signon.includeOtherSubdomainsInLookup = false) e abra a assinatura de um documento.
E: O Firefox oferece só a senha do sei.ifto.edu.br (sem SUAP, Moodle etc.).
### T27 – Instalar no Chrome (v0.5.0)
> No computador de desenvolvimento (ou com o .zip da Release, depois do git push).
F: Rode npm run empacotar-chrome, abra chrome://extensions > Modo do desenvolvedor > Carregar sem compactação > pasta web-ext-artifacts/chrome/extensao-ifto-chrome-0.5.0; entre no SEI na unidade PAL/REI/IFTO.
E: A extensão aparece sem erros, o painel da lista de assinaturas funciona e a janela do ícone não mostra "Procurar atualização".

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

## Atualização da extensão (v0.9.1)
> Só depois que a versão 0.9.1 (ou mais nova) estiver instalada no Firefox e uma versão mais nova for publicada.
### T38 – Instalar a atualização direto pela janela (v0.9.1)
F: Clique no ícone da extensão › "Procurar atualização" › "Instalar a versão …".
E: O Firefox pede "Permitir" e depois "Adicionar", sem abrir a página do GitHub. Se nada aparecer, comente; o link "abra a página da versão" é a reserva.

## Lista de assinaturas: intervalo de documentos (v0.9.2)

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

## Lista de assinaturas: vários documentos na linha (v0.9.6)

### T44 – Vários documentos separados por vírgula (v0.9.6)
F: Cole na lista de assinaturas "23236.022824/2026-10 - 3384598, 3384598, 3384645, 3384674" e clique em "Conferir e começar"; depois limpe e cole "23236.022824/2026-10 - 3384598 a 3384674".
E: Na primeira forma, a lista tem 3 itens (3384598, 3384645, 3384674; o repetido conta uma vez). Na segunda, ao abrir o processo, a linha vira um item para cada documento do processo entre os dois números.

### T45 – Painel continua na tela ao abrir o processo (v0.9.6)
F: Clique no ícone da extensão; se aparecer "Permitir no SEI", clique e confirme. Na Direção-geral, cole uma lista e clique em "Conferir e começar"; depois aperte F5.
E: O processo abre e o painel da lista continua na tela, também depois de recarregar a página, sem precisar clicar no ícone da extensão.

## Atualização pela página da versão (v0.9.7)

### T46 – Atualizar pela página da versão (v0.9.7)
F: Com uma versão nova pronta, clique no ícone da extensão > Procurar atualização > Abrir a página da versão…; na página, clique no arquivo que termina em .xpi > Permitir > Adicionar.
E: Aparece só o botão "Abrir a página da versão…" (sem "Instalar a versão…"); a página abre numa nova aba e, depois de Adicionar, a janela do ícone mostra a versão nova.


## SICAF automático: notas sem SICAF (v0.10.0)
> Na CGOC (CGOC/GAC/DAP/PAL/REI/IFTO), com a opção "SICAF da nota fiscal" em Automática (padrão).
### T47 – Aviso de notas sem SICAF (v0.10.0)
F: Abra um processo de pagamento com nota fiscal e ateste depois da última Folha de Encaminhamento e ainda sem Sicaf com PDF (ex.: 23236.023830/2025-11 antes de incluir o Sicaf da HM).
E: Em poucos segundos aparece no alto, à direita, "1 nota sem SICAF – Buscar"; parando o mouse em cima, aparece a nota e a empresa.
### T48 – Sem aviso quando o SICAF já está no processo (v0.10.0)
F: Abra um processo em que todas as notas depois da última Folha já têm Sicaf com o PDF; depois, abra um processo sem notas.
E: O aviso não aparece em nenhum dos dois; em outra unidade (não CGOC) ele também não aparece.
