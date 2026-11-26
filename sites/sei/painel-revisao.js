// v0.37.0 (spec numeracao-caixas-ocultas, D5): painel de revisão à esquerda da janela do editor, usado antes de
// mudar várias partes do texto de uma vez (números digitados; depois, "Remover Formatação da AGU"). Lista cada
// mudança já marcada; o clique numa linha leva o editor até ela; quem desmarca mantém aquela parte. Abre só pelo
// clique da pessoa (janela da extensão nunca abre sozinha, 26/11/2026). Sem fundo escuro: a página continua rolando.
(function (raiz) {
  const ESTILO = `
    :host { all: initial; }
    .painel { position: fixed; z-index: 100001; top: 100px; left: 16px; bottom: 16px; width: min(400px, calc(100vw - 32px));
      display: flex; flex-direction: column; font: 13px/1.4 system-ui, sans-serif; color: #1B2420; background: #fff;
      border: 1px solid #C9D1CC; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.18); overflow: hidden; }
    .topo { display: flex; align-items: center; background: #F1F4F2; border-bottom: 1px solid #C9D1CC; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-bottom-right-radius: 4px; align-self: flex-start; }
    .titulo { flex: 1; padding: 4px 8px; font-weight: 600; }
    .fechar { border: 0; background: none; font-size: 16px; line-height: 1; padding: 2px 8px; cursor: pointer; color: #555; }
    .explicacao { padding: 8px 10px 4px; margin: 0; }
    .todos { display: flex; gap: 12px; padding: 0 10px 6px; }
    .todos button { border: 0; background: none; padding: 0; color: #1E5E33; text-decoration: underline; cursor: pointer; font: inherit; }
    .lista { flex: 1; overflow-y: auto; border-top: 1px solid #E3E8E5; margin: 0; padding: 0; list-style: none; }
    .lista li { display: flex; gap: 6px; align-items: flex-start; padding: 6px 10px; border-bottom: 1px solid #E3E8E5; }
    .lista li.desligado { color: #777; }
    .lista input { margin-top: 3px; }
    .ir { flex: 1; border: 0; background: none; padding: 0; text-align: left; font: inherit; color: inherit; cursor: pointer; }
    .ir:hover .texto { text-decoration: underline; }
    .detalhe { display: block; font-size: 12px; color: #555; }
    .destaque { color: #8A5A00; font-weight: 600; }
    .rodape { padding: 8px 10px 10px; border-top: 1px solid #C9D1CC; }
    .rodape p { margin: 0 0 6px; }
    .principal { width: 100%; padding: 6px 10px; border: 0; border-radius: 4px; background: #1E5E33; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    .principal:disabled { opacity: .6; cursor: default; }
    .erro { color: #B3261E; }
    .ok { color: #1E5E33; font-weight: 600; }
    @media print { :host { display: none !important; } }
  `
  const criar = (etiqueta, propriedades = {}) => Object.assign(document.createElement(etiqueta), propriedades)
  let aberto = null

  // itens: [{ id, texto, detalhe, destaque, desligado }]. aoIr(id) e aoConfirmar(ids) devolvem promessas.
  // Devolve { fechar, mostrar(classe, frase) }.
  function abrirPainel ({ titulo, explicacao, itens, rotuloDoBotao, aoIr, aoConfirmar }) {
    if (aberto) aberto.fechar()
    const hospedeiro = criar('div')
    hospedeiro.dataset.extensaoIfto = 'painel-revisao'
    const sombra = hospedeiro.attachShadow({ mode: 'open' })
    const painel = criar('div', { className: 'painel' })
    painel.setAttribute('role', 'dialog')
    painel.setAttribute('aria-label', titulo)
    const fechar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar sem mudar nada', textContent: '×' })
    const topo = criar('div', { className: 'topo' })
    topo.append(criar('span', { className: 'marca', textContent: 'IFTO' }), criar('span', { className: 'titulo', textContent: titulo }), fechar)
    const marcarTodos = criar('button', { type: 'button', textContent: 'Marcar todos' })
    const desmarcarTodos = criar('button', { type: 'button', textContent: 'Desmarcar todos' })
    const todos = criar('div', { className: 'todos' })
    todos.append(marcarTodos, desmarcarTodos)
    const lista = criar('ul', { className: 'lista' })
    const caixas = []
    for (const item of itens) {
      const linha = criar('li', { className: item.desligado ? 'desligado' : '' })
      const marcar = criar('input', { type: 'checkbox', checked: !item.desligado, disabled: Boolean(item.desligado) })
      marcar.dataset.id = item.id
      marcar.setAttribute('aria-label', item.texto)
      const ir = criar('button', { type: 'button', className: 'ir', title: 'Mostrar no texto' })
      ir.append(criar('span', { className: 'texto', textContent: item.texto }))
      if (item.detalhe) ir.append(criar('span', { className: 'detalhe' + (item.destaque ? ' destaque' : ''), textContent: item.detalhe }))
      ir.addEventListener('click', () => { Promise.resolve(aoIr && aoIr(item.id)).catch(() => {}) })
      linha.append(marcar, ir)
      lista.append(linha)
      if (!item.desligado) caixas.push(marcar)
    }
    const mensagem = criar('p', { hidden: true })
    const botao = criar('button', { type: 'button', className: 'principal', textContent: rotuloDoBotao })
    const rodape = criar('div', { className: 'rodape' })
    rodape.append(mensagem, botao)
    painel.append(topo, criar('p', { className: 'explicacao', textContent: explicacao }), todos, lista, rodape)
    sombra.append(criar('style', { textContent: ESTILO }), painel)
    document.body.append(hospedeiro)

    const atualizar = () => {
      const marcados = caixas.filter(caixa => caixa.checked).length
      botao.disabled = !marcados
      botao.textContent = `${rotuloDoBotao} (${marcados})`
    }
    lista.addEventListener('change', atualizar)
    marcarTodos.addEventListener('click', () => { for (const caixa of caixas) caixa.checked = true; atualizar() })
    desmarcarTodos.addEventListener('click', () => { for (const caixa of caixas) caixa.checked = false; atualizar() })
    atualizar()

    const mostrar = (classe, frase) => {
      mensagem.className = classe
      mensagem.textContent = frase
      mensagem.hidden = false
    }
    const api = { fechar: () => { hospedeiro.remove(); if (aberto === api) aberto = null }, mostrar }
    fechar.addEventListener('click', api.fechar)
    botao.addEventListener('click', async () => {
      botao.disabled = true
      const ids = caixas.filter(caixa => caixa.checked).map(caixa => caixa.dataset.id)
      try {
        await aoConfirmar(ids)
      } catch (erro) {
        mostrar('erro', 'Não consegui mudar o texto: ' + erro.message + ' Nada foi salvo.')
        botao.disabled = false
      }
    })
    aberto = api
    return api
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { painelRevisao: { abrirPainel } })
})(globalThis)
