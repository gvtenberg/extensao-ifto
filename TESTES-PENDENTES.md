# Testes pendentes: só a fonte dos cartões do GitHub (formato no CLAUDE.md, seção Testes)

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
### T25 – Dar ciência e próximo (v0.5.0)
F: Num item de "dar ciência", clique em "Dar ciência e próximo" e confirme no OK do SEI.
E: A ciência é registrada e o painel abre o próximo item, com o anterior marcado ✓.
## Documentos do pagamento: preenchimento do documento externo (v0.6.0)
### T29 – Documento externo que já existe não muda (v0.6.0)
F: Abra um documento externo já incluído (com ou sem arquivo) e clique em Alterar; depois desmarque "Preencher documento externo novo" nas Configurações e repita o T28.
E: O documento existente fica como estava, sem aviso verde; com a opção desmarcada, o documento novo vem em branco, como no SEI.

## Documentos do pagamento: incluir os três documentos (v0.8.0)
> Use um processo de teste (ou um processo de pagamento que vá mesmo receber os três), na unidade CGOC.
### T35 – Parar a inclusão (v0.8.0)
F: Em outro processo de teste, comece a inclusão e, enquanto o botão mostra "Incluindo…", clique nele e confirme que quer parar.
E: Aparece qual documento já foi incluído e a extensão não inclui mais nada.

## Documentos do pagamento: inclusão rápida (v0.9.0)
> Use um processo de teste, na unidade CGOC. Antes, em Firefox › about:debugging, clique em "Recarregar" na extensão (ou instale a versão nova).
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

### T44 – Vários documentos separados por vírgula (v0.9.6)
F: Cole na lista de assinaturas "23236.022824/2026-10 - 3384598, 3384598, 3384645, 3384674" e clique em "Conferir e começar"; depois limpe e cole "23236.022824/2026-10 - 3384598 a 3384674".
E: Na primeira forma, a lista tem 3 itens (3384598, 3384645, 3384674; o repetido conta uma vez). Na segunda, ao abrir o processo, a linha vira um item para cada documento do processo entre os dois números.

### T45 – Painel continua na tela ao abrir o processo (v0.9.6)
F: Clique no ícone da extensão; se aparecer "Permitir no SEI", clique e confirme. Na Direção-geral, cole uma lista e clique em "Conferir e começar"; depois aperte F5.
E: O processo abre e o painel da lista continua na tela, também depois de recarregar a página, sem precisar clicar no ícone da extensão.

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
### T73 – Incluir no processo com o PDF (v0.17.3) (Crítico)
F: Depois do T72, na janela "Incluir no processo…", clique em "Incluir no processo".
E: A árvore recarrega com "Sicaf <nome da empresa>" (abre o PDF do SICAF), "Consulta" e "Anexo Instrumento de Cobrança NF nº 3626 …", sem a mensagem de erro 404.

### T74 – Botões da extensão juntos numa caixa só (v0.17.4)
F: no SEI da CGOC, abra um processo com nota sem SICAF.
E: no alto à direita aparece uma caixa pequena com "IFTO" e os botões um embaixo do outro ("1 nota sem SICAF – Buscar" e "Incluir Sicaf, Consulta e Anexo"), sem cobrir os links do SEI; cada botão funciona como antes.

### T75 – Nota e PDF do SICAF lidos (v0.17.5)
F: no SEI da CGOC, abra um processo com nota sem SICAF, clique em "1 nota sem SICAF – Buscar" e faça a busca até voltar ao SEI.
E: o cartão da nota mostra o CNPJ lido da nota (sem "não consegui ler"); depois da busca, não aparece "Não consegui ler o PDF do SICAF para conferir o CNPJ".

### T78 – Botão único na CGOC (v0.18.0)
F: abra um processo de pagamento com nota fiscal depois da última Folha de Encaminhamento, sem Sicaf nem Consulta.
E: a barra mostra só "1 nota sem SICAF ou Simples – Buscar"; o botão "Incluir Sicaf, Consulta e Anexo" não aparece mais. Num processo sem notas pendentes, nenhum botão.

### T80 – Incluir os três no processo (v0.18.0) (Crítico)
F: na janela do T79, clique em "Incluir no processo".
E: aparecem na árvore o Sicaf com o PDF, a "Consulta Simples Nacional NOME DA EMPRESA" com o PDF (dá para procurar o CNPJ com Ctrl+F) e o Anexo em branco de cada nota; o botão da barra some.

### T81 – CNPJ selecionado (v0.18.0)
F: na CGOC, selecione um CNPJ num documento do SEI. Depois, em outra unidade com "Sempre ligada", faça o mesmo.
E: na CGOC aparece "Incluir SICAF, Simples e Anexo"; na outra unidade aparecem "Incluir SICAF" e "Incluir Simples Nacional", e cada um inclui só o seu documento.

### T84 – PDFs buscados na hora e cópia opcional (v0.18.2)
F: Em Configurações, desmarque "Guardar uma cópia do PDF do SICAF na pasta Downloads"; num processo da CGOC, clique em "Incluir SICAF, Simples e Anexo" duas vezes seguidas (cancelando a primeira inclusão).
E: Nas duas vezes o SICAF e o Simples Nacional abrem e buscam de novo; o nome do fornecedor aparece limpo (só o nome da empresa); só o PDF do Simples vai para Downloads.

### T85 – Não incluir de novo o Sicaf e a Consulta que já estão no processo (v0.18.2)
F: Num processo onde a extensão já incluiu o Sicaf e a Consulta da nota, recarregue a página (F5); depois selecione o CNPJ do fornecedor e clique em "Incluir SICAF, Simples e Anexo".
E: Depois do F5, o botão "notas sem SICAF ou Simples" não aparece para essa nota; com o CNPJ selecionado, os sites não abrem e a janela diz que o Sicaf e a Consulta já estão no processo e não serão incluídos de novo.
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

### T114 – Mudar a data de um Ofício para hoje e salvar (v0.23.0) (Crítico)
F: Abra no editor um Ofício com data antiga, clique em "Mudar a data para hoje", confira e clique em Salvar; feche e abra o documento de novo.
E: A data passa a ser a de hoje e continua a de hoje depois de salvar e abrir de novo; o resto do texto fica igual.

### T115 – Mudar a data de uma Portaria para hoje (v0.23.0)
F: Abra no editor uma Portaria com data antiga, clique em "Mudar a data para hoje" e depois em Salvar.
E: Só a data da linha "PORTARIA … nº …, de …" muda para hoje; as datas citadas no texto (decretos, leis) ficam iguais.

### T116 – Aviso só quando a data já passou (v0.23.0)
F: Abra no editor um Ofício criado hoje e depois um Despacho antigo.
E: Nos dois não aparece o aviso "Mudar a data para hoje".

### T126 – Mudar uma margem em pixels (v0.25.1)
F: Na mesma janela, troque só o campo Esquerda para 28 e clique em OK; abra a janela de novo.
E: A tabela vai para a esquerda com 28 px de recuo, as outras margens não mudam e o campo Esquerda mostra 28.

### T128 – Só um botão de Alinhamento marcado (v0.25.3)
F: Em "Propriedades da tabela", clique em "à esquerda", depois em "Alinhar com o texto", depois em "Centralizar" e por fim em "à esquerda"; clique em OK.
E: Em cada clique só o botão clicado fica marcado (nunca dois ao mesmo tempo); no fim a tabela fica alinhada à esquerda.

### T131 – Cadastrar duas unidades (v0.26.0)
F: Em "Minhas unidades", clique em "Adicionar unidade" duas vezes, preencha sigla, telefone, e-mail e linhas do setor de cada uma, feche a página e abra as Configurações de novo.
E: As duas unidades continuam lá com os dados digitados; "Remover unidade" pede confirmação e tira a unidade.

### T135 – Edital com o processo errado no título (v0.26.2)
F: Abra no editor um Edital ou Minuta copiado de outro processo, com o título "(Processo Administrativo n° …)" de outro processo.
E: Aparece o aviso com os dois números, sem botão de correção, dizendo para apagar o número e colocar o link do processo certo.

### T138 – "Assinar e próximo" com o número do processo errado (v0.26.4) (Crítico)
F: Na lista de assinaturas, chegue a um documento com o número do processo errado e clique em "Assinar e próximo"; na janela, clique em "Não, corrigir antes".
E: A janela "Assinar mesmo assim?" aparece antes da assinatura; com "Não" o documento não é assinado, o editor abre e o painel avisa que o documento não foi assinado (não fica esperando).

### T139 – Intervalo de documentos com números errados (v0.26.4) (Crítico)
F: Cole na lista um intervalo ("3383754 a 3383903") de um processo em que um ou mais documentos têm o número do processo errado e abra o processo.
E: Aparece uma janela só com a lista dos documentos errados (número e os dois processos); com "Assinar mesmo assim", "Assinar e próximo" assina esses documentos sem perguntar de novo; com "Não", a pergunta aparece em cada um.

### T141 – Corrigir timbre no editor (v0.26.5)
F: Abra no editor esse documento e clique em "Corrigir timbre"; confira e clique em Salvar.
E: O brasão fica; as linhas ficam "Ministério da Educação … Campus Palmas" e as linhas do setor cadastradas, sem "Reitoria"; Ctrl+Z desfaz antes de salvar.

### T143 – Usar este timbre como padrão da unidade (v0.26.5)
F: Num documento com o timbre certo do seu setor, mas com a unidade sem as linhas cadastradas (ou com outras), clique em "Usar este timbre como padrão da unidade" e confirme.
E: A janela mostra as linhas do setor; depois de confirmar, elas aparecem em Configurações > Minhas unidades na sua unidade.

### T145 – Assinar o bloco inteiro na lista de blocos (v0.26.6) (Crítico)
F: Em "Blocos de Assinatura", clique no ícone "Assinar Documentos do Bloco" desse bloco (e, noutra vez, marque o bloco e clique no botão "Assinar"); clique em "Não, corrigir antes".
E: Depois de um instante aparece uma janela com a lista dos documentos errados (número e os dois processos); "Não" não assina nada; "Assinar mesmo assim" abre a assinatura do SEI. Bloco sem erro: a assinatura abre direto.

### T146 – Assinar dentro do bloco (v0.26.6) (Crítico)
F: Entre no bloco (clique no número do bloco), clique no ícone de assinar da linha do documento errado e, noutra vez, marque documentos e clique em "Assinar".
E: A mesma janela aparece só com os documentos errados entre os escolhidos; documentos certos assinam direto.

### T147 – Assinar pela janela do documento no bloco (v0.26.6) (Crítico)
F: Dentro do bloco, clique no número do documento errado e, na janela que abre, clique em "Assinar Documento".
E: Aparece "O número do processo está errado (documento no processo X, texto diz Y). Assinar mesmo assim?"; "Não" fecha a pergunta sem assinar.

### T148 – Rodapé com telefone e e-mail de outro setor do campus (v0.26.7)
F: Sem telefone e e-mail cadastrados em "Minhas unidades", abra um documento cujo rodapé tem 63 3236-4023 e gise.palmas@ifto.edu.br; depois cadastre outro telefone e e-mail na unidade e abra de novo.
E: Sem cadastro, não aparece aviso sobre telefone nem e-mail (e "Corrigir rodapé" os mantém); com cadastro, o aviso pede o telefone e o e-mail cadastrados.

### T149 – Todos os avisos numa janela só (v0.26.8)
F: Abra no editor um documento com número do processo errado e rodapé errado (num edital, também a marca MINUTA); arraste a janela pela barra de cima e role a página.
E: Os avisos aparecem juntos numa janela no canto inferior direito, cada um com seu botão e seu ×; a janela vai para onde foi arrastada e fica parada na tela ao rolar.

### T150 – Aviso de data com mês errado na página do documento (v0.26.9)
F: Num documento não assinado, ponha a data com o mês passado (ex.: "Palmas, 18 de outubro de 2026."), salve e clique no documento na árvore do processo.
E: Na janela de avisos aparece "Confira a data do documento", dizendo que o mês ou o ano está errado, com o botão "Abrir o editor para corrigir".

### T151 – Corrigir a data no editor (v0.26.9)
F: Abra no editor o mesmo documento, clique no botão "Corrigir para …" do aviso da data e depois em Salvar.
E: A data vira a de hoje, no padrão ("Palmas, 18 de novembro de 2026."), e o aviso não aparece mais ao abrir de novo.

### T152 – Data fora do padrão (v0.26.9)
F: Num documento não assinado, escreva um dia deste mês com zero na frente e sem o ponto (ex.: "Palmas, 05 de novembro de 2026") e abra o editor.
E: O aviso pede o dia sem o zero e o ponto final; "Corrigir para …" deixa "Palmas, 5 de novembro de 2026." (o dia continua o mesmo).

### T153 – Data no fim do texto (Ateste) (v0.26.9)
F: Num Ateste não assinado com a data no fim do texto, antes do nome de quem assina, ponha um mês errado.
E: O aviso da data aparece do mesmo jeito, na página do documento e no editor.

### T154 – Parar antes de assinar com a data errada (v0.26.9) (Crítico)
F: Com a data de mês errado, clique em "Assinar Documento" na barra do SEI; depois abra o editor e clique em "Assinar".
E: Antes de assinar aparece "Este documento tem um erro. Assinar mesmo assim?" com a data errada; "Não, corrigir antes" abre o editor. Só o zero na frente do dia não para a assinatura.

### T155 – Documento assinado não tem aviso de data (v0.26.9)
F: Abra um documento já assinado que tenha a data de outro mês.
E: Nenhum aviso sobre a data.

### T156 – Lista de assinaturas e Bloco com data errada (v0.26.9)
F: Ponha um documento com data errada num Bloco de assinatura (ou na lista de assinaturas da extensão) e clique em assinar.
E: A janela mostra o documento com "Data errada: …" e pergunta se quer assinar mesmo assim.

### T157 – Desligar a conferência da data (v0.26.9)
F: Nas configurações > Documentos do SEI, desmarque "Data do documento" e abra um documento com data errada.
E: Nenhum aviso de data; ao marcar de novo, o aviso volta.

## SICAF: outras unidades e janela das notas (v0.26.10)
### T158 – Outras unidades: só "Incluir SICAF" (v0.26.10)
F: Nas configurações da extensão, em "SICAF e Simples Nacional", marque "Sempre ligada". No SEI, entre numa unidade que não é a CGOC, abra qualquer documento e selecione com o mouse um CNPJ.
E: Aparece só o botão "Incluir SICAF" (sem "Incluir Simples Nacional"). As três opções das configurações explicam para quem cada uma serve.
### T159 – Desligada (v0.26.10)
F: Nas configurações da extensão, em "SICAF e Simples Nacional", marque "Desligada". No SEI, na CGOC, abra um processo com nota fiscal sem SICAF e selecione um CNPJ num documento.
E: Nenhum botão do SICAF aparece: nem o aviso das notas, nem o "Incluir SICAF" no alto, nem botão ao selecionar o CNPJ.
### T161 – SICAF e Simples esperam o resultado (v0.26.10)
F: Na CGOC, num processo com nota sem SICAF, clique no aviso "notas sem SICAF – Buscar" e depois em "Buscar SICAF e Simples". Se o Compras.gov.br pedir, entre com o Gov.br.
E: Depois da Área de Trabalho do Compras.gov.br, o SICAF abre sozinho em poucos segundos; o SICAF e o Simples Nacional só fecham depois de mostrar o resultado, e o SEI recebe os dois PDFs.

## Espaço entre as partes do documento (v0.26.11)
### T163 – Espaço entre as partes num Ofício (v0.26.11)
F: Abra o editor de um Ofício ainda não assinado com partes grudadas, confira e clique em Salvar.
E: A caixa lista onde a linha foi posta; o Ofício salvo mostra o espaço só nesses lugares.
### T164 – Espaço antes e depois da data no fim do Ateste (v0.26.11)
F: Abra o editor de um Ateste em que corpo, data e nome de quem assina estão grudados.
E: A caixa lista a data e o nome; aparece uma linha antes da data e outra antes do nome.
### T165 – Desfazer o espaço (v0.26.11)
F: Na caixa do espaço, clique em "Desfazer", clique em Salvar, feche e abra o editor de novo.
E: O espaço some do documento salvo; ao abrir o editor de novo, a extensão põe o espaço outra vez e mostra a caixa com "Desfazer".
### T166 – Espaço desligado e documento que já tem espaço (v0.26.11)
F: Desligue "Espaço entre as partes do documento" nas configurações e abra um editor; ligue de novo e abra o editor de um documento já salvo com o espaço.
E: Nos dois casos nada muda e a caixa do espaço não aparece.

## Data do documento: interruptor (v0.26.12)
### T167 – Desligar a data do documento (v0.26.12)
F: Nas configurações, desligue "Data do documento" e abra o editor de um documento com a data de outro mês.
E: A caixa da data e o botão "Corrigir para …" não aparecem; ligando de novo, aparecem.

## Documento externo pré-preenchido (v0.27.0)
### T168 – Documento externo com os valores das configurações (v0.27.0)
F: Em Configurações › Documentos do SEI, marque Restrito, escreva "Informação Pessoal" em Hipótese legal e marque Digitalizado com "Cópia Simples"; depois, num processo, clique em Incluir Documento › Externo.
E: A página abre com a data de hoje, Digitalizado com Cópia Simples, Restrito com a hipótese "Informação Pessoal" e o aviso verde "Preenchido pela extensão: confira…"; nada é salvo.
### T169 – Tipo pelo nome do arquivo no documento externo (v0.27.0)
F: Em Incluir Documento › Externo, sem escolher o tipo, clique em "Anexar Arquivo..." e escolha um PDF chamado "Nota Fiscal 123.pdf".
E: O tipo fica "Nota fiscal", o Nome na Árvore fica "123" e aparece o aviso "Pelo nome do arquivo, a extensão escolheu…"; ao salvar, o documento entra com esse tipo. Com um tipo já escolhido antes, o tipo não muda.
> os arquivos de teste estão no computador de desenvolvimento (ferramentas-de-teste/arquivos-sei).
## Cópia das configurações (v0.27.2)
### T174 – Baixar e carregar cópia das configurações (v0.27.2)
F: Em Configurações › Cópia das configurações, clique em "Baixar cópia das configurações"; mude duas opções; clique em "Escolher o arquivo…", escolha o arquivo baixado e confirme.
E: O arquivo "configuracoes-extensao-ifto-AAAA-MM-DD.json" vai para Downloads; depois de carregar, a página recarrega com as duas opções de volta como estavam.
### T175 – Carregar arquivo errado (v0.27.2)
F: Em Cópia das configurações, clique em "Escolher o arquivo…" e escolha um PDF ou outro arquivo qualquer.
E: Aparece o aviso "Este arquivo não é uma cópia das configurações da extensão…" e nada muda.

## Aviso de versão do SEI
> antes de testar: no computador de desenvolvimento, desative a extensão instalada e carregue como extensão temporária o manifest.json da pasta ferramentas-de-teste/extensao-sei-nao-testado (ela acha que o SEI mudou de versão); no fim, remova-a e ative de novo a instalada
### T176 – Aviso no SEI com versão não testada (v0.28.0)
F: Instale a cópia temporária e abra o SEI.
E: No alto à direita aparece a caixa "O SEI do IFTO mudou para a versão…", com "Continuar usando" e "Desativar a extensão no SEI"; em "Continuar usando" ela some e não volta nas próximas páginas.
### T177 – Desativar a extensão no SEI (v0.28.0)
F: Ainda na cópia temporária, clique no ícone da extensão, em "Desativar a extensão no SEI", e abra outra página do SEI (um processo).
E: Nenhuma função da extensão aparece no SEI (barra IFTO, lista de assinaturas, avisos do editor, senha); o ícone mostra "A extensão está desativada no SEI" e o botão "Ativar de novo".
### T178 – Ativar de novo (v0.28.0)
F: Em Configurações › Geral clique em "Ativar de novo" e abra outra página do SEI.
E: As funções da extensão voltam no SEI; o cartão mostra "Extensão ligada no SEI".

## Todos os estilos em todos os documentos
### T182 – Estilo aprendido de outro tipo (v0.29.1)
F: Abra no editor um documento de outro tipo (ex.: Portaria) e depois um Despacho; abra a lista de estilos do Despacho.
E: Os estilos da Portaria que o Edital não tem (ex.: "★ IFTO_Item_Nvl_1") também aparecem com "★".
### T183 – Opção desligada com estilos da extensão (v0.29.2)
F: Em Configurações › Documentos do SEI, desligue "Todos os estilos em todos os documentos" e abra no editor o Despacho do T181; clique em "Ligar de novo".
E: Aparece o aviso "Este documento usa estilos da extensão…"; depois do clique, a opção volta a ficar ligada e os estilos com "★" voltam à lista.

## Correções dos testes de 19/11/2026 (v0.29.3)
### T184 – Espaço depois do timbre, do Assunto e em volta da assinatura (v0.29.3) (Crítico)
F: Num Despacho ainda não assinado, abra o editor, confira a caixa "As partes do documento estavam grudadas…", clique em Salvar e gere o PDF.
E: Há uma linha de espaço depois da última linha do timbre, depois da linha "Assunto", antes do nome de quem assina e depois do cargo; onde já havia uma linha em branco, não aparece outra.
### T185 – Arquivo ConsultaOptantes escolhe o tipo Consulta (v0.29.3)
F: Em Incluir Documento › Externo, anexe um arquivo chamado "ConsultaOptantes_51866043000195_2026-11-19.pdf".
E: O Tipo do Documento fica "Consulta" sozinho.
### T187 – SICAF abre sozinho depois da Área de Trabalho (v0.29.3)
F: Saia do Compras.gov.br, clique em "notas sem SICAF – Buscar" e "Buscar SICAF e Simples" e faça o login com Gov.br.
E: Ao chegar à Área de Trabalho, aparece "Abrindo o SICAF…" e, assim que o seu nome aparece no alto, a aba vai sozinha para o SICAF e a busca continua.
## Salvamento automático no editor do SEI
> antes de testar: em Configurações > Editor do SEI, ligue "Salvamento automático (neste computador)" e "Botões Copiar conteúdo e Colar conteúdo"; use um documento de teste, ainda não assinado.
### T193 – Restaurar depois de fechar sem salvar (v0.31.0) (Crítico)
F: Num documento com negrito, cores, uma tabela, uma imagem e um comentário, mude o texto, espere 30 segundos, feche a janela sem salvar e abra o editor de novo; clique em "Restaurar esta versão".
E: O aviso mostra a hora em que foi salvo; depois de restaurar aparece "Conferido: texto, formatação e comentários iguais aos da versão salva" e o texto mudado volta, com tudo igual (formatação, tabela, imagem, comentário). Nada é salvo até você clicar em Salvar.
### T194 – Desfazer a restauração (v0.31.0)
F: Depois de restaurar uma versão salva, clique em "Desfazer (voltar ao texto de antes)".
E: O texto que o SEI tinha volta ao editor e o aviso com "Restaurar esta versão" aparece de novo.
### T196 – Cópia apagada ao salvar e ao descartar (v0.31.0)
F: Escreva, espere 30 segundos, clique em Salvar; em outro documento com versão salva, abra de novo e clique em "Descartar esta versão".
E: Depois de salvar aparece "Salvo no SEI hoje às… A versão deste computador foi apagada."; ao descartar, a extensão pede confirmação e, ao abrir o documento de novo, não há aviso.
### T197 – Documento salvo depois da cópia (v0.31.0)
F: Abra o documento em duas janelas do editor; na segunda, escreva algo, espere 30 s e feche sem salvar; na primeira, mude outra coisa e salve; abra de novo.
E: A segunda janela avisa que o documento está aberto em outra janela; ao abrir de novo, o aviso diz em vermelho que o documento foi salvo no SEI depois desta versão e "Restaurar" pede confirmação.
### T198 – Copiar e colar conteúdo entre janelas (v0.31.0)
F: Numa janela do editor, mude o texto e clique em "Copiar conteúdo"; feche sem salvar, abra o mesmo documento e clique em "Colar conteúdo".
E: Pede confirmação, põe o texto copiado (com formatação e comentários) e mostra "Desfazer"; em outro documento, "Colar conteúdo" avisa que o conteúdo é de outro documento.
### T199 – Cópia desligada (v0.31.0)
F: Com as duas opções desligadas nas configurações, abra um documento no editor.
E: Não aparece nada da extensão ao lado do botão Salvar.
### T200 – Correções da extensão voltam ao restaurar (v0.31.1)
F: Num Edital, use "Corrigir a numeração", um estilo com ★, a correção de espaço entre as partes e as margens de uma tabela; espere 30 segundos, feche sem salvar, abra de novo e clique em "Restaurar esta versão".
E: Aparece "Conferido…" e tudo volta igual: números dos itens no lugar, estilo com ★, espaço entre as partes e margens da tabela.

## Dados da extensão
### T201 – Voltar às configurações padrão (v0.31.1)
F: Em Configurações > Geral, mude alguma opção e clique em "Voltar às configurações padrão"; confirme.
E: A página recarrega com as opções do início; as outras informações da extensão continuam.
### T202 – Apagar todos os dados da extensão (v0.31.1)
F: Com uma versão salva de um documento, clique em Configurações > Geral > "Apagar todos os dados da extensão"; confirme e abra o documento no editor.
E: As configurações voltam às do início e o documento abre sem o aviso de versão salva.

### T203 – Salvamento automático para ao apagar os dados com o editor aberto (v0.31.1)
F: Com o salvamento automático ligado, abra um documento no editor do SEI e escreva algo. Em outra aba, vá em Configurações > Geral > "Apagar todos os dados da extensão" e confirme. Volte ao editor e espere 1 minuto.
E: Ao lado do botão Salvar aparece "Salvamento automático desligado nas configurações". Ao fechar e abrir o documento de novo, não aparece "Restaurar esta versão".

### T204 – Outra aba de configurações não desfaz o "Voltar às configurações padrão" (v0.31.1)
F: Abra as Configurações em duas abas. Na primeira, clique em "Voltar às configurações padrão" e confirme. Vá à segunda aba.
E: A segunda aba recarrega sozinha e mostra as escolhas do início; mudar algo nela não traz de volta as escolhas antigas.
### T208 – Salvamento automático funciona no editor (v0.31.2)
F: Com o salvamento automático ligado, abra um documento no editor, escreva uma frase e espere 30 segundos.
E: Ao lado do botão Salvar aparece "Salvo neste computador hoje às…" com a hora, sem a mensagem "O editor do SEI não respondeu".
### T209 – Restaurar deixa o botão Salvar ligado (v0.31.3) (Crítico)
F: Com o salvamento automático ligado, escreva no documento, espere 30 segundos, feche sem salvar, abra de novo e clique em "Restaurar esta versão"; depois clique em Salvar.
E: Fica só uma linha de botões do editor, o botão Salvar está ligado logo após restaurar e o SEI salva o texto restaurado.
### T210 – Ver diferenças sem travar a página (v0.31.3)
F: Com uma versão salva neste computador, clique em "Ver diferenças" e role o documento com a janela aberta.
E: As diferenças aparecem num painel à esquerda, sem escurecer a página; o documento rola normalmente; Esc ou "Fechar" fecham.
### T211 – Aviso discreto ao lado do Salvar (v0.31.3)
F: Com o salvamento automático ligado, escreva, espere 30 segundos e passe o mouse sobre o texto ao lado do botão Salvar.
E: O texto é curto e pequeno (ex.: "Salvo neste computador hoje às…"); a frase completa aparece ao passar o mouse.
### T212 – Erro de conexão explicado (v0.31.3)
F: Com um documento aberto no editor e o salvamento automático ligado, recarregue a extensão (ou atualize-a) e espere 30 segundos.
E: Ao lado do Salvar aparece "⚠ Salvamento automático com erro (clique para ver)"; ao clicar, a mensagem diz para fechar e abrir o editor de novo, sem texto em inglês.
### T213 – Soltar arquivo num documento externo em branco (v0.32.0) (Crítico)
F: Num processo de teste, inclua pelo SEI um documento externo em branco (escolha tipo, data e acesso, sem arquivo), clique nele na árvore e arraste um PDF do computador para a página dele, à direita; confira a janela e clique em "Anexar".
E: Ao arrastar aparece "Solte aqui para anexar…"; a janela mostra o arquivo e o documento; depois de "Anexar", aparece "Pronto" e o documento abre com o PDF, com o mesmo tipo, data, acesso e nome de antes.
### T214 – Vários arquivos num documento em branco (v0.32.0)
F: Abra um documento externo em branco e solte dois arquivos de uma vez na página dele.
E: Aparece a mensagem "Arraste um arquivo só…" e nada é enviado ao SEI.
### T215 – Documento que já tem conteúdo não recebe arquivo (v0.32.0)
F: Abra um documento externo que já tem arquivo (ou um documento feito no SEI) e arraste um arquivo para a página dele.
E: Não aparece "Solte aqui para anexar…" nem a janela da extensão.
### T216 – Dica "PDF no Firefox como no Chrome" (v0.32.0)
F: Abra as configurações da extensão e clique em Dicas.
E: Aparece a dica "PDF no Firefox como no Chrome" com 4 passos numerados; a dica da senha do SEI também aparece em passos numerados.

## Processo e Capa de Processo (v0.33.0)
> Recarregue a extensão (versão 0.33.0) e entre no SEI.
### T217 – Processo novo já vem Público (v0.33.0)
F: Clique em "Iniciar Processo" (ou "Iniciar Processo Relacionado"), escolha o tipo e veja o nível de acesso.
E: "Público" já vem marcado e aparece o aviso para conferir antes de salvar.
### T218 – Dados do processo na tela do processo (v0.33.0)
F: Abra um processo e clique no número dele, no alto da árvore.
E: Na área da direita, abaixo de "Processo aberto…", aparecem Tipo do Processo, Especificação e Interessados, com a mesma letra do SEI.
### T219 – Desligar os dados do processo (v0.33.0)
F: Nas configurações, desmarque "Mostrar os dados do processo" e clique de novo no número do processo.
E: A área da direita fica como o SEI mostra, sem os dados.
### T220 – Capa de Processo com dados de outro processo (v0.33.0) (Crítico)
F: Clique no número do processo (para a extensão ler os dados) e abra no editor uma Capa de Processo copiada de outro processo, sem assinar; clique em "Corrigir o número do processo" e em "Corrigir a capa".
E: Aparecem os avisos do número e de cada dado diferente (data de autuação, tipo, especificação, interessados); depois das correções, a capa mostra os dados do processo aberto. Só fica guardado se você clicar em Salvar.
### T221 – Timbre com letra minúscula e linha em branco (v0.33.0)
F: No editor de um documento de teste não assinado, troque no timbre "Orçamentária" por "orçamentária", aperte Shift+Enter no início de uma linha do timbre, salve, feche e abra o editor de novo; clique em "Corrigir timbre".
E: O aviso mostra a linha que deve começar com maiúscula e a linha em branco a mais; depois de "Corrigir timbre", o timbre fica sem linhas vazias e com "Gestão Orçamentária".
### T222 – Espaço depois do timbre e antes do destinatário (v0.33.0) (Crítico)
F: Abra no editor um Despacho ainda não assinado (também um que já tinha o espaço da extensão), clique em Salvar e gere o PDF.
E: No PDF há uma linha de espaço entre a última linha do timbre e "DESPACHO Nº…", e entre a linha "Assunto" e "Ao Senhor…"; o resto continua como antes.
### T223 – Espaço entre o timbre e "Processo:" na Capa (v0.33.0)
F: Abra no editor uma Capa de Processo ainda não assinada, clique em Salvar e veja o documento na árvore.
E: Há uma linha de espaço entre a última linha do timbre e "Processo:".
### T224 – SEI lento na tela do processo (v0.33.0)
F: Com a internet lenta ou o SEI demorando, clique no número do processo.
E: Depois de até 20 segundos aparece, em cinza, "Não consegui ler os dados do processo agora…"; a página do SEI continua funcionando.
### T225 – Botão Blocos Internos (v0.34.0)
F: Abra a tela inicial do SEI (Controle de Processos) e clique no novo ícone logo depois de "Controle de Prazos".
E: O ícone tem o mesmo tamanho e espaço dos outros e abre a página de Blocos Internos (a mesma do menu Blocos > Internos).
### T226 – Mesmo tamanho de letra na tela do processo (v0.34.1)
F: Clique no número de um processo no SEI.
E: "Tipo do Processo", "Especificação" e "Interessados" têm o mesmo tamanho de letra de "Processo aberto somente na unidade…".
