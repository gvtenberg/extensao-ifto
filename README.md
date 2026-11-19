# Extensão IFTO Palmas

Extensão de navegador que facilita o trabalho no SEI do IFTO para os servidores do Campus Palmas. Ela acrescenta botões e atalhos às páginas do SEI, para reduzir tarefas repetitivas, como assinar uma lista de documentos ou incluir documentos externos em processos de pagamento. Também confere os documentos antes da assinatura (número do processo, timbre, rodapé e data) e melhora o editor de textos do SEI (tabelas, estilos e salvamento automático).

A extensão funciona sempre no SEI do IFTO (`sei.ifto.edu.br`). Nos sites abaixo ela só entra **se você der a permissão** nas configurações (cada permissão é pedida à parte e pode ser retirada):

- **Compras.gov.br (SICAF) e Simples Nacional (Receita Federal):** para buscar e salvar os PDFs do fornecedor da nota fiscal.
- **Gov.br (página de entrada):** só para clicar sozinha em "SerproID" (opcional).
- **Compras IFTO** (`compras-ifto-teste-v1-mbro.onrender.com`): para receber as peças da licitação enviadas ao SEI.

Nos demais sites ela não faz nada.

## Sumário

- [O que a extensão faz](#o-que-a-extensão-faz)
- [Navegadores compatíveis](#navegadores-compatíveis)
- [Onde baixar](#onde-baixar)
- [Como instalar no Firefox](#como-instalar-no-firefox)
- [Como instalar no Chrome ou no Edge](#como-instalar-no-chrome-ou-no-edge)
- [Como atualizar](#como-atualizar)
- [Configurações](#configurações)
- [Quais dados a extensão lê e guarda](#quais-dados-a-extensão-lê-e-guarda)
- [Cuidados no uso](#cuidados-no-uso)
- [Erros e sugestões de melhoria](#erros-e-sugestões-de-melhoria)
- [Licença e créditos](#licença-e-créditos)

## O que a extensão faz

Para todas as unidades:

- **Documento externo já preenchido:** ao incluir um documento externo, a página já vem com a data de hoje e com o formato e o nível de acesso escolhidos nas configurações (de início, Nato-digital e Público). Ao escolher o arquivo, a extensão escolhe o tipo pelo nome do arquivo ("Nota Fiscal 123.pdf" fica Nota Fiscal, com o Nome na Árvore "123"), troca o "#" do nome por "_" (o SEI não aceita) e avisa quando o arquivo passa de 10 MB, com dicas para diminuí-lo. Você confere e clica em Salvar. Documentos que já existem no processo não são alterados.
- **Arrastar arquivos para o processo:** com um processo aberto, arraste um ou mais arquivos do computador para a árvore (à esquerda). Abre uma lista com o tipo, o Nome na Árvore, a data e o tamanho de cada arquivo, para conferir e corrigir; os arquivos entram no processo (Nato-digital e Público) só depois que você clica em "Incluir no processo". Arquivo acima de 10 MB não entra (a lista mostra como diminuí-lo). Para pôr o arquivo num documento externo **em branco** que já está no processo, abra o documento e solte o arquivo na página dele (à direita): o arquivo é anexado depois que você clica em "Anexar", e o tipo, a data e o acesso do documento ficam como estão.
- **Senha reconhecida pelo navegador:** a versão atual do SEI esconde o campo de senha de um jeito que o navegador deixa de oferecer a senha guardada. A extensão corrige isso na tela de entrada do SEI e na janela de assinatura.
- **Conferir o documento antes de assinar:** em documentos ainda não assinados, a extensão avisa quando o número do processo do texto não é o do processo aberto, quando o timbre ou o rodapé estão errados (unidades do Campus Palmas), quando a data está errada ou fora do padrão ("Palmas, 1º de dezembro de 2026.") e quando as partes do documento estão grudadas. Os avisos aparecem numa janela só, no canto de baixo, que pode ser arrastada; no editor, cada aviso tem o seu botão de corrigir. Ao assinar um documento com erro (pela árvore, no editor, na lista de assinaturas ou no Bloco de assinatura), a extensão pergunta antes "Assinar mesmo assim?". Nada é salvo sem você clicar em Salvar. Detalhes em [Configurações](#configurações).
- **Copiar com mais facilidade:** na página do documento, os nomes de quem assinou podem ser selecionados e copiados. No menu de cópia do ícone de um documento na árvore, se clicar na opção errada é só clicar na certa; o menu fecha sozinho logo depois (ou com Esc ou um clique fora).
- **Aviso de versão nova do SEI:** quando o SEI muda para uma versão em que a extensão ainda não foi testada, aparece um aviso com "Continuar usando" e "Desativar a extensão no SEI". Desativada, a extensão não mexe em nada no SEI até você clicar em "Ativar de novo" (no ícone da extensão ou em Configurações › Geral).

Para unidades específicas (ligadas automaticamente na unidade indicada, e podem ser ligadas em qualquer unidade nas configurações):

- **Lista de assinaturas (Direção-geral):** permite colar uma lista de processos e documentos (por exemplo, copiada de uma planilha ou de uma mensagem) e abrir um item por vez. O painel mostra o comentário de cada item, destaca em azul os itens que são apenas para dar ciência e tem os botões "Assinar e próximo" e "Dar ciência e próximo". Também aceita um intervalo de números de documentos de um mesmo processo.
- **SICAF e Simples Nacional da nota fiscal (CGOC):** com um processo de pagamento aberto, mostra o botão "N notas sem SICAF ou Simples – Buscar" quando há notas fiscais depois da última Folha de Encaminhamento sem o SICAF ou a consulta do Simples Nacional do fornecedor. Ao clicar, a extensão lê o PDF de cada nota, confere com o ateste (CNPJ, número, valor, empenho e se a nota é para o Campus Palmas) e mostra as diferenças em vermelho. Depois busca o PDF "Situação do Fornecedor" no SICAF (o login no Compras.gov.br com Gov.br é feito pela própria pessoa), salva o PDF na pasta Downloads; na mesma aba, consulta o fornecedor no Simples Nacional (se o site pedir a verificação de imagens, a própria pessoa resolve) e salva também esse PDF em Downloads. Depois de uma confirmação, inclui no processo o Sicaf com o PDF, a Consulta Simples Nacional com o PDF e um Anexo em branco para cada nota.
- **CNPJ selecionado (CGOC; outras unidades com "Sempre ligada"):** ao selecionar um CNPJ numa página do SEI aparece, na CGOC, o botão "Incluir SICAF, Simples e Anexo"; nas outras unidades, só "Incluir SICAF". No PDF de uma nota, use o botão direito > "Buscar SICAF deste CNPJ".
- **Peças do Compras IFTO (CCL):** no Compras IFTO, o botão "Enviar ao SEI" de cada fase manda a peça (DFD, ETP, Termo de Referência, Edital etc.) para a extensão. No SEI, com o processo aberto, aparece o botão "N peças do Compras IFTO". Escolha a peça e, na janela, confira o tipo de documento sugerido, o nível de acesso (Público ou Restrito, com a hipótese legal), o número do processo e a prévia do texto. Ao clicar em "Criar e salvar", a extensão cria o documento, coloca o texto no corpo (o cabeçalho e o rodapé vêm do modelo do SEI) e salva. **Ela nunca assina.** Se o processo já tiver um documento do mesmo tipo, a janela avisa e pede confirmação.
- **Tabelas no editor do SEI (todas as unidades):** ao recortar (Ctrl+X) ou copiar (Ctrl+C) um trecho com tabela e colar (Ctrl+V) em outro lugar do mesmo documento, a tabela fica igual (largura, colunas e margens); Ctrl+Z desfaz. Na janela "Propriedades da tabela" aparecem quatro campos de margem em pixels (acima, direita, abaixo e esquerda), já preenchidos com as margens da tabela, e um quarto botão em "Alinhamento", "Alinhar com o texto", que deixa a tabela com o mesmo recuo do texto (10, 0, 10 e 28 px). Ao trocar o estilo do texto de uma célula (por exemplo, de "Tabela Texto Justificado" para "Tabela Texto Centralizado"), a cor de fundo e as bordas da célula continuam. Cada uma pode ser desligada nas configurações.
- **Todos os estilos em todos os documentos (todas as unidades):** no texto principal de qualquer documento, a lista de estilos do editor traz também os estilos de outros tipos (como os do Edital: "Item_Nivel2", "Texto_Fundo_Cinza_Negrito"…), depois dos do próprio tipo e marcados com "★". O documento salvo e o PDF guardam a formatação. Quem editar o documento sem a extensão pode perder essa formatação. Pode ser desligado nas configurações; desligado, o editor avisa quando o documento já usa esses estilos, com o botão "Ligar de novo".
- **Salvamento automático (neste computador; desligado de início):** enquanto você escreve no editor, a extensão salva o documento neste computador a cada 30 segundos (texto, formatação, tabelas, imagens, comentários e as correções feitas pela extensão); ao lado do botão Salvar aparece "Salvo neste computador hoje às…". **Não salva no SEI:** continue clicando em **Salvar**. Se o SEI der erro ao salvar ou a janela fechar, ao abrir o documento de novo aparece o aviso com **Restaurar esta versão**, **Ver diferenças** e **Descartar esta versão**. Depois de restaurar, confira e clique em **Salvar**; o botão **Desfazer** volta ao texto de antes. A versão salva neste computador é apagada quando o SEI salva o documento, ou depois de 7 dias. Opcional também: os botões **Copiar conteúdo** e **Colar conteúdo**, para levar o documento inteiro de uma janela que não consegue salvar para outra janela do mesmo documento.
- **Números longos nos itens de edital (todas as unidades):** nos estilos "Item nível 2, 3 e 4 Edital", um número comprido como "10.10." não cabe no espaço e o texto pula para a linha de baixo. Quando isso acontece, aparece no editor o botão "Corrigir a numeração": a extensão dá mais espaço só aos números que não cabem (os outros ficam iguais), também no documento salvo e no PDF. Você confere e clica em **Salvar**. Pode ser desligado nas configurações.
- **Marca MINUTA nos editais (Direção-geral):** quando o edital é criado usando a minuta como modelo, a marca d'água "MINUTA" vem junto e aparece no fundo da página e do PDF. Ao abrir o edital no editor do SEI, aparece no canto de baixo o botão "Remover marca MINUTA": a extensão tira a marca do texto e você confere e clica em **Salvar** no editor (se algo sair errado, feche o editor sem salvar). Se o texto ainda tiver a palavra "minuta" (por exemplo, no título "minuta de EDITAL"), a extensão avisa onde está, para você corrigir à mão. Só aparece em documentos do tipo Edital; a Minuta de Edital continua com a marca.
- **Equipe de licitação ("Sempre ligada"):** o botão "Incluir SICAF" permite digitar ou colar o CNPJ, sem precisar de nota fiscal no processo, e inclui só o Sicaf com o PDF.
- Se o processo já tem Sicaf, Consulta ou Anexo **em branco**, a extensão preenche esses documentos (Sicaf e Consulta recebem o PDF e o nome; o Anexo, o nome) em vez de criar outros.

Os botões da extensão ficam no alto, à direita, nas páginas do SEI.

## Navegadores compatíveis

| Navegador | Situação | Atualização |
|---|---|---|
| Mozilla Firefox (versão 128 ou mais recente) | Recomendado | Automática |
| Google Chrome | Compatível | Manual (é preciso baixar cada nova versão) |
| Microsoft Edge | Compatível | Manual (é preciso baixar cada nova versão) |

No Chrome e no Edge a extensão é instalada fora da loja oficial desses navegadores, por isso a instalação tem mais passos e as atualizações não são automáticas. Sempre que possível, use o Firefox.

## Onde baixar

Todas as versões ficam na página de versões da extensão:

**https://github.com/gvtenberg/extensao-ifto/releases/latest**

Essa página fica no GitHub, um site onde o código da extensão é guardado. Não é preciso criar conta para baixar. Ao abrir o link, procure a parte "Assets" (arquivos), no fim da versão mais recente. Há três arquivos:

- `extensao-ifto-firefox-X.Y.Z.xpi`: arquivo para o **Firefox** (X.Y.Z é o número da versão, por exemplo 0.9.3).
- `extensao-ifto-chrome-edge-X.Y.Z.zip`: arquivo para o **Chrome** e o **Edge**.
- `updates.json`: arquivo usado pelo Firefox para a atualização automática. Não é preciso baixá-lo.

Baixe a extensão somente por esse endereço. Arquivos recebidos por e-mail, aplicativos de mensagem ou outros sites podem ter sido alterados.

## Como instalar no Firefox

1. Abra o Firefox e acesse o endereço da seção [Onde baixar](#onde-baixar).
2. Clique no arquivo `extensao-ifto-firefox-X.Y.Z.xpi`.
3. Se aparecer o aviso "O Firefox impediu que este site pedisse para instalar software", clique em **Permitir**.
4. Na janela seguinte, clique em **Adicionar**.
5. Para deixar o ícone da extensão sempre visível: clique no ícone de peça de quebra-cabeça, ao lado da barra de endereços, depois na engrenagem ao lado de "Extensão IFTO Palmas" e em **Fixar na barra de ferramentas**.
6. Clique no ícone da extensão. Se aparecer o botão **Permitir no SEI**, clique nele e confirme. Sem isso, a extensão só funciona na página do SEI em que você clicou no ícone e some ao abrir outra página.

A instalação é feita uma única vez. Depois disso, o Firefox atualiza a extensão sozinho.

## Como instalar no Chrome ou no Edge

1. Na página da seção [Onde baixar](#onde-baixar), clique no arquivo `extensao-ifto-chrome-edge-X.Y.Z.zip` para baixá-lo.
2. Descompacte o arquivo em uma pasta que não será apagada nem movida, por exemplo `Documentos\extensao-ifto-chrome`. No Windows: clique com o botão direito no arquivo baixado, escolha **Extrair tudo** e indique a pasta.
3. No Chrome, digite `chrome://extensions` na barra de endereços e pressione Enter. No Edge, digite `edge://extensions`.
4. Ative o **Modo do desenvolvedor** (no Chrome, no canto superior direito; no Edge, no menu à esquerda).
5. Clique em **Carregar sem compactação** e escolha a pasta descompactada (a que contém o arquivo `manifest.json`).
6. Para deixar o ícone sempre visível: clique no ícone de peça de quebra-cabeça, ao lado da barra de endereços, e no alfinete ao lado de "Extensão IFTO Palmas".

Ao abrir o navegador, o Chrome pode exibir o aviso "Desativar extensões no modo do desenvolvedor". Nesse caso, feche o aviso ou clique na opção para manter as extensões; não clique em "Desativar".

Não apague a pasta descompactada: o navegador usa os arquivos dela enquanto a extensão estiver instalada.

## Como atualizar

**Firefox:** clique no ícone da extensão e em **Procurar atualização**. Se houver versão nova, clique em **Abrir a página da versão …**; na página, clique no arquivo que termina em `.xpi`, depois em **Permitir** e em **Adicionar**.

**Chrome e Edge:** baixe o novo arquivo `.zip`, descompacte-o **na mesma pasta** usada na instalação (substituindo os arquivos), abra `chrome://extensions` (ou `edge://extensions`) e clique na seta circular do cartão "Extensão IFTO Palmas".

Nos dois casos, as configurações e a lista de assinaturas são mantidas.

## Configurações

Para abrir: clique no ícone da extensão e em **Configurações**. Cada escolha é gravada na hora, sem botão de salvar. O menu à esquerda mostra um grupo de cada vez: Geral, Documentos do SEI, Minhas unidades, Direção-geral, SICAF e Simples, Licitação, Cópia das configurações, Dicas e Ajuda.

**Geral (todas as unidades)**

- **Preencher documento novo** (ligada de início): data de hoje, formato e nível de acesso ao incluir um documento externo (os valores ficam em Documentos do SEI).
- **Navegador reconhece o campo de senha** (ligada de início): faz o navegador voltar a oferecer a senha guardada no SEI.
- **Desativar a extensão no SEI** / **Ativar de novo:** desliga (ou liga de novo) todas as funções da extensão no SEI, por exemplo depois do aviso de versão nova do SEI.
- **Dados da extensão:** **Voltar às configurações padrão** (todas as escolhas voltam a ser as do início; as permissões já dadas continuam) e **Apagar todos os dados da extensão** (configurações, versões salvas automaticamente, conteúdo copiado, lista de assinaturas e o restante; não dá para desfazer).

**Documentos do SEI (todas as unidades)**

- **Conferir o documento** (cinco opções, ligadas de início): número do processo, timbre e rodapé (unidades do Campus Palmas), data do documento e espaço entre as partes do documento. Número do processo: quando a linha "Processo nº:" (ou o título do Edital) não é a do processo em que o documento está, aparece um aviso na página do documento (só antes de assinar) e, no editor, o botão "Corrigir o número do processo". Ao assinar (pela árvore ou no editor) um documento com o número errado, a extensão pergunta antes "Assinar mesmo assim?"; na lista de assinaturas, um intervalo de documentos é conferido de uma vez, numa janela só; no Bloco de assinatura, os documentos do bloco são conferidos antes de assinar. Timbre e rodapé (unidades do Campus Palmas): a extensão compara com os dados de "Minhas unidades" (sem cadastro, com o telefone e o e-mail gerais do campus) e avisa o que está errado, com os botões "Corrigir timbre" e "Corrigir rodapé" no editor; "Usar este timbre como padrão da unidade" guarda as linhas do setor do documento aberto. Espaço entre as partes: ao abrir o editor de um documento ainda não assinado, a extensão põe uma linha de espaço onde as partes estão grudadas (timbre, número, data, processo, nome de quem assina) e mostra onde, com o botão "Desfazer". Data do documento: em documentos ainda não assinados, avisa a data com mês ou ano errado, de um dia que ainda não chegou ou fora do padrão ("Palmas, 1º de dezembro de 2026."), com o botão "Corrigir para …" no editor, e pergunta antes de assinar com a data errada; dá para desligar em "Data do documento". Nada é salvo sem você clicar em Salvar.
- **Copiar o nome de quem assinou** (ligada de início): na página do documento, os nomes da caixa "Documento assinado eletronicamente por…" podem ser selecionados e copiados.
- **Menu de cópia mais rápido** (ligada de início): no menu do ícone de um documento na árvore do processo, se clicar na opção errada é só clicar na certa; o menu fecha logo depois, e Esc ou um clique fora também fecham.
- **Editor do SEI:** tabelas inteiras ao recortar e colar, margens da tabela, números longos nos itens de edital, **Todos os estilos em todos os documentos** (ligada de início), **Salvamento automático** e os botões **Copiar conteúdo** / **Colar conteúdo** (desligados de início).
- **Documento externo novo:** nível de acesso (Público, ou Restrito com a hipótese legal), formato (Nato-digital, ou Digitalizado com o tipo de conferência).
- **Ao escolher o arquivo:** regras próprias para o tipo (uma por linha, como "SICAF = Sicaf"), tipo padrão, Nome na Árvore com o nome do arquivo e troca do "#" por "_" (as duas últimas ligadas de início). O tipo só é escolhido se você ainda não escolheu um.
- **Arrastar arquivos para o processo** (ligada de início) e **Usar a data do arquivo** (desligada de início: o documento fica com a data de hoje).

**Minhas unidades**

Cadastre as unidades em que você trabalha no SEI (sigla, telefone, e-mail e as linhas do setor que ficam abaixo de "Campus Palmas" no timbre). A extensão usa esses dados para conferir o timbre e o rodapé. Ficam guardados só no navegador.

**Por unidade**

Cada função abaixo tem três opções: **Automática** (liga só na unidade indicada), **Sempre ligada** (em qualquer unidade) e **Desligada**. A extensão confere a unidade aberta no SEI a cada página, então a função aparece ou some quando a unidade é trocada.

- **Lista de assinaturas:** automática na Direção-geral (PAL/REI/IFTO).
- **Marca MINUTA nos editais:** automática na Direção-geral (PAL/REI/IFTO).
- **Documentos do pagamento:** automática na CGOC (CGOC/GAC/DAP/PAL/REI/IFTO).
- **SICAF e Simples Nacional:** "Automática" para o pagamento de notas fiscais na CGOC; "Sempre ligada" (equipe de licitação) mostra só o botão "Incluir SICAF", em qualquer unidade; "Desligada" tira tudo. Na primeira vez, clique em **Permitir acesso ao Compras.gov.br e ao Simples Nacional**: o navegador pede permissão para a extensão abrir esses dois sites e salvar os PDFs na pasta Downloads (só quem usa o SICAF precisa permitir).
- **Entrar no Gov.br com o certificado SerproID** (opcional, começa desligada): quando a busca do SICAF encontra você sem login, a extensão clica sozinha em "SerproID" na página de entrada do Gov.br. Ao ligar, o navegador pede acesso só a essa página (sso.acesso.gov.br); a extensão não lê nem guarda CPF, senha, QR code ou código. Sem permitir (ou ao desligar), o acesso é retirado e você só perde esse clique: na página do Gov.br, clique em "Seu certificado digital em nuvem" e depois em "SerproID".
- **Licitação (CCL): peças do Compras IFTO:** automática na CCL (CCL/GAC/DAP/PAL/REI/IFTO). Na primeira vez, clique em **Permitir no Compras IFTO** e, depois, recarregue a página do Compras IFTO (F5): só então aparece o botão "Enviar ao SEI" lá (só quem usa o Compras IFTO precisa permitir).

**Cópia das configurações**

- **Baixar cópia das configurações:** guarda todas as escolhas da página (inclusive "Minhas unidades" e as regras do tipo de documento) num arquivo na pasta Downloads, para guardar ou passar para outro computador ou colega.
- **Carregar cópia:** escolha o arquivo baixado; depois de confirmar, as configurações deste navegador são trocadas pelas do arquivo. As permissões (Compras.gov.br, Simples Nacional, Compras IFTO e Gov.br) não vão no arquivo: permita de novo, se precisar.

**Dicas**

- **PDF no Firefox como no Chrome:** quatro ajustes no Firefox para o PDF anexado no SEI aparecer na página sem ser salvo e o link de baixar perguntar o nome e a pasta, sem abrir outra aba.
- **Só a senha do SEI na assinatura (Firefox):** o Firefox passa a oferecer no SEI só a senha do SEI, e não as do SUAP, Moodle etc.
- **PDF grande demais para o SEI** (limite de 10 MB): dois sites para diminuir o PDF: ilovepdf.com (mais rápido) e pdf24.org (diminui mais).

## Quais dados a extensão lê e guarda

- **O que lê:** somente as páginas do SEI abertas no navegador (unidade atual, árvore do processo, números dos documentos e versão do SEI), para saber onde colocar os botões e qual documento abrir. Para o SICAF, lê também o texto dos atestes e dos PDFs das notas fiscais e do SICAF do processo aberto, a página do SICAF no Compras.gov.br e o resultado da consulta do Simples Nacional (só depois da permissão e do clique em "Buscar"). No Compras IFTO (com a permissão), recebe só as peças que a pessoa envia com "Enviar ao SEI".
- **O que guarda:** as configurações (com a lista "Minhas unidades"), a lista de assinaturas colada (até o uso do botão "Limpar lista"), a versão do último SEI aberto (e, se o SEI mudar de versão, a sua escolha de continuar ou desativar a extensão nele), os estilos do editor de cada tipo de documento aberto (para oferecê-los nos outros tipos), os PDFs do SICAF e do Simples Nacional obtidos no dia (para não buscar de novo; os de outros dias são apagados), as peças do Compras IFTO que esperam para ir ao SEI (cada uma sai da lista quando é incluída ou com "Tirar da lista") e os tipos de documento criados no dia a partir delas (para o aviso de documento repetido). Com o **Salvamento automático** ligado, guarda também a versão do documento que está sendo escrito (apagada quando o SEI salva, ou depois de 7 dias) e o conteúdo copiado com "Copiar conteúdo". Tudo isso pode ser apagado em Configurações › Geral › **Apagar todos os dados da extensão**. A "Cópia das configurações" só vai para a pasta Downloads quando você clica em "Baixar cópia das configurações". Esses dados ficam apenas no navegador do próprio computador.
- **Senha:** a extensão **não lê nem guarda a senha**. A senha fica no gerenciador de senhas do navegador; a extensão apenas verifica se o campo já está preenchido.
- **Envio de dados:** a extensão não envia dados do SEI para nenhum outro site (no SICAF e no Simples Nacional, só digita o CNPJ do fornecedor na pesquisa). A única consulta externa é a verificação de nova versão (automática no Firefox, ou pelo botão "Procurar atualização"), feita na página de versões indicada em [Onde baixar](#onde-baixar).
- **O que escreve no SEI:** a extensão só faz alterações no SEI a partir de um clique do usuário, por exemplo em "Assinar e próximo" ou na confirmação de "Incluir no processo" (SICAF, Simples Nacional e arquivos arrastados para a árvore), de "Anexar" (arquivo solto num documento externo em branco) e de "Criar e salvar" (peças do Compras IFTO; a extensão abre a janela do editor do SEI, salva e a fecha). Em "Remover marca MINUTA", nas correções do documento (número do processo, timbre, rodapé e data) no espaço entre as partes do documento e nos estilos com "★" (um bloco de formatação escondido no texto), a extensão só muda o texto no editor; quem salva é você.

## Cuidados no uso

- **Confira o SICAF antes de incluir.** A janela "Incluir no processo" mostra os PDFs de cada fornecedor e os avisos; avisos em vermelho pedem um segundo clique. O login no Compras.gov.br é sempre feito pela própria pessoa.
- **Confira a peça do Compras IFTO antes de assinar.** A extensão cria e salva o documento, mas não assina: abra-o na árvore, revise o texto e assine. Se aparecer um aviso amarelo, a peça continua na lista e o documento pode ter ficado sem texto: confira-o na árvore.
- **Confira antes de assinar.** O botão "Assinar e próximo" assina o documento aberto com a senha guardada no navegador. O clique nesse botão vale como confirmação, por isso leia o documento antes de clicar.
- **Computador compartilhado:** não guarde a senha do SEI no navegador de um computador usado por outras pessoas. Em computador pessoal de trabalho, recomenda-se proteger as senhas guardadas com uma senha principal (no Firefox: menu > **Configurações** > **Privacidade e Segurança** > **Usar uma senha principal**).
- **Senhas de outros sistemas:** o Firefox pode sugerir no SEI senhas guardadas para outros endereços do IFTO (SUAP, Moodle e outros). Confira se a senha sugerida é a do SEI.
- **Baixe somente pelo endereço oficial** indicado em [Onde baixar](#onde-baixar).
- **Se algo parecer errado no SEI:** desligue a função correspondente nas configurações (ou desative a extensão em "Extensões e temas") e verifique se o problema continua. Isso ajuda a saber se a causa é a extensão ou o próprio SEI antes de acionar o suporte.
- **Mudanças no SEI:** quando o SEI do IFTO é atualizado, alguma função pode deixar de funcionar até a extensão ser ajustada. A extensão avisa no próprio SEI e deixa escolher entre continuar usando ou desativá-la no SEI (para ligar de novo: ícone da extensão > **Ativar de novo**, ou Configurações > Geral). Nesse caso, comunique pelos meios abaixo.

## Erros e sugestões de melhoria

Para informar um erro ou sugerir uma melhoria:

- **Pessoalmente:** procure o responsável pela extensão na CGOC (Coordenação de Gestão Orçamentária e de Contratos) do Campus Palmas.
- **Pela internet (quem tem conta no GitHub):** registre um pedido em **https://github.com/gvtenberg/extensao-ifto/issues/new**.

Para agilizar a análise de um erro, informe:

- a versão da extensão (aparece na janela aberta pelo ícone da extensão);
- o navegador utilizado (Firefox, Chrome ou Edge);
- a página do SEI em que o erro ocorreu e o que estava sendo feito;
- a mensagem exibida, se houver.

Não envie senhas nem informações sigilosas de processos.

## Licença e créditos

Licença GPL-3.0 (arquivo `LICENSE`). A leitura de PDF usa o **pdf.js** da Mozilla (https://github.com/mozilla/pdf.js, Apache-2.0, pasta `bibliotecas/pdfjs`). Partes do código vêm do **SEI++** (Jonatas Evaristo, https://github.com/jonatasrs/sei, GPL-3.0); o **SEI Pro** (https://github.com/SEI-Pro/sei-pro, AGPL-3.0) é usado como referência, e trechos aproveitados dele mantêm a licença de origem, indicada no próprio arquivo.

Para quem for trabalhar no código da extensão: as orientações estão em `CLAUDE.md` e na pasta `docs/`.
