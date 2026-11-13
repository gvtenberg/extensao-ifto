// v0.11.0: parte da extensão que roda por trás (Firefox: página de fundo; Chrome: service worker).
// SICAF automático: menu do botão direito "Buscar SICAF deste CNPJ" (também no leitor de PDF do
// navegador, onde a extensão não entra na página) e recado do CNPJ escolhido para a página do SEI.
// v0.13.0: busca no SICAF: abre a aba do SICAF, ajuda no login do Compras.gov.br, pesquisa cada CNPJ,
// devolve os PDFs para a aba do SEI (cópia em Downloads só se a configuração pedir).
// v0.18.2: nada fica guardado na extensão: cada clique busca de novo nos sites; os PDFs ficam só durante a
// busca (dentro da tarefa) e são apagados no fim.
// v0.17.2: depois do SICAF, a mesma aba consulta o Simples Nacional de cada fornecedor (spec consulta-simples).
/* global importScripts */
if (typeof importScripts === 'function' && !(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.simplesNacional)) {
  importScripts('/comum/sei.js', '/comum/configuracoes.js', '/comum/sicaf.js', '/comum/simples-nacional.js')
}
const navegador = globalThis.browser || globalThis.chrome
const regras = globalThis.ExtensaoIFTO.sicaf
const simples = globalThis.ExtensaoIFTO.simplesNacional
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
    case 'sicafBuscar': return iniciarBusca(recado.cnpjs || [], aba, recado.cnpjsSimples)
    case 'sicafCancelar': return gravarTarefa(null).then(() => ({ ok: true }))
    case 'sicafQualCnpj': return qualCnpj(aba)
    case 'sicafPesquisei': return marcarPesquisa(recado.cnpj)
    case 'sicafPdf': return receberPdf(recado, aba)
    case 'simplesQualCnpj': return simplesQualCnpj(aba)
    case 'simplesPesquisei': return simplesPesquisei(recado.cnpj)
    case 'simplesResultado': return receberSimples(recado, aba)
    // v0.17.5: texto de um PDF pedido pela página do SEI (no Firefox o pdf.js só funciona aqui).
    case 'lerPdf': return globalThis.ExtensaoIFTO.pdfTexto ? globalThis.ExtensaoIFTO.pdfTexto.textoDoPdf(recado.bytes).then(texto => ({ texto })) : Promise.resolve({ erro: 'Leitura de PDF indisponível.' })
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
// v0.18.2: memória antiga dos PDFs do dia (até v0.18.1): apagada sempre que a extensão começa.
navegador.storage.local.remove(['sicafPdfs', 'simplesPdfs'])
// Busca que ficou pela metade (navegador fechado): os PDFs dela também saem.
navegador.runtime.onStartup.addListener(() => navegador.storage.local.remove('sicafTarefa'))
const temPermissao = () => navegador.permissions.contains({ origins: [...regras.ORIGENS_COMPRAS, ...simples.ORIGENS_SIMPLES], permissions: ['downloads'] })

async function lerTarefa () {
  const { [CHAVE_TAREFA]: tarefa } = await navegador.storage.local.get(CHAVE_TAREFA)
  return tarefa || null
}
async function gravarTarefa (tarefa) {
  if (tarefa) await navegador.storage.local.set({ [CHAVE_TAREFA]: tarefa })
  else await navegador.storage.local.remove(CHAVE_TAREFA)
}

// v0.17.6: SICAF e Simples Nacional podem ter listas diferentes (cnpjs = SICAF; cnpjsSimples = Simples;
// sem cnpjsSimples, os mesmos do SICAF). Botões de um só ("Incluir SICAF", "Incluir Simples Nacional").
async function iniciarBusca (cnpjs, abaSei, cnpjsSimples) {
  if (!await temPermissao()) return { semPermissao: true }
  const doSicaf = [...new Set(cnpjs.filter(regras.cnpjValido))]
  const doSimples = cnpjsSimples ? [...new Set(cnpjsSimples.filter(regras.cnpjValido))] : doSicaf
  const pedidos = [...new Set([...doSicaf, ...doSimples])]
  // v0.18.2: sempre busca de novo (nada de PDF guardado de outra hora).
  const faltam = doSicaf
  const simplesFaltam = doSimples
  const tarefa = {
    idAbaSei: abaSei.id, pedidos, doSicaf, doSimples, faltam, pdfs: {}, consultas: {}, posicao: 0, pesquisado: false, erros: {}, idAbaSicaf: null, foiAoLogin: false, cliqueiEntrar: false, idasAreaDeTrabalho: 0,
    // v0.17.2: Simples Nacional depois do SICAF ("fase"), com a matriz quando o site recusa a filial (D7).
    fase: faltam.length ? 'sicaf' : 'simples', simplesFaltam, simplesPosicao: 0, simplesPesquisado: false, simplesMatriz: false, simplesErros: {}
  }
  if (!faltam.length && !simplesFaltam.length) return { ok: true, faltam: 0 }
  const endereco = tarefa.fase === 'sicaf' ? regras.URL_CONSULTA_SICAF : simples.URL_CONSULTA_SIMPLES
  const aba = await navegador.tabs.create({ url: endereco, windowId: abaSei.windowId, index: abaSei.index + 1, active: true })
  tarefa.idAbaSicaf = aba.id
  await gravarTarefa(tarefa)
  return { ok: true, faltam: faltam.length + simplesFaltam.length }
}

// Cada página do Compras/SICAF que termina de abrir na aba da busca (ou SICAF aberto pelo menu).
navegador.tabs.onUpdated.addListener(async (idDaAba, mudanca, aba) => {
  if (mudanca.status !== 'complete' || !aba.url) return
  if (simples.ehSiteDoSimples(aba.url)) {
    const tarefa = await lerTarefa()
    if (tarefa && tarefa.fase === 'simples' && idDaAba === tarefa.idAbaSicaf) {
      await injetar(idDaAba, ['comum/sei.js', 'comum/sicaf.js', 'comum/simples-nacional.js', 'comum/pdf-texto.js', 'sites/simples-nacional/consulta.js'])
    }
    return
  }
  const pagina = regras.paginaDoCompras(aba.url)
  if (!pagina) return
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase === 'simples') return
  if (idDaAba !== tarefa.idAbaSicaf) {
    if (pagina !== 'consulta' && pagina !== 'sicaf') return
    tarefa.idAbaSicaf = idDaAba
    await gravarTarefa(tarefa)
  }
  // v0.17.3: sem login, vai à entrada do Compras e clica em "Entrar com Gov.br" (uma vez). Depois do login,
  // abre o SICAF pelo menu da Área de Trabalho (o endereço direto dá "Sessão expirada"). Cada passo tem
  // limite de vezes, para não ficar dando voltas; aí o aviso pede o passo à pessoa.
  if (pagina === 'acessoNegado' || pagina === 'sicafPublico') {
    if (!tarefa.foiAoLogin) {
      tarefa.foiAoLogin = true
      await gravarTarefa(tarefa)
      await navegador.tabs.update(idDaAba, { url: regras.URL_LOGIN_COMPRAS })
    } else if ((tarefa.idasAreaDeTrabalho || 0) < 2) {
      tarefa.idasAreaDeTrabalho = (tarefa.idasAreaDeTrabalho || 0) + 1
      await gravarTarefa(tarefa)
      await navegador.tabs.update(idDaAba, { url: regras.URL_AREA_DE_TRABALHO })
    } else {
      await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'naoAbriu' })
    }
  } else if (pagina === 'login') {
    const clicar = !tarefa.cliqueiEntrar
    if (clicar) { tarefa.cliqueiEntrar = true; await gravarTarefa(tarefa) }
    await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'login', clicar })
  } else if (pagina === 'areaDeTrabalho') {
    await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'areaDeTrabalho' })
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
    const nomeDoArquivo = regras.nomeDoArquivo(recado.cnpj)
    const salvo = await salvarSeConfigurado('copiaSicaf', recado.arquivo, nomeDoArquivo)
    tarefa.pdfs[recado.cnpj] = { nome: recado.nome || '', arquivo: recado.arquivo, nomeDoArquivo, salvo }
  } else {
    tarefa.erros[recado.cnpj] = recado.erro || 'O SICAF não devolveu o PDF.'
  }
  tarefa.posicao++
  tarefa.pesquisado = false
  if (tarefa.posicao < tarefa.faltam.length) {
    await gravarTarefa(tarefa)
    return { proximo: true }
  }
  await irParaOSimples(tarefa, aba.id)
  return { fim: true }
}

// ---------- Consulta do Simples Nacional (v0.17.2) ----------
// Fim do SICAF: a mesma aba abre a consulta do Simples Nacional (ou termina, se não falta nenhuma).
async function irParaOSimples (tarefa, idDaAba) {
  if (!tarefa.simplesFaltam || !tarefa.simplesFaltam.length) return terminar(tarefa)
  tarefa.fase = 'simples'
  await gravarTarefa(tarefa)
  try { await navegador.tabs.update(idDaAba, { url: simples.URL_CONSULTA_SIMPLES }) } catch (erro) { await terminar(tarefa) }
}
// A página do Simples Nacional pergunta qual CNPJ digitar: o da nota ou, se o site recusou, o da matriz.
async function simplesQualCnpj (aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase !== 'simples' || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.simplesPosicao >= tarefa.simplesFaltam.length) return { fim: true }
  const fornecedor = tarefa.simplesFaltam[tarefa.simplesPosicao]
  return {
    cnpj: tarefa.simplesMatriz ? regras.cnpjMatriz(fornecedor) : fornecedor,
    fornecedor,
    pesquisado: tarefa.simplesPesquisado,
    posicao: tarefa.simplesPosicao,
    total: tarefa.simplesFaltam.length
  }
}
async function simplesPesquisei (cnpj) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase !== 'simples') return { ok: false }
  tarefa.simplesPesquisado = true
  await gravarTarefa(tarefa)
  return { ok: true }
}
// PDF (ou erro) de um fornecedor. Filial recusada: tenta a matriz uma vez (D7).
async function receberSimples (recado, aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase !== 'simples' || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.simplesFaltam[tarefa.simplesPosicao] !== recado.fornecedor) return { fim: true }
  tarefa.simplesPesquisado = false
  const matriz = regras.cnpjMatriz(recado.fornecedor)
  if (recado.recusado && !tarefa.simplesMatriz && matriz !== recado.fornecedor) {
    tarefa.simplesMatriz = true
    await gravarTarefa(tarefa)
    return { repetir: true }
  }
  if (recado.arquivo) {
    const nomeDoArquivo = simples.nomeDoArquivo(recado.fornecedor)
    const salvo = await salvarSeConfigurado('copiaConsulta', recado.arquivo, nomeDoArquivo)
    tarefa.consultas[recado.fornecedor] = { nome: recado.nome || '', situacao: recado.situacao || '', cnpjConsultado: recado.cnpj, arquivo: recado.arquivo, nomeDoArquivo, salvo }
  } else {
    tarefa.simplesErros[recado.fornecedor] = recado.erro || 'O Simples Nacional não respondeu.'
  }
  tarefa.simplesPosicao++
  tarefa.simplesMatriz = false
  if (tarefa.simplesPosicao < tarefa.simplesFaltam.length) {
    await gravarTarefa(tarefa)
    return { proximo: true }
  }
  await terminar(tarefa)
  return { fim: true }
}

// v0.18.2: cópia em Downloads só com a opção ligada nas configurações (uma para cada documento).
async function salvarSeConfigurado (opcao, base64, nomeDoArquivo) {
  const configuracoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  return configuracoes[opcao] ? salvarEmDownloads(base64, nomeDoArquivo) : false
}
async function salvarEmDownloads (base64, nomeDoArquivo) {
  try {
    // Firefox (página de fundo): endereço "blob"; Chrome (service worker): endereço "data".
    const url = typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(new Blob([regras.deBase64(base64)], { type: 'application/pdf' }))
      : 'data:application/pdf;base64,' + base64
    await navegador.downloads.download({ url, filename: nomeDoArquivo, saveAs: false, conflictAction: 'uniquify' })
    return true
  } catch (erro) {
    return false
    // Sem salvar em Downloads, o PDF ainda vai para o SEI.
  }
}

// Entrega os PDFs (os de hoje + erros) à aba do SEI e volta para ela.
async function terminar (tarefa) {
  await gravarTarefa(null)
  const pdfs = tarefa.pdfs || {}
  const consultas = tarefa.consultas || {}
  const errosDoSimples = tarefa.simplesErros || {}
  // v0.17.2: cada resultado leva também a consulta do Simples Nacional (usada no SEI na etapa 3).
  // v0.17.6: só a parte pedida de cada CNPJ (SICAF, Simples ou os dois).
  const doSicaf = tarefa.doSicaf || tarefa.pedidos
  const doSimples = tarefa.doSimples || tarefa.pedidos
  const resultados = tarefa.pedidos.map(cnpj => ({
    cnpj,
    ...(!doSicaf.includes(cnpj) ? { semSicaf: true } : pdfs[cnpj]
      ? { nome: pdfs[cnpj].nome, arquivo: pdfs[cnpj].arquivo, nomeDoArquivo: pdfs[cnpj].nomeDoArquivo, salvo: pdfs[cnpj].salvo }
      : { erro: tarefa.erros[cnpj] || 'O SICAF não devolveu o PDF.' }),
    simples: !doSimples.includes(cnpj) ? null : consultas[cnpj]
      ? { nome: consultas[cnpj].nome, situacao: consultas[cnpj].situacao, arquivo: consultas[cnpj].arquivo, nomeDoArquivo: consultas[cnpj].nomeDoArquivo, salvo: consultas[cnpj].salvo }
      : { erro: errosDoSimples[cnpj] || 'A consulta do Simples Nacional não foi feita.' }
  }))
  if (!await entregar(tarefa.idAbaSei, { tipo: 'sicafPronto', resultados })) return
  try {
    const aba = await navegador.tabs.update(tarefa.idAbaSei, { active: true })
    if (aba && aba.windowId !== undefined) await navegador.windows.update(aba.windowId, { focused: true })
  } catch (erro) {}
}
