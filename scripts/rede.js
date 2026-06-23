export function camadaRede(segmentoObj, dadosAplicacao) {
  // IP de origem fixo da rede local (máquina do usuário)
  const srcIP = '10.0.0.2'

  // IP de destino baseado no que a aplicação resolveu
  let dstIP = null

  if (dadosAplicacao) {
    if (dadosAplicacao.dominio && dadosAplicacao.ip) {
      dstIP = dadosAplicacao.ip
    } else if (dadosAplicacao.hostname) {
      const hostnameIPs = {
        'google.com': '142.250.76.46',
        'www.google.com': '142.250.76.46',
        'github.com': '140.82.113.4',
        'www.github.com': '140.82.113.4',
        'ifpe.edu.br': '187.45.192.56',
        'www.ifpe.edu.br': '187.45.192.56'
      }
      dstIP = hostnameIPs[dadosAplicacao.hostname] || '93.184.216.34'
    } else if (dadosAplicacao.protocolo === 'SMTP/POP' && dadosAplicacao.destinatario) {
      const domEmail = dadosAplicacao.destinatario.split('@')[1]
      const emailIPs = {
        'gmail.com': '142.250.31.108',
        'outlook.com': '52.97.137.178',
        'hotmail.com': '52.97.137.178',
        'yahoo.com': '98.137.11.164'
      }
      dstIP = emailIPs[domEmail] || '10.0.0.50'
    }
  }

  // Fallback caso não encontre resolução
  if (!dstIP) dstIP = '10.0.0.100'

  const pacote = {
    rede: {
      versao: 4,
      protocolo: segmentoObj.transporte.protocolo,
      srcIP,
      dstIP,
      ttl: 64,
      payload: segmentoObj
    }
  }

  return pacote
}