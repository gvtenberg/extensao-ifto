// v0.24.0 (spec tabelas-editor): na janela do editor do SEI, pede à parte de fundo para preparar as tabelas
// (recortar e colar sem perder a formatação; margens na janela "Propriedades da tabela"), se estiverem ligadas.
(async function () {
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const opcoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  if (!opcoes.moverTabelas && !opcoes.margensTabela) return
  navegador.runtime.sendMessage({ tipo: 'tabelasPreparar', mover: opcoes.moverTabelas, margens: opcoes.margensTabela }).catch(() => {})
})()
