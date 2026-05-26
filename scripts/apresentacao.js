const alfabetoMinusculo = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const alfabetoMaiusculo = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

export function cifrarTexto(texto) {
  let textoCifrado = ''
  for (let i = 0; i < texto.length; i++) {
    const char = texto[i]
    if (alfabetoMinusculo.includes(char)) {
      const index = alfabetoMinusculo.indexOf(char)
      const novoIndex = (index + 3) % alfabetoMinusculo.length
      textoCifrado += alfabetoMinusculo[novoIndex]
    } else if (alfabetoMaiusculo.includes(char)) {
      const index = alfabetoMaiusculo.indexOf(char)
      const novoIndex = (index + 3) % alfabetoMaiusculo.length
      textoCifrado += alfabetoMaiusculo[novoIndex]
    } else {
      textoCifrado += char
    }
  }
  return textoCifrado
}