// v0.29.0 (spec todos-os-estilos): na janela do editor do SEI, em qualquer documento e unidade, a lista de
// estilos ganha os estilos que o tipo de documento não tem (com "★"), só no texto principal. A parte que mexe no
// editor roda dentro da página (sites/sei/editor-estilos.js). Nunca salva: a pessoa clica em Salvar.
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const { estilosAprendidos = {} } = await navegador.storage.local.get('estilosAprendidos')
  const resposta = await navegador.runtime.sendMessage({ tipo: 'estilosPreparar', aprendidos: estilosAprendidos }).catch(() => null)
  // R2 (v0.29.1, etapa 2): guarda os estilos deste tipo de documento, para oferecê-los nos outros tipos.
  const proprios = resposta && resposta.ok && resposta.proprios
  if (!proprios || !Object.keys(proprios).length) return
  const { estilosAprendidos: atuais = {} } = await navegador.storage.local.get('estilosAprendidos')
  const juntos = { ...atuais, ...proprios }
  if (JSON.stringify(juntos) !== JSON.stringify(atuais)) await navegador.storage.local.set({ estilosAprendidos: juntos })
})()
