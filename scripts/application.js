import { cifrarTexto } from './apresentacao.js'
import { iniciarSessao } from './sessao.js'
import { camadaTransporte } from './transporte.js'
import { camadaRede } from './rede.js'
import { camadaEnlace } from './enlace-dados.js'
import { camadaFisica } from './fisica.js'

const CAMADAS_ORDEM = ['aplicacao', 'apresentacao', 'sessao', 'transporte', 'rede', 'enlace', 'fisica']

export function iniciarCamadaAplicacao() {
  const estado = {
    protocolo: '',
    requisicao: '',
    email: null,
    dadosAplicacao: null,
    apresentacao: null,
    sessao: null,
    transporte: null,
    rede: null,
    enlace: null,
    fisica: null,
    encapsulamento: null
  }

  const usuarioEl = document.querySelector('.user')
  if (usuarioEl) usuarioEl.textContent = 'Usuário: Victor'

  const protocoloNomeEl = document.querySelector('.protocol-name')
  const textoRequisicaoEl = document.querySelector('#requisicao-texto')
  const botaoRequisicao = document.querySelector('.request-btn')
  const formularioSmtp = document.querySelector('.smtp-form')
  const botaoEnviarSmtp = document.querySelector('.smtp-send-btn')
  const emailSmtpEl = document.querySelector('#smtp-email')
  const assuntoSmtpEl = document.querySelector('#smtp-subject')
  const mensagemSmtpEl = document.querySelector('#smtp-message')
  const dadosAplicacaoEl = document.querySelector('#dados-aplicacao')
  const dadosApresentacaoEl = document.querySelector('#dados-apresentacao')
  const dadosSessaoEl = document.querySelector('#dados-sessao')
  const dadosTransporteEl = document.querySelector('#dados-transporte')
  const dadosRedeEl = document.querySelector('#dados-rede')
  const dadosEnlaceEl = document.querySelector('#dados-enlace')
  const dadosFisicaVerificacaoEl = document.querySelector('#dados-fisica-verificacao')
  const dadosFisicaObjetoEl = document.querySelector('#dados-fisica-objeto')
  const dadosFisicaBinarioEl = document.querySelector('#dados-fisica-binario')
  const dadosFisicaInfoEl = document.querySelector('#dados-fisica-info')
  const fisicaStatusFinalEl = document.querySelector('#fisica-status-final')
  const progressoFillEl = document.querySelector('#fluxo-progresso-fill')
  const progressoTextoEl = document.querySelector('#fluxo-status-text')

  function ocultarFormulario() {
    if (formularioSmtp) formularioSmtp.style.display = 'none'
  }

  function mostrarFormulario() {
    if (formularioSmtp) formularioSmtp.style.display = 'block'
  }

  function detectarProtocolo(texto) {
    const textoLower = (texto || '').toLowerCase()
    if (/@/.test(textoLower)) return 'SMTP/POP'
    if (/(^|\s)(dns|lookup|resolver|\.[a-z]{2,})(\s|$)/.test(textoLower) && !/(https?:\/\/|www\.)/.test(textoLower)) {
      return 'DNS'
    }
    if (/(https?:\/\/|www\.)/.test(textoLower)) return 'HTTP/HTTPS'
    return 'WEBSOCKET'
  }

  function criarDadosAplicacao(texto, protocolo) {
    const dados = {
      protocolo,
      origem: protocolo === 'HTTP/HTTPS' ? 'URL não exibida nesta camada.' : texto
    }

    if (protocolo === 'SMTP/POP') {
      dados.status = 'Preencha o formulário para enviar o email.'
    }

    return dados
  }

  function renderDadosAplicacao() {
    if (!dadosAplicacaoEl) return
    if (!estado.dadosAplicacao) {
      dadosAplicacaoEl.textContent = 'Nenhum dado processado ainda.'
      return
    }
    dadosAplicacaoEl.textContent = JSON.stringify(estado.dadosAplicacao, null, 2)
  }

  function renderDadosApresentacao() {
    if (!dadosApresentacaoEl) return
    if (!estado.apresentacao) {
      dadosApresentacaoEl.textContent = 'Aguardando envio de dados para apresentação...'
      return
    }

    if (estado.apresentacao.email) {
      const linhas = [
        '═══ EMAIL CRIPTOGRAFADO ═══',
        `Destinatário: ${estado.apresentacao.email.destinatario}`,
        `Assunto: ${estado.apresentacao.email.assunto}`,
        `Mensagem cifrada: ${estado.apresentacao.email.mensagemCifrada}`
      ]
      dadosApresentacaoEl.textContent = linhas.join('\n')
      return
    }

    if (estado.apresentacao.jwt) {
      const linhas = []
      linhas.push('═══ SESSÃO JWT HTTP/HTTPS ═══')
      linhas.push(`Token: ${estado.apresentacao.jwt}`)
      linhas.push('')
      linhas.push('Payload decodificado:')
      linhas.push(JSON.stringify(estado.apresentacao.payload, null, 2))
      if (estado.dadosAplicacao && estado.dadosAplicacao.ip) {
        linhas.push(`\nIP resolvido: ${estado.dadosAplicacao.ip}`)
      }
      dadosApresentacaoEl.textContent = linhas.join('\n')
      return
    }

    if (estado.apresentacao.dns) {
      const linhas = [
        '═══ RESOLUÇÃO DNS ═══',
        `Domínio: ${estado.apresentacao.dns.domain}`,
        `IP: ${estado.apresentacao.dns.ip || 'Falha ao resolver'}`
      ]
      dadosApresentacaoEl.textContent = linhas.join('\n')
      return
    }

    dadosApresentacaoEl.textContent = 'Nenhum formato conhecido para apresentação.'
  }

  function renderDadosSessao() {
    if (!dadosSessaoEl) return
    dadosSessaoEl.textContent = estado.sessao ? JSON.stringify(estado.sessao, null, 2) : 'Aguardando estabelecimento de sessão...'
  }

  function renderDadosTransporte() {
    if (!dadosTransporteEl) return
    dadosTransporteEl.textContent = estado.transporte ? JSON.stringify(estado.transporte, null, 2) : 'Aguardando segmento de transporte...'
  }

  function renderDadosRede() {
    if (!dadosRedeEl) return
    dadosRedeEl.textContent = estado.rede ? JSON.stringify(estado.rede, null, 2) : 'Aguardando pacote de rede...'
  }

  function renderDadosEnlace() {
    if (!dadosEnlaceEl) return
    dadosEnlaceEl.textContent = estado.enlace ? JSON.stringify(estado.enlace, null, 2) : 'Aguardando quadro de enlace...'
  }

  function renderDadosFisica() {
    if (!estado.fisica) {
      if (dadosFisicaVerificacaoEl) dadosFisicaVerificacaoEl.textContent = 'Aguardando verificação de integridade...'
      if (dadosFisicaObjetoEl) dadosFisicaObjetoEl.textContent = 'Aguardando dados da camada de enlace...'
      if (dadosFisicaBinarioEl) dadosFisicaBinarioEl.textContent = 'Aguardando conversão para binário...'
      return
    }

    // Exibir verificação de integridade
    if (dadosFisicaVerificacaoEl) {
      const v = estado.fisica.verificacaoIntegridade
      const linhas = [
        `CRC Original (recebido):    ${v.crcOriginal}`,
        `CRC Recalculado (local):    ${v.crcRecalculado}`,
        ``,
        `Resultado: ${v.status}`
      ]
      dadosFisicaVerificacaoEl.textContent = linhas.join('\n')
    }

    // Exibir objeto recebido da camada de enlace
    if (dadosFisicaObjetoEl) {
      dadosFisicaObjetoEl.textContent = JSON.stringify(estado.fisica.quadroRecebido, null, 2)
    }

    // Exibir informações de transmissão
    if (dadosFisicaInfoEl) {
      const t = estado.fisica.transmissao
      dadosFisicaInfoEl.innerHTML = `
        <span class="info-badge">📡 Meio: ${t.meio}</span>
        <span class="info-badge">⚡ Sinalização: ${t.sinalizacao}</span>
        <span class="info-badge">📊 Total: ${t.totalBits} bits (${t.totalBytes} bytes)</span>
        <span class="info-badge status-badge">${t.status}</span>
      `
    }

    // Exibir representação binária
    if (dadosFisicaBinarioEl) {
      dadosFisicaBinarioEl.textContent = estado.fisica.representacaoBinaria
    }

    // Status final de transmissão
    if (fisicaStatusFinalEl) {
      fisicaStatusFinalEl.innerHTML = `
        <div class="transmissao-concluida">
          <span class="transmissao-icone">📡</span>
          <div class="transmissao-texto">
            <strong>Transmissão Concluída!</strong>
            <p>Os dados foram convertidos em sinais binários e estão sendo enviados pelo meio físico (${estado.fisica.transmissao.meio}).</p>
            <p>Total transmitido: <strong>${estado.fisica.transmissao.totalBits} bits</strong></p>
          </div>
        </div>
      `
    }
  }

  function atualizarProgresso(percentual, texto) {
    if (progressoFillEl) progressoFillEl.style.width = `${percentual}%`
    if (progressoTextoEl) progressoTextoEl.textContent = texto
  }

  function ativarCamada(camada) {
    const secao = document.querySelector(`#camada-${camada}`)
    if (!secao) return

    if (!secao.classList.contains('ativa')) {
      secao.classList.add('ativa')
    }

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  function removerBotoesProsseguir() {
    document.querySelectorAll('.btn-prosseguir').forEach(btn => btn.remove())
  }

  function aguardarProsseguir(camadaId) {
    return new Promise(resolve => {
      const secao = document.querySelector(`#camada-${camadaId}`)
      if (!secao) { resolve(); return }

      removerBotoesProsseguir()

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn-prosseguir'
      btn.textContent = 'Prosseguir ▶'
      secao.appendChild(btn)

      btn.addEventListener('click', () => {
        btn.remove()
        resolve()
      }, { once: true })

      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  async function executarFluxoControlado() {
    try {
      if (!estado.apresentacao) {
        estado.apresentacao = {
          resumo: {
            protocolo: estado.protocolo || 'N/D',
            requisicao: estado.requisicao || ''
          }
        }
      }

      // — Camada de Aplicação —
      atualizarProgresso(0, 'Iniciando requisição...')
      ativarCamada('aplicacao')
      atualizarProgresso(16, 'Camada de Aplicação concluída — aguardando usuário')
      await aguardarProsseguir('aplicacao')

      // — Camada de Apresentação —
      renderDadosApresentacao()
      ativarCamada('apresentacao')
      atualizarProgresso(32, 'Camada de Apresentação concluída — aguardando usuário')
      await aguardarProsseguir('apresentacao')

      // — Camada de Sessão —
      estado.sessao = iniciarSessao(estado.apresentacao)
      renderDadosSessao()
      ativarCamada('sessao')
      atualizarProgresso(48, 'Sessão estabelecida — aguardando usuário')
      await aguardarProsseguir('sessao')

      // — Camada de Transporte —
      estado.transporte = camadaTransporte(estado.sessao, estado.protocolo)
      renderDadosTransporte()
      ativarCamada('transporte')
      atualizarProgresso(64, 'Segmento transportado — aguardando usuário')
      await aguardarProsseguir('transporte')

      // — Camada de Rede —
      estado.rede = camadaRede(estado.transporte, estado.dadosAplicacao)
      renderDadosRede()
      ativarCamada('rede')
      atualizarProgresso(80, 'Pacote IP montado — aguardando usuário')
      await aguardarProsseguir('rede')

      // — Camada de Enlace —
      estado.enlace = camadaEnlace(estado.rede)
      estado.encapsulamento = estado.enlace
      renderDadosEnlace()
      ativarCamada('enlace')
      atualizarProgresso(85, 'Quadro de enlace montado — aguardando usuário')
      await aguardarProsseguir('enlace')

      // — Camada Física —
      estado.fisica = camadaFisica(estado.enlace)
      renderDadosFisica()
      ativarCamada('fisica')
      atualizarProgresso(100, 'Transmissão física concluída ✓')

      const srcIP = estado.rede.rede.srcIP
      const dstIP = estado.rede.rede.dstIP
      document.dispatchEvent(new CustomEvent('rota-calculada', {
        detail: { srcIP, dstIP }
      }))
    } catch (err) {
      console.error('Erro ao encapsular camadas:', err)
      atualizarProgresso(0, 'Erro no fluxo')
    }
  }

  function renderTodasCamadas() {
    renderDadosAplicacao()
    renderDadosApresentacao()
    renderDadosSessao()
    renderDadosTransporte()
    renderDadosRede()
    renderDadosEnlace()
    renderDadosFisica()
  }

  if (botaoRequisicao) {
    botaoRequisicao.addEventListener('click', async event => {
      event.preventDefault()
      const texto = textoRequisicaoEl?.value.trim() || ''
      if (!texto) {
        alert('Digite um texto para identificar o protocolo ou iniciar a aplicação.')
        return
      }

      botaoRequisicao.disabled = true
      botaoRequisicao.textContent = '⏳ Processando...'

      try {
        const protocolo = detectarProtocolo(texto)
        estado.protocolo = protocolo
        estado.requisicao = texto
        estado.dadosAplicacao = criarDadosAplicacao(texto, protocolo)
        if (protocoloNomeEl) protocoloNomeEl.textContent = protocolo

        if (protocolo === 'SMTP/POP') {
          mostrarFormulario()
        } else {
          ocultarFormulario()
        }

        if (protocolo === 'HTTP/HTTPS') {
          const hostname = texto.replace(/https?:\/\//i, '').split('/')[0]
          const payload = {
            sessionId: crypto.randomUUID(),
            message: { dados: 'dados da camada de aplicacao', origem: hostname },
            timestamp: new Date().toISOString()
          }
          const header = { alg: 'none', typ: 'JWT' }
          const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload))

          estado.dadosAplicacao = Object.assign({}, estado.dadosAplicacao, { hostname, token })
          estado.apresentacao = { jwt: token, payload }
        }

        if (protocolo === 'DNS') {
          const dominio = texto.replace(/(dns|lookup|resolver|^\s*\/?\s*)/gi, '').trim()
          const ips = {
            'google.com': '142.250.76.46',
            'github.com': '140.82.113.4',
            'ifpe.edu.br': '187.45.192.56'
          }
          const ip = ips[dominio] || '192.168.1.1'
          estado.dadosAplicacao = Object.assign({}, estado.dadosAplicacao, { dominio, ip })
          estado.apresentacao = { dns: { domain: dominio, ip } }
        }

        renderDadosAplicacao()
        renderTodasCamadas()
        if (textoRequisicaoEl) textoRequisicaoEl.value = ''
        await executarFluxoControlado()
      } catch (err) {
        console.error('Erro ao processar requisição:', err)
        alert(`Erro: ${err.message}`)
      } finally {
        botaoRequisicao.disabled = false
        botaoRequisicao.textContent = 'Realizar Requisição'
      }
    })
  }

  if (botaoEnviarSmtp) {
    botaoEnviarSmtp.addEventListener('click', async () => {
      const destinatario = emailSmtpEl?.value.trim() || ''
      const assunto = assuntoSmtpEl?.value.trim() || ''
      const mensagem = mensagemSmtpEl?.value.trim() || ''

      if (!destinatario || !assunto || !mensagem) {
        alert('Preencha todos os campos do formulário SMTP/POP.')
        return
      }
      if (!destinatario.includes('@')) {
        alert('Digite um destinatário válido com @.')
        return
      }

      const mensagemCifrada = cifrarTexto(mensagem)
      estado.email = { destinatario, assunto, mensagem }
      estado.dadosAplicacao = {
        protocolo: 'SMTP/POP',
        destinatario,
        assunto,
        mensagem,
        status: 'Email enviado para apresentação.'
      }
      estado.apresentacao = {
        email: { destinatario, assunto, mensagemCifrada }
      }

      renderDadosAplicacao()
      renderTodasCamadas()
      ocultarFormulario()
      await executarFluxoControlado()

      if (emailSmtpEl) emailSmtpEl.value = ''
      if (assuntoSmtpEl) assuntoSmtpEl.value = ''
      if (mensagemSmtpEl) mensagemSmtpEl.value = ''
    })
  }

  renderTodasCamadas()
  ocultarFormulario()

  return estado
}