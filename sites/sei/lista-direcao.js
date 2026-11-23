// v0.35.0 (spec lista-para-direcao): lista de documentos para a direção assinar. Itens no menu do ícone do
// documento na árvore, painel com a lista, cópia para o WhatsApp e listas enviadas. Guardada só neste
// navegador, em chaves próprias (nunca na lista de assinaturas da direção).
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const { listaDirecao: regras, listaDirecaoAtribuir: atribuicao, configuracoes, barra, janela, seiPedidos, sei } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  const { criar } = janela
  const CHAVE = 'listaDirecao'
  const ENVIADAS = 'listaDirecaoEnviadas'
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  if (!campoUnidade || !barra) return
  const unidade = campoUnidade.textContent.trim()
  const campoUsuario = document.getElementById('lnkUsuarioSistema')
  const matricula = regras.matriculaDoUsuario(campoUsuario && campoUsuario.title)

  let opcoes = await configuracoes.lerConfiguracoes()
  let lista = null
  let enviadas = []
  let painel = null
  let verEnviadas = false
  let aviso = null
  const atribuindo = new Set()

  // ---------- Dados ----------
  const vazia = () => ({ itens: [], atribuicoes: {}, desfazer: [], copiada: false })
  async function ler () {
    const gravado = await navegador.storage.local.get([CHAVE, ENVIADAS])
    lista = Object.assign(vazia(), gravado[CHAVE])
    enviadas = Array.isArray(gravado[ENVIADAS]) ? gravado[ENVIADAS] : []
  }
  // Uma mudança por vez, sempre sobre o que está gravado (outra aba pode ter mudado a lista).
  let fila = Promise.resolve()
  let gravando = 0
  function alterar (mudar) {
    const vez = fila.then(async () => {
      gravando++
      try {
        await ler()
        const antes = JSON.stringify(enviadas)
        mudar(lista)
        const novo = { [CHAVE]: lista }
        if (JSON.stringify(enviadas) !== antes) novo[ENVIADAS] = enviadas
        await navegador.storage.local.set(novo)
      } finally { gravando-- }
    })
    fila = vez.catch(() => {})
    return vez
  }
  // Botão do painel: o erro aparece no painel em vez de o clique não fazer nada.
  const seguro = acao => async () => {
    try { await acao() } catch (erro) { avisar(erro.message, 'vermelho') }
  }
  function avisar (texto, cor = 'amarelo') {
    aviso = texto ? { texto, cor } : null
    abrirPainel()
  }

  const ligada = () => regras.ligada(opcoes, unidade)
  const assinante = () => regras.quemAssina(opcoes, new Date())
  const podeAtribuir = () => regras.podeAtribuir(opcoes, matricula, new Date())
  const quando = em => new Date(em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const quantos = n => n === 1 ? '1 documento' : `${n} documentos`

  // ---------- Árvore ----------
  // Documentos de pastas fechadas não vêm com a árvore: lê a árvore com todas as pastas abertas (só leitura).
  async function arvoreCompleta (lida) {
    if (!lida.linkAbrirPastas) return lida
    const { html } = await seiPedidos.pedir(lida.linkAbrirPastas)
    const completa = sei.lerArvore(html)
    if (completa.idProcesso !== lida.idProcesso) return lida
    return { ...lida, documentos: completa.documentos }
  }
  async function acharDocumento (id) {
    let lida = seiPedidos.arvoreAberta()
    if (!lida) return null
    let documento = lida.documentos.find(doc => doc.id === id)
    if (!documento) {
      lida = await arvoreCompleta(lida)
      documento = lida.documentos.find(doc => doc.id === id)
    }
    return documento ? { lida, documento } : null
  }

  // ---------- Adicionar ----------
  // perguntas: já assinado por quem assina agora (D2) e já enviado em outra lista.
  function confirmarDocumento (documento, numero) {
    const pessoa = assinante()
    if (pessoa && regras.assinadoPor(documento.assinaturas, pessoa.nome) && !window.confirm(`${documento.rotulo}: já assinado por ${pessoa.nome}. Adicionar mesmo assim?`)) return false
    const enviada = regras.enviadaCom(enviadas, numero)
    return !enviada || window.confirm(`${documento.rotulo}: já foi na lista enviada em ${quando(enviada.em)}. Adicionar de novo?`)
  }
  async function adicionarDocumentos (lida, documentos, soCiencia) {
    await fila
    await ler()
    const novos = []
    for (const documento of documentos) {
      const item = regras.itemDoDocumento(documento, lida.numero, lida.idProcesso, soCiencia)
      if (!item.documento || !item.processo) { avisar(`Não consegui ler o número de "${documento.rotulo}".`, 'vermelho'); continue }
      if (regras.naLista(lista.itens, item.documento)) {
        if (documentos.length === 1) { avisar(`${documento.rotulo} já está na lista.`); return }
        continue
      }
      if (confirmarDocumento(documento, item.documento)) novos.push(item)
    }
    if (!novos.length) return
    await alterar(atual => {
      for (const item of novos) atual.itens = regras.adicionar(atual.itens, item)
      atual.copiada = false
      // Voltou à lista antes de a pessoa devolver a atribuição: continua como estava.
      const guardado = atual.desfazer.find(d => d.processo === lida.numero)
      if (guardado) {
        atual.atribuicoes[lida.numero] = guardado.registro
        atual.desfazer = atual.desfazer.filter(d => d !== guardado)
      }
    })
    avisar(novos.length === 1 ? `Adicionado: ${novos[0].nome}.` : `${novos.length} documentos adicionados.`, 'verde')
    await atribuirProcesso(lida)
  }

  // ---------- Atribuição automática (D8 a D15): uma por processo ----------
  function atribuido (processo) {
    const pessoa = assinante()
    const registro = lista.atribuicoes[processo]
    return Boolean(pessoa && registro && registro.situacao === 'atribuido' && registro.matricula === pessoa.matricula)
  }
  const registrar = (processo, dados) => alterar(atual => {
    // A lista pode ter sido enviada ou o processo removido enquanto o SEI respondia.
    const naLista = atual.itens.some(item => item.processo === processo)
    const guardado = atual.desfazer.find(d => d.processo === processo)
    if (naLista) atual.atribuicoes[processo] = { ...atual.atribuicoes[processo], ...dados }
    else if (guardado) guardado.registro = { ...guardado.registro, ...dados }
    else if (dados.enviado) atual.desfazer.push({ processo, registro: dados })
  })
  async function atribuirProcesso (lida, pedidoPelaPessoa) {
    const processo = lida.numero
    if (!podeAtribuir() || atribuindo.has(processo) || atribuido(processo)) return
    // Já perguntou e a pessoa não quis: só de novo com "Tentar de novo".
    if (!pedidoPelaPessoa && (lista.atribuicoes[processo] || {}).situacao === 'recusado') return
    const pessoa = assinante()
    const base = { matricula: pessoa.matricula, nome: pessoa.nome }
    atribuindo.add(processo)
    desenhar()
    try {
      const tela = await atribuicao.lerTela(lida)
      const { acao, destino, atual } = regras.decidirAtribuicao(tela.pessoas, pessoa.matricula, String(opcoes.direcaoChefeMatricula).trim())
      if (acao === 'nao-esta-na-lista') throw new Error(`${pessoa.nome || pessoa.matricula} não aparece na lista "Atribuir para" do SEI nesta unidade.`)
      if (acao === 'perguntar' && !window.confirm(`O processo ${processo} está com ${atual.nome}. Atribuir mesmo assim?`)) {
        await registrar(processo, { ...base, situacao: 'recusado', motivo: `continua com ${atual.nome}` })
        return
      }
      if (acao !== 'ja-esta') {
        // Guardado antes de enviar: se a página fechar no meio, ainda dá para devolver. O número interno do SEI
        // e o nome bastam (a matrícula de terceirizados é o CPF e não é guardada).
        const anterior = (lista.atribuicoes[processo] || {}).enviado ? {} : { anterior: atual ? { id: atual.id, nome: atual.nome } : null }
        await registrar(processo, { ...base, ...anterior, enviado: true, destinoId: destino.id, situacao: 'falhou', motivo: 'o SEI não confirmou' })
        await atribuicao.enviar(lida, tela, destino.id)
      }
      await registrar(processo, { ...base, situacao: 'atribuido', motivo: '', ...(acao === 'ja-esta' ? {} : { enviado: true }) })
    } catch (erro) {
      await registrar(processo, { ...base, situacao: 'falhou', motivo: erro.message })
    } finally {
      atribuindo.delete(processo)
      desenhar()
    }
  }
  // O SEI só dá o link "Atribuir Processo" com o processo aberto.
  function arvoreDoProcesso (processo) {
    const lida = seiPedidos.arvoreAberta()
    if (lida && lida.numero === processo) return lida
    const formulario = document.getElementById('frmProtocoloPesquisaRapida')
    const campo = document.getElementById('txtPesquisaRapida')
    if (formulario && campo && window.confirm(`Para isso, o processo ${processo} precisa estar aberto. Abrir agora? Depois, clique no botão de novo.`)) {
      campo.value = processo
      formulario.submit()
    }
    return null
  }
  async function tentarDeNovo (processo) {
    const lida = arvoreDoProcesso(processo)
    if (lida) await atribuirProcesso(lida, true)
  }
  // D10: devolver a atribuição de antes, só com o clique da pessoa.
  async function devolver ({ processo, registro }) {
    const lida = arvoreDoProcesso(processo)
    if (!lida || atribuindo.has(processo)) return
    atribuindo.add(processo)
    desenhar()
    try {
      const tela = await atribuicao.lerTela(lida)
      const alvo = registro.anterior ? registro.anterior.id : null
      if (alvo && !tela.pessoas.some(pessoa => pessoa.id === alvo)) throw new Error(`${registro.anterior.nome} não aparece mais na lista "Atribuir para" do SEI.`)
      const idAtual = tela.atual ? tela.atual.id : null
      if (idAtual !== alvo) {
        if (idAtual !== registro.destinoId && !window.confirm(`O processo ${processo} agora ${tela.atual ? 'está com ' + tela.atual.nome : 'está sem atribuição'}. Mudar mesmo assim?`)) return
        await atribuicao.enviar(lida, tela, alvo)
      }
      await alterar(atual => { atual.desfazer = atual.desfazer.filter(d => d.processo !== processo) })
      aviso = { texto: registro.anterior ? `Atribuição de volta para ${registro.anterior.nome}.` : 'Atribuição retirada.', cor: 'verde' }
    } catch (erro) {
      aviso = { texto: erro.message, cor: 'vermelho' }
    } finally {
      atribuindo.delete(processo)
      desenhar()
    }
  }

  // ---------- Menu do ícone do documento na árvore ----------
  function opcaoDoMenu (texto, documentoDaArvore, menu, aoClicar) {
    const opcao = documentoDaArvore.createElement('a')
    opcao.href = '#'
    opcao.className = 'list-group-item d-flex flex-row clipboard-icon-focus'
    opcao.dataset.extensaoIfto = 'lista-direcao'
    const marca = documentoDaArvore.createElement('span')
    marca.textContent = 'IFTO'
    marca.style.cssText = 'background:#1E5E33;color:#fff;font-size:9px;font-weight:700;padding:1px 3px;border-radius:3px;margin-right:4px;align-self:center'
    const rotulo = documentoDaArvore.createElement('span')
    rotulo.className = 'align-self-center'
    rotulo.textContent = texto
    opcao.append(marca, rotulo)
    opcao.addEventListener('click', evento => {
      evento.preventDefault()
      const fechar = menu.querySelector('.serialtip-close')
      if (fechar) fechar.click()
      seguro(aoClicar)()
    })
    return opcao
  }
  async function porOpcoes (menu, documentoDaArvore) {
    const grupo = menu.querySelector('.list-group[tipo="DOCUMENTO"]')
    const achado = /anchorImg(\d+)$/.exec(menu.getAttribute('data-serialtip-target') || '')
    if (!grupo || !achado || menu.dataset.extensaoIftoDirecao) return
    menu.dataset.extensaoIftoDirecao = '1'
    let encontrado = null
    try { encontrado = await acharDocumento(achado[1]) } catch (erro) {}
    // Não deu para ler agora (SEI lento): tenta de novo na próxima vez que o menu abrir.
    if (!encontrado) { delete menu.dataset.extensaoIftoDirecao; return }
    const { lida, documento } = encontrado
    if (!regras.numeroDoDocumento(documento.rotulo)) return
    const opcoesNovas = [
      documento.podeAssinar
        ? opcaoDoMenu('Adicionar à lista da direção', documentoDaArvore, menu, () => adicionarDocumentos(lida, [documento], false))
        : opcaoDoMenu('Adicionar só para ciência', documentoDaArvore, menu, () => adicionarDocumentos(lida, [documento], true)),
      opcaoDoMenu('Adicionar vários deste processo', documentoDaArvore, menu, adicionarVarios)
    ]
    const fechar = grupo.querySelector('.li-fechar')
    for (const opcao of opcoesNovas) grupo.insertBefore(opcao, fechar)
  }
  function vigiarArvore () {
    const quadro = document.getElementById('ifrArvore')
    if (!quadro) return
    const preparar = () => {
      let arvore = null
      try { arvore = quadro.contentDocument } catch (erro) {}
      if (!arvore || !arvore.documentElement || arvore.documentElement.dataset.extensaoIftoDirecao) return
      arvore.documentElement.dataset.extensaoIftoDirecao = '1'
      // O menu só é montado quando a pessoa clica no ícone (também nos documentos de pastas abertas depois).
      const aoChegar = evento => {
        const icone = evento.target.closest && evento.target.closest('[data-serialtip]')
        if (!icone || !ligada()) return
        const alvo = icone.getAttribute('data-serialtip')
        const menu = [...arvore.querySelectorAll('[data-serialtip-target]')].find(m => m.getAttribute('data-serialtip-target') === alvo)
        if (menu) porOpcoes(menu, arvore)
      }
      arvore.addEventListener('mousedown', aoChegar, true)
      arvore.addEventListener('click', aoChegar, true)
    }
    quadro.addEventListener('load', preparar)
    preparar()
  }

  // ---------- Adicionar vários ----------
  async function adicionarVarios () {
    let lida = seiPedidos.arvoreAberta()
    if (!lida) { avisar('Abra um processo e espere a árvore aparecer.'); return }
    const aberta = janela.abrir({ titulo: 'Adicionar vários', conteudo: [criar('p', { textContent: 'Lendo os documentos do processo…' })] })
    try {
      let falhou = false
      try { lida = await arvoreCompleta(lida) } catch (erro) { falhou = true }
      await ler()
      const documentos = lida.documentos.filter(doc => doc.podeAssinar && regras.numeroDoDocumento(doc.rotulo))
      const pessoa = assinante()
      const caixas = documentos.map(documento => {
        const numero = regras.numeroDoDocumento(documento.rotulo)
        const caixa = criar('input', { type: 'checkbox', disabled: regras.naLista(lista.itens, numero) })
        const enviada = regras.enviadaCom(enviadas, numero)
        const notas = [caixa.disabled && 'já está na lista', pessoa && regras.assinadoPor(documento.assinaturas, pessoa.nome) && `já assinado por ${pessoa.nome}`, enviada && `enviado em ${quando(enviada.em)}`].filter(Boolean)
        return { caixa, documento, linha: criar('label', { className: 'escolha' }, [caixa, criar('span', {}, [documento.rotulo, notas.length ? criar('span', { className: 'apoio', textContent: ` (${notas.join('; ')})` }) : null])]) }
      })
      aberta.trocarConteudo([
        falhou ? criar('p', { className: 'aviso amarelo', textContent: 'O SEI não respondeu: os documentos das pastas fechadas podem estar faltando.' }) : null,
        criar('p', { className: 'apoio', textContent: documentos.length ? `Documentos do processo ${lida.numero} que podem ser assinados nesta unidade:` : 'Nenhum documento deste processo pode ser assinado nesta unidade.' }),
        ...caixas.map(c => c.linha)
      ].filter(Boolean))
      if (!documentos.length) return
      aberta.trocarBotoes([
        { texto: 'Marcar todos', aoClicar: () => { for (const { caixa } of caixas) if (!caixa.disabled) caixa.checked = true } },
        {
          texto: 'Adicionar',
          tipo: 'principal',
          aoClicar: j => {
            const escolhidos = caixas.filter(c => c.caixa.checked).map(c => c.documento)
            if (!escolhidos.length) return
            j.fechar()
            seguro(() => adicionarDocumentos(lida, escolhidos, false))()
          }
        }
      ])
    } catch (erro) {
      aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: erro.message })])
    }
  }

  // ---------- Escolher quem assina (D13) ----------
  async function escolherQuemAssina () {
    const aberta = janela.abrir({ titulo: 'Escolher quem assina', conteudo: [criar('p', { textContent: 'Lendo a lista "Atribuir para" do SEI…' })] })
    const semLista = texto => aberta.trocarConteudo([criar('p', { className: 'aviso amarelo', textContent: texto }), criar('p', { textContent: 'Você também pode digitar a matrícula e o nome: clique no ícone da extensão, abra as Configurações e escolha Direção-geral.' })])
    const lida = seiPedidos.arvoreAberta()
    if (!lida) { semLista('Abra um processo da sua unidade e clique de novo em "Escolher quem assina".'); return }
    try {
      const { pessoas } = await atribuicao.lerTela(lida)
      opcoes = await configuracoes.lerConfiguracoes()
      const escolher = (rotulo, papel) => {
        const guardada = { matricula: opcoes[`direcao${papel}Matricula`], nome: opcoes[`direcao${papel}Nome`] }
        const todas = pessoas.some(p => p.matricula === guardada.matricula) || !guardada.nome ? pessoas : [guardada, ...pessoas]
        const campo = criar('select', {}, [criar('option', { value: '', textContent: '(ninguém)' }), ...todas.map((p, i) => criar('option', { value: String(i), textContent: p.nome, selected: Boolean(p.matricula) && p.matricula === guardada.matricula }))])
        if (todas[0] === guardada) campo.value = '0'
        return { papel, todas, campo, linha: criar('label', {}, [rotulo, campo]) }
      }
      const diretor = escolher('Diretor', 'Diretor')
      const substituto = escolher('Substituto', 'Substituto')
      const chefe = escolher('Chefia de gabinete', 'Chefe')
      const inicio = criar('input', { type: 'date', value: opcoes.direcaoSubstitutoInicio })
      const fim = criar('input', { type: 'date', value: opcoes.direcaoSubstitutoFim })
      const erro = criar('p', { className: 'aviso vermelho', hidden: true })
      aberta.trocarConteudo([
        criar('p', { className: 'apoio', textContent: 'Só as pessoas escolhidas ficam guardadas, neste navegador.' }),
        diretor.linha, substituto.linha,
        criar('label', {}, ['Substituto a partir de (vazio = já está substituindo)', inicio]),
        criar('label', {}, ['Substituto até (o último dia conta)', fim]),
        chefe.linha, erro
      ])
      aberta.trocarBotoes([{
        texto: 'Gravar',
        tipo: 'principal',
        aoClicar: async j => {
          const temSubstituto = substituto.campo.value !== ''
          const problema = temSubstituto && !fim.value ? 'Preencha até quando o substituto assina.' : temSubstituto && inicio.value > fim.value ? 'A data inicial do substituto está depois da final.' : ''
          erro.hidden = !problema
          erro.textContent = problema
          if (problema) return
          const novas = { direcaoSubstitutoInicio: inicio.value, direcaoSubstitutoFim: fim.value }
          for (const { papel, todas, campo } of [diretor, substituto, chefe]) {
            const pessoa = campo.value === '' ? { matricula: '', nome: '' } : todas[Number(campo.value)]
            novas[`direcao${papel}Matricula`] = pessoa.matricula
            novas[`direcao${papel}Nome`] = pessoa.nome
          }
          await configuracoes.gravarConfiguracoes({ ...(await configuracoes.lerConfiguracoes()), ...novas })
          j.fechar()
        }
      }])
    } catch (erro) {
      semLista(erro.message)
    }
  }

  // ---------- Painel ----------
  const botaoPequeno = (texto, titulo, aoClicar, desligado) => {
    const botao = criar('button', { type: 'button', className: 'pequeno', textContent: texto, title: titulo, disabled: Boolean(desligado) })
    botao.addEventListener('click', seguro(aoClicar))
    return botao
  }
  async function copiar (texto) {
    try { await navigator.clipboard.writeText(texto) } catch (erro) {
      const caixa = criar('textarea', { value: texto })
      document.body.append(caixa)
      caixa.select()
      const copiou = document.execCommand('copy')
      caixa.remove()
      if (!copiou) throw new Error('O navegador não deixou copiar. Clique no botão de novo.')
    }
  }
  async function copiarLista () {
    await fila
    await ler()
    const faltam = podeAtribuir() ? regras.porProcesso(lista.itens).filter(g => !atribuido(g.processo)).map(g => g.processo) : []
    if (faltam.length && !window.confirm(`Processos não atribuídos a ${assinante().nome || 'quem assina'}:\n${faltam.join('\n')}\n\nCopiar a lista mesmo assim?`)) return
    await copiar(regras.textoParaCopiar(lista.itens))
    await alterar(atual => { atual.copiada = true })
    avisar('Lista copiada. Cole no WhatsApp (Ctrl+V).', 'verde')
  }
  async function enviei () {
    await fila
    await ler()
    if (!lista.itens.length) return
    if (!lista.copiada && !window.confirm('Esta lista ainda não foi copiada como está agora. Guardar como enviada mesmo assim?')) return
    const pessoa = assinante()
    await alterar(atual => {
      enviadas = [{ em: new Date().toISOString(), para: pessoa ? pessoa.nome : '', itens: atual.itens.map(({ processo, documento, nome, comentario }) => ({ processo, documento, nome, comentario })), texto: regras.textoParaCopiar(atual.itens) }, ...enviadas]
      Object.assign(atual, { itens: [], atribuicoes: {}, copiada: false })
    })
    avisar('Lista guardada em "Listas enviadas". Pode começar outra.', 'verde')
  }
  async function removerItem (item) {
    await alterar(atual => {
      atual.itens = regras.remover(atual.itens, item.documento)
      atual.copiada = false
      const registro = atual.atribuicoes[item.processo]
      if (registro && !atual.itens.some(outro => outro.processo === item.processo)) {
        delete atual.atribuicoes[item.processo]
        if (registro.enviado) atual.desfazer.push({ processo: item.processo, registro })
      }
    })
    desenhar()
  }
  const mover = mudar => async () => { await alterar(atual => { atual.itens = mudar(atual.itens); atual.copiada = false }); desenhar() }

  function linhaDoItem (item, posicao, itensDoProcesso) {
    const comentario = criar('input', { type: 'text', value: item.comentario, placeholder: 'Comentário (opcional)' })
    const ciencia = criar('span', { className: 'apoio', textContent: ' · só para ciência', hidden: !regras.ehCiencia(item) })
    // Grava sem redesenhar: redesenhar ao sair do campo faria perder o clique no botão seguinte.
    comentario.addEventListener('change', () => {
      const novo = regras.arrumarComentario(comentario.value, item.soCiencia)
      comentario.value = novo
      ciencia.hidden = !regras.ehCiencia({ comentario: novo })
      alterar(atual => {
        const gravado = atual.itens.find(i => i.documento === item.documento)
        if (gravado && gravado.comentario !== novo) { gravado.comentario = novo; atual.copiada = false }
      }).catch(erro => avisar(erro.message, 'vermelho'))
    })
    return [
      criar('div', { className: 'linha' }, [
        criar('span', { className: 'detalhe' }, [item.nome, ciencia]),
        criar('span', { className: 'setas' }, [
          botaoPequeno('▲', 'Subir o documento', mover(itens => regras.moverDocumento(itens, item.documento, -1)), posicao === 0),
          botaoPequeno('▼', 'Descer o documento', mover(itens => regras.moverDocumento(itens, item.documento, 1)), posicao === itensDoProcesso - 1),
          botaoPequeno('×', 'Tirar da lista', () => removerItem(item))
        ])
      ]),
      comentario
    ]
  }
  function situacaoDaAtribuicao (processo) {
    if (!podeAtribuir()) return null
    if (atribuindo.has(processo)) return criar('p', { className: 'apoio', textContent: 'Atribuindo…' })
    const nome = assinante().nome || assinante().matricula
    if (atribuido(processo)) return criar('p', { className: 'apoio', textContent: `Atribuído a ${nome}` })
    const registro = lista.atribuicoes[processo]
    return criar('div', { className: 'aviso vermelho' }, [
      criar('span', { textContent: `Não atribuído${registro && registro.motivo ? ': ' + registro.motivo : ''} ` }),
      botaoPequeno('Tentar de novo', 'Atribuir o processo a quem assina', () => tentarDeNovo(processo))
    ])
  }
  function conteudoDoPainel () {
    const pessoa = assinante()
    const partes = [
      criar('div', { className: 'linha' }, [
        criar('span', { textContent: pessoa ? `Assinando agora: ${pessoa.nome || pessoa.matricula}${pessoa.ate ? ` (até ${regras.dataEmTexto(pessoa.ate)})` : ''}` : 'Quem assina ainda não foi escolhido.' }),
        botaoPequeno('Escolher quem assina', 'Diretor, substituto e chefia de gabinete', escolherQuemAssina)
      ])
    ]
    if (aviso) partes.push(criar('p', { className: 'aviso ' + aviso.cor, textContent: aviso.texto }))
    for (const pendente of lista.desfazer) {
      const anterior = pendente.registro.anterior
      partes.push(criar('div', { className: 'aviso amarelo' }, [
        criar('p', { textContent: `O processo ${pendente.processo} saiu da lista e ${pendente.registro.situacao === 'atribuido' ? 'foi' : 'pode ter sido'} atribuído a ${pendente.registro.nome || 'quem assina'}.` }),
        atribuindo.has(pendente.processo)
          ? criar('p', { textContent: 'Devolvendo…' })
          : criar('div', { className: 'linha' }, [
            botaoPequeno(anterior ? `Voltar a atribuição para ${anterior.nome}` : 'Retirar a atribuição', 'Muda a atribuição do processo no SEI', () => devolver(pendente)),
            botaoPequeno('Deixar como está', 'Não muda nada no SEI', async () => { await alterar(atual => { atual.desfazer = atual.desfazer.filter(d => d.processo !== pendente.processo) }); desenhar() })
          ])
      ]))
    }
    if (!lista.itens.length) partes.push(criar('p', { className: 'apoio', textContent: 'Lista vazia. Na árvore do processo, clique no ícone de um documento e escolha "Adicionar à lista da direção".' }))
    const grupos = regras.porProcesso(lista.itens)
    grupos.forEach((grupo, posicao) => {
      partes.push(criar('div', { className: 'cartao' }, [
        criar('div', { className: 'linha' }, [
          criar('h2', { textContent: grupo.processo }),
          criar('span', { className: 'setas' }, [
            botaoPequeno('▲', 'Subir o processo', mover(itens => regras.moverProcesso(itens, grupo.processo, -1)), posicao === 0),
            botaoPequeno('▼', 'Descer o processo', mover(itens => regras.moverProcesso(itens, grupo.processo, 1)), posicao === grupos.length - 1)
          ])
        ]),
        situacaoDaAtribuicao(grupo.processo),
        ...grupo.itens.flatMap((item, i) => linhaDoItem(item, i, grupo.itens.length))
      ]))
    })
    if (enviadas.length) {
      partes.push(criar('div', {}, [botaoPequeno(verEnviadas ? 'Esconder as listas enviadas' : `Listas enviadas (${enviadas.length})`, '', () => { verEnviadas = !verEnviadas; desenhar() })]))
      if (verEnviadas) {
        for (const enviada of enviadas) {
          partes.push(criar('div', { className: 'linha' }, [
            criar('span', { className: 'apoio', textContent: `${quando(enviada.em)} · ${quantos(enviada.itens.length)}` }),
            botaoPequeno('Copiar de novo', enviada.texto, async () => { await copiar(enviada.texto); avisar('Lista enviada copiada.', 'verde') })
          ]))
        }
      }
    }
    return partes
  }
  function desenhar () {
    const visivel = ligada()
    botaoDaBarra.textContent = lista.itens.length ? `Lista para a direção (${lista.itens.length})` : 'Lista para a direção'
    barra.mostrar('lista-direcao', visivel)
    if (!painel) return
    if (!visivel) { painel.fechar(); return }
    const rolagem = painel.corpo.scrollTop
    painel.trocarConteudo(conteudoDoPainel())
    painel.corpo.scrollTop = rolagem
    const temItens = lista.itens.length > 0
    painel.trocarBotoes([
      { texto: 'Adicionar vários', aoClicar: seguro(adicionarVarios) },
      ...(temItens ? [{ texto: 'Já enviei, começar outra', aoClicar: seguro(enviei) }, { texto: 'Copiar para o WhatsApp', tipo: 'principal', aoClicar: seguro(copiarLista) }] : [])
    ])
  }
  function abrirPainel () {
    if (!painel) painel = janela.abrir({ titulo: 'Lista para a direção', aoFechar: () => { painel = null; aviso = null } })
    desenhar()
  }

  const botaoDaBarra = barra.botao('lista-direcao', {
    texto: 'Lista para a direção',
    titulo: 'Documentos para a direção assinar ou dar ciência',
    ordem: 20,
    aoClicar: () => { if (painel) painel.fechar(); else abrirPainel() }
  })

  // Outra aba mudou a lista ou as configurações (as mudanças desta página já foram desenhadas).
  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local') return
    if (mudancas.configuracoes) opcoes = await configuracoes.lerConfiguracoes()
    const deFora = (mudancas[CHAVE] || mudancas[ENVIADAS]) && !gravando && JSON.stringify((mudancas[CHAVE] || {}).newValue) !== JSON.stringify(lista)
    if (deFora) await ler()
    if (mudancas.configuracoes || deFora) desenhar()
  })

  await ler()
  if (ligada() && regras.enviadasNoPrazo(enviadas, opcoes, new Date()).length !== enviadas.length) {
    await alterar(() => { enviadas = regras.enviadasNoPrazo(enviadas, opcoes, new Date()) })
  }
  desenhar()
  vigiarArvore()
})()
