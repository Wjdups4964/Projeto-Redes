export function camadaTransporte(sessaoObj, protocoloAplicacao) {
  const proto = (protocoloAplicacao || '').toUpperCase()
  
  const PROTOCOLO_PORTA_MAP = {
    'HTTP': { port: 80, trans: 'TCP' },
    'HTTPS': { port: 443, trans: 'TCP' },
    'HTTP/HTTPS': { port: 443, trans: 'TCP' },
    'SMTP': { port: 25, trans: 'TCP' },
    'POP': { port: 110, trans: 'TCP' },
    'SMTP/POP': { port: 587, trans: 'TCP' },
    'DNS': { port: 53, trans: 'UDP' },
    'WEBSOCKET': { port: 443, trans: 'TCP' },
    'FTP': { port: 21, trans: 'TCP' }
  }

  const config = PROTOCOLO_PORTA_MAP[proto] || { port: 8080, trans: 'TCP' }

  const segmento = {
    transporte: {
      protocolo: config.trans,
      srcPort: Math.floor(10000 + Math.random() * 40000),
      dstPort: config.port,
      seq: config.trans === 'TCP' ? Math.floor(Math.random() * 1000000) : null,
      ack: config.trans === 'TCP' ? 0 : null,
      payload: sessaoObj
    }
  }

  return segmento
}