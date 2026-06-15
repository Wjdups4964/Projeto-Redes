export function camadaRede(segmentoObj, dadosAplicacao) {
  const srcIP = (dadosAplicacao && dadosAplicacao.ip) || '10.0.0.2'
  // tenta usar ip resolvido ou hostname mapeado
  let dstIP = (dadosAplicacao && dadosAplicacao.ip) || null
  if (!dstIP && dadosAplicacao && dadosAplicacao.hostname) {
    dstIP = '93.184.216.34' // exemplo (ex: example.com)
  }
  if (!dstIP) dstIP = '192.168.0.1'

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
