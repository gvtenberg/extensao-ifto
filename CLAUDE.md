# Extensão de navegador – IFTO Campus Palmas (UG 158336)

Extensão para o **Firefox** (depois também para o Chrome) que acompanha o Sistema de Gestão Orçamentária do campus: melhora o SEI do IFTO e, com o login, lê os dados do sistema na Planilha Google para preencher documentos e capturar dados em outros sites (SEI, SUAP, SIAFI, SICAF, Simples Nacional, Comprasnet). Versão em `manifest.json`. O sistema principal fica em `../sistema-orcamento-ifto` (outro repositório): regras de negócio e planilha ficam lá; **não copie**, leia só o trecho necessário.

## Leitura econômica

- **Primeiro comando da sessão:** `diff -q ~/.claude/CLAUDE.md docs/claude-regras-gerais.md` (regras gerais do usuário, iguais em todos os computadores). Se forem diferentes ou o arquivo do computador não existir, siga a seção "Mesmas regras em todos os computadores" de `docs/claude-regras-gerais.md`.
- No início **não leia** `docs/` nem `TESTES-PENDENTES.md`. Leia só o que a tarefa pedir, só a parte necessária, e não releia o que já leu na sessão.
- Arquivos com várias seções têm na 3ª linha o índice "**Seções**": leia as 5 primeiras linhas e busque o título da seção. `docs/historico.md`: busque a versão (`v0.1.3`). `TESTES-PENDENTES.md`: `### T12` ou a marca (ver `/testes`); nunca o arquivo inteiro. Para retomar o trabalho: só a seção "Situação" de `docs/melhorias-futuras.md`.
- Onde está cada coisa: `docs/arquitetura.md` (mapa dos arquivos) · `docs/regras/` (regras decididas, um arquivo por assunto; lista em `LEIA-ME.md`) · `docs/padrao-visual.md` (janela, configurações e o que a extensão põe nas páginas) · `docs/referencias/` (outras extensões e sites, ex.: SEI++) · `docs/melhorias-futuras.md` (Situação: feito, em andamento, pendente; e as ideias, uma linha cada) · `docs/specs/` (uma spec por melhoria em andamento; feitas em `feitas/`) · `docs/historico.md` (o que entrou em cada versão) · `docs/claude-regras-gerais.md` (cópia das regras gerais do Claude, `~/.claude/CLAUDE.md`) · `docs/publicacao.md` (assinatura na Mozilla pelo GitHub e instalação) · `TESTES-PENDENTES.md` (raiz: testes manuais T01, T02…). No sistema principal: `docs/planilha.md` (abas e colunas) e `docs/regras/`.

## Documentação (para outra pessoa ou outra máquina continuar)

- Todos os `.md` vão para o git (menos o que estiver em `ferramentas-de-teste/`). Ao mudar código ou regra, atualize no mesmo commit o `.md` certo (arquitetura, regras, histórico, testes, spec, Situação).
- Feito: `docs/historico.md` e `docs/specs/feitas/`. Pendente: seção "Situação" de `docs/melhorias-futuras.md` (atualize ao fim de cada etapa ou rodada), `docs/specs/` e `TESTES-PENDENTES.md`. Não crie outro arquivo que repita isso.
- Um assunto por arquivo; títulos `##` que sirvam de busca; índice "**Seções**" na 3ª linha quando houver várias seções (atualize ao criar ou renomear seção); textos curtos, sem repetir o que está em outro arquivo (aponte para ele).

## Como trabalhamos (specs pequenas)

1. **Planejar** (`/planejar <melhoria>`): entreviste o usuário e crie `docs/specs/<nome>.md` a partir de `_modelo.md`, com etapas pequenas (cada uma cabe numa conversa).
2. **Decisões:** escolha que muda regra, tela, dados lidos ou gravados (planilha, SEI) ou difícil de desfazer vai para "Decisões a confirmar" com `[ ]`; **não programe** com `[ ]` que afete a etapa e nunca decida sozinho.
   - Toda dúvida é perguntada **no chat assim que aparece** (nunca fica só na spec nem espera a etapa em que será usada); a resposta vai para a spec.
   - Com alternativas, pergunte pela **janela de escolha** (até 4 perguntas por vez; a sugestão em 1º lugar; cada pergunta se explica sozinha). Texto só quando não houver opções.
3. **Executar** (`/etapa <spec> <n>`): leia só a spec e o que ela indicar. Ao terminar: testes, versão, histórico, Situação, commit e etapa marcada.
4. **Fim da melhoria:** regras para `docs/regras/`, linha sai de `melhorias-futuras.md`, spec para `docs/specs/feitas/`.
- Ajustes pequenos e correções de testes não precisam de spec.
- **Testes manuais** (`/testes`): o usuário marca `[x]` (certo) ou `[!]` (falhou, com observação). Corrija os `[!]`, apague os `[x]` e acrescente os novos (número novo, nunca reaproveitado).

## Quem é o usuário

- Chefe da CGOC (Coordenação de Gestão Orçamentária e Contratos), **não é da área de TI**: linguagem simples, sem jargão; comandos com o texto exato a digitar e o caminho dos cliques no navegador. **Sempre em português** (respostas, textos da extensão, comentários).
- Pergunte quando houver dúvida e dê sugestões. Costuma mandar vários pedidos numa mensagem.
- Mudança grande, difícil de desfazer ou que grave em sistema oficial (SEI, planilha): proposta + confirmação antes.
- Instrução permanente nova: proponha acrescentá-la aqui (no lugar certo), não só na memória automática.
- Ideias novas: uma linha em `docs/melhorias-futuras.md`. Regras novas: no arquivo certo de `docs/regras/`.
- README.md: só apresentação e licença; o manual de uso irá para lá quando a extensão for distribuída aos colegas.
- **Quando o usuário sair** e pedir para continuar: faça o que já está decidido (specs sem `[ ]`), planeje o resto e traga as perguntas em blocos no fim, com sugestão.

## Resposta depois de mexer no código

- **O que mudou** (curto) · **O que eu testei** (uma linha) · **Testes**: só número e título, um por linha ("T11 – Instalar pelo GitHub"); o passo a passo fica só no `TESTES-PENDENTES.md`. Teste **crítico** vai completo na resposta.
- Não liste os arquivos alterados. Diga os commits feitos (e que não foram enviados ao GitHub).
- **Conversa longa:** quando a conversa estiver grande (várias rodadas ou etapas, muitos arquivos lidos, ou depois de o contexto ser resumido automaticamente), termine a resposta com o aviso: "⚠️ A conversa está grande: recomendo começar uma nova. Digite `/clear` (tudo já está no git e nos arquivos de docs)." Antes do aviso, deixe tudo commitado e anotado (spec, Situação, testes, melhorias).

## Testes

- No `TESTES-PENDENTES.md`, cada teste: "### Tnn – título (vX.Y.Z)", "- O que fazer:" e "- O que deve acontecer:" detalhados (navegador, site e página, conta logada, o que clicar, o que deve aparecer), "- Resultado: \[ \]" e "- Observação:".
- **Cartões no GitHub** (`.github/workflows/testes.yml`): a cada envio, cada teste ou pergunta nova vira um cartão (issue, marca "teste") com as caixinhas "✅ Passou" e "❌ Falhou"; o usuário clica e comenta no computador do trabalho. Os cartões dos testes que saem do arquivo fecham sozinhos. O `/testes` lê os cartões com `node .github/scripts/ler-resultados.js` (resumo curto; não abra os cartões um a um). O arquivo continua sendo a base.
- Teste não comentado pelo usuário = deu certo. Nunca apague teste sem `[x]` (no arquivo) ou "Passou" (no cartão). Só acrescente no fim e confira que a quantidade não diminuiu. Atualize o índice "**Seções**" ao criar seção.
- Melhoria com várias etapas: os testes de cada etapa entram no arquivo, mas o usuário testa tudo junto no fim. Só pare antes por teste **crítico** (grava em sistema oficial – SEI, planilha – ou decide o rumo da etapa seguinte), marcado "(Crítico)". Os testes automáticos rodam em toda etapa.
- Verificação mínima: `npm test` e `npm run conferir`. **Nunca faça testes com captura de tela** (nem abra o navegador para ver a tela) sem pedido expresso do usuário.

## Versão e git

- A cada alteração de código: suba `version` no `manifest.json` (0.ETAPA.AJUSTE: meio = funcionalidade nova; último = correções) e uma ou duas linhas em `docs/historico.md` com a data (dd/mm/aaaa). Cada versão enviada ao GitHub é assinada uma única vez pela Mozilla.
- Faça os commits sem esperar pedido: antes de cada etapa ou rodada (se houver alterações pendentes) e ao terminar, no formato **"vX.Y.Z: tipo: resumo curto"** (ex.: "v0.1.3: feat: procurar atualização na janela"; sem mudança de versão: "docs: resumo"). Tipos: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `ci`. Confira no `git status` que nada de `ferramentas-de-teste/`, chaves ou `.xpi` entrou.
- **Nunca faça `git push`** sem pedido: o envio dispara a assinatura na Mozilla (e o GitHub Actions tem limite de uso). Diga que o commit não foi enviado.

## Comandos

- `npm test` (regras em `testes/*.test.js`, executor do Node; crie teste para cada regra nova em `comum/`) · `npm run conferir` (conferência da Mozilla, `web-ext lint --self-hosted`; no fim de cada etapa) · `npm run empacotar` (pacote em `web-ext-artifacts/`, fora do git) · `npm run rodar` (Firefox de teste, perfil limpo sem as senhas; para o SEI, prefira a instalação temporária).
- Instalação temporária: `about:debugging#/runtime/this-firefox` > **Carregar extensão temporária…** > `manifest.json` da pasta `extensao-ifto`. Some quando o Firefox fecha; depois de mudar o código, **Recarregar** ali.
- GitHub (`.github/workflows/assinar.yml`): a cada envio confere (`npm test`, `npm run conferir`); se a versão do `manifest.json` é nova, assina na Mozilla (não listada) e publica o `.xpi` e o `updates.json` em Releases. Passo a passo em `docs/publicacao.md`.
- `ferramentas-de-teste/` está no `.gitignore`: **nunca vai para o git**; todo arquivo de teste ou de referência local (páginas salvas do SEI, pacotes do SEI++) fica lá. Nunca retire linhas do `.gitignore` sem permissão (acrescentar pode, avisando).
- Chaves e senhas (Google, Mozilla) nunca vão para o git: ficam em `.env.local`, nos segredos do GitHub ou nas configurações do navegador.

## Funcionamento (decidido)

- **Com login** (conta Google @ifto.edu.br) a extensão lê a Planilha Google do sistema. **Sem login**, só as melhorias do SEI. **Sem custos:** nada de serviços pagos.
- **SEI do IFTO:** toda função tem que funcionar na versão em uso no IFTO (hoje o SEI 5.0.4; ver `docs/regras/sei.md`).
- **Instalação:** assinada pela Mozilla como "não listada" (grátis, fora da loja), pelo GitHub; repositório público, atualização automática e botão "Procurar atualização" na janela do ícone.

## Convenções

- JavaScript simples, sem compilação, Manifest V3. Regras puras (sem página) em `comum/`, funcionando no navegador e no Node (`module.exports` ou `globalThis.ExtensaoIFTO`); o que mexe na página em `sites/<site>/`.
- Comentários curtos em português explicando o **porquê**, com a versão quando for regra nova (`// v0.2.0: ...`).
- Textos da extensão em linguagem simples, sem siglas não explicadas.
- Valores com o mesmo formato do sistema ("R$ 1.234,56"); tipos de orçamento **nunca** somados entre si.
- Nunca grave nada num sistema oficial (SEI, planilha, SIAFI…) sem o usuário ver e confirmar antes.
