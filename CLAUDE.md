# Extensão de navegador – IFTO Campus Palmas (UG 158336)

Extensão para o **Firefox** (depois também para o Chrome) que acompanha o Sistema de Gestão Orçamentária do campus. Ela melhora o SEI do IFTO e, com o login, lê os dados do sistema na Planilha Google para preencher documentos e capturar dados em outros sites (SEI, SUAP, SIAFI, SICAF, Simples Nacional, Comprasnet). Versão atual em `manifest.json`.

O sistema principal fica em `../sistema-orcamento-ifto` (outro repositório). Lá estão as regras de negócio e a estrutura da planilha: **não copie** esses arquivos para cá; leia lá só o trecho necessário.

## Leitura econômica (importante)

- No início da sessão **não leia** nada de `docs/` nem o `TESTES-PENDENTES.md`. Leia só quando a tarefa pedir, e só a parte necessária (busque pelo título da seção; não abra o arquivo inteiro sem precisar).
- Onde está cada coisa:
  - `docs/arquitetura.md`: mapa dos arquivos da extensão.
  - `docs/regras/`: regras já decididas, **um arquivo por assunto** (lista em `docs/regras/LEIA-ME.md`).
  - `docs/padrao-visual.md`: padrão visual da extensão (janela da extensão, configurações e o que ela acrescenta nas páginas).
  - `docs/referencias/`: anotações sobre outras extensões e sites (ex.: SEI++).
  - `docs/melhorias-futuras.md`: lista curta de ideias (uma linha cada).
  - `docs/specs/`: uma spec por melhoria em andamento (ver "Como trabalhamos").
  - `docs/historico.md`: o que entrou em cada versão.
  - `TESTES-PENDENTES.md` (raiz, no git): testes manuais T01, T02…
  - No sistema principal: `../sistema-orcamento-ifto/docs/planilha.md` (abas e colunas da planilha) e `../sistema-orcamento-ifto/docs/regras/` (regras de negócio, ex.: `solicitacao-empenho.md`).
- Não releia arquivos que já leu na mesma sessão.

## Como trabalhamos (specs pequenas)

1. **Planejar** (comando `/planejar <melhoria>`): entreviste o usuário (perguntas curtas, de preferência com opções), depois crie `docs/specs/<nome>.md` a partir de `docs/specs/_modelo.md`. Divida em etapas pequenas; cada etapa cabe numa conversa.
2. **Decisões a confirmar:** toda escolha que muda regra, tela, dados lidos ou gravados na planilha, ou que seria difícil de desfazer, vai para a seção "Decisões a confirmar" da spec, com `[ ]`. **Não programe** enquanto houver `[ ]` que afete a etapa. Nunca decida sozinho e anote "decisão do Claude, a confirmar": pergunte.
3. **Executar** (comando `/etapa <spec> <n>`): numa conversa nova, leia só a spec e o que ela indicar. Ao terminar: testes, versão, histórico, commit e a etapa marcada como feita na spec.
4. **Fim da melhoria:** as regras decididas passam para `docs/regras/`, a linha sai de `melhorias-futuras.md` e a spec vai para `docs/specs/feitas/`.
- Ajustes pequenos e correções de testes não precisam de spec.
- **Testes manuais** (comando `/testes`): o usuário marca `[x]` (certo) ou `[!]` (falhou, com observação) no `TESTES-PENDENTES.md`. Leia, corrija o que falhou, apague os que deram certo e acrescente os novos (número novo, nunca reaproveitado).

## Quem é o usuário

- Chefe da CGOC (Coordenação de Gestão Orçamentária e Contratos). **Não é da área de TI**: linguagem simples, sem jargão; comandos sempre com o texto exato a digitar e o caminho dos cliques no navegador.
- **Sempre em português** (respostas, textos da extensão, comentários).
- Pergunte quando houver dúvida; informe sugestões. O usuário costuma mandar vários pedidos numa mensagem.
- Mudança grande, difícil de desfazer ou que grave na planilha oficial: proposta + confirmação antes.
- **Formato da resposta** depois de mexer no código: **O que mudou** (curto) / **Arquivos alterados** (só os caminhos) / **O que eu testei** (uma linha) / **Testes** ("**Teste N: título**", com "- O que fazer:" e "- O que deve acontecer:"; detalhados: navegador, site e página, conta logada, o que clicar, o que deve aparecer). Os testes também vão para o `TESTES-PENDENTES.md`.
- Teste não comentado pelo usuário = deu certo.
- **Testes manuais no fim:** numa melhoria com várias etapas, os testes de cada etapa vão para o `TESTES-PENDENTES.md`, mas o usuário testa tudo junto ao final. Só pare antes para teste **crítico** (grava em sistema oficial – SEI, planilha oficial – ou decide o rumo da etapa seguinte); marque-o "(Crítico)".
- **Versão:** a cada alteração de código, suba `version` no `manifest.json`. Número 0.ETAPA.AJUSTE (meio = funcionalidade nova; último = rodada de correções). Uma ou duas linhas em `docs/historico.md`, com a data (dd/mm/aaaa).
- Ideias novas do usuário: uma linha em `docs/melhorias-futuras.md`. Regras novas decididas: no arquivo certo de `docs/regras/`.
- **Git:** faça os commits sozinho, sem esperar pedido: antes de começar cada etapa ou rodada (se houver alterações pendentes) e ao terminar cada etapa ou rodada, com a mensagem "Versão vX.Y.Z: <resumo curto>" (sem versão ainda: "Docs: <resumo>"). Antes de commitar, confira no `git status` que nada de `ferramentas-de-teste/`, chaves ou pacotes `.xpi` entrou. **Nunca faça `git push`**; diga que o commit foi feito e não foi enviado ao GitHub.
- Instrução permanente nova do usuário: proponha acrescentá-la a este arquivo (no lugar certo), em vez de guardá-la só na memória automática.

## Funcionamento (decidido)

- **Com login** (conta Google @ifto.edu.br) a extensão lê a Planilha Google do sistema. **Sem login**, funcionam só as melhorias do SEI.
- **Sem custos:** nada de serviços pagos.
- **SEI do IFTO é antigo:** toda função do SEI deve funcionar na versão em uso no IFTO (ver `docs/regras/sei.md`), não só nas versões novas.
- **Uso por enquanto:** só no navegador do usuário, para testes (instalação temporária). Assinatura da Mozilla "não listada" (grátis, sem aparecer na loja) só quando o usuário pedir.

## Comandos

- A definir na primeira etapa (ferramenta `web-ext` da Mozilla: rodar, conferir e empacotar a extensão). Ao definir, liste aqui o texto exato de cada comando.
- Instalação temporária no Firefox: `about:debugging#/runtime/this-firefox` > **Carregar extensão temporária…** > escolher o `manifest.json` (ou o `.xpi`). Some quando o Firefox fecha.
- `ferramentas-de-teste/` está no `.gitignore`: **nunca vai para o git**; todo arquivo de teste ou de referência local (ex.: pacotes do SEI++) fica lá dentro. Nunca retire linhas do `.gitignore` sem permissão (acrescentar pode, avisando).
- Chaves e senhas (Google, Mozilla) nunca vão para o git: ficam em `.env.local` ou nas configurações do navegador.

## Convenções

- Comentários curtos em português explicando o **porquê**, com a versão quando for regra nova (`// v0.2.0: ...`).
- Textos da extensão em linguagem simples, sem siglas não explicadas.
- Valores com o mesmo formato do sistema ("R$ 1.234,56"); tipos de orçamento **nunca** somados entre si.
- Nunca grave nada num sistema oficial (SEI, planilha, SIAFI…) sem o usuário ver e confirmar antes.
