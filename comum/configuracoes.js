// Configurações da extensão, guardadas no navegador (D5). Toda opção nova entra em PADROES.
(function (raiz) {
  const PADROES = Object.freeze({
    // v0.6.0: data de hoje, Nato-digital e Público em todo documento externo novo
    preencherDocumentoExterno: true,
    // v0.27.0 (spec base-e-sei, etapa 2): valores do documento externo novo. Nível "publico" ou "restrito"
    // (com a hipótese legal: parte do nome dela na lista do SEI); formato "nato" ou "digitalizado" (com o
    // tipo de conferência: nome na lista do SEI; vazio = a pessoa escolhe).
    externoNivel: 'publico',
    externoHipoteseLegal: '',
    externoFormato: 'nato',
    externoConferencia: '',
    // D14: tipo pelo nome do arquivo; depois as regras da pessoa ({ contem, tipo }); depois o tipo padrão.
    externoTipoPadrao: '',
    externoRegras: Object.freeze([]),
    // D7: "Nome na Árvore" a partir do nome do arquivo. D9: "#" no nome do arquivo vira "_".
    externoNomeArvore: true,
    externoCorrigirNome: true,
    senhaReconhecidaPeloNavegador: true,
    // v0.2.0: "automatica" (só na Direção-geral, PAL/REI/IFTO), "sempre" ou "desligada"
    listaAssinaturas: 'automatica',
    // v0.10.0: SICAF automático: "automatica" (notas sem SICAF, só na CGOC), "sempre" (botão "Incluir SICAF"
    // em qualquer unidade) ou "desligada". v0.18.0: o botão "Incluir Sicaf, Consulta e Anexo" (documentos em
    // branco) saiu; o botão das notas faz tudo. "sempre" = só "Incluir SICAF" (equipe de licitação).
    incluirSicaf: 'automatica',
    // v0.18.2: cópia de cada PDF buscado na pasta Downloads (o PDF vai para o SEI de qualquer jeito).
    copiaSicaf: true,
    copiaConsulta: true,
    // v0.19.0: peças do Compras IFTO no SEI: "automatica" (só na CCL), "sempre" ou "desligada".
    comprasIfto: 'automatica',
    // v0.21.3: clicar sozinho em SerproID na entrada do Gov.br (SICAF sem login). Desligada: precisa do
    // acesso opcional à página de login do Gov.br, que a pessoa dá ao ligar a opção.
    entrarComSerproId: false,
    // v0.22.0: botão "Remover marca MINUTA" no editor dos editais: "automatica" (só na Direção-geral),
    // "sempre" ou "desligada".
    minutaEdital: 'automatica',
    // v0.24.0: no editor do SEI, recortar e colar trecho com tabela sem perder a formatação, e a caixa
    // "Margens" na janela "Propriedades da tabela". Todas as unidades e todos os tipos de documento.
    moverTabelas: true,
    margensTabela: true,
    // v0.25.0: aviso "Corrigir a numeração" quando um item de edital tem o número longo demais ("10.10.").
    numeracaoEdital: true,
    // v0.26.0 (spec conferir-documento): conferir número do processo, timbre e rodapé e dar espaço entre as
    // partes do documento (todas ligadas, D10). "unidades": "Minhas unidades" (sigla, telefone, e-mail e
    // linhas do setor no timbre), só neste navegador.
    conferirProcesso: true,
    conferirTimbre: true,
    conferirRodape: true,
    // v0.26.9 (etapa 8): data do documento ainda não assinado (mês ou ano errado, dia que não chegou, padrão).
    conferirData: true,
    espacamentoDocumento: true,
    // v0.26.1 (D15): nomes de quem assinou podem ser selecionados e copiados na página do documento.
    copiarAssinaturas: true,
    unidades: Object.freeze([])
  })

  // Junta o que o usuário gravou com os padrões; opções que não existem mais são ignoradas.
  function comPadroes (gravadas) {
    const resultado = { ...PADROES }
    for (const chave of Object.keys(PADROES)) {
      if (gravadas && chave in gravadas) resultado[chave] = gravadas[chave]
      // v0.26.0: listas são copiadas, para não mexer no padrão.
      if (Array.isArray(resultado[chave])) resultado[chave] = [...resultado[chave]]
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
