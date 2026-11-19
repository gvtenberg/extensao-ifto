// v0.29.0 (spec todos-os-estilos): na janela do editor do SEI, em qualquer documento e unidade, a lista de
// estilos ganha os estilos que o tipo de documento não tem (com "★"), só no texto principal. A parte que mexe no
// editor roda dentro da página (sites/sei/editor-estilos.js). Nunca salva: a pessoa clica em Salvar.
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const { estilosAprendidos = {} } = await navegador.storage.local.get('estilosAprendidos')
  await navegador.runtime.sendMessage({ tipo: 'estilosPreparar', aprendidos: estilosAprendidos }).catch(() => null)
})()
