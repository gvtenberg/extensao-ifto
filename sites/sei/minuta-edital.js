// v0.22.0 (spec minuta-edital): na janela do editor do SEI, em documento do tipo Edital que ainda tem a marca
// d'água MINUTA (veio da minuta usada como modelo), um aviso com o botão "Remover marca MINUTA". A extensão
// tira a marca do texto do editor; a pessoa confere e clica em Salvar (a extensão nunca salva aqui).
// Opção "automatica": só na Direção-geral.
(async function () {
  if (window.top !== window) return
  const { minutaEdital: regras, configuracoes, sei } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  if (!regras.ehEdital(document.title)) return

  const opcoes = await configuracoes.lerConfiguracoes()
  if (!regras.funcaoLigada(opcoes.minutaEdital, await unidadeAberta())) return

  // O editor não mostra a unidade: vem do número no endereço (gravado pelas páginas do SEI) ou da janela
  // do SEI que abriu o editor.
  async function unidadeAberta () {
    const numero = sei.numeroDaUnidade(location.href)
    const { unidadesSei = {} } = await navegador.storage.local.get('unidadesSei')
    if (numero && unidadesSei[numero]) return unidadesSei[numero]
    try {
      const campo = window.opener && window.opener.top.document.getElementById('lnkInfraUnidade')
      if (campo) return campo.textContent.trim()
    } catch (erro) {}
    return ''
  }

  // Recado para a parte de fundo, com limite de tempo (o editor pode demorar ou travar).
  function pedir (tipo) {
    const limite = new Promise(resolve => setTimeout(() => resolve({ ok: false, erro: 'O editor do SEI demorou demais para responder. Feche e abra o editor de novo.' }), 45000))
    return Promise.race([navegador.runtime.sendMessage({ tipo }).catch(erro => ({ ok: false, erro: erro.message })), limite])
  }

  const verificado = await pedir('minutaVerificar')
  if (!verificado || !verificado.ok || !verificado.marcas) return

  const hospedeiro = document.createElement('div')
  hospedeiro.dataset.extensaoIfto = 'minuta-edital'
  const raiz = hospedeiro.attachShadow({ mode: 'open' })
  const estilo = document.createElement('style')
  estilo.textContent = `
    :host { all: initial; }
    .caixa { position: fixed; z-index: 100000; right: 16px; bottom: 16px; width: min(320px, calc(100vw - 32px));
      font: 13px/1.4 system-ui, sans-serif; color: #1B2420; background: #fff; border: 1px solid #C9D1CC;
      border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.18); overflow: hidden; }
    .topo { display: flex; align-items: center; justify-content: space-between; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-bottom-right-radius: 4px; }
    .fechar { border: 0; background: none; font-size: 16px; line-height: 1; padding: 2px 8px; cursor: pointer; color: #555; }
    .corpo { padding: 6px 10px 10px; }
    p { margin: 0 0 8px; }
    .aviso { color: #8A5A00; }
    .erro { color: #B3261E; }
    .ok { color: #1E5E33; font-weight: 600; }
    ul { margin: 0 0 8px; padding-left: 18px; }
    .principal { width: 100%; padding: 6px 10px; border: 0; border-radius: 4px; background: #1E5E33; color: #fff;
      font: inherit; font-weight: 600; cursor: pointer; }
    .principal:disabled { opacity: .6; cursor: default; }
  `
  const caixa = document.createElement('div')
  caixa.className = 'caixa'
  const criar = (etiqueta, propriedades = {}) => Object.assign(document.createElement(etiqueta), propriedades)
  const fechar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar este aviso', textContent: '×' })
  const topo = criar('div', { className: 'topo' })
  topo.append(criar('span', { className: 'marca', textContent: 'IFTO' }), fechar)
  const corpo = criar('div', { className: 'corpo' })
  const botao = criar('button', { type: 'button', className: 'principal', textContent: 'Remover marca MINUTA' })
  corpo.append(criar('p', { textContent: 'Este edital ainda tem a marca d\'água "MINUTA", que veio da minuta. Ela aparece no fundo da página e no PDF.' }), botao)
  caixa.append(topo, corpo)
  raiz.append(estilo, caixa)
  document.body.append(hospedeiro)
  fechar.addEventListener('click', () => hospedeiro.remove())

  function mostrar (classe, texto, trechos = []) {
    const paragrafo = document.createElement('p')
    paragrafo.className = classe
    paragrafo.textContent = texto
    const itens = trechos.map(trecho => Object.assign(document.createElement('li'), { textContent: trecho }))
    const partes = [paragrafo]
    if (itens.length) {
      const aviso = Object.assign(document.createElement('p'), { className: 'aviso', textContent: 'O texto ainda tem a palavra "minuta" aqui (corrija à mão, se for o caso):' })
      const lista = document.createElement('ul')
      lista.append(...itens)
      partes.push(aviso, lista)
    }
    corpo.replaceChildren(...partes)
  }

  botao.addEventListener('click', async () => {
    botao.disabled = true
    botao.textContent = 'Removendo…'
    const resultado = await pedir('minutaRemover')
    if (!resultado || !resultado.ok) {
      mostrar('erro', 'Não consegui remover a marca. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
      return
    }
    if (resultado.restou) {
      mostrar('erro', 'Tirei parte da marca, mas ela ainda está no texto. Não salve: feche o editor sem salvar e avise o responsável na CGOC.')
      return
    }
    mostrar('ok', 'Marca MINUTA removida do texto. Confira o documento e clique em Salvar no editor. Se algo saiu errado, feche o editor sem salvar.', resultado.trechos || [])
  })
})()
