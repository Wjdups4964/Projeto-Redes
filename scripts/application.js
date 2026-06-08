import { cifrarTexto } from './apresentacao.js'

export function iniciarCamadaAplicacao() {
  const estado = {
    protocolo: '',
    requisicao: '',
    email: null,
    dadosAplicacao: null,
    apresentacao: null
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

    // Se for email (SMTP/POP)
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

    // Se for HTTP/HTTPS via JWT
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

    // Se for DNS
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

  if (botaoRequisicao) {
    botaoRequisicao.addEventListener('click', event => {
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

        // Se for HTTP/HTTPS, gerar JWT simples
        if (protocolo === 'HTTP/HTTPS') {
          const hostname = texto.replace(/https?:\/\//i, '').split('/')[0]
          
          const payload = {
            sessionId: crypto.randomUUID(),
            message: { dados: 'dados da camada de aplicacao', origem: hostname },
            timestamp: new Date().toISOString()
          }
          
          // JWT simples (header.payload sem assinatura criptográfica)
          const header = { alg: 'none', typ: 'JWT' }
          const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload))

          estado.dadosAplicacao = Object.assign({}, estado.dadosAplicacao, { hostname, token })
          estado.apresentacao = { jwt: token, payload }
        }

        // Se for DNS, simular resolução
        if (protocolo === 'DNS') {
          const dominio = texto.replace(/(dns|lookup|resolver|^\s*\/?\s*)/gi, '').trim()
          
          // Simular IP para domínios conhecidos
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
        renderDadosApresentacao()
        if (textoRequisicaoEl) textoRequisicaoEl.value = ''
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
    botaoEnviarSmtp.addEventListener('click', () => {
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
      renderDadosApresentacao()
      ocultarFormulario()

      if (emailSmtpEl) emailSmtpEl.value = ''
      if (assuntoSmtpEl) assuntoSmtpEl.value = ''
      if (mensagemSmtpEl) mensagemSmtpEl.value = ''
    })
  }

  renderDadosAplicacao()
  renderDadosApresentacao()
  ocultarFormulario()

  return estado
}