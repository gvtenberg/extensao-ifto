// v0.25.0 (spec numeracao-edital): nos estilos "Item nível 2/3/4 Edital" o número fica numa caixa de largura
// fixa (10, 15 e 18 mm). Número longo ("10.10.") não cabe e o texto pula para a linha de baixo (no editor, no
// documento e no PDF). A correção é um bloco de estilo escondido no texto (como a marca MINUTA do SEI Pro,
// que o SEI guarda e imprime): a caixa continua com a mesma largura mínima e só cresce quando o número não
// cabe. Regras puras: rodam no navegador e no Node.
(function (raiz) {
  const CLASSES = Object.freeze(['Item_nivel_2_Edital', 'Item_nivel_3_Edital', 'Item_nivel_4_Edital'])
  const LARGURAS = Object.freeze({ Item_nivel_2_Edital: '10mm', Item_nivel_3_Edital: '15mm', Item_nivel_4_Edital: '18mm' })
  const MARCA = 'extensao-ifto: numeracao do edital'

  // box-sizing:border-box: a folga de 1mm fica dentro da largura mínima, então os números curtos ficam iguais.
  const CSS = '/* ' + MARCA + ' */' +
    CLASSES.map(classe => '.' + classe + ':before').join(',') +
    '{width:auto !important;white-space:nowrap;box-sizing:border-box;padding-right:1mm}' +
    CLASSES.map(classe => '.' + classe + ':before{min-width:' + LARGURAS[classe] + '}').join('')
  const BLOCO = '<style>' + CSS + '</style>'

  // O texto da seção já tem a correção? (o editor do SEI tira os atributos do <style>, o comentário fica)
  function temCorrecao (html) {
    return String(html || '').includes(MARCA)
  }

  const api = { CLASSES, LARGURAS, MARCA, CSS, BLOCO, temCorrecao }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { numeracaoEdital: api })
})(globalThis)
