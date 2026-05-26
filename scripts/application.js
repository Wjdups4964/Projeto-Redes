import {cifrarTexto} from './apresentacao.js'

export function application() {
  const state = {
    user: 'Victor',
    protocol: '',
    lastEmail: null,
    lastFile: null
  }

  const userEl = document.querySelector('.user')
  if (userEl) userEl.textContent = `Usuário: ${state.user}`

  const protocolNameEl = document.querySelector('.protocol-name')
  const reqBtn = document.querySelector('.request-btn')
  const smtpForm = document.querySelector('.smtp-form')
  const smtpSendBtn = document.querySelector('.smtp-send-btn')
  const reqTextEl = document.querySelector('.text-input')
  const inputFile = document.querySelector('#arquivo')

  function detectProtocol(text) {
    const lowerText = (text || '').toLowerCase()
    const emailPattern = /@/
    const urlPattern = /(https?:\/\/|www\.)/
    const dnsPattern = /(^|\s)(dns|lookup|resolver|\.[a-z]{2,})(\s|$)/

    if (emailPattern.test(lowerText)) return 'SMTP/POP'
    if (dnsPattern.test(lowerText) && !urlPattern.test(lowerText)) return 'DNS'
    if (urlPattern.test(lowerText)) return 'HTTP/HTTPS'
    return 'WEBSOCKET'
  }

  if (reqBtn) {
    reqBtn.addEventListener('click', function(event) {
      event.preventDefault()
      const requestText = reqTextEl ? reqTextEl.value : ''
      const protocol = detectProtocol(requestText)
      state.protocol = protocol
      if (protocolNameEl) protocolNameEl.textContent = protocol

      if (protocol === 'SMTP/POP') {
        if (smtpForm) smtpForm.style.display = 'block'
      } else {
        if (smtpForm) smtpForm.style.display = 'none'
      }

      if (reqTextEl) reqTextEl.value = ''
    })
  }

  if (smtpSendBtn) {
    smtpSendBtn.addEventListener('click', function() {
      const smtpEmail = document.querySelector('#smtp-email')
      const smtpSubject = document.querySelector('#smtp-subject')
      const smtpMessageEl = document.querySelector('#smtp-message')

      const to = smtpEmail ? smtpEmail.value : ''
      const subject = smtpSubject ? smtpSubject.value : ''
      const message = smtpMessageEl ? smtpMessageEl.value : ''

      if (!to || !subject || !message) {
        alert('Preencha todos os campos do formulário SMTP/POP.')
        return
      }

      const encrypted = cifrarTexto(message)
      state.lastEmail = {
        to,
        subject,
        message: encrypted,
        timestamp: new Date().toISOString()
      }

      alert(`Email enviado para ${to}\nAssunto: ${subject}\nMensagem: ${encrypted}`)

      if (smtpEmail) smtpEmail.value = ''
      if (smtpSubject) smtpSubject.value = ''
      if (smtpMessageEl) smtpMessageEl.value = ''
      if (smtpForm) smtpForm.style.display = 'none'
    })
  }

  if (inputFile) {
    inputFile.addEventListener('change', () => {
      if (inputFile.files.length > 0) {
        const file = inputFile.files[0]
        state.lastFile = { name: file.name, size: file.size, type: file.type }
        alert(file.name)
      }
    })

    inputFile.addEventListener('cancel', () => {
      alert('Cancelado')
    })
  }

  return state
}
