import { calcularMD5 } from './enlace-dados.js'

/**
 * Converte uma string para sua representação binária (UTF-8)
 * Cada caractere é convertido para 8 bits
 */
function stringParaBinario(str) {
  let resultado = ''
  for (let i = 0; i < str.length; i++) {
    const binario = str.charCodeAt(i).toString(2).padStart(8, '0')
    resultado += binario + ' '
  }
  return resultado.trim()
}

/**
 * Formata a string binária em linhas de tamanho controlado
 * para melhor visualização na tela
 */
function formatarBinario(binStr, bytesPerLine = 8) {
  const bytes = binStr.split(' ')
  const linhas = []
  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    linhas.push(bytes.slice(i, i + bytesPerLine).join(' '))
  }
  return linhas.join('\n')
}

/**
 * Camada Física
 * 
 * 1. Recebe os dados da camada de enlace
 * 2. Recalcula o hash MD5 do payload e compara com o CRC
 *    para verificar se a mensagem não perdeu nenhum frame
 * 3. Converte tudo para binário
 * 4. Retorna o objeto com os dados e a representação binária
 */
export function camadaFisica(quadroEnlace) {
  // 1. Recalcular o hash do payload para verificação de integridade
  const jsonPayload = JSON.stringify(quadroEnlace.payload)
  const crcRecalculado = calcularMD5(jsonPayload)
  const crcOriginal = quadroEnlace.crc

  const integridadeOk = crcRecalculado === crcOriginal

  // 2. Preparar objeto de verificação
  const verificacao = {
    crcOriginal,
    crcRecalculado,
    integridadeOk,
    status: integridadeOk
      ? '✅ INTEGRIDADE VERIFICADA — Nenhum frame foi perdido!'
      : '❌ ERRO DE INTEGRIDADE — Dados corrompidos durante a transmissão!'
  }

  // 3. Converter o quadro inteiro para JSON string
  const jsonCompleto = JSON.stringify(quadroEnlace, null, 2)

  // 4. Converter para binário
  const jsonCompacto = JSON.stringify(quadroEnlace)
  const binario = stringParaBinario(jsonCompacto)
  const binarioFormatado = formatarBinario(binario, 6)

  // 5. Montar resultado da camada física
  const resultado = {
    quadroRecebido: quadroEnlace,
    verificacaoIntegridade: verificacao,
    transmissao: {
      status: 'TRANSMITINDO',
      meio: 'Cabo Ethernet / Fibra Óptica',
      sinalizacao: 'Digital (NRZ)',
      totalBits: jsonCompacto.length * 8,
      totalBytes: jsonCompacto.length
    },
    representacaoBinaria: binarioFormatado
  }

  return resultado
}
