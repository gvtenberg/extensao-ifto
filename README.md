# Extensão IFTO Palmas

Extensão de navegador que facilita o trabalho no SEI do IFTO para os servidores do Campus Palmas. Ela acrescenta botões e atalhos às páginas do SEI, para reduzir tarefas repetitivas, como assinar uma lista de documentos ou incluir documentos externos em processos de pagamento.

A extensão funciona apenas no endereço `sei.ifto.edu.br`. Nos demais sites ela não faz nada.

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

- **Documento externo já preenchido:** ao incluir um documento externo, a página já vem com a data de hoje, o formato Nato-digital e o nível de acesso Público. Documentos que já existem no processo não são alterados.
- **Senha reconhecida pelo navegador:** a versão atual do SEI esconde o campo de senha de um jeito que o navegador deixa de oferecer a senha guardada. A extensão corrige isso na tela de entrada do SEI e na janela de assinatura.

Para unidades específicas (ligadas automaticamente na unidade indicada, e podem ser ligadas em qualquer unidade nas configurações):

- **Lista de assinaturas (Direção-geral):** permite colar uma lista de processos e documentos (por exemplo, copiada de uma planilha ou de uma mensagem) e abrir um item por vez. O painel mostra o comentário de cada item, destaca em azul os itens que são apenas para dar ciência e tem os botões "Assinar e próximo" e "Dar ciência e próximo". Também aceita um intervalo de números de documentos de um mesmo processo.
- **Documentos do pagamento (CGOC):** com um processo aberto, o botão "Incluir Sicaf, Consulta e Anexo" inclui no processo os três documentos externos em branco (data de hoje, Nato-digital, Público), depois de uma confirmação.

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

- `extensao-ifto-X.Y.Z.xpi`: arquivo para o **Firefox** (X.Y.Z é o número da versão, por exemplo 0.9.3).
- `extensao-ifto-chrome-X.Y.Z.zip`: arquivo para o **Chrome** e o **Edge**.
- `updates.json`: arquivo usado pelo Firefox para a atualização automática. Não é preciso baixá-lo.

Baixe a extensão somente por esse endereço. Arquivos recebidos por e-mail, aplicativos de mensagem ou outros sites podem ter sido alterados.

## Como instalar no Firefox

1. Abra o Firefox e acesse o endereço da seção [Onde baixar](#onde-baixar).
2. Clique no arquivo `extensao-ifto-X.Y.Z.xpi`.
3. Se aparecer o aviso "O Firefox impediu que este site pedisse para instalar software", clique em **Permitir**.
4. Na janela seguinte, clique em **Adicionar**.
5. Para deixar o ícone da extensão sempre visível: clique no ícone de peça de quebra-cabeça, ao lado da barra de endereços, depois na engrenagem ao lado de "Extensão IFTO Palmas" e em **Fixar na barra de ferramentas**.

A instalação é feita uma única vez. Depois disso, o Firefox atualiza a extensão sozinho.

## Como instalar no Chrome ou no Edge

1. Na página da seção [Onde baixar](#onde-baixar), clique no arquivo `extensao-ifto-chrome-X.Y.Z.zip` para baixá-lo.
2. Descompacte o arquivo em uma pasta que não será apagada nem movida, por exemplo `Documentos\extensao-ifto-chrome`. No Windows: clique com o botão direito no arquivo baixado, escolha **Extrair tudo** e indique a pasta.
3. No Chrome, digite `chrome://extensions` na barra de endereços e pressione Enter. No Edge, digite `edge://extensions`.
4. Ative o **Modo do desenvolvedor** (no Chrome, no canto superior direito; no Edge, no menu à esquerda).
5. Clique em **Carregar sem compactação** e escolha a pasta descompactada (a que contém o arquivo `manifest.json`).
6. Para deixar o ícone sempre visível: clique no ícone de peça de quebra-cabeça, ao lado da barra de endereços, e no alfinete ao lado de "Extensão IFTO Palmas".

Ao abrir o navegador, o Chrome pode exibir o aviso "Desativar extensões no modo do desenvolvedor". Nesse caso, feche o aviso ou clique na opção para manter as extensões; não clique em "Desativar".

Não apague a pasta descompactada: o navegador usa os arquivos dela enquanto a extensão estiver instalada.

## Como atualizar

**Firefox:** a atualização é automática (o Firefox verifica uma vez por dia). Para atualizar na hora, use um dos caminhos:

- clique no ícone da extensão, em **Procurar atualização** e depois em **Instalar a versão …**; ou
- no menu do Firefox (três traços, no canto superior direito), clique em **Extensões e temas**, na engrenagem e em **Procurar atualizações**.

**Chrome e Edge:** baixe o novo arquivo `.zip`, descompacte-o **na mesma pasta** usada na instalação (substituindo os arquivos), abra `chrome://extensions` (ou `edge://extensions`) e clique na seta circular do cartão "Extensão IFTO Palmas".

Nos dois casos, as configurações e a lista de assinaturas são mantidas.

## Configurações

Para abrir: clique no ícone da extensão e em **Configurações**. Cada escolha é gravada na hora, sem botão de salvar.

**Geral (todas as unidades)**

- **Preencher documento externo novo** (ligada de início): data de hoje, Nato-digital e Público ao incluir um documento externo.
- **Navegador reconhece o campo de senha** (ligada de início): faz o navegador voltar a oferecer a senha guardada no SEI.

**Por unidade**

Cada função abaixo tem três opções: **Automática** (liga só na unidade indicada), **Sempre ligada** (em qualquer unidade) e **Desligada**. A extensão confere a unidade aberta no SEI a cada página, então a função aparece ou some quando a unidade é trocada.

- **Lista de assinaturas:** automática na Direção-geral (PAL/REI/IFTO).
- **Documentos do pagamento:** automática na CGOC (CGOC/GAC/DAP/PAL/REI/IFTO).

## Quais dados a extensão lê e guarda

- **O que lê:** somente as páginas do SEI abertas no navegador (unidade atual, árvore do processo, números dos documentos e versão do SEI), para saber onde colocar os botões e qual documento abrir.
- **O que guarda:** as configurações, a lista de assinaturas colada (até o uso do botão "Limpar lista") e a versão do último SEI aberto. Esses dados ficam apenas no navegador do próprio computador.
- **Senha:** a extensão **não lê nem guarda a senha**. A senha fica no gerenciador de senhas do navegador; a extensão apenas verifica se o campo já está preenchido.
- **Envio de dados:** a extensão não envia dados do SEI para nenhum outro site. A única consulta externa é a verificação de nova versão (automática no Firefox, ou pelo botão "Procurar atualização"), feita na página de versões indicada em [Onde baixar](#onde-baixar).
- **O que escreve no SEI:** a extensão só faz alterações no SEI a partir de um clique do usuário, por exemplo em "Assinar e próximo" ou na confirmação de "Incluir Sicaf, Consulta e Anexo".

## Cuidados no uso

- **Confira antes de assinar.** O botão "Assinar e próximo" assina o documento aberto com a senha guardada no navegador. O clique nesse botão vale como confirmação, por isso leia o documento antes de clicar.
- **Computador compartilhado:** não guarde a senha do SEI no navegador de um computador usado por outras pessoas. Em computador pessoal de trabalho, recomenda-se proteger as senhas guardadas com uma senha principal (no Firefox: menu > **Configurações** > **Privacidade e Segurança** > **Usar uma senha principal**).
- **Senhas de outros sistemas:** o Firefox pode sugerir no SEI senhas guardadas para outros endereços do IFTO (SUAP, Moodle e outros). Confira se a senha sugerida é a do SEI.
- **Baixe somente pelo endereço oficial** indicado em [Onde baixar](#onde-baixar).
- **Se algo parecer errado no SEI:** desligue a função correspondente nas configurações (ou desative a extensão em "Extensões e temas") e verifique se o problema continua. Isso ajuda a saber se a causa é a extensão ou o próprio SEI antes de acionar o suporte.
- **Mudanças no SEI:** quando o SEI do IFTO é atualizado, alguma função pode deixar de funcionar até a extensão ser ajustada. Nesse caso, comunique pelos meios abaixo.

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

Licença GPL-3.0 (arquivo `LICENSE`). Partes do código vêm do **SEI++** (Jonatas Evaristo, https://github.com/jonatasrs/sei, GPL-3.0); o **SEI Pro** (https://github.com/SEI-Pro/sei-pro, AGPL-3.0) é usado como referência, e trechos aproveitados dele mantêm a licença de origem, indicada no próprio arquivo.

Para quem for trabalhar no código da extensão: as orientações estão em `CLAUDE.md` e na pasta `docs/`.
