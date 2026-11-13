// v0.2.0: lista de assinaturas no SEI (spec lista-assinaturas). Painel flutuante na página principal do SEI:
// colar a lista, abrir os itens um a um pela pesquisa rápida e mostrar "8/28". A lista fica no navegador
// (storage.local, chave listaAssinaturas) até o usuário limpar; nada vai para a internet.
(async function () {
  if (window.top !== window) return
  const { listaAssinaturas: regras, configuracoes, barra: barraExtensao, sei } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE = 'listaAssinaturas'

  // Só nas páginas completas do SEI (com a unidade no alto); janelinhas e telas de entrada ficam de fora.
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  if (!campoUnidade) return
  const unidade = campoUnidade.textContent.trim()

  let opcoes = await configuracoes.lerConfiguracoes()
  let estado = await lerEstado()
  // O que não é guardado: o modo do painel (com lista, sempre "navegar"), o rascunho e as linhas erradas.
  let modo = estado ? 'navegar' : 'fechado'
  let rascunho = ''
  let erros = []
  let aviso = ''
  let verLista = false

  async function lerEstado () {
    const { [CHAVE]: gravado } = await navegador.storage.local.get(CHAVE)
    if (!gravado || !Array.isArray(gravado.itens) || !gravado.itens.length) return null
    gravado.posicao = regras.limitarPosicao(gravado.posicao, gravado.itens.length)
    return gravado
  }
  async function gravarEstado () {
    if (estado) await navegador.storage.local.set({ [CHAVE]: estado })
    else await navegador.storage.local.remove(CHAVE)
  }

  // Painel isolado do estilo do SEI (shadow DOM).
  const hospedeiro = document.createElement('div')
  hospedeiro.dataset.extensaoIfto = 'lista-assinaturas'
  const raiz = hospedeiro.attachShadow({ mode: 'open' })
  const estilo = document.createElement('style')
  estilo.textContent = CSS()
  const painel = document.createElement('div')
  painel.className = 'painel'
  raiz.append(estilo, painel)
  document.body.append(hospedeiro)

  // ---------- Posição: padrão à direita da barra de botões do processo; arrastável ----------
  function posicaoPadrao () {
    const quadro = document.getElementById('divIframeVisualizacao')
    const barraDoAlto = document.getElementById('navInfraBarraNavegacao')
    let topo = 8
    if (quadro && quadro.getBoundingClientRect().height > 0) topo = quadro.getBoundingClientRect().top + 4
    else if (barraDoAlto) topo = barraDoAlto.getBoundingClientRect().bottom + 8
    // v0.7.0: com botões na barra da extensão, o painel abre logo abaixo dela.
    const fimDaBarra = barraExtensao && barraExtensao.fundo()
    if (fimDaBarra) topo = fimDaBarra + 6
    return { top: Math.max(topo, 4), right: 12 }
  }
  function posicionar () {
    const guardada = estado && estado.painel
    if (guardada) {
      const largura = painel.offsetWidth || 300
      const altura = painel.offsetHeight || 40
      const left = Math.min(Math.max(guardada.left, 0), Math.max(window.innerWidth - largura, 0))
      const top = Math.min(Math.max(guardada.top, 0), Math.max(window.innerHeight - altura, 0))
      Object.assign(painel.style, { left: left + 'px', top: top + 'px', right: 'auto' })
    } else {
      const { top, right } = posicaoPadrao()
      Object.assign(painel.style, { top: top + 'px', right: right + 'px', left: 'auto' })
    }
  }
  function permitirArrastar (alca) {
    alca.addEventListener('pointerdown', inicio => {
      if (inicio.button !== 0 || inicio.target.closest('button')) return
      const caixa = painel.getBoundingClientRect()
      const dx = inicio.clientX - caixa.left
      const dy = inicio.clientY - caixa.top
      alca.setPointerCapture(inicio.pointerId)
      const mover = evento => {
        Object.assign(painel.style, {
          left: Math.max(evento.clientX - dx, 0) + 'px', top: Math.max(evento.clientY - dy, 0) + 'px', right: 'auto'
        })
      }
      const soltar = () => {
        alca.removeEventListener('pointermove', mover)
        alca.removeEventListener('pointerup', soltar)
        const nova = painel.getBoundingClientRect()
        if (estado && (Math.abs(nova.left - caixa.left) > 2 || Math.abs(nova.top - caixa.top) > 2)) {
          estado.painel = { left: Math.round(nova.left), top: Math.round(nova.top) }
          gravarEstado()
        }
      }
      alca.addEventListener('pointermove', mover)
      alca.addEventListener('pointerup', soltar)
    })
  }
  window.addEventListener('resize', () => posicionar())

  // ---------- Abrir o item pela pesquisa rápida do SEI ----------
  function abrirItem () {
    const item = estado.itens[estado.posicao]
    const formulario = document.getElementById('frmProtocoloPesquisaRapida')
    const campo = document.getElementById('txtPesquisaRapida')
    if (!formulario || !campo) {
      aviso = 'Não achei a caixa de pesquisa do SEI nesta página. Abra a tela inicial do SEI e tente de novo.'
      desenhar()
      return
    }
    campo.value = regras.textoDaPesquisa(item)
    formulario.submit()
  }
  async function irPara (posicao) {
    estado.posicao = regras.limitarPosicao(posicao, estado.itens.length)
    aviso = ''
    await gravarEstado()
    desenhar()
    abrirItem()
  }

  // ---------- v0.9.2: intervalo de documentos ("3383754 a 3383903") ----------
  // Com a árvore do processo aberta, troca o item pelos documentos do processo dentro do intervalo
  // (mesma leitura da árvore dos documentos do pagamento: comum/sei.js). Também lê os nomes à vista na
  // árvore, para pegar documentos de pastas abertas pelo usuário.
  function conferirIntervalo (pedidoPeloUsuario) {
    const item = estado && estado.itens[estado.posicao]
    if (!item || !item.ate || estado.pendente) return
    let arvore
    try { arvore = document.getElementById('ifrArvore').contentDocument } catch (erro) { arvore = null }
    const lida = arvore && arvore.body ? sei.lerArvore([...arvore.scripts].map(script => script.textContent).join('\n')) : null
    const rotulos = lida ? lida.documentos.map(doc => doc.rotulo).concat([...arvore.querySelectorAll('a')].map(link => link.textContent)) : []
    // A árvore precisa ser do processo do item (sem processo: a que tem o primeiro documento).
    const certa = lida && (item.processo
      ? (lida.numero ? lida.numero === item.processo : arvore.body.textContent.includes(item.processo))
      : rotulos.some(rotulo => regras.numeroDoRotulo(rotulo) === item.documento))
    if (!certa) {
      if (pedidoPeloUsuario) { aviso = 'Abra o processo deste item ("Abrir de novo") e espere a árvore aparecer.'; desenhar() }
      return
    }
    // v0.9.3: externos ficam de fora (ícone da árvore: só os feitos no SEI podem ser assinados).
    const externos = lida.documentos.filter(doc => !doc.feitoNoSei).map(doc => regras.numeroDoRotulo(doc.rotulo))
    const novos = regras.expandirIntervalo(item, rotulos, lida.numero, externos)
    if (!novos.length) {
      aviso = `Nenhum documento de ${item.documento} a ${item.ate} neste processo. Se houver pastas fechadas na árvore, abra-as e clique em "Conferir de novo".`
      desenhar()
      return
    }
    estado.itens.splice(estado.posicao, 1, ...novos)
    irPara(estado.posicao)
  }

  // ---------- Desenho ----------
  function el (tag, atributos = {}, ...filhos) {
    const elemento = document.createElement(tag)
    for (const [chave, valor] of Object.entries(atributos)) {
      if (chave.startsWith('on')) elemento.addEventListener(chave.slice(2), valor)
      else if (valor !== false && valor != null) elemento.setAttribute(chave, valor === true ? '' : valor)
    }
    elemento.append(...filhos.flat().filter(filho => filho != null && filho !== false))
    return elemento
  }

  function cabecalho (titulo, ...botoes) {
    const topo = el('div', { class: 'cabecalho', title: 'Arraste para mover' },
      el('span', { class: 'marca', title: 'Extensão IFTO Palmas' }, 'IFTO'),
      el('strong', {}, titulo),
      el('span', { class: 'espaco' }),
      ...botoes)
    permitirArrastar(topo)
    return topo
  }

  // v0.7.0: sem lista, o botão "Lista de assinaturas" fica na barra da extensão (sites/sei/barra-extensao.js).
  function desenharFechado () {
    painel.className = 'painel fechado'
    painel.replaceChildren()
  }
  if (barraExtensao) {
    barraExtensao.botao('lista-assinaturas', {
      texto: 'Lista de assinaturas',
      titulo: 'Colar uma lista de processos e documentos para assinar',
      ordem: 10,
      aoClicar: () => { modo = 'colar'; desenhar() }
    })
  }

  function desenharColar () {
    painel.className = 'painel'
    const caixa = el('textarea', {
      rows: 8,
      placeholder: 'Uma linha por item. Exemplos:\n23236.021417/2026-95 - 3383423 dar ciência\n23236.022730/2026-41 - 3383754 a 3383903\n23236.011766/2026-07\n3383812',
      oninput: () => { rascunho = caixa.value }
    })
    caixa.value = rascunho
    const corpo = [
      el('p', { class: 'apoio' }, 'Cole o número do processo e, se houver, o número SEI do documento e um comentário. A lista fica guardada só neste navegador.'),
      caixa
    ]
    if (erros.length) {
      const boas = regras.lerLista(rascunho).itens.length
      corpo.push(el('div', { class: 'erros' },
        el('strong', {}, `${erros.length} ${erros.length === 1 ? 'linha não reconhecida' : 'linhas não reconhecidas'}:`),
        el('ul', {}, erros.map(erro => el('li', {}, `Linha ${erro.numero}: ${erro.texto}`))),
        el('span', {}, 'Corrija acima e clique em "Conferir e começar", ou comece só com as reconhecidas.')))
      if (boas) corpo.push(el('button', { type: 'button', class: 'botao', onclick: () => comecar(true) }, `Começar só com as ${boas} reconhecidas`))
    }
    corpo.push(el('div', { class: 'acoes' },
      el('button', { type: 'button', class: 'botao', onclick: () => { modo = estado ? 'navegar' : 'fechado'; erros = []; desenhar() } }, 'Cancelar'),
      el('button', { type: 'button', class: 'botao principal', onclick: () => comecar(false) }, 'Conferir e começar')))
    painel.replaceChildren(cabecalho('Colar lista'), el('div', { class: 'corpo' }, corpo))
    caixa.focus()
  }

  async function comecar (ignorarErros) {
    const lida = regras.lerLista(rascunho)
    erros = lida.erros
    if (!lida.itens.length) {
      erros = lida.erros.length ? lida.erros : [{ numero: 1, texto: '(nenhuma linha)' }]
      desenhar()
      return
    }
    if (erros.length && !ignorarErros) { desenhar(); return }
    estado = { itens: lida.itens, posicao: 0, painel: estado ? estado.painel : null }
    modo = 'navegar'
    erros = []
    rascunho = ''
    await irPara(0)
  }

  // v0.3.0: "Feito e próximo" (v0.5.0: "Assinar e próximo"), lista completa, ciência em destaque, minimizar.
  function desenharNavegar () {
    const item = estado.itens[estado.posicao]
    const total = estado.itens.length
    const contador = el('span', { class: 'contador' }, regras.textoDoContador(estado))
    const minimizar = el('button', { type: 'button', class: 'icone', title: 'Minimizar', onclick: () => minimizarPainel(true) }, '–')
    if (estado.minimizado) {
      painel.className = 'painel minimizado'
      painel.replaceChildren(cabecalho('Assinaturas', contador,
        el('button', { type: 'button', class: 'icone', title: 'Próximo (Alt+→)', disabled: estado.posicao === total - 1, onclick: () => irPara(estado.posicao + 1) }, '▶'),
        el('button', { type: 'button', class: 'icone', title: 'Abrir o painel', onclick: () => minimizarPainel(false) }, '▢')))
      return
    }
    painel.className = 'painel'
    const corpo = [
      el('div', { class: 'item' + (item.ciencia ? ' ciencia' : '') },
        el('div', { class: 'etiquetas' },
          item.ciencia ? el('span', { class: 'etiqueta ciencia' }, 'Só dar ciência') : el('span', { class: 'etiqueta' }, 'Assinar'),
          item.feito ? el('span', { class: 'etiqueta feito' }, '✓ Feito') : null),
        item.processo ? el('div', {}, el('span', { class: 'rotulo' }, 'Processo '), el('strong', {}, item.processo)) : null,
        item.ate
          ? [el('div', {}, el('span', { class: 'rotulo' }, 'Documentos '), el('strong', {}, `${item.documento} a ${item.ate}`)),
              el('div', { class: 'apoio' }, 'Ao abrir o processo, a extensão separa um item para cada documento dele nesse intervalo.')]
          : item.documento
            ? el('div', {}, el('span', { class: 'rotulo' }, 'Documento '), el('strong', {}, item.documento),
              item.doIntervalo ? el('span', { class: 'apoio' }, ` (de ${item.doIntervalo})`) : null)
            : el('div', { class: 'apoio' }, 'Sem documento: abre o processo.'),
        item.comentario ? el('div', { class: 'comentario' }, item.comentario) : null),
      aviso ? el('div', { class: 'erros' }, aviso) : null,
      el('div', { class: 'acoes' },
        el('button', { type: 'button', class: 'botao', title: 'Alt+←', disabled: estado.posicao === 0, onclick: () => irPara(estado.posicao - 1) }, '◀ Anterior'),
        el('button', { type: 'button', class: 'botao', title: 'Alt+→', disabled: estado.posicao === total - 1, onclick: () => irPara(estado.posicao + 1) }, 'Próximo ▶')),
      // v0.5.0: o botão principal assina (ou dá ciência) e avança. Sem documento e sem ciência, só marca
      // como feito, porque "Assinar" precisa de um documento aberto.
      estado.pendente ? el('div', { class: 'aguardando' }, estado.pendente.tipo === 'ciencia'
        ? 'Aguardando a ciência no SEI (confirme no OK)…'
        : 'Aguardando a assinatura no SEI… Se a senha não aparecer preenchida, digite e aperte Enter.') : null,
      item.ate
        ? el('button', { type: 'button', class: 'botao principal', onclick: () => conferirIntervalo(true) }, 'Conferir de novo')
        : item.ciencia
        ? el('button', { type: 'button', class: 'botao principal', title: 'Clica em "Ciência" no SEI; depois de você confirmar, abre o próximo', onclick: () => agirEAvancar('ciencia') }, 'Dar ciência e próximo')
        : item.documento
          ? el('button', { type: 'button', class: 'botao principal', title: 'Assina com a senha guardada no Firefox e abre o próximo', onclick: () => agirEAvancar('assinar') }, 'Assinar e próximo')
          : el('button', { type: 'button', class: 'botao principal', onclick: feitoEProximo }, '✓ Feito e próximo'),
      el('div', { class: 'links' },
        el('button', { type: 'button', class: 'link', onclick: () => { verLista = !verLista; desenhar() } }, verLista ? 'Esconder a lista' : `Lista completa (${total})`),
        el('button', { type: 'button', class: 'link', onclick: () => irPara(estado.posicao) }, 'Abrir de novo'),
        item.feito
          ? el('button', { type: 'button', class: 'link', onclick: desmarcarFeito }, 'Desmarcar feito')
          : (item.documento || item.ciencia) && !item.ate ? el('button', { type: 'button', class: 'link', onclick: feitoEProximo }, 'Marcar feito e ir ao próximo') : null,
        estado.pendente ? el('button', { type: 'button', class: 'link', onclick: cancelarPendente }, 'Cancelar a espera') : null,
        el('button', { type: 'button', class: 'link', onclick: voltarAoLugarPadrao }, 'Lugar padrão'),
        el('button', { type: 'button', class: 'link perigo', onclick: limpar }, 'Limpar lista')),
      verLista ? listaCompleta() : null
    ]
    painel.replaceChildren(cabecalho('Lista de assinaturas', contador, minimizar), el('div', { class: 'corpo' }, corpo))
  }

  function listaCompleta () {
    const lista = el('ol', { class: 'lista' }, estado.itens.map((item, indice) =>
      el('li', { class: [indice === estado.posicao ? 'atual' : '', item.feito ? 'feito' : '', item.ciencia ? 'ciencia' : ''].join(' ').trim() },
        el('button', { type: 'button', title: 'Abrir este item', onclick: () => irPara(indice) },
          el('span', { class: 'situacao' }, item.feito ? '✓' : '•'),
          el('span', {}, [item.processo, item.ate ? `${item.documento} a ${item.ate}` : item.documento].filter(Boolean).join(' · ')),
          item.comentario ? el('span', { class: 'apoio' }, ' ' + item.comentario) : null))))
    // Deixa o item atual à vista.
    setTimeout(() => { const atual = lista.querySelector('.atual'); if (atual) atual.scrollIntoView({ block: 'nearest' }) }, 0)
    return lista
  }

  // v0.4.0: clica no botão do próprio SEI (barra de botões, dentro do quadro da direita). A senha e a
  // confirmação continuam com o usuário, na janela do SEI.
  function acharBotaoDoSei (titulo, janela = window, profundidade = 0) {
    let documento
    try { documento = janela.document } catch (erro) { return null }
    const imagem = documento.querySelector(`#divArvoreAcoes a > img[title="${titulo}"]`)
    if (imagem) return imagem.parentElement
    if (profundidade > 3) return null
    for (const quadro of documento.querySelectorAll('iframe')) {
      const achado = quadro.contentWindow && acharBotaoDoSei(titulo, quadro.contentWindow, profundidade + 1)
      if (achado) return achado
    }
    return null
  }
  function clicarBotaoDoSei (titulo) {
    const botao = acharBotaoDoSei(titulo)
    if (!botao) {
      if (estado.pendente) { delete estado.pendente; gravarEstado() }
      aviso = titulo === 'Ciência'
        ? 'Não achei o botão "Ciência" do SEI. Espere o documento abrir ou clique nele na árvore do processo.'
        // v0.9.3: documento de outro setor fora de bloco de assinatura (ou externo): o SEI não mostra o botão
        // e a extensão não tenta assinar.
        : 'O SEI não mostra "Assinar Documento" para este documento. Se ele ainda está abrindo, espere e tente de novo. Se for de outro setor (sem bloco de assinatura) ou um arquivo incluído, não dá para assinar aqui: clique em "Próximo".'
      desenhar()
      return
    }
    aviso = ''
    desenhar()
    botao.click()
    return true
  }

  // v0.5.0: "Assinar e próximo" e "Dar ciência e próximo". Guarda o que está esperando (estado.pendente) e
  // clica no botão do SEI. Na janela de assinatura, sites/sei/assinar-e-proximo.js clica em "Assinar" se o
  // Firefox já preencheu a senha e marca "enviado". Quando o SEI recarrega a árvore ou o documento depois
  // disso, a assinatura (ou a ciência) foi feita: marca o item e abre o próximo. Senha errada ou janela
  // fechada: a árvore não recarrega e o painel continua esperando (dá para cancelar a espera).
  async function agirEAvancar (tipo) {
    estado.pendente = { tipo, posicao: estado.posicao, desde: Date.now(), enviado: tipo === 'ciencia' }
    await gravarEstado()
    clicarBotaoDoSei(tipo === 'ciencia' ? 'Ciência' : 'Assinar Documento')
  }
  async function cancelarPendente () {
    delete estado.pendente
    await gravarEstado()
    desenhar()
  }
  const ESPERA_MAXIMA = 3 * 60 * 1000
  async function conferirPendente () {
    const pendente = estado && estado.pendente
    if (!pendente) return
    if (Date.now() - pendente.desde > ESPERA_MAXIMA || pendente.posicao !== estado.posicao) {
      delete estado.pendente
      await gravarEstado()
      desenhar()
      return
    }
    if (!pendente.enviado) return
    delete estado.pendente
    await feitoEProximo()
  }
  // A árvore e o documento ficam em quadros da página principal; o SEI os recarrega depois de assinar.
  function vigiarQuadros () {
    for (const id of ['ifrArvore', 'ifrConteudoVisualizacao', 'ifrVisualizacao']) {
      const quadro = document.getElementById(id)
      if (quadro && !quadro.dataset.extensaoIftoVigiado) {
        quadro.dataset.extensaoIftoVigiado = '1'
        quadro.addEventListener('load', () => { setTimeout(() => { conferirPendente(); if (id === 'ifrArvore') conferirIntervalo(false) }, 300) })
      }
    }
  }

  async function feitoEProximo () {
    estado.itens[estado.posicao].feito = true
    const proximo = regras.proximoPendente(estado.itens, estado.posicao)
    if (proximo === -1) {
      aviso = ''
      await gravarEstado()
      desenhar()
      window.alert('Todos os itens da lista estão feitos. Clique em "Limpar lista" quando quiser apagá-la.')
      return
    }
    await irPara(proximo)
  }

  async function desmarcarFeito () {
    estado.itens[estado.posicao].feito = false
    await gravarEstado()
    desenhar()
  }

  async function minimizarPainel (minimizado) {
    estado.minimizado = minimizado
    await gravarEstado()
    desenhar()
  }

  // v0.3.0: atalhos Alt+→ (próximo) e Alt+← (anterior), também com o foco dentro do documento
  // (os quadros internos avisam por mensagem: sites/sei/lista-assinaturas-teclas.js).
  function atalho (acao) {
    if (!estado || modo !== 'navegar' || !regras.funcaoLigada(opcoes.listaAssinaturas, unidade)) return false
    if (acao === 'proximo' && estado.posicao < estado.itens.length - 1) irPara(estado.posicao + 1)
    else if (acao === 'anterior' && estado.posicao > 0) irPara(estado.posicao - 1)
    return true
  }
  document.addEventListener('keydown', evento => {
    if (!evento.altKey || evento.ctrlKey || evento.shiftKey || evento.metaKey) return
    const acao = { ArrowRight: 'proximo', ArrowLeft: 'anterior' }[evento.key]
    if (acao && atalho(acao)) evento.preventDefault()
  }, true)
  window.addEventListener('message', evento => {
    if (evento.origin !== location.origin || !evento.data || evento.data.extensaoIfto !== 'lista-assinaturas-tecla') return
    atalho(evento.data.acao)
  })

  async function voltarAoLugarPadrao () {
    estado.painel = null
    await gravarEstado()
    posicionar()
  }

  async function limpar () {
    if (!window.confirm('Apagar a lista de assinaturas deste navegador?')) return
    estado = null
    modo = 'fechado'
    await gravarEstado()
    desenhar()
  }

  function desenhar () {
    const ligada = regras.funcaoLigada(opcoes.listaAssinaturas, unidade)
    hospedeiro.style.display = ligada ? '' : 'none'
    if (modo === 'navegar' && !estado) modo = 'fechado'
    if (barraExtensao) barraExtensao.mostrar('lista-assinaturas', ligada && modo === 'fechado')
    if (!ligada) return
    if (modo === 'fechado') desenharFechado()
    else if (modo === 'colar') desenharColar()
    else desenharNavegar()
    posicionar()
  }

  // Outra aba mudou a lista ou as configurações: acompanha.
  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local') return
    if (mudancas.configuracoes) opcoes = await configuracoes.lerConfiguracoes()
    if (mudancas[CHAVE]) {
      estado = await lerEstado()
      if (modo !== 'colar') modo = estado ? 'navegar' : 'fechado'
    }
    if (mudancas.configuracoes || mudancas[CHAVE]) desenhar()
  })

  vigiarQuadros()
  // A página principal recarregou depois de assinar (ex.: o SEI abriu o processo de novo): confere já.
  if (estado && estado.pendente && estado.pendente.enviado) conferirPendente()
  desenhar()
  setTimeout(() => conferirIntervalo(false), 300)

  function CSS () {
    return `
      :host { all: initial; }
      .painel { position: fixed; z-index: 1000; width: 300px; max-width: calc(100vw - 16px);
        background: #fff; color: #1B2420; border: 1px solid #C9D1CC; border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,.18); font: 13px/1.4 system-ui, sans-serif; }
      .painel.fechado { display: none; }
      .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
      .cabecalho { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: #F5F6F4;
        border-bottom: 1px solid #E2E6E3; border-radius: 8px 8px 0 0; cursor: move; user-select: none; }
      .espaco { flex: 1; }
      .contador { font-weight: 700; font-size: 14px; }
      .corpo { padding: 8px 10px 10px; display: grid; gap: 8px; }
      .apoio { color: #5B6660; font-size: 12px; margin: 0; }
      .rotulo { color: #5B6660; }
      .item { display: grid; gap: 2px; }
      .etiquetas { display: flex; gap: 6px; margin-bottom: 2px; }
      .etiqueta { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: #E7F2EA; color: #1E5E33; }
      .etiqueta.ciencia { background: #E4E9FB; color: #2A3F9B; }
      .etiqueta.feito { background: #1E5E33; color: #fff; }
      .item.ciencia .comentario { background: #E4E9FB; color: #2A3F9B; }
      .painel.minimizado { width: auto; }
      .painel.minimizado .cabecalho { border-bottom: 0; border-radius: 8px; }
      .icone { min-width: 26px; height: 24px; border: 1px solid #C9D1CC; border-radius: 4px; background: #fff;
        color: #1B2420; font: inherit; cursor: pointer; padding: 0 4px; }
      .icone:disabled { opacity: .45; cursor: default; }
      .lista { margin: 0; padding: 0; list-style: none; max-height: 220px; overflow: auto; border-top: 1px solid #E2E6E3; }
      .lista button { display: flex; gap: 6px; width: 100%; text-align: left; border: 0; background: none;
        padding: 4px 2px; font: inherit; font-size: 12px; color: inherit; cursor: pointer; }
      .lista button:hover { background: #F5F6F4; }
      .lista li.atual button { background: #E7F2EA; font-weight: 600; }
      .lista li.feito { color: #5B6660; }
      .lista li.feito .situacao { color: #1E5E33; font-weight: 700; }
      .lista li.ciencia .situacao { color: #2A3F9B; }
      .comentario { margin-top: 4px; padding: 4px 6px; background: #FFF1D6; color: #7A4B00; border-radius: 4px; font-weight: 600; }
      textarea { width: 100%; box-sizing: border-box; font: 12px/1.4 ui-monospace, monospace; padding: 6px;
        border: 1px solid #C9D1CC; border-radius: 6px; resize: vertical; }
      .erros { background: #FDECEC; color: #9B1C1C; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
      .erros ul { margin: 4px 0; padding-left: 18px; max-height: 120px; overflow: auto; }
      .acoes { display: flex; gap: 6px; }
      .acoes .botao { flex: 1; }
      .botao { min-height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid #C9D1CC;
        background: #fff; color: #1B2420; font: inherit; cursor: pointer; }
      .botao:hover:not(:disabled) { background: #F5F6F4; }
      .botao.principal { background: #1E5E33; border-color: #1E5E33; color: #fff; font-weight: 600; }
      .botao.principal:hover:not(:disabled) { background: #174A28; }
      .aguardando { background: #FFF1D6; color: #7A4B00; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
      .botao.sei { border-color: #1E5E33; color: #1E5E33; font-weight: 600; }
      .botao:disabled { opacity: .45; cursor: default; }
      .links { display: flex; flex-wrap: wrap; gap: 4px 12px; }
      .link { border: 0; background: none; padding: 0; color: #1E5E33; font: inherit; font-size: 12px;
        text-decoration: underline; cursor: pointer; }
      .link.perigo { color: #9B1C1C; }
    `
  }
})()
