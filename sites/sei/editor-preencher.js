// v0.21.0 (spec compras-ifto-no-sei, etapa 3): função levada pela parte de fundo para a janela do editor do
// SEI (scripting.executeScript, world MAIN, porque o editor só é alcançável pelo JavaScript da própria
// página). Funciona com os dois editores que o SEI pode usar: CKEditor 4 (SEI 4) e o CKEditor 5 de várias
// seções do SEI 5 (window.infraEditor.editor). Põe o texto na seção do corpo e clica em Salvar. NUNCA assina.
// Precisa ser uma função inteira, sem usar nada de fora (o navegador a copia para a página).
// Devolve { ok, editor, secoes, corpo, erro, salvou } (salvou: 'sim' | 'incerto').
async function extensaoIftoPreencherESalvar (html) {
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const resultado = { ok: false, editor: '', secoes: [], corpo: '', erro: '', salvou: '' }
  const ROTULO_CORPO = /corpo/i

  // 1. Espera o editor ficar pronto (até 30 s).
  let ck5 = null
  let ck4 = null
  const limite = Date.now() + 30000
  while (Date.now() < limite) {
    const infra = window.infraEditor
    if (infra && infra.editor && infra.editor.model && infra.editor.editing) { ck5 = infra.editor; break }
    if (window.CKEDITOR && window.CKEDITOR.instances) {
      const lista = Object.values(window.CKEDITOR.instances)
      if (lista.length && lista.every(instancia => instancia.status === 'ready')) { ck4 = lista; break }
    }
    await esperar(300)
  }
  if (!ck5 && !ck4) { resultado.erro = 'O editor do SEI não abriu a tempo.'; return resultado }

  // 2. Seções: nome, se dá para editar e um rótulo (para achar o "Corpo do Texto").
  const rotuloDe = elemento => {
    if (!elemento) return ''
    const perto = elemento.closest('[title], [aria-label], [data-secao], [data-nome]') || elemento
    return [elemento.id, elemento.getAttribute('aria-label'), perto.getAttribute('title'), perto.getAttribute('aria-label'), perto.getAttribute('data-secao'), perto.getAttribute('data-nome')].filter(Boolean).join(' ')
  }
  let secoes = []
  if (ck5) {
    resultado.editor = 'CKEditor 5'
    const nomes = typeof ck5.model.document.getRootNames === 'function' ? ck5.model.document.getRootNames() : ['main']
    secoes = nomes.map(nome => {
      const elemento = ck5.editing.view.getDomRoot(nome)
      const desligada = typeof ck5.isRootDisabled === 'function' ? ck5.isRootDisabled(nome) : false
      const editavel = Boolean(elemento) && elemento.getAttribute('contenteditable') === 'true' && !desligada && !ck5.isReadOnly
      return { nome, editavel, rotulo: nome + ' ' + rotuloDe(elemento), tamanho: (ck5.getData({ rootName: nome }) || '').length }
    })
  } else {
    resultado.editor = 'CKEditor 4' + (window.CKEDITOR.version ? ' ' + window.CKEDITOR.version : '')
    secoes = ck4.map(instancia => ({
      nome: instancia.name,
      editavel: !instancia.readOnly,
      rotulo: instancia.name + ' ' + rotuloDe(instancia.element && instancia.element.$) + ' ' + rotuloDe(instancia.container && instancia.container.$),
      tamanho: (instancia.getData() || '').length
    }))
  }
  resultado.secoes = secoes.map(secao => `${secao.nome}${secao.editavel ? '' : ' (só leitura)'}`)

  // 3. Corpo: a única seção editável; com mais de uma, a que diz "corpo". Se não der para saber, para
  // (melhor não escrever no lugar errado) e mostra as seções.
  const editaveis = secoes.filter(secao => secao.editavel)
  let corpo = editaveis.length === 1 ? editaveis[0] : editaveis.find(secao => ROTULO_CORPO.test(secao.rotulo))
  if (!corpo) {
    resultado.erro = editaveis.length ? 'Não consegui saber qual seção do editor é o corpo do texto.' : 'O editor não tem seção que dê para editar.'
    return resultado
  }
  resultado.corpo = corpo.nome

  // 4. Põe o texto.
  try {
    if (ck5) {
      ck5.data.set({ [corpo.nome]: html })
    } else {
      const instancia = ck4.find(item => item.name === corpo.nome)
      await new Promise(resolve => instancia.setData(html, { callback: resolve }))
    }
  } catch (erro) {
    resultado.erro = 'O editor não aceitou o texto: ' + erro.message
    return resultado
  }
  await esperar(300)

  // 5. Salvar (nunca Assinar). Vigia os pedidos que a página faz e as mensagens (alert) do SEI.
  const avisos = []
  const pedidos = { comecados: 0, terminados: 0, falhas: [] }
  const alertaOriginal = window.alert
  const confirmaOriginal = window.confirm
  const envioOriginal = XMLHttpRequest.prototype.send
  const buscaOriginal = window.fetch
  window.alert = mensagem => { avisos.push(String(mensagem)) }
  // Pergunta do SEI durante o salvar: responde "não" e mostra a pergunta à pessoa.
  window.confirm = mensagem => { avisos.push(String(mensagem)); return false }
  XMLHttpRequest.prototype.send = function (...argumentos) {
    pedidos.comecados++
    this.addEventListener('loadend', () => { pedidos.terminados++; if (this.status && this.status >= 400) pedidos.falhas.push(this.status) })
    return envioOriginal.apply(this, argumentos)
  }
  window.fetch = function (...argumentos) {
    pedidos.comecados++
    return buscaOriginal.apply(this, argumentos).then(resposta => {
      pedidos.terminados++
      if (resposta.status >= 400) pedidos.falhas.push(resposta.status)
      return resposta
    }, erro => { pedidos.terminados++; pedidos.falhas.push('rede'); throw erro })
  }
  const devolver = () => {
    window.alert = alertaOriginal
    window.confirm = confirmaOriginal
    XMLHttpRequest.prototype.send = envioOriginal
    window.fetch = buscaOriginal
  }

  try {
    const instancia = ck4 && ck4.find(item => item.name === corpo.nome)
    if (instancia && instancia.getCommand && instancia.getCommand('save')) {
      instancia.execCommand('save')
    } else {
      const ehSalvar = elemento => /^salvar\b/i.test((elemento.getAttribute('data-cke-tooltip-text') || elemento.getAttribute('title') || elemento.getAttribute('aria-label') || elemento.textContent || '').trim())
      const botao = [...document.querySelectorAll('button, a, [role="button"]')].find(elemento => ehSalvar(elemento) && !/assinar/i.test(elemento.textContent + (elemento.getAttribute('title') || '')))
      if (!botao) { resultado.erro = 'Não achei o botão Salvar do editor.'; return resultado }
      if (botao.classList.contains('ck-disabled') || botao.getAttribute('aria-disabled') === 'true' || botao.disabled) { resultado.erro = 'O botão Salvar do editor está desligado.'; return resultado }
      botao.click()
    }
    // Espera os pedidos terminarem (até 40 s) e mais um pouco por uma mensagem do SEI.
    const fim = Date.now() + 40000
    while (Date.now() < fim && (pedidos.comecados === 0 || pedidos.terminados < pedidos.comecados)) await esperar(250)
    await esperar(1500)
  } finally {
    devolver()
  }
  const problema = avisos.find(aviso => !/salv[oa]/i.test(aviso) || /erro|n[ãa]o/i.test(aviso))
  if (problema) { resultado.erro = 'O SEI respondeu: ' + problema; return resultado }
  if (pedidos.falhas.length) { resultado.erro = 'O SEI não salvou (erro ' + pedidos.falhas[0] + ').'; return resultado }
  resultado.ok = true
  resultado.salvou = pedidos.comecados ? 'sim' : 'incerto'
  return resultado
}
globalThis.ExtensaoIFTO = Object.assign(globalThis.ExtensaoIFTO || {}, { editorPreencher: extensaoIftoPreencherESalvar })
