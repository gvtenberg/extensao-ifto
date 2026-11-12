# Melhorias futuras e situação do projeto

**Seções**: Situação (feito, em andamento, pendente) · Ideias (Ordem sugerida · Outros sites · Distribuição)

## Situação (feito, em andamento, pendente)

Resumo para retomar o trabalho (em outra máquina ou por outra pessoa) sem ler tudo. Atualize ao fim de cada etapa ou rodada.

- **Feito:** cada versão em `historico.md` (última: v0.4.0, 12/11/2026); specs concluídas em `specs/feitas/` (lista de assinaturas no SEI, v0.2.0 a v0.4.0; regras em `regras/lista-assinaturas.md`).
- **Em andamento:** `specs/base-e-sei.md`: etapa 1 feita (v0.1.0); próxima, a etapa 2, aguarda as decisões D7 e D9 a D13 (perguntas P1 a P4 e levantamentos T06 e T07 no `TESTES-PENDENTES.md`).
- **Ajustes fora de spec:** v0.1.1, senha reconhecida pelo navegador no SEI 5; v0.1.2, atualização automática pelo GitHub; v0.1.3, botão "Procurar atualização" e organização igual à do sistema principal.
- **Pendente do usuário:** testes T01 a T20 (T20 crítico: assinar pelo painel) e perguntas P1 a P4 (também como cartões no GitHub, depois do primeiro `git push`) (o SEI virou SEI 5 em 11/2026: refazer T03 a T05); chaves da Mozilla para a assinatura no GitHub (`publicacao.md`).
- **Planejado (com spec):** linhas com **[spec]** abaixo. **Não planejado:** as demais linhas (ideias).

## Ideias

Uma linha por ideia. Quando uma ideia for planejada, ela ganha uma spec em `docs/specs/` e a linha passa a apontar para ela. Ao terminar, a linha sai daqui e vai para `docs/historico.md`.

Marcas: **[spec]** já tem spec.

### Ordem sugerida (a confirmar com o usuário)

1. Base da extensão e melhorias do SEI (no lugar do SEI++, que parou no SEI do IFTO): botão Novo documento, documento externo preenchido, arrastar arquivos com o tipo reconhecido, roteiros por tipo de processo **[spec]** → `specs/base-e-sei.md`
   - Adicionar arquivos direto num processo do SEI 5 (12/11/2026): já é a etapa 3 da spec ("Arrastar arquivos"). Um colega do IFTO conseguiu fazer isso na extensão dele, no SEI 5: pedir a ele o nome ou o endereço da extensão e anotar em `referencias/` antes da etapa 3.
   - Depois: **compressão automática de PDF** na própria extensão (26/10/2026): compactar, comparar os tamanhos, informar quanto se economiza no servidor de arquivos da Reitoria e mostrar lado a lado o PDF original e o compactado, para o usuário ver a diferença de qualidade e escolher um deles. Obrigatória acima de 10 MB. De preferência sem mandar o arquivo para sites de fora (D13 da spec).
   - **Perfis padronizados por unidade do SEI** (12/11/2026): Direção-geral, Contratos, Licitação etc., cada um com as suas funções ligadas por padrão, reconhecido pela unidade aberta no SEI (`#lnkInfraUnidade`). A primeira função de perfil é a lista de assinaturas (Direção-geral).
2. Login Google e leitura da planilha do sistema (sem login, só as melhorias do SEI).
3. Solicitação de nota de empenho no SEI: preencher o documento com o texto que o sistema já monta (v0.43.0 do sistema; regras em `../sistema-orcamento-ifto/docs/regras/solicitacao-empenho.md`). Depende do teste T40 do sistema ("Colar no SEI").
4. Lançamento das notas/faturas pagas por demanda (alimenta o liquidado por demanda e, depois, o módulo financeiro do sistema). Decidido em 19/10/2026: logo depois da solicitação de nota de empenho, depois de testes manuais. Exige gravar na planilha.

### Outros sites (preencher e capturar dados)

- Contratos (Comprasnet Contratos).
- Compras parte 3 do sistema: ler o saldo das atas nas páginas do Comprasnet (uma das opções; as outras são o TG e algum serviço público do Comprasnet).
- SUAP.
- SIAFI.
- SICAF.
- Simples Nacional.

### Distribuição

- Versão para o Chrome (depois do Firefox).
- Quando a extensão sair do desenvolvimento: decidir se o botão "Procurar atualização" sai da janela do ícone (12/11/2026).
- Assinatura "não listada" da Mozilla pelo GitHub, com atualização automática: preparada nas v0.1.1 e v0.1.2 (`publicacao.md`); falta o usuário criar as chaves. Depois, talvez, para os colegas do campus. Colegas hoje usam o SEI Pro.
