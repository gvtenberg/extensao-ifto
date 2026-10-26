# Testes pendentes

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
