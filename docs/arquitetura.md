# Arquitetura: mapa dos arquivos

Leia só quando precisar localizar código. Ao criar um arquivo importante, acrescente uma linha aqui.

Ainda não há código. A estrutura será decidida na primeira etapa (ver `specs/base-e-sei.md`). Provável, no padrão das extensões do Firefox:

| Arquivo ou pasta | Função |
| --- | --- |
| `manifest.json` | Nome, versão, permissões e em quais sites a extensão age |
| `background/` | Parte que roda o tempo todo (login Google, leitura da planilha) |
| `sites/sei/` | O que a extensão acrescenta nas páginas do SEI (uma pasta por site: `sites/suap/`, `sites/siafi/`…) |
| `janela/` | Janela que abre ao clicar no ícone da extensão |
| `configuracoes/` | Página de configurações (login, funções ligadas e desligadas) |
| `comum/` | Código usado por mais de uma parte (formatação de valores, leitura da planilha) |
