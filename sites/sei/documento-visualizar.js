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
  if (configuracoes.conferirProcesso) {
    const html = document.body.innerHTML
    const processo = !regras.estaAssinado(html) && regras.conferirProcesso([{ nome: 'pagina', html }])
    if (processo && !processo.certo) {
      // Botão "Editar Conteúdo" da barra do SEI, no quadro de cima (mesmo site).
      let editar = null
      try { editar = window.parent.document.querySelector('a[onclick*="editarConteudo"]') } catch (erro) {}
      const caixa = caixaEditor.criarCaixa('conferir-processo', regras.avisoDoProcesso(processo), 'Abrir o editor para corrigir')
      Object.assign(caixa.corpo.parentElement.style, { top: '16px', bottom: 'auto' })
      if (editar) caixa.botao.addEventListener('click', () => editar.click())
      else caixa.botao.replaceWith(caixaEditor.criar('p', { className: 'aviso', textContent: 'Clique em "Editar Conteúdo" na barra do SEI para corrigir.' }))
    }
  }
})()
