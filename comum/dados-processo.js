// v0.33.0: dados do processo (Tipo, Especificação, Interessados, Data de Autuação). A tela do processo
// (sites/sei/dados-processo.js) lê a página "Consultar/Alterar Processo" do próprio SEI, só para ler (nunca
// salva), mostra os dados na área em branco e os guarda no navegador; a janela do editor usa os dados
// guardados para conferir a Capa de Processo. Regras puras: rodam no navegador e no Node.
(function (raiz) {
  const doNode = typeof module !== 'undefined' && module.exports
  const conferir = () => doNode ? require('./conferir-documento.js') : raiz.ExtensaoIFTO.conferirDocumento
  const texto = html => conferir().textoDoHtml(html)
  const CHAVE = 'dadosDosProcessos'
  const GUARDADOS = 40

  // Link da página que mostra os dados do processo (Alterar; sem permissão, Consultar).
  function linkDosDados (html) {
    for (const acao of ['procedimento_alterar', 'procedimento_consultar']) {
      const achado = new RegExp('controlador\\.php\\?acao=' + acao + '&[^"\'\\s<>]*').exec(String(html || ''))
      if (achado) return achado[0].replace(/&amp;/g, '&')
    }
    return ''
  }

  const valorDoCampo = (html, id) => {
    const campo = new RegExp('<input\\b[^>]*\\bid="' + id + '"[^>]*>', 'i').exec(html)
    const valor = campo && /\bvalue="([^"]*)"/i.exec(campo[0])
    return valor ? texto(valor[1]) : ''
  }
  const opcoesDaLista = (html, id) => {
    const lista = new RegExp('<select\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)</select>', 'i').exec(html)
    return lista ? [...lista[1].matchAll(/<option\b([^>]*)>([\s\S]*?)(?=<option\b|$)/gi)].map(([, atributos, nome]) => ({ selecionada: /\bselected\b/i.test(atributos), valor: (/\bvalue="([^"]*)"/i.exec(atributos) || [])[1] || '', nome: texto(nome) })) : []
  }

  // Lê a página "Consultar/Alterar Processo". Devolve null se não for essa página.
  function lerDados (html) {
    html = String(html || '')
    if (!/id="selTipoProcedimento"|id="hdnNomeTipoProcedimento"/.test(html)) return null
    const tipoEscolhido = opcoesDaLista(html, 'selTipoProcedimento').find(opcao => opcao.selecionada && opcao.valor !== 'null')
    const processo = valorDoCampo(html, 'hdnProtocoloFormatado')
    return {
      processo: processo ? conferir().formatarProcesso(processo) : '',
      tipo: (tipoEscolhido && tipoEscolhido.nome) || valorDoCampo(html, 'hdnNomeTipoProcedimento'),
      especificacao: valorDoCampo(html, 'txtDescricao'),
      interessados: opcoesDaLista(html, 'selInteressadosProcedimento').map(opcao => opcao.nome).filter(Boolean),
      autuacao: valorDoCampo(html, 'hdnDtaGeracao')
    }
  }

  // Guarda os dados de um processo (os últimos GUARDADOS processos vistos).
  function guardar (guardados, dados, agora = new Date()) {
    const lista = Object.entries(guardados || {}).filter(([numero]) => numero !== dados.processo)
    lista.push([dados.processo, { ...dados, em: agora.toISOString() }])
    lista.sort((a, b) => String(a[1].em).localeCompare(String(b[1].em)))
    return Object.fromEntries(lista.slice(-GUARDADOS))
  }

  // ---- Capa de Processo ----
  const ROTULOS = [
    { campo: 'autuacao', rotulo: /Data\s+de\s+Autua[çc][ãa]o\s*:/i },
    { campo: 'tipo', rotulo: /^Tipo\s+de\s+Processo\s*:/i, nome: 'Tipo de Processo' },
    { campo: 'especificacao', rotulo: /^Especifica[çc][ãa]o\s*:/i, nome: 'Especificação' },
    { campo: 'classificacao', rotulo: /^Classifica[çc][ãa]o\s+por\s+Assunto/i },
    { campo: 'interessados', rotulo: /^Interessados?(\s*\(s\))?\s*:/i, nome: 'Interessado(s)' }
  ]
  const paragrafos = html => [...String(html || '').matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)]
  const rotuloDe = linha => ROTULOS.find(item => item.campo !== 'autuacao' && item.rotulo.test(linha))
  const depoisDoRotulo = (linha, rotulo) => linha.replace(rotulo, '').trim()

  // A Capa tem "Tipo de Processo:" e "Data de Autuação:". Devolve { secao, tipo, especificacao, interessados,
  // autuacao } ou null.
  function lerCapa (secoes) {
    for (const secao of secoes || []) {
      const linhas = paragrafos(secao.html).map(([, , dentro]) => texto(dentro))
      if (!linhas.some(linha => ROTULOS[1].rotulo.test(linha)) || !linhas.some(linha => ROTULOS[0].rotulo.test(linha))) continue
      const capa = { secao: secao.nome, editavel: secao.editavel !== false, interessados: [] }
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i]
        const data = linha.match(/Data\s+de\s+Autua[çc][ãa]o\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)
        if (data) capa.autuacao = data[1]
        const item = rotuloDe(linha)
        if (!item) continue
        if (item.campo === 'interessados') {
          // Um interessado por linha: a do rótulo e as seguintes, até a linha em branco ou outro rótulo.
          const primeiro = depoisDoRotulo(linha, item.rotulo)
          if (primeiro) capa.interessados.push(primeiro)
          for (let j = i + 1; j < linhas.length && linhas[j] && !rotuloDe(linhas[j]); j++) capa.interessados.push(linhas[j])
        } else if (item.campo !== 'classificacao') capa[item.campo] = depoisDoRotulo(linha, item.rotulo)
      }
      return capa
    }
    return null
  }

  const comparavel = valor => texto(valor).replace(/\s+/g, ' ').trim().toLowerCase()
  const listaIgual = (a, b) => a.length === b.length && a.map(comparavel).sort().join('|') === b.map(comparavel).sort().join('|')

  // Confere a Capa com os dados do processo. Devolve { certo, diferencas: [{ campo, nome, escrito, certo }] }.
  function conferirCapa (capa, dados) {
    if (!capa || !dados) return null
    const diferencas = []
    const comparar = (campo, nome) => {
      if (!dados[campo] || comparavel(capa[campo] || '') === comparavel(dados[campo])) return
      diferencas.push({ campo, nome, escrito: capa[campo] || '', certo: dados[campo] })
    }
    comparar('autuacao', 'Data de Autuação')
    comparar('tipo', 'Tipo de Processo')
    comparar('especificacao', 'Especificação')
    if (dados.interessados && dados.interessados.length && !listaIgual(capa.interessados || [], dados.interessados)) {
      diferencas.push({ campo: 'interessados', nome: 'Interessado(s)', escrito: (capa.interessados || []).join('; '), certo: dados.interessados.join('; ') })
    }
    return { certo: !diferencas.length, diferencas }
  }

  const avisosDaCapa = conferido => conferido.diferencas.map(item => `${item.nome}: a capa diz "${item.escrito || '(vazio)'}", mas o processo tem "${item.certo}".`)

  const escapar = valor => String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Capa corrigida com os dados do processo (só os campos diferentes); o número do processo é corrigido à parte
  // ("Corrigir o número do processo"). Devolve o html novo ou null.
  function corrigirCapa (html, dados, conferido) {
    if (!conferido || conferido.certo) return null
    const campos = new Set(conferido.diferencas.map(item => item.campo))
    let pulando = false
    let mudou = false
    const novo = String(html || '').replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (tudo, atributos, dentro) => {
      const linha = texto(dentro)
      const item = rotuloDe(linha)
      if (pulando) {
        if (linha && !item) return ''
        pulando = false
      }
      if (campos.has('autuacao') && ROTULOS[0].rotulo.test(linha)) {
        const trocado = tudo.replace(/(Autua(?:ç|&ccedil;)(?:ã|&atilde;)o:?(?:<\/[^>]+>|&nbsp;|\s)*)\d{2}\/\d{2}\/\d{4}/i, (_, antes) => antes + dados.autuacao)
        if (trocado !== tudo) mudou = true
        return trocado
      }
      if (!item || !campos.has(item.campo)) return tudo
      mudou = true
      const valores = item.campo === 'interessados' ? dados.interessados : [dados[item.campo]]
      if (item.campo === 'interessados') pulando = true
      return valores.map((valor, i) => `<p${atributos}>${i ? '' : `<strong>${item.nome}:</strong>&nbsp;`}${escapar(valor)}</p>`).join('')
    })
    return mudou ? novo : null
  }

  const api = { CHAVE, GUARDADOS, linkDosDados, lerDados, guardar, lerCapa, conferirCapa, avisosDaCapa, corrigirCapa }
  if (doNode) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { dadosProcesso: api })
})(globalThis)
