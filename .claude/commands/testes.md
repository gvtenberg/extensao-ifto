Atualizei os testes. $ARGUMENTS

1. **Não leia o `TESTES-PENDENTES.md` inteiro.** Ache só os testes marcados com `grep -nE 'Resultado: \\\[(x|!)' TESTES-PENDENTES.md` (as marcas ficam escritas como `\[x\]` e `\[!\]`) e leia só o bloco de cada teste marcado (do `### T…` até o próximo `###`).
2. Apague os testes marcados com `[x]` (por script, bloco a bloco, conferindo antes e depois a quantidade de testes). Seção que ficar vazia sai também (e do índice "**Seções**").
3. Para cada teste com `[!]`: leia a observação, leia só o código e as regras necessários e corrija. Se a observação pedir mudança de regra ou de tela que não seja só correção, me pergunte antes (janela de escolha). Se o teste era de levantamento (ex.: o que funciona no SEI do IFTO), registre o resultado no arquivo certo de `docs/regras/` ou `docs/referencias/`.
4. Se houve correção: suba o último número da versão no `manifest.json`, registre em `docs/historico.md`, atualize a seção "Situação" de `docs/melhorias-futuras.md` e acrescente os testes novos no fim do `TESTES-PENDENTES.md` (número novo, nunca reaproveitado; para achar o último, busque `### T` no fim do arquivo), apagando os `[!]` já corrigidos.
5. Faça o commit ("vX.Y.Z: tipo: resumo", ex.: "v0.1.4: fix: …"; sem push) e responda no formato do CLAUDE.md.
