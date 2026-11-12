// v0.1.3: procurar atualização na hora (o Firefox só confere uma vez por dia e não deixa a extensão pedir
// a conferência). A janela do ícone lê a última Release do GitHub e oferece o .xpi assinado.
(function (raiz) {
  const REPOSITORIO = 'gvtenberg/extensao-ifto'
  const ENDERECO_ULTIMA_RELEASE = `https://api.github.com/repos/${REPOSITORIO}/releases/latest`
  const ENDERECO_ANDAMENTO = `https://github.com/${REPOSITORIO}/actions`

  // Compara "0.1.10" com "0.1.9" número a número: positivo se a for mais nova.
  function compararVersoes (a, b) {
    const pa = String(a).split('.').map(Number)
    const pb = String(b).split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diferenca = (pa[i] || 0) - (pb[i] || 0)
      if (diferenca) return diferenca
    }
    return 0
  }

  // Da resposta do GitHub: versão (tag "v0.1.3") e o link do .xpi; null se a Release não tiver .xpi.
  function lerRelease (release) {
    if (!release || !release.tag_name) return null
    const xpi = (release.assets || []).find(a => /\.xpi$/i.test(a.name))
    if (!xpi) return null
    return { versao: release.tag_name.replace(/^v/i, ''), link: xpi.browser_download_url }
  }

  const api = { REPOSITORIO, ENDERECO_ULTIMA_RELEASE, ENDERECO_ANDAMENTO, compararVersoes, lerRelease }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { atualizacao: api })
})(globalThis)
