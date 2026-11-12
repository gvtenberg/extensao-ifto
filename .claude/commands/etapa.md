Execute a(s) etapa(s) indicada(s): $ARGUMENTS (nome da spec em `docs/specs/` e número da etapa; pode ser um intervalo, ex.: `sei-melhorias 1-2`).

1. Leia a spec. Se alguma decisão em "Decisões a confirmar" que afete estas etapas ainda estiver com `[ ]`, **pare** e me pergunte; não decida sozinho.
2. Se houver alterações pendentes no git, faça o commit antes de começar ("Versão vX.Y.Z: resumo").
3. Leia só os arquivos de código e de `docs/regras/` que a etapa precisa (e, se usar dados do sistema, só o trecho necessário de `../sistema-orcamento-ifto/docs/`).
4. Programe a etapa. Crie os testes automáticos de regra quando houver regra nova. Rode os comandos de conferência da seção "Comandos" do CLAUDE.md.
5. Suba a versão no `manifest.json`, registre em `docs/historico.md` (com a data de hoje), marque a etapa como feita na spec, atualize a seção "Situação" de `docs/melhorias-futuras.md` e acrescente os testes manuais no `TESTES-PENDENTES.md`. Faça o commit da etapa (sem push).
6. Se pedi um intervalo, siga para a próxima etapa sem me pedir testes; só pare antes do fim por teste crítico ou dúvida que só eu resolvo.
7. Se for a última etapa da spec: passe as regras da spec para `docs/regras/`, tire a linha de `docs/melhorias-futuras.md`, mova a spec para `docs/specs/feitas/` e faça o commit.
8. Responda no formato curto do CLAUDE.md (testes só com número e título, separados por etapa).
