// v0.10.0: texto de um PDF (nota fiscal, SICAF), com o pdf.js da Mozilla (bibliotecas/pdfjs, Apache-2.0).
// Carregado só quando precisa (a primeira leitura demora um pouco). Sem "worker" separado: a página do
// SEI não deixa a extensão abrir um; o pdf.js trabalha aqui mesmo (globalThis.pdfjsWorker).
(function () {
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
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
    const pdfjs = await carregar()
    const dados = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes.slice(0))
    const documento = await pdfjs.getDocument({ data: dados, isEvalSupported: false, disableFontFace: true, useSystemFonts: false, stopAtErrors: false }).promise
    let texto = ''
    try {
      for (let numero = 1; numero <= Math.min(documento.numPages, 10); numero++) {
        const pagina = await documento.getPage(numero)
        const conteudo = await pagina.getTextContent()
        texto += conteudo.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join('') + '\n'
      }
    } finally {
      documento.destroy()
    }
    return texto
  }

  ExtensaoIFTO.pdfTexto = { textoDoPdf }
})()
