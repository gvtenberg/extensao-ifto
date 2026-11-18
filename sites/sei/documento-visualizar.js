// v0.26.1 (spec conferir-documento): página do documento no SEI (quadro "documento_visualizar" da árvore).
(async function () {
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
  function botaoDoEditor (caixa) {
    let editar = null
    try { editar = window.parent.document.querySelector('a[onclick*="editarConteudo"]') } catch (erro) {}
    if (editar) caixa.botao.addEventListener('click', () => editar.click())
    else caixa.botao.replaceWith(caixaEditor.criar('p', { className: 'aviso', textContent: 'Clique em "Editar Conteúdo" na barra do SEI para corrigir.' }))
  }
  if (configuracoes.conferirProcesso) {
    const processo = regras.conferirProcesso(secoes)
    if (processo && !processo.certo) {
      const caixa = caixaEditor.criarCaixa('conferir-processo', regras.avisoDoProcesso(processo), 'Abrir o editor para corrigir')
      Object.assign(caixa.corpo.parentElement.style, { top: '16px', bottom: 'auto' })
      botaoDoEditor(caixa)
    }
  }
  if (!configuracoes.conferirTimbre && !configuracoes.conferirRodape) return
  const sigla = regras.siglaDaUnidade(await caixaEditor.unidadeAberta())
  if (!regras.ehUnidadePalmas(sigla)) return
  const unidade = regras.acharUnidade(configuracoes.unidades, sigla)
  const timbre = configuracoes.conferirTimbre ? regras.conferirTimbre(secoes, unidade, sigla) : null
  const rodape = configuracoes.conferirRodape ? regras.conferirRodape(secoes, unidade) : null
  const avisos = [...(timbre && !timbre.certo ? regras.avisosDoTimbre(timbre) : []), ...(rodape && !rodape.certo ? rodape.avisos : [])]
  if (!avisos.length) return
  const partes = [timbre && !timbre.certo && 'o timbre', rodape && !rodape.certo && 'o rodapé'].filter(Boolean).join(' e ')
  const caixa = caixaEditor.criarCaixa('conferir-timbre', `Confira ${partes} desta unidade (${sigla}):`, 'Abrir o editor para corrigir')
  Object.assign(caixa.corpo.parentElement.style, { left: '16px', right: 'auto' })
  const lista = caixaEditor.criar('ul')
  for (const aviso of avisos) lista.append(caixaEditor.criar('li', { textContent: aviso }))
  caixa.botao.before(lista)
  botaoDoEditor(caixa)
})()
