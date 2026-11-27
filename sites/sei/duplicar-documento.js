// v0.36.0 (spec duplicar-documento): "Duplicar documento" no menu do ícone do documento na árvore. Abre, no
// quadro do documento, o formulário de documento novo do SEI com o mesmo tipo, o original como "Documento
// Modelo" e os dados do cadastro dele. Os dados passam direto da página principal para o formulário (nada
// fica guardado no navegador). v0.38.0 (#355): com tudo copiado, salva sozinho e o SEI abre o editor; o
// documento externo é duplicado sem o arquivo (o clique em "Duplicar documento" é a confirmação).
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const { duplicarDocumento: regras, documentoExterno, menuDocumento, configuracoes, janela, seiPedidos } = globalThis.ExtensaoIFTO
  if (!menuDocumento || !document.getElementById('ifrArvore')) return
  const navegador = globalThis.browser || globalThis.chrome
  const { criar } = janela
  const TITULO = 'Duplicar documento'
  // Espera do formulário e da lista de hipóteses legais (chega do SEI depois de marcar Restrito).
  const ESPERA_FORMULARIO = 60000
  const ESPERA_HIPOTESE = 15000

  let opcoes = await configuracoes.lerConfiguracoes()
  navegador.storage.onChanged.addListener(async mudou => {
    if (mudou.configuracoes) opcoes = await configuracoes.lerConfiguracoes()
  })
  menuDocumento.registrar({
    nome: 'duplicar-documento',
    primeira: true,
    ligada: () => opcoes.duplicarDocumento,
    opcoes: (lida, documento) => {
      if (regras.podeDuplicar(lida, documento)) return [{ texto: TITULO, aoClicar: () => duplicar(lida, documento) }]
      return regras.podeDuplicarExterno(lida, documento) ? [{ texto: TITULO, aoClicar: () => duplicarExterno(lida, documento) }] : []
    }
  })

  // v0.38.0 (#355): documento externo: cria a cópia sem o arquivo e abre na árvore.
  async function duplicarExterno (lida, documento) {
    const aberta = janela.abrir({ titulo: TITULO, conteudo: [criar('p', { textContent: `Criando a cópia de ${documento.rotulo} (sem o arquivo)…` })], botoes: [] })
    try {
      await seiPedidos.duplicarExterno(lida, documento)
      aberta.fechar()
      janela.mensagemRapida(`Cópia de ${documento.rotulo} criada, sem o arquivo.`)
    } catch (erro) {
      aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: erro.message })])
      aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
    }
  }

  // ---------- Cadastro do original (só leitura) ----------
  // null se não deu para ler (D8): de outra unidade sem o link, SEI lento ou página diferente.
  async function lerCadastro (documento) {
    if (!documento.linkCadastro) return null
    try {
      const pagina = await seiPedidos.pedir(new URL(documento.linkCadastro, location.href).href)
      const formulario = seiPedidos.lerHtml(pagina.html).getElementById('frmDocumentoCadastro')
      if (!formulario) return null
      const valor = nome => { const campo = formulario.querySelector('#' + nome); return campo ? campo.getAttribute('value') || '' : '' }
      if (valor('hdnIdDocumento') !== documento.id) return null
      const lista = nome => {
        const doCampo = regras.lerLista(valor('hdn' + nome))
        const daTela = [...formulario.querySelectorAll(`#sel${nome} option`)].map(opcao => ({ id: opcao.getAttribute('value') || '', nome: opcao.textContent.trim() }))
        return regras.semRepetidos(doCampo.length ? doCampo : daTela)
      }
      const marcado = formulario.querySelector('input[name="rdoNivelAcesso"][checked]')
      const hipotese = formulario.querySelector('#selHipoteseLegal option[selected]')
      const idHipotese = hipotese ? hipotese.getAttribute('value') : ''
      return {
        idSerie: valor('hdnIdSerie'),
        descricao: valor('txtDescricao'),
        listas: { Interessados: lista('Interessados'), Destinatarios: lista('Destinatarios'), Assuntos: lista('Assuntos') },
        nivel: marcado ? marcado.getAttribute('value') : valor('hdnStaNivelAcessoLocal'),
        hipotese: idHipotese && idHipotese !== 'null' ? idHipotese : valor('hdnIdHipoteseLegal')
      }
    } catch (erro) { return null }
  }

  // ---------- Abrir o formulário ----------
  // Quadro do documento: dentro de "ifrConteudoVisualizacao", o mesmo em que o SEI abre "Incluir Documento".
  function quadroDoDocumento () {
    const fora = document.getElementById('ifrConteudoVisualizacao')
    try { return (fora && fora.contentDocument && fora.contentDocument.getElementById('ifrVisualizacao')) || fora } catch (erro) { return fora }
  }

  // Um novo clique cancela o anterior.
  let cancelarAnterior = () => {}
  async function duplicar (lida, documento) {
    cancelarAnterior()
    let cancelado = false
    let terminar = () => {}
    const marca = document.documentElement.dataset
    const aberta = janela.abrir({
      titulo: TITULO,
      conteudo: [criar('p', { textContent: `Abrindo o formulário do SEI para duplicar ${documento.rotulo}…` })],
      botoes: [{ texto: 'Cancelar', aoClicar: j => j.fechar() }],
      aoFechar: () => { cancelado = true; terminar() }
    })
    cancelarAnterior = () => { cancelado = true; terminar(); aberta.fechar() }
    const avisar = texto => {
      aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: texto })])
      aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
    }
    try {
      const [incluir, cadastro] = await Promise.all([seiPedidos.abrirIncluir(lida), lerCadastro(documento)])
      if (cancelado) return
      const tipo = regras.acharTipo(incluir.tipos, cadastro && cadastro.idSerie, documento.rotulo)
      if (!tipo) { avisar(`O tipo de "${documento.rotulo}" não aparece em "Incluir Documento" nesta unidade. Nada foi aberto.`); return }
      const { pagina, formulario } = await seiPedidos.formularioDoTipo(incluir, tipo.id)
      if (cancelado) return
      if (!formulario.querySelector('#optProtocoloDocumentoTextoBase')) { avisar(`O SEI não deixa usar um documento como modelo no tipo "${tipo.nome}". Nada foi aberto.`); return }
      // O processo pode ter sido trocado enquanto o SEI respondia.
      const agora = seiPedidos.arvoreAberta()
      const quadro = quadroDoDocumento()
      if (!agora || agora.idProcesso !== lida.idProcesso || !quadro) { avisar('O processo aberto mudou. Abra-o de novo e tente outra vez.'); return }

      const acao = endereco => new URL(endereco, pagina.endereco).searchParams.get('acao')
      const destino = new URL(acao(pagina.endereco) === 'documento_gerar' ? pagina.endereco : formulario.getAttribute('action'), pagina.endereco).href

      const documentoDoQuadro = await new Promise((resolve, reject) => {
        const relogio = setTimeout(() => { limpar(); reject(new Error('O SEI demorou demais para abrir o formulário: ele pode estar lento ou fora do ar. Tente de novo daqui a pouco.')) }, ESPERA_FORMULARIO)
        const limpar = () => {
          clearTimeout(relogio)
          quadro.removeEventListener('load', aoAbrir)
          delete marca.extensaoIftoDuplicar
        }
        const aoAbrir = () => {
          let dentro = null
          try { dentro = quadro.contentDocument } catch (erro) { /* quadro em outra página: confere quando ela abrir */ }
          const campo = dentro && dentro.getElementById('hdnIdProcedimento')
          const serie = dentro && dentro.getElementById('hdnIdSerie')
          const certo = campo && campo.value === lida.idProcesso && serie && serie.value === tipo.id && dentro.getElementById('optProtocoloDocumentoTextoBase')
          // D3, D8: documento-externo.js não marca Público neste formulário (antes e depois de ele carregar).
          if (certo) dentro.documentElement.dataset.extensaoIftoDuplicado = '1'
          limpar()
          if (certo) resolve(dentro)
          else reject(new Error('O SEI não abriu o formulário do documento. Confira se a sessão do SEI ainda está aberta.'))
        }
        terminar = () => { limpar(); resolve(null) }
        marca.extensaoIftoDuplicar = destino
        quadro.addEventListener('load', aoAbrir)
        quadro.contentWindow.location.href = destino
      })
      terminar = () => {}
      if (!documentoDoQuadro || cancelado) return
      aberta.fechar()
      cancelarAnterior = () => {}
      try { await preencher(documentoDoQuadro, documento, cadastro) } catch (erro) {
        documentoExterno.avisarNoFormulario(documentoDoQuadro, 'A extensão não conseguiu preencher tudo: confira cada campo antes de salvar.', 'erro', 'duplicar-documento')
      }
    } catch (erro) {
      if (!cancelado) avisar(erro.message)
    }
  }

  // ---------- Preencher ----------
  async function preencher (pagina, documento, cadastro) {
    const formulario = pagina.getElementById('frmDocumentoCadastro')
    const campo = id => pagina.getElementById(id)
    const avisos = []
    // O clique roda as funções do próprio SEI (mostra o campo do número).
    campo('optProtocoloDocumentoTextoBase').click()
    campo('txtProtocoloDocumentoTextoBase').value = regras.numeroDoDocumento(documento.rotulo)

    if (!cadastro) {
      desmarcarNivel(campo)
      avisos.push('Não consegui ler o cadastro do documento original: confira a descrição, os interessados e os assuntos e escolha o nível de acesso.')
    } else {
      if (campo('txtDescricao')) campo('txtDescricao').value = cadastro.descricao
      for (const [nome, itens] of Object.entries(cadastro.listas)) porLista(pagina, nome, itens)
      const nivel = regras.nivelACopiar(cadastro)
      const opcao = nivel && campo(nivel === 'publico' ? 'optPublico' : 'optRestrito')
      if (!opcao || opcao.disabled) {
        desmarcarNivel(campo)
        avisos.push('O nível de acesso do original não pôde ser copiado: escolha-o antes de salvar.')
      } else {
        if (opcao.checked) opcao.dispatchEvent(new Event('change', { bubbles: true }))
        else opcao.click()
        if (nivel === 'restrito' && !(await escolherHipotese(pagina, cadastro.hipotese))) {
          avisos.push('A hipótese legal do original não pôde ser copiada: escolha-a antes de salvar.')
        }
      }
    }
    if (!formulario.isConnected) return
    // v0.38.0 (#355, usuário, 27/11/2026): com tudo copiado, a extensão clica no Salvar do próprio SEI, que
    // confere os campos, cria o documento e abre o editor (como no documento novo feito à mão). Se algo não
    // pôde ser copiado, o formulário fica aberto para a pessoa conferir.
    const salvar = campo('btnSalvar')
    if (!avisos.length && salvar) {
      salvar.click()
      return
    }
    for (const texto of avisos) documentoExterno.avisarNoFormulario(pagina, texto, 'dica', 'duplicar-documento')
    documentoExterno.avisarNoFormulario(pagina, `Cópia de ${documento.rotulo}, preenchida pela extensão: confira e clique em Salvar.`, 'feito', 'duplicar-documento')
  }

  // D8: o SEI pode ter sugerido um nível: a escolha fica com a pessoa.
  function desmarcarNivel (campo) {
    for (const id of ['optSigiloso', 'optRestrito', 'optPublico']) if (campo(id)) campo(id).checked = false
  }

  // D7: a lista do original no lugar da sugerida pelo SEI (vazia, se a do original é vazia). O SEI envia o
  // campo escondido, que precisa ser igual à lista da tela.
  function porLista (pagina, nome, itens) {
    const lista = pagina.getElementById('sel' + nome)
    const escondido = pagina.getElementById('hdn' + nome)
    if (!lista || !escondido) return
    lista.replaceChildren(...itens.map(item => {
      const opcao = pagina.createElement('option')
      opcao.value = item.id
      opcao.textContent = item.nome
      return opcao
    }))
    escondido.value = regras.listaEmTexto(itens)
  }

  // A sugestão do SEI pode vir marcada: se a do original não estiver na lista, fica sem escolha.
  async function escolherHipotese (pagina, id) {
    const fim = Date.now() + ESPERA_HIPOTESE
    while (Date.now() < fim) {
      const lista = pagina.getElementById('selHipoteseLegal')
      if (!lista || !pagina.defaultView || !pagina.getElementById('optRestrito').checked) return true
      const chegou = [...lista.options].some(opcao => opcao.value && opcao.value !== 'null')
      if (chegou) {
        const tem = id && [...lista.options].some(opcao => opcao.value === id)
        lista.value = tem ? id : 'null'
        lista.dispatchEvent(new Event('change', { bubbles: true }))
        // A lista pode chegar do SEI mais uma vez (com a sugestão dele): confere por 3 segundos.
        const escolhida = lista.selectedOptions[0]
        for (let vez = 0; vez < 10; vez++) {
          await new Promise(resolve => setTimeout(resolve, 300))
          if (escolhida && !escolhida.isConnected) lista.value = tem ? id : 'null'
        }
        return Boolean(tem)
      }
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    return false
  }
})()
