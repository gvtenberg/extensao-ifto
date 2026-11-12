# Melhorias futuras

**Seções**: Ordem sugerida · Outros sites · Distribuição

Uma linha por ideia. Quando uma ideia for planejada, ela ganha uma spec em `docs/specs/` e a linha passa a apontar para ela. Ao terminar, a linha sai daqui e vai para `docs/historico.md`.

Marcas: **[spec]** já tem spec.

## Ordem sugerida (a confirmar com o usuário)

1. Base da extensão e melhorias do SEI (no lugar do SEI++, que parou no SEI do IFTO): botão Novo documento, documento externo preenchido, arrastar arquivos com o tipo reconhecido, roteiros por tipo de processo **[spec]** → `specs/base-e-sei.md`
   - Depois: **compressão automática de PDF** na própria extensão (26/10/2026): compactar, comparar os tamanhos, informar quanto se economiza no servidor de arquivos da Reitoria e mostrar lado a lado o PDF original e o compactado, para o usuário ver a diferença de qualidade e escolher um deles. Obrigatória acima de 10 MB. De preferência sem mandar o arquivo para sites de fora (D13 da spec).
2. Login Google e leitura da planilha do sistema (sem login, só as melhorias do SEI).
3. Solicitação de nota de empenho no SEI: preencher o documento com o texto que o sistema já monta (v0.43.0 do sistema; regras em `../sistema-orcamento-ifto/docs/regras/solicitacao-empenho.md`). Depende do teste T40 do sistema ("Colar no SEI").
4. Lançamento das notas/faturas pagas por demanda (alimenta o liquidado por demanda e, depois, o módulo financeiro do sistema). Decidido em 19/10/2026: logo depois da solicitação de nota de empenho, depois de testes manuais. Exige gravar na planilha.

## Outros sites (preencher e capturar dados)

- Contratos (Comprasnet Contratos).
- Compras parte 3 do sistema: ler o saldo das atas nas páginas do Comprasnet (uma das opções; as outras são o TG e algum serviço público do Comprasnet).
- SUAP.
- SIAFI.
- SICAF.
- Simples Nacional.

## Distribuição

- Versão para o Chrome (depois do Firefox).
- Assinatura "não listada" da Mozilla pelo GitHub: preparada na v0.1.1 (`publicacao.md`); falta o usuário criar as chaves. Depois, talvez, para os colegas do campus (atualização automática). Colegas hoje usam o SEI Pro.
