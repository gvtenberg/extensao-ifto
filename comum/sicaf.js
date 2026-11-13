// v0.10.0: SICAF automático (spec sicaf-automatico): regras sem depender da página (testáveis no computador).
(function (raiz) {
  const { ligadaNaUnidade } = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  const UNIDADE_CGOC = 'CGOC/GAC/DAP/PAL/REI/IFTO'

  // "automatica": notas sem SICAF só na CGOC; "sempre": botão "Incluir SICAF" em qualquer unidade; "desligada".
  function funcaoLigada (opcao, unidade) {
    return ligadaNaUnidade(opcao, unidade, UNIDADE_CGOC)
  }
  function ehCgoc (unidade) {
    return String(unidade || '').trim().toUpperCase() === UNIDADE_CGOC
  }

  // ---------- CNPJ ----------
  const RAIZ_IFTO = '10742006'
  const CNPJ_CAMPUS_PALMAS = '10742006000350'
  const soDigitos = texto => String(texto == null ? '' : texto).replace(/\D/g, '')

  // Dígitos verificadores (módulo 11). Sequências iguais (00000000000000…) não valem.
  function cnpjValido (cnpj) {
    const n = soDigitos(cnpj)
    if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false
    const digito = tamanho => {
      let soma = 0
      let peso = tamanho - 7
      for (let i = 0; i < tamanho; i++) {
        soma += Number(n[i]) * peso--
        if (peso < 2) peso = 9
      }
      const resto = soma % 11
      return resto < 2 ? 0 : 11 - resto
    }
    return digito(12) === Number(n[12]) && digito(13) === Number(n[13])
  }
  function formatarCnpj (cnpj) {
    const n = soDigitos(cnpj)
    if (n.length !== 14) return String(cnpj || '')
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
  }
  const ehDoIfto = cnpj => soDigitos(cnpj).startsWith(RAIZ_IFTO)

  // CNPJs formatados (00.000.000/0000-00) e válidos, na ordem do texto, sem repetir.
  function acharCnpjs (texto) {
    const achados = []
    const padrao = /(?<![\d./-])(\d{2})\s?\.\s?(\d{3})\s?\.\s?(\d{3})\s?\/\s?(\d{4})\s?-\s?(\d{2})(?![\d])/g
    let achado
    while ((achado = padrao.exec(String(texto || '')))) {
      const n = achado.slice(1).join('')
      if (cnpjValido(n) && !achados.includes(n)) achados.push(n)
    }
    return achados
  }

  // ---------- Textos ----------
  // Sem acento, maiúsculas, um espaço só.
  function normalizar (texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()
  }
  // "063" = "63" = "0.063"; "3.626" = "3626".
  function mesmoNumero (a, b) {
    const limpo = valor => soDigitos(valor).replace(/^0+(?=\d)/, '')
    return limpo(a) !== '' && limpo(a) === limpo(b)
  }

  // Texto de uma página HTML do SEI (documento feito no SEI), com uma linha por parágrafo.
  const ENTIDADES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', deg: '°', ndash: '–', mdash: '—', sect: '§' }
  const MARCAS = { acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧' }
  function textoDoHtml (html) {
    return String(html || '')
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|tr|td|th|li|h\d)>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&([a-zA-Z])(acute|grave|circ|tilde|uml|cedil);/g, (_, letra, marca) => (letra + MARCAS[marca]).normalize('NFC'))
      .replace(/&([a-z]+);/gi, (inteiro, nome) => ENTIDADES[nome.toLowerCase()] !== undefined ? ENTIDADES[nome.toLowerCase()] : inteiro)
      .replace(/​/g, '')
      .split('\n').map(linha => linha.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
  }

  // ---------- Árvore do processo ----------
  // Tipo pelo nome na árvore: nota fiscal (externa, com arquivo), ateste, folha de encaminhamento, sicaf,
  // consulta ou anexo. Exemplos do processo guardado (13/11/2026): "Nota fiscal nº 063 CHC SOLUÇOES EM
  // SERV. E COM. LTDA (3375105)", "Ateste Fatura Materiais 3375107", "Folha de Encaminhamento 269 (3376800)".
  function tipoNaArvore (rotulo) {
    const r = normalizar(rotulo)
    if (/^(NOTA FISCAL|NF-?E?\b|NFS-?E\b|DANFE\b)/.test(r)) return 'nota'
    if (/^ATESTE\b/.test(r)) return 'ateste'
    if (/^FOLHA DE ENCAMINHAMENTO\b/.test(r)) return 'folha'
    if (/^SICAF\b/.test(r)) return 'sicaf'
    if (/^CONSULTA\b/.test(r)) return 'consulta'
    if (/^ANEXO\b/.test(r)) return 'anexo'
    return null
  }
  // Número SEI no fim do rótulo: "(3375105)" ou " 3375107".
  function numeroSei (rotulo) {
    const achado = /\(?(\d{6,})\)?\s*$/.exec(String(rotulo || '').trim())
    return achado ? achado[1] : null
  }
  // "Nota fiscal nº 063 CHC SOLUÇOES… (3375105)" → { numero: '63', fornecedor: 'CHC SOLUÇOES…' }
  function lerRotuloDaNota (rotulo) {
    const semSei = String(rotulo || '').replace(/\s*\(?\d{6,}\)?\s*$/, '').trim()
    const achado = /^\S+(?:\s+fiscal)?(?:\s+eletr[oô]nica)?(?:\s+de\s+servi[cç]os?)?\s*(?:n\.?\s*[º°o]?\.?|n[uú]mero)?\s*([\d.]+)\s*(.*)$/i.exec(semSei)
    if (!achado) return { numero: null, fornecedor: '' }
    const numero = soDigitos(achado[1]).replace(/^0+(?=\d)/, '') || null
    return { numero, fornecedor: achado[2].replace(/^[-–\s]+/, '').trim() }
  }

  // Pendentes (decisão D10): tudo o que vem depois da última Folha de Encaminhamento (ou tudo, sem folha).
  function trechoPendente (documentos) {
    const lista = documentos || []
    let ultima = -1
    lista.forEach((doc, posicao) => { if (tipoNaArvore(doc.rotulo) === 'folha') ultima = posicao })
    return lista.slice(ultima + 1)
  }

  // ---------- Ateste ----------
  // Linhas "Empresa:", "CNPJ:", "Número da nota fiscal: 3.626 ( 3384844 )", "Nota de Empenho:" /
  // "Número do empenho:", "Valor da nota fiscal: R$ 914,60 (…)". Um ateste pode ter várias empresas
  // (um bloco por "Empresa:") e várias notas da mesma empresa.
  function lerAteste (texto) {
    const linhas = String(texto || '').split('\n')
    const itens = []
    let atual = null
    const valorDepois = linha => linha.slice(linha.indexOf(':') + 1).trim()
    for (const linha of linhas) {
      const n = normalizar(linha)
      if (/^(EMPRESA|FORNECEDOR|CONTRATADA|RAZAO SOCIAL)\s*:/.test(n)) {
        atual = { empresa: valorDepois(linha), cnpj: null, notas: [], seis: [], empenhos: [], valores: [] }
        itens.push(atual)
        continue
      }
      if (!atual) continue
      if (/^CNPJ\b/.test(n) && !atual.cnpj) {
        atual.cnpj = acharCnpjs(linha)[0] || (soDigitos(valorDepois(linha)).length === 14 ? soDigitos(valorDepois(linha)) : null)
      } else if (/^(N[UO]MERO|NO?\.?)\s*(D[AO]S?\s*)?(NOTAS?|NF|FATURAS?)/.test(n)) {
        const resto = valorDepois(linha)
        for (const sei of resto.matchAll(/\(\s*(\d{6,})\s*\)/g)) atual.seis.push(sei[1])
        const semSei = resto.replace(/\(\s*\d+\s*\)/g, ' ')
        for (const numero of semSei.matchAll(/\d[\d.]*/g)) atual.notas.push(soDigitos(numero[0]).replace(/^0+(?=\d)/, ''))
      } else if (/EMPENHO/.test(n)) {
        for (const empenho of n.matchAll(/\b(\d{4})\s*NE\s*0*(\d+)\b/g)) atual.empenhos.push(`${empenho[1]}NE${empenho[2]}`)
      } else if (/^VALOR/.test(n)) {
        for (const valor of linha.matchAll(/\d{1,3}(?:\.\d{3})*,\d{2}/g)) atual.valores.push(valor[0])
      }
    }
    return itens.filter(item => item.empresa || item.cnpj)
  }

  // Nomes parecidos: palavras principais na mesma ordem, abreviações aceitas ("SERV." = "SERVIÇOS").
  const PALAVRAS_FRACAS = new Set(['LTDA', 'ME', 'EPP', 'EIRELI', 'SA', 'S', 'A', 'DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'EM', 'MEI', 'CIA'])
  function palavras (nome) {
    return normalizar(nome).replace(/[^A-Z0-9 ]/g, ' ').split(' ').filter(p => p && !PALAVRAS_FRACAS.has(p))
  }
  function nomesParecidos (a, b) {
    let curto = palavras(a)
    let longo = palavras(b)
    if (!curto.length || !longo.length) return false
    if (curto.length > longo.length) [curto, longo] = [longo, curto]
    if (!longo[0].startsWith(curto[0]) && !curto[0].startsWith(longo[0])) return false
    let posicao = 0
    let iguais = 0
    for (const palavra of curto) {
      const achou = longo.findIndex((outra, i) => i >= posicao && (outra.startsWith(palavra) || palavra.startsWith(outra)))
      if (achou >= 0) { iguais++; posicao = achou + 1 }
    }
    return iguais / curto.length >= 0.6
  }

  // ---------- Situação do processo (etapa 1) ----------
  // documentos: lerArvore().documentos; atestes: { idDoDocumento: lerAteste() }; cnpjsDosSicafs:
  // { idDoDocumento: [CNPJs achados no PDF] }. Devolve as notas pendentes e os fornecedores.
  function situacaoDoProcesso (documentos, { atestes = {}, cnpjsDosSicafs = {} } = {}) {
    const trecho = trechoPendente(documentos)
    const itensDeAteste = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'ateste').flatMap(doc => (atestes[doc.id] || []).map(item => ({ ...item, idAteste: doc.id })))
    const sicafsComArquivo = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'sicaf' && doc.temArquivo)
    const anexosComArquivo = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'anexo' && doc.temArquivo)
    const notas = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'nota' && doc.temArquivo).map(doc => {
      const { numero, fornecedor } = lerRotuloDaNota(doc.rotulo)
      const sei = numeroSei(doc.rotulo)
      // Ateste da nota: pelo número SEI (quando o ateste traz) ou pelo número da nota; empate: pelo nome.
      let candidatos = itensDeAteste.filter(item => item.seis.includes(sei))
      if (!candidatos.length) candidatos = itensDeAteste.filter(item => item.notas.some(outro => mesmoNumero(outro, numero)))
      const ateste = candidatos.find(item => nomesParecidos(item.empresa, fornecedor)) || candidatos[0] || null
      const anexoFeito = anexosComArquivo.some(anexo => {
        const achado = /\bN\s*[º°O]?\.?\s*([\d.]+)/.exec(normalizar(anexo.rotulo).replace(/^ANEXO\s+/, '').replace(/^.*?\bNF\b/, 'NF'))
        return achado && mesmoNumero(achado[1], numero)
      })
      return { id: doc.id, rotulo: doc.rotulo, link: doc.link, sei, numero, fornecedor, ateste, cnpj: ateste ? ateste.cnpj : null, anexoFeito }
    })
    const cnpjsComSicaf = new Set(sicafsComArquivo.flatMap(doc => cnpjsDosSicafs[doc.id] || []))
    for (const nota of notas) nota.temSicaf = Boolean(nota.cnpj && cnpjsComSicaf.has(nota.cnpj))
    return {
      notas,
      pendentes: notas.filter(nota => !nota.temSicaf),
      atestes: trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'ateste'),
      sicafs: sicafsComArquivo
    }
  }

  // "1 nota sem SICAF" / "2 notas sem SICAF"
  function textoDoAviso (quantidade) {
    return quantidade === 1 ? '1 nota sem SICAF' : `${quantidade} notas sem SICAF`
  }

  const api = {
    UNIDADE_CGOC, CNPJ_CAMPUS_PALMAS, funcaoLigada, ehCgoc,
    soDigitos, cnpjValido, formatarCnpj, ehDoIfto, acharCnpjs,
    normalizar, mesmoNumero, textoDoHtml, nomesParecidos,
    tipoNaArvore, numeroSei, lerRotuloDaNota, trechoPendente, lerAteste, situacaoDoProcesso, textoDoAviso
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { sicaf: api })
})(globalThis)
