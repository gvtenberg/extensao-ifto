// v0.7.0: documentos do pagamento (spec documentos-pagamento): Sicaf, Consulta e Anexo em branco, para a CGOC.
(function (raiz) {
  // v0.9.2: a leitura da árvore do processo é a mesma da lista de assinaturas (comum/sei.js).
  const { lerArvore, ligadaNaUnidade } = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  const UNIDADE_CGOC = 'CGOC/GAC/DAP/PAL/REI/IFTO'
  // Ordem em que os documentos externos são incluídos (nomes da lista "Tipo do Documento" do SEI).
  const TIPOS = Object.freeze(['Sicaf', 'Consulta', 'Anexo'])

  // "automatica": só na CGOC; "sempre": qualquer unidade; "desligada": nunca.
  function funcaoLigada (opcao, unidade) {
    return ligadaNaUnidade(opcao, unidade, UNIDADE_CGOC)
  }

  // "Sicaf (3600001)", "Sicaf 12 (3600001)": o rótulo começa com o nome do tipo.
  function ehDoTipo (rotulo, tipo) {
    const r = String(rotulo || '').trim().toLowerCase()
    const t = tipo.toLowerCase()
    return r === t || r.startsWith(t + ' ') || r.startsWith(t + '(')
  }
  function documentosEmBranco (documentos, tipos = TIPOS) {
    return (documentos || []).filter(doc => !doc.temArquivo && (doc.semConteudo || !doc.feitoNoSei) && tipos.some(tipo => ehDoTipo(doc.rotulo, tipo)))
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

  // Pergunta antes de incluir, com os avisos (D5). v0.9.0: texto curto e direto (decisão D9).
  function textoDaConfirmacao ({ tipos = TIPOS, jaIncluidosHoje, emBranco }) {
    const lista = listaEmTexto(tipos)
    const tiposEmBranco = tipos.filter(tipo => (emBranco || []).some(doc => ehDoTipo(doc.rotulo, tipo)))
    let aviso = ''
    if (tiposEmBranco.length) aviso = `Este processo já tem ${listaEmTexto(tiposEmBranco)} sem arquivo.`
    else if (jaIncluidosHoje) aviso = `${lista} já foram incluídos hoje pela extensão.`
    if (!aviso) return `Incluir ${lista} neste processo?`
    return aviso + (tipos.length === 3 ? ' Incluir mais três?' : ' Incluir mesmo assim?')
  }

  // v0.9.0: envio direto ao SEI (decisão D8). O SEI é ISO-8859-1: o corpo do formulário vai codificado
  // como o navegador faria (letra fora do latim-1 vira &#código;).
  function codificarLatin1 (texto) {
    let saida = ''
    for (const letra of String(texto == null ? '' : texto)) {
      const codigo = letra.codePointAt(0)
      if (/[A-Za-z0-9*\-._]/.test(letra)) saida += letra
      else if (letra === ' ') saida += '+'
      else if (codigo < 256) saida += '%' + codigo.toString(16).toUpperCase().padStart(2, '0')
      else saida += codificarLatin1('&#' + codigo + ';')
    }
    return saida
  }
  // campos: lista de [nome, valor] (a ordem do formulário).
  function montarCorpo (campos) {
    return campos.map(([nome, valor]) => codificarLatin1(nome) + '=' + codificarLatin1(valor)).join('&')
  }
  // Troca valores (todos os campos com o nome) ou acrescenta no fim.
  function trocarCampos (campos, novos) {
    const resultado = campos.filter(([nome]) => !(nome in novos))
    for (const [nome, valor] of Object.entries(novos)) if (valor !== undefined) resultado.push([nome, valor])
    return resultado
  }
  // Mensagem de erro que o SEI mostra na página devolvida (quadro de exceção), sem as marcas do HTML.
  function mensagemDoSei (html) {
    const achado = /id="divInfraExcecao"[^>]*>([\s\S]*?)<\/div>/i.exec(html || '')
    if (!achado) return ''
    return achado[1].replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const api = { UNIDADE_CGOC, TIPOS, funcaoLigada, lerArvore, ehDoTipo, documentosEmBranco, acharOpcao, listaEmTexto, textoDaConfirmacao, codificarLatin1, montarCorpo, trocarCampos, mensagemDoSei }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { documentosPagamento: api })
})(globalThis)
