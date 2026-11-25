// v0.26.1 (spec conferir-documento): página do documento no SEI (quadro "documento_visualizar" da árvore).
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  const { configuracoes: config, conferirDocumento: regras, caixaEditor } = globalThis.ExtensaoIFTO
  const configuracoes = await config.lerConfiguracoes()

  // v0.26.1 (D15): no SEI 5 a caixa "Documento assinado eletronicamente por …" vem com unselectable="on" e
  // user-select:none, e não dá para copiar o nome de quem assinou. A extensão só libera a seleção nesta
  // página: nada é gravado no SEI e o PDF do SEI não muda.
  if (configuracoes.copiarAssinaturas) {
    const MARCA = 'data-extensao-ifto-selecionavel'
    const estilo = document.createElement('style')
    // !important na folha vence o user-select:none escrito no próprio elemento (sem !important).
    estilo.textContent = `[${MARCA}], [${MARCA}] * { -moz-user-select: text !important; -webkit-user-select: text !important; user-select: text !important; }`
    document.head.append(estilo)
    for (const caixa of document.querySelectorAll('[unselectable="on"]')) {
      if (!/assinado eletronicamente/i.test(caixa.textContent)) continue
      caixa.removeAttribute('unselectable')
      caixa.setAttribute(MARCA, '')
    }
  }

  // v0.26.2: número do processo errado num documento ainda não assinado: aviso com o botão que abre o
  // editor (a correção é só no editor). Documento assinado nunca é tocado.
  // v0.26.5: e o timbre e o rodapé (unidades do Campus Palmas), numa caixa embaixo, à esquerda.
  const html = document.body.innerHTML
  if (regras.estaAssinado(html)) return
  const secoes = [{ nome: 'pagina', html }]
  // Botão "Editar Conteúdo" da barra do SEI, no quadro de cima (mesmo site).
  let editar = null
  try { editar = window.parent.document.querySelector('a[onclick*="editarConteudo"]') } catch (erro) {}
  // Ao abrir o editor (pelo aviso ou pelo botão do SEI), os avisos daqui fecham (viram o ícone): o editor mostra os dele, e duas
  // janelas confundiam. Abrir o documento de novo na árvore confere outra vez.
  let editorAberto = false
  if (editar) {
    const aoAbrirEditor = () => {
      editorAberto = true
      caixaEditor.fecharAvisos()
      // v0.36.2: editor deste documento já aberto: confere de novo e mostra os avisos lá (caixa-editor.js).
      const documento = new URL(location.href).searchParams.get('id_documento')
      if (documento) (globalThis.browser || globalThis.chrome).runtime.sendMessage({ tipo: 'editorConferirDeNovo', documento }).catch(() => {})
    }
    editar.addEventListener('click', aoAbrirEditor)
    // A barra do SEI continua na tela quando o quadro do documento recarrega.
    window.addEventListener('pagehide', () => editar.removeEventListener('click', aoAbrirEditor), { once: true })
  }
  function botaoDoEditor (caixa) {
    if (editar) caixa.botao.addEventListener('click', () => editar.click())
    else caixa.botao.replaceWith(caixaEditor.criar('p', { className: 'aviso', textContent: 'Clique em "Editar Conteúdo" na barra do SEI para corrigir.' }))
  }
  function avisoDaPagina (nome, texto, linhas) {
    const caixa = caixaEditor.criarCaixa(nome, texto, 'Abrir o editor para corrigir')
    const lista = caixaEditor.criar('ul')
    for (const linha of linhas) lista.append(caixaEditor.criar('li', { textContent: linha }))
    caixa.botao.before(lista)
    botaoDoEditor(caixa)
  }
  if (configuracoes.conferirProcesso) {
    const processo = regras.conferirProcesso(secoes)
    if (processo && !processo.certo) {
      const caixa = caixaEditor.criarCaixa('conferir-processo', regras.avisoDoProcesso(processo), 'Abrir o editor para corrigir')
      botaoDoEditor(caixa)
    }
  }
  // v0.26.9 (etapa 8): data com mês ou ano errado, de um dia que não chegou ou fora do padrão (só sem assinatura).
  if (configuracoes.conferirData && globalThis.ExtensaoIFTO.dataDocumento) {
    const data = globalThis.ExtensaoIFTO.dataDocumento.conferirData(secoes, new Date())
    if (data && !data.certo) {
      avisoDaPagina('conferir-data', 'Confira a data do documento:', data.problemas)
    }
  }
  // v0.35.2: "Campus"/"Campi" sem itálico (toda unidade). Só o texto do documento: os comentários do SEI ficam de fora.
  if (configuracoes.conferirItalico) {
    const conteudos = [...document.querySelectorAll('.conteudo')].map(parte => parte.innerHTML)
    const italico = regras.conferirItalico([{ nome: 'pagina', html: conteudos.length ? conteudos.join('') : html }])
    if (!italico.certo) {
      const trechos = italico.quantos > italico.trechos.length ? [...italico.trechos, '…'] : italico.trechos
      avisoDaPagina('conferir-italico', regras.avisoDoItalico(italico), trechos)
    }
  }
  if (!configuracoes.conferirTimbre && !configuracoes.conferirRodape && !configuracoes.conferirCargo) return
  const sigla = regras.siglaDaUnidade(await caixaEditor.unidadeAberta())
  if (!regras.ehUnidadePalmas(sigla)) return
  // v0.35.2: cargo da diretora-geral (só na Direção-geral).
  const cargo = configuracoes.conferirCargo ? regras.conferirCargo(secoes, sigla) : null
  if (cargo && !cargo.certo && !editorAberto) avisoDaPagina('conferir-cargo', 'Confira o cargo da diretora-geral:', cargo.problemas)
  const unidade = regras.acharUnidade(configuracoes.unidades, sigla)
  const timbre = configuracoes.conferirTimbre ? regras.conferirTimbre(secoes, unidade, sigla) : null
  const rodape = configuracoes.conferirRodape ? regras.conferirRodape(secoes, unidade) : null
  // O editor pode ter sido aberto enquanto a extensão lia a unidade.
  if (editorAberto) return
  const avisos = [...(timbre && !timbre.certo ? regras.avisosDoTimbre(timbre) : []), ...(rodape && !rodape.certo ? rodape.avisos : [])]
  if (!avisos.length) return
  const partes = [timbre && !timbre.certo && 'o timbre', rodape && !rodape.certo && 'o rodapé'].filter(Boolean).join(' e ')
  avisoDaPagina('conferir-timbre', `Confira ${partes} desta unidade (${sigla}):`, avisos)
})()
