// v0.26.6 (spec conferir-documento, D2/D16): Bloco de assinatura. Antes de o SEI assinar, lê os documentos que
// vão ser assinados e, se algum tiver o número do processo (v0.26.9: ou a data) errado, mostra uma janela só com todos eles
// ("Assinar mesmo assim?"). Vale para as duas telas do SEI:
// - "Blocos de Assinatura" (acao=bloco_assinatura_listar): ícone de assinar de um bloco e o botão "Assinar"
//   com blocos marcados (lê a página "Documentos do Bloco" de cada um);
// - "Documentos do Bloco" (acao=rel_bloco_protocolo_listar): ícone de assinar de um documento e o botão
//   "Assinar" com documentos marcados (já começa a ler os documentos quando a página abre).
// A janela do documento aberta pelo número (bloco_navegar) usa o botão "Assinar Documento" de sempre
// (sites/sei/assinar-conferir.js). SEI lento ou documento que não deu para ler: o SEI assina normalmente.
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  const { configuracoes, conferirDocumento: regras, janelaAssinar, seiPedidos } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!regras.confereAoAssinar(opcoes) || !seiPedidos) return
  // v0.35.2: unidade aberta, para o cargo da diretora-geral.
  const sigla = await globalThis.ExtensaoIFTO.sei.unidadeAberta().catch(() => '')
  const naListaDeBlocos = /[?&]acao=bloco_assinatura_listar/.test(location.href)
  const tempo = ms => new Promise((resolve, recusar) => setTimeout(() => recusar(new Error('tempo')), ms))

  // Cada documento é lido uma vez só (o mesmo pedido serve a vários cliques).
  const lidos = new Map()
  function conferirDocumento (link) {
    if (!lidos.has(link)) {
      const leitura = Promise.race([seiPedidos.pedir(link), tempo(20000)])
        .then(({ html }) => ({ problemas: regras.problemasParaAssinar(html, opcoes, new Date(), sigla), numero: regras.numeroSeiDoDocumento(html) }))
        .catch(() => null)
      lidos.set(link, leitura)
    }
    return lidos.get(link)
  }
  async function documentosDoBlocoNumero (idBloco) {
    const link = [...document.querySelectorAll('a[href*="rel_bloco_protocolo_listar"]')].find(a => new RegExp('[?&]id_bloco=' + idBloco + '(&|$)').test(a.href))
    if (!link) return []
    const { html } = await seiPedidos.pedir(link.href)
    return regras.documentosDoBloco(html)
  }
  const documentosDaPagina = naListaDeBlocos ? [] : regras.documentosDoBloco([...document.scripts].map(script => script.textContent).join('\n'))
  documentosDaPagina.forEach(doc => conferirDocumento(doc.link))

  const marcados = () => [...document.querySelectorAll('input.infraCheckboxInput[id^="chkInfraItem"]:checked')].map(caixa => caixa.value)
  // Documentos que o clique vai assinar.
  async function documentosDoClique (alvo) {
    const clique = alvo.getAttribute('onclick') || ''
    const item = (/acaoAssinar\('([^']+)'\)/.exec(clique) || [])[1]
    const itens = alvo.id === 'btnAssinar' ? marcados() : (item ? [item] : [])
    if (!naListaDeBlocos) {
      const ids = new Set(itens.map(regras.idDoItemDoBloco))
      return documentosDaPagina.filter(doc => ids.has(doc.id))
    }
    const listas = await Promise.all(itens.map(id => documentosDoBlocoNumero(String(id).replace(/\D/g, '')).catch(() => [])))
    return listas.flat()
  }

  let liberado = false
  let conferindo = false
  document.addEventListener('click', async evento => {
    const alvo = evento.target && evento.target.closest && evento.target.closest('a, button')
    const ehAssinar = alvo && (alvo.id === 'btnAssinar' || /acaoAssinar\(/.test(alvo.getAttribute('onclick') || ''))
    if (!ehAssinar || liberado) return
    // Fase de captura: o SEI ainda não recebeu o clique.
    evento.preventDefault()
    evento.stopImmediatePropagation()
    if (conferindo) return
    conferindo = true
    document.documentElement.style.cursor = 'progress'
    let resultados = []
    try {
      const documentos = await Promise.race([documentosDoClique(alvo), tempo(25000)])
      resultados = await Promise.all(documentos.map(doc => conferirDocumento(doc.link)))
    } catch (erro) {}
    document.documentElement.style.cursor = ''
    conferindo = false
    const errados = resultados.filter(r => r && r.problemas && r.problemas.length)
    if (errados.length) {
      const linhas = errados.map(r => `Documento ${r.numero || '?'}: ${r.problemas.join(' ')}`)
      const titulo = errados.length === 1 ? 'Este documento do bloco tem possíveis divergências. Assinar mesmo assim?' : 'Estes documentos do bloco têm possíveis divergências. Assinar mesmo assim?'
      if (await janelaAssinar.perguntar(titulo, linhas, 'Não, corrigir antes') !== 'assinar') return
    }
    liberado = true
    try { alvo.click() } finally { liberado = false }
  }, true)
})()
