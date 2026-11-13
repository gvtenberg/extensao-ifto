// v0.7.0: botão "Incluir Sicaf, Consulta e Anexo" na barra da extensão (spec documentos-pagamento).
// Só com um processo aberto (página com a árvore, #ifrArvore).
// v0.8.0: depois da confirmação, inclui os três documentos externos em branco. A tarefa fica guardada no
// navegador (CHAVE_TAREFA) e anda por passos: "incluir" (aqui: Incluir Documento) › "tipo" (escolher Externo
// e o tipo) › "salvar" (preencher e clicar Salvar), feitos por sites/sei/documentos-pagamento-quadros.js.
// Quando a árvore recarrega depois do Salvar, o documento foi incluído e passa ao próximo tipo.
(async function () {
  if (window.top !== window) return
  const { documentosPagamento: regras, documentoExterno, configuracoes, barra } = globalThis.ExtensaoIFTO
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  if (!barra || !campoUnidade || !document.getElementById('ifrArvore')) return
  const unidade = campoUnidade.textContent.trim()
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE_TAREFA = 'documentosPagamentoTarefa'
  const CHAVE_FEITOS = 'documentosPagamentoFeitos'
  const ESPERA_MAXIMA = 90 * 1000

  let opcoes = await configuracoes.lerConfiguracoes()
  const ID = 'documentos-pagamento'
  const textoDoBotao = 'Incluir ' + regras.listaEmTexto(regras.TIPOS)
  const botao = barra.botao(ID, {
    texto: textoDoBotao,
    titulo: 'Incluir no processo os documentos externos em branco: ' + regras.listaEmTexto(regras.TIPOS),
    ordem: 20,
    aoClicar: () => clicou()
  })
  const desenhar = () => barra.mostrar(ID, regras.funcaoLigada(opcoes.documentosPagamento, unidade))

  // ---------- Árvore do processo (quadro ifrArvore) ----------
  function arvore () {
    let documentoDaArvore
    try { documentoDaArvore = document.getElementById('ifrArvore').contentDocument } catch (erro) { return null }
    if (!documentoDaArvore) return null
    const texto = [...documentoDaArvore.scripts].map(script => script.textContent).join('\n')
    const lida = regras.lerArvore(texto)
    lida.linkIncluir = (/<a href="(controlador\.php\?acao=documento_escolher_tipo[^"]*)"/.exec(texto) || [])[1] || null
    return lida.idProcesso ? lida : null
  }

  // ---------- Tarefa guardada ----------
  async function lerTarefa () {
    const { [CHAVE_TAREFA]: tarefa } = await navegador.storage.local.get(CHAVE_TAREFA)
    return tarefa || null
  }
  async function gravarTarefa (tarefa) {
    if (tarefa) await navegador.storage.local.set({ [CHAVE_TAREFA]: tarefa })
    else await navegador.storage.local.remove(CHAVE_TAREFA)
  }
  async function feitosHoje (idProcesso) {
    const { [CHAVE_FEITOS]: feitos } = await navegador.storage.local.get(CHAVE_FEITOS)
    return Boolean(feitos && feitos[idProcesso] === documentoExterno.dataDeHoje())
  }
  async function marcarFeitosHoje (idProcesso) {
    const { [CHAVE_FEITOS]: feitos = {} } = await navegador.storage.local.get(CHAVE_FEITOS)
    const hoje = documentoExterno.dataDeHoje()
    // Guarda só os de hoje: a lista não cresce.
    const novos = Object.fromEntries(Object.entries(feitos).filter(([, data]) => data === hoje))
    novos[idProcesso] = hoje
    await navegador.storage.local.set({ [CHAVE_FEITOS]: novos })
  }

  // ---------- Clique no botão ----------
  async function clicou () {
    const tarefa = await lerTarefa()
    if (tarefa) {
      if (window.confirm('A extensão está incluindo ' + regras.listaEmTexto(tarefa.tipos) + '. Parar agora?')) await parar('Inclusão parada.')
      return
    }
    const lida = arvore()
    if (!lida) {
      window.alert('Não consegui ler a árvore do processo. Espere o processo abrir por completo e tente de novo.')
      return
    }
    const pergunta = regras.textoDaConfirmacao({
      numero: lida.numero,
      jaIncluidosHoje: await feitosHoje(lida.idProcesso),
      emBranco: regras.documentosEmBranco(lida.documentos)
    })
    if (!window.confirm(pergunta)) return
    await gravarTarefa({ idProcesso: lida.idProcesso, numero: lida.numero, tipos: [...regras.TIPOS], posicao: 0, incluidos: [], passo: 'incluir', desde: Date.now() })
    await abrirIncluirDocumento()
  }

  // Abre "Incluir Documento": o botão do SEI (barra do quadro da direita) ou o link da árvore.
  function acharBotaoIncluir (janela = window, profundidade = 0) {
    let doc
    try { doc = janela.document } catch (erro) { return null }
    const imagem = doc.querySelector('#divArvoreAcoes a > img[title="Incluir Documento"]')
    if (imagem) return imagem.parentElement
    if (profundidade > 3) return null
    for (const quadro of doc.querySelectorAll('iframe')) {
      const achado = quadro.contentWindow && acharBotaoIncluir(quadro.contentWindow, profundidade + 1)
      if (achado) return achado
    }
    return null
  }
  function acharQuadro (nome, janela = window, profundidade = 0) {
    let doc
    try { doc = janela.document } catch (erro) { return null }
    for (const quadro of doc.querySelectorAll('iframe')) {
      if (quadro.name === nome || quadro.id === nome) return quadro
      const achado = profundidade < 3 && quadro.contentWindow && acharQuadro(nome, quadro.contentWindow, profundidade + 1)
      if (achado) return achado
    }
    return null
  }
  async function abrirIncluirDocumento (tentativa = 0) {
    const botaoDoSei = acharBotaoIncluir()
    if (botaoDoSei) { botaoDoSei.click(); return }
    const lida = arvore()
    const quadro = acharQuadro('ifrVisualizacao') || document.getElementById('ifrConteudoVisualizacao')
    if (lida && lida.linkIncluir && quadro) { quadro.src = lida.linkIncluir.replace(/&amp;/g, '&'); return }
    // O quadro da direita ainda está abrindo: tenta de novo por alguns segundos.
    if (tentativa < 20) { setTimeout(() => abrirIncluirDocumento(tentativa + 1), 500); return }
    await parar('Não achei o botão "Incluir Documento" do SEI.')
  }

  // ---------- Andamento ----------
  async function parar (motivo) {
    const tarefa = await lerTarefa()
    await gravarTarefa(null)
    mostrarAndamento(null)
    const feitos = tarefa && tarefa.incluidos.length ? 'Incluídos: ' + regras.listaEmTexto(tarefa.incluidos) + '.' : 'Nenhum documento foi incluído.'
    window.alert(motivo + '\n' + feitos + '\nConfira a árvore do processo.')
  }

  // Depois do Salvar, o SEI abre a página do processo no quadro do formulário (o quadro marca "salvo") e
  // recarrega a árvore (ou a página toda): o documento do passo foi incluído.
  let conferindo = false
  async function arvoreRecarregou () {
    if (conferindo) return
    conferindo = true
    try { await avancarSeSalvou() } finally { conferindo = false }
  }
  async function avancarSeSalvou () {
    const tarefa = await lerTarefa()
    if (!tarefa || (tarefa.passo !== 'salvando' && tarefa.passo !== 'salvo')) return
    const lida = arvore()
    if (lida && lida.idProcesso !== tarefa.idProcesso) return
    tarefa.incluidos.push(tarefa.tipos[tarefa.posicao])
    tarefa.posicao++
    if (tarefa.posicao >= tarefa.tipos.length) {
      await gravarTarefa(null)
      await marcarFeitosHoje(tarefa.idProcesso)
      mostrarAndamento(null)
      window.alert('Pronto: ' + regras.listaEmTexto(tarefa.incluidos) + ' incluídos no processo ' + (tarefa.numero || '') + '.')
      return
    }
    Object.assign(tarefa, { passo: 'incluir', desde: Date.now() })
    await gravarTarefa(tarefa)
    mostrarAndamento(tarefa)
    setTimeout(() => abrirIncluirDocumento(), 800)
  }

  function mostrarAndamento (tarefa) {
    const texto = tarefa
      ? `Incluindo ${tarefa.tipos[tarefa.posicao]} (${tarefa.posicao + 1}/${tarefa.tipos.length})… clique para parar`
      : textoDoBotao
    botao.lastChild.textContent = ' ' + texto
  }

  // Passo parado há muito tempo (pergunta do SEI cancelada, página que não abriu): para e avisa.
  async function vigiar () {
    const tarefa = await lerTarefa()
    if (!tarefa) return
    mostrarAndamento(tarefa)
    if (Date.now() - tarefa.desde > ESPERA_MAXIMA) await parar('A inclusão parou: um passo demorou demais ou foi cancelado.')
  }

  const quadroArvore = document.getElementById('ifrArvore')
  quadroArvore.addEventListener('load', () => setTimeout(arvoreRecarregou, 300))

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local') return
    if (mudancas.configuracoes) { opcoes = await configuracoes.lerConfiguracoes(); desenhar() }
    if (mudancas[CHAVE_TAREFA]) {
      const nova = mudancas[CHAVE_TAREFA].newValue || null
      if (nova && nova.passo === 'erro') await parar('A inclusão parou: o SEI não aceitou o tipo do documento.')
      else if (nova && nova.passo === 'salvo') arvoreRecarregou()
      else mostrarAndamento(nova)
    }
  })

  desenhar()
  setInterval(vigiar, 3000)
  // A página toda recarregou depois do Salvar (a árvore já veio nova): confere já.
  const tarefaAoAbrir = await lerTarefa()
  if (tarefaAoAbrir) {
    mostrarAndamento(tarefaAoAbrir)
    if (tarefaAoAbrir.passo === 'salvando' || tarefaAoAbrir.passo === 'salvo') setTimeout(arvoreRecarregou, 1000)
  }
})()
