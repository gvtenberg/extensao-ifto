// v0.10.0: SICAF automático (spec sicaf-automatico): regras sem depender da página (testáveis no computador).
(function (raiz) {
  // v0.17.0: nomeNaArvore passou para comum/sei.js (vale para todo documento externo do SEI).
  const { ligadaNaUnidade, nomeNaArvore } = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
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
  // v0.17.0 (consulta-simples D7): CNPJ da matriz de uma filial: 8 primeiros números + 0001 + dígitos refeitos.
  function cnpjMatriz (cnpj) {
    const n = soDigitos(cnpj)
    if (n.length !== 14) return null
    const base = n.slice(0, 8) + '0001'
    const digito = parcial => {
      let soma = 0
      let peso = parcial.length - 7
      for (const c of parcial) {
        soma += Number(c) * peso--
        if (peso < 2) peso = 9
      }
      const resto = soma % 11
      return String(resto < 2 ? 0 : 11 - resto)
    }
    const com12 = base + digito(base)
    return com12 + digito(com12)
  }

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

  // v0.11.0: CNPJ selecionado ou colado: só o CNPJ (com ou sem pontos), talvez com "CNPJ:" antes.
  // Devolve { cnpj, valido } ou null quando o texto não tem a forma de um CNPJ.
  function cnpjDaSelecao (texto) {
    const limpo = String(texto || '').replace(/^\s*CNPJ\s*(\/\s*CPF)?\s*:?\s*/i, '').replace(/\s+/g, '').replace(/[.,;:)]+$/, '').replace(/^\(/, '')
    if (!/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(limpo)) return null
    const cnpj = soDigitos(limpo)
    return { cnpj, valido: cnpjValido(cnpj) }
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
  // v0.17.6 (pedido de 13/11/2026, um botão só): a nota também fica pendente sem a Consulta do Simples
  // Nacional (Consulta com arquivo cujo PDF tem o CNPJ; o Simples vale para a empresa toda, então conta a
  // raiz, os 8 primeiros números).
  function situacaoDoProcesso (documentos, { atestes = {}, cnpjsDosSicafs = {}, cnpjsDasConsultas = {} } = {}) {
    const trecho = trechoPendente(documentos)
    const itensDeAteste = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'ateste').flatMap(doc => (atestes[doc.id] || []).map(item => ({ ...item, idAteste: doc.id })))
    const sicafsComArquivo = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'sicaf' && doc.temArquivo)
    const consultasComArquivo = trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'consulta' && doc.temArquivo)
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
    const raizesComConsulta = new Set(consultasComArquivo.flatMap(doc => (cnpjsDasConsultas[doc.id] || []).map(raizDoCnpj)))
    for (const nota of notas) {
      nota.temSicaf = Boolean(nota.cnpj && cnpjsComSicaf.has(nota.cnpj))
      nota.temConsulta = Boolean(nota.cnpj && raizesComConsulta.has(raizDoCnpj(nota.cnpj)))
    }
    return {
      notas,
      pendentes: notas.filter(nota => !nota.temSicaf || !nota.temConsulta),
      atestes: trecho.filter(doc => tipoNaArvore(doc.rotulo) === 'ateste'),
      sicafs: sicafsComArquivo,
      consultas: consultasComArquivo
    }
  }
  const raizDoCnpj = cnpj => soDigitos(cnpj).slice(0, 8)


  // ---------- Nota fiscal × ateste (etapa 3; decisões D8 e D9) ----------
  // v0.12.0: a nota é a referência (ateste e Folha são digitados à mão). Emitente: o primeiro CNPJ válido
  // que não é do IFTO (o emitente vem antes; transportadora pode vir depois).
  function cnpjsDaNota (texto) {
    return acharCnpjs(texto).filter(cnpj => !ehDoIfto(cnpj))
  }
  // Nota escaneada (imagem): quase nenhuma letra no texto.
  const notaSemTexto = texto => (String(texto || '').match(/[A-Za-zÀ-ÿ]/g) || []).length < 30

  // Números da nota com e sem pontos/zeros à esquerda: "000.000.063" e "063" contam como 63.
  function numerosDoTexto (texto) {
    const numeros = new Set()
    for (const achado of String(texto || '').matchAll(/\d[\d.]*/g)) numeros.add(soDigitos(achado[0]).replace(/^0+(?=\d)/, ''))
    return numeros
  }
  // Valores "914,60" e "3.589,00" (sem os pontos de milhar).
  const valorLimpo = valor => String(valor || '').replace(/\./g, '').trim()
  function valoresDoTexto (texto) {
    return new Set([...String(texto || '').matchAll(/\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g)].map(achado => valorLimpo(achado[0])))
  }
  // Empenhos "2026NE174", "2026 NE 000174" → "2026NE174".
  function empenhosDoTexto (texto) {
    return [...normalizar(texto).matchAll(/\b(\d{4})\s*NE\s*0*(\d+)\b/g)].map(achado => `${achado[1]}NE${achado[2]}`)
  }
  // Nome do ateste no texto da nota: as palavras principais (abreviações aceitas).
  function nomeNoTexto (nome, texto) {
    const procuradas = palavras(nome)
    if (!procuradas.length) return true
    const doTexto = new Set(normalizar(texto).replace(/[^A-Z0-9 ]/g, ' ').split(' ').filter(Boolean))
    const achadas = procuradas.filter(palavra => [...doTexto].some(outra => outra === palavra || (palavra.length >= 3 && outra.startsWith(palavra)) || (outra.length >= 3 && palavra.startsWith(outra))))
    return achadas.length / procuradas.length >= 0.6
  }

  // Confere uma nota. ateste: item de lerAteste (ou null). Devolve o CNPJ do fornecedor pela nota, as
  // opções para escolher e os avisos: vermelho (precisa de "Continuar mesmo assim") ou amarelo (só aviso).
  // v0.17.3: naoLeu = o PDF da nota não abriu (erro ao baixar ou ler); antes isso aparecia como "imagem".
  function conferirNota (texto, ateste, { naoLeu = false } = {}) {
    const avisos = []
    const vermelho = mensagem => avisos.push({ nivel: 'vermelho', texto: mensagem })
    const amarelo = mensagem => avisos.push({ nivel: 'amarelo', texto: mensagem })
    const semTexto = notaSemTexto(texto)
    const daNota = semTexto ? [] : cnpjsDaNota(texto)
    const cnpj = daNota[0] || null
    const opcoes = [...new Set([cnpj, ateste && ateste.cnpj].filter(Boolean))]
    if (naoLeu) {
      amarelo('Não consegui ler a nota. Confira o CNPJ do fornecedor (botão "Ver a nota").')
      return { cnpj: ateste && ateste.cnpj ? ateste.cnpj : null, escolher: true, opcoes, avisos }
    }
    if (semTexto) {
      amarelo('A nota é uma imagem digitalizada. Confira o CNPJ do fornecedor (botão "Ver a nota").')
      return { cnpj: ateste && ateste.cnpj ? ateste.cnpj : null, escolher: true, opcoes, avisos }
    }
    // Tomador: Campus Palmas.
    const doIfto = acharCnpjs(texto).filter(ehDoIfto)
    if (!doIfto.includes(CNPJ_CAMPUS_PALMAS)) {
      if (doIfto.length) vermelho(`A nota é para outra unidade do IFTO (CNPJ ${formatarCnpj(doIfto[0])}), não para o Campus Palmas.`)
      else vermelho('A nota não tem o CNPJ do Campus Palmas (10.742.006/0003-50) como tomador.')
    }
    if (!cnpj) vermelho('Não achei o CNPJ do fornecedor na nota.')
    if (!ateste) {
      amarelo('Não achei o ateste desta nota (depois da última Folha de Encaminhamento).')
      return { cnpj, escolher: !cnpj, opcoes, avisos }
    }
    let escolher = !cnpj
    if (ateste.cnpj && cnpj && ateste.cnpj !== cnpj) {
      vermelho(`CNPJ diferente: nota ${formatarCnpj(cnpj)}, ateste ${formatarCnpj(ateste.cnpj)}.`)
      escolher = true
    }
    if (!ateste.cnpj) amarelo('O ateste não tem o CNPJ da empresa.')
    const numeros = numerosDoTexto(texto)
    const faltaNumero = ateste.notas.filter(numero => !numeros.has(numero))
    if (faltaNumero.length && ateste.notas.length === 1) vermelho(`Número da nota do ateste (${ateste.notas[0]}) não aparece na nota.`)
    if (ateste.notas.length > 1 && faltaNumero.length === ateste.notas.length) vermelho(`Nenhum número de nota do ateste (${ateste.notas.join(', ')}) aparece na nota.`)
    const valores = valoresDoTexto(texto)
    if (ateste.valores.length && !ateste.valores.some(valor => valores.has(valorLimpo(valor)))) vermelho(`Valor do ateste (R$ ${ateste.valores.join(', R$ ')}) não aparece na nota.`)
    const empenhosDaNota = empenhosDoTexto(texto)
    if (empenhosDaNota.length && ateste.empenhos.length && !ateste.empenhos.some(empenho => empenhosDaNota.includes(empenho))) {
      vermelho(`Empenho diferente: nota ${empenhosDaNota[0]}, ateste ${ateste.empenhos.join(', ')}.`)
    }
    if (ateste.empresa && !nomeNoTexto(ateste.empresa, texto)) amarelo(`Nome da empresa do ateste ("${ateste.empresa}") não aparece igual na nota.`)
    return { cnpj, escolher, opcoes, avisos }
  }

  // Um conjunto por fornecedor (CNPJ), na ordem das notas.
  function agruparPorFornecedor (notas) {
    const grupos = new Map()
    for (const nota of notas) {
      if (!nota.cnpj) continue
      if (!grupos.has(nota.cnpj)) grupos.set(nota.cnpj, { cnpj: nota.cnpj, nome: (nota.ateste && nota.ateste.empresa) || nota.fornecedor || '', notas: [] })
      grupos.get(nota.cnpj).notas.push(nota)
    }
    return [...grupos.values()]
  }

  // ---------- SICAF no Compras.gov.br (etapa 4) ----------
  // v0.13.0: endereços do SICAF e do Compras (acesso pedido só quando a opção é usada: permissão opcional).
  const URL_CONSULTA_SICAF = 'https://www3.comprasnet.gov.br/sicaf-web/private/geral/consultarSituacaoFornecedor.jsf'
  const URL_LOGIN_COMPRAS = 'https://comprasnet.gov.br/seguro/loginPortalUASG.asp'
  // v0.17.3: o SICAF só aceita quem chega pela Área de Trabalho (menu do usuário › SICAF); ir direto ao
  // endereço do SICAF logo depois do login dá "Sessão expirada".
  const URL_AREA_DE_TRABALHO = 'https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-area-trabalho-web/seguro/governo/area-trabalho'
  const ORIGENS_COMPRAS = Object.freeze(['*://www3.comprasnet.gov.br/*', '*://comprasnet.gov.br/*', '*://www.comprasnet.gov.br/*', '*://cnetmobile.estaleiro.serpro.gov.br/*'])

  // Que página do Compras/SICAF está aberta (pelo endereço).
  function paginaDoCompras (endereco) {
    let url
    try { url = new URL(endereco) } catch (erro) { return null }
    const caminho = url.pathname.toLowerCase()
    if (url.hostname === 'www3.comprasnet.gov.br' && caminho.startsWith('/sicaf-web/')) {
      if (/acessonegado/.test(caminho)) return 'acessoNegado'
      if (/consultarsituacaofornecedor/.test(caminho)) return 'consulta'
      if (caminho.startsWith('/sicaf-web/private/')) return 'sicaf'
      return 'sicafPublico'
    }
    if (/(^|\.)comprasnet\.gov\.br$/.test(url.hostname) && /loginportaluasg/.test(caminho)) return 'login'
    if (url.hostname === 'cnetmobile.estaleiro.serpro.gov.br' && /area-trabalho/.test(caminho)) return 'areaDeTrabalho'
    return null
  }

  // Nome do PDF como o SICAF dá (decisão D5): consultarSituacaoFornecedor_<CNPJ>_<aaaa-mm-dd>.pdf
  function nomeDoArquivo (cnpj, agora = new Date()) {
    const dois = n => String(n).padStart(2, '0')
    return `consultarSituacaoFornecedor_${soDigitos(cnpj)}_${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}.pdf`
  }

  // Linha do resultado da pesquisa: "14.159.957/0006-02 - HM COMERCIO … LTDA." → { cnpj, nome }
  function lerLinhaDoResultado (texto) {
    const achado = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s*-\s*(.+)/.exec(String(texto || '').replace(/\s+/g, ' ').trim())
    if (!achado) return null
    // v0.17.5: segurança se vier a linha inteira: o nome para antes da coluna "Relatórios".
    return { cnpj: soDigitos(achado[1]), nome: achado[2].split(/\s*Relatórios\b/)[0].trim() }
  }
  // PDF "Situação do Fornecedor": CNPJ e razão social.
  function lerPdfDoSicaf (texto) {
    const cnpj = (/CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/.exec(texto || '') || [])[1]
    const razao = (/Raz[aã]o Social:\s*(.+?)\s*(?:\n|Nome Fantasia|$)/.exec(texto || '') || [])[1]
    return { cnpj: cnpj ? soDigitos(cnpj) : null, razaoSocial: razao ? razao.trim() : '' }
  }

  // Arquivo entre a página do SICAF, a extensão e o SEI: em texto (base64).
  function paraBase64 (bytes) {
    const lista = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    let binario = ''
    for (let i = 0; i < lista.length; i += 0x8000) binario += String.fromCharCode.apply(null, lista.subarray(i, i + 0x8000))
    return btoa(binario)
  }
  function deBase64 (texto) {
    const binario = atob(texto || '')
    const lista = new Uint8Array(binario.length)
    for (let i = 0; i < binario.length; i++) lista[i] = binario.charCodeAt(i)
    return lista
  }

  // ---------- Inclusão no SEI (etapa 5) ----------
  // Decisão D3: "Sicaf <razão social do SICAF>" (sem o ponto final de "LTDA.").
  const nomeDoSicaf = nome => nomeNaArvore(String(nome || '').replace(/\.\s*$/, ''))
  // Decisão D7: "Anexo Instrumento de Cobrança NF nº 63 CHC SOLUÇOES EM SERV. E COM. LTDA".
  const nomeDoAnexo = (numero, fornecedor) => nomeNaArvore(`Instrumento de Cobrança NF nº ${numero || '?'} ${fornecedor || ''}`)

  // Documentos a incluir, na ordem: por fornecedor Sicaf (com o PDF) e Consulta; por nota um Anexo.
  // Só o Sicaf quando "soSicaf" (outras unidades, etapa 6). Notas com Anexo já feito ficam de fora.
  // v0.17.6 (pedido de 13/11/2026, um botão só): o que incluir depende do pedido. CGOC (notas): Sicaf com o
  // PDF, Consulta com o PDF do Simples Nacional ("Consulta Simples Nacional <nome>", fornecedor.nomeConsulta)
  // e um Anexo em branco por nota. Fora da CGOC: só o Sicaf ou só a Consulta, conforme o botão.
  function documentosParaIncluir (fornecedores, { sicaf = true, simples = true, anexo = true } = {}) {
    const itens = []
    for (const fornecedor of fornecedores || []) {
      if (sicaf && fornecedor.temPdf) itens.push({ tipo: 'Sicaf', nomeArvore: nomeDoSicaf(fornecedor.nomeNoSicaf || fornecedor.nome), cnpj: fornecedor.cnpj })
      if (simples && fornecedor.temSimples) itens.push({ tipo: 'Consulta', nomeArvore: fornecedor.nomeConsulta || '', cnpj: fornecedor.cnpj })
      if (!anexo) continue
      for (const nota of fornecedor.notas || []) {
        if (!nota.anexoFeito) itens.push({ tipo: 'Anexo', nomeArvore: nomeDoAnexo(nota.numero, nota.fornecedor), cnpj: fornecedor.cnpj, nota: nota.numero })
      }
    }
    return itens
  }

  // v0.16.0 (decidido em 13/11/2026): Sicaf, Consulta e Anexo em branco depois da última Folha (criados pelo
  // botão "Incluir Sicaf, Consulta e Anexo") são aproveitados, na ordem da árvore, em vez de criar outros.
  // Só os que ainda não têm nome ("Sicaf (3385629)"): um em branco já nomeado é de outra nota.
  function aproveitarEmBranco (itens, documentos) {
    const livres = trechoPendente(documentos).filter(doc => !doc.temArquivo && !doc.feitoNoSei && doc.linkAlterar && /^(Sicaf|Consulta|Anexo)\s*\(?\d+\)?$/i.test(String(doc.rotulo || '').trim()))
    return itens.map(item => {
      const posicao = livres.findIndex(doc => tipoNaArvore(doc.rotulo) === item.tipo.toLowerCase())
      if (posicao < 0) return item
      const [doc] = livres.splice(posicao, 1)
      return { ...item, emBranco: { id: doc.id, sei: numeroSei(doc.rotulo), linkAlterar: doc.linkAlterar } }
    })
  }

  // Envio do arquivo ao SEI ("Anexar Arquivo..."): o SEI responde "nome_upload#nome#tipo#tamanho#data_hora#"
  // (InfraUpload.js do SEI 5.0.4) ou "ERRO#mensagem".
  function lerRespostaDoUpload (texto) {
    const limpo = textoDoHtml(texto).replace(/\n/g, ' ').trim()
    const partes = limpo.split('#')
    if (partes[0] === 'ERRO') return { erro: partes[1] || 'O SEI não aceitou o arquivo.' }
    if (partes.length < 5) return { erro: 'O SEI não aceitou o arquivo.' }
    return { nomeUpload: partes[0], nome: partes[1], tipo: partes[2], tamanho: partes[3], dataHora: partes[4] }
  }
  // v0.17.3: endereço do "Anexar Arquivo..." do SEI. O formulário frmAnexos só ganha o endereço quando o
  // script do SEI roda (new infraUpload('frmAnexos','…')); lido sem abrir a tela, ele vem vazio (erro 404).
  function enderecoDoUpload (html) {
    const achado = /new\s+infraUpload\(\s*['"]frmAnexos['"]\s*,\s*['"]([^'"]+)['"]/.exec(html || '')
    if (achado) return achado[1].replace(/&amp;/g, '&')
    const formulario = /<form[^>]*id=["']frmAnexos["'][^>]*>/i.exec(html || '')
    const acao = formulario && /\saction=["']([^"']+)["']/i.exec(formulario[0])
    return acao ? acao[1].replace(/&amp;/g, '&') : null
  }
  // Usuário e unidade que a página do documento externo põe na tabela de anexos (funcaoConclusao do SEI).
  function lerUsuarioDoUpload (html) {
    const achado = /infraFormatarTamanhoBytes\(arr\['tamanho'\]\)\s*,\s*'([^']*)'\s*,\s*'([^']*)'/.exec(html || '')
    return achado ? { idUsuario: achado[1], sigla: achado[2] } : { idUsuario: '', sigla: '' }
  }
  // Tamanho como o SEI mostra na tabela (só aparece na tela; o SEI usa o nome_upload).
  function formatarTamanho (bytes) {
    const n = Number(bytes) || 0
    if (n < 1024) return n + ' bytes'
    if (n < 1048576) return Math.round(n / 1024) + ' Kb'
    return (n / 1048576).toFixed(2).replace('.', ',') + ' Mb'
  }
  // Linha do campo escondido hdnAnexos (infraTabelaDinamica: colunas separadas por "±").
  function linhaDoAnexo (upload, { idUsuario, sigla }) {
    const escapar = valor => String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return [upload.nomeUpload, upload.nome, upload.dataHora, upload.tamanho, formatarTamanho(upload.tamanho), idUsuario, sigla].map(escapar).join('±')
  }

  // "1 nota sem SICAF" / "2 notas sem SICAF"
  function textoDoAviso (quantidade) {
    // v0.17.6: o botão busca SICAF e Simples Nacional juntos.
    return quantidade === 1 ? '1 nota sem SICAF ou Simples' : `${quantidade} notas sem SICAF ou Simples`
  }

  const api = {
    UNIDADE_CGOC, CNPJ_CAMPUS_PALMAS, funcaoLigada, ehCgoc,
    soDigitos, raizDoCnpj, cnpjValido, formatarCnpj, ehDoIfto, cnpjMatriz, acharCnpjs, cnpjDaSelecao,
    normalizar, mesmoNumero, textoDoHtml, nomesParecidos,
    tipoNaArvore, numeroSei, lerRotuloDaNota, trechoPendente, lerAteste, situacaoDoProcesso, textoDoAviso,
    cnpjsDaNota, notaSemTexto, empenhosDoTexto, nomeNoTexto, conferirNota, agruparPorFornecedor,
    URL_CONSULTA_SICAF, URL_LOGIN_COMPRAS, URL_AREA_DE_TRABALHO, ORIGENS_COMPRAS, paginaDoCompras, nomeDoArquivo, lerLinhaDoResultado, lerPdfDoSicaf, paraBase64, deBase64,
    nomeNaArvore, nomeDoSicaf, nomeDoAnexo, documentosParaIncluir, aproveitarEmBranco, lerRespostaDoUpload, enderecoDoUpload, lerUsuarioDoUpload, formatarTamanho, linhaDoAnexo
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { sicaf: api })
})(globalThis)
