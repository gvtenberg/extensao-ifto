// v0.35.0 (spec lista-para-direcao, etapa 4): tela "Atribuir Processo" do SEI, lida e enviada sem abrir a tela.
// Só muda a atribuição do processo e confere, lendo de novo, quem ficou com ele.
(function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { listaDirecao: regras, seiPedidos, documentosPagamento } = ExtensaoIFTO

  async function lerTela (lida) {
    if (!lida || !lida.linkAtribuir) throw new Error('O SEI não mostra "Atribuir Processo": o processo não está aberto na sua unidade.')
    const pagina = await seiPedidos.pedir(lida.linkAtribuir)
    const formulario = seiPedidos.lerHtml(pagina.html).getElementById('frmAtividadeAtribuir')
    const lista = formulario && formulario.querySelector('#selAtribuicao')
    const campo = formulario && formulario.querySelector('#hdnIdProtocolo')
    if (!lista || !campo) throw new Error(documentosPagamento.mensagemDoSei(pagina.html) || 'O SEI não abriu a tela "Atribuir Processo". Confira se a sessão do SEI ainda está aberta.')
    if (campo.getAttribute('value') !== String(lida.idProcesso)) throw new Error('O SEI abriu a tela de outro processo. Nada foi mudado.')
    const pessoas = regras.lerPessoas([...lista.options].map(opcao => ({ valor: opcao.getAttribute('value'), texto: opcao.textContent, marcada: opcao.hasAttribute('selected') })))
    return { pagina, formulario, pessoas, atual: pessoas.find(pessoa => pessoa.atual) || null }
  }

  // id: número interno da pessoa na lista do SEI; null tira a atribuição. Só volta sem erro com o SEI conferido.
  async function enviar (lida, tela, id) {
    await seiPedidos.enviar(tela.formulario, tela.pagina.endereco, { selAtribuicao: id || 'null', sbmSalvar: 'Salvar' })
    const depois = await lerTela(lida)
    if ((depois.atual ? depois.atual.id : null) !== (id || null)) throw new Error('O SEI não confirmou a atribuição. Confira no processo.')
  }

  ExtensaoIFTO.listaDirecaoAtribuir = { lerTela, enviar }
})()
