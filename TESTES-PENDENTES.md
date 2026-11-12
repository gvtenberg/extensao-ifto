# Testes pendentes

**Seções** (busque `### T..` ou o título): Levantamento: SEI++ antigo no SEI do IFTO · Base da extensão e botão Novo documento (v0.1.0) · Levantamento: nome e tamanho dos arquivos no SEI · Perguntas para responder (etapas 2 e 3) · Senha reconhecida pelo navegador no SEI 5 (v0.1.1)

Como usar este arquivo:

- Cada teste tem um número fixo (T01, T02…). Ao testar, troque a marca da linha **Resultado**:
    - `[ ]` ainda não testado;
    - `[x]` deu certo;
    - `[!]` falhou ou precisa de ajuste. Escreva na linha **Observação** o que aconteceu ou o que quer mudar.
- Depois, no Claude Code, digite `/testes` (ou diga "atualizei os testes"): o Claude lê este arquivo, corrige o que falhou e apaga os testes que deram certo.
- Instalação temporária no Firefox: digite `about:debugging#/runtime/this-firefox` na barra de endereço, clique em **Carregar extensão temporária…** e escolha o arquivo. A extensão some quando o Firefox fecha.

---

## Levantamento: SEI++ antigo no SEI do IFTO

Antes de cada teste, desative o SEI Pro ou outro SEI++ que estiver instalado (menu ☰ > Extensões e temas). Teste uma versão de cada vez: remova a primeira (botão **Remover** em `about:debugging`) antes de carregar a segunda.

### T01 – SEI++ versão 5.1.1 (2022)

- O que fazer: carregue o arquivo `ferramentas-de-teste/seipp/seipp-v5.1.1.xpi` (dentro da pasta `extensao-ifto`). Entre no SEI do IFTO, abra o "Controle de Processos", um processo e um documento. Clique no ícone do SEI++ na barra do Firefox e veja as opções.
- O que deve acontecer: as funções do SEI++ aparecem no SEI. Anote na Observação: a versão do SEI do IFTO (rodapé ou tela de login), quais funções eram úteis para vocês e quais funcionam ou não.
- Resultado: \[ \]
- Observação:

### T02 – SEI++ do commit c53f1367 (6.0 beta, 2025)

- O que fazer: o mesmo do T01, com o arquivo `ferramentas-de-teste/seipp/seipp-c53f136.xpi`.
- O que deve acontecer: esta versão pede SEI 4.1 ou mais novo; se o SEI do IFTO for mais antigo, parte das funções pode não aparecer. Anote o que funciona e o que não funciona, comparando com o T01.
- Resultado: \[ \]
- Observação:

## Base da extensão e botão Novo documento (v0.1.0)

Antes destes testes, desative o SEI++ e o SEI Pro, se estiverem instalados (menu ☰ > Extensões e temas), para não aparecerem dois botões.

### T03 – Instalar a extensão (v0.1.0)

- O que fazer: no Firefox, digite `about:debugging#/runtime/this-firefox` na barra de endereço, clique em **Carregar extensão temporária…**, entre na pasta `extensao-ifto` e escolha o arquivo `manifest.json`. Clique no ícone verde da extensão na barra do Firefox (se não aparecer, clique na peça de quebra-cabeça e fixe "Extensão IFTO Palmas").
- O que deve acontecer: a janela mostra "Extensão IFTO Palmas", "Versão 0.1.0" e, em amarelo, "Abra o SEI do IFTO para a extensão reconhecê-lo". O botão **Configurações** abre uma aba com a opção "Botão 'Novo documento' sempre visível" já marcada.
- Resultado: \[ \]
- Observação:

### T04 – SEI reconhecido (v0.1.0)

- O que fazer: entre no SEI do IFTO e abra o Controle de Processos. Depois clique no ícone da extensão.
- O que deve acontecer: a janela mostra, em verde, "SEI <versão> em https://sei.ifto.edu.br (visto em …)". **Anote a versão na Observação** (é a decisão D1 da spec). Se continuar a mensagem amarela, anote o endereço que aparece na barra quando o SEI está aberto (a extensão só age em endereços terminados em ifto.edu.br).
- Resultado: \[ \]
- Observação:

### T05 – Botão "Novo documento" sempre visível (v0.1.0)

- O que fazer: no SEI, abra um processo e clique num **documento** da árvore (à esquerda), onde antes o botão "Incluir documento" não aparecia. Clique no botão. Depois, em Configurações da extensão, desmarque a opção, volte ao SEI, aperte F5 e clique de novo no documento.
- O que deve acontecer: com a opção marcada, o ícone "Incluir documento" aparece no começo da barra de ações e abre a tela de escolher o tipo do documento. Com a opção desmarcada, o SEI fica como era. Se o SEI já mostrava o botão, ele não aparece duas vezes.
- Resultado: \[ \]
- Observação:

## Levantamento: nome e tamanho dos arquivos no SEI (para as etapas 2 e 3)

Use um **processo de teste** no SEI (ou um processo em que possa excluir os documentos depois). Os arquivos estão em `extensao-ifto/ferramentas-de-teste/arquivos-sei/` (fora do git). Pode anexar pela tela normal do SEI ("Incluir documento" > "Externo"). Se o SEI++ 5.1.1 do T01 estiver funcionando, pode arrastar vários de uma vez.

### T06 – Caracteres que o SEI não aceita no nome do arquivo

- O que fazer: anexe, um de cada vez, os 20 arquivos da pasta `caracteres` (de "teste 01-cerquilha-#.pdf" a "teste 20-virgula-,.pdf").
- O que deve acontecer: alguns são recusados ou ficam com o nome mudado. Na Observação, anote o **número** de cada arquivo recusado (e a mensagem do SEI) e o de cada um que entrou com o nome mudado (como ficou). Se não anotar nada de um arquivo, entendo que entrou normal.
- Resultado: \[ \]
- Observação:

### T07 – Limite de tamanho: 10 MB ou 10 MiB

- O que fazer: anexe os três arquivos da pasta `tamanhos`: A (9.900.000 bytes), B (10.200.000 bytes) e C (10.600.000 bytes). São PDFs de uma página que quase não compactam.
- O que deve acontecer: o A entra. Se o B for recusado, o limite é 10 MB; se o B entrar e o C for recusado, é 10 MiB. Anote quais entraram e a mensagem do SEI para o recusado (copie o texto, se puder). Se o SEI mostrar o tamanho máximo em algum lugar da tela, anote também.
- Resultado: \[ \]
- Observação:

## Perguntas para responder (etapas 2 e 3)

Escreva a resposta na linha **Resposta**. Depois do `/testes`, elas entram na spec (`docs/specs/base-e-sei.md`, D11 a D13).

### P1 – Arquivo que não é PDF acima de 10 MB

- Pergunta: que tipos de arquivo, além de PDF, vocês anexam e às vezes passam do limite (planilha, imagem, vídeo, áudio, .zip…)? O que vocês fazem hoje com eles: compactam em .zip, dividem em partes, convertem para PDF? A extensão mostra essa dica.
- Resposta:

### P2 – Dica de compactação abaixo do limite

- Pergunta: para economizar espaço no servidor da Reitoria, a extensão deve sugerir compactar também arquivos **abaixo** de 10 MB? A partir de que tamanho (ex.: 2 MB, 5 MB)? Só sugere (pode enviar mesmo assim) ou pergunta antes de enviar?
- Resposta:

### P3 – Documentos restritos ou sigilosos em sites de compactação

- Pergunta: o pdf24.org e o ilovepdf recebem o arquivo nos servidores deles. A dica de usar esses sites deve aparecer também para documentos **restritos ou sigilosos** (ex.: com dados pessoais), ou, nesses casos, a extensão deve sugerir outra forma (ex.: programa instalado no computador)? Vocês usam Windows ou Linux no setor?
- Resposta:

### P4 – Dicas do pdf24.org

- Pergunta: no pdf24.org, que opção de compressão vocês usam (nível de qualidade, DPI) para os arquivos que o ilovepdf não consegue compactar? Que tipo de PDF costuma dar problema (digitalizado, com muitas imagens, gerado por algum sistema)? A dica mostra o passo a passo.
- Resposta:

## Senha reconhecida pelo navegador no SEI 5 (v0.1.1)

Antes: instale a extensão temporária (como no T03, escolhendo o `manifest.json`) ou, depois da assinatura no GitHub, o arquivo `.xpi` (ver `docs/publicacao.md`). Se a extensão já estava carregada, clique em **Recarregar** em `about:debugging#/runtime/this-firefox`.

### T08 – Senha na tela de entrada do SEI (v0.1.1)

- O que fazer: no Firefox, saia do SEI (ou abra uma janela anônima com a extensão permitida) e abra a tela de entrada do SEI do IFTO. Digite o usuário e a senha e clique em **Acessar**. Se o Firefox perguntar se quer salvar (ou atualizar) a senha, clique em **Salvar**. Saia do SEI e abra a tela de entrada de novo.
- O que deve acontecer: ao digitar, a senha aparece como pontos (●), sem mostrar a última letra. A entrada no SEI funciona normalmente. Na segunda vez, o Firefox preenche a senha sozinho (ou mostra a senha guardada ao clicar no campo Usuário ou Senha).
- Resultado: \[ \]
- Observação:

### T09 – Senha na assinatura de documento (v0.1.1) (Crítico)

- O que fazer: no SEI, abra um documento que você precisa assinar e clique em **Assinar documento**. Na janela de assinatura, clique no campo **Senha**. Se o Firefox mostrar a senha guardada, escolha-a; senão, digite-a, aperte **Enter** e, se o Firefox perguntar, salve a senha. Assine um segundo documento.
- O que deve acontecer: o campo Senha aceita a senha guardada do Firefox (preenchida sozinha ou escolhida na lista ao clicar no campo). Enter e o botão **Assinar** assinam o documento como antes. No segundo documento, não é preciso digitar a senha. Se o Firefox oferecer salvar com o seu nome completo como usuário, anote na Observação.
- Resultado: \[ \]
- Observação:

### T10 – Desligar a correção da senha (v0.1.1)

- O que fazer: clique no ícone da extensão > **Configurações** e desmarque "Navegador reconhece o campo de senha". Recarregue a tela de entrada do SEI e clique no campo Senha. Depois marque a opção de novo.
- O que deve acontecer: desmarcada, a tela volta ao comportamento do SEI novo (o Firefox não oferece a senha). Marcada, volta a oferecer.
- Resultado: \[ \]
- Observação:
