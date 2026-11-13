// Configurações da extensão, guardadas no navegador (D5). Toda opção nova entra em PADROES.
(function (raiz) {
  const PADROES = Object.freeze({
    // v0.6.0: data de hoje, Nato-digital e Público em todo documento externo novo
    preencherDocumentoExterno: true,
    senhaReconhecidaPeloNavegador: true,
    // v0.2.0: "automatica" (só na Direção-geral, PAL/REI/IFTO), "sempre" ou "desligada"
    listaAssinaturas: 'automatica',
    // v0.10.0: SICAF automático: "automatica" (notas sem SICAF, só na CGOC), "sempre" (botão "Incluir SICAF"
    // em qualquer unidade) ou "desligada". v0.18.0: o botão "Incluir Sicaf, Consulta e Anexo" (documentos em
    // branco) saiu; o botão das notas faz tudo. "sempre" = só "Incluir SICAF" (equipe de licitação).
    incluirSicaf: 'automatica',
    // v0.18.2: cópia de cada PDF buscado na pasta Downloads (o PDF vai para o SEI de qualquer jeito).
    copiaSicaf: true,
    copiaConsulta: true
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
