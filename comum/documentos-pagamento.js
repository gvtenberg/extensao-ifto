// v0.7.0: documentos do pagamento (spec documentos-pagamento): Sicaf, Consulta e Anexo em branco, para a CGOC.
(function (raiz) {
  const UNIDADE_CGOC = 'CGOC/GAC/DAP/PAL/REI/IFTO'
  // Ordem em que os documentos externos são incluídos (nomes da lista "Tipo do Documento" do SEI).
  const TIPOS = Object.freeze(['Sicaf', 'Consulta', 'Anexo'])

  // "automatica": só na CGOC; "sempre": qualquer unidade; "desligada": nunca.
  function funcaoLigada (opcao, unidade) {
    if (opcao === 'sempre') return true
    if (opcao === 'desligada') return false
    return String(unidade || '').trim().toUpperCase() === UNIDADE_CGOC
  }

  const api = { UNIDADE_CGOC, TIPOS, funcaoLigada }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { documentosPagamento: api })
})(globalThis)
