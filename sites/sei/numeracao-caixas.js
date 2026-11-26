// v0.37.0 (spec numeracao-caixas-ocultas): na janela do editor do SEI, em qualquer documento e unidade (mesma
// configuração de "Corrigir a numeração"), dois avisos: (1) parte do texto está em caixas escondidas do modelo
// antigo e a numeração automática sai errada ("3.3" em vez de "3.1"); (2) parágrafos com o número digitado à mão,
// que podem virar numeração automática depois de revisados no painel. Nada muda sem o clique; nunca salva.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const { configuracoes, caixaEditor, painelRevisao } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.numeracaoEdital) return

  const pedir = (acao, dado) => caixaEditor.pedirAoFundo('caixasNoEditor', { acao, dado })
  const DESFAZER = 'Confira e clique em Salvar no editor. Para desfazer, use Ctrl+Z ou feche o editor sem salvar.'
  const avisos = { caixas: null, digitados: null }
  let ocupado = false
  let painel = null

  const plural = (n, um, varios) => n === 1 ? um : varios
  const textoCaixas = n => `Parte do texto está dentro de ${plural(n, 'uma caixa escondida', n + ' caixas escondidas')} do modelo antigo do SEI. Por isso a numeração automática pode sair errada (por exemplo, "3.3" logo depois do título 3, em vez de "3.1").`
  const textoDigitados = n => `${plural(n, 'Um parágrafo tem', n + ' parágrafos têm')} o número digitado à mão (como "3.1."). Dá para trocar pela numeração automática, que se ajusta sozinha quando um item entra ou sai.`

  function tirarAviso (qual) {
    if (avisos[qual]) { avisos[qual].remover(); avisos[qual] = null }
  }

  // Depois do clique, o "Pronto" fica até a pessoa fechar (a conferência automática não o troca).
  const feito = qual => Boolean(avisos[qual] && avisos[qual].feito && avisos[qual].item.isConnected)

  function avisoCaixas (n) {
    if (feito('caixas')) return
    if (!n) return tirarAviso('caixas')
    if (avisos.caixas && avisos.caixas.item.isConnected) { avisos.caixas.corpo.querySelector('p').textContent = textoCaixas(n); return }
    const aviso = caixaEditor.criarCaixa('numeracao-caixas', textoCaixas(n), 'Tirar o texto das caixas')
    avisos.caixas = aviso
    aviso.botao.addEventListener('click', async () => {
      ocupado = true
      aviso.botao.disabled = true
      aviso.botao.textContent = 'Tirando…'
      const resultado = await pedir('tirar')
      ocupado = false
      if (!resultado || !resultado.ok) {
        aviso.mostrar('erro', 'Não consegui tirar o texto das caixas. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
        return
      }
      aviso.feito = true
      aviso.mostrar('ok', 'Pronto: o texto saiu das caixas escondidas e a numeração automática volta a contar certo. ' + DESFAZER)
    })
  }

  function avisoDigitados (n) {
    if (feito('digitados')) return
    if (!n) return tirarAviso('digitados')
    if (avisos.digitados && avisos.digitados.item.isConnected) { avisos.digitados.corpo.querySelector('p').textContent = textoDigitados(n); return }
    const aviso = caixaEditor.criarCaixa('numeracao-digitada', textoDigitados(n), 'Revisar e converter')
    avisos.digitados = aviso
    aviso.botao.addEventListener('click', () => abrirRevisao(aviso))
  }

  // D5: lista para revisar antes de converter (abre só com o clique).
  async function abrirRevisao (aviso) {
    aviso.botao.disabled = true
    const lido = await pedir('listar')
    aviso.botao.disabled = false
    if (!lido || !lido.ok) { aviso.mostrar('erro', 'Não consegui ler o texto. ' + ((lido && lido.erro) || '')); return }
    const itens = lido.itens.map(item => {
      const mudou = item.ficara && item.ficara !== item.numero
      if (!item.estilo) return { id: item.id, texto: `${item.numero}. ${item.texto}`, detalhe: 'O SEI não deixa um estilo numerado nesta parte do texto: fica como está.', desligado: true }
      const estilo = item.familia === 'edital' ? `${item.estilo} (o SEI não deixa Item_Nivel aqui)` : item.estilo
      return {
        id: item.id,
        texto: `${item.numero}. ${item.texto}`,
        detalhe: mudou ? `Vai mostrar ${item.ficara}. (não ${item.numero}.) – estilo ${estilo}` : `Fica ${item.ficara}. – estilo ${estilo}`,
        destaque: mudou
      }
    })
    const caixas = lido.caixas ? ' Antes, o texto também sai das caixas escondidas do modelo antigo (sem isso a numeração sai errada).' : ''
    painel = painelRevisao.abrirPainel({
      titulo: 'Números digitados à mão',
      explicacao: 'Os parágrafos marcados perdem o número digitado e ganham a numeração automática. Clique numa linha para ver o parágrafo no texto; desmarque o que deve ficar como está. Em laranja: o número vai mudar.' + caixas,
      itens,
      rotuloDoBotao: 'Converter os marcados',
      aoIr: id => pedir('ir', id),
      aoConfirmar: async ids => {
        ocupado = true
        const resposta = await pedir('converter', ids)
        ocupado = false
        if (!resposta || !resposta.ok) { painel.mostrar('erro', 'Não consegui converter. ' + ((resposta && resposta.erro) || '') + ' Nada foi salvo.'); return }
        painel.fechar()
        aviso.feito = true
        const edital = resposta.edital ? ` Em ${resposta.edital}, o SEI não deixa o estilo Item_Nivel: ficou o do Edital, que conta igual.` : ''
        aviso.mostrar('ok', `Pronto: ${resposta.convertidos} ${plural(resposta.convertidos, 'parágrafo passou', 'parágrafos passaram')} para a numeração automática.${edital} ` + DESFAZER)
        if (resposta.tiradas && avisos.caixas && !avisos.caixas.feito) { avisos.caixas.feito = true; avisos.caixas.mostrar('ok', 'O texto também saiu das caixas escondidas. ' + DESFAZER) }
      }
    })
  }

  function mostrar ({ caixas, digitados }) {
    if (ocupado) return
    avisoCaixas(Number(caixas) || 0)
    avisoDigitados(Number(digitados) || 0)
  }

  window.addEventListener('message', evento => {
    if (evento.source !== window || !evento.data || !evento.data.extensaoIftoCaixas) return
    mostrar(evento.data)
  })
  const preparar = () => pedir('preparar').catch(() => {})
  preparar()
  caixaEditor.quandoRemontar(preparar)
})()
