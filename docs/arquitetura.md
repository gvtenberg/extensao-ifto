# Architecture: file map

Read only when you need to locate code. When creating an important file, add a row in the right file below.

Plain JavaScript, no build step, Manifest V3 (D4 in `specs/base-e-sei.md`). Pure rules live in `comum/` and are tested in Node (`testes/`); code that touches pages lives in `sites/<site>/`. Code identifiers and comments stay in Portuguese (existing convention); docs are in English.

To find a file: `grep -rn "file-name" docs/arquitetura/`.

| Map | What is there |
| --- | --- |
| `arquitetura/comum.md` | Pure rules (`comum/`) |
| `arquitetura/sei-editor.md` | SEI editor and document checks (`sites/sei/`) |
| `arquitetura/sei-paginas.md` | SEI pages (`sites/sei/`) |
| `arquitetura/geral.md` | Background, other sites, screens, scripts and GitHub |
| `arquitetura/dados.md` | What is stored in the browser and other notes |
