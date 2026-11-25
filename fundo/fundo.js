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
  importScripts('/comum/sei.js', '/comum/minuta-edital.js', '/comum/conferir-documento.js', '/comum/dados-processo.js', '/comum/data-documento.js', '/comum/configuracoes.js', '/comum/todos-os-estilos.js', '/comum/sicaf.js', '/comum/simples-nacional.js', '/comum/compras-ifto.js', '/sites/sei/editor-preencher.js', '/sites/sei/editor-minuta.js')
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
    case 'sicafBuscar': return iniciarBusca(recado.cnpjs || [], aba, recado.cnpjsSimples, recado.pular)
    case 'sitesRespondem': return sitesRespondem(recado.sites || [])
    // v0.36.2: "Abrir o editor para corrigir" com o editor já aberto: avisa o editor daquele documento.
    case 'editorConferirDeNovo': return avisarEditores(recado)
    case 'sicafCancelar': return cancelarBusca()
    case 'sicafAndamento': return lerTarefa().then(tarefa => regras.andamentoDaBusca(tarefa))
    case 'sicafPular': return pularBusca()
    case 'sicafQualCnpj': return qualCnpj(aba)
    case 'sicafPesquisei': return marcarPesquisa(recado.cnpj)
    case 'sicafPdf': return receberPdf(recado, aba)
    case 'simplesQualCnpj': return simplesQualCnpj(aba)
    case 'simplesPesquisei': return simplesPesquisei(recado.cnpj)
    case 'simplesResultado': return receberSimples(recado, aba)
    // v0.19.0 (spec compras-ifto-no-sei): peças do Compras IFTO e o editor do SEI.
    case 'comprasPeca': return receberPeca(recado.peca, remetente)
    case 'comprasPreencher': return abrirEditor(recado, aba)
    case 'comprasConfiguracoes': return navegador.tabs.create({ url: navegador.runtime.getURL('configuracoes/index.html#compras') }).then(() => ({ ok: true }))
    // v0.22.0 (spec minuta-edital): marca MINUTA dos editais, no editor do SEI de onde veio o recado.
    case 'minutaVerificar': return minutaNoEditor(remetente, false)
    case 'minutaRemover': return minutaNoEditor(remetente, true)
    // v0.23.0 (spec data-documento): data de hoje no Ofício e na Portaria.
    case 'dataVerificar': return dataNoEditor(remetente, false, recado.titulo)
    case 'dataAtualizar': return dataNoEditor(remetente, true, recado.titulo)
    // v0.24.0 (spec tabelas-editor): tabelas no editor (recortar e colar, margens).
    case 'tabelasPreparar': return tabelasNoEditor(remetente, recado)
    // v0.25.0 (spec numeracao-edital): números longos dos itens de edital.
    case 'numeracaoPreparar': return numeracaoNoEditor(remetente, false)
    case 'numeracaoCorrigir': return numeracaoNoEditor(remetente, true)
    // v0.26.11 (spec conferir-documento, etapa 7): espaço entre as partes do documento.
    case 'estilosPreparar': return estilosNoEditor(remetente, recado.aprendidos)
    // v0.29.2 (R7): opção desligada: o documento já tem o bloco dos estilos extras?
    // v0.31.0 (spec copia-editor-sei): salvamento automático e Copiar/Colar conteúdo no editor.
    case 'salvamentoPreparar': return salvamentoNoEditor(remetente, 'preparar')
    case 'salvamentoLer': return salvamentoNoEditor(remetente, 'ler', recado.desde)
    case 'salvamentoRestaurar': return salvamentoNoEditor(remetente, 'montar', recado.copia)
    case 'estilosVerificar': return rodarNoEditor(remetente)(globalThis.ExtensaoIFTO.editorLer).then(lido => lido.ok ? { ok: true, usa: (lido.secoes || []).some(secao => globalThis.ExtensaoIFTO.todosOsEstilos.temBloco(secao.html)) } : lido)
    case 'espacamentoMedir': return espacamentoNoEditor(remetente, 'medir')
    case 'espacamentoPor': return espacamentoNoEditor(remetente, 'por', recado.bloco, recado.substituir)
    // v0.35.3: linhas em branco antes e depois de quem assina (só com o clique da pessoa).
    case 'espacamentoLinhas': return espacamentoNoEditor(remetente, 'porLinhas', recado.linhas)
    case 'espacamentoDesfazer': return espacamentoNoEditor(remetente, 'tirar')
    // v0.26.2 (spec conferir-documento): conferir o documento no editor (número do processo).
    case 'conferirVerificar': return conferirNoEditor(remetente, { sigla: recado.sigla })
    case 'conferirCorrigir': return conferirNoEditor(remetente, recado)
    // v0.26.5 (D3): linhas do setor do timbre aberto no editor, para "Usar este timbre como padrão da unidade".
    case 'conferirLinhasDoSetor': return rodarNoEditor(remetente)(globalThis.ExtensaoIFTO.editorLer).then(lido => lido.ok ? { ok: true, linhas: globalThis.ExtensaoIFTO.conferirDocumento.linhasDoSetor(lido.secoes) } : lido)
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
// v0.18.5: cada passo gravado marca a hora (a janela do SEI avisa quando o site fica sem responder).
async function gravarTarefa (tarefa) {
  if (tarefa) await navegador.storage.local.set({ [CHAVE_TAREFA]: { ...tarefa, ultimoPasso: Date.now() } })
  else await navegador.storage.local.remove(CHAVE_TAREFA)
}

// v0.17.6: SICAF e Simples Nacional podem ter listas diferentes (cnpjs = SICAF; cnpjsSimples = Simples;
// sem cnpjsSimples, os mesmos do SICAF). Botões de um só ("Incluir SICAF", "Incluir Simples Nacional").
// v0.36.2: "pular" = sites que não responderam e a pessoa mandou pular.
async function iniciarBusca (cnpjs, abaSei, cnpjsSimples, pular) {
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
  if (pular && pular.length) {
    regras.pularAntes(tarefa, pular)
    if (!tarefa.faltam.length && !tarefa.simplesFaltam.length) {
      await terminar(tarefa)
      return { ok: true, faltam: 0 }
    }
  }
  const endereco = tarefa.fase === 'sicaf' ? regras.URL_CONSULTA_SICAF : simples.URL_CONSULTA_SIMPLES
  const aba = await navegador.tabs.create({ url: endereco, windowId: abaSei.windowId, index: abaSei.index + 1, active: true })
  tarefa.idAbaSicaf = aba.id
  await gravarTarefa(tarefa)
  return { ok: true, faltam: tarefa.faltam.length + tarefa.simplesFaltam.length }
}

// v0.36.2 (pedido do usuário, 25/11/2026): os sites da busca respondem? Um pedido simples, sem a entrada da
// pessoa (credentials: 'omit') e com tempo limite; só diz se há resposta. Devolve { sicaf: true|false, … }.
async function sitesRespondem (sites) {
  const enderecos = { sicaf: regras.URL_INICIO_SICAF, simples: simples.URL_CONSULTA_SIMPLES }
  const pares = await Promise.all(sites.filter(site => enderecos[site]).map(async site => {
    const controle = new AbortController()
    const relogio = setTimeout(() => controle.abort(), regras.LIMITE_DA_RESPOSTA_MS)
    try {
      const resposta = await fetch(enderecos[site], { credentials: 'omit', cache: 'no-store', redirect: 'manual', signal: controle.signal })
      return [site, regras.siteRespondeu(resposta)]
    } catch (erro) {
      return [site, false]
    } finally {
      clearTimeout(relogio)
      controle.abort() // o texto da página não interessa
    }
  }))
  return Object.fromEntries(pares)
}

async function avisarEditores ({ documento }) {
  const abas = await navegador.tabs.query({ url: PAGINAS_DO_SEI })
  await Promise.all(abas.map(aba => Promise.resolve(navegador.tabs.sendMessage(aba.id, { tipo: 'editorConferirDeNovo', documento }, { frameId: 0 })).catch(() => {})))
  return { ok: true }
}

// v0.18.5 (pedido de 18/11/2026: o SICAF fora do ar travou a busca): a pessoa pode, a qualquer momento,
// pular o site da vez (segue para o Simples Nacional ou termina com o que já veio) ou cancelar tudo.
async function pularBusca () {
  const tarefa = await lerTarefa()
  if (!tarefa) return { ok: false }
  const site = tarefa.fase === 'sicaf' ? 'o SICAF' : 'o Simples Nacional'
  const fase = tarefa.fase
  regras.pularFase(tarefa, `Não consultado: você pulou ${site}.`)
  if (fase === 'sicaf') await irParaOSimples(tarefa, tarefa.idAbaSicaf)
  else await terminar(tarefa)
  return { ok: true }
}
// Cancelar: esquece a busca, fecha a aba que a extensão abriu e volta ao SEI.
async function cancelarBusca () {
  const tarefa = await lerTarefa()
  await gravarTarefa(null)
  if (tarefa) await fecharAbaDaBusca(tarefa)
  return { ok: true }
}
async function fecharAbaDaBusca (tarefa) {
  try { if (tarefa.idAbaSicaf != null) await navegador.tabs.remove(tarefa.idAbaSicaf) } catch (erro) {}
  try { await navegador.tabs.update(tarefa.idAbaSei, { active: true }) } catch (erro) {}
}
// A pessoa fechou a aba da busca: termina com o que já veio (antes a janela do SEI esperava para sempre).
// Aba do SEI fechada: a busca não tem para onde voltar e é esquecida.
navegador.tabs.onRemoved.addListener(async idDaAba => {
  const tarefa = await lerTarefa()
  if (!tarefa) return
  if (idDaAba === tarefa.idAbaSei) return gravarTarefa(null)
  if (idDaAba !== tarefa.idAbaSicaf) return
  tarefa.idAbaSicaf = null
  const motivo = 'Não consultado: a aba do site foi fechada antes do fim.'
  if (regras.pularFase(tarefa, motivo) === 'simples') { tarefa.fase = 'simples'; regras.pularFase(tarefa, motivo) }
  await terminar(tarefa)
})

// Cada página do Compras/SICAF que termina de abrir na aba da busca (ou SICAF aberto pelo menu).
// v0.29.3 (T173): a Área de Trabalho é uma página que troca de endereço sem recarregar; a troca de endereço
// também conta (só para ela), e a aba é tratada uma vez só até sair da Área de Trabalho.
const areaEmAndamento = new Set()
navegador.tabs.onUpdated.addListener(async (idDaAba, mudanca, aba) => {
  if (mudanca.url && regras.paginaDoCompras(mudanca.url) !== 'areaDeTrabalho') areaEmAndamento.delete(idDaAba)
  if (!aba.url) return
  if (mudanca.status !== 'complete' && !(mudanca.url && regras.paginaDoCompras(mudanca.url) === 'areaDeTrabalho')) return
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
    // v0.29.3 (T173, usuário 19/11/2026): durante a busca, a Área de Trabalho em qualquer aba também vai ao SICAF.
    if (pagina !== 'consulta' && pagina !== 'sicaf' && pagina !== 'areaDeTrabalho') return
    // v0.21.6: o SICAF abriu em outra aba (pelo menu ou pela pessoa): tira o aviso "Abrindo o SICAF…" da anterior.
    if (tarefa.idAbaSicaf != null) {
      navegador.scripting.executeScript({ target: { tabId: tarefa.idAbaSicaf }, func: () => { const aviso = document.querySelector('[data-extensao-ifto="aviso-compras"]'); if (aviso) aviso.remove() } }).catch(() => {})
    }
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
  } else if (pagina === 'loginGovBr') {
    // v0.21.2 (pedido do usuário em 18/11/2026): só quando a própria extensão levou ao login (o SICAF deu
    // erro e ela clicou em "Entrar com Gov.br"), clica uma vez em SerproID; QR code e código são da pessoa.
    // v0.21.3: e só com a opção ligada nas configurações (sem ela, nem há acesso à página do Gov.br).
    if (!tarefa.cliqueiEntrar) return
    const { entrarComSerproId } = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
    if (!entrarComSerproId) return
    const clicar = !tarefa.cliqueiSerpro
    if (clicar) { tarefa.cliqueiSerpro = true; await gravarTarefa(tarefa) }
    await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'loginGovBr', clicar })
  } else if (pagina === 'areaDeTrabalho') {
    // v0.21.6 (pedido do usuário em 18/11/2026: o menu não abria o SICAF): primeiro vai direto ao início do
    // SICAF na mesma aba; se o SICAF recusar e a aba voltar aqui, tenta pelo menu do usuário.
    // v0.26.10 (pedido de 19/11/2026, T94: o SICAF não abriu): espera 3 segundos a Área de Trabalho terminar
    // de entrar antes de ir ao SICAF, e tenta direto duas vezes antes do menu.
    // v0.29.3 (T173, 3º pedido): a própria página abre o endereço do SICAF (como um clique nela) só depois de
    // o login terminar (aparece o botão com o nome da pessoa); antes ia por fora, com tempo fixo de 3 segundos.
    if (areaEmAndamento.has(idDaAba)) return
    areaEmAndamento.add(idDaAba)
    if ((tarefa.idasDiretoAoSicaf || 0) < 2) {
      tarefa.idasDiretoAoSicaf = (tarefa.idasDiretoAoSicaf || 0) + 1
      await gravarTarefa(tarefa)
      await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'areaDeTrabalho', direto: regras.URL_INICIO_SICAF })
    } else {
      await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'areaDeTrabalho' })
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
  if (!tarefa.simplesFaltam || !tarefa.simplesFaltam.length || idDaAba == null) return terminar(tarefa)
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
  // v0.18.5: com algum CNPJ sem PDF (site fora do ar, pulado), a aba aberta pela extensão é fechada.
  // v0.21.6 (pedido do usuário em 18/11/2026): fechada também quando deu tudo certo (SICAF e Simples).
  await fecharAbaDaBusca(tarefa)
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

// ---------- Peças do Compras IFTO para o SEI (v0.19.0, spec compras-ifto-no-sei) ----------
// A ponte entra na página do Compras IFTO só com a permissão opcional dada (D2): a cada página que termina
// de abrir e logo depois que a pessoa permite (abas já abertas).
async function porPonte (idDaAba) {
  try {
    await navegador.scripting.executeScript({ target: { tabId: idDaAba }, files: ['comum/compras-ifto.js', 'sites/compras-ifto/ponte.js'] })
  } catch (erro) {
    // Sem permissão ou aba fechada: nada a fazer.
  }
}
navegador.tabs.onUpdated.addListener((idDaAba, mudanca, aba) => {
  if (mudanca.status === 'complete' && aba.url && compras.ehDoCompras(aba.url)) porPonte(idDaAba)
})
if (navegador.permissions && navegador.permissions.onAdded) {
  navegador.permissions.onAdded.addListener(async () => {
    try {
      const abas = await navegador.tabs.query({ url: compras.ORIGENS_COMPRAS })
      for (const aba of abas) porPonte(aba.id)
    } catch (erro) {}
  })
}

// D8: lista de peças esperando, no navegador (storage.local "pecasCompras").
async function receberPeca (peca, remetente) {
  const endereco = remetente.url || (remetente.tab && remetente.tab.url) || ''
  if (!compras.ehDoCompras(endereco)) return { erro: 'endereço não permitido' }
  const lida = compras.lerPeca({ origem: 'compras-ifto', tipo: 'enviar-ao-sei', peca })
  if (lida.erro) return { erro: lida.erro }
  const { pecasCompras } = await navegador.storage.local.get('pecasCompras')
  const lista = compras.juntarPeca(pecasCompras, lida.peca, Date.now())
  await navegador.storage.local.set({ pecasCompras: lista })
  return { ok: true, total: lista.length }
}

// Etapa 3: abre o editor do documento recém-criado numa janela, põe o texto e salva (nunca assina).
// A página do SEI recebe o resultado pelo recado "comprasResultado".
const CHAVE_EDITOR = 'comprasTarefa'
const ESPERA_DO_EDITOR = 120000
async function abrirEditor ({ urlEditor, idDocumento, html }, abaSei) {
  let endereco
  try { endereco = new URL(urlEditor) } catch (erro) { return { erro: 'endereço do editor inválido' } }
  if (endereco.hostname !== 'sei.ifto.edu.br' || endereco.searchParams.get('acao') !== 'editor_montar') return { erro: 'endereço do editor inválido' }
  if (!abaSei || typeof html !== 'string' || !html) return { erro: 'pedido incompleto' }
  const janela = await navegador.windows.create({ url: endereco.href, type: 'popup', width: 1100, height: 820 })
  const idAba = janela.tabs && janela.tabs[0] ? janela.tabs[0].id : null
  const tarefa = { idAbaSei: abaSei.id, idJanela: janela.id, idAba, idDocumento: String(idDocumento || ''), html, estado: 'abrindo', inicio: Date.now() }
  await navegador.storage.local.set({ [CHAVE_EDITOR]: tarefa })
  setTimeout(async () => {
    const atual = await lerTarefaDoEditor()
    if (atual && atual.inicio === tarefa.inicio) concluirEditor({ ok: false, erro: 'O editor do SEI demorou demais para salvar.' }, false)
  }, ESPERA_DO_EDITOR)
  return { ok: true }
}
async function lerTarefaDoEditor () {
  const { [CHAVE_EDITOR]: tarefa } = await navegador.storage.local.get(CHAVE_EDITOR)
  return tarefa || null
}
navegador.tabs.onUpdated.addListener(async (idDaAba, mudanca, aba) => {
  if (mudanca.status !== 'complete' || !aba.url || !/[?&]acao=editor_montar/.test(aba.url)) return
  const tarefa = await lerTarefaDoEditor()
  if (!tarefa || (tarefa.idAba !== null && tarefa.idAba !== idDaAba)) return
  // O editor antigo salva recarregando a página: se ela volta depois do Salvar, salvou.
  if (tarefa.estado === 'salvando') { concluirEditor({ ok: true, salvou: 'recarregou' }, true); return }
  tarefa.estado = 'salvando'
  tarefa.idAba = idDaAba
  await navegador.storage.local.set({ [CHAVE_EDITOR]: tarefa })
  try {
    const [execucao] = await navegador.scripting.executeScript({ target: { tabId: idDaAba }, world: 'MAIN', func: globalThis.ExtensaoIFTO.editorPreencher, args: [tarefa.html] })
    const resultado = execucao && execucao.result
    if (resultado) concluirEditor(resultado, resultado.ok)
  } catch (erro) {
    // Página recarregada no meio do Salvar (editor antigo): o próximo "complete" conclui.
  }
})
// Fecha a janela do editor só quando deu certo (com erro, a pessoa vê o editor e termina à mão).
async function concluirEditor (resultado, fecharJanela) {
  const tarefa = await lerTarefaDoEditor()
  if (!tarefa) return
  await navegador.storage.local.remove(CHAVE_EDITOR)
  if (fecharJanela) { try { await navegador.windows.remove(tarefa.idJanela) } catch (erro) {} }
  await entregar(tarefa.idAbaSei, { tipo: 'comprasResultado', idDocumento: tarefa.idDocumento, resultado })
  try {
    const aba = await navegador.tabs.update(tarefa.idAbaSei, { active: true })
    if (aba && aba.windowId !== undefined) await navegador.windows.update(aba.windowId, { focused: true })
  } catch (erro) {}
}
navegador.runtime.onStartup.addListener(() => navegador.storage.local.remove(CHAVE_EDITOR))

// v0.22.0 (spec minuta-edital): lê o texto do editor; com "remover", tira a marca MINUTA das seções editáveis
// e confere de novo. Nunca salva: a pessoa confere e clica em Salvar.
// Devolve { ok, erro, marcas, removidas, restou, trechos }.
// v0.23.0: roda uma das funções de editor-minuta.js na janela do editor de onde veio o recado (MINUTA e data).
function rodarNoEditor (remetente) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  return async (func, args = []) => {
    const [execucao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func, args })
    return (execucao && execucao.result) || { ok: false, erro: 'O editor do SEI não respondeu.' }
  }
}

// v0.24.0 (spec tabelas-editor): põe as regras das margens e o código das tabelas dentro da página do editor
// (world MAIN) e liga o que a pessoa deixou ligado nas configurações.
async function tabelasNoEditor (remetente, recado) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: ['comum/tabelas-editor.js', 'sites/sei/editor-tabelas.js'] })
  return rodarNoEditor(remetente)(opcoes => globalThis.ExtensaoIFTO.editorTabelas.preparar(opcoes), [{ mover: Boolean(recado.mover), margens: Boolean(recado.margens) }])
}

// v0.25.0 (spec numeracao-edital): põe as regras e o código da numeração dentro da página do editor (world
// MAIN); "preparar" procura os itens quebrados e fica de olho nas mudanças, "corrigir" põe o bloco de estilo.
async function numeracaoNoEditor (remetente, corrigir) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  if (!corrigir) await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: ['comum/numeracao-edital.js', 'sites/sei/editor-numeracao.js'] })
  return rodarNoEditor(remetente)(fazer => fazer ? globalThis.ExtensaoIFTO.editorNumeracao.corrigir() : globalThis.ExtensaoIFTO.editorNumeracao.preparar(), [corrigir])
}

// v0.29.0 (spec todos-os-estilos): põe na página do editor (world MAIN) as regras e o código dos estilos extras
// (reusa acharEditor da numeração) e junta os estilos que faltam ao tipo de documento.
async function estilosNoEditor (remetente, aprendidos) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  const [temNumeracao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => Boolean(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorNumeracao) })
  const arquivos = ['comum/todos-os-estilos.js', 'sites/sei/editor-estilos.js']
  if (!(temNumeracao && temNumeracao.result)) arquivos.unshift('sites/sei/editor-numeracao.js')
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  return rodarNoEditor(remetente)(lista => globalThis.ExtensaoIFTO.editorEstilos.preparar(lista), [aprendidos || {}])
}

// v0.31.0 (spec copia-editor-sei): põe na página do editor (world MAIN) o código da cópia; lê o texto e os
// comentários ou recarrega o editor com uma cópia (nunca salva).
async function salvamentoNoEditor (remetente, acao, dado) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  // v0.31.2: põe o código antes de toda leitura (nenhuma tela pedia "preparar", e o editor "não respondia";
  // o arquivo não se carrega duas vezes).
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: ['sites/sei/editor-salvamento.js'] })
  const rodar = rodarNoEditor(remetente)
  if (acao === 'montar') return rodar((secoes, comentarios) => globalThis.ExtensaoIFTO.editorSalvamento.montar(secoes, comentarios), [dado.secoes || {}, dado.comentarios || []])
  return rodar(desde => globalThis.ExtensaoIFTO.editorSalvamento.ler(desde), [Boolean(dado)])
}

// v0.26.11 (spec conferir-documento, etapa 7): põe na página do editor (world MAIN) o código que mede as partes
// do documento e põe ou tira o bloco de estilo do espaçamento (reusa acharEditor e porBloco da numeração).
async function espacamentoNoEditor (remetente, acao, bloco = '', substituir = false) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  if (acao === 'medir') {
    const [temNumeracao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => Boolean(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorNumeracao) })
    const arquivos = ['comum/espacamento-documento.js', 'sites/sei/editor-espacamento.js']
    if (!(temNumeracao && temNumeracao.result)) arquivos.unshift('sites/sei/editor-numeracao.js')
    await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  }
  return rodarNoEditor(remetente)((qual, texto, trocar) => globalThis.ExtensaoIFTO.editorEspacamento[qual](texto, trocar), [acao, bloco, Boolean(substituir)])
}

async function minutaNoEditor (remetente, remover) {
  const regrasMinuta = globalThis.ExtensaoIFTO.minutaEdital
  const rodar = rodarNoEditor(remetente)
  const contar = secoes => secoes.filter(secao => regrasMinuta.temMarcaMinuta(secao.html)).length
  const lido = await rodar(globalThis.ExtensaoIFTO.editorLer)
  if (!lido.ok) return { ok: false, erro: lido.erro }
  const marcas = contar(lido.secoes)
  if (!remover || !marcas) return { ok: true, marcas, removidas: 0, restou: marcas, trechos: [] }
  const mudancas = {}
  let removidas = 0
  for (const secao of lido.secoes) {
    if (!secao.editavel || !regrasMinuta.temMarcaMinuta(secao.html)) continue
    const limpo = regrasMinuta.tirarMarcaMinuta(secao.html)
    mudancas[secao.nome] = limpo.html
    removidas += limpo.removidas
  }
  if (!removidas) return { ok: false, erro: 'A marca está numa parte do documento que não dá para editar.', marcas }
  const gravado = await rodar(globalThis.ExtensaoIFTO.editorGravar, [mudancas])
  if (!gravado.ok) return { ok: false, erro: gravado.erro, marcas }
  const depois = await rodar(globalThis.ExtensaoIFTO.editorLer)
  const secoes = depois.ok ? depois.secoes : []
  const trechos = secoes.flatMap(secao => regrasMinuta.minutaNoTexto(secao.html)).slice(0, 3)
  return { ok: true, marcas, removidas, restou: depois.ok ? contar(secoes) : 0, trechos }
}

// v0.26.2 (spec conferir-documento): confere o texto do editor; com "qual" corrige só aquela parte e confere
// de novo. Nunca salva. 'processo': troca o número só na linha "Processo nº:". v0.26.5: 'timbre' e 'rodape'
// (só em unidades do Campus Palmas; dados da unidade em "Minhas unidades").
// v0.33.0: 'capa' (Data de Autuação, Tipo, Especificação e Interessados da Capa de Processo).
// v0.35.2: 'cargo' e 'italico'.
// Devolve { ok, erro, processo, timbre, rodape, capa, cargo, italico } (cada um null quando não há o que conferir).
async function conferirNoEditor (remetente, recado) {
  const regras = globalThis.ExtensaoIFTO.conferirDocumento
  const opcoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  const sigla = regras.siglaDaUnidade(recado.sigla)
  const palmas = regras.ehUnidadePalmas(sigla)
  const unidade = regras.acharUnidade(opcoes.unidades, sigla)
  const rodar = rodarNoEditor(remetente)
  // v0.33.0: Capa de Processo contra os dados do processo guardados pela tela do processo (dados-processo.js).
  const dadosProcesso = globalThis.ExtensaoIFTO.dadosProcesso
  const guardados = opcoes.conferirProcesso ? ((await navegador.storage.local.get(dadosProcesso.CHAVE))[dadosProcesso.CHAVE] || {}) : {}
  const capaDe = secoes => {
    const capa = dadosProcesso.lerCapa(secoes)
    const dados = capa && guardados[regras.processoDaReferencia(secoes)]
    const conferido = dados ? dadosProcesso.conferirCapa(capa, dados) : null
    return conferido ? { ...conferido, secao: capa.secao, avisos: dadosProcesso.avisosDaCapa(conferido), dados } : null
  }
  const conferir = secoes => ({
    processo: opcoes.conferirProcesso ? regras.conferirProcesso(secoes) : null,
    timbre: palmas && opcoes.conferirTimbre ? regras.conferirTimbre(secoes, unidade, sigla) : null,
    rodape: palmas && opcoes.conferirRodape ? regras.conferirRodape(secoes, unidade) : null,
    capa: opcoes.conferirProcesso ? capaDe(secoes) : null,
    // v0.35.3: o que dá para guardar em "Minhas unidades" (unidade sem timbre ou sem rodapé guardado).
    sugestao: palmas ? regras.sugerirUnidade(secoes, unidade, { timbre: opcoes.conferirTimbre, rodape: opcoes.conferirRodape }) : null,
    // v0.35.2: cargo da diretora-geral (só PAL/REI/IFTO) e "Campus"/"Campi" em itálico (toda unidade).
    cargo: opcoes.conferirCargo ? regras.conferirCargo(secoes, sigla) : null,
    italico: opcoes.conferirItalico ? regras.conferirItalico(secoes) : null
  })
  const lido = await rodar(globalThis.ExtensaoIFTO.editorLer)
  if (!lido.ok) return { ok: false, erro: lido.erro }
  const antes = conferir(lido.secoes)
  const qual = recado.qual
  if (!qual || !antes[qual] || antes[qual].certo) return { ok: true, ...antes }
  let secao = null
  let novo = null
  if (qual === 'processo') {
    secao = lido.secoes.find(outra => outra.nome === antes.processo.secao)
    novo = secao && !antes.processo.link && regras.corrigirProcesso(secao.html, antes.processo.processo)
  } else if (qual === 'timbre') {
    secao = regras.secaoCom(lido.secoes, regras.ehDoTimbre)
    novo = secao && regras.corrigirTimbre(secao.html, antes.timbre.esperado)
  } else if (qual === 'capa') {
    secao = lido.secoes.find(outra => outra.nome === antes.capa.secao)
    novo = secao && dadosProcesso.corrigirCapa(secao.html, antes.capa.dados, antes.capa)
  } else if (qual === 'rodape') {
    secao = regras.secaoCom(lido.secoes, regras.ehDoRodape)
    novo = secao && regras.corrigirRodape(secao.html, unidade)
  }
  if (qual === 'cargo') {
    secao = lido.secoes.find(outra => outra.nome === antes.cargo.secao)
    novo = secao && regras.corrigirCargo(secao.html, antes.cargo)
  }
  // O itálico pode estar em várias partes do documento.
  const mudancas = qual === 'italico' ? regras.corrigirItalico(lido.secoes) : (secao && secao.editavel && novo ? { [secao.nome]: novo } : {})
  if (!Object.keys(mudancas).length) return { ok: false, erro: 'Essa parte do documento não dá para mudar no editor.' }
  const gravado = await rodar(globalThis.ExtensaoIFTO.editorGravar, [mudancas])
  if (!gravado.ok) return { ok: false, erro: gravado.erro }
  const depois = await rodar(globalThis.ExtensaoIFTO.editorLer)
  const conferido = depois.ok ? conferir(depois.secoes) : null
  const ficou = conferido && conferido[qual] && (conferido[qual].certo || (qual === 'italico' && conferido.italico.quantos === conferido.italico.travados))
  if (!ficou) return { ok: false, erro: 'O editor não ficou com o texto novo.' }
  return { ok: true, ...conferido }
}

// v0.23.0 (spec data-documento): data do Ofício e da Portaria. v0.26.9 (spec conferir-documento, etapa 8):
// confere a data de todo documento (mês ou ano errado, dia que não chegou ou, v0.34.2, que já passou,
// fora do padrão). Com "trocar", corrige só essa data e confere de novo. Nunca salva.
// Devolve { ok, erro, conferido, nova }.
async function dataNoEditor (remetente, trocar, titulo) {
  const regras = globalThis.ExtensaoIFTO.dataDocumento
  const rodar = rodarNoEditor(remetente)
  const hoje = new Date()
  const conferir = secoes => regras.conferirData(secoes, hoje)
  const lido = await rodar(globalThis.ExtensaoIFTO.editorLer)
  if (!lido.ok) return { ok: false, erro: lido.erro }
  const conferido = conferir(lido.secoes)
  if (!trocar || !conferido || conferido.certo) return { ok: true, conferido }
  const secao = lido.secoes.find(outra => outra.nome === conferido.secao)
  const novo = secao && regras.corrigirData(secao.html, conferido)
  if (!novo) return { ok: false, erro: 'Não achei a data no texto do editor.' }
  const gravado = await rodar(globalThis.ExtensaoIFTO.editorGravar, [{ [secao.nome]: novo }])
  if (!gravado.ok) return { ok: false, erro: gravado.erro }
  const depois = await rodar(globalThis.ExtensaoIFTO.editorLer)
  const agora = depois.ok ? conferir(depois.secoes) : null
  if (!depois.ok || (agora && !agora.certo && agora.texto === conferido.texto)) return { ok: false, erro: 'O editor não ficou com a data nova.' }
  return { ok: true, conferido: agora, nova: conferido.nova }
}
