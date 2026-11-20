// v0.33.0: tela do processo (quadro "arvore_visualizar", ao clicar no número do processo na árvore): a área da
// direita fica quase em branco. A extensão lê a página "Consultar/Alterar Processo" do próprio SEI (só lê, nunca
// salva) e mostra Tipo do Processo, Especificação e Interessados, no mesmo estilo do texto do SEI. Os dados
// ficam guardados no navegador para conferir a Capa de Processo no editor (comum/dados-processo.js).
(async function () {
  const { sei, configuracoes, dadosProcesso: regras } = globalThis.ExtensaoIFTO
  if (!(await sei.ligadaNoSei())) return
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.dadosDoProcesso && !opcoes.conferirProcesso) return
  const navegador = globalThis.browser || globalThis.chrome
  const ID = 'extensao-ifto-dados-processo'
  const LIMITE = 20000
  let lidos = null

  async function lerDoSei () {
    const link = regras.linkDosDados(document.documentElement.innerHTML)
    if (!link) return null
    const controle = new AbortController()
    const relogio = setTimeout(() => controle.abort(), LIMITE)
    try {
      const resposta = await fetch(new URL(link, location.href), { credentials: 'include', signal: controle.signal })
      if (!resposta.ok) throw new Error('resposta ' + resposta.status)
      const conjunto = (/charset=([^;]+)/i.exec(resposta.headers.get('content-type') || '') || [])[1]
      const html = new TextDecoder(/utf-?8/i.test(conjunto || '') ? 'utf-8' : 'windows-1252').decode(await resposta.arrayBuffer())
      const dados = regras.lerDados(html)
      if (!dados) throw new Error('página sem os dados')
      if (!dados.processo) {
        const numero = document.querySelector('#divArvoreNavegacao span')
        dados.processo = numero ? numero.textContent.trim() : ''
      }
      if (dados.processo) {
        const guardados = (await navegador.storage.local.get(regras.CHAVE))[regras.CHAVE] || {}
        await navegador.storage.local.set({ [regras.CHAVE]: regras.guardar(guardados, dados) })
      }
      return dados
    } finally {
      clearTimeout(relogio)
    }
  }

  // Área em branco do processo: o quadro de dentro com "Processo aberto somente na unidade…" (#divArvoreInformacao).
  function areaDoProcesso () {
    const quadro = document.getElementById('ifrVisualizacao')
    let documento = null
    try { documento = quadro && quadro.contentDocument } catch (erro) { return null }
    const informacao = documento && documento.getElementById('divArvoreInformacao')
    return informacao ? { documento, informacao } : null
  }

  function mostrar (area, dados, erro) {
    const { documento, informacao } = area
    const antigo = documento.getElementById(ID)
    if (antigo) antigo.remove()
    const caixa = documento.createElement('div')
    caixa.id = ID
    caixa.style.cssText = 'margin-top:1rem;font-size:.875rem;'
    const linha = (rotulo, valores) => {
      const paragrafo = documento.createElement('p')
      // v0.34.1: tamanho em cada parágrafo, porque o estilo do SEI diminuía o <p> (ficava menor que "Processo aberto...")
      paragrafo.style.cssText = 'margin:0 0 .75rem 0;font-size:.875rem;'
      const titulo = documento.createElement('span')
      titulo.style.fontWeight = 'bold'
      titulo.textContent = rotulo
      paragrafo.append(titulo)
      for (const valor of valores) paragrafo.append(documento.createElement('br'), documento.createTextNode(valor))
      caixa.append(paragrafo)
    }
    if (erro) {
      const aviso = documento.createElement('p')
      aviso.style.cssText = 'margin:0;color:#666;font-size:.875rem;'
      aviso.textContent = 'Não consegui ler os dados do processo agora (o SEI pode estar lento ou fora do ar). Clique de novo no número do processo para tentar outra vez.'
      caixa.append(aviso)
    } else {
      linha('Tipo do Processo:', [dados.tipo || 'Não informado'])
      linha('Especificação:', [dados.especificacao || 'Não informada'])
      linha('Interessados:', dados.interessados.length ? dados.interessados : ['Nenhum interessado'])
    }
    informacao.after(caixa)
  }

  async function aoCarregar () {
    const area = areaDoProcesso()
    if (!area) return
    try {
      lidos = lidos || await lerDoSei()
      if (lidos && opcoes.dadosDoProcesso) mostrar(area, lidos)
    } catch (erro) {
      if (opcoes.dadosDoProcesso) mostrar(area, null, true)
    }
  }

  const quadro = document.getElementById('ifrVisualizacao')
  if (!quadro) return
  quadro.addEventListener('load', aoCarregar)
  aoCarregar()
})()
