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
  // v0.33.0: também "Processo:" sem o "nº" (Capa de Processo).
  const LINHA = /^\(?\s*Processo\s*(?:Administrativo\s+)?(?:n\s*[º°o.]?\s*\.?\s*)?:?\s*/i
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

  // v0.26.3 (D2): pergunta antes de assinar. v0.26.9 (etapa 8): recebe a lista de problemas do documento
  // (número do processo e data), mostrados como linhas na janela.
  function perguntaAntesDeAssinar (problemas) {
    return (problemas.length === 1 ? 'Este documento tem uma possível divergência.' : 'Este documento tem possíveis divergências.') + ' Assinar mesmo assim?'
  }
  const fraseDoProcesso = conferido => `Número do processo: o documento está no processo ${conferido.processo}, mas o texto diz ${conferido.escrito}.`

  // v0.35.2: alguma conferência ligada pode parar a assinatura.
  const confereAoAssinar = opcoes => Boolean(opcoes.conferirProcesso || opcoes.conferirData || opcoes.conferirCargo)

  // v0.26.9 (etapa 8): o que para a assinatura de um documento (frases; lista vazia = nada errado): número do
  // processo e data errada (mês ou ano, dia que não chegou). Data só fora do padrão não para; documento já
  // assinado por alguém não tem nada conferido (v0.34.2, pedido do usuário; antes, só a data ficava de fora).
  const regrasDaData = () => typeof module !== 'undefined' && module.exports ? require('./data-documento.js') : (raiz.ExtensaoIFTO || {}).dataDocumento
  // v0.35.2: e o cargo da diretora-geral (sigla: unidade aberta no SEI).
  function problemasParaAssinar (html, opcoes = {}, hoje = new Date(), sigla = '') {
    if (estaAssinado(html)) return []
    const secoes = [{ nome: 'pagina', html }]
    const problemas = []
    const processo = opcoes.conferirProcesso ? conferirProcesso(secoes) : null
    if (processo && !processo.certo) problemas.push(fraseDoProcesso(processo))
    const datas = regrasDaData()
    const data = opcoes.conferirData && datas ? datas.conferirData(secoes, hoje) : null
    if (data && data.errada) problemas.push(datas.fraseAntesDeAssinar(data))
    const cargo = opcoes.conferirCargo ? conferirCargo(secoes, sigla, opcoes.cargosPorUnidade) : null
    if (cargo && !cargo.certo) problemas.push(fraseDoCargo(cargo))
    return problemas
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

  // v0.34.2 (pedido do usuário): a linha "Reitoria" no timbre não é divergência (antes era, D12): fica onde a
  // pessoa a pôs, depois da linha que já estava acima dela.
  function comReitoria (esperado, linhas) {
    const novo = esperado.filter(linha => !ehReitoria(linha))
    linhas.forEach((linha, i) => {
      if (!ehReitoria(linha)) return
      const acima = linhas.slice(0, i).reverse().find(outra => novo.some(certa => mesmaLinha(certa, outra)))
      const lugar = acima === undefined ? 0 : novo.length - [...novo].reverse().findIndex(certa => mesmaLinha(certa, acima))
      novo.splice(lugar, 0, 'Reitoria')
    })
    return novo
  }

  // Linhas que o timbre deve ter: as fixas e as do setor da unidade. Unidade sem cadastro: as fixas e as
  // outras linhas que já estão lá (sem "Reitoria", D12), porque não dá para saber as do setor.
  function timbreEsperado (linhas, unidade, sigla) {
    if (unidade && unidade.linhas && unidade.linhas.length) return [...TIMBRE_FIXO, ...unidade.linhas]
    if (siglaDaUnidade(sigla) === 'PAL/REI/IFTO') return [...TIMBRE_FIXO, ...LINHAS_DO_GABINETE]
    const outras = (linhas || []).filter(linha => !ehReitoria(linha) && !TIMBRE_FIXO.some(fixa => mesmaLinha(fixa, linha)))
    return [...TIMBRE_FIXO, ...outras]
  }

  // v0.33.0 (pedido do usuário, 19/11/2026): cada palavra do timbre começa com letra maiúscula ("Gestão
  // Orçamentária"), menos as palavras de ligação (de, da, e…) e a letra logo depois de um hífen (depende da
  // classe da palavra: pode ser maiúscula ou minúscula).
  const LIGACOES = new Set(['a', 'à', 'ao', 'aos', 'as', 'às', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'sem', 'sob'])
  function comMaiusculas (linha) {
    let primeira = true
    return String(linha).replace(/(^|[\s(/])([a-zà-ÿ][\p{L}]*)/gu, (tudo, antes, palavra, posicao) => {
      const inicio = primeira && !String(linha).slice(0, posicao).trim()
      primeira = false
      if (!inicio && LIGACOES.has(palavra)) return tudo
      return antes + palavra[0].toUpperCase() + palavra.slice(1)
    })
  }

  // v0.33.0: parágrafos do timbre com linha a mais: em branco (sem texto nem brasão) ou com quebra de linha
  // dentro (<br>), que deixam espaço vazio no cabeçalho.
  function linhasVaziasDoTimbre (secoes) {
    let vazias = 0
    for (const secao of secoes || []) {
      for (const [, atributos, dentro] of paragrafos(secao.html)) {
        if (!ehDoTimbre(classeDe(atributos))) continue
        if (/<img\b/i.test(dentro)) continue
        if (!textoDoHtml(dentro).replace(/[\u200b-\u200d\u2060\ufeff\s]/g, '')) vazias++
        else vazias += (dentro.match(/<br\b[^>]*>/gi) || []).length
      }
    }
    return vazias
  }

  // Confere o timbre: null se o documento não tem timbre. Devolve { certo, faltam, sobram, foraDeOrdem,
  // minusculas (linhas com palavra em minúscula: { escrito, certo }), vazias (nº de linhas a mais), esperado }.
  function conferirTimbre (secoes, unidade, sigla) {
    const linhas = linhasDoTimbre(secoes)
    if (!linhas.length) return null
    const esperado = comReitoria(timbreEsperado(linhas, unidade, sigla), linhas).map(comMaiusculas)
    const faltam = esperado.filter(linha => !linhas.some(outra => mesmaLinha(outra, linha)))
    const sobram = linhas.filter(linha => !esperado.some(outra => mesmaLinha(outra, linha)))
    const igual = linhas.length === esperado.length && linhas.every((linha, i) => mesmaLinha(linha, esperado[i]))
    const minusculas = linhas.filter(linha => comMaiusculas(sohTexto(linha)) !== sohTexto(linha) && esperado.some(outra => mesmaLinha(outra, linha)))
      .map(linha => ({ escrito: sohTexto(linha), certo: comMaiusculas(sohTexto(linha)) }))
    const vazias = linhasVaziasDoTimbre(secoes)
    return { certo: igual && !minusculas.length && !vazias, faltam, sobram, foraDeOrdem: !igual && !faltam.length && !sobram.length, minusculas, vazias, esperado }
  }

  function avisosDoTimbre (conferido) {
    const avisos = []
    for (const linha of conferido.faltam) avisos.push(`Falta a linha "${linha}".`)
    for (const linha of conferido.sobram) avisos.push(`A linha "${linha}" não é desta unidade.`)
    if (conferido.foraDeOrdem) avisos.push('As linhas estão fora de ordem.')
    for (const linha of conferido.minusculas || []) avisos.push(`A linha "${linha.escrito}" deve ser "${linha.certo}".`)
    if (conferido.vazias) avisos.push(conferido.vazias === 1 ? 'O timbre tem uma linha em branco a mais.' : `O timbre tem ${conferido.vazias} linhas em branco a mais.`)
    return avisos
  }

  const escaparHtml = texto => String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  // Timbre corrigido: o parágrafo do brasão fica; as linhas de texto viram as esperadas, com a mesma classe
  // (v0.35.2: "Campus" em itálico).
  function corrigirTimbre (html, esperado) {
    const lista = paragrafos(html).filter(([, atributos]) => ehDoTimbre(classeDe(atributos)))
    const comTexto = lista.filter(([, , dentro]) => textoDoHtml(dentro))
    if (!comTexto.length) return null
    const atributos = comTexto[0][1]
    const novas = esperado.map(linha => `<p${atributos}>${porItalico(escaparHtml(linha))}</p>`).join('')
    let posto = false
    const novo = String(html).replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (tudo, attrs, dentro) => {
      if (!ehDoTimbre(classeDe(attrs))) return tudo
      // v0.33.0: linha em branco do timbre (sem o brasão) sai.
      if (!textoDoHtml(dentro).replace(/[\u200b-\u200d\u2060\ufeff\s]/g, '')) return /<img\b/i.test(dentro) ? tudo : ''
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
    if (d.length === 10) return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`
    if (d.length === 11) return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`
    return sohTexto(texto)
  }
  function dadosDoRodape (unidade) {
    const telefone = digitosDoTelefone(unidade && unidade.telefone) || TELEFONE_PADRAO
    const email = (unidade && unidade.email) || EMAIL_PADRAO
    return { telefone, email: email.toLowerCase(), cep: '77021090' }
  }
  const temTelefone = unidade => Boolean(digitosDoTelefone(unidade && unidade.telefone))
  const temEmail = unidade => Boolean(unidade && unidade.email)
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
    // v0.26.7 (T142): sem telefone cadastrado, qualquer ramal do campus (63 3236-4000 a 4099) está certo.
    const telefoneAceito = telefone => telefone === esperado.telefone || (!temTelefone(unidade) && /^63323640\d\d$/.test(telefone))
    for (const telefone of new Set(telefones)) {
      if (!telefoneAceito(telefone)) avisos.push(`Telefone ${formatarTelefone(telefone)}: o certo é ${formatarTelefone(esperado.telefone)}.`)
    }
    const emails = [...texto.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)].map(achado => achado[0].toLowerCase())
    if (!emails.length) avisos.push(`Falta o e-mail ${esperado.email}.`)
    // v0.26.7 (T142): sem e-mail cadastrado, qualquer e-mail do campus (palmas@ ou setor.palmas@ifto.edu.br) está certo.
    const emailAceito = email => email === esperado.email || (!temEmail(unidade) && /^([\w.+-]+\.)?palmas@ifto\.edu\.br$/.test(email))
    for (const email of new Set(emails)) {
      if (!emailAceito(email)) avisos.push(`E-mail ${email}: o certo é ${esperado.email}.`)
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
  // Telefone (só dígitos) e e-mail do campus que estão no rodapé ('' quando não há).
  function contatoDoCampus (html) {
    const texto = paragrafos(html).filter(([, atributos]) => ehDoRodape(classeDe(atributos))).map(([, , dentro]) => textoDoHtml(dentro)).join(' ')
    const telefone = [...texto.matchAll(/(?:\+?55\s*)?\(?\d{2}\)?\s*\d{4,5}\s*-?\s*\d{4}/g)].map(a => digitosDoTelefone(a[0])).find(t => /^63323640\d\d$/.test(t))
    const email = [...texto.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)].map(a => a[0].toLowerCase()).find(e => /^([\w.+-]+\.)?palmas@ifto\.edu\.br$/.test(e))
    return { telefone: telefone || '', email: email || '' }
  }
  function corrigirRodape (html, unidade) {
    const lista = paragrafos(html).filter(([, atributos]) => ehDoRodape(classeDe(atributos)))
    if (!lista.length) return null
    // v0.26.7 (T142): sem cadastro, mantém o telefone e o e-mail do campus que já estão no rodapé.
    const doCampus = contatoDoCampus(html)
    const telefoneDoCampus = !temTelefone(unidade) && doCampus.telefone
    const emailDoCampus = !temEmail(unidade) && doCampus.email
    if (telefoneDoCampus || emailDoCampus) unidade = { ...(unidade || {}), telefone: (unidade && unidade.telefone) || telefoneDoCampus || '', email: (unidade && unidade.email) || emailDoCampus || '' }
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

  // v0.35.3 (pedido do usuário, 24/11/2026): o que este documento tem e a unidade ainda não tem guardado em
  // "Minhas unidades": linhas do setor, telefone e e-mail do campus. null quando não há nada a sugerir.
  function sugerirUnidade (secoes, unidade, { timbre = true, rodape = true } = {}) {
    const sugestao = {}
    if (timbre && !(unidade && unidade.linhas && unidade.linhas.length)) {
      const linhas = linhasDoSetor(secoes).map(comMaiusculas)
      if (linhas.length) sugestao.linhas = linhas
    }
    const secao = rodape && secaoCom(secoes, ehDoRodape)
    if (secao) {
      const { telefone, email } = contatoDoCampus(secao.html)
      if (telefone && !temTelefone(unidade)) sugestao.telefone = formatarTelefone(telefone)
      if (email && !temEmail(unidade)) sugestao.email = email
    }
    return Object.keys(sugestao).length ? sugestao : null
  }
  function linhasDaSugestao (sugestao) {
    const itens = (sugestao.linhas || []).map(linha => `Timbre: ${linha}`)
    if (sugestao.telefone) itens.push(`Telefone do rodapé: ${sugestao.telefone}`)
    if (sugestao.email) itens.push(`E-mail do rodapé: ${sugestao.email}`)
    return itens
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

  // ---- v0.35.2: "Campus" e "Campi" em itálico (toda unidade) ----
  // Só texto em maiúsculas fica de fora (decisão do usuário, 24/11/2026): timbre e nomes de evento contam.
  // Também ficam de fora e-mails e endereços de internet.
  const PEDACOS = /<!--[\s\S]*?-->|<(style|script)\b[\s\S]*?<\/\1\s*>|<[^>]+>|[^<]+/gi
  const SEM_FIM = /^(br|img|hr|input|col|wbr|meta|link|source)$/i
  const PALAVRA = /(?<![\p{L}\p{N}_])(?:campus|campi)(?![\p{L}\p{N}_])/giu
  const estiloDe = atributos => (/\sstyle\s*=\s*"([^"]*)"/i.exec(atributos) || /\sstyle\s*=\s*'([^']*)'/i.exec(atributos) || [])[1] || ''

  // Percorre o HTML chamando aoTexto(texto, { italico, maiusculas }); o que ela devolve fica no lugar do texto.
  function percorrerTexto (html, aoTexto) {
    const abertas = []
    return String(html || '').replace(PEDACOS, pedaco => {
      const agora = abertas[abertas.length - 1] || { italico: false, maiusculas: false }
      if (pedaco[0] !== '<') return aoTexto(pedaco, agora)
      const marca = /^<(\/?)([a-z][\w-]*)([\s\S]*?)(\/?)>$/i.exec(pedaco)
      if (!marca || /^<(style|script)\b/i.test(pedaco)) return pedaco
      const nome = marca[2].toLowerCase()
      if (marca[1]) {
        const onde = abertas.map(aberta => aberta.nome).lastIndexOf(nome)
        if (onde >= 0) abertas.length = onde
      } else if (!marca[4] && !SEM_FIM.test(nome)) {
        const estilo = estiloDe(marca[3])
        const fonte = (/(?:^|;)\s*font-style\s*:\s*(\w+)/i.exec(estilo) || [])[1]
        // O SEI mostra a citação (blockquote) toda em itálico.
        const italico = fonte ? /italic|oblique/i.test(fonte) : /^(i|em|blockquote)$/.test(nome) || agora.italico
        const caixa = (/(?:^|;)\s*text-transform\s*:\s*(\w+)/i.exec(estilo) || [])[1]
        const classe = /mai(ú|&uacute;|u)sculas/i.test((/\sclass\s*=\s*["']([^"']*)/i.exec(marca[3]) || [])[1] || '')
        const maiusculas = caixa ? /uppercase/i.test(caixa) : classe || agora.maiusculas
        abertas.push({ nome, italico, maiusculas })
      }
      return pedaco
    })
  }

  // Troca cada "Campus"/"Campi" que deveria estar em itálico pelo que aoAchar devolver.
  function semItalico (html, aoAchar) {
    return percorrerTexto(html, (texto, { italico, maiusculas }) => {
      if (italico || maiusculas) return texto
      return texto.replace(PALAVRA, (palavra, posicao) => {
        if (palavra === palavra.toUpperCase()) return palavra
        const antes = texto.slice(0, posicao).split(/\s|&nbsp;| /).pop()
        const depois = texto.slice(posicao + palavra.length).split(/\s|&nbsp;| /)[0]
        if (/@|:\/\/|www\.|\.(br|com|org|net)\b/i.test(antes + palavra + depois)) return palavra
        return aoAchar(palavra)
      })
    })
  }
  const porItalico = html => semItalico(html, palavra => `<i>${palavra}</i>`)

  // { certo, quantos, trechos (até 3), travados (em partes que o editor não deixa mudar) }
  function conferirItalico (secoes) {
    let quantos = 0
    let travados = 0
    const trechos = []
    for (const secao of secoes || []) {
      // Marca as palavras com caracteres de uso privado, para mostrar o trecho em volta delas.
      const marcado = textoDoHtml(semItalico(secao.html, palavra => { quantos++; if (secao.editavel === false) travados++; return '' + palavra }).replace(/<\/(p|td|th|li|div|h\d)>/gi, ''))
      for (const bloco of marcado.split('')) {
        for (const parte of bloco.matchAll(/(?:\S+\s+){0,2}\S*\S+(?:\s+\S+){0,2}/g)) if (trechos.length < 3) trechos.push(parte[0].replace(//g, ''))
      }
    }
    return { certo: !quantos, quantos, trechos, travados }
  }
  function avisoDoItalico (conferido) {
    return conferido.quantos === 1 ? 'A palavra "Campus" ou "Campi" está sem itálico em 1 lugar:' : `As palavras "Campus" ou "Campi" estão sem itálico em ${conferido.quantos} lugares:`
  }
  // Mudanças para o editor: { nomeDaSecao: html } (só as partes que dá para mudar e que precisam).
  function corrigirItalico (secoes) {
    const mudancas = {}
    for (const secao of secoes || []) {
      if (secao.editavel === false) continue
      const novo = porItalico(secao.html)
      if (novo !== secao.html) mudancas[secao.nome] = novo
    }
    return mudancas
  }

  // ---- v0.35.2: cargo da diretora-geral abaixo do nome (só na Direção-geral, PAL/REI/IFTO) ----
  // v0.37.0 (#355, usuário): a lista vem das configurações ("cargosPorUnidade": { unidade, nome, cargo }), uma
  // linha por pessoa; a de Palmas é o padrão. "Campus" e "Campi" do cargo ficam em itálico sozinhos.
  const CARGOS_PADRAO = Object.freeze([Object.freeze({ unidade: 'PAL/REI/IFTO', nome: 'Noemi Barreto Sales Zukowski', cargo: 'Diretora-Geral do Campus Palmas' })])
  const CARGO_DA_DIRETORA = CARGOS_PADRAO[0].cargo
  const minusculo = texto => textoDoHtml(texto).toLowerCase().replace(/[.,]$/, '').replace(/\s+/g, ' ').trim()
  const cargoEmHtml = cargo => String(cargo || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\b(Campus|Campi)\b/g, '<i>$1</i>')
  // Texto "unidade = nome = cargo" (um por linha) ↔ lista.
  function lerCargos (texto) {
    return String(texto || '').split('\n').map(linha => linha.split('=').map(parte => parte.trim())).filter(partes => partes.length >= 3 && partes.every(Boolean))
      .map(([unidade, nome, ...cargo]) => ({ unidade: siglaDaUnidade(unidade), nome, cargo: cargo.join(' = ') }))
  }
  const cargosEmTexto = lista => (lista || []).map(item => `${item.unidade} = ${item.nome} = ${item.cargo}`).join('\n')
  const QUEBRA = /<br\b[^>]*>/i

  // Linhas do documento, na ordem: cada parágrafo dividido nas quebras de linha.
  function linhasDaSecao (html) {
    const linhas = []
    for (const achado of String(html || '').matchAll(/(<p\b[^>]*>)([\s\S]*?)<\/p>/gi)) {
      let inicio = achado.index + achado[1].length
      let italicoAberto = ''
      for (const trecho of achado[2].split(/(<br\b[^>]*>)/i)) {
        if (!QUEBRA.test(trecho)) {
          linhas.push({ inicio, fim: inicio + trecho.length, html: trecho, comItalico: italicoAberto + trecho, texto: textoDoHtml(trecho) })
          // O itálico que começa numa linha pode continuar na seguinte.
          for (const marca of trecho.matchAll(/<(\/?)(i|em)\b[^>]*>/gi)) italicoAberto = marca[1] ? '' : marca[0]
        }
        inicio += trecho.length
      }
    }
    return linhas
  }

  // null se não há o nome sozinho numa linha ou se a unidade não está na lista.
  function conferirCargo (secoes, sigla, cargos = CARGOS_PADRAO) {
    const daUnidade = (cargos || []).filter(item => item && item.nome && item.cargo && siglaDaUnidade(item.unidade) === siglaDaUnidade(sigla))
    if (!daUnidade.length) return null
    let achado = null
    for (const secao of secoes || []) {
      const linhas = linhasDaSecao(secao.html)
      linhas.forEach((linha, i) => {
        const pessoa = daUnidade.find(item => minusculo(linha.html) === minusculo(item.nome))
        if (!pessoa) return
        const esperado = pessoa.cargo
        const abaixo = linhas.slice(i + 1).find(outra => outra.texto)
        // Só é cargo se for curto e falar em direção (ou começar como o cargo certo): outra frase abaixo do nome não é trocada.
        const primeira = minusculo(esperado).split(' ')[0]
        const pareceCargo = texto => /diretora?\b|pro tempore/i.test(texto) || minusculo(texto).startsWith(primeira)
        const cargo = abaixo && abaixo.texto.length <= 100 && pareceCargo(abaixo.texto) ? abaixo : null
        const problemas = []
        if (!cargo) problemas.push(`Falta "${esperado}" abaixo do nome.`)
        else if (cargo.texto !== esperado) problemas.push(`Está "${cargo.texto}"; o certo é "${esperado}".`)
        else if (/\b(Campus|Campi)\b/.test(esperado) && porItalico(cargo.comItalico) !== cargo.comItalico) problemas.push('A palavra "Campus" deve ficar em itálico.')
        // Com o nome em mais de um lugar, o errado vem primeiro.
        if (!achado || (achado.certo && problemas.length)) achado = { certo: !problemas.length, problemas, esperado, secao: secao.nome, editavel: secao.editavel !== false, nome: { fim: linha.fim }, cargo: cargo && { inicio: cargo.inicio, fim: cargo.fim, html: cargo.html } }
      })
    }
    return achado
  }
  const fraseDoCargo = conferido => 'Cargo abaixo do nome: ' + conferido.problemas.join(' ')

  // Troca só a linha do cargo (ou põe uma, se não há). As marcas (negrito…) que começam ou acabam na linha ficam,
  // menos o itálico, para só "Campus" ficar em itálico.
  function corrigirCargo (html, conferido) {
    const { cargo, nome } = conferido
    const emHtml = cargoEmHtml(conferido.esperado || CARGO_DA_DIRETORA)
    if (!cargo) return html.slice(0, nome.fim) + '<br>' + emHtml + html.slice(nome.fim)
    let posto = false
    let nova = cargo.html.replace(/<[^>]+>|[^<]+/g, pedaco => {
      if (pedaco[0] === '<') return pedaco
      if (posto || !textoDoHtml(pedaco)) return ''
      posto = true
      return emHtml
    })
    // Itálico inteiro dentro da linha sai; o de "Campus" volta.
    const aberturas = (cargo.html.match(/<(i|em)\b[^>]*>/gi) || []).length
    const fechos = (cargo.html.match(/<\/(i|em)>/gi) || []).length
    if (aberturas === fechos) nova = nova.replace(/<\/?(i|em)\b[^>]*>/gi, '').replace(/\b(Campus|Campi)\b/g, '<i>$1</i>')
    nova = nova.replace(/<(span|strong|b|u)\b[^>]*><\/\1>/gi, '')
    return html.slice(0, cargo.inicio) + nova + html.slice(cargo.fim)
  }

  // Documento já assinado: a página do documento mostra "Documento assinado eletronicamente por".
  const estaAssinado = html => /assinado\s+eletronicamente\s+por/i.test(textoDoHtml(html))

  const api = { siglaDaUnidade, ehUnidadePalmas, limparUnidade, limparUnidades, acharUnidade, textoDoHtml, formatarProcesso, mesmoProcesso, processoDaReferencia, linhaDoProcesso, conferirProcesso, avisoDoProcesso, perguntaAntesDeAssinar, fraseDoProcesso, problemasParaAssinar, corrigirProcesso, estaAssinado, confereAoAssinar, conferirItalico, avisoDoItalico, corrigirItalico, conferirCargo, fraseDoCargo, corrigirCargo, CARGO_DA_DIRETORA, CARGOS_PADRAO, lerCargos, cargosEmTexto, numeroSeiDoDocumento, aceitar, foiAceito, documentosDoBloco, idDoItemDoBloco, TIMBRE_FIXO, comMaiusculas, linhasVaziasDoTimbre, linhasDoTimbre, timbreEsperado, conferirTimbre, avisosDoTimbre, corrigirTimbre, secaoCom, ehDoTimbre, ehDoRodape, formatarTelefone, conferirRodape, rodapeEsperado, corrigirRodape, linhasDoSetor, sugerirUnidade, linhasDaSugestao }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { conferirDocumento: api })
})(globalThis)
