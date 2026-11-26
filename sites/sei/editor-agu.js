// v0.38.0 (spec remover-formatacao-agu): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca com
// scripting.executeScript, world MAIN, junto com comum/formatacao-agu.js, sites/sei/editor-numeracao.js e
// sites/sei/editor-caixas.js, de onde vêm acharEditor, as partes editáveis e o destaque). Acha as marcas que a
// AGU deixa (texto riscado, colorido, branco, marcado, "Justificativa Modificação Item(ns)", marcas de comentário
// do Word e os balões de comentário do SEI) e tira só o que a pessoa deixou marcado na lista, no modelo do
// editor, numa mudança só (um Ctrl+Z desfaz). Nunca salva: os balões só saem do SEI no Salvar (D7, 26/11/2026:
// o editor não tem endereço próprio para apagar comentário; eles vão junto com o texto).
(function (raiz) {
  const regras = () => raiz.ExtensaoIFTO.formatacaoAgu
  const caixas = () => raiz.ExtensaoIFTO.editorCaixas
  const GRUPOS = ['cores', 'brancos', 'marcas', 'word']
  let editorPreparado = null
  let lista = null

  async function editor () {
    if (editorPreparado) return editorPreparado
    editorPreparado = await raiz.ExtensaoIFTO.editorNumeracao.acharEditor()
    return editorPreparado
  }

  const ehTexto = no => no.is('$text') || no.is('$textProxy')
  const celulaComFundo = bloco => {
    const celula = bloco.findAncestor && bloco.findAncestor('tableCell')
    return Boolean(celula && [...celula.getAttributeKeys()].some(chave => /background/i.test(chave)))
  }

  // Blocos de texto (parágrafos, títulos, células) das partes que a pessoa pode editar, na ordem do documento.
  function blocos (ed) {
    const achados = []
    for (const nome of caixas().raizesEditaveis(ed)) {
      for (const { item } of ed.model.createRangeIn(ed.model.document.getRoot(nome))) {
        if (item.is('element') && ed.model.schema.checkChild(item, '$text')) achados.push(item)
      }
    }
    return achados
  }

  // Pedaços do bloco com a posição de cada um (os objetos contam 1, como no modelo).
  function pedacos (bloco) {
    return [...bloco.getChildren()].map(filho => ({
      no: filho,
      inicio: filho.startOffset,
      fim: filho.startOffset + filho.offsetSize,
      texto: ehTexto(filho) ? filho.data : regras().OBJETO,
      ehTexto: ehTexto(filho)
    }))
  }

  // D9 (26/11/2026): texto branco é invisível e sai; numa célula ou com fundo colorido ele aparece: fica.
  const ehBranco = (bloco, p) => p.ehTexto && regras().tipoDaCor(p.no.getAttribute('fontColor')) === 'branca' &&
    !p.no.hasAttribute('fontBackgroundColor') && !celulaComFundo(bloco) && !p.no.hasAttribute('strikethrough')

  // Trechos riscados seguidos viram um só (o riscado pode vir em vários pedaços, com negrito no meio).
  function riscadosDoBloco (p) {
    const trechos = []
    for (const pedaco of p) {
      if (!pedaco.ehTexto || !pedaco.no.hasAttribute('strikethrough')) continue
      const ultimo = trechos[trechos.length - 1]
      if (ultimo && ultimo.fim === pedaco.inicio) ultimo.fim = pedaco.fim
      else trechos.push({ inicio: pedaco.inicio, fim: pedaco.fim })
    }
    return trechos
  }

  function linksDoWord (p) {
    const r = regras()
    const trechos = []
    for (const pedaco of p) {
      if (!pedaco.ehTexto || !r.ehLinkComentarioWord(pedaco.no.getAttribute('linkHref'))) continue
      const ultimo = trechos[trechos.length - 1]
      if (ultimo && ultimo.fim === pedaco.inicio) { ultimo.fim = pedaco.fim; ultimo.texto += pedaco.texto } else trechos.push({ inicio: pedaco.inicio, fim: pedaco.fim, texto: pedaco.texto })
    }
    return trechos
  }

  // Balões de comentário do SEI (plugin Comentario: marcadores "comentario:<id>").
  function baloes (ed) {
    if (!ed.plugins.has('ComentarioEditing')) return []
    const dados = ed.plugins.get('ComentarioEditing').constructor.comments
    return [...ed.model.markers.getMarkersGroup('comentario')].map(marcador => {
      const id = marcador.name.split(':')[1]
      const dado = (dados && dados.get && dados.get(id)) || {}
      const conteudo = typeof dado.content === 'string' ? dado.content.replace(/<[^>]*>/g, ' ') : ''
      // O SEI só deixa apagar o comentário de quem pode editá-lo ("remove"); os outros ficam na lista, apagados.
      const podeApagar = Array.isArray(dado.capabilities) && dado.capabilities.includes('remove')
      return { id, marcador, podeApagar, autor: String(dado.authorName || ''), texto: conteudo.replace(/\s+/g, ' ').trim() }
    })
  }

  // Tudo o que pode sair, com um id por linha da lista. "assinatura" confere, no clique, que o texto não mudou.
  function mapear (ed) {
    const r = regras()
    const mapa = { itens: new Map(), grupos: { cores: [], pretas: [], brancos: [], marcas: [], word: [] }, blocos: [] }
    let n = 0
    for (const bloco of blocos(ed)) {
      const p = pedacos(bloco)
      const texto = p.map(pedaco => pedaco.texto).join('')
      if (r.ehJustificativa(texto)) {
        mapa.itens.set('j' + (++n), { tipo: 'justificativa', bloco, assinatura: texto })
        continue
      }
      const registro = { bloco, riscados: [], brancos: [], word: [] }
      for (const trecho of riscadosDoBloco(p)) {
        const id = 'r' + (++n)
        const item = { tipo: 'riscado', bloco, ...trecho, assinatura: texto.slice(trecho.inicio, trecho.fim), antes: texto.slice(0, trecho.inicio), depois: texto.slice(trecho.fim) }
        mapa.itens.set(id, item)
        registro.riscados.push(id)
      }
      for (const pedaco of p) {
        if (!pedaco.ehTexto) continue
        if (ehBranco(bloco, pedaco) && pedaco.texto.trim()) registro.brancos.push(pedaco)
        else if (pedaco.no.hasAttribute('fontColor') && !pedaco.no.hasAttribute('linkHref')) {
          // D5: a cor sai de todo texto (links ficam); só a colorida conta na lista. Branca que fica (célula com
          // fundo) continua branca.
          const tipo = r.tipoDaCor(pedaco.no.getAttribute('fontColor'))
          if (tipo !== 'branca') mapa.grupos[tipo === 'colorida' ? 'cores' : 'pretas'].push({ bloco, pedaco })
        }
        if (pedaco.no.hasAttribute('fontBackgroundColor') || pedaco.no.hasAttribute('htmlMark')) mapa.grupos.marcas.push({ bloco, pedaco })
      }
      for (const trecho of linksDoWord(p)) registro.word.push(trecho)
      mapa.grupos.brancos.push(...registro.brancos.map(pedaco => ({ bloco, pedaco })))
      mapa.grupos.word.push(...registro.word.map(trecho => ({ bloco, trecho })))
      mapa.blocos.push(registro)
    }
    for (const balao of baloes(ed)) mapa.itens.set('b' + balao.id, { tipo: 'balao', ...balao, assinatura: balao.id })
    return mapa
  }

  function contar (mapa) {
    const tipos = { riscado: 0, justificativa: 0, balao: 0 }
    for (const item of mapa.itens.values()) if (item.tipo !== 'balao' || item.podeApagar) tipos[item.tipo] += 1
    return { ...tipos, cores: mapa.grupos.cores.length, brancos: mapa.grupos.brancos.length, marcas: mapa.grupos.marcas.length, word: mapa.grupos.word.length }
  }

  function avisar (resultado) {
    raiz.postMessage({ extensaoIftoAgu: true, ...resultado }, raiz.location.origin)
  }

  async function preparar () {
    try {
      const ed = await editor()
      if (!ed) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      if (!ed.__extensaoIftoAgu) {
        ed.__extensaoIftoAgu = true
        let espera = null
        ed.model.document.on('change', () => {
          clearTimeout(espera)
          espera = setTimeout(() => { try { avisar(contar(mapear(ed))) } catch (erro) { console.warn('extensao-ifto: formatação da AGU', erro) } }, 1500)
        })
      }
      const resultado = contar(mapear(ed))
      avisar(resultado)
      return { ok: true, erro: '', ...resultado }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Linhas da lista de revisão (D8): cada trecho riscado, cada "Justificativa…", cada balão; os outros em grupo.
  async function listar () {
    try {
      const ed = await editor()
      if (!ed) return { ok: false, erro: 'Não achei o editor do SEI.' }
      lista = mapear(ed)
      const r = regras()
      const itens = []
      for (const [id, item] of lista.itens) {
        if (item.tipo === 'riscado') {
          const volta = r.trechoComVolta(item.antes, item.assinatura, item.depois)
          const vazio = r.ficouSemTexto(item.antes + item.depois)
          itens.push({ id, tipo: item.tipo, texto: volta.riscado, detalhe: vazio ? 'O parágrafo inteiro sai.' : `Fica: ${volta.antes}${volta.depois}`.replace(/\s+/g, ' ') })
        } else if (item.tipo === 'justificativa') {
          itens.push({ id, tipo: item.tipo, texto: item.assinatura.replace(/\s+/g, ' ').trim(), detalhe: 'O parágrafo sai.' })
        } else {
          const quem = item.autor ? 'Comentário de ' + item.autor : 'Comentário'
          itens.push({ id, tipo: item.tipo, texto: item.texto || '(comentário sem texto)', detalhe: item.podeApagar ? quem : quem + ': o SEI só deixa apagar quem escreveu.', desligado: !item.podeApagar })
        }
      }
      return { ok: true, erro: '', itens, ...contar(lista) }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  async function irPara (id) {
    try {
      const ed = await editor()
      if (!ed || !lista) return { ok: false, erro: 'Abra a lista de novo.' }
      if (GRUPOS.includes(id)) {
        const primeiro = lista.grupos[id][0]
        return primeiro ? caixas().destacar(ed, primeiro.bloco) : { ok: false, erro: 'Não sobrou nenhum.' }
      }
      const item = lista.itens.get(id)
      if (!item) return { ok: false, erro: 'Esse trecho não está mais no texto.' }
      if (item.tipo === 'balao') return caixas().destacar(ed, item.marcador.getRange())
      if (item.tipo === 'riscado') return caixas().destacar(ed, ed.model.createRange(ed.model.createPositionAt(item.bloco, item.inicio), ed.model.createPositionAt(item.bloco, item.fim)))
      return caixas().destacar(ed, item.bloco)
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // O texto mudou depois que a lista abriu? Cada id escolhido tem de continuar no mesmo lugar e com o mesmo texto.
  function mesmaLista (antiga, nova, ids) {
    return ids.every(id => {
      if (GRUPOS.includes(id)) return true
      const a = antiga.itens.get(id)
      const b = nova.itens.get(id)
      return Boolean(a && b && a.tipo === b.tipo && a.assinatura === b.assinatura && a.bloco === b.bloco)
    })
  }

  const textoDoBloco = bloco => pedacos(bloco).map(pedaco => pedaco.texto).join('')
  const atributosDoTexto = (bloco, posicao) => {
    const antes = pedacos(bloco).find(pedaco => pedaco.ehTexto && pedaco.inicio < posicao && pedaco.fim >= posicao)
    const atributos = antes ? new Map(antes.no.getAttributes()) : new Map()
    for (const chave of ['strikethrough', 'linkHref', 'fontColor', 'fontBackgroundColor', 'htmlMark']) atributos.delete(chave)
    return atributos
  }

  // Tira os trechos de um bloco, do fim para o começo (as posições de antes não mudam). Riscados seguem D3.
  function tirarTrechos (escritor, ed, bloco, trechos) {
    const r = regras()
    for (const trecho of [...trechos].sort((a, b) => b.inicio - a.inicio)) {
      const posicao = pos => escritor.createPositionAt(bloco, pos)
      escritor.remove(escritor.createRange(posicao(trecho.inicio), posicao(trecho.fim)))
      if (!trecho.riscado) continue
      const texto = textoDoBloco(bloco)
      const { inserir, tirar } = r.espacoAoJuntar(texto.charAt(trecho.inicio - 1), texto.charAt(trecho.inicio))
      if (inserir) escritor.insertText(' ', atributosDoTexto(bloco, trecho.inicio), posicao(trecho.inicio))
      if (tirar) escritor.remove(escritor.createRange(posicao(trecho.inicio), posicao(trecho.inicio + 1)))
    }
  }

  function tirarAtributo (escritor, bloco, pedaco, chaves) {
    const intervalo = escritor.createRange(escritor.createPositionAt(bloco, pedaco.inicio), escritor.createPositionAt(bloco, pedaco.fim))
    for (const chave of chaves) escritor.removeAttribute(chave, intervalo)
  }

  // Tira o que ficou marcado (ids), numa mudança só. Devolve quanto saiu de cada tipo.
  async function remover (ids) {
    try {
      const ed = await editor()
      if (!ed || !lista) return { ok: false, erro: 'Abra a lista de novo.' }
      const escolhidos = new Set(ids || [])
      const nova = mapear(ed)
      if (!mesmaLista(lista, nova, [...escolhidos])) return { ok: false, erro: 'O texto mudou depois que a lista abriu. Feche a lista e clique de novo em "Remover Formatação da AGU".' }
      const feito = { riscados: 0, justificativas: 0, paragrafos: 0, cores: 0, brancos: 0, marcas: 0, word: 0, baloes: 0 }
      ed.model.change(escritor => {
        // 1. Atributos (não mudam as posições): cores, marcação e ligação do Word.
        if (escolhidos.has('cores')) {
          for (const { bloco, pedaco } of nova.grupos.cores) { tirarAtributo(escritor, bloco, pedaco, ['fontColor']); feito.cores += 1 }
          for (const { bloco, pedaco } of nova.grupos.pretas) tirarAtributo(escritor, bloco, pedaco, ['fontColor'])
        }
        if (escolhidos.has('marcas')) for (const { bloco, pedaco } of nova.grupos.marcas) { tirarAtributo(escritor, bloco, pedaco, ['fontBackgroundColor', 'htmlMark']); feito.marcas += 1 }
        if (escolhidos.has('word')) for (const { bloco, trecho } of nova.grupos.word) { tirarAtributo(escritor, bloco, trecho, ['linkHref']); feito.word += 1 }
        // 2. Trechos (riscado, branco, marca do Word sem texto) e parágrafos que ficaram vazios (D4).
        for (const registro of nova.blocos) {
          const trechos = []
          for (const id of registro.riscados) if (escolhidos.has(id)) { const item = nova.itens.get(id); trechos.push({ inicio: item.inicio, fim: item.fim, riscado: true }); feito.riscados += 1 }
          if (escolhidos.has('brancos')) for (const pedaco of registro.brancos) { trechos.push({ inicio: pedaco.inicio, fim: pedaco.fim }); feito.brancos += 1 }
          if (escolhidos.has('word')) for (const trecho of registro.word) if (regras().textoDoLinkSai(trecho.texto)) trechos.push({ inicio: trecho.inicio, fim: trecho.fim })
          if (!trechos.length) continue
          tirarTrechos(escritor, ed, registro.bloco, sobrepostos(trechos))
          const tinhaRiscado = trechos.some(trecho => trecho.riscado)
          if (tinhaRiscado && regras().ficouSemTexto(textoDoBloco(registro.bloco))) { escritor.remove(registro.bloco); feito.paragrafos += 1 }
        }
        // 3. Parágrafos "Justificativa…" (D6 a) e balões (D6 b; o comando do próprio SEI, sai no Salvar).
        for (const [id, item] of nova.itens) {
          if (!escolhidos.has(id)) continue
          if (item.tipo === 'justificativa' && item.bloco.root && item.bloco.root.rootName) { escritor.remove(item.bloco); feito.justificativas += 1 }
          if (item.tipo === 'balao' && item.podeApagar && ed.model.markers.has(item.marcador.name)) { ed.execute('removerComentario', { id: item.id }); feito.baloes += 1 }
        }
      })
      lista = null
      return { ok: true, erro: '', feito, ...contar(mapear(ed)) }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Um trecho branco dentro de um riscado (ou o contrário) sai uma vez só.
  function sobrepostos (trechos) {
    const ordem = [...trechos].sort((a, b) => a.inicio - b.inicio || b.fim - a.fim)
    const juntos = []
    for (const trecho of ordem) {
      const ultimo = juntos[juntos.length - 1]
      if (ultimo && trecho.inicio < ultimo.fim) { ultimo.fim = Math.max(ultimo.fim, trecho.fim); ultimo.riscado = ultimo.riscado || trecho.riscado } else juntos.push({ ...trecho })
    }
    return juntos
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorAgu: { preparar, listar, irPara, remover } })
})(globalThis)
