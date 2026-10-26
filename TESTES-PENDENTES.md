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
