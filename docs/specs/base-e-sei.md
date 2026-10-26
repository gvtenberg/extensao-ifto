# Base da extensão e melhorias do SEI

- **Situação:** aguardando decisões (conversa de 25/10/2026)
- **Pedido em:** 25/10/2026 · **Prazo ou prioridade:** primeira melhoria da extensão; começar já
- **Versão prevista:** 0.1.0 (uma versão por etapa: 0.1, 0.2…)

## 1. Objetivo (para quê)

Voltar a ter no SEI do IFTO as funções do SEI++ que a CGOC usava (o SEI++ parou de funcionar) e ir além: documento externo já preenchido, arquivos arrastados com o tipo de documento reconhecido e **roteiros** com os documentos que cada tipo de processo precisa (ex.: pagamento, reforço de empenho). Dá certo quando a CGOC montar um processo de pagamento ou de reforço sem preencher à mão os campos do documento externo e sem esquecer documento.

## 2. Fora do escopo

- Login Google e leitura da planilha do sistema (próxima spec).
- Passos do roteiro preenchidos com dados (folha de encaminhamento com os dados da nota e os números SEI; solicitação de nota de empenho com os dados do sistema): dependem do login; outra spec.
- Outros sites (Comprasnet, Contratos.gov, SIAFI, SUAP, SICAF, Simples Nacional).
- Chrome e assinatura da Mozilla.

## 3. Decisões a confirmar

O Claude não programa enquanto houver `[ ]` que afete a etapa. O usuário marca `[x]` e escreve a resposta, ou risca a pergunta.

- [ ] D1 – Qual é a versão do SEI do IFTO (rodapé ou tela de login)? Afeta as etapas 2 em diante (os nomes dos campos mudam entre versões).
  - Resposta:
- [ ] D2 – Além das funções desta spec, que outras funções do SEI++ eram úteis (T01 e T02)? Entram numa etapa extra no fim.
  - Resposta:
- [ ] D3 – Licença: aproveitar o código do SEI++ (GPL-3.0) e do SEI Pro (AGPL-3.0) faz a extensão ser GPL-3.0 (o código fica aberto se um dia for distribuída). Pode ser assim? Afeta a etapa 1.
  - Resposta:
- [ ] D4 – Como o código é escrito. Sugestão do Claude: JavaScript simples, sem compilação (como o SEI++; dá para aproveitar o código quase como está), no formato novo de extensão (Manifest V3, o mesmo que o Chrome exige), para Firefox 128 ou mais novo. Afeta a etapa 1.
  - Resposta:
- [ ] D5 – Onde ficam as configurações, os tipos de processo, os roteiros e a marcação de cada processo. Sugestão do Claude: no próprio navegador (funciona sem login), com "Exportar" e "Importar" num arquivo, para cópia de segurança e para passar a colegas; na planilha só depois do login (outra spec). Afeta a etapa 1.
  - Resposta:
- [ ] D6 – Data do documento externo ao arrastar: a de hoje (SEI++) ou a data em que o arquivo foi modificado (SEI Pro)? Sugestão do Claude: a de hoje como padrão, com opção nas configurações. Afeta a etapa 3.
  - Resposta:
- [ ] D7 – Que "outros campos" do documento externo vêm preenchidos? Opções no SEI: número/nome na árvore, remetente, interessados, descrição, observações. Afeta a etapa 2.
  - Resposta:
- [ ] D8 – Como a extensão sabe que um passo do roteiro já foi feito? Sugestão do Claude: há na árvore do processo um documento com o tipo do passo (ex.: um "SICAF" depois da última nota fiscal). Nos processos de pagamento, que recebem várias notas, cada nota nova recomeça o roteiro? Afeta a etapa 4.
  - Resposta:

## 4. Regras decididas

Decidido na conversa de 25/10/2026:

- **Base:** o código do SEI++ (commit c53f1367 e versão 5.1.1, ver `docs/referencias/seipp.md`); o SEI Pro (https://github.com/SEI-Pro/sei-pro) como referência de melhorias e de outro jeito de fazer as mesmas coisas.
- **Botão "Novo documento" sempre visível** na barra de ações da árvore do processo (como o SEI++).
- **Documento externo preenchido:** na tela de documento externo, a extensão preenche data de hoje, nível de acesso (padrão: público; restrito/sigiloso com a hipótese legal), formato (nato-digital, ou digitalizado com o tipo de conferência) e **tipo de documento**, com os valores padrão escolhidos pelo usuário nas configurações. Mostra o aviso "valores preenchidos pela extensão: confira". **Nunca clica em Salvar.**
- **Arrastar arquivos para o processo** (cria um documento externo por arquivo, como o SEI++ e o SEI Pro). O tipo de documento de cada arquivo vem, nesta ordem:
  1. do **próximo passo pendente do roteiro** do processo (quando o processo tem roteiro);
  2. do **nome do arquivo**: começa com o nome de um tipo do SEI (ex.: "Nota Fiscal 123.pdf" → tipo Nota Fiscal, nome "123") ou casa com uma regra do usuário (ex.: "contém SICAF → Certidão");
  3. do **tipo padrão** das configurações;
  4. sem nada disso, a extensão **pergunta**.
- **Conferência antes de enviar:** como o envio grava direto no SEI, a extensão mostra a lista dos arquivos com o tipo e o nome de cada um, para corrigir ou tirar algum, e só envia depois da confirmação.
- **Tipos de processo e roteiros:** os tipos de processo são **cadastrados na extensão** (não se usa o tipo do SEI, porque muitos processos foram cadastrados com o tipo errado). Cada tipo tem um roteiro: a lista de passos, cada um com o tipo de documento do SEI e se é externo (arquivo) ou feito no SEI. Em cada processo, o usuário escolhe o tipo de processo da extensão; a escolha fica guardada pelo número do processo.
- **Lista de conferência:** no processo com roteiro, a extensão mostra os passos feitos e os que faltam. Passo que demora (ex.: PDF do empenho, depois das assinaturas) fica pendente até ser anexado.
- **Roteiros de exemplo** (o usuário ajusta):
  - **Pagamento (CGOC):** nota fiscal e ateste da nota (chegam ao setor); SICAF; consulta de optante do Simples Nacional; anexo do instrumento de cobrança do Contratos.gov; folha de encaminhamento com os dados da nota e dos documentos SEI.
  - **Reforço de empenho:** crédito disponível do SIAFI (externo); solicitação de nota de empenho (dados do sistema de orçamento, depois do login); PDF do empenho (depois das assinaturas, dias depois).

## 5. O que muda

- **Sites e páginas:** só o SEI do IFTO: árvore do processo (botão Novo documento, arrastar arquivos, lista de conferência), tela do documento externo (`acao=documento_receber`).
- **Dados lidos ou gravados:** só o SEI (documentos externos, depois da confirmação) e o próprio navegador (configurações e roteiros, D5).
- **Telas da extensão:** página de configurações (valores padrão do documento externo, regras pelo nome do arquivo, tipos de processo e roteiros, exportar/importar); janela do ícone com o tipo de processo do processo aberto.
- **Arquivos de código prováveis:** `manifest.json`, `sites/sei/` (uma parte por página do SEI), `configuracoes/`, `janela/`, `comum/` (regras do tipo pelo nome e do próximo passo, com testes automáticos).

## 6. Etapas

Cada etapa cabe numa conversa curta (`/etapa base-e-sei <n>`) e termina com testes, versão e commit.

- [ ] Etapa 1 – **Esqueleto e botão Novo documento.** Extensão instalável (manifest, ícone, janela do ícone, página de configurações vazia), comandos do `web-ext` no CLAUDE.md, reconhecimento do SEI e da sua versão, botão "Novo documento" sempre visível. Depende de D3, D4, D5. Teste: instalação temporária; abrir um processo no SEI e ver o botão.
- [ ] Etapa 2 – **Documento externo preenchido.** Configurações com os valores padrão (nível de acesso, hipótese legal, formato, tipo de conferência, tipo de documento e os campos de D7); preenchimento e aviso na tela. Depende de D1, D7. Teste: abrir "Incluir documento › Externo" e ver os campos preenchidos, sem salvar.
- [ ] Etapa 3 – **Arrastar arquivos.** Área para soltar arquivos na árvore; tipo pelo nome do arquivo, pelas regras do usuário e pelo padrão; pergunta quando não reconhece; lista de conferência antes de enviar; nomes com acento e travessão corretos. Depende de D1, D6. Teste (crítico, grava no SEI): arrastar três arquivos para um processo de teste.
- [ ] Etapa 4 – **Tipos de processo e roteiros.** Cadastro dos tipos e dos passos; escolher o tipo do processo aberto; lista de conferência dos passos; o arrastar sugere o tipo do próximo passo pendente. Depende de D8. Teste: cadastrar o roteiro de pagamento, marcar um processo e ver o que falta.
- [ ] Etapa 5 – **Exportar e importar** configurações e roteiros num arquivo. Teste: exportar, apagar, importar.
- [ ] Etapa 6 – (se D2) outras funções do SEI++.

**Depois desta spec:** login e leitura da planilha; passos do roteiro com dados (folha de encaminhamento, solicitação de nota de empenho).

## 7. Testes manuais

Os testes de cada etapa vão para o `TESTES-PENDENTES.md` (números T…). Antes: T01 e T02 (levantamento das funções do SEI++ no SEI do IFTO). Teste crítico: o primeiro envio de arquivos arrastados (etapa 3).
