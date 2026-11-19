// v0.31.0 (spec copia-editor-sei): cópia automática do documento na janela do editor do SEI (a cada 30 s, uma
// por documento, só neste computador) e os botões "Copiar conteúdo" / "Colar conteúdo". A cópia é o mesmo
// conteúdo que o SEI envia ao salvar (texto com toda a formatação, tabelas, imagens, links) mais os
// comentários. A parte que mexe no editor roda dentro da página (sites/sei/editor-copia.js). NUNCA salva.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const { configuracoes, caixaEditor, copiaEditor: regras } = globalThis.ExtensaoIFTO
  const { criar, pedirAoFundo } = caixaEditor
  const opcoes = await configuracoes.lerConfiguracoes()
  const automatica = Boolean(opcoes.copiaAutomatica)
  const manual = Boolean(opcoes.copiarColarConteudo)
  if (!automatica && !manual) return
  const id = regras.idDoEndereco(location.href)
  if (!id) return
  const armazem = navegador.storage.local
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const titulo = document.title.replace(/^SEI\S*\s*-\s*/, '').trim() || 'documento ' + id
  const minhaJanela = Math.random().toString(36).slice(2)

  let base = null // conteúdo que o SEI tem (ao abrir, ou depois de salvar): igual a ele, não há o que guardar
  let pendente = false // cópia anterior esperando a escolha da pessoa: a cópia automática fica parada
  let protegida = false // a cópia restaurada não ficou igual no editor: a cópia guardada não é trocada
  let guardando = false

  // --- Indicador perto do botão Salvar (não faz parte do documento) ---
  const barra = criar('span')
  barra.dataset.extensaoIfto = 'copia'
  barra.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin:0 6px;font:12px/1.3 system-ui,sans-serif;white-space:nowrap;'
  const texto = criar('span')
  barra.append(texto)
  let aoClicarTexto = null
  texto.addEventListener('click', () => { if (aoClicarTexto) aoClicarTexto() })
  function porBarra () {
    if (barra.isConnected) return
    const salvar = document.querySelector('button.salvar__buttonview')
    if (salvar) { salvar.after(barra); barra.style.position = '' } else {
      barra.style.cssText += 'position:fixed;left:8px;bottom:8px;z-index:100000;background:#fff;padding:2px 6px;border:1px solid #C9D1CC;border-radius:4px;'
      document.body.append(barra)
    }
  }
  function indicar (frase, tipo = '', clique = null) {
    porBarra()
    texto.textContent = frase
    texto.style.color = tipo === 'erro' ? '#B3261E' : tipo === 'aviso' ? '#8A5A00' : '#1E5E33'
    texto.style.cursor = clique ? 'pointer' : ''
    texto.style.textDecoration = clique ? 'underline' : ''
    aoClicarTexto = clique
  }

  // --- Guardar e apagar cópias ---
  const lerIndice = async () => (await armazem.get(regras.INDICE))[regras.INDICE] || {}
  const lerCopia = async () => (await armazem.get(regras.chave(id)))[regras.chave(id)] || null
  async function apagar (doc) {
    const indice = await lerIndice()
    delete indice[doc]
    await armazem.remove(regras.chave(doc))
    await armazem.set({ [regras.INDICE]: indice })
  }
  async function guardar (copia) {
    const gravar = async () => {
      const indice = await lerIndice()
      indice[id] = copia.salvaEm
      await armazem.set({ [regras.chave(id)]: copia, [regras.INDICE]: indice })
    }
    try { await gravar(); return true } catch (erro) {
      // D10: pouco espaço: apaga as cópias mais antigas de outros documentos e tenta de novo.
      for (const outro of regras.maisAntigas(await lerIndice(), id)) {
        await apagar(outro)
        try { await gravar(); return true } catch (e) {}
      }
      return false
    }
  }
  async function limparVencidas () {
    for (const doc of regras.vencidas(await lerIndice(), Date.now())) if (doc !== id) await apagar(doc)
  }

  async function copiarAgora () {
    if (!automatica || pendente || protegida || !base || guardando) return
    guardando = true
    try {
      const lido = await pedirAoFundo('copiaLer', { desde: true })
      if (!lido.ok) return indicar('A cópia automática não funcionou: ' + lido.erro, 'erro')
      if (!lido.mudou) return
      if (regras.mesmoConteudo(lido, base)) {
        if (await lerCopia()) await apagar(id)
        return indicar('Cópia automática ligada (sem alterações para guardar)')
      }
      const agora = Date.now()
      const ok = await guardar({ id, titulo, versaoSei: base.versaoSei, salvaEm: agora, secoes: lido.secoes, comentarios: lido.comentarios })
      if (ok) indicar('Cópia guardada ' + regras.quando(agora))
      else indicar('Não foi possível guardar a cópia: pouco espaço no navegador.', 'erro')
    } finally {
      guardando = false
    }
  }

  // --- Pôr outro conteúdo no editor (restaurar, colar) e conferir se ficou igual ---
  async function estilosDeNovo () {
    // O editor foi montado de novo: liga de novo as ajudas da extensão que ficam no editor (tabelas, ★).
    navegador.runtime.sendMessage({ tipo: 'tabelasPreparar', mover: opcoes.moverTabelas, margens: opcoes.margensTabela }).catch(() => {})
    if (!opcoes.todosOsEstilos) return
    const { estilosAprendidos = {} } = await armazem.get('estilosAprendidos')
    await navegador.runtime.sendMessage({ tipo: 'estilosPreparar', aprendidos: estilosAprendidos }).catch(() => {})
  }

  // Quantos parágrafos e comentários ficaram diferentes entre o que se queria pôr e o que o editor mostra.
  function contarDiferencas (esperado, lido) {
    let paragrafos = 0
    const nomes = new Set([...Object.keys(esperado.secoes || {}), ...Object.keys(lido.secoes || {})])
    for (const nome of nomes) paragrafos += regras.diferencas((esperado.secoes || {})[nome], (lido.secoes || {})[nome]).length
    const comentarios = JSON.stringify(regras.comentariosNormais(esperado.comentarios)) !== JSON.stringify(regras.comentariosNormais(lido.comentarios))
    return { paragrafos, comentarios }
  }

  // Troca o texto do editor por "conteudo"; guarda o de antes para o botão Desfazer.
  async function trocarTexto (caixa, conteudo, fraseOk, aoDesfazer) {
    caixa.mostrar('aviso', 'Pondo o texto no editor…')
    const antes = await pedirAoFundo('copiaLer', { desde: false })
    if (!antes.ok) { caixa.mostrar('erro', 'Não consegui ler o editor: ' + antes.erro); return false }
    const feito = await pedirAoFundo('copiaRestaurar', { copia: conteudo })
    if (!feito.ok) { caixa.mostrar('erro', 'Não consegui pôr o texto no editor. ' + feito.erro); return false }
    await estilosDeNovo()
    await esperar(1500)
    const depois = await pedirAoFundo('copiaLer', { desde: false })
    const dif = depois.ok ? contarDiferencas(conteudo, depois) : { paragrafos: -1, comentarios: false }
    const desfazer = criar('button', { type: 'button', className: 'secundario', textContent: 'Desfazer (voltar ao texto de antes)' })
    const extras = [desfazer]
    if (dif.paragrafos === 0 && !dif.comentarios) {
      caixa.mostrar('ok', fraseOk, criar('p', { textContent: 'Conferido: texto, formatação e comentários iguais aos da cópia.' }), ...extras)
      protegida = false
    } else {
      protegida = true
      const partes = []
      if (dif.paragrafos > 0) partes.push(dif.paragrafos + ' parágrafo(s)')
      if (dif.comentarios) partes.push('os comentários')
      const motivo = dif.paragrafos < 0 ? 'Não consegui conferir o resultado.' : 'O editor não ficou igual à cópia em ' + partes.join(' e ') + '.'
      caixa.mostrar('aviso', fraseOk, criar('p', { className: 'erro', textContent: motivo + ' A cópia guardada não será trocada até você salvar o documento. Confira o texto com atenção.' }), ...extras)
      indicar('Cópia guardada protegida: confira o texto antes de salvar.', 'aviso')
    }
    desfazer.addEventListener('click', async () => {
      desfazer.disabled = true
      if (aoDesfazer) aoDesfazer.antes()
      const volta = await pedirAoFundo('copiaRestaurar', { copia: antes })
      if (!volta.ok) { caixa.mostrar('erro', 'Não consegui desfazer: ' + volta.erro); return }
      await estilosDeNovo()
      protegida = false
      if (aoDesfazer) aoDesfazer.depois()
      else caixa.mostrar('ok', 'Pronto: o texto de antes voltou ao editor.')
    })
    return true
  }

  // --- Janela "Ver diferenças" ---
  function mostrarDiferencas (copia) {
    const hospedeiro = criar('div')
    hospedeiro.dataset.extensaoIfto = 'diferencas'
    const sombra = hospedeiro.attachShadow({ mode: 'open' })
    sombra.append(criar('style', { textContent: `
      :host { all: initial; }
      .fundo { position: fixed; inset: 0; z-index: 100001; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
      .painel { width: min(900px, calc(100vw - 32px)); max-height: calc(100vh - 32px); display: flex; flex-direction: column; background: #fff; border-radius: 6px; font: 13px/1.45 system-ui, sans-serif; color: #1B2420; box-shadow: 0 4px 16px rgba(0,0,0,.25); }
      .topo { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #C9D1CC; background: #F1F4F2; border-radius: 6px 6px 0 0; }
      h2 { margin: 0; font-size: 15px; }
      button { border: 1px solid #1E5E33; background: #fff; color: #1E5E33; border-radius: 4px; padding: 4px 10px; font: inherit; cursor: pointer; }
      .lista { overflow-y: auto; padding: 10px 14px; }
      .legenda { margin: 0 0 10px; color: #555; }
      .item { border: 1px solid #E3E8E5; border-radius: 4px; margin-bottom: 8px; padding: 6px 8px; }
      .rotulo { font-weight: 600; margin-bottom: 4px; }
      .sai { background: #FBE9E7; color: #8C1D18; text-decoration: line-through; padding: 2px 4px; margin: 2px 0; }
      .entra { background: #E6F4EA; color: #14532D; padding: 2px 4px; margin: 2px 0; }
      .nota { color: #8A5A00; }
    ` }))
    const fundo = criar('div', { className: 'fundo' })
    const painel = criar('div', { className: 'painel' })
    const fechar = criar('button', { type: 'button', textContent: 'Fechar' })
    const topo = criar('div', { className: 'topo' })
    topo.append(criar('h2', { textContent: 'Diferenças entre o documento no SEI e a cópia' }), fechar)
    const lista = criar('div', { className: 'lista' })
    lista.append(criar('p', { className: 'legenda', textContent: 'Carregando…' }))
    painel.append(topo, lista)
    fundo.append(painel)
    sombra.append(fundo)
    document.body.append(hospedeiro)
    const sair = () => { hospedeiro.remove(); document.removeEventListener('keydown', tecla, true) }
    const tecla = evento => { if (evento.key === 'Escape') sair() }
    document.addEventListener('keydown', tecla, true)
    fechar.addEventListener('click', sair)
    fundo.addEventListener('click', evento => { if (evento.target === fundo) sair() })

    pedirAoFundo('copiaLer', { desde: false }).then(atual => {
      lista.replaceChildren()
      if (!atual.ok) { lista.append(criar('p', { className: 'nota', textContent: 'Não consegui ler o editor: ' + atual.erro })); return }
      lista.append(criar('p', { className: 'legenda', textContent: 'Verde: está na cópia e não no SEI. Vermelho riscado: está no SEI e sai se você restaurar a cópia. Números = posição do parágrafo.' }))
      const nomes = [...new Set([...Object.keys(atual.secoes || {}), ...Object.keys(copia.secoes || {})])]
      let total = 0
      nomes.forEach((nome, indice) => {
        const difs = regras.diferencas(atual.secoes[nome], (copia.secoes || {})[nome])
        for (const d of difs) {
          if (++total > 300) return
          const item = criar('div', { className: 'item' })
          const onde = (nomes.length > 1 ? 'Parte ' + (indice + 1) + ', ' : '') + 'parágrafo ' + d.numero
          const tipo = d.tipo === 'novo' ? 'só na cópia' : d.tipo === 'removido' ? 'só no SEI' : d.soFormatacao ? 'mesmo texto, formatação ou imagem diferente' : 'mudou'
          item.append(criar('div', { className: 'rotulo', textContent: onde + ' – ' + tipo }))
          if (d.antes && !d.soFormatacao) item.append(criar('div', { className: 'sai', textContent: d.antes }))
          if (d.depois) item.append(criar('div', { className: 'entra', textContent: d.depois }))
          if (!d.antes && !d.depois) item.append(criar('div', { className: 'nota', textContent: '(parágrafo sem texto: imagem, tabela ou linha em branco)' }))
          lista.append(item)
        }
      })
      if (total > 300) lista.append(criar('p', { className: 'nota', textContent: 'Mostrando as 300 primeiras diferenças de ' + total + '.' }))
      const comentariosIguais = JSON.stringify(regras.comentariosNormais(atual.comentarios)) === JSON.stringify(regras.comentariosNormais(copia.comentarios))
      if (!comentariosIguais) lista.append(criar('p', { className: 'nota', textContent: 'Comentários diferentes: ' + (atual.comentarios || []).length + ' no SEI e ' + (copia.comentarios || []).length + ' na cópia.' }))
      if (!total && comentariosIguais) lista.append(criar('p', { textContent: 'Não há diferenças: o documento no SEI está igual à cópia.' }))
    })
  }

  // --- Cópia anterior encontrada ao abrir o documento ---
  function oferecer (copia, atual) {
    pendente = true
    indicar('Cópia automática parada: há uma cópia anterior. Clique aqui para escolher.', 'aviso', () => oferecer(copia, atual))
    // Salvo no SEI depois da cópia (por outra pessoa ou outra janela): restaurar apagaria isso.
    const conflito = Boolean(copia.versaoSei && atual.versaoSei && copia.versaoSei !== atual.versaoSei)
    const caixa = caixaEditor.criarCaixa('copia-editor', 'Há uma cópia deste documento que não foi salva no SEI, guardada ' + regras.quando(copia.salvaEm) + '. Você pode continuar a partir dela.', 'Restaurar a cópia')
    if (conflito) caixa.botao.before(criar('p', { className: 'erro', textContent: 'Atenção: o documento foi salvo no SEI depois desta cópia. Restaurar apaga o que foi salvo depois. Veja as diferenças antes.' }))
    const ver = criar('button', { type: 'button', className: 'secundario', textContent: 'Ver diferenças' })
    const descartar = criar('button', { type: 'button', className: 'secundario', textContent: 'Descartar a cópia' })
    caixa.corpo.append(ver, descartar)
    ver.addEventListener('click', () => mostrarDiferencas(copia))
    caixa.botao.addEventListener('click', async () => {
      if (conflito && !window.confirm('O documento foi salvo no SEI depois desta cópia. Restaurar apaga o que foi salvo depois. Restaurar mesmo assim?')) return
      const ok = await trocarTexto(caixa, copia, 'Pronto: a cópia voltou ao editor. Confira o texto e clique em Salvar. A cópia só é apagada depois que o SEI salvar.', {
        antes: () => { pendente = true },
        depois: async () => oferecer((await lerCopia()) || copia, atual)
      })
      if (ok) {
        pendente = false
        if (!protegida) indicar('Cópia restaurada: confira e clique em Salvar.')
      }
    })
    descartar.addEventListener('click', async () => {
      if (!window.confirm('A cópia será apagada e não poderá ser recuperada. Apagar a cópia?')) return
      await apagar(id)
      const lido = await pedirAoFundo('copiaLer', { desde: false })
      if (lido.ok) base = lido
      pendente = false
      caixa.mostrar('ok', 'A cópia foi apagada. A cópia automática voltou a funcionar.')
      indicar('Cópia automática ligada')
    })
  }

  // --- Cópia automática ---
  async function iniciarAutomatica () {
    await limparVencidas()
    const trava = (await armazem.get(regras.chaveJanela(id)))[regras.chaveJanela(id)]
    if (regras.janelaViva(trava, minhaJanela, Date.now())) {
      indicar('Cópia automática parada: este documento está aberto em outra janela.', 'aviso')
      const caixa = caixaEditor.criarCaixa('copia-editor', 'Este documento também está aberto em outra janela do editor. Só a outra janela guarda a cópia automática. Para não perder trabalho, feche uma das duas.', 'Entendi')
      caixa.botao.addEventListener('click', () => caixa.remover())
      return
    }
    const travar = () => armazem.set({ [regras.chaveJanela(id)]: { janela: minhaJanela, vivo: Date.now() } }).catch(() => {})
    await travar()
    window.addEventListener('pagehide', () => { armazem.remove(regras.chaveJanela(id)).catch(() => {}) })
    // Antes de Salvar, guarda o que está na tela (se o SEI der erro ao salvar, nada se perde).
    document.addEventListener('extensao-ifto-salvando', () => { copiarAgora() })
    document.addEventListener('extensao-ifto-salvou', async () => {
      while (guardando) await esperar(100)
      protegida = false
      if (pendente) return // a cópia anterior continua lá: a pessoa ainda não escolheu
      await apagar(id)
      const lido = await pedirAoFundo('copiaLer', { desde: false })
      if (lido.ok) base = lido
      indicar('Salvo no SEI ' + regras.quando(Date.now()) + '. A cópia foi apagada.')
    })
    // O editor e as outras ajudas da extensão terminam de abrir antes da primeira leitura.
    await esperar(5000)
    const lido = await pedirAoFundo('copiaLer', { desde: false })
    if (!lido.ok) return indicar('A cópia automática não funcionou: ' + lido.erro, 'erro')
    base = lido
    const copia = await lerCopia()
    if (copia && regras.mesmoConteudo(copia, lido)) await apagar(id)
    else if (copia) oferecer(copia, lido)
    if (!pendente) indicar('Cópia automática ligada')
    setInterval(() => { travar(); copiarAgora() }, 30000)
  }

  // --- Botões "Copiar conteúdo" e "Colar conteúdo" (etapa 4) ---
  function iniciarManual () {
    const estilo = 'font:12px system-ui,sans-serif;padding:2px 8px;border:1px solid #1E5E33;border-radius:4px;background:#fff;color:#1E5E33;cursor:pointer;'
    const copiar = criar('button', { type: 'button', textContent: 'Copiar conteúdo', title: 'Guarda neste computador o documento inteiro (texto, formatação, tabelas, imagens e comentários), para colar em outra janela deste mesmo documento.' })
    const colar = criar('button', { type: 'button', textContent: 'Colar conteúdo', title: 'Põe nesta janela o conteúdo copiado deste mesmo documento. Você confere e clica em Salvar.' })
    copiar.style.cssText = estilo
    colar.style.cssText = estilo
    porBarra()
    barra.append(copiar, colar)
    copiar.addEventListener('click', async () => {
      copiar.disabled = true
      const lido = await pedirAoFundo('copiaLer', { desde: false })
      copiar.disabled = false
      const caixa = caixaEditor.criarCaixa('copia-manual', '', 'Fechar')
      caixa.botao.addEventListener('click', () => caixa.remover())
      if (!lido.ok) return caixa.mostrar('erro', 'Não consegui copiar: ' + lido.erro, caixa.botao)
      try {
        await armazem.set({ copiaManual: { id, titulo, salvaEm: Date.now(), secoes: lido.secoes, comentarios: lido.comentarios } })
        caixa.mostrar('ok', 'Conteúdo copiado ' + regras.quando(Date.now()) + '. Para colar, abra este documento em outra janela do editor e clique em "Colar conteúdo".', caixa.botao)
      } catch (erro) {
        caixa.mostrar('erro', 'Não consegui copiar: pouco espaço no navegador.', caixa.botao)
      }
    })
    colar.addEventListener('click', async () => {
      const { copiaManual } = await armazem.get('copiaManual')
      const caixa = caixaEditor.criarCaixa('copia-manual', '', 'Fechar')
      caixa.botao.addEventListener('click', () => caixa.remover())
      if (!copiaManual) return caixa.mostrar('aviso', 'Não há conteúdo copiado. Clique antes em "Copiar conteúdo" na outra janela deste documento.', caixa.botao)
      if (copiaManual.id !== id) return caixa.mostrar('aviso', 'O conteúdo copiado é de outro documento (' + copiaManual.titulo + '). Só é possível colar no mesmo documento.', caixa.botao)
      const atual = await pedirAoFundo('copiaLer', { desde: false })
      if (atual.ok && regras.mesmoConteudo(copiaManual, atual)) return caixa.mostrar('ok', 'Esta janela já tem o mesmo conteúdo copiado.', caixa.botao)
      if (!window.confirm('Trocar o texto desta janela pelo conteúdo copiado ' + regras.quando(copiaManual.salvaEm) + '? Depois você confere e clica em Salvar (há o botão Desfazer).')) return caixa.remover()
      await trocarTexto(caixa, copiaManual, 'Pronto: o conteúdo copiado está no editor. Confira o texto e clique em Salvar.', null)
    })
  }

  if (manual) iniciarManual()
  if (automatica) await iniciarAutomatica()
})()
