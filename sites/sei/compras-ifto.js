// v0.19.0 (spec compras-ifto-no-sei): peças do Compras IFTO no SEI. Na CCL (D7), com um processo aberto, a
// barra mostra "N peças do Compras IFTO"; cada peça abre a janela de confirmação (processo, NUP, tipo do
// documento, nível de acesso, prévia). Nunca assina (D1).
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { comprasIfto: regras, configuracoes, barra, seiPedidos, janela } = ExtensaoIFTO
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  const quadroArvore = document.getElementById('ifrArvore')
  if (!barra || !campoUnidade || !quadroArvore) return
  const unidade = campoUnidade.textContent.trim()
  const navegador = globalThis.browser || globalThis.chrome
  const { criar } = janela
  const ID = 'compras-ifto'

  let opcoes = await configuracoes.lerConfiguracoes()
  const ligada = () => regras.funcaoLigada(opcoes.comprasIfto, unidade)
  const lerPecas = async () => (await navegador.storage.local.get('pecasCompras')).pecasCompras || []
  const gravarPecas = pecasCompras => navegador.storage.local.set({ pecasCompras })

  // ---------- Botão na barra ----------
  const botao = barra.botao(ID, { texto: 'Peças do Compras IFTO', titulo: 'Incluir neste processo as peças enviadas pelo Compras IFTO', ordem: 20, aoClicar: () => abrirLista() })
  async function desenhar () {
    const pecas = ligada() ? await lerPecas() : []
    const mostrar = pecas.length > 0 && Boolean(seiPedidos.arvoreAberta())
    if (mostrar) botao.lastChild.textContent = ` ${pecas.length} ${pecas.length === 1 ? 'peça' : 'peças'} do Compras IFTO`
    barra.mostrar(ID, mostrar)
  }
  quadroArvore.addEventListener('load', () => setTimeout(desenhar, 300))
  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local') return
    if (mudancas.configuracoes) opcoes = await configuracoes.lerConfiguracoes()
    if (mudancas.configuracoes || mudancas.pecasCompras) desenhar()
  })
  desenhar()

  // Texto limpo (sem script nem evento) da peça, lido pelo navegador sem executar nada.
  const htmlLimpo = html => regras.limparHtml(new DOMParser().parseFromString(html, 'text/html'))
  const horario = quando => new Date(quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  // ---------- Lista de peças (D8) ----------
  let janelaAberta = null
  async function abrirLista () {
    if (janelaAberta) janelaAberta.fechar()
    const pecas = await lerPecas()
    const lida = seiPedidos.arvoreAberta()
    if (!lida) return
    const cartoes = pecas.map(peca => {
      const nup = regras.compararNup(peca.nup, lida.numero)
      return criar('div', { className: 'cartao' }, [
        criar('h2', { textContent: peca.titulo }),
        criar('p', { className: 'apoio', textContent: [peca.fase, peca.processo && 'Compras: ' + peca.processo, peca.nup && 'NUP ' + peca.nup, 'enviada em ' + horario(peca.chegou)].filter(Boolean).join(' · ') }),
        nup === 'diferente' ? criar('p', { className: 'aviso vermelho', textContent: `O NUP desta peça (${peca.nup}) é diferente do processo aberto (${lida.numero}).` }) : null,
        criar('div', { className: 'linha' }, [
          botaoPequeno('Tirar da lista', async () => { await gravarPecas(regras.tirarPeca(await lerPecas(), peca.id)); abrirLista() }),
          botaoPequeno('Incluir neste processo', () => confirmar(peca))
        ])
      ])
    })
    janelaAberta = janela.abrir({
      titulo: 'Peças do Compras IFTO',
      conteudo: [criar('p', { className: 'apoio', textContent: `Processo aberto: ${lida.numero}. Escolha a peça para criar o documento neste processo.` }), ...cartoes],
      botoes: [{ texto: 'Fechar', aoClicar: j => j.fechar() }],
      aoFechar: () => { janelaAberta = null }
    })
  }
  function botaoPequeno (texto, aoClicar) {
    const elemento = criar('button', { className: 'pequeno', type: 'button', textContent: texto })
    elemento.addEventListener('click', aoClicar)
    return elemento
  }

  // ---------- Página "Incluir Documento" do processo: tipos e formulário de cada tipo ----------
  // v0.36.0: em sei-pedidos.js, também para duplicar documento.
  const { abrirIncluir, formularioDoTipo } = seiPedidos
  const hipotesesDe = formulario => [...formulario.querySelectorAll('select[name="selHipoteseLegal"] option')]
    .map(opcao => ({ valor: opcao.getAttribute('value'), texto: opcao.textContent.trim() }))
    .filter(opcao => opcao.valor && opcao.valor !== 'null' && opcao.texto)

  // ---------- Janela de confirmação ----------
  async function confirmar (peca) {
    if (janelaAberta) janelaAberta.fechar()
    const lida = seiPedidos.arvoreAberta()
    if (!lida) return
    if (!ligada()) return
    const espera = janela.abrir({ titulo: peca.titulo, conteudo: [criar('p', { textContent: 'Lendo os tipos de documento do SEI…' })], botoes: [] })
    let incluir
    try {
      incluir = await abrirIncluir(lida)
    } catch (erro) {
      espera.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: erro.message })])
      espera.trocarBotoes([{ texto: 'Fechar', aoClicar: j => j.fechar() }])
      return
    }
    espera.fechar()
    if (!incluir.tipos.length) {
      janela.abrir({ titulo: peca.titulo, conteudo: [criar('p', { className: 'aviso vermelho', textContent: 'O SEI não mostrou nenhum tipo de documento nesta unidade.' })], botoes: [{ texto: 'Fechar', aoClicar: j => j.fechar() }] })
      return
    }
    const html = htmlLimpo(peca.html)
    const sugerido = regras.sugerirTipo(incluir.tipos, [peca.fase, peca.titulo])
    const hoje = ExtensaoIFTO.documentoExterno.dataDeHoje()
    const { comprasCriados } = await navegador.storage.local.get('comprasCriados')

    // Tipo (D4): sugerido pelo nome; a pessoa pode trocar.
    const listaDeTipos = criar('select', {}, [criar('option', { value: '', textContent: 'Escolha o tipo de documento' }), ...incluir.tipos.map(tipo => criar('option', { value: tipo.id, textContent: tipo.nome, selected: Boolean(sugerido && sugerido.id === tipo.id) }))])
    const notaDoTipo = criar('p', { className: 'apoio', textContent: sugerido ? 'Tipo sugerido pelo nome da peça: confira.' : 'Não achei um tipo parecido: escolha na lista.' })
    const avisoRepetido = criar('p', { className: 'aviso amarelo', hidden: true })
    const confirmaRepetido = criar('input', { type: 'checkbox' })
    const linhaRepetido = criar('label', { className: 'escolha', hidden: true }, [confirmaRepetido, criar('span', { textContent: 'Criar mesmo assim' })])

    // Nível de acesso (D6): Público; Restrito pede a hipótese legal (lista do próprio SEI).
    const publico = criar('input', { type: 'radio', name: 'acessoCompras', checked: true })
    const restrito = criar('input', { type: 'radio', name: 'acessoCompras' })
    const listaDeHipoteses = criar('select', {}, [criar('option', { value: '', textContent: 'Escolha a hipótese legal' })])
    const linhaHipotese = criar('label', { hidden: true }, [criar('span', { textContent: 'Hipótese legal' }), listaDeHipoteses])
    const formularios = new Map()
    async function carregarHipoteses () {
      const idTipo = listaDeTipos.value
      if (!restrito.checked || !idTipo) return
      try {
        if (!formularios.has(idTipo)) formularios.set(idTipo, await formularioDoTipo(incluir, idTipo))
        const hipoteses = hipotesesDe(formularios.get(idTipo).formulario)
        listaDeHipoteses.replaceChildren(criar('option', { value: '', textContent: hipoteses.length ? 'Escolha a hipótese legal' : 'O SEI não mostrou hipóteses legais' }), ...hipoteses.map(item => criar('option', { value: item.valor, textContent: item.texto })))
      } catch (erro) {
        listaDeHipoteses.replaceChildren(criar('option', { value: '', textContent: erro.message }))
      }
    }
    const trocarAcesso = () => { linhaHipotese.hidden = !restrito.checked; carregarHipoteses() }
    publico.addEventListener('change', trocarAcesso)
    restrito.addEventListener('change', trocarAcesso)

    // D9: documento do mesmo tipo na árvore ou criado hoje pela extensão.
    function conferirRepetido () {
      const tipo = incluir.tipos.find(item => item.id === listaDeTipos.value)
      const achado = tipo ? regras.repetidos({ documentos: lida.documentos, criados: comprasCriados, idProcesso: lida.idProcesso, tipo, hoje }) : { naArvore: 0, hojeAqui: 0 }
      const partes = []
      if (achado.hojeAqui) partes.push(`a extensão já criou ${achado.hojeAqui === 1 ? 'um documento' : achado.hojeAqui + ' documentos'} "${tipo.nome}" hoje neste processo`)
      if (achado.naArvore) partes.push(`a árvore já tem ${achado.naArvore === 1 ? 'um documento' : achado.naArvore + ' documentos'} "${tipo.nome}"`)
      avisoRepetido.hidden = !partes.length
      linhaRepetido.hidden = !partes.length
      confirmaRepetido.checked = false
      avisoRepetido.textContent = partes.length ? 'Atenção: ' + partes.join(' e ') + '. Confira se não é a mesma peça.' : ''
    }
    listaDeTipos.addEventListener('change', () => { conferirRepetido(); carregarHipoteses() })
    conferirRepetido()

    // Prévia num quadro isolado (sandbox: nada da peça roda na página do SEI).
    const previa = criar('iframe', { title: 'Prévia da peça' })
    previa.setAttribute('sandbox', '')
    previa.style.cssText = 'width:100%;height:240px;border:1px solid #E2E6E3;border-radius:8px;background:#fff'
    previa.srcdoc = `<!doctype html><meta charset="utf-8"><style>body{font:13px/1.5 Calibri,Arial,sans-serif;margin:12px;color:#1B2420}table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px}</style>${html}`

    const nup = regras.compararNup(peca.nup, lida.numero)
    const conteudo = [
      criar('p', { textContent: `Processo aberto no SEI: ${lida.numero}` }),
      nup === 'diferente' ? criar('p', { className: 'aviso vermelho', textContent: `O NUP da peça no Compras IFTO é ${peca.nup}, diferente do processo aberto. Confira se é o processo certo.` }) : null,
      nup === 'sem' ? criar('p', { className: 'apoio', textContent: 'A peça não tem NUP no Compras IFTO: confira se este é o processo certo.' }) : null,
      criar('label', {}, [criar('span', { textContent: 'Tipo de documento no SEI' }), listaDeTipos]),
      notaDoTipo,
      avisoRepetido,
      linhaRepetido,
      criar('div', {}, [
        criar('p', { textContent: 'Nível de acesso' }),
        criar('label', { className: 'escolha' }, [publico, criar('span', { textContent: 'Público' })]),
        criar('label', { className: 'escolha' }, [restrito, criar('span', { textContent: 'Restrito' })])
      ]),
      linhaHipotese,
      criar('p', { className: 'apoio', textContent: 'Prévia do texto (vai para o corpo do documento; o cabeçalho e o rodapé vêm do modelo do SEI):' }),
      previa,
      criar('p', { className: 'apoio', textContent: 'A extensão cria o documento, coloca o texto e salva. Ela não assina: a assinatura continua com você.' })
    ]
    const erro = criar('p', { className: 'aviso vermelho', hidden: true })
    conteudo.push(erro)

    janela.abrir({
      titulo: 'Incluir: ' + peca.titulo,
      conteudo,
      botoes: [
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        {
          texto: 'Criar e salvar',
          tipo: 'principal',
          aoClicar: async j => {
            const tipo = incluir.tipos.find(item => item.id === listaDeTipos.value)
            const mostrarErro = texto => { erro.textContent = texto; erro.hidden = false }
            if (!tipo) { mostrarErro('Escolha o tipo de documento.'); return }
            if (!linhaRepetido.hidden && !confirmaRepetido.checked) { mostrarErro('Marque "Criar mesmo assim" ou escolha outro tipo.'); return }
            if (restrito.checked && !listaDeHipoteses.value) { mostrarErro('Escolha a hipótese legal do documento restrito.'); return }
            erro.hidden = true
            j.fechar()
            await criarESalvar({ peca, html, tipo, lida, incluir, restrito: restrito.checked, hipotese: listaDeHipoteses.value, hoje })
          }
        }
      ]
    })
  }

  // ---------- Criar o documento (v0.20.0, etapa 2) ----------
  // Sem abrir telas, como os documentos do pagamento: Incluir Documento › tipo › "Texto inicial: Nenhum"
  // (o cabeçalho e o rodapé vêm do modelo do tipo) › nível de acesso › Salvar. Devolve os links do editor e
  // do texto do documento novo.
  const temOpcaoNula = lista => lista && [...lista.options].some(opcao => opcao.getAttribute('value') === 'null')
  async function criarDocumento ({ tipo, lida, restrito, hipotese }) {
    const incluir = await abrirIncluir(lida)
    const { pagina, formulario } = await formularioDoTipo(incluir, tipo.id)
    const opcoesDoTexto = [...formulario.querySelectorAll('input[name="rdoTextoInicial"]')]
    if (!opcoesDoTexto.length) throw new Error(`"${tipo.nome}" não é um documento feito no editor do SEI. Escolha outro tipo.`)
    const rotuloDe = campo => { const rotulo = campo.id && formulario.querySelector(`label[for="${campo.id}"]`); return (rotulo ? rotulo.textContent : '') + ' ' + campo.id }
    const nenhum = opcoesDoTexto.find(campo => /nenhum/i.test(rotuloDe(campo))) || opcoesDoTexto.find(campo => campo.getAttribute('value') === 'N')
    if (!nenhum) throw new Error('Não achei a opção "Texto inicial: Nenhum" no formulário do SEI.')
    const novos = { hdnIdSerie: tipo.id, rdoTextoInicial: nenhum.getAttribute('value'), rdoNivelAcesso: restrito ? '1' : '0', hdnFlagDocumentoCadastro: '2' }
    const grau = formulario.querySelector('select[name="selGrauSigilo"]')
    if (temOpcaoNula(grau)) novos.selGrauSigilo = 'null'
    const hipoteses = formulario.querySelector('select[name="selHipoteseLegal"]')
    if (restrito) {
      if (!hipoteses) throw new Error('O formulário do SEI não tem a hipótese legal para documento restrito.')
      novos.selHipoteseLegal = hipotese
    } else if (temOpcaoNula(hipoteses)) {
      novos.selHipoteseLegal = 'null'
    }
    const resposta = await seiPedidos.enviar(formulario, pagina.endereco, novos)
    // Se o SEI devolve o formulário de novo, não criou (a mensagem do SEI explica).
    if (seiPedidos.lerHtml(resposta.html).getElementById('frmDocumentoCadastro')) {
      throw new Error(ExtensaoIFTO.documentosPagamento.mensagemDoSei(resposta.html) || `O SEI não criou o documento "${tipo.nome}".`)
    }
    let links = regras.linksDoDocumento(resposta.html, resposta.endereco)
    // Sem o link do editor na resposta: procura o documento novo na árvore e abre a página dele.
    const novo = await documentoNovo(lida, links.idDocumento)
    if ((!links.urlEditor || !links.linkVer) && novo && novo.linkArvore) {
      const daArvore = await seiPedidos.pedir(new URL(novo.linkArvore, location.href).href)
      const outros = regras.linksDoDocumento(daArvore.html, daArvore.endereco)
      links = { urlEditor: links.urlEditor || outros.urlEditor, linkVer: links.linkVer || outros.linkVer, idDocumento: links.idDocumento || outros.idDocumento || novo.id }
    }
    return { ...links, idDocumento: links.idDocumento || (novo && novo.id) || '', rotulo: novo ? novo.rotulo : '' }
  }
  // Recarrega a árvore e espera o documento novo aparecer (até 15 s): o de id conhecido ou o que não existia.
  async function documentoNovo (lidaAntes, idDocumento) {
    const antes = new Set(lidaAntes.documentos.map(doc => doc.id))
    seiPedidos.recarregarArvore()
    const fim = Date.now() + 15000
    while (Date.now() < fim) {
      await new Promise(resolve => setTimeout(resolve, 700))
      const lida = seiPedidos.arvoreAberta()
      if (!lida) continue
      const achado = idDocumento ? lida.documentos.find(doc => doc.id === idDocumento) : lida.documentos.find(doc => !antes.has(doc.id))
      if (achado) return achado
    }
    return null
  }

  // Janela de andamento e resultado.
  async function criarESalvar ({ peca, html, tipo, lida, restrito, hipotese, hoje }) {
    const andamento = janela.abrir({ titulo: 'Incluindo: ' + peca.titulo, conteudo: [criar('p', { textContent: `Criando o documento "${tipo.nome}" no processo ${lida.numero}…` })], botoes: [] })
    let criado
    try {
      criado = await criarDocumento({ tipo, lida, restrito, hipotese })
    } catch (erro) {
      andamento.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: 'O documento não foi criado: ' + erro.message }), criar('p', { className: 'apoio', textContent: 'A peça continua na lista.' })])
      andamento.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
      return
    }
    const { comprasCriados } = await navegador.storage.local.get('comprasCriados')
    await navegador.storage.local.set({ comprasCriados: regras.lembrarCriado(comprasCriados, { idProcesso: lida.idProcesso, idTipo: tipo.id, data: hoje }) })
    const nome = criado.rotulo || `${tipo.nome} (novo)`
    const terminar = (lista, botoes = [{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }]) => { andamento.trocarConteudo(lista); andamento.trocarBotoes(botoes) }
    const aMao = 'Abra o documento na árvore, clique em "Editar Conteúdo", cole o texto (use "Copiar para o SEI" no Compras IFTO) e salve. A peça continua na lista.'

    // v0.21.0 (etapa 3): texto no corpo e Salvar, numa janela do editor aberta pela extensão (nunca assina).
    if (!criado.urlEditor) {
      terminar([criar('p', { className: 'aviso amarelo', textContent: `Documento criado: ${nome}, mas não achei o editor dele para colocar o texto.` }), criar('p', { className: 'apoio', textContent: aMao })])
      return
    }
    andamento.trocarConteudo([criar('p', { className: 'aviso verde', textContent: `Documento criado: ${nome}.` }), criar('p', { textContent: 'Abrindo o editor do SEI para colocar o texto e salvar… (a janela do editor fecha sozinha)' })])
    let resultado
    try {
      resultado = await preencherNoEditor(new URL(criado.urlEditor, location.href).href, criado.idDocumento, html)
    } catch (erro) {
      resultado = { ok: false, erro: erro.message }
    }
    const sobreOEditor = resultado.editor ? criar('p', { className: 'apoio', textContent: `Editor do SEI: ${resultado.editor}; seções: ${(resultado.secoes || []).join(', ') || '—'}${resultado.corpo ? '; texto posto em: ' + resultado.corpo : ''}.` }) : null
    if (!resultado.ok) {
      terminar([
        criar('p', { className: 'aviso amarelo', textContent: `Documento criado: ${nome}, mas o texto não foi salvo. ${resultado.erro || ''}` }),
        criar('p', { className: 'apoio', textContent: 'Se a janela do editor ficou aberta, confira o texto nela e clique em Salvar. Senão: ' + aMao }),
        sobreOEditor
      ])
      return
    }
    // Confere no SEI se o texto ficou salvo (começo do texto na página do documento).
    let conferido = null
    if (criado.linkVer) {
      try {
        const pagina = await seiPedidos.pedir(new URL(criado.linkVer, location.href).href)
        const texto = seiPedidos.lerHtml(pagina.html).body.textContent
        conferido = regras.contemTrecho(texto, regras.trechoParaConferir(seiPedidos.lerHtml(html).body.textContent))
      } catch (erro) { conferido = null }
    }
    if (conferido === false) {
      terminar([criar('p', { className: 'aviso amarelo', textContent: `Documento criado: ${nome}, mas não encontrei o texto da peça nele depois de salvar. Abra o documento na árvore e confira. A peça continua na lista.` }), sobreOEditor])
      return
    }
    await gravarPecas(regras.tirarPeca(await lerPecas(), peca.id))
    seiPedidos.recarregarArvore()
    terminar([
      criar('p', { className: 'aviso verde', textContent: `Pronto: ${nome} criado com o texto da peça e salvo. Ele não foi assinado.` }),
      criar('p', { className: 'apoio', textContent: conferido ? 'O texto foi conferido no SEI. Abra o documento na árvore para revisar e assinar.' : 'Abra o documento na árvore para revisar o texto e assinar.' }),
      sobreOEditor
    ])
  }

  // Pede à parte de fundo para abrir o editor, pôr o texto e salvar; espera o recado "comprasResultado".
  const esperandoEditor = new Map()
  navegador.runtime.onMessage.addListener((recado, remetente, responder) => {
    if (!recado || recado.tipo !== 'comprasResultado') return
    responder({ recebido: true })
    const aoTerminar = esperandoEditor.get(String(recado.idDocumento || ''))
    if (aoTerminar) aoTerminar(recado.resultado || { ok: false, erro: 'Sem resposta do editor.' })
  })
  function preencherNoEditor (urlEditor, idDocumento, html) {
    return new Promise((resolver, rejeitar) => {
      const chave = String(idDocumento || '')
      const relogio = setTimeout(() => { esperandoEditor.delete(chave); resolver({ ok: false, erro: 'O editor do SEI demorou demais para responder.' }) }, 150000)
      esperandoEditor.set(chave, resultado => { clearTimeout(relogio); esperandoEditor.delete(chave); resolver(resultado) })
      navegador.runtime.sendMessage({ tipo: 'comprasPreencher', urlEditor, idDocumento: chave, html }).then(resposta => {
        if (!resposta || resposta.erro) { clearTimeout(relogio); esperandoEditor.delete(chave); rejeitar(new Error((resposta && resposta.erro) || 'A extensão não abriu o editor.')) }
      }, erro => { clearTimeout(relogio); esperandoEditor.delete(chave); rejeitar(erro) })
    })
  }
})()
