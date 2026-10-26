# SEI++ (jonatasrs/sei): anotações

Levantamento de 25/10/2026.

- Repositório: https://github.com/jonatasrs/sei. Licença **GPL-3.0**: se aproveitarmos o código, a nossa extensão também passa a ser GPL-3.0 (o código fica aberto se for distribuída; não atrapalha o uso no campus).
- Commit indicado pelo usuário (ainda funcionava bem): `c53f1367` (14/08/2025, "Fix: Prazo/Dias quando há mais de um marcador"), logo depois da tag **v5.999** ("6.0 beta"). Manifest versão 3, **exige SEI 4.1 ou mais novo**, Firefox 128 ou mais novo.
- Versão mais antiga testada: tag **v5.1.1** (03/10/2022). Manifest versão 2, **aceita SEI 3.0 ou mais novo**. Pode combinar melhor com o SEI antigo do IFTO.
- Funções ficam em `cs_modules/<página do SEI>/` (ex.: `procedimento_controlar`, `procedimento_visualizar`, `arvore_visualizar`, `documento_gerar`), uma pasta por página (`acao=` do endereço).

## Por que o pacote do commit não funcionava

- A extensão usa jQuery e jQuery UI da pasta `node_modules/`, que não fica no GitHub: é preciso baixá-los (`npm install`) antes.
- O script do projeto (`scripts/make.sh`) deixa `node_modules/` **de fora** do zip, então o pacote sai sem o jQuery.
- Não há etapa de compilação: com o jQuery na pasta, basta zipar a pasta com o `manifest.json` na raiz.

## Pacotes montados para teste (fora do git)

- `ferramentas-de-teste/seipp/seipp-c53f136.xpi` (commit c53f1367 + jQuery 3.7.1 e jQuery UI 1.14.1).
- `ferramentas-de-teste/seipp/seipp-v5.1.1.xpi` (tag v5.1.1; já traz as bibliotecas).
- Conferido: os dois têm todos os arquivos que o manifest pede. Falta testar no SEI do IFTO (T01 e T02).
