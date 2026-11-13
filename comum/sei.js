// Regras de leitura das páginas do SEI, sem depender da página (testáveis no computador).
// Base: SEI++ (https://github.com/jonatasrs/sei, GPL-3.0), getSeiVersion.js.
(function (raiz) {
  // Versão do SEI a partir do endereço do script "js/sei.js?<versão>"; sempre com 4 números.
  function versaoDoSei (enderecoDoScript) {
    const achado = /\?([^=-]+)/.exec(enderecoDoScript || '')
    if (!achado) return null
    const numeros = achado[1].split('.').slice(0, 4)
    while (numeros.length < 4) numeros.push('0')
    return numeros.join('.')
  }

  // v0.1.1: o SEI 5 troca o campo de senha por um campo de texto que mostra "●" (MaskedPassword) e guarda
  // a senha num campo escondido; assim o navegador não reconhece a senha. A extensão volta a pôr um campo
  // de senha de verdade, com os mesmos atributos do campo visível (tabindex, onkeypress, maxlength...).
  const ATRIBUTOS_DESCARTADOS = ['type', 'name', 'value', 'autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']
  function atributosDoCampoDeSenha (atributos, nome) {
    const resultado = []
    for (const { name, value } of atributos || []) {
      const chave = name.toLowerCase()
      if (ATRIBUTOS_DESCARTADOS.includes(chave) || chave.startsWith('_')) continue
      if (chave === 'class') {
        const classes = value.split(/\s+/).filter(c => c && c !== 'masked').join(' ')
        if (classes) resultado.push(['class', classes])
        continue
      }
      resultado.push([name, value])
    }
    resultado.push(['type', 'password'], ['name', nome || 'pwdSenha'], ['autocomplete', 'current-password'])
    return resultado
  }

  const api = { versaoDoSei, atributosDoCampoDeSenha }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { sei: api })
})(globalThis)
