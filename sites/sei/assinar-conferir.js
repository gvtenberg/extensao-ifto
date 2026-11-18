// v0.26.3 (spec conferir-documento, D2): botão "Assinar Documento" da barra do SEI (árvore do processo).
// Antes de o SEI abrir a assinatura, lê o documento aberto no quadro ao lado; com o número do processo
// errado pergunta "Assinar mesmo assim?". "Não" abre o editor (o aviso aparece lá). Se o documento não puder
// ser lido (SEI lento, quadro ainda carregando), o SEI assina normalmente: a conferência nunca trava a assinatura.
(async function () {
  const { configuracoes, conferirDocumento: regras, janelaAssinar } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.conferirProcesso) return

  function lerDocumentoAberto () {
    try {
      const quadros = [...document.querySelectorAll('iframe')]
      const quadro = document.getElementById('ifrArvoreHtml') || quadros.find(q => /documento_visualizar/.test(q.src))
      const html = quadro && quadro.contentDocument && quadro.contentDocument.body ? quadro.contentDocument.body.innerHTML : ''
      return html ? regras.conferirProcesso([{ nome: 'pagina', html }]) : null
    } catch (erro) {
      return null
    }
  }

  let liberado = false
  document.addEventListener('click', async evento => {
    const link = evento.target && evento.target.closest && evento.target.closest('a')
    // O mesmo botão que a lista de assinaturas usa (imagem "Assinar Documento" na barra do SEI).
    const ehAssinar = link && (/assinarDocumento/.test(link.getAttribute('onclick') || '') || link.querySelector(':scope > img[title="Assinar Documento"]'))
    if (!ehAssinar || liberado) return
    const conferido = lerDocumentoAberto()
    if (!conferido || conferido.certo) return
    // Fase de captura: o SEI ainda não recebeu o clique.
    evento.preventDefault()
    evento.stopImmediatePropagation()
    const resposta = await janelaAssinar.perguntar(regras.perguntaAntesDeAssinar(conferido), [], 'Não, corrigir antes')
    if (resposta === 'assinar') {
      liberado = true
      try { link.click() } finally { liberado = false }
      return
    }
    const editar = document.querySelector('a[onclick*="editarConteudo"]')
    if (editar) editar.click()
  }, true)
})()
