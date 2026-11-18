// v0.19.0 (spec compras-ifto-no-sei): regras puras da ida das peças do Compras IFTO para o SEI, sem depender
// da página (testáveis no computador): endereço do Compras IFTO, conferência da mensagem que a página manda,
// lista de peças esperando, sugestão do tipo de documento do SEI, NUP, documento repetido e limpeza do HTML.
(function (raiz) {
  // D10: só o endereço do Render (permissão opcional, pedida nas configurações).
  const ORIGEM_COMPRAS = 'https://compras-ifto-teste-v1-mbro.onrender.com'
  const ORIGENS_COMPRAS = [ORIGEM_COMPRAS + '/*']
  // D7: "Automática" liga a função só nesta unidade (equipe de licitação).
  const UNIDADE_CCL = 'CCL/GAC/DAP/PAL/REI/IFTO'
  // Limites: a minuta da AGU tem até 350 KB; a lista fica no navegador (storage.local).
  const MAXIMO_HTML = 1500000
  const MAXIMO_PECAS = 20

  const ehDoCompras = endereco => {
    try { return new URL(endereco).origin === ORIGEM_COMPRAS } catch (erro) { return false }
  }

  function funcaoLigada (opcao, unidadeAberta) {
    if (opcao === 'sempre') return true
    if (opcao === 'desligada') return false
    return String(unidadeAberta || '').trim().toUpperCase() === UNIDADE_CCL
  }

  const textoCurto = (valor, maximo) => typeof valor === 'string' ? valor.trim().slice(0, maximo) : ''

  // Mensagem da página do Compras IFTO: { origem: 'compras-ifto', tipo: 'enviar-ao-sei', peca: {...} }.
  // Devolve { peca } com só os campos esperados, ou { erro } (o resto é ignorado).
  function lerPeca (mensagem) {
    if (!mensagem || typeof mensagem !== 'object' || mensagem.origem !== 'compras-ifto' || mensagem.tipo !== 'enviar-ao-sei') return { erro: 'mensagem desconhecida' }
    const peca = mensagem.peca
    if (!peca || typeof peca !== 'object') return { erro: 'peça vazia' }
    if (typeof peca.html !== 'string' || !peca.html.trim()) return { erro: 'a peça não tem texto' }
    if (peca.html.length > MAXIMO_HTML) return { erro: 'a peça é grande demais para enviar' }
    const titulo = textoCurto(peca.titulo, 200)
    if (!titulo) return { erro: 'a peça não tem título' }
    return {
      peca: {
        id: textoCurto(peca.id, 120) || titulo,
        titulo,
        fase: textoCurto(peca.fase, 120),
        processo: textoCurto(peca.processo, 60),
        nup: textoCurto(peca.nup, 40),
        objeto: textoCurto(peca.objeto, 300),
        html: peca.html
      }
    }
  }

  // D8: lista de peças. A mesma peça (mesmo id: processo e fase do Compras) enviada de novo troca a antiga
  // (fica o texto mais novo); a mais nova vem primeiro; no máximo 20.
  function juntarPeca (lista, peca, agora) {
    const outras = (lista || []).filter(item => item.id !== peca.id)
    return [{ ...peca, chegou: agora }, ...outras].slice(0, MAXIMO_PECAS)
  }
  const tirarPeca = (lista, id) => (lista || []).filter(item => item.id !== id)

  // Texto comparável: sem acento, minúsculo, só letras e números.
  const PALAVRAS_VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'para', 'ao', 'aos', 'na', 'no', 'em', 'com', 'por'])
  function palavras (texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .split(/[^a-z0-9]+/).filter(palavra => palavra && !PALAVRAS_VAZIAS.has(palavra))
  }

  // D4: tipo do SEI mais parecido com o nome da fase ou o título da peça. Nota: fração das palavras do tipo
  // que aparecem no nome (todas = 1) menos um pouco pelas palavras do nome que faltam no tipo. Abaixo de
  // metade, não sugere (a pessoa escolhe).
  function notaDoTipo (nomeDoTipo, nomes) {
    const doTipo = palavras(nomeDoTipo)
    if (!doTipo.length) return 0
    let melhor = 0
    for (const nome of nomes) {
      const doNome = palavras(nome)
      if (!doNome.length) continue
      const comuns = doTipo.filter(palavra => doNome.includes(palavra)).length
      if (!comuns) continue
      const nota = comuns / doTipo.length - 0.1 * (doNome.length - comuns) / doNome.length
      if (nota > melhor) melhor = nota
    }
    return melhor
  }
  function sugerirTipo (tipos, nomes) {
    let escolhido = null
    let melhorNota = 0.5
    for (const tipo of tipos || []) {
      const nota = notaDoTipo(tipo.nome, (nomes || []).filter(Boolean))
      if (nota > melhorNota || (nota === melhorNota && escolhido && tipo.nome.length < escolhido.nome.length)) {
        escolhido = tipo
        melhorNota = nota
      }
    }
    return escolhido
  }

  // Entidades do HTML do SEI (&ecirc;, &#231;…) viram letras.
  const ACENTOS = { acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧' }
  function decodificar (texto) {
    return String(texto || '')
      .replace(/&([a-zA-Z])(acute|grave|circ|tilde|uml|cedil);/g, (todo, letra, acento) => (letra + ACENTOS[acento]).normalize('NFC'))
      .replace(/&#x([0-9a-f]+);/gi, (todo, numero) => String.fromCodePoint(parseInt(numero, 16)))
      .replace(/&#(\d+);/g, (todo, numero) => String.fromCodePoint(Number(numero)))
      .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  }

  // Tipos de documento da página "Incluir Documento" do SEI: escolher(<id>) seguido do nome. O externo
  // (escolher(-1)) fica de fora; cada id uma vez, em ordem alfabética.
  function lerTipos (html) {
    const tipos = new Map()
    const padrao = /escolher\((\d+)\)[^>]*>([\s\S]*?)<\/a>/g
    let achado
    while ((achado = padrao.exec(html || ''))) {
      const nome = decodificar(achado[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
      if (nome && !tipos.has(achado[1])) tipos.set(achado[1], { id: achado[1], nome })
    }
    return [...tipos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }

  // D5: NUP da peça × número do processo aberto no SEI (só os dígitos contam).
  function compararNup (nupDaPeca, numeroDoSei) {
    const a = String(nupDaPeca || '').replace(/\D/g, '')
    const b = String(numeroDoSei || '').replace(/\D/g, '')
    if (!a || !b) return 'sem'
    return a === b ? 'igual' : 'diferente'
  }

  // D9: documento do mesmo tipo já no processo. criadosHoje: o que a extensão criou hoje
  // [{ idProcesso, idTipo, data }]; documentos: árvore (rótulo começa pelo nome do tipo).
  function repetidos ({ documentos, criados, idProcesso, tipo, hoje }) {
    const nomeDoTipo = palavras(tipo.nome).join(' ')
    const naArvore = (documentos || []).filter(doc => palavras(doc.rotulo).join(' ').startsWith(nomeDoTipo)).length
    const hojeAqui = (criados || []).filter(item => item.idProcesso === idProcesso && item.idTipo === tipo.id && item.data === hoje).length
    return { naArvore, hojeAqui }
  }
  // Memória do que foi criado: só os de hoje ficam.
  const lembrarCriado = (criados, item) => [...(criados || []).filter(antigo => antigo.data === item.data), item]

  // Limpeza do HTML que vai para o SEI: só marcas e estilos de texto comuns (o editor do SEI também limpa,
  // mas nada de script ou evento vindo de outro site chega à página do SEI).
  const MARCAS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub', 'span', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'blockquote'])
  const ATRIBUTOS = new Set(['class', 'style', 'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing', 'href', 'width'])
  const ESTILOS = new Set(['text-align', 'text-indent', 'margin-left', 'font-weight', 'font-style', 'text-decoration', 'color', 'background-color', 'border-collapse', 'width'])
  function filtrarEstilo (estilo) {
    return String(estilo || '').split(';').map(parte => {
      const posicao = parte.indexOf(':')
      if (posicao < 0) return ''
      const nome = parte.slice(0, posicao).trim().toLowerCase()
      const valor = parte.slice(posicao + 1).trim()
      if (!ESTILOS.has(nome) || !/^[#%.,()\w\s-]+$/.test(valor) || /expression|url/i.test(valor)) return ''
      return nome + ':' + valor
    }).filter(Boolean).join(';')
  }
  function atributoPermitido (marca, nome, valor) {
    if (!ATRIBUTOS.has(nome)) return null
    if (nome === 'style') return filtrarEstilo(valor) || null
    if (nome === 'href') return marca === 'a' && /^https?:\/\//i.test(String(valor).trim()) ? String(valor).trim() : null
    return String(valor)
  }
  // Percorre o documento lido pelo navegador (DOMParser) e devolve o HTML limpo.
  function limparHtml (documento) {
    const escapar = texto => String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const escaparAtributo = texto => escapar(texto).replace(/"/g, '&quot;')
    function noParaHtml (no) {
      if (no.nodeType === 3) return escapar(no.nodeValue)
      if (no.nodeType !== 1) return ''
      const marca = no.tagName.toLowerCase()
      if (['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript'].includes(marca)) return ''
      const filhos = [...no.childNodes].map(noParaHtml).join('')
      if (!MARCAS.has(marca)) return filhos
      const atributos = [...no.attributes].map(({ name, value }) => {
        const permitido = atributoPermitido(marca, name.toLowerCase(), value)
        return permitido === null ? '' : ` ${name.toLowerCase()}="${escaparAtributo(permitido)}"`
      }).join('')
      return marca === 'br' ? '<br>' : `<${marca}${atributos}>${filhos}</${marca}>`
    }
    return [...documento.body.childNodes].map(noParaHtml).join('').trim()
  }

  // v0.20.0: links do documento na página que o SEI devolve depois de criar (ou na página dele na árvore):
  // editor (editor_montar), texto (documento_visualizar) e o número interno (id_documento).
  function linksDoDocumento (html, endereco) {
    const achar = acao => {
      const achado = new RegExp('controlador\\.php\\?acao=' + acao + '[^"\'\\s<>\\\\]*').exec(html || '')
      return achado ? achado[0].replace(/&amp;/g, '&') : ''
    }
    const urlEditor = achar('editor_montar')
    const linkVer = achar('documento_visualizar')
    const id = texto => (/[?&]id_documento=(\d+)/.exec(texto || '') || [])[1] || ''
    return { urlEditor, linkVer, idDocumento: id(urlEditor) || id(linkVer) || id(endereco) }
  }

  // Trecho do começo do texto, para conferir depois que o SEI salvou (comparado sem espaços nem acentos).
  const trechoParaConferir = texto => palavras(texto).slice(0, 12).join(' ')
  const contemTrecho = (texto, trecho) => !trecho || palavras(decodificar(String(texto || '').replace(/<[^>]*>/g, ' '))).join(' ').includes(trecho)

  const api = {
    ORIGEM_COMPRAS, ORIGENS_COMPRAS, UNIDADE_CCL, MAXIMO_HTML, MAXIMO_PECAS,
    ehDoCompras, funcaoLigada, decodificar, lerPeca, juntarPeca, tirarPeca, palavras, sugerirTipo, lerTipos, compararNup,
    repetidos, lembrarCriado, linksDoDocumento, filtrarEstilo, atributoPermitido, limparHtml, trechoParaConferir, contemTrecho
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { comprasIfto: api })
})(globalThis)
