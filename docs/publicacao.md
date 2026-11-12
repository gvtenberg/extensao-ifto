# Publicação: assinatura na Mozilla pelo GitHub

O Firefox só instala de vez uma extensão assinada pela Mozilla. Usamos a assinatura **não listada** (grátis, não aparece na loja). Quem assina é o GitHub, e a extensão está disponível para download direto pelo GitHub, sem precisar ser enviada pelo computador de desenvolvimento.

**Seções**: Como funciona · Preparar uma vez (chaves da Mozilla) · Publicar uma versão nova · Instalar no computador · Problemas comuns

## Como funciona

- Arquivo `.github/workflows/assinar.yml`. Roda quando chega ao GitHub um commit que muda o `manifest.json` (ou pelo botão **Run workflow** na aba **Actions**).
- Faz: `npm test`, `npm run conferir`, assina com `web-ext sign --channel unlisted` e cria em **Releases** a versão `vX.Y.Z` com o arquivo `extensao-ifto-X.Y.Z.xpi`.
- A Release também leva o `updates.json`. O `manifest.json` aponta para o da última Release (`update_url`), e assim o Firefox instala sozinho cada versão nova (repositório **público**).
- Se a versão do `manifest.json` já tem Release, não faz nada: a Mozilla não aceita assinar a mesma versão duas vezes (por isso a versão sobe a cada alteração).

## Preparar uma vez (chaves da Mozilla)

1. Entre em https://addons.mozilla.org/pt-BR/developers/ com uma conta da Mozilla (crie, se não tiver) e aceite o acordo de desenvolvedor.
2. Abra https://addons.mozilla.org/pt-BR/developers/addon/api/key/ e clique em **Gerar novas credenciais**. Aparecem o **emissor JWT** (começa com `user:`) e o **segredo JWT**.
3. No GitHub, abra o repositório > **Settings** > **Secrets and variables** > **Actions** > **New repository secret** e crie dois segredos:
   - nome `AMO_JWT_ISSUER`, valor: o emissor JWT;
   - nome `AMO_JWT_SECRET`, valor: o segredo JWT.
4. As chaves nunca vão para o git nem para arquivos do projeto.

## Publicar uma versão nova

1. No computador de desenvolvimento, depois do commit (o Claude faz o commit, mas não envia), envie ao GitHub: no terminal, dentro da pasta `extensao-ifto`, digite `git push`.
2. No GitHub, aba **Actions**: acompanhe "Assinar extensão" (alguns minutos; a Mozilla confere o pacote).
3. Pronto: o `.xpi` aparece em **Releases** (lado direito da página do repositório).

## Instalar no computador

1. No Firefox do trabalho, abra a página **Releases** do repositório e clique no arquivo `extensao-ifto-X.Y.Z.xpi`.
2. O Firefox pergunta se quer adicionar a extensão: clique em **Adicionar**.
3. Só na primeira vez. Depois o Firefox atualiza sozinho (confere uma vez por dia). Para atualizar na hora (ex.: logo depois de "Assinar extensão" terminar): clique no ícone da extensão > **Procurar atualização** > **Instalar a versão …**; na página da versão que abrir, clique no arquivo `extensao-ifto-X.Y.Z.xpi` > **Permitir** (para o GitHub) > **Adicionar** (v0.4.2: abrir o arquivo direto não mostrava a instalação). Outro jeito, sem a janela da extensão: menu ☰ do Firefox > **Extensões e temas** > engrenagem ⚙ > **Procurar atualizações**. As configurações são mantidas.
- O botão "Procurar atualização" serve enquanto a extensão está em desenvolvimento; quando ela estiver pronta, o usuário decide se ele sai da janela.

## Problemas comuns

- "Version already exists": a versão do `manifest.json` já foi assinada; suba a versão.
- Falta de chave ("API key" ou "401"): confira os dois segredos do passo 3 de "Preparar uma vez".
