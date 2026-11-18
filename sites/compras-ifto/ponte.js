// v0.19.0 (spec compras-ifto-no-sei): ponte na página do Compras IFTO (posta pela parte de fundo só com a
// permissão opcional dada). Avisa a página que a extensão está aqui (o Compras IFTO então mostra
// "Enviar ao SEI") e leva cada peça enviada para a lista da extensão; responde à página se deu certo.
(function () {
  if (window.top !== window || globalThis.extensaoIftoPonte) return
  globalThis.extensaoIftoPonte = true
  const navegador = globalThis.browser || globalThis.chrome
  const regras = globalThis.ExtensaoIFTO.comprasIfto
  if (!regras.ehDoCompras(location.href)) return

  const versao = navegador.runtime.getManifest().version
  const avisarPagina = mensagem => window.postMessage({ origem: 'extensao-ifto', ...mensagem }, regras.ORIGEM_COMPRAS)
  document.documentElement.setAttribute('data-extensao-ifto', versao)
  avisarPagina({ tipo: 'pronta', versao })

  window.addEventListener('message', async evento => {
    // Só a própria página do Compras IFTO (não outros quadros nem outros sites).
    if (evento.source !== window || evento.origin !== regras.ORIGEM_COMPRAS) return
    const dados = evento.data
    if (!dados || dados.origem !== 'compras-ifto') return
    if (dados.tipo === 'perguntar') { avisarPagina({ tipo: 'pronta', versao }); return }
    if (dados.tipo !== 'enviar-ao-sei') return
    const lida = regras.lerPeca(dados)
    const id = lida.peca ? lida.peca.id : (dados.peca && dados.peca.id) || ''
    if (lida.erro) { avisarPagina({ tipo: 'peca-recebida', id, ok: false, erro: lida.erro }); return }
    try {
      const resposta = await navegador.runtime.sendMessage({ tipo: 'comprasPeca', peca: lida.peca })
      if (!resposta || resposta.erro) throw new Error((resposta && resposta.erro) || 'a extensão não respondeu')
      avisarPagina({ tipo: 'peca-recebida', id, ok: true, total: resposta.total })
    } catch (erro) {
      avisarPagina({ tipo: 'peca-recebida', id, ok: false, erro: erro.message })
    }
  })
})()
