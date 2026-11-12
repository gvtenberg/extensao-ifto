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
E: Aparece em verde "SEI 5.0.4 em https://sei.ifto.edu.br". Se ficar a mensagem amarela, comente o endereço do SEI na barra.
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
