// v0.11.0: parte da extensão que roda por trás (Firefox: página de fundo; Chrome: service worker).
// SICAF automático: menu do botão direito "Buscar SICAF deste CNPJ" (também no leitor de PDF do
// navegador, onde a extensão não entra na página) e recado do CNPJ escolhido para a página do SEI.
// v0.13.0: busca no SICAF: abre a aba do SICAF, ajuda no login do Compras.gov.br, pesquisa cada CNPJ,
// guarda o PDF (Downloads e memória do dia) e devolve os PDFs para a aba do SEI.
/* global importScripts */
if (typeof importScripts === 'function' && !(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.sicaf)) {
  importScripts('/comum/sei.js', '/comum/sicaf.js')
}
const navegador = globalThis.browser || globalThis.chrome
const regras = globalThis.ExtensaoIFTO.sicaf
const MENU = 'buscar-sicaf'
const SEI = '*://sei.ifto.edu.br/*'
// Páginas do SEI onde a extensão entra (as outras não respondem).
const PAGINAS_DO_SEI = '*://sei.ifto.edu.br/*controlador.php?acao=*'

// ---------- Menu do botão direito ----------
function criarMenu () {
  navegador.contextMenus.removeAll(() => {
    navegador.contextMenus.create({ id: MENU, title: 'Buscar SICAF deste CNPJ', contexts: ['selection'], documentUrlPatterns: [SEI] })
  })
}
navegador.runtime.onInstalled.addListener(criarMenu)
navegador.runtime.onStartup.addListener(criarMenu)

navegador.contextMenus.onClicked.addListener((info, aba) => {
  if (info.menuItemId !== MENU) return
  const achado = regras.cnpjDaSelecao(info.selectionText)
  levarParaOSei({ tipo: 'sicafCnpj', cnpj: achado ? achado.cnpj : null, valido: Boolean(achado && achado.valido), texto: String(info.selectionText || '').slice(0, 60), origem: 'menu' }, aba)
})

// ---------- Recados ----------
// Resposta que demora (Promise): o Chrome precisa de "return true" e responder(); o Firefox aceita os dois.
navegador.runtime.onMessage.addListener((recado, remetente, responder) => {
  if (!recado || typeof recado !== 'object') return
  const resposta = tratarRecado(recado, remetente)
  if (resposta && typeof resposta.then === 'function') {
    resposta.then(responder, erro => responder({ erro: erro.message }))
    return true
  }
})
function tratarRecado (recado, remetente) {
  const aba = remetente.tab
  switch (recado.tipo) {
    case 'sicafCnpj': return levarParaOSei({ ...recado, valido: regras.cnpjValido(recado.cnpj) }, aba)
    case 'sicafPermissao': return temPermissao().then(sim => ({ permitido: sim }))
    case 'abrirConfiguracoes': return navegador.tabs.create({ url: navegador.runtime.getURL('configuracoes/index.html#sicaf') }).then(() => ({ ok: true }))
    case 'sicafBuscar': return iniciarBusca(recado.cnpjs || [], aba)
    case 'sicafCancelar': return gravarTarefa(null).then(() => ({ ok: true }))
    case 'sicafQualCnpj': return qualCnpj(aba)
    case 'sicafPesquisei': return marcarPesquisa(recado.cnpj)
    case 'sicafPdf': return receberPdf(recado, aba)
  }
}

// Leva o CNPJ para a página principal do SEI (quadro 0) da aba; se a aba não tem a página da extensão
// (PDF aberto sozinho numa aba), usa a aba do SEI usada por último e a traz para a frente.
async function levarParaOSei (recado, aba) {
  if (aba && aba.id >= 0 && await entregar(aba.id, recado)) return
  const abas = await navegador.tabs.query({ url: PAGINAS_DO_SEI })
  abas.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
  for (const outra of abas) {
    if (aba && outra.id === aba.id) continue
    if (await entregar(outra.id, recado)) {
      await navegador.tabs.update(outra.id, { active: true })
      if (outra.windowId !== undefined) await navegador.windows.update(outra.windowId, { focused: true })
      return
    }
  }
}
async function entregar (idDaAba, recado) {
  try {
    const resposta = await navegador.tabs.sendMessage(idDaAba, recado, { frameId: 0 })
    return Boolean(resposta && resposta.recebido)
  } catch (erro) {
    return false
  }
}

// ---------- Busca no SICAF (v0.13.0) ----------
const CHAVE_TAREFA = 'sicafTarefa'
const CHAVE_PDFS = 'sicafPdfs'
const temPermissao = () => navegador.permissions.contains({ origins: [...regras.ORIGENS_COMPRAS], permissions: ['downloads'] })
const hoje = () => new Date().toLocaleDateString('sv-SE')

async function lerTarefa () {
  const { [CHAVE_TAREFA]: tarefa } = await navegador.storage.local.get(CHAVE_TAREFA)
  return tarefa || null
}
async function gravarTarefa (tarefa) {
  if (tarefa) await navegador.storage.local.set({ [CHAVE_TAREFA]: tarefa })
  else await navegador.storage.local.remove(CHAVE_TAREFA)
}
// PDFs de hoje (um por CNPJ): pedir de novo no mesmo dia não abre o SICAF outra vez.
async function lerPdfsDeHoje () {
  const { [CHAVE_PDFS]: pdfs = {} } = await navegador.storage.local.get(CHAVE_PDFS)
  return Object.fromEntries(Object.entries(pdfs).filter(([, pdf]) => pdf.data === hoje()))
}

async function iniciarBusca (cnpjs, abaSei) {
  if (!await temPermissao()) return { semPermissao: true }
  const pedidos = [...new Set(cnpjs.filter(regras.cnpjValido))]
  const pdfs = await lerPdfsDeHoje()
  const faltam = pedidos.filter(cnpj => !pdfs[cnpj])
  const tarefa = { idAbaSei: abaSei.id, pedidos, faltam, posicao: 0, pesquisado: false, erros: {}, idAbaSicaf: null, voltasDoLogin: 0 }
  if (!faltam.length) { await terminar(tarefa); return { ok: true, jaTinha: true } }
  const aba = await navegador.tabs.create({ url: regras.URL_CONSULTA_SICAF, windowId: abaSei.windowId, index: abaSei.index + 1, active: true })
  tarefa.idAbaSicaf = aba.id
  await gravarTarefa(tarefa)
  return { ok: true, faltam: faltam.length }
}

// Cada página do Compras/SICAF que termina de abrir na aba da busca (ou SICAF aberto pelo menu).
navegador.tabs.onUpdated.addListener(async (idDaAba, mudanca, aba) => {
  if (mudanca.status !== 'complete' || !aba.url) return
  const pagina = regras.paginaDoCompras(aba.url)
  if (!pagina) return
  const tarefa = await lerTarefa()
  if (!tarefa) return
  if (idDaAba !== tarefa.idAbaSicaf) {
    if (pagina !== 'consulta' && pagina !== 'sicaf') return
    tarefa.idAbaSicaf = idDaAba
    await gravarTarefa(tarefa)
  }
  if (pagina === 'acessoNegado' || pagina === 'sicafPublico') {
    // Sem login: abre a página de entrada do Compras. Se já voltou do login e o SICAF ainda nega, ajuda
    // a abrir o SICAF pelo menu da área de trabalho.
    if (tarefa.voltasDoLogin === 0) await navegador.tabs.update(idDaAba, { url: regras.URL_LOGIN_COMPRAS })
    else await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'menu' })
  } else if (pagina === 'login') {
    await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'login' })
  } else if (pagina === 'areaDeTrabalho') {
    if (tarefa.voltasDoLogin === 0) {
      tarefa.voltasDoLogin = 1
      await gravarTarefa(tarefa)
      await navegador.tabs.update(idDaAba, { url: regras.URL_CONSULTA_SICAF })
    } else {
      await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'menu' })
    }
  } else {
    await injetar(idDaAba, ['comum/sei.js', 'comum/sicaf.js', 'sites/sicaf/consulta.js'])
  }
})

// Avisos e scripts nas páginas do Compras/SICAF (só com a permissão opcional dada).
async function injetar (idDaAba, arquivos, dados) {
  try {
    if (dados) await navegador.scripting.executeScript({ target: { tabId: idDaAba }, func: valor => { globalThis.extensaoIftoAviso = valor }, args: [dados] })
    await navegador.scripting.executeScript({ target: { tabId: idDaAba }, files: arquivos })
  } catch (erro) {
    // Página fechada ou sem permissão: a busca continua quando a aba voltar ao SICAF.
  }
}

// A página do SICAF pergunta qual CNPJ pesquisar.
async function qualCnpj (aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.posicao >= tarefa.faltam.length) return { fim: true }
  return { cnpj: tarefa.faltam[tarefa.posicao], pesquisado: tarefa.pesquisado, posicao: tarefa.posicao, total: tarefa.faltam.length }
}
async function marcarPesquisa (cnpj) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.faltam[tarefa.posicao] !== cnpj) return { ok: false }
  tarefa.pesquisado = true
  await gravarTarefa(tarefa)
  return { ok: true }
}

// PDF (ou erro) de um CNPJ: guarda, salva em Downloads (decisão D5) e passa para o próximo.
async function receberPdf (recado, aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.faltam[tarefa.posicao] !== recado.cnpj) return { fim: true }
  if (recado.arquivo) {
    const pdfs = await lerPdfsDeHoje()
    const nomeDoArquivo = regras.nomeDoArquivo(recado.cnpj)
    pdfs[recado.cnpj] = { data: hoje(), nome: recado.nome || '', arquivo: recado.arquivo, nomeDoArquivo }
    await navegador.storage.local.set({ [CHAVE_PDFS]: pdfs })
    await salvarEmDownloads(recado.arquivo, nomeDoArquivo)
  } else {
    tarefa.erros[recado.cnpj] = recado.erro || 'O SICAF não devolveu o PDF.'
  }
  tarefa.posicao++
  tarefa.pesquisado = false
  if (tarefa.posicao < tarefa.faltam.length) {
    await gravarTarefa(tarefa)
    return { proximo: true }
  }
  await terminar(tarefa)
  return { fim: true }
}

async function salvarEmDownloads (base64, nomeDoArquivo) {
  try {
    // Firefox (página de fundo): endereço "blob"; Chrome (service worker): endereço "data".
    const url = typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(new Blob([regras.deBase64(base64)], { type: 'application/pdf' }))
      : 'data:application/pdf;base64,' + base64
    await navegador.downloads.download({ url, filename: nomeDoArquivo, saveAs: false, conflictAction: 'uniquify' })
  } catch (erro) {
    // Sem salvar em Downloads, o PDF ainda vai para o SEI.
  }
}

// Entrega os PDFs (os de hoje + erros) à aba do SEI e volta para ela.
async function terminar (tarefa) {
  await gravarTarefa(null)
  const pdfs = await lerPdfsDeHoje()
  const resultados = tarefa.pedidos.map(cnpj => pdfs[cnpj]
    ? { cnpj, nome: pdfs[cnpj].nome, arquivo: pdfs[cnpj].arquivo, nomeDoArquivo: pdfs[cnpj].nomeDoArquivo }
    : { cnpj, erro: tarefa.erros[cnpj] || 'O SICAF não devolveu o PDF.' })
  if (!await entregar(tarefa.idAbaSei, { tipo: 'sicafPronto', resultados })) return
  try {
    const aba = await navegador.tabs.update(tarefa.idAbaSei, { active: true })
    if (aba && aba.windowId !== undefined) await navegador.windows.update(aba.windowId, { focused: true })
  } catch (erro) {}
}
