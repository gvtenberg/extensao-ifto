// v0.26.0 (spec conferir-documento): conferir o documento do SEI (número do processo, timbre, rodapé) e os
// dados das unidades da pessoa ("Minhas unidades" nas configurações). Regras puras: rodam no navegador e no Node.
(function (raiz) {
  const sohTexto = valor => String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim()

  // Sigla do SEI em maiúsculas e sem espaços ("cgoc / pal/rei/ifto" → "CGOC/PAL/REI/IFTO").
  function siglaDaUnidade (sigla) {
    return String(sigla || '').replace(/\s+/g, '').toUpperCase()
  }

  // Unidade do Campus Palmas: sigla com "/PAL/" (D5) ou a própria "PAL/REI/IFTO".
  function ehUnidadePalmas (sigla) {
    const limpa = siglaDaUnidade(sigla)
    return limpa.includes('/PAL/') || limpa.startsWith('PAL/')
  }

  // Unidade como foi digitada → unidade guardada: sigla limpa, telefone e e-mail sem espaços nas pontas,
  // linhas do setor sem linhas vazias.
  function limparUnidade (unidade) {
    const u = unidade || {}
    const linhas = Array.isArray(u.linhas) ? u.linhas : String(u.linhas || '').split('\n')
    return {
      sigla: siglaDaUnidade(u.sigla),
      telefone: sohTexto(u.telefone),
      email: sohTexto(u.email).toLowerCase(),
      linhas: linhas.map(sohTexto).filter(Boolean)
    }
  }

  // Lista guardada: só unidades com sigla, sem repetir a sigla (fica a última digitada).
  function limparUnidades (unidades) {
    const porSigla = new Map()
    for (const unidade of Array.isArray(unidades) ? unidades : []) {
      const limpa = limparUnidade(unidade)
      if (limpa.sigla) porSigla.set(limpa.sigla, limpa)
    }
    return [...porSigla.values()]
  }

  function acharUnidade (unidades, sigla) {
    const procurada = siglaDaUnidade(sigla)
    return limparUnidades(unidades).find(u => u.sigla === procurada) || null
  }

  // ---- v0.26.2: número do processo (D6, D13, D17) ----
  const ENTIDADES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', ordm: 'º', ordf: 'ª', deg: '°', ndash: '–', mdash: '—', ccedil: 'ç', Ccedil: 'Ç' }
  for (const [letra, acentos] of Object.entries({ a: 'áàâãä', e: 'éèê-ë', i: 'íìî-ï', o: 'óòôõö', u: 'úùû-ü' })) {
    ;['acute', 'grave', 'circ', 'tilde', 'uml'].forEach((nome, i) => {
      if (!acentos[i] || acentos[i] === '-') return
      ENTIDADES[letra + nome] = acentos[i]
      ENTIDADES[letra.toUpperCase() + nome] = acentos[i].toUpperCase()
    })
  }
  // Texto de um pedaço de HTML (sem tags, entidades trocadas, sem caracteres invisíveis, espaços juntados).
  function textoDoHtml (html) {
    return String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&([a-z]+);/gi, (tudo, nome) => nome in ENTIDADES ? ENTIDADES[nome] : tudo)
      .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // NUP: 23236.023147/2026-57 (pontos, barra e traço podem faltar).
  const NUMERO = /(\d{5})\s*\.?\s*(\d{6})\s*\/?\s*(\d{4})\s*-?\s*(\d{2})(?!\d)/
  const soDigitos = texto => String(texto || '').replace(/\D/g, '')
  function formatarProcesso (numero) {
    const d = soDigitos(numero)
    return d.length === 17 ? `${d.slice(0, 5)}.${d.slice(5, 11)}/${d.slice(11, 15)}-${d.slice(15)}` : String(numero || '')
  }
  const mesmoProcesso = (a, b) => soDigitos(a) !== '' && soDigitos(a) === soDigitos(b)

  // Processo em que o documento está: a linha "Referência: Processo nº …" que o SEI põe embaixo do documento
  // (na página do documento e numa seção travada do editor).
  function processoDaReferencia (secoes) {
    for (const secao of secoes || []) {
      const achado = textoDoHtml(secao.html).match(new RegExp('Refer[êe]ncia:?\\s*Processo\\s+n\\S{0,2}\\s*' + NUMERO.source, 'i'))
      if (achado) return formatarProcesso(achado.slice(1, 5).join(''))
    }
    return ''
  }

  // Linha de identificação do alto: "Processo nº: …" (Despacho, Memorando…) ou, no título do Edital e da
  // Minuta, "(Processo Administrativo n° …)". Só os primeiros parágrafos contam (o corpo pode citar outros
  // processos de propósito).
  const LINHA = /^\(?\s*Processo\s+(?:Administrativo\s+)?n\s*[º°o.]?\s*\.?\s*:?\s*/i
  const PARAGRAFOS_DO_ALTO = 20
  function linhaDoProcesso (secoes) {
    let contados = 0
    for (const secao of secoes || []) {
      for (const achado of String(secao.html || '').matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
        const texto = textoDoHtml(achado[0])
        if (!texto) continue
        if (++contados > PARAGRAFOS_DO_ALTO) return null
        const inicio = texto.match(LINHA)
        if (!inicio) continue
        const numero = texto.slice(inicio[0].length).match(NUMERO)
        if (!numero || numero.index > 3) continue
        return {
          secao: secao.nome,
          editavel: secao.editavel !== false,
          numero: formatarProcesso(numero.slice(1, 5).join('')),
          // D17: no Edital o número é um link do SEI: só avisa, sem botão de correção.
          link: /<a\b[^>]*ancora_sei|<a\b/i.test(achado[0]),
          texto
        }
      }
    }
    return null
  }

  // Confere: null quando não há o que conferir (sem a linha ou sem a referência, como no Ofício).
  function conferirProcesso (secoes) {
    const processo = processoDaReferencia(secoes)
    const linha = linhaDoProcesso(secoes)
    if (!processo || !linha) return null
    return { certo: mesmoProcesso(processo, linha.numero), processo, escrito: linha.numero, secao: linha.secao, editavel: linha.editavel, link: linha.link }
  }

  function avisoDoProcesso (conferido) {
    return `O documento está no processo ${conferido.processo}, mas o texto diz ${conferido.escrito}.`
  }

  // v0.26.3 (D2): pergunta antes de assinar.
  function perguntaAntesDeAssinar (conferido) {
    return `O número do processo está errado (documento no processo ${conferido.processo}, texto diz ${conferido.escrito}). Assinar mesmo assim?`
  }

  // ---- v0.26.5: timbre e rodapé (unidades do Campus Palmas; D3, D4, D11, D12, D14) ----
  const TIMBRE_FIXO = Object.freeze(['Ministério da Educação', 'Secretaria de Educação Profissional e Tecnológica', 'Instituto Federal de Educação, Ciência e Tecnologia do Tocantins', 'Campus Palmas'])
  // D14: Gabinete (PAL/REI/IFTO) sem cadastro em "Minhas unidades".
  const LINHAS_DO_GABINETE = Object.freeze(['Gabinete da Direção-Geral'])
  const TELEFONE_PADRAO = '6332364000'
  const EMAIL_PADRAO = 'palmas@ifto.edu.br'
  const comparavel = texto => sohTexto(texto).replace(/[\u200b-\u200d\u2060\ufeff]/g, '').toLowerCase()
  const mesmaLinha = (a, b) => comparavel(a) === comparavel(b)
  const ehReitoria = linha => comparavel(linha) === 'reitoria'
  const paragrafos = html => [...String(html || '').matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)]
  const classeDe = atributos => (/class\s*=\s*"([^"]*)"/i.exec(atributos) || [])[1] || ''
  const ehDoTimbre = classe => /^IFTO_Cabe(ç|&ccedil;)alho/i.test(classe)
  const ehDoRodape = classe => /rodape/i.test(classe)

  // Linhas do timbre (texto), na ordem; a do brasão (sem texto) fica de fora.
  function linhasDoTimbre (secoes) {
    const linhas = []
    for (const secao of secoes || []) {
      for (const [, atributos, dentro] of paragrafos(secao.html)) {
        if (!ehDoTimbre(classeDe(atributos))) continue
        const texto = textoDoHtml(dentro)
        if (texto) linhas.push(texto)
      }
    }
    return linhas
  }

  // Seção (do editor) que tem o timbre ou o rodapé.
  function secaoCom (secoes, eh) {
    return (secoes || []).find(secao => paragrafos(secao.html).some(([, atributos]) => eh(classeDe(atributos)))) || null
  }

  // Linhas que o timbre deve ter: as fixas e as do setor da unidade. Unidade sem cadastro: as fixas e as
  // outras linhas que já estão lá (sem "Reitoria", D12), porque não dá para saber as do setor.
  function timbreEsperado (linhas, unidade, sigla) {
    if (unidade && unidade.linhas && unidade.linhas.length) return [...TIMBRE_FIXO, ...unidade.linhas]
    if (siglaDaUnidade(sigla) === 'PAL/REI/IFTO') return [...TIMBRE_FIXO, ...LINHAS_DO_GABINETE]
    const outras = (linhas || []).filter(linha => !ehReitoria(linha) && !TIMBRE_FIXO.some(fixa => mesmaLinha(fixa, linha)))
    return [...TIMBRE_FIXO, ...outras]
  }

  // Confere o timbre: null se o documento não tem timbre. Devolve { certo, faltam, sobram, foraDeOrdem, esperado }.
  function conferirTimbre (secoes, unidade, sigla) {
    const linhas = linhasDoTimbre(secoes)
    if (!linhas.length) return null
    const esperado = timbreEsperado(linhas, unidade, sigla)
    const faltam = esperado.filter(linha => !linhas.some(outra => mesmaLinha(outra, linha)))
    const sobram = linhas.filter(linha => !esperado.some(outra => mesmaLinha(outra, linha)))
    const igual = linhas.length === esperado.length && linhas.every((linha, i) => mesmaLinha(linha, esperado[i]))
    return { certo: igual, faltam, sobram, foraDeOrdem: !igual && !faltam.length && !sobram.length, esperado }
  }

  function avisosDoTimbre (conferido) {
    const avisos = []
    for (const linha of conferido.faltam) avisos.push(`Falta a linha "${linha}".`)
    for (const linha of conferido.sobram) avisos.push(`A linha "${linha}" não é desta unidade.`)
    if (conferido.foraDeOrdem) avisos.push('As linhas estão fora de ordem.')
    return avisos
  }

  const escaparHtml = texto => String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  // Timbre corrigido: o parágrafo do brasão fica; as linhas de texto viram as esperadas, com a mesma classe.
  function corrigirTimbre (html, esperado) {
    const lista = paragrafos(html).filter(([, atributos]) => ehDoTimbre(classeDe(atributos)))
    const comTexto = lista.filter(([, , dentro]) => textoDoHtml(dentro))
    if (!comTexto.length) return null
    const atributos = comTexto[0][1]
    const novas = esperado.map(linha => `<p${atributos}>${escaparHtml(linha)}</p>`).join('')
    let posto = false
    const novo = String(html).replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (tudo, attrs, dentro) => {
      if (!ehDoTimbre(classeDe(attrs)) || !textoDoHtml(dentro)) return tudo
      if (posto) return ''
      posto = true
      return novas
    })
    return novo
  }

  // Telefone: só os dígitos, sem o 55 do país.
  const digitosDoTelefone = texto => soDigitos(texto).replace(/^55(?=\d{10,11}$)/, '')
  function formatarTelefone (texto) {
    const d = digitosDoTelefone(texto)
    return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}` : d.length === 11 ? `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}` : sohTexto(texto)
  }
  function dadosDoRodape (unidade) {
    const telefone = digitosDoTelefone(unidade && unidade.telefone) || TELEFONE_PADRAO
    const email = (unidade && unidade.email) || EMAIL_PADRAO
    return { telefone, email: email.toLowerCase(), cep: '77021090' }
  }
  const PARTES_DO_ENDERECO = Object.freeze(['Quadra 310 Sul', 'Lo 5', 'Avenida NS 10', 'Plano Diretor Sul', 'Palmas/TO'])

  // Confere o rodapé só pelos dados (D11): endereço, CEP, telefone e e-mail; pontos, parênteses, "esquina
  // com a" e o site antigo não contam. null se o documento não tem rodapé.
  function conferirRodape (secoes, unidade) {
    const secao = secaoCom(secoes, ehDoRodape)
    if (!secao) return null
    const texto = paragrafos(secao.html).filter(([, atributos]) => ehDoRodape(classeDe(atributos))).map(([, , dentro]) => textoDoHtml(dentro)).join(' ')
    const esperado = dadosDoRodape(unidade)
    const avisos = []
    for (const parte of PARTES_DO_ENDERECO) {
      if (!comparavel(texto).includes(comparavel(parte))) avisos.push(`Falta "${parte}" no endereço.`)
    }
    const cep = texto.match(/CEP\s*([\d.\-\s]{8,11})/i)
    if (!cep || soDigitos(cep[1]) !== esperado.cep) avisos.push('O CEP deve ser 77021-090.')
    const telefones = [...texto.matchAll(/(?:\+?55\s*)?\(?\d{2}\)?\s*\d{4,5}\s*-?\s*\d{4}/g)].map(achado => digitosDoTelefone(achado[0]))
    if (!telefones.length) avisos.push(`Falta o telefone ${formatarTelefone(esperado.telefone)}.`)
    for (const telefone of new Set(telefones)) {
      if (telefone !== esperado.telefone) avisos.push(`Telefone ${formatarTelefone(telefone)}: o certo é ${formatarTelefone(esperado.telefone)}.`)
    }
    const emails = [...texto.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)].map(achado => achado[0].toLowerCase())
    if (!emails.length) avisos.push(`Falta o e-mail ${esperado.email}.`)
    for (const email of new Set(emails)) {
      if (email !== esperado.email) avisos.push(`E-mail ${email}: o certo é ${esperado.email}.`)
    }
    return { certo: !avisos.length, avisos, secao: secao.nome, editavel: secao.editavel !== false }
  }

  // Rodapé no texto do D4, com os links (e-mail, site e telefone). Mantém a classe e o estilo do parágrafo.
  function rodapeEsperado (unidade, atributos = ' class="IFTO_Centralizado_rodape"') {
    const { telefone, email } = dadosDoRodape(unidade)
    return `<p${atributos}>Quadra 310 Sul, Lo 5, s/n, esquina com a Avenida NS 10 - Plano Diretor Sul — CEP 77021-090<br>` +
      `Palmas/TO — <a href="tel:+55${telefone}">${formatarTelefone(telefone)}</a><br>` +
      `<a href="https://palmas.ifto.edu.br">palmas.ifto.edu.br</a> — <a href="mailto:${escaparHtml(email)}">${escaparHtml(email)}</a></p>`
  }
  function corrigirRodape (html, unidade) {
    const lista = paragrafos(html).filter(([, atributos]) => ehDoRodape(classeDe(atributos)))
    if (!lista.length) return null
    let posto = false
    return String(html).replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (tudo, attrs) => {
      if (!ehDoRodape(classeDe(attrs))) return tudo
      if (posto) return ''
      posto = true
      return rodapeEsperado(unidade, attrs)
    })
  }

  // "Usar este timbre como padrão da unidade" (D3): linhas do setor = as do timbre depois das fixas (sem
  // "Reitoria").
  function linhasDoSetor (secoes) {
    return linhasDoTimbre(secoes).filter(linha => !ehReitoria(linha) && !TIMBRE_FIXO.some(fixa => mesmaLinha(fixa, linha)))
  }

  // v0.26.6 (D2): Bloco de assinatura. A página "Documentos do Bloco" guarda o endereço de cada documento
  // num script (arrLinkDocumento[0]="controlador.php?acao=documento_visualizar&id_documento=…").
  function documentosDoBloco (html) {
    const documentos = []
    for (const achado of String(html || '').matchAll(/arrLinkDocumento\[\d+\]\s*=\s*"([^"]*acao=documento_visualizar[^"]*)"/g)) {
      const link = achado[1].replace(/&amp;/g, '&')
      const id = (/[?&]id_documento=(\d+)/.exec(link) || [])[1]
      if (id) documentos.push({ id, link })
    }
    return documentos
  }
  // Número interno do documento no valor da caixa de seleção ou no acaoAssinar('3533633-173213').
  const idDoItemDoBloco = valor => (/(\d+)-\d+/.exec(String(valor || '')) || [])[1] || ''

  // v0.26.4: número SEI do documento ("SEI nº 3390347", na linha da referência).
  function numeroSeiDoDocumento (html) {
    const achado = textoDoHtml(html).match(/SEI\s*n\s*[º°o]?\s*(\d{5,})/i)
    return achado ? achado[1] : ''
  }

  // v0.26.4: documentos que a pessoa mandou "Assinar mesmo assim" na janela da lista de assinaturas: valem só
  // no dia (guardado: { dia: 'aaaa-mm-dd', numeros: [...] }).
  const diaDe = data => [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-')
  function aceitar (guardado, numeros, hoje) {
    const dia = diaDe(hoje)
    const antes = guardado && guardado.dia === dia ? guardado.numeros : []
    return { dia, numeros: [...new Set([...antes, ...numeros.map(String)])] }
  }
  const foiAceito = (guardado, numero, hoje) => Boolean(numero) && Boolean(guardado) && guardado.dia === diaDe(hoje) && guardado.numeros.includes(String(numero))

  // Troca só o número na linha "Processo nº:" da seção (primeiro parágrafo que bate). null se não deu.
  function corrigirProcesso (html, processoCerto) {
    let trocado = false
    const novo = String(html || '').replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, paragrafo => {
      if (trocado || !LINHA.test(textoDoHtml(paragrafo))) return paragrafo
      const comNumero = paragrafo.replace(new RegExp(NUMERO.source), () => { trocado = true; return formatarProcesso(processoCerto) })
      return comNumero
    })
    return trocado ? novo : null
  }

  // Documento já assinado: a página do documento mostra "Documento assinado eletronicamente por".
  const estaAssinado = html => /assinado\s+eletronicamente\s+por/i.test(textoDoHtml(html))

  const api = { siglaDaUnidade, ehUnidadePalmas, limparUnidade, limparUnidades, acharUnidade, textoDoHtml, formatarProcesso, mesmoProcesso, processoDaReferencia, linhaDoProcesso, conferirProcesso, avisoDoProcesso, perguntaAntesDeAssinar, corrigirProcesso, estaAssinado, numeroSeiDoDocumento, aceitar, foiAceito, documentosDoBloco, idDoItemDoBloco, TIMBRE_FIXO, linhasDoTimbre, timbreEsperado, conferirTimbre, avisosDoTimbre, corrigirTimbre, secaoCom, ehDoTimbre, ehDoRodape, formatarTelefone, conferirRodape, rodapeEsperado, corrigirRodape, linhasDoSetor }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { conferirDocumento: api })
})(globalThis)
