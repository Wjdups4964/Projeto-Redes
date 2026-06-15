export function iniciarSessao(apresentacaoObj) {
  const sessionId = (apresentacaoObj && apresentacaoObj.jwt && apresentacaoObj.payload && apresentacaoObj.payload.sessionId) || (typeof crypto !== 'undefined' ? crypto.randomUUID() : ('sess-' + Math.floor(Math.random() * 1000000)))
  return {
    sessao: {
      sessionId,
      status: 'ESTABELECIDA',
      apresentacao: apresentacaoObj
    }
  }
}
