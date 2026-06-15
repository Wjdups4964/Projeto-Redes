function gerarMacAleatorio() {
  return Array.from({ length: 6 })
    .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
    .join(':')
}

export function camadaEnlace(pacoteObj) {
  const quadro = {
    enlace: {
      srcMAC: gerarMacAleatorio(),
      dstMAC: gerarMacAleatorio(),
      type: '0x0800',
      payload: pacoteObj
    }
  }

  return quadro
}
