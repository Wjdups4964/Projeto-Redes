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
      dadosApresentacaoEl.textContent = 'Aguardando envio de email...'
      return
    }

    const linhas = [
      'Email criptografado:',
      `Destinatário: ${estado.apresentacao.email.destinatario}`,
      `Assunto: ${estado.apresentacao.email.assunto}`,
      `Mensagem cifrada: ${estado.apresentacao.email.mensagemCifrada}`
    ]

    dadosApresentacaoEl.textContent = linhas.join('\n')
  }

  if (botaoRequisicao) {
    botaoRequisicao.addEventListener('click', event => {
      event.preventDefault()
      const texto = textoRequisicaoEl?.value.trim() || ''
      if (!texto) {
        alert('Digite um texto para identificar o protocolo ou iniciar a aplicação.')
        return
      }

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

      renderDadosAplicacao()
      renderDadosApresentacao()
      if (textoRequisicaoEl) textoRequisicaoEl.value = ''
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
