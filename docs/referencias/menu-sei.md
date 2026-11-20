# What the IFTO SEI can do (side menu, SEI 5.0.4)

**Sections**: Side menu · Ideas for the extension

Read before suggesting an SEI improvement: first check whether the SEI already does it. Menu seen on 19/11/2026 in the CGOC unit (other units or profiles may show more items). Saved pages in `ferramentas-de-teste/paginas-sei/` (development computer). "(?)" = description from general SEI knowledge, not yet seen on an IFTO page.

## Side menu

| Item | What it does | Extension today / note |
|---|---|---|
| Acompanhamento Especial | List of processes the unit chose to follow, in groups (?) | – |
| Base de Conhecimento | Procedures explained per process type (?) | – |
| Blocos > Assinatura | Send documents to other units to sign | Signature list (`regras/lista-assinaturas.md`) |
| Blocos > Internos | Unit's own groups of processes | Button in the Controle de Processos bar (v0.34.0) |
| Blocos > Reunião | Processes for a meeting agenda (?) | – |
| Contatos | Address book (people, companies) used as interested party / recipient | – |
| Controle de Prazos | Deadlines set for processes in the unit (?) | – |
| Controle de Processos | Main list of processes open in the unit | Several improvements (`regras/sei.md`) |
| Estatísticas > Unidade | Totals of the unit for a period (?) | Page not saved yet |
| Estatísticas > Desempenho de Processos | Time processes took, per type (?) | Page not saved yet |
| Favoritos | Saved document models (protocolo_modelo) | – |
| Grupos > Contatos / E-Mail / Envio / Federação | Groups to send to many contacts, e-mails or units at once | – |
| Iniciar Processo | New process | "Público" in new processes (v0.33.0) |
| Lixeira | Deleted documents (?) | – |
| Marcadores | Coloured labels on processes | – |
| Painel de Controle | Overview: processes by type, marker, deadline (?) | – |
| Pesquisa | Search processes/documents: text, unit, assunto, "Assinatura / Autenticação" (documents signed by a user), interessado, tipo, número, valor, "Usuário" gerador (registration filled on click), "Data entre" | Saved page `SEI - Pesquisa.html`; monthly report idea |
| Pontos de Controle | Situation stages a unit sets for its processes (?) | – |
| Processos Sobrestados | Suspended processes | – |
| Reabertura Programada | Processes set to reopen on a date (?) | – |
| Relatórios > Atividade na Unidade | Activities in the unit; filters Unidade, Usuário, Período, Tipo | Saved page `SEI - Relatório de Atividade na Unidade.html`; monthly report idea |
| Retorno Programado | Processes sent with a return date | – |
| Textos Padrão | Unit's standard texts to insert in documents | – |

## Ideas for the extension

Possible suggestions (to check with the user; when one is accepted it becomes a line in `melhorias-futuras.md`):
- Monthly report built from Pesquisa + Atividade na Unidade + Estatísticas (already an idea).
- Shortcuts to the menu pages used most (as done with Blocos Internos).
- Deadlines (Controle de Prazos, Retorno Programado) shown on the home page as a warning of what expires soon.
- Process templates could reuse Favoritos and Textos Padrão instead of copying texts.
