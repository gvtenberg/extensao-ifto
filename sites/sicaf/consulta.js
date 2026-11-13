// v0.13.0: página "Situação do Fornecedor" do SICAF, durante a busca pedida no SEI (posto pelo fundo a cada
// página que abre). Pesquisa o CNPJ, clica em "Situação do Fornecedor" e, quando o SICAF vai mandar o PDF,
// pega o arquivo (em vez de abri-lo) e entrega à extensão. Exemplos: ferramentas-de-teste/pagina-compras/.
(async function () {
  if (globalThis.extensaoIftoSicafRodando) return
  globalThis.extensaoIftoSicafRodando = true
  const regras = globalThis.ExtensaoIFTO.sicaf
  const navegador = globalThis.browser || globalThis.chrome
  const enviar = recado => navegador.runtime.sendMessage(recado)
  const esperar = ms => new Promise(resolver => setTimeout(resolver, ms))

  const pedido = await enviar({ tipo: 'sicafQualCnpj' })
  if (!pedido || pedido.fim || !pedido.cnpj) return
  const { cnpj } = pedido
  mostrarAviso(`Extensão IFTO: buscando o SICAF do CNPJ ${regras.formatarCnpj(cnpj)} (${pedido.posicao + 1} de ${pedido.total}). Não feche esta aba.`)

  if (regras.paginaDoCompras(location.href) !== 'consulta') {
    location.href = regras.URL_CONSULTA_SICAF
    return
  }

  // A pesquisa costuma recarregar a página: o script desta página para e o da próxima continua.
  let saindo = false
  window.addEventListener('beforeunload', () => { saindo = true })

  try {
    let linha = linhaDoCnpj()
    if (!linha && !pedido.pesquisado) {
      await pesquisar()
      // Se a pesquisa não recarregar a página, o resultado aparece aqui mesmo.
      for (let vez = 0; vez < 60 && !linha && !saindo; vez++) { await esperar(500); linha = linhaDoCnpj() }
      if (saindo) return
    }
    if (!linha) throw new Error(textoDosErros() || 'O SICAF não encontrou este CNPJ.')
    const bytes = await pegarPdf(linha)
    await enviar({ tipo: 'sicafPdf', cnpj, nome: linha.nome, arquivo: regras.paraBase64(bytes) })
  } catch (erro) {
    await enviar({ tipo: 'sicafPdf', cnpj, erro: erro.message })
  } finally {
    globalThis.extensaoIftoSicafRodando = false
  }
  // Mais um CNPJ: volta à pesquisa.
  const proximo = await enviar({ tipo: 'sicafQualCnpj' })
  if (proximo && !proximo.fim) location.href = regras.URL_CONSULTA_SICAF

  // ---------- Partes ----------
  // Linha do resultado com o CNPJ pedido: "14.159.957/0006-02 - NOME" e o link "Situação do Fornecedor".
  function linhaDoCnpj () {
    for (const tr of document.querySelectorAll('[id$="fornecedores_data"] tr')) {
      const lida = regras.lerLinhaDoResultado(tr.textContent)
      const link = tr.querySelector('a[id$=":detalharLink"]')
      if (lida && lida.cnpj === cnpj && link) return { ...lida, link }
    }
    return null
  }

  function textoDosErros () {
    return [...document.querySelectorAll('.ui-messages-error, .ui-message-error')].map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ')
  }

  // Pessoa Jurídica, CNPJ no campo e Pesquisar (como a pessoa faria).
  async function pesquisar () {
    const juridica = document.getElementById('form:pesq:tipoPessoaPesquisa:0')
    if (juridica && !juridica.checked) { juridica.click(); await esperar(2000) }
    const campo = document.getElementById('form:pesq:cnpjPesquisa')
    const botao = document.getElementById('form:pesq:botoesPesqPessoaId:btnPesquisar')
    if (!campo || !botao) throw new Error('Não achei o campo CNPJ na página do SICAF.')
    campo.focus()
    campo.value = regras.formatarCnpj(cnpj)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
    campo.dispatchEvent(new Event('change', { bubbles: true }))
    await enviar({ tipo: 'sicafPesquisei', cnpj })
    botao.click()
  }

  // Clica em "Situação do Fornecedor"; o SICAF prepara o relatório e aperta um botão escondido
  // ("abrirRelatorio") que envia o formulário. A extensão segura esse envio e faz o mesmo pedido, para
  // receber o PDF aqui.
  function pegarPdf (linha) {
    return new Promise((resolver, recusar) => {
      const tempo = setTimeout(() => {
        document.removeEventListener('submit', aoEnviar, true)
        recusar(new Error(textoDosErros() || 'O SICAF demorou para gerar o PDF. Tente de novo.'))
      }, 90000)
      async function aoEnviar (evento) {
        const botao = evento.submitter
        if (!botao || !/abrirRelatorio$/.test(botao.id || '')) return
        evento.preventDefault()
        evento.stopImmediatePropagation()
        document.removeEventListener('submit', aoEnviar, true)
        clearTimeout(tempo)
        try {
          const formulario = evento.target
          const corpo = new URLSearchParams(new FormData(formulario, botao)).toString()
          const resposta = await pedirComoAPagina(formulario.action, corpo)
          const bytes = new Uint8Array(await resposta.arrayBuffer())
          const ehPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 // "%PDF"
          if (!resposta.ok || !ehPdf) throw new Error('O SICAF não devolveu o PDF.')
          resolver(bytes)
        } catch (erro) {
          recusar(erro)
        }
      }
      document.addEventListener('submit', aoEnviar, true)
      linha.link.click()
    })
  }

  // Firefox: content.fetch faz o pedido como a própria página (mesmos cookies e origem); Chrome: fetch.
  function pedirComoAPagina (endereco, corpo) {
    const opcoes = { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corpo }
    if (globalThis.content && typeof globalThis.content.fetch === 'function' && typeof globalThis.cloneInto === 'function') {
      return globalThis.content.fetch(endereco, globalThis.cloneInto(opcoes, window))
    }
    return fetch(endereco, opcoes)
  }

  function mostrarAviso (mensagem) {
    const hospedeiro = document.createElement('div')
    hospedeiro.dataset.extensaoIfto = 'aviso-sicaf'
    const raiz = hospedeiro.attachShadow({ mode: 'open' })
    const caixa = document.createElement('div')
    caixa.textContent = mensagem
    caixa.setAttribute('style', 'position:fixed;z-index:2147483000;top:12px;left:50%;transform:translateX(-50%);width:min(560px,calc(100vw - 32px));padding:12px 14px;border-radius:10px;background:#fff;color:#1B2420;border:2px solid #1E5E33;box-shadow:0 6px 20px rgba(0,0,0,.2);font:14px/1.5 system-ui,sans-serif;')
    raiz.append(caixa)
    document.documentElement.append(hospedeiro)
  }
})()
