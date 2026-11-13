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

  // v0.8.0: lê a árvore do processo a partir do script do quadro da árvore (Nos[n] = new infraArvoreNo(...)).
  // Externo com arquivo: tem o link de baixar (documento_download_anexo) ou o ícone de PDF; feito no SEI:
  // ícone documento_interno. Externo sem nenhum dos dois = em branco (sem arquivo).
  function lerArgumentos (texto) {
    const valores = []
    const padrao = /"((?:[^"\\]|\\.)*)"|(null|true|false|-?\d+)/g
    let achado
    while ((achado = padrao.exec(texto))) valores.push(achado[1] !== undefined ? achado[1].replace(/\\(.)/g, '$1') : (achado[2] === 'null' ? null : achado[2]))
    return valores
  }
  function lerArvore (textoDoScript) {
    const texto = textoDoScript || ''
    const nos = {}
    const padraoNo = /Nos\[(\d+)\]\s*=\s*new infraArvoreNo\((.*?)\);?\s*\n/g
    let achado
    while ((achado = padraoNo.exec(texto))) {
      const [tipo, id, pai, , , rotulo, , icone] = lerArgumentos(achado[2])
      nos[achado[1]] = { tipo, id, pai, rotulo: rotulo || '', icone: icone || '', src: '' }
    }
    const padraoSrc = /Nos\[(\d+)\]\.src\s*=\s*'([^']*)'/g
    while ((achado = padraoSrc.exec(texto))) if (nos[achado[1]]) nos[achado[1]].src = achado[2]
    const lista = Object.values(nos)
    const processo = lista.find(no => no.tipo === 'PROCESSO')
    const documentos = lista.filter(no => no.tipo === 'DOCUMENTO').map(no => ({
      id: no.id,
      rotulo: no.rotulo,
      feitoNoSei: /documento_interno/.test(no.icone),
      temArquivo: /documento_download_anexo/.test(no.src) || /documento_pdf/.test(no.icone)
    }))
    return { idProcesso: processo ? processo.id : null, numero: processo ? processo.rotulo : null, documentos }
  }

  // "Sicaf (3600001)", "Sicaf 12 (3600001)": o rótulo começa com o nome do tipo.
  function ehDoTipo (rotulo, tipo) {
    const r = String(rotulo || '').trim().toLowerCase()
    const t = tipo.toLowerCase()
    return r === t || r.startsWith(t + ' ') || r.startsWith(t + '(')
  }
  function documentosEmBranco (documentos, tipos = TIPOS) {
    return (documentos || []).filter(doc => !doc.feitoNoSei && !doc.temArquivo && tipos.some(tipo => ehDoTipo(doc.rotulo, tipo)))
  }

  // Opção da lista "Tipo do Documento" pelo nome exato (sem diferença de maiúsculas e espaços).
  function acharOpcao (opcoes, nome) {
    const alvo = String(nome).trim().toLowerCase()
    return (opcoes || []).find(opcao => String(opcao.texto).trim().toLowerCase() === alvo) || null
  }

  // "Sicaf, Consulta e Anexo"
  function listaEmTexto (itens) {
    const lista = [...(itens || [])]
    if (lista.length < 2) return lista.join('')
    return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1]
  }

  // Pergunta antes de incluir, com os avisos (D5): já incluídos hoje pela extensão e documentos sem arquivo.
  function textoDaConfirmacao ({ numero, tipos = TIPOS, jaIncluidosHoje, emBranco }) {
    const linhas = [`Incluir no processo ${numero || 'aberto'} os documentos externos em branco: ${listaEmTexto(tipos)}?`,
      '(Data de hoje, Nato-digital e Público. A extensão clica em Salvar em cada um.)']
    const avisos = []
    if (jaIncluidosHoje) avisos.push('A extensão já incluiu estes documentos neste processo hoje.')
    if (emBranco && emBranco.length) avisos.push('Este processo já tem documento sem arquivo: ' + listaEmTexto(emBranco.map(doc => doc.rotulo)) + '.')
    if (avisos.length) linhas.push('', 'ATENÇÃO: ' + avisos.join(' '), 'Incluir os três mesmo assim?')
    return linhas.join('\n')
  }

  const api = { UNIDADE_CGOC, TIPOS, funcaoLigada, lerArvore, ehDoTipo, documentosEmBranco, acharOpcao, listaEmTexto, textoDaConfirmacao }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { documentosPagamento: api })
})(globalThis)
