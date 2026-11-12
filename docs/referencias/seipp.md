# SEI++ (jonatasrs/sei): notes

**Sections**: Why the commit package did not work · Packages built for testing (outside git)

Survey from 25/10/2026.

- Repository: https://github.com/jonatasrs/sei. License **GPL-3.0**: if we reuse the code, our extension also becomes GPL-3.0 (the code stays open if distributed; this does not affect use on campus).
- Commit pointed out by the user (still worked well): `c53f1367` (14/08/2025, "Fix: Prazo/Dias quando há mais de um marcador"), right after tag **v5.999** ("6.0 beta"). Manifest version 3, **requires SEI 4.1 or newer**, Firefox 128 or newer.
- Oldest version tested: tag **v5.1.1** (03/10/2022). Manifest version 2, **accepts SEI 3.0 or newer**. May fit the old IFTO SEI better.
- Features live in `cs_modules/<SEI page>/` (e.g. `procedimento_controlar`, `procedimento_visualizar`, `arvore_visualizar`, `documento_gerar`), one folder per page (`acao=` in the address).

## Why the commit package did not work

- The extension uses jQuery and jQuery UI from the `node_modules/` folder, which is not on GitHub: they have to be downloaded (`npm install`) first.
- The project script (`scripts/make.sh`) leaves `node_modules/` **out** of the zip, so the package comes out without jQuery.
- There is no build step: with jQuery in the folder, just zip the folder with `manifest.json` at the root.

## Packages built for testing (outside git)

- `ferramentas-de-teste/seipp/seipp-c53f136.xpi` (commit c53f1367 + jQuery 3.7.1 and jQuery UI 1.14.1).
- `ferramentas-de-teste/seipp/seipp-v5.1.1.xpi` (tag v5.1.1; already includes the libraries).
- Checked: both have every file the manifest asks for. Still to test on the IFTO SEI (T01 and T02).
