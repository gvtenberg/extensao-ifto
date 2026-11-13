// Configurações da extensão, guardadas no navegador (D5). Toda opção nova entra em PADROES.
(function (raiz) {
  const PADROES = Object.freeze({
    // v0.6.0: data de hoje, Nato-digital e Público em todo documento externo novo
    preencherDocumentoExterno: true,
    senhaReconhecidaPeloNavegador: true,
    // v0.2.0: "automatica" (só na Direção-geral, PAL/REI/IFTO), "sempre" ou "desligada"
    listaAssinaturas: 'automatica',
    // v0.7.0: botão "Incluir Sicaf, Consulta e Anexo": "automatica" (só na CGOC), "sempre" ou "desligada"
    documentosPagamento: 'automatica'
  })

  // Junta o que o usuário gravou com os padrões; opções que não existem mais são ignoradas.
  function comPadroes (gravadas) {
    const resultado = { ...PADROES }
    for (const chave of Object.keys(PADROES)) {
      if (gravadas && chave in gravadas) resultado[chave] = gravadas[chave]
    }
    return resultado
  }

  // Leitura e gravação no navegador (só existe dentro da extensão; Chrome usa "chrome").
  const navegador = () => raiz.browser || raiz.chrome
  async function lerConfiguracoes () {
    const { configuracoes } = await navegador().storage.local.get('configuracoes')
    return comPadroes(configuracoes)
  }
  async function gravarConfiguracoes (configuracoes) {
    await navegador().storage.local.set({ configuracoes: comPadroes(configuracoes) })
  }

  const api = { PADROES, comPadroes, lerConfiguracoes, gravarConfiguracoes }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { configuracoes: api })
})(globalThis)
