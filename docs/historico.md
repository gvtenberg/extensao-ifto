# Histórico de versões (resumo)

Uma ou duas linhas por versão, com a data (dd/mm/aaaa). Número 0.ETAPA.AJUSTE.

- v0.4.2 (12/11/2026): "Instalar a versão…" abre a página da versão no GitHub (o Firefox não mostrava a instalação ao abrir o arquivo direto, e não deixa a extensão pedir a atualização); o aviso explica o clique no arquivo e o caminho pelo menu do Firefox (Procurar atualizações).
- v0.4.1 (12/11/2026): textos da extensão revistos para quem a usa (a janela do ícone não fala mais de GitHub, Actions ou envio de código); regra registrada em `padrao-visual.md` e no CLAUDE.md.
- v0.4.0 (12/11/2026): lista de assinaturas, etapa 3: botões "Assinar" e "Dar ciência" no painel, que clicam no botão do próprio SEI (a senha e a confirmação continuam com o usuário). Melhoria concluída.
- v0.3.0 (12/11/2026): lista de assinaturas, etapa 2: "Feito e próximo" e contador de feitos, lista completa clicável, itens de ciência em azul, minimizar, atalhos Alt+→ e Alt+←, opção nas configurações (Automática / Sempre ligada / Desligada).
- v0.2.0 (12/11/2026): lista de assinaturas no SEI, etapa 1: colar a lista (processo, documento, comentário; vários formatos), linhas não reconhecidas em vermelho, painel móvel à direita da barra de botões com Anterior/Próximo e contador, abre cada item pela pesquisa rápida; só na Direção-geral (PAL/REI/IFTO). A extensão passa a agir só em `sei.ifto.edu.br`.
- (12/11/2026, sem mudar a versão) `TESTES-PENDENTES.md` compacto, só como fonte dos cartões (scripts de leitura e de apagar). Testes como cartões (issues) no GitHub, com "Passou"/"Falhou" e comentários; regras gerais do Claude copiadas em `docs/claude-regras-gerais.md` e conferidas no início de cada sessão.
- v0.1.3 (12/11/2026): botão "Procurar atualização" na janela do ícone (consulta a última Release do GitHub e instala com um clique); GitHub confere a extensão a cada envio; organização igual à do sistema principal (CLAUDE.md, comandos, permissões).
- v0.1.2 (12/11/2026): atualização automática no Firefox pelo GitHub (`update_url` + `updates.json` em cada Release; repositório público).
- v0.1.1 (12/11/2026): SEI 5 – senha reconhecida pelo Firefox na tela de entrada e na assinatura de documentos (o SEI passou a esconder a senha num campo de texto); assinatura na Mozilla pelo GitHub (`.github/workflows/assinar.yml`).
- v0.1.0 (26/10/2026): esqueleto da extensão (Firefox 128+, Manifest V3, licença GPL-3.0): janela do ícone com o SEI reconhecido (versão e endereço), página de configurações, botão "Novo documento" sempre visível na barra de ações do processo (do SEI++); comandos `npm test`, `npm run conferir`, `npm run empacotar`.
- (25/10/2026) Projeto criado: CLAUDE.md, comandos (`/planejar`, `/etapa`, `/testes`), `docs/` e `TESTES-PENDENTES.md` no modelo do sistema de gestão orçamentária; SEI++ antigo empacotado para teste (fora do git). Ainda sem código.
