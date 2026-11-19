// v0.29.0 (spec todos-os-estilos): na janela do editor do SEI, em qualquer documento e unidade, a lista de
// estilos ganha os estilos que o tipo de documento não tem (com "★"), só no texto principal. A parte que mexe no
// editor roda dentro da página (sites/sei/editor-estilos.js). Nunca salva: a pessoa clica em Salvar.
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const { configuracoes, caixaEditor } = globalThis.ExtensaoIFTO

  async function preparar () {
    const { estilosAprendidos = {} } = await navegador.storage.local.get('estilosAprendidos')
    const resposta = await navegador.runtime.sendMessage({ tipo: 'estilosPreparar', aprendidos: estilosAprendidos }).catch(() => null)
    // R2 (v0.29.1, etapa 2): guarda os estilos deste tipo de documento, para oferecê-los nos outros tipos.
    const proprios = resposta && resposta.ok && resposta.proprios
    if (!proprios || !Object.keys(proprios).length) return resposta
    const { estilosAprendidos: atuais = {} } = await navegador.storage.local.get('estilosAprendidos')
    const juntos = { ...atuais, ...proprios }
    if (JSON.stringify(juntos) !== JSON.stringify(atuais)) await navegador.storage.local.set({ estilosAprendidos: juntos })
    return resposta
  }

  const opcoes = await configuracoes.lerConfiguracoes()
  if (opcoes.todosOsEstilos) { caixaEditor.quandoRemontar(preparar); await preparar(); return }

  // R7 (v0.29.2, etapa 3): opção desligada e o documento já usa estilos extras: avisa, sem mexer no texto.
  const verificado = await navegador.runtime.sendMessage({ tipo: 'estilosVerificar' }).catch(() => null)
  if (!verificado || !verificado.ok || !verificado.usa) return
  const caixa = caixaEditor.criarCaixa('todos-os-estilos', 'Este documento usa estilos da extensão (os marcados com ★). Com a opção "Todos os estilos em todos os documentos" desligada, eles podem ser perdidos ao salvar.', 'Ligar de novo')
  caixa.botao.addEventListener('click', async () => {
    caixa.botao.disabled = true
    await configuracoes.gravarConfiguracoes({ ...(await configuracoes.lerConfiguracoes()), todosOsEstilos: true })
    const resposta = await preparar()
    if (resposta && resposta.ok) caixa.mostrar('ok', 'Pronto: a opção foi ligada de novo e os estilos com ★ voltaram à lista.')
    else caixa.mostrar('erro', 'A opção foi ligada de novo, mas não consegui mostrar os estilos agora. Feche o editor e abra de novo. ' + ((resposta && resposta.erro) || ''))
  })
})()
