// v0.17.2: consulta do Simples Nacional durante a busca pedida no SEI (posto pelo fundo a cada página que abre
// na aba da busca). Formulário: digita o CNPJ e clica em "Consultar" (a verificação do site, quando aparece,
// é resolvida pela pessoa). Resultado: abre "Mais informações", lê a página, faz o PDF em texto e entrega à
// extensão; depois volta ao formulário para o próximo CNPJ. Exemplos: ferramentas-de-teste/simples-nacional/.
(async function () {
  if (globalThis.extensaoIftoSimplesRodando) return
  globalThis.extensaoIftoSimplesRodando = true
  const { sicaf, simplesNacional: simples, pdfTexto } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  const enviar = recado => navegador.runtime.sendMessage(recado)
  const esperar = ms => new Promise(resolver => setTimeout(resolver, ms))
  let saindo = false
  window.addEventListener('beforeunload', () => { saindo = true })

  try {
    let pedido = await enviar({ tipo: 'simplesQualCnpj' })
    while (pedido && !pedido.fim && pedido.cnpj && !saindo) {
      const titulo = `Extensão IFTO: consultando o Simples Nacional do CNPJ ${sicaf.formatarCnpj(pedido.cnpj)} (${pedido.posicao + 1} de ${pedido.total}). Não feche esta aba.`
      aviso(titulo)
      const conteudo = document.getElementById('conteudo')
      const campo = document.getElementById('Cnpj')
      if (conteudo && document.getElementById('hdnCnpj')) {
        // Resultado: confere se é do CNPJ pedido (o site mostra a matriz; o escondido guarda o digitado).
        const digitado = sicaf.soDigitos(document.getElementById('hdnCnpj').value)
        if (digitado !== pedido.cnpj) { voltarAoFormulario(); return }
        const resposta = await entregarResultado(pedido)
        if (resposta && resposta.proximo) voltarAoFormulario()
        return
      }
      if (!campo) { voltarAoFormulario(); return }
      if (pedido.pesquisado) {
        // O site voltou ao formulário depois de "Consultar": recusou o CNPJ (com mensagem ou não).
        const resposta = await enviar({ tipo: 'simplesResultado', fornecedor: pedido.fornecedor, cnpj: pedido.cnpj, recusado: true, erro: textoDoErro() || 'O Simples Nacional não aceitou este CNPJ.' })
        if (resposta && resposta.repetir) { pedido = await enviar({ tipo: 'simplesQualCnpj' }); continue }
        if (resposta && resposta.proximo) { voltarAoFormulario(); return }
        return
      }
      await consultar(pedido, titulo)
      return
    }
  } catch (erro) {
    aviso('Extensão IFTO: ' + erro.message)
  } finally {
    globalThis.extensaoIftoSimplesRodando = false
  }

  // ---------- Partes ----------
  function voltarAoFormulario () {
    location.href = simples.URL_CONSULTA_SIMPLES
  }

  // CNPJ no campo (só números) e "Consultar", como a pessoa faria. A verificação do site pode pedir
  // uma imagem: a extensão só avisa e espera a página do resultado abrir.
  async function consultar (pedido, titulo) {
    const campo = document.getElementById('Cnpj')
    const botao = document.querySelector('#consultarForm button.h-captcha, #consultarForm button[type="submit"], #consultarForm button')
    if (!botao) throw new Error('Não achei o botão "Consultar" na página do Simples Nacional.')
    campo.focus()
    campo.value = pedido.cnpj
    campo.dispatchEvent(new Event('input', { bubbles: true }))
    campo.dispatchEvent(new Event('change', { bubbles: true }))
    await enviar({ tipo: 'simplesPesquisei', cnpj: pedido.cnpj })
    botao.click()
    // Enquanto a página não muda: aviso da verificação; sem verificação e sem resposta, pede o clique.
    for (let segundos = 0; !saindo; segundos++) {
      await esperar(1000)
      if (saindo) return
      if (verificacaoAberta()) aviso(titulo + ' Resolva a verificação para continuar.', true)
      else if (segundos >= 10) aviso(titulo + ' Se nada acontecer, clique em "Consultar".', true)
    }
  }

  // A janela de imagens do hCaptcha fica visível quando o site pede para resolver.
  function verificacaoAberta () {
    for (const quadro of document.querySelectorAll('iframe[title*="challenge" i], iframe[src*="hcaptcha"][src*="challenge"]')) {
      let elemento = quadro
      let visivel = true
      while (elemento && elemento !== document.body) {
        const estilo = getComputedStyle(elemento)
        if (estilo.visibility === 'hidden' || estilo.display === 'none' || Number(estilo.opacity) === 0) { visivel = false; break }
        elemento = elemento.parentElement
      }
      if (visivel && quadro.getBoundingClientRect().width > 50) return true
    }
    return false
  }

  function textoDoErro () {
    const textos = [...document.querySelectorAll('.text-danger, .validation-summary-errors, .alert-danger, .alert, [style*="color:red"], [style*="color: red"]')]
      .map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean)
    return [...new Set(textos)].join(' ')
  }

  // "Mais informações" (o site busca os dados à parte), leitura, PDF e entrega.
  async function entregarResultado (pedido) {
    const resposta = { tipo: 'simplesResultado', fornecedor: pedido.fornecedor, cnpj: pedido.cnpj }
    try {
      await abrirMaisInformacoes()
      const resultado = simples.lerResultado(document.getElementById('conteudo').outerHTML)
      if (!resultado.valido) throw new Error('Não consegui ler o resultado do Simples Nacional.')
      if (resultado.cnpj.slice(0, 8) !== pedido.cnpj.slice(0, 8)) throw new Error('O Simples Nacional mostrou outra empresa.')
      const bytes = pdfTexto.gerarPdf(simples.paragrafosDoPdf(resultado), { titulo: 'Consulta Optantes – ' + resultado.nomeEmpresarial })
      return await enviar({ ...resposta, nome: resultado.nomeEmpresarial, situacao: resultado.situacaoSimples, arquivo: sicaf.paraBase64(bytes) })
    } catch (erro) {
      return await enviar({ ...resposta, erro: erro.message })
    }
  }

  async function abrirMaisInformacoes () {
    const carregado = () => simples.maisInformacoesCarregadas(document.getElementById('conteudo').outerHTML)
    const botao = document.getElementById('btnMaisInfo')
    if (!botao || carregado()) return
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      botao.click()
      for (let vez = 0; vez < 60; vez++) {
        await esperar(500)
        if (carregado()) return
        const erro = document.getElementById('spnMsgErro')
        if (erro && erro.offsetParent !== null && erro.textContent.trim()) break
      }
      await esperar(2000)
    }
    throw new Error('O Simples Nacional não abriu "Mais informações". Tente de novo mais tarde.')
  }

  function aviso (mensagem, destaque) {
    let hospedeiro = document.querySelector('[data-extensao-ifto="aviso-simples"]')
    if (!hospedeiro) {
      hospedeiro = document.createElement('div')
      hospedeiro.dataset.extensaoIfto = 'aviso-simples'
      hospedeiro.attachShadow({ mode: 'open' }).append(document.createElement('div'))
      document.documentElement.append(hospedeiro)
    }
    const caixa = hospedeiro.shadowRoot.firstChild
    caixa.textContent = mensagem
    caixa.setAttribute('style', `position:fixed;z-index:2147483000;bottom:12px;left:50%;transform:translateX(-50%);width:min(560px,calc(100vw - 32px));padding:12px 14px;border-radius:10px;background:${destaque ? '#FFF6D6' : '#fff'};color:#1B2420;border:2px solid ${destaque ? '#B7791F' : '#1E5E33'};box-shadow:0 6px 20px rgba(0,0,0,.2);font:14px/1.5 system-ui,sans-serif;`)
  }
})()
