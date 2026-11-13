// v0.10.0: texto de um PDF (nota fiscal, SICAF), com o pdf.js da Mozilla (bibliotecas/pdfjs, Apache-2.0).
// Carregado só quando precisa (a primeira leitura demora um pouco). Sem "worker" separado: a página do
// SEI não deixa a extensão abrir um; o pdf.js trabalha aqui mesmo (globalThis.pdfjsWorker).
// v0.17.5: no Firefox, dentro da página do SEI o navegador bloqueia o pdf.js ("Permission denied"); lá a
// página manda o PDF para a parte de fundo da extensão (que também carrega este arquivo) e recebe o texto.
(function () {
  const ExtensaoIFTO = globalThis.ExtensaoIFTO = globalThis.ExtensaoIFTO || {}
  const navegador = globalThis.browser || globalThis.chrome
  const paginaDoFirefox = Boolean(globalThis.browser) && !/-extension:$/.test(location.protocol)
  let carregando = null

  function carregar () {
    if (!carregando) {
      carregando = (async () => {
        const endereco = arquivo => navegador.runtime.getURL('bibliotecas/pdfjs/' + arquivo)
        globalThis.pdfjsWorker = await import(endereco('pdf.worker.min.mjs'))
        const pdfjs = await import(endereco('pdf.min.mjs'))
        pdfjs.GlobalWorkerOptions.workerSrc = endereco('pdf.worker.min.mjs')
        return pdfjs
      })()
      carregando.catch(() => { carregando = null })
    }
    return carregando
  }

  // bytes: ArrayBuffer ou Uint8Array. Devolve o texto das páginas (uma linha por linha do PDF).
  // PDF só com imagem (nota escaneada) devolve texto vazio.
  async function textoDoPdf (bytes) {
    if (paginaDoFirefox) {
      const dados = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
      const resposta = await navegador.runtime.sendMessage({ tipo: 'lerPdf', bytes: dados })
      if (!resposta || typeof resposta.texto !== 'string') throw new Error((resposta && resposta.erro) || 'Sem resposta da extensão.')
      return resposta.texto
    }
    const pdfjs = await carregar()
    const dados = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes.slice(0))
    // v0.17.5: quem fecha é a tarefa de abertura (o documento não tem "destroy" no pdf.js 6; antes toda
    // leitura terminava em erro, mesmo com o texto lido).
    const tarefa = pdfjs.getDocument({ data: dados, isEvalSupported: false, disableFontFace: true, useSystemFonts: false, stopAtErrors: false })
    let texto = ''
    try {
      const documento = await tarefa.promise
      for (let numero = 1; numero <= Math.min(documento.numPages, 10); numero++) {
        const pagina = await documento.getPage(numero)
        const conteudo = await pagina.getTextContent()
        texto += conteudo.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join('') + '\n'
      }
    } finally {
      tarefa.destroy().catch(() => {})
    }
    return texto
  }

  ExtensaoIFTO.pdfTexto = { textoDoPdf }
})()
