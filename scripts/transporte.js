export function camadaTransporte(sessaoObj, protocoloAplicacao) {
  const proto = (protocoloAplicacao || '').toUpperCase()
  let dstPort = 8080
  if (proto.includes('HTTP') && proto.includes('HTTPS')) dstPort = 443
  else if (proto.includes('HTTPS')) dstPort = 443
  else if (proto.includes('HTTP')) dstPort = 80
  else if (proto.includes('SMTP')) dstPort = 25
  else if (proto.includes('DNS')) dstPort = 53

  const segmento = {
    transporte: {
      protocolo: 'TCP',
      srcPort: Math.floor(10000 + Math.random() * 40000),
      dstPort,
      seq: Math.floor(Math.random() * 1000000),
      ack: 0,
      payload: sessaoObj
    }
  }

  return segmento
}
