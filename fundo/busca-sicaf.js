// v0.38.0 (saiu de fundo.js): busca no SICAF (v0.13.0): abre a aba do SICAF, ajuda no login do Compras.gov.br,
// pesquisa cada CNPJ e devolve os PDFs para a aba do SEI. Nada fica guardado: os PDFs ficam só durante a busca.
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
  // A aba pode já ter sido fechada pela pessoa: nos dois casos, nada a fazer.
  try { if (tarefa.idAbaSicaf != null) await navegador.tabs.remove(tarefa.idAbaSicaf) } catch (erro) { /* aba já fechada */ }
  try { await navegador.tabs.update(tarefa.idAbaSei, { active: true }) } catch (erro) { /* aba já fechada */ }
}
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
// v0.37.0: quando cada aba saiu da Área de Trabalho (para reconhecer a página de entrada do SICAF).
const saiuDaArea = new Map()
navegador.tabs.onUpdated.addListener(async (idDaAba, mudanca, aba) => {
  if (mudanca.url && regras.paginaDoCompras(mudanca.url) !== 'areaDeTrabalho' && areaEmAndamento.delete(idDaAba)) saiuDaArea.set(idDaAba, Date.now())
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
  // v0.37.0 (T299): até 60 segundos depois do clique no menu da Área de Trabalho, uma página pública do SICAF
  // pode ser a de entrada (ainda preparando a sessão): espera nela em vez de voltar ao login.
  if (pagina === 'sicafPublico' && Date.now() - (saiuDaArea.get(idDaAba) || 0) < 60000) {
    await injetar(idDaAba, ['comum/sei.js', 'comum/sicaf.js', 'sites/sicaf/consulta.js'])
    return
  }
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
    // v0.37.0 (T299, decidido com o usuário em 26/11/2026): o SICAF só aceita a entrada pelo menu da Área de
    // Trabalho: o botão "SICAF" pede ao Compras um endereço de entrada de uso único e o abre numa aba nova. A
    // extensão clica nesse botão (a própria página faz os pedidos; a extensão não mexe no login) e o endereço
    // abre na mesma aba. Ir direto ao endereço do SICAF dava "Sessão expirada".
    if (areaEmAndamento.has(idDaAba)) return
    areaEmAndamento.add(idDaAba)
    // Página ainda carregando e o navegador recusou: tenta de novo quando ela terminar de abrir.
    if (!(await injetar(idDaAba, ['sites/compras/aviso.js'], { modo: 'areaDeTrabalho' }))) areaEmAndamento.delete(idDaAba)
  } else {
    await injetar(idDaAba, ['comum/sei.js', 'comum/sicaf.js', 'sites/sicaf/consulta.js'])
  }
})

// A página do SICAF pergunta qual CNPJ pesquisar.
async function qualCnpj (aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.posicao >= tarefa.faltam.length) return { fim: true }
  // v0.37.0: espera na página de entrada do SICAF: 3 segundos, mais 3 a cada "Sessão expirada" anterior.
  return { cnpj: tarefa.faltam[tarefa.posicao], pesquisado: tarefa.pesquisado, posicao: tarefa.posicao, total: tarefa.faltam.length, esperaEntrada: 3 + 3 * (tarefa.idasAreaDeTrabalho || 0) }
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
  const resultadoDoSicaf = cnpj => {
    if (!doSicaf.includes(cnpj)) return { semSicaf: true }
    const pdf = pdfs[cnpj]
    if (!pdf) return { erro: tarefa.erros[cnpj] || 'O SICAF não devolveu o PDF.' }
    return { nome: pdf.nome, arquivo: pdf.arquivo, nomeDoArquivo: pdf.nomeDoArquivo, salvo: pdf.salvo }
  }
  const resultadoDoSimples = cnpj => {
    if (!doSimples.includes(cnpj)) return null
    const consulta = consultas[cnpj]
    if (!consulta) return { erro: errosDoSimples[cnpj] || 'A consulta do Simples Nacional não foi feita.' }
    return { nome: consulta.nome, situacao: consulta.situacao, arquivo: consulta.arquivo, nomeDoArquivo: consulta.nomeDoArquivo, salvo: consulta.salvo }
  }
  const resultados = tarefa.pedidos.map(cnpj => ({ cnpj, ...resultadoDoSicaf(cnpj), simples: resultadoDoSimples(cnpj) }))
  if (!await entregar(tarefa.idAbaSei, { tipo: 'sicafPronto', resultados })) return
  await trazerAbaParaFrente(tarefa.idAbaSei)
}
