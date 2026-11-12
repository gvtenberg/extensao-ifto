# SEI do IFTO

- Versão do SEI do IFTO: era antiga (antes de 11/2026); agora é o **SEI 5.0.4** (ver abaixo). Toda função tem que funcionar na versão em uso no IFTO.
- Objetivo inicial: algo simples, como o SEI++ (https://github.com/jonatasrs/sei), que funcionava bem para o campus até por volta da versão 6 e foi perdendo funções úteis nas versões novas, até parar no SEI do IFTO. Colegas usam hoje o SEI Pro.
- (v0.1.0; v0.2.0) A extensão só age no SEI do IFTO, `sei.ifto.edu.br` (páginas `controlador.php?acao=…` e `login.php`); até a v0.1.3 era qualquer `*.ifto.edu.br`. Guarda a versão e o endereço do último SEI aberto; a janela do ícone mostra a versão e quando foi aberto (v0.4.1).
- (v0.1.0) **Botão "Novo documento" sempre visível:** quando a barra de ações do processo não tem "Incluir documento" (nem "Incluir documento externo"), a extensão copia o link que o SEI deixa no script da árvore. Ligado por padrão; desliga nas configurações.
- (12/11/2026) O SEI do IFTO foi atualizado para o **SEI 5** (scripts com `?5.0.4-2.45.1`). As funções feitas para o SEI antigo precisam ser testadas de novo.
- (v0.1.1) **Senha reconhecida pelo navegador:** o SEI 5 usa o MaskedPassword (campo de texto com "●" e a senha num campo escondido), e o Firefox deixou de guardar e preencher a senha. Na tela de entrada (`login.php`) e na assinatura (`acao=documento_assinar`, inclusive dentro da janela de assinatura), a extensão troca os dois por um campo de senha comum, com o mesmo id e nome (`pwdSenha`), como no SEI antigo. Ligado por padrão; desliga nas configurações.
- Detalhes do SEI++ (versões, como montar o pacote, licença): `../referencias/seipp.md`.
