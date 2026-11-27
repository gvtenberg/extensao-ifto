// v0.11.0: parte da extensão que roda por trás (Firefox: página de fundo; Chrome: service worker).
// SICAF automático: menu do botão direito "Buscar SICAF deste CNPJ" (também no leitor de PDF do
// navegador, onde a extensão não entra na página) e recado do CNPJ escolhido para a página do SEI.
// v0.13.0: busca no SICAF: abre a aba do SICAF, ajuda no login do Compras.gov.br, pesquisa cada CNPJ,
// devolve os PDFs para a aba do SEI (cópia em Downloads só se a configuração pedir).
// v0.18.2: nada fica guardado na extensão: cada clique busca de novo nos sites; os PDFs ficam só durante a
// busca (dentro da tarefa) e são apagados no fim.
// v0.17.2: depois do SICAF, a mesma aba consulta o Simples Nacional de cada fornecedor (spec consulta-simples).
// v0.38.0: dividida em partes, uma por assunto (base, busca-sicaf, busca-simples, copia-downloads, compras-ifto,
// editor); aqui ficam só o menu do botão direito e a distribuição dos recados.
/* global importScripts */
if (typeof importScripts === 'function' && !(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.simplesNacional)) {
  importScripts('/comum/sei.js', '/comum/minuta-edital.js', '/comum/conferir-documento.js', '/comum/dados-processo.js', '/comum/data-documento.js', '/comum/configuracoes.js', '/comum/todos-os-estilos.js', '/comum/sicaf.js', '/comum/simples-nacional.js', '/comum/compras-ifto.js', '/sites/sei/editor-preencher.js', '/sites/sei/editor-minuta.js')
  importScripts('/fundo/base.js', '/fundo/busca-sicaf.js', '/fundo/busca-simples.js', '/fundo/copia-downloads.js', '/fundo/compras-ifto.js', '/fundo/editor.js')
}

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
    case 'caixasNoEditor': return caixasNoEditor(remetente, recado.acao, recado.dado)
    // v0.37.0 (spec remover-formatacao-agu).
    case 'aguNoEditor': return aguNoEditor(remetente, recado.acao, recado.dado)
    // v0.26.11 (spec conferir-documento, etapa 7): espaço entre as partes do documento.
    case 'estilosPreparar': return estilosNoEditor(remetente, recado.aprendidos)
    case 'digitacaoPreparar': return digitacaoNoEditor(remetente)
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
    case 'lerPdf': return globalThis.ExtensaoIFTO.pdfTexto ? globalThis.ExtensaoIFTO.pdfTexto.textoDoPdf(recado.base64 ? globalThis.ExtensaoIFTO.sicaf.deBase64(recado.base64) : recado.bytes).then(texto => ({ texto })) : Promise.resolve({ erro: 'Leitura de PDF indisponível.' })
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
