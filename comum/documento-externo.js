// v0.6.0: regras do documento externo do SEI (spec documentos-pagamento), sem depender da página.
(function (raiz) {
  // Documento externo NOVO: página "documento_receber". O que já existe (com ou sem arquivo) abre em
  // "documento_alterar_recebido" e nunca é alterado pela extensão.
  function ehDocumentoExternoNovo (endereco) {
    let acao
    try { acao = new URL(endereco, 'https://sei.ifto.edu.br/').searchParams.get('acao') } catch (erro) { return false }
    return acao === 'documento_receber'
  }

  // Data no formato do SEI: dd/mm/aaaa.
  function dataDeHoje (agora = new Date()) {
    const dois = n => String(n).padStart(2, '0')
    return `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)}/${agora.getFullYear()}`
  }

  // O que falta preencher, a partir do estado dos campos (só os vazios ou sem marcação).
  function oQuePreencher ({ data, formatoMarcado, nivelMarcado }) {
    return {
      data: !String(data || '').trim(),
      formato: !formatoMarcado,
      nivel: !nivelMarcado
    }
  }

  const api = { ehDocumentoExternoNovo, dataDeHoje, oQuePreencher }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { documentoExterno: api })
})(globalThis)
