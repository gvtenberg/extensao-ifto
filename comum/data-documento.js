// v0.23.0 (spec data-documento): no Ofício e na Portaria o SEI põe a data ao criar o documento, numa seção
// que não dá para editar ("Data", somente leitura). Estas regras acham essa data, dizem se já passou e a
// trocam pela de hoje, mantendo cidade, pontuação e letras maiúsculas. Regras puras (sem página).
(function (raiz) {
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const ESPACO = '(?:\\s|&nbsp;|&#160;| )+'
  // "março" pode vir como "mar&ccedil;o" do editor antigo (CKEditor 4).
  const NOMES = MESES.map(mes => mes.replace('ç', '(?:ç|&ccedil;)')).join('|')
  const DATA = new RegExp('(\\d{1,2})(º|°|&ordm;|&deg;)?' + ESPACO + 'de' + ESPACO + '(' + NOMES + ')' + ESPACO + 'de' + ESPACO + '(\\d{4})', 'i')

  const regrasSei = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  function ehOficioOuPortaria (titulo) {
    return /^(of[ií]cio|portaria)\b/i.test(regrasSei.tipoDoDocumento(titulo))
  }

  // Primeira data "28 de abril de 2026" do texto: { dia, mes (1 a 12), ano, trecho, inicio } ou null.
  function acharData (html) {
    const achado = DATA.exec(String(html || ''))
    if (!achado) return null
    const nome = achado[3].toLowerCase().replace('&ccedil;', 'ç')
    return { dia: Number(achado[1]), mes: MESES.indexOf(nome) + 1, ano: Number(achado[4]), trecho: achado[0], inicio: achado.index, achado }
  }

  // A data do documento é de um dia antes de hoje?
  function dataPassou (data, hoje = new Date()) {
    if (!data) return false
    const doDocumento = data.ano * 10000 + data.mes * 100 + data.dia
    return doDocumento < hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate()
  }

  const doisDigitos = numero => String(numero).padStart(2, '0')
  const dataCurta = data => doisDigitos(data.dia) + '/' + doisDigitos(data.mes) + '/' + data.ano
  const dataPorExtenso = hoje => hoje.getDate() + ' de ' + MESES[hoje.getMonth()] + ' de ' + hoje.getFullYear()

  // Troca a primeira data pela de hoje, no mesmo jeito de escrever: dia com zero na frente se era assim
  // ("07"), mês e "de" em maiúsculas se eram ("DE 28 DE ABRIL DE 2026"); espaços e o resto ficam.
  function trocarData (html, hoje = new Date()) {
    const texto = String(html || '')
    const data = acharData(texto)
    if (!data) return texto
    const [trecho, dia, ordinal, mes] = data.achado
    const novoDia = (dia.length === 2 && dia[0] === '0' ? doisDigitos(hoje.getDate()) : String(hoje.getDate())) + (ordinal && hoje.getDate() === 1 ? ordinal : '')
    let novoMes = MESES[hoje.getMonth()]
    if (mes === mes.toUpperCase()) novoMes = novoMes.toUpperCase()
    else if (mes[0] === mes[0].toUpperCase()) novoMes = novoMes[0].toUpperCase() + novoMes.slice(1)
    const novo = trecho.replace(/^\d{1,2}(?:º|°|&ordm;|&deg;)?/i, novoDia).replace(new RegExp('(' + NOMES + ')', 'i'), novoMes)
      .replace(new RegExp('\\d{4}$'), String(hoje.getFullYear()))
    return texto.slice(0, data.inicio) + novo + texto.slice(data.inicio + trecho.length)
  }

  // Seção que tem a data do documento: primeiro as que não dá para editar (a "Data" do Ofício, o
  // "Identificador" da Portaria); senão, uma seção curta que é só "Cidade, 28 de abril de 2026.".
  // O corpo do texto (com datas citadas de leis e portarias) nunca entra.
  function secaoDaData (secoes) {
    const travada = (secoes || []).find(secao => !secao.editavel && acharData(secao.html))
    if (travada) return travada
    const soData = new RegExp('^[^,]{1,40},' + '(?:\\s|&nbsp;|&#160;| )*' + DATA.source + '\\.?$', 'i')
    return (secoes || []).find(secao => soData.test(String(secao.html || '').replace(/<[^>]*>/g, '').trim())) || null
  }

  const api = { ehOficioOuPortaria, acharData, dataPassou, dataCurta, dataPorExtenso, trocarData, secaoDaData }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { dataDocumento: api })
})(globalThis)
