// v0.6.0: documento externo novo (Incluir Documento › Externo): marca a data de hoje, o formato
// Nato-digital e o nível de acesso Público, só nos campos ainda vazios. Nunca clica em Salvar aqui.
// v0.22.2: documento interno novo (Incluir Documento › Edital, Despacho…): marca o nível Público, se nenhum
// nível estiver marcado (o Edital Gabinete vinha sem nível marcado).
// v0.27.0 (spec base-e-sei, etapa 2): nível, hipótese legal, formato e tipo de conferência escolhidos nas
// configurações; ao escolher o arquivo: tipo e "Nome na Árvore" pelo nome do arquivo (D14, D7), "#" do
// nome trocado por "_" (D9) e aviso de tamanho com as dicas para diminuir (D10 a D13).
(async function () {
  const { documentoExterno: regras, configuracoes } = globalThis.ExtensaoIFTO
  const interno = regras.ehDocumentoInternoNovo(location.href)
  if (!interno && !regras.ehDocumentoExternoNovo(location.href)) return
  const opcoes = await configuracoes.lerConfiguracoes()

  if (interno) {
    if (!opcoes.preencherDocumentoExterno) return
    const publico = document.getElementById('optPublico')
    const niveis = ['optPublico', 'optRestrito', 'optSigiloso'].map(id => document.getElementById(id)).filter(Boolean)
    if (!publico || publico.disabled || niveis.some(opcao => opcao.checked)) return
    publico.click()
    avisar('Nível de acesso Público marcado pela extensão: confira antes de salvar.')
    return
  }

  const formulario = document.getElementById('frmDocumentoCadastro')
  if (!formulario) return
  // O arquivo é conferido mesmo com o preenchimento desligado (o SEI recusaria o arquivo de qualquer jeito).
  window.addEventListener('change', aoEscolherArquivo, true)
  if (opcoes.preencherDocumentoExterno) preencherAoAbrir()

  function preencherAoAbrir () {
    const campoData = document.getElementById('txtDataElaboracao')
    const nato = document.getElementById('optNato')
    const digitalizado = document.getElementById('optDigitalizado')
    const publico = document.getElementById('optPublico')
    const restrito = document.getElementById('optRestrito')
    if (!campoData || !nato || !publico) return

    const niveis = ['optPublico', 'optRestrito', 'optSigiloso'].map(id => document.getElementById(id)).filter(Boolean)
    const falta = regras.oQuePreencher({
      data: campoData.value,
      formatoMarcado: nato.checked || (digitalizado && digitalizado.checked),
      nivelMarcado: niveis.some(opcao => opcao.checked)
    })
    if (!falta.data && !falta.formato && !falta.nivel) return

    if (falta.data) {
      campoData.value = regras.dataDeHoje()
      campoData.dispatchEvent(new Event('change', { bubbles: true }))
    }
    // O clique roda as funções do próprio SEI (mostrar/esconder o tipo de conferência, hipótese legal).
    if (falta.formato) {
      if (opcoes.externoFormato === 'digitalizado' && digitalizado) {
        digitalizado.click()
        escolherNaLista('selTipoConferencia', opcoes.externoConferencia, true)
      } else nato.click()
    }
    if (falta.nivel) {
      if (opcoes.externoNivel === 'restrito' && restrito && !restrito.disabled) {
        restrito.click()
        escolherHipoteseLegal()
      } else publico.click()
    }
    avisar('Preenchido pela extensão: confira a data, o formato e o nível de acesso.')
  }

  // Opção de uma lista do SEI pelo nome (igual, ou só contendo o texto); devolve se escolheu.
  function escolherNaLista (id, texto, exato) {
    const lista = document.getElementById(id)
    if (!lista || !texto) return false
    const alvo = regras.semAcento(texto)
    const opcao = [...lista.options].find(item => {
      const nome = regras.semAcento(item.textContent)
      return item.value !== 'null' && (exato ? nome === alvo : nome.includes(alvo))
    })
    if (!opcao) return false
    lista.value = opcao.value
    lista.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  // A lista "Hipótese Legal" chega do SEI depois de marcar Restrito: espera até 10 segundos.
  function escolherHipoteseLegal () {
    if (!opcoes.externoHipoteseLegal) return
    const inicio = Date.now()
    const vez = setInterval(() => {
      if (escolherNaLista('selHipoteseLegal', opcoes.externoHipoteseLegal, false)) return clearInterval(vez)
      if (Date.now() - inicio < 10000) return
      clearInterval(vez)
      avisar(`Não achei a hipótese legal "${opcoes.externoHipoteseLegal}" na lista do SEI: escolha-a antes de salvar.`, 'dica')
    }, 400)
  }

  // Escolha do arquivo ("Anexar Arquivo..."): roda antes do envio do próprio SEI (onchange do campo).
  function aoEscolherArquivo (evento) {
    const campo = evento.target
    if (!campo || campo.id !== 'filArquivo' || !campo.files || !campo.files.length) return
    for (const velho of document.querySelectorAll('[data-extensao-ifto="documento-externo-arquivo"]')) velho.remove()
    let arquivo = campo.files[0]

    // Acima do limite o SEI recusa: a extensão não deixa enviar e mostra as dicas.
    const avisos = regras.avisosDoArquivo({ nome: arquivo.name, tamanho: arquivo.size })
    for (const aviso of avisos) avisar(aviso.partes, aviso.nivel, 'documento-externo-arquivo')
    if (avisos.some(aviso => aviso.nivel === 'erro')) {
      evento.stopImmediatePropagation()
      campo.value = ''
      return
    }

    if (opcoes.externoCorrigirNome) {
      const novoNome = regras.corrigirNomeDoArquivo(arquivo.name)
      if (novoNome !== arquivo.name) {
        try {
          const lista = new DataTransfer()
          lista.items.add(new File([arquivo], novoNome, { type: arquivo.type, lastModified: arquivo.lastModified }))
          campo.files = lista.files
          arquivo = campo.files[0]
          avisar(`O SEI não aceita "#" no nome do arquivo: a extensão trocou por "_" (${novoNome}).`, 'feito', 'documento-externo-arquivo')
        } catch (erro) {
          avisar('O SEI não aceita "#" no nome do arquivo. Renomeie o arquivo no computador, sem "#", e escolha de novo.', 'erro', 'documento-externo-arquivo')
          evento.stopImmediatePropagation()
          campo.value = ''
          return
        }
      }
    }
    if (opcoes.preencherDocumentoExterno) tipoENome(arquivo.name)
  }

  // D14: o tipo pelo nome do arquivo só entra se nenhum tipo foi escolhido ainda; nunca troca o escolhido.
  // O tipo vai direto na lista, sem recarregar a página (trocarSerie() do SEI recarrega e perderia o
  // arquivo escolhido); o SEI++ também salva assim (selSerie e hdnIdSerie).
  function tipoENome (nomeDoArquivo) {
    const lista = document.getElementById('selSerie')
    const escondido = document.getElementById('hdnIdSerie')
    const nomeArvore = document.getElementById('txtNomeArvore')
    if (!lista) return
    const opcoesDaLista = [...lista.options].filter(item => item.value && item.value !== 'null')
    const achado = regras.tipoPeloNome(nomeDoArquivo, opcoesDaLista.map(item => item.textContent.trim()), {
      regras: opcoes.externoRegras, padrao: opcoes.externoTipoPadrao
    })
    const feito = []
    if ((!lista.value || lista.value === 'null') && achado.tipo) {
      const opcao = opcoesDaLista.find(item => item.textContent.trim() === achado.tipo)
      lista.value = opcao.value
      if (escondido) escondido.value = opcao.value
      feito.push(`tipo "${achado.tipo}"`)
    }
    if (opcoes.externoNomeArvore && nomeArvore && !nomeArvore.value.trim() && achado.nomeArvore) {
      nomeArvore.value = achado.nomeArvore
      feito.push(`Nome na Árvore "${achado.nomeArvore}"`)
    }
    if (feito.length) avisar(`Pelo nome do arquivo, a extensão escolheu ${feito.join(' e ')}: confira antes de salvar.`, 'feito', 'documento-externo-arquivo')
  }

  // Aviso no alto do formulário. nivel: "feito" (verde), "dica" (amarelo) ou "erro" (vermelho).
  function avisar (texto, nivel = 'feito', marca = 'documento-externo') {
    const destino = document.getElementById('frmDocumentoCadastro')
    if (!destino) return
    const cores = {
      feito: ['#E8F5EC', '#1E5631', '#B7DCC3'],
      dica: ['#FFF1D6', '#7A4B00', '#F0D49A'],
      erro: ['#FDECEC', '#8A1C1C', '#F2B8B8']
    }[nivel] || ['#E8F5EC', '#1E5631', '#B7DCC3']
    const nota = document.createElement('div')
    nota.dataset.extensaoIfto = marca
    nota.append(regras.montarPartes(Array.isArray(texto) ? texto : [texto], document))
    Object.assign(nota.style, {
      margin: '6px 0', padding: '6px 10px', borderRadius: '4px', maxWidth: '90%',
      background: cores[0], color: cores[1], border: '1px solid ' + cores[2], fontWeight: '600', width: 'fit-content'
    })
    destino.prepend(nota)
  }
})()
