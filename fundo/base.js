// v0.38.0: o que todas as partes de fundo usam: o navegador, as regras do SICAF e do Simples, os endereços do
// SEI e a entrega de recados às abas. Carregado antes das outras partes (manifest.json e importScripts).
const navegador = globalThis.browser || globalThis.chrome
const regras = globalThis.ExtensaoIFTO.sicaf
const simples = globalThis.ExtensaoIFTO.simplesNacional
const MENU = 'buscar-sicaf'
const SEI = '*://sei.ifto.edu.br/*'
// Páginas do SEI onde a extensão entra (as outras não respondem).
const PAGINAS_DO_SEI = '*://sei.ifto.edu.br/*controlador.php?acao=*'

async function entregar (idDaAba, recado) {
  try {
    const resposta = await navegador.tabs.sendMessage(idDaAba, recado, { frameId: 0 })
    return Boolean(resposta && resposta.recebido)
  } catch (erro) {
    return false
  }
}

// Mostra a aba do SEI dentro da janela dela (a aba pode já ter sido fechada).
// v0.37.0 (T260, dois monitores): não traz mais a janela para a frente. Isso tirava o foco de onde a pessoa
// estava digitando, no outro monitor; a aba fica pronta na janela do SEI, esperando a pessoa voltar.
async function trazerAbaParaFrente (idDaAba) {
  try {
    await navegador.tabs.update(idDaAba, { active: true })
  } catch (erro) {
    // Aba ou janela já fechada pela pessoa: nada a fazer.
  }
}
// A pessoa fechou a aba da busca: termina com o que já veio (antes a janela do SEI esperava para sempre).

// Avisos e scripts nas páginas do Compras/SICAF (só com a permissão opcional dada).
async function injetar (idDaAba, arquivos, dados) {
  try {
    if (dados) await navegador.scripting.executeScript({ target: { tabId: idDaAba }, func: valor => { globalThis.extensaoIftoAviso = valor }, args: [dados] })
    await navegador.scripting.executeScript({ target: { tabId: idDaAba }, files: arquivos })
    return true
  } catch (erro) {
    // Página fechada ou sem permissão: a busca continua quando a aba voltar ao SICAF.
    console.warn('Extensão IFTO: não consegui pôr o aviso na página', erro && erro.message)
    return false
  }
}
