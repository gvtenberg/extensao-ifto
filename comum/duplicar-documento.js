// v0.36.0 (spec duplicar-documento): regras para duplicar um documento do SEI, sem tocar na página.
(function (raiz) {
  const no = typeof module !== 'undefined' && module.exports
  const { semAcento } = no ? require('./documento-externo.js') : raiz.ExtensaoIFTO.documentoExterno
  const { numeroDoDocumento } = no ? require('./lista-direcao.js') : raiz.ExtensaoIFTO.listaDirecao

  // D5: só documentos feitos no editor do SEI, com número, em processo que tem "Incluir Documento".
  function podeDuplicar (lida, documento) {
    return Boolean(lida && lida.linkIncluir && documento && documento.feitoNoSei && !documento.semConteudo && numeroDoDocumento(documento.rotulo))
  }

  // Tipo do original na lista de "Incluir Documento": pelo id do cadastro; sem ele, pelo nome no começo do
  // rótulo da árvore (o mais comprido). Depois do nome só pode vir número: "Despacho Decisório 12" não pode
  // virar "Despacho". Sem certeza, null (D6: só avisa).
  function acharTipo (tipos, idSerie, rotulo) {
    if (idSerie) return tipos.find(tipo => tipo.id === String(idSerie)) || null
    const alvo = semAcento(rotulo)
    const achados = tipos.filter(tipo => {
      const nome = semAcento(tipo.nome)
      return alvo.startsWith(nome) && /^\s*($|[\d(]|n[º°o.]+\s*\d)/.test(alvo.slice(nome.length)) && (alvo[nome.length] === undefined || !/[a-z]/.test(alvo[nome.length]))
    })
    return achados.sort((a, b) => b.nome.length - a.nome.length)[0] || null
  }

  // Campo escondido das listas do SEI ("id±nome¥id±nome").
  function lerLista (valor) {
    return String(valor || '').split('¥').filter(Boolean).map(item => {
      const posicao = item.indexOf('±')
      return posicao < 0 ? { id: item, nome: '' } : { id: item.slice(0, posicao), nome: item.slice(posicao + 1) }
    })
  }
  const listaEmTexto = itens => itens.map(item => item.id + '±' + item.nome).join('¥')
  // D7: sem repetidos.
  const semRepetidos = itens => itens.filter((item, i) => item.id && itens.findIndex(outro => outro.id === item.id) === i)

  // D3: nível do original. "0" público, "1" restrito (com hipótese legal); sigiloso e desconhecido não são copiados.
  function nivelACopiar (cadastro) {
    if (!cadastro) return ''
    return cadastro.nivel === '0' ? 'publico' : cadastro.nivel === '1' ? 'restrito' : ''
  }

  const api = { podeDuplicar, acharTipo, lerLista, listaEmTexto, semRepetidos, nivelACopiar, numeroDoDocumento }
  if (no) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { duplicarDocumento: api })
})(globalThis)
