// Em toda página do SEI: guarda a versão e o endereço do SEI, para a janela do ícone mostrar
// (e para as próximas etapas saberem com que SEI estão lidando).
(function () {
  const { sei } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  // v0.22.0: número e nome da unidade aberta, para a janela do editor (que não mostra a unidade) saber
  // em que unidade está. Grava só quando muda.
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  const numero = campoUnidade && sei.numeroDaUnidade(campoUnidade.getAttribute('onclick'))
  if (numero) {
    const nome = campoUnidade.textContent.trim()
    navegador.storage.local.get('unidadesSei').then(({ unidadesSei = {} }) => {
      if (unidadesSei[numero] !== nome) navegador.storage.local.set({ unidadesSei: { ...unidadesSei, [numero]: nome } })
    })
  }
  const script = document.querySelector('script[src^="js/sei.js?"]')
  if (!script) return
  const versao = sei.versaoDoSei(script.getAttribute('src'))
  if (!versao) return
  navegador.storage.local.set({
    seiVisto: { versao, endereco: location.origin, vistoEm: new Date().toISOString() }
  })

  // v0.28.0 (spec aviso-versao-sei, D1): SEI numa versão não testada e a pessoa ainda não escolheu: caixa no
  // alto à direita, só nas páginas principais (com a unidade), não nas janelas pequenas do SEI.
  if (window.top !== window || !campoUnidade) return
  if (sei.estadoNoSei(versao, null) !== 'perguntar') return
  sei.estadoAtualNoSei().then(({ estado }) => { if (estado === 'perguntar') mostrarAviso() })

  function mostrarAviso () {
    const hospedeiro = document.createElement('div')
    hospedeiro.dataset.extensaoIfto = 'aviso-versao-sei'
    const raiz = hospedeiro.attachShadow({ mode: 'open' })
    raiz.innerHTML = `<style>
      :host { all: initial; }
      .caixa { position: fixed; z-index: 2147483000; top: 70px; right: 16px; width: min(380px, calc(100vw - 32px));
        font: 14px/1.45 system-ui, sans-serif; color: #1B2420; background: #fff; border: 2px solid #8A5A00;
        border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.25); padding: 12px 14px; }
      .marca { display: inline-block; background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
      p { margin: 8px 0 12px; }
      .botoes { display: flex; gap: 8px; flex-wrap: wrap; }
      button { min-height: 32px; padding: 0 12px; border-radius: 6px; font: inherit; font-weight: 600; cursor: pointer;
        border: 1px solid #1E5E33; background: #fff; color: #1E5E33; }
      button.principal { background: #1E5E33; color: #fff; }
    </style>
    <div class="caixa" role="alertdialog" aria-label="Aviso da extensão">
      <span class="marca">IFTO</span>
      <p></p>
      <div class="botoes">
        <button type="button" class="principal" data-escolha="continuar">Continuar usando</button>
        <button type="button" data-escolha="desativar">Desativar a extensão no SEI</button>
      </div>
    </div>`
    raiz.querySelector('p').textContent = `O SEI do IFTO mudou para a versão ${versao.split('.').slice(0, 3).join('.')}, e a extensão foi testada na versão ${sei.VERSAO_SEI_TESTADA}. Algumas funções da extensão podem não funcionar. Se preferir, desative a extensão no SEI; para ligar de novo, clique no ícone da extensão.`
    raiz.addEventListener('click', async evento => {
      const botao = evento.target.closest('button')
      if (!botao) return
      const ligada = botao.dataset.escolha === 'continuar'
      await sei.gravarEscolhaNoSei(versao, ligada)
      if (ligada) return hospedeiro.remove()
      // Não recarrega a página (o SEI poderia pedir para reenviar um formulário): as funções somem na próxima.
      raiz.querySelector('p').textContent = 'A extensão foi desativada no SEI. As funções dela somem quando você abrir outra página do SEI. Para ligar de novo, clique no ícone da extensão e em "Ativar de novo".'
      raiz.querySelector('.botoes').replaceChildren()
      setTimeout(() => hospedeiro.remove(), 12000)
    })
    document.body.append(hospedeiro)
  }
})()
