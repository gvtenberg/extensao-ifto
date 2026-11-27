// v0.37.0 (#355, usuário): três ajustes na digitação do editor do SEI 5, feitos dentro da página
// (sites/sei/editor-digitacao.js): o "R$" (valor por extenso) mantém a formatação do valor (negrito etc.);
// linha nova depois de uma linha em branco mantém a formatação da linha de cima; a lista de estilos abre
// rolada e marcada no estilo em uso. Nunca salva.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const preparar = async () => {
    const resposta = await navegador.runtime.sendMessage({ tipo: 'digitacaoPreparar' }).catch(erro => ({ ok: false, erro: erro.message }))
    if (!resposta || !resposta.ok) console.warn('[extensão IFTO] Ajustes de digitação do editor:', resposta && resposta.erro)
  }
  globalThis.ExtensaoIFTO.caixaEditor.quandoRemontar(preparar)
  await preparar()
})()
