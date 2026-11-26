// v0.38.0 (spec remover-formatacao-agu): na janela de avisos do editor do SEI, quando o texto tem marcas da AGU
// (riscado, cores, "Justificativa Modificação Item(ns)", comentários), a seção "Remover Formatação da AGU". O
// clique abre o painel de revisão (nunca abre sozinho, D8) com tudo marcado; sai só o que ficar marcado. Opção
// "automatica": só na CCL (D2). Nunca salva.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const { configuracoes, caixaEditor, painelRevisao, formatacaoAgu: regras } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!regras.funcaoLigada(opcoes.formatacaoAgu, await caixaEditor.unidadeAberta())) return

  const pedir = (acao, dado) => caixaEditor.pedirAoFundo('aguNoEditor', { acao, dado })
  const DESFAZER = 'Confira o texto e clique em Salvar no editor. Para desfazer, use Ctrl+Z ou feche o editor sem salvar.'
  let aviso = null
  let ocupado = false
  let painel = null

  const plural = (n, um, varios) => n === 1 ? um : varios
  const emLista = partes => partes.length > 1 ? partes.slice(0, -1).join(', ') + ' e ' + partes[partes.length - 1] : partes[0]

  function resumo (c) {
    const partes = []
    if (c.riscado) partes.push(`${c.riscado} ${plural(c.riscado, 'trecho riscado', 'trechos riscados')}`)
    if (c.justificativa) partes.push(`${c.justificativa} "Justificativa Modificação Item(ns)"`)
    if (c.cores) partes.push(`${c.cores} ${plural(c.cores, 'trecho colorido', 'trechos coloridos')}`)
    if (c.brancos) partes.push(`${c.brancos} ${plural(c.brancos, 'trecho em branco (invisível)', 'trechos em branco (invisíveis)')}`)
    if (c.marcas) partes.push(`${c.marcas} ${plural(c.marcas, 'trecho marcado', 'trechos marcados')} com cor de fundo`)
    if (c.word) partes.push(`${c.word} ${plural(c.word, 'marca', 'marcas')} de comentário do Word`)
    if (c.balao) partes.push(`${c.balao} ${plural(c.balao, 'comentário', 'comentários')}`)
    return partes
  }

  const feito = () => Boolean(aviso && aviso.feito && aviso.item.isConnected)
  const total = c => ['riscado', 'justificativa', 'cores', 'brancos', 'marcas', 'word', 'balao'].reduce((soma, chave) => soma + (Number(c[chave]) || 0), 0)
  let restante = 0

  function mostrar (contas) {
    if (ocupado) return
    // Depois do "Pronto", o aviso volta só se as marcas voltarem (Ctrl+Z ou texto colado).
    if (feito()) {
      if (total(contas) <= restante) return
      aviso.remover()
      aviso = null
    }
    const partes = resumo(contas)
    if (!partes.length) { if (aviso) { aviso.remover(); aviso = null } return }
    const texto = `Este documento tem marcas da AGU: ${emLista(partes)}.`
    if (aviso && aviso.item.isConnected) { aviso.corpo.querySelector('p').textContent = texto; return }
    aviso = caixaEditor.criarCaixa('formatacao-agu', texto, 'Remover Formatação da AGU')
    aviso.botao.addEventListener('click', () => abrirRevisao(aviso))
  }

  function linhasDosGrupos (c) {
    const linhas = []
    if (c.cores) linhas.push({ id: 'cores', texto: `${c.cores} ${plural(c.cores, 'trecho colorido fica preto', 'trechos coloridos ficam pretos')}`, detalhe: 'Os links continuam com a cor deles.' })
    if (c.brancos) linhas.push({ id: 'brancos', texto: `${c.brancos} ${plural(c.brancos, 'trecho em branco (invisível) é apagado', 'trechos em branco (invisíveis) são apagados')}`, detalhe: 'Texto escrito em branco não aparece na página nem no PDF (por exemplo, um número escondido).' })
    if (c.marcas) linhas.push({ id: 'marcas', texto: `${c.marcas} ${plural(c.marcas, 'trecho perde', 'trechos perdem')} a cor de fundo`, detalhe: 'Como o amarelo de marca-texto. O fundo das tabelas e dos títulos fica.' })
    if (c.word) linhas.push({ id: 'word', texto: `${c.word} ${plural(c.word, 'marca', 'marcas')} de comentário do Word ${plural(c.word, 'sai', 'saem')}`, detalhe: 'Ligações que vieram do Word junto com os comentários.' })
    return linhas
  }

  async function abrirRevisao (essa) {
    essa.botao.disabled = true
    let lido
    try {
      lido = await pedir('listar')
    } catch (erro) {
      lido = { ok: false, erro: erro.message }
    } finally {
      essa.botao.disabled = false
    }
    if (!lido || !lido.ok) { essa.mostrar('erro', 'Não consegui ler o texto. ' + ((lido && lido.erro) || '')); return }
    const daLista = lido.itens.map(item => ({ id: item.id, texto: item.tipo === 'riscado' ? `Riscado: "${item.texto}"` : item.texto, detalhe: item.detalhe, desligado: item.desligado }))
    const baloes = lido.balao ? ' Os comentários saem do SEI só quando você clicar em Salvar.' : ''
    painel = painelRevisao.abrirPainel({
      titulo: 'Remover Formatação da AGU',
      explicacao: 'Tudo o que está marcado sai do texto. Clique numa linha para ver o trecho no documento; desmarque o que deve ficar.' + baloes,
      itens: [...linhasDosGrupos(lido), ...daLista],
      rotuloDoBotao: 'Remover os marcados',
      aoIr: id => pedir('ir', id),
      aoConfirmar: async ids => {
        ocupado = true
        let resposta
        try {
          resposta = await pedir('remover', ids)
        } catch (erro) {
          resposta = { ok: false, erro: erro.message }
        } finally {
          ocupado = false
        }
        if (!resposta || !resposta.ok) { painel.mostrar('erro', 'Não consegui remover. ' + ((resposta && resposta.erro) || '') + ' Nada foi salvo.'); return }
        painel.fechar()
        essa.feito = true
        restante = total(resposta)
        essa.mostrar('ok', 'Pronto: ' + resumoDoFeito(resposta.feito) + '. ' + DESFAZER)
      }
    })
  }

  function resumoDoFeito (f) {
    const partes = []
    if (f.riscados) partes.push(`${f.riscados} ${plural(f.riscados, 'trecho riscado saiu', 'trechos riscados saíram')}` + (f.paragrafos ? ` (${f.paragrafos} ${plural(f.paragrafos, 'parágrafo ficou vazio e saiu', 'parágrafos ficaram vazios e saíram')})` : ''))
    if (f.justificativas) partes.push(`${f.justificativas} "Justificativa…" ${plural(f.justificativas, 'saiu', 'saíram')}`)
    if (f.cores) partes.push(`${f.cores} ${plural(f.cores, 'trecho ficou preto', 'trechos ficaram pretos')}`)
    if (f.brancos) partes.push(`${f.brancos} ${plural(f.brancos, 'trecho em branco saiu', 'trechos em branco saíram')}`)
    if (f.marcas) partes.push(`${f.marcas} ${plural(f.marcas, 'trecho perdeu', 'trechos perderam')} a cor de fundo`)
    if (f.word) partes.push(`${f.word} ${plural(f.word, 'marca do Word saiu', 'marcas do Word saíram')}`)
    if (f.baloes) partes.push(`${f.baloes} ${plural(f.baloes, 'comentário sai', 'comentários saem')} quando você salvar`)
    return partes.length ? emLista(partes) : 'nada mudou'
  }

  window.addEventListener('message', evento => {
    if (evento.source !== window || !evento.data || !evento.data.extensaoIftoAgu) return
    mostrar(evento.data)
  })
  const preparar = () => pedir('preparar').catch(erro => console.warn('extensao-ifto: formatação da AGU', erro))
  preparar()
  caixaEditor.quandoRemontar(preparar)
})()
