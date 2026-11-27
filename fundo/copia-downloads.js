// v0.38.0 (saiu de fundo.js): cópia dos PDFs na pasta Downloads, só com a opção ligada nas configurações.
// v0.18.2: cópia em Downloads só com a opção ligada nas configurações (uma para cada documento).
async function salvarSeConfigurado (opcao, base64, nomeDoArquivo) {
  const configuracoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  return configuracoes[opcao] ? salvarEmDownloads(base64, nomeDoArquivo) : false
}
async function salvarEmDownloads (base64, nomeDoArquivo) {
  try {
    // Firefox (página de fundo): endereço "blob"; Chrome (service worker): endereço "data".
    const url = typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(new Blob([regras.deBase64(base64)], { type: 'application/pdf' }))
      : 'data:application/pdf;base64,' + base64
    await navegador.downloads.download({ url, filename: nomeDoArquivo, saveAs: false, conflictAction: 'uniquify' })
    return true
  } catch (erro) {
    return false
    // Sem salvar em Downloads, o PDF ainda vai para o SEI.
  }
}
