// Página de configurações: cada escolha grava na hora no navegador (sem botão Gravar) e fica guardada.
(async function () {
  const { lerConfiguracoes, gravarConfiguracoes } = globalThis.ExtensaoIFTO.configuracoes
  const configuracoes = await lerConfiguracoes()
  const aviso = document.getElementById('gravado')
  // v0.26.0: o aviso "Configuração gravada" aparece no canto e some sozinho.
  let some
  const mostrarAviso = () => {
    aviso.hidden = false
    clearTimeout(some)
    some = setTimeout(() => { aviso.hidden = true }, 2500)
  }

  // v0.26.0 (spec conferir-documento, D8): menu ao lado, um grupo por vez; o endereço (#sicaf, #compras…)
  // abre o grupo certo, também quando o SEI manda para cá.
  const grupos = [...document.querySelectorAll('.grupo[id]')].filter(g => g.parentElement.tagName === 'MAIN')
  function abrirGrupo () {
    const pedido = location.hash.slice(1)
    const grupo = grupos.find(g => g.id === pedido) || grupos[0]
    for (const g of grupos) g.classList.toggle('ativo', g === grupo)
    for (const link of document.querySelectorAll('nav a')) {
      if (link.getAttribute('href') === '#' + grupo.id) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    }
    window.scrollTo(0, 0)
  }
  window.addEventListener('hashchange', abrirGrupo)
  abrirGrupo()

  // v0.26.0: "Minhas unidades": grava a cada mudança (ao sair do campo), sem botão Gravar.
  const { limparUnidades } = globalThis.ExtensaoIFTO.conferirDocumento
  const listaUnidades = document.getElementById('listaUnidades')
  const modeloUnidade = document.getElementById('modeloUnidade')
  async function gravarUnidades () {
    const unidades = [...listaUnidades.children].map(bloco => {
      const unidade = {}
      for (const campo of bloco.querySelectorAll('[data-campo]')) unidade[campo.dataset.campo] = campo.value
      return unidade
    })
    configuracoes.unidades = limparUnidades(unidades)
    await gravarConfiguracoes(configuracoes)
    mostrarAviso()
  }
  function mostrarUnidade (unidade) {
    const bloco = modeloUnidade.content.firstElementChild.cloneNode(true)
    for (const campo of bloco.querySelectorAll('[data-campo]')) {
      const valor = unidade[campo.dataset.campo]
      campo.value = Array.isArray(valor) ? valor.join('\n') : (valor || '')
      campo.addEventListener('change', gravarUnidades)
    }
    bloco.querySelector('[data-acao="remover"]').addEventListener('click', () => {
      const sigla = bloco.querySelector('[data-campo="sigla"]').value.trim()
      if (sigla && !confirm('Remover a unidade ' + sigla + '?')) return
      bloco.remove()
      gravarUnidades()
    })
    listaUnidades.append(bloco)
    return bloco
  }
  for (const unidade of configuracoes.unidades) mostrarUnidade(unidade)
  document.getElementById('novaUnidade').addEventListener('click', () => {
    mostrarUnidade({}).querySelector('[data-campo="sigla"]').focus()
  })

  // v0.3.0: escolhas de uma opção só (ex.: lista de assinaturas: automática, sempre, desligada).
  for (const escolha of document.querySelectorAll('input[type="radio"]')) {
    escolha.checked = configuracoes[escolha.name] === escolha.value
    escolha.addEventListener('change', async () => {
      if (!escolha.checked) return
      configuracoes[escolha.name] = escolha.value
      await gravarConfiguracoes(configuracoes)
      mostrarAviso()
    })
  }

  // v0.13.0: permissão do SICAF (Compras.gov.br e Downloads). O pedido tem de sair direto do clique.
  // v0.17.2: mais o site da consulta do Simples Nacional.
  const navegador = globalThis.browser || globalThis.chrome
  const pedidoSicaf = { origins: [...globalThis.ExtensaoIFTO.sicaf.ORIGENS_COMPRAS, ...globalThis.ExtensaoIFTO.simplesNacional.ORIGENS_SIMPLES], permissions: ['downloads'] }
  const botaoSicaf = document.getElementById('permitirSicaf')
  const permitido = document.getElementById('sicafPermitido')
  const mostrarPermissao = sim => { botaoSicaf.hidden = sim; permitido.hidden = !sim }
  navegador.permissions.contains(pedidoSicaf).then(mostrarPermissao)
  botaoSicaf.addEventListener('click', () => {
    navegador.permissions.request(pedidoSicaf).then(mostrarPermissao)
  })
  // v0.19.0: permissão do Compras IFTO (só quem usa o Compras IFTO pede; D2 da spec compras-ifto-no-sei).
  const pedidoCompras = { origins: globalThis.ExtensaoIFTO.comprasIfto.ORIGENS_COMPRAS }
  const botaoCompras = document.getElementById('permitirCompras')
  const comprasPermitido = document.getElementById('comprasPermitido')
  const mostrarCompras = sim => { botaoCompras.hidden = sim; comprasPermitido.hidden = !sim }
  navegador.permissions.contains(pedidoCompras).then(mostrarCompras)
  botaoCompras.addEventListener('click', () => {
    navegador.permissions.request(pedidoCompras).then(mostrarCompras)
  })

  // v0.21.3: entrada com SerproID no Gov.br. Ligar pede o acesso à página de entrada do Gov.br (o pedido sai
  // direto do clique); sem a permissão a opção não liga. Desligar retira o acesso.
  const pedidoGovBr = { origins: globalThis.ExtensaoIFTO.sicaf.ORIGENS_GOVBR }
  const caixaSerpro = document.getElementById('entrarComSerproId')
  caixaSerpro.checked = Boolean(configuracoes.entrarComSerproId) && await navegador.permissions.contains(pedidoGovBr)
  caixaSerpro.addEventListener('change', async () => {
    let ligar = caixaSerpro.checked
    if (ligar) ligar = await navegador.permissions.request(pedidoGovBr).catch(() => false)
    else await navegador.permissions.remove(pedidoGovBr).catch(() => {})
    caixaSerpro.checked = ligar
    configuracoes.entrarComSerproId = ligar
    await gravarConfiguracoes(configuracoes)
    mostrarAviso()
  })

  for (const caixa of document.querySelectorAll('input[type="checkbox"]:not(#entrarComSerproId)')) {
    caixa.checked = Boolean(configuracoes[caixa.id])
    caixa.addEventListener('change', async () => {
      configuracoes[caixa.id] = caixa.checked
      await gravarConfiguracoes(configuracoes)
      mostrarAviso()
    })
  }

  // v0.27.0 (spec base-e-sei, etapa 2): campos de texto e listas (data-config = nome da opção); grava ao sair
  // do campo. "externoRegras" fica guardada como lista ({ contem, tipo }) e aparece uma regra por linha.
  const { lerRegras, regrasEmTexto } = globalThis.ExtensaoIFTO.documentoExterno
  for (const campo of document.querySelectorAll('[data-config]')) {
    const chave = campo.dataset.config
    campo.value = chave === 'externoRegras' ? regrasEmTexto(configuracoes[chave]) : (configuracoes[chave] || '')
    campo.addEventListener('change', async () => {
      configuracoes[chave] = chave === 'externoRegras' ? lerRegras(campo.value) : campo.value.trim()
      await gravarConfiguracoes(configuracoes)
      mostrarAviso()
    })
  }

  // v0.27.2 (spec base-e-sei, etapa 5): baixar e carregar a cópia das configurações. Lê do navegador na hora
  // (pega também o que outra aba gravou). Nada muda antes da confirmação.
  const { paraArquivo, doArquivo, nomeDoArquivo } = globalThis.ExtensaoIFTO.configuracoes
  document.getElementById('baixarCopia').addEventListener('click', async () => {
    const texto = paraArquivo(await lerConfiguracoes(), navegador.runtime.getManifest().version)
    const endereco = URL.createObjectURL(new Blob([texto], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = endereco
    link.download = nomeDoArquivo()
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(endereco), 10000)
  })
  const arquivoCopia = document.getElementById('arquivoCopia')
  const copiaErro = document.getElementById('copiaErro')
  document.getElementById('carregarCopia').addEventListener('click', () => { arquivoCopia.value = ''; arquivoCopia.click() })
  arquivoCopia.addEventListener('change', async () => {
    const arquivo = arquivoCopia.files[0]
    copiaErro.hidden = true
    if (!arquivo) return
    let lido
    try {
      if (arquivo.size > 1024 * 1024) throw new Error('Este arquivo é grande demais para ser uma cópia das configurações.')
      lido = doArquivo(await arquivo.text())
    } catch (erro) {
      copiaErro.textContent = erro.message
      copiaErro.hidden = false
      return
    }
    const quando = lido.data && !isNaN(new Date(lido.data)) ? ' (baixada em ' + new Date(lido.data).toLocaleDateString('pt-BR') + ')' : ''
    const aviso = lido.ignoradas.length ? ' Algumas escolhas do arquivo não servem nesta versão da extensão e voltam ao padrão.' : ''
    if (!confirm('Trocar as suas configurações pelas desta cópia' + quando + '? As escolhas atuais desta página serão substituídas.' + aviso)) return
    // A entrada com SerproID só fica ligada se este navegador já deu o acesso ao Gov.br.
    if (lido.configuracoes.entrarComSerproId && !(await navegador.permissions.contains(pedidoGovBr))) lido.configuracoes.entrarComSerproId = false
    await gravarConfiguracoes(lido.configuracoes)
    location.reload()
  })
})()
