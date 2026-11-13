// v0.17.0: consulta do Simples Nacional (spec consulta-simples): regras sem depender da página (testáveis).
(function (raiz) {
  const ehNode = typeof module !== 'undefined' && module.exports
  const sicaf = ehNode ? require('./sicaf.js') : raiz.ExtensaoIFTO.sicaf
  const { nomeNaArvore } = ehNode ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  const { soDigitos, textoDoHtml } = sicaf

  // Formulário da consulta (a extensão abre direto, sem o quadro do Portal do Simples Nacional).
  const URL_CONSULTA_SIMPLES = 'https://consopt.www8.receita.fazenda.gov.br/consultaoptantes'
  const ORIGENS_SIMPLES = Object.freeze(['*://consopt.www8.receita.fazenda.gov.br/*'])
  // v0.17.2: página do site da consulta (formulário ou resultado).
  function ehSiteDoSimples (endereco) {
    try { return new URL(endereco).hostname === 'consopt.www8.receita.fazenda.gov.br' } catch (erro) { return false }
  }

  // Marcas do negrito no meio do texto (o valor em verde e o <strong> da página).
  const INICIO_NEGRITO = '\u0001'
  const FIM_NEGRITO = '\u0002'
  const MARCA_SECAO = '\u0003'

  // Página do resultado (ou só o quadro #conteudo, depois de "Mais informações") → linhas na ordem da página.
  // Cada linha: { secao: 'Situação Atual' } ou { partes: [{ texto, negrito }], rotulo, valor, nota }.
  function lerLinhas (html) {
    let trecho = String(html || '').replace(/<!--[\s\S]*?-->/g, ' ')
    const inicio = trecho.search(/<div[^>]*id="conteudo"/i)
    if (inicio >= 0) trecho = trecho.slice(inicio)
    // Fim: antes dos botões "Voltar" e "Gerar PDF" (ou do rodapé).
    const fim = trecho.search(/<a[^>]*>\s*Voltar\s*<\/a>|<button[^>]*id="GerarPDF"|<footer/i)
    if (fim >= 0) trecho = trecho.slice(0, fim)
    trecho = trecho
      .replace(/\s+/g, ' ')
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, ' ')
      .replace(/<span[^>]*id="spnMsgErro"[^>]*>[\s\S]*?<\/span>/gi, ' ')
      .replace(/<span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '\n\u0004$1\n')
      .replace(/<h3[^>]*panel-title[^>]*>([\s\S]*?)<\/h3>/gi, `\n${MARCA_SECAO}$1\n`)
      .replace(/<span[^>]*spanValorVerde[^>]*>([\s\S]*?)<\/span>/gi, `${INICIO_NEGRITO}$1${FIM_NEGRITO}`)
      .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, `${INICIO_NEGRITO}$2${FIM_NEGRITO}`)
      .replace(/\n/g, '<br>')
    const linhas = []
    for (const bruta of textoDoHtml(trecho).split('\n')) {
      const linha = bruta.trim()
      if (!linha || linha === INICIO_NEGRITO + FIM_NEGRITO) continue
      if (linha.startsWith(MARCA_SECAO)) {
        linhas.push({ secao: linha.slice(1).trim() })
        continue
      }
      const nota = linha.startsWith('\u0004')
      const partes = []
      for (const [i, pedaco] of linha.replace('\u0004', '').split(new RegExp(`[${INICIO_NEGRITO}${FIM_NEGRITO}]`)).entries()) {
        const texto = pedaco.replace(/\s+/g, ' ')
        if (texto.trim()) partes.push({ texto: texto.trim(), negrito: i % 2 === 1 })
      }
      if (!partes.length) continue
      const textoTodo = partes.map(parte => parte.texto).join(' ')
      const achado = /^([^:]{2,90}):\s*(.*)$/.exec(textoTodo)
      linhas.push({ partes, nota, rotulo: achado ? achado[1].trim() : null, valor: achado ? achado[2].trim() : textoTodo })
    }
    return linhas
  }

  function maisInformacoesCarregadas (html) {
    const texto = String(html || '')
    return /id="maisInfoComplementar"/i.test(texto) && !/id="maisInfoComplementar"[^>]*>\s*<\/div>/i.test(texto)
  }

  // Dados principais do resultado. "valido" só quando a página trouxe CNPJ e nome.
  function lerResultado (html) {
    const linhas = lerLinhas(html)
    const valorDe = padrao => {
      const linha = linhas.find(item => item.rotulo && padrao.test(item.rotulo))
      return linha ? linha.valor : ''
    }
    const cnpj = soDigitos(valorDe(/^CNPJ$/i))
    const nomeEmpresarial = valorDe(/^Nome Empresarial$/i)
    return {
      linhas,
      dataDaConsulta: valorDe(/^Data da consulta$/i),
      cnpj: cnpj.length === 14 ? cnpj : null,
      nomeEmpresarial,
      situacaoSimples: valorDe(/^Situa[cç][aã]o no Simples Nacional$/i),
      situacaoSimei: valorDe(/^Situa[cç][aã]o no SIMEI$/i),
      // "Mais informações" já carregado: o quadro #maisInfoComplementar deixa de estar vazio.
      comMaisInformacoes: maisInformacoesCarregadas(html),
      valido: cnpj.length === 14 && Boolean(nomeEmpresarial)
    }
  }

  const dois = numero => String(numero).padStart(2, '0')
  const dataBr = agora => `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)}/${agora.getFullYear()}`

  // Decisão D2: linha de onde e quando veio a consulta.
  function linhaDaFonte (agora = new Date()) {
    return `Consulta feita em ${dataBr(agora)} ${dois(agora.getHours())}:${dois(agora.getMinutes())} no Portal do Simples Nacional (${URL_CONSULTA_SIMPLES}).`
  }

  // Parágrafos do PDF (comum/pdf-texto.js): título, as linhas da página na mesma ordem e a linha da fonte.
  function paragrafosDoPdf (resultado, agora = new Date()) {
    const paragrafos = [{ estilo: 'titulo', texto: 'Consulta Optantes – Simples Nacional' }]
    for (const linha of resultado.linhas || []) {
      if (linha.secao) paragrafos.push({ estilo: 'secao', texto: linha.secao })
      else paragrafos.push({ estilo: linha.nota ? 'nota' : 'texto', partes: linha.partes })
    }
    paragrafos.push({ estilo: 'fonte', texto: linhaDaFonte(agora) })
    return paragrafos
  }

  // Decisão D5: ConsultaOptantes_<CNPJ com 14 números>_<aaaa-mm-dd>.pdf
  function nomeDoArquivo (cnpj, agora = new Date()) {
    return `ConsultaOptantes_${soDigitos(cnpj)}_${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}.pdf`
  }

  // Decisão D6: "Consulta Simples Nacional <Nome Empresarial>" (o tipo "Consulta" não entra nas 50 letras).
  const nomeDaConsulta = nome => nomeNaArvore(`Simples Nacional ${String(nome || '').replace(/\.\s*$/, '')}`)

  const api = { URL_CONSULTA_SIMPLES, ORIGENS_SIMPLES, ehSiteDoSimples, lerLinhas, lerResultado, maisInformacoesCarregadas, linhaDaFonte, paragrafosDoPdf, nomeDoArquivo, nomeDaConsulta }
  if (ehNode) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { simplesNacional: api })
})(globalThis)
