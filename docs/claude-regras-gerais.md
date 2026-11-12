# Instruções para todos os projetos

**Seções**: Leitura econômica (tokens) · Organização do projeto e da documentação · Como trabalhamos (specs pequenas) · Mensagens no chat (curtas) · Testes · Versão e git · Melhorias que servem a vários projetos · Mesmas regras em todos os computadores

Atualizado em 12/11/2026. Modelo: `/home/berg/Desktop/Sistema Gestão Orçamentária/sistema-orcamento-ifto` (CLAUDE.md, docs/, .claude/). Projeto novo ou sem essa organização: proponha aplicá-la. O usuário não é da área de TI: **sempre em português**, linguagem simples, comandos com o texto exato a digitar e o caminho dos cliques.

## Leitura econômica (tokens)

- No início **não leia** `docs/` nem `TESTES-PENDENTES.md`. Leia só o que a tarefa pedir, só a parte necessária; não releia o que já leu na sessão.
- Arquivos com várias seções têm na 3ª linha o índice "**Seções**": leia as 5 primeiras linhas e busque o título. Histórico: busque a versão. Testes: busque `### Tnn` ou a marca; nunca o arquivo inteiro. Para retomar o trabalho: só a seção "Situação" de `docs/melhorias-futuras.md`.
- Arquivos grandes de referência (páginas salvas, planilhas): busque o trecho com `grep`, não leia inteiros.

## Organização do projeto e da documentação

- `CLAUDE.md` curto, com seções: Leitura econômica · Documentação · Como trabalhamos · Quem é o usuário · Resposta depois de mexer no código · Testes · Versão e git · Comandos · Convenções.
- `docs/`: `arquitetura.md` (mapa dos arquivos) · `regras/` (um arquivo por assunto + `LEIA-ME.md`) · `padrao-visual.md` · `melhorias-futuras.md` (seção "Situação" no topo: feito, em andamento, pendente do usuário, planejado **[spec]**, não planejado; depois as ideias, uma linha cada) · `specs/` (`_modelo.md`, uma spec por melhoria; concluídas em `specs/feitas/`) · `historico.md` (uma ou duas linhas por versão, com data) · `referencias/`. Na raiz: `TESTES-PENDENTES.md`.
- Todos os `.md` no git (fora só os locais ou desnecessários), para outra pessoa ou outra máquina continuar. Ao mudar código ou regra, atualize no mesmo commit o `.md` certo e a "Situação". Não crie arquivo que repita o que já está em outro (aponte para ele).
- Um assunto por arquivo; títulos `##` que sirvam de busca; índice "**Seções**" na 3ª linha (atualize ao criar ou renomear seção); textos curtos.
- `ferramentas-de-teste/` no `.gitignore` (arquivos de teste e de referência locais); chaves e senhas nunca no git (`.env.local`, segredos do GitHub). Nunca retire linhas do `.gitignore` sem permissão.
- `.claude/commands/`: `/planejar`, `/etapa`, `/testes`. `.claude/settings.json`: libera os comandos de verificação e `git status/diff/log`; bloqueia ler `.env.local`.
- GitHub Actions: confere o projeto a cada envio; versão do sistema operacional fixa (ex.: `ubuntu-24.04`), `timeout-minutes`, passos com nomes em português.

## Como trabalhamos (specs pequenas)

1. **Planejar** (`/planejar`): entreviste o usuário e crie a spec com etapas pequenas (cada uma cabe numa conversa).
2. **Decisões:** escolha que muda regra, tela, dados ou é difícil de desfazer vai para "Decisões a confirmar" com `[ ]`; não programe com `[ ]` que afete a etapa; nunca decida sozinho. Toda dúvida é perguntada **no chat assim que aparece**, pela **janela de escolha** (até 4 perguntas, sugestão em 1º lugar, cada pergunta se explica sozinha); a resposta vai para a spec.
3. **Executar** (`/etapa`): leia só a spec e o que ela indicar; ao terminar, testes, versão, histórico, Situação, commit, etapa marcada.
4. **Fim da melhoria:** regras para `docs/regras/`, linha sai de `melhorias-futuras.md`, spec para `specs/feitas/`. Ajustes pequenos não precisam de spec.
- Ideias novas: uma linha em `melhorias-futuras.md`. Instrução permanente nova: proponha pô-la no `CLAUDE.md` do projeto.
- **Quando o usuário sair** e pedir para continuar: faça o que já está decidido, planeje o resto e traga as perguntas em blocos no fim, com sugestão.

## Mensagens no chat (curtas)

- Depois de mexer no código: **O que mudou** (curto) · **O que eu testei** (uma linha) · **Testes**: só número e título, um por linha (passo a passo só no `TESTES-PENDENTES.md`; teste **crítico** vai completo). Não liste os arquivos alterados. Diga os commits feitos e que não foram enviados ao GitHub.
- **Conversa longa:** quando a conversa estiver grande (várias rodadas ou etapas, muitos arquivos lidos, ou depois de o contexto ser resumido automaticamente), termine com: "⚠️ A conversa está grande: recomendo começar uma nova. Digite `/clear` (tudo já está no git e nos arquivos de docs)." Antes, deixe tudo commitado e anotado.

## Testes

- `TESTES-PENDENTES.md`: "### Tnn – título (vX.Y.Z)", "- O que fazer:", "- O que deve acontecer:" (detalhados), "- Resultado: \[ \]", "- Observação:". O usuário marca `[x]` ou `[!]`; `/testes` acha as marcas com `grep`, apaga os `[x]` por script (conferindo a quantidade), corrige os `[!]`.
- Teste não comentado = deu certo. Nunca apague teste sem `[x]`; só acrescente no fim; número novo, nunca reaproveitado.
- Várias etapas: o usuário testa tudo junto no fim; só pare antes por teste **crítico** (grava em sistema oficial ou decide o rumo), marcado "(Crítico)". Testes automáticos em toda etapa.
- **Cartões no GitHub:** os testes manuais também viram cartões (issues): uma Action cria um cartão por teste novo do `TESTES-PENDENTES.md`, com as caixinhas "✅ Passou" e "❌ Falhou" (comentário para observações), e fecha os cartões dos testes que saem do arquivo; o `/testes` lê os cartões por um script de resumo. Modelo: `extensao-ifto` (`.github/workflows/testes.yml` e `.github/scripts/`). Em projeto existente, monte só quando o usuário pedir.
- **Nunca faça testes com captura de tela** sem pedido expresso.

## Versão e git

- A cada alteração de código: suba a versão (0.ETAPA.AJUSTE) e registre no `historico.md` com a data (dd/mm/aaaa).
- Commits sem esperar pedido (antes e ao fim de cada etapa ou rodada), no formato **"vX.Y.Z: tipo: resumo curto"** (sem versão: "docs: resumo"). Tipos: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `ci`. Confira no `git status` que nada de teste, chave ou pacote entrou.
- **Nunca faça `git push`** sem pedido.

## Melhorias que servem a vários projetos

- Toda melhoria (regra, organização, economia de tokens, forma de trabalhar) que possa valer para mais de um projeto: **pergunte antes** (janela de escolha, mostrando o texto) e, com o "sim", grave na memória local e neste arquivo.

## Mesmas regras em todos os computadores

- Este arquivo (`~/.claude/CLAUDE.md`) é a memória geral, que vale para todos os projetos do computador. A memória de cada projeto (`~/.claude/projects/…/memory/`) fica só com o que for daquele projeto.
- Cópia no git: `docs/claude-regras-gerais.md` em cada repositório do usuário (hoje: extensao-ifto e sistema-orcamento-ifto). No início da sessão, rode `diff -q ~/.claude/CLAUDE.md docs/claude-regras-gerais.md` (não leia os arquivos). Se forem diferentes ou o local não existir, compare só a linha "Atualizado em" e as diferenças (`diff`) e pergunte ao usuário (janela de escolha) qual vale: o do repositório (copiar para o computador), o do computador (copiar para o repositório e fazer commit) ou juntar os dois.
- Ao mudar este arquivo: atualize a data em "Atualizado em", copie para `docs/claude-regras-gerais.md` e faça o commit ("docs: regras gerais do Claude").
