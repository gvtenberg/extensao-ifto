Atualizei os testes. $ARGUMENTS

1. Leia os cartões do GitHub: `node .github/scripts/ler-resultados.js` (mostra só os marcados ou comentados). **Não leia o `TESTES-PENDENTES.md` inteiro**; se precisar do texto de um teste, busque `### T12` e leia só o bloco.
2. "passou": apague do arquivo com `node .github/scripts/apagar-testes.js T03 T05` (o script confere a quantidade). Comentário com sugestão nova vai para `docs/melhorias-futuras.md`.
3. "falhou": leia os comentários, só o código e as regras necessários e corrija. Se o comentário pedir mudança de regra ou de tela que não seja só correção, me pergunte antes (janela de escolha). Teste de levantamento: registre o resultado em `docs/regras/` ou `docs/referencias/`.
4. Pergunta (P..) respondida: grave a resposta na spec e apague o bloco com o script.
5. Se houve correção: suba o último número da versão no `manifest.json`, registre em `docs/historico.md`, atualize a seção "Situação" de `docs/melhorias-futuras.md`, apague os testes corrigidos e acrescente os novos no fim do arquivo, no formato compacto do CLAUDE.md (número novo; o último aparece com `grep -o '### [TP][0-9]*' TESTES-PENDENTES.md | tail -1`).
6. Faça o commit ("vX.Y.Z: tipo: resumo", ex.: "v0.1.4: fix: …"; sem push) e responda no formato do CLAUDE.md. Lembre que os cartões novos e o fechamento dos resolvidos só acontecem depois do `git push`.
