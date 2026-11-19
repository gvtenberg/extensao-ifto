// v0.26.2 (spec conferir-documento): na janela do editor do SEI confere o documento. Número do processo (toda
// unidade): a linha "Processo nº:" do alto contra o processo em que ele está ("Referência: Processo nº …"),
// com o botão "Corrigir o número do processo" (no título do Edital, número em link do SEI, só avisa: D17).
// v0.26.5: timbre e rodapé (unidades do Campus Palmas), com "Corrigir timbre", "Corrigir rodapé" e "Usar este
// timbre como padrão da unidade". Nunca salva: a pessoa confere e clica em Salvar.
(async function () {
  if (window.top !== window) return
  const { configuracoes, caixaEditor, conferirDocumento: regras, janelaAssinar } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.conferirProcesso && !opcoes.conferirTimbre && !opcoes.conferirRodape) return
  const sigla = regras.siglaDaUnidade(await caixaEditor.unidadeAberta())
  const verificar = () => caixaEditor.pedirAoFundo('conferirVerificar', { sigla })
  const corrigir = qual => caixaEditor.pedirAoFundo('conferirCorrigir', { sigla, qual })
  const DESFAZER = ' Confira e clique em Salvar no editor. Para desfazer, use Ctrl+Z ou feche o editor sem salvar.'

  // v0.26.3 (D2): "Assinar" do editor (botão e Ctrl+Shift+A). A conferência é pedida à parte de fundo (lê o
  // texto atual do editor); demorou ou falhou: o SEI assina normalmente (nunca trava a assinatura).
  const botaoAssinar = () => document.querySelector('button[data-cke-tooltip-text^="Assinar"]')
  let liberado = false
  let conferindo = false
  async function antesDeAssinar (evento) {
    if (liberado || !opcoes.conferirProcesso) return
    const botao = botaoAssinar()
    if (!botao) return
    evento.preventDefault()
    evento.stopImmediatePropagation()
    if (conferindo) return
    conferindo = true
    const limite = new Promise(resolve => setTimeout(() => resolve(null), 10000))
    const agora = await Promise.race([verificar(), limite])
    conferindo = false
    const errado = agora && agora.ok && agora.processo && !agora.processo.certo ? agora.processo : null
    if (errado) {
      const resposta = await janelaAssinar.perguntar(regras.perguntaAntesDeAssinar(errado), [], 'Não, corrigir antes')
      if (resposta !== 'assinar') return
    }
    liberado = true
    try { botao.click() } finally { liberado = false }
  }
  document.addEventListener('click', evento => {
    if (evento.target && evento.target.closest && evento.target.closest('button[data-cke-tooltip-text^="Assinar"]')) antesDeAssinar(evento)
  }, true)
  window.addEventListener('keydown', evento => {
    if (evento.ctrlKey && evento.shiftKey && !evento.altKey && (evento.key === 'A' || evento.key === 'a')) antesDeAssinar(evento)
  }, true)

  const verificado = await verificar()
  if (!verificado || !verificado.ok) return
  const { processo, timbre, rodape } = verificado

  // Número do processo: caixa no alto.
  if (processo && !processo.certo) {
    const caixa = caixaEditor.criarCaixa('conferir-processo', regras.avisoDoProcesso(processo), 'Corrigir o número do processo')
    if (processo.link || !processo.editavel) {
      caixa.botao.remove()
      caixa.corpo.append(caixaEditor.criar('p', {
        className: 'aviso',
        textContent: processo.link
          ? 'O número está num link do SEI: apague-o e coloque o link do processo certo; depois clique em Salvar.'
          : 'Essa parte do documento não dá para mudar no editor.'
      }))
    } else {
      caixa.botao.addEventListener('click', async () => {
        caixa.botao.disabled = true
        caixa.botao.textContent = 'Corrigindo…'
        const resultado = await corrigir('processo')
        if (!resultado || !resultado.ok) return caixa.mostrar('erro', 'Não consegui corrigir. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
        caixa.mostrar('ok', `Número trocado para ${processo.processo}.` + DESFAZER)
      })
    }
  }

  // v0.26.5: timbre e rodapé: uma caixa no canto de baixo, à esquerda (as outras caixas ficam à direita).
  const timbreErrado = timbre && !timbre.certo
  const rodapeErrado = rodape && !rodape.certo
  if (!timbreErrado && !rodapeErrado) return
  const partes = [timbreErrado && 'o timbre', rodapeErrado && 'o rodapé'].filter(Boolean).join(' e ')
  const caixa = caixaEditor.criarCaixa('conferir-timbre', `Confira ${partes} desta unidade (${sigla}):`, 'Corrigir')
  caixa.botao.remove()
  const lista = caixaEditor.criar('ul')
  for (const aviso of [...(timbreErrado ? regras.avisosDoTimbre(timbre) : []), ...(rodapeErrado ? rodape.avisos : [])]) lista.append(caixaEditor.criar('li', { textContent: aviso }))
  caixa.corpo.append(lista)
  const resultadoTexto = caixaEditor.criar('p')
  function botao (rotulo, acao) {
    const novo = caixaEditor.criar('button', { type: 'button', className: 'principal', textContent: rotulo })
    novo.style.marginBottom = '6px'
    novo.addEventListener('click', () => acao(novo))
    caixa.corpo.append(novo)
    return novo
  }
  const corrigirParte = (qual, rotulo, pronto) => async elemento => {
    elemento.disabled = true
    elemento.textContent = 'Corrigindo…'
    const resultado = await corrigir(qual)
    if (!resultado || !resultado.ok) {
      elemento.textContent = rotulo
      elemento.disabled = false
      resultadoTexto.className = 'erro'
      resultadoTexto.textContent = 'Não consegui corrigir. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.'
      return
    }
    elemento.remove()
    resultadoTexto.className = 'ok'
    resultadoTexto.textContent = pronto + DESFAZER
  }
  if (timbreErrado) botao('Corrigir timbre', corrigirParte('timbre', 'Corrigir timbre', 'Timbre corrigido.'))
  if (rodapeErrado) botao('Corrigir rodapé', corrigirParte('rodape', 'Corrigir rodapé', 'Rodapé corrigido.'))
  // D3: as linhas do setor deste documento passam a ser as da unidade em "Minhas unidades" (com confirmação).
  if (timbreErrado) {
    botao('Usar este timbre como padrão da unidade', async elemento => {
      const lido = await caixaEditor.pedirAoFundo('conferirLinhasDoSetor')
      const linhas = (lido && lido.ok && lido.linhas) || []
      if (!linhas.length) {
        resultadoTexto.className = 'erro'
        resultadoTexto.textContent = 'Este timbre não tem linhas do setor abaixo de "Campus Palmas".'
        return
      }
      if (!window.confirm(`Guardar estas linhas como o timbre da unidade ${sigla}?\n\n${linhas.join('\n')}`)) return
      const atuais = await configuracoes.lerConfiguracoes()
      const unidade = regras.acharUnidade(atuais.unidades, sigla) || { sigla }
      atuais.unidades = regras.limparUnidades([...atuais.unidades, { ...unidade, linhas }])
      await configuracoes.gravarConfiguracoes(atuais)
      elemento.remove()
      resultadoTexto.className = 'ok'
      resultadoTexto.textContent = 'Guardado em "Minhas unidades". Feche e abra o editor para conferir de novo.'
    })
  }
  caixa.corpo.append(resultadoTexto)
})()
