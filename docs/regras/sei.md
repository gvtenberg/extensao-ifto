# IFTO SEI

**Sections**: Version and general · Login and signing · Tree, menus and buttons

Creating and including documents: `sei-documentos.md`. Editor: `sei-editor.md`. Process screen, new process and duplicate: `sei-processo.md`.

## Version and general

- IFTO SEI version: it was old (before 11/2026); it is now **SEI 5.0.4** (see below). Every feature must work on the version used at IFTO.
- Initial goal: something simple, like SEI++ (https://github.com/jonatasrs/sei), which worked well for the campus up to around version 6 and lost useful features in newer versions, until it stopped working on the IFTO SEI. Colleagues currently use SEI Pro.
- (19/11/2026, user) There is no "Memorando" at IFTO: it was replaced by the **Despacho**. Never plan or test a Memorando.
- (v0.1.0; v0.2.0) The extension acts only on the IFTO SEI, `sei.ifto.edu.br` (pages `controlador.php?acao=…` and `login.php`); up to v0.1.3 it was any `*.ifto.edu.br`. Exception (v0.13.0): the SICAF search also opens Compras.gov.br pages, only with the optional permission (`sicaf.md`). It saves the version and address of the last SEI opened; the icon window shows the version and when it was opened (v0.4.1).
- (v0.28.0, spec `aviso-versao-sei`) **Untested SEI version:** untested = the first three numbers of the SEI version differ from `VERSAO_SEI_TESTADA` (`comum/sei.js`). On the main SEI pages (with the unit link, top frame) a box asks "Continuar usando" or "Desativar a extensão no SEI"; the choice is kept in `storage.local` (`seiEscolha`, with the version) and asked again only on another SEI version; a new extension version that marks the SEI as tested removes the warning. Turned off: every SEI script awaits `ligadaNoSei()` and does nothing (no page reload, so no form is resent; the functions leave on the next page); SICAF/Compras features start from the SEI, so they stay off too. "Ativar de novo" in the icon window and in Configurações › Geral (card shown only on an untested SEI). Every new SEI script must start with this check.
- (12/11/2026) The IFTO SEI was updated to **SEI 5** (scripts with `?5.0.4-2.45.1`). Features built for the old SEI need to be tested again.
- (v0.22.2) New **internal** document page: `acao=documento_gerar` (existing one: `documento_alterar`). Same access-level fields `#optPublico`/`#optRestrito`/`#optSigiloso` in `frmDocumentoCadastro`; the extension marks Público only when no level is marked (Edital Gabinete came with no level marked), never the format, never Salvar.
- SEI++ details (versions, how to build the package, license): `../referencias/seipp.md`.

## Login and signing

- (v0.1.1) **Password recognized by the browser:** SEI 5 uses MaskedPassword (text field with "●" and the password in a hidden field), and Firefox stopped saving and filling in the password. On the login page (`login.php`) and when signing (`acao=documento_assinar`, including inside the signing window), the extension replaces both with a normal password field, with the same id and name (`pwdSenha`), as in the old SEI. On by default; can be turned off in the settings.
- (v0.5.0) **Saved passwords:** Firefox also suggests passwords from other `ifto.edu.br` sites (SUAP, Moodle…). The extension cannot change this; the fix is the Firefox setting `signon.includeOtherSubdomainsInLookup = false` (step by step in `../publicacao.md`, "Saved passwords in the SEI").
- SEI 5 signing window (`acao=documento_assinar`): form `#frmAssinaturas`, job title `#selCargoFuncao` (loaded by AJAX), password `#pwdSenha` (Enter signs), button `#btnAssinar` (`assinarSenha()`). Process bar buttons: images with title "Assinar Documento" and "Ciência" inside `#divArvoreAcoes`.

## Tree, menus and buttons

- (v0.30.0, user 19/11/2026) **Copy menu of the document icon in the tree** (T/E/L options, jQuery `serialtip` menus inside `#serialtip`; options `a.clipboard[data-clipboard-text]` with `tipo` texto/link/url, SEI function `copiarParaClipboard` in `sei.js`): the SEI locks the menu after a click (`bolExecutandoCopiaPopover`, ~2 s) and clicks "Fechar" after 1.5 s; its own click-outside close is commented out. The extension catches the click first (capture) and copies itself, same messages as the SEI; every click copies; closes 1 s after the last click (clicks `.serialtip-close`); Esc, a click outside the menu or the tree frame losing focus close it at once. Switch `menuCopiar` (on by default).
- (v0.1.0 to v0.5.0) "Novo documento" button always visible: **removed in v0.6.0**, because SEI 5 always shows Incluir Documento.
- (v0.8.0) Process tree (`ifrArvore` script): `Nos[n] = new infraArvoreNo("DOCUMENTO", id, pai, link, alvo, rótulo, dica, ícone, …)`; file attached = `Nos[n].src` with `documento_download_anexo` (or PDF icon); made in the SEI = `documento_interno` icon; blank = `documento_sem_conteudo` icon. Closed old folders load only when opened (`AGUARDE` node).
- (v0.34.0, user 19/11/2026) **"Blocos Internos" button** in the Controle de Processos button bar, right after "Controle de Prazos", same size and spacing as the SEI icons (the SEI button is copied). The link is read from the menu Blocos > Internos (`a[link="bloco_interno_listar"]`): SEI links carry a security hash (`infra_hash`), so an address cannot be typed by hand. No menu link or no "Controle de Prazos" button: nothing is added. Switch `botaoBlocosInternos` (on by default).
