// v0.26.3 (spec conferir-documento, D2): botão "Assinar Documento" da barra do SEI (árvore do processo).
// Antes de o SEI abrir a assinatura, lê o documento aberto no quadro ao lado; com o número do processo
// errado (v0.26.9: ou a data errada) pergunta "Assinar mesmo assim?". "Não" abre o editor (o aviso aparece lá). Se o documento não puder
// ser lido (SEI lento, quadro ainda carregando), o SEI assina normalmente: a conferência nunca trava a assinatura.
(async function () {
  const { configuracoes, conferirDocumento: regras, janelaAssinar } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.conferirProcesso && !opcoes.conferirData) return
  // v0.26.6: as listas do Bloco de assinatura têm a sua própria conferência (sites/sei/bloco-assinatura.js).
  if (/[?&]acao=(bloco_assinatura_listar|rel_bloco_protocolo_listar)/.test(location.href)) return

  // v0.26.4: documentos que a pessoa já mandou "Assinar mesmo assim" na janela da lista de assinaturas (no
  // dia) não perguntam de novo. Lido antes, porque o clique precisa ser parado na hora.
  const navegador = globalThis.browser || globalThis.chrome
  let aceitos = null
  const lerAceitos = () => navegador.storage.local.get('assinarAceitos').then(r => { aceitos = r.assinarAceitos || null }).catch(() => {})
  lerAceitos()
  navegador.storage.onChanged.addListener(mudou => { if (mudou.assinarAceitos) lerAceitos() })

  function lerDocumentoAberto () {
    try {
      const quadros = [...document.querySelectorAll('iframe')]
      // v0.26.6: ifrSeiConteudo = documento aberto pelo número no Bloco de assinatura (bloco_navegar).
      const quadro = document.getElementById('ifrArvoreHtml') || document.getElementById('ifrSeiConteudo') || quadros.find(q => /documento_visualizar/.test(q.src))
      const html = quadro && quadro.contentDocument && quadro.contentDocument.body ? quadro.contentDocument.body.innerHTML : ''
      if (!html || regras.foiAceito(aceitos, regras.numeroSeiDoDocumento(html), new Date())) return null
      return regras.problemasParaAssinar(html, opcoes, new Date())
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
    const problemas = lerDocumentoAberto()
    if (!problemas || !problemas.length) return
    // Fase de captura: o SEI ainda não recebeu o clique.
    evento.preventDefault()
    evento.stopImmediatePropagation()
    const resposta = await janelaAssinar.perguntar(regras.perguntaAntesDeAssinar(problemas), problemas, 'Não, corrigir antes')
    if (resposta === 'assinar') {
      liberado = true
      try { link.click() } finally { liberado = false }
      return
    }
    // v0.26.4: a lista de assinaturas ("Assinar e próximo") deixa de esperar por esta assinatura.
    try { window.top.postMessage({ extensaoIfto: 'assinar-recusado' }, location.origin) } catch (erro) {}
    const editar = document.querySelector('a[onclick*="editarConteudo"]')
    if (editar) editar.click()
  }, true)
})()
