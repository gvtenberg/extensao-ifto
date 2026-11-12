# Padrão visual da extensão

Segue o padrão do sistema (`../sistema-orcamento-ifto/docs/padrao-visual.md`), para a extensão parecer parte dele. Aqui ficam só as diferenças.

## Janela do ícone e configurações (páginas da própria extensão)

- Mesmas cores, fonte (IBM Plex Sans), cantos e tamanhos de letra do sistema. Principais: fundo #F5F6F4, cartão #FFFFFF, borda #E2E6E3, texto #1B2420, texto secundário #5B6660, destaque (`marca`) #1E5E33 só no botão principal e no item ativo, erro #9B1C1C, pendência #7A4B00.
- Botões e campos com 44 px de altura; um só botão principal por área.
- Avisos perto da ação; explicação longa num botão (?).
- **Textos para quem usa a extensão** (12/11/2026, v0.4.1): servidores do campus, que não são de TI. Nada de instruções para o programador (GitHub, Actions, "enviar o código", versão assinada, nomes de arquivos, termos técnicos). Diga o que aconteceu e o que a pessoa pode fazer (ex.: "Ainda não há versão para instalar. Tente de novo mais tarde."). Vale para a janela do ícone, as configurações e o que a extensão põe nas páginas.

## O que a extensão acrescenta nas páginas (SEI e outros sites)

- **Discreto e no estilo do site**, não no do sistema: o que for acrescentado deve parecer parte da página.
- Tudo o que a extensão acrescenta fica identificável (ex.: um pequeno ícone da extensão), para o usuário saber o que é do site e o que é da extensão.
- Nada de mudar o que o site já mostra sem o usuário ligar a função nas configurações. Exceção (v0.3.0): funções do perfil da unidade aberta no SEI podem vir ligadas ("Automática"), como a lista de assinaturas na Direção-geral; o usuário pode desligá-las.
- **Painel flutuante** (v0.2.0, lista de assinaturas): fica por cima da página, pode ser arrastado e minimizado e guarda a posição; isolado do estilo do site (shadow DOM), com a etiqueta verde "IFTO" e as cores do sistema; botões de 32 px por ser compacto. Lugar padrão: canto superior direito, à direita da barra de botões do processo.
