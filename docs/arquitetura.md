# Arquitetura: mapa dos arquivos

Leia só quando precisar localizar código. Ao criar um arquivo importante, acrescente uma linha aqui.

JavaScript simples, sem compilação, Manifest V3 (D4 de `specs/base-e-sei.md`). As regras puras ficam em `comum/` e são testadas no Node (`testes/`); o que mexe nas páginas fica em `sites/<site>/`.

| Arquivo ou pasta | Função |
| --- | --- |
| `manifest.json` | Nome, versão, permissões, sites em que a extensão age (`*.ifto.edu.br/…controlador.php?acao=…` e `…login.php…`) e scripts de cada página |
| `comum/sei.js` | Regras de leitura do SEI: versão (`versaoDoSei`), link do botão Novo documento (`extrairLinkNovoDocumento`), atributos do campo de senha (`atributosDoCampoDeSenha`) |
| `comum/configuracoes.js` | Configurações no navegador: padrões (`PADROES`), `comPadroes`, ler e gravar |
| `comum/estilo.css` | Cores e componentes das páginas da extensão (padrão do sistema) |
| `sites/sei/todas-as-paginas.js` | Em toda página do SEI: guarda a versão e o endereço do SEI (`seiVisto`) |
| `sites/sei/botao-novo-documento.js` | Botão "Novo documento" sempre visível (`acao=arvore_visualizar`) |
| `sites/sei/campo-senha.js` | Campo de senha reconhecido pelo navegador (`login.php` e `acao=documento_assinar`, também dentro da janela de assinatura) |
| `janela/` | Janela do ícone: versão da extensão, SEI reconhecido, botão Configurações |
| `configuracoes/` | Página de configurações (cada opção grava na hora) |
| `icones/icone.svg` | Ícone (SVG: o Chrome vai pedir PNG) |
| `testes/` | Testes automáticos (`npm test`) |
| `.github/workflows/assinar.yml` | GitHub: testa, assina na Mozilla (não listada) e publica o `.xpi` em Releases (ver `publicacao.md`) |

Dados no navegador (`storage.local`): `configuracoes` (opções) e `seiVisto` (versão, endereço e data do último SEI aberto).
