# Architecture: SEI editor and document checks (`sites/sei/`)

Search by file name (`grep`). Index: `../arquitetura.md`.

| File or folder | Purpose |
| --- | --- |
| `sites/sei/minuta-edital.js` | (v0.22.0) Box in the SEI editor window of an Edital with the mark: "Remover marca MINUTA" (asks the background `minutaVerificar` / `minutaRemover`); never saves |
| `sites/sei/editor-minuta.js` | (v0.22.0) Functions run by the background inside the editor (world MAIN): read the text of every section and put back the new text (CKEditor 5 or 4); never save. Used by MINUTA and the date (v0.23.0; background helper `rodarNoEditor`) |
| `sites/sei/editor-espacamento.js` | (v0.26.11) Inside the editor page (world MAIN, with `editor-numeracao.js` for `acharEditor` / `porBloco`): measures the parts (`medir`), puts the block (`por`) and removes it (`tirar`) |
| `sites/sei/espacamento-documento.js` | (v0.26.11) Editor window: adds the spacing automatically (asks the background `espacamentoMedir` / `espacamentoPor`), box with "Desfazer" (`espacamentoDesfazer`) |
| `sites/sei/caixa-editor.js` | (v0.23.0) Shared "IFTO" box in the editor window and the message to the background with a time limit (`criarCaixa`, `pedirAoFundo`); v0.31.1: helpers that bind to the editor join `quandoRemontar` and restart together on `editorRemontado` (after a restore); v0.36.2: notices window that closes into a draggable icon; checks redone with the editor open (`quandoConferirDeNovo`, message `editorConferirDeNovo`) |
| `sites/sei/data-documento.js` | (v0.23.0) Date box in the editor (asks the background `dataVerificar` / `dataAtualizar`); v0.26.9: every type, problems list and "Corrigir para …"; never saves |
| `sites/sei/editor-tabelas.js` | (v0.24.0) Put by the background inside the editor page (world MAIN, with `comum/tabelas-editor.js`): cut/copy and paste with tables through the editor model; "Margens" box in "Propriedades da tabela" |
| `sites/sei/tabelas.js` | (v0.24.0) Editor window: asks the background (`tabelasPreparar`) to prepare the tables if the settings are on |
| `sites/sei/editor-numeracao.js` | (v0.25.0) Inside the editor page (world MAIN): finds items whose text went to the next line, watches changes (`postMessage` to the box), puts the style block (`corrigir`); v0.26.11: `porBloco` and `acharEditor` shared with the spacing |
| `sites/sei/numeracao-edital.js` | (v0.25.0) Editor window: box "Corrigir a numeração" shown only while there are broken items |
| `comum/numeracao-digitada.js` | (v0.37.0) Pure rules: hidden box that disturbs the numbering, typed number at the start, new style, numbers the counters will show |
| `sites/sei/editor-caixas.js` | (v0.37.0) Inside the editor page (world MAIN, with `editor-numeracao.js` for `acharEditor`): finds hidden boxes and typed numbers, unwraps, lists, scrolls to a paragraph, converts (CKEditor model) |
| `sites/sei/numeracao-caixas.js` | (v0.37.0) Editor window: notices "Tirar o texto das caixas" and "Revisar e converter" |
| `sites/sei/painel-revisao.js` | (v0.37.0) Shared left review panel (ticked list, click to go, confirm button); opens only on click |
| `comum/formatacao-agu.js` | (v0.37.0) Pure rules of "Remover Formatação da AGU": "Justificativa…" text, Word comment link, color type (black/white/colored), space when joining, line text |
| `sites/sei/editor-agu.js` | (v0.37.0) Inside the editor page (world MAIN, with `editor-numeracao.js` and `editor-caixas.js`): finds and removes struck text, colors, white text, highlights, "Justificativa…", Word links and SEI comment balloons (CKEditor model) |
| `sites/sei/formatacao-agu.js` | (v0.37.0) Editor window: "Remover Formatação da AGU" notice and review panel |
| `sites/sei/editor-estilos.js` | (v0.29.0) Inside the editor page (world MAIN): adds the extras to the `EstiloEditing` plugin and their CSS, ★ and note in the list, keeps the style block up to date |
| `sites/sei/todos-os-estilos.js` | (v0.29.0) Editor window: starts the extras and saves learned styles; switch off + block in the text: box "Ligar de novo" |
| `sites/sei/editor-salvamento.js` | (v0.31.0) Inside the editor page (world MAIN): reads text (`getFullData`, editable roots) + comments, watches Salvar (events `extensao-ifto-salvando` / `extensao-ifto-salvou`, SEI version changed), reloads the editor with a copy (destroy + `montar`, falls back to the previous text) |
| `sites/sei/salvamento-automatico.js` | (v0.31.0) Editor window: indicator next to Salvar, copy every 30 s, reopening box, "Ver diferenças" window, Copiar/Colar conteúdo buttons |
| `sites/sei/conferir-documento.js` | (v0.26.2) Editor window: "Corrigir o número do processo" box (asks the background `conferirVerificar` / `conferirCorrigir`); v0.26.3: stops "Assinar" / Ctrl+Shift+A with a wrong number; v0.26.5: timbre and footer box ("Corrigir timbre", "Corrigir rodapé", "Usar este timbre como padrão da unidade") |
| `sites/sei/editor-preencher.js` | Function run by the background inside the SEI editor window (world MAIN, v0.21.0): finds the editor (CKEditor 5 multi-root or 4) and the body section, puts the text, clicks Salvar (never Assinar) and reports the editor and sections |
